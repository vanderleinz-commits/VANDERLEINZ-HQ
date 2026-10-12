import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, stepSimulation, defaultSave, parseSave, assignActivity, activityGoal, absoluteMinute, seatedAt } from '../src/simulation.ts';
import { requestInteraction, cancelInteraction, bondKey, dialogueFor, interactionGoal } from '../src/social.ts';
import type { InteractionKind } from '../src/social.ts';
import { findPath, isWalkable, roomAt, moveAlong } from '../src/navigation.ts';
import { quietSimulation } from './helpers.ts';
import { STAFF_WORKERS } from '../src/worldData.ts';
import { lunchSeat, lunchSlot } from '../src/officeLayout.ts';

const advance = (sim: ReturnType<typeof createSimulation>, minutes: number) => {
  for (let i = 0; i < minutes * 5; i++) sim = stepSimulation(sim, 0.2, 1);
  return sim;
};
const availableOffice = (minute = 600) => {
  return quietSimulation(createSimulation(1, minute));
};

test('paired workers reach shared chairs, exchange turns, and gain a relationship without mutating a prior frame', () => {
  const original = availableOffice();
  original.npcs[0].errandUntil = absoluteMinute(original) + 6;
  const snapshot = structuredClone(original);
  let sim = requestInteraction(original, 0, 1, 'chat');
  assert.deepEqual(original, snapshot);
  assert.equal(sim.npcs[0].errandUntil, 0, 'An interaction should end a current office errand');
  assert.equal(sim.encounters[0].phase, 'approach');
  const previousFrame = structuredClone(sim);
  stepSimulation(sim, 0.2, 1);
  assert.deepEqual(sim, previousFrame, 'Advancing movement and social state must preserve previous frames');
  let reached = false, sawReply = false;
  for (let i = 0; i < 600; i++) {
    sim = stepSimulation(sim, 0.2, 1);
    for (const npc of sim.npcs) assert.ok(isWalkable(npc.position));
    const encounter = sim.encounters[0];
    if (encounter?.phase === 'talking') {
      reached = true;
      for (const index of encounter.participants) {
        assert.equal(roomAt(sim.npcs[index].position), 5);
        assert.deepEqual(sim.npcs[index].position, interactionGoal(encounter, index));
        assert.deepEqual(seatedAt(sim, index)?.position, interactionGoal(encounter, index));
      }
      if (dialogueFor(encounter).speaker === 1) sawReply = true;
    }
  }
  assert.ok(reached); assert.ok(sawReply);
  assert.equal(sim.completedInteractions, 1);
  assert.equal(sim.bonds[bondKey(0, 1)], 33);
  assert.ok(sim.npcs[0].social > original.npcs[0].social);
});

test('chat, brainstorm, and encouragement complete from different departments and have distinct benefits', () => {
  for (const kind of ['chat', 'brainstorm', 'encourage'] as InteractionKind[]) {
    const base = availableOffice(540); base.npcs[1].focus = 35; base.npcs[1].energy = 40;
    const sim = advance(requestInteraction(base, 1, 5, kind), 150);
    assert.equal(sim.completedInteractions, 1, kind);
    assert.equal(sim.encounters.length, 0);
    assert.equal(sim.bonds[bondKey(1, 5)], kind === 'encourage' ? 35 : 33);
    assert.ok(sim.npcs[1].focus > 35 || kind === 'chat');
  }
});

test('busy workers, Amanda, absent workers, office closure, and a daily meeting reject pair commands', () => {
  const sim = requestInteraction(availableOffice(), 0, 1, 'chat');
  for (const [a, b] of [[0, 2], [3, 1], [2, 2], [-1, 5], [6, 4]]) assert.equal(requestInteraction(sim, a, b, 'chat'), sim);
  const absent = availableOffice(); absent.npcs[2].presence = 'offsite';
  assert.equal(requestInteraction(absent, 2, 3, 'chat'), absent);
  const closed = createSimulation(1, 1080);
  assert.equal(requestInteraction(closed, 0, 1, 'chat'), closed);
  const meeting = availableOffice(); meeting.meeting.phase = 'gathering';
  assert.equal(requestInteraction(meeting, 0, 1, 'chat'), meeting);
  const lunch = availableOffice(725);
  assert.equal(requestInteraction(lunch, 0, 1, 'brainstorm'), lunch);
  assert.equal(requestInteraction(lunch, 0, 1, 'chat', 2), lunch);
});

test('Felin can join worker conversations and has bonds with all six colleagues', () => {
  const base = availableOffice(540);
  let sim = requestInteraction(base, 7, 4, 'chat');
  assert.equal(sim.encounters.length, 1);
  assert.equal(Object.keys(sim.bonds).length, 36);
  sim = advance(sim, 150);
  assert.equal(sim.completedInteractions, 1);
  assert.equal(sim.bonds[bondKey(7, 4)], 33);
});

test('a pantry conversation leaves an unrelated worker’s break chair free', () => {
  const base=availableOffice();
  base.npcs[0].override={activity:'break',until:absoluteMinute(base)+45};
  base.npcs[0].breakPlan={day:1,kind:'pantry',slot:lunchSlot(0)};
  base.npcs[0].position=lunchSeat(lunchSlot(0)).position;
  base.npcs[0].path=[];
  const sim=requestInteraction(base,1,2,'chat');
  assert.equal(sim.encounters.length,1);
  assert.deepEqual(sim.encounters[0].chairs,[lunchSlot(1),lunchSlot(2)]);
  for(const participant of [1,2])assert.notDeepEqual(interactionGoal(sim.encounters[0],participant),base.npcs[0].position);
});

test('a conversation reserves incoming break seats before the other employee arrives', () => {
  const base=availableOffice();
  base.npcs[1].override={activity:'break',until:absoluteMinute(base)+45};
  base.npcs[1].breakPlan={day:1,kind:'pantry',slot:lunchSlot(1)};
  base.npcs[1].path=findPath(base.npcs[1].position,lunchSeat(lunchSlot(1)).position);
  base.npcs[3].position=lunchSeat(lunchSlot(0)).position;base.npcs[3].path=[];
  const sim=requestInteraction(base,0,2,'chat');
  assert.equal(sim.encounters.length,1);
  assert.ok(!sim.encounters[0].chairs.includes(lunchSlot(1)));
  assert.ok(!sim.encounters[0].chairs.includes(lunchSlot(0)));
});

test('pantry break attendees can form four pairs with distinct chair anchors and leave Amanda at reception', () => {
  let sim = availableOffice(725);
  sim.npcs.forEach((npc) => { npc.nextSocialAt = 0; });
  for (const index of STAFF_WORKERS){sim.npcs[index].position = lunchSeat(lunchSlot(index)).position;sim.npcs[index].breakPlan={day:1,kind:'pantry',slot:lunchSlot(index)};}
  const amanda = structuredClone(sim.npcs[6].position);
  sim = stepSimulation(sim, 0.2, 1);
  assert.equal(sim.encounters.length, 4);
  assert.equal(new Set(sim.encounters.map((e) => e.slot)).size, 4);
  const goals = sim.encounters.flatMap((e) => e.participants.map((i) => JSON.stringify(interactionGoal(e, i))));
  assert.equal(new Set(goals).size, 8);
  assert.ok(sim.encounters.every((e) => e.participants.every((i) => i!==6&&i<10)));
  sim = advance(sim, 30);
  assert.equal(sim.completedInteractions, 4);
  assert.deepEqual(sim.npcs[6].position, amanda);
});

test('pause freezes conversations and cancelling an interaction restores both normal work goals', () => {
  const sim = advance(requestInteraction(availableOffice(), 0, 1, 'brainstorm'), 15);
  assert.deepEqual(stepSimulation(sim, 100, 0), sim);
  const cancelled = assignActivity(sim, 0, 'work');
  assert.equal(cancelled.encounters.length, 0);
  assert.equal(cancelled.npcs[0].override?.activity, 'work');
  assert.ok(cancelled.npcs[1].nextSocialAt > absoluteMinute(sim));
  assert.equal(cancelled.completedInteractions, 0);
  const settled = stepSimulation(cancelled, 0.2, 1);
  for (const index of [0, 1]) {
    const npc = settled.npcs[index];
    assert.deepEqual(moveAlong(npc.position, npc.path, 1000).position, activityGoal(settled, index));
  }
});

test('lunch end, meeting start, and office closure cancel conversations without granting completion rewards', () => {
  for (const boundary of [780, 1020]) {
    let sim = availableOffice(boundary - 1);
    sim = requestInteraction(sim, 0, 1, 'chat');
    assert.equal(sim.encounters.length, 1);
    sim = stepSimulation(sim, 1, 1);
    assert.equal(sim.encounters.length, 0);
    assert.equal(sim.completedInteractions, 0);
    assert.equal(sim.bonds[bondKey(0, 1)], 25);
  }
  let meeting = availableOffice(600);
  meeting.meeting = { ...meeting.meeting, start: 601, phase: 'scheduled' };
  meeting = requestInteraction(meeting, 0, 1, 'chat');
  meeting = stepSimulation(meeting, 1, 1);
  assert.equal(meeting.encounters.length, 0);
  assert.equal(meeting.completedInteractions, 0);
  assert.equal(meeting.meeting.phase, 'gathering');
});

test('active conversations survive version 5 save/reload with participant chairs, phase, bonds, and remaining time', () => {
  const save = defaultSave(); save.simulation = requestInteraction(availableOffice(), 0, 1, 'chat');
  for (let i = 0; i < 500 && save.simulation.encounters[0]?.phase !== 'talking'; i++) save.simulation = stepSimulation(save.simulation, 0.2, 1);
  save.simulation = advance(save.simulation, 2);
  assert.equal(save.simulation.encounters[0].phase, 'talking');
  const restored = parseSave(JSON.stringify(save));
  assert.deepEqual(restored.simulation.encounters, save.simulation.encounters);
  assert.deepEqual(restored.simulation.bonds, save.simulation.bonds);
  assert.deepEqual(restored.simulation.events, save.simulation.events);
  assert.equal(advance(restored.simulation, 30).completedInteractions, 1);
});

test('corrupt, duplicate, Amanda, and expired encounters are rejected on load', () => {
  const save = defaultSave(); save.simulation = requestInteraction(availableOffice(), 0, 1, 'chat');
  const raw = JSON.parse(JSON.stringify(save));
  raw.simulation.encounters.push({ ...raw.simulation.encounters[0], participants: [0, 2], id: 2 });
  raw.simulation.encounters.push({ ...raw.simulation.encounters[0], participants: [3, 6], chairs: [2, 3], id: 3, slot: 2 });
  raw.simulation.bonds['0:1'] = -999;
  const loaded = parseSave(JSON.stringify(raw));
  assert.equal(loaded.simulation.encounters.length, 1);
  assert.equal(loaded.simulation.bonds['0:1'], 25);
  raw.simulation.encounters[0].timeout = 0;
  assert.equal(parseSave(JSON.stringify(raw)).simulation.encounters.length, 1);
  assert.equal(cancelInteraction(availableOffice(), 0).encounters.length, 0);
});
