import { PALETTE } from './artDirection.ts';
import { characterProfile } from './characterProfiles.ts';

export const FLOOR_HEIGHT = 3.8;
export const FLOOR_SURFACE_HEIGHT = .12;
export const OFFICE_SCALE = 1.3;
export const WORLD_BOUNDS = { minX: -15.7, maxX: 17.4, minZ: -7.41, maxZ: 7.7, outsideMaxZ: 10.9, upperMaxX: 15.7, upperMaxZ: 1.05 } as const;
export type Room = { id: number; name: string; kind: string; icon: string; center: [number, number]; tint: string; summary: string; floor: 0 | 1; width: number; depth: number };
export type Staff = { name: string; role: string; roomId: number; color: string; hair: string; offset: [number, number] };

const room = (id: number, name: string, kind: string, icon: string, center: [number, number], floor: 0 | 1, tint: string, summary: string, width = 4.8, depth = 4.8): Room => ({ id, name, kind, icon, center: [center[0] * OFFICE_SCALE, center[1] * OFFICE_SCALE], floor, tint, summary, width: width * OFFICE_SCALE, depth: depth * OFFICE_SCALE });
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
  room(11, 'Client Meeting Room', 'Guest meetings', '◎', [9.6, -3.3], 1, '#E8E7F2', 'An eight-seat guest room for the founder, manager, clients, and project team.', 4.8),
  room(12, 'Gudang dan Ruang OB', 'Office care & storage', '▣', [10.84, -3.3], 0, '#DCE6E5', 'Organized supplies, cleaning equipment, and a comfortable rest corner for Yati and Deno.'),
];
const staffWorkplaces: { roomId: number; offset: [number, number] }[] = [
  { roomId: 7, offset: [-.75, -2.6] },
  { roomId: 1, offset: [-3.25, -.55] },
  { roomId: 1, offset: [3.25, -.55] },
  { roomId: 1, offset: [-3.25, 1.75] },
  { roomId: 1, offset: [3.25, 1.75] },
  { roomId: 6, offset: [1.3, -2.6] },
  { roomId: 0, offset: [.71, 2.19] },
  { roomId: 4, offset: [-1.2, -2.6] },
  { roomId: 12, offset: [-.7, 1.65] },
  { roomId: 12, offset: [.7, 1.65] },
];
export const staff: Staff[] = staffWorkplaces.map((workplace, index) => {
  return { get name() { return characterProfile(index).name; }, get role() { return characterProfile(index).role; }, get color() { return characterProfile(index).color; }, get hair() { return characterProfile(index).hair; }, ...workplace };
});
export const STAFF_WORKERS = [0, 1, 2, 3, 4, 5, 7, 8, 9] as const;
export const MEETING_PARTICIPANTS = [0, 1, 2, 3, 4, 5] as const;
export const taskLabels = ['Mengatur operasional', 'Mendesain karya', 'Menyusun agenda tim', 'Menganalisis riset', 'Menyiapkan program komunitas', 'Memantau sistem', 'Menyambut tamu dan mencatat absensi', 'Mengembangkan tim dan rekrutmen', 'Menyiapkan minuman dan catering', 'Menjaga kantor bersih dan nyaman'];
