import { staff, STAFF_WORKERS } from './worldData.ts';
import { findPath, roomAt, pointDistance } from './navigation.ts';
import type { Point } from './navigation.ts';
import { activityGoal, officeOpen } from './simulation.ts';
import type { Simulation } from './simulation.ts';
import { lunchSeat, meetingSeat, meetingSlot } from './officeLayout.ts';

export type InteractionKind='chat'|'brainstorm'|'encourage';
export const interactionLabels:Record<InteractionKind,string>={chat:'Ngobrol santai',brainstorm:'Brainstorm bersama',encourage:'Beri semangat'};
export const interactionDuration:Record<InteractionKind,number>={chat:14,brainstorm:20,encourage:12};
export type Encounter={id:number;participants:[number,number];chairs:[number,number];kind:InteractionKind;roomId:number;slot:number;phase:'approach'|'talking';elapsed:number;timeout:number};
const nowOf=(s:Simulation)=>(s.gameDay-1)*1440+s.gameMinute;
const clamp=(v:number)=>Math.min(100,Math.max(0,v));
export const bondKey=(a:number,b:number)=>Math.min(a,b)+':'+Math.max(a,b);
export const bondLabel=(v:number)=>v>=70?'Kompak':v>=40?'Akrab':'Mulai kenal';
export function initialBonds():Record<string,number> {
  const bonds:Record<string,number>={};
  for(const a of STAFF_WORKERS) for(const b of STAFF_WORKERS) if(a<b) bonds[bondKey(a,b)]=25;
  return bonds;
}
export const encounterFor=(s:Simulation,index:number)=>s.encounters.find(e=>e.participants.includes(index));
export const interactionGoal=(e:Encounter,index:number):Point=>(e.roomId===2?meetingSeat:lunchSeat)(e.chairs[e.participants[0]===index?0:1]).position;
const dailyMeetingActive=(s:Simulation)=>['gathering','discussing'].includes(s.meeting.phase);
const available=(s:Simulation,i:number)=>STAFF_WORKERS.includes(i as typeof STAFF_WORKERS[number])&&s.npcs[i]?.presence==='inside'&&!s.npcs[i].duty;
export function dialogueFor(e:Encounter):{speaker:number;text:string} {
  const turn=Math.floor(e.elapsed/4)%3,[a,b]=e.participants,speaker=turn===1?b:a;
  const idea:Record<string,string>={ATLAS:'Kita rapikan alur kerja proyek ini.',NOVA:'Aku siapkan konsep visualnya.',LYRA:'Tim juga perlu pembagian tugas yang seimbang.',ORION:'Aku menemukan pola menarik dari riset.',SAGE:'Kita libatkan komunitas dalam rencana ini.',NEXUS:'Sistemnya bisa dibuat lebih sederhana.',Felin:'Kita susun rencana pengembangan tim yang realistis.'};
  const talk:Record<string,string>={ATLAS:'Terima kasih untuk kerja tim hari ini.',NOVA:'Ada ide bagus untuk desain berikutnya!',LYRA:'Bagaimana kabarmu hari ini?',ORION:'Aku menemukan bacaan menarik tadi.',SAGE:'Mau coba menu pantry hari ini?',NEXUS:'Komputer sudah aman. Waktunya rehat.',Felin:'Senang melihat perkembangan tim semakin baik.'};
  if(e.kind==='brainstorm') return {speaker,text:turn===0?idea[staff[a].name]:turn===1?'Aku bantu tindak lanjutnya. Kita cek bersama.':'Setuju. Kita coba langkah itu.'};
  if(e.kind==='encourage') return {speaker,text:turn===0?'Kerjamu membantu tim. Terima kasih.':turn===1?'Terima kasih, aku jadi lebih semangat.':'Kita saling bantu, ya.'};
  return {speaker,text:turn<2?talk[staff[speaker].name]:'Senang bisa ngobrol denganmu.'};
}
export function requestInteraction(sim:Simulation,a:number,b:number,kind:InteractionKind,roomOverride?:number):Simulation {
  if(!officeOpen(sim.gameMinute)||dailyMeetingActive(sim)||![a,b].every(i=>available(sim,i))||a===b||!Object.hasOwn(interactionLabels,kind)||encounterFor(sim,a)||encounterFor(sim,b)) return sim;
  const roomId=roomOverride===2||roomOverride===5?roomOverride:kind==='brainstorm'?2:5;
  const lunch=sim.gameMinute>=720&&sim.gameMinute<780;
  if(roomId===2&&lunch) return sim;
  const used=sim.encounters.filter(e=>e.roomId===roomId).flatMap(e=>e.chairs);
  const seats=roomId===5&&lunch?[meetingSlot(a),meetingSlot(b)]:Array.from({length:7},(_,i)=>i).filter(i=>!used.includes(i)).slice(0,2);
  if(seats.length!==2||seats.some(i=>used.includes(i))) return sim;
  const e:Encounter={id:sim.nextEncounterId,participants:[a,b],chairs:seats as [number,number],kind,roomId,slot:seats[0],phase:'approach',elapsed:0,timeout:nowOf(sim)+150};
  return {...sim,npcs:sim.npcs.map((n,i)=>i===a||i===b?{...n,override:null,errandUntil:0,destination:roomId,path:findPath(n.position,interactionGoal(e,i))}:n),encounters:[...sim.encounters,e],nextEncounterId:sim.nextEncounterId+1,events:[staff[a].name+' & '+staff[b].name+' → '+interactionLabels[kind],...sim.events].slice(0,8)};
}
export function cancelInteraction(sim:Simulation,index:number):Simulation {
  const e=encounterFor(sim,index);if(!e) return sim;
  const remaining={...sim,encounters:sim.encounters.filter(item=>item.id!==e.id)};
  return {...remaining,npcs:sim.npcs.map((n,i)=>e.participants.includes(i)?{...n,path:findPath(n.position,activityGoal(remaining,i)),nextSocialAt:nowOf(sim)+45}:n),events:[staff[e.participants[0]].name+' & '+staff[e.participants[1]].name+' kembali ke kegiatan masing-masing.',...sim.events].slice(0,8)};
}
export function advanceSocial(sim:Simulation,elapsed:number):Simulation {
  if(elapsed<=0) return sim;
  if(!officeOpen(sim.gameMinute)||dailyMeetingActive(sim)) return {...sim,encounters:[]};
  let result={...sim,npcs:sim.npcs.map(n=>({...n})),encounters:[] as Encounter[],bonds:{...sim.bonds},events:[...sim.events]};
  const now=nowOf(sim);
  for(const original of sim.encounters) {
    const [a,b]=original.participants;
    if(!available(result,a)||!available(result,b)) continue;
    const ready=[a,b].every(i=>!result.npcs[i].path.length&&roomAt(result.npcs[i].position)===original.roomId&&pointDistance(result.npcs[i].position,interactionGoal(original,i))<.15);
    const e={...original};
    if(e.phase==='approach'&&ready) {e.phase='talking';e.elapsed=0;result.events.unshift(staff[a].name+' ↔ '+staff[b].name+': '+interactionLabels[e.kind]);}
    else if(e.phase==='talking'&&ready) e.elapsed+=elapsed;
    if(e.elapsed>=interactionDuration[e.kind]||now>=e.timeout) {
      if(ready&&e.elapsed>=interactionDuration[e.kind]) {
        result.bonds[bondKey(a,b)]=clamp(result.bonds[bondKey(a,b)]+(e.kind==='encourage'?10:8));result.completedInteractions++;
        for(const i of [a,b]) {result.npcs[i].social=clamp(result.npcs[i].social+(e.kind==='chat'?18:12));result.npcs[i].focus=clamp(result.npcs[i].focus+(e.kind==='brainstorm'?12:5));if(e.kind==='encourage')result.npcs[i].energy=clamp(result.npcs[i].energy+8);}
        result.events.unshift(staff[a].name+' & '+staff[b].name+' semakin akrab.');
      }
      for(const i of [a,b]) {result.npcs[i].nextSocialAt=now+90;result.npcs[i].path=findPath(result.npcs[i].position,activityGoal(result,i));}
    } else result.encounters.push(e);
  }
  for(const a of STAFF_WORKERS) {
    const first=result.npcs[a];
    if(!available(result,a)||first.path.length||first.override||first.nextSocialAt>now||encounterFor(result,a)||!['lunch','break'].includes(first.activity)||roomAt(first.position)!==5) continue;
    const others=STAFF_WORKERS.filter(b=>b!==a).sort((b,c)=>result.bonds[bondKey(a,b)]-result.bonds[bondKey(a,c)]);
    for(const b of others) {
      const second=result.npcs[b];
      if(!available(result,b)||second.path.length||second.override||second.nextSocialAt>now||encounterFor(result,b)||!['lunch','break'].includes(second.activity)||roomAt(second.position)!==5)continue;
      result=requestInteraction(result,a,b,first.energy<45||second.energy<45?'encourage':'chat',5);break;
    }
  }
  return {...result,events:result.events.slice(0,8)};
}
