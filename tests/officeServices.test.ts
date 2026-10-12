import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteMinute, activityGoal, assignActivity, attendanceQueue, breakSeat, clientSupportSeat, createSimulation, defaultSave, dutyGoal, npcPose, parseSave, seatedAt, setOwnerEngagement, setOwnerRoom, stepSimulation } from '../src/simulation.ts';
import { clientMeetingSeat, pantryDrinkPoint, servicePoint, workSeat } from '../src/officeLayout.ts';
import { isWalkable, pointDistance } from '../src/navigation.ts';
import { STAFF_WORKERS } from '../src/worldData.ts';
import { crowdClear, moveInCrowd } from '../src/crowd.ts';
import { drinkPlacement } from '../src/officeServices.ts';
import { advance, calmOffice, quietSimulation } from './helpers.ts';

test('Yati brews coffee, carries a tray to the client first and creates a cup only after physical delivery', () => {
  let s=calmOffice(600);s.services.nextCoffeeAt=600.5;
  s.clients=[{id:4,name:'Client',variant:10,target:'owner',ownerJoined:false,seatSlot:1,position:clientMeetingSeat(1).position,path:[],phase:'meeting',stayUntil:1599}];
  const poses=new Set<string>();let delivered=false;
  for(let tick=0;tick<220;tick++){
    const previous=structuredClone(s);s=stepSimulation(s,.5,1);poses.add(npcPose(s,8));
    assert.deepEqual(previous.services.drinks.length,delivered?previous.services.drinks.length:0);
    const drink=s.services.drinks[0];
    if(drink){
      assert.deepEqual(drink.recipient,{kind:'client',id:4});
      assert.ok(pointDistance(s.npcs[8].position,clientMeetingSeat(1).position)<1.1);
      assert.ok(drink.deliveredAt>600+2);assert.ok(drink.position[2]!>4.5);
      delivered=true;break;
    }
    if(s.services.coffee?.phase==='prepare'&&npcPose(s,8)==='brew')assert.ok(pointDistance(s.npcs[8].position,pantryDrinkPoint)<.1);
  }
  assert.ok(delivered);assert.ok(poses.has('brew'));assert.ok(poses.has('carry'));assert.ok(poses.has('deliver'));
});

test('a coffee round can serve every employee including both OB workers and the active owner without a second model system', () => {
  let s=setOwnerRoom(setOwnerEngagement(calmOffice(480),true,'work'),3);s.services.nextCoffeeAt=480.5;
  const served=new Set<string>();
  for(let tick=0;tick<1078;tick++){
    s=stepSimulation(s,.5,1);for(const drink of s.services.drinks)served.add(drink.recipient.kind+':'+drink.recipient.id);
  }
  for(let i=0;i<10;i++)assert.ok(served.has('staff:'+i),'Coffee delivery missing employee '+i);
  assert.ok(served.has('owner:-1'));assert.ok(s.completedDuties.coffee>=11);
});

test('Yati cooks catering before noon; both OB workers stop service for lunch and resume after 13:00', () => {
  let s=createSimulation();let cooked=false,cleaned=false;
  for(let tick=0;s.gameMinute<720&&tick<600;tick++){
    s=stepSimulation(s,.5,1);
    if(npcPose(s,8)==='cook'){cooked=true;assert.ok(pointDistance(s.npcs[8].position,dutyGoal(s,8))<.1);}
    if(npcPose(s,9)==='clean')cleaned=true;
  }
  assert.ok(cooked);assert.ok(cleaned);assert.equal(s.services.catering.phase,'ready');
  for(const index of [8,9]){assert.equal(s.npcs[index].duty,null);assert.equal(s.npcs[index].activity,'lunch');assert.equal(s.npcs[index].breakPlan?.kind,'ob');}
  s=advance(s,30);assert.ok([8,9].every(i=>!!seatedAt(s,i)));assert.equal(s.services.coffee,null);
  s=advance(s,30);assert.equal(s.gameMinute,780);assert.ok(s.npcs[9].duty?.kind==='clean');
});

test('lunch plans persist, reserve different seats and cap the pantry at four employees across multiple days', () => {
  const kinds=new Set<string>();
  for(let day=1;day<=8;day++){
    let s=quietSimulation(createSimulation(day,719));s=stepSimulation(s,1,1);
    const plans=STAFF_WORKERS.map(i=>structuredClone(s.npcs[i].breakPlan));
    for(const plan of plans)kinds.add(plan!.kind);
    assert.ok(plans.filter(p=>p?.kind==='pantry').length<=4);
    assert.equal(new Set(STAFF_WORKERS.map(i=>JSON.stringify(breakSeat(s,i).position))).size,9);
    s=advance(s,15);assert.deepEqual(STAFF_WORKERS.map(i=>s.npcs[i].breakPlan),plans);
  }
  for(const kind of ['desk','pantry','library','reception','ob'])assert.ok(kinds.has(kind));
});

test('related team members physically join a hosted client meeting in stable seats, face the table and return to work', () => {
  let s=calmOffice(540);
  s.clients=[{id:1,name:'Client',variant:10,target:'atlas',ownerJoined:false,seatSlot:1,position:clientMeetingSeat(1).position,path:[],phase:'meeting',stayUntil:1599}];
  const attended=new Map<number,number>();
  for(let tick=0;tick<300;tick++){
    s=stepSimulation(s,.5,1);
    for(const i of [1,2,3,4,5,7])if(s.npcs[i].duty?.kind==='support'&&s.npcs[i].duty.phase==='active'&&s.clients[0].phase==='meeting'){
      const slot=s.npcs[i].duty!.seatSlot!;attended.set(i,slot);
      assert.deepEqual(s.npcs[i].position,clientMeetingSeat(slot).position);
      assert.equal(seatedAt(s,i)?.rotation,clientMeetingSeat(slot).rotation);
      assert.deepEqual(clientSupportSeat(s,i),clientMeetingSeat(slot));
    }
  }
  assert.equal(attended.size,2);assert.equal(new Set(attended.values()).size,2);assert.ok([...attended.values()].some(slot=>slot%2===1));
  assert.equal(s.completedDuties.support,2);assert.equal(s.clients[0].phase,'offsite');
  for(const i of attended.keys())assert.deepEqual(s.npcs[i].position,workSeat(i).position);
});

test('old version 5 saves migrate the expanded layout, preserve progress and add OB staff and service state', () => {
  const save=defaultSave(),raw=JSON.parse(JSON.stringify(save));raw.simulation=JSON.parse(JSON.stringify(calmOffice(600,3)));
  raw.simulation.npcs=raw.simulation.npcs.slice(0,8);raw.simulation.credits=4820;raw.simulation.hqPoints=71;raw.simulation.npcs[3].energy=43;
  raw.simulation.npcs[3].position=raw.simulation.npcs[3].position.map((n:number,i:number)=>i<2?n/1.3:n);delete raw.simulation.services;
  const restored=parseSave(JSON.stringify(raw));assert.equal(restored.simulation.npcs.length,10);assert.equal(restored.simulation.credits,4820);assert.equal(restored.simulation.hqPoints,71);assert.equal(restored.simulation.npcs[3].energy,43);
  assert.equal(restored.simulation.npcs[8].name,'Yati');assert.equal(restored.simulation.npcs[9].name,'Deno');assert.equal(restored.simulation.services.day,3);
  for(const n of restored.simulation.npcs)assert.ok(isWalkable(n.position));
});

test('a full office day routes coffee, cleaners, clients and queues safely; every worker signs out and the night becomes empty', () => {
  let s=createSimulation();const cleaned=new Set<number>(),served=new Set<string>();
  for(let tick=0;tick<1600;tick++){
    s=stepSimulation(s,.5,1);s.npcs.forEach(n=>assert.ok(isWalkable(n.position),'Invalid position '+n.position));s.clients.forEach(c=>assert.ok(isWalkable(c.position)));
    s.services.cleanedRooms.forEach(id=>cleaned.add(id));s.services.drinks.forEach(d=>served.add(d.recipient.kind+':'+d.recipient.id));
    const queue=attendanceQueue(s);assert.equal(new Set(queue).size,queue.length);
  }
  assert.equal(cleaned.size,13);assert.ok(served.size>=6);assert.ok(s.npcs.every(n=>n.presence==='offsite'));assert.equal(s.services.drinks.length,0);
  for(const i of STAFF_WORKERS){assert.ok(s.npcs[i].attendanceOut);assert.equal(s.reception.log.filter(e=>e.kind==='out'&&e.name===s.npcs[i].name).length,1);}
  assert.ok(absoluteMinute(s)>=1020);
});

test('crowd clearance yields to an occupied body while permitting escape and different floors', () => {
  const start=servicePoint(1),occupied:[number,number,number]=[start[0]+.6,start[1],start[2]??0];
  assert.equal(crowdClear([start[0]+.3,start[1],start[2]],start,[occupied]),false);
  assert.equal(crowdClear([start[0]-.2,start[1],start[2]],start,[occupied]),true);
  assert.equal(crowdClear(start,start,[[start[0],start[1],3.8]]),true);
});

test('duplicate display names never exchange the saved roles, energy, or worker positions', () => {
  const save=defaultSave();save.simulation=calmOffice(600);
  save.simulation.npcs[0].name=save.simulation.npcs[1].name;
  save.simulation.npcs[0].energy=12;save.simulation.npcs[1].energy=73;
  const restored=parseSave(JSON.stringify(save));
  assert.equal(restored.simulation.npcs[0].energy,12);
  assert.equal(restored.simulation.npcs[1].energy,73);
  assert.deepEqual(restored.simulation.npcs[0].position,workSeat(0).position);
  assert.deepEqual(restored.simulation.npcs[1].position,workSeat(1).position);
});

test('delivered cups and service progress survive reload with at most one cup per recipient', () => {
  const save=defaultSave();save.simulation=calmOffice(600);
  const recipient={kind:'staff' as const,id:1},placement=drinkPlacement(recipient);
  const drink={recipient,...placement,deliveredAt:599,expiresAt:650};
  save.simulation.services.drinks=[drink,structuredClone(drink)];save.simulation.services.served=['staff:1','staff:1'];
  const restored=parseSave(JSON.stringify(save));
  assert.equal(restored.simulation.services.drinks.length,1);
  assert.deepEqual(restored.simulation.services.drinks[0],drink);
  assert.deepEqual(restored.simulation.services.served,['staff:1']);
});

test('a blocked client support route has bounded host waiting and grants no attendance completion', () => {
  let s=calmOffice(540);
  s.clients=[{id:1,name:'Client',variant:10,target:'atlas',ownerJoined:false,seatSlot:1,position:clientMeetingSeat(1).position,path:[],phase:'meeting',stayUntil:1599}];
  const occupied=[clientMeetingSeat(4).position,clientMeetingSeat(5).position];
  for(let tick=0;tick<400;tick++)s=stepSimulation(s,.5,1,occupied);
  assert.equal(s.clients[0].phase,'offsite');
  assert.equal(s.completedDuties.support,0);
  assert.ok(s.npcs.every(n=>n.duty?.kind!=='support'));
});

test('failed crowd detours retry immediately when the surrounding bodies leave', () => {
  const position:[number,number,number]=[-3,0,0],path:[[number,number,number]]=[[-1,0,0]];
  const people=Array.from({length:8},(_,i)=>({id:i,position:[position[0]+Math.cos(i*Math.PI/4)*.51,position[1]+Math.sin(i*Math.PI/4)*.51,0] as [number,number,number],moving:false}));
  const blocked=moveInCrowd(position,path,.1,people,999999);
  assert.equal(blocked.distanceUsed,0);
  assert.equal(moveInCrowd(position,path,.1,people,999999).distanceUsed,0);
  const clear=moveInCrowd(position,path,.1,[],999999);
  assert.ok(clear.distanceUsed>0);
  assert.ok(clear.position[0]>position[0]);
});

test('personal breaks regenerate reserved locations and return employees to their work seats', () => {
  let s=calmOffice(480);const kinds=new Set<string>(),original=s,before=structuredClone(s);
  for(let repeat=0;repeat<16;repeat++){
    s=assignActivity(s,0,'break');kinds.add(s.npcs[0].breakPlan!.kind);
    assert.deepEqual(activityGoal(s,0),breakSeat(s,0).position);
    s=assignActivity(s,0,'work');
  }
  assert.ok(kinds.size>=2);assert.deepEqual(original,before);
  for(const i of STAFF_WORKERS)s=assignActivity(s,i,'break');
  assert.ok(STAFF_WORKERS.filter(i=>s.npcs[i].breakPlan?.kind==='pantry').length<=4);
  assert.equal(new Set(STAFF_WORKERS.map(i=>JSON.stringify(activityGoal(s,i)))).size,STAFF_WORKERS.length);
  s=advance(s,56);
  for(const i of STAFF_WORKERS){
    assert.equal(s.npcs[i].activity,'break');
    assert.deepEqual(s.npcs[i].position,breakSeat(s,i).position);
    assert.deepEqual(seatedAt(s,i),breakSeat(s,i));
    if(s.npcs[i].breakPlan?.kind==='library')assert.equal(npcPose(s,i),'read');
  }
  s=advance(s,64);
  for(const i of STAFF_WORKERS){assert.equal(s.npcs[i].override,null);assert.deepEqual(s.npcs[i].position,workSeat(i).position);}
});
