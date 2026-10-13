import { staff, rooms, STAFF_WORKERS, MEETING_PARTICIPANTS } from './worldData.ts';
import { findPath, isWalkable, nearestWalkable, roomAt, pointDistance, onStairs } from './navigation.ts';
import type { Point } from './navigation.ts';
import { ENTRY_POINT, RECEPTION_POST, ATTENDANCE_POINT, workSeat, meetingSeat, lunchSeat, meetingSlot, lunchSlot, librarySeat, hrdSeat, founderMeetingSeat, clientMeetingSeat, clientServicePoint, toiletPoint, pantryDrinkPoint, pantryCookPoint, inspectionPoint, attendancePoint, arrivalMinute, roomLocal, receptionBreakSeat, servicePoint, cleaningPoint } from './officeLayout.ts';
import type { Seat } from './officeLayout.ts';
import { initialBonds, encounterFor, interactionGoal, advanceSocial, cancelInteraction, interactionLabels, interactionDuration } from './social.ts';
import type { Encounter } from './social.ts';
import { CLIENT_VARIANT_START, characterProfile, defaultCharacterProfiles } from './characterProfiles.ts';
import { newOfficeServices, recipientKey, drinkPlacement, nextCleaningRoom } from './officeServices.ts';
import type { OfficeServices, DrinkRecipient } from './officeServices.ts';
import { moveInCrowd } from './crowd.ts';
import { PROJECT, projectAssignment, projectBeat, projectGoal, projectSeat } from './projectStory.ts';
import type { ProjectMark } from './projectStory.ts';

export const activityLabels={prepare:'Bersiap di kantor',work:'Bekerja',meeting:'Rapat tim',break:'Istirahat',lunch:'Makan siang',leave:'Pulang',offsite:'Di luar kantor',checkin:'Absen masuk',checkout:'Absen pulang',reception:'Melayani tamu',private:'Diskusi proyek',client:'Menemui client',inspect:'Memeriksa pekerjaan tim',repair:'Memperbaiki komputer',read:'Membaca buku',toilet:'Menggunakan WC',drink:'Mengambil minum',cook:'Memasak di pantry',hr:'Konsultasi HRD',waiting:'Komputer bermasalah',coffee:'Menyiapkan dan mengantar kopi',clean:'Membersihkan kantor',support:'Mendampingi pertemuan client'};
export type Activity=keyof typeof activityLabels;
export type DutyKind='private'|'client'|'inspect'|'repair'|'read'|'toilet'|'drink'|'cook'|'hr'|'coffee'|'clean'|'support';
export type BreakPlan={day:number;kind:'desk'|'pantry'|'library'|'reception'|'ob';slot:number};
export type NpcDuty={kind:DutyKind;target:number;phase:'travel'|'active';elapsed:number;duration:number;deadline:number;seatSlot?:number};
export type NpcState={
 name:string;position:Point;path:Point[];activity:Activity;destination:number;presence:'offsite'|'arriving'|'checking-in'|'inside'|'checking-out'|'leaving';
 energy:number;focus:number;social:number;workMinutes:number;nextSocialAt:number;greetUntil:number;nextErrandAt:number;errandUntil:number;nextLeisureAt:number;duty:NpcDuty|null;attendanceIn:number|null;attendanceOut:number|null;
 override:{activity:'work'|'break';until:number}|null;breakPlan:BreakPlan|null;queueJoinedAt:number|null;
};
export type MeetingPlan={day:number;start:number;duration:30|45|60;phase:'scheduled'|'gathering'|'discussing'|'done';elapsed:number};
export type ClientState={id:number;name:string;variant:number;target:'owner'|'atlas'|'both';ownerJoined:boolean;seatSlot:1|3;position:Point;path:Point[];phase:'arriving'|'waiting'|'served'|'meeting'|'leaving'|'offsite';stayUntil:number;teamCalled?:boolean;supportWaitUntil?:number;projectId?:string};
export type AttendanceEntry={day:number;name:string;kind:'in'|'out'|'client';at:number};
export type ReceptionState={person:number|null;client:boolean;mode:'in'|'out'|'visitor';phase:'approach'|'service';elapsed:number;log:AttendanceEntry[]};
export type ComputerIssue={owner:number;reportedAt:number;resolvedAt:number|null};
export type Simulation={
 project?:ProjectMark;
 gameDay:number;gameMinute:number;credits:number;hqPoints:number;ownerRoom:number|null;ownerActive:boolean;ownerActivity:string|null;ownerCheckedIn:boolean;npcs:NpcState[];events:string[];encounters:Encounter[];bonds:Record<string,number>;completedInteractions:number;nextEncounterId:number;meeting:MeetingPlan;
 reception:ReceptionState;computerIssues:ComputerIssue[];clients:ClientState[];nextClientId:number;rng:number;nextManagementAt:number;nextIssueAt:number;nextClientAt:number;managementRound:number;completedDuties:Record<DutyKind,number>;services:OfficeServices;
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
const outside=(i:number):Point=>[ENTRY_POINT[0]+(i%3-1)*.35,ENTRY_POINT[1]+(i%2)*.14,0];
const activeMeeting=(s:Simulation)=>['gathering','discussing'].includes(s.meeting.phase);
const emptyDuties=():Record<DutyKind,number>=>({private:0,client:0,inspect:0,repair:0,read:0,toilet:0,drink:0,cook:0,hr:0,coffee:0,clean:0,support:0});
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
export function attendanceQueue(s:Simulation):number[] {
 return STAFF_WORKERS.filter(i=>['arriving','checking-in','checking-out'].includes(s.npcs[i].presence)&&!(s.reception.person===i&&!s.reception.client)).sort((a,b)=>(s.npcs[a].queueJoinedAt??((s.gameDay-1)*1440+arrivalMinute(a)))-(s.npcs[b].queueJoinedAt??((s.gameDay-1)*1440+arrivalMinute(b)))||a-b);
}
export const queuePoint=(s:Simulation,index:number):Point=>attendancePoint(STAFF_WORKERS[Math.max(0,attendanceQueue(s).indexOf(index))]);
export function breakSeat(s:Simulation,index:number):Seat {
 const plan=s.npcs[index].breakPlan;
 if(!plan||plan.kind==='desk'||plan.kind==='ob')return workSeat(index);
 return plan.kind==='library'?librarySeat(plan.slot):plan.kind==='reception'?receptionBreakSeat(plan.slot):lunchSeat(plan.slot);
}
function planBreaks(s:Simulation) {
 const librarySlots=[0,1,2],receptionSlots=[0,1,2];let pantryCount=0;
 for(const index of STAFF_WORKERS){
  const roll=random(s);let kind:BreakPlan['kind']=index>=8?'ob':roll<.36&&pantryCount<4?'pantry':roll<.62?'desk':roll<.81&&librarySlots.length?'library':receptionSlots.length?'reception':'desk';if(kind==='pantry')pantryCount++;
  const slot=kind==='library'?librarySlots.shift()!:kind==='reception'?receptionSlots.shift()!:lunchSlot(index);
  s.npcs[index].breakPlan={day:s.gameDay,kind,slot};
 }
}
function randomBreakPlan(s:Simulation,index:number):BreakPlan {
 const otherGoals=s.npcs.flatMap((npc,i)=>i!==index&&npc.presence==='inside'?[npc.position,activityGoal(s,i)]:[]);
 const freeSlots=(seatAt:(slot:number)=>Seat,count:number)=>Array.from({length:count},(_,slot)=>slot).filter(slot=>!otherGoals.some(point=>pointDistance(point,seatAt(slot).position)<.55));
 const librarySlots=freeSlots(librarySeat,3),receptionSlots=freeSlots(receptionBreakSeat,3),pantrySlots=freeSlots(lunchSeat,9);
 const pantryCount=s.npcs.filter((npc,i)=>i!==index&&npc.presence==='inside'&&(['break','lunch'].includes(baselineActivity(s,i))||encounterFor(s,i)?.roomId===5)&&roomAt(activityGoal(s,i))===5).length;
 const roll=random(s),kind:BreakPlan['kind']=roll<.36&&pantryCount<4&&pantrySlots.length?'pantry':roll<.62?'desk':roll<.81&&librarySlots.length?'library':receptionSlots.length?'reception':'desk';
 const slots=kind==='pantry'?pantrySlots:kind==='library'?librarySlots:kind==='reception'?receptionSlots:[];
 const preferred=lunchSlot(index),slot=kind==='pantry'&&slots.includes(preferred)?preferred:slots.length?slots[Math.floor(random(s)*slots.length)]:preferred;
 return {day:s.gameDay,kind,slot};
}
function baselineActivity(s:Simulation,i:number):Activity {
 const n=s.npcs[i],planned=schedule(s.gameMinute);
 if(n.presence==='offsite')return 'offsite';if(n.presence==='leaving')return 'leave';
 if(n.presence==='arriving'||n.presence==='checking-in')return 'checkin';if(n.presence==='checking-out')return 'checkout';
 if(i===6&&!n.duty)return !officeOpen(s.gameMinute)||s.reception.person!==null?'reception':planned==='prepare'?'prepare':'work';
 const assignment=projectAssignment(s.project,s.gameDay,s.gameMinute,i);if(assignment&&planned==='work')return assignment.place==='desk'?'work':assignment.place==='repair'?'repair':'meeting';
 if(n.duty&&['client','support'].includes(n.duty.kind))return n.duty.kind;if(planned==='work'&&activeMeeting(s)&&i<6)return 'meeting';if(n.duty)return n.duty.kind;if(planned==='lunch')return 'lunch';
 if(planned==='work'&&n.override&&n.override.until>absoluteMinute(s))return n.override.activity;
 return planned==='work'&&computerBroken(s,i)?'waiting':planned;
}
export function dutyGoal(s:Simulation,index:number):Point {
 const d=s.npcs[index].duty!;
 if(d.kind==='private')return founderMeetingSeat(index===0?1:0).position;
 if(d.kind==='client')return clientMeetingSeat(2).position;
 if(d.kind==='support')return clientSupportSeat(s,index).position;
 if(d.kind==='clean')return cleaningPoint(d.target);
 if(d.kind==='coffee'){
  const run=s.services.coffee;if(!run||run.phase==='prepare')return pantryDrinkPoint;
  if(run.recipient.kind==='client'){const client=s.clients.find(c=>c.id===run.recipient.id);return client?clientServicePoint(client.seatSlot):pantryDrinkPoint;}
  return run.recipient.kind==='owner'?servicePoint(-1):coffeeServiceGoal(s,run.recipient.id);
 }
 if(d.kind==='inspect'||d.kind==='repair')return d.target===-1?servicePoint(-1):inspectionPoint(d.target);
 if(d.kind==='read')return librarySeat(d.target).position;if(d.kind==='toilet')return toiletPoint(d.target);
 if(d.kind==='hr'&&index===7)return workSeat(7).position;
 if(d.kind==='drink')return pantryDrinkPoint;if(d.kind==='cook')return pantryCookPoint;return hrdSeat(d.target).position;
}
export function clientSupportSeat(s:Simulation,index:number):Seat {
 const duty=s.npcs[index].duty,client=s.clients.find(c=>c.id===duty?.target),group=client?.seatSlot===3?6:4;
 return clientMeetingSeat(duty?.seatSlot??group);
}
function coffeeServiceGoal(s:Simulation,index:number):Point {
 if(index>=8||index===6||pointDistance(s.npcs[index].position,workSeat(index).position)<.1)return servicePoint(index);
 const npc=s.npcs[index],seat=seatedAt(s,index)??(npc.activity==='meeting'&&index<6?meetingSeat(meetingSlot(index)):npc.duty?.kind==='read'?librarySeat(npc.duty.target):npc.duty?.kind==='client'?clientMeetingSeat(2):npc.duty?.kind==='support'?clientSupportSeat(s,index):npc.duty?.kind==='hr'&&index!==7?hrdSeat(npc.duty.target):null);if(!seat)return servicePoint(index);
 return nearestWalkable([seat.position[0]-Math.sin(seat.rotation)*.85,seat.position[1]-Math.cos(seat.rotation)*.85,seat.position[2]]);
}
export function activityGoal(s:Simulation,i:number):Point {
 const n=s.npcs[i];if(n.presence==='offsite'||n.presence==='leaving')return outside(i);if(i===6&&n.duty)return dutyGoal(s,i);if(i===6)return RECEPTION_POST;
 if(['arriving','checking-in','checking-out'].includes(n.presence))return s.reception.person===i&&!s.reception.client?ATTENDANCE_POINT:queuePoint(s,i);
 const assignment=projectAssignment(s.project,s.gameDay,s.gameMinute,i);if(assignment&&schedule(s.gameMinute)==='work')return projectGoal(assignment);
 const encounter=encounterFor(s,i);if(encounter)return interactionGoal(encounter,i);
 if(i===9&&s.services.coffee?.recipient.kind==='staff'&&s.services.coffee.recipient.id===9&&s.services.coffee.phase!=='prepare')return workSeat(9).position;
 if(i===7&&!n.duty&&s.ownerActive&&s.ownerRoom===4&&s.ownerActivity==='consult')return hrdSeat(1).position;
 if(i===7&&!n.duty){const consultation=s.npcs.findIndex((person,index)=>index<6&&person.duty?.kind==='hr');if(consultation>=0)return hrdSeat(s.npcs[consultation].duty!.target===0?1:0).position;}
 if(n.duty&&['client','support'].includes(n.duty.kind))return dutyGoal(s,i);if(schedule(s.gameMinute)==='work'&&activeMeeting(s)&&i<6)return meetingSeat(meetingSlot(i)).position;if(n.duty)return dutyGoal(s,i);
 const a=baselineActivity(s,i);if(a==='lunch'||a==='break')return breakSeat(s,i).position;return workSeat(i).position;
}
export function seatedAt(s:Simulation,i:number):Seat|null {
 const n=s.npcs[i];if(!n||n.presence!=='inside'||n.path.length||n.activity==='prepare')return null;
 const assignment=projectAssignment(s.project,s.gameDay,s.gameMinute,i);if(assignment&&schedule(s.gameMinute)==='work'){const seat=projectSeat(assignment);return seat&&pointDistance(n.position,seat.position)<.1?seat:null;}
 let seat:Seat|null=null;const e=encounterFor(s,i);
 if(i===9&&s.services.coffee?.recipient.kind==='staff'&&s.services.coffee.recipient.id===9&&s.services.coffee.phase!=='prepare')seat=workSeat(9);
 if(e)seat=(e.roomId===2?meetingSeat:lunchSeat)(e.chairs[e.participants[0]===i?0:1]);
 else if(n.duty?.phase==='active')seat=n.duty.kind==='private'?founderMeetingSeat(1):n.duty.kind==='client'?clientMeetingSeat(2):n.duty.kind==='support'?clientSupportSeat(s,i):n.duty.kind==='read'?librarySeat(n.duty.target):n.duty.kind==='hr'?i===7?workSeat(7):hrdSeat(n.duty.target):null;
 else if(i===7&&s.ownerActive&&s.ownerRoom===4&&s.ownerActivity==='consult')seat=hrdSeat(1);
 else if(i===7){const consultation=s.npcs.findIndex((person,index)=>index<6&&person.duty?.kind==='hr'&&person.duty.phase==='active');if(consultation>=0)seat=hrdSeat(s.npcs[consultation].duty!.target===0?1:0);}
 if(!seat&&n.activity==='meeting'&&i<6)seat=meetingSeat(meetingSlot(i));else if(!seat&&(n.activity==='lunch'||n.activity==='break'))seat=breakSeat(s,i);
 else if(!seat&&i!==6&&['work','waiting'].includes(n.activity))seat=workSeat(i);
 return seat&&pointDistance(n.position,seat.position)<.1?seat:null;
}
export function npcPose(s:Simulation,i:number):string {
 const n=s.npcs[i];if(n.path.length)return onStairs(n.position)?'stairs':i===8&&s.services.coffee?.phase==='carry'?'carry':'walk';if(n.greetUntil>absoluteMinute(s))return 'wave';
 if(['checking-in','checking-out'].includes(n.presence))return s.reception.person===i&&!s.reception.client?'sign':'idle';
 const assignment=projectAssignment(s.project,s.gameDay,s.gameMinute,i);if(assignment&&n.presence==='inside')return assignment.place==='repair'?'repair':assignment.place==='desk'?assignment.mood==='angry'||assignment.mood==='tired'?'think':'work':assignment.place==='library'?'read':'talk';
 if(i===9&&s.services.coffee?.recipient.kind==='staff'&&s.services.coffee.recipient.id===9&&s.services.coffee.phase!=='prepare')return 'idle';
 if(i===6&&!n.duty)return s.reception.person!==null?'talk':'idle';if(n.duty?.phase==='active')return ['private','client','support'].includes(n.duty.kind)||n.duty.kind==='hr'&&i!==7?'talk':n.duty.kind==='coffee'?s.services.coffee?.phase==='prepare'?'brew':'deliver':n.duty.kind==='toilet'?'toilet':n.duty.kind==='hr'?'read':n.duty.kind;
 if(i===7&&s.ownerActive&&s.ownerRoom===4&&s.ownerActivity==='consult')return 'talk';
 if((n.activity==='lunch'||n.activity==='break')&&s.services.catering.phase!=='ready'&&n.breakPlan?.kind!=='library')return 'phone';
 if(n.activity==='work')return i>=8?'idle':'work';if(n.activity==='waiting')return 'think';if(n.activity==='lunch'||n.activity==='break')return n.breakPlan?.kind==='library'?'read':n.breakPlan?.kind==='reception'||n.breakPlan?.kind==='desk'?'phone':Math.floor(s.gameMinute/8+i)%3===0?'phone':'eat';
 return n.activity==='meeting'?'think':'idle';
}
export function meetingDialogue(s:Simulation):{speaker:number;text:string}|null {
 if(s.meeting.phase!=='discussing')return null;const turn=Math.floor(s.meeting.elapsed/5),speaker=MEETING_PARTICIPANTS[turn%MEETING_PARTICIPANTS.length];
 const lines=['Kita mulai dari progres tim dan prioritas operasional.','Aku siapkan konsep visual untuk proyek berikutnya.','Pembagian tugas dan kebutuhan tim sudah aku catat.','Hasil riset menunjukkan arah yang menjanjikan.','Aku susun agenda komunitas untuk minggu ini.','Sistem dan komputer tim terus aku pantau.'];
 return {speaker,text:turn<6?lines[turn%6]:['Aku catat tindak lanjutnya.','Mari kita saling bantu menyelesaikannya.','Setuju. Kita lanjutkan setelah rapat.'][turn%3]};
}
export function routineDialogue(s:Simulation,i:number):{speaker:number;text:string}|null {
 if(s.reception.person!==null&&(i===6||!s.reception.client&&i===s.reception.person)){
  const r=s.reception,who=r.client?s.clients[r.person!]?.name:s.npcs[r.person!]?.name;
  if(r.client){const client=s.clients[r.person!];return {speaker:6,text:client?.target==='atlas'?'Selamat datang. Saya jadwalkan pertemuan dengan '+s.npcs[0].name+'.':client?.target==='both'?'Baik, saya kabari Founder dan '+s.npcs[0].name+' bahwa Anda sudah tiba.':'Selamat datang. Founder akan menerima Anda di ruang meeting client.'};}
  return {speaker:6,text:r.mode==='out'?'Terima kasih, '+who+'. Absen pulang dicatat.':'Selamat pagi, '+who+'. Silakan isi absen dahulu.'};
 }
 const atlas=s.npcs[0].duty;if(atlas?.kind==='private'&&atlas.phase==='active'&&i===0)return {speaker:0,text:'Saya siapkan ringkasan proyek dan catatan progres tim untuk Founder.'};
 const clientVisit=s.npcs[0].duty;if(clientVisit?.kind==='client'&&clientVisit.phase==='active'&&i===0){const client=s.clients.find(person=>person.id===clientVisit.target);if(client)return {speaker:0,text:client.target==='both'?'Saya sudah siapkan agenda. Founder, client kita sudah menunggu.':'Saya akan mendampingi '+client.name+' dan mencatat tindak lanjutnya.'};}
 const consultation=s.npcs.findIndex((person,index)=>index<6&&person.duty?.kind==='hr'&&person.duty.phase==='active');if(consultation>=0&&(i===7||i===consultation)){const duty=s.npcs[consultation].duty!,felinSpeaks=Math.floor(duty.elapsed/3)%2===0;return {speaker:felinSpeaks?7:consultation,text:felinSpeaks?'Apa yang ingin kamu kembangkan dalam peranmu? Kita susun langkah kecil yang realistis.':'Aku ingin membahas rencana pengembangan dan kebutuhan tim.'};}

 if(i===8&&s.services.coffee?.phase==='deliver')return {speaker:8,text:'Kopinya sudah siap. Selamat melanjutkan aktivitasnya!'};
 for(const [owner,n] of s.npcs.entries()){const d=n.duty;if(!d||d.phase!=='active'||!['inspect','repair'].includes(d.kind)||i!==owner&&i!==d.target)continue;const name=d.target===-1?'Founder':s.npcs[d.target].name;return {speaker:owner,text:d.kind==='repair'?'Aku periksa komputer '+name+'. Sebentar, ya.':'Bagaimana progresnya, '+name+'? Ada yang perlu dibantu?'};}return null;
}
export function createSimulation(day=1,minute=420,credits=1250):Simulation {
 const now=(day-1)*1440+minute;
 const s:Simulation={gameDay:day,gameMinute:minute,credits,hqPoints:100,ownerRoom:null,ownerActive:false,ownerActivity:null,ownerCheckedIn:false,npcs:[],meeting:planMeeting(day),events:['HQ dua lantai dibuka. Amanda menyiapkan buku absen.'],encounters:[],bonds:initialBonds(),completedInteractions:0,nextEncounterId:1,reception:{person:null,client:false,mode:'in',phase:'approach',elapsed:0,log:[]},computerIssues:[],clients:[],nextClientId:0,rng:(Math.imul(day,2654435761)>>>0),nextManagementAt:now+30,nextIssueAt:now+60,nextClientAt:now+100,managementRound:0,completedDuties:emptyDuties(),services:newOfficeServices(day,now)};
 s.npcs=staff.map((p,i)=>{const inside=officeOpen(minute)&&minute>=arrivalMinute(i);return {name:p.name,position:inside?workSeat(i).position:outside(i),path:[],activity:inside?(i===6?'work':schedule(minute)):'offsite',destination:p.roomId,presence:inside?'inside':'offsite',energy:85,focus:90,social:75,workMinutes:0,nextSocialAt:now+20+i*3,greetUntil:0,nextErrandAt:now+90,errandUntil:0,nextLeisureAt:now+40+i*12,duty:null,attendanceIn:inside?now:null,attendanceOut:null,override:null,breakPlan:null,queueJoinedAt:null};});
 if(schedule(minute)==='lunch')planBreaks(s);
 if(minute>=s.meeting.start+s.meeting.duration+65)s.meeting.phase='done';
 if(minute===420){s.npcs[6]={...s.npcs[6],presence:'arriving',position:outside(6),path:findPath(outside(6),RECEPTION_POST),attendanceIn:null};s.nextManagementAt=now+80;s.nextIssueAt=now+120;s.nextClientAt=now+150;}return s;
}
function startDuty(s:Simulation,i:number,kind:DutyKind,target:number,duration:number) {
 s.npcs[i]={...s.npcs[i],override:null,duty:{kind,target,phase:'travel',elapsed:0,duration,deadline:absoluteMinute(s)+150}};
 event(s,staff[i].name+' → '+activityLabels[kind]+(kind==='repair'||kind==='inspect'?' · '+(target===-1?'Founder':staff[target].name):''));
}
function availableForDuty(s:Simulation,i:number){return s.npcs[i].presence==='inside'&&!s.npcs[i].duty&&!s.npcs[i].override&&!encounterFor(s,i)&&!activeMeeting(s)&&!(s.services.coffee?.recipient.kind==='staff'&&s.services.coffee.recipient.id===i);}
function scheduleDuties(s:Simulation) {
 if(s.project)return;
 const now=absoluteMinute(s),planned=schedule(s.gameMinute);if(!['work','lunch'].includes(planned)||activeMeeting(s))return;
 if(planned==='work'&&now>=s.nextIssueAt){
  if(!s.computerIssues.some(issue=>issue.resolvedAt===null)){const owners=[0,1,2,3,4,7,-1],owner=owners[Math.floor(random(s)*owners.length)];s.computerIssues=[...s.computerIssues.slice(-8),{owner,reportedAt:now,resolvedAt:null}];event(s,'Komputer '+(owner===-1?'Founder':staff[owner].name)+' bermasalah. '+staff[5].name+' menerima permintaan bantuan.');}s.nextIssueAt=now+80+random(s)*70;
 }
 const issue=s.computerIssues.find(issue=>issue.resolvedAt===null);if(planned==='work'&&issue&&availableForDuty(s,5))startDuty(s,5,'repair',issue.owner,12);
 if(planned==='work'&&now>=s.nextManagementAt&&availableForDuty(s,0)){
  if(s.ownerActive&&s.ownerRoom===3&&s.managementRound%3===0)startDuty(s,0,'private',1,12);
  else {const team=[1,2,3,4,5,7],target=team[Math.floor(random(s)*team.length)];if(availableForDuty(s,target)&&['work','waiting'].includes(baselineActivity(s,target)))startDuty(s,0,'inspect',target,6);}
  s.managementRound++;s.nextManagementAt=now+65+random(s)*35;
 }
 for(const i of STAFF_WORKERS){
  if(i>=8)continue;
  if(s.services.coffee?.recipient.kind==='staff'&&s.services.coffee.recipient.id===i)continue;
  if(i===7&&s.ownerActive&&s.ownerRoom===4&&s.ownerActivity==='consult')continue;
  const n=s.npcs[i];if(now<n.nextLeisureAt||!availableForDuty(s,i)||n.path.length||pointDistance(n.position,activityGoal(s,i))>.1||s.npcs[0].duty?.kind==='inspect'&&s.npcs[0].duty.target===i)continue;
  const roll=random(s),kind:DutyKind=i===7?(roll<.48?'hr':roll<.72?'drink':roll<.9?'toilet':'read'):roll<.14?'hr':roll<.4?'toilet':roll<.66?'read':'drink';let target=0;
  if(kind==='toilet'){const free=[9,10].filter(room=>!s.npcs.some(n=>n.duty?.kind==='toilet'&&n.duty.target===room));if(!free.length){n.nextLeisureAt=now+10;continue;}target=free[Math.floor(random(s)*free.length)];}
  if(kind==='read'){const free=[0,1].filter(slot=>!s.npcs.some(n=>n.duty?.kind==='read'&&n.duty.target===slot));if(!free.length){n.nextLeisureAt=now+10;continue;}target=free[0];}
  if(kind==='hr'){
   if(s.ownerActive&&s.ownerRoom===4&&s.ownerActivity==='consult'){n.nextLeisureAt=now+18;continue;}
   const occupied=new Set(s.npcs.flatMap(person=>person.duty?.kind==='hr'?[person.duty.target]:[]));
   const free=[0,1].filter(slot=>!occupied.has(slot));if(!free.length||i!==7&&(!availableForDuty(s,7)||s.npcs.some((person,index)=>index!==7&&person.duty?.kind==='hr'))){n.nextLeisureAt=now+18;continue;}target=free[Math.floor(random(s)*free.length)];
   if(i!==7)s.npcs[7].nextLeisureAt=Math.max(s.npcs[7].nextLeisureAt,now+30);
  }
  if(['drink','cook'].includes(kind)&&s.npcs.some(person=>person.duty?.kind===kind)){n.nextLeisureAt=now+10;continue;}
  startDuty(s,i,kind,target,{private:15,client:15,inspect:6,repair:12,read:12,toilet:6,drink:4,cook:10,hr:i===7?14:8,coffee:3,clean:6,support:15}[kind]);s.npcs[i].nextLeisureAt=now+110+random(s)*50;
 }
 const amanda=s.npcs[6];if(now>=amanda.nextLeisureAt&&availableForDuty(s,6)&&!amanda.path.length&&s.reception.person===null&&!s.npcs.some(person=>['checking-in','checking-out'].includes(person.presence))&&!s.clients.some(client=>['arriving','waiting'].includes(client.phase))){
  const roll=random(s);let kind:DutyKind=roll<.5?'toilet':'drink',target=0;
  if(kind==='toilet'){const free=[9,10].filter(room=>!s.npcs.some(person=>person.duty?.kind==='toilet'&&person.duty.target===room));if(!free.length){amanda.nextLeisureAt=now+12;return;}target=free[Math.floor(random(s)*free.length)];}
  if(kind==='drink'&&s.npcs.some(person=>person.duty?.kind==='drink')){amanda.nextLeisureAt=now+12;return;}
  startDuty(s,6,kind,target,kind==='toilet'?6:4);amanda.nextLeisureAt=now+105+random(s)*65;
 }
}
function coffeeCandidates(s:Simulation):DrinkRecipient[] {
 const clients=s.clients.filter(c=>c.phase==='meeting').map(c=>({kind:'client' as const,id:c.id}));
 const team=s.npcs.flatMap((n,id)=>n.presence==='inside'&&(id>=8||!n.path.length&&(id===6&&!n.duty||!!seatedAt(s,id)))?[{kind:'staff' as const,id}]:[]);
 const owner=s.ownerActive&&s.ownerRoom===3&&s.ownerActivity==='work'?[{kind:'owner' as const,id:-1}]:[];
 const serviceDistance=(r:DrinkRecipient)=>{const goal=servicePoint(r.kind==='owner'?-1:r.id);return pointDistance(s.npcs[8].position,goal)+(Math.abs((goal[2]??0)-(s.npcs[8].position[2]??0))>1.9?60:0)+(r.kind==='staff'&&r.id>=8?100:r.kind==='staff'&&r.id===5?-50:0);};
 const ordered=[...owner,...team].sort((a,b)=>serviceDistance(a)-serviceDistance(b));
 return [...clients,...ordered].filter(r=>!s.services.served.includes(recipientKey(r)));
}
function scheduleServices(s:Simulation) {
 const now=absoluteMinute(s),services=s.services;
 services.drinks=services.drinks.filter(d=>d.expiresAt>now&&officeOpen(s.gameMinute)&&!(d.recipient.kind==='client'&&['leaving','offsite'].includes(s.clients.find(c=>c.id===d.recipient.id)?.phase??'offsite')));
 if(schedule(s.gameMinute)!=='work')return;
 const yati=s.npcs[8],deno=s.npcs[9];
 if(yati?.duty?.kind==='coffee'&&s.gameMinute>=630&&s.gameMinute<720&&services.catering.phase!=='ready'){yati.duty=null;services.coffee=null;}
 if(yati?.presence==='inside'&&!yati.duty&&!yati.override&&!encounterFor(s,8)){
  if(s.gameMinute>=630&&s.gameMinute<720&&services.catering.phase!=='ready'){
   services.coffee=null;services.catering.phase='cooking';startDuty(s,8,'cook',0,Math.max(1,24-services.catering.elapsed));
  }else if(now>=services.nextCoffeeAt){
   const recipient=coffeeCandidates(s)[0];
   if(recipient){services.coffee={phase:'prepare',recipient,elapsed:0,cupsRemaining:10};startDuty(s,8,'coffee',recipient.id,2);}
   else{const allServed=s.npcs.every((_,id)=>services.served.includes('staff:'+id));services.nextCoffeeAt=now+(allServed?75:10);if(allServed){services.coffeeRound++;services.served=services.served.filter(key=>key.startsWith('client:'));}}
  }
 }
 // A new guest moves the next coffee preparation forward without interrupting a tray already being carried.
 if(!services.coffee&&s.clients.some(c=>c.phase==='meeting'&&!services.served.includes('client:'+c.id)))services.nextCoffeeAt=Math.min(services.nextCoffeeAt,now+1);
 if(deno?.presence==='inside'&&!deno.duty&&!deno.override&&!encounterFor(s,9)&&now>=services.nextCleaningAt)startDuty(s,9,'clean',services.cleaningRoom,6);
}
function advanceCoffee(s:Simulation,elapsed:number) {
 const n=s.npcs[8],run=s.services.coffee,now=absoluteMinute(s);if(!run||n.duty?.kind!=='coffee')return;
 const recipient=run.recipient,valid=recipient.kind==='client'?s.clients.some(c=>c.id===recipient.id&&c.phase==='meeting'):recipient.kind==='owner'?s.ownerActive&&s.ownerRoom===3&&s.ownerActivity==='work':s.npcs[recipient.id]?.presence==='inside';
 if(run.phase!=='prepare'&&!valid){const next=coffeeCandidates(s)[0];if(next){run.recipient=next;run.phase='carry';run.elapsed=0;n.duty={...n.duty,phase:'travel'};}else{n.duty=null;s.services.coffee=null;s.services.nextCoffeeAt=now+1;}return;}
 if(n.path.length||pointDistance(n.position,dutyGoal(s,8))>.1)return;
 if(recipient.kind==='staff'&&recipient.id<8&&run.phase!=='prepare'&&(s.npcs[recipient.id].path.length||(recipient.id===6?!!s.npcs[6].duty:!seatedAt(s,recipient.id))))return;
 if(recipient.kind==='staff'&&recipient.id===9&&run.phase!=='prepare'&&(s.npcs[9].path.length||pointDistance(s.npcs[9].position,workSeat(9).position)>.1))return;
 n.duty={...n.duty,phase:'active'};run.elapsed+=elapsed;
 if(run.phase==='carry'){run.phase='deliver';run.elapsed=0;return;}
 if(run.elapsed<2)return;
 if(run.phase==='prepare'){run.phase='carry';run.elapsed=0;n.duty={...n.duty,phase:'travel'};return;}
 const client=recipient.kind==='client'?s.clients.find(c=>c.id===recipient.id):undefined;
 let placement=drinkPlacement(recipient,client?.seatSlot);
 if(recipient.kind==='staff'&&recipient.id<8&&recipient.id!==6&&pointDistance(s.npcs[recipient.id].position,workSeat(recipient.id).position)>.1){const seat=seatedAt(s,recipient.id)!;placement={position:[seat.position[0]+Math.sin(seat.rotation)*.68+Math.cos(seat.rotation)*.25,seat.position[1]+Math.cos(seat.rotation)*.68-Math.sin(seat.rotation)*.25,(seat.position[2]??0)+.84],rotation:seat.rotation};}
 const drink={recipient:{...recipient},...placement,deliveredAt:now,expiresAt:now+85};
 s.services.drinks=[...s.services.drinks.filter(d=>recipientKey(d.recipient)!==recipientKey(recipient)),drink];
 s.services.served.push(recipientKey(recipient));s.completedDuties.coffee++;run.cupsRemaining--;
 event(s,n.name+' mengantar kopi untuk '+(recipient.kind==='client'?client?.name:recipient.kind==='owner'?'Founder':s.npcs[recipient.id].name)+'.');
 const next=coffeeCandidates(s)[0],cateringDue=s.gameMinute>=630&&s.gameMinute<720&&s.services.catering.phase!=='ready';
 if(next&&run.cupsRemaining>0&&!cateringDue){run.recipient=next;run.phase='carry';run.elapsed=0;n.duty={...n.duty,phase:'travel',target:next.id,deadline:now+150};}
 else{n.duty=null;s.services.coffee=null;s.services.nextCoffeeAt=now+1;}
}
function assignClientSupport(s:Simulation,client:ClientState) {
 if(client.projectId)return;
 if(client.teamCalled||schedule(s.gameMinute)!=='work'||!client.ownerJoined&&!s.npcs.some(n=>n.duty?.kind==='client'&&n.duty.target===client.id&&n.duty.phase==='active')||s.npcs.some(n=>n.duty?.kind==='support'&&n.duty.target===client.id))return;
 const candidates=[1,3,4,2,5,7].filter(i=>availableForDuty(s,i)&&s.npcs[i].activity==='work').sort((a,b)=>((a+client.id)%6)-((b+client.id)%6));
 for(const [slot,i] of candidates.slice(0,client.id%2+1).entries()){startDuty(s,i,'support',client.id,25);s.npcs[i].duty!.seatSlot=(client.seatSlot===3?6:4)+slot;}
 if(candidates.length){client.teamCalled=true;client.supportWaitUntil=absoluteMinute(s)+75;}
}
function completeDuty(s:Simulation,i:number) {
 const n=s.npcs[i],d=n.duty;if(!d)return;s.completedDuties={...s.completedDuties,[d.kind]:s.completedDuties[d.kind]+1};
 if(d.kind==='repair'){s.computerIssues=s.computerIssues.map(issue=>issue.owner===d.target&&issue.resolvedAt===null?{...issue,resolvedAt:absoluteMinute(s)}:issue);event(s,staff[5].name+' memperbaiki komputer '+(d.target===-1?'Founder':staff[d.target].name)+'. Pekerjaan dapat dilanjutkan.');}
 else if(d.kind==='clean'){s.services.cleanedRooms=[...new Set([...s.services.cleanedRooms,d.target])];s.services.cleaningRoom=nextCleaningRoom(d.target);s.services.nextCleaningAt=absoluteMinute(s)+1;}
 else if(d.kind==='cook'&&i===8){s.services.catering={phase:'ready',elapsed:24};event(s,n.name+' menyiapkan catering makan siang untuk seluruh tim.');}
 else if(d.kind==='client'){
  const client=s.clients.find(person=>person.id===d.target);if(client){client.phase='leaving';client.stayUntil=absoluteMinute(s);s.hqPoints=Math.min(100,s.hqPoints+7);event(s,n.name+' menyelesaikan pertemuan dengan '+client.name+' · HQ +7.');}
 }
 else event(s,n.name+' selesai '+activityLabels[d.kind].toLowerCase()+'.');
 n.duty=null;n.nextLeisureAt=Math.max(n.nextLeisureAt,absoluteMinute(s)+45);n.focus=clamp(n.focus+5);n.social=clamp(n.social+3);
}
function advanceDuties(s:Simulation,elapsed:number) {
 const now=absoluteMinute(s);
 for(const i of [...STAFF_WORKERS,6]){
  const n=s.npcs[i],d=n.duty;if(!d)continue;
  if(d.kind==='coffee'){advanceCoffee(s,elapsed);continue;}
  if(d.kind==='support'){
   const client=s.clients.find(c=>c.id===d.target);if(!client||['leaving','offsite'].includes(client.phase)||now>=d.deadline){if(d.phase==='active')completeDuty(s,i);else{n.duty=null;n.nextLeisureAt=Math.max(n.nextLeisureAt,now+45);}continue;}
   if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1){n.duty={...d,phase:'active',elapsed:d.elapsed+elapsed};if(n.duty.elapsed>=d.duration)completeDuty(s,i);}continue;
  }
  if(d.kind==='private'){
   if(i!==0||!s.ownerActive||s.ownerRoom!==3){n.duty=null;continue;}
   if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1){n.duty={...d,phase:'active',elapsed:s.ownerActivity==='atlas'&&d.phase==='active'?d.elapsed+elapsed:0};if(n.duty.elapsed>=n.duty.duration)completeDuty(s,i);}
   continue;
  }
  const client=d.kind==='client'?s.clients.find(person=>person.id===d.target):undefined;
  if(d.kind==='client'&&(!client||client.phase==='leaving'||client.phase==='offsite')){n.duty=null;continue;}
  if(d.kind==='client'&&client?.target==='both'&&!client.ownerJoined){if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1)n.duty={...d,phase:'active',elapsed:0};continue;}
  if(d.kind==='client'&&client&&now<(client.supportWaitUntil??0)&&s.npcs.some(person=>person.duty?.kind==='support'&&person.duty.target===client.id&&person.duty.phase==='travel')){if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1)n.duty={...d,phase:'active',elapsed:0};continue;}
  if(now>=d.deadline&&d.kind!=='client'||d.kind==='inspect'&&(!availableForDuty(s,d.target)||!['work','waiting'].includes(baselineActivity(s,d.target)))){n.duty=null;event(s,n.name+' menjadwalkan ulang kegiatan.');continue;}
  if(d.kind==='hr'&&i<6){const felinSeat=hrdSeat(d.target===0?1:0).position,felin=s.npcs[7];if(felin.path.length||pointDistance(felin.position,felinSeat)>.1)continue;}
  if(!n.path.length&&pointDistance(n.position,dutyGoal(s,i))<.1){n.duty={...d,phase:'active',elapsed:d.phase==='active'?d.elapsed+elapsed:0};if(i===8&&d.kind==='cook')s.services.catering.elapsed=n.duty.elapsed;if(n.duty.elapsed>=n.duty.duration)completeDuty(s,i);}
 }
}
export const clientWaitingPoint=(client:ClientState):Point=>roomLocal(0,-1.2+(client.seatSlot===3?-.85:0),-1.75);
function moveClients(s:Simulation,elapsed:number,extraObstacles:Point[]) {
 const now=absoluteMinute(s);
 if(!s.project&&officeOpen(s.gameMinute)&&s.gameMinute>=570&&now>=s.nextClientAt&&s.clients.filter(client=>client.phase!=='offsite').length<2){
  const id=s.nextClientId++,names=['Maya','Raka','Nadia','Dimas','Sinta','Bima'],roll=random(s),target:ClientState['target']=roll<.44?'owner':roll<.74?'atlas':'both';
  const used=new Set(s.clients.filter(client=>client.phase!=='offsite').map(client=>client.seatSlot));
  const seatSlot:1|3=used.has(1)?3:1;
  const variant=CLIENT_VARIANT_START+Math.floor(random(s)*3),profile=characterProfile(variant),name=profile.name!==defaultCharacterProfiles[variant].name?profile.name:names[Math.floor(random(s)*names.length)];
  s.clients=[...s.clients,{id,name,variant,target,ownerJoined:false,seatSlot,position:outside(id+10),path:[],phase:'arriving',stayUntil:0}];
  s.nextClientAt=now+160+random(s)*80;event(s,'Client baru tiba. Amanda akan menanyakan siapa yang ingin ditemui.');
 }
 s.clients=s.clients.map((c,index)=>{
  const client={...c};
  if(!officeOpen(s.gameMinute)&&['arriving','waiting','served','meeting'].includes(client.phase)){
   if(['owner','both'].includes(client.target)&&!client.ownerJoined){s.hqPoints=Math.max(0,s.hqPoints-8);event(s,'Client '+client.name+' pulang tanpa bertemu Founder · HQ −8.');}
   client.phase='leaving';
  }
  if(client.phase==='meeting'&&client.target==='owner'&&client.ownerJoined&&now>=client.stayUntil){if(now<(client.supportWaitUntil??0)&&s.npcs.some(n=>n.duty?.kind==='support'&&n.duty.target===client.id&&n.duty.phase==='travel'))client.stayUntil=now+8;else{client.phase='leaving';s.hqPoints=Math.min(100,s.hqPoints+8);event(s,'Founder menyelesaikan pertemuan dengan '+client.name+' · HQ +8.');}}
  const goal=client.phase==='leaving'||client.phase==='offsite'?outside(client.id):s.reception.client&&s.reception.person===index?ATTENDANCE_POINT:['served','meeting'].includes(client.phase)?clientMeetingSeat(client.seatSlot).position:clientWaitingPoint(client);
  const end=client.path.at(-1);if(client.phase!=='offsite'&&(!end&&pointDistance(client.position,goal)>.05||end&&pointDistance(end,goal)>.05))client.path=findPath(client.position,goal);
  const people=[...s.npcs.flatMap((n,id)=>n.presence!=='offsite'?[{id,position:n.position,moving:!!n.path.length}]:[]),...s.clients.flatMap(c=>c.phase!=='offsite'&&c.id!==client.id?[{id:10000+c.id,position:c.position,moving:!!c.path.length}]:[]),...extraObstacles.map((position,id)=>({id:-100-id,position,moving:false}))];
  const m=moveInCrowd(client.position,client.path,elapsed*WALK_SPEED,people,10000+client.id);client.position=m.position;client.path=m.path;
  const arrived=!client.path.length&&pointDistance(client.position,goal)<.08;
  if(arrived&&client.phase==='arriving')client.phase='waiting';
  if(arrived&&client.phase==='served'){client.phase='meeting';client.stayUntil=now+999;event(s,client.name+' menunggu di Client Meeting Room.');}
  if(arrived&&client.phase==='leaving')client.phase='offsite';return client;
 });
 for(const client of s.clients){if(client.phase!=='meeting'||client.projectId)continue;if(['atlas','both'].includes(client.target)){const atlas=s.npcs[0];if(!atlas.duty&&availableForDuty(s,0))startDuty(s,0,'client',client.id,30);}assignClientSupport(s,client);}
}
function serveReception(s:Simulation,elapsed:number) {
 const now=absoluteMinute(s),amanda=s.npcs[6],r=s.reception;
 if(amanda.presence!=='inside'||amanda.duty||amanda.path.length||pointDistance(amanda.position,RECEPTION_POST)>.1)return;
 if(r.person===null){
  const first=attendanceQueue(s)[0],employee=first!==undefined&&['checking-in','checking-out'].includes(s.npcs[first].presence)&&!s.npcs[first].path.length&&pointDistance(s.npcs[first].position,queuePoint(s,first))<.1?first:-1;
  const client=s.clients.findIndex(c=>c.phase==='waiting'&&!c.path.length&&pointDistance(c.position,clientWaitingPoint(c))<.1);
  if(employee>=0){r.person=employee;r.client=false;r.mode=s.npcs[employee].presence==='checking-out'?'out':'in';r.phase='approach';r.elapsed=0;}
  else if(client>=0){r.person=client;r.client=true;r.mode='visitor';r.phase='approach';r.elapsed=0;}
 }
 if(r.person!==null){
  const person=r.client?s.clients[r.person]:s.npcs[r.person];
  if(!person||r.client&&['leaving','offsite'].includes((person as ClientState).phase)){r.person=null;r.elapsed=0;return;}
  if(!r.client&&(person as NpcState).presence==='checking-out')r.mode='out';
  if(!person.path.length&&pointDistance(person.position,ATTENDANCE_POINT)<.1){
   r.elapsed=r.phase==='service'?r.elapsed+elapsed:0;r.phase='service';amanda.greetUntil=now+1;
   if(r.elapsed>=2){
    const name=person.name;logAttendance(s,name,r.client?'client':r.mode==='out'?'out':'in');
    if(r.client){const c=person as ClientState;c.phase='served';c.stayUntil=0;event(s,'Amanda mencatat kunjungan '+name+' dan mengarahkan client ke ruang meeting.');}
    else {const n=person as NpcState;n.queueJoinedAt=null;if(r.mode==='in'){n.presence='inside';n.attendanceIn=now;event(s,name+' selesai absen masuk. Menuju ruang kerja.');}else{n.presence='leaving';n.attendanceOut=now;event(s,name+' selesai absen pulang. Sampai besok!');}}
    r.person=null;r.elapsed=0;r.phase='approach';
   }
  }
 }
 if(!officeOpen(s.gameMinute)&&r.person===null&&!s.npcs.some((n,i)=>isWorker(i)&&['inside','arriving','checking-in','checking-out'].includes(n.presence))&&!s.clients.some(c=>['waiting','arriving','served','meeting'].includes(c.phase))){
  amanda.presence='leaving';amanda.attendanceOut=now;logAttendance(s,amanda.name,'out');event(s,'Semua absen pulang tercatat. '+amanda.name+' menutup resepsionis.');
 }
}
function tick(current:Simulation,elapsed:number,extraObstacles:Point[]):Simulation {
 const limit=current.project?.id===PROJECT.id&&current.gameDay===PROJECT.deadlineDay?PROJECT.deadlineMinute:1440+elapsed;
 const total=Math.min(limit,current.gameMinute+elapsed),gameDay=current.gameDay+Math.floor(total/1440),gameMinute=total%1440,now=(gameDay-1)*1440+gameMinute;
 const clockElapsed=Math.max(0,now-absoluteMinute(current));

 const s:Simulation={...current,gameDay,gameMinute,npcs:current.npcs.map(n=>({...n,duty:n.duty?{...n.duty}:null,breakPlan:n.breakPlan?{...n.breakPlan}:null})),meeting:gameDay===current.gameDay?{...current.meeting}:planMeeting(gameDay),events:[...current.events],reception:{...current.reception,log:[...current.reception.log]},computerIssues:current.computerIssues.map(i=>({...i})),clients:current.clients.map(c=>({...c})),completedDuties:{...current.completedDuties},services:{...current.services,served:[...current.services.served],drinks:[...current.services.drinks],coffee:current.services.coffee?{...current.services.coffee,recipient:{...current.services.coffee.recipient}}:null,catering:{...current.services.catering},cleanedRooms:[...current.services.cleanedRooms]}};
 if(gameDay!==current.gameDay){s.npcs=s.npcs.map((n,i)=>({...n,attendanceIn:null,attendanceOut:null,nextLeisureAt:now+520+i*17,breakPlan:null,queueJoinedAt:null}));s.clients=[];s.reception.person=null;s.ownerCheckedIn=false;s.nextManagementAt=now+500;s.nextIssueAt=now+540;s.nextClientAt=now+580;s.nextClientId=0;s.managementRound=0;s.services=newOfficeServices(gameDay,now);}
 const boundary=schedule(current.gameMinute)!==schedule(gameMinute);
 if(boundary){if(schedule(gameMinute)==='lunch')planBreaks(s);s.services.coffee=null;if(schedule(gameMinute)==='offsite')s.services.drinks=[];}
 if(boundary){s.encounters=[];s.npcs=s.npcs.map((n,i)=>({...n,override:null,duty:null,errandUntil:0,nextLeisureAt:Math.max(n.nextLeisureAt,now+20+i*12)}));if(gameMinute>=1020&&s.ownerCheckedIn){logAttendance(s,'Founder','out');s.ownerCheckedIn=false;event(s,'Absensi pulang Founder dicatat bersama Amanda.');}event(s,gameMinute>=1020?'17.00 · Tim kembali ke Amanda untuk absen pulang.':gameMinute>=780?'13.00 · Tim kembali bekerja.':gameMinute>=720?'12.00 · Makan siang bersama di pantry.':gameMinute>=480?'08.00 · Jam kerja dimulai.':'07.00 · Kantor dibuka, Amanda menyiapkan absensi.');}
 if(schedule(gameMinute)==='work'&&s.meeting.phase==='scheduled'&&gameMinute>=s.meeting.start){s.meeting.phase='gathering';s.encounters=[];s.npcs=s.npcs.map((n,i)=>i<6&&!['client','support'].includes(n.duty?.kind??'')?{...n,duty:null,override:null,nextLeisureAt:Math.max(n.nextLeisureAt,now+s.meeting.duration+85+i*12)}:n);event(s,'Tim menuju ruang rapat lantai dua. Kursi Founder tersedia untuk avatar.');}
 if(schedule(gameMinute)!=='work'&&activeMeeting(s))s.meeting.phase='done';
 if(s.meeting.phase==='gathering'&&gameMinute>=s.meeting.start+65){s.meeting.phase='done';event(s,'Rapat ditunda karena peserta belum lengkap.');}
 s.npcs=s.npcs.map((n,i)=>{
  const npc={...n,name:staff[i].name};if(!officeOpen(gameMinute)&&i!==6&&['inside','arriving','checking-in'].includes(npc.presence)){npc.presence='checking-out';npc.duty=null;npc.override=null;npc.queueJoinedAt=now;}
  if(officeOpen(gameMinute)&&npc.presence==='offsite'&&gameMinute>=arrivalMinute(i)){npc.presence='arriving';npc.position=outside(i);npc.path=[];npc.queueJoinedAt=now;event(s,npc.name+' tiba di pintu kantor.');}
  if(npc.override&&npc.override.until<=now)npc.override=null;return npc;
 });
 if(s.project){
  s.meeting={...s.meeting,phase:'done'};
  const beat=projectBeat(gameDay,gameMinute),key=beat?.id??`routine-${gameDay}-${schedule(gameMinute)}`;
  if(key!==s.project.beat){s.project={...s.project,beat:key};s.encounters=[];if(beat)event(s,'PROYEK DANI · '+beat.title);}
  s.npcs=s.npcs.map((n,i)=>projectAssignment(s.project,gameDay,gameMinute,i)?{...n,duty:null,override:null}:n);
  if(gameDay===3&&gameMinute>=870&&!s.clients.some(c=>c.projectId===PROJECT.id)){
   const id=s.nextClientId++;s.clients.push({id,name:PROJECT.client,variant:CLIENT_VARIANT_START,target:'both',ownerJoined:false,seatSlot:1,position:outside(id+10),path:[],phase:'arriving',stayUntil:0,projectId:PROJECT.id});
   event(s,'Client A tiba untuk mengambil video Dani. Amanda menyiapkan pertemuan dengan Founder dan Atlas.');
  }
 }
 scheduleDuties(s);
 scheduleServices(s);
 s.npcs=s.npcs.map((original,i)=>{
  const n={...original},e=encounterFor(s,i),goal=activityGoal(s,i),end=n.path.at(-1);let path=n.path;
  if(n.presence!=='offsite'&&(!end&&pointDistance(n.position,goal)>.05||end&&pointDistance(end,goal)>.05))path=findPath(n.position,goal);
  const people=[...s.npcs.flatMap((person,id)=>id!==i&&person.presence!=='offsite'?[{id,position:person.position,moving:!!person.path.length}]:[]),...s.clients.flatMap(c=>c.phase!=='offsite'?[{id:10000+c.id,position:c.position,moving:!!c.path.length}]:[]),...extraObstacles.map((position,id)=>({id:-100-id,position,moving:false}))];
  const m=n.presence==='offsite'?{position:n.position,path:[],distanceUsed:0}:moveInCrowd(n.position,path,elapsed*WALK_SPEED,people,i);n.position=m.position;n.path=m.path;n.destination=roomAt(goal)??staff[i].roomId;
  if(!n.path.length&&pointDistance(n.position,goal)<.08&&n.presence==='arriving'){if(i===6){n.presence='inside';n.attendanceIn=now;logAttendance(s,n.name,'in');event(s,n.name+' siap melayani absen dan tamu.');}else n.presence='checking-in';}
  if(!n.path.length&&pointDistance(n.position,goal)<.08&&n.presence==='leaving'){n.presence='offsite';event(s,n.name+' meninggalkan kantor.');}
  s.npcs[i]=n;n.activity=e?e.roomId===2?'meeting':schedule(gameMinute)==='lunch'?'lunch':'break':baselineActivity(s,i);
  const working=n.presence==='inside'&&!n.path.length&&n.activity==='work'&&!n.duty&&!e,relaxing=n.presence==='offsite'||!n.path.length&&['lunch','break','drink','cook','read'].includes(n.activity);
  n.energy=clamp(n.energy+clockElapsed*(relaxing?.3:-.03));n.focus=clamp(n.focus+clockElapsed*(relaxing?.5:working?-.05:-.008));n.social=clamp(n.social+clockElapsed*(relaxing?.12:-.012));n.workMinutes+=working?Math.max(0,clockElapsed-m.distanceUsed/WALK_SPEED):0;
  if(n.workMinutes>=60){const rewards=Math.floor(n.workMinutes/60)*10;s.credits+=rewards;n.workMinutes%=60;event(s,n.name+' menyelesaikan pekerjaan · +'+rewards+' HQ Credits');}return n;
 });
 moveClients(s,elapsed,extraObstacles);serveReception(s,elapsed);advanceDuties(s,elapsed);
 if(s.meeting.phase==='gathering'&&MEETING_PARTICIPANTS.every(i=>s.npcs[i].presence==='inside'&&!s.npcs[i].path.length&&pointDistance(s.npcs[i].position,meetingSeat(meetingSlot(i)).position)<.1)){s.meeting.phase='discussing';s.meeting.elapsed=0;event(s,'Enam anggota tim sudah duduk. Kursi Founder tersedia untuk ikut rapat selama '+s.meeting.duration+' menit game.');}
 else if(s.meeting.phase==='discussing'){s.meeting.elapsed=Math.min(s.meeting.duration,s.meeting.elapsed+elapsed);if(s.meeting.elapsed>=s.meeting.duration){s.meeting.phase='done';event(s,'Rapat selesai. Tim kembali ke pekerjaan masing-masing.');}}
 return advanceSocial(s,elapsed);
}
export function stepSimulation(current:Simulation,realSeconds:number,speed:number,extraObstacles:Point[]=[]):Simulation {
 if(speed===0||!Number.isFinite(realSeconds)||realSeconds<=0||!Number.isFinite(speed)||speed<0)return current;
 let remaining=realSeconds*speed,s=current;while(remaining>.0000001){const dt=Math.min(remaining,.5);s=tick(s,dt,extraObstacles);remaining-=dt;}return s;
}
export function assignActivity(s:Simulation,i:number,activity:'work'|'break'):Simulation {
 if(!isWorker(i)||s.npcs[i].presence!=='inside'||schedule(s.gameMinute)!=='work'||activeMeeting(s)||s.npcs[i].duty)return s;
 s={...cancelInteraction(s,i)};const breakPlan=activity==='break'?randomBreakPlan(s,i):s.npcs[i].breakPlan;
 return {...s,npcs:s.npcs.map((n,index)=>index===i?{...n,breakPlan,override:{activity,until:Math.min(absoluteMinute(s)+60,(s.gameDay-1)*1440+(s.gameMinute<720?720:1020))}}:n)};
}
export function greet(s:Simulation,i:number):Simulation {
 if(!s.npcs[i]||!['inside','checking-in'].includes(s.npcs[i].presence))return s;
 return {...s,npcs:s.npcs.map((n,index)=>index===i?{...n,social:clamp(n.social+12),greetUntil:absoluteMinute(s)+4}:n),events:[staff[i].name+': Selamat datang di HQ! Semoga harimu menyenangkan.',...s.events].slice(0,8)};
}
export function setOwnerRoom(s:Simulation,roomId:number|null):Simulation {
 return s.ownerRoom===roomId?s:{...s,ownerRoom:roomId};
}
export function joinClientMeeting(s:Simulation,id:number):Simulation {
 const index=s.clients.findIndex(client=>client.id===id),client=s.clients[index];
 if(!s.ownerActive||s.ownerRoom!==11||!client||client.phase!=='meeting'||client.target==='atlas'||client.ownerJoined)return s;
 const clients=s.clients.map((person,i)=>i===index?{...person,ownerJoined:true,stayUntil:client.target==='owner'?absoluteMinute(s)+35:person.stayUntil}:person);
 return {...s,clients,events:['Founder memulai pertemuan dengan '+client.name+'.',...s.events].slice(0,8)};
}
export function setOwnerEngagement(s:Simulation,active:boolean,activity:string|null):Simulation {
 return s.ownerActive===active&&s.ownerActivity===activity?s:{...s,ownerActive:active,ownerActivity:activity};
}
export function recordOwnerAttendance(s:Simulation,mode:'in'|'out'):Simulation {
 if(!s.ownerActive||s.ownerRoom!==0||s.reception.person!==null)return s;
 if(mode==='in'&&!officeOpen(s.gameMinute))return s;
 const amanda=s.npcs[6];if(amanda.presence!=='inside'||amanda.duty||amanda.path.length||pointDistance(amanda.position,RECEPTION_POST)>.1)return s;
 s={...s,reception:{...s.reception,log:[...s.reception.log]}};
 logAttendance(s,'Founder',mode);
 return {...s,ownerCheckedIn:mode==='in',events:[mode==='in'?'Founder mengisi absensi bersama Amanda.':'Founder mencatat absensi pulang bersama Amanda.',...s.events].slice(0,8)};
}


const finite=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validPoint=(v:unknown):v is Point=>Array.isArray(v)&&(v.length===2||v.length===3)&&v.every(n=>typeof n==='number'&&Number.isFinite(n))&&isWalkable(v as Point);
export function defaultSave():SaveData {return {version:5,simulation:createSimulation(),roomId:0,mode:'director',avatar:nearestWalkable([ENTRY_POINT[0]-.7,ENTRY_POINT[1]-.8,0]),speed:1,reducedMotion:false,savedAt:'',floorView:'all'};}
export function parseSave(json:string|null):SaveData {
 const fallback=defaultSave();if(!json)return fallback;
 try {
  const data=record(JSON.parse(json)),version=Number(data.version),raw=record([2,3,4,5].includes(version)?data.simulation:data);
  const s=createSimulation(Math.floor(finite(raw.gameDay,1,999999,1)),finite(raw.gameMinute,0,1439.999,420),finite(raw.credits,0,1e12,1250)),now=absoluteMinute(s),legacyLayout=version===5&&!raw.services;
  if(version===5){
   const m=record(raw.meeting);if(m.day===s.gameDay&&m.start===s.meeting.start&&m.duration===s.meeting.duration&&['scheduled','gathering','discussing','done'].includes(String(m.phase)))s.meeting={...s.meeting,phase:m.phase as MeetingPlan['phase'],elapsed:finite(m.elapsed,0,s.meeting.duration,0)};
   if(schedule(s.gameMinute)!=='work'&&activeMeeting(s))s.meeting.phase='done';
   s.rng=Math.floor(finite(raw.rng,0,4294967295,s.rng));s.managementRound=Math.floor(finite(raw.managementRound,0,1e9,0));s.hqPoints=finite(raw.hqPoints,0,100,100);s.ownerCheckedIn=raw.ownerCheckedIn===true;s.nextClientId=Math.floor(finite(raw.nextClientId,0,1e9,0));
   for(const key of ['nextManagementAt','nextIssueAt','nextClientAt'] as const)s[key]=finite(raw[key],now-200,now+2000,s[key]);
   const duties=record(raw.completedDuties);for(const key of Object.keys(s.completedDuties) as DutyKind[])s.completedDuties[key]=Math.floor(finite(duties[key],0,1e9,0));
   if(Array.isArray(raw.computerIssues))s.computerIssues=raw.computerIssues.slice(-9).flatMap(v=>{const issue=record(v);return Number(issue.owner)===-1||isWorker(Number(issue.owner))&&Number(issue.owner)<8?[{owner:Number(issue.owner),reportedAt:finite(issue.reportedAt,0,now,now),resolvedAt:issue.resolvedAt===null?null:finite(issue.resolvedAt,0,now,now)}]:[];}).filter((issue,i,all)=>all.findIndex(other=>other.owner===issue.owner&&other.resolvedAt===null)===i||issue.resolvedAt!==null);
  }
  if([2,3,4,5].includes(version)&&Array.isArray(raw.npcs))s.npcs=s.npcs.map((n,i)=>{
   const saved=record(version===5?(raw.npcs as unknown[])[i]:(raw.npcs as unknown[]).find(v=>record(v).name===n.name)),order=record(saved.override),until=finite(order.until,now,now+60,0);
   let presence=n.presence,position=n.position,duty:NpcDuty|null=null;
   if(version===5&&['offsite','arriving','checking-in','inside','checking-out','leaving'].includes(String(saved.presence))){presence=saved.presence as NpcState['presence'];const p=Array.isArray(saved.position)?saved.position:[];const candidate:Point=legacyLayout?[Number(p[0])*1.3,Number(p[1])*1.3,Number(p[2]??0)]:p as Point;position=validPoint(candidate)?candidate:presence==='inside'?workSeat(i).position:outside(i);}
   if(!officeOpen(s.gameMinute)&&i!==6&&['inside','arriving','checking-in'].includes(presence))presence='checking-out';
   if(officeOpen(s.gameMinute)&&s.gameMinute<arrivalMinute(i)){presence='offsite';position=outside(i);}
   if(version===5&&(isWorker(i)||i===6)&&presence==='inside'&&!activeMeeting(s)&&officeOpen(s.gameMinute)){
    const d=record(saved.duty),kind=String(d.kind) as DutyKind,target=Math.floor(finite(d.target,-1,['client','coffee','support'].includes(kind)?1e9:12,0));
    const targetValid=kind==='private'?i===0&&target===1:kind==='client'?i===0:kind==='support'?i<8&&i!==0&&i!==6:kind==='coffee'?i===8:kind==='clean'?i===9&&target>=0&&target<rooms.length:kind==='repair'?i===5&&(target===-1||isWorker(target)&&target<8):kind==='inspect'?i===0&&isWorker(target)&&target!==0&&target<8:kind==='toilet'?[9,10].includes(target):['read','hr'].includes(kind)?[0,1].includes(target):['drink','cook'].includes(kind);
    if(Object.hasOwn(s.completedDuties,kind)&&targetValid&&(i!==6||['toilet','drink','cook'].includes(kind)))duty={kind,target,phase:d.phase==='active'?'active':'travel',elapsed:finite(d.elapsed,0,30,0),duration:finite(d.duration,1,30,10),deadline:finite(d.deadline,now+.001,now+150,now+150),...(kind==='support'?{seatSlot:Math.floor(finite(d.seatSlot,4,7,4))}:{})};
   }
   const b=record(saved.breakPlan),breakPlan=b.day===s.gameDay&&['desk','pantry','library','reception','ob'].includes(String(b.kind))?{day:s.gameDay,kind:b.kind as BreakPlan['kind'],slot:Math.floor(finite(b.slot,0,b.kind==='pantry'?9:2,0))}:n.breakPlan;
   return {...n,presence,position,duty,breakPlan,queueJoinedAt:finite(saved.queueJoinedAt,0,now,now),override:isWorker(i)&&until&&schedule(s.gameMinute)==='work'&&(order.activity==='work'||order.activity==='break')?{activity:order.activity,until} as NpcState['override']:null,energy:finite(saved.energy,0,100,85),focus:finite(saved.focus,0,100,90),social:finite(saved.social,0,100,75),workMinutes:finite(saved.workMinutes,0,59.9999,0),greetUntil:finite(saved.greetUntil,0,now+4,0),nextSocialAt:finite(saved.nextSocialAt,0,now+1000,now+20+i*3),nextLeisureAt:finite(saved.nextLeisureAt,now-200,now+2000,now+45+i*12),attendanceIn:version===5?(saved.attendanceIn===null?null:finite(saved.attendanceIn,0,now,n.attendanceIn??now)):n.attendanceIn,attendanceOut:version===5&&typeof saved.attendanceOut==='number'?finite(saved.attendanceOut,0,now,0):null};
  });
  const reservations=new Set<string>();for(const n of s.npcs){if(!n.duty||!['read','toilet','drink','cook','hr'].includes(n.duty.kind))continue;const key=n.duty.kind+':'+n.duty.target;if(reservations.has(key))n.duty=null;else reservations.add(key);}
  const bonds=record(raw.bonds);for(const key of Object.keys(s.bonds))s.bonds[key]=finite(bonds[key],0,100,25);
  s.completedInteractions=Math.floor(finite(raw.completedInteractions,0,1e9,0));s.nextEncounterId=Math.floor(finite(raw.nextEncounterId,1,1e9,1));
  if(Array.isArray(raw.events))s.events=raw.events.filter((e):e is string=>typeof e==='string'&&e.length>0&&e.length<=240).slice(0,8).map(e=>e.replace(/VANDERLEINZ(?: AI)?(?: HQ)?/gi,'Blue and Space').replace(/\bAkbar\b/gi,'Founder'));
  if(version===5){
   const r=record(raw.reception);
   if(Array.isArray(r.log))s.reception.log=r.log.slice(0,24).flatMap(v=>{const e=record(v);return typeof e.name==='string'&&e.name.length<100&&['in','out','client'].includes(String(e.kind))?[{day:Math.floor(finite(e.day,1,s.gameDay,s.gameDay)),name:e.name,kind:e.kind as AttendanceEntry['kind'],at:finite(e.at,0,1440,0)}]:[];});
   if(Array.isArray(raw.clients))s.clients=raw.clients.slice(0,12).flatMap((v,i)=>{const c=record(v),target=['owner','atlas','both'].includes(String(c.target))?c.target as ClientState['target']:'owner',p=Array.isArray(c.position)?c.position:[],candidate:Point=legacyLayout?[Number(p[0])*1.3,Number(p[1])*1.3,Number(p[2]??0)]:p as Point;
    if(!['arriving','waiting','served','meeting','leaving','offsite'].includes(String(c.phase)))return [];const phase=c.phase as ClientState['phase'],seatSlot=c.seatSlot===3?3:1,position=validPoint(candidate)?candidate:['served','meeting'].includes(phase)?clientMeetingSeat(seatSlot).position:ENTRY_POINT;
    return [{id:Math.floor(finite(c.id,i,1e9,i)),name:typeof c.name==='string'&&c.name.length<50?c.name:['Maya','Raka'][i%2],variant:legacyLayout?Math.floor(finite(c.variant,8,10,8+i%3))+2:Math.floor(finite(c.variant,CLIENT_VARIANT_START,CLIENT_VARIANT_START+2,CLIENT_VARIANT_START+i%3)),target,ownerJoined:c.ownerJoined===true,seatSlot,position,path:[],phase,stayUntil:finite(c.stayUntil,0,now+1000,now+5),teamCalled:c.teamCalled===true,supportWaitUntil:finite(c.supportWaitUntil,now-1000,now+75,0)}];});
   const usedSeats=new Set<number>();s.clients=s.clients.map(client=>{if(client.phase==='offsite')return client;const seatSlot:1|3=usedSeats.has(client.seatSlot)?client.seatSlot===1?3:1:client.seatSlot;usedSeats.add(seatSlot);return {...client,seatSlot};});
   s.nextClientId=Math.max(s.nextClientId,...s.clients.map(client=>client.id+1));
   const services=record(raw.services);if(services.day===s.gameDay){
    s.services.coffeeRound=Math.floor(finite(services.coffeeRound,0,100,0));s.services.nextCoffeeAt=finite(services.nextCoffeeAt,now-1000,now+2000,now+5);s.services.nextCleaningAt=finite(services.nextCleaningAt,now-1000,now+2000,now+2);s.services.cleaningRoom=Math.floor(finite(services.cleaningRoom,0,12,0));
    const catering=record(services.catering);s.services.catering={phase:['waiting','cooking','ready'].includes(String(catering.phase))?catering.phase as OfficeServices['catering']['phase']:'waiting',elapsed:finite(catering.elapsed,0,24,0)};
    if(Array.isArray(services.served))s.services.served=[...new Set(services.served.filter((key):key is string=>typeof key==='string'&&/^(staff|owner|client):-?\d+$/.test(key)))].slice(0,40);
    if(Array.isArray(services.cleanedRooms))s.services.cleanedRooms=services.cleanedRooms.filter((id):id is number=>typeof id==='number'&&Number.isInteger(id)&&id>=0&&id<rooms.length);
    const parseRecipient=(value:unknown):DrinkRecipient|null=>{const r=record(value),id=Number(r.id);return r.kind==='owner'&&id===-1?{kind:'owner',id}:r.kind==='staff'&&Number.isInteger(id)&&id>=0&&id<staff.length?{kind:'staff',id}:r.kind==='client'&&s.clients.some(c=>c.id===id)?{kind:'client',id}:null;};
    if(Array.isArray(services.drinks)&&officeOpen(s.gameMinute)){
     const drinkRecipients=new Set<string>();
     s.services.drinks=services.drinks.flatMap(value=>{const d=record(value),recipient=parseRecipient(d.recipient),expiresAt=finite(d.expiresAt,now+.001,now+85,0);if(!recipient||!expiresAt||drinkRecipients.has(recipientKey(recipient)))return [];drinkRecipients.add(recipientKey(recipient));const client=recipient.kind==='client'?s.clients.find(c=>c.id===recipient.id):undefined,placement=drinkPlacement(recipient,client?.seatSlot),p=Array.isArray(d.position)?d.position:[];if(p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n))&&Math.abs(p[0])<25&&Math.abs(p[1])<20&&p[2]>=.5&&p[2]<6)placement.position=p as Point;return [{recipient,...placement,expiresAt,deliveredAt:finite(d.deliveredAt,0,now,now)}];}).slice(0,12);
    }
    const coffee=record(services.coffee),recipient=parseRecipient(coffee.recipient);if(recipient&&['prepare','carry','deliver'].includes(String(coffee.phase))&&s.npcs[8].duty?.kind==='coffee')s.services.coffee={recipient,phase:coffee.phase as 'prepare'|'carry'|'deliver',elapsed:finite(coffee.elapsed,0,2,0),cupsRemaining:Math.floor(finite(coffee.cupsRemaining,1,10,10))};
   }
   if(s.npcs[8].duty?.kind==='coffee'&&!s.services.coffee)s.npcs[8].duty=null;
   if(typeof r.person==='number'&&Number.isInteger(r.person)){
    const client=r.client===true,p=r.person,valid=client?s.clients[p]?.phase==='waiting':isWorker(p)&&['checking-in','checking-out'].includes(s.npcs[p]?.presence);
    if(valid)s.reception={...s.reception,person:p,client,mode:client?'visitor':s.npcs[p].presence==='checking-out'?'out':'in',phase:r.phase==='service'?'service':'approach',elapsed:finite(r.elapsed,0,1.999,0)};
   }
  }
  if(!officeOpen(s.gameMinute)&&s.npcs.some((n,i)=>isWorker(i)&&n.presence==='checking-out')&&s.npcs[6].presence==='offsite'){s.npcs[6].presence='inside';s.npcs[6].position=RECEPTION_POST;}
  const busy=new Set<number>(),chairs=new Set<string>(),ids=new Set<number>();
  if(version===5&&officeOpen(s.gameMinute)&&!activeMeeting(s)&&Array.isArray(raw.encounters))for(const v of raw.encounters.slice(0,3)){
   const e=record(v),pair=e.participants,seats=e.chairs;if(!Array.isArray(pair)||pair.length!==2||!pair.every(i=>isWorker(i)&&s.npcs[i].presence==='inside'&&!s.npcs[i].duty)||pair[0]===pair[1]||pair.some(i=>busy.has(i)))continue;
   if(!Object.hasOwn(interactionLabels,String(e.kind))||![2,5].includes(Number(e.roomId))||e.roomId===2&&schedule(s.gameMinute)==='lunch'||!Array.isArray(seats)||seats.length!==2||seats[0]===seats[1]||!seats.every(i=>Number.isInteger(i)&&i>=0&&i<(e.roomId===5?9:7)))continue;
   const keys=seats.map(i=>e.roomId+':'+i);if(keys.some(k=>chairs.has(k)))continue;
   const kind=e.kind as Encounter['kind'],timeout=finite(e.timeout,now+.001,now+150,0),id=Math.floor(finite(e.id,1,1e9,s.nextEncounterId));if(!timeout||ids.has(id))continue;
   const enc:Encounter={id,participants:pair as [number,number],chairs:seats as [number,number],kind,roomId:Number(e.roomId),slot:seats[0],phase:e.phase==='talking'?'talking':'approach',elapsed:finite(e.elapsed,0,interactionDuration[kind]-.001,0),timeout};s.encounters.push(enc);pair.forEach(i=>busy.add(i));keys.forEach(k=>chairs.add(k));ids.add(id);s.nextEncounterId=Math.max(s.nextEncounterId,id+1);
  }
  const oldAvatar=Array.isArray(data.avatar)?data.avatar:[],avatarCandidate:Point=legacyLayout?[Number(oldAvatar[0])*1.3,Number(oldAvatar[1])*1.3,Number(oldAvatar[2]??0)]:oldAvatar as Point,avatar=version===5&&validPoint(avatarCandidate)?avatarCandidate:fallback.avatar;s.ownerRoom=roomAt(avatar);s.ownerActive=data.mode==='avatar';
  s.npcs=s.npcs.map((n,i)=>{const goal=activityGoal(s,i);return {...n,activity:baselineActivity(s,i),destination:roomAt(goal)??staff[i].roomId,path:n.presence==='offsite'?[]:findPath(n.position,goal)};});
  return {version:5,simulation:s,roomId:Math.floor(finite(data.roomId,0,12,0)),mode:data.mode==='avatar'?'avatar':'director',avatar,speed:[0,1,2,3].includes(Number(data.speed))&&typeof data.speed==='number'?data.speed:1,reducedMotion:data.reducedMotion===true,savedAt:typeof data.savedAt==='string'?data.savedAt:'',floorView:version===5&&(data.floorView===0||data.floorView===1)?data.floorView:'all'};
 }catch{return fallback;}
}
export function loadGame():SaveData {

 try{return parseSave(localStorage.getItem(SAVE_KEY)??localStorage.getItem(PREVIOUS_KEY)??localStorage.getItem('vanderleinz-hq-milestone-4')??localStorage.getItem('vanderleinz-hq-milestone-3')??localStorage.getItem('vanderleinz-hq-milestone-2')??localStorage.getItem(LEGACY_KEY));}catch{return defaultSave();}
}
