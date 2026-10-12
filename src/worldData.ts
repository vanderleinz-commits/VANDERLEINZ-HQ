import { PALETTE } from './artDirection.ts';
import { characterProfiles } from './characterProfiles.ts';

export const FLOOR_HEIGHT = 3.8;
export type Room = { id: number; name: string; kind: string; icon: string; center: [number, number]; tint: string; summary: string; floor: 0 | 1; width: number; depth: number };
export type Staff = { name: string; role: string; roomId: number; color: string; hair: string; offset: [number, number] };

const room = (id: number, name: string, kind: string, icon: string, center: [number, number], floor: 0 | 1, tint: string, summary: string, width = 4.8, depth = 4.8): Room => ({ id, name, kind, icon, center, floor, tint, summary, width, depth });
export const rooms: Room[] = [
  room(0, 'Lobby & Reception', 'Welcome & attendance', '✦', [-7.3, 3.3], 0, PALETTE.cloud, 'A spacious lobby, a welcoming wooden counter, and Amanda greeting the team.', 9.6),
  room(1, 'Open Workspace', 'Team floor', '▤', [2.3, 3.3], 0, '#DCEBF5', 'Four cozy workstations share daylight, plants, and space for ideas.', 9.6),
  room(2, 'Meeting Room', 'Collaboration', '◌', [-9.6, -3.3], 1, '#DEE8F3', 'Six team seats and one open founder seat around a shared table.'),
  room(3, 'Founder Office', 'Leadership', '⌂', [-4.8, -3.3], 1, '#CCDDED', 'A private founder desk and a soft seating area for thoughtful conversations.'),
  room(4, 'HRD', 'Recruitment & development', '♡', [4.8, -3.3], 1, '#E6E4F2', 'Felin welcomes the team for recruitment, growth, and private consultations.'),
  room(5, 'Pantry', 'Food & conversation', '☕', [-4.8, -3.3], 0, '#F0E6D6', 'Warm sand surfaces, shared meals, and little pauses over coffee.'),
  room(6, 'Database Server', 'Infrastructure', '▥', [.2, -3.3], 0, '#DAE9EC', 'NEXUS keeps the office systems ready in a tidy, muted teal room.'),
  room(7, 'Manager Office', 'Operations', '▦', [0, -3.3], 1, '#D6E7F4', 'A composed blue workspace where ATLAS connects everyday plans.'),
  room(8, 'Library', 'Reading & focus', '▧', [-9.8, -3.3], 0, '#E7E7E0', 'Wooden shelves, leafy plants, and a quiet place to read and wonder.'),
  room(9, 'WC 1', 'Comfort', '◇', [4.15, -3.3], 0, '#EDF2F4', 'A clean, private restroom with cream ceramics and soft blue trim.', 2.7),
  room(10, 'WC 2', 'Comfort', '◇', [7.05, -3.3], 0, '#EDF2F4', 'A second calm, private restroom with a compact washbasin.', 2.7),
  room(11, 'Client Meeting Room', 'Guest meetings', '◎', [9.6, -3.3], 1, '#E8E7F2', 'A quiet upstairs room where visiting clients meet the founder and ATLAS.', 4.8),
];
const staffWorkplaces: { roomId: number; offset: [number, number] }[] = [
  { roomId: 7, offset: [-.6, -.7] },
  { roomId: 1, offset: [-3.1, -1.1] },
  { roomId: 1, offset: [3.1, -1.1] },
  { roomId: 1, offset: [-3.1, .7] },
  { roomId: 1, offset: [3.1, .7] },
  { roomId: 6, offset: [.9, .5] },
  { roomId: 0, offset: [1.4, -.65] },
  { roomId: 4, offset: [-.7, -1.15] },
];
export const staff: Staff[] = staffWorkplaces.map((workplace, index) => {
  const { name, role, color, hair } = characterProfiles[index];
  return { name, role, color, hair, ...workplace };
});
export const STAFF_WORKERS = [0, 1, 2, 3, 4, 5, 7] as const;
export const MEETING_PARTICIPANTS = [0, 1, 2, 3, 4, 5] as const;
export const taskLabels = ['Mengatur operasional', 'Mendesain karya', 'Menyusun agenda tim', 'Menganalisis riset', 'Menyiapkan program komunitas', 'Memantau sistem', 'Menyambut tamu dan mencatat absensi', 'Mengembangkan tim dan rekrutmen'];
