import { staff } from './worldData.ts';
import { findPath, isWalkable, moveAlong, nearestWalkable, station } from './navigation.ts';
import type { Point } from './navigation.ts';
import { initialBonds, encounterFor, interactionGoal, advanceSocial, cancelInteraction, interactionLabels, interactionDuration } from './social.ts';
import type { Encounter } from './social.ts';

export type Activity = 'work' | 'meeting' | 'break' | 'lunch' | 'rest';
export const activityLabels: Record<Activity, string> = { work: 'Bekerja', meeting: 'Rapat tim', break: 'Istirahat', lunch: 'Makan siang', rest: 'Waktu santai' };
export type NpcState = {
  name: string; position: Point; path: Point[]; activity: Activity; destination: number;
  energy: number; focus: number; social: number; workMinutes: number; nextSocialAt: number; greetUntil: number;
  override: { activity: 'work' | 'break'; until: number } | null;
};
export type Simulation = { gameDay: number; gameMinute: number; credits: number; npcs: NpcState[]; events: string[]; encounters: Encounter[]; bonds: Record<string, number>; completedInteractions: number; nextEncounterId: number };
export type SaveData = { version: 3; simulation: Simulation; roomId: number; mode: 'director' | 'avatar'; avatar: Point; speed: number; reducedMotion: boolean; savedAt: string };
export const SAVE_KEY = 'vanderleinz-hq-milestone-3';
export const PREVIOUS_KEY = 'vanderleinz-hq-milestone-2';
export const LEGACY_KEY = 'vanderleinz-hq-milestone-1';
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function schedule(minute: number): Activity {
  if (minute < 480 || minute >= 1080) return 'rest';
  if (minute >= 600 && minute < 660) return 'meeting';
  if (minute >= 720 && minute < 780) return 'lunch';
  if (minute >= 900 && minute < 930) return 'break';
  return 'work';
}
const destinationFor = (activity: Activity, index: number) => activity === 'work' ? staff[index].roomId : activity === 'meeting' ? 2 : 5;
export function createSimulation(day = 1, minute = 480, credits = 1250): Simulation {
  return { gameDay: day, gameMinute: minute, credits, encounters: [], bonds: initialBonds(), completedInteractions: 0, nextEncounterId: 1, events: ['Selamat datang kembali di HQ. Tim siap memulai hari.'], npcs: staff.map((person, i) => {
    const activity = schedule(minute), destination = destinationFor(activity, i);
    return { name: person.name, position: station(destination, i), path: [], activity, destination, energy: 85, focus: 90, social: 75, workMinutes: 0, greetUntil: 0, nextSocialAt: (day - 1) * 1440 + minute + 15 + i * 3, override: null };
  }) };
}
export const absoluteMinute = (sim: Simulation) => (sim.gameDay - 1) * 1440 + sim.gameMinute;
export function stepSimulation(current: Simulation, realSeconds: number, speed: number): Simulation {
  if (speed === 0 || realSeconds <= 0) return current;
  const elapsed = realSeconds * speed;
  const total = current.gameMinute + elapsed;
  const gameDay = current.gameDay + Math.floor(total / 1440), gameMinute = total % 1440;
  const now = (gameDay - 1) * 1440 + gameMinute;
  let credits = current.credits;
  const events = [...current.events];
  const npcs = current.npcs.map((npc, i) => {
    let override = npc.override && npc.override.until > now ? npc.override : null;
    if (!override && schedule(gameMinute) === 'work' && (npc.energy < 25 || npc.focus < 20)) override = { activity: 'break', until: now + 60 };
    const encounter = encounterFor(current, i);
    const plannedActivity = override?.activity ?? schedule(gameMinute);
    const activity = encounter ? encounter.roomId === 2 ? 'meeting' : plannedActivity === 'lunch' ? 'lunch' : 'break' : plannedActivity;
    const destination = encounter?.roomId ?? destinationFor(activity, i);
    let path = npc.path;
    if (destination !== npc.destination || activity !== npc.activity) {
      path = findPath(npc.position, encounter ? interactionGoal(encounter, i) : station(destination, i));
      events.unshift(`${npc.name} → ${activityLabels[activity].toLowerCase()}`);
    }
    const movement = moveAlong(npc.position, path, elapsed * 1.4);
    const travelling = movement.path.length > 0;
    const working = !travelling && activity === 'work';
    const activeElapsed = Math.max(0, elapsed - movement.distanceUsed / 1.4);
    const relaxing = !travelling && ['break', 'lunch', 'rest'].includes(activity);
    const socializing = !travelling && activity !== 'work';
    const energy = clamp(npc.energy + elapsed * (relaxing ? 0.45 : -0.065));
    const focus = clamp(npc.focus + elapsed * (relaxing ? 0.65 : working ? -0.12 : -0.025));
    const social = clamp(npc.social + elapsed * (socializing ? 0.35 : -0.035));
    let workMinutes = npc.workMinutes + (working ? activeElapsed : 0);
    if (workMinutes >= 60) {
      const rewards = Math.floor(workMinutes / 60);
      credits += rewards * 10;
      workMinutes %= 60;
      events.unshift(`${npc.name} menyelesaikan pekerjaan · +${rewards * 10} HQ Credits`);
    }
    return { ...npc, position: movement.position, path: movement.path, activity, destination, override, energy, focus, social, workMinutes };
  });
  return advanceSocial({ ...current, gameDay, gameMinute, credits, npcs, events: events.slice(0, 6) }, elapsed);
}
export function assignActivity(sim: Simulation, index: number, activity: 'work' | 'break'): Simulation {
  sim = cancelInteraction(sim, index);
  return { ...sim, npcs: sim.npcs.map((npc, i) => i === index ? { ...npc, override: { activity, until: absoluteMinute(sim) + 60 } } : npc) };
}
export function greet(sim: Simulation, index: number): Simulation {
  return { ...sim, npcs: sim.npcs.map((npc, i) => i === index ? { ...npc, social: clamp(npc.social + 12), greetUntil: absoluteMinute(sim) + 4 } : npc), events: [`${staff[index].name}: Senang bertemu kamu! Semangat untuk hari ini.`, ...sim.events].slice(0, 5) };
}

const finite = (value: unknown, min: number, max: number, fallback: number): number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const validPoint = (value: unknown): value is Point => Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === 'number' && Number.isFinite(v)) && isWalkable(value as Point);

export function defaultSave(): SaveData {
  return { version: 3, simulation: createSimulation(), roomId: 0, mode: 'director', avatar: nearestWalkable([-7.35, -1.3]), speed: 1, reducedMotion: false, savedAt: '' };
}
export function parseSave(json: string | null): SaveData {
  const fallback = defaultSave();
  if (!json) return fallback;
  try {
    const data = record(JSON.parse(json));
    const raw = record((data.version === 2 || data.version === 3) ? data.simulation : data);
    const simulation = createSimulation(Math.floor(finite(raw.gameDay, 1, 999999, 1)), finite(raw.gameMinute, 0, 1439.999, 480), finite(raw.credits, 0, 1e12, 1250));
    if ((data.version === 2 || data.version === 3) && Array.isArray(raw.npcs)) {
      const savedNpcs = raw.npcs;
      simulation.npcs = simulation.npcs.map((npc, i) => {
        const saved = record(savedNpcs.find((item) => record(item).name === npc.name));
        const activity = Object.hasOwn(activityLabels, String(saved.activity)) ? saved.activity as Activity : npc.activity;
        const destination = destinationFor(activity, i);
        const position = validPoint(saved.position) ? saved.position : npc.position;
        const order = record(saved.override);
        const until = finite(order.until, absoluteMinute(simulation), absoluteMinute(simulation) + 60, 0);
        const override = until && (order.activity === 'work' || order.activity === 'break') ? { activity: order.activity, until } as NpcState['override'] : null;
        return { ...npc, activity, destination, position, path: findPath(position, station(destination, i)), override,
          energy: finite(saved.energy, 0, 100, 85), focus: finite(saved.focus, 0, 100, 90), social: finite(saved.social, 0, 100, 75), workMinutes: finite(saved.workMinutes, 0, 60, 0), greetUntil: finite(saved.greetUntil, 0, absoluteMinute(simulation) + 4, 0), nextSocialAt: finite(saved.nextSocialAt, 0, absoluteMinute(simulation) + 200, absoluteMinute(simulation) + 15 + i * 3) };
      });
    }
    if (data.version === 3) {
      if (Array.isArray(raw.events)) {
        const entries = raw.events.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0 && entry.length <= 240).slice(0, 6);
        if (entries.length) simulation.events = entries;
      }
      const bonds = record(raw.bonds);
      for (const key of Object.keys(simulation.bonds)) simulation.bonds[key] = finite(bonds[key], 0, 100, 25);
      simulation.completedInteractions = Math.floor(finite(raw.completedInteractions, 0, 1e9, 0));
      simulation.nextEncounterId = Math.floor(finite(raw.nextEncounterId, 1, 1e9, 1));
      const busy = new Set<number>(), reserved = new Set<string>(), usedIds = new Set<number>();
      if (Array.isArray(raw.encounters)) for (const value of raw.encounters.slice(0, 3)) {
        const e = record(value), pair = e.participants;
        if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((i) => Number.isInteger(i) && i >= 0 && i < 6) || pair[0] === pair[1] || pair.some((i) => busy.has(i))) continue;
        if (!Object.hasOwn(interactionLabels, String(e.kind)) || ![2, 5].includes(Number(e.roomId)) || typeof e.roomId !== 'number' || !Number.isInteger(e.slot) || Number(e.slot) < 0 || Number(e.slot) > 2) continue;
        const key = e.roomId + ':' + e.slot, id = Math.floor(finite(e.id, 1, 1e9, simulation.nextEncounterId));
        if (reserved.has(key) || usedIds.has(id)) continue;
        const kind = e.kind as Encounter['kind'], timeout = finite(e.timeout, absoluteMinute(simulation) + 0.001, absoluteMinute(simulation) + 100, 0);
        if (!timeout) continue;
        const encounter: Encounter = { id, participants: pair as [number, number], kind, roomId: e.roomId, slot: Number(e.slot), phase: e.phase === 'talking' ? 'talking' : 'approach', elapsed: finite(e.elapsed, 0, interactionDuration[kind] - 0.001, 0), timeout };
        const ready = pair.every((i) => Math.hypot(simulation.npcs[i].position[0] - interactionGoal(encounter, i)[0], simulation.npcs[i].position[1] - interactionGoal(encounter, i)[1]) < 0.05);
        if (!ready) encounter.phase = 'approach';
        for (const i of pair) { busy.add(i); simulation.npcs[i].destination = encounter.roomId; simulation.npcs[i].path = encounter.phase === 'talking' ? [] : findPath(simulation.npcs[i].position, interactionGoal(encounter, i)); }
        reserved.add(key); usedIds.add(id); simulation.encounters.push(encounter); simulation.nextEncounterId = Math.max(simulation.nextEncounterId, id + 1);
      }
    }
    return { version: 3, simulation, roomId: Math.floor(finite(data.roomId, 0, 7, 0)), mode: data.mode === 'avatar' ? 'avatar' : 'director', avatar: validPoint(data.avatar) ? data.avatar : fallback.avatar, speed: [0, 1, 2, 3].includes(Number(data.speed)) && typeof data.speed === 'number' ? data.speed : 1, reducedMotion: data.reducedMotion === true, savedAt: typeof data.savedAt === 'string' ? data.savedAt : '' };
  } catch { return fallback; }
}

export function loadGame(): SaveData {
  try { return parseSave(localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(PREVIOUS_KEY) ?? localStorage.getItem(LEGACY_KEY)); }
  catch { return defaultSave(); }
}
