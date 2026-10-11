export type Room = { id: number; name: string; kind: string; icon: string; center: [number, number]; tint: string; summary: string };
export type Staff = { name: string; role: string; roomId: number; color: string; hair: string; offset: [number, number] };

export const rooms: Room[] = [
  { id: 0, name: 'Reception', kind: 'Front of house', icon: '✦', center: [-7.35, -3], tint: '#e6f1f1', summary: 'A warm welcome for every new arrival.' },
  { id: 1, name: 'Open Workspace', kind: 'Team floor', icon: '▤', center: [-2.45, -3], tint: '#f2eadc', summary: 'The everyday home base for the team.' },
  { id: 2, name: 'Meeting Room', kind: 'Collaboration', icon: '◌', center: [2.45, -3], tint: '#e5edf2', summary: 'A quiet place to bring ideas together.' },
  { id: 3, name: 'Creative Studio', kind: 'Design & ideas', icon: '✳', center: [7.35, -3], tint: '#efe7f2', summary: 'Color, sketches and room to experiment.' },
  { id: 4, name: 'Research Lab', kind: 'Discovery', icon: '⌕', center: [-7.35, 3], tint: '#e7efe7', summary: 'A focused space for careful exploration.' },
  { id: 5, name: 'Lounge', kind: 'Rest & recharge', icon: '☕', center: [-2.45, 3], tint: '#f4e8df', summary: 'A soft landing between busy moments.' },
  { id: 6, name: 'Server Room', kind: 'Infrastructure', icon: '▥', center: [2.45, 3], tint: '#e5eaf1', summary: 'The little engine room that keeps HQ humming.' },
  { id: 7, name: 'Director Office', kind: 'Leadership', icon: '⌂', center: [7.35, 3], tint: '#f0eadc', summary: 'A calm corner to plan the next chapter.' },
];

export const staff: Staff[] = [
  { name: 'ATLAS', role: 'Operations lead', roomId: 1, color: '#4b7890', hair: '#293f50', offset: [-0.9, 0.65] },
  { name: 'NOVA', role: 'Creative director', roomId: 3, color: '#d28a7d', hair: '#704b51', offset: [-0.8, 0.6] },
  { name: 'LYRA', role: 'People & culture', roomId: 2, color: '#8c8fb0', hair: '#413c55', offset: [0.8, 0.7] },
  { name: 'ORION', role: 'Research analyst', roomId: 4, color: '#658d73', hair: '#344c3c', offset: [0.75, 0.55] },
  { name: 'SAGE', role: 'Community host', roomId: 5, color: '#bc9561', hair: '#604a38', offset: [-0.75, 0.55] },
  { name: 'NEXUS', role: 'Systems engineer', roomId: 6, color: '#6b7d9e', hair: '#343c52', offset: [0.72, 0.6] },
];

