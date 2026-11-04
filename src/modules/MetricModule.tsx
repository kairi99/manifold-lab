import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getSurface, innerProduct, toWorld } from '../math';
import type { Vec2, Vec3 } from '../math/types';
import { useStore } from '../state/store';
import SurfaceMesh from '../scene/SurfaceMesh';
import DraggablePoint from '../scene/DraggablePoint';
import TangentPlane from '../scene/TangentPlane';
import VectorArrow from '../scene/VectorArrow';
import { Tex, fmt } from '../panels/Tex';
import { SurfacePicker } from '../panels/SurfacePicker';

const NC = 64;

export function MetricScene() {
  const surfaceId = useStore((s) => s.surfaceId);
  const uv = useStore((s) => s.uv);
  const vector = useStore((s) => s.vector);
  const set = useStore((s) => s.set);
  const surface = getSurface(surfaceId);
  const circle = useMemo(() => {
    const g = surface.metric(uv[0], uv[1]);
    const a = Math.sqrt(g[0][0]), D = Math.sqrt(g[0][0] * g[1][1] - g[0][1] ** 2);
    const p = surface.position(uv[0], uv[1]);
    // radius |V|_g so the tip of V lies on the ring (a unit ring would dwarf a unit sphere)
    const rho = Math.sqrt(g[0][0] * vector[0] ** 2 + 2 * g[0][1] * vector[0] * vector[1] + g[1][1] * vector[1] ** 2) || 1;
    const pts: Vec3[] = [];
    for (let k = 0; k <= NC; k++) {
      const t = (2 * Math.PI * k) / NC, c = rho * Math.cos(t), s = rho * Math.sin(t);
      // Cholesky: V = L^{-T} (cos t, sin t) satisfies g(V,V) = 1, scaled by rho
      const V: Vec2 = [c / a - (g[0][1] / (a * D)) * s, (a / D) * s];
      const w = toWorld(surface, uv[0], uv[1], V);
      pts.push([p[0] + w[0], p[1] + w[1], p[2] + w[2]]);
    }
    return pts;
  }, [surface, uv, vector]);
  return (
    <group>
      <SurfaceMesh surface={surface} onPointerDown={(q) => set({ uv: q })} />
      <TangentPlane surface={surface} uv={uv} />
      <Line points={circle} color="#c792ff" lineWidth={2} />
      <VectorArrow surface={surface} uv={uv} V={vector} editable onChange={(V) => set({ vector: V })} />
      <DraggablePoint surface={surface} uv={uv} onChange={(q) => set({ uv: q })} />
    </group>
  );
}

const mat = (m: number[][]) =>
  `\\begin{pmatrix}${m.map((r) => r.map((x) => fmt(x)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export function MetricPanel() {
  const surfaceId = useStore((s) => s.surfaceId);
  const uv = useStore((s) => s.uv);
  const vector = useStore((s) => s.vector);
  const set = useStore((s) => s.set);
  const surface = getSurface(surfaceId);
  const [cu, cv] = surface.coords;

  const r = useMemo(() => {
    const g = surface.metric(uv[0], uv[1]);
    const w = toWorld(surface, uv[0], uv[1], vector);
    return {
      g,
      det: g[0][0] * g[1][1] - g[0][1] * g[1][0],
      lu: Math.sqrt(g[0][0]),
      lv: Math.sqrt(g[1][1]),
      angle: (Math.acos(Math.max(-1, Math.min(1, g[0][1] / Math.sqrt(g[0][0] * g[1][1])))) * 180) / Math.PI,
      Gam: surface.christoffel(uv[0], uv[1]),
      K: surface.gaussK(uv[0], uv[1]),
      gVV: innerProduct(g, vector, vector),
      euc: w[0] * w[0] + w[1] * w[1] + w[2] * w[2],
    };
  }, [surface, uv, vector]);

  const names = [cu, cv];
  const setV = (i: 0 | 1, x: string) => {
    const n = parseFloat(x);
    if (Number.isFinite(n)) set({ vector: i === 0 ? [n, vector[1]] : [vector[0], n] });
  };
  const numInput = { type: 'number', step: 0.1, style: { width: 80 } } as const;

  return (
    <div>
      <SurfacePicker />
      <h2>Parametrization</h2>
      <p>The surface is an embedding <Tex>{'r:U\\subset\\mathbb{R}^2\\to\\mathbb{R}^3'}</Tex>; its tangent space at p is spanned by the coordinate vectors <Tex>{'\\partial_i r'}</Tex>.</p>
      <Tex block>{surface.latex.param}</Tex>
      <h2>Metric</h2>
      <p>The metric <Tex>{'g_{ij}=\\partial_i r\\cdot\\partial_j r'}</Tex> is the pull-back of the Euclidean dot product to the parameter domain.</p>
      <Tex block>{surface.latex.metric}</Tex>
      <h2>Christoffel symbols</h2>
      <p>The Levi-Civita connection coefficients <Tex>{'\\Gamma^k_{ij}=\\tfrac12 g^{kl}(\\partial_i g_{jl}+\\partial_j g_{il}-\\partial_l g_{ij})'}</Tex> are determined by g alone.</p>
      <Tex block>{surface.latex.christoffel}</Tex>

      <div data-tour="metric-readout">
        <h2>At p</h2>
        <p>Coordinates <Tex>{`(${cu},${cv})`}</Tex> = ({fmt(uv[0])}, {fmt(uv[1])}).</p>
        <Tex block>{`g_{ij}=${mat(r.g)}`}</Tex>
        <div className="readout">
          <span><Tex>{'\\det g'}</Tex></span><span>{fmt(r.det, 4)}</span>
          <span><Tex>{`|\\partial_{${cu}}|=\\sqrt{g_{11}}`}</Tex></span><span>{fmt(r.lu)}</span>
          <span><Tex>{`|\\partial_{${cv}}|=\\sqrt{g_{22}}`}</Tex></span><span>{fmt(r.lv)}</span>
          <span>angle(∂₁,∂₂)</span><span>{fmt(r.angle, 2)}°</span>
          <span><Tex>{'K'}</Tex></span><span>{fmt(r.K, 4)}</span>
          {[[0,0,0],[0,0,1],[0,1,1],[1,0,0],[1,0,1],[1,1,1]]
            .map(([k, i, j]) => {
              const x = r.Gam[k][i][j];
              return [
                <span key={`l${k}${i}${j}`}><Tex>{`\\Gamma^{${names[k]}}_{${names[i]}${names[j]}}`}</Tex></span>,
                <span key={`v${k}${i}${j}`} style={{ color: Math.abs(x) > 5e-4 ? 'var(--accent)' : 'var(--muted)' }}>{fmt(x)}</span>,
              ];
            })}
        </div>
        <p>The Gram matrix of the coordinate basis gives lengths and angles in <Tex>{'T_pM'}</Tex>; the purple ring is the metric circle <Tex>{'\\{W:g(W,W)=g(V,V)\\}'}</Tex>; it is round in space because g is induced by the embedding.</p>
      </div>

      <h2>Vector V</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {[0, 1].map((i) => (
          <label key={i} className="field" style={{ marginBottom: 0 }}>
            <span><Tex>{`V^{${names[i]}}`}</Tex></span>
            <input {...numInput} value={Number(fmt(vector[i], 3))} onChange={(e) => setV(i as 0 | 1, e.target.value)} />
          </label>
        ))}
      </div>
      <div className="readout">
        <span><Tex>{'g_{ij}V^iV^j'}</Tex></span><span>{fmt(r.gVV, 4)}</span>
        <span><Tex>{'|V|^2_{\\mathbb{R}^3}'}</Tex></span><span>{fmt(r.euc, 4)}</span>
      </div>
      <p>The two numbers agree because the metric is the pull-back of the Euclidean dot product: <Tex>{'g(V,V)=|dr(V)|^2'}</Tex>.</p>
    </div>
  );
}
