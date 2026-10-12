import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, defaultSave, loadGame, PREVIOUS_KEY, SAVE_KEY } from '../src/simulation.ts';

test('brand migration retains a saved office and prefers the current save when both keys exist', t => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map<string,string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null } });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else Reflect.deleteProperty(globalThis,'localStorage'); });
  const prior = { ...defaultSave(), simulation: createSimulation(3,600), savedAt: '2026-10-12T03:00:00.000Z' };
  prior.simulation.credits = 12480;
  prior.simulation.events = ['Selamat datang di VANDERLEINZ HQ!'];
  storage.set(PREVIOUS_KEY,JSON.stringify(prior));
  const migrated = loadGame();
  assert.equal(migrated.simulation.gameDay,3);
  assert.equal(migrated.simulation.credits,12480);
  assert.equal(migrated.savedAt,prior.savedAt);
  assert.equal(migrated.simulation.events[0],'Selamat datang di Blue and Space!');
  const current = { ...prior, simulation: { ...prior.simulation, credits: 12900 } };
  storage.set(SAVE_KEY,JSON.stringify(current));
  assert.equal(loadGame().simulation.credits,12900);
  storage.clear();
  storage.set('vanderleinz-hq-milestone-4',JSON.stringify({ ...prior, version:4 }));
  assert.equal(loadGame().simulation.credits,12480);
});
