import { richSvg } from './Tex';
import { GW150914_H1 as H1, GW150914_L1 as L1, GW150914_H1_TEMPLATE as TPL } from '../data/gw150914';
import { T0, T1 } from './GWModel';

const W = 360, ML = 34, MR = 8, RH = 100, GAP = 14, MT = 8, MB = 26, H = MT + 2 * RH + GAP + MB;
export const L1_SHIFT = 0.0069; // s: L1 arrives ~6.9 ms before H1

/** Row 1: measured H1 with the NR template. Row 2: H1 and L1 (L1 shifted +6.9 ms and inverted as in PRL Fig. 1, unless raw). Playhead at time `t`. */
export function GWPlot({ t, rawL1 }: { t: number; rawL1: boolean }) {
  const x = (v: number) => ML + ((v - T0) / (T1 - T0)) * (W - ML - MR);
  const rowTop = (r: number) => MT + r * (RH + GAP);
  const Y = 1.3; // ±1.3e-21
  const y = (r: number, v: number) => rowTop(r) + RH / 2 - (Math.max(-Y, Math.min(Y, v)) / Y) * (RH / 2);
  const path = (r: number, ts: number[], hs: number[], sh = 0, sg = 1, step = 2) =>
    ts.filter((_, i) => i % step === 0).map((tt, k) => `${k ? 'L' : 'M'}${x(tt + sh).toFixed(1)},${y(r, sg * hs[k * step]).toFixed(1)}`).join('');
  const label = `GW150914 strain in units of 1e-21 over ${T0.toFixed(2)} to ${T1.toFixed(2)} s relative to merger. Top: measured Hanford strain and the numerical-relativity template. Bottom: Hanford and Livingston measured strain${rawL1 ? ' (Livingston as recorded, arriving 6.9 ms earlier)' : ' (Livingston shifted by 6.9 ms and inverted as in the LIGO paper)'}. Playhead at ${t.toFixed(3)} s.`;
  const ticks = [-0.15, -0.1, -0.05, 0, 0.05].filter((v) => v >= T0 && v <= T1);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxWidth: '100%' }}>
        <title>{label}</title>
        {[0, 1].map((r) => (
          <g key={r}>
            <rect x={ML} y={rowTop(r)} width={W - ML - MR} height={RH} style={{ fill: 'none', stroke: 'var(--border)' }} />
            <line x1={ML} x2={W - MR} y1={y(r, 0)} y2={y(r, 0)} style={{ stroke: 'var(--border)' }} />
            {[-1, 0, 1].map((v) => <text key={v} x={ML - 4} y={y(r, v) + 3} fontSize="9" textAnchor="end" style={{ fill: 'var(--fg)' }}>{v}</text>)}
          </g>
        ))}
        <text x={9} y={rowTop(0) + RH / 2} fontSize="9" textAnchor="middle" transform={`rotate(-90 9 ${rowTop(0) + RH / 2})`} style={{ fill: 'var(--muted)' }}>h / 1e-21</text>
        <path d={path(0, TPL.t, TPL.h, 0, 1, 2)} fill="none" strokeWidth="1.6" strokeDasharray="4 2" style={{ stroke: '#ff6bd6' }} />
        <path d={path(0, H1.t, H1.h)} fill="none" strokeWidth="1.2" style={{ stroke: '#6cb6ff' }} />
        <path d={path(1, H1.t, H1.h)} fill="none" strokeWidth="1.2" style={{ stroke: '#6cb6ff' }} />
        <path d={path(1, L1.t, L1.h, rawL1 ? 0 : L1_SHIFT, rawL1 ? 1 : -1)} fill="none" strokeWidth="1.2" style={{ stroke: '#ffa94d' }} />
        {[0, 1].map((r) => <line key={r} x1={x(t)} x2={x(t)} y1={rowTop(r)} y2={rowTop(r) + RH} strokeWidth="1.5" style={{ stroke: 'var(--fg)' }} />)}
        {ticks.map((v) => <text key={v} x={x(v)} y={H - MB + 12} fontSize="9" textAnchor="middle" style={{ fill: 'var(--fg)' }}>{v}</text>)}
        <text x={(ML + W - MR) / 2} y={H - 3} fontSize="9" textAnchor="middle" style={{ fill: 'var(--muted)' }}>{richSvg('t − t_merger (s)')}</text>
        <text x={ML + 4} y={rowTop(0) + 10} fontSize="9" style={{ fill: '#6cb6ff' }}>H1 measured</text>
        <text x={ML + 70} y={rowTop(0) + 10} fontSize="9" style={{ fill: '#ff6bd6' }}>NR template (model)</text>
        <text x={ML + 4} y={rowTop(1) + 10} fontSize="9" style={{ fill: '#6cb6ff' }}>H1</text>
        <text x={ML + 24} y={rowTop(1) + 10} fontSize="9" style={{ fill: '#ffa94d' }}>{rawL1 ? 'L1 as recorded' : 'L1 shifted +6.9 ms, inverted'}</text>
      </svg>
    </>
  );
}

/** f(t) of the illustrative chirp. */
export function ChirpPlot({ f, t }: { f: (t: number) => number; t: number }) {
  const w = 360, h = 130, ml = 34, mr = 8, mt = 8, mb = 24, N = 80, ts = Array.from({ length: N + 1 }, (_, i) => T0 + ((T1 - T0) * i) / N);
  const fs = ts.map(f), fmax = 400;
  const x = (v: number) => ml + ((v - T0) / (T1 - T0)) * (w - ml - mr), y = (v: number) => mt + (1 - Math.min(v, fmax) / fmax) * (h - mt - mb);
  const label = `Illustrative gravitational-wave frequency versus time: rising from ${fs[0].toFixed(0)} Hz to ${Math.max(...fs).toFixed(0)} Hz at the merger, then constant at the ringdown frequency.`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxWidth: '100%' }}>
      <title>{label}</title>
      <rect x={ml} y={mt} width={w - ml - mr} height={h - mt - mb} style={{ fill: 'none', stroke: 'var(--border)' }} />
      <path d={ts.map((tt, i) => `${i ? 'L' : 'M'}${x(tt).toFixed(1)},${y(fs[i]).toFixed(1)}`).join('')} fill="none" strokeWidth="2" style={{ stroke: 'var(--accent)' }} />
      <line x1={x(t)} x2={x(t)} y1={mt} y2={h - mb} strokeWidth="1.5" style={{ stroke: 'var(--fg)' }} />
      {[0, 100, 200, 300, 400].map((v) => <text key={v} x={ml - 4} y={y(v) + 3} fontSize="9" textAnchor="end" style={{ fill: 'var(--fg)' }}>{v}</text>)}
      {[-0.15, -0.1, -0.05, 0].map((v) => <text key={v} x={x(v)} y={h - mb + 11} fontSize="9" textAnchor="middle" style={{ fill: 'var(--fg)' }}>{v}</text>)}
      <text x={(ml + w - mr) / 2} y={h - 2} fontSize="9" textAnchor="middle" style={{ fill: 'var(--muted)' }}>{richSvg('t − t_merger (s); f in Hz')}</text>
    </svg>
  );
}
