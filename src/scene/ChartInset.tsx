import { useMemo, useRef } from 'react';
import { getSurface } from '../math';
import { curvatureRange } from '../math/curvature';
import { chartSingular, tissotPoints } from '../math/tissot';
import type { Surface, Vec2 } from '../math/types';
import { useStore } from '../state/store';
import { useTr } from '../i18n';
import { PAL } from '../theme/palette';
import { coordText, fmt } from '../panels/Tex';
import { clampWrap } from './geom';
import { constantK, curvatureColor } from './CurvatureMesh';
import { revealCount, useGeoFan } from './GeodesicFan';
import { useFieldSel } from './FieldScene';
import { useTransportData } from './TransportPath';
import './chartInset.css';

// viewBox 220x220; plot rect inside leaves room for tick labels
const X0 = 34, Y0 = 8, W = 176, H = 176, NLINES = 12, TN = 6, HN = 24;

type Pt = [number, number];
type Px = (uv: Vec2) => Pt;
const f1 = (n: number) => n.toFixed(1);
const poly = (pts: Pt[]) => pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');

/** Split a chart polyline where it jumps across the domain (periodic wrap / pole chart-wrap). */
function strokes(s: Surface, uvs: Vec2[], px: Px): Pt[][] {
  const { u, v } = s.domain, ju = (u[1] - u[0]) / 2, jv = (v[1] - v[0]) / 2;
  const out: Pt[][] = [[]];
  uvs.forEach((q, i) => {
    if (i && (Math.abs(q[0] - uvs[i - 1][0]) > ju || Math.abs(q[1] - uvs[i - 1][1]) > jv)) out.push([]);
    out[out.length - 1].push(px(q));
  });
  return out.filter((l) => l.length > 1);
}

function Arrow({ x, y, dx, dy, color, max = 52, w = 2, dashed }: { x: number; y: number; dx: number; dy: number; color: string; max?: number; w?: number; dashed?: boolean }) {
  const L = Math.hypot(dx, dy);
  if (!(L > 1e-6)) return null;
  const k = L > max ? max / L : 1, ex = x + dx * k, ey = y + dy * k, ux = dx / L, uy = dy / L;
  const h = Math.min(6, L * k * 0.5);
  return (
    <g stroke={color} fill={color} strokeWidth={w} strokeLinecap="round">
      <line x1={x} y1={y} x2={ex} y2={ey} strokeDasharray={dashed ? '3 2' : undefined} />
      <polygon points={`${f1(ex)},${f1(ey)} ${f1(ex - h * ux + h * 0.5 * uy)},${f1(ey - h * uy - h * 0.5 * ux)} ${f1(ex - h * ux - h * 0.5 * uy)},${f1(ey - h * uy + h * 0.5 * ux)}`} stroke="none" />
    </g>
  );
}

/** Per-surface static layers (heatmap, Tissot ellipses, singular lines): rebuilt only when the surface changes. */
function useChartGeometry(s: Surface) {
  return useMemo(() => {
    const { u: [u0, u1], v: [v0, v1] } = s.domain;
    const sx = W / (u1 - u0), sy = H / (v1 - v0);
    const px: Px = ([u, v]) => [X0 + (u - u0) * sx, Y0 + H - (v - v0) * sy];
    const at = (i: number, n: number, a: number, b: number) => a + ((i + 0.5) / n) * (b - a);

    // Tissot: one eps for all nodes, from a low percentile of the per-node "fits its cell" limit
    const nodes: { uv: Vec2; g: ReturnType<Surface['metric']> }[] = [];
    const lims: number[] = [];
    for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) {
      const uv: Vec2 = [at(i, TN, u0, u1), at(j, TN, v0, v1)];
      if (chartSingular(s, uv[0], uv[1])) continue;
      const g = s.metric(uv[0], uv[1]), d = g[0][0] * g[1][1] - g[0][1] ** 2;
      const hu = Math.sqrt(g[1][1] / d), hv = Math.sqrt(g[0][0] / d); // half-extent per unit eps: sqrt(g^uu), sqrt(g^vv)
      lims.push(Math.min((0.42 * W) / TN / (sx * hu), (0.42 * H) / TN / (sy * hv)));
      nodes.push({ uv, g });
    }
    lims.sort((a, b) => a - b);
    const eps = lims.length ? lims[Math.floor(lims.length * 0.25)] : 0.1;
    const tissot = nodes.map(({ uv, g }) => poly(tissotPoints(g, eps, 28).map((w) => px([uv[0] + w[0], uv[1] + w[1]]))));

    // K heatmap
    const r = curvatureRange(s), sc = Math.max(Math.abs(r.min), Math.abs(r.max), 1e-12);
    const heat: { x: number; y: number; c: string }[] = [];
    for (let j = 0; j < HN; j++) for (let i = 0; i < HN; i++) {
      const u = at(i, HN, u0, u1), v = at(j, HN, v0, v1), K = s.gaussK(u, v);
      const c = constantK(r) ? curvatureColor(Math.abs(r.max) < 1e-9 ? 0 : r.max > 0 ? 1 : -1, 1.6) : curvatureColor(Number.isFinite(K) ? K : 0, sc);
      const [x, y] = px([u, v]);
      heat.push({ x: x - W / HN / 2, y: y - H / HN / 2, c: c.getStyle() });
    }

    // grid like the 3D mesh
    const gridU = Array.from({ length: NLINES }, (_, k) => X0 + ((k + 0.5) / NLINES) * W);
    const gridV = Array.from({ length: NLINES }, (_, k) => Y0 + ((k + 0.5) / NLINES) * H);

    // singular edges (e.g. sphere poles) and stray interior points
    const edge = (f: (t: number) => Vec2) => Array.from({ length: 11 }, (_, i) => chartSingular(s, ...f(i / 10))).filter(Boolean).length >= 8;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const edges: { a: Pt; b: Pt }[] = [];
    if (edge((t) => [u0, lerp(v0, v1, t)])) edges.push({ a: px([u0, v0]), b: px([u0, v1]) });
    if (edge((t) => [u1, lerp(v0, v1, t)])) edges.push({ a: px([u1, v0]), b: px([u1, v1]) });
    if (edge((t) => [lerp(u0, u1, t), v0])) edges.push({ a: px([u0, v0]), b: px([u1, v0]) });
    if (edge((t) => [lerp(u0, u1, t), v1])) edges.push({ a: px([u0, v1]), b: px([u1, v1]) });
    const dots: Pt[] = [];
    if (s.singularAt && !edges.length) for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
      const u = at(i, 20, u0, u1), v = at(j, 20, v0, v1);
      if (s.singularAt(u, v)) dots.push(px([u, v]));
    }
    return { px, sx, sy, eps, tissot, heat, gridU, gridV, edges, dots };
  }, [s]);
}

export default function ChartInset() {
  const t = useTr();
  const { surfaceId, customSpec, chartOpen, module, uv, vector, set, curvShow } = useStore();
  const showHeat = module === 'curvature' && curvShow.heatmap;
  void customSpec; // re-render + memo key when the custom surface changes
  const s = getSurface(surfaceId);
  const geo = useChartGeometry(s);
  const { px, sx, sy } = geo;
  const svg = useRef<SVGSVGElement>(null);
  const [cu, cv] = s.coords.map(coordText);
  const { u: [u0, u1], v: [v0, v1], periodicU, periodicV } = s.domain;

  const move = (e: React.PointerEvent) => {
    const el = svg.current;
    if (!el || !(e.buttons & 1 || e.type === 'pointerdown')) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 220, y = ((e.clientY - r.top) / r.height) * 220;
    set({ uv: clampWrap(s, u0 + ((x - X0) / W) * (u1 - u0), v0 + ((H - (y - Y0)) / H) * (v1 - v0)) });
  };

  const p = px(uv), vp = { dx: vector[0] * sx, dy: -vector[1] * sy };
  const ticks = [0, 0.5, 1];
  
  return (
    <section className="chart-inset" aria-label={t('Chart of the parameter domain', 'Carta del dominio de parámetros')}>
      <div className="chart-inset-head">
        <b>{t(`Chart (${cu}, ${cv})`, `Carta (${cu}, ${cv})`)}</b>
        <button type="button" aria-expanded={chartOpen} aria-controls="chart-inset-body" onClick={() => set({ chartOpen: !chartOpen })}>
          {chartOpen ? t('Hide', 'Ocultar') : t('Show', 'Mostrar')}
        </button>
      </div>
      {chartOpen && (
        <div id="chart-inset-body">
          <svg ref={svg} viewBox="0 0 220 220" role="img" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move}
            aria-label={t(`Flat chart: ${cu} horizontal, ${cv} vertical`, `Carta plana: ${cu} horizontal, ${cv} vertical`)}>
            <defs><clipPath id="ci-clip"><rect x={X0} y={Y0} width={W} height={H} /></clipPath></defs>
            {showHeat && (
              <g clipPath="url(#ci-clip)" opacity={0.7}>
                {geo.heat.map((c, i) => <rect key={i} x={f1(c.x)} y={f1(c.y)} width={W / HN + 0.4} height={H / HN + 0.4} fill={c.c} />)}
              </g>
            )}
            <rect className="ci-box" x={X0} y={Y0} width={W} height={H} />
            <g className="ci-grid">
              {geo.gridU.map((x, i) => <line key={'u' + i} x1={x} x2={x} y1={Y0} y2={Y0 + H} />)}
              {geo.gridV.map((y, i) => <line key={'v' + i} y1={y} y2={y} x1={X0} x2={X0 + W} />)}
            </g>
            {ticks.map((a) => (
              <g key={a} className="ci-ax">
                <text x={X0 + a * W} y={Y0 + H + 10} textAnchor="middle">{fmt(u0 + a * (u1 - u0), 2)}</text>
                <text x={X0 - 3} y={Y0 + H - a * H + 3} textAnchor="end">{fmt(v0 + a * (v1 - v0), 2)}</text>
              </g>
            ))}
            <text className="ci-ax" x={X0 + W / 2} y={Y0 + H + 21} textAnchor="middle">{cu}{periodicU ? t('  ↔ wraps', '  ↔ se envuelve') : ''}</text>
            <text className="ci-ax" transform={`translate(8 ${Y0 + H / 2}) rotate(-90)`} textAnchor="middle">{cv}{periodicV ? t('  ↔ wraps', '  ↔ se envuelve') : ''}</text>
            {periodicU && [0, 1].map((k) => <line key={'pu' + k} x1={X0 + k * W} x2={X0 + k * W} y1={Y0} y2={Y0 + H} stroke={PAL.path} strokeWidth={2} strokeDasharray="1 4" />)}
            {periodicV && [0, 1].map((k) => <line key={'pv' + k} y1={Y0 + k * H} y2={Y0 + k * H} x1={X0} x2={X0 + W} stroke={PAL.path} strokeWidth={2} strokeDasharray="1 4" />)}

            <g clipPath="url(#ci-clip)">
              {geo.tissot.map((pts, i) => <polygon key={i} points={pts} fill={PAL.metric} fillOpacity={0.18} stroke={PAL.metric} strokeWidth={0.8} />)}
              <PLayer s={s} eps={geo.eps} px={px} uv={uv} />
              <ModuleLayer s={s} px={px} sx={sx} sy={sy} />
            </g>

            {geo.edges.map((e, i) => (
              <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.b[0]} y2={e.b[1]} stroke={PAL.warn} strokeWidth={2} strokeDasharray="5 3">
                <title>{t('coordinates break down here', 'las coordenadas fallan aquí')}</title>
              </line>
            ))}
            {geo.dots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={1.5} fill={PAL.warn}><title>{t('coordinates break down here', 'las coordenadas fallan aquí')}</title></circle>)}

            {module !== 'transport' && <Arrow x={p[0]} y={p[1]} dx={vp.dx} dy={vp.dy} color={PAL.V} />}
            <Arrow x={p[0]} y={p[1]} dx={22} dy={0} color={PAL.du} w={1.5} />
            <Arrow x={p[0]} y={p[1]} dx={0} dy={-22} color={PAL.dv} w={1.5} />
            <circle cx={p[0]} cy={p[1]} r={4.5} fill={PAL.p} stroke="#000" strokeWidth={0.8} style={{ cursor: 'grab' }}>
              <title>p = ({fmt(uv[0], 2)}, {fmt(uv[1], 2)})</title>
            </circle>
          </svg>
          <p className="ci-cap">
            {t('Drag p. Lengths here are coordinate lengths, not true lengths: the ellipses show the true unit circle.',
              'Arrastra p. Aquí las longitudes son de coordenadas, no reales: las elipses muestran el verdadero círculo unidad.')}
            {(geo.edges.length > 0 || geo.dots.length > 0) && <> <span style={{ color: PAL.warn }}>{t('Dashed: coordinates break down here.', 'Discontinua: las coordenadas fallan aquí.')}</span></>}
          </p>
        </div>
      )}
    </section>
  );
}

/** The larger Tissot ellipse at p (cheap: one polygon per frame). */
function PLayer({ s, eps, px, uv }: { s: Surface; eps: number; px: Px; uv: Vec2 }) {
  if (chartSingular(s, uv[0], uv[1])) return null;
  const pts = tissotPoints(s.metric(uv[0], uv[1]), eps * 1.6, 40).map((w) => px([uv[0] + w[0], uv[1] + w[1]]));
  return <polygon points={poly(pts)} fill="none" stroke={PAL.metric} strokeWidth={1.8} />;
}

function ModuleLayer({ s, px, sx, sy }: { s: Surface; px: Px; sx: number; sy: number }) {
  const module = useStore((st) => st.module);
  if (module === 'transport') return <TransportLayer px={px} sx={sx} sy={sy} />;
  if (module === 'geodesics') return <GeodesicLayer px={px} />;
  if (module === 'fields') return <FieldLayer s={s} px={px} sx={sx} sy={sy} />;
  return null;
}

function TransportLayer({ px, sx, sy }: { px: Px; sx: number; sy: number }) {
  const { surface, curve, start, V0, samples } = useTransportData();
  const progress = useStore((st) => st.progress);
  const loop = useMemo(() => curve ? strokes(surface, Array.from({ length: 201 }, (_, i) => curve.point(i / 200)), px) : [], [curve, surface, px]);
  const q = samples?.[Math.round(progress * (samples.length - 1))];
  return (
    <g>
      {loop.map((l, i) => <polyline key={i} points={poly(l)} fill="none" stroke={PAL.path} strokeWidth={1.8} />)}
      {start && <Arrow x={px(start)[0]} y={px(start)[1]} dx={V0[0] * sx} dy={-V0[1] * sy} color={PAL.ghost} w={1.5} dashed />}
      {q && <Arrow x={px(q.uv)[0]} y={px(q.uv)[1]} dx={q.V[0] * sx} dy={-q.V[1] * sy} color={PAL.V} />}
    </g>
  );
}

function GeodesicLayer({ px }: { px: Px }) {
  const { surface, paths } = useGeoFan();
  const { geoProgress, geoLength, geoCount } = useStore();
  const target = geoProgress * geoLength;
  return (
    <g fill="none" strokeWidth={1.4}>
      {paths.map((pa, i) => {
        const uvs = pa.samples.slice(0, revealCount(pa, target)).map((q) => q.uv);
        const col = `hsl(${((0.55 + 0.45 * (geoCount === 1 ? 0 : i / (geoCount - 1))) * 360) % 360} 90% 62%)`;
        return strokes(surface, uvs, px).map((l, k) => <polyline key={i + '_' + k} points={poly(l)} stroke={col} />);
      })}
    </g>
  );
}

function FieldLayer({ s, px, sx, sy }: { s: Surface; px: Px; sx: number; sy: number }) {
  const { X } = useFieldSel();
  const arrows = useMemo(() => {
    const { u: [u0, u1], v: [v0, v1] } = s.domain, out: { p: Pt; d: Pt }[] = [];
    let max = 1e-12;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 10; i++) {
      const u = u0 + ((i + 0.5) / 10) * (u1 - u0), v = v0 + ((j + 0.5) / 8) * (v1 - v0);
      if (chartSingular(s, u, v)) continue;
      const c = X.X(u, v), d: Pt = [c[0] * sx, -c[1] * sy];
      if (!d.every(Number.isFinite)) continue;
      max = Math.max(max, Math.hypot(...d));
      out.push({ p: px([u, v]), d });
    }
    return out.map((a) => ({ p: a.p, d: [a.d[0] * (14 / max), a.d[1] * (14 / max)] as Pt }));
  }, [s, X, px, sx, sy]);
  return <g>{arrows.map((a, i) => <Arrow key={i} x={a.p[0]} y={a.p[1]} dx={a.d[0]} dy={a.d[1]} color={PAL.path} w={1.2} max={14} />)}</g>;
}
