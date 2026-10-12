import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_CUSTOMIZATION_KEY, CLIENT_VARIANT_START, EMPLOYEE_PROFILE_COUNT, OWNER_PROFILE_INDEX, characterProfile, defaultCharacterProfiles, getCharacterRevision, readCharacterProfiles, resetCharacterAppearance, subscribeCharacterRevision, updateCharacterAppearance, validateCharacterAppearance } from '../src/characterProfiles.ts';
import { armContactPoint, legSoleHeight, seatedLegContact, solveArmContact } from '../src/characterContacts.ts';

test('the stable cast has Yati and Deno before guest profiles, plus a separate owner avatar', () => {
  assert.equal(EMPLOYEE_PROFILE_COUNT,10);assert.equal(CLIENT_VARIANT_START,10);assert.equal(OWNER_PROFILE_INDEX,13);
  assert.equal(characterProfile(8).name,'Yati');assert.equal(characterProfile(8).garment,'apron');
  assert.equal(characterProfile(9).name,'Deno');assert.equal(characterProfile(9).hairStyle,'curls');
  assert.equal(characterProfile(10).role,'Visiting client');assert.equal(characterProfile(13).role,'Owner avatar');
  assert.equal(defaultCharacterProfiles.length,14);
  assert.equal(characterProfile(NaN),characterProfile(0));assert.equal(characterProfile(Infinity),characterProfile(0));
});

test('appearance edits accept bounded fields and cannot change jobs, workplaces, or proportions', () => {
  const edit=validateCharacterAppearance({name:'  New\u0000 name  ',hairStyle:'curls',garment:'apron',skin:'#aabbcc',eyeShape:'almond',faceShape:'narrow',glasses:true,role:'CEO',roomId:11,height:99,color:'url(javascript:foo)',hair:'bad',trousers:'#123'});
  assert.deepEqual(edit,{name:'New name',skin:'#AABBCC',hairStyle:'curls',garment:'apron',eyeShape:'almond',faceShape:'narrow',glasses:true});
  assert.deepEqual(validateCharacterAppearance({name:'   ',hairStyle:'unknown',garment:'unknown',glasses:'false'}),{});
  assert.equal(validateCharacterAppearance({name:'a'.repeat(200)}).name?.length,24);
  assert.deepEqual(validateCharacterAppearance({eyeShape:{toString:()=> 'round'},faceShape:{toString:()=> 'soft'}}),{});
});

test('appearance save reload validates content and protects the roster from corrupt local data', () => {
  const storage={getItem:(key:string)=>key===CHARACTER_CUSTOMIZATION_KEY?JSON.stringify({version:1,profiles:[{name:'Atlas Baru',role:'Owner avatar',hairStyle:'bob',color:'#AACCDD'}]}):null,setItem:()=>{}};
  const profiles=readCharacterProfiles(storage);
  assert.equal(profiles[0].name,'Atlas Baru');assert.equal(profiles[0].hairStyle,'bob');assert.equal(profiles[0].color,'#AACCDD');assert.equal(profiles[0].role,'Office manager');
  assert.equal(profiles[8].name,'Yati');assert.equal(defaultCharacterProfiles[0].name,'ATLAS');
  assert.equal(readCharacterProfiles({getItem:()=>'{broken',setItem:()=>{}})[0].name,'ATLAS');
  assert.equal(readCharacterProfiles({getItem:()=>JSON.stringify({version:99,profiles:[{name:'wrong'}]}),setItem:()=>{}})[0].name,'ATLAS');
  assert.equal(readCharacterProfiles({getItem:()=>{throw Error('blocked');},setItem:()=>{}})[0].name,'ATLAS');
});

test('per-character reset and revision subscription update existing references without changing the job', () => {
  const before=characterProfile(8), revision=getCharacterRevision();let notified=0;
  const unsubscribe=subscribeCharacterRevision(()=>{notified++;});
  assert.equal(updateCharacterAppearance(8,{name:'Ibu Yati',garment:'polo',hairStyle:'ponytail',role:'Manager'}),false,'An unavailable browser store reports a session-only edit.');
  assert.equal(characterProfile(8),before);assert.equal(before.name,'Ibu Yati');assert.equal(before.role,'Catering & hospitality');assert.equal(before.garment,'polo');
  resetCharacterAppearance(8);assert.deepEqual(before,defaultCharacterProfiles[8]);assert.equal(notified,2);assert.equal(getCharacterRevision(),revision+2);
  unsubscribe();assert.equal(updateCharacterAppearance(100,{name:'Nobody'}),false);
});

test('the shared seated contact places both soles on the floor across compatible chair heights', () => {
  for(const hip of [.6,.64,.68]){const pose=seatedLegContact(hip);assert.ok(Math.abs(legSoleHeight(hip,pose.thigh,pose.knee))<1e-10);assert.equal(pose.thigh+pose.knee,0);}
});

test('typing and tray grip contacts reach their targets with bounded elbows', () => {
  for(const [shoulder,height,forward] of [[.99,.855,.44],[1.15,.98,.44],[1.15,.98,.455],[.99,.76,.35],[1.15,1.06,.4],[1.15,.85,.12]]){
    const pose=solveArmContact(shoulder,height,forward), point=armContactPoint(shoulder,pose.shoulder,pose.elbow);
    assert.ok(Math.abs(point.height-height)<1e-8);assert.ok(Math.abs(point.forward-forward)<1e-8);
    assert.ok(pose.elbow<=0&&pose.elbow>=-Math.PI);assert.ok(Number.isFinite(pose.shoulder));
  }
  const unreachable=solveArmContact(.99,3,10);assert.ok(Number.isFinite(unreachable.shoulder)&&Number.isFinite(unreachable.elbow));
});
