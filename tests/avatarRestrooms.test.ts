import {test} from 'node:test';
import assert from 'node:assert/strict';
import {founderAppearance,readAvatarLibrary,saveAvatarLibrary,AVATAR_LIBRARY_KEY,AVATAR_LIMIT} from '../src/avatarLibrary.ts';
import {characterProfile,defaultCharacterProfiles,OWNER_PROFILE_INDEX,resetCharacterAppearance,updateCharacterAppearance,validateCharacterAppearance} from '../src/characterProfiles.ts';
import {restroomForStaff} from '../src/officeLayout.ts';
import {createSimulation,stepSimulation} from '../src/simulation.ts';
import {rooms} from '../src/worldData.ts';
const memory=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
test('Founder avatars retain gender and appearance after reload while rejecting injected jobs and malformed records',()=>{
 const storage=memory(),female=founderAppearance('  Aruna  ','female'),male=founderAppearance('Bima','male');
 assert.equal(female.name,'Aruna');assert.equal(female.gender,'female');assert.equal(male.gender,'male');
 assert.equal(saveAvatarLibrary([{id:'one',appearance:female},{id:'two',appearance:male}],storage),true);
 assert.deepEqual(readAvatarLibrary(storage).map(a=>a.appearance.gender),['female','male']);
 storage.setItem(AVATAR_LIBRARY_KEY,JSON.stringify({version:1,avatars:[{id:'one',appearance:{...female,role:'CEO',roomId:99}},{id:'one',appearance:male},{id:'bad',appearance:{gender:'unknown'}}]}));
 const restored=readAvatarLibrary(storage);assert.equal(restored.length,1);assert.equal('role' in restored[0].appearance,false);
 assert.equal(saveAvatarLibrary([], {getItem:()=>null,setItem:()=>{throw Error('blocked');}}),false);
 assert.equal(readAvatarLibrary({getItem:()=>'{invalid',setItem:()=>{}}).length,0);
 assert.deepEqual(validateCharacterAppearance({gender:'invalid'}),{});
 assert.equal(AVATAR_LIMIT,8);
});
test('playing a saved female or male avatar changes the restroom route and leaves the Founder role intact',()=>{
 try{
  updateCharacterAppearance(OWNER_PROFILE_INDEX,founderAppearance('Aruna','female'));
  assert.equal(characterProfile(OWNER_PROFILE_INDEX).role,'Owner avatar');assert.equal(restroomForStaff(OWNER_PROFILE_INDEX),9);assert.equal(rooms[9].name,'WC Wanita');
  updateCharacterAppearance(OWNER_PROFILE_INDEX,founderAppearance('Bima','male'));
  assert.equal(restroomForStaff(OWNER_PROFILE_INDEX),10);assert.equal(rooms[10].name,'WC Pria');
 }finally{resetCharacterAppearance(OWNER_PROFILE_INDEX);}
 assert.equal(characterProfile(OWNER_PROFILE_INDEX).gender,defaultCharacterProfiles[OWNER_PROFILE_INDEX].gender);
});
test('random office restroom visits respect each employee gender and reserve one user per room',()=>{
 let s=createSimulation(1,480),visits=0;s.meeting.phase='done';s.nextManagementAt=1e8;s.nextIssueAt=1e8;s.nextClientAt=1e8;
 s.npcs.forEach((n,i)=>{n.nextLeisureAt=481+i;n.nextSocialAt=1e8;});
 for(let step=0;step<1000;step++){
  s=stepSimulation(s,.5,1);const occupied=new Set<number>();
  s.npcs.forEach((n,i)=>{if(n.duty?.kind!=='toilet')return;visits++;assert.equal(n.duty.target,restroomForStaff(i));assert.equal(occupied.has(n.duty.target),false);occupied.add(n.duty.target);});
 }
 assert.ok(visits>0);
});
