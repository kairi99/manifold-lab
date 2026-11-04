import { richSvg } from './Tex';
import { useTr } from '../i18n';
import { Veff } from '../math/schwarzschild';

export interface PotentialPlotProps {
  L: number;
  E2: number; // E² level
  kind: 'timelike' | 'null';
  /** largest r shown (M) */
  rMax?: number;
}

const W = 360, H = 210, ML = 38, MR = 10, MT = 12, MB = 30;
const MARKS: [number, string][] = [[2, 'r_s'], [3, '3M'], [4, '4M'], [6, '6M']];
const N = 400;

/** V_eff(r) for the given L with the E² level, forbidden region (V > E²) shaded and turning points marked. */
export function PotentialPlot({ L, E2, kind, rMax = 30 }: PotentialPlotProps) {
  const t = useTr();
  const r0 = 2;
  const rs = Array.from({ length: N + 1 }, (_, i) => r0 + ((rMax - r0) * i) / N);
  const vs = rs.map((r) => Veff(r, L, kind));
  const vTop = Math.max(...vs.filter((_, i) => rs[i] > 2.3));
  const yMax = Math.max(E2 * 1.15, Math.min(vTop * 1.05, E2 * 1.8), 0.05);
  const x = (r: number) => ML + ((r - r0) / (rMax - r0)) * (W - ML - MR);
  const y = (v: number) => MT + (1 - Math.min(Math.max(v, 0), yMax) / yMax) * (H - MT - MB);

  const curve = rs.map((r, i) => `${i ? 'L' : 'M'}${x(r).toFixed(1)},${y(vs[i]).toFixed(1)}`).join('');
  // forbidden: polygons between the E² line and the curve where V > E²
  const forb: string[] = [];
  for (let i = 0; i <= N; ) {
    if (vs[i] <= E2) { i++; continue; }
    let j = i;
    while (j + 1 <= N && vs[j + 1] > E2) j++;
    const top = rs.slice(i, j + 1).map((r, k) => `${x(r).toFixed(1)},${y(vs[i + k]).toFixed(1)}`);
    forb.push(`M${x(rs[i]).toFixed(1)},${y(E2).toFixed(1)}L${top.join('L')}L${x(rs[j]).toFixed(1)},${y(E2).toFixed(1)}Z`);
    i = j + 1;
  }
  const turning: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = vs[i] - E2, b = vs[i + 1] - E2;
    if (a * b < 0) turning.push(rs[i] + ((rs[i + 1] - rs[i]) * a) / (a - b));
  }
  const rt = Array.from({ length: 5 }, (_, k) => Math.round((r0 + ((rMax - r0) * k) / 4) * 10) / 10);
  const vt = [0, 0.5, 1].map((f) => f * yMax);
  const tp = turning.map((x) => x.toFixed(2)).join(', ');
  const label = t(`Effective potential for ${kind === 'null' ? 'light' : 'a massive particle'} with L = ${L.toFixed(3)} M, E squared = ${E2.toFixed(4)}; turning points at r = ${tp || 'none'} M`,
    `Potencial efectivo para ${kind === 'null' ? 'la luz' : 'una partícula masiva'} con L = ${L.toFixed(3)} M, E al cuadrado = ${E2.toFixed(4)}; puntos de retorno en r = ${tp || 'ninguno'} M`);
  const s = (c: string) => ({ stroke: c, fill: 'none' });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxWidth: '100%' }}>
      <title>{label}</title>
      <rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB} style={{ fill: 'none', stroke: 'var(--border)' }} />
      {forb.map((d, i) => <path key={i} d={d} style={{ fill: 'var(--muted)', fillOpacity: 0.3, stroke: 'none' }} />)}
      {MARKS.filter(([r]) => r < rMax).map(([r, t]) => (
        <g key={t}>
          <line x1={x(r)} x2={x(r)} y1={MT} y2={H - MB} strokeDasharray="3 3" style={s('var(--muted)')} />
          <text x={x(r)} y={MT + 9} fontSize="9" textAnchor="middle" style={{ fill: 'var(--muted)' }}>{richSvg(t)}</text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(E2)} y2={y(E2)} strokeWidth="1.2" style={s('#ffd166')} />
      <text x={W - MR - 2} y={y(E2) - 3} fontSize="10" textAnchor="end" style={{ fill: '#ffd166' }}>E²</text>
      <path d={curve} strokeWidth="2" style={s('var(--accent)')} />
      {turning.map((t, i) => <circle key={i} cx={x(t)} cy={y(E2)} r="3.5" style={{ fill: '#ff6bd6' }} />)}
      {rt.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={H - MB} y2={H - MB + 4} style={s('var(--muted)')} />
          <text x={x(t)} y={H - MB + 14} fontSize="10" textAnchor="middle" style={{ fill: 'var(--fg)' }}>{t}</text>
        </g>
      ))}
      {vt.map((t) => (
        <g key={t}>
          <line x1={ML - 4} x2={ML} y1={y(t)} y2={y(t)} style={s('var(--muted)')} />
          <text x={ML - 6} y={y(t) + 3} fontSize="10" textAnchor="end" style={{ fill: 'var(--fg)' }}>{t.toFixed(2)}</text>
        </g>
      ))}
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize="10" textAnchor="middle" style={{ fill: 'var(--muted)' }}>r / M</text>
      <text x={10} y={(MT + H - MB) / 2} fontSize="10" textAnchor="middle" transform={`rotate(-90 10 ${(MT + H - MB) / 2})`} style={{ fill: 'var(--muted)' }}>{richSvg('V_eff')}</text>
    </svg>
  );
}
