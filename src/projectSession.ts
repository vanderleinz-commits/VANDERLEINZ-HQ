import { createSimulation, defaultSave, loadGame, parseSave, SAVE_KEY, absoluteMinute } from './simulation.ts';
import type { SaveData, Simulation } from './simulation.ts';
import { PROJECT } from './projectStory.ts';
import { clientMeetingSeat } from './officeLayout.ts';
import { pointDistance } from './navigation.ts';

export const PROJECT_RESULT_KEY='blue-and-space-project-result:'+PROJECT.id;
const BASE_KEY='blue-and-space-project-baseline:'+PROJECT.id;
export type ProjectDecision={projectId:string;choice:'accepted'|'revision';note:string;decidedAt:string;save:SaveData};
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
export function readProjectDecision(storage:StoragePort=localStorage):ProjectDecision|null {
  try{const v=JSON.parse(storage.getItem(PROJECT_RESULT_KEY)??'null');
    return v?.projectId===PROJECT.id&&['accepted','revision'].includes(v.choice)&&typeof v.note==='string'&&typeof v.decidedAt==='string'&&v.save?.version===5?{...v,save:parseSave(JSON.stringify(v.save))}:null;
  }catch{return null;}
}
export function prepareProjectSession(normal:SaveData,storage?:StoragePort):SaveData {
  const decision=storage?readProjectDecision(storage):null;
  if(decision){
    // A decision contains its office checkpoint so closing immediately cannot lose it.
    return normal.savedAt>=decision.decidedAt&&absoluteMinute(normal.simulation)>=absoluteMinute(decision.save.simulation)?normal:decision.save;
  }
  let credits=normal.simulation.credits,hqPoints=normal.simulation.hqPoints;
  try{
    const baseline=JSON.parse(storage?.getItem(BASE_KEY)??'null');
    if(baseline&&Number.isFinite(baseline.credits)&&baseline.credits>=0&&Number.isFinite(baseline.hqPoints)&&baseline.hqPoints>=0&&baseline.hqPoints<=100){credits=baseline.credits;hqPoints=baseline.hqPoints;}
    else storage?.setItem(BASE_KEY,JSON.stringify({credits,hqPoints}));
  }catch{ /* A replay remains usable when browser storage is unavailable. */ }
  const simulation=createSimulation(1,360,credits);simulation.hqPoints=hqPoints;
  simulation.project={id:PROJECT.id,beat:'arrival'};simulation.meeting.phase='done';
  simulation.events=['PROYEK PERTAMA · Client A memesan video ulang tahun Dani. Senin, 06.00.'];
  return {...defaultSave(),reducedMotion:normal.reducedMotion,simulation,speed:0,floorView:0,savedAt:''};
}
export function loadProjectGame():SaveData {
  const normal=loadGame();try{return prepareProjectSession(normal,localStorage);}catch{return prepareProjectSession(normal);}
}
export function deliveryReady(s:Simulation):boolean {
  const client=s.clients.find(c=>c.projectId===PROJECT.id);
  return s.project?.id===PROJECT.id&&s.gameDay===3&&s.gameMinute>=PROJECT.deadlineMinute&&client?.phase==='meeting'&&client.path.length===0&&
    pointDistance(client.position,clientMeetingSeat(1).position)<.12&&s.npcs[0].path.length===0&&pointDistance(s.npcs[0].position,clientMeetingSeat(2).position)<.12;
}
export function canReviewProject(s:Simulation):boolean {return deliveryReady(s)&&s.ownerActive&&s.ownerRoom===11&&s.clients.some(c=>c.projectId===PROJECT.id&&c.ownerJoined);}
export function decideProject(save:SaveData,choice:ProjectDecision['choice'],note:string,storage:StoragePort=localStorage):ProjectDecision {
  const existing=readProjectDecision(storage);if(existing)return existing;
  if(!canReviewProject(save.simulation))throw new Error('Bergabunglah dengan Client A dan Atlas sebelum mengambil keputusan.');
  if(choice==='revision'&&!note.trim())throw new Error('Tulis catatan revisi agar dapat dibawa ke chat.');
  const now=new Date().toISOString(),s=save.simulation;
  const next:SaveData={...save,savedAt:now,speed:1,simulation:{...s,project:undefined,ownerActivity:null,
    nextClientAt:s.gameDay*1440+580,nextManagementAt:s.gameDay*1440+500,nextIssueAt:s.gameDay*1440+540,
    clients:s.clients.map(c=>c.projectId===PROJECT.id?{...c,phase:'leaving',ownerJoined:true}:c),
    events:[choice==='accepted'?'Client A menerima video Dani. Terima kasih, tim! Besok kantor kembali ke rutinitas biasa.':'Client A meminta revisi. Catatan tersimpan; Founder akan membawa arahan ke chat.',...s.events].slice(0,8)}};
  const decision:ProjectDecision={projectId:PROJECT.id,choice,note:note.trim().slice(0,2000),decidedAt:now,save:next};
  // Commit decision and checkpoint together. Storage errors leave the project undecided.
  storage.setItem(PROJECT_RESULT_KEY,JSON.stringify(decision));
  try{storage.setItem(SAVE_KEY,JSON.stringify(next));}catch{ /* The atomic decision already contains the checkpoint. */ }
  return decision;
}
