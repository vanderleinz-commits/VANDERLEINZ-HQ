import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rooms, staff, STAFF_WORKERS, MEETING_PARTICIPANTS, FLOOR_HEIGHT } from '../src/worldData.ts';
import { ENTRY_POINT, STAIR_X, STAIR_WIDTH, STAIR_BOTTOM, STAIR_TOP, workSeat, meetingSeat, lunchSeat, librarySeat, interviewSeat, founderMeetingSeat, toiletPoint, attendancePoint, pantryCookPoint, pantryDrinkPoint, inspectionPoint, meetingSlot, lunchSlot, ownerDeskSeat, clientMeetingSeat, RECEPTION_POST, ATTENDANCE_POINT, OWNER_LUNCH_SLOT, cleaningPoint, servicePoint, clientServicePoint, receptionBreakSeat } from '../src/officeLayout.ts';
import { findPath, moveAlong, moveAvatar, isWalkable, elevation, onStairs, floorOf, roomAt, pointDistance } from '../src/navigation.ts';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < .00001, `${a} should equal ${b}`);
const allAnchors = () => [RECEPTION_POST, ATTENDANCE_POINT, ownerDeskSeat.position, ...Array.from({length:8},(_,i)=>clientMeetingSeat(i).position), lunchSeat(OWNER_LUNCH_SLOT).position,servicePoint(-1),
  ...rooms.map(room=>cleaningPoint(room.id)),...STAFF_WORKERS.flatMap((index) => [workSeat(index).position, ...(index<8?[inspectionPoint(index)]:[]), attendancePoint(index),servicePoint(index)]),
  ...Array.from({ length: 7 }, (_, slot) => meetingSeat(slot).position),...Array.from({length:10},(_,slot)=>lunchSeat(slot).position),...Array.from({length:3},(_,slot)=>receptionBreakSeat(slot).position),...Array.from({length:8},(_,slot)=>clientServicePoint(slot)),
  librarySeat(0).position, librarySeat(1).position, interviewSeat(0).position, interviewSeat(1).position,
  founderMeetingSeat(0).position, founderMeetingSeat(1).position, toiletPoint(9), toiletPoint(10), pantryCookPoint, pantryDrinkPoint,
];

test('the expanded 13-room office has a double reception and workspace, five upstairs rooms and an OB store', () => {
  assert.equal(rooms.length, 13);
  assert.equal(staff.length, 10);
  assert.ok(rooms[2].width>=6.24&&rooms[2].depth>=6.24);assert.equal(rooms[12].floor,0);
  assert.equal(rooms[1].width * rooms[1].depth, 2 * rooms[2].width * rooms[2].depth);
  assert.equal(rooms[0].width * rooms[0].depth, 2 * rooms[2].width * rooms[2].depth);
  assert.ok(isWalkable(ENTRY_POINT));
  assert.deepEqual(rooms.filter((room) => room.floor === 1).map((room) => room.id), [2, 3, 4, 7, 11]);
  assert.equal(roomAt([...rooms[8].center, 0]), 8);
  assert.equal(roomAt([...rooms[7].center, FLOOR_HEIGHT]), 7);
  assert.equal(roomAt(rooms[8].center), 8, '2D points remain on the ground floor');
  assert.equal(roomAt([STAIR_X, (STAIR_BOTTOM[1]+STAIR_TOP[1])/2, FLOOR_HEIGHT / 2]), null);
});

test('every desk, shared seat, service point and room interaction connects to the entrance safely', () => {
  for (const target of allAnchors()) {
    assert.ok(isWalkable(target), `Blocked interaction point ${target}`);
    const route = findPath(ENTRY_POINT, target);
    assert.ok(route.length > 0, `No entrance route to ${target}`);
    let previous = ENTRY_POINT;
    for (const waypoint of route) {
      assert.ok(isWalkable(waypoint));
      const midpoint = [(previous[0] + waypoint[0]) / 2, (previous[1] + waypoint[1]) / 2, (elevation(previous) + elevation(waypoint)) / 2] as [number, number, number];
      assert.ok(isWalkable(midpoint), `A route crosses furniture or a wall at ${midpoint}`);
      if (Math.abs(elevation(waypoint) - elevation(previous)) > .00001) {
        assert.ok(onStairs(waypoint) && onStairs(previous), 'Elevation changes only on the shared staircase');
        assert.ok(pointDistance(previous, waypoint) <= .221);
      }
      previous = waypoint;
    }
    assert.deepEqual(moveAlong(ENTRY_POINT, route, 1000).position, target);
  }
});

test('floor changes climb the stairs smoothly in both directions and a mid-stair save can resume either way', () => {
  const upper = workSeat(0).position;
  for (const [origin, destination] of [[ENTRY_POINT, upper], [upper, ENTRY_POINT]]) {
    let position = origin, route = findPath(origin, destination), sawSlope = false;
    for (let step = 0; route.length && step < 2500; step++) {
      const moved = moveAlong(position, route, .06);
      assert.ok(moved.distanceUsed <= .060001);
      assert.ok(isWalkable(moved.position));
      assert.ok(Math.abs(elevation(moved.position) - elevation(position)) <= .060001);
      if (elevation(moved.position) > .025 && elevation(moved.position) < FLOOR_HEIGHT - .025) {
        sawSlope = true; assert.ok(onStairs(moved.position));
      }
      position = moved.position; route = moved.path;
    }
    assert.ok(sawSlope);
    assert.deepEqual(position, destination);
  }
  const middle: [number, number, number] = [STAIR_X, (STAIR_BOTTOM[1]+STAIR_TOP[1])/2, FLOOR_HEIGHT/2];
  for (const destination of [ENTRY_POINT, upper]) {
    const resumed = findPath(middle, destination);
    assert.ok(resumed.length > 0);
    assert.deepEqual(moveAlong(middle, resumed, 1000).position, destination);
    assert.ok(resumed.slice(0, 3).every(onStairs));
  }
});

test('avatar climbs and descends from stair landings and cannot jump onto the slope from its side', () => {
  const length=STAIR_BOTTOM[1]-STAIR_TOP[1],upper = moveAvatar(STAIR_BOTTOM, 0, -length);
  close(upper[0], STAIR_TOP[0]); close(upper[1], STAIR_TOP[1]); close(elevation(upper), FLOOR_HEIGHT);
  assert.equal(floorOf(upper), 1);
  const lower = moveAvatar(upper, 0, length);
  close(lower[1], STAIR_BOTTOM[1]); close(elevation(lower), 0);
  const edge=STAIR_X-STAIR_WIDTH/2-.3,sideways = moveAvatar([edge, (STAIR_BOTTOM[1]+STAIR_TOP[1])/2, 0], 2, 0);
  assert.equal(elevation(sideways), 0);
  assert.ok(sideways[0] < STAIR_X-STAIR_WIDTH/2);
  assert.ok(isWalkable(sideways));
  const upperEdge = moveAvatar([edge, STAIR_TOP[1]+.2, FLOOR_HEIGHT], 2, 0);
  assert.equal(elevation(upperEdge), FLOOR_HEIGHT);
  assert.ok(upperEdge[0] < STAIR_X-STAIR_WIDTH/2);
});

test('nine workers have distinct attendance positions and seats while Amanda remains outside worker slots', () => {
  assert.deepEqual(STAFF_WORKERS.map(lunchSlot), [0, 1, 2, 3, 4, 5, 6,7,8]);
  assert.deepEqual(MEETING_PARTICIPANTS.map(meetingSlot),[0,1,2,3,4,5]);
  assert.equal(meetingSlot(7),-1);
  assert.equal(meetingSlot(6), -1);
  assert.equal(new Set(STAFF_WORKERS.map((index) => JSON.stringify(attendancePoint(index)))).size, 9);
  for (const first of STAFF_WORKERS) for (const second of STAFF_WORKERS) if (first < second) assert.ok(pointDistance(attendancePoint(first), attendancePoint(second)) >= .69, 'Waiting workers need space for their bodies');
  assert.equal(new Set(Array.from({ length: 7 }, (_, slot) => JSON.stringify(meetingSeat(slot).position))).size, 7);
  assert.equal(new Set(Array.from({ length: 10 }, (_, slot) => JSON.stringify(lunchSeat(slot).position))).size, 10);
  assert.equal(workSeat(7).position[2], FLOOR_HEIGHT);
  assert.equal(workSeat(6).position[2], 0);
});
