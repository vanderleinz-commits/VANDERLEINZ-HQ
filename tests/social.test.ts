import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, stepSimulation, defaultSave, parseSave, assignActivity } from '../src/simulation.ts';
import { requestInteraction, cancelInteraction, bondKey, dialogueFor, interactionGoal } from '../src/social.ts';
import type { InteractionKind } from '../src/social.ts';
import { isWalkable, roomAt } from '../src/navigation.ts';

const advance = (sim: ReturnType<typeof createSimulation>, minutes: number) => {
  for (let i = 0; i < minutes * 5; i++) sim = stepSimulation(sim, 0.2, 1);
  return sim;
};
test('paired NPCs walk safely, wait for each other, exchange turns, then gain a relationship', () => {
  const original = createSimulation(); const snapshot = structuredClone(original);
  let sim = requestInteraction(original, 0, 1, 'chat');
  assert.deepEqual(original, snapshot, 'Commands must not mutate a previous frame');
  assert.equal(sim.encounters[0].phase, 'approach');
  assert.equal(sim.bonds[bondKey(0, 1)], 25);
  let reached = false, sawReply = false;
  for (let i = 0; i < 300; i++) {
    sim = stepSimulation(sim, 0.2, 1);
    for (const n of sim.npcs) assert.ok(isWalkable(n.position));
    const e = sim.encounters[0];
    if (e?.phase === 'talking') {
      reached = true;
      for (const index of e.participants) assert.equal(roomAt(sim.npcs[index].position), 5);
      if (dialogueFor(e).speaker === 1) sawReply = true;
    }
  }
  assert.ok(reached); assert.ok(sawReply);
  assert.equal(sim.completedInteractions, 1); assert.equal(sim.bonds[bondKey(0, 1)], 33);
  assert.ok(sim.npcs[0].social > original.npcs[0].social);
});
test('all three interaction kinds complete from distant rooms and have distinct benefits', () => {
  for (const kind of ['chat', 'brainstorm', 'encourage'] as InteractionKind[]) {
    const base = createSimulation(); base.npcs[1].focus = 35; base.npcs[1].energy = 40;
    const sim = advance(requestInteraction(base, 1, 5, kind), 60);
    assert.equal(sim.completedInteractions, 1, kind); assert.equal(sim.encounters.length, 0);
    assert.ok(sim.npcs[1].focus > 35 || kind === 'chat');
    assert.equal(sim.bonds[bondKey(1, 5)], kind === 'encourage' ? 35 : 33);
  }
});
test('busy and invalid participants cannot enter a second encounter', () => {
  const sim = requestInteraction(createSimulation(), 0, 1, 'chat');
  for (const [a, b] of [[0, 2], [3, 1], [2, 2], [-1, 5], [6, 4]]) assert.equal(requestInteraction(sim, a, b, 'chat'), sim);
});
test('shared rooms automatically socialize, reserve separate spots, and mix partners', () => {
  let sim = createSimulation(1, 1080); sim.npcs.forEach((n) => { n.nextSocialAt = 0; });
  sim = stepSimulation(sim, 0.2, 1);
  assert.equal(sim.encounters.length, 3);
  assert.equal(new Set(sim.encounters.map((e) => e.slot)).size, 3);
  const targets = sim.encounters.flatMap((e) => e.participants.map((i) => JSON.stringify(interactionGoal(e, i))));
  assert.equal(new Set(targets).size, 6);
  sim = advance(sim, 240);
  assert.ok(sim.completedInteractions >= 6);
  assert.ok(Object.values(sim.bonds).filter((v) => v > 25).length > 3, 'NPCs should meet more than the same three partners');
});
test('pause freezes encounters; personal orders cancel both participants safely', () => {
  const sim = advance(requestInteraction(createSimulation(), 0, 1, 'brainstorm'), 15);
  assert.deepEqual(stepSimulation(sim, 100, 0), sim);
  const cancelled = assignActivity(sim, 0, 'work');
  assert.equal(cancelled.encounters.length, 0); assert.equal(cancelled.npcs[0].override?.activity, 'work');
  assert.ok(cancelled.npcs[1].nextSocialAt > 0); assert.equal(cancelled.completedInteractions, 0);
  assert.equal(cancelInteraction(createSimulation(), 0).encounters.length, 0);
});
test('active conversations survive save/reload with participants, phase, bonds and remaining time', () => {
  const save = defaultSave();
  save.simulation = requestInteraction(save.simulation, 0, 1, 'chat');
  for (let i = 0; i < 200 && save.simulation.encounters[0]?.phase !== 'talking'; i++) save.simulation = stepSimulation(save.simulation, 0.2, 1);
  save.simulation = advance(save.simulation, 2);
  assert.equal(save.simulation.encounters[0].phase, 'talking');
  const restored = parseSave(JSON.stringify(save));
  assert.deepEqual(restored.simulation.encounters, save.simulation.encounters);
  assert.deepEqual(restored.simulation.bonds, save.simulation.bonds);
  assert.deepEqual(restored.simulation.events, save.simulation.events);
  const resumed = advance(restored.simulation, 30);
  assert.equal(resumed.completedInteractions, 1);
});
test('milestone 2 saves migrate without losing time, money, needs or orders', () => {
  const save = defaultSave(); save.simulation = advance(assignActivity(save.simulation, 2, 'break'), 5);
  const legacy = JSON.parse(JSON.stringify(save)); legacy.version = 2;
  delete legacy.simulation.bonds; delete legacy.simulation.encounters;
  const loaded = parseSave(JSON.stringify(legacy));
  assert.equal(loaded.version, 3); assert.equal(loaded.simulation.credits, save.simulation.credits);
  assert.equal(loaded.simulation.npcs[2].energy, save.simulation.npcs[2].energy);
  assert.deepEqual(loaded.simulation.npcs[2].override, save.simulation.npcs[2].override);
  assert.equal(Object.keys(loaded.simulation.bonds).length, 15);
});
test('corrupt, duplicate and expired encounters are rejected', () => {
  const save = defaultSave(); save.simulation = requestInteraction(save.simulation, 0, 1, 'chat');
  const raw = JSON.parse(JSON.stringify(save));
  raw.simulation.encounters.push({ ...raw.simulation.encounters[0], participants: [0, 2], id: 2 });
  raw.simulation.encounters.push({ ...raw.simulation.encounters[0], participants: [3, 4], id: 3, slot: 8 });
  raw.simulation.bonds['0:1'] = -999;
  const loaded = parseSave(JSON.stringify(raw));
  assert.equal(loaded.simulation.encounters.length, 1); assert.equal(loaded.simulation.bonds['0:1'], 25);
  raw.simulation.encounters[0].timeout = 0;
  assert.equal(parseSave(JSON.stringify(raw)).simulation.encounters.length, 1); // The valid second entry can replace the expired first.
});
