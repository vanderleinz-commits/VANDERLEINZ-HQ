import { test } from 'node:test';
import assert from 'node:assert/strict';
import { willUseDoor } from '../src/doors.ts';
import { RECEPTION_POST, ENTRY_POINT, OWNER_LUNCH_SLOT, lunchSeat, roomLocal, workSeat } from '../src/officeLayout.ts';
import { rooms, FLOOR_HEIGHT } from '../src/worldData.ts';

test('Amanda standing at reception does not hold the nearby lobby door open', () => {
  assert.equal(willUseDoor(0, RECEPTION_POST), false);
  assert.equal(willUseDoor(0, RECEPTION_POST, RECEPTION_POST), false);
  assert.equal(willUseDoor(0, RECEPTION_POST, undefined, [0, 0]), false);
});

test('the owner sitting at the pantry head seat does not hold its door open', () => {
  const seat = lunchSeat(OWNER_LUNCH_SLOT).position;
  assert.equal(willUseDoor(5, seat), false);
  assert.equal(willUseDoor(5, seat, seat), false);
  assert.equal(willUseDoor(5, seat, undefined, [0, 0]), false);
});

test('a character in the door lane opens its door for an actual exit', () => {
  const inside = roomLocal(3, 0, rooms[3].depth / 2 - .7);
  assert.equal(willUseDoor(3, inside, ENTRY_POINT), true);
  assert.equal(willUseDoor(3, inside, workSeat(0).position), true);
  assert.equal(willUseDoor(3, inside, roomLocal(3, -.5, 0)), false);
  assert.equal(willUseDoor(3, roomLocal(3, 1, rooms[3].depth / 2 - .7), ENTRY_POINT), false);
});

test('outside entry intentions open the selected room while passing the hall does not', () => {
  const outside = roomLocal(3, 0, rooms[3].depth / 2 + .65);
  assert.equal(willUseDoor(3, outside, roomLocal(3, -.5, 0)), true);
  assert.equal(willUseDoor(3, outside, workSeat(0).position), false);
  assert.equal(willUseDoor(3, outside, undefined, [.1, 0]), false);
  assert.equal(willUseDoor(3, outside, undefined, [0, -.1]), true);
  assert.equal(willUseDoor(3, [outside[0], outside[1], 0], roomLocal(3, 0, 0)), false);
});

test('doors stay open briefly during a crossing and ignore stationary characters on the sill', () => {
  const sill = roomLocal(3, 0, rooms[3].depth / 2);
  const justOutside = roomLocal(3, 0, rooms[3].depth / 2 + .15);
  assert.equal(willUseDoor(3, sill), false);
  assert.equal(willUseDoor(3, sill, undefined, [0, .1]), true);
  assert.equal(willUseDoor(3, justOutside, ENTRY_POINT), true);
  assert.equal(willUseDoor(3, justOutside, undefined, [0, .1]), true);
  assert.equal(willUseDoor(3, justOutside, undefined, [.1, 0]), false);
  assert.equal(willUseDoor(3, justOutside, workSeat(0).position), false);
  assert.equal(sill[2], FLOOR_HEIGHT);
});
