import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignActivity, createSimulation, defaultSave, parseSave, schedule, stepSimulation } from '../src/simulation.ts';
import { findPath, isWalkable, moveAlong, moveAvatar, roomAt, station } from '../src/navigation.ts';
import { rooms } from '../src/worldData.ts';

test('1x = one game day per 24 real minutes; 2x, 3x and rollover', () => {
  for (const speed of [1, 2, 3]) {
    const after = stepSimulation(createSimulation(3, 1439), 1, speed);
    assert.equal(after.gameDay, 4);
    assert.equal(after.gameMinute, speed - 1);
  }
  let state = createSimulation();
  for (let i = 0; i < 1440; i++) state = stepSimulation(state, 1, 1);
  assert.equal(state.gameDay, 2);
  assert.equal(state.gameMinute, 480);
});
test('pause freezes time, NPC motion, needs, and income', () => {
  const state = assignActivity(createSimulation(), 0, 'break');
  assert.deepEqual(stepSimulation(state, 30, 0), state);
});
test('every room and all six shared activity spots connect through open doors', () => {
  for (const room of rooms) for (let i = 0; i < 6; i++) {
    const destination = station(room.id, i);
    const path = findPath([-7.4, 0], destination);
    assert.ok(path.length > 0, `No route to room ${room.id}, station ${i}: ${destination}`);
    assert.equal(roomAt(destination), room.id);
    for (let j = 1; j < path.length; j++) {
      assert.ok(isWalkable(path[j]));
      assert.ok(isWalkable([(path[j][0] + path[j - 1][0]) / 2, (path[j][1] + path[j - 1][1]) / 2]));
    }
    assert.deepEqual(moveAlong([-7.4, 0], path, 1000).position, destination);
  }
});
test('avatar cannot tunnel through walls or furniture, including long frames', () => {
  const p = station(0, 0);
  const moved = moveAvatar(p, 100, 0);
  assert.equal(roomAt(moved), 0);
  assert.ok(isWalkable(moved));
  const furniture = moveAvatar(station(0, 1), 0, -3);
  assert.ok(furniture[1] > -3);
  assert.ok(isWalkable(furniture));
});
test('schedule changes at exact boundaries and NPCs arrive for lunch', () => {
  assert.equal(schedule(599.99), 'work'); assert.equal(schedule(600), 'meeting');
  assert.equal(schedule(720), 'lunch'); assert.equal(schedule(780), 'work');
  assert.equal(schedule(900), 'break'); assert.equal(schedule(930), 'work');
  assert.equal(schedule(1080), 'rest'); assert.equal(schedule(0), 'rest');
  let state = createSimulation(1, 719);
  state.npcs.forEach((npc) => { npc.nextSocialAt = 2000; });
  for (let i = 0; i < 40; i++) state = stepSimulation(state, 1, 1);
  for (const npc of state.npcs) {
    assert.equal(npc.activity, 'lunch'); assert.equal(roomAt(npc.position), 5); assert.equal(npc.path.length, 0);
  }
});
test('work earns virtual credits and breaks restore needs after arrival', () => {
  const before = createSimulation();
  const after = stepSimulation(before, 60, 1);
  assert.equal(after.credits, before.credits + 60);
  assert.ok(after.npcs[0].energy < before.npcs[0].energy);
  let resting = assignActivity(after, 0, 'break');
  for (let i = 0; i < 50; i++) resting = stepSimulation(resting, 1, 1);
  assert.equal(roomAt(resting.npcs[0].position), 5);
  assert.ok(resting.npcs[0].energy > after.npcs[0].energy);
  for (let i = 0; i < 11; i++) resting = stepSimulation(resting, 1, 1);
  assert.equal(resting.npcs[0].override, null);
  assert.equal(resting.npcs[0].activity, 'meeting');
});
test('exhausted NPC takes an automatic break and needs stay bounded over two days', () => {
  let state = createSimulation(); state.npcs[0].energy = 10;
  state = stepSimulation(state, 1, 1);
  assert.equal(state.npcs[0].activity, 'break');
  for (let i = 0; i < 2880; i++) state = stepSimulation(state, 1, 1);
  for (const npc of state.npcs) for (const key of ['energy', 'focus', 'social'] as const) assert.ok(npc[key] >= 0 && npc[key] <= 100);
});
test('legacy saves migrate; malformed saves recover without invalid scene data', () => {
  const legacy = parseSave(JSON.stringify({ gameDay: 4, gameMinute: 800, credits: 2000, mode: 'avatar', roomId: 6 }));
  assert.equal(legacy.simulation.gameDay, 4); assert.equal(legacy.simulation.credits, 2000); assert.equal(legacy.roomId, 6);
  for (const json of ['{broken', 'null', '[]', '{"roomId":99,"gameMinute":-1}', '{"version":2,"simulation":{"npcs":[null]}}']) {
    const save = parseSave(json); assert.equal(save.simulation.npcs.length, 6); assert.ok(save.roomId < 8); assert.ok(isWalkable(save.avatar));
  }
});
test('save restores NPC needs, work progress, positions, orders and avatar', () => {
  const save = defaultSave();
  save.simulation = stepSimulation(assignActivity(save.simulation, 0, 'break'), 5, 2);
  save.avatar = station(4, 0); save.mode = 'avatar'; save.speed = 0;
  const restored = parseSave(JSON.stringify(save));
  assert.deepEqual(restored.avatar, save.avatar); assert.equal(restored.mode, 'avatar'); assert.equal(restored.speed, 0);
  for (let i = 0; i < 6; i++) {
    const a = restored.simulation.npcs[i], b = save.simulation.npcs[i];
    assert.deepEqual(a.position, b.position); assert.equal(a.energy, b.energy); assert.equal(a.workMinutes, b.workMinutes); assert.deepEqual(a.override, b.override);
    const arrived = moveAlong(a.position, a.path, 1000); assert.deepEqual(arrived.position, station(a.destination, i));
  }
  const idle = defaultSave();
  const reloaded = parseSave(JSON.stringify(idle));
  assert.ok(reloaded.simulation.npcs.every((npc) => npc.path.length === 0), 'Stationary NPCs stay stationary after reload');
});
