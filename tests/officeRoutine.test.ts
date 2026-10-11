import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, stepSimulation, officePower, officeOpen, seatedAt, weekdayName, defaultSave, parseSave, activityGoal, absoluteMinute } from '../src/simulation.ts';
import { arrivalMinute, ENTRY_POINT, RECEPTION_POST, workSeat, meetingSeat, lunchSeat } from '../src/officeLayout.ts';
import { findPath, isWalkable, moveAlong, roomAt } from '../src/navigation.ts';

const advance = (sim: ReturnType<typeof createSimulation>, minutes: number) => {
  for (let i = 0; i < minutes * 2; i++) sim = stepSimulation(sim, 0.5, 1);
  return sim;
};
const noMeeting = (minute: number, day = 1) => {
  const sim = createSimulation(day, minute);
  sim.meeting.phase = 'done';
  return sim;
};

test('office opens at 07:00, Amanda arrives first, and staff enter gradually through the main entrance', () => {
  const closed = createSimulation(1, 419);
  assert.equal(officeOpen(419.99), false);
  assert.equal(officeOpen(420), true);
  assert.ok(closed.npcs.every((npc) => npc.presence === 'offsite'));
  assert.equal(officePower(closed), 0);
  let sim = createSimulation();
  assert.equal(sim.gameMinute, 420);
  assert.equal(sim.npcs.length, 7);
  assert.equal(sim.npcs[6].name, 'Amanda');
  const arrivalTimes = new Map<number, number>();
  for (let minute = 0; minute < 60; minute++) {
    sim = stepSimulation(sim, 1, 1);
    for (let index = 0; index < sim.npcs.length; index++) {
      const npc = sim.npcs[index];
      assert.ok(isWalkable(npc.position));
      if (npc.presence !== 'offsite' && !arrivalTimes.has(index)) arrivalTimes.set(index, sim.gameMinute);
      if (sim.gameMinute < arrivalMinute(index)) assert.equal(npc.presence, 'offsite');
    }
    if (sim.gameMinute === 425) assert.ok(officePower(sim) > 0);
  }
  assert.equal(arrivalTimes.size, 7);
  assert.ok(new Set(arrivalTimes.values()).size >= 6);
  assert.ok(arrivalTimes.get(6)! < arrivalTimes.get(0)!);
  assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
});

test('all desks and shared chairs have safe, reachable seating anchors, while the receptionist stands at her post', () => {
  for (let index = 0; index < 6; index++) {
    for (const seat of [workSeat(index), meetingSeat(index), lunchSeat(index)]) {
      assert.ok(isWalkable(seat.position));
      const route = findPath(ENTRY_POINT, seat.position);
      assert.ok(route.length > 0, 'A chair must connect to the public entrance');
      assert.deepEqual(moveAlong(ENTRY_POINT, route, 1000).position, seat.position);
    }
  }
  const sim = noMeeting(600);
  for (let index = 0; index < 6; index++) {
    assert.equal(sim.npcs[index].activity, 'work');
    assert.deepEqual(seatedAt(sim, index)?.position, workSeat(index).position);
  }
  assert.equal(seatedAt(sim, 6), null);
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
});

test('working employees occasionally walk within their own departments and return to their computers', () => {
  let sim = noMeeting(480);
  const leftDesk = new Set<number>(), returned = new Set<number>();
  for (let minute = 0; minute < 150; minute++) {
    sim = stepSimulation(sim, 1, 1);
    sim.npcs.slice(0, 6).forEach((npc, index) => {
      assert.ok(isWalkable(npc.position));
      if (npc.activity === 'work' && !seatedAt(sim, index)) leftDesk.add(index);
      if (leftDesk.has(index) && seatedAt(sim, index)?.position.toString() === workSeat(index).position.toString()) returned.add(index);
    });
    assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
  }
  assert.ok(leftDesk.size >= 3, 'Several employees should stand up for a short office errand');
  assert.ok(returned.size >= 3, 'Office errands should finish with employees returning to their work chairs');
});

test('12:00–13:00 is a fixed canteen break and 13:00 sends all workers back to their departments', () => {
  let sim = noMeeting(719);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.gameMinute, 720);
  assert.ok(sim.npcs.slice(0, 6).every((npc) => npc.activity === 'lunch' && npc.destination === 5));
  sim = advance(sim, 20);
  for (let index = 0; index < 6; index++) {
    assert.equal(roomAt(sim.npcs[index].position), 5);
    assert.ok(seatedAt(sim, index));
  }
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
  sim = advance(sim, 40);
  assert.equal(sim.gameMinute, 780);
  assert.equal(sim.encounters.length, 0);
  assert.ok(sim.npcs.slice(0, 6).every((npc) => npc.activity === 'work'));
  sim = advance(sim, 20);
  for (let index = 0; index < 6; index++) assert.deepEqual(seatedAt(sim, index)?.position, workSeat(index).position);
});

test('a daily meeting varies reproducibly, waits for all six seats, lasts 30–60 discussion minutes, and releases everyone', () => {
  const starts = new Set<number>(), durations = new Set<number>();
  for (let day = 1; day <= 14; day++) {
    const first = createSimulation(day), second = createSimulation(day);
    assert.deepEqual(first.meeting, second.meeting);
    assert.ok([30, 45, 60].includes(first.meeting.duration));
    assert.ok((first.meeting.start >= 540 && first.meeting.start <= 630) || (first.meeting.start >= 840 && first.meeting.start <= 920));
    starts.add(first.meeting.start); durations.add(first.meeting.duration);
  }
  assert.ok(starts.size > 3); assert.ok(durations.size >= 2);
  const plan = createSimulation(1).meeting;
  let sim = createSimulation(1, plan.start - 1);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.meeting.phase, 'gathering');
  assert.equal(sim.meeting.elapsed, 0);
  let discussionStarted = -1, discussionEnded = -1;
  for (let i = 0; i < (plan.duration + 80) * 2; i++) {
    sim = stepSimulation(sim, 0.5, 1);
    if (sim.meeting.phase === 'gathering') assert.equal(sim.meeting.elapsed, 0);
    if (sim.meeting.phase === 'discussing') {
      if (discussionStarted < 0) discussionStarted = absoluteMinute(sim);
      for (let index = 0; index < 6; index++) {
        assert.deepEqual(sim.npcs[index].position, meetingSeat(index).position);
        assert.ok(seatedAt(sim, index));
      }
      assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
    }
    if (discussionStarted >= 0 && sim.meeting.phase === 'done') { discussionEnded = absoluteMinute(sim); break; }
  }
  assert.ok(discussionStarted > plan.start, 'Walking to the meeting should precede the discussion timer');
  assert.ok(discussionEnded >= discussionStarted + plan.duration - 0.5);
  assert.ok(discussionEnded <= discussionStarted + plan.duration + 0.5);
  sim = advance(sim, 20);
  assert.ok(sim.npcs.slice(0, 6).every((npc) => npc.activity === 'work'));
});

test('17:00 closes work, every employee walks out, the office becomes empty and dark, and next morning repeats arrivals', () => {
  let sim = noMeeting(1019);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(officeOpen(sim.gameMinute), false);
  assert.ok(sim.npcs.every((npc) => npc.presence === 'leaving' && npc.activity === 'leave'));
  const creditsAtClose = sim.credits;
  sim = advance(sim, 40);
  assert.ok(sim.npcs.every((npc) => npc.presence === 'offsite' && npc.activity === 'offsite'));
  assert.equal(officePower(sim), 0);
  assert.equal(sim.credits, creditsAtClose);
  sim = advance(sim, 800);
  assert.equal(sim.gameDay, 2);
  assert.equal(sim.gameMinute, 420);
  assert.equal(sim.meeting.day, 2);
  assert.ok(sim.npcs.slice(0, 6).every((npc) => npc.presence === 'offsite'));
  sim = advance(sim, 60);
  assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
});

test('weekday names cycle Monday through Sunday while employees still work on weekends', () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, index) => weekdayName(index + 1)), ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Senin']);
  for (const day of [6, 7]) {
    const sim = createSimulation(day, 480);
    assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
    assert.ok(sim.npcs.slice(0, 6).every((npc) => npc.activity === 'work'));
  }
});

test('save version 4 migrates six-worker version 3 saves, preserves progress, and adds Amanda safely', () => {
  const save = defaultSave(); save.simulation = noMeeting(600, 4);
  save.simulation.credits = 2600; save.simulation.npcs[2].energy = 47; save.simulation.npcs[2].workMinutes = 23;
  const raw = JSON.parse(JSON.stringify(save)); raw.version = 3;
  raw.simulation.npcs = raw.simulation.npcs.slice(0, 6);
  delete raw.simulation.meeting;
  for (const npc of raw.simulation.npcs) { delete npc.presence; delete npc.errandUntil; delete npc.nextErrandAt; }
  const restored = parseSave(JSON.stringify(raw));
  assert.equal(restored.version, 4);
  assert.equal(restored.simulation.gameDay, 4);
  assert.equal(restored.simulation.gameMinute, 600);
  assert.equal(restored.simulation.credits, 2600);
  assert.equal(restored.simulation.npcs.length, 7);
  assert.equal(restored.simulation.npcs[2].energy, 47);
  assert.equal(restored.simulation.npcs[2].workMinutes, 23);
  assert.equal(restored.simulation.npcs[6].name, 'Amanda');
  assert.deepEqual(restored.simulation.npcs[6].position, RECEPTION_POST);
  for (let index = 0; index < restored.simulation.npcs.length; index++) {
    const npc = restored.simulation.npcs[index];
    assert.ok(isWalkable(npc.position));
    assert.ok(isWalkable(activityGoal(restored.simulation, index)));
  }
});
