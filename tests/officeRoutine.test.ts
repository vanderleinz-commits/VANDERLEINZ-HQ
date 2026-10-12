import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, stepSimulation, officePower, officeOpen, seatedAt, weekdayName, defaultSave, parseSave, activityGoal, absoluteMinute, breakSeat } from '../src/simulation.ts';
import { STAFF_WORKERS, MEETING_PARTICIPANTS } from '../src/worldData.ts';
import { arrivalMinute, RECEPTION_POST, ATTENDANCE_POINT, workSeat, meetingSeat, lunchSeat, meetingSlot, lunchSlot } from '../src/officeLayout.ts';
import { isWalkable, roomAt, floorOf, pointDistance } from '../src/navigation.ts';
import { advance, calmOffice, quietSimulation } from './helpers.ts';

test('07:00 opens the office, Amanda arrives first, and nine workers check in one at a time at the reception desk', () => {
  const closed = createSimulation(1, 419);
  assert.equal(officeOpen(419.99), false); assert.equal(officeOpen(420), true);
  assert.ok(closed.npcs.every((npc) => npc.presence === 'offsite'));
  assert.equal(officePower(closed), 0);
  let sim = quietSimulation(createSimulation());
  assert.equal(sim.gameMinute, 420); assert.equal(sim.npcs.length, 10);
  const arrivals = new Map<number, number>(), checkIns = new Map<number, number>();
  for (let tick = 0; tick < 180; tick++) {
    const before = sim;
    sim = stepSimulation(sim, .5, 1);
    sim.npcs.forEach((npc, index) => {
      assert.ok(isWalkable(npc.position));
      if (npc.presence !== 'offsite' && !arrivals.has(index)) arrivals.set(index, sim.gameMinute);
      if (sim.gameMinute < arrivalMinute(index)) assert.equal(npc.presence, 'offsite');
      if (index !== 6 && npc.attendanceIn !== null && !checkIns.has(index)) {
        checkIns.set(index, npc.attendanceIn);
        assert.ok(pointDistance(npc.position, ATTENDANCE_POINT) < 1.3, 'Attendance is recorded at reception before walking to a desk');
      }
    });
    if (sim.reception.person !== null && sim.reception.phase === 'service' && !sim.reception.client) {
      assert.ok(pointDistance(sim.npcs[sim.reception.person].position, ATTENDANCE_POINT) < .2);
      assert.ok(before.npcs[sim.reception.person].attendanceIn === null || sim.reception.mode === 'out');
    }
    if (sim.gameMinute === 480) assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].presence === 'inside'), 'Live check-in arrivals finish before the 08:00 work start');
  }
  assert.equal(arrivals.size, 10);
  assert.ok(new Set(arrivals.values()).size >= 7);
  assert.ok(arrivals.get(6)! < arrivals.get(7)!);
  assert.equal(checkIns.size, 9);
  assert.equal(new Set(checkIns.values()).size, 9, 'Amanda serves one employee at a time');
  assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
  for (const index of STAFF_WORKERS) assert.equal(sim.reception.log.filter((item) => item.day === 1 && item.name === sim.npcs[index].name && item.kind === 'in').length, 1);
});

test('the team has dedicated chairs, OB staff have rest chairs and Amanda remains standing at reception', () => {
  const sim = calmOffice();
  for (const index of STAFF_WORKERS) {
    assert.equal(sim.npcs[index].activity, 'work');
    assert.deepEqual(seatedAt(sim, index)?.position, workSeat(index).position);
  }
  assert.equal(seatedAt(sim, 6), null);
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
  assert.equal(floorOf(sim.npcs[0].position), 1); assert.equal(floorOf(sim.npcs[7].position), 1);
});

test('12:00 spreads persistent break choices across office seats, library, reception and pantry; 13:00 returns staff to departments', () => {
  let sim = calmOffice(719);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.gameMinute, 720);
  assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].activity === 'lunch' && sim.npcs[index].breakPlan));
  assert.ok(new Set(STAFF_WORKERS.map(index=>sim.npcs[index].destination)).size>=3);assert.ok(STAFF_WORKERS.filter(index=>sim.npcs[index].destination===5).length<=4);
  sim = advance(sim, 55);
  for (const index of STAFF_WORKERS) {
    assert.deepEqual(sim.npcs[index].position,breakSeat(sim,index).position); assert.ok(seatedAt(sim, index));
  }
  assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
  sim = advance(sim, 5);
  assert.equal(sim.gameMinute, 780); assert.equal(sim.encounters.length, 0);
  assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].activity === 'work'));
  sim = advance(sim, 60);
  for (const index of STAFF_WORKERS) assert.deepEqual(seatedAt(sim, index)?.position, workSeat(index).position);
});

test('daily meetings vary reproducibly, wait for the six employees and leave the Founder chair available, and provide 30–60 actual discussion minutes', () => {
  const starts = new Set<number>(), durations = new Set<number>();
  for (let day = 1; day <= 14; day++) {
    const first = createSimulation(day), second = createSimulation(day);
    assert.deepEqual(first.meeting, second.meeting);
    assert.ok([30, 45, 60].includes(first.meeting.duration));
    assert.ok((first.meeting.start >= 540 && first.meeting.start <= 570) || (first.meeting.start >= 810 && first.meeting.start <= 840));
    starts.add(first.meeting.start); durations.add(first.meeting.duration);
  }
  assert.ok(starts.size > 3); assert.ok(durations.size >= 2);
  const plan = createSimulation(1).meeting;
  let sim = quietSimulation(createSimulation(1, plan.start - 1), false);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.meeting.phase, 'gathering'); assert.equal(sim.meeting.elapsed, 0);
  let started = -1, ended = -1;
  for (let tick = 0; tick < (plan.duration + 90) * 2; tick++) {
    sim = stepSimulation(sim, .5, 1);
    if (sim.meeting.phase === 'gathering') assert.equal(sim.meeting.elapsed, 0);
    if (sim.meeting.phase === 'discussing') {
      if (started < 0) started = absoluteMinute(sim);
      for (const index of MEETING_PARTICIPANTS) {
        assert.deepEqual(sim.npcs[index].position, meetingSeat(meetingSlot(index)).position);
        assert.ok(seatedAt(sim, index));
      }
      assert.deepEqual(sim.npcs[6].position, RECEPTION_POST);
    }
    if (started >= 0 && sim.meeting.phase === 'done') { ended = absoluteMinute(sim); break; }
  }
  assert.ok(started > plan.start);
  assert.ok(ended >= started + plan.duration - .5 && ended <= started + plan.duration + .5);
  sim = advance(sim, 20);
  assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].activity === 'work'));
});

test('after 17:00 workers check out once, Amanda stays until everyone leaves, and the next morning repeats arrivals', () => {
  let sim = calmOffice(1019);
  sim = stepSimulation(sim, 1, 1);
  assert.equal(officeOpen(sim.gameMinute), false);
  assert.ok(STAFF_WORKERS.every((index) => ['checking-out', 'leaving'].includes(sim.npcs[index].presence)));
  const creditsAtClose = sim.credits;
  for (let tick = 0; tick < 300; tick++) {
    sim = stepSimulation(sim, .5, 1);
    if (STAFF_WORKERS.some((index) => sim.npcs[index].presence !== 'offsite')) assert.notEqual(sim.npcs[6].presence, 'offsite');
  }
  assert.ok(sim.npcs.every((npc) => npc.presence === 'offsite'));
  assert.equal(officePower(sim), 0); assert.equal(sim.credits, creditsAtClose);
  for (const index of STAFF_WORKERS) {
    assert.notEqual(sim.npcs[index].attendanceOut, null);
    assert.equal(sim.reception.log.filter((item) => item.day === 1 && item.name === sim.npcs[index].name && item.kind === 'out').length, 1);
  }
  sim = advance(sim, 1440 + 420 - absoluteMinute(sim));
  assert.equal(sim.gameDay, 2); assert.equal(sim.gameMinute, 420); assert.equal(sim.meeting.day, 2);
  assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].presence === 'offsite'));
  sim = advance(sim, 90);
  assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
});

test('weekday names cycle Monday through Sunday and employees still work on both weekend days', () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, index) => weekdayName(index + 1)), ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Senin']);
  for (const day of [6, 7]) {
    const sim = createSimulation(day, 480);
    assert.ok(sim.npcs.every((npc) => npc.presence === 'inside'));
    assert.ok(STAFF_WORKERS.every((index) => sim.npcs[index].activity === 'work'));
  }
});

test('Amanda stops earning work credits after closing while she waits to process the final checkout', () => {
  let sim = calmOffice(1020);
  sim.npcs[6].presence = 'inside'; sim.npcs[6].position = RECEPTION_POST;
  sim.npcs[6].workMinutes = 59.9;
  sim.npcs[0].presence = 'checking-out'; sim.npcs[0].position = workSeat(0).position;
  const before = sim.credits;
  sim = stepSimulation(sim, .5, 1);
  assert.equal(sim.npcs[6].presence, 'inside');
  assert.equal(sim.npcs[6].workMinutes, 59.9); assert.equal(sim.credits, before);
});

test('a reception service crossing 17:00 records checkout instead of sending an employee back into the office', () => {
  let sim = calmOffice(1019.5);
  sim.npcs[1].presence = 'checking-in'; sim.npcs[1].position = ATTENDANCE_POINT;
  sim.npcs[1].attendanceIn = null;
  sim.reception = { ...sim.reception, person: 1, client: false, mode: 'in', phase: 'service', elapsed: 1 };
  sim = stepSimulation(sim, 1, 1);
  assert.equal(sim.npcs[1].presence, 'leaving');
  assert.equal(sim.npcs[1].attendanceIn, null); assert.notEqual(sim.npcs[1].attendanceOut, null);
  const entries = sim.reception.log.filter((entry) => entry.name === 'NOVA');
  assert.equal(entries.length, 1); assert.equal(entries[0].kind, 'out');
});

test('day two staggers leisure timers and overdue breaks wait after work starts and until employees return to their desks', () => {
  const midnight = stepSimulation(calmOffice(1439.5), .5, 1);
  assert.equal(midnight.gameDay, 2);
  const timers = STAFF_WORKERS.map((index) => midnight.npcs[index].nextLeisureAt);
  assert.equal(new Set(timers).size, STAFF_WORKERS.length, 'A new day must not send every employee on a break together');
  assert.ok(timers.every((at) => at > absoluteMinute(midnight) + 480));
  const leisureKinds = ['read', 'toilet', 'drink', 'cook', 'hr'];
  for (const boundary of [480, 780]) {
    let sim = calmOffice(boundary - .5, 2);
    for (const index of STAFF_WORKERS) {
      sim.npcs[index].nextLeisureAt = absoluteMinute(sim) - 1;
      if (boundary === 780) sim.npcs[index].position = lunchSeat(lunchSlot(index)).position;
    }
    sim = stepSimulation(sim, .5, 1);
    for (let tick = 0; tick < 3; tick++) {
      assert.ok(STAFF_WORKERS.every((index) => !sim.npcs[index].duty || !leisureKinds.includes(sim.npcs[index].duty!.kind)), '08:00 and 13:00 must begin with work rather than overdue leisure tasks');
      sim = stepSimulation(sim, .5, 1);
    }
    if (boundary === 780) {
      let reachedDesk = false, waitedPastDue = false;
      for (let tick = 0; tick < 120; tick++) {
        sim = stepSimulation(sim, .5, 1);
        if (pointDistance(sim.npcs[0].position, workSeat(0).position) < .1 && !sim.npcs[0].path.length) { reachedDesk = true; break; }
        assert.equal(sim.npcs[0].duty, null, 'ATLAS finishes returning upstairs before starting an optional activity');
        if (absoluteMinute(sim) >= sim.npcs[0].nextLeisureAt && sim.npcs[0].path.length) waitedPastDue = true;
      }
      assert.ok(waitedPastDue, 'The test must exercise an overdue timer during the walk back');
      assert.ok(reachedDesk);
    }
  }
});

test('version 5 migrates old seven-person saves, preserves progress, and places Felin and the manager upstairs', () => {
  const save = defaultSave(); save.simulation = calmOffice(600, 4);
  save.simulation.credits = 2600; save.simulation.npcs[2].energy = 47; save.simulation.npcs[2].workMinutes = 23;
  const raw = JSON.parse(JSON.stringify(save)); raw.version = 4; raw.simulation.npcs = raw.simulation.npcs.slice(0, 7);
  delete raw.simulation.meeting;
  for (const npc of raw.simulation.npcs) { delete npc.duty; delete npc.attendanceIn; delete npc.attendanceOut; }
  const restored = parseSave(JSON.stringify(raw));
  assert.equal(restored.version, 5); assert.equal(restored.simulation.gameDay, 4);
  assert.equal(restored.simulation.gameMinute, 600); assert.equal(restored.simulation.credits, 2600);
  assert.equal(restored.simulation.npcs.length, 10); assert.equal(restored.simulation.npcs[2].energy, 47);
  assert.equal(restored.simulation.npcs[2].workMinutes, 23); assert.equal(restored.simulation.npcs[7].name, 'Felin');
  assert.equal(floorOf(restored.simulation.npcs[0].position), 1); assert.equal(floorOf(restored.simulation.npcs[7].position), 1);
  for (let index = 0; index < restored.simulation.npcs.length; index++) {
    assert.ok(isWalkable(restored.simulation.npcs[index].position)); assert.ok(isWalkable(activityGoal(restored.simulation, index)));
  }
});
