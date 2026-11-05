import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { DriftNote, DriftRows, maxRelDrift } from '../panels/Drift';
import { SurfacePicker } from '../panels/SurfacePicker';
import { TransportControls } from '../panels/TransportControls';
import { Tex, fmt, fmtDeg, coordText } from '../panels/Tex';
import SurfaceMesh from '../scene/SurfaceMesh';
import TransportPath, {
  STEPS, availableKinds, frame, loopSlider, useDraw, useTransportData,
} from '../scene/TransportPath';
import { nearestImage, periodsOf } from '../math/curves';
import { foldSample, holonomyAngle, normSq } from '../math/transport';
import type { Vec2 } from '../math/types';
import { SumsToggle } from './MetricModule';
import { useStore, type PathKind } from '../state/store';
import { T, useTr } from '../i18n';

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
        // nearest periodic image of the click, so a loop drawn across a seam does not jump back across the chart
        const st = useStore.getState(), last = st.freePoints[st.freePoints.length - 1];
        const p = last ? nearestImage(uv, last, periodsOf(surface.domain)) : uv;
        st.set({ freePoints: [...st.freePoints, p], progress: 0, playing: false });
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
const KIND_LABEL_ES: Record<PathKind, string> = { latitude: 'Lazo coordenado', triangle: 'Triángulo geodésico', free: 'Dibujo libre' };

export function TransportPanel() {
  const t = useTr();
  const { surface, kind, curve, start, V0, samples } = useTransportData();
  const { surfaceId, latitude, progress, freePoints, expandSums, set } = useStore();
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

  const drift = samples ? maxRelDrift(samples.map((s) => Math.sqrt(normSq(surface, s.uv, s.V)))) : NaN;
  const measured = samples && start ? holonomyAngle(surface, start, V0, foldSample(surface, samples[STEPS]).V) : null;
  let predicted: number | null = null;
  if (isSphere && kind === 'latitude') predicted = wrap(2 * Math.PI * (1 - Math.cos(latitude)));
  if (isSphere && kind === 'triangle') predicted = wrap((Math.PI / 2) * Math.cos(0.05));
  const [cu, cv] = surface.coords;

  return (
    <div>
      <SurfacePicker />
      <h2><T en="Path" es="Trayectoria" /></h2>
      <fieldset className="field group">
        <legend>{t('Loop type', 'Tipo de lazo')}</legend>
        {availableKinds(surfaceId).map((k) => (
          <label key={k}>
            <input type="radio" name="pk" checked={kind === k} onChange={() => { set({ pathKind: k, progress: 0, playing: false }); if (k !== 'free') setDrawing(false); }} /> {t(KIND_LABEL[k], KIND_LABEL_ES[k])}
          </label>
        ))}
      </fieldset>
      {kind === 'latitude' && (
        <label className="field">
          <span>{t(sl.label, sl.labelEs)}: {sl.deg ? `${fmt(latitude * DEG, 0)}°` : fmt(latitude, 2)}</span>
          <input type="range" min={sl.min} max={sl.max} step={0.01}
            value={Math.min(sl.max, Math.max(sl.min, latitude))}
            onChange={(e) => set({ latitude: +e.target.value, progress: 0, playing: false })} />
        </label>
      )}
      {kind === 'free' && (
        <div className="field" role="group" aria-label={t('Free loop', 'Lazo libre')}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button aria-pressed={drawing} onClick={() => setDrawing(!drawing)}>{drawing ? t('Done drawing', 'Terminar dibujo') : t('Draw loop', 'Dibujar lazo')}</button>
            <button onClick={() => set({ freePoints: [], progress: 0, playing: false })}>{t('Clear', 'Borrar')}</button>
          </div>
          <span role="status">{drawing ? t('Click the surface to add points (need 3+).', 'Haz clic en la superficie para añadir puntos (se necesitan 3 o más).') : `${freePoints.length} ${t('points', 'puntos')}`}</span>
        </div>
      )}
      {start && (
        <label className="field">
          <span>{t('Initial vector angle', 'Ángulo del vector inicial')}: {fmt(angle * DEG, 0)}°</span>
          <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={angle} onChange={(e) => setAngle(+e.target.value)} />
        </label>
      )}
      <TransportControls />

      <h2><T en="Transport equation" es="Ecuación del transporte" /></h2>
      <SumsToggle />
      <Tex block>{expandSums
        ? String.raw`\frac{dV^k}{dt} + \Gamma^k_{11}\htmlClass{hl-V}{V^1}\dot u^1 + \Gamma^k_{12}\htmlClass{hl-V}{V^1}\dot u^2 + \Gamma^k_{21}\htmlClass{hl-V}{V^2}\dot u^1 + \Gamma^k_{22}\htmlClass{hl-V}{V^2}\dot u^2 = 0`
        : String.raw`\frac{d\htmlClass{hl-V}{V^k}}{dt} + \Gamma^k_{ij}\,\htmlClass{hl-V}{V^i}\,\frac{du^j}{dt} = 0`}</Tex>
      {cur ? (
        <div className="readout">
          <span>({coordText(cu)}, {coordText(cv)})</span><span>({fmt(cur.uv[0])}, {fmt(cur.uv[1])})</span>
          <span>du/dt</span><span>({fmt(dudt[0])}, {fmt(dudt[1])})</span>
          <span>V<sup>k</sup></span><span>({fmt(cur.V[0])}, {fmt(cur.V[1])})</span>
          <span>dV<sup>k</sup>/dt</span><span>({fmt(dV[0])}, {fmt(dV[1])})</span>
          <span>g(V,V)</span><span>{fmt(normSq(surface, cur.uv, cur.V), 5)}</span>
          <DriftRows label="|V|_g, max over loop" labelEs="|V|_g, máx. en el lazo" value={drift} />
        </div>
      ) : <p>{t('Draw at least 3 points to define a loop.', 'Dibuja al menos 3 puntos para definir un lazo.')}</p>}
      {cur && <DriftNote />}

      <h2 data-tour="holonomy"><T en="Holonomy" es="Holonomía" /></h2>
      {measured !== null ? (
        <>
          <div className="readout">
            <span>{t('measured', 'medida')}</span><span>{fmtDeg(measured)}° ({fmt(measured, 4)} rad)</span>
            {predicted !== null && (<><span>{t('predicted', 'predicha')}</span><span>{fmtDeg(predicted)}°</span></>)}
          </div>
          <p><T
            en={<>Angle = ∬<Tex>K\,dA</Tex> over the enclosed region (Gauss–Bonnet), for loops counter-clockwise in <Tex>{`(${cu},${cv})`}</Tex>.</>}
            es={<>Ángulo = ∬<Tex>K\,dA</Tex> sobre la región encerrada (Gauss–Bonnet), para lazos recorridos en sentido antihorario en <Tex>{`(${cu},${cv})`}</Tex>.</>} /></p>
          {isSphere && kind === 'latitude' && (
            <Tex block>{String.raw`\iint K\,dA = 2\pi(1-\cos\theta_0)`}</Tex>
          )}
          {isSphere && kind === 'triangle' && (
            <Tex block>{t(String.raw`\iint K\,dA = \text{area} = \tfrac{\pi}{2}\cos 0.05`, String.raw`\iint K\,dA = \text{área} = \tfrac{\pi}{2}\cos 0.05`)}</Tex>
          )}
        </>
      ) : <p>{t('No loop yet.', 'Aún no hay lazo.')}</p>}
    </div>
  );
}
