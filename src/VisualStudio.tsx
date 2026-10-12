import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterRig } from './CharacterRig';
import type { CharacterExpression, Pose } from './CharacterRig';
import { characterProfiles } from './characterProfiles';
import { OfficeChair, OfficePlant, ComputerDesk } from './OfficeArchitecture';
import { BRAND, CHARACTER_STANDARD, GRAPHICS, PALETTE } from './artDirection';
import type { GraphicsQuality } from './artDirection';

type CameraView = 'director' | 'portrait' | 'detail';
type Metrics = { fps: number; calls: number; triangles: number };
const POSES: { pose: Pose; label: string }[] = [
  { pose: 'idle', label: 'Berdiri' }, { pose: 'walk', label: 'Berjalan' },
  { pose: 'wave', label: 'Menyapa' }, { pose: 'talk', label: 'Berdiskusi' },
  { pose: 'work', label: 'Bekerja' }, { pose: 'coffee', label: 'Minum' },
  { pose: 'read', label: 'Membaca' }, { pose: 'eat', label: 'Makan' },
  { pose: 'stairs', label: 'Tangga' }, { pose: 'repair', label: 'Perbaikan' },
  { pose: 'sign', label: 'Absensi' }, { pose: 'cook', label: 'Memasak' },
];
const COLORS = [PALETTE.midnight, PALETTE.corporate, PALETTE.sky, PALETTE.cloud, PALETTE.sand, PALETTE.lavender, PALETTE.teal];

export default function VisualStudio({ quality, reducedMotion, onClose }: {
  quality: GraphicsQuality; reducedMotion: boolean; onClose: () => void;
}) {
  const [selected, setSelected] = useState(1);
  const [pose, setPose] = useState<Pose>('idle');
  const [expression, setExpression] = useState<CharacterExpression>('neutral');
  const [seated, setSeated] = useState(false);
  const [lineup, setLineup] = useState(false);
  const [camera, setCamera] = useState<CameraView>('portrait');
  const [playing, setPlaying] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const profile = characterProfiles[selected];
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const modal = dialog.current;
    modal?.querySelector<HTMLButtonElement>('button')?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab' || !modal) return;
      const controls = Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]), select, input:not([disabled]), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handle);
    return () => { window.removeEventListener('keydown', handle); before?.focus(); };
  }, []);
  const choosePose = (next: Pose) => {
    setPose(next);
    setSeated(['work', 'read', 'eat', 'coffee', 'talk'].includes(next));
  };
  return <div className="visual-studio" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="studio-title">
    <header className="studio-heading">
      <div><span className="eyebrow">{BRAND.shortName} · Phase 01</span><h2 id="studio-title">Studio visual</h2><p>Kenali wajah, gerakan, dan cerita kecil tim kita.</p></div>
      <button onClick={onClose} aria-label="Close visual studio">×</button>
    </header>
    <div className="studio-layout">
      <aside className="studio-controls">
        <div className="eyebrow">PEOPLE OF BLUE AND SPACE</div>
        <div className="studio-character-list" role="group" aria-label="Preview character">
          {characterProfiles.slice(0, 8).map((person, i) => <button key={person.name} aria-pressed={selected === i} onClick={() => { setSelected(i); setLineup(false); }}><span style={{ background: person.color }} aria-hidden="true" />{person.name}</button>)}
        </div>
        <div className="studio-note"><strong>{profile.name} · {profile.role}</strong><p>{profile.silhouette}</p><small>{profile.personality}</small></div>
        <div className="eyebrow">GERAKAN</div>
        <div className="studio-pose-list" role="group" aria-label="Animation pose">{POSES.map(item => <button key={item.pose} aria-pressed={pose === item.pose} onClick={() => choosePose(item.pose)}>{item.label}</button>)}</div>
        <div className="eyebrow">EKSPRESI</div>
        <div className="studio-expression-list" role="group" aria-label="Facial expression">{([['neutral','Tenang'],['happy','Senang'],['focused','Fokus']] as const).map(([value,label]) => <button key={value} aria-pressed={expression === value} onClick={() => setExpression(value)}>{label}</button>)}</div>
        <label className="studio-toggle"><input type="checkbox" checked={seated && !lineup} disabled={lineup || ['walk','stairs'].includes(pose)} onChange={event => setSeated(event.target.checked)} /> Duduk di kursi kantor</label>
        <label className="studio-toggle"><input type="checkbox" checked={lineup} onChange={event => { setLineup(event.target.checked); setCamera('director'); }} /> Bandingkan delapan siluet</label>
        <label className="studio-toggle"><input type="checkbox" checked={playing} onChange={event => setPlaying(event.target.checked)} /> Putar animasi</label>
        <div className="studio-swatch" aria-label="Official color palette">{COLORS.map(color => <span key={color} style={{ backgroundColor: color }} title={color} />)}</div>
      </aside>
      <section className="studio-stage" aria-label="Live 3D character preview">
        <Canvas shadows="soft" dpr={[1, GRAPHICS[quality].dpr]} camera={{ position: [1.8, 1.7, 3.9], fov: 34, near: .05 }} gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}>
          <color attach="background" args={[PALETTE.cloud]} />
          <hemisphereLight args={[PALETTE.cream, '#92A4BB', 1.8]} />
          <ambientLight intensity={.25} color={PALETTE.cloud} />
          <directionalLight castShadow position={[-3, 6, 5]} intensity={2.3} color="#FFF1D9" shadow-mapSize-width={GRAPHICS[quality].shadowMap} shadow-mapSize-height={GRAPHICS[quality].shadowMap} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={.015} shadow-bias={-.0001} />
          <directionalLight position={[4, 3, -2]} intensity={.5} color={PALETTE.sky} />
          <StudioStage />
          {lineup ? characterProfiles.slice(0,8).map((person,i) => <group key={person.name} position={[(i - 3.5) * .96, 0, 0]}><CharacterRig key={`${pose}-${expression}`} color={person.color} hair={person.hair} variant={i} pose={pose} expression={expression} speed={playing ? 1 : 0} reducedMotion={reducedMotion} /></group>) : <>
            {seated && !['walk','stairs'].includes(pose) && <OfficeChair position={[0,0,0]} rotation={0} color={PALETTE.corporate} />}
            {seated && pose === 'work' && <ComputerDesk position={[0,.7,0]} rotation={Math.PI} variant={selected} />}
            <CharacterRig key={`${selected}-${pose}-${seated}-${expression}`} color={profile.color} hair={profile.hair} variant={selected} pose={pose} expression={expression} seated={seated && !['walk','stairs'].includes(pose)} speed={playing ? 1 : 0} reducedMotion={reducedMotion} />
          </>}
          <StudioCamera view={camera} lineup={lineup} />
          <FrameMetrics onUpdate={setMetrics} />
        </Canvas>
        <div className="studio-camera-list" role="group" aria-label="Preview camera">{([['director','Miniature'],['portrait','Third person'],['detail','Face detail']] as const).map(([view,label]) => <button key={view} aria-pressed={camera === view} disabled={lineup && view === 'detail'} onClick={() => setCamera(view)}>{label}</button>)}</div>
        <div className="studio-stage-caption">{lineup ? 'Satu keluarga visual · delapan kepribadian' : profile.name}<small>Drag untuk orbit · scroll untuk zoom</small></div>
      </section>
    </div>
    <footer className="studio-footer"><span>{CHARACTER_STANDARD.headsTall} heads · soft silhouettes · warm materials</span><span>{metrics ? `${metrics.fps} FPS · ${metrics.calls} draws · ${(metrics.triangles/1000).toFixed(0)}k triangles` : 'Menyiapkan preview…'} · {quality}</span><small>Waktu kantor berhenti selama studio dibuka.</small></footer>
  </div>;
}

function StudioStage() {
  return <>
    <mesh position={[0,-.12,0]} receiveShadow><cylinderGeometry args={[5.2,5.3,.24,64]} /><meshStandardMaterial color={PALETTE.cream} roughness={.96} /></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.002,0]} receiveShadow><circleGeometry args={[2.3,64]} /><meshStandardMaterial color="#D4E4EE" roughness={1} /></mesh>
    <OfficePlant position={[-2.7,0,-.65]} />
    <OfficePlant position={[2.65,0,-.9]} small />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.25,0]} receiveShadow><planeGeometry args={[200,200]} /><meshStandardMaterial color={PALETTE.cloud} roughness={1} /></mesh>
  </>;
}

function StudioCamera({ view, lineup }: { view: CameraView; lineup: boolean }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const moving = useRef(true);
  const { camera } = useThree();
  const [position,target] = useMemo(() => {
    if (lineup) return [new THREE.Vector3(view === 'portrait' ? 0 : 5.3, view === 'portrait' ? 2.1 : 5.1, 11),new THREE.Vector3(0,.75,0)];
    if (view === 'detail') return [new THREE.Vector3(.32,1.55,1.65),new THREE.Vector3(0,1.36,0)];
    if (view === 'director') return [new THREE.Vector3(3.8,4.2,5.8),new THREE.Vector3(0,.65,0)];
    return [new THREE.Vector3(1.8,1.7,3.9),new THREE.Vector3(0,.85,0)];
  },[view,lineup]);
  useEffect(() => { moving.current = true; },[position,target]);
  useFrame((_,delta) => {
    if (!moving.current || !controls.current) return;
    const factor = 1 - Math.exp(-5 * Math.min(delta,.1));
    camera.position.lerp(position,factor); controls.current.target.lerp(target,factor); controls.current.update();
    if (camera.position.distanceTo(position) < .008 && controls.current.target.distanceTo(target) < .008) moving.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} onStart={() => { moving.current = false; }} minDistance={.65} maxDistance={18} minPolarAngle={.25} maxPolarAngle={Math.PI/2.02} />;
}

function FrameMetrics({ onUpdate }: { onUpdate: (metrics: Metrics) => void }) {
  const elapsed = useRef(0), frames = useRef(0);
  useFrame(({gl},delta) => {
    elapsed.current += delta; frames.current += 1;
    if (elapsed.current < 1.2) return;
    onUpdate({ fps: Math.round(frames.current/elapsed.current), calls: gl.info.render.calls, triangles: gl.info.render.triangles });
    elapsed.current = 0; frames.current = 0;
  });
  return null;
}
