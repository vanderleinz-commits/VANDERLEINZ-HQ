import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { rooms, staff, taskLabels } from './worldData';
import type { Room, Staff } from './worldData';
import { ROOM_DEPTH, ROOM_WIDTH, moveAvatar, roomAt } from './navigation';
import type { Point } from './navigation';
import { loadGame, stepSimulation, assignActivity, greet, activityLabels, SAVE_KEY, weekdayName, officeOpen, seatedAt, meetingDialogue, schedule } from './simulation';
import type { SaveData, Simulation, NpcState } from './simulation';
import { requestInteraction, cancelInteraction, encounterFor, interactionLabels, interactionDuration, dialogueFor, bondKey, bondLabel } from './social';
import type { InteractionKind } from './social';
import { CharacterRig } from './CharacterRig';
import type { Pose } from './CharacterRig';
import { RoomLife, OfficeLighting, daylight } from './RoomLife';
import { SpeechBubble } from './SpeechBubble';
import { OfficeFurnishings, OfficeEntrance, OfficeLandscape } from './OfficeArchitecture';
import { arrivalMinute, workSeat } from './officeLayout';

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = Math.floor(minutes % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function App() {
  const [initial] = useState(loadGame);
  const [selectedRoom, setSelectedRoom] = useState(initial.roomId);
  const [mode, setMode] = useState<'director' | 'avatar'>(initial.mode);
  const [speed, setSpeed] = useState(initial.speed);
  const [simulation, setSimulation] = useState(initial.simulation);
  const [mobilePanel, setMobilePanel] = useState<'map' | 'team' | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<number | null>(null);
  const [npcTab, setNpcTab] = useState<'status' | 'social'>('status');
  const [partner, setPartner] = useState(1);
  const [interactionKind, setInteractionKind] = useState<InteractionKind>('chat');
  const [showMoments, setShowMoments] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => initial.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const avatarGesture = useRef(0);
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [toast, setToast] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [greetReadyAt, setGreetReadyAt] = useState(0);
  const avatarPosition = useRef<Point>(initial.avatar);
  const [avatarRoom, setAvatarRoom] = useState<number | null>(() => roomAt(initial.avatar));
  const touchKeys = useRef(new Set<string>());
  const latestSave = useRef<SaveData>(initial);
  const { gameDay, gameMinute, credits, npcs } = simulation;
  const room = rooms[selectedRoom] ?? rooms[0];
  const inspected = selectedNpc === null ? null : npcs[selectedNpc];
  const currentEncounter = selectedNpc === null ? undefined : encounterFor(simulation, selectedNpc);
  const partnerBusy = encounterFor(simulation, partner);
  const nearby = npcs.findIndex((npc) => npc.presence !== 'offsite' && npc.presence !== 'leaving' && Math.hypot(npc.position[0] - avatarPosition.current[0], npc.position[1] - avatarPosition.current[1]) < 1.8);
  const peopleInside = npcs.filter(n => n.presence === 'inside' || n.presence === 'arriving').length;
  const meetingActive = ['gathering','discussing'].includes(simulation.meeting.phase);
  const canOrder = selectedNpc !== null && selectedNpc < 6 && inspected?.presence === 'inside' && schedule(gameMinute) === 'work' && !meetingActive;
  const canSocial = selectedNpc !== null && selectedNpc < 6 && inspected?.presence === 'inside' && npcs[partner]?.presence === 'inside' && officeOpen(gameMinute) && !meetingActive;
  latestSave.current = { version: 4, simulation, roomId: selectedRoom, mode, speed, reducedMotion, avatar: avatarPosition.current, savedAt };

  useEffect(() => {
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min((now - previous) / 1000, 0.5);
      previous = now;
      if (!document.hidden) setSimulation((current) => stepSimulation(current, elapsed, speed));
    }, 200);
    return () => window.clearInterval(timer);
  }, [speed]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const saveGame = () => {
    try {
      const now = new Date().toISOString();
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...latestSave.current, avatar: avatarPosition.current, savedAt: now }));
      setSavedAt(now); setSaveError(false); setToast('Progres HQ tersimpan di browser ini');
    } catch { setSaveError(true); setToast('Penyimpanan tidak tersedia. Izinkan penyimpanan browser lalu coba lagi.'); }
  };
  useEffect(() => {
    const persist = () => {
      try {
        const now = new Date().toISOString();
        localStorage.setItem(SAVE_KEY, JSON.stringify({ ...latestSave.current, avatar: avatarPosition.current, savedAt: now }));
        setSavedAt(now); setSaveError(false);
      } catch { setSaveError(true); }
    };
    const timer = window.setInterval(persist, 15000);
    window.addEventListener('pagehide', persist);
    return () => { clearInterval(timer); window.removeEventListener('pagehide', persist); };
  }, []);
  const inspectNpc = (index: number) => { setMobilePanel(null); setShowMoments(false); setSelectedNpc(index); setPartner((index + 1) % 6); setSelectedRoom(roomAt(npcs[index].position) ?? npcs[index].destination); };
  const greetNearby = () => {
    if (nearby < 0 || speed === 0 || Date.now() < greetReadyAt) return;
    setSimulation((current) => greet(current, nearby));
    avatarGesture.current = 2.5;
    setGreetReadyAt(Date.now() + 10000);
    setToast(npcs[nearby].name + ': Senang bertemu kamu! Semangat untuk hari ini.');
  };
  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (mode === 'avatar' && event.code === 'KeyE' && !event.repeat && !(event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) greetNearby();
    };
    window.addEventListener('keydown', interact);
    return () => window.removeEventListener('keydown', interact);
  });

  const focusRoom = (id: number) => { setSelectedRoom(id); setMobilePanel(null); };
  const handleModeKey = (event: ReactKeyboardEvent<HTMLButtonElement>, next: 'director' | 'avatar') => {
    if (event.key === 'Enter' || event.key === ' ') setMode(next);
  };

  return (
    <main className="game-shell">
      <section className="world-view" aria-label="Playable 3D office world">
        <Canvas shadows dpr={[1, 1.7]} camera={{ position: [16, 19, 24], fov: 34 }} gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={[daylight(gameMinute) > 0.2 ? '#d6e7e8' : '#bdd0df']} />
          <fog attach="fog" args={['#d6e7e8', 26, 52]} />
          <OfficeLighting minute={gameMinute} simulation={simulation} />
          <OfficeWorld selectedRoom={selectedRoom} mode={mode} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarGesture={avatarGesture} avatarPosition={avatarPosition} touchKeys={touchKeys} onAvatarRoomChange={setAvatarRoom} onSelectRoom={focusRoom} onSelectNpc={inspectNpc} />
          <CameraRig room={room} mode={mode} />
        </Canvas>
        <div className="world-vignette" />
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">V<span>✦</span></div>
            <div><div className="brand-name">VANDERLEINZ <span>AI HQ</span></div><div className="brand-caption">OFFICE TYCOON SIMULATOR</div></div>
          </div>
          <div className="topbar-center"><span className={`live-dot ${officeOpen(gameMinute) ? '' : 'closed'}`} /> {speed === 0 ? 'PAUSED' : officeOpen(gameMinute) ? 'KANTOR BUKA' : 'KANTOR TUTUP'} <i>·</i> {peopleInside} / 7 DI HQ</div>
          <div className="topbar-actions">
            <div className="credit-pill"><span className="coin">✦</span><span>{credits.toLocaleString()}</span><small>HQ CREDITS</small></div>
            <button className="save-button" onClick={saveGame} aria-label="Save locally"><span>▣</span> Save</button>
          </div>
        </header>

        <nav className="compact-tools" aria-label="Office controls"><button aria-expanded={mobilePanel === 'map'} onClick={() => setMobilePanel(mobilePanel === 'map' ? null : 'map')}>⌖ Map · 8 rooms</button><button aria-expanded={mobilePanel === 'team'} onClick={() => setMobilePanel(mobilePanel === 'team' ? null : 'team')}>♙ Team · 7</button><button onClick={() => setMode(mode === 'director' ? 'avatar' : 'director')}>{mode === 'director' ? 'Enter Avatar' : 'Back to Director'}</button></nav>
        <aside className={`left-panel ${mobilePanel === 'map' ? 'panel-open' : ''}`}>
          <div className="eyebrow">YOUR HEADQUARTERS</div>
          <div className="panel-heading-row"><h1>Office map</h1><span className="room-count">08 ROOMS</span></div>
          <p className="panel-subtitle">A little world with room to grow.</p>
          <div className="room-list" role="listbox" aria-label="Choose a room">
            {rooms.map((item) => (
              <button className={`room-row ${selectedRoom === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => focusRoom(item.id)} role="option" aria-selected={selectedRoom === item.id}>
                <span className="room-icon" style={{ background: item.tint }}>{item.icon}</span>
                <span className="room-name-wrap"><strong>{item.name}</strong><small>{item.kind}</small></span>
                {selectedRoom === item.id ? <span className="room-arrow">↗</span> : null}
              </button>
            ))}
          </div>
          <div className="panel-footer"><span className="sparkle">✦</span><span>Good things happen<br />between these walls.</span></div>
        </aside>

        <aside className={`right-panel ${mobilePanel === 'team' ? 'panel-open' : ''}`}>
          <div className="mode-heading"><span className="eyebrow">PLAY YOUR WAY</span><span className="tiny-orbit">◉</span></div>
          <div className="mode-switch" role="group" aria-label="Play mode">
            <button className={mode === 'director' ? 'selected' : ''} aria-pressed={mode === 'director'} onClick={() => setMode('director')} onKeyDown={(e) => handleModeKey(e, 'director')}><span>⌖</span> Director</button>
            <button className={mode === 'avatar' ? 'selected' : ''} aria-pressed={mode === 'avatar'} onClick={() => setMode('avatar')} onKeyDown={(e) => handleModeKey(e, 'avatar')}><span>♙</span> Avatar</button>
          </div>
          <div className="right-divider" />
          <div className="selected-room-label">CURRENTLY VIEWING</div>
          <div className="selected-room-title"><span className="selected-room-icon" style={{ background: room.tint }}>{room.icon}</span><div><h2>{room.name}</h2><small>{room.kind}</small></div></div>
          <p className="room-description">{room.summary}</p>
          <div className="room-metric"><span>TEAM MEMBERS</span><strong>{npcs.filter((person) => person.presence !== 'offsite' && roomAt(person.position) === selectedRoom).length || '—'}</strong></div>
          <div className="right-divider tight" />
          <div className="staff-heading"><span>YOUR PEOPLE</span><span className="staff-total">07</span></div>
          <div className="staff-list">
            {staff.map((person, index) => {
              const npc = npcs[index];
              const staffRoom = rooms[npc.destination] ?? rooms[staff[index].roomId];
              return <button key={person.name} className={`staff-row ${selectedNpc === index ? 'at-room' : ''}`} onClick={() => inspectNpc(index)} aria-label={`Inspect ${person.name}`} title={`${person.role} · ${staffRoom.name}`}>
                <span className="staff-avatar" style={{ backgroundColor: `${person.color}20`, color: person.color }}>{person.name.slice(0, 1)}</span>
                <span className="staff-info"><strong>{person.name}</strong><small>{npc.presence === 'offsite' ? 'Di luar · datang ' + formatTime(arrivalMinute(index)) : npc.presence === 'leaving' ? 'Pulang melalui pintu utama' : npc.presence === 'arriving' ? 'Tiba → ' + staffRoom.name : encounterFor(simulation, index) ? interactionLabels[encounterFor(simulation, index)!.kind] : npc.path.length ? 'Berjalan → ' + staffRoom.name : npc.activity === 'work' ? taskLabels[index] : activityLabels[npc.activity]}</small></span>
                <span className={`staff-status ${npc.presence === 'offsite' ? 'offsite' : ''}`} title={`Energi ${Math.round(npc.energy)}%`}><i /></span>
              </button>;
            })}
          </div>
          <div className="api-note"><span>✳</span><span>Milestone 04 · A working office<br /><small>07.00 buka · 08.00–17.00 kerja</small></span></div>
        </aside>


        {inspected && selectedNpc !== null && <section className="npc-detail" aria-label="NPC details">
          <div className="npc-detail-heading"><div><span className="eyebrow">TEAM JOURNAL</span><h2>{inspected.name}</h2><small>{staff[selectedNpc].role}</small></div><button onClick={() => setSelectedNpc(null)} aria-label="Close NPC details">×</button></div>
          <div className="detail-tabs" role="group" aria-label="NPC detail tabs"><button aria-pressed={npcTab === 'status'} onClick={() => setNpcTab('status')}>Kondisi</button><button aria-pressed={npcTab === 'social'} onClick={() => setNpcTab('social')}>Interaksi & hubungan</button></div>
          {npcTab === 'status' ? <>
          <p>{inspected.presence === 'offsite' ? 'Sedang di luar kantor. Datang pukul ' + formatTime(arrivalMinute(selectedNpc)) + '.' : inspected.presence === 'leaving' ? 'Pulang melalui pintu depan.' : inspected.path.length ? 'Berjalan ke ' + rooms[inspected.destination].name : inspected.activity === 'work' ? taskLabels[selectedNpc] + (selectedNpc === 6 ? ' · berdiri di resepsionis' : seatedAt(simulation,selectedNpc) ? ' · duduk di depan komputer' : ' · memeriksa ruang kerja') : activityLabels[inspected.activity] + ' · ' + rooms[inspected.destination].name}</p>
          {([['energy', 'Energi'], ['focus', 'Fokus'], ['social', 'Sosial']] as const).map(([key, label]) => <label className="need-row" key={key}><span>{label}</span><meter min={0} max={100} low={25} optimum={85} value={inspected[key]} aria-label={label} /><strong>{Math.round(inspected[key])}%</strong></label>)}
          <div className="work-progress">Pekerjaan berikutnya <strong>{Math.floor(inspected.workMinutes)} / 60 menit</strong><small>+10 HQ Credits per 60 menit bekerja</small></div>
          {selectedNpc < 6 && <div className="npc-orders"><button disabled={speed === 0 || !canOrder} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'work'))}>Arahkan bekerja</button><button disabled={speed === 0 || !canOrder} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'break'))}>Istirahat di Kantin</button></div>}
          <small className="order-hint">{selectedNpc === 6 ? 'Amanda menjaga resepsionis selama kantor buka, lalu pulang bersama tim.' : !canOrder ? 'Arahan tersedia saat jam kerja di luar rapat.' : speed === 0 ? 'Lanjutkan waktu untuk memberi arahan.' : inspected.override ? 'Arahan aktif hingga pergantian jadwal atau 60 menit game.' : 'Arahan berlaku hingga pergantian jadwal atau 60 menit game.'}</small>

          </> : selectedNpc === 6 ? <div className="social-controls"><p>Amanda menyambut tim dari balik meja resepsionis. Dekati Amanda dalam Avatar mode untuk menyapa.</p></div> : <div className="social-controls">
            {currentEncounter ? <div className="encounter-card"><strong>{interactionLabels[currentEncounter.kind]}</strong><p>{currentEncounter.participants.map((i) => staff[i].name).join(' ↔ ')}</p><small>{currentEncounter.phase === 'approach' ? 'Menuju tempat pertemuan…' : staff[dialogueFor(currentEncounter).speaker].name + ': ' + dialogueFor(currentEncounter).text}</small><progress max={interactionDuration[currentEncounter.kind]} value={currentEncounter.elapsed} aria-label="Conversation progress" /><button disabled={speed === 0} onClick={() => setSimulation((current) => cancelInteraction(current, selectedNpc))}>Akhiri interaksi</button></div> : <>
              <label>Rekan interaksi<select aria-label="Interaction partner" value={partner} onChange={(event) => setPartner(Number(event.target.value))}>{staff.slice(0,6).map((p, i) => i !== selectedNpc && <option key={p.name} value={i}>{p.name} · {p.role}</option>)}</select></label>
              <label>Kegiatan<select aria-label="Interaction activity" value={interactionKind} onChange={(event) => setInteractionKind(event.target.value as InteractionKind)}>{(Object.keys(interactionLabels) as InteractionKind[]).map((kind) => <option key={kind} value={kind}>{interactionLabels[kind]}</option>)}</select></label>
              <p className="social-explainer">{interactionKind === 'brainstorm' ? 'Bertemu di Meeting Room · fokus +12' : interactionKind === 'encourage' ? 'Bertemu di Kantin · energi +8' : 'Bertemu di Kantin · sosial +18'}. Kedekatan bertambah setelah kegiatan selesai.</p>
              <button className="start-interaction" disabled={speed === 0 || !!partnerBusy || !canSocial || interactionKind === 'brainstorm' && schedule(gameMinute) === 'lunch'} onClick={() => { setSimulation((current) => requestInteraction(current, selectedNpc, partner, interactionKind)); setSelectedRoom(interactionKind === 'brainstorm' ? 2 : 5); }}>Mulai interaksi</button>
              {!canSocial ? <small>Kedua rekan perlu berada di kantor, di luar rapat harian.</small> : speed === 0 ? <small>Lanjutkan waktu untuk berinteraksi.</small> : partnerBusy ? <small>{staff[partner].name} sedang bersama rekan lain.</small> : interactionKind === 'brainstorm' && schedule(gameMinute) === 'lunch' ? <small>Jam makan siang digunakan untuk makan dan ngobrol di kantin.</small> : null}
            </>}
            <div className="relationship-heading">KEDEKATAN {inspected.name}</div>
            {staff.slice(0,6).map((p, i) => i !== selectedNpc && <div key={p.name} className="bond-row"><span>{p.name}<small>{bondLabel(simulation.bonds[bondKey(selectedNpc, i)])}</small></span><meter min={0} max={100} value={simulation.bonds[bondKey(selectedNpc, i)]} aria-label={'Relationship with ' + p.name} /><strong>{Math.round(simulation.bonds[bondKey(selectedNpc, i)])}</strong></div>)}
          </div>}
        </section>}
        <div className="activity-feed" aria-label="HQ activity"><span className="eyebrow">HQ MOMENTS</span><p>{simulation.events[0]}</p><button aria-expanded={showMoments} onClick={() => { setSelectedNpc(null); setShowMoments(!showMoments); }}>{simulation.encounters.length} interaksi aktif · Lihat cerita ↗</button></div>
        {showMoments && <section className="moments-panel" aria-label="Office stories"><header><div><span className="eyebrow">OFFICE STORIES</span><h2>Hari-hari kecil di HQ</h2></div><button aria-label="Close office stories" onClick={() => setShowMoments(false)}>×</button></header><OfficeAgenda simulation={simulation} onViewMeeting={() => { setSelectedRoom(2); setShowMoments(false); }} /><p>{simulation.completedInteractions} kegiatan bersama selesai</p><label className="motion-control"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Kurangi animasi</label>{simulation.encounters.length === 0 && <p className="story-empty">Pilih staf → Interaksi untuk mengajak rekan ngobrol atau brainstorm. Saat berkumpul, tim juga mengobrol secara otomatis.</p>}{simulation.encounters.map((e) => <article key={e.id} className="encounter-card"><strong>{e.participants.map((i) => staff[i].name).join(' ↔ ')}</strong><p>{interactionLabels[e.kind]} · {rooms[e.roomId].name}</p><small>{e.phase === 'approach' ? 'Sedang menuju tempat pertemuan' : staff[dialogueFor(e).speaker].name + ': ' + dialogueFor(e).text}</small><progress max={interactionDuration[e.kind]} value={e.elapsed} aria-label="Conversation progress" /><button onClick={() => { setSelectedRoom(e.roomId); setShowMoments(false); }}>Lihat di ruangan</button></article>)}<div className="relationship-heading">CATATAN HARI INI</div>{simulation.events.slice(0, 5).map((event, i) => <p className="story-event" key={i}>{event}</p>)}</section>}
        {mode === 'avatar' && <div className="avatar-actions"><button disabled={nearby < 0 || speed === 0 || Date.now() < greetReadyAt} onClick={greetNearby}>{nearby < 0 ? 'Dekati staf untuk menyapa' : Date.now() < greetReadyAt ? 'Sudah disapa · tunggu sebentar' : 'E · Sapa ' + npcs[nearby].name}</button><div className="walk-pad" aria-label="Avatar movement">{[['w','↑'],['a','←'],['s','↓'],['d','→']].map(([key,label]) => <button key={key} aria-label={'Walk ' + key.toUpperCase()} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchKeys.current.add(key); }} onPointerUp={() => touchKeys.current.delete(key)} onPointerCancel={() => touchKeys.current.delete(key)} onLostPointerCapture={() => touchKeys.current.delete(key)}>{label}</button>)}</div></div>}
        <div className="selected-room-tag"><span className="tag-pin">⌖</span><div><small>NOW EXPLORING</small><strong>{mode === 'avatar' ? avatarRoom === null ? 'Koridor HQ' : rooms[avatarRoom].name : room.name}</strong></div><span className="tag-sparkle">✦</span></div>
        <div className="clock-card">
          <div className="clock-readout"><span className="sun-icon">{officeOpen(gameMinute) ? '☼' : '☾'}</span><div><strong>{formatTime(gameMinute)}</strong><small>{weekdayName(gameDay).toUpperCase()} · HARI {gameDay}</small></div></div>
          <div className="clock-divider" />
          <div className="speed-control" aria-label="Simulation speed">
            {[0, 1, 2, 3].map((value) => <button key={value} onClick={() => setSpeed(value)} className={speed === value ? 'active' : ''} aria-pressed={speed === value} aria-label={value === 0 ? 'Pause time' : `Set speed ${value}x`}>{value === 0 ? 'Ⅱ' : `${value}×`}</button>)}
          </div>
          <button className="agenda-toggle" onClick={() => { setSelectedNpc(null); setShowMoments(!showMoments); }}>Agenda hari ini ↗</button><div className="time-caption">24 MIN REAL = 1 GAME DAY</div>
        </div>
        <div className="camera-hint"><span>◉</span> {mode === 'director' ? 'DRAG TO ORBIT  ·  SCROLL TO ZOOM  ·  RIGHT-DRAG TO PAN' : 'WASD / ARROWS TO WALK  ·  E TO SAY HELLO'}</div>
        <div className="world-legend"><span className="legend-dot" /> COZY MINIATURE WORLD <i>·</i> BLUE / CREAM / WOOD</div>
        {toast && <div role="status" className="toast-message"><span>✓</span>{toast}</div>}
        {(savedAt || saveError) && <div role="status" className="saved-indicator">{saveError ? '⚠ Local save unavailable' : '● Autosave on · local browser'}</div>}
      </section>
    </main>
  );
}

function OfficeAgenda({simulation,onViewMeeting}:{simulation:Simulation;onViewMeeting:()=>void}) {
  const meeting=simulation.meeting;
  const phaseLabels={scheduled:'Dijadwalkan',gathering:'Peserta menuju kursi',discussing:'Berdiskusi',done:'Selesai'};
  return <div className="office-agenda">
    <div className="agenda-heading"><strong>{weekdayName(simulation.gameDay)} · Hari {simulation.gameDay}</strong><span>{officeOpen(simulation.gameMinute)?'Kantor buka':'Kantor tutup'}</span></div>
    <div className="agenda-timeline">{[['07:00','Lampu menyala · tim datang bertahap'],['08:00','Duduk bekerja di komputer'],['12:00','Makan, minum & ngobrol di kantin'],['13:00','Kembali bekerja'],['17:00','Tim pulang · lampu mulai mati']].map(([time,label])=><div key={time}><time>{time}</time><span>{label}</span></div>)}</div>
    <div className="daily-meeting"><strong>Rapat harian · {formatTime(meeting.start)}</strong><p>{phaseLabels[meeting.phase]} · {meeting.duration} menit diskusi</p><small>Enam peserta duduk dahulu, lalu waktu rapat dimulai.</small>{meeting.phase==='discussing'&&<progress max={meeting.duration} value={meeting.elapsed} aria-label="Daily meeting progress" />}<button onClick={onViewMeeting}>Lihat Meeting Room ↗</button></div>
    <small className="agenda-week">Senin–Minggu · Tim bekerja setiap hari</small>
  </div>;
}

type WorldProps = { selectedRoom: number; mode: 'director' | 'avatar'; simulation: Simulation; speed: number; reducedMotion: boolean; avatarGesture: RefObject<number>; avatarPosition: RefObject<Point>; touchKeys: RefObject<Set<string>>; onAvatarRoomChange: (id: number | null) => void; onSelectRoom: (id: number) => void; onSelectNpc: (index: number) => void };
function OfficeWorld({ selectedRoom, mode, simulation, speed, reducedMotion, avatarGesture, avatarPosition, touchKeys, onAvatarRoomChange, onSelectRoom, onSelectNpc }: WorldProps) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#c8dcda" roughness={1} /></mesh>
    <mesh position={[0, -0.24, 0]} castShadow receiveShadow><boxGeometry args={[20.45, 0.5, 13.1]} /><meshStandardMaterial color="#a57f60" roughness={0.86} /></mesh>
    <mesh position={[0, 0.035, 0]} receiveShadow><boxGeometry args={[20.18, 0.08, 12.82]} /><meshStandardMaterial color="#f6f0e4" roughness={0.92} /></mesh>
    <mesh position={[0,.09,0]} receiveShadow><boxGeometry args={[19.5,.02,.84]} /><meshStandardMaterial color="#afc6c7" roughness={1} /></mesh>
    {rooms.map((room) => <RoomShell key={room.id} room={room} selected={selectedRoom === room.id} onSelect={() => onSelectRoom(room.id)} />)}
    {rooms.map((room) => <OfficeFurnishings key={`f-${room.id}`} room={room} />)}
    {rooms.map((room) => <RoomLife key={`life-${room.id}`} room={room} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatar={avatarPosition} avatarActive={mode === 'avatar'} />)}
    {staff.map((person, index) => <StaffActor key={person.name} index={index} person={person} npc={simulation.npcs[index]} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarPosition={avatarPosition} avatarActive={mode === 'avatar'} onSelect={() => onSelectNpc(index)} />)}
    <PlayerAvatar active={mode === 'avatar'} position={avatarPosition} touchKeys={touchKeys} onRoomChange={onAvatarRoomChange} reducedMotion={reducedMotion} gesture={avatarGesture} />
    <OfficeEntrance simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarPosition={avatarPosition} avatarActive={mode === 'avatar'} />
    <OfficeLandscape />
  </group>;
}

function RoomShell({ room, selected, onSelect }: { room: Room; selected: boolean; onSelect: () => void }) {
  const [x, z] = room.center;
  const width = ROOM_WIDTH;
  const depth = ROOM_DEPTH;
  const side = room.center[1] < 0 ? 1 : -1;
  const wallHeight = 1.65;
  const wallMaterial = () => <meshStandardMaterial color={selected ? '#f9f3e7' : '#ede8dd'} roughness={0.92} />;
  return <group position={[x, 0, z]}>
    <mesh onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }} position={[0, 0.055, 0]} receiveShadow><boxGeometry args={[width, 0.12, depth]} /><meshStandardMaterial color={room.tint} roughness={0.98} emissive={selected ? '#d5e7e4' : '#000000'} emissiveIntensity={selected ? 0.18 : 0} /></mesh>
    {room.id === 0 ? [-1.825,1.825].map(dx => <mesh key={dx} position={[dx,wallHeight/2,-side*depth/2]} castShadow><boxGeometry args={[1,wallHeight,.16]} />{wallMaterial()}</mesh>) : <mesh position={[0, wallHeight / 2, -side * depth / 2]} castShadow receiveShadow><boxGeometry args={[width, wallHeight, 0.16]} />{wallMaterial()}</mesh>}
    <mesh position={[-width / 2, wallHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.16, wallHeight, depth]} />{wallMaterial()}</mesh>
    <mesh position={[width / 2, wallHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.16, wallHeight, depth]} />{wallMaterial()}</mesh>
    <mesh position={[-1.52, wallHeight / 2, side * depth / 2]} castShadow><boxGeometry args={[1.45, wallHeight, 0.16]} />{wallMaterial()}</mesh>
    <mesh position={[1.52, wallHeight / 2, side * depth / 2]} castShadow><boxGeometry args={[1.45, wallHeight, 0.16]} />{wallMaterial()}</mesh>
    <mesh position={[0, 0.025, side * depth / 2]}><boxGeometry args={[1.5, 0.06, 0.2]} /><meshStandardMaterial color="#bd9d75" /></mesh>
    {room.id !== 0 && <><mesh position={[0, 1.16, -side * (depth / 2 - 0.09)]}><boxGeometry args={[1.46, 0.72, 0.035]} /><meshStandardMaterial color="#add4da" roughness={0.22} metalness={0.08} /></mesh><mesh position={[0, 1.16, -side * (depth / 2 - 0.11)]}><boxGeometry args={[1.54, 0.065, 0.055]} /><meshStandardMaterial color="#d4b993" /></mesh></>}
    <group position={[0, 1.93, side * (depth / 2 - 0.25)]}><SceneLabel text={`${room.icon}  ${room.name}`} kind="room" selected={selected} /></group>
  </group>;
}

function StaffActor({ person, npc, index, simulation, speed, reducedMotion, avatarPosition, avatarActive, onSelect }: { person: Staff; npc: NpcState; index: number; simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive: boolean; onSelect: () => void }) {
  const actor = useRef<THREE.Group>(null);
  const origin = useRef<[number, number, number]>([npc.position[0], 0, npc.position[1]]);
  const encounter = encounterFor(simulation, index);
  const dialogue = encounter?.phase === 'talking' ? dialogueFor(encounter) : index < 6 ? meetingDialogue(simulation) : null;
  const seat = seatedAt(simulation,index);
  const partnerIndex = encounter?.participants.find((i) => i !== index);
  const greeting = npc.greetUntil > (simulation.gameDay - 1) * 1440 + simulation.gameMinute;
  const pose: Pose = npc.path.length ? 'walk' : greeting ? 'wave' : dialogue ? dialogue.speaker === index ? 'talk' : 'think' : index === 6 || npc.activity === 'prepare' ? 'idle' : npc.activity === 'work' ? seat ? 'work' : 'think' : npc.activity === 'meeting' ? 'think' : npc.activity === 'lunch' ? Math.floor(simulation.gameMinute / 8 + index) % 3 === 0 ? 'coffee' : 'eat' : 'coffee';
  useFrame((_, delta) => {
    if (!actor.current || speed === 0) return;
    const dx = npc.position[0] - actor.current.position.x, dz = npc.position[1] - actor.current.position.z;
    actor.current.position.x = THREE.MathUtils.damp(actor.current.position.x, npc.position[0], 18, delta);
    actor.current.position.z = THREE.MathUtils.damp(actor.current.position.z, npc.position[1], 18, delta);
    let facing = actor.current.rotation.y;
    if (npc.path.length && Math.abs(dx) + Math.abs(dz) > 0.01) facing = Math.atan2(dx, dz);
    else if (seat) facing = seat.rotation;
    else if (greeting && avatarActive) facing = Math.atan2(avatarPosition.current[0] - npc.position[0], avatarPosition.current[1] - npc.position[1]);
    else if (partnerIndex !== undefined) { const p = simulation.npcs[partnerIndex].position; facing = Math.atan2(p[0] - npc.position[0], p[1] - npc.position[1]); }
    else facing = index === 6 ? 0 : workSeat(index).rotation;
    const angle = Math.atan2(Math.sin(facing - actor.current.rotation.y), Math.cos(facing - actor.current.rotation.y));
    actor.current.rotation.y += angle * (1 - Math.exp(-10 * delta));
  });
  return <group ref={actor} position={origin.current} visible={npc.presence !== 'offsite'} onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }}>
    <CharacterRig color={person.color} hair={person.hair} pose={pose} seated={!!seat} speed={speed} reducedMotion={reducedMotion} variant={index} />
    <group position={[0, seat ? 1.58 : 1.84, 0]}><SceneLabel text={person.name} kind="npc" /></group>
    {dialogue?.speaker === index && <SpeechBubble name={person.name} text={dialogue.text} color={person.color} />}
  </group>;
}

function PlayerAvatar({ active, position, touchKeys, onRoomChange, reducedMotion, gesture }: { active: boolean; position: RefObject<Point>; touchKeys: RefObject<Set<string>>; onRoomChange: (id: number | null) => void; reducedMotion: boolean; gesture: RefObject<number> }) {
  const avatar = useRef<THREE.Group>(null);
  const currentRoom = useRef(roomAt(position.current));
  const pose = useRef<Pose>('idle');
  const keys = useRef(new Set<string>());
  const { camera } = useThree();
  useEffect(() => {
    keys.current.clear(); touchKeys.current.clear();
    const down = (event: KeyboardEvent) => {
      if (!active || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
      const aliases: Record<string, string> = { ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' };
      const key = aliases[event.key] ?? event.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) { event.preventDefault(); keys.current.add(key); }
    };
    const up = (event: KeyboardEvent) => {
      const aliases: Record<string, string> = { ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' };
      keys.current.delete(aliases[event.key] ?? event.key.toLowerCase());
    };
    const clear = () => { keys.current.clear(); touchKeys.current.clear(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); clear(); };
  }, [active, touchKeys]);
  useFrame((_, delta) => {
    if (!avatar.current || !active) return;
    const has = (key: string) => keys.current.has(key) || touchKeys.current.has(key);
    const horizontal = Number(has('d')) - Number(has('a')), vertical = Number(has('s')) - Number(has('w'));
    // Camera-relative movement: W always walks toward the top of the screen.
    const direction = new THREE.Vector3(horizontal * 0.832 + vertical * 0.555, 0, -horizontal * 0.555 + vertical * 0.832);
    if (direction.lengthSq()) {
      direction.normalize().multiplyScalar(Math.min(delta, 0.05) * 3.1);
      position.current = moveAvatar(position.current, direction.x, direction.z);
      avatar.current.rotation.y = Math.atan2(direction.x, direction.z);
    }
    gesture.current = Math.max(0, gesture.current - delta);
    pose.current = direction.lengthSq() ? 'walk' : gesture.current > 0 ? 'wave' : 'idle';
    avatar.current.position.set(position.current[0], 0, position.current[1]);
    const nextRoom = roomAt(position.current);
    if (nextRoom !== currentRoom.current) { currentRoom.current = nextRoom; onRoomChange(nextRoom); }
    camera.position.lerp(new THREE.Vector3(position.current[0] + 7, 10, position.current[1] + 10.5), 1 - Math.exp(-4 * delta));
    camera.lookAt(position.current[0], 0.4, position.current[1]);
  });
  return <group ref={avatar} position={[position.current[0], 0, position.current[1]]} visible={active}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}><ringGeometry args={[0.32, 0.4, 32]} /><meshBasicMaterial color="#628ea0" /></mesh>
    <CharacterRig color="#4d7892" hair="#394c5b" pose={pose} speed={active ? 1 : 0} reducedMotion={reducedMotion} />
    <group position={[0, 1.58, 0]}><SceneLabel text="YOU" kind="player" /></group>
  </group>;
}

function SceneLabel({ text, kind, selected = false }: { text: string; kind: 'room' | 'npc' | 'player'; selected?: boolean }) {
  const texture = useMemo(() => {
    const room = kind === 'room';
    const fontSize = room ? 20 : kind === 'npc' ? 17 : 18;
    const height = room ? 38 : 34;
    const width = Math.ceil(text.length * (room ? 11 : 10) + 30);
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2, 2);
      context.beginPath();
      context.roundRect(1, 1, width - 2, height - 2, room ? 8 : 7);
      context.fillStyle = kind === 'player' ? '#597f8d' : selected ? '#fcf8ec' : '#faf8f0';
      context.fill();
      context.lineWidth = 1.25;
      context.strokeStyle = selected ? '#c8ac70' : '#e8e2d5';
      context.stroke();
      context.fillStyle = kind === 'player' ? '#ffffff' : kind === 'npc' ? '#667d7b' : '#617777';
      context.font = `800 ${fontSize}px Arial, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, width / 2, height / 2 + 1, width - 14);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    return map;
  }, [text, kind, selected]);
  useEffect(() => () => texture.dispose(), [texture]);
  const worldWidth = kind === 'room' ? Math.max(1.15, text.length * 0.105 + 0.55) : Math.max(0.72, text.length * 0.115 + 0.42);
  const worldHeight = kind === 'room' ? 0.43 : 0.38;
  return <sprite scale={[worldWidth, worldHeight, 1]} renderOrder={20}>
    <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </sprite>;
}

function CameraRig({ room, mode }: { room: Room; mode: 'director' | 'avatar' }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const animating = useRef(true);
  const previousRoom = useRef(room.id);
  const previousMode = useRef(mode);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(room.center[0], 0, room.center[1]), [room]);
  const goal = useMemo(() => new THREE.Vector3(room.center[0] + 6, 12, room.center[1] + 8), [room]);
  useEffect(() => {
    const roomChanged = previousRoom.current !== room.id;
    const returningToDirector = previousMode.current !== mode && mode === 'director';
    previousRoom.current = room.id;
    previousMode.current = mode;
    if (roomChanged || returningToDirector) animating.current = true;
  }, [room.id, mode]);
  useFrame((_, delta) => {
    if (mode !== 'director' || !animating.current) return;
    const weight = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(goal, weight);
    if (controls.current) {
      controls.current.target.lerp(target, weight);
      controls.current.update();
    }
    if (camera.position.distanceTo(goal) < 0.05 && controls.current && controls.current.target.distanceTo(target) < 0.05) animating.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enabled={mode === 'director'} enableDamping dampingFactor={0.08} minDistance={8} maxDistance={35} maxPolarAngle={Math.PI / 2.02} minPolarAngle={0.4} screenSpacePanning panSpeed={0.85} rotateSpeed={0.65} />;
}

export default App;
