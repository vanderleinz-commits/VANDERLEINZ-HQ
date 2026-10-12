import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignActivity, createSimulation, defaultSave, parseSave, schedule, stepSimulation, activityGoal } from '../src/simulation.ts';
import { findPath, isWalkable, moveAlong, moveAvatar, roomAt, station, elevation } from '../src/navigation.ts';
import { rooms } from '../src/worldData.ts';
import { ENTRY_POINT } from '../src/officeLayout.ts';
import { quietSimulation } from './helpers.ts';

const advance = (sim: ReturnType<typeof createSimulation>, minutes: number) => {
  for (let i = 0; i < minutes; i++) sim = stepSimulation(sim, 1, 1);
  return sim;
};
const workingOffice = () => {
  return quietSimulation(createSimulation(1, 600));
};

test('1x = one game day per 24 real minutes; 2x, 3x, and midnight rollover', () => {
  for (const speed of [1, 2, 3]) {
    const after = stepSimulation(createSimulation(3, 1439), 1, speed);
    assert.equal(after.gameDay, 4);
    assert.equal(after.gameMinute, speed - 1);
  }
  const state = advance(createSimulation(), 1440);
  assert.equal(state.gameDay, 2);
  assert.equal(state.gameMinute, 420);
});

test('pause freezes time, NPC travel, needs, meeting timing, and income', () => {
  const state = assignActivity(workingOffice(), 0, 'break');
  assert.deepEqual(stepSimulation(state, 30, 0), state);
});

test('all room standing spots connect to the new front entrance through open doors', () => {
  for (const room of rooms) for (let index = 0; index < 6; index++) {
    const destination = station(room.id, index);
    const path = findPath(ENTRY_POINT, destination);
    assert.ok(path.length > 0, 'Every room must connect to the front entrance');
    assert.equal(roomAt(destination), room.id);
    for (let step = 1; step < path.length; step++) {
      assert.ok(isWalkable(path[step]));
      assert.ok(isWalkable([(path[step][0] + path[step - 1][0]) / 2, (path[step][1] + path[step - 1][1]) / 2, (elevation(path[step]) + elevation(path[step - 1])) / 2]));
    }
    assert.deepEqual(moveAlong(ENTRY_POINT, path, 1000).position, destination);
  }
});

test('avatar cannot tunnel through walls or furniture during a long frame', () => {
  const start = station(0, 0);
  const moved = moveAvatar(start, 100, 0);
  assert.equal(roomAt(moved), 0);
  assert.ok(isWalkable(moved));
  const furniture = moveAvatar(station(0, 1), 0, -3);
  assert.ok(isWalkable(furniture));
});

test('office schedule changes at the exact opening, work, lunch, and closing boundaries', () => {
  assert.equal(schedule(419.99), 'offsite'); assert.equal(schedule(420), 'prepare');
  assert.equal(schedule(479.99), 'prepare'); assert.equal(schedule(480), 'work');
  assert.equal(schedule(600), 'work'); assert.equal(schedule(719.99), 'work');
  assert.equal(schedule(720), 'lunch'); assert.equal(schedule(779.99), 'lunch');
  assert.equal(schedule(780), 'work'); assert.equal(schedule(1019.99), 'work');
  assert.equal(schedule(1020), 'offsite'); assert.equal(schedule(0), 'offsite');
});

test('work earns virtual credits and a manual break restores needs after arriving at the canteen', () => {
  const before = workingOffice();
  const after = advance(before, 110);
  assert.ok(after.credits > before.credits);
  assert.ok(after.npcs[0].energy < before.npcs[0].energy);
  let resting = assignActivity(after, 0, 'break');
  resting = advance(resting, 65);
  assert.ok(resting.npcs[0].breakPlan);assert.equal(roomAt(resting.npcs[0].position),roomAt(activityGoal(resting,0)));
  assert.ok(resting.npcs[0].energy > after.npcs[0].energy);
  assert.equal(resting.npcs[0].activity, 'lunch', 'The official lunch hour takes precedence over a personal order');
});

test('NPC needs remain bounded across complete office days and empty nights', () => {
  let state = workingOffice(); state.npcs[0].energy = 10;
  state = advance(state, 2880);
  for (const npc of state.npcs) for (const key of ['energy', 'focus', 'social'] as const) assert.ok(npc[key] >= 0 && npc[key] <= 100);
});

test('legacy saves migrate and malformed saves recover without invalid scene data', () => {
  const legacy = parseSave(JSON.stringify({ gameDay: 4, gameMinute: 800, credits: 2000, mode: 'avatar', roomId: 6 }));
  assert.equal(legacy.simulation.gameDay, 4); assert.equal(legacy.simulation.credits, 2000); assert.equal(legacy.roomId, 6);
  for (const json of ['{broken', 'null', '[]', '{"roomId":99,"gameMinute":-1}', '{"version":2,"simulation":{"npcs":[null]}}']) {
    const save = parseSave(json);
  assert.equal(save.version, 5); assert.equal(save.simulation.npcs.length, 10);
    assert.ok(save.roomId < 11); assert.ok(isWalkable(save.avatar));
  }
});

test('save restores NPC needs, work progress, positions, orders, and avatar with valid resumed routes', () => {
  const save = defaultSave(); save.simulation = workingOffice();
  save.simulation = stepSimulation(assignActivity(save.simulation, 0, 'break'), 5, 2);
  save.avatar = station(4, 0); save.mode = 'avatar'; save.speed = 0;
  const restored = parseSave(JSON.stringify(save));
  assert.deepEqual(restored.avatar, save.avatar); assert.equal(restored.mode, 'avatar'); assert.equal(restored.speed, 0);
  for (let index = 0; index < 8; index++) {
    const first = restored.simulation.npcs[index], second = save.simulation.npcs[index];
    assert.deepEqual(first.position, second.position);
    assert.equal(first.energy, second.energy);
    assert.equal(first.workMinutes, second.workMinutes);
    assert.deepEqual(first.override, second.override);
    assert.deepEqual(moveAlong(first.position, first.path, 1000).position, activityGoal(restored.simulation, index));
  }
  const idle = defaultSave(); idle.simulation = workingOffice();
  const reloaded = parseSave(JSON.stringify(idle));
  assert.ok(reloaded.simulation.npcs.every((npc) => npc.path.length === 0));
});
