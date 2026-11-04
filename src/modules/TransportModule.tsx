import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { SurfacePicker } from '../panels/SurfacePicker';
import { TransportControls } from '../panels/TransportControls';
import { Tex, fmt, fmtDeg, coordText } from '../panels/Tex';
import SurfaceMesh from '../scene/SurfaceMesh';
import TransportPath, {
  STEPS, availableKinds, frame, loopSlider, useDraw, useTransportData,
} from '../scene/TransportPath';
import { holonomyAngle, normSq } from '../math/transport';
import type { Vec2 } from '../math/types';
import { useStore, type PathKind } from '../state/store';

const SECONDS = 6;
const DEG = 180 / Math.PI;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const VLEN = 0.5;

export function TransportScene() {
  const { surface } = useTransportData();
  const drawing = useDraw((d) => d.drawing);
  useFrame((_, dt) => {
    const st = useStore.getState();
    if (!st.playing) return;
    const p = st.progress + Math.min(dt, 0.1) / SECONDS;
    st.set(p >= 1 ? { progress: 1, playing: false } : { progress: p });
  });
  const onDown = drawing
    ? (uv: Vec2, e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        // shortcut: points kept as clicked, no unwrapping across periodic seams; draw loops away from the seam
        const st = useStore.getState();
        st.set({ freePoints: [...st.freePoints, uv], progress: 0, playing: false });
      }
    : undefined;
  return (
    <group>
      <SurfaceMesh surface={surface} onPointerDown={onDown} />
      <TransportPath />
    </group>
  );
}

const KIND_LABEL: Record<PathKind, string> = { latitude: 'Coordinate loop', triangle: 'Geodesic triangle', free: 'Free draw' };

export function TransportPanel() {
  const { surface, kind, curve, start, V0, samples } = useTransportData();
  const { surfaceId, latitude, progress, freePoints, set } = useStore();
  const { drawing, setDrawing } = useDraw();
  const sl = loopSlider(surfaceId);
  const isSphere = surfaceId === 'sphere';

  let angle = 0;
  if (start) angle = holonomyAngle(surface, start, frame(surface, start)[0], V0);
  const setAngle = (a: number) => {
    if (!start) return;
    const [e1, e2] = frame(surface, start);
    set({ vector: [VLEN * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]), VLEN * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1])], progress: 0, playing: false });
  };

  // live readouts
  const idx = Math.round(progress * STEPS);
  const cur = samples?.[idx];
  let dudt: Vec2 = [0, 0], dV: Vec2 = [0, 0];
  if (cur && curve) {
    dudt = curve.velocity(cur.t);
    const G = surface.christoffel(cur.uv[0], cur.uv[1]);
    for (let k = 0; k < 2; k++) {
      let s = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += G[k][i][j] * cur.V[i] * dudt[j];
      dV[k] = -s;
    }
  }

  const measured = samples && start ? holonomyAngle(surface, start, V0, samples[STEPS].V) : null;
  let predicted: number | null = null;
  if (isSphere && kind === 'latitude') predicted = wrap(2 * Math.PI * (1 - Math.cos(latitude)));
  if (isSphere && kind === 'triangle') predicted = wrap((Math.PI / 2) * Math.cos(0.05));
  const [cu, cv] = surface.coords;

  return (
    <div>
      <SurfacePicker />
      <h2>Path</h2>
      <div className="field">
        {availableKinds(surfaceId).map((k) => (
          <label key={k}>
            <input type="radio" name="pk" checked={kind === k} onChange={() => { set({ pathKind: k, progress: 0, playing: false }); if (k !== 'free') setDrawing(false); }} /> {KIND_LABEL[k]}
          </label>
        ))}
      </div>
      {kind === 'latitude' && (
        <label className="field">
          <span>{sl.label}: {sl.deg ? `${fmt(latitude * DEG, 0)}°` : fmt(latitude, 2)}</span>
          <input type="range" min={sl.min} max={sl.max} step={0.01}
            value={Math.min(sl.max, Math.max(sl.min, latitude))}
            onChange={(e) => set({ latitude: +e.target.value, progress: 0, playing: false })} />
        </label>
      )}
      {kind === 'free' && (
        <div className="field">
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setDrawing(!drawing)}>{drawing ? 'Done drawing' : 'Draw loop'}</button>
            <button onClick={() => set({ freePoints: [], progress: 0, playing: false })}>Clear</button>
          </div>
          <span>{drawing ? 'Click the surface to add points (need 3+).' : `${freePoints.length} points`}</span>
        </div>
      )}
      {start && (
        <label className="field">
          <span>Initial vector angle: {fmt(angle * DEG, 0)}°</span>
          <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={angle} onChange={(e) => setAngle(+e.target.value)} />
        </label>
      )}
      <TransportControls />

      <h2>Transport equation</h2>
      <Tex block>{String.raw`\frac{dV^k}{dt} + \Gamma^k_{ij}\,V^i\,\frac{du^j}{dt} = 0`}</Tex>
      {cur ? (
        <div className="readout">
          <span>({coordText(cu)}, {coordText(cv)})</span><span>({fmt(cur.uv[0])}, {fmt(cur.uv[1])})</span>
          <span>du/dt</span><span>({fmt(dudt[0])}, {fmt(dudt[1])})</span>
          <span>V^k</span><span>({fmt(cur.V[0])}, {fmt(cur.V[1])})</span>
          <span>dV^k/dt</span><span>({fmt(dV[0])}, {fmt(dV[1])})</span>
          <span>g(V,V)</span><span>{fmt(normSq(surface, cur.uv, cur.V), 5)}</span>
        </div>
      ) : <p>Draw at least 3 points to define a loop.</p>}

      <h2 data-tour="holonomy">Holonomy</h2>
      {measured !== null ? (
        <>
          <div className="readout">
            <span>measured</span><span>{fmtDeg(measured)}° ({fmt(measured, 4)} rad)</span>
            {predicted !== null && (<><span>predicted</span><span>{fmtDeg(predicted)}°</span></>)}
          </div>
          <p>Angle = ∬<Tex>K\,dA</Tex> over the enclosed region (Gauss–Bonnet), for loops counter-clockwise in <Tex>{`(${cu},${cv})`}</Tex>.</p>
          {isSphere && kind === 'latitude' && (
            <Tex block>{String.raw`\iint K\,dA = 2\pi(1-\cos\theta_0)`}</Tex>
          )}
          {isSphere && kind === 'triangle' && (
            <Tex block>{String.raw`\iint K\,dA = \text{area} = \tfrac{\pi}{2}\cos 0.05`}</Tex>
          )}
        </>
      ) : <p>No loop yet.</p>}
    </div>
  );
}
