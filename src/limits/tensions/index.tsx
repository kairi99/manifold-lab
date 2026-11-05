import { useEffect } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Seg, Note, Src } from '../../panels/SpacetimeUi';
import { Tex, fmt } from '../../panels/Tex';
import { useTr } from '../../i18n';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { DE_MEAS, H0_MEAS, OM_PLANCK, S8_MEAS, type DEMeas } from './data';
import { ageFlat, ageFlatNumeric, rhoDE, rhoDENumeric, tension, wCpl } from './math';
import { useTensions, type TensionMode } from './state';

const MODES = [['h0', 'Hubble tension', 'Tensión de Hubble'], ['s8', 'S₈', 'S₈'], ['de', 'Dark energy w₀–wₐ', 'Energía oscura w₀–wₐ']] as const;
const EARLY = PAL.dv, LATE = PAL.du;

interface Item { id: string; short: string; v: number; lo: number; hi: number; color: string; square: boolean }
const h0Items = (): Item[] => H0_MEAS.map((m) => ({ id: m.id, short: m.short, v: m.value, lo: m.value - m.minus, hi: m.value + m.plus, color: m.group === 'early' ? EARLY : LATE, square: m.group === 'late' }));
const s8Items = (): Item[] => S8_MEAS.map((m) => ({ id: m.id, short: m.short, v: m.value, lo: m.value - m.minus, hi: m.value + m.plus, color: m.group === 'cmb' ? EARLY : LATE, square: m.group === 'lensing' }));

// ---------- scene ----------
const X0 = -0.9, X1 = 1.3, RH = 0.14, LH = 0.07;
const lblW = (txt: string) => LH * ((26 * txt.length + 16) / 64);
/** 3D number line: one row per measurement (rows stacked downward), label at the left end, whisker clipped to the axis with an arrowhead. */
function NumberLine({ items, vmin, vmax, ticks, sel, unit, fmtV }: { items: Item[]; vmin: number; vmax: number; ticks: number[]; sel: string[]; unit: string; fmtV: (v: number) => string }) {
  const n = items.length, top = ((n - 1) * RH) / 2, yAx = -top - 0.16;
  const X = (v: number) => X0 + ((Math.min(vmax, Math.max(vmin, v)) - vmin) / (vmax - vmin)) * (X1 - X0);
  return (
    <group>
      {ticks.map((tk) => <group key={tk}>
        <Line points={[[X(tk), yAx, 0], [X(tk), top + 0.08, 0]]} color={PAL.ghost} lineWidth={0.5} transparent opacity={0.35} />
        <Label text={fmtV(tk)} position={[X(tk), yAx - 0.09, 0]} color={PAL.ghost} height={LH} />
      </group>)}
      <Line points={[[X0, yAx, 0], [X1, yAx, 0]]} color={PAL.ghost} lineWidth={1.5} />
      <Label text={unit} position={[(X0 + X1) / 2, yAx - 0.2, 0]} color={PAL.ghost} height={LH} />
      {items.map((it, i) => {
        const y = top - i * RH, s = sel.includes(it.id), c = s ? PAL.p : it.color, r = s ? 0.05 : 0.036;
        const lo = X(it.lo), hi = X(it.hi), clipL = it.lo < vmin, clipR = it.hi > vmax;
        return (
          <group key={it.id}>
            <Line points={[[X0, y, 0], [X1, y, 0]]} color={PAL.ghost} lineWidth={0.4} transparent opacity={0.15} />
            <Label text={it.short} position={[X0 - 0.08 - lblW(it.short) / 2, y, 0]} color={c} height={LH} />
            <Line points={[[lo, y, 0], [hi, y, 0]]} color={c} lineWidth={s ? 3 : 2} />
            {clipL && <mesh position={[lo, y, 0]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.03, 0.07, 10]} /><meshBasicMaterial color={c} /></mesh>}
            {clipR && <mesh position={[hi, y, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.03, 0.07, 10]} /><meshBasicMaterial color={c} /></mesh>}
            <mesh position={[X(it.v), y, 0]}>
              {it.square ? <boxGeometry args={[r * 1.6, r * 1.6, r * 1.6]} /> : <sphereGeometry args={[r, 20, 14]} />}
              <meshBasicMaterial color={c} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

const Y0 = -0.8;
function DeCurve() {
  const { w0, wa } = useTensions();
  const pts = (f: (a: number) => number) => Array.from({ length: 61 }, (_, i) => { const z = (i / 60) * 3; return [z * 0.8 - 1.2, Math.min(f(1 / (1 + z)), 2.8) * 0.6 + Y0, 0] as [number, number, number]; });
  return (
    <group>
      <Line points={pts(() => 1)} color={PAL.ghost} lineWidth={1.5} dashed dashSize={0.06} gapSize={0.04} />
      <Line points={pts((a) => rhoDE(a, w0, wa))} color={PAL.path} lineWidth={3} />
      <Label text="z = 0" position={[-1.2, Y0 - 0.12, 0]} color={PAL.ghost} /><Label text="z = 3" position={[1.2, Y0 - 0.12, 0]} color={PAL.ghost} />
      <Label text="ρ_DE/ρ_DE,0" position={[-1.2, Y0 + 0.75, 0]} color={PAL.path} /><Label text="Λ" position={[1.4, Y0 + 0.6, 0]} color={PAL.ghost} />
    </group>
  );
}

export function Scene() {
  const { mode, a, b } = useTensions();
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  useEffect(() => {
    // fit a ~3.1 x 2.4 box with margin for any canvas aspect
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360, asp = size.width / size.height;
    const d = Math.max(1.25 / Math.tan(fov), 1.55 / (Math.tan(fov) * asp)) * 1.12;
    camera.position.set(0.2, 0, d);
    camera.lookAt(0.2, 0, 0);
    return () => { camera.position.set(3, 2.5, 3); camera.lookAt(0, 0, 0); };
  }, [camera, size.width, size.height]);
  return mode === 'h0' ? <group position={[-0.1, 0.1, 0]}><NumberLine items={h0Items()} vmin={62} vmax={82} ticks={[62, 66, 70, 74, 78, 82]} sel={[a, b]} unit="H₀ (km/s/Mpc)" fmtV={(v) => String(v)} /></group>
    : mode === 's8' ? <group position={[-0.1, 0.1, 0]}><NumberLine items={s8Items()} vmin={0.72} vmax={0.86} ticks={[0.72, 0.76, 0.8, 0.84]} sel={[]} unit="S₈" fmtV={(v) => String(v)} /></group> : <DeCurve />;
}

// ---------- plots ----------
const Mark = ({ x, y, color, square, sel, tri }: { x: number; y: number; color: string; square?: boolean; sel?: boolean; tri?: boolean }) => (
  <g stroke={sel ? 'var(--fg)' : 'none'} strokeWidth={2} fill={color}>
    {tri ? <path d={`M${x} ${y - 6}L${x + 6} ${y + 5}L${x - 6} ${y + 5}Z`} /> : square ? <rect x={x - 5} y={y - 5} width={10} height={10} /> : <circle cx={x} cy={y} r={5.5} />}
  </g>
);

function Whisker({ items, vmin, vmax, ticks, sel, onPick, label, fmtV }: { items: Item[]; vmin: number; vmax: number; ticks: number[]; sel: string[]; onPick: (id: string) => void; label: string; fmtV: (v: number) => string }) {
  const W = 330, L = 78, R = 12, rh = 22, H = items.length * rh + 34, X = (v: number) => L + ((v - vmin) / (vmax - vmin)) * (W - L - R);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ maxWidth: 420, display: 'block', margin: '8px 0' }}>
      {ticks.map((tk) => <g key={tk}><line x1={X(tk)} x2={X(tk)} y1={4} y2={H - 24} stroke="var(--border)" /><text x={X(tk)} y={H - 10} fontSize={10} textAnchor="middle" fill="var(--muted)">{fmtV(tk)}</text></g>)}
      {items.map((it, i) => {
        const y = 14 + i * rh, s = sel.includes(it.id);
        return (
          <g key={it.id} tabIndex={0} role="button" aria-label={`${it.short} ${fmtV(it.v)}`} aria-pressed={s} style={{ cursor: 'pointer', outline: 'none' }}
            onClick={() => onPick(it.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(it.id); } }}>
            <rect x={0} y={y - 11} width={W} height={rh} fill={s ? 'var(--border)' : 'transparent'} opacity={0.5} />
            <text x={4} y={y + 3} fontSize={10.5} fill="var(--fg)">{it.short}</text>
            <line x1={X(it.lo)} x2={X(it.hi)} y1={y} y2={y} stroke={it.color} strokeWidth={2.5} />
            <line x1={X(it.lo)} x2={X(it.lo)} y1={y - 4} y2={y + 4} stroke={it.color} strokeWidth={2} /><line x1={X(it.hi)} x2={X(it.hi)} y1={y - 4} y2={y + 4} stroke={it.color} strokeWidth={2} />
            <Mark x={X(it.v)} y={y} color={it.color} square={it.square} sel={s} />
          </g>
        );
      })}
    </svg>
  );
}

function Legend({ a, b }: { a: string; b: string }) {
  return <p style={{ fontSize: 12, margin: '0 0 8px' }}>
    <svg width={14} height={12} aria-hidden><circle cx={7} cy={6} r={5} fill={EARLY} /></svg> {a}{'  '}
    <svg width={14} height={12} aria-hidden><rect x={2} y={1} width={10} height={10} fill={LATE} /></svg> {b}</p>;
}

const WP = { W: 330, H: 230, L: 40, B: 28, w0: [-1.15, 0.05], wa: [-2.7, 0.7] } as const;
function DePlane({ sel, onPick, w0, wa, label }: { sel: string; onPick: (m: DEMeas) => void; w0: number; wa: number; label: string }) {
  const X = (v: number) => WP.L + ((v - WP.w0[0]) / (WP.w0[1] - WP.w0[0])) * (WP.W - WP.L - 10), Y = (v: number) => WP.H - WP.B - ((v - WP.wa[0]) / (WP.wa[1] - WP.wa[0])) * (WP.H - WP.B - 8);
  const col = [PAL.V, PAL.path, PAL.du, PAL.dv, PAL.warn];
  return (
    <svg viewBox={`0 0 ${WP.W} ${WP.H}`} width="100%" role="img" aria-label={label} style={{ maxWidth: 420, display: 'block', margin: '8px 0' }}>
      {[-1, -0.5, 0].map((v) => <g key={v}><line x1={X(v)} x2={X(v)} y1={8} y2={WP.H - WP.B} stroke="var(--border)" /><text x={X(v)} y={WP.H - 14} fontSize={10} textAnchor="middle" fill="var(--muted)">{v}</text></g>)}
      {[-2, -1, 0].map((v) => <g key={v}><line x1={WP.L} x2={WP.W - 10} y1={Y(v)} y2={Y(v)} stroke="var(--border)" /><text x={WP.L - 4} y={Y(v) + 3} fontSize={10} textAnchor="end" fill="var(--muted)">{v}</text></g>)}
      <text x={WP.W / 2} y={WP.H - 2} fontSize={11} textAnchor="middle" fill="var(--fg)">w₀</text><text x={10} y={14} fontSize={11} fill="var(--fg)">wₐ</text>
      {DE_MEAS.map((m, i) => (
        <g key={m.id} tabIndex={0} role="button" aria-label={`${m.short} w0 ${m.w0}, wa ${m.wa}`} aria-pressed={sel === m.id} style={{ cursor: 'pointer', outline: 'none' }}
          onClick={() => onPick(m)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(m); } }}>
          <line x1={X(m.w0 - m.w0m)} x2={X(m.w0 + m.w0p)} y1={Y(m.wa)} y2={Y(m.wa)} stroke={col[i]} strokeWidth={2} />
          <line x1={X(m.w0)} x2={X(m.w0)} y1={Y(m.wa - m.wam)} y2={Y(m.wa + m.wap)} stroke={col[i]} strokeWidth={2} />
          <Mark x={X(m.w0)} y={Y(m.wa)} color={col[i]} square={i % 3 === 1} tri={i % 3 === 2} sel={sel === m.id} />
        </g>
      ))}
      <path d={`M${X(-1)} ${Y(0) - 8}L${X(-1) + 3} ${Y(0) - 2}L${X(-1) + 9} ${Y(0) - 2}L${X(-1) + 4} ${Y(0) + 2}L${X(-1) + 6} ${Y(0) + 8}L${X(-1)} ${Y(0) + 4}L${X(-1) - 6} ${Y(0) + 8}L${X(-1) - 4} ${Y(0) + 2}L${X(-1) - 9} ${Y(0) - 2}L${X(-1) - 3} ${Y(0) - 2}Z`} fill="var(--fg)" />
      <text x={X(-1) + 12} y={Y(0) + 4} fontSize={10} fill="var(--fg)">Λ</text>
      <g stroke="var(--fg)" strokeWidth={1.5} fill="none"><path d={`M${X(w0) - 5} ${Y(wa)}h10M${X(w0)} ${Y(wa) - 5}v10`} /><circle cx={X(w0)} cy={Y(wa)} r={8} strokeDasharray="2 2" /></g>
    </svg>
  );
}

function WCurve({ w0, wa, label }: { w0: number; wa: number; label: string }) {
  const W = 330, H = 170, L = 36, B = 24, X = (z: number) => L + (z / 3) * (W - L - 10), Y = (w: number) => 8 + ((0.5 - Math.max(-2.5, Math.min(0.5, w))) / 3) * (H - B - 8);
  const d = Array.from({ length: 61 }, (_, i) => { const z = (i / 60) * 3; return `${i ? 'L' : 'M'}${X(z).toFixed(1)} ${Y(wCpl(1 / (1 + z), w0, wa)).toFixed(1)}`; }).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ maxWidth: 420, display: 'block', margin: '8px 0' }}>
      {[0, 1, 2, 3].map((z) => <g key={z}><line x1={X(z)} x2={X(z)} y1={8} y2={H - B} stroke="var(--border)" /><text x={X(z)} y={H - 10} fontSize={10} textAnchor="middle" fill="var(--muted)">{z}</text></g>)}
      {[-2, -1, 0].map((w) => <text key={w} x={L - 4} y={Y(w) + 3} fontSize={10} textAnchor="end" fill="var(--muted)">{w}</text>)}
      <line x1={L} x2={W - 10} y1={Y(-1)} y2={Y(-1)} stroke={PAL.ghost} strokeDasharray="5 3" strokeWidth={1.5} /><text x={W - 12} y={Y(-1) - 4} fontSize={10} textAnchor="end" fill="var(--muted)">w = −1</text>
      <path d={d} fill="none" stroke={PAL.path} strokeWidth={2.5} /><text x={W / 2} y={H - 1} fontSize={11} textAnchor="middle" fill="var(--fg)">z</text><text x={4} y={14} fontSize={11} fill="var(--fg)">w(z)</text>
    </svg>
  );
}

// ---------- panel ----------
export function Panel() {
  const { mode, set } = useTensions();
  const t = useTr();
  return (
    <div>
      <Seg label={t('Tension', 'Tensión')} value={mode} items={MODES.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v: TensionMode) => set({ mode: v })} cols={3} />
      {mode === 'h0' ? <H0View /> : mode === 's8' ? <S8View /> : <DeView />}
      <h2>{t('What could explain it?', '¿Qué podría explicarlo?')}</h2>
      <Note>{t('A tension may point to new physics (early dark energy, evolving dark energy, modified gravity, neutrino or dark-sector changes) or to unrecognised systematic errors in one of the measurements. As of Nov 2026 no explanation is accepted by the community, and which datasets to trust is itself debated. This page only shows published numbers and the geometry of the comparison; it does not decide the question. Values were checked against each paper\'s abstract or tables in Nov 2026.',
        'Una tensión puede indicar física nueva (energía oscura temprana, energía oscura evolutiva, gravedad modificada, cambios en neutrinos o en el sector oscuro) o errores sistemáticos no identificados en alguna medición. A noviembre de 2026 la comunidad no acepta ninguna explicación, y qué datos son más fiables también se discute. Esta página solo muestra números publicados y la geometría de la comparación; no decide la cuestión. Los valores se comprobaron contra el resumen o las tablas de cada artículo en noviembre de 2026.')}</Note>
    </div>
  );
}

function H0View() {
  const { a, b, set } = useTensions();
  const t = useTr();
  const A = H0_MEAS.find((m) => m.id === a) ?? H0_MEAS[0], B = H0_MEAS.find((m) => m.id === b) ?? H0_MEAS[1];
  const Om = OM_PLANCK.value, tA = ageFlat(A.value, Om), tB = ageFlat(B.value, Om);
  const res = Math.abs(ageFlatNumeric(A.value, Om) - tA);
  const pick = (id: string) => set({ a: b, b: id });
  const opts = (v: string, f: (x: string) => void, lab: string) => (
    <label className="field"><span>{lab}</span>
      <select value={v} aria-label={lab} onChange={(e) => f(e.target.value)}>{H0_MEAS.map((m) => <option key={m.id} value={m.id}>{t(m.name, m.nameEs)}</option>)}</select></label>);
  return (
    <div>
      <h2>{t('Hubble constant H₀', 'Constante de Hubble H₀')}</h2>
      <Legend a={t('early universe (CMB, BAO+BBN)', 'universo temprano (CMB, BAO+BBN)')} b={t('late universe (local distances)', 'universo tardío (distancias locales)')} />
      <Whisker items={h0Items()} vmin={62} vmax={90} ticks={[65, 70, 75, 80, 85]} sel={[a, b]} onPick={pick} fmtV={(v) => String(v)}
        label={t('H0 measurements with 1 sigma error bars, km/s/Mpc. Click a row to compare.', 'Medidas de H0 con barras de error de 1 sigma, km/s/Mpc. Pulsa una fila para comparar.')} />
      <Note>{t('Click rows (or use the menus) to pick two measurements. Shape and colour both mark the group.', 'Pulsa filas (o usa los menús) para elegir dos medidas. La forma y el color marcan el grupo.')}</Note>
      {opts(a, (v) => set({ a: v }), t('Measurement A', 'Medida A'))}
      {opts(b, (v) => set({ b: v }), t('Measurement B', 'Medida B'))}
      <div className="readout" aria-label={t('Hubble readouts', 'Lecturas de Hubble')}>
        <span>H₀(A)</span><span>{A.value} +{A.plus} −{A.minus}</span>
        <span>H₀(B)</span><span>{B.value} +{B.plus} −{B.minus}</span>
        <span>n<sub>σ</sub></span><span>{fmt(tension(A, B), 2)} σ</span>
        <span>{t('flat ΛCDM age, A', 'edad ΛCDM plano, A')}</span><span>{fmt(tA, 2)} Gyr</span>
        <span>{t('flat ΛCDM age, B', 'edad ΛCDM plano, B')}</span><span>{fmt(tB, 2)} Gyr</span>
        <span>{t('age difference', 'diferencia de edad')}</span><span>{fmt(Math.abs(tA - tB), 2)} Gyr</span>
        <span>{t('check: closed form − integral', 'comprobación: forma cerrada − integral')}</span><span>{res.toExponential(1)} Gyr</span>
      </div>
      <Tex block>{String.raw`n_\sigma=\frac{|H_a-H_b|}{\sqrt{\sigma_a^2+\sigma_b^2}}`}</Tex>
      <Tex block>{String.raw`t_0=\frac{2}{3H_0\sqrt{\Omega_\Lambda}}\,\operatorname{asinh}\sqrt{\Omega_\Lambda/\Omega_m}`}</Tex>
      <Note>{t(`n_σ assumes independent Gaussian errors; for asymmetric errors we use the side facing the other value. Real analyses share systematics, so treat it as a rough guide. Ages assume flat ΛCDM with Ω_m = ${Om} (Planck 2018) and no radiation, which is not self-consistent when H₀ is changed alone: a higher H₀ simply gives a younger universe at fixed Ω_m (Planck: 13.797 ± 0.023 Gyr).`,
        `n_σ supone errores gaussianos independientes; con errores asimétricos usamos el lado que mira al otro valor. Los análisis reales comparten sistemáticos, así que es solo una guía. Las edades suponen ΛCDM plano con Ω_m = ${Om} (Planck 2018) y sin radiación, lo cual no es autoconsistente al cambiar solo H₀: un H₀ mayor da un universo más joven con Ω_m fijo (Planck: 13.797 ± 0.023 Gyr).`)}</Note>
      <Note>{t('State of play, Nov 2026: the local network (H0DN) and the CMB/BAO values differ by about 6–7σ, while CCHP (TRGB) sits in between, so even the local side is not unanimous.', 'Situación a nov 2026: la red local (H0DN) y los valores de CMB/BAO difieren en unos 6–7σ, mientras que CCHP (TRGB) queda en medio, así que ni siquiera el lado local es unánime.')}</Note>
      <Sources items={H0_MEAS.map((m) => ({ k: m.id, s: m.source, extra: `${t(m.name, m.nameEs)}, ${m.year}: ${t(m.dataset, m.datasetEs)}${m.derived ? ` [${m.derived}]` : ''}` }))} />
    </div>
  );
}

function Sources({ items }: { items: { k: string; s: { label: string; url: string }; extra: string }[] }) {
  const t = useTr();
  return (
    <details><summary>{t('Sources (checked 2026-11)', 'Fuentes (comprobadas 2026-11)')}</summary>
      <ul style={{ fontSize: 12, paddingLeft: 16 }}>{items.map((i) => <li key={i.k}>{i.extra}. <Src s={i.s} /></li>)}</ul></details>
  );
}

function S8View() {
  const t = useTr();
  const P = S8_MEAS[0];
  return (
    <div>
      <h2>S₈ = σ₈√(Ω<sub>m</sub>/0.3)</h2>
      <Legend a={t('CMB (Planck)', 'CMB (Planck)')} b={t('weak lensing', 'lentes débiles')} />
      <Whisker items={s8Items()} vmin={0.7} vmax={0.86} ticks={[0.72, 0.76, 0.8, 0.84]} sel={[]} onPick={() => undefined} fmtV={(v) => String(v)}
        label={t('S8 measurements with 1 sigma error bars', 'Medidas de S8 con barras de error de 1 sigma')} />
      <div className="readout" aria-label={t('S8 readouts', 'Lecturas de S8')}>
        {S8_MEAS.slice(1).map((m) => <><span key={m.id + 'a'}>{m.short} − Planck</span><span key={m.id + 'b'}>{m.value} → {fmt(tension(P, m), 2)} σ</span></>)}
      </div>
      <Tex block>{String.raw`S_8=\sigma_8\sqrt{\Omega_m/0.3}`}</Tex>
      <Note>{t('Honest status, Nov 2026: KiDS-1000 and HSC Y3 sat 2–3σ below Planck, but the final KiDS-Legacy analysis (2025) moved up to 0.815 and agrees with Planck within 1σ. DES Y6 (2026) is 0.789 ± 0.012, about 2.6σ below Planck in S₈ alone (the DES paper quotes 1.8σ over the full parameter space). The S₈ tension has therefore weakened but is not gone. The n_σ above use the simple Gaussian formula, not the papers\' full-parameter metrics.',
        'Estado honesto a nov 2026: KiDS-1000 y HSC Y3 quedaban 2–3σ por debajo de Planck, pero el análisis final KiDS-Legacy (2025) subió a 0.815 y concuerda con Planck dentro de 1σ. DES Y6 (2026) da 0.789 ± 0.012, unos 2.6σ por debajo de Planck solo en S₈ (el artículo de DES cita 1.8σ en todo el espacio de parámetros). La tensión de S₈ se ha debilitado, pero no ha desaparecido. Los n_σ de arriba usan la fórmula gaussiana simple, no las métricas completas de los artículos.')}</Note>
      <Sources items={S8_MEAS.map((m) => ({ k: m.id, s: m.source, extra: `${t(m.name, m.nameEs)}, ${m.year}: S₈ = ${m.value} +${m.plus} −${m.minus}` }))} />
    </div>
  );
}

function DeView() {
  const { w0, wa, z, set } = useTensions();
  const t = useTr();
  const a = 1 / (1 + z), r = rhoDE(a, w0, wa), res = Math.abs(rhoDENumeric(a, w0, wa) - r);
  const ac = wa !== 0 ? 1 + (1 + w0) / wa : NaN, cross = ac > 0 && ac < 1;
  const sel = DE_MEAS.find((m) => Math.abs(m.w0 - w0) < 1e-9 && Math.abs(m.wa - wa) < 1e-9)?.id ?? '';
  const load = (m: DEMeas) => set({ w0: m.w0, wa: m.wa });
  return (
    <div>
      <h2>{t('Dark energy equation of state', 'Ecuación de estado de la energía oscura')}</h2>
      <DePlane sel={sel} w0={w0} wa={wa} onPick={load}
        label={t('Published w0 and wa central values with 1 sigma error bars for DESI DR2 combinations; Lambda at (-1, 0)', 'Valores centrales publicados de w0 y wa con barras de 1 sigma para combinaciones de DESI DR2; Λ en (-1, 0)')} />
      <Note>{t('Published central values with 1σ bars (circles, squares and triangles differ by dataset); the star is Λ (w₀ = −1, wₐ = 0). Likelihood contours are not drawn because we cannot reproduce them here. Click a point to load it.', 'Valores centrales publicados con barras de 1σ (círculos, cuadrados y triángulos según el conjunto de datos); la estrella es Λ (w₀ = −1, wₐ = 0). No dibujamos contornos de verosimilitud porque no podemos reproducirlos aquí. Pulsa un punto para cargarlo.')}</Note>
      <ul style={{ fontSize: 12, paddingLeft: 16 }}>{DE_MEAS.map((m) => <li key={m.id}><button onClick={() => load(m)} style={{ fontSize: 12 }}>{t(m.name, m.nameEs)}</button> w₀ = {m.w0} +{m.w0p} −{m.w0m}, wₐ = {m.wa} +{m.wap} −{m.wam}: {m.sigma}σ</li>)}</ul>
      <label className="field"><span>w₀ = {fmt(w0, 2)}</span><input type="range" min={-1.5} max={-0.2} step={0.01} value={w0} aria-label="w0" onChange={(e) => set({ w0: +e.target.value })} /></label>
      <label className="field"><span>wₐ = {fmt(wa, 2)}</span><input type="range" min={-3} max={1} step={0.01} value={wa} aria-label="wa" onChange={(e) => set({ wa: +e.target.value })} /></label>
      <label className="field"><span>z = {fmt(z, 2)}</span><input type="range" min={0} max={3} step={0.01} value={z} aria-label={t('redshift z', 'corrimiento al rojo z')} onChange={(e) => set({ z: +e.target.value })} /></label>
      <WCurve w0={w0} wa={wa} label={t('CPL w(z) against redshift with the w = -1 line', 'w(z) de CPL frente al corrimiento al rojo con la línea w = -1')} />
      <div className="readout" aria-label={t('Dark-energy readouts', 'Lecturas de energía oscura')}>
        <span>w(z)</span><span>{fmt(wCpl(a, w0, wa), 3)}</span>
        <span>ρ<sub>DE</sub>(a)/ρ<sub>DE,0</sub></span><span>{fmt(r, 4)}</span>
        <span>{t('check: closed form − integral', 'comprobación: forma cerrada − integral')}</span><span>{res.toExponential(1)}</span>
        <span>{t('crosses w = −1', 'cruza w = −1')}</span><span>{cross ? `z = ${fmt(1 / ac - 1, 2)}` : t("no", "no")}</span>
      </div>
      <Tex block>{String.raw`w(a)=w_0+w_a(1-a),\qquad \frac{\rho_{DE}(a)}{\rho_{DE,0}}=a^{-3(1+w_0+w_a)}e^{-3w_a(1-a)}`}</Tex>
      <Tex block>{String.raw`\frac{d\ln\rho}{d\ln a}=-3\,(1+w)`}</Tex>
      <Note>{t('Status, Nov 2026: DESI DR2 BAO with CMB prefers (w₀, wₐ) over Λ at 3.1σ, and 2.8–4.2σ with supernovae depending on the sample. The recalibrated DES supernovae (Dovekie) lower the DESY5 result from 4.2σ to 3.2σ, which the authors call only a weak preference. This is a statistical preference that depends on the supernova sample and calibration, not a confirmed detection. No newer DESI collaboration release than DR2 was available.',
        'Estado a nov 2026: los BAO de DESI DR2 con el CMB prefieren (w₀, wₐ) frente a Λ a 3.1σ, y a 2.8–4.2σ con supernovas según la muestra. Las supernovas de DES recalibradas (Dovekie) bajan el resultado de DESY5 de 4.2σ a 3.2σ, lo que los autores llaman solo una preferencia débil. Es una preferencia estadística que depende de la muestra de supernovas y de su calibración, no una detección confirmada. No había una publicación de DESI más reciente que DR2.')}</Note>
      <Sources items={DE_MEAS.map((m) => ({ k: m.id, s: m.source, extra: `${t(m.name, m.nameEs)}, ${m.year}` }))} />
    </div>
  );
}
