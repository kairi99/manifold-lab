import { richSvg } from './Tex';
import { age, angularDiameterDistance, cosmicTime, type CosmoParams } from '../math/cosmology';

const W = 360, H = 190, ML = 42, MR = 10, MT = 10, MB = 30;
interface Mark { x: number; y: number; label: string; color?: string }

function Plot({ pts, marks, xr, yr, xlab, ylab, xlog = false, title, xt, yt }: {
  pts: [number, number][]; marks: Mark[]; xr: [number, number]; yr: [number, number]; xlab: string; ylab: string; xlog?: boolean; title: string; xt: number[]; yt: number[];
}) {
  const fx = (v: number) => (xlog ? Math.log10(v) : v), [x0, x1] = xr.map(fx);
  const X = (v: number) => ML + ((fx(v) - x0) / (x1 - x0)) * (W - ML - MR);
  const Y = (v: number) => MT + (1 - (v - yr[0]) / (yr[1] - yr[0])) * (H - MT - MB);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title} style={{ display: 'block', maxWidth: '100%' }}>
      <title>{title}</title>
      <rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB} style={{ fill: 'none', stroke: 'var(--border)' }} />
      {xt.map((v) => <text key={`x${v}`} x={X(v)} y={H - MB + 13} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>{v}</text>)}
      {yt.map((v) => <text key={`y${v}`} x={ML - 4} y={Y(v) + 3} textAnchor="end" fontSize="10" style={{ fill: 'var(--muted)' }}>{v}</text>)}
      <text x={(ML + W - MR) / 2} y={H - 3} textAnchor="middle" fontSize="11" style={{ fill: 'var(--fg)' }}>{richSvg(xlab)}</text>
      <text x={4} y={MT + 8} fontSize="11" style={{ fill: 'var(--fg)' }}>{richSvg(ylab)}</text>
      <path d={d} style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 1.8 }} />
      {marks.map((m) => (
        <g key={m.label}>
          <circle cx={X(m.x)} cy={Y(m.y)} r="4" style={{ fill: m.color ?? '#ffd24a' }} />
          <text x={X(m.x) + (X(m.x) > W - 110 ? -7 : 7)} y={Y(m.y) - 6} textAnchor={X(m.x) > W - 110 ? 'end' : 'start'} fontSize="10" style={{ fill: 'var(--fg)' }}>{m.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Scale factor against cosmic time, with today and the selected object's emission event marked. */
export function ScaleFactorPlot({ p, z }: { p: CosmoParams; z: number }) {
  const t0 = age(0, p), tMax = 2 * t0;
  const as = Array.from({ length: 70 }, (_, i) => 1e-3 * 4000 ** (i / 69)).filter((a) => cosmicTime(a, p) <= tMax);
  const pts = as.map((a): [number, number] => [cosmicTime(a, p), a]);
  const aMax = Math.max(1.2, ...pts.map((q) => q[1]));
  const te = age(z, p);
  return <Plot title={`Scale factor against cosmic time: a = 1 at t = ${t0.toFixed(2)} Gyr; emission at t = ${te.toFixed(3)} Gyr, a = ${(1 / (1 + z)).toFixed(4)}`}
    pts={pts} xr={[0, tMax]} yr={[0, aMax]} xlab="cosmic time t (Gyr)" ylab="a(t)" xt={[0, Math.round(t0), Math.round(tMax)]} yt={[0, 1]}
    marks={[{ x: t0, y: 1, label: 'now' }, { x: te, y: 1 / (1 + z), label: 'emission', color: '#ff4fd8' }]} />;
}

/** D_A(z) on a log redshift axis; the maximum is marked (distant objects look bigger beyond it). */
export function AngularDiameterPlot({ p, z }: { p: CosmoParams; z: number }) {
  const zs = Array.from({ length: 70 }, (_, i) => 0.01 * 1.2e5 ** (i / 69));
  const da = zs.map((q) => angularDiameterDistance(q, p));
  let k = 0; da.forEach((v, i) => { if (v > da[k]) k = i; });
  const yMax = Math.ceil(da[k] / 1000) * 1000;
  return <Plot title={`Angular diameter distance against redshift: maximum ${da[k].toFixed(0)} Mpc at z = ${zs[k].toFixed(2)}`}
    pts={zs.map((q, i): [number, number] => [q, da[i]])} xr={[0.01, 1200]} yr={[0, yMax]} xlog xlab="redshift z (log)" ylab="D_A (Mpc)" xt={[0.01, 0.1, 1, 10, 100, 1000]} yt={[0, yMax / 2, yMax]}
    marks={[{ x: zs[k], y: da[k], label: `max z=${zs[k].toFixed(2)}` }, { x: Math.max(0.01, z), y: angularDiameterDistance(z, p), label: 'object', color: '#ff4fd8' }]} />;
}
