import { rooms } from './worldData.ts';
import { workSeat, clientMeetingSeat, drinkPlacement as deskDrinkPlacement, clientDrinkPlacement } from './officeLayout.ts';
import type { Point } from './navigation.ts';

export type DrinkRecipient = { kind: 'staff' | 'owner' | 'client'; id: number };
export type DrinkDelivery = { recipient: DrinkRecipient; position: Point; rotation: number; deliveredAt: number; expiresAt: number };
export type CoffeeRun = { phase: 'prepare' | 'carry' | 'deliver'; recipient: DrinkRecipient; elapsed: number; cupsRemaining: number };
export type OfficeServices = {
  day: number; coffeeRound: number; nextCoffeeAt: number; coffee: CoffeeRun | null;
  served: string[]; drinks: DrinkDelivery[]; catering: { phase: 'waiting' | 'cooking' | 'ready'; elapsed: number };
  cleaningRoom: number; nextCleaningAt: number; cleanedRooms: number[];
};
export const recipientKey = (recipient: DrinkRecipient) => recipient.kind + ':' + recipient.id;
export const newOfficeServices = (day: number, now: number): OfficeServices => ({
  day, coffeeRound: 0, nextCoffeeAt: Math.max((day - 1) * 1440 + 485, now + 5), coffee: null,
  served: [], drinks: [], catering: { phase: 'waiting', elapsed: 0 }, cleaningRoom: 0,
  nextCleaningAt: Math.max((day - 1) * 1440 + 482, now + 2), cleanedRooms: [],
});
export function drinkPlacement(recipient: DrinkRecipient, clientSlot = 1): { position: Point; rotation: number } {
  const placement=recipient.kind==='client'?clientDrinkPlacement(clientSlot):deskDrinkPlacement(recipient.kind==='owner'?-1:recipient.id);
  const rotation=recipient.kind==='client'?clientMeetingSeat(clientSlot).rotation:recipient.kind==='owner'?0:workSeat(recipient.id).rotation;
  return {position:[placement.position[0]+(recipient.kind==='staff'&&recipient.id>=8?(recipient.id===8?-.4:.4):0),placement.position[1],(placement.position[2]??0)+placement.height],rotation};
}
export const nextCleaningRoom = (current: number) => (current + 1) % rooms.length;
