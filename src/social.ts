import { staff } from './worldData.ts';
import { findPath, roomAt, station } from './navigation.ts';
import type { Point } from './navigation.ts';
import type { Simulation } from './simulation.ts';

export type InteractionKind = 'chat' | 'brainstorm' | 'encourage';
export const interactionLabels: Record<InteractionKind, string> = { chat: 'Ngobrol santai', brainstorm: 'Brainstorm bersama', encourage: 'Beri semangat' };
export const interactionDuration: Record<InteractionKind, number> = { chat: 14, brainstorm: 20, encourage: 12 };
export type Encounter = { id: number; participants: [number, number]; kind: InteractionKind; roomId: number; slot: number; phase: 'approach' | 'talking'; elapsed: number; timeout: number };
const nowOf = (s: Simulation) => (s.gameDay - 1) * 1440 + s.gameMinute;
const clamp = (v: number) => Math.min(100, Math.max(0, v));
export const bondKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
export const bondLabel = (value: number) => value >= 70 ? 'Kompak' : value >= 40 ? 'Akrab' : 'Mulai kenal';
export function initialBonds(): Record<string, number> {
  const bonds: Record<string, number> = {};
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) bonds[bondKey(a, b)] = 25;
  return bonds;
}
export const encounterFor = (s: Simulation, index: number) => s.encounters.find((e) => e.participants.includes(index));
export const interactionGoal = (e: Encounter, index: number): Point => station(e.roomId, e.slot + (e.participants[0] === index ? 0 : 3));

const ideas = ['Kita rapikan alur kerja, yuk.', 'Bagaimana kalau pakai warna lebih hangat?', 'Tim juga butuh ruang untuk bernapas.', 'Aku sudah menemukan pola yang menarik.', 'Kita rayakan langkah kecil hari ini.', 'Sistemnya bisa kita buat lebih sederhana.'];
const replies = ['Aku bantu susun langkahnya.', 'Aku bisa buatkan sketsanya!', 'Aku akan ajak tim ikut mencoba.', 'Mari kita cek hasilnya bersama.', 'Siap, kita kerjakan pelan-pelan.', 'Aku bantu bagian teknisnya.'];
const smallTalk = ['Hari ini kantor terasa tenang.', 'Aku punya ide untuk sudut kreatif!', 'Bagaimana kabarmu hari ini?', 'Aku menemukan hal menarik tadi.', 'Mau rehat sambil ngobrol?', 'Server aman. Waktunya rehat.'];
export function dialogueFor(e: Encounter): { speaker: number; text: string } {
  const turn = Math.floor(e.elapsed / 4) % 3;
  const [a, b] = e.participants;
  if (e.kind === 'brainstorm') return turn === 0 ? { speaker: a, text: ideas[a] } : turn === 1 ? { speaker: b, text: replies[b] } : { speaker: a, text: 'Setuju! Kita coba langkah itu.' };
  if (e.kind === 'encourage') return turn === 0 ? { speaker: a, text: 'Kamu sudah bekerja dengan baik.' } : turn === 1 ? { speaker: b, text: 'Terima kasih. Aku jadi semangat!' } : { speaker: a, text: 'Kita saling bantu, ya.' };
  return turn === 0 ? { speaker: a, text: smallTalk[a] } : turn === 1 ? { speaker: b, text: smallTalk[b] } : { speaker: a, text: 'Senang bisa ngobrol denganmu.' };
}

export function requestInteraction(sim: Simulation, a: number, b: number, kind: InteractionKind, roomOverride?: number): Simulation {
  if (![a, b].every((i) => Number.isInteger(i) && i >= 0 && i < 6) || a === b || !Object.hasOwn(interactionLabels, kind) || encounterFor(sim, a) || encounterFor(sim, b)) return sim;
  const roomId = roomOverride === 2 || roomOverride === 5 ? roomOverride : kind === 'brainstorm' ? 2 : 5;
  const used = sim.encounters.filter((e) => e.roomId === roomId).map((e) => e.slot);
  const slot = [0, 1, 2].find((i) => !used.includes(i));
  if (slot === undefined) return sim;
  const e: Encounter = { id: sim.nextEncounterId, participants: [a, b], kind, roomId, slot, phase: 'approach', elapsed: 0, timeout: nowOf(sim) + 100 };
  const npcs = sim.npcs.map((npc, i) => i === a || i === b ? { ...npc, override: null, destination: roomId, path: findPath(npc.position, interactionGoal(e, i)) } : npc);
  return { ...sim, npcs, encounters: [...sim.encounters, e], nextEncounterId: sim.nextEncounterId + 1,
    events: [`${staff[a].name} & ${staff[b].name} → ${interactionLabels[kind].toLowerCase()}`, ...sim.events].slice(0, 6) };
}

export function cancelInteraction(sim: Simulation, index: number): Simulation {
  const e = encounterFor(sim, index);
  if (!e) return sim;
  return { ...sim, encounters: sim.encounters.filter((item) => item.id !== e.id),
    npcs: sim.npcs.map((npc, i) => e.participants.includes(i) ? { ...npc, path: findPath(npc.position, station(npc.destination, i)), nextSocialAt: nowOf(sim) + 45 } : npc),
    events: [`${staff[e.participants[0]].name} & ${staff[e.participants[1]].name} kembali ke kegiatan masing-masing.`, ...sim.events].slice(0, 6) };
}

export function advanceSocial(sim: Simulation, elapsed: number): Simulation {
  let result = { ...sim, npcs: sim.npcs.map((n) => ({ ...n })), encounters: [] as Encounter[], bonds: { ...sim.bonds }, events: [...sim.events] };
  const now = nowOf(sim);
  for (const encounter of sim.encounters) {
    const [a, b] = encounter.participants, first = result.npcs[a], second = result.npcs[b];
    const ready = !first.path.length && !second.path.length && roomAt(first.position) === encounter.roomId && roomAt(second.position) === encounter.roomId && Math.hypot(first.position[0] - second.position[0], first.position[1] - second.position[1]) < 2.1;
    let e = { ...encounter };
    if (e.phase === 'approach' && ready) {
      e = { ...e, phase: 'talking', elapsed: 0 };
      result.events.unshift(`${staff[a].name} ↔ ${staff[b].name}: ${interactionLabels[e.kind]}`);
    } else if (e.phase === 'talking' && ready) e.elapsed += elapsed;
    if (e.elapsed >= interactionDuration[e.kind] || now >= e.timeout) {
      const completed = e.elapsed >= interactionDuration[e.kind] && ready;
      if (completed) {
        result.bonds[bondKey(a, b)] = clamp(result.bonds[bondKey(a, b)] + (e.kind === 'encourage' ? 10 : 8));
        result.completedInteractions++;
        for (const index of [a, b]) {
          const npc = result.npcs[index];
          npc.social = clamp(npc.social + (e.kind === 'chat' ? 18 : 12));
          npc.focus = clamp(npc.focus + (e.kind === 'brainstorm' ? 12 : 5));
          if (e.kind === 'encourage') npc.energy = clamp(npc.energy + 8);
        }
        result.events.unshift(`${staff[a].name} & ${staff[b].name} makin akrab · ${e.kind === 'brainstorm' ? 'fokus +12' : e.kind === 'encourage' ? 'energi +8' : 'sosial +18'}`);
      } else result.events.unshift(`${staff[a].name} & ${staff[b].name}: obrolan dijadwalkan ulang.`);
      for (const index of [a, b]) {
        const npc = result.npcs[index];
        npc.nextSocialAt = Math.ceil((now + 65) / 20) * 20;
        npc.path = findPath(npc.position, station(npc.destination, index));
      }
    } else result.encounters.push(e);
  }
  // Available pairs socialize naturally in shared rooms; work and personal orders take priority.
  for (let a = 0; a < 6; a++) {
    const first = result.npcs[a];
    if (first.path.length || first.override || first.nextSocialAt > now || encounterFor(result, a) || first.activity === 'work') continue;
    const room = roomAt(first.position);
    if (room !== 2 && room !== 5) continue;
    const candidates = Array.from({ length: 5 - a }, (_, i) => a + i + 1).sort((b, c) => result.bonds[bondKey(a, b)] - result.bonds[bondKey(a, c)]);
    for (const b of candidates) {
      const second = result.npcs[b];
      if (second.path.length || second.override || second.nextSocialAt > now || encounterFor(result, b) || second.activity === 'work' || roomAt(second.position) !== room) continue;
      const kind = room === 2 ? 'brainstorm' : first.energy < 45 || second.energy < 45 ? 'encourage' : 'chat';
      result = requestInteraction(result, a, b, kind, room);
      break;
    }
  }
  return { ...result, events: result.events.slice(0, 6) };
}
