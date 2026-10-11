import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { rooms, staff } from './worldData';
import type { Room, Staff } from './worldData';
import { ROOM_DEPTH, ROOM_WIDTH, moveAvatar, roomAt } from './navigation';
import type { Point } from './navigation';
import { loadGame, stepSimulation, assignActivity, greet, activityLabels, SAVE_KEY } from './simulation';
import type { SaveData, Simulation, NpcState } from './simulation';
import { requestInteraction, cancelInteraction, encounterFor, interactionLabels, interactionDuration, dialogueFor, bondKey, bondLabel } from './social';
import type { InteractionKind } from './social';
import { CharacterRig } from './CharacterRig';
import type { Pose } from './CharacterRig';
import { RoomLife, OfficeLighting, daylight } from './RoomLife';
import { SpeechBubble } from './SpeechBubble';

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
  const nearby = npcs.findIndex((npc) => Math.hypot(npc.position[0] - avatarPosition.current[0], npc.position[1] - avatarPosition.current[1]) < 1.8);
  latestSave.current = { version: 3, simulation, roomId: selectedRoom, mode, speed, reducedMotion, avatar: avatarPosition.current, savedAt };

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
          <OfficeLighting minute={gameMinute} />
          <OfficeWorld selectedRoom={selectedRoom} mode={mode} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarGesture={avatarGesture} avatarPosition={avatarPosition} touchKeys={touchKeys} onAvatarRoomChange={setAvatarRoom} onSelectRoom={focusRoom} onSelectNpc={inspectNpc} />
          <CameraRig room={room} mode={mode} />
        </Canvas>
        <div className="world-vignette" />
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">V<span>✦</span></div>
            <div><div className="brand-name">VANDERLEINZ <span>AI HQ</span></div><div className="brand-caption">OFFICE TYCOON SIMULATOR</div></div>
          </div>
          <div className="topbar-center"><span className="live-dot" /> {speed === 0 ? 'SIMULATION PAUSED' : 'LIFE AT HQ'} <i>·</i> DAY {String(gameDay).padStart(2, '0')}</div>
          <div className="topbar-actions">
            <div className="credit-pill"><span className="coin">✦</span><span>{credits.toLocaleString()}</span><small>HQ CREDITS</small></div>
            <button className="save-button" onClick={saveGame} aria-label="Save locally"><span>▣</span> Save</button>
          </div>
        </header>

        <nav className="compact-tools" aria-label="Office controls"><button aria-expanded={mobilePanel === 'map'} onClick={() => setMobilePanel(mobilePanel === 'map' ? null : 'map')}>⌖ Map · 8 rooms</button><button aria-expanded={mobilePanel === 'team'} onClick={() => setMobilePanel(mobilePanel === 'team' ? null : 'team')}>♙ Team · 6</button><button onClick={() => setMode(mode === 'director' ? 'avatar' : 'director')}>{mode === 'director' ? 'Enter Avatar' : 'Back to Director'}</button></nav>
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
          <div className="room-metric"><span>TEAM MEMBERS</span><strong>{npcs.filter((person) => roomAt(person.position) === selectedRoom).length || '—'}</strong></div>
          <div className="right-divider tight" />
          <div className="staff-heading"><span>YOUR PEOPLE</span><span className="staff-total">06</span></div>
          <div className="staff-list">
            {staff.map((person, index) => {
              const npc = npcs[index];
              const staffRoom = rooms[npc.destination];
              return <button key={person.name} className={`staff-row ${selectedNpc === index ? 'at-room' : ''}`} onClick={() => inspectNpc(index)} aria-label={`Inspect ${person.name}`} title={`${person.role} · ${staffRoom.name}`}>
                <span className="staff-avatar" style={{ backgroundColor: `${person.color}20`, color: person.color }}>{person.name.slice(0, 1)}</span>
                <span className="staff-info"><strong>{person.name}</strong><small>{encounterFor(simulation, index) ? interactionLabels[encounterFor(simulation, index)!.kind] : npc.path.length ? 'Berjalan → ' + staffRoom.name : activityLabels[npc.activity]}</small></span>
                <span className="staff-status" title={`Energi ${Math.round(npc.energy)}%`}><i /></span>
              </button>;
            })}
          </div>
          <div className="api-note"><span>✳</span><span>Milestone 03 · Office stories<br /><small>Hubungan tim tersimpan lokal</small></span></div>
        </aside>


        {inspected && selectedNpc !== null && <section className="npc-detail" aria-label="NPC details">
          <div className="npc-detail-heading"><div><span className="eyebrow">TEAM JOURNAL</span><h2>{inspected.name}</h2><small>{staff[selectedNpc].role}</small></div><button onClick={() => setSelectedNpc(null)} aria-label="Close NPC details">×</button></div>
          <div className="detail-tabs" role="group" aria-label="NPC detail tabs"><button aria-pressed={npcTab === 'status'} onClick={() => setNpcTab('status')}>Kondisi</button><button aria-pressed={npcTab === 'social'} onClick={() => setNpcTab('social')}>Interaksi & hubungan</button></div>
          {npcTab === 'status' ? <>
          <p>{inspected.path.length ? 'Berjalan ke ' + rooms[inspected.destination].name : activityLabels[inspected.activity] + ' · ' + rooms[inspected.destination].name}</p>
          {([['energy', 'Energi'], ['focus', 'Fokus'], ['social', 'Sosial']] as const).map(([key, label]) => <label className="need-row" key={key}><span>{label}</span><meter min={0} max={100} low={25} optimum={85} value={inspected[key]} aria-label={label} /><strong>{Math.round(inspected[key])}%</strong></label>)}
          <div className="work-progress">Pekerjaan berikutnya <strong>{Math.floor(inspected.workMinutes)} / 60 menit</strong><small>+10 HQ Credits per 60 menit bekerja</small></div>
          <div className="npc-orders"><button disabled={speed === 0} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'work'))}>Arahkan bekerja</button><button disabled={speed === 0} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'break'))}>Istirahat di Lounge</button></div>
          <small className="order-hint">{speed === 0 ? 'Lanjutkan waktu untuk memberi arahan.' : inspected.override ? 'Arahan aktif · kembali ke jadwal setelah 60 menit game.' : 'Arahan berlaku 60 menit game.'}</small>

          </> : <div className="social-controls">
            {currentEncounter ? <div className="encounter-card"><strong>{interactionLabels[currentEncounter.kind]}</strong><p>{currentEncounter.participants.map((i) => staff[i].name).join(' ↔ ')}</p><small>{currentEncounter.phase === 'approach' ? 'Menuju tempat pertemuan…' : staff[dialogueFor(currentEncounter).speaker].name + ': ' + dialogueFor(currentEncounter).text}</small><progress max={interactionDuration[currentEncounter.kind]} value={currentEncounter.elapsed} aria-label="Conversation progress" /><button disabled={speed === 0} onClick={() => setSimulation((current) => cancelInteraction(current, selectedNpc))}>Akhiri interaksi</button></div> : <>
              <label>Rekan interaksi<select aria-label="Interaction partner" value={partner} onChange={(event) => setPartner(Number(event.target.value))}>{staff.map((p, i) => i !== selectedNpc && <option key={p.name} value={i}>{p.name} · {p.role}</option>)}</select></label>
              <label>Kegiatan<select aria-label="Interaction activity" value={interactionKind} onChange={(event) => setInteractionKind(event.target.value as InteractionKind)}>{(Object.keys(interactionLabels) as InteractionKind[]).map((kind) => <option key={kind} value={kind}>{interactionLabels[kind]}</option>)}</select></label>
              <p className="social-explainer">{interactionKind === 'brainstorm' ? 'Bertemu di Meeting Room · fokus +12' : interactionKind === 'encourage' ? 'Bertemu di Lounge · energi +8' : 'Bertemu di Lounge · sosial +18'}. Kedekatan bertambah setelah kegiatan selesai.</p>
              <button className="start-interaction" disabled={speed === 0 || !!partnerBusy} onClick={() => { setSimulation((current) => requestInteraction(current, selectedNpc, partner, interactionKind)); setSelectedRoom(interactionKind === 'brainstorm' ? 2 : 5); }}>Mulai interaksi</button>
              {speed === 0 ? <small>Lanjutkan waktu untuk berinteraksi.</small> : partnerBusy ? <small>{staff[partner].name} sedang bersama rekan lain.</small> : null}
            </>}
            <div className="relationship-heading">KEDEKATAN {inspected.name}</div>
            {staff.map((p, i) => i !== selectedNpc && <div key={p.name} className="bond-row"><span>{p.name}<small>{bondLabel(simulation.bonds[bondKey(selectedNpc, i)])}</small></span><meter min={0} max={100} value={simulation.bonds[bondKey(selectedNpc, i)]} aria-label={'Relationship with ' + p.name} /><strong>{Math.round(simulation.bonds[bondKey(selectedNpc, i)])}</strong></div>)}
          </div>}
        </section>}
        <div className="activity-feed" aria-label="HQ activity"><span className="eyebrow">HQ MOMENTS</span><p>{simulation.events[0]}</p><button aria-expanded={showMoments} onClick={() => { setSelectedNpc(null); setShowMoments(!showMoments); }}>{simulation.encounters.length} interaksi aktif · Lihat cerita ↗</button></div>
        {showMoments && <section className="moments-panel" aria-label="Office stories"><header><div><span className="eyebrow">OFFICE STORIES</span><h2>Hari-hari kecil di HQ</h2></div><button aria-label="Close office stories" onClick={() => setShowMoments(false)}>×</button></header><p>{simulation.completedInteractions} kegiatan bersama selesai</p><label className="motion-control"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Kurangi animasi</label>{simulation.encounters.length === 0 && <p className="story-empty">Pilih staf → Interaksi untuk mengajak rekan ngobrol atau brainstorm. Saat berkumpul, tim juga mengobrol secara otomatis.</p>}{simulation.encounters.map((e) => <article key={e.id} className="encounter-card"><strong>{e.participants.map((i) => staff[i].name).join(' ↔ ')}</strong><p>{interactionLabels[e.kind]} · {rooms[e.roomId].name}</p><small>{e.phase === 'approach' ? 'Sedang menuju tempat pertemuan' : staff[dialogueFor(e).speaker].name + ': ' + dialogueFor(e).text}</small><progress max={interactionDuration[e.kind]} value={e.elapsed} aria-label="Conversation progress" /><button onClick={() => { setSelectedRoom(e.roomId); setShowMoments(false); }}>Lihat di ruangan</button></article>)}<div className="relationship-heading">CATATAN HARI INI</div>{simulation.events.slice(0, 5).map((event, i) => <p className="story-event" key={i}>{event}</p>)}</section>}
        {mode === 'avatar' && <div className="avatar-actions"><button disabled={nearby < 0 || speed === 0 || Date.now() < greetReadyAt} onClick={greetNearby}>{nearby < 0 ? 'Dekati staf untuk menyapa' : Date.now() < greetReadyAt ? 'Sudah disapa · tunggu sebentar' : 'E · Sapa ' + npcs[nearby].name}</button><div className="walk-pad" aria-label="Avatar movement">{[['w','↑'],['a','←'],['s','↓'],['d','→']].map(([key,label]) => <button key={key} aria-label={'Walk ' + key.toUpperCase()} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchKeys.current.add(key); }} onPointerUp={() => touchKeys.current.delete(key)} onPointerCancel={() => touchKeys.current.delete(key)} onLostPointerCapture={() => touchKeys.current.delete(key)}>{label}</button>)}</div></div>}
        <div className="selected-room-tag"><span className="tag-pin">⌖</span><div><small>NOW EXPLORING</small><strong>{mode === 'avatar' ? avatarRoom === null ? 'Koridor HQ' : rooms[avatarRoom].name : room.name}</strong></div><span className="tag-sparkle">✦</span></div>
        <div className="clock-card">
          <div className="clock-readout"><span className="sun-icon">☼</span><div><strong>{formatTime(gameMinute)}</strong><small>GAME TIME · DAY {gameDay}</small></div></div>
          <div className="clock-divider" />
          <div className="speed-control" aria-label="Simulation speed">
            {[0, 1, 2, 3].map((value) => <button key={value} onClick={() => setSpeed(value)} className={speed === value ? 'active' : ''} aria-pressed={speed === value} aria-label={value === 0 ? 'Pause time' : `Set speed ${value}x`}>{value === 0 ? 'Ⅱ' : `${value}×`}</button>)}
          </div>
          <div className="time-caption">24 MIN REAL = 1 GAME DAY</div>
        </div>
        <div className="camera-hint"><span>◉</span> {mode === 'director' ? 'DRAG TO ORBIT  ·  SCROLL TO ZOOM  ·  RIGHT-DRAG TO PAN' : 'WASD / ARROWS TO WALK  ·  E TO SAY HELLO'}</div>
        <div className="world-legend"><span className="legend-dot" /> COZY MINIATURE WORLD <i>·</i> BLUE / CREAM / WOOD</div>
        {toast && <div role="status" className="toast-message"><span>✓</span>{toast}</div>}
        {(savedAt || saveError) && <div role="status" className="saved-indicator">{saveError ? '⚠ Local save unavailable' : '● Autosave on · local browser'}</div>}
      </section>
    </main>
  );
}

type WorldProps = { selectedRoom: number; mode: 'director' | 'avatar'; simulation: Simulation; speed: number; reducedMotion: boolean; avatarGesture: RefObject<number>; avatarPosition: RefObject<Point>; touchKeys: RefObject<Set<string>>; onAvatarRoomChange: (id: number | null) => void; onSelectRoom: (id: number) => void; onSelectNpc: (index: number) => void };
function OfficeWorld({ selectedRoom, mode, simulation, speed, reducedMotion, avatarGesture, avatarPosition, touchKeys, onAvatarRoomChange, onSelectRoom, onSelectNpc }: WorldProps) {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#c8dcda" roughness={1} /></mesh>
    <mesh position={[0, -0.24, 0]} castShadow receiveShadow><boxGeometry args={[20.45, 0.5, 13.1]} /><meshStandardMaterial color="#a57f60" roughness={0.86} /></mesh>
    <mesh position={[0, 0.035, 0]} receiveShadow><boxGeometry args={[20.18, 0.08, 12.82]} /><meshStandardMaterial color="#f6f0e4" roughness={0.92} /></mesh>
    {rooms.map((room) => <RoomShell key={room.id} room={room} selected={selectedRoom === room.id} onSelect={() => onSelectRoom(room.id)} />)}
    {rooms.map((room) => <RoomFurnishings key={`f-${room.id}`} room={room} />)}
    {rooms.map((room) => <RoomLife key={`life-${room.id}`} room={room} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatar={avatarPosition} avatarActive={mode === 'avatar'} />)}
    {staff.map((person, index) => <StaffActor key={person.name} index={index} person={person} npc={simulation.npcs[index]} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarPosition={avatarPosition} avatarActive={mode === 'avatar'} onSelect={() => onSelectNpc(index)} />)}
    <PlayerAvatar active={mode === 'avatar'} position={avatarPosition} touchKeys={touchKeys} onRoomChange={onAvatarRoomChange} reducedMotion={reducedMotion} gesture={avatarGesture} />
    <Decor />
  </group>;
}

function RoomShell({ room, selected, onSelect }: { room: Room; selected: boolean; onSelect: () => void }) {
  const [x, z] = room.center;
  const width = ROOM_WIDTH;
  const depth = ROOM_DEPTH;
  const side = room.id < 4 ? 1 : -1;
  const wallHeight = 1.65;
  const wallMaterial = () => <meshStandardMaterial color={selected ? '#f9f3e7' : '#ede8dd'} roughness={0.92} />;
  return <group position={[x, 0, z]}>
    <mesh onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }} position={[0, 0.055, 0]} receiveShadow><boxGeometry args={[width, 0.12, depth]} /><meshStandardMaterial color={room.tint} roughness={0.98} emissive={selected ? '#d5e7e4' : '#000000'} emissiveIntensity={selected ? 0.18 : 0} /></mesh>
    <mesh position={[0, wallHeight / 2, -side * depth / 2]} castShadow receiveShadow><boxGeometry args={[width, wallHeight, 0.16]} />{wallMaterial()}</mesh>
    <mesh position={[-width / 2, wallHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.16, wallHeight, depth]} />{wallMaterial()}</mesh>
    <mesh position={[width / 2, wallHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.16, wallHeight, depth]} />{wallMaterial()}</mesh>
    <mesh position={[-1.52, wallHeight / 2, side * depth / 2]} castShadow><boxGeometry args={[1.45, wallHeight, 0.16]} />{wallMaterial()}</mesh>
    <mesh position={[1.52, wallHeight / 2, side * depth / 2]} castShadow><boxGeometry args={[1.45, wallHeight, 0.16]} />{wallMaterial()}</mesh>
    <mesh position={[0, 0.025, side * depth / 2]}><boxGeometry args={[1.5, 0.06, 0.2]} /><meshStandardMaterial color="#bd9d75" /></mesh>
    <mesh position={[0, 1.16, -side * (depth / 2 - 0.09)]}><boxGeometry args={[1.46, 0.72, 0.035]} /><meshStandardMaterial color="#add4da" roughness={0.22} metalness={0.08} /></mesh>
    <mesh position={[0, 1.16, -side * (depth / 2 - 0.11)]}><boxGeometry args={[1.54, 0.065, 0.055]} /><meshStandardMaterial color="#d4b993" /></mesh>
    <group position={[0, 1.93, side * (depth / 2 - 0.25)]}><SceneLabel text={`${room.icon}  ${room.name}`} kind="room" selected={selected} /></group>
  </group>;
}

function RoomFurnishings({ room }: { room: Room }) {
  const [x, z] = room.center;
  const items: Record<number, React.ReactNode> = {
    0: <><ReceptionDesk x={x} z={z} /><Plant x={x - 1.55} z={z - 1.65} /><Chair x={x + 1.2} z={z - 0.9} color="#789499" /><Rug x={x} z={z + 0.35} width={2.2} depth={1.15} color="#d8e9e5" /></>,
    1: <><Desk x={x - 0.85} z={z - 0.7} /><Desk x={x + 0.95} z={z - 0.7} /><Chair x={x - 0.85} z={z + 0.13} color="#67879a" /><Chair x={x + 0.95} z={z + 0.13} color="#67879a" /><Plant x={x - 1.55} z={z - 2.0} /><Rug x={x} z={z + 0.8} width={3.2} depth={1.35} color="#d7e5e2" /></>,
    2: <><MeetingTable x={x} z={z - 0.1} /><Chair x={x - 1.15} z={z - 0.55} color="#6c8992" rotation={Math.PI / 2} /><Chair x={x + 1.15} z={z - 0.55} color="#6c8992" rotation={-Math.PI / 2} /><Chair x={x} z={z - 1.15} color="#6c8992" /><Chair x={x} z={z + 0.95} color="#6c8992" rotation={Math.PI} /><Plant x={x + 1.65} z={z - 2.0} /><Rug x={x} z={z + 0.15} width={3.0} depth={2.6} color="#dce8e9" /></>,
    3: <><Desk x={x - 0.95} z={z - 0.75} /><CanvasBoard x={x + 1.05} z={z - 1.25} /><Stool x={x - 0.9} z={z + 0.05} /><Plant x={x + 1.55} z={z - 2.05} /><Rug x={x - 0.2} z={z + 0.8} width={3.25} depth={1.4} color="#eadfe8" /></>,
    4: <><Desk x={x - 0.95} z={z - 0.85} /><Desk x={x + 0.85} z={z - 0.85} /><Chair x={x - 0.95} z={z} color="#688f81" /><Chair x={x + 0.85} z={z} color="#688f81" /><LabShelf x={x + 1.65} z={z - 1.3} /><Plant x={x - 1.65} z={z - 2.0} /><Rug x={x} z={z + 0.95} width={3.0} depth={1.1} color="#dfe9df" /></>,
    5: <><Sofa x={x - 0.65} z={z - 0.9} /><CoffeeTable x={x + 0.45} z={z + 0.25} /><Chair x={x + 1.35} z={z - 0.7} color="#cf9583" rotation={-Math.PI / 3} /><Plant x={x - 1.65} z={z - 2.0} /><Rug x={x} z={z + 0.25} width={3.35} depth={2.6} color="#edd9cc" /></>,
    6: <><ServerRack x={x - 1.15} z={z - 1.2} /><ServerRack x={x + 0.1} z={z - 1.2} /><Desk x={x + 1.25} z={z + 0.45} /><Chair x={x + 1.25} z={z + 1.25} color="#71849b" /><Rug x={x - 0.4} z={z + 0.85} width={3.0} depth={1.4} color="#dce2ed" /></>,
    7: <><Desk x={x - 0.35} z={z - 0.85} /><Chair x={x - 0.35} z={z + 0.03} color="#9a7b57" /><Sofa x={x + 1.15} z={z - 1.55} /><Plant x={x - 1.65} z={z - 1.9} /><Rug x={x + 0.25} z={z + 0.85} width={3.25} depth={1.35} color="#ece1cc" /></>,
  };
  return <group position={[x, 0, z]} rotation={[0, room.id < 4 ? 0 : Math.PI, 0]}><group position={[-x, 0, -z]}>{items[room.id]}</group></group>;
}

function WoodLegs({ x, z, width, depth, height = 0.7 }: { x: number; z: number; width: number; depth: number; height?: number }) {
  return <>{[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}-${sz}`} position={[x + sx * (width / 2 - 0.1), height / 2, z + sz * (depth / 2 - 0.1)]} castShadow><cylinderGeometry args={[0.045, 0.055, height, 8]} /><meshStandardMaterial color="#987250" roughness={0.8} /></mesh>))}</>;
}
function Desk({ x, z }: { x: number; z: number }) { return <group><mesh position={[x, 0.78, z]} castShadow><boxGeometry args={[1.45, 0.14, 0.76]} /><meshStandardMaterial color="#c39b70" roughness={0.7} /></mesh><WoodLegs x={x} z={z} width={1.3} depth={0.62} height={0.72} /><mesh position={[x, 1.12, z - 0.19]} castShadow><boxGeometry args={[0.48, 0.36, 0.055]} /><meshStandardMaterial color="#d4e7e8" roughness={0.35} /></mesh><mesh position={[x, 0.98, z - 0.19]}><boxGeometry args={[0.62, 0.035, 0.07]} /><meshStandardMaterial color="#586e76" /></mesh><mesh position={[x + 0.48, 0.88, z + 0.15]}><cylinderGeometry args={[0.07, 0.09, 0.07, 12]} /><meshStandardMaterial color="#ece6d8" /></mesh></group>; }
function ReceptionDesk({ x, z }: { x: number; z: number }) { return <group><mesh position={[x, 0.65, z - 0.65]} castShadow><boxGeometry args={[2.05, 0.95, 0.78]} /><meshStandardMaterial color="#c09a72" roughness={0.78} /></mesh><mesh position={[x, 1.15, z - 0.65]} castShadow><boxGeometry args={[2.14, 0.1, 0.86]} /><meshStandardMaterial color="#e3cba6" roughness={0.7} /></mesh><mesh position={[x, 0.68, z - 0.235]}><boxGeometry args={[1.3, 0.28, 0.02]} /><meshStandardMaterial color="#7899a1" roughness={0.7} /></mesh><mesh position={[x, 1.23, z - 0.45]}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color="#d4b26f" /></mesh></group>; }
function Chair({ x, z, color, rotation = 0 }: { x: number; z: number; color: string; rotation?: number }) { return <group position={[x, 0, z]} rotation={[0, rotation, 0]}><mesh position={[0, 0.47, 0]} castShadow><boxGeometry args={[0.55, 0.16, 0.52]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh><mesh position={[0, 0.82, -0.2]} castShadow><boxGeometry args={[0.55, 0.62, 0.13]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh><mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.07, 0.1, 0.42, 8]} /><meshStandardMaterial color="#8f795e" /></mesh><mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.28, 0.28, 0.07, 10]} /><meshStandardMaterial color="#8f795e" /></mesh></group>; }
function MeetingTable({ x, z }: { x: number; z: number }) { return <group><mesh position={[x, 0.78, z - 0.1]} castShadow><cylinderGeometry args={[0.74, 0.74, 0.13, 8]} /><meshStandardMaterial color="#c3a17d" roughness={0.74} /></mesh><mesh position={[x, 0.39, z - 0.1]}><cylinderGeometry args={[0.12, 0.19, 0.66, 8]} /><meshStandardMaterial color="#9c7958" /></mesh><mesh position={[x, 0.89, z - 0.1]}><cylinderGeometry args={[0.12, 0.12, 0.025, 12]} /><meshStandardMaterial color="#e9e2d4" /></mesh></group>; }
function Plant({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.19, 0.14, 0.45, 10]} /><meshStandardMaterial color="#c9a77e" roughness={0.88} /></mesh>{[[-0.15, 0.9, 0], [0.12, 0.98, 0.04], [0, 1.2, -0.06], [0.2, 0.82, -0.07]].map((p, i) => <mesh key={i} position={[p[0], p[1], p[2]]} rotation={[0.2, i * 0.8, -0.22]} castShadow><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#6a9076' : '#7fa084'} roughness={0.9} /></mesh>)}</group>; }
function Rug({ x, z, width, depth, color }: { x: number; z: number; width: number; depth: number; color: string }) { return <mesh position={[x, 0.14, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[width, depth]} /><meshStandardMaterial color={color} roughness={1} /></mesh>; }
function CanvasBoard({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 1.08, 0]} castShadow><boxGeometry args={[1.2, 0.95, 0.12]} /><meshStandardMaterial color="#d6c7ad" /></mesh><mesh position={[0, 1.08, 0.07]}><boxGeometry args={[1.08, 0.82, 0.03]} /><meshStandardMaterial color="#e7cfbd" /></mesh><mesh position={[-0.22, 1.19, 0.1]} rotation={[0, 0, 0.45]}><boxGeometry args={[0.08, 0.42, 0.04]} /><meshStandardMaterial color="#829bb5" /></mesh><mesh position={[0.16, 0.95, 0.1]} rotation={[0, 0, -0.62]}><boxGeometry args={[0.08, 0.35, 0.04]} /><meshStandardMaterial color="#d28577" /></mesh></group>; }
function Stool({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.12, 10]} /><meshStandardMaterial color="#c78e78" /></mesh><mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.075, 0.1, 0.48, 8]} /><meshStandardMaterial color="#9c7958" /></mesh></group>; }
function LabShelf({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 0.77, 0]} castShadow><boxGeometry args={[0.46, 1.35, 1.2]} /><meshStandardMaterial color="#a8815f" /></mesh>{[-0.35, 0.05, 0.44].map((y, i) => <mesh key={i} position={[0, y + 0.23, 0.02]}><boxGeometry args={[0.5, 0.05, 1.15]} /><meshStandardMaterial color="#d3b38e" /></mesh>)}{[-0.36, 0.05, 0.41].map((y, i) => <mesh key={i} position={[0.04, y + 0.4, i % 2 ? -0.2 : 0.23]}><cylinderGeometry args={[0.08, 0.08, 0.28, 10]} /><meshStandardMaterial color={i % 2 ? '#a9c6c4' : '#d4b37c'} /></mesh>)}</group>; }
function Sofa({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[1.55, 0.45, 0.68]} /><meshStandardMaterial color="#c98f7c" roughness={0.9} /></mesh><mesh position={[0, 0.79, -0.25]} castShadow><boxGeometry args={[1.55, 0.48, 0.18]} /><meshStandardMaterial color="#c98f7c" roughness={0.9} /></mesh>{[-0.68, 0.68].map((xPos) => <mesh key={xPos} position={[xPos, 0.55, 0]} castShadow><boxGeometry args={[0.18, 0.56, 0.68]} /><meshStandardMaterial color="#b87e70" /></mesh>)}</group>; }
function CoffeeTable({ x, z }: { x: number; z: number }) { return <group><mesh position={[x, 0.48, z]} castShadow><cylinderGeometry args={[0.52, 0.52, 0.1, 10]} /><meshStandardMaterial color="#c6a27d" /></mesh><mesh position={[x, 0.25, z]}><cylinderGeometry args={[0.07, 0.13, 0.4, 8]} /><meshStandardMaterial color="#947351" /></mesh><mesh position={[x, 0.57, z]}><cylinderGeometry args={[0.07, 0.07, 0.02, 12]} /><meshStandardMaterial color="#f5eee1" /></mesh></group>; }
function ServerRack({ x, z }: { x: number; z: number }) { return <group position={[x, 0, z]}><mesh position={[0, 0.97, 0]} castShadow><boxGeometry args={[0.72, 1.82, 0.95]} /><meshStandardMaterial color="#748396" metalness={0.2} roughness={0.52} /></mesh>{[0.44, 0.83, 1.22, 1.61].map((y, i) => <group key={y}><mesh position={[0, y, 0.49]}><boxGeometry args={[0.57, 0.27, 0.035]} /><meshStandardMaterial color="#536476" /></mesh>{[-0.15, 0, 0.15].map((xPos) => <mesh key={xPos} position={[xPos, y, 0.52]}><sphereGeometry args={[0.028, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#8fc5bd' : '#d6ba80'} emissive={i % 2 ? '#4e8f83' : '#8e7042'} emissiveIntensity={0.35} /></mesh>)}</group>)}</group>; }

function StaffActor({ person, npc, index, simulation, speed, reducedMotion, avatarPosition, avatarActive, onSelect }: { person: Staff; npc: NpcState; index: number; simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive: boolean; onSelect: () => void }) {
  const actor = useRef<THREE.Group>(null);
  const origin = useRef<[number, number, number]>([npc.position[0], 0, npc.position[1]]);
  const encounter = encounterFor(simulation, index);
  const dialogue = encounter?.phase === 'talking' ? dialogueFor(encounter) : null;
  const partnerIndex = encounter?.participants.find((i) => i !== index);
  const greeting = npc.greetUntil > (simulation.gameDay - 1) * 1440 + simulation.gameMinute;
  const pose: Pose = npc.path.length ? 'walk' : greeting ? 'wave' : encounter?.phase === 'talking' ? dialogue?.speaker === index ? encounter.kind === 'encourage' ? 'wave' : 'talk' : 'think' : npc.activity === 'work' ? 'work' : npc.activity === 'meeting' ? 'think' : 'coffee';
  useFrame((_, delta) => {
    if (!actor.current || speed === 0) return;
    const dx = npc.position[0] - actor.current.position.x, dz = npc.position[1] - actor.current.position.z;
    actor.current.position.x = THREE.MathUtils.damp(actor.current.position.x, npc.position[0], 18, delta);
    actor.current.position.z = THREE.MathUtils.damp(actor.current.position.z, npc.position[1], 18, delta);
    let facing = actor.current.rotation.y;
    if (npc.path.length && Math.abs(dx) + Math.abs(dz) > 0.01) facing = Math.atan2(dx, dz);
    else if (greeting && avatarActive) facing = Math.atan2(avatarPosition.current[0] - npc.position[0], avatarPosition.current[1] - npc.position[1]);
    else if (partnerIndex !== undefined) { const p = simulation.npcs[partnerIndex].position; facing = Math.atan2(p[0] - npc.position[0], p[1] - npc.position[1]); }
    else facing = npc.destination < 4 ? Math.PI : 0;
    const angle = Math.atan2(Math.sin(facing - actor.current.rotation.y), Math.cos(facing - actor.current.rotation.y));
    actor.current.rotation.y += angle * (1 - Math.exp(-10 * delta));
  });
  return <group ref={actor} position={origin.current} onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }}>
    <CharacterRig color={person.color} hair={person.hair} pose={pose} speed={speed} reducedMotion={reducedMotion} variant={index} />
    <group position={[0, 1.62, 0]}><SceneLabel text={person.name} kind="npc" /></group>
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

function Decor() {
  return <group>
    <mesh position={[-10.2, 0.26, 0]} castShadow><boxGeometry args={[0.36, 0.72, 13.4]} /><meshStandardMaterial color="#d8c19d" /></mesh>
    <mesh position={[10.2, 0.26, 0]} castShadow><boxGeometry args={[0.36, 0.72, 13.4]} /><meshStandardMaterial color="#d8c19d" /></mesh>
    <mesh position={[0, 0.26, -6.52]} castShadow><boxGeometry args={[20.5, 0.72, 0.34]} /><meshStandardMaterial color="#d8c19d" /></mesh>
    <mesh position={[0, 0.08, 7.1]} receiveShadow><boxGeometry args={[22.2, 0.2, 0.65]} /><meshStandardMaterial color="#7e9fa0" roughness={0.8} /></mesh>
    <mesh position={[0, -0.06, 7.42]} receiveShadow><boxGeometry args={[22.6, 0.14, 0.16]} /><meshStandardMaterial color="#d7bd96" /></mesh>
    <Plant x={-9.7} z={-5.7} /><Plant x={9.6} z={-5.65} />
    <group position={[0, 0, 7.35]}><mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[2.5, 0.48, 0.36]} /><meshStandardMaterial color="#e5d8bf" /></mesh><mesh position={[0, 0.62, 0]}><boxGeometry args={[2.25, 0.08, 0.22]} /><meshStandardMaterial color="#829da0" /></mesh><mesh position={[0, 0.72, 0]}><boxGeometry args={[1.8, 0.08, 0.06]} /><meshStandardMaterial color="#d4b078" /></mesh></group>
  </group>;
}

function CameraRig({ room, mode }: { room: Room; mode: 'director' | 'avatar' }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const animating = useRef(false);
  const previousRoom = useRef(room.id);
  const previousMode = useRef(mode);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(room.center[0], 0, room.center[1]), [room]);
  const goal = useMemo(() => new THREE.Vector3(room.center[0] + 9, 13, room.center[1] + 15), [room]);
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
