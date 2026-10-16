import {useState} from 'react';
import {avatarStorage,readAvatarLibrary,saveAvatarLibrary,founderAppearance,AVATAR_LIMIT} from './avatarLibrary';
import {characterProfile,OWNER_PROFILE_INDEX,updateCharacterAppearance,validateCharacterAppearance} from './characterProfiles';
import type {CharacterAppearance} from './characterProfiles';
import {useCharacterRevision} from './useCharacterRevision';
import './characterEditor.css';

export function AvatarCreator({onChoose}:{onChoose:()=>void}){
 useCharacterRevision();
 const [avatars,setAvatars]=useState(()=>readAvatarLibrary(avatarStorage())),[creating,setCreating]=useState(false),[name,setName]=useState(''),[gender,setGender]=useState<CharacterAppearance['gender']>('male'),[selected,setSelected]=useState(''),[status,setStatus]=useState('');
 const persist=(next:typeof avatars)=>{setAvatars(next);return saveAvatarLibrary(next,avatarStorage());};
 const choose=(id:string)=>{const avatar=avatars.find(a=>a.id===id);if(!avatar)return;setSelected(id);const saved=updateCharacterAppearance(OWNER_PROFILE_INDEX,avatar.appearance);onChoose();setStatus(saved?'Avatar Founder sudah dipakai di kantor.':'Avatar dipakai untuk sesi ini; penyimpanan tidak tersedia.');};
 return <section className="avatar-creator" aria-label="Buat avatar Founder">
  <div className="eyebrow">AVATAR FOUNDER MILIKMU</div><p>Rancang karakter sendiri, lalu gunakan untuk menjelajahi kantor.</p>
  <button className="avatar-create-button" disabled={avatars.length>=AVATAR_LIMIT} onClick={()=>{setCreating(!creating);setStatus('');}}>＋ Buat karakter sendiri</button>
  {creating&&<form onSubmit={e=>{e.preventDefault();if(!name.trim()||avatars.length>=AVATAR_LIMIT)return;const avatar={id:crypto.randomUUID(),appearance:founderAppearance(name,gender)};const saved=persist([...avatars,avatar]);updateCharacterAppearance(OWNER_PROFILE_INDEX,avatar.appearance);setSelected(avatar.id);setCreating(false);setName('');onChoose();setStatus(saved?'Karakter dibuat dan dipakai sebagai avatar Founder. Atur detailnya di bawah.':'Karakter dibuat untuk sesi ini. Penyimpanan tidak tersedia.');}}>
   <label>Nama avatar<input required maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama karaktermu"/></label>
   <fieldset><legend>Jenis kelamin avatar baru</legend>{([['male','Pria'],['female','Wanita']] as const).map(([value,label])=><label key={value}><input type="radio" name="new-avatar-gender" value={value} checked={gender===value} onChange={()=>setGender(value)}/>{label}</label>)}</fieldset>
   <div className="avatar-form-actions"><button type="submit" disabled={!name.trim()}>Buat & pakai</button><button type="button" onClick={()=>setCreating(false)}>Batal</button></div>
  </form>}
  {avatars.length>0&&<><label>Karakter tersimpan<select value={selected} onChange={e=>choose(e.target.value)}><option value="">Pilih avatar Founder</option>{avatars.map(a=><option key={a.id} value={a.id}>{a.appearance.name} · {a.appearance.gender==='female'?'Wanita':'Pria'}</option>)}</select></label>
   <button disabled={!selected} onClick={()=>{const appearance=validateCharacterAppearance(characterProfile(OWNER_PROFILE_INDEX)) as CharacterAppearance;const next=avatars.map(a=>a.id===selected?{...a,appearance}:a);const saved=persist(next);setStatus(saved?'Penampilan Founder disimpan ke karakter pilihan.':'Penampilan tersimpan untuk sesi ini.');}}>Simpan penampilan ke karakter ini</button></>}
  <small>{avatars.length}/{AVATAR_LIMIT} karakter · tersimpan di perangkat ini</small>
  {status&&<p role="status" className="avatar-status">{status}</p>}
 </section>;
}
