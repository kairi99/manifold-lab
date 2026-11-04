import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Note, Seg } from '../../panels/SpacetimeUi';
import { Tex, fmt } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { PAL } from '../../theme/palette';
import { advance, curvatures, extinct, extinctionTime, fromFreehand, isConvex, isoperimetric, length, maxAbsCurvature, PRESET_IDS, signedArea, type Poly } from './math';
import { useCsf } from './state';

const PRESET_NAMES: Record<string, [string, string]> = {
  circle: ['Circle', 'Círculo'], ellipse: ['Ellipse 2:1', 'Elipse 2:1'], flower: ['Flower', 'Flor'], horseshoe: ['Horseshoe', 'Herradura'], free: ['Freehand', 'A mano'],
};
const MAXV = 1024;
const COLD = new THREE.Color(PAL.path), HOT = new THREE.Color(PAL.warn), CONCAVE = new THREE.Color(PAL.metric), tmp = new THREE.Color();

/** A closed (or open) polyline whose buffers are rewritten each frame from `get()`; null hides it. */
function Dyn({ get, color, closed = true, opacity = 1, vertexColors = false }: { get: () => { p: Poly | number[]; col?: Float32Array } | null; color?: string; closed?: boolean; opacity?: number; vertexColors?: boolean }) {
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * (MAXV + 1)), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(3 * (MAXV + 1)), 3));
    const m = new THREE.LineBasicMaterial({ color: vertexColors ? '#ffffff' : color, vertexColors, transparent: opacity < 1, opacity });
    const l = new THREE.Line(g, m); l.frustumCulled = false; return l;
  }, [color, opacity, vertexColors]);
  useFrame(() => {
    const d = get(), g = obj.geometry;
    if (!d) { g.setDrawRange(0, 0); return; }
    const m = Math.min(MAXV, d.p.length / 2), pos = g.attributes.position as THREE.BufferAttribute, col = g.attributes.color as THREE.BufferAttribute;
    const m1 = closed ? m + 1 : m;
    for (let i = 0; i < m1; i++) {
      const j = i % m;
      pos.setXYZ(i, d.p[2 * j], d.p[2 * j + 1], 0);
      if (d.col) col.setXYZ(i, d.col[3 * j], d.col[3 * j + 1], d.col[3 * j + 2]);
    }
    pos.needsUpdate = true; col.needsUpdate = true; g.setDrawRange(0, m1);
  });
  return <primitive object={obj} />;
}

export function Scene() {
  const { camera, controls, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const z = Math.max(3.6, 3.6 / aspect) / (2 * Math.tan(Math.PI / 8));
  useEffect(() => {
    const c = controls as unknown as { enableRotate: boolean; target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    camera.position.set(0, 0, z); camera.lookAt(0, 0, 0);
    if (c) { c.enableRotate = false; c.target.set(0, 0, 0); c.update(); }
    return () => { camera.position.set(3, 2.5, 3); if (c) { c.enableRotate = true; c.target.set(0, 0, 0); c.update(); } };
  }, [camera, controls, z]);

  const draft = useRef<[number, number][] | null>(null);
  const colBuf = useRef(new Float32Array(3 * MAXV));
  const acc = useRef(0);
  useFrame((_, dt) => {
    const s = useCsf.getState(), f = s.flow;
    if (s.playing && !extinct(f)) advance(f, Math.min(dt, 0.1) * s.speed * f.T0 / 8);
    if (s.playing && extinct(f)) s.set({ playing: false });
    acc.current += dt;
    if (acc.current > 0.1) { acc.current = 0; s.set({ rev: s.rev + 1 }); }
  });
  const curveCol = () => {
    const f = useCsf.getState().flow, k = curvatures(f.p), kc = 1 / Math.sqrt(Math.max(signedArea(f.p), 1e-9) / Math.PI), b = colBuf.current;
    for (let i = 0; i < k.length; i++) {
      const x = k[i] / kc;
      tmp.copy(x < 0 ? CONCAVE : COLD).lerp(x < 0 ? COLD : HOT, x < 0 ? 1 - Math.min(1, -x / 3) : Math.min(1, Math.max(0, (x - 1) / 3)));
      b[3 * i] = tmp.r; b[3 * i + 1] = tmp.g; b[3 * i + 2] = tmp.b;
    }
    return { p: f.p, col: b };
  };
  const finish = () => {
    const pts = draft.current; draft.current = null;
    if (!pts) return;
    const p = fromFreehand(pts), s = useCsf.getState();
    if (p) s.load('free', p); else s.set({ warn: true });
  };
  return (
    <group>
      <Dyn get={() => { const f = useCsf.getState().flow; return { p: f.initial }; }} color={PAL.ghost} opacity={0.35} />
      {[0, 1, 2, 3].map((i) => <Dyn key={i} get={() => { const q = useCsf.getState().flow.snaps[i]; return q ? { p: q } : null; }} color={PAL.path} opacity={0.18} />)}
      <Dyn get={curveCol} vertexColors />
      <Dyn get={() => (draft.current ? { p: draft.current.flat() } : null)} color={PAL.p} closed={false} />
      {useCsf((s) => s.draw) && (
        <mesh onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); draft.current = [[e.point.x, e.point.y]]; useCsf.getState().set({ warn: false }); }}
          onPointerMove={(e) => { if (draft.current) draft.current.push([e.point.x, e.point.y]); }}
          onPointerUp={finish}>
          <planeGeometry args={[20, 20]} /><meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}

export function Panel() {
  const t = useTr();
  const s = useCsf();
  const f = s.flow;
  useEffect(() => () => { useCsf.getState().set({ playing: false, draw: false }); }, []);
  const A = signedArea(f.p), L = length(f.p), done = extinct(f);
  const items = [...PRESET_IDS, 'free' as const].map((id) => [id, t(...PRESET_NAMES[id])] as const);
  return (
    <div>
      <h2>{t('Curve-shortening flow', 'Flujo de acortamiento de curvas')}</h2>
      <Seg label={t('Initial curve', 'Curva inicial')} value={s.preset} cols={3} items={items} onPick={(id) => (id === 'free' ? s.set({ draw: true, playing: false }) : s.load(id))} />
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button aria-pressed={s.draw} onClick={() => s.set({ draw: !s.draw, playing: false })}>{t('Draw', 'Dibujar')}{s.draw ? ' ✓' : ''}</button>
        <button onClick={() => s.set({ playing: !s.playing && !done, draw: false })} disabled={done}>{s.playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => (s.preset === 'free' ? s.load('free', f.initial.slice()) : s.load(s.preset))}>{t('Reset', 'Reiniciar')}</button>
      </div>
      {s.draw && <Note>{t('Drag on the canvas to draw a closed curve that does not cross itself.', 'Arrastra sobre el lienzo para dibujar una curva cerrada que no se cruce.')}</Note>}
      {s.warn && <p role="alert" style={{ color: PAL.warn, fontSize: 13 }}>{t('That curve crosses itself, so I kept the previous one. Try again without crossing.', 'Esa curva se cruza consigo misma, así que conservé la anterior. Prueba otra vez sin cruzarla.')}</p>}
      <label className="field"><span>{t('speed', 'velocidad')} = {fmt(s.speed, 1)}×</span>
        <input type="range" min={0.2} max={4} step={0.1} value={s.speed} aria-label={t('Playback speed', 'Velocidad de reproducción')} onChange={(e) => s.set({ speed: +e.target.value })} /></label>
      <Tex block>{String.raw`\partial_t\gamma=\kappa N`}</Tex>
      <Tex block>{String.raw`\frac{dA}{dt}=-2\pi,\qquad \frac{dL}{dt}=-\oint\kappa^2\,ds`}</Tex>
      <div className="readout" aria-label={t('Flow readouts', 'Lecturas del flujo')}>
        <span>t</span><span>{fmt(f.t, 4)}</span>
        <span>A</span><span>{fmt(A, 4)}</span>
        <span>L</span><span>{fmt(L, 4)}</span>
        <span>4πA/L²</span><span>{fmt(isoperimetric(f.p), 4)}</span>
        <span>max |κ|</span><span>{fmt(maxAbsCurvature(f.p), 2)}</span>
        <span>{t('convex', 'convexa')}</span><span>{isConvex(f.p) ? t('yes', 'sí') : t('no', 'no')}</span>
        <span>dA/dt</span><span>{fmt(f.rate, 4)} ({t('vs', 'vs')} −2π = {fmt(-2 * Math.PI, 4)}; {t('residual', 'residuo')} {fmt(f.rate + 2 * Math.PI, 4)})</span>
        <span>A₀/2π</span><span>{fmt(f.T0, 4)} ({t('predicted extinction', 'extinción prevista')})</span>
        {done && <><span>{t('extinct at', 'extinta en')}</span><span>t = {fmt(extinctionTime(f), 4)} ({t('A₀/2π =', 'A₀/2π =')} {fmt(f.T0, 4)})</span></>}
      </div>
      <Note><T en="Curve-shortening flow is the one-dimensional cousin of Ricci flow: Hamilton's and Perelman's analysis of how Ricci flow smooths and rounds a space, which led to the Poincaré conjecture, has the same flavour as Gage–Hamilton and Grayson's theorem that every embedded plane curve becomes convex, then round, then vanishes."
        es="El flujo de acortamiento de curvas es el primo unidimensional del flujo de Ricci: el análisis de Hamilton y Perelman de cómo el flujo de Ricci suaviza y redondea un espacio, que condujo a la conjetura de Poincaré, tiene el mismo aire que el teorema de Gage–Hamilton y Grayson: toda curva plana embebida se vuelve convexa, luego redonda, y desaparece." /></Note>
      <Note><T en="This flow is a model, not the Ricci flow itself. Here the numbers come from a discrete polygon, so the dA/dt check is approximate and the run stops at 1% of the initial area."
        es="Este flujo es un modelo, no el flujo de Ricci en sí. Aquí los números salen de un polígono discreto, así que la comprobación de dA/dt es aproximada y la simulación se detiene al 1% del área inicial." /></Note>
    </div>
  );
}
