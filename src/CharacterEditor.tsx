import { useState } from 'react';
import { characterProfile, resetCharacterAppearance, updateCharacterAppearance } from './characterProfiles';
import type { CharacterAppearance } from './characterProfiles';
import { useCharacterRevision } from './useCharacterRevision';
import './characterEditor.css';

const colorFields = [['skin','Kulit'],['hair','Rambut'],['eyeColor','Mata'],['color','Atasan'],['trousers','Celana'],['accent','Aksen']] as const;

export function CharacterEditor({ index }: { index: number }) {
  // Each identity owns its draft and feedback; choosing another identity starts a fresh form.
  return <CharacterEditorFields key={index} index={index} />;
}

function CharacterEditorFields({ index }: { index: number }) {
  useCharacterRevision();
  const profile = characterProfile(index);
  const [name, setName] = useState(profile.name);
  const [status, setStatus] = useState('Perubahan visual langsung terlihat di kantor.');
  const edit = (patch: Partial<CharacterAppearance>) => {
    const saved = updateCharacterAppearance(index, patch);
    if (patch.name !== undefined) setName(characterProfile(index).name);
    setStatus(saved ? 'Tersimpan di perangkat ini.' : 'Tampil untuk sesi ini; penyimpanan perangkat tidak tersedia.');
  };
  return <section className="character-editor" aria-label={`Edit karakter ${profile.name}`}>
    <div className="eyebrow">NAMA & PENAMPILAN</div>
    <form onSubmit={event => { event.preventDefault(); if (name.trim()) edit({ name }); else { setName(profile.name); setStatus('Isi nama karakter terlebih dahulu.'); } }}>
      <label htmlFor="character-name">Nama karakter</label>
      <div className="character-name-field"><input id="character-name" value={name} maxLength={24} onChange={event => setName(event.target.value)} /><button type="submit">Simpan nama</button></div>
    </form>
    <div className="character-editor-selects">
      <label>Model rambut<select value={profile.hairStyle} onChange={event => edit({ hairStyle: event.target.value as CharacterAppearance['hairStyle'] })}>
        <option value="sidepart">Belah samping</option><option value="bob">Bob</option><option value="ponytail">Kuncir</option><option value="curls">Keriting</option><option value="quiff">Quiff</option><option value="bun">Sanggul</option><option value="textured">Pendek bertekstur</option>
      </select></label>
      <label>Pakaian<select value={profile.garment} onChange={event => edit({ garment: event.target.value as CharacterAppearance['garment'] })}>
        <option value="jacket">Jaket</option><option value="overshirt">Kemeja santai</option><option value="polo">Polo</option><option value="apron">Apron</option>
      </select></label>
      <label>Bentuk wajah<select value={profile.faceShape} onChange={event => edit({ faceShape: event.target.value as CharacterAppearance['faceShape'] })}><option value="soft">Lembut</option><option value="round">Bulat</option><option value="narrow">Ramping</option></select></label>
      <label>Bentuk mata<select value={profile.eyeShape} onChange={event => edit({ eyeShape: event.target.value as CharacterAppearance['eyeShape'] })}><option value="round">Bulat</option><option value="almond">Almond</option></select></label>
    </div>
    <div className="character-editor-colors">{colorFields.map(([key, label]) => <label key={key}>{label}<input type="color" value={profile[key]} aria-label={`Warna ${label.toLowerCase()}`} onChange={event => edit({ [key]: event.target.value })} /></label>)}</div>
    <label className="studio-toggle"><input type="checkbox" checked={profile.glasses} onChange={event => edit({ glasses: event.target.checked })} /> Kacamata</label>
    <p className="character-editor-fixed">Peran dan ruangan tetap: {profile.role}.</p>
    <button className="character-reset" onClick={() => { const saved = resetCharacterAppearance(index); setName(characterProfile(index).name); setStatus(saved ? 'Nama dan penampilan asli dipulihkan.' : 'Penampilan dipulihkan untuk sesi ini.'); }}>Pulihkan karakter ini</button>
    <small className="character-editor-status" role="status">{status}</small>
  </section>;
}
