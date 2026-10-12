import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteMinute, stepSimulation, seatedAt, defaultSave, parseSave, setOwnerEngagement, setOwnerRoom, joinClientMeeting } from '../src/simulation.ts';
import { founderMeetingSeat, inspectionPoint, librarySeat, ATTENDANCE_POINT, clientMeetingSeat } from '../src/officeLayout.ts';
import { pointDistance, isWalkable, elevation } from '../src/navigation.ts';
import { requestInteraction } from '../src/social.ts';
import { calmOffice, advance } from './helpers.ts';

test('ATLAS reaches a distinct sofa seat and waits until the owner avatar joins the private discussion', () => {
  let sim = setOwnerRoom(setOwnerEngagement(calmOffice(),true,null),3);
  sim.npcs[0].duty={kind:'private',target:1,phase:'travel',elapsed:0,duration:8,deadline:absoluteMinute(sim)+120};
  assert.equal(requestInteraction(sim,0,1,'chat'),sim);
  for(let tick=0;tick<120&&sim.npcs[0].duty?.phase!=='active';tick++)sim=stepSimulation(sim,.5,1);
  assert.deepEqual(sim.npcs[0].position,founderMeetingSeat(1).position);
  assert.ok(seatedAt(sim,0));assert.ok(pointDistance(founderMeetingSeat(0).position,sim.npcs[0].position)>.8);
  sim=advance(sim,4);assert.equal(sim.npcs[0].duty?.elapsed,0);
  sim=setOwnerEngagement(sim,true,'atlas');sim=advance(sim,8);
  assert.equal(sim.completedDuties.private,1);assert.equal(sim.npcs[0].duty,null);
  assert.equal(sim.npcs[7].name,'Felin');assert.equal(sim.npcs[7].duty,null);
});

test('a broken HRD computer pauses work until NEXUS physically arrives upstairs and finishes the repair', () => {
  let sim = calmOffice();
  sim.computerIssues.push({ owner: 7, reportedAt: absoluteMinute(sim), resolvedAt: null });
  let arrivedAt = -1, repairedAt = -1, duration = -1;
  for (let tick = 0; tick < 240; tick++) {
    sim = stepSimulation(sim, .5, 1);
    const issue = sim.computerIssues.find((item) => item.owner === 7)!;
    const duty = sim.npcs[5].duty;
    if (issue.resolvedAt === null) assert.equal(sim.npcs[7].workMinutes, 0, 'A broken computer cannot produce work credits');
    if (duty?.kind === 'repair') {
      duration = duty.duration;
      assert.equal(duty.target, 7);
      if (duty.phase === 'travel') assert.equal(duty.elapsed, 0);
      if (duty.phase === 'active' && arrivedAt < 0) {
        arrivedAt = absoluteMinute(sim);
        assert.ok(pointDistance(sim.npcs[5].position, inspectionPoint(7)) < .15);
      }
    }
    if (issue.resolvedAt !== null) { repairedAt = issue.resolvedAt; break; }
  }
  assert.ok(arrivedAt > 600);
  assert.ok(duration > 0);
  assert.ok(repairedAt >= arrivedAt + duration - .5);
  assert.equal(sim.completedDuties.repair, 1);
  assert.equal(sim.npcs[5].duty, null);
  sim = advance(sim, 2);
  assert.ok(sim.npcs[7].workMinutes > 0, 'Felin resumes work once his computer is repaired');
});

test('an employee due for a random break stays at his computer until the manager finishes inspecting his work', () => {
  let sim = calmOffice();
  sim.npcs[3].nextLeisureAt = absoluteMinute(sim);
  sim.npcs[0].duty = { kind: 'inspect', target: 3, phase: 'travel', elapsed: 0, duration: 6, deadline: absoluteMinute(sim) + 150 };
  let sawReview = false;
  for (let tick = 0; tick < 220; tick++) {
    sim = stepSimulation(sim, .5, 1);
    if (sim.npcs[0].duty?.kind === 'inspect') {
      assert.equal(sim.npcs[3].duty, null);
      assert.ok(seatedAt(sim, 3));
      if (sim.npcs[0].duty.phase === 'active') {
        sawReview = true;
        assert.ok(pointDistance(sim.npcs[0].position, inspectionPoint(3)) < .1);
      }
    }
    if (sim.completedDuties.inspect > 0) break;
  }
  assert.ok(sawReview); assert.equal(sim.completedDuties.inspect, 1);
});

test('reading waits for a real library seat, completes after its seated duration, and lunch cancels unfinished private activity', () => {
  let sim = calmOffice();
  sim.npcs[3].duty = { kind: 'read', target: 1, phase: 'travel', elapsed: 0, duration: 5, deadline: absoluteMinute(sim) + 120 };
  let arrivedAt = -1, completedAt = -1;
  for (let tick = 0; tick < 160; tick++) {
    sim = stepSimulation(sim, .5, 1);
    const duty = sim.npcs[3].duty;
    if (duty?.phase === 'travel') assert.equal(duty.elapsed, 0);
    if (duty?.phase === 'active' && arrivedAt < 0) {
      arrivedAt = absoluteMinute(sim);
      assert.ok(pointDistance(sim.npcs[3].position, librarySeat(3).position) < .15);
      assert.ok(seatedAt(sim, 3));
    }
    if (sim.completedDuties.read > 0) { completedAt = absoluteMinute(sim); break; }
  }
  assert.ok(arrivedAt > 600 && completedAt >= arrivedAt + 4.5);
  sim = calmOffice(719);
  sim.npcs[3].duty = { kind: 'read', target: 0, phase: 'travel', elapsed: 0, duration: 40, deadline: 800 };
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.npcs[3].activity, 'lunch'); assert.equal(sim.npcs[3].duty, null);
  assert.equal(sim.completedDuties.read, 0);
});

test('a client is served at the desk, climbs upstairs and waits until the owner avatar joins', () => {
  let sim=calmOffice();sim.nextClientAt=600.5;
  let name='',sawService=false,sawStairs=false;
  for(let tick=0;tick<160;tick++){
    sim=stepSimulation(sim,.5,1);
    if(sim.clients[0]&&!name){name=sim.clients[0].name;sim.clients[0].target='owner';sim.nextClientAt=1e8;}
    const client=sim.clients[0];if(!client)continue;
    assert.ok(isWalkable(client.position));
    if(elevation(client.position)>.1&&elevation(client.position)<3.7)sawStairs=true;
    if(sim.reception.client&&sim.reception.phase==='service'){sawService=true;assert.ok(pointDistance(client.position,ATTENDANCE_POINT)<.2);}
  }
  const client=sim.clients[0];assert.ok(sawService);assert.ok(sawStairs);
  assert.equal(client.phase,'meeting');assert.deepEqual(client.position,clientMeetingSeat(client.seatSlot).position);
  assert.equal(sim.reception.log.filter(entry=>entry.kind==='client'&&entry.name===name).length,1);
  assert.equal(joinClientMeeting(sim,client.id),sim,'Director mode cannot service the owner client');
  sim.hqPoints=70;sim=setOwnerRoom(setOwnerEngagement(sim,true,'client'),11);
  sim=joinClientMeeting(sim,client.id);sim=advance(sim,70);
  assert.equal(sim.clients[0].phase,'offsite');assert.equal(sim.hqPoints,78);
});

test('version 5 saves resume an upstairs repair from mid-stair elevation with the broken computer and duty intact', () => {
  let sim = calmOffice(); sim.computerIssues.push({ owner: 7, reportedAt: 600, resolvedAt: null });
  for (let tick = 0; tick < 160; tick++) {
    sim = stepSimulation(sim, .5, 1);
    if (elevation(sim.npcs[5].position) > .1 && elevation(sim.npcs[5].position) < 3.7) break;
  }
  assert.ok(elevation(sim.npcs[5].position) > .1 && elevation(sim.npcs[5].position) < 3.7);
  const save = defaultSave(); save.simulation = sim; save.speed = 0;
  const restored = parseSave(JSON.stringify(save));
  assert.equal(restored.version, 5); assert.equal(restored.speed, 0);
  assert.deepEqual(restored.simulation.npcs[5].position, sim.npcs[5].position);
  assert.deepEqual(restored.simulation.npcs[5].duty, sim.npcs[5].duty);
  assert.deepEqual(restored.simulation.computerIssues, sim.computerIssues);
  assert.deepEqual(stepSimulation(restored.simulation, 60, 0), restored.simulation);
  const completed = advance(restored.simulation, 80);
  assert.notEqual(completed.computerIssues.find((issue) => issue.owner === 7)?.resolvedAt, null);
});
