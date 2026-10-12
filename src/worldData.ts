import { PALETTE } from './artDirection.ts';
import { characterProfiles } from './characterProfiles.ts';

export const FLOOR_HEIGHT = 3.8;
export type Room = { id: number; name: string; kind: string; icon: string; center: [number, number]; tint: string; summary: string; floor: 0 | 1; width: number; depth: number };
export type Staff = { name: string; role: string; roomId: number; color: string; hair: string; offset: [number, number] };

const room = (id: number, name: string, kind: string, icon: string, center: [number, number], floor: 0 | 1, tint: string, summary: string, width = 4.8): Room => ({ id, name, kind, icon, center, floor, tint, summary, width, depth: 4.8 });
export const rooms: Room[] = [
  room(0, 'Reception', 'Welcome & attendance', '✦', [-9.8, 3.3], 0, PALETTE.cloud, 'A calm blue welcome, a warm wooden counter, and Amanda greeting the team.'),
  room(1, 'Open Workspace', 'Team floor', '▤', [-2.4, 3.3], 0, '#DCEBF5', 'Four cozy workstations share daylight, plants, and space for ideas.', 9.6),
  room(2, 'Meeting Room', 'Collaboration', '◌', [-4.8, -3.3], 1, '#DEE8F3', 'Seven soft blue seats around one wooden table for shared plans.'),
  room(3, 'Founder Office', 'Leadership', '⌂', [.2, -3.3], 1, '#CCDDED', 'Akbar plans quietly among blue accents, books, and warm timber.'),
  room(4, 'HRD', 'People & interviews', '♡', [5, 3.3], 0, '#E6E4F2', 'Gentle lavender details make conversations about people feel welcoming.'),
  room(5, 'Pantry', 'Food & conversation', '☕', [-4.8, -3.3], 0, '#F0E6D6', 'Warm sand surfaces, shared meals, and little pauses over coffee.'),
  room(6, 'Database Server', 'Infrastructure', '▥', [.2, -3.3], 0, '#DAE9EC', 'NEXUS keeps the office systems ready in a tidy, muted teal room.'),
  room(7, 'Manager Office', 'Operations', '▦', [5.2, -3.3], 1, '#D6E7F4', 'A composed blue workspace where ATLAS connects everyday plans.'),
  room(8, 'Library', 'Reading & focus', '▧', [-9.8, -3.3], 0, '#E7E7E0', 'Wooden shelves, leafy plants, and a quiet place to read and wonder.'),
  room(9, 'WC 1', 'Comfort', '◇', [4.15, -3.3], 0, '#EDF2F4', 'A clean, private restroom with cream ceramics and soft blue trim.', 2.7),
  room(10, 'WC 2', 'Comfort', '◇', [7.05, -3.3], 0, '#EDF2F4', 'A second calm, private restroom with a compact washbasin.', 2.7),
];
const staffWorkplaces: { roomId: number; offset: [number, number] }[] = [
  { roomId: 7, offset: [-.6, -.7] },
  { roomId: 1, offset: [-2, -1.1] },
  { roomId: 1, offset: [2, -1.1] },
  { roomId: 1, offset: [-2, .7] },
  { roomId: 1, offset: [2, .7] },
  { roomId: 6, offset: [.9, .5] },
  { roomId: 0, offset: [0, -.6] },
  { roomId: 3, offset: [-.6, -.7] },
];
export const staff: Staff[] = staffWorkplaces.map((workplace, index) => {
  const { name, role, color, hair } = characterProfiles[index];
  return { name, role, color, hair, ...workplace };
});
export const STAFF_WORKERS = [0, 1, 2, 3, 4, 5, 7] as const;
export const taskLabels = ['Mengatur operasional', 'Mendesain karya', 'Menyusun agenda tim', 'Menganalisis riset', 'Menyiapkan program komunitas', 'Memantau sistem', 'Menyambut tamu dan mencatat absensi', 'Memimpin dan merencanakan kantor'];
