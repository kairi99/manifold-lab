import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { getSurface } from '../math';
import { toWorld } from '../math/metric';
import { curvatureAt, curvatureRange, geodesicCircle } from '../math/curvature';
import type { Mat2, Vec3 } from '../math/types';
import { useStore } from '../state/store';
import { SurfacePicker } from '../panels/SurfacePicker';
import { Tex, fmt, coordText } from '../panels/Tex';
import Arrow from '../scene/Arrow';
import CurvatureMesh, { constantK, curvatureColor } from '../scene/CurvatureMesh';
import DraggablePoint from '../scene/DraggablePoint';
import { Label } from '../scene/Label';
import { unitNormal } from '../scene/geom';

const DIR_COLORS = ['#35e0c2', '#ff6bd6'];
const ARROW = 0.28;
const UMBILIC = 1e-6;

export function CurvatureScene() {
  const { surfaceId, uv, curvRho, curvShow, set } = useStore();
  const surface = getSurface(surfaceId);
  const ca = useMemo(() => curvatureAt(surface, uv[0], uv[1]), [surface, uv]);
  const ring = useMemo(() => geodesicCircle(surface, uv, curvRho), [surface, uv, curvRho]);
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
        const v: Vec3 = [(w[0] / len) * ARROW, (w[1] / len) * ARROW, (w[2] / len) * ARROW];
        // tangent arrows sink into the surface on its concave side, and which side faces the camera varies: draw as overlay
        const o = lift(p, 0.02);
        return (
          <group key={i}>
            <Arrow origin={o} dir={v} color={DIR_COLORS[i]} overlay />
            <Arrow origin={o} dir={[-v[0], -v[1], -v[2]]} color={DIR_COLORS[i]} overlay />
            <Label text={i ? 'κ₂' : 'κ₁'} color={DIR_COLORS[i]}
              position={lift([p[0] + v[0] * 1.35, p[1] + v[1] * 1.35, p[2] + v[2] * 1.35], 0.05)} />
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

export function CurvaturePanel() {
  const { surfaceId, uv, curvRho, curvShow, set } = useStore();
  const surface = getSurface(surfaceId);
  const ca = useMemo(() => curvatureAt(surface, uv[0], uv[1]), [surface, uv]);
  const ring = useMemo(() => geodesicCircle(surface, uv, curvRho), [surface, uv, curvRho]);
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
        <legend>Show</legend>
        {toggle('heatmap', 'Gaussian curvature heatmap')}
        {toggle('principal', 'Principal directions')}
        {toggle('circle', 'Geodesic circle')}
      </fieldset>
      <label className="field">
        <span>Geodesic circle radius ρ: {fmt(curvRho, 2)}</span>
        <input type="range" min={0.05} max={1.5} step={0.01} value={curvRho} onChange={(e) => set({ curvRho: +e.target.value })} />
      </label>
      <div className="field">
        <div role="img" aria-label={flat ? `Colour scale: K = ${fmt(range.max)} everywhere` : `Colour scale for K from ${fmt(-scale)} to ${fmt(scale)}`} style={{ height: 12, borderRadius: 4, background: gradient }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
          {flat ? <span>K = {fmt(range.max)} everywhere</span> : <><span>{fmt(-scale)}</span><span>0</span><span>{fmt(scale)}</span></>}
        </div>
        {!flat && <span>K on this surface ranges over [{fmt(range.min)}, {fmt(range.max)}]</span>}
      </div>

      <div data-tour="curv-egregium">
        <h2>Intrinsic vs extrinsic</h2>
        <Tex block>{String.raw`K = \frac{R_{1212}}{\det g}`}</Tex>
        <Tex block>{String.raw`K = \det\!\big(g^{-1}\mathrm{II}\big) = \kappa_1\kappa_2`}</Tex>
        <div className="readout">
          <span>K intrinsic (from g)</span><span>{fmt(ca.Kintrinsic, 5)}</span>
          <span>K extrinsic (κ₁κ₂)</span><span>{fmt(ca.Kextrinsic, 5)}</span>
          <span>difference</span><span>{(ca.Kintrinsic - ca.Kextrinsic).toExponential(1)}</span>
        </div>
        <p>Theorema Egregium: K is computed from the metric g alone, although it was defined using the embedding. Bending without stretching changes II but not K.</p>
      </div>

      <h2>Principal curvatures</h2>
      <div className="readout">
        <span>κ₁</span><span>{fmt(ca.kappa[0], 4)}</span>
        <span>κ₂</span><span>{fmt(ca.kappa[1], 4)}</span>
        <span>H = (κ₁+κ₂)/2</span><span>{fmt(ca.H, 4)}</span>
      </div>
      <Tex block>{String.raw`\mathrm{II}=${pmatrix(ca.II)}`}</Tex>
      {umbilic && <p>Umbilic point: κ₁ = κ₂, so every tangent direction is principal.</p>}
      <p>κ₁, κ₂ are the extreme normal curvatures at p; their directions are orthogonal in g.</p>

      <h2>Riemann and Ricci</h2>
      <p>In 2D the only independent component is <Tex>{String.raw`R_{1212}`}</Tex>; the four nonzero <Tex>{String.raw`R^k{}_{lij}`}</Tex> follow from it.</p>
      <div className="readout">
        {comp(0, 1, 0, 1)}{comp(0, 1, 1, 0)}{comp(1, 0, 0, 1)}{comp(1, 0, 1, 0)}
        <span>({coordText(cu)}, {coordText(cv)})</span><span>(1, 2)</span>
      </div>
      <Tex block>{String.raw`R_{ij}=${pmatrix(ca.ricci)}=K\,g_{ij}`}</Tex>
      <div className="readout">
        <span>scalar R = 2K</span><span>{fmt(ca.scalar, 4)}</span>
      </div>

      <h2>Geodesic circle</h2>
      <Tex block>{String.raw`C(\rho)=2\pi\rho\left(1-\frac{K\rho^2}{6}+O(\rho^4)\right)`}</Tex>
      <div className="readout">
        <span>C</span><span>{fmt(ring.circumference, 4)}</span>
        <span>2πρ</span><span>{fmt(2 * Math.PI * curvRho, 4)}</span>
        <span>C / 2πρ</span><span>{fmt(ratio, 4)}</span>
        <span>K estimate</span><span>{fmt(ring.Kestimate, 4)}</span>
        <span>K</span><span>{fmt(ca.Kintrinsic, 4)}</span>
      </div>
      <p>K &gt; 0 shrinks the circle below the flat value, K &lt; 0 enlarges it. Bertrand–Diquet–Puiseux: <Tex>{String.raw`K\approx 3(2\pi\rho-C)/(\pi\rho^3)`}</Tex>, accurate as ρ → 0.</p>
    </div>
  );
}
