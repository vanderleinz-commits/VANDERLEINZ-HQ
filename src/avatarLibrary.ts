import { defaultCharacterProfiles, OWNER_PROFILE_INDEX, validateCharacterAppearance } from './characterProfiles.ts';
import type { CharacterAppearance } from './characterProfiles.ts';
export const AVATAR_LIBRARY_KEY='blue-and-space-founder-avatars-v1';
export const AVATAR_LIMIT=8;
export type FounderAvatar={id:string;appearance:CharacterAppearance};
type Store=Pick<Storage,'getItem'|'setItem'>;
export function founderAppearance(name:string,gender:CharacterAppearance['gender']):CharacterAppearance {
  const template=defaultCharacterProfiles[gender==='female'?2:OWNER_PROFILE_INDEX];
  return {...validateCharacterAppearance(template),name:name.trim().slice(0,24)||'Founder',gender} as CharacterAppearance;
}
export function readAvatarLibrary(storage?:Store):FounderAvatar[]{
  try{
    const raw=JSON.parse(storage?.getItem(AVATAR_LIBRARY_KEY)??'null');
    if(raw?.version!==1||!Array.isArray(raw.avatars))return [];
    const seen=new Set<string>();
    return raw.avatars.slice(0,AVATAR_LIMIT).flatMap((item:unknown)=>{
      if(!item||typeof item!=='object')return [];
      const {id,appearance}=item as {id:unknown;appearance:unknown};
      if(typeof id!=='string'||id.length>100||!id||seen.has(id))return [];
      const edit=validateCharacterAppearance(appearance);
      if(!edit.name||!edit.gender)return [];
      seen.add(id);return [{id,appearance:{...founderAppearance(edit.name,edit.gender),...edit}}];
    });
  }catch{return [];}
}
export function saveAvatarLibrary(avatars:FounderAvatar[],storage?:Store):boolean {
  try{if(!storage)return false;storage.setItem(AVATAR_LIBRARY_KEY,JSON.stringify({version:1,avatars:avatars.slice(0,AVATAR_LIMIT)}));return true;}catch{return false;}
}
export function avatarStorage():Store|undefined{try{return typeof window==='undefined'?undefined:window.localStorage;}catch{return undefined;}}
