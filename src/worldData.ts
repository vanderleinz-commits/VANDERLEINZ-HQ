export const FLOOR_HEIGHT = 3.8;
export type Room = { id: number; name: string; kind: string; icon: string; center: [number, number]; tint: string; summary: string; floor: 0 | 1; width: number; depth: number };
export type Staff = { name: string; role: string; roomId: number; color: string; hair: string; offset: [number, number] };

const room = (id: number, name: string, kind: string, icon: string, center: [number, number], floor: 0 | 1, tint: string, summary: string, width = 4.8): Room => ({ id, name, kind, icon, center, floor, tint, summary, width, depth: 4.8 });
export const rooms: Room[] = [
  room(0, 'Reception', 'Welcome & attendance', '✦', [-9.8, 3.3], 0, '#e3eff5', 'Amanda welcomes the team and records each arrival.'),
  room(1, 'Open Workspace', 'Team floor', '▤', [-2.4, 3.3], 0, '#dbe8f1', 'A spacious home for four desks, ideas and everyday work.', 9.6),
  room(2, 'Meeting Room', 'Collaboration', '◌', [-4.8, -3.3], 1, '#e5edf2', 'Seven seats for shared plans and team discussions.'),
  room(3, 'Founder Office', 'Leadership', '⌂', [.2, -3.3], 1, '#d3e1ee', 'Akbar plans the next chapter and meets the manager.'),
  room(4, 'HRD', 'People & interviews', '♡', [5, 3.3], 0, '#dbeaf3', 'A welcoming place for interviews and people matters.'),
  room(5, 'Pantry', 'Food & conversation', '☕', [-4.8, -3.3], 0, '#e0edf3', 'Lunch, cooking, warm drinks and small conversations.'),
  room(6, 'Database Server', 'Infrastructure', '▥', [.2, -3.3], 0, '#e5eaf1', 'NEXUS maintains the systems that keep the office running.'),
  room(7, 'Manager Office', 'Operations', '▦', [5.2, -3.3], 1, '#d7e6f0', 'ATLAS coordinates the team and checks their progress.'),
  room(8, 'Library', 'Reading & focus', '▧', [-9.8, -3.3], 0, '#d5e2eb', 'A quiet reading corner filled with books.'),
  room(9, 'WC 1', 'Comfort', '◇', [4.15, -3.3], 0, '#e6eff4', 'A private restroom with a washbasin.', 2.7),
  room(10, 'WC 2', 'Comfort', '◇', [7.05, -3.3], 0, '#e6eff4', 'A second private restroom for the team.', 2.7),
];
export const staff: Staff[] = [
  { name: 'ATLAS', role: 'Office manager', roomId: 7, color: '#4b7890', hair: '#293f50', offset: [-.6, -.7] },
  { name: 'NOVA', role: 'Creative director', roomId: 1, color: '#d28a7d', hair: '#704b51', offset: [-2, -1.1] },
  { name: 'LYRA', role: 'People & culture', roomId: 1, color: '#8c8fb0', hair: '#413c55', offset: [2, -1.1] },
  { name: 'ORION', role: 'Research analyst', roomId: 1, color: '#658d73', hair: '#344c3c', offset: [-2, .7] },
  { name: 'SAGE', role: 'Community host', roomId: 1, color: '#bc9561', hair: '#604a38', offset: [2, .7] },
  { name: 'NEXUS', role: 'Systems engineer', roomId: 6, color: '#6b7d9e', hair: '#343c52', offset: [.9, .5] },
  { name: 'Amanda', role: 'Receptionist', roomId: 0, color: '#95aca9', hair: '#59463f', offset: [0, -.6] },
  { name: 'Akbar', role: 'Founder', roomId: 3, color: '#a98254', hair: '#302a27', offset: [-.6, -.7] },
];
export const STAFF_WORKERS = [0, 1, 2, 3, 4, 5, 7] as const;
export const taskLabels = ['Mengatur operasional', 'Mendesain karya', 'Menyusun agenda tim', 'Menganalisis riset', 'Menyiapkan program komunitas', 'Memantau sistem', 'Menyambut tamu dan mencatat absensi', 'Memimpin dan merencanakan kantor'];
