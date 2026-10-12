import { useSyncExternalStore } from 'react';
import { getCharacterRevision, subscribeCharacterRevision } from './characterProfiles.ts';

/** Appearance edits update both office and Studio without restarting the simulation. */
export function useCharacterRevision() {
  return useSyncExternalStore(subscribeCharacterRevision, getCharacterRevision, () => 0);
}
