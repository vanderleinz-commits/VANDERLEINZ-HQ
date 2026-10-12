import { staff, STAFF_WORKERS } from './worldData.ts';
import { findPath, isWalkable, moveAlong, nearestWalkable, roomAt, pointDistance, onStairs } from './navigation.ts';
import type { Point } from './navigation.ts';
import { ENTRY_POINT, RECEPTION_POST, ATTENDANCE_POINT, workSeat, meetingSeat, lunchSeat, meetingSlot, librarySeat, hrdSeat, founderMeetingSeat, toiletPoint, pantryDrinkPoint, pantryCookPoint, inspectionPoint, attendancePoint, arrivalMinute } from './officeLayout.ts';
import type { Seat } from './officeLayout.ts';
import { initialBonds, encounterFor, interactionGoal, advanceSocial, cancelInteraction, interactionLabels, interactionDuration } from './social.ts';
import type { Encounter } from './social.ts';

export const activityLabels={prepare:'Bersiap di kantor',work:'Bekerja',meeting:'Rapat tim',break:'Istirahat',lunch:'Makan siang',leave:'Pulang',offsite:'Di luar kantor',checkin:'Absen masuk',checkout:'Absen pulang',reception:'Melayani tamu',private:'Diskusi proyek',inspect:'Memeriksa pekerjaan tim',repair:'Memperbaiki komputer',read:'Membaca buku',toilet:'Menggunakan WC',drink:'Mengambil minum',cook:'Memasak di pantry',hr:'Mengurus dokumen HRD',waiting:'Komputer bermasalah'};
export type Activity=keyof typeof activityLabels;
export type DutyKind='private'|'inspect'|'repair'|'read'|'toilet'|'drink'|'cook'|'hr';
export type NpcDuty={kind:DutyKind;target:number;phase:'travel'|'active';elapsed:number;duration:number;deadline:number};
export type NpcState={
 name:string;position:Point;path:Point[];activity:Activity;destination:number;presence:'offsite'|'arriving'|'checking-in'|'inside'|'checking-out'|'leaving';
 energy:number;focus:number;social:number;workMinutes:number;nextSocialAt:number;greetUntil:number;nextErrandAt:number;errandUntil:number;nextLeisureAt:number;duty:NpcDuty|null;attendanceIn:number|null;attendanceOut:number|null;
 override:{activity:'work'|'break';until:number}|null;
};
export type MeetingPlan={day:number;start:number;duration:30|45|60;phase:'scheduled'|'gathering'|'discussing'|'done';elapsed:number};
export type ClientState={id:number;name:string;position:Point;path:Point[];phase:'arriving'|'waiting'|'served'|'leaving'|'offsite';stayUntil:number};
export type AttendanceEntry={day:number;name:string;kind:'in'|'out'|'client';at:number};
export type ReceptionState={person:number|null;client:boolean;mode:'in'|'out'|'visitor';phase:'approach'|'service';elapsed:number;log:AttendanceEntry[]};
export type ComputerIssue={owner:number;reportedAt:number;resolvedAt:number|null};
export type Simulation={
 gameDay:number;gameMinute:number;credits:number;npcs:NpcState[];events:string[];encounters:Encounter[];bonds:Record<string,number>;completedInteractions:number;nextEncounterId:number;meeting:MeetingPlan;
 reception:ReceptionState;computerIssues:ComputerIssue[];clients:ClientState[];rng:number;nextManagementAt:number;nextIssueAt:number;nextClientAt:number;managementRound:number;completedDuties:Record<DutyKind,number>;
};
export type SaveData={version:5;simulation:Simulation;roomId:number;mode:'director'|'avatar';avatar:Point;speed:number;reducedMotion:boolean;savedAt:string;floorView:0|1|'all'};
export const SAVE_KEY='blue-and-space-hq-v1',PREVIOUS_KEY='vanderleinz-hq-milestone-5',LEGACY_KEY='vanderleinz-hq-milestone-1';
export const DAY_NAMES=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
export const weekdayName=(day:number)=>DAY_NAMES[(Math.max(1,Math.floor(day))-1)%7];
export const weekday=weekdayName;
export const officeOpen=(minute:number)=>minute>=420&&minute<1020;
export const officePower=(s:Simulation)=>officeOpen(s.gameMinute)?1:s.gameMinute>=1020&&s.npcs.some(n=>n.presence!=='offsite')?Math.max(.18,1-(s.gameMinute-1020)/20):0;
export const absoluteMinute=(s:Simulation)=>(s.gameDay-1)*1440+s.gameMinute;
export const WALK_SPEED=1.15;
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const isWorker=(i:number)=>STAFF_WORKERS.includes(i as typeof STAFF_WORKERS[number]);
const outside=(i:number):Point=>[ENTRY_POINT[0]+(i%3-1)*.28,ENTRY_POINT[1]+(i%2)*.14,0];
const activeMeeting=(s:Simulation)=>['gathering','discussing'].includes(s.meeting.phase);
const emptyDuties=():Record<DutyKind,number>=>({private:0,inspect:0,repair:0,read:0,toilet:0,drink:0,cook:0,hr:0});
const random=(s:Simulation)=>{s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;};
const event=(s:Simulation,text:string)=>{s.events.unshift(text);s.events=s.events.slice(0,8);};
function logAttendance(s:Simulation,name:string,kind:AttendanceEntry['kind']) {
 const entry:AttendanceEntry={day:s.gameDay,name,kind,at:s.gameMinute};
 s.reception.log=[entry,...s.reception.log].slice(0,24);
}
export function schedule(minute:number):Activity {
 if(!officeOpen(minute))return 'offsite';if(minute<480)return 'prepare';if(minute>=720&&minute<780)return 'lunch';return 'work';
}
export function planMeeting(day:number):MeetingPlan {
 const hash=(Math.imul(day,1664525)+1013904223)>>>0;
 return {day,start:(hash%2?540:810)+(Math.floor(hash/7)%31),duration:([30,45,60] as const)[Math.floor(hash/17)%3],phase:'scheduled',elapsed:0};
}
export const computerBroken=(s:Simulation,index:number)=>s.computerIssues.some(issue=>issue.owner===index&&issue.resolvedAt===null);
function baselineActivity(s:Simulation,i:number):Activity {
 const n=s.npcs[i],planned=schedule(s.gameMinute);
 if(n.presence==='offsite')return 'offsite';if(n.presence==='leaving')return 'leave';
 if(n.presence==='arriving'||n.presence==='checking-in')return 'checkin';if(n.presence==='checking-out')return 'checkout';
 if(i===6)return !officeOpen(s.gameMinute)||s.reception.person!==null?'reception':planned==='prepare'?'prepare':'work';
 if(planned==='work'&&activeMeeting(s))return 'meeting';if(n.duty)return n.duty.kind;if(planned==='lunch')return 'lunch';
 if(planned==='work'&&n.override&&n.override.until>absoluteMinute(s))return n.override.activity;
 return planned==='work'&&computerBroken(s,i)?'waiting':planned;
}
export function dutyGoal(s:Simulation,index:number):Point {
 const d=s.npcs[index].duty!;
 if(d.kind==='private')return founderMeetingSeat(index).position;
 if(d.kind==='inspect'||d.kind==='repair')return inspectionPoint(d.target);
 if(d.kind==='read')return librarySeat(d.target).position;if(d.kind==='toilet')return toiletPoint(d.target);
 if(d.kind==='drink')return pantryDrinkPoint;if(d.kind==='cook')return pantryCookPoint;return hrdSeat(d.target).position;
}
export function activityGoal(s:Simulation,i:number):Point {
 const n=s.npcs[i];if(n.presence==='offsite'||n.presence==='leaving')return outside(i);if(i===6)return RECEPTION_POST;
 if(['arriving','checking-in','checking-out'].includes(n.presence))return s.reception.person===i&&!s.reception.client?ATTENDANCE_POINT:attendancePoint(i);
 const encounter=encounterFor(s,i);if(encounter)return interactionGoal(encounter,i);
 if(schedule(s.gameMinute)==='work'&&activeMeeting(s))return meetingSeat(meetingSlot(i)).position;if(n.duty)return dutyGoal(s,i);
 const a=baselineActivity(s,i);if(a==='lunch'||a==='break')return lunchSeat(meetingSlot(i)).position;return workSeat(i).position;
}
export function seatedAt(s:Simulation,i:number):Seat|null {
 const n=s.npcs[i];if(!n||i===6||n.presence!=='inside'||n.path.length||n.activity==='prepare')return null;
 let seat:Seat|null=null;const e=encounterFor(s,i);
 if(e)seat=(e.roomId===2?meetingSeat:lunchSeat)(e.chairs[e.participants[0]===i?0:1]);
 else if(n.duty?.phase==='active')seat=n.duty.kind==='private'?founderMeetingSeat(i):n.duty.kind==='read'?librarySeat(n.duty.target):n.duty.kind==='hr'?hrdSeat(n.duty.target):null;
 else if(n.activity==='meeting')seat=meetingSeat(meetingSlot(i));else if(n.activity==='lunch'||n.activity==='break')seat=lunchSeat(meetingSlot(i));
 else if(['work','waiting'].includes(n.activity))seat=workSeat(i);
 return seat&&pointDistance(n.position,seat.position)<.1?seat:null;
}
export function npcPose(s:Simulation,i:number):string {
 const n=s.npcs[i];if(n.path.length)return onStairs(n.position)?'stairs':'walk';if(n.greetUntil>absoluteMinute(s))return 'wave';
 if(['checking-in','checking-out'].includes(n.presence))return s.reception.person===i&&!s.reception.client?'sign':'idle';
 if(i===6)return s.reception.person!==null?'talk':'idle';if(n.duty?.phase==='active')return n.duty.kind==='private'?'talk':n.duty.kind==='toilet'?'toilet':n.duty.kind==='hr'?'read':n.duty.kind;
 if(n.activity==='work')return 'work';if(n.activity==='waiting')return 'think';if(n.activity==='lunch')return Math.floor(s.gameMinute/8+i)%3===0?'coffee':'eat';
 return n.activity==='meeting'?'think':n.activity==='break'?'coffee':'idle';
}
export function meetingDialogue(s:Simulation):{speaker:number;text:string}|null {
 if(s.meeting.phase!=='discussing')return null;const turn=Math.floor(s.meeting.elapsed/5),speaker=STAFF_WORKERS[turn%7];
 const lines=['Kita mulai dari progres tim dan prioritas operasional.','Aku siapkan konsep visual untuk proyek berikutnya.','Pembagian tugas dan kebutuhan tim sudah aku catat.','Hasil riset menunjukkan arah yang menjanjikan.','Aku susun agenda komunitas untuk minggu ini.','Sistem dan komputer tim terus aku pantau.','Terima kasih. Mari kita tetapkan langkah proyek berikutnya.'];
 return {speaker,text:turn<7?lines[turn%7]:['Aku catat tindak lanjutnya.','Mari kita saling bantu menyelesaikannya.','Setuju. Kita lanjutkan setelah rapat.'][turn%3]};
}
export function routineDialogue(s:Simulation,i:number):{speaker:number;text:string}|null {
 if(s.reception.person!==null&&(i===6||!s.reception.client&&i===s.reception.person)){
  const r=s.reception,who=r.client?s.clients[r.person!]?.name:s.npcs[r.person!]?.name;
  return {speaker:6,text:r.mode==='out'?'Terima kasih, '+who+'. Absen pulang dicatat.':r.client?'Selamat datang di Blue and Space! Silakan isi buku tamu.':'Selamat pagi, '+who+'. Silakan isi absen dahulu.'};
 }
 const atlas=s.npcs[0].duty;if(atlas?.kind==='private'&&atlas.phase==='active'&&(i===0||i===7))return {speaker:Math.floor(atlas.elapsed/4)%2?7:0,text:Math.floor(atlas.elapsed/4)%2?'Baik, Atlas. Kita prioritaskan proyek dan dukung timnya.':'Akbar, progres proyek sudah aku rangkum. Mari cek langkah berikutnya.'};

 for(const [owner,n] of s.npcs.entries()){const d=n.duty;if(!d||d.phase!=='active'||!['inspect','repair'].includes(d.kind)||i!==owner&&i!==d.target)continue;return {speaker:owner,text:d.kind==='repair'?'Aku periksa komputer '+staff[d.target].name+'. Sebentar, ya.':'Bagaimana progresnya, '+staff[d.target].name+'? Ada yang perlu dibantu?'};}return null;
}
export function createSimulation(day=1,minute=420,credits=1250):Simulation {
 const now=(day-1)*1440+minute;
 const s:Simulation={gameDay:day,gameMinute:minute,credits,npcs:[],meeting:planMeeting(day),events:['HQ dua lantai dibuka. Amanda menyiapkan buku absen.'],encounters:[],bonds:initialBonds(),completedInteractions:0,nextEncounterId:1,reception:{person:null,client:false,mode:'in',phase:'approach',elapsed:0,log:[]},computerIssues:[],clients:[],rng:(Math.imul(day,2654435761)>>>0),nextManagementAt:now+30,nextIssueAt:now+60,nextClientAt:now+100,managementRound:0,completedDuties:emptyDuties()};
 s.npcs=staff.map((p,i)=>{const inside=officeOpen(minute)&&minute>=arrivalMinute(i);return {name:p.name,position:inside?workSeat(i).position:outside(i),path:[],activity:inside?(i===6?'work':schedule(minute)):'offsite',destination:p.roomId,presence:inside?'inside':'offsite',energy:85,focus:90,social:75,workMinutes:0,nextSocialAt:now+20+i*3,greetUntil:0,nextErrandAt:now+90,errandUntil:0,nextLeisureAt:now+40+i*12,duty:null,attendanceIn:inside?now:null,attendanceOut:null,override:null};});
 if(minute>=s.meeting.start+s.meeting.duration+65)s.meeting.phase='done';
 if(minute===420){s.npcs[6]={...s.npcs[6],presence:'arriving',position:outside(6),path:findPath(outside(6),RECEPTION_POST),attendanceIn:null};s.nextManagementAt=now+80;s.nextIssueAt=now+120;s.nextClientAt=now+150;}return s;
}
function startDuty(s:Simulation,i:number,kind:DutyKind,target:number,duration:number) {
 s.npcs[i]={...s.npcs[i],override:null,duty:{kind,target,phase:'travel',elapsed:0,duration,deadline:absoluteMinute(s)+150}};
 event(s,staff[i].name+' → '+activityLabels[kind]+(kind==='repair'||kind==='inspect'?' · '+staff[target].name:''));
}
function availableForDuty(s:Simulation,i:number){return s.npcs[i].presence==='inside'&&!s.npcs[i].duty&&!s.npcs[i].override&&!encounterFor(s,i)&&!activeMeeting(s);}
function scheduleDuties(s:Simulation) {
 const now=absoluteMinute(s),planned=schedule(s.gameMinute);if(!['work','lunch'].includes(planned)||activeMeeting(s))return;
 if(planned==='work'&&now>=s.nextIssueAt){
  if(!s.computerIssues.some(issue=>issue.resolvedAt===null)){const owners=[0,1,2,3,4,7],owner=owners[Math.floor(random(s)*owners.length)];s.computerIssues=[...s.computerIssues.slice(-8),{owner,reportedAt:now,resolvedAt:null}];event(s,'Komputer '+staff[owner].name+' bermasalah. NEXUS menerima permintaan bantuan.');}s.nextIssueAt=now+80+random(s)*70;
 }
 const issue=s.computerIssues.find(issue=>issue.resolvedAt===null);if(planned==='work'&&issue&&availableForDuty(s,5))startDuty(s,5,'repair',issue.owner,12);
 if(planned==='work'&&now>=s.nextManagementAt&&availableForDuty(s,0)){
  if(s.managementRound%2===0&&availableForDuty(s,7)){startDuty(s,0,'private',7,15);startDuty(s,7,'private',0,15);}
  else {const team=[1,2,3,4,5],target=team[Math.floor(s.managementRound/2)%team.length];if(availableForDuty(s,target)&&['work','waiting'].includes(baselineActivity(s,target)))startDuty(s,0,'inspect',target,6);}
  s.managementRound++;s.nextManagementAt=now+65+random(s)*35;
 }
 for(const i of STAFF_WORKERS){
  const n=s.npcs[i];if(now<n.nextLeisureAt||!availableForDuty(s,i)||n.path.length||pointDistance(n.position,activityGoal(s,i))>.1||s.npcs[0].duty?.kind==='inspect'&&s.npcs[0].duty.target===i)continue;
  const roll=random(s),kind:DutyKind=roll<.3?'toilet':roll<.52?'read':roll<.77?'drink':roll<.95?'cook':i===2?'hr':'drink';let target=0;
  if(kind==='toilet'){const free=[9,10].filter(room=>!s.npcs.some(n=>n.duty?.kind==='toilet'&&n.duty.target===room));if(!free.length){n.nextLeisureAt=now+10;continue;}target=free[Math.floor(random(s)*free.length)];}
  if(kind==='read'){const free=[0,1].filter(slot=>!s.npcs.some(n=>n.duty?.kind==='read'&&n.duty.target===slot));if(!free.length){n.nextLeisureAt=now+10;continue;}target=free[0];}
  if(['drink','cook','hr'].includes(kind)&&s.npcs.some(n=>n.duty?.kind===kind)){n.nextLeisureAt=now+10;continue;}
  startDuty(s,i,kind,target,{private:15,inspect:6,repair:12,read:12,toilet:6,drink:4,cook:10,hr:8}[kind]);s.npcs[i].nextLeisureAt=now+110+random(s)*50;
 }
}
function completeDuty(s:Simulation,i:number) {
 const n=s.npcs[i],d=n.duty;if(!d)return;s.completedDuties={...s.completedDuties,[d.kind]:s.completedDuties[d.kind]+1};
 if(d.kind==='repair'){s.computerIssues=s.computerIssues.map(issue=>issue.owner===d.target&&issue.resolvedAt===null?{...issue,resolvedAt:absoluteMinute(s)}:issue);event(s,'NEXUS memperbaiki komputer '+staff[d.target].name+'. Pekerjaan dapat dilanjutkan.');}
 else event(s,n.name+' selesai '+activityLabels[d.kind].toLowerCase()+'.');
 n.duty=null;n.nextLeisureAt=Math.max(n.nextLeisureAt,absoluteMinute(s)+45);n.focus=clamp(n.focus+5);n.social=clamp(n.social+3);
}
function advanceDuties(s:Simulation,elapsed:number) {
 const now=absoluteMinute(s),privateDuty=s.npcs[0].duty;
 if(privateDuty?.kind==='private'){
  const partner=s.npcs[7].duty;
  if(partner?.kind!=='private')s.npcs[0].duty=null;
  else if(!s.npcs[0].path.length&&!s.npcs[7].path.length&&pointDistance(s.npcs[0].position,dutyGoal(s,0))<.1&&pointDistance(s.npcs[7].position,dutyGoal(s,7))<.1){
   const progress=privateDuty.phase==='active'?privateDuty.elapsed+elapsed:0;s.npcs[0].duty={...privateDuty,phase:'active',elapsed:progress};s.npcs[7].duty={...partner,phase:'active',elapsed:progress};if(progress>=privateDuty.duration){completeDuty(s,0);completeDuty(s,7);}
  }
 }
 for(const i of STAFF_WORKERS){
  const n=s.npcs[i],d=n.duty;if(!d||d.kind==='private')continue;
  if(now>=d.deadline||d.kind==='inspect'&&(!availableForDuty(s,d.target)||!['work','waiting'].includes(baselineActivity(s,d.target)))){n.duty=null;event(s,n.name+' menjadwalkan ulang kegiatan.');continue;}
  if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1){n.duty={...d,phase:'active',elapsed:d.phase==='active'?d.elapsed+elapsed:0};if(n.duty.elapsed>=n.duty.duration)completeDuty(s,i);}
 }
 if(s.npcs[0].duty?.kind==='private'&&now>=s.npcs[0].duty.deadline){s.npcs[0].duty=null;s.npcs[7].duty=null;}
}
const clientQueue:Point=[-8.4,4.95,0],clientBench:Point=[-8.2,4.5,0];
function moveClients(s:Simulation,elapsed:number) {
 const now=absoluteMinute(s);
 if(officeOpen(s.gameMinute)&&s.gameMinute>=570&&now>=s.nextClientAt&&s.clients.length<2){const id=s.clients.length;s.clients=[...s.clients,{id,name:id?'Client Raka':'Client Maya',position:outside(id),path:[],phase:'arriving',stayUntil:0}];s.nextClientAt=now+160;event(s,'Seorang client datang untuk menemui resepsionis.');}
 s.clients=s.clients.map(c=>{
  const client={...c};if(!officeOpen(s.gameMinute)&&['arriving','served'].includes(client.phase))client.phase='leaving';if(client.phase==='served'&&now>=client.stayUntil)client.phase='leaving';
  const goal=client.phase==='leaving'||client.phase==='offsite'?outside(client.id):s.reception.client&&s.reception.person===client.id?ATTENDANCE_POINT:client.phase==='served'?clientBench:clientQueue;
  const end=client.path.at(-1);if(client.phase!=='offsite'&&(!end&&pointDistance(client.position,goal)>.05||end&&pointDistance(end,goal)>.05))client.path=findPath(client.position,goal);
  const m=moveAlong(client.position,client.path,elapsed*WALK_SPEED);client.position=m.position;client.path=m.path;if(!client.path.length&&client.phase==='arriving')client.phase='waiting';if(!client.path.length&&client.phase==='leaving')client.phase='offsite';return client;
 });
}
function serveReception(s:Simulation,elapsed:number) {
 const now=absoluteMinute(s),amanda=s.npcs[6],r=s.reception;if(amanda.presence!=='inside')return;
 if(r.person===null){
  const employee=s.npcs.findIndex((n,i)=>isWorker(i)&&['checking-in','checking-out'].includes(n.presence)&&!n.path.length&&pointDistance(n.position,attendancePoint(i))<.1);
  const client=s.clients.findIndex(c=>c.phase==='waiting'&&!c.path.length&&pointDistance(c.position,clientQueue)<.1);
  if(employee>=0){r.person=employee;r.client=false;r.mode=s.npcs[employee].presence==='checking-out'?'out':'in';r.phase='approach';r.elapsed=0;}
  else if(client>=0){r.person=client;r.client=true;r.mode='visitor';r.phase='approach';r.elapsed=0;}
 }
 if(r.person!==null){
  const person=r.client?s.clients[r.person]:s.npcs[r.person];if(!person){r.person=null;return;}
  if(!r.client&&(person as NpcState).presence==='checking-out')r.mode='out';
  if(!person.path.length&&pointDistance(person.position,ATTENDANCE_POINT)<.1){
   r.elapsed=r.phase==='service'?r.elapsed+elapsed:0;r.phase='service';amanda.greetUntil=now+1;
   if(r.elapsed>=2){
    const name=person.name;logAttendance(s,name,r.client?'client':r.mode==='out'?'out':'in');
    if(r.client){const c=person as ClientState;c.phase='served';c.stayUntil=now+5;event(s,'Amanda menyambut '+name+' dan mencatat kunjungannya.');}
    else {const n=person as NpcState;if(r.mode==='in'){n.presence='inside';n.attendanceIn=now;event(s,name+' selesai absen masuk. Menuju ruang kerja.');}else{n.presence='leaving';n.attendanceOut=now;event(s,name+' selesai absen pulang. Sampai besok!');}}
    r.person=null;r.elapsed=0;r.phase='approach';
   }
  }
 }
 if(!officeOpen(s.gameMinute)&&r.person===null&&!s.npcs.some((n,i)=>isWorker(i)&&['inside','arriving','checking-in','checking-out'].includes(n.presence))&&!s.clients.some(c=>['waiting','arriving','served'].includes(c.phase))){
  amanda.presence='leaving';amanda.attendanceOut=now;logAttendance(s,'Amanda','out');event(s,'Semua absen pulang tercatat. Amanda menutup resepsionis.');
 }
}
function tick(current:Simulation,elapsed:number):Simulation {
 const total=current.gameMinute+elapsed,gameDay=current.gameDay+Math.floor(total/1440),gameMinute=total%1440,now=(gameDay-1)*1440+gameMinute;

 const s:Simulation={...current,gameDay,gameMinute,npcs:current.npcs.map(n=>({...n,duty:n.duty?{...n.duty}:null})),meeting:gameDay===current.gameDay?{...current.meeting}:planMeeting(gameDay),events:[...current.events],reception:{...current.reception,log:[...current.reception.log]},computerIssues:current.computerIssues.map(i=>({...i})),clients:current.clients.map(c=>({...c})),completedDuties:{...current.completedDuties}};
 if(gameDay!==current.gameDay){s.npcs=s.npcs.map((n,i)=>({...n,attendanceIn:null,attendanceOut:null,nextLeisureAt:now+520+i*17}));s.clients=[];s.reception.person=null;s.nextManagementAt=now+500;s.nextIssueAt=now+540;s.nextClientAt=now+580;s.managementRound=0;}
 const boundary=schedule(current.gameMinute)!==schedule(gameMinute);
 if(boundary){s.encounters=[];s.npcs=s.npcs.map((n,i)=>({...n,override:null,duty:null,errandUntil:0,nextLeisureAt:Math.max(n.nextLeisureAt,now+20+i*12)}));event(s,gameMinute>=1020?'17.00 · Tim kembali ke Amanda untuk absen pulang.':gameMinute>=780?'13.00 · Tim kembali bekerja.':gameMinute>=720?'12.00 · Makan siang bersama di pantry.':gameMinute>=480?'08.00 · Jam kerja dimulai.':'07.00 · Kantor dibuka, Amanda menyiapkan absensi.');}
 if(schedule(gameMinute)==='work'&&s.meeting.phase==='scheduled'&&gameMinute>=s.meeting.start){s.meeting.phase='gathering';s.encounters=[];s.npcs=s.npcs.map((n,i)=>({...n,duty:null,override:null,nextLeisureAt:Math.max(n.nextLeisureAt,now+s.meeting.duration+85+i*12)}));event(s,'Rapat dimulai setelah tujuh peserta duduk di lantai dua.');}
 if(schedule(gameMinute)!=='work'&&activeMeeting(s))s.meeting.phase='done';
 if(s.meeting.phase==='gathering'&&gameMinute>=s.meeting.start+65){s.meeting.phase='done';event(s,'Rapat ditunda karena peserta belum lengkap.');}
 s.npcs=s.npcs.map((n,i)=>{
  const npc={...n};if(!officeOpen(gameMinute)&&i!==6&&['inside','arriving','checking-in'].includes(npc.presence)){npc.presence='checking-out';npc.duty=null;npc.override=null;}
  if(officeOpen(gameMinute)&&npc.presence==='offsite'&&gameMinute>=arrivalMinute(i)){npc.presence='arriving';npc.position=outside(i);npc.path=[];event(s,npc.name+' tiba di pintu kantor.');}
  if(npc.override&&npc.override.until<=now)npc.override=null;return npc;
 });
 scheduleDuties(s);
 s.npcs=s.npcs.map((original,i)=>{
  const n={...original},e=encounterFor(s,i),goal=activityGoal(s,i),end=n.path.at(-1);let path=n.path;
  if(n.presence!=='offsite'&&(!end&&pointDistance(n.position,goal)>.05||end&&pointDistance(end,goal)>.05))path=findPath(n.position,goal);
  const m=n.presence==='offsite'?{position:n.position,path:[],distanceUsed:0}:moveAlong(n.position,path,elapsed*WALK_SPEED);n.position=m.position;n.path=m.path;n.destination=roomAt(goal)??staff[i].roomId;
  if(!n.path.length&&n.presence==='arriving'){if(i===6){n.presence='inside';n.attendanceIn=now;logAttendance(s,'Amanda','in');event(s,'Amanda siap melayani absen dan tamu.');}else n.presence='checking-in';}
  if(!n.path.length&&n.presence==='leaving'){n.presence='offsite';event(s,n.name+' meninggalkan kantor.');}
  s.npcs[i]=n;n.activity=e?e.roomId===2?'meeting':schedule(gameMinute)==='lunch'?'lunch':'break':baselineActivity(s,i);
  const working=n.presence==='inside'&&!n.path.length&&n.activity==='work'&&!n.duty&&!e,relaxing=n.presence==='offsite'||!n.path.length&&['lunch','break','drink','cook','read'].includes(n.activity);
  n.energy=clamp(n.energy+elapsed*(relaxing?.3:-.03));n.focus=clamp(n.focus+elapsed*(relaxing?.5:working?-.05:-.008));n.social=clamp(n.social+elapsed*(relaxing?.12:-.012));n.workMinutes+=working?Math.max(0,elapsed-m.distanceUsed/WALK_SPEED):0;
  if(n.workMinutes>=60){const rewards=Math.floor(n.workMinutes/60)*10;s.credits+=rewards;n.workMinutes%=60;event(s,n.name+' menyelesaikan pekerjaan · +'+rewards+' HQ Credits');}return n;
 });
 moveClients(s,elapsed);serveReception(s,elapsed);advanceDuties(s,elapsed);
 if(s.meeting.phase==='gathering'&&STAFF_WORKERS.every(i=>s.npcs[i].presence==='inside'&&!s.npcs[i].path.length&&pointDistance(s.npcs[i].position,meetingSeat(meetingSlot(i)).position)<.1)){s.meeting.phase='discussing';s.meeting.elapsed=0;event(s,'Enam karyawan dan Akbar sudah duduk. Rapat berlangsung '+s.meeting.duration+' menit game.');}
 else if(s.meeting.phase==='discussing'){s.meeting.elapsed=Math.min(s.meeting.duration,s.meeting.elapsed+elapsed);if(s.meeting.elapsed>=s.meeting.duration){s.meeting.phase='done';event(s,'Rapat selesai. Tim kembali ke pekerjaan masing-masing.');}}
 return advanceSocial(s,elapsed);
}
export function stepSimulation(current:Simulation,realSeconds:number,speed:number):Simulation {
 if(speed===0||!Number.isFinite(realSeconds)||realSeconds<=0||!Number.isFinite(speed)||speed<0)return current;
 let remaining=realSeconds*speed,s=current;while(remaining>.0000001){const dt=Math.min(remaining,.5);s=tick(s,dt);remaining-=dt;}return s;
}
export function assignActivity(s:Simulation,i:number,activity:'work'|'break'):Simulation {
 if(!isWorker(i)||s.npcs[i].presence!=='inside'||schedule(s.gameMinute)!=='work'||activeMeeting(s)||s.npcs[i].duty)return s;
 s=cancelInteraction(s,i);return {...s,npcs:s.npcs.map((n,index)=>index===i?{...n,override:{activity,until:Math.min(absoluteMinute(s)+60,(s.gameDay-1)*1440+(s.gameMinute<720?720:1020))}}:n)};
}
export function greet(s:Simulation,i:number):Simulation {
 if(!s.npcs[i]||!['inside','checking-in'].includes(s.npcs[i].presence))return s;
 return {...s,npcs:s.npcs.map((n,index)=>index===i?{...n,social:clamp(n.social+12),greetUntil:absoluteMinute(s)+4}:n),events:[staff[i].name+': Selamat datang di HQ! Semoga harimu menyenangkan.',...s.events].slice(0,8)};
}


const finite=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validPoint=(v:unknown):v is Point=>Array.isArray(v)&&(v.length===2||v.length===3)&&v.every(n=>typeof n==='number'&&Number.isFinite(n))&&isWalkable(v as Point);
export function defaultSave():SaveData {return {version:5,simulation:createSimulation(),roomId:0,mode:'director',avatar:nearestWalkable([-10.9,6.7,0]),speed:1,reducedMotion:false,savedAt:'',floorView:'all'};}
export function parseSave(json:string|null):SaveData {
 const fallback=defaultSave();if(!json)return fallback;
 try {
  const data=record(JSON.parse(json)),version=Number(data.version),raw=record([2,3,4,5].includes(version)?data.simulation:data);
  const s=createSimulation(Math.floor(finite(raw.gameDay,1,999999,1)),finite(raw.gameMinute,0,1439.999,420),finite(raw.credits,0,1e12,1250)),now=absoluteMinute(s);
  if(version===5){
   const m=record(raw.meeting);if(m.day===s.gameDay&&m.start===s.meeting.start&&m.duration===s.meeting.duration&&['scheduled','gathering','discussing','done'].includes(String(m.phase)))s.meeting={...s.meeting,phase:m.phase as MeetingPlan['phase'],elapsed:finite(m.elapsed,0,s.meeting.duration,0)};
   if(schedule(s.gameMinute)!=='work'&&activeMeeting(s))s.meeting.phase='done';
   s.rng=Math.floor(finite(raw.rng,0,4294967295,s.rng));s.managementRound=Math.floor(finite(raw.managementRound,0,1e9,0));
   for(const key of ['nextManagementAt','nextIssueAt','nextClientAt'] as const)s[key]=finite(raw[key],now-200,now+2000,s[key]);
   const duties=record(raw.completedDuties);for(const key of Object.keys(s.completedDuties) as DutyKind[])s.completedDuties[key]=Math.floor(finite(duties[key],0,1e9,0));
   if(Array.isArray(raw.computerIssues))s.computerIssues=raw.computerIssues.slice(-9).flatMap(v=>{const issue=record(v);return isWorker(Number(issue.owner))?[{owner:Number(issue.owner),reportedAt:finite(issue.reportedAt,0,now,now),resolvedAt:issue.resolvedAt===null?null:finite(issue.resolvedAt,0,now,now)}]:[];}).filter((issue,i,all)=>all.findIndex(other=>other.owner===issue.owner&&other.resolvedAt===null)===i||issue.resolvedAt!==null);
  }
  if([2,3,4,5].includes(version)&&Array.isArray(raw.npcs))s.npcs=s.npcs.map((n,i)=>{
   const saved=record((raw.npcs as unknown[]).find(v=>record(v).name===n.name)),order=record(saved.override),until=finite(order.until,now,now+60,0);
   let presence=n.presence,position=n.position,duty:NpcDuty|null=null;
   if(version===5&&['offsite','arriving','checking-in','inside','checking-out','leaving'].includes(String(saved.presence))&&validPoint(saved.position)){presence=saved.presence as NpcState['presence'];position=saved.position;}
   if(!officeOpen(s.gameMinute)&&i!==6&&['inside','arriving','checking-in'].includes(presence))presence='checking-out';
   if(officeOpen(s.gameMinute)&&s.gameMinute<arrivalMinute(i)){presence='offsite';position=outside(i);}
   if(version===5&&isWorker(i)&&presence==='inside'&&!activeMeeting(s)&&officeOpen(s.gameMinute)){
    const d=record(saved.duty),kind=String(d.kind) as DutyKind,target=Math.floor(finite(d.target,0,10,0));
    const targetValid=kind==='private'?(i===0&&target===7||i===7&&target===0):kind==='repair'?i===5&&isWorker(target):kind==='inspect'?i===0&&isWorker(target)&&target!==0:kind==='toilet'?[9,10].includes(target):['read','hr'].includes(kind)?[0,1].includes(target):['drink','cook'].includes(kind);
    if(Object.hasOwn(s.completedDuties,kind)&&targetValid)duty={kind,target,phase:d.phase==='active'?'active':'travel',elapsed:finite(d.elapsed,0,30,0),duration:finite(d.duration,1,30,10),deadline:finite(d.deadline,now+.001,now+150,now+150)};
   }
   return {...n,presence,position,duty,override:isWorker(i)&&until&&schedule(s.gameMinute)==='work'&&(order.activity==='work'||order.activity==='break')?{activity:order.activity,until} as NpcState['override']:null,energy:finite(saved.energy,0,100,85),focus:finite(saved.focus,0,100,90),social:finite(saved.social,0,100,75),workMinutes:finite(saved.workMinutes,0,59.9999,0),greetUntil:finite(saved.greetUntil,0,now+4,0),nextSocialAt:finite(saved.nextSocialAt,0,now+1000,now+20+i*3),nextLeisureAt:finite(saved.nextLeisureAt,now-200,now+2000,now+45+i*12),attendanceIn:version===5?(saved.attendanceIn===null?null:finite(saved.attendanceIn,0,now,n.attendanceIn??now)):n.attendanceIn,attendanceOut:version===5&&typeof saved.attendanceOut==='number'?finite(saved.attendanceOut,0,now,0):null};
  });
  if((s.npcs[0].duty?.kind==='private')!==(s.npcs[7].duty?.kind==='private')){if(s.npcs[0].duty?.kind==='private')s.npcs[0].duty=null;if(s.npcs[7].duty?.kind==='private')s.npcs[7].duty=null;}
  const reservations=new Set<string>();for(const n of s.npcs){if(!n.duty||!['read','toilet','drink','cook','hr'].includes(n.duty.kind))continue;const key=n.duty.kind+':'+n.duty.target;if(reservations.has(key))n.duty=null;else reservations.add(key);}
  const bonds=record(raw.bonds);for(const key of Object.keys(s.bonds))s.bonds[key]=finite(bonds[key],0,100,25);
  s.completedInteractions=Math.floor(finite(raw.completedInteractions,0,1e9,0));s.nextEncounterId=Math.floor(finite(raw.nextEncounterId,1,1e9,1));
  if(Array.isArray(raw.events))s.events=raw.events.filter((e):e is string=>typeof e==='string'&&e.length>0&&e.length<=240).slice(0,8).map(e=>e.replace(/VANDERLEINZ(?: AI)?(?: HQ)?/gi,'Blue and Space'));
  if(version===5){
   const r=record(raw.reception);
   if(Array.isArray(r.log))s.reception.log=r.log.slice(0,24).flatMap(v=>{const e=record(v);return typeof e.name==='string'&&e.name.length<100&&['in','out','client'].includes(String(e.kind))?[{day:Math.floor(finite(e.day,1,s.gameDay,s.gameDay)),name:e.name,kind:e.kind as AttendanceEntry['kind'],at:finite(e.at,0,1440,0)}]:[];});
   if(Array.isArray(raw.clients))s.clients=raw.clients.slice(0,2).flatMap((v,i)=>{const c=record(v);return validPoint(c.position)&&['arriving','waiting','served','leaving','offsite'].includes(String(c.phase))?[{id:i,name:i?'Client Raka':'Client Maya',position:c.position,path:[],phase:c.phase as ClientState['phase'],stayUntil:finite(c.stayUntil,0,now+10,now+5)}]:[];});
   if(typeof r.person==='number'&&Number.isInteger(r.person)){
    const client=r.client===true,p=r.person,valid=client?s.clients[p]?.phase==='waiting':isWorker(p)&&['checking-in','checking-out'].includes(s.npcs[p]?.presence);
    if(valid)s.reception={...s.reception,person:p,client,mode:client?'visitor':s.npcs[p].presence==='checking-out'?'out':'in',phase:r.phase==='service'?'service':'approach',elapsed:finite(r.elapsed,0,1.999,0)};
   }
  }
  if(!officeOpen(s.gameMinute)&&s.npcs.some((n,i)=>isWorker(i)&&n.presence==='checking-out')&&s.npcs[6].presence==='offsite'){s.npcs[6].presence='inside';s.npcs[6].position=RECEPTION_POST;}
  const busy=new Set<number>(),chairs=new Set<string>(),ids=new Set<number>();
  if(version===5&&officeOpen(s.gameMinute)&&!activeMeeting(s)&&Array.isArray(raw.encounters))for(const v of raw.encounters.slice(0,3)){
   const e=record(v),pair=e.participants,seats=e.chairs;if(!Array.isArray(pair)||pair.length!==2||!pair.every(i=>isWorker(i)&&s.npcs[i].presence==='inside'&&!s.npcs[i].duty)||pair[0]===pair[1]||pair.some(i=>busy.has(i)))continue;
   if(!Object.hasOwn(interactionLabels,String(e.kind))||![2,5].includes(Number(e.roomId))||e.roomId===2&&schedule(s.gameMinute)==='lunch'||!Array.isArray(seats)||seats.length!==2||seats[0]===seats[1]||!seats.every(i=>Number.isInteger(i)&&i>=0&&i<7))continue;
   const keys=seats.map(i=>e.roomId+':'+i);if(keys.some(k=>chairs.has(k)))continue;
   const kind=e.kind as Encounter['kind'],timeout=finite(e.timeout,now+.001,now+150,0),id=Math.floor(finite(e.id,1,1e9,s.nextEncounterId));if(!timeout||ids.has(id))continue;
   const enc:Encounter={id,participants:pair as [number,number],chairs:seats as [number,number],kind,roomId:Number(e.roomId),slot:seats[0],phase:e.phase==='talking'?'talking':'approach',elapsed:finite(e.elapsed,0,interactionDuration[kind]-.001,0),timeout};s.encounters.push(enc);pair.forEach(i=>busy.add(i));keys.forEach(k=>chairs.add(k));ids.add(id);s.nextEncounterId=Math.max(s.nextEncounterId,id+1);
  }
  s.npcs=s.npcs.map((n,i)=>{const goal=activityGoal(s,i);return {...n,activity:baselineActivity(s,i),destination:roomAt(goal)??staff[i].roomId,path:n.presence==='offsite'?[]:findPath(n.position,goal)};});
  return {version:5,simulation:s,roomId:Math.floor(finite(data.roomId,0,10,0)),mode:data.mode==='avatar'?'avatar':'director',avatar:version===5&&validPoint(data.avatar)?data.avatar:fallback.avatar,speed:[0,1,2,3].includes(Number(data.speed))&&typeof data.speed==='number'?data.speed:1,reducedMotion:data.reducedMotion===true,savedAt:typeof data.savedAt==='string'?data.savedAt:'',floorView:version===5&&(data.floorView===0||data.floorView===1)?data.floorView:'all'};
 }catch{return fallback;}
}
export function loadGame():SaveData {

 try{return parseSave(localStorage.getItem(SAVE_KEY)??localStorage.getItem(PREVIOUS_KEY)??localStorage.getItem('vanderleinz-hq-milestone-4')??localStorage.getItem('vanderleinz-hq-milestone-3')??localStorage.getItem('vanderleinz-hq-milestone-2')??localStorage.getItem(LEGACY_KEY));}catch{return defaultSave();}
}
