import { staff } from './worldData.ts';
import { findPath, isWalkable, moveAlong, nearestWalkable, roomAt } from './navigation.ts';
import type { Point } from './navigation.ts';
import { ENTRY_POINT, RECEPTION_POST, workSeat, meetingSeat, lunchSeat, errandPoint, arrivalMinute } from './officeLayout.ts';
import type { Seat } from './officeLayout.ts';
import { initialBonds, encounterFor, interactionGoal, advanceSocial, cancelInteraction, interactionLabels, interactionDuration } from './social.ts';
import type { Encounter } from './social.ts';

export type Activity = 'prepare' | 'work' | 'meeting' | 'break' | 'lunch' | 'leave' | 'offsite';
export const activityLabels: Record<Activity,string> = {prepare:'Bersiap di kantor',work:'Bekerja',meeting:'Rapat tim',break:'Istirahat',lunch:'Makan siang',leave:'Pulang',offsite:'Di luar kantor'};
export type NpcState = {
  name:string; position:Point; path:Point[]; activity:Activity; destination:number;
  presence:'offsite'|'arriving'|'inside'|'leaving';
  energy:number; focus:number; social:number; workMinutes:number; nextSocialAt:number; greetUntil:number;
  nextErrandAt:number; errandUntil:number;
  override:{activity:'work'|'break';until:number}|null;
};
export type MeetingPlan = {day:number;start:number;duration:30|45|60;phase:'scheduled'|'gathering'|'discussing'|'done';elapsed:number};
export type Simulation = {gameDay:number;gameMinute:number;credits:number;npcs:NpcState[];events:string[];encounters:Encounter[];bonds:Record<string,number>;completedInteractions:number;nextEncounterId:number;meeting:MeetingPlan};
export type SaveData = {version:4;simulation:Simulation;roomId:number;mode:'director'|'avatar';avatar:Point;speed:number;reducedMotion:boolean;savedAt:string};
export const SAVE_KEY='vanderleinz-hq-milestone-4';
export const PREVIOUS_KEY='vanderleinz-hq-milestone-3';
export const LEGACY_KEY='vanderleinz-hq-milestone-1';
export const DAY_NAMES=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
export const weekdayName=(day:number)=>DAY_NAMES[(Math.max(1,Math.floor(day))-1)%7];
export const weekday=weekdayName;
export const officeOpen=(minute:number)=>minute>=420&&minute<1020;
export const officePower=(sim:Simulation)=>officeOpen(sim.gameMinute)?1:sim.gameMinute>=1020&&sim.gameMinute<1035?Math.max(0,1-(sim.gameMinute-1020)/15):0;
export const absoluteMinute=(sim:Simulation)=>(sim.gameDay-1)*1440+sim.gameMinute;
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const travelSpeed=2.4;
export function schedule(minute:number):Activity {
  if(!officeOpen(minute)) return 'offsite';
  if(minute<480) return 'prepare';
  if(minute>=720&&minute<780) return 'lunch';
  return 'work';
}
export function planMeeting(day:number):MeetingPlan {
  const hash=(Math.imul(day,1664525)+1013904223)>>>0;
  const start=(hash%2?540:840)+(Math.floor(hash/7)%71);
  const duration=([30,45,60] as const)[Math.floor(hash/17)%3];
  return {day,start,duration,phase:'scheduled',elapsed:0};
}
const outside=(index:number):Point=>[ENTRY_POINT[0]+(index%3-1)*.28,ENTRY_POINT[1]+(index%2)*.15];
function baselineActivity(sim:Simulation,index:number):Activity {
  const npc=sim.npcs[index],planned=schedule(sim.gameMinute);
  if(npc.presence==='offsite') return 'offsite';
  if(npc.presence==='leaving') return 'leave';
  if(npc.presence==='arriving') return 'prepare';
  if(index===6) return planned==='prepare'?'prepare':'work';
  if(planned==='lunch') return 'lunch';
  if(planned==='work'&&['gathering','discussing'].includes(sim.meeting.phase)) return 'meeting';
  return planned==='work'&&npc.override&&npc.override.until>absoluteMinute(sim)?npc.override.activity:planned;
}
export function activityGoal(sim:Simulation,index:number):Point {
  const npc=sim.npcs[index];
  if(npc.presence==='offsite'||npc.presence==='leaving') return outside(index);
  const encounter=encounterFor(sim,index);
  if(encounter) return interactionGoal(encounter,index);
  if(index===6) return RECEPTION_POST;
  const activity=baselineActivity(sim,index);
  if(activity==='meeting') return meetingSeat(index).position;
  if(activity==='lunch'||activity==='break') return lunchSeat(index).position;
  if(activity==='work'&&npc.errandUntil>absoluteMinute(sim)) return errandPoint(index);
  return workSeat(index).position;
}
export function seatedAt(sim:Simulation,index:number):Seat|null {
  const npc=sim.npcs[index];
  if(index===6||npc.presence!=='inside'||npc.path.length||npc.activity==='prepare'||npc.errandUntil>absoluteMinute(sim)) return null;
  const encounter=encounterFor(sim,index);
  const seat=encounter?encounter.roomId===2?meetingSeat(encounter.slot+(encounter.participants[0]===index?0:3)):lunchSeat(encounter.slot+(encounter.participants[0]===index?0:3)):
    npc.activity==='meeting'?meetingSeat(index):npc.activity==='lunch'||npc.activity==='break'?lunchSeat(index):npc.activity==='work'?workSeat(index):null;
  return seat&&Math.hypot(npc.position[0]-seat.position[0],npc.position[1]-seat.position[1])<.09?seat:null;
}
export function meetingDialogue(sim:Simulation):{speaker:number;text:string}|null {
  if(sim.meeting.phase!=='discussing') return null;
  const turn=Math.floor(sim.meeting.elapsed/5);
  const speaker=turn%6;
  const lines=['Kita mulai dari prioritas operasional hari ini.','Aku siapkan konsep visual untuk proyek berikutnya.','Kita pastikan pembagian tugasnya seimbang.','Hasil riset menunjukkan arah yang menjanjikan.','Aku akan susun agenda komunitasnya.','Sistem siap. Aku bantu pemantauan teknis.'];
  return {speaker,text:turn<6?lines[speaker]:['Setuju, kita lanjutkan di meja masing-masing.','Aku catat tindak lanjutnya.','Mari kita saling bantu menyelesaikannya.'][turn%3]};
}
export function createSimulation(day=1,minute=420,credits=1250):Simulation {
  const sim:Simulation={gameDay:day,gameMinute:minute,credits,meeting:planMeeting(day),encounters:[],bonds:initialBonds(),completedInteractions:0,nextEncounterId:1,events:['Lampu menyala pukul 07.00. Amanda bersiap menyambut tim.'],npcs:[]};
  sim.npcs=staff.map((person,i)=>{
    const inside=officeOpen(minute)&&minute>=arrivalMinute(i);
    return {name:person.name,position:outside(i),path:[],activity:inside?schedule(minute):'offsite',destination:person.roomId,presence:inside?'inside':'offsite',energy:85,focus:90,social:75,workMinutes:0,greetUntil:0,nextSocialAt:(day-1)*1440+minute+20+i*3,nextErrandAt:(day-1)*1440+480+90+i*5,errandUntil:0,override:null};
  });
  sim.npcs=sim.npcs.map((n,i)=>{
    if(n.presence==='offsite') return n;
    const activity=i===6?(minute<480?'prepare':'work'):schedule(minute);
    const goal=activityGoal(sim,i);
    return {...n,activity,position:goal,destination:roomAt(goal)??staff[i].roomId};
  });
  if(minute>=sim.meeting.start+sim.meeting.duration+20) sim.meeting.phase='done';
  // New games show Amanda walking through the front door first.
  if(minute===420) sim.npcs[6]={...sim.npcs[6],presence:'arriving',position:outside(6),path:findPath(outside(6),RECEPTION_POST)};
  return sim;
}
function tick(current:Simulation,elapsed:number):Simulation {
  const total=current.gameMinute+elapsed;
  const gameDay=current.gameDay+Math.floor(total/1440),gameMinute=total%1440,now=(gameDay-1)*1440+gameMinute;
  let sim:Simulation={...current,gameDay,gameMinute,meeting:gameDay===current.gameDay?{...current.meeting}:planMeeting(gameDay),events:[...current.events],npcs:current.npcs.map(n=>({...n})),encounters:current.encounters};
  const boundary=schedule(current.gameMinute)!==schedule(gameMinute)||gameDay!==current.gameDay;
  if(boundary) {
    sim.encounters=[];
    sim.npcs=sim.npcs.map(n=>({...n,override:null,errandUntil:0}));
    sim.events.unshift(gameMinute>=1020?'17.00 · Kantor tutup. Tim pulang melalui resepsionis.':gameMinute>=780?'13.00 · Istirahat selesai. Tim kembali bekerja.':gameMinute>=720?'12.00 · Waktunya makan siang di kantin.':gameMinute>=480?'08.00 · Jam kerja dimulai.': '07.00 · Lampu menyala. Kantor dibuka kembali.');
  }
  if(schedule(gameMinute)==='work'&&sim.meeting.phase==='scheduled'&&gameMinute>=sim.meeting.start) {
    sim.meeting.phase='gathering'; sim.encounters=[]; sim.npcs=sim.npcs.map(n=>({...n,override:null,errandUntil:0}));
    sim.events.unshift('Rapat hari ini · Tim menuju enam kursi di Meeting Room.');
  }
  if(schedule(gameMinute)!=='work'&&['gathering','discussing'].includes(sim.meeting.phase)) sim.meeting.phase='done';
  if(sim.meeting.phase==='gathering'&&gameMinute>=sim.meeting.start+25) {
    sim.meeting.phase='done';sim.events.unshift('Rapat ditunda: peserta belum lengkap. Tim kembali ke tugas.');
  }
  sim.npcs=sim.npcs.map((original,i)=>{
    let npc={...original};
    if(!officeOpen(gameMinute)) {
      if(npc.presence==='inside'||npc.presence==='arriving') {npc.presence='leaving';npc.override=null;npc.errandUntil=0;}
    } else if(npc.presence==='offsite'&&gameMinute>=arrivalMinute(i)) {
      npc.presence='arriving';npc.position=outside(i);npc.path=[];npc.nextErrandAt=now+90+i*5;
      sim.events.unshift(npc.name+' tiba di pintu masuk kantor.');
    }
    if(npc.override&&npc.override.until<=now) npc.override=null;
    sim.npcs[i]=npc;
    const base=baselineActivity(sim,i);
    if(i<6&&base==='work'&&!encounterFor(sim,i)&&!npc.override&&(npc.energy<25||npc.focus<20)) npc.override={activity:'break',until:now+30};
    if(i<6&&base==='work'&&!npc.override&&!encounterFor(sim,i)&&npc.presence==='inside') {
      if(npc.errandUntil&&npc.errandUntil<=now) {npc.errandUntil=0;npc.nextErrandAt=now+90+i*5;}
      else if(!npc.errandUntil&&now>=npc.nextErrandAt) npc.errandUntil=now+6;
    } else npc.errandUntil=0;
    sim.npcs[i]=npc;
    const encounter=encounterFor(sim,i);
    const activity=encounter?encounter.roomId===2?'meeting':base==='lunch'?'lunch':'break':baselineActivity(sim,i);
    const goal=activityGoal(sim,i),destination=roomAt(goal)??staff[i].roomId;
    const pathEnd=npc.path.at(-1);
    let path=npc.path;
    if((pathEnd&&Math.hypot(pathEnd[0]-goal[0],pathEnd[1]-goal[1])>.05)||(!pathEnd&&Math.hypot(npc.position[0]-goal[0],npc.position[1]-goal[1])>.05)) path=findPath(npc.position,goal);
    const movement=npc.presence==='offsite'?{position:npc.position,path:[],distanceUsed:0}:moveAlong(npc.position,path,elapsed*travelSpeed);
    npc={...npc,position:movement.position,path:movement.path,activity,destination};
    if(!npc.path.length&&npc.presence==='arriving') {npc.presence='inside';sim.events.unshift(npc.name+' siap di '+(i===6?'resepsionis':'ruang kerja')+'.');}
    if(!npc.path.length&&npc.presence==='leaving') {npc.presence='offsite';npc.activity='offsite';sim.events.unshift(npc.name+' sudah pulang. Sampai besok!');}
    const stationary=!npc.path.length,working=npc.presence==='inside'&&stationary&&npc.activity==='work'&&!npc.errandUntil&&!encounter;
    const relaxing=npc.presence==='offsite'||stationary&&['lunch','break'].includes(npc.activity);
    const activeElapsed=Math.max(0,elapsed-movement.distanceUsed/travelSpeed);
    npc.energy=clamp(npc.energy+elapsed*(relaxing?.32:-.035));
    npc.focus=clamp(npc.focus+elapsed*(relaxing?.6:working?-.065:-.01));
    npc.social=clamp(npc.social+elapsed*(relaxing?.12:-.015));
    npc.workMinutes+=working?activeElapsed:0;
    if(npc.workMinutes>=60) {const reward=Math.floor(npc.workMinutes/60)*10;sim.credits+=reward;npc.workMinutes%=60;sim.events.unshift(npc.name+' menuntaskan tugas · +'+reward+' HQ Credits');}
    return npc;
  });
  if(sim.meeting.phase==='gathering'&&sim.npcs.slice(0,6).every((n,i)=>n.presence==='inside'&&!n.path.length&&Math.hypot(n.position[0]-meetingSeat(i).position[0],n.position[1]-meetingSeat(i).position[1])<.09)) {
    sim.meeting.phase='discussing';sim.meeting.elapsed=0;sim.events.unshift('Semua peserta duduk. Rapat dimulai selama '+sim.meeting.duration+' menit game.');
  } else if(sim.meeting.phase==='discussing') {
    sim.meeting.elapsed=Math.min(sim.meeting.duration,sim.meeting.elapsed+elapsed);
    if(sim.meeting.elapsed>=sim.meeting.duration) {sim.meeting.phase='done';sim.events.unshift('Rapat selesai. Tim kembali bekerja di meja masing-masing.');}
  }
  sim.events=sim.events.slice(0,6);
  return advanceSocial(sim,elapsed);
}
export function stepSimulation(current:Simulation,realSeconds:number,speed:number):Simulation {
  if(speed===0||!Number.isFinite(realSeconds)||realSeconds<=0||!Number.isFinite(speed)||speed<0) return current;
  let remaining=realSeconds*speed,sim=current;
  // Small steps preserve official boundaries and full seated meeting durations after long frames.
  while(remaining>.0000001) {const dt=Math.min(remaining,1);sim=tick(sim,dt);remaining-=dt;}
  return sim;
}
export function assignActivity(sim:Simulation,index:number,activity:'work'|'break'):Simulation {
  if(index<0||index>=6||sim.npcs[index].presence!=='inside'||schedule(sim.gameMinute)!=='work'||['gathering','discussing'].includes(sim.meeting.phase)) return sim;
  sim=cancelInteraction(sim,index);
  return {...sim,npcs:sim.npcs.map((n,i)=>i===index?{...n,errandUntil:0,override:{activity,until:Math.min(absoluteMinute(sim)+60,(sim.gameDay-1)*1440+(sim.gameMinute<720?720:1020))}}:n)};
}
export function greet(sim:Simulation,index:number):Simulation {
  if(!sim.npcs[index]||sim.npcs[index].presence==='offsite'||sim.npcs[index].presence==='leaving') return sim;
  return {...sim,npcs:sim.npcs.map((n,i)=>i===index?{...n,social:clamp(n.social+12),greetUntil:absoluteMinute(sim)+4}:n),events:[staff[index].name+': Selamat datang di HQ! Semoga harimu menyenangkan.',...sim.events].slice(0,6)};
}
const finite=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fallback;
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validPoint=(v:unknown):v is Point=>Array.isArray(v)&&v.length===2&&v.every(n=>typeof n==='number'&&Number.isFinite(n))&&isWalkable(v as Point);
export function defaultSave():SaveData {
  return {version:4,simulation:createSimulation(),roomId:0,mode:'director',avatar:nearestWalkable([-8.9,4.7]),speed:1,reducedMotion:false,savedAt:''};
}
export function parseSave(json:string|null):SaveData {
  const fallback=defaultSave();if(!json) return fallback;
  try {
    const data=record(JSON.parse(json)),version=Number(data.version);
    const raw=record([2,3,4].includes(version)?data.simulation:data);
    const sim=createSimulation(Math.floor(finite(raw.gameDay,1,999999,1)),finite(raw.gameMinute,0,1439.999,420),finite(raw.credits,0,1e12,1250)),now=absoluteMinute(sim);
    if(version===4) {
      const saved=record(raw.meeting),phases=['scheduled','gathering','discussing','done'];
      if(saved.day===sim.gameDay&&saved.start===sim.meeting.start&&saved.duration===sim.meeting.duration&&phases.includes(String(saved.phase))) {
        sim.meeting={...sim.meeting,phase:saved.phase as MeetingPlan['phase'],elapsed:finite(saved.elapsed,0,sim.meeting.duration,0)};
        if(schedule(sim.gameMinute)!=='work'&&['gathering','discussing'].includes(sim.meeting.phase)) sim.meeting.phase='done';
      }
    }
    if([2,3,4].includes(version)&&Array.isArray(raw.npcs)) {
      sim.npcs=sim.npcs.map((n,i)=>{
        const s=record((raw.npcs as unknown[]).find(v=>record(v).name===n.name));
        const order=record(s.override),until=finite(order.until,now,now+60,0);
        const override=i<6&&until&&schedule(sim.gameMinute)==='work'&&(order.activity==='work'||order.activity==='break')?{activity:order.activity,until} as NpcState['override']:null;
        let presence=n.presence,position=n.position;
        if(version===4&&['offsite','arriving','inside','leaving'].includes(String(s.presence))&&validPoint(s.position)) {
          presence=s.presence as NpcState['presence'];position=s.position;
          if(!officeOpen(sim.gameMinute)&&['inside','arriving'].includes(presence)) presence='leaving';
          if(officeOpen(sim.gameMinute)&&sim.gameMinute<arrivalMinute(i)) {presence='offsite';position=outside(i);}
        }
        return {...n,presence,position,override,energy:finite(s.energy,0,100,85),focus:finite(s.focus,0,100,90),social:finite(s.social,0,100,75),workMinutes:finite(s.workMinutes,0,59.9999,0),greetUntil:finite(s.greetUntil,0,now+4,0),nextSocialAt:finite(s.nextSocialAt,0,now+200,now+20+i*3),nextErrandAt:finite(s.nextErrandAt,now,now+200,now+90+i*5),errandUntil:i<6?finite(s.errandUntil,now,now+6,0):0};
      });
    }
    sim.npcs=sim.npcs.map((n,i)=>({...n,activity:baselineActivity(sim,i),destination:roomAt(activityGoal(sim,i))??staff[i].roomId,path:n.presence==='offsite'?[]:findPath(n.position,activityGoal(sim,i))}));
    if(Array.isArray(raw.events)) sim.events=raw.events.filter((e):e is string=>typeof e==='string'&&e.length>0&&e.length<=240).slice(0,6);
    const bonds=record(raw.bonds);for(const key of Object.keys(sim.bonds)) sim.bonds[key]=finite(bonds[key],0,100,25);
    sim.completedInteractions=Math.floor(finite(raw.completedInteractions,0,1e9,0));sim.nextEncounterId=Math.floor(finite(raw.nextEncounterId,1,1e9,1));
    const busy=new Set<number>(),slots=new Set<string>(),ids=new Set<number>();
    if([3,4].includes(version)&&officeOpen(sim.gameMinute)&&!['gathering','discussing'].includes(sim.meeting.phase)&&Array.isArray(raw.encounters)) for(const value of raw.encounters.slice(0,3)) {
      const e=record(value),pair=e.participants;
      if(!Array.isArray(pair)||pair.length!==2||!pair.every(i=>Number.isInteger(i)&&i>=0&&i<6&&sim.npcs[i].presence==='inside')||pair[0]===pair[1]||pair.some(i=>busy.has(i))) continue;
      if(!Object.hasOwn(interactionLabels,String(e.kind))||![2,5].includes(Number(e.roomId))||typeof e.roomId!=='number'||!Number.isInteger(e.slot)||Number(e.slot)<0||Number(e.slot)>2) continue;
      if(e.roomId===2&&schedule(sim.gameMinute)==='lunch') continue;
      const key=e.roomId+':'+e.slot,id=Math.floor(finite(e.id,1,1e9,sim.nextEncounterId)),timeout=finite(e.timeout,now+.001,now+100,0);
      if(!timeout||slots.has(key)||ids.has(id)) continue;
      const kind=e.kind as Encounter['kind'];
      const encounter:Encounter={id,participants:pair as [number,number],kind,roomId:e.roomId,slot:Number(e.slot),phase:e.phase==='talking'?'talking':'approach',elapsed:finite(e.elapsed,0,interactionDuration[kind]-.001,0),timeout};
      const ready=pair.every(i=>Math.hypot(sim.npcs[i].position[0]-interactionGoal(encounter,i)[0],sim.npcs[i].position[1]-interactionGoal(encounter,i)[1])<.05);
      if(!ready) encounter.phase='approach';
      for(const i of pair) {busy.add(i);sim.npcs[i].activity=e.roomId===2?'meeting':schedule(sim.gameMinute)==='lunch'?'lunch':'break';sim.npcs[i].destination=e.roomId;sim.npcs[i].path=encounter.phase==='talking'?[]:findPath(sim.npcs[i].position,interactionGoal(encounter,i));}
      sim.encounters.push(encounter);slots.add(key);ids.add(id);sim.nextEncounterId=Math.max(sim.nextEncounterId,id+1);
    }
    return {version:4,simulation:sim,roomId:Math.floor(finite(data.roomId,0,7,0)),mode:data.mode==='avatar'?'avatar':'director',avatar:validPoint(data.avatar)?data.avatar:fallback.avatar,speed:[0,1,2,3].includes(Number(data.speed))&&typeof data.speed==='number'?data.speed:1,reducedMotion:data.reducedMotion===true,savedAt:typeof data.savedAt==='string'?data.savedAt:''};
  } catch {return fallback;}
}
export function loadGame():SaveData {
  try {return parseSave(localStorage.getItem(SAVE_KEY)??localStorage.getItem(PREVIOUS_KEY)??localStorage.getItem('vanderleinz-hq-milestone-2')??localStorage.getItem(LEGACY_KEY));}
  catch {return defaultSave();}
}
