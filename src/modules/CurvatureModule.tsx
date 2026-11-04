import { useEffect, useMemo, useState } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { getSurface } from '../math';
import { toWorld } from '../math/metric';
import { curvatureAt, curvatureRange, geodesicCircle } from '../math/curvature';
import { totalCurvature } from '../math/totalCurvature';
import { PRESETS } from '../math/surfaces/presets';
import type { Mat2, Vec3 } from '../math/types';
import { applyCustomSpec, useStore } from '../state/store';
import { T, useTr } from '../i18n';
import { SurfacePicker } from '../panels/SurfacePicker';
import { Tex, fmt, fmtSci, coordText } from '../panels/Tex';
import Arrow from '../scene/Arrow';
import CurvatureMesh, { constantK, curvatureColor } from '../scene/CurvatureMesh';
import DraggablePoint from '../scene/DraggablePoint';
import { Label } from '../scene/Label';
import { unitNormal } from '../scene/geom';
import { markerScale } from '../scene/markerScale';

const DIR_COLORS = ['#35e0c2', '#ff6bd6'];
const ARROW = 0.28;
const UMBILIC = 1e-6;

export function CurvatureScene() {
  const { surfaceId, uv, curvRho, curvShow, set } = useStore();
  const surface = getSurface(surfaceId);
  const ca = useMemo(() => curvatureAt(surface, uv[0], uv[1]), [surface, uv]);
  const ring = useMemo(() => geodesicCircle(surface, uv, curvRho), [surface, uv, curvRho]);
  const k = markerScale(surface);
  const p = surface.position(uv[0], uv[1]);
  const n = unitNormal(surface, uv[0], uv[1]);
  const lift = (q: Vec3, h: number): Vec3 => [q[0] + n[0] * h, q[1] + n[1] * h, q[2] + n[2] * h];
  const umbilic = Math.abs(ca.kappa[1] - ca.kappa[0]) < UMBILIC;

  return (
    <group>
      <CurvatureMesh surface={surface} heatmap={curvShow.heatmap} onPointerDown={(u) => set({ uv: u })} />
      {curvShow.principal && !umbilic && ca.dirs.map((d, i) => {
        const w = toWorld(surface, uv[0], uv[1], d);
        const len = Math.hypot(...w) || 1;
        const v: Vec3 = [(w[0] / len) * ARROW * k, (w[1] / len) * ARROW * k, (w[2] / len) * ARROW * k];
        // tangent arrows sink into the surface on its concave side, and which side faces the camera varies: draw as overlay
        const o = lift(p, 0.02 * k);
        return (
          <group key={i}>
            <Arrow origin={o} dir={v} color={DIR_COLORS[i]} radius={0.015 * k} overlay />
            <Arrow origin={o} dir={[-v[0], -v[1], -v[2]]} color={DIR_COLORS[i]} radius={0.015 * k} overlay />
            <Label text={i ? 'κ₂' : 'κ₁'} color={DIR_COLORS[i]} height={0.09 * k}
              position={lift([p[0] + v[0] * 1.35, p[1] + v[1] * 1.35, p[2] + v[2] * 1.35], 0.05 * k)} />
          </group>
        );
      })}
      {curvShow.circle && (
        <Line points={[...ring.points, ring.points[0]]} color="#ffd24a" lineWidth={2.5} />
      )}
      <DraggablePoint surface={surface} uv={uv} onChange={(u) => set({ uv: u })} />
    </group>
  );
}

const pmatrix = (m: Mat2, d = 3) =>
  String.raw`\begin{pmatrix}${fmt(m[0][0], d)} & ${fmt(m[0][1], d)}\\ ${fmt(m[1][0], d)} & ${fmt(m[1][1], d)}\end{pmatrix}`;

const BEND_SECONDS = 6;

/** Isometric bending demo: sweep slider a of a bending preset; g and K stay put, κ1, κ2 move. */
function Bending({ lo, hi, g, K, kappa }: { lo: number; hi: number; g: Mat2; K: number; kappa: [number, number] }) {
  const t = useTr();
  const spec = useStore((st) => st.customSpec);
  const [playing, setPlaying] = useState(false);
  const a = spec.params.a;
  const setA = (x: number) => applyCustomSpec({ ...useStore.getState().customSpec, params: { ...useStore.getState().customSpec.params, a: x } }, false);
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now(), ph = (Math.max(lo, Math.min(hi, a)) - lo) / (hi - lo), dir = 1;
    const tick = (now: number) => {
      ph += (dir * Math.min(now - last, 100)) / 1000 / BEND_SECONDS;
      last = now;
      if (ph >= 1 || ph <= 0) { ph = Math.max(0, Math.min(1, ph)); dir = -dir; }
      setA(lo + (hi - lo) * ph);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // a is read once at start; later changes come from this loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, lo, hi]);
  return (
    <div>
      <h2><T en="Bending" es="Flexión" /></h2>
      <div className="field" role="group" aria-label={t('Bending playback', 'Reproducción de la flexión')}>
        <button onClick={() => setPlaying(!playing)}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <label htmlFor="bend-a">a = {fmt(a, 2)}</label>
        <input id="bend-a" type="range" min={lo} max={hi} step={0.01} value={Math.min(hi, Math.max(lo, a))}
          onChange={(e) => { setPlaying(false); setA(+e.target.value); }} />
      </div>
      <div className="readout">
        <span>g₁₁</span><span>{fmt(g[0][0], 4)}</span>
        <span>g₁₂</span><span>{fmt(g[0][1], 4)}</span>
        <span>g₂₂</span><span>{fmt(g[1][1], 4)}</span>
        <span>{t('K intrinsic', 'K intrínseca')}</span><span>{fmt(K, 4)}</span>
        <span>κ₁</span><span>{fmt(kappa[0], 4)}</span>
        <span>κ₂</span><span>{fmt(kappa[1], 4)}</span>
      </div>
      <p>{t(
        'Bending without stretching keeps the metric g, and therefore K (Theorema Egregium), but changes how the surface sits in space: the principal curvatures κ₁, κ₂ change while their product stays K.',
        'Doblar sin estirar conserva la métrica g y por tanto K (Theorema Egregium), pero cambia cómo está colocada la superficie en el espacio: las curvaturas principales κ₁, κ₂ cambian mientras su producto sigue siendo K.')}</p>
    </div>
  );
}

export function CurvaturePanel() {
  const t = useTr();
  const { surfaceId, uv, curvRho, curvShow, customSpec, set } = useStore();
  const surface = getSurface(surfaceId);
  const bend = surfaceId === 'custom' ? PRESETS.find((p) => p.bend && p.spec.x === customSpec.x && p.spec.y === customSpec.y && p.spec.z === customSpec.z) : undefined;
  const ca = useMemo(() => curvatureAt(surface, uv[0], uv[1]), [surface, uv]);
  const ring = useMemo(() => geodesicCircle(surface, uv, curvRho), [surface, uv, curvRho]);
  const total = useMemo(() => totalCurvature(surface, bend ? 10 : 20), [surface, bend]);
  const range = useMemo(() => curvatureRange(surface), [surface]);
  const [cu, cv] = surface.coords;
  const umbilic = Math.abs(ca.kappa[1] - ca.kappa[0]) < UMBILIC;
  const flat = constantK(range);
  const scale = Math.max(Math.abs(range.min), Math.abs(range.max), 1e-12);
  const css = (K: number) => '#' + curvatureColor(K, scale, new THREE.Color()).getHexString();
  const gradient = flat ? css(range.max) : `linear-gradient(to right, ${css(-scale)}, ${css(0)}, ${css(scale)})`;
  const toggle = (k: keyof typeof curvShow, label: string) => (
    <label style={{ display: 'block', fontSize: 13 }}>
      <input type="checkbox" checked={curvShow[k]} onChange={(e) => set({ curvShow: { ...curvShow, [k]: e.target.checked } })} /> {label}
    </label>
  );
  const R = ca.riemann;
  const names = [`${cu}`, `${cv}`];
  const comp = (k: number, l: number, i: number, j: number) => (
    <>
      <span><Tex>{String.raw`R^{${names[k]}}{}_{${names[l]}${names[i]}${names[j]}}`}</Tex></span>
      <span>{fmt(R[k][l][i][j], 4)}</span>
    </>
  );
  const ratio = ring.circumference / (2 * Math.PI * curvRho);

  return (
    <div>
      <SurfacePicker />
      <fieldset className="field group">
        <legend>{t('Show', 'Mostrar')}</legend>
        {toggle('heatmap', t('Gaussian curvature heatmap', 'Mapa de calor de la curvatura de Gauss'))}
        {toggle('principal', t('Principal directions', 'Direcciones principales'))}
        {toggle('circle', t('Geodesic circle', 'Círculo geodésico'))}
      </fieldset>
      <label className="field">
        <span>{t('Geodesic circle radius', 'Radio del círculo geodésico')} ρ: {fmt(curvRho, 2)}</span>
        <input type="range" min={0.05} max={1.5} step={0.01} value={curvRho} onChange={(e) => set({ curvRho: +e.target.value })} />
      </label>
      <div className="field">
        <div role="img" aria-label={flat ? t(`Colour scale: K = ${fmt(range.max)} everywhere`, `Escala de color: K = ${fmt(range.max)} en todas partes`) : t(`Colour scale for K from ${fmt(-scale)} to ${fmt(scale)}`, `Escala de color de K de ${fmt(-scale)} a ${fmt(scale)}`)} style={{ height: 12, borderRadius: 4, background: gradient }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
          {flat ? <span>K = {fmt(range.max)} {t('everywhere', 'en todas partes')}</span> : <><span>{fmt(-scale)}</span><span>0</span><span>{fmt(scale)}</span></>}
        </div>
        {!flat && <span>{t('K on this surface ranges over', 'En esta superficie K varía en')} [{fmt(range.min)}, {fmt(range.max)}]</span>}
      </div>

      <div data-tour="curv-egregium">
        <h2><T en="Intrinsic vs extrinsic" es="Intrínseca frente a extrínseca" /></h2>
        <Tex block>{String.raw`K = \frac{R_{1212}}{\det g}`}</Tex>
        <Tex block>{String.raw`K = \det\!\big(g^{-1}\mathrm{II}\big) = \kappa_1\kappa_2`}</Tex>
        <div className="readout">
          <span>{t('K intrinsic (from g)', 'K intrínseca (a partir de g)')}</span><span>{fmt(ca.Kintrinsic, 5)}</span>
          <span>{t('K extrinsic (κ₁κ₂)', 'K extrínseca (κ₁κ₂)')}</span><span>{fmt(ca.Kextrinsic, 5)}</span>
          <span>{t('difference', 'diferencia')}</span><span>{fmtSci(ca.Kintrinsic - ca.Kextrinsic, 1)}</span>
        </div>
        <p>{t('Theorema Egregium: K is computed from the metric g alone, although it was defined using the embedding. Bending without stretching changes II but not K.', 'Theorema Egregium: K se calcula únicamente a partir de la métrica g, aunque se definió usando la inmersión. Doblar sin estirar cambia II pero no K.')}</p>
      </div>

      {bend && <Bending lo={bend.bend![0]} hi={bend.bend![1]} g={surface.metric(uv[0], uv[1])} K={ca.Kintrinsic} kappa={ca.kappa} />}

      <h2><T en="Principal curvatures" es="Curvaturas principales" /></h2>
      <div className="readout">
        <span>κ₁</span><span>{fmt(ca.kappa[0], 4)}</span>
        <span>κ₂</span><span>{fmt(ca.kappa[1], 4)}</span>
        <span>H = (κ₁+κ₂)/2</span><span>{fmt(ca.H, 4)}</span>
      </div>
      <Tex block>{String.raw`\mathrm{II}=${pmatrix(ca.II)}`}</Tex>
      {umbilic && <p>{t('Umbilic point: κ₁ = κ₂, so every tangent direction is principal.', 'Punto umbilical: κ₁ = κ₂, así que toda dirección tangente es principal.')}</p>}
      <p>{t('κ₁, κ₂ are the extreme normal curvatures at p; their directions are orthogonal in g.', 'κ₁, κ₂ son las curvaturas normales extremas en p; sus direcciones son ortogonales respecto de g.')}</p>

      <h2><T en="Riemann and Ricci" es="Riemann y Ricci" /></h2>
      <p><T
        en={<>In 2D the only independent component is <Tex>{String.raw`R_{1212}`}</Tex>; the four nonzero <Tex>{String.raw`R^k{}_{lij}`}</Tex> follow from it.</>}
        es={<>En 2D la única componente independiente es <Tex>{String.raw`R_{1212}`}</Tex>; las cuatro <Tex>{String.raw`R^k{}_{lij}`}</Tex> no nulas se deducen de ella.</>} /></p>
      <div className="readout">
        {comp(0, 1, 0, 1)}{comp(0, 1, 1, 0)}{comp(1, 0, 0, 1)}{comp(1, 0, 1, 0)}
        <span>({coordText(cu)}, {coordText(cv)})</span><span>(1, 2)</span>
      </div>
      <Tex block>{String.raw`R_{ij}=${pmatrix(ca.ricci)}=K\,g_{ij}`}</Tex>
      <div className="readout">
        <span>{t('scalar R = 2K', 'escalar R = 2K')}</span><span>{fmt(ca.scalar, 4)}</span>
      </div>

      <h2><T en="Global Gauss–Bonnet" es="Gauss–Bonnet global" /></h2>
      <Tex block>{String.raw`\iint_M K\,dA = 2\pi\,\chi(M)`}</Tex>
      <div className="readout">
        <span>{t('Total curvature ∬K dA', 'Curvatura total ∬K dA')}</span><span>{fmt(total, 4)}</span>
        {surface.euler !== undefined && (<>
          <span>χ</span><span>{surface.euler}</span>
          <span>2πχ</span><span>{fmt(2 * Math.PI * surface.euler, 4)}</span>
          <span>{t('difference', 'diferencia')}</span><span>{fmtSci(total - 2 * Math.PI * surface.euler, 1)}</span>
        </>)}
      </div>
      <p>{surface.euler !== undefined
        ? t('The integral is computed numerically over the whole chart (Gauss–Legendre on √det g). For any closed surface it equals 2πχ, a topological number: every sphere-like surface has χ = 2, so ∬K dA = 4π whatever its shape. Dents and bumps only trade positive curvature for negative curvature; the total never changes. The torus has χ = 0, so its positive outer curvature cancels the negative inner curvature exactly.',
            'La integral se calcula numéricamente sobre toda la carta (Gauss–Legendre con √det g). Para cualquier superficie cerrada vale 2πχ, un número topológico: toda superficie con forma de esfera tiene χ = 2, así que ∬K dA = 4π sea cual sea su forma. Las abolladuras y protuberancias solo intercambian curvatura positiva por negativa; el total nunca cambia. El toro tiene χ = 0, así que su curvatura positiva exterior cancela exactamente la negativa interior.')
        : t('This surface is open (or its topology is not declared), so the total curvature is not a topological invariant: the Gauss–Bonnet formula needs a boundary term.',
            'Esta superficie es abierta (o no se declara su topología), así que la curvatura total no es un invariante topológico: la fórmula de Gauss–Bonnet necesita un término de borde.')}</p>

      <h2><T en="Geodesic circle" es="Círculo geodésico" /></h2>
      <Tex block>{String.raw`C(\rho)=2\pi\rho\left(1-\frac{K\rho^2}{6}+O(\rho^4)\right)`}</Tex>
      <div className="readout">
        <span>C</span><span>{fmt(ring.circumference, 4)}</span>
        <span>2πρ</span><span>{fmt(2 * Math.PI * curvRho, 4)}</span>
        <span>C / 2πρ</span><span>{fmt(ratio, 4)}</span>
        <span>{t('K estimate', 'estimación de K')}</span><span>{fmt(ring.Kestimate, 4)}</span>
        <span>K</span><span>{fmt(ca.Kintrinsic, 4)}</span>
      </div>
      <p><T
        en={<>K &gt; 0 shrinks the circle below the flat value, K &lt; 0 enlarges it. Bertrand–Diquet–Puiseux: <Tex>{String.raw`K\approx 3(2\pi\rho-C)/(\pi\rho^3)`}</Tex>, accurate as ρ → 0.</>}
        es={<>K &gt; 0 reduce la circunferencia por debajo del valor plano, K &lt; 0 la aumenta. Bertrand–Diquet–Puiseux: <Tex>{String.raw`K\approx 3(2\pi\rho-C)/(\pi\rho^3)`}</Tex>, precisa cuando ρ → 0.</>} /></p>
    </div>
  );
}
