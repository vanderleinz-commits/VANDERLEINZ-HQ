import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, stepSimulation, joinClientMeeting, seatedAt, weekdayName } from '../src/simulation.ts';
import { prepareProjectSession, deliveryReady, canReviewProject, decideProject, readProjectDecision } from '../src/projectSession.ts';
import { PROJECT, projectAssignment, projectSeat } from '../src/projectStory.ts';
import { pointDistance } from '../src/navigation.ts';
import { advance } from './helpers.ts';

function memory() { const data=new Map<string,string>(); return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}}; }
test('new and reopened projects reset to Monday 06:00, retaining the original credit baseline',()=>{
 const storage=memory(),normal=defaultSave();normal.simulation.gameDay=20;normal.simulation.credits=3000;
 const first=prepareProjectSession(normal,storage);
 assert.equal(first.simulation.gameDay,1);assert.equal(first.simulation.gameMinute,360);assert.equal(weekdayName(1),'Senin');assert.equal(first.speed,0);
 assert.equal(first.simulation.credits,3000);assert.equal(first.simulation.project?.id,PROJECT.id);
 first.simulation.gameDay=2;first.simulation.credits=9000;
 const replay=prepareProjectSession(first,storage);
 assert.equal(replay.simulation.gameDay,1);assert.equal(replay.simulation.gameMinute,360);assert.equal(replay.simulation.credits,3000);
 assert.strictEqual(stepSimulation(replay.simulation,100,0),replay.simulation);
 assert.throws(()=>decideProject(replay,'accepted','',storage),/Bergabung/);
});

test('three complete office days route the team, greet Client A and wait for the Founder before delivery',()=>{
 const storage=memory(),save=prepareProjectSession(defaultSave(),storage);let s=save.simulation;
 s=advance(s,269); // Monday 10:29, seated kickoff.
 for(let i=0;i<6;i++){assert.equal(s.npcs[i].path.length,0);assert.ok(seatedAt(s,i));assert.equal(s.npcs[i].activity,'meeting');}
 s=advance(s,81); // Monday 11:50 library.
 for(const i of [1,2]){const a=projectAssignment(s.project,s.gameDay,s.gameMinute,i)!;assert.equal(a.place,'library');assert.ok(pointDistance(s.npcs[i].position,projectSeat(a)!.position)<.12);}
 s=advance(s,1440); // Tuesday 11:50, HR consultation.
 for(const i of [1,7]){const a=projectAssignment(s.project,s.gameDay,s.gameMinute,i)!;assert.equal(a.place,'hr');assert.ok(seatedAt(s,i));}
 s=advance(s,1690); // Wednesday deadline.
 assert.equal(s.gameDay,3);assert.equal(s.gameMinute,960);
 assert.equal(s.clients.length,1);assert.equal(s.clients[0].name,'Client A');
 assert.ok(s.reception.log.some(e=>e.name==='Client A'&&e.kind==='client'));assert.ok(deliveryReady(s),JSON.stringify({client:s.clients[0],atlas:s.npcs[0]}));
 assert.equal(canReviewProject(s),false);
 const heldCredits=s.credits;s=advance(s,40);assert.equal(s.gameMinute,960);assert.equal(s.clients.length,1);assert.equal(s.credits,heldCredits);
 s={...s,ownerActive:true,ownerRoom:11};s=joinClientMeeting(s,s.clients[0].id);
 assert.ok(canReviewProject(s));
 assert.throws(()=>decideProject({...save,simulation:s},'revision','',storage),/catatan/);
 assert.throws(()=>decideProject({...save,simulation:s},'accepted','',{getItem:()=>null,setItem:()=>{throw new Error('disk full');}}),/disk full/);
 assert.ok(s.project);
 const accepted=decideProject({...save,simulation:s},'accepted','',storage);
 assert.equal(accepted.save.simulation.project,undefined);
 assert.equal(readProjectDecision(storage)?.choice,'accepted');
 assert.equal(decideProject(save,'revision','ignored',storage).choice,'accepted');
 assert.equal(prepareProjectSession(save,storage).simulation.gameDay,3);
 const tomorrow={...accepted.save,simulation:advance(accepted.save.simulation,600),savedAt:'2099-01-01T00:00:00.000Z'};
 assert.equal(tomorrow.simulation.gameDay,4);
 assert.equal(prepareProjectSession(tomorrow,storage).simulation.gameDay,4);
 const revisionStorage=memory(),revision=decideProject({...save,simulation:s},'revision','  Perpanjang tulisan Dani  ',revisionStorage);
 assert.equal(revision.note,'Perpanjang tulisan Dani');assert.equal(prepareProjectSession(save,revisionStorage).simulation.project,undefined);
});
