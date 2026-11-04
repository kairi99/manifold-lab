import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getSurface, innerProduct, toWorld } from '../math';
import type { Vec2, Vec3 } from '../math/types';
import { useStore } from '../state/store';
import { T, useTr } from '../i18n';
import SurfaceMesh from '../scene/SurfaceMesh';
import DraggablePoint from '../scene/DraggablePoint';
import TangentPlane from '../scene/TangentPlane';
import VectorArrow from '../scene/VectorArrow';
import { Tex, fmt } from '../panels/Tex';
import { PAL } from '../theme/palette';
import { SurfacePicker } from '../panels/SurfacePicker';
import { Derivation } from '../panels/Derivation';

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
      <Line points={circle} color={PAL.metric} lineWidth={2} />
      <VectorArrow surface={surface} uv={uv} V={vector} editable onChange={(V) => set({ vector: V })} />
      <DraggablePoint surface={surface} uv={uv} onChange={(q) => set({ uv: q })} />
    </group>
  );
}

/** Checkbox + note for Einstein's summation convention; state lives in the store so Metric and Transport share it. */
export function SumsToggle() {
  const t = useTr();
  const on = useStore((s) => s.expandSums);
  const set = useStore((s) => s.set);
  return (
    <div className="field">
      <label>
        <input type="checkbox" checked={on} onChange={(e) => set({ expandSums: e.target.checked })} /> {t('Write sums out', 'Escribir las sumas')}
      </label>
      <p role="note" style={{ fontSize: 12 }}><T
        en={<>Einstein's convention: an index repeated once up and once down is summed over its values (here 1, 2).</>}
        es={<>Convenio de Einstein: un índice repetido una vez arriba y una vez abajo se suma sobre sus valores (aquí 1, 2).</>} /></p>
    </div>
  );
}

const hl = (k: string, s: string) => `\\htmlClass{hl-${k}}{${s}}`;

const mat = (m: number[][]) =>
  `\\begin{pmatrix}${m.map((r) => r.map((x) => fmt(x)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;

export function MetricPanel() {
  const surfaceId = useStore((s) => s.surfaceId);
  const uv = useStore((s) => s.uv);
  const vector = useStore((s) => s.vector);
  const set = useStore((s) => s.set);
  const surface = getSurface(surfaceId);
  const [cu, cv] = surface.coords;
  const expand = useStore((s) => s.expandSums);

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
      <h2><T en="Parametrization" es="Parametrización" /></h2>
      <p><T
        en={<>The surface is an embedding <Tex>{'r:U\\subset\\mathbb{R}^2\\to\\mathbb{R}^3'}</Tex>; its tangent space at p is spanned by the coordinate vectors <Tex>{'\\partial_i r'}</Tex>.</>}
        es={<>La superficie es una inmersión <Tex>{'r:U\\subset\\mathbb{R}^2\\to\\mathbb{R}^3'}</Tex>; su espacio tangente en p está generado por los vectores coordenados <Tex>{'\\partial_i r'}</Tex>.</>} /></p>
      <Tex block>{surface.latex.param}</Tex>
      <h2><T en="Metric" es="Métrica" /></h2>
      <p><T
        en={<>The metric <Tex>{String.raw`\htmlClass{hl-g}{g_{ij}}=\partial_i r\cdot\partial_j r`}</Tex> is the pull-back of the Euclidean dot product to the parameter domain.</>}
        es={<>La métrica <Tex>{String.raw`\htmlClass{hl-g}{g_{ij}}=\partial_i r\cdot\partial_j r`}</Tex> es el pull-back (la imagen recíproca) del producto escalar euclídeo al dominio de parámetros.</>} /></p>
      <Tex block>{surface.latex.metric}</Tex>
      <h2><T en="Christoffel symbols" es="Símbolos de Christoffel" /></h2>
      <p><T
        en={<>The Levi-Civita connection coefficients <Tex>{'\\Gamma^k_{ij}=\\tfrac12 g^{kl}(\\partial_i g_{jl}+\\partial_j g_{il}-\\partial_l g_{ij})'}</Tex> are determined by g alone.</>}
        es={<>Los coeficientes de la conexión de Levi-Civita <Tex>{'\\Gamma^k_{ij}=\\tfrac12 g^{kl}(\\partial_i g_{jl}+\\partial_j g_{il}-\\partial_l g_{ij})'}</Tex> quedan determinados únicamente por g.</>} /></p>
      <Tex block>{surface.latex.christoffel}</Tex>
      <Derivation surface={surface} uv={uv} />

      <div data-tour="metric-readout">
        <h2><T en="At p" es="En p" /></h2>
        <p><T en="Coordinates" es="Coordenadas" /> <Tex>{`(${cu},${cv})`}</Tex> = ({fmt(uv[0])}, {fmt(uv[1])}).</p>
        <Tex block>{`g_{ij}=${mat(r.g)}`}</Tex>
        <div className="readout">
          <span><Tex>{'\\det g'}</Tex></span><span>{fmt(r.det, 4)}</span>
          <span><Tex>{`|${hl('du', `\\partial_{${cu}}`)}|=\\sqrt{g_{11}}`}</Tex></span><span>{fmt(r.lu)}</span>
          <span><Tex>{`|${hl('dv', `\\partial_{${cv}}`)}|=\\sqrt{g_{22}}`}</Tex></span><span>{fmt(r.lv)}</span>
          <span><T en="angle" es="ángulo" />(∂₁,∂₂)</span><span>{fmt(r.angle, 2)}°</span>
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
        <p><T
          en={<>The Gram matrix of the coordinate basis gives lengths and angles in <Tex>{'T_pM'}</Tex>; the purple ring is the metric circle <Tex>{'\\{W:g(W,W)=g(V,V)\\}'}</Tex>; it is round in space because g is induced by the embedding.</>}
          es={<>La matriz de Gram de la base coordenada da longitudes y ángulos en <Tex>{'T_pM'}</Tex>; el anillo morado es el círculo métrico <Tex>{'\\{W:g(W,W)=g(V,V)\\}'}</Tex>; es redondo en el espacio porque g está inducida por la inmersión.</>} /></p>
      </div>

      <h2><T en="Vector V" es="Vector V" /></h2>
      <SumsToggle />
      <Tex block>{expand
        ? `${hl('V', 'V')}=${hl('V', 'V^1')}${hl('du', '\\partial_1')}+${hl('V', 'V^2')}${hl('dv', '\\partial_2')}`
        : `${hl('V', 'V')}=${hl('V', 'V^i')}\\partial_i`}</Tex>
      <Tex block>{expand
        ? `${hl('g', 'g_{11}')}=\\partial_1\\cdot\\partial_1,\\quad ${hl('g', 'g_{12}')}=\\partial_1\\cdot\\partial_2,\\quad ${hl('g', 'g_{22}')}=\\partial_2\\cdot\\partial_2`
        : `${hl('g', 'g_{ij}')}=\\partial_i\\cdot\\partial_j`}</Tex>
      <Tex block>{expand
        ? `|V|^2=${hl('g', 'g_{11}')}V^1V^1+2${hl('g', 'g_{12}')}V^1V^2+${hl('g', 'g_{22}')}V^2V^2`
        : `|V|^2=${hl('g', 'g_{ij}')}V^iV^j`}</Tex>
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
      <p><T
        en={<>The two numbers agree because the metric is the pull-back of the Euclidean dot product: <Tex>{'g(V,V)=|dr(V)|^2'}</Tex>.</>}
        es={<>Los dos números coinciden porque la métrica es el pull-back del producto escalar euclídeo: <Tex>{'g(V,V)=|dr(V)|^2'}</Tex>.</>} /></p>
    </div>
  );
}
