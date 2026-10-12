import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteMinute, stepSimulation, seatedAt, defaultSave, parseSave } from '../src/simulation.ts';
import { founderMeetingSeat, inspectionPoint, librarySeat, ATTENDANCE_POINT } from '../src/officeLayout.ts';
import { pointDistance, isWalkable, elevation } from '../src/navigation.ts';
import { requestInteraction } from '../src/social.ts';
import { calmOffice, advance } from './helpers.ts';

test('the founder and manager start a private discussion only after both reach their chairs', () => {
  let sim = calmOffice();
  const deadline = absoluteMinute(sim) + 120;
  for (const [index, target] of [[0, 7], [7, 0]]) sim.npcs[index].duty = { kind: 'private', target, phase: 'travel', elapsed: 0, duration: 8, deadline };
  assert.equal(requestInteraction(sim, 0, 1, 'chat'), sim, 'Management tasks take priority over manual social commands');
  let bothSeatedAt = -1, completedAt = -1;
  for (let tick = 0; tick < 120; tick++) {
    sim = stepSimulation(sim, .5, 1);
    const bothAtChairs = [0, 7].every((index) => !sim.npcs[index].path.length && pointDistance(sim.npcs[index].position, founderMeetingSeat(index).position) < .1);
    if (!bothAtChairs && bothSeatedAt < 0) for (const index of [0, 7]) assert.equal(sim.npcs[index].duty?.elapsed, 0);
    if (bothAtChairs && bothSeatedAt < 0) {
      bothSeatedAt = absoluteMinute(sim);
      assert.ok(seatedAt(sim, 0)); assert.ok(seatedAt(sim, 7));
    }
    if (sim.completedDuties.private > 0) { completedAt = absoluteMinute(sim); break; }
  }
  assert.ok(bothSeatedAt > 600, 'The manager first walks from his office');
  assert.ok(completedAt >= bothSeatedAt + 7.5);
  assert.equal(sim.completedDuties.private, 2, 'Both participants finish the shared discussion');
  assert.equal(sim.npcs[0].duty, null); assert.equal(sim.npcs[7].duty, null);
});

test('a broken founder computer pauses work until NEXUS physically arrives upstairs and finishes the repair', () => {
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
  assert.ok(sim.npcs[7].workMinutes > 0, 'The founder resumes work once his computer is repaired');
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

test('visitor reception records a client only after an actual desk service and the visitor eventually leaves', () => {
  let sim = calmOffice(); sim.nextClientAt = absoluteMinute(sim) + .5;
  let clientName = '', sawService = false, sawServed = false, sawLeaving = false;
  for (let tick = 0; tick < 240; tick++) {
    sim = stepSimulation(sim, .5, 1);
    if (sim.clients[0] && !clientName) { clientName = sim.clients[0].name; sim.nextClientAt = 1e8; }
    for (const client of sim.clients) {
      assert.ok(isWalkable(client.position));
      if (sim.reception.client && sim.reception.phase === 'service') {
        sawService = true; assert.ok(pointDistance(client.position, ATTENDANCE_POINT) < .2);
      }
      if (client.phase === 'served') sawServed = true;
      if (client.phase === 'leaving') sawLeaving = true;
    }
  }
  assert.ok(clientName); assert.ok(sawService); assert.ok(sawServed); assert.ok(sawLeaving);
  assert.equal(sim.reception.log.filter((entry) => entry.kind === 'client' && entry.name === clientName).length, 1);
  assert.ok(sim.clients.every((client) => client.phase === 'offsite'));
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
