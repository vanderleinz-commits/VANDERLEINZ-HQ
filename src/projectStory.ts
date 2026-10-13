import { workSeat, meetingSeat, librarySeat, hrdSeat, clientMeetingSeat, inspectionPoint } from './officeLayout.ts';
import type { Seat } from './officeLayout.ts';

export const PROJECT = {
  id: 'dani-birthday-001-v1', title: 'Petualangan ulang tahun Dani', client: 'Client A',
  brief: 'Video ulang tahun Dani · animasi dunia balok bergaya Minecraft · 10–15 detik',
  deadlineDay: 3, deadlineMinute: 960, video: '/projects/dani/video.mp4', poster: '/projects/dani/poster.jpg',
  version: 1,
} as const;
export type ProjectMood = 'neutral' | 'happy' | 'focused' | 'tired' | 'stressed' | 'angry';
export type ProjectMark = { id: string; beat: string };
export type ProjectAssignment = { person: number; place: 'desk'|'meeting'|'library'|'hr'|'repair'|'client'; slot?: number; task: string; mood: ProjectMood };
export type ProjectBeat = { id: string; day: number; start: number; end: number; title: string; room: number; summary: string; people: ProjectAssignment[]; lines: [number,string][] };
const a = (person:number,place:ProjectAssignment['place'],task:string,mood:ProjectMood='focused',slot?:number):ProjectAssignment=>({person,place,task,mood,slot});
const desks = (task:string,mood:ProjectMood='focused') => [0,1,2,3,4,5].map(i=>a(i,'desk',task,mood));
const meeting = (task:string,mood:ProjectMood='focused') => [0,1,2,3,4,5].map(i=>a(i,'meeting',task,mood,i));
export const PROJECT_BEATS:ProjectBeat[] = [
  {id:'arrival',day:1,start:360,end:540,title:'Sebuah kejutan untuk Dani',room:0,summary:'Kantor bangun. Amanda menyambut tim; brief Client A sudah menunggu.',people:[],lines:[]},
  {id:'kickoff',day:1,start:540,end:630,title:'Rapat: satu nama, satu petualangan',room:2,summary:'Atlas membagi tugas: konsep, ucapan, adegan balok, audio, dan render.',people:meeting('Membahas brief ulang tahun Dani'),lines:[[0,'Proyek pertama kita! Tiga hari. Dani harus jadi bintang videonya.'],[1,'Dunia balok, hadiah misterius, lalu kue muncul. Hangat dan seru.'],[2,'Ucapan pendek: Selamat ulang tahun, Dani! Nama jangan sampai salah.'],[3,'Durasi 10 sampai 15 detik. Aku pegang checklist brief.'],[4,'Musiknya ceria. Bikin Dani pengin menonton lagi!'],[5,'Aku siapkan render dan ekspor MP4. Gas.']]},
  {id:'storyboard',day:1,start:630,end:720,title:'Mencari bentuk kejutan',room:8,summary:'Nova dan Lyra menyusun storyboard di perpustakaan; tim lain menyiapkan bahan.',people:[a(1,'library','Menggambar storyboard','happy',0),a(2,'library','Merangkai ucapan Dani','focused',1),a(3,'desk','Memeriksa durasi dan ejaan'),a(4,'desk','Menyusun motif musik'),a(5,'desk','Menyiapkan adegan balok')],lines:[[1,'Hadiah kecil dulu, baru kejutan besar. Jangan semua muncul sekaligus.'],[2,'Semoga harimu penuh petualangan dan tawa. Ini cocok untuk Dani.']]},
  {id:'blocks',day:1,start:780,end:900,title:'Dari sketsa menjadi dunia balok',room:1,summary:'Nova membentuk karakter dan kue. Lyra menyusun teks; Sage menyiapkan musik.',people:desks('Membangun adegan dan materi ulang tahun'),lines:[[1,'Rambut kotak, tangan kotak, kuenya juga kotak. Lucu banget.'],[4,'Aku bikin melodi sendiri. Bagian kejutan harus pas ketukannya.'],[3,'Nama Dani sudah benar. Nggak pakai umur yang belum diberikan client.']]},
  {id:'day1review',day:1,start:900,end:990,title:'Review konsep sebelum pulang',room:2,summary:'Atlas memeriksa konsep; tim menyepakati urutan adegan untuk animasi besok.',people:[a(0,'meeting','Memeriksa konsep','focused',0),a(1,'meeting','Mempresentasikan storyboard','happy',1),a(3,'meeting','Memeriksa brief','focused',3)],lines:[[0,'Konsepnya jelas. Besok fokus gerak, kamera, dan timing.'],[1,'Sip. Aku simpan dulu sebelum pulang. Jangan sampai besok hilang, anjir.'],[3,'Checklist hari pertama beres. Nama, durasi, dan gaya sudah searah.']]},
  {id:'animation',day:2,start:480,end:600,title:'Karakter balok mulai hidup',room:1,summary:'Gerak melambai, lompatan kecil, dan kejutan kue disusun bersama musik.',people:desks('Menganimasikan petualangan Dani'),lines:[[1,'Lambaian tangannya kaku dikit justru cocok dengan dunia balok.'],[4,'Ketukan musik masuk waktu kadonya terbuka. Nah, itu!'],[2,'Teks Dani harus besar dan cukup lama terbaca.']]},
  {id:'renderdrama',day:2,start:600,end:660,title:'Drama preview: timing meleset',room:1,summary:'Adegan kejutan terasa terlalu cepat. Nova kesal; Nexus membantu pemeriksaan teknis.',people:[a(1,'desk','Memeriksa timing yang meleset','angry'),a(5,'repair','Membantu preview Nova','focused',1),a(0,'desk','Mengatur ulang prioritas','stressed'),a(3,'desk','Mencatat masalah timing','focused')],lines:[[1,'Anjir, kuenya muncul sebelum hadiahnya selesai! Ulang timing-nya.'],[5,'Tenang, file aman. Kita rapikan urutan frame, bukan mulai dari nol.'],[0,'Deadline besok. Selesaikan yang penting dulu, satu per satu.']]},
  {id:'resetmood',day:2,start:660,end:720,title:'Tarik napas dulu',room:4,summary:'Felin membantu Nova menurunkan tekanan; pekerjaan tim tetap berlanjut.',people:[a(1,'hr','Konsultasi beban kerja','tired',0),a(7,'hr','Mendampingi Nova','neutral',1)],lines:[[7,'Capek boleh. Kita ambil jeda sebelum menilai ulang preview-nya.'],[1,'Iya, mata gue sudah lihat balok semua. Habis istirahat lanjut.']]},
  {id:'timing',day:2,start:780,end:900,title:'Kejutannya akhirnya pas',room:1,summary:'Tim memperbaiki timing dan menyeimbangkan teks, kamera, serta musik.',people:desks('Memoles gerak, teks dan musik','focused'),lines:[[1,'Oke, ini jauh lebih enak. Nggak usah panik dulu ternyata.'],[4,'Musik ketemu momennya. Hadiahnya terasa seperti kejutan sekarang.'],[2,'Aku baca ulang semua ucapan. Dani, bukan Dany. Aman.']]},
  {id:'render',day:2,start:900,end:990,title:'Antrean render terakhir',room:6,summary:'Nexus menyiapkan ekspor; Atlas mengingatkan tim menyimpan versi yang disepakati.',people:[a(5,'desk','Mengekspor video MP4','stressed'),a(0,'desk','Memeriksa versi penyerahan'),a(1,'desk','Menunggu preview','tired'),a(4,'desk','Memeriksa audio')],lines:[[5,'Ayo dong render, jangan bikin jantung gue olahraga.'],[0,'Versi sudah dicatat. Besok kita tonton bersama sebelum client datang.']]},
  {id:'finalcut',day:3,start:480,end:600,title:'Pagi terakhir: final cut',room:1,summary:'Tim menyiapkan hasil akhir. Nama Dani, durasi, dan audio diperiksa kembali.',people:desks('Memeriksa hasil akhir','focused'),lines:[[3,'Checklist: nama Dani terbaca, durasi sesuai, video bisa diputar.'],[4,'Audio tidak pecah. Awal dan akhirnya sudah lembut.']]},
  {id:'screening',day:3,start:600,end:720,title:'Pemutaran internal',room:2,summary:'Seluruh tim berkumpul untuk meninjau video sebelum diserahkan kepada Founder.',people:meeting('Meninjau video Dani','happy'),lines:[[0,'Kita tonton dari awal. Bayangkan Dani yang membuka videonya.'],[1,'Yes! Kue, hadiah, dan lambaian semuanya masuk.'],[2,'Selamat ulang tahun, Dani. Semoga suka kejutan kecil ini.'],[5,'Format MP4 siap. Salinan hasil sudah tersimpan.']]},
  {id:'packaging',day:3,start:780,end:870,title:'Merapikan paket penyerahan',room:1,summary:'Tim merapikan file hasil dan catatan proyek. Amanda menyiapkan kunjungan Client A.',people:desks('Menyiapkan penyerahan','happy'),lines:[[0,'Founder yang menentukan: diterima atau revisi. Kita siap mendengarkan.'],[3,'Checklist lengkap. File video masuk paket penyerahan.']]},
  {id:'handoff',day:3,start:870,end:1020,title:'Client A datang mengambil kejutan',room:11,summary:'Amanda menyambut Client A. Atlas dan Nova menunggu Founder di ruang meeting client.',people:[a(0,'client','Mendampingi penyerahan','happy',2),a(1,'client','Menjelaskan video','happy',4)],lines:[[0,'Video untuk Dani sudah siap. Founder, silakan bergabung.'],[1,'Deg-degan juga, ya. Semoga Dani suka petualangannya!']]},
];
export function projectBeat(day:number,minute:number):ProjectBeat|undefined {return PROJECT_BEATS.find(b=>b.day===day&&minute>=b.start&&minute<b.end);}
export function projectAssignment(mark:ProjectMark|undefined,day:number,minute:number,index:number):ProjectAssignment|undefined {
  return mark?.id===PROJECT.id ? projectBeat(day,minute)?.people.find(p=>p.person===index) : undefined;
}
export function projectSeat(assignment:ProjectAssignment):Seat|null {
  const slot=assignment.slot??assignment.person;
  switch(assignment.place){case 'meeting':return meetingSeat(slot);case 'library':return librarySeat(slot);case 'hr':return hrdSeat(slot);case 'client':return clientMeetingSeat(slot);case 'desk':return workSeat(assignment.person);default:return null;}
}
export function projectGoal(assignment:ProjectAssignment){return projectSeat(assignment)?.position??inspectionPoint(assignment.slot??1);}
export function projectDialogue(mark:ProjectMark|undefined,day:number,minute:number){
  const beat=mark?.id===PROJECT.id?projectBeat(day,minute):undefined;
  if(!beat?.lines.length)return null;
  const [speaker,text]=beat.lines[Math.floor((minute-beat.start)/6)%beat.lines.length];
  return {speaker,text};
}
