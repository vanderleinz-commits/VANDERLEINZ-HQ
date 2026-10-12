import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, parseSave, stepSimulation, recordOwnerAttendance, setOwnerEngagement, setOwnerRoom, seatedAt } from '../src/simulation.ts';
import type { ClientState } from '../src/simulation.ts';
import { clientMeetingSeat, ENTRY_POINT, ATTENDANCE_POINT, toiletPoint, workSeat, roomLocal, hrdSeat } from '../src/officeLayout.ts';
import { isWalkable, pointDistance } from '../src/navigation.ts';
import { avatarDirection, followWeight } from '../src/avatarCamera.ts';
import { willUseDoor } from '../src/doors.ts';
import { calmOffice, advance } from './helpers.ts';

const visitor = (id: number, slot: 1|3 = 1): ClientState => ({id,name:'Client '+id,variant:8,target:'owner',ownerJoined:false,seatSlot:slot,position:clientMeetingSeat(slot).position,path:[],phase:'meeting',stayUntil:999});

test('two arriving clients reach distinct seats without overlapping the owner or ATLAS', () => {
  let sim=calmOffice();sim.nextClientAt=600;
  sim=stepSimulation(sim,.5,1);sim.clients[0].target='owner';sim.nextClientAt=601;
  sim=stepSimulation(sim,.5,1);sim.clients[1].target='owner';sim.nextClientAt=1e8;
  sim=advance(sim,85);
  assert.equal(sim.clients.length,2);assert.deepEqual(sim.clients.map(c=>c.seatSlot),[1,3]);
  for(const client of sim.clients){assert.equal(client.phase,'meeting');assert.ok(isWalkable(client.position));assert.deepEqual(client.position,clientMeetingSeat(client.seatSlot).position);}
  assert.ok(pointDistance(sim.clients[0].position,sim.clients[1].position)>1.2);
  assert.ok(sim.clients.every(c=>[0,2].every(slot=>pointDistance(c.position,clientMeetingSeat(slot).position)>.7)));
});

test('an owner client waits through the day and costs HQ points only once at closing', () => {
  let sim=calmOffice(900);sim.clients=[visitor(4)];
  sim=advance(sim,119);assert.equal(sim.clients[0].phase,'meeting');assert.equal(sim.hqPoints,100);
  sim=advance(sim,1);assert.equal(sim.clients[0].phase,'leaving');assert.equal(sim.hqPoints,92);
  sim=advance(sim,75);assert.equal(sim.clients[0].phase,'offsite');assert.equal(sim.hqPoints,92);
});

test('Amanda cannot provide reception service remotely while she is in the WC', () => {
  let sim=calmOffice();sim.clients=[{...visitor(0),phase:'waiting',position:ATTENDANCE_POINT}];
  sim.reception={...sim.reception,client:true,person:0,phase:'service',elapsed:1};
  sim.npcs[6].position=toiletPoint(9);sim.npcs[6].duty={kind:'toilet',target:9,phase:'active',elapsed:0,duration:6,deadline:690};
  sim=advance(sim,2);assert.equal(sim.reception.elapsed,1);assert.equal(sim.reception.log.length,0);
  assert.equal(recordOwnerAttendance(sim,'in'),sim);
  sim=advance(sim,75);assert.equal(sim.reception.log.filter(e=>e.kind==='client').length,1);assert.equal(sim.clients[0].phase,'meeting');
});

test('HR consultations complete at opposite chairs and Felin returns to her reachable desk', () => {
  let sim=calmOffice();sim.npcs[1].duty={kind:'hr',target:0,phase:'travel',elapsed:0,duration:8,deadline:750};
  sim=advance(sim,80);assert.equal(sim.completedDuties.hr,1);assert.equal(sim.npcs[1].duty,null);
  assert.deepEqual(sim.npcs[7].position,workSeat(7).position);assert.ok(isWalkable(sim.npcs[7].position));
});

test('Felin stays at the host chair while the owner avatar is consulting her', () => {
  let sim=setOwnerRoom(setOwnerEngagement(calmOffice(),true,'consult'),4);
  sim.npcs[7].nextLeisureAt=0;
  sim=advance(sim,10);
  assert.equal(sim.npcs[7].duty,null);
  assert.deepEqual(sim.npcs[7].position,hrdSeat(1).position);
  assert.equal(seatedAt(sim,7)?.rotation,hrdSeat(1).rotation);
});

test('save reload retains active clients after departed history and client duties with IDs above ten', () => {
  const save=defaultSave();save.simulation=calmOffice();
  save.simulation.clients=[{...visitor(0),position:ENTRY_POINT,phase:'offsite'}, {...visitor(11,3),target:'both'}];
  save.simulation.npcs[0].duty={kind:'client',target:11,phase:'travel',elapsed:0,duration:8,deadline:700};
  const restored=parseSave(JSON.stringify(save)).simulation;
  assert.equal(restored.clients[1].id,11);assert.equal(restored.clients[1].seatSlot,3);assert.equal(restored.npcs[0].duty?.target,11);
  assert.ok(restored.nextClientId>=12);
});

test('owner attendance preserves the prior frame and records one entry at the reception', () => {
  const original=setOwnerRoom(setOwnerEngagement(calmOffice(),true,null),0), snapshot=structuredClone(original);
  const recorded=recordOwnerAttendance(original,'in');
  assert.deepEqual(original,snapshot);assert.equal(recorded.ownerCheckedIn,true);
  assert.equal(recorded.reception.log.filter(e=>e.name==='Founder'&&e.kind==='in').length,1);
});

test('automatic doors open for entry and exit intentions while passing along the hall keeps them closed', () => {
  const outside=roomLocal(3,0,3.2), inside=roomLocal(3,0,1.9);
  assert.equal(willUseDoor(3,outside,workSeat(0).position,[.1,0]),false);
  assert.equal(willUseDoor(3,outside,undefined,[.1,0]),false);
  assert.equal(willUseDoor(3,outside,roomLocal(3,-1,0)),true);
  assert.equal(willUseDoor(3,outside,undefined,[0,-.1]),true);
  assert.equal(willUseDoor(3,inside,ENTRY_POINT),true);
});

test('avatar input has a stable direction and camera easing is consistent across frame rates', () => {
  const forward=avatarDirection(0,-1), diagonal=avatarDirection(1,-1);
  assert.ok(forward[0]<0&&forward[1]<0);assert.ok(Math.abs(Math.hypot(...diagonal)-1)<1e-10);
  assert.deepEqual(avatarDirection(0,0),[0,0]);
  const follow=(hz:number)=>{let x=0;for(let i=0;i<hz;i++)x+=(10-x)*followWeight(1/hz);return x;};
  assert.ok(Math.abs(follow(30)-follow(60))<1e-10);
  assert.equal(followWeight(5),followWeight(.1));assert.ok(followWeight(.016)<.1);
});
