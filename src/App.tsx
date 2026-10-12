import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { rooms, staff, taskLabels, STAFF_WORKERS, FLOOR_HEIGHT, FLOOR_SURFACE_HEIGHT } from './worldData';
import type { Room, Staff } from './worldData';
import { moveAvatar, isWalkable, findPath, roomAt, elevation, floorOf, onStairs, pointDistance } from './navigation';
import type { Point } from './navigation';
import { loadGame, stepSimulation, assignActivity, greet, joinClientMeeting, recordOwnerAttendance, setOwnerRoom, setOwnerEngagement, absoluteMinute, activityLabels, SAVE_KEY, weekdayName, officeOpen, seatedAt, meetingDialogue, schedule, npcPose, routineDialogue, computerBroken } from './simulation';
import type { SaveData, Simulation, NpcState } from './simulation';
import { requestInteraction, cancelInteraction, encounterFor, interactionLabels, interactionDuration, dialogueFor, bondKey, bondLabel } from './social';
import type { InteractionKind } from './social';
import { CharacterRig } from './CharacterRig';
import type { Pose } from './CharacterRig';
import { RoomLife, OfficeLighting, daylight } from './RoomLife';
import { SpeechBubble } from './SpeechBubble';
import { OfficeFurnishings, OfficeEntrance, OfficeLandscape } from './OfficeArchitecture';
import { arrivalMinute, workSeat, desks, RECEPTION_POST, ATTENDANCE_POINT, ownerDeskPoint, ownerDeskSeat, founderMeetingSeat, clientMeetingSeat, meetingSeat, lunchSeat, pantryDrinkPoint, CATERING_COUNTER_POINT, toiletPoint, hrdSeat, OWNER_LUNCH_SLOT } from './officeLayout';
import { BuildingShell } from './BuildingShell';
import type { FloorView } from './BuildingShell';
import { BRAND, GRAPHICS, PALETTE } from './artDirection';
import type { GraphicsQuality } from './artDirection';
import { characterProfile, defaultCharacterProfiles, OWNER_PROFILE_INDEX } from './characterProfiles';
import { useCharacterRevision } from './useCharacterRevision';
import { OfficeServicesVisual } from './OfficeServicesVisual';
import { crowdClear, moveInCrowd } from './crowd';
import type { CrowdPerson } from './crowd';
import { FOLLOW_OFFSET, avatarDirection, followWeight } from './avatarCamera';

const VisualStudio = lazy(() => import('./VisualStudio'));

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = Math.floor(minutes % 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const dutyLabels: Record<string, string> = { private: 'Diskusi proyek dengan Founder', client: 'Menemui client', support: 'Mendampingi pertemuan client', coffee: 'Mengantar minuman', clean: 'Membersihkan ruangan', inspect: 'Memeriksa pekerjaan tim', repair: 'Memperbaiki komputer', read: 'Membaca di Library', toilet: 'Menggunakan WC', drink: 'Mengambil minum', cook: 'Memasak di Pantry', hr: 'Konsultasi / mengurus HRD' };
type PlayerActionKind = 'work'|'meeting'|'meal'|'drink'|'toilet'|'attendance'|'client'|'sofa'|'atlas'|'consult';
type PlayerAction = { id:number; kind:PlayerActionKind; goal:Point; pose:Pose; rotation:number; duration:number; phase:'travel'|'active'; startedAt:number; targetId?:number };
const PLAYER_ACTION_LABELS:Record<PlayerActionKind,string>={work:'Bekerja di meja founder',meeting:'Mengikuti rapat',meal:'Makan bersama di pantry',drink:'Mengambil minum',toilet:'Menggunakan WC',attendance:'Mengisi absensi',client:'Bertemu client',sofa:'Duduk di sofa founder',atlas:'Diskusi dengan ATLAS',consult:'Konsultasi dengan Felin'};
function staffStatus(simulation: Simulation, index: number): string {
  const npc = simulation.npcs[index], destination = rooms[npc.destination] ?? rooms[staff[index].roomId];
  if (npc.presence === 'offsite') return 'Di luar · datang ' + formatTime(arrivalMinute(index));
  if (npc.presence === 'checking-in') return 'Absensi masuk dengan Amanda';
  if (npc.presence === 'checking-out') return 'Absensi pulang dengan Amanda';
  if (npc.presence === 'leaving') return 'Pulang melalui pintu utama';
  if (npc.presence === 'arriving') return 'Tiba · menuju resepsionis';
  if (npc.duty) return (npc.path.length ? 'Menuju · ' : '') + dutyLabels[npc.duty.kind];
  if (computerBroken(simulation, index)) return 'Komputer bermasalah · menunggu NEXUS';
  const encounter = encounterFor(simulation, index);
  if (encounter) return interactionLabels[encounter.kind];
  if (npc.path.length) return 'Berjalan → ' + destination.name;
  return npc.activity === 'work' ? taskLabels[index] : activityLabels[npc.activity];
}
function FloorControls({ value, onChange }: { value: FloorView; onChange: (value: FloorView) => void }) {
  return <nav className="floor-controls" aria-label="Pilih lantai">{([[0, 'Lantai 1'], [1, 'Lantai 2'], ['all', 'Semua']] as const).map(([floor, label]) => <button key={floor} aria-pressed={value === floor} className={value === floor ? 'active' : ''} onClick={() => onChange(floor)}>{label}</button>)}</nav>;
}

function App() {
  useCharacterRevision();
  const [initial] = useState(loadGame);
  const [selectedRoom, setSelectedRoom] = useState(initial.roomId);
  const [floorView, setFloorView] = useState<FloorView>(initial.floorView ?? rooms[initial.roomId].floor);
  const [mode, setMode] = useState<'director' | 'avatar'>(initial.mode);
  const [speed, setSpeed] = useState(initial.speed);
  const [simulation, setSimulation] = useState(initial.simulation);
  const [mobilePanel, setMobilePanel] = useState<'map' | 'team' | null>(null);
  const [selectedNpc, setSelectedNpc] = useState<number | null>(null);
  const [playerAction, setPlayerAction] = useState<PlayerAction | null>(null);
  const [npcTab, setNpcTab] = useState<'status' | 'social'>('status');
  const [partner, setPartner] = useState(1);
  const [interactionKind, setInteractionKind] = useState<InteractionKind>('chat');
  const [showMoments, setShowMoments] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [hideInterface, setHideInterface] = useState(false);
  const [quality, setQuality] = useState<GraphicsQuality>(() => {
    try { return localStorage.getItem('blue-and-space-graphics') === 'high' ? 'high' : 'balanced'; }
    catch { return 'balanced'; }
  });
  const [reducedMotion, setReducedMotion] = useState(() => initial.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const avatarGesture = useRef(0);
  const nextPlayerAction = useRef(1);
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
  const nearby = npcs.findIndex((npc) => npc.presence === 'inside' && npc.duty?.kind !== 'toilet' && pointDistance(npc.position, avatarPosition.current) < 1.8);
  const clientNearby = simulation.clients.find((client) => client.phase === 'meeting' && client.target !== 'atlas' && !client.ownerJoined && pointDistance(client.position, avatarPosition.current) < 2.7);
  const atlasWaiting = npcs[0]?.duty?.kind === 'private' && avatarRoom === 3;
  const hrAvailable = npcs[7]?.presence==='inside'&&!npcs[7].duty&&!npcs.some((npc,index)=>index!==7&&npc.duty?.kind==='hr');
  const receptionAvailable = !npcs[6].duty&&simulation.reception.person===null;
  const peopleInside = npcs.filter(n => n.presence !== 'offsite' && n.presence !== 'leaving').length;
  const completedRoutines = Object.values(simulation.completedDuties).reduce((total, count) => total + count, 0);
  const meetingActive = ['gathering','discussing'].includes(simulation.meeting.phase);
  const canOrder = selectedNpc !== null && selectedNpc !== 6 && inspected?.presence === 'inside' && !inspected.duty && schedule(gameMinute) === 'work' && !meetingActive;
  const canSocial = selectedNpc !== null && selectedNpc !== 6 && inspected?.presence === 'inside' && !inspected.duty && npcs[partner]?.presence === 'inside' && !npcs[partner]?.duty && officeOpen(gameMinute) && !meetingActive;
  latestSave.current = { version: 5, simulation, roomId: selectedRoom, floorView, mode, speed, reducedMotion, avatar: avatarPosition.current, savedAt };

  useEffect(() => {
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min((now - previous) / 1000, 0.5);
      previous = now;
      if (!document.hidden && !showStudio) setSimulation((current) => stepSimulation(current, elapsed, speed, mode==='avatar'?[avatarPosition.current]:[]));
    }, 200);
    return () => window.clearInterval(timer);
  }, [speed, showStudio, mode]);

  useEffect(() => { try { localStorage.setItem('blue-and-space-graphics', quality); } catch { /* Graphics remain usable without storage. */ } }, [quality]);

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
  const focusRoom = (id: number) => { setSelectedRoom(id); setFloorView(rooms[id].floor); setMobilePanel(null); setMode('director'); };
  const chooseFloor = (next: FloorView) => { setFloorView(next); setMode('director'); if (next !== 'all' && room.floor !== next) setSelectedRoom(next === 0 ? 1 : 2); };
  const changeMode = (next: 'director' | 'avatar') => {
    setPlayerAction(null);
    setMode(next); setMobilePanel(null);
    const currentFloor = floorOf(avatarPosition.current);
    if (next === 'avatar') setFloorView(currentFloor);
    else if (mode === 'avatar') { setSelectedRoom(roomAt(avatarPosition.current) ?? (currentFloor === 0 ? 1 : 2)); setFloorView((current) => current === 'all' ? current : currentFloor); }
  };
  const inspectNpc = (index: number) => { setMobilePanel(null); setShowMoments(false); setSelectedNpc(index); setPartner(STAFF_WORKERS.find((other) => other !== index) ?? 0); focusRoom(roomAt(npcs[index].position) ?? staff[index].roomId); };
  const beginPlayerAction = (kind:PlayerActionKind, goal:Point, pose:Pose, duration=0, targetId?:number, rotation=0) => {
    if(speed===0)return;
    if(kind==='consult'&&!hrAvailable||kind==='attendance'&&!receptionAvailable){setToast('Sedang melayani orang lain. Tunggu sebentar, ya.');return;}
    if(!isWalkable(goal)||!findPath(avatarPosition.current,goal).length&&pointDistance(avatarPosition.current,goal)>.08){setToast('Titik interaksi belum bisa dijangkau.');return;}
    setPlayerAction({id:nextPlayerAction.current++,kind,goal,pose,rotation,duration,phase:'travel',startedAt:0,targetId});
    touchKeys.current.clear();
  };
  useEffect(()=>{setSimulation(current=>setOwnerEngagement(current,mode==='avatar'&&!showStudio,playerAction?.phase==='active'?playerAction.kind:null));},[mode,showStudio,playerAction?.phase,playerAction?.kind]);
  const completePlayerArrival = (id:number) => {
    const action=playerAction;
    if(!action||action.id!==id||action.phase!=='travel')return;
    if(action.kind==='attendance')setSimulation(current=>recordOwnerAttendance(current,current.ownerCheckedIn?'out':'in'));
    if(action.kind==='client'&&action.targetId!==undefined)setSimulation(current=>joinClientMeeting(current,action.targetId!));
    if(action.kind==='consult')setToast('Felin siap mendengarkan rencana pengembanganmu.');
    setPlayerAction(current=>current?.id===id?{...current,phase:'active',startedAt:absoluteMinute(simulation)}:current);
  };
  useEffect(()=>{
    if(!playerAction||playerAction.phase!=='active')return;
    if(playerAction.duration>0&&absoluteMinute(simulation)-playerAction.startedAt>=playerAction.duration){setPlayerAction(null);return;}
    if(playerAction.kind==='client'&&playerAction.targetId!==undefined&&simulation.clients.find(client=>client.id===playerAction.targetId)?.phase==='leaving')setPlayerAction(null);
    if(playerAction.kind==='meeting'&&simulation.meeting.phase==='done')setPlayerAction(null);
  },[simulation.gameDay,simulation.gameMinute,simulation.meeting.phase,simulation.clients,playerAction]);
  const greetNearby = () => {
    if (nearby < 0 || speed === 0 || Date.now() < greetReadyAt) return;
    setSimulation((current) => greet(current, nearby));
    avatarGesture.current = 2.5;
    setGreetReadyAt(Date.now() + 10000);
    setToast(staff[nearby].name + ': Senang bertemu kamu! Semangat untuk hari ini.');
  };
  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (showStudio || mode !== 'avatar' || event.repeat || event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.code === 'KeyF' && avatarRoom === 3) {
        event.preventDefault();
        beginPlayerAction('work', ownerDeskSeat.position, 'work', 0, undefined, ownerDeskSeat.rotation);
        return;
      }
      if (event.code !== 'KeyE') return;
      event.preventDefault();
      if (playerAction) { setPlayerAction(null); return; }
      if (nearby === 6 && receptionAvailable) { beginPlayerAction('attendance', ATTENDANCE_POINT, 'sign', 2, undefined, Math.PI); return; }
      if (clientNearby) { beginPlayerAction('client', clientMeetingSeat(0).position, 'talk', 8, clientNearby.id, clientMeetingSeat(0).rotation); return; }
      if (avatarRoom === 2 && meetingActive) { beginPlayerAction('meeting', meetingSeat(6).position, 'talk', 0, undefined, meetingSeat(6).rotation); return; }
      if (atlasWaiting) { beginPlayerAction('atlas', founderMeetingSeat(0).position, 'talk', 12, undefined, founderMeetingSeat(0).rotation); return; }
      if (nearby === 7 && hrAvailable) { beginPlayerAction('consult', hrdSeat(0).position, 'talk', 10, undefined, hrdSeat(0).rotation); return; }
      if (avatarRoom === 5) { beginPlayerAction('meal', lunchSeat(OWNER_LUNCH_SLOT).position, 'eat', 18, undefined, lunchSeat(OWNER_LUNCH_SLOT).rotation); return; }
      if (avatarRoom === 9 || avatarRoom === 10) { beginPlayerAction('toilet', toiletPoint(avatarRoom), 'toilet', 5); return; }
      greetNearby();
    };
    window.addEventListener('keydown', interact);
    return () => window.removeEventListener('keydown', interact);
  }, [showStudio, mode, avatarRoom, playerAction, nearby, clientNearby, meetingActive, atlasWaiting, simulation.meeting.duration, simulation.meeting.elapsed, greetNearby, beginPlayerAction]);


  return (
    <main className={`game-shell ${mode === 'avatar' ? 'avatar-mode' : ''} ${hideInterface ? 'ui-hidden' : ''}`}>
      <section className="world-view" aria-label={`${BRAND.name} · 3D office world`}>
        <Canvas shadows="soft" frameloop={showStudio ? 'never' : 'always'} dpr={[1, GRAPHICS[quality].dpr]} camera={{ position: [25, 27, 34], fov: 34 }} gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
          <color attach="background" args={[daylight(gameMinute) > 0.2 ? '#DFEAF4' : '#91A9C4']} />
          <fog attach="fog" args={[daylight(gameMinute) > 0.2 ? '#DFEAF4' : '#91A9C4', 65, 120]} />
          <OfficeLighting minute={gameMinute} simulation={simulation} quality={quality} />
          <OfficeWorld selectedRoom={selectedRoom} floorView={floorView} mode={showStudio ? 'director' : mode} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarGesture={avatarGesture} avatarPosition={avatarPosition} touchKeys={touchKeys} playerAction={playerAction} onPlayerArrival={completePlayerArrival} onPlayerCancel={() => setPlayerAction(null)} onAvatarRoomChange={(id) => { setAvatarRoom(id); setSimulation((current)=>setOwnerRoom(current,id)); if (id !== null) setSelectedRoom(id); }} onAvatarFloorChange={(floor) => setFloorView((current) => current === 'all' ? current : floor)} onSelectRoom={focusRoom} onSelectNpc={inspectNpc} />
          <CameraRig room={room} floorView={floorView} mode={mode} />
          {import.meta.env.DEV&&<OfficeRenderMetrics />}
        </Canvas>
        <div className="world-vignette" />
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">B<span>✦</span></div>
            <div><div className="brand-name">BLUE <span>AND</span> SPACE</div><div className="brand-caption">HEADQUARTERS · YOUR LITTLE WORLD</div></div>
          </div>
          <div className="topbar-center"><span className={`live-dot ${officeOpen(gameMinute) ? '' : 'closed'}`} /> {speed === 0 ? 'PAUSED' : officeOpen(gameMinute) ? 'KANTOR BUKA' : 'KANTOR TUTUP'} <i>·</i> {peopleInside} / {staff.length} DI HQ</div>
          <div className="topbar-actions">
            <div className="credit-pill reputation-pill"><span className="coin">✧</span><span>{simulation.hqPoints}</span><small>HQ POINTS</small></div>
            <div className="credit-pill"><span className="coin">✦</span><span>{credits.toLocaleString()}</span><small>HQ CREDITS</small></div>
            <button className="save-button" onClick={saveGame} aria-label="Save locally"><span>▣</span> Save</button>
          </div>
        </header>

        <nav className="compact-tools" aria-label="Office controls"><button aria-expanded={mobilePanel === 'map'} onClick={() => setMobilePanel(mobilePanel === 'map' ? null : 'map')}>⌖ Map · {rooms.length} ruang</button><button aria-expanded={mobilePanel === 'team'} onClick={() => setMobilePanel(mobilePanel === 'team' ? null : 'team')}>♙ Team · {staff.length}</button><button onClick={() => changeMode(mode === 'director' ? 'avatar' : 'director')}>{mode === 'director' ? 'Enter Avatar' : 'Director'}</button></nav>
        <FloorControls value={floorView} onChange={chooseFloor} />
        <nav className="visual-tools" aria-label="Visual tools">
          <button onClick={() => { touchKeys.current.clear(); setShowStudio(true); }} aria-haspopup="dialog">✦ Studio visual</button>
          <label className="quality-control">Grafis <select aria-label="Graphics quality" value={quality} onChange={(event) => setQuality(event.target.value as GraphicsQuality)}><option value="balanced">Balanced</option><option value="high">High</option></select></label>
          <button aria-pressed={hideInterface} onClick={() => setHideInterface(!hideInterface)}>{hideInterface ? 'Tampilkan panel' : 'Lihat dunia'}</button>
        </nav>
        <aside className={`left-panel ${mobilePanel === 'map' ? 'panel-open' : ''}`}>
          <div className="eyebrow">YOUR HEADQUARTERS</div>
          <div className="panel-heading-row"><h1>Office map</h1><span className="room-count">{rooms.length} ROOMS</span></div>
          <p className="panel-subtitle">{floorView === 'all' ? 'Dua lantai · seluruh kantor' : `Lantai ${floorView + 1} · ${rooms.filter((item) => item.floor === floorView).length} ruangan`}</p>
          <div className="room-list" role="listbox" aria-label="Choose a room">
            {rooms.filter((item) => floorView === 'all' || item.floor === floorView).map((item) => (
              <button className={`room-row ${selectedRoom === item.id ? 'is-active' : ''}`} key={item.id} onClick={() => focusRoom(item.id)} role="option" aria-selected={selectedRoom === item.id}>
                <span className="room-icon" style={{ background: item.tint }}>{item.icon}</span>
                <span className="room-name-wrap"><strong>{item.name}</strong><small>Lantai {item.floor + 1} · {item.kind}</small></span>
                {selectedRoom === item.id ? <span className="room-arrow">↗</span> : null}
              </button>
            ))}
          </div>
          <div className="panel-footer"><span className="sparkle">✦</span><span>Good things happen<br />between these walls.</span></div>
        </aside>

        <aside className={`right-panel ${mobilePanel === 'team' ? 'panel-open' : ''}`}>
          <div className="mode-heading"><span className="eyebrow">PLAY YOUR WAY</span><span className="tiny-orbit">◉</span></div>
          <div className="mode-switch" role="group" aria-label="Play mode">
            <button className={mode === 'director' ? 'selected' : ''} aria-pressed={mode === 'director'} onClick={() => changeMode('director')}><span>⌖</span> Director</button>
            <button className={mode === 'avatar' ? 'selected' : ''} aria-pressed={mode === 'avatar'} onClick={() => changeMode('avatar')}><span>♙</span> Avatar</button>
          </div>
          <div className="right-divider" />
          <div className="selected-room-label">CURRENTLY VIEWING · LANTAI {room.floor + 1}</div>
          <div className="selected-room-title"><span className="selected-room-icon" style={{ background: room.tint }}>{room.icon}</span><div><h2>{room.name}</h2><small>{room.kind}</small></div></div>
          <p className="room-description">{room.summary}</p>
          <div className="room-metric"><span>TEAM MEMBERS</span><strong>{npcs.filter((person) => person.presence !== 'offsite' && roomAt(person.position) === selectedRoom).length || '—'}</strong></div>
          <div className="right-divider tight" />
          <div className="staff-heading"><span>YOUR PEOPLE</span><span className="staff-total">{String(staff.length).padStart(2,'0')}</span></div>
          <div className="staff-list">
            {staff.map((person, index) => {
              const npc = npcs[index];
              const staffRoom = rooms[npc.destination] ?? rooms[staff[index].roomId];
              return <button key={index} className={`staff-row ${selectedNpc === index ? 'at-room' : ''}`} onClick={() => inspectNpc(index)} aria-label={`Inspect ${person.name}`} title={`${person.role} · ${staffRoom.name}`}>
                <span className="staff-avatar" style={{ backgroundColor: `${person.color}20`, color: person.color }}>{person.name.slice(0, 1)}</span>
                <span className="staff-info"><strong>{person.name}</strong><small>{staffStatus(simulation, index)}</small></span>
                <span className={`staff-status ${npc.presence === 'offsite' ? 'offsite' : computerBroken(simulation, index) ? 'computer-issue' : npc.duty ? 'on-duty' : ''}`} title={computerBroken(simulation, index) ? 'Komputer sedang bermasalah' : `Energi ${Math.round(npc.energy)}%`}><i /></span>
              </button>;
            })}
          </div>
          <div className="api-note"><span>✳</span><span>A living office · 2 floors<br /><small>07.00 buka · 08.00–17.00 kerja</small></span></div>
        </aside>


        {inspected && selectedNpc !== null && <section className="npc-detail" aria-label="NPC details">
          <div className="npc-detail-heading"><div><span className="eyebrow">TEAM JOURNAL</span><h2>{staff[selectedNpc].name}</h2><small>{staff[selectedNpc].role}</small></div><button onClick={() => setSelectedNpc(null)} aria-label="Close NPC details">×</button></div>
          <div className="detail-tabs" role="group" aria-label="NPC detail tabs"><button aria-pressed={npcTab === 'status'} onClick={() => setNpcTab('status')}>Kondisi</button><button aria-pressed={npcTab === 'social'} onClick={() => setNpcTab('social')}>Interaksi & hubungan</button></div>
          {npcTab === 'status' ? <>
          <p>{staffStatus(simulation, selectedNpc)}{inspected.activity === 'work' && seatedAt(simulation, selectedNpc) && !inspected.duty ? ' · duduk di depan komputer' : ''}</p>
          <div className="attendance-summary"><span>Masuk <strong>{inspected.attendanceIn == null ? '—' : formatTime(inspected.attendanceIn)}</strong></span><span>Pulang <strong>{inspected.attendanceOut == null ? '—' : formatTime(inspected.attendanceOut)}</strong></span></div>
          {computerBroken(simulation, selectedNpc) && <p className="issue-note">Komputer sedang bermasalah. NEXUS akan datang memperbaikinya.</p>}
          {([['energy', 'Energi'], ['focus', 'Fokus'], ['social', 'Sosial']] as const).map(([key, label]) => <label className="need-row" key={key}><span>{label}</span><meter min={0} max={100} low={25} optimum={85} value={inspected[key]} aria-label={label} /><strong>{Math.round(inspected[key])}%</strong></label>)}
          <div className="work-progress">Pekerjaan berikutnya <strong>{Math.floor(inspected.workMinutes)} / 60 menit</strong><small>+10 HQ Credits per 60 menit bekerja</small></div>
          {selectedNpc !== 6 && <div className="npc-orders"><button disabled={speed === 0 || !canOrder} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'work'))}>Arahkan bekerja</button><button disabled={speed === 0 || !canOrder} onClick={() => setSimulation((current) => assignActivity(current, selectedNpc, 'break'))}>Istirahat sejenak</button></div>}
          <small className="order-hint">{selectedNpc === 6 ? 'Amanda menjaga resepsionis selama kantor buka, lalu pulang bersama tim.' : !canOrder ? 'Arahan tersedia saat jam kerja di luar rapat.' : speed === 0 ? 'Lanjutkan waktu untuk memberi arahan.' : inspected.override ? 'Arahan aktif hingga pergantian jadwal atau 60 menit game.' : 'Arahan berlaku hingga pergantian jadwal atau 60 menit game.'}</small>

          </> : selectedNpc === 6 ? <div className="social-controls"><p>Amanda menyambut tim dari balik meja resepsionis. Dekati Amanda dalam Avatar mode untuk menyapa.</p></div> : <div className="social-controls">
            {currentEncounter ? <div className="encounter-card"><strong>{interactionLabels[currentEncounter.kind]}</strong><p>{currentEncounter.participants.map((i) => staff[i].name).join(' ↔ ')}</p><small>{currentEncounter.phase === 'approach' ? 'Menuju tempat pertemuan…' : staff[dialogueFor(currentEncounter).speaker].name + ': ' + dialogueFor(currentEncounter).text}</small><progress max={interactionDuration[currentEncounter.kind]} value={currentEncounter.elapsed} aria-label="Conversation progress" /><button disabled={speed === 0} onClick={() => setSimulation((current) => cancelInteraction(current, selectedNpc))}>Akhiri interaksi</button></div> : <>
              <label>Rekan interaksi<select aria-label="Interaction partner" value={partner} onChange={(event) => setPartner(Number(event.target.value))}>{STAFF_WORKERS.filter((i) => i !== selectedNpc).map((i) => <option key={i} value={i}>{staff[i].name} · {staff[i].role}</option>)}</select></label>
              <label>Kegiatan<select aria-label="Interaction activity" value={interactionKind} onChange={(event) => setInteractionKind(event.target.value as InteractionKind)}>{(Object.keys(interactionLabels) as InteractionKind[]).map((kind) => <option key={kind} value={kind}>{interactionLabels[kind]}</option>)}</select></label>
              <p className="social-explainer">{interactionKind === 'brainstorm' ? 'Bertemu di Meeting Room · fokus +12' : interactionKind === 'encourage' ? 'Bertemu di Pantry · energi +8' : 'Bertemu di Pantry · sosial +18'}. Kedekatan bertambah setelah kegiatan selesai.</p>
              <button className="start-interaction" disabled={speed === 0 || !!partnerBusy || !canSocial || interactionKind === 'brainstorm' && schedule(gameMinute) === 'lunch'} onClick={() => { setSimulation((current) => requestInteraction(current, selectedNpc, partner, interactionKind)); focusRoom(interactionKind === 'brainstorm' ? 2 : 5); }}>Mulai interaksi</button>
              {!canSocial ? <small>Kedua rekan perlu berada di kantor, di luar rapat harian.</small> : speed === 0 ? <small>Lanjutkan waktu untuk berinteraksi.</small> : partnerBusy ? <small>{staff[partner].name} sedang bersama rekan lain.</small> : interactionKind === 'brainstorm' && schedule(gameMinute) === 'lunch' ? <small>Jam makan siang digunakan untuk makan dan ngobrol di kantin.</small> : null}
            </>}
            <div className="relationship-heading">KEDEKATAN {staff[selectedNpc].name}</div>
            {STAFF_WORKERS.filter((i) => i !== selectedNpc).map((i) => <div key={i} className="bond-row"><span>{staff[i].name}<small>{bondLabel(simulation.bonds[bondKey(selectedNpc, i)] ?? 25)}</small></span><meter min={0} max={100} value={simulation.bonds[bondKey(selectedNpc, i)] ?? 25} aria-label={'Relationship with ' + staff[i].name} /><strong>{Math.round(simulation.bonds[bondKey(selectedNpc, i)] ?? 25)}</strong></div>)}
          </div>}
        </section>}
        <div className="activity-feed" aria-label="HQ activity"><span className="eyebrow">HQ MOMENTS</span><p title={simulation.events[0]}>{simulation.events[0]}</p><button aria-label={`Office stories · ${simulation.encounters.length} active interactions`} aria-expanded={showMoments} onClick={() => { setSelectedNpc(null); setShowMoments(!showMoments); }}>Cerita ↗</button></div>
        {showMoments && <section className="moments-panel" aria-label="Office stories"><header><div><span className="eyebrow">OFFICE STORIES</span><h2>Hari-hari kecil di HQ</h2></div><button aria-label="Close office stories" onClick={() => setShowMoments(false)}>×</button></header><OfficeAgenda simulation={simulation} onViewMeeting={() => { focusRoom(2); setShowMoments(false); }} /><OfficeOperations simulation={simulation} onFocus={focusRoom} /><p>{simulation.completedInteractions} kegiatan bersama selesai · {completedRoutines} rutinitas selesai</p><label className="motion-control"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Kurangi animasi</label>{simulation.encounters.length === 0 && <p className="story-empty">Pilih staf → Interaksi untuk mengajak rekan ngobrol atau brainstorm. Saat berkumpul, tim juga mengobrol secara otomatis.</p>}{simulation.encounters.map((e) => <article key={e.id} className="encounter-card"><strong>{e.participants.map((i) => staff[i].name).join(' ↔ ')}</strong><p>{interactionLabels[e.kind]} · {rooms[e.roomId].name}</p><small>{e.phase === 'approach' ? 'Sedang menuju tempat pertemuan' : staff[dialogueFor(e).speaker].name + ': ' + dialogueFor(e).text}</small><progress max={interactionDuration[e.kind]} value={e.elapsed} aria-label="Conversation progress" /><button onClick={() => { focusRoom(e.roomId); setShowMoments(false); }}>Lihat di ruangan</button></article>)}<div className="relationship-heading">CATATAN HARI INI</div>{simulation.events.slice(0, 5).map((event, i) => <p className="story-event" key={i}>{event}</p>)}</section>}
        {mode === 'avatar' && <div className="avatar-actions">
          {playerAction ? <button onClick={() => setPlayerAction(null)}>{playerAction.phase==='travel'?'Berjalan · batal':'X · Selesai: '+PLAYER_ACTION_LABELS[playerAction.kind]}</button> : <>
            {nearby >= 0 && <button disabled={speed===0||Date.now()<greetReadyAt} onClick={greetNearby}>{Date.now()<greetReadyAt?'Sudah menyapa · tunggu':'E · Sapa '+staff[nearby].name}</button>}
            {nearby===6 && receptionAvailable && <button disabled={speed===0} onClick={()=>beginPlayerAction('attendance',ATTENDANCE_POINT,'sign',2,undefined,Math.PI)}>E · Absen {simulation.ownerCheckedIn?'pulang':'masuk'} dengan Amanda</button>}
            {avatarRoom===2 && meetingActive && <button disabled={speed===0} onClick={()=>beginPlayerAction('meeting',meetingSeat(6).position,'talk',0,undefined,meetingSeat(6).rotation)}>E · Ikut rapat</button>}
            {avatarRoom===3 && <>
              <button disabled={speed===0} onClick={()=>beginPlayerAction('work',ownerDeskSeat.position,'work',0,undefined,ownerDeskSeat.rotation)}>F · Bekerja di meja founder</button>
              <button disabled={speed===0} onClick={()=>beginPlayerAction('sofa',founderMeetingSeat(0).position,'think',0,undefined,founderMeetingSeat(0).rotation)}>F · Duduk di sofa</button>
              {atlasWaiting && <button disabled={speed===0} onClick={()=>beginPlayerAction('atlas',founderMeetingSeat(0).position,'talk',12,undefined,founderMeetingSeat(0).rotation)}>E · Diskusi dengan {staff[0].name}</button>}
            </>}
            {avatarRoom===5 && <><button disabled={speed===0} onClick={()=>beginPlayerAction('meal',lunchSeat(OWNER_LUNCH_SLOT).position,'eat',18,undefined,lunchSeat(OWNER_LUNCH_SLOT).rotation)}>E · Makan di pantry</button><button disabled={speed===0} onClick={()=>beginPlayerAction('drink',pantryDrinkPoint,'water',4)}>E · Ambil air minum</button></>}
            {(avatarRoom===9||avatarRoom===10) && <button disabled={speed===0} onClick={()=>beginPlayerAction('toilet',toiletPoint(avatarRoom),'toilet',5)}>E · Gunakan WC</button>}
            {clientNearby && <button disabled={speed===0} onClick={()=>beginPlayerAction('client',clientMeetingSeat(0).position,'talk',8,clientNearby.id,clientMeetingSeat(0).rotation)}>E · Bertemu {clientNearby.name}</button>}
            {nearby===7 && hrAvailable && <button disabled={speed===0} onClick={()=>beginPlayerAction('consult',hrdSeat(0).position,'talk',10,undefined,hrdSeat(0).rotation)}>E · Konsultasi dengan Felin</button>}
          </>}
          <div className="walk-pad" aria-label="Avatar movement">{[['w','↑'],['a','←'],['s','↓'],['d','→']].map(([key,label]) => <button key={key} aria-label={'Walk ' + key.toUpperCase()} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchKeys.current.add(key); }} onPointerUp={() => touchKeys.current.delete(key)} onPointerCancel={() => touchKeys.current.delete(key)} onLostPointerCapture={() => touchKeys.current.delete(key)}>{label}</button>)}</div>
        </div>}
        <div className="selected-room-tag"><span className="tag-pin">⌖</span><div><small>NOW EXPLORING</small><strong>{mode === 'avatar' ? avatarRoom === null ? onStairs(avatarPosition.current) ? 'Tangga antar lantai' : 'Koridor HQ' : rooms[avatarRoom].name : room.name}</strong></div><span className="tag-sparkle">✦</span></div>
        <div className="clock-card">
          <div className="clock-readout"><span className="sun-icon">{officeOpen(gameMinute) ? '☼' : '☾'}</span><div><strong>{formatTime(gameMinute)}</strong><small>{weekdayName(gameDay).toUpperCase()} · HARI {gameDay}</small></div></div>
          <div className="clock-divider" />
          <div className="speed-control" aria-label="Simulation speed">
            {[0, 1, 2, 3].map((value) => <button key={value} onClick={() => setSpeed(value)} className={speed === value ? 'active' : ''} aria-pressed={speed === value} aria-label={value === 0 ? 'Pause time' : `Set speed ${value}x`}>{value === 0 ? 'Ⅱ' : `${value}×`}</button>)}
          </div>
          <button className="agenda-toggle" onClick={() => { setSelectedNpc(null); setShowMoments(!showMoments); }}>Agenda hari ini ↗</button><div className="time-caption">24 MIN REAL = 1 GAME DAY</div>
        </div>
        <div className="camera-hint"><span>◉</span> {mode === 'director' ? 'DRAG TO ORBIT  ·  SCROLL TO ZOOM  ·  RIGHT-DRAG TO PAN' : 'WASD / ARROWS TO WALK  ·  E / F TO INTERACT'}</div>
        <div className="world-legend"><span className="legend-dot" /> COZY MINIATURE WORLD <i>·</i> BLUE / CREAM / WOOD</div>
        {toast && <div role="status" className="toast-message"><span>✓</span>{toast}</div>}
        {(savedAt || saveError) && <div role="status" className="saved-indicator">{saveError ? '⚠ Local save unavailable' : '● Autosave on · local browser'}</div>}
        {showStudio && <Suspense fallback={<div className="studio-loading" role="status">Menyiapkan studio visual…</div>}><VisualStudio quality={quality} reducedMotion={reducedMotion} onClose={() => setShowStudio(false)} /></Suspense>}
      </section>
    </main>
  );
}

function OfficeAgenda({simulation,onViewMeeting}:{simulation:Simulation;onViewMeeting:()=>void}) {
  const meeting=simulation.meeting;
  const phaseLabels={scheduled:'Dijadwalkan',gathering:'Peserta menuju kursi',discussing:'Berdiskusi',done:'Selesai'};
  return <div className="office-agenda">
    <div className="agenda-heading"><strong>{weekdayName(simulation.gameDay)} · Hari {simulation.gameDay}</strong><span>{officeOpen(simulation.gameMinute)?'Kantor buka':'Kantor tutup'}</span></div>
    <div className="agenda-timeline">{[['07:00','Lampu menyala · tim datang bertahap'],['08:00','Bekerja · minuman & kebersihan kantor'],['12:00','Istirahat di pantry, meja, library, atau lobby'],['13:00','Kembali bekerja'],['17:00','Tim pulang · lampu mulai mati']].map(([time,label])=><div key={time}><time>{time}</time><span>{label}</span></div>)}</div>
    <div className="daily-meeting"><strong>Rapat harian · {formatTime(meeting.start)}</strong><p>{phaseLabels[meeting.phase]} · {meeting.duration} menit diskusi</p><small>Enam anggota tim berkumpul; kursi ketujuh tersedia untuk avatar Founder.</small>{meeting.phase==='discussing'&&<progress max={meeting.duration} value={meeting.elapsed} aria-label="Daily meeting progress" />}<button onClick={onViewMeeting}>Lihat Meeting Room · Lantai 2 ↗</button></div>
    <small className="agenda-week">Senin–Minggu · Tim bekerja setiap hari</small>
  </div>;
}

function OfficeOperations({ simulation, onFocus }: { simulation: Simulation; onFocus: (roomId: number) => void }) {
  const issues = simulation.computerIssues.filter((issue) => issue.resolvedAt === null);
  const jobs = simulation.npcs.map((npc, index) => ({ npc, index })).filter(({ npc }) => npc.duty !== null);
  const visitors = simulation.clients.filter((client) => client.phase !== 'offsite');
  const attendance = [...simulation.reception.log].sort((a, b) => b.day - a.day || b.at - a.at).slice(0, 8);
  return <div className="office-operations">
    <div className="operations-heading"><strong>Aktivitas kantor</strong><span>{jobs.length} rutinitas aktif</span></div>
    {jobs.length ? jobs.map(({ npc, index }) => <article className="job-row" key={index}><div><strong>{staff[index].name}</strong><span>{dutyLabels[npc.duty!.kind]}</span><small>{npc.path.length ? 'Berjalan menuju tempat kegiatan' : 'Kegiatan sedang berlangsung'}</small></div><button onClick={() => onFocus(roomAt(npc.position) ?? npc.destination)} aria-label={'Lihat kegiatan ' + staff[index].name}>Lihat ↗</button></article>) : <p className="operations-empty">Tim sedang mengikuti jadwal kerja, rapat, atau istirahat.</p>}
    <div className="operations-heading"><strong>Layanan kantor</strong><span>{simulation.services.drinks.length} minuman tersaji</span></div>
    <article className="job-row"><div><strong>{staff[8].name} · Catering</strong><span>{simulation.services.catering.phase==='ready'?'Makan siang siap disajikan':simulation.services.catering.phase==='cooking'?'Memasak makanan kantor':'Menyiapkan layanan hari ini'}</span></div><button onClick={()=>onFocus(5)}>Pantry ↗</button></article>
    <article className="job-row"><div><strong>{staff[9].name} · Kebersihan</strong><span>{rooms[simulation.services.cleaningRoom]?.name??'Menyiapkan peralatan di Gudang'}</span></div><button onClick={()=>onFocus(roomAt(simulation.npcs[9].position)??12)}>Lihat ↗</button></article>
    <div className="operations-heading"><strong>Kondisi komputer</strong><span>{issues.length ? issues.length + ' perlu diperbaiki' : 'Semua siap'}</span></div>
    {issues.map((issue) => <article className="job-row issue-row" key={issue.owner}><div><strong>{issue.owner===-1?characterProfile(OWNER_PROFILE_INDEX).name:staff[issue.owner].name}</strong><span>Menunggu bantuan {staff[5].name}</span><small>Dilaporkan pukul {formatTime(issue.reportedAt)}</small></div><button onClick={() => onFocus(issue.owner===-1?3:staff[issue.owner].roomId)}>Lihat ↗</button></article>)}
    <div className="operations-heading"><strong>Tamu kantor</strong><span>{visitors.length} tamu</span></div>
    {visitors.map((client) => <article className="job-row" key={client.id}><div><strong>{client.name}</strong><span>{client.phase === 'arriving' ? 'Menuju resepsionis' : client.phase === 'leaving' ? 'Pulang melalui pintu utama' : client.phase === 'meeting' ? `Menunggu · ${client.target==='owner'?'Founder':client.target==='atlas'?staff[0].name:'Founder & '+staff[0].name}` : client.phase === 'served' ? 'Menuju Client Meeting Room' : 'Disambut Amanda'}</span></div><button onClick={() => onFocus(roomAt(client.position) ?? (client.phase==='waiting'?0:11))}>Lihat ↗</button></article>)}
    <div className="operations-heading"><strong>Catatan resepsionis</strong><span>Absensi & tamu</span></div>
    {attendance.length ? <div className="attendance-log">{attendance.map((entry, index) => <div key={`${entry.day}-${entry.name}-${entry.kind}-${index}`}><time>{formatTime(entry.at)}<small>Hari {entry.day}</small></time><strong>{entry.name}</strong><span>{entry.kind === 'in' ? 'Masuk' : entry.kind === 'out' ? 'Pulang' : 'Tamu'}</span></div>)}</div> : <p className="operations-empty">Amanda akan mencatat kedatangan tim dan tamu di resepsionis.</p>}
  </div>;
}

type WorldProps = { selectedRoom: number; floorView: FloorView; mode: 'director' | 'avatar'; simulation: Simulation; speed: number; reducedMotion: boolean; avatarGesture: RefObject<number>; avatarPosition: RefObject<Point>; touchKeys: RefObject<Set<string>>; playerAction:PlayerAction|null; onPlayerArrival:(id:number)=>void; onPlayerCancel:()=>void; onAvatarRoomChange: (id: number | null) => void; onAvatarFloorChange: (floor: 0 | 1) => void; onSelectRoom: (id: number) => void; onSelectNpc: (index: number) => void };
function OfficeWorld({ selectedRoom, floorView, mode, simulation, speed, reducedMotion, avatarGesture, avatarPosition, touchKeys, playerAction, onPlayerArrival, onPlayerCancel, onAvatarRoomChange, onAvatarFloorChange, onSelectRoom, onSelectNpc }: WorldProps) {
  const visibleRooms = rooms.filter((room) => floorView === 'all' || room.floor === floorView);
  const people:CrowdPerson[]=[...simulation.npcs.flatMap((npc,id)=>npc.presence==='offsite'?[]:[{id,position:npc.position,moving:!!npc.path.length}]),...simulation.clients.flatMap(client=>client.phase==='offsite'?[]:[{id:100+client.id,position:client.position,moving:!!client.path.length}])];
  return <group>
    <BuildingShell floorView={floorView} selectedRoom={selectedRoom} onSelectRoom={onSelectRoom} showLabels={mode==='director'} />
    {visibleRooms.map((room) => <OfficeFurnishings key={`f-${room.id}`} room={room} />)}
    {visibleRooms.map((room) => <RoomLife key={`life-${room.id}`} room={room} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatar={avatarPosition} avatarActive={mode === 'avatar'} />)}
    {staff.map((person, index) => <StaffActor key={index} index={index} person={person} npc={simulation.npcs[index]} visible={floorView === 'all' || floorOf(simulation.npcs[index].position) === floorView || onStairs(simulation.npcs[index].position)} simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarPosition={avatarPosition} avatarActive={mode === 'avatar'} onSelect={() => onSelectNpc(index)} />)}
    {simulation.clients.map((client, index) => <ClientActor key={client.id} client={client} index={index} simulation={simulation} visible={floorView === 'all' || floorOf(client.position) === floorView || onStairs(client.position)} speed={speed} reducedMotion={reducedMotion} />)}
    {simulation.computerIssues.filter((issue) => issue.resolvedAt === null).map((issue) => {
      const desk = issue.owner===-1?{x:ownerDeskPoint[0],z:ownerDeskPoint[1],y:FLOOR_HEIGHT,floor:1}:desks.find((item) => item.staffIndex === issue.owner);
      if (!desk || floorView !== 'all' && desk.floor !== floorView || !officeOpen(simulation.gameMinute)) return null;
      return <group key={issue.owner} position={[desk.x, desk.y + 1.59, desk.z]}><SceneLabel text="⚠ PC" kind="npc" /></group>;
    })}
    {visibleRooms.filter((room) => [9, 10].includes(room.id)).map((room) => simulation.npcs.some((npc) => npc.duty?.kind === 'toilet' && roomAt(npc.position) === room.id) && <group key={room.id} position={[room.center[0], 1.47, room.center[1] + room.depth / 2 + .14]}><SceneLabel text="TERISI" kind="npc" /></group>)}
    <PlayerAvatar active={mode === 'avatar'} floorView={floorView} position={avatarPosition} touchKeys={touchKeys} onRoomChange={onAvatarRoomChange} onFloorChange={onAvatarFloorChange} reducedMotion={reducedMotion} gesture={avatarGesture} playerAction={playerAction} onArrival={onPlayerArrival} onCancelAction={onPlayerCancel} people={people} />
    <OfficeServicesVisual simulation={simulation} floorView={floorView} />
    <OfficeEntrance simulation={simulation} speed={speed} reducedMotion={reducedMotion} avatarPosition={avatarPosition} avatarActive={mode === 'avatar'} />
    <OfficeLandscape />
  </group>;
}

function StaffActor({ person, npc, index, visible, simulation, speed, reducedMotion, avatarPosition, avatarActive, onSelect }: { person: Staff; npc: NpcState; index: number; visible: boolean; simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive: boolean; onSelect: () => void }) {
  const actor = useRef<THREE.Group>(null);
  const origin = useRef<[number, number, number]>([npc.position[0], elevation(npc.position) + FLOOR_SURFACE_HEIGHT, npc.position[1]]);
  const encounter = encounterFor(simulation, index);
  const dialogue = encounter?.phase === 'talking' ? dialogueFor(encounter) : routineDialogue(simulation, index) ?? (index !== 6 && npc.activity === 'meeting' ? meetingDialogue(simulation) : null);
  const seat = seatedAt(simulation,index);
  const partnerIndex = encounter?.participants.find((i) => i !== index);
  const greeting = npc.greetUntil > (simulation.gameDay - 1) * 1440 + simulation.gameMinute;
  const basePose = npcPose(simulation, index);
  const conversation = !npc.path.length && !greeting && (encounter?.phase === 'talking' || npc.activity === 'meeting' || npc.duty?.kind === 'private');
  const pose: Pose = conversation && dialogue ? dialogue.speaker === index ? 'talk' : 'think' : basePose === 'drink' ? 'water' : basePose as Pose;
  const initialFacing = useRef<[number, number, number]>([0, seat?.rotation ?? workSeat(index).rotation, 0]);
  const inPrivateWC = npc.duty?.kind === 'toilet' && npc.duty.phase === 'active' && [9, 10].includes(roomAt(npc.position) ?? -1);
  useFrame((_, delta) => {
    if (!actor.current || speed === 0) return;
    const dx = npc.position[0] - actor.current.position.x, dz = npc.position[1] - actor.current.position.z;
    actor.current.position.x = THREE.MathUtils.damp(actor.current.position.x, npc.position[0], 18, delta);
    actor.current.position.y = THREE.MathUtils.damp(actor.current.position.y, elevation(npc.position) + FLOOR_SURFACE_HEIGHT, 18, delta);
    actor.current.position.z = THREE.MathUtils.damp(actor.current.position.z, npc.position[1], 18, delta);
    let facing = actor.current.rotation.y;
    if (npc.path.length && Math.abs(dx) + Math.abs(dz) > 0.01) facing = Math.atan2(dx, dz);
    else if (seat) facing = seat.rotation;
    else if (greeting && avatarActive) facing = Math.atan2(avatarPosition.current[0] - npc.position[0], avatarPosition.current[1] - npc.position[1]);
    else if (['checking-in', 'checking-out'].includes(npc.presence)) facing = Math.atan2(RECEPTION_POST[0] - npc.position[0], RECEPTION_POST[1] - npc.position[1]);
    else if (npc.duty && ['inspect', 'repair'].includes(npc.duty.kind)) { const targetDesk = npc.duty.target===-1?{x:ownerDeskPoint[0],z:ownerDeskPoint[1]}:desks.find((desk) => desk.staffIndex === npc.duty!.target); if (targetDesk) facing = Math.atan2(targetDesk.x - npc.position[0], targetDesk.z - npc.position[1]); }
    else if (npc.duty && (['drink','cook'].includes(npc.duty.kind)||npc.duty.kind==='coffee'&&simulation.services.coffee?.phase==='prepare')) { const target = npc.duty.kind==='cook'?CATERING_COUNTER_POINT:[pantryDrinkPoint[0],pantryDrinkPoint[1]-.85]; facing = Math.atan2(target[0] - npc.position[0], target[1] - npc.position[1]); }
    else if (npc.duty?.kind==='coffee'&&simulation.services.coffee?.phase==='deliver') {const recipient=simulation.services.coffee.recipient,target=recipient.kind==='client'?simulation.clients.find(client=>client.id===recipient.id)?.position:recipient.kind==='owner'?avatarPosition.current:simulation.npcs[recipient.id]?.position;if(target)facing=Math.atan2(target[0]-npc.position[0],target[1]-npc.position[1]);}
    else if (partnerIndex !== undefined) { const p = simulation.npcs[partnerIndex].position; facing = Math.atan2(p[0] - npc.position[0], p[1] - npc.position[1]); }
    else facing = index === 6 ? 0 : workSeat(index).rotation;
    const angle = Math.atan2(Math.sin(facing - actor.current.rotation.y), Math.cos(facing - actor.current.rotation.y));
    actor.current.rotation.y += angle * (1 - Math.exp(-10 * delta));
  });
  return <group ref={actor} position={origin.current} rotation={initialFacing.current} visible={visible && npc.presence !== 'offsite' && !inPrivateWC} onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }}>
    <CharacterRig color={person.color} hair={person.hair} pose={pose} equipment={index===9&&npc.duty?.kind==='clean'?'broom':index===8&&simulation.services.coffee?.phase==='carry'?'tray':undefined} seated={!!seat} speed={speed} reducedMotion={reducedMotion} variant={index} />
    {(!avatarActive || pointDistance(npc.position, avatarPosition.current) < 5) && <group position={[0, seat ? 1.58 : 1.84, 0]} scale={avatarActive ? .55 : 1}><SceneLabel text={person.name} kind="npc" /></group>}
    {dialogue?.speaker === index && (!avatarActive || pointDistance(npc.position, avatarPosition.current) < 3.2) && <SpeechBubble name={person.name} text={dialogue.text} color={person.color} compact={avatarActive} />}
  </group>;
}

function ClientActor({ client, index, visible, simulation, speed, reducedMotion }: { client: Simulation['clients'][number]; index: number; visible: boolean; simulation: Simulation; speed: number; reducedMotion: boolean }) {
  const actor = useRef<THREE.Group>(null), origin = useRef<[number, number, number]>([client.position[0], elevation(client.position) + FLOOR_SURFACE_HEIGHT, client.position[1]]);
  const signing = simulation.reception.client && simulation.reception.person === index && simulation.reception.phase === 'service';
  const profile=characterProfile(client.variant),clientName=profile.name===defaultCharacterProfiles[client.variant]?.name?client.name:profile.name,seated=client.phase==='meeting'&&!client.path.length;
  const pose: Pose = client.path.length ? onStairs(client.position)?'stairs':'walk' : signing ? 'sign' : client.phase === 'served' ? 'wave' : seated?client.ownerJoined?'talk':'think':'idle';
  useFrame((_, delta) => {
    if (!actor.current || speed === 0) return;
    const dx = client.position[0] - actor.current.position.x, dz = client.position[1] - actor.current.position.z;
    actor.current.position.x = THREE.MathUtils.damp(actor.current.position.x, client.position[0], 18, delta);
    actor.current.position.y = THREE.MathUtils.damp(actor.current.position.y, elevation(client.position) + FLOOR_SURFACE_HEIGHT, 18, delta);
    actor.current.position.z = THREE.MathUtils.damp(actor.current.position.z, client.position[1], 18, delta);
    const counterpart=client.target==='atlas'?clientMeetingSeat(2).position:clientMeetingSeat(0).position;
    const facing = client.path.length && Math.abs(dx) + Math.abs(dz) > .01 ? Math.atan2(dx, dz) : seated?Math.atan2(counterpart[0]-client.position[0],counterpart[1]-client.position[1]):Math.atan2(RECEPTION_POST[0] - client.position[0], RECEPTION_POST[1] - client.position[1]);
    const angle = Math.atan2(Math.sin(facing - actor.current.rotation.y), Math.cos(facing - actor.current.rotation.y)); actor.current.rotation.y += angle * (1 - Math.exp(-10 * delta));
  });
  return <group ref={actor} position={origin.current} visible={visible && client.phase !== 'offsite'}>
    <CharacterRig color={profile.color} hair={profile.hair} variant={client.variant} pose={pose} seated={seated} speed={speed} reducedMotion={reducedMotion} />
    <group position={[0, seated ? 1.58 : 1.84, 0]}><SceneLabel text={`${clientName} · TAMU`} kind="npc" /></group>
    {client.phase === 'meeting' && <SpeechBubble name={clientName} text={client.ownerJoined?'Terima kasih sudah meluangkan waktu. Mari bahas kebutuhan proyeknya.':client.target==='both'?'Saya sudah menyiapkan agenda untuk Founder dan '+staff[0].name+'.':client.target==='atlas'?'Saya ingin meninjau kebutuhan operasional dengan '+staff[0].name+'.':'Saya menunggu Founder untuk membahas kerja sama.'} color={profile.color} compact={false} />}
  </group>;
}

function PlayerAvatar({ active, floorView, position, touchKeys, onRoomChange, onFloorChange, reducedMotion, gesture, playerAction, onArrival, onCancelAction, people }: { active: boolean; floorView: FloorView; position: RefObject<Point>; touchKeys: RefObject<Set<string>>; onRoomChange: (id: number | null) => void; onFloorChange: (floor: 0 | 1) => void; reducedMotion: boolean; gesture: RefObject<number>; playerAction:PlayerAction|null; onArrival:(id:number)=>void; onCancelAction:()=>void;people:CrowdPerson[] }) {
  const avatar = useRef<THREE.Group>(null);
  const currentRoom = useRef(roomAt(position.current));
  const currentFloor = useRef(floorOf(position.current));
  const pose = useRef<Pose>('idle');
  const actionPath = useRef<Point[]>([]), actionId = useRef(0), arrivalSent = useRef(false);
  const keys = useRef(new Set<string>());
  const { camera, scene, gl } = useThree();
  const cameraBlockers = useRef<THREE.Object3D[]>([]);
  const cameraRay = useMemo(() => new THREE.Raycaster(), []);
  const movement = useMemo(() => new THREE.Vector3(), []);
  const cameraHeight = useRef<number>(FOLLOW_OFFSET[1]), cameraReach = useRef(1);
  const targetReady = useRef(false);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const cameraGoal = useMemo(() => new THREE.Vector3(), []);
  const boom = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []), rayDirection = useMemo(() => new THREE.Vector3(), []);
  useEffect(()=>{
    if(!playerAction){actionId.current=0;actionPath.current=[];arrivalSent.current=false;return;}
    if(actionId.current===playerAction.id)return;
    actionId.current=playerAction.id;arrivalSent.current=false;
    const goal=playerAction.goal;
    actionPath.current=findPath(position.current,goal);
    if(!actionPath.current.length&&pointDistance(position.current,goal)>.18)onCancelAction();
  },[playerAction?.id,active]);
  useEffect(() => {
    const blockers: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.some((material) => material.transparent || !material.depthWrite)) return;
      let ancestor: THREE.Object3D | null = object;
      let marked = false, visible = true;
      while (ancestor) { marked ||= ancestor.userData.cameraStructure === true; visible &&= ancestor.visible; ancestor = ancestor.parent; }
      if (marked && visible) blockers.push(object);
    });
    cameraBlockers.current = blockers;
  }, [scene, floorView, active]);
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
    const [inputX,inputZ]=avatarDirection(horizontal,vertical);
    movement.set(inputX,0,inputZ);
    let walking = false, targetAngle:number|null=null;
    const manual=movement.lengthSq()>0;
    if(playerAction&&manual)onCancelAction();
    if(playerAction?.phase==='travel'&&!manual){
      const previous=position.current,moved=moveInCrowd(previous,actionPath.current,Math.min(delta,.05)*1.22,people,999999);
      position.current=moved.position;actionPath.current=moved.path;walking=pointDistance(previous,position.current)>.0001;
      if(walking){const next=actionPath.current[0]??playerAction.goal;targetAngle=Math.atan2(next[0]-position.current[0],next[1]-position.current[1]);}
      if(!actionPath.current.length&&pointDistance(position.current,playerAction.goal)<.2&&!arrivalSent.current){position.current=[...playerAction.goal];arrivalSent.current=true;onArrival(playerAction.id);}
    }
    if(!playerAction||manual){
      if(movement.lengthSq()){
        movement.normalize().multiplyScalar(Math.min(delta,.05)*1.45);const previous=position.current,candidate=moveAvatar(previous,movement.x,movement.z);if(crowdClear(candidate,previous,people.map(person=>person.position)))position.current=candidate;walking=pointDistance(previous,position.current)>.0001;
        if(walking)targetAngle=Math.atan2(movement.x,movement.z);
      }
    }
    if(targetAngle!==null){const angle=targetAngle-avatar.current.rotation.y;avatar.current.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-11*delta));}
    gesture.current = Math.max(0, gesture.current - delta);
    pose.current = playerAction?.phase==='active'&&!manual?playerAction.pose:walking ? onStairs(position.current) ? 'stairs' : 'walk' : gesture.current > 0 ? 'wave' : 'idle';
    if(playerAction?.phase==='active'&&!manual){const angle=playerAction.rotation-avatar.current.rotation.y;avatar.current.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-8*delta));}
    const y = elevation(position.current) + FLOOR_SURFACE_HEIGHT;
    avatar.current.position.set(position.current[0], y, position.current[1]);
    avatar.current.visible = active && (floorView === 'all' || floorOf(position.current) === floorView || onStairs(position.current)) && !(playerAction?.phase==='active'&&playerAction.kind==='toilet');
    const nextRoom = roomAt(position.current);
    if (nextRoom !== currentRoom.current) { currentRoom.current = nextRoom; onRoomChange(nextRoom); }
    const nextFloor = floorOf(position.current); if (nextFloor !== currentFloor.current) { currentFloor.current = nextFloor; onFloorChange(nextFloor); }
    if(!targetReady.current){cameraTarget.set(position.current[0],y+1.05,position.current[1]);targetReady.current=true;}
    cameraTarget.lerp(desiredTarget.set(position.current[0],y+1.05,position.current[1]),followWeight(delta,9));
    // Clearance keeps one viewing direction and eases both height and reach.
    let desiredHeight:number=FOLLOW_OFFSET[1], desiredReach=1, foundView=false;
    for(const height of [FOLLOW_OFFSET[1],4.6,5.6]){
      boom.set(FOLLOW_OFFSET[0],height,FOLLOW_OFFSET[2]);
      cameraRay.far=boom.length();cameraRay.set(cameraTarget,rayDirection.copy(boom).normalize());
      const hit=cameraRay.intersectObjects(cameraBlockers.current,false)[0];
      if(!hit||hit.distance>3.2){desiredHeight=height;desiredReach=hit?Math.max(.4,(hit.distance-.3)/boom.length()):1;foundView=true;break;}
    }
    if(!foundView){desiredHeight=5.6;desiredReach=.25;}
    cameraHeight.current=THREE.MathUtils.damp(cameraHeight.current,desiredHeight,5,Math.min(delta,.1));
    cameraReach.current=THREE.MathUtils.damp(cameraReach.current,desiredReach,5,Math.min(delta,.1));
    cameraGoal.copy(cameraTarget).add(boom.set(FOLLOW_OFFSET[0]*cameraReach.current,cameraHeight.current,FOLLOW_OFFSET[2]*cameraReach.current));
    camera.position.lerp(cameraGoal,followWeight(delta,6));
    camera.lookAt(cameraTarget);
    if(import.meta.env.DEV){gl.domElement.dataset.avatarPosition=JSON.stringify(position.current);gl.domElement.dataset.cameraPosition=JSON.stringify(camera.position.toArray());gl.domElement.dataset.avatarAction=playerAction?playerAction.kind+':'+playerAction.phase:'none';}
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - 46) > .01) { perspective.fov = THREE.MathUtils.damp(perspective.fov, 46, 6, delta); perspective.near = .08; perspective.updateProjectionMatrix(); }
  });
  const seated=!!playerAction&&playerAction.phase==='active'&&['work','meeting','meal','client','sofa','atlas','consult'].includes(playerAction.kind);
  return <group ref={avatar} position={[position.current[0], elevation(position.current) + FLOOR_SURFACE_HEIGHT, position.current[1]]} visible={active}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .025, 0]}><ringGeometry args={[0.32, 0.4, 32]} /><meshBasicMaterial color="#628ea0" /></mesh>
    <CharacterRig color={PALETTE.corporate} hair="#394c5b" variant={OWNER_PROFILE_INDEX} pose={pose} seated={seated} speed={active ? 1 : 0} reducedMotion={reducedMotion} expression={gesture.current > 0||playerAction?.phase==='active'&&['talk','wave'].includes(playerAction.pose) ? 'happy' : 'neutral'} />
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
      context.fillStyle = kind === 'player' ? PALETTE.midnight : selected ? PALETTE.sand : PALETTE.cream;
      context.fill();
      context.lineWidth = 1.25;
      context.strokeStyle = selected ? '#c8ac70' : '#e8e2d5';
      context.stroke();
      context.fillStyle = kind === 'player' ? '#ffffff' : PALETTE.midnight;
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

function OfficeRenderMetrics() {
  const {gl}=useThree();
  const samples=useRef({seconds:0,frames:0});
  useFrame((_,delta)=>{const s=samples.current;s.seconds+=delta;s.frames++;if(s.seconds>=1){gl.domElement.dataset.officeMetrics=JSON.stringify({fps:Math.round(s.frames/s.seconds),calls:gl.info.render.calls,triangles:gl.info.render.triangles});s.seconds=0;s.frames=0;}});
  return null;
}

function CameraRig({ room, floorView, mode }: { room: Room; floorView: FloorView; mode: 'director' | 'avatar' }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const animating = useRef(true);
  const previousRoom = useRef(room.id);
  const previousMode = useRef(mode);
  const previousFloor = useRef(floorView);
  const { camera } = useThree();
  const target = useMemo(() => floorView === 'all' ? new THREE.Vector3(.75, 1.2, 0) : new THREE.Vector3(room.center[0], room.floor * FLOOR_HEIGHT + .4, room.center[1]), [room, floorView]);
  const goal = useMemo(() => {const span=Math.max(room.width,room.depth);return floorView === 'all' ? new THREE.Vector3(25,27,34) : new THREE.Vector3(room.center[0]+span*.8+1,room.floor*FLOOR_HEIGHT+span*1.4+3,room.center[1]+span*.95+2);}, [room, floorView]);
  useEffect(() => {
    const roomChanged = previousRoom.current !== room.id;
    const returningToDirector = previousMode.current !== mode && mode === 'director';
    const floorChanged = previousFloor.current !== floorView; previousFloor.current = floorView;
    previousRoom.current = room.id;
    previousMode.current = mode;
    if (roomChanged || floorChanged || returningToDirector) animating.current = true;
  }, [room.id, floorView, mode]);
  useFrame((_, delta) => {
    if (mode !== 'director' || !animating.current) return;
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - 34) > .01) { perspective.fov = THREE.MathUtils.damp(perspective.fov, 34, 6, delta); perspective.updateProjectionMatrix(); }
    const weight = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(goal, weight);
    if (controls.current) {
      controls.current.target.lerp(target, weight);
      controls.current.update();
    }
    if (camera.position.distanceTo(goal) < 0.05 && controls.current && controls.current.target.distanceTo(target) < 0.05) animating.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enabled={mode === 'director'} onStart={() => { animating.current = false; }} enableDamping dampingFactor={0.08} minDistance={5} maxDistance={64} maxPolarAngle={Math.PI / 2.02} minPolarAngle={0.4} screenSpacePanning panSpeed={0.85} rotateSpeed={0.65} />;
}

export default App;
