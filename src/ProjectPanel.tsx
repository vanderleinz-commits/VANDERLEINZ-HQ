import { useEffect, useState } from 'react';
import { PROJECT, PROJECT_BEATS, projectBeat, projectDialogue } from './projectStory';
import { deliveryReady, canReviewProject } from './projectSession';
import type { ProjectDecision } from './projectSession';
import type { Simulation } from './simulation';
import { staff } from './worldData';
import './projectPanel.css';

export function ProjectPanel({simulation,decision,speed,onStart,onFocus,onJoin,onDecide}:{simulation:Simulation;decision:ProjectDecision|null;speed:number;onStart:()=>void;onFocus:(room:number)=>void;onJoin:()=>void;onDecide:(choice:ProjectDecision['choice'],note:string)=>void}) {
 const [open,setOpen]=useState(!!simulation.project&&simulation.gameDay===1&&simulation.gameMinute===360),[note,setNote]=useState(''),[watched,setWatched]=useState(false),[mediaError,setMediaError]=useState(false);
 const active=!!simulation.project,beat=projectBeat(simulation.gameDay,simulation.gameMinute),ready=deliveryReady(simulation),review=canReviewProject(simulation),reveal=review||!!decision;
 const dialogue=active?projectDialogue(simulation.project,simulation.gameDay,simulation.gameMinute):null;
 const progress=active?Math.min(100,Math.max(0,(((simulation.gameDay-1)*1440+simulation.gameMinute-360)/(2*1440+960-360))*100)):100;
 const beginning=active&&simulation.gameDay===1&&simulation.gameMinute===360&&speed===0;
 useEffect(()=>{if(ready||review)setOpen(true);},[ready,review]);
 return <section className={`project-dock ${open?'expanded':''}`} aria-label="Proyek Dani">
  <button className="project-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><span>✦ PROJECT 001</span><strong>{decision?decision.choice==='accepted'?'Dani · diterima':'Dani · menunggu revisi':'Kejutan untuk Dani'}</strong><span>{open?'−':'+'}</span></button>
  {open&&<div className="project-content">
   <div className="project-meta"><span>CLIENT A</span><span>3 HARI GAME · RABU 16:00</span></div>
   <h2>{decision?'Arsip penyerahan':beginning?'Senin pagi. Cerita pertama kita.':beat?.title??'Kehidupan di sela proyek'}</h2>
   <p>{decision?decision.choice==='accepted'?'Client A menerima hasilnya. Kantor melanjutkan kegiatan sehari-hari.':'Catatan revisi tersimpan. Kirim arahan ini ke chat untuk menyiapkan versi berikutnya.':beginning?PROJECT.brief:beat?.summary??'Tim beristirahat, pulang, dan kembali esok hari. Proyek berlanjut mengikuti jam kantor.'}</p>
   {active&&<><progress aria-label="Perjalanan proyek" max={100} value={progress}/><div className="project-days">{[1,2,3].map(day=><span className={simulation.gameDay===day?'current':''} key={day}>0{day} · {['Konsep','Produksi','Penyerahan'][day-1]}</span>)}</div></>}
   {beginning&&<button className="project-primary" onClick={()=>{setOpen(false);onStart();}}>Mulai Senin · 06:00 →</button>}
   {active&&!beginning&&!review&&<button className="project-secondary" onClick={()=>onFocus(beat?.room??0)}>Lihat kegiatan tim ↗</button>}
   {dialogue&&!beginning&&<blockquote><strong>{staff[dialogue.speaker].name}</strong> “{dialogue.text}”</blockquote>}
   {active&&!beginning&&<details><summary>Agenda proyek</summary>{PROJECT_BEATS.filter(b=>b.day===simulation.gameDay).map(b=><div className="project-agenda-item" key={b.id}><time>{String(Math.floor(b.start/60)).padStart(2,'0')}:{String(b.start%60).padStart(2,'0')}</time><span>{b.title}</span></div>)}</details>}
   {active&&simulation.gameDay===3&&simulation.gameMinute>=870&&!review&&<div className="project-invitation"><strong>{ready?'Video siap diserahkan':'Client A sedang menuju ruang meeting'}</strong><p>{ready?'Jam menunggu di 16:00. Duduk bersama Client A dan Atlas untuk membuka hasil.':'Amanda menyambut client. Founder dapat bersiap di kursi ruang meeting client.'}</p><button className="project-primary" onClick={()=>{setOpen(false);onJoin();}}>Duduk sebagai Founder →</button></div>}
   {reveal&&<div className="project-delivery"><strong>Video ulang tahun Dani · versi {PROJECT.version}</strong><video key={PROJECT.id} controls playsInline preload="metadata" poster={PROJECT.poster} onEnded={()=>setWatched(true)} onError={()=>setMediaError(true)}><source src={PROJECT.video} type="video/mp4"/></video>
    <a href={PROJECT.video} download="Selamat-ulang-tahun-Dani-v1.mp4">↓ Unduh video MP4</a>
    {mediaError&&<p role="alert">Pemutar tidak dapat memuat video. Coba unduh MP4 di atas.</p>}
    {review&&!decision&&<><p>Tonton hasilnya lalu tentukan respons Client A.</p><label className="project-check"><input type="checkbox" checked={watched} onChange={e=>setWatched(e.target.checked)}/> Saya sudah memeriksa hasil video</label><label htmlFor="revision-note">Catatan revisi (jika diperlukan)</label><textarea id="revision-note" maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Contoh: teks Dani dibuat lebih lama muncul…"/><div className="project-decisions"><button className="project-primary" disabled={!watched} onClick={()=>onDecide('accepted','')}>Client menerima ✓</button><button className="project-secondary" disabled={!watched||!note.trim()} onClick={()=>onDecide('revision',note)}>Minta revisi</button></div></>}
    {decision?.choice==='revision'&&<label>Salin catatan ini ke chat<textarea readOnly value={`Revisi proyek ${PROJECT.title} — versi ${PROJECT.version}:\n${decision.note}`} onFocus={e=>e.target.select()}/></label>}
   </div>}
   {active&&<small className="project-replay-note">Tutup atau muat ulang sebelum keputusan akhir: cerita kembali ke Senin 06:00. Nama, penampilan, dan arsip tetap tersimpan.</small>}
  </div>}
 </section>;
}
