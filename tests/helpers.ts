import { createSimulation, stepSimulation, absoluteMinute } from '../src/simulation.ts';
import type { Simulation } from '../src/simulation.ts';

// Individual behavior tests disable unrelated random events, then opt into the event under test.
export function quietSimulation(sim: Simulation, finishMeeting = true): Simulation {
  if (finishMeeting) sim.meeting.phase = 'done';
  Object.assign(sim, { nextManagementAt: 1e8, nextIssueAt: 1e8, nextClientAt: 1e8 });
  Object.assign(sim.services,{nextCoffeeAt:1e8,nextCleaningAt:1e8,catering:{phase:'ready',elapsed:24}});
  sim.npcs.forEach((npc) => Object.assign(npc, { nextLeisureAt: 1e8, nextSocialAt: absoluteMinute(sim) + 200, duty: null }));
  return sim;
}
export const calmOffice = (minute = 600, day = 1) => quietSimulation(createSimulation(day, minute));
export function advance(sim: Simulation, minutes: number): Simulation {
  for (let tick = 0; tick < minutes * 2; tick++) sim = stepSimulation(sim, .5, 1);
  return sim;
}
