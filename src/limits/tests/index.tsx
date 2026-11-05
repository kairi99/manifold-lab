import { useMemo, useState } from 'react';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useTr, T } from '../../i18n';
import { Note, Seg, Src } from '../../panels/SpacetimeUi';
import { Tex, fmt, fmtSci } from '../../panels/Tex';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { FAMILIES, POINTS, type TestPoint } from './data';
import { ARCSEC, bdGamma, CASSINI, deflection, limbDeflectionGR, LLR, mercuryAdvance, mercuryMeas, nordtvedt, omegaBound, pull, shapiroFactor, VLBI } from './math';
import { useTests } from './state';

const EXAG_LIGHT = 1e4; // deflection exaggeration
const EXAG_PERI = 1e6; // per-orbit perihelion advance exaggeration
const T_MERCURY_CY = 0.2408467 / 100; // orbital period in centuries

function useEffective() {
  const { gamma, beta, useBD, omega } = useTests();
  return useBD ? { gamma: bdGamma(omega), beta: 1 } : { gamma, beta };
}

export function Scene() {
  const { gamma, beta } = useEffective();
  const { camera, controls, size } = useThree();
  const z = Math.max(3.6, 7.2 / (size.width / Math.max(1, size.height))) / (2 * Math.tan(Math.PI / 8));
  useEffect(() => {
    const c = controls as unknown as { enableRotate: boolean; target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    camera.position.set(0, 0, z); camera.lookAt(0, 0, 0);
    if (c) { c.enableRotate = false; c.target.set(0, 0, 0); c.update(); }
    return () => { camera.position.set(3, 2.5, 3); if (c) { c.enableRotate = true; c.target.set(0, 0, 0); c.update(); } };
  }, [camera, controls, z]);

  const ray = useMemo(() => {
    const d = ((1 + gamma) / 2) * (4 * 1.32712440018e20) / (299792458 ** 2 * 6.957e8) * EXAG_LIGHT; // rad, exaggerated
    const x0 = -1.9, b = 0.45 * 1.02, w = 0.25, xa = -3.4, xb = -0.2, n = 60;
    const slope = (x: number) => -Math.tan(d * (0.5 + 0.5 * Math.tanh((x - x0) / w))); // smooth turn centred on closest approach
    const path: [number, number, number][] = [];
    const xs = Array.from({ length: n + 1 }, (_, i) => xa + ((xb - xa) * i) / n);
    const i0 = xs.reduce((m, x, i) => (Math.abs(x - x0) < Math.abs(xs[m] - x0) ? i : m), 0);
    const ys: number[] = new Array(xs.length); ys[i0] = b;
    for (let i = i0 + 1; i < xs.length; i++) ys[i] = ys[i - 1] + slope((xs[i] + xs[i - 1]) / 2) * (xs[i] - xs[i - 1]);
    for (let i = i0 - 1; i >= 0; i--) ys[i] = ys[i + 1] - slope((xs[i] + xs[i + 1]) / 2) * (xs[i + 1] - xs[i]);
    xs.forEach((x, i) => path.push([x, ys[i], 0]));
    return { path, straight: [[xa, b, 0], [xb, b, 0]] as [number, number, number][] };
  }, [gamma]);
  const rosette = useMemo(() => {
    const k = (mercuryAdvance(gamma, beta) / ARCSEC) * T_MERCURY_CY * EXAG_PERI; // rad per orbit
    const a = 0.85, e = 0.45, p = a * (1 - e * e), N = 8, M = 180 * N;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= M; i++) {
      const phi = (i / M) * N * 2 * Math.PI, w = (k * phi) / (2 * Math.PI), r = p / (1 + e * Math.cos(phi - w));
      pts.push([1.7 + r * Math.cos(phi), r * Math.sin(phi), 0]);
    }
    return pts;
  }, [gamma, beta]);
  return (
    <group>
      <mesh position={[-1.9, 0, 0]}><circleGeometry args={[0.45, 40]} /><meshBasicMaterial color="#F0E442" /></mesh>
      <Line points={ray.straight} color={PAL.ghost} lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={ray.path} color={PAL.du} lineWidth={2} />
      <Label text="light ray" position={[-3.0, 0.78, 0]} color={PAL.du} />
      <Label text="x10^4 exaggerated" position={[-1.9, -0.95, 0]} color={PAL.warn} height={0.13} />
      <mesh position={[1.7, 0, 0]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color="#F0E442" /></mesh>
      <Line points={rosette} color={PAL.path} lineWidth={1.2} />
      <Label text="Mercury, 8 orbits" position={[1.7, 1.45, 0]} color={PAL.path} />
      <Label text="x10^6 exaggerated" position={[1.7, -1.45, 0]} color={PAL.warn} height={0.13} />
    </group>
  );
}

// ---- history plot ----
const W = 360, H = 300, X0 = 44, X1 = 346, YT = 14, YB = 252, YQ = 282;
const Y0 = 1910, Y1 = 2030, LMIN = -16, LMAX = 0;
const px = (yr: number) => X0 + ((yr - Y0) / (Y1 - Y0)) * (X1 - X0);
const py = (b: number | null) => (b === null ? YQ : YT + ((LMAX - Math.log10(b)) / (LMAX - LMIN)) * (YB - YT));

function Marker({ shape, x, y, color, sel }: { shape: string; x: number; y: number; color: string; sel?: boolean }) {
  const s = sel ? 6.5 : 5, p = { fill: shape === 'ring' ? 'none' : color, stroke: sel ? 'var(--fg)' : color, strokeWidth: sel ? 2 : shape === 'ring' || shape === 'cross' ? 1.8 : 1 };
  if (shape === 'square') return <rect x={x - s} y={y - s} width={2 * s} height={2 * s} {...p} />;
  if (shape === 'tri') return <polygon points={`${x},${y - s - 1} ${x + s + 1},${y + s} ${x - s - 1},${y + s}`} {...p} />;
  if (shape === 'diamond') return <polygon points={`${x},${y - s - 1} ${x + s + 1},${y} ${x},${y + s + 1} ${x - s - 1},${y}`} {...p} />;
  if (shape === 'cross') return <path d={`M${x - s},${y - s}L${x + s},${y + s}M${x - s},${y + s}L${x + s},${y - s}`} {...p} fill="none" />;
  if (shape === 'ring') return <circle cx={x} cy={y} r={s} {...p} />;
  return <circle cx={x} cy={y} r={s} {...p} />;
}

function History() {
  const t = useTr();
  const sel = useTests((s) => s.sel), set = useTests((s) => s.set);
  const pt = POINTS.find((p) => p.id === sel) ?? null;
  const shapeOf = (p: TestPoint) => FAMILIES.find((f) => f.id === p.family)!;
  const name = (p: TestPoint) => `${p.year}: ${p.value}`;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label={t('Fractional bounds on deviations from general relativity versus year, log scale', 'Cotas fraccionales de desviación respecto a la relatividad general según el año, escala logarítmica')} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}>
        {Array.from({ length: 9 }, (_, i) => -16 + 2 * i).map((l) => (
          <g key={l}><line x1={X0} x2={X1} y1={py(10 ** l)} y2={py(10 ** l)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(10 ** l) + 3} fontSize={9} textAnchor="end" fill="var(--muted)">{l === 0 ? '1' : `1e${l}`}</text></g>
        ))}
        {[1920, 1940, 1960, 1980, 2000, 2020].map((yr) => (
          <g key={yr}><line x1={px(yr)} x2={px(yr)} y1={YT} y2={YB} stroke="var(--border)" strokeWidth={0.5} />
            <text x={px(yr)} y={YB + 12} fontSize={9} textAnchor="middle" fill="var(--muted)">{yr}</text></g>
        ))}
        <text x={X0} y={YQ + 3} fontSize={8} textAnchor="end" fill="var(--muted)">{t('qual.', 'cual.')}</text>
        <line x1={X0} x2={X1} y1={YQ - 10} y2={YQ - 10} stroke="var(--border)" strokeDasharray="3 3" />
        {FAMILIES.filter((f) => f.id !== 'bh' && f.id !== 'gw').map((f) => (
          <polyline key={f.id} fill="none" stroke={f.color} strokeWidth={1} strokeOpacity={0.5}
            points={POINTS.filter((p) => p.family === f.id).map((p) => `${px(p.year)},${py(p.bound)}`).join(' ')} />
        ))}
        {POINTS.map((p) => {
          const f = shapeOf(p);
          return (
            <g key={p.id} role="button" tabIndex={0} aria-pressed={sel === p.id} aria-label={`${t(f.en, f.es)}, ${name(p)}`} style={{ cursor: 'pointer', outline: 'none' }}
              onClick={() => set({ sel: p.id })} onMouseEnter={() => set({ sel: p.id })} onFocus={() => set({ sel: p.id })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set({ sel: p.id }); } }}>
              <circle cx={px(p.year)} cy={py(p.bound)} r={11} fill="transparent" />
              <Marker shape={f.shape} x={px(p.year)} y={py(p.bound)} color={f.color} sel={sel === p.id} />
            </g>
          );
        })}
      </svg>
      <div role="list" style={{ fontSize: 12, margin: '8px 0' }}>
        {FAMILIES.map((f) => (
          <div role="listitem" key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width={16} height={16} viewBox="-8 -8 16 16" aria-hidden><Marker shape={f.shape} x={0} y={0} color={f.color} /></svg>{t(f.en, f.es)}
          </div>
        ))}
      </div>
      <div className="readout" aria-live="polite" style={{ minHeight: 90 }}>
        {pt ? (<>
          <span>{t('year', 'año')}</span><span>{pt.year}</span>
          <span>{t('result', 'resultado')}</span><span>{pt.value}</span>
          <span>{t('bound', 'cota')}</span><span>{pt.bound === null ? t('qualitative', 'cualitativo') : fmtSci(pt.bound, 2)}</span>
          <span>{t('measured', 'medido')}</span><span>{t(pt.what, pt.whatEs)}</span>
          <span>{t('source', 'fuente')}</span><span><Src s={pt.source} /> (checked {pt.checked})</span>
        </>) : <span style={{ gridColumn: '1 / -1', color: 'var(--muted)' }}>{t('Hover, tap or focus a point for its details.', 'Pasa el cursor, toca o enfoca un punto para ver sus detalles.')}</span>}
      </div>
      <Note>{t('Vertical axis: fractional bound, log scale (smaller is tighter). Fractional bounds mean different things per family (each is the quantity named in the legend, 1σ unless noted), so compare the trend within a family, not across families.', 'Eje vertical: cota fraccional en escala logarítmica (más abajo es más estricto). Cada familia mide una magnitud distinta (la de la leyenda, 1σ salvo indicación), así que compara la tendencia dentro de cada familia, no entre familias.')}</Note>
    </>
  );
}

// ---- PPN explorer ----
function Ppn() {
  const t = useTr();
  const { gamma: g0, beta: b0, useBD, omega, set } = useTests();
  const [fine, setFine] = useState(false);
  const { gamma, beta } = useEffective();
  const span = fine ? 5e-4 : 0.1, step = fine ? 1e-5 : 1e-3;
  const cl = (x: number) => Math.min(1 + span, Math.max(1 - span, x));
  const rows = [
    { k: t('light deflection at the limb (″)', 'deflexión de la luz en el limbo (″)'), pred: deflection(gamma), meas: { value: limbDeflectionGR() * (1 + VLBI.value / 2), sigma: (limbDeflectionGR() * VLBI.sigma) / 2 }, d: 4, note: 'VLBI' },
    { k: t('Shapiro delay factor (1+γ)/2', 'factor del retraso de Shapiro (1+γ)/2'), pred: shapiroFactor(gamma), meas: { value: 1 + CASSINI.value / 2, sigma: CASSINI.sigma / 2 }, d: 6, note: 'Cassini' },
    { k: t('Mercury perihelion (″/cy)', 'perihelio de Mercurio (″/siglo)'), pred: mercuryAdvance(gamma, beta), meas: mercuryMeas(), d: 4, note: t('GR-centred', 'centrado en RG') },
    { k: t('Nordtvedt η_N = 4β − γ − 3', 'Nordtvedt η_N = 4β − γ − 3'), pred: nordtvedt(gamma, beta), meas: LLR, d: 5, note: 'LLR' },
  ];
  const wB = omegaBound(CASSINI.value, CASSINI.sigma);
  return (
    <>
      <Seg label={t('Slider range', 'Rango de los deslizadores')} value={fine ? 'fine' : 'wide'} cols={2} items={[['wide', t('wide ±0.1', 'amplio ±0.1')], ['fine', t('fine ±5×10⁻⁴', 'fino ±5×10⁻⁴')]]} onPick={(v) => { setFine(v === 'fine'); set({ gamma: 1, beta: 1 }); }} />
      <label className="field"><span>γ = {useBD ? fmt(gamma, 6) : fmt(g0, fine ? 5 : 3)}</span>
        <input type="range" min={1 - span} max={1 + span} step={step} value={cl(g0)} disabled={useBD} aria-label="gamma" onChange={(e) => set({ gamma: +e.target.value })} /></label>
      <label className="field"><span>β = {fmt(useBD ? 1 : b0, fine ? 5 : 3)}</span>
        <input type="range" min={1 - span} max={1 + span} step={step} value={cl(b0)} disabled={useBD} aria-label="beta" onChange={(e) => set({ beta: +e.target.value })} /></label>
      <label className="field" style={{ flexDirection: 'row', gap: 8 }}><input type="checkbox" checked={useBD} onChange={(e) => set({ useBD: e.target.checked })} />{t('Brans–Dicke: γ = (1+ω)/(2+ω), β = 1', 'Brans–Dicke: γ = (1+ω)/(2+ω), β = 1')}</label>
      {useBD && <label className="field"><span>log₁₀ ω = {fmt(Math.log10(omega), 2)} (ω = {fmtSci(omega, 2)})</span>
        <input type="range" min={0} max={7} step={0.01} value={Math.log10(omega)} aria-label="log omega" onChange={(e) => set({ omega: 10 ** +e.target.value })} /></label>}
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead><tr><th align="left">{t('test', 'prueba')}</th><th>{t('prediction', 'predicción')}</th><th>{t('measured', 'medido')}</th><th>{t('pull', 'tensión')}</th></tr></thead>
        <tbody>{rows.map((r) => { const z = pull(r.pred, r.meas); return (
          <tr key={r.note + r.d} style={{ borderTop: '1px solid var(--border)' }}>
            <td>{r.k}</td><td align="center">{fmt(r.pred, r.d)}</td>
            <td align="center">{fmt(r.meas.value, r.d)} ± {fmtSci(r.meas.sigma, 2)} <small>({r.note})</small></td>
            <td align="center" style={{ color: Math.abs(z) > 2 ? PAL.warn : undefined, fontWeight: 600 }}>{fmt(z, 2)}σ</td>
          </tr>); })}</tbody>
      </table>
      <div className="readout" aria-label={t('Brans–Dicke bound', 'Cota de Brans–Dicke')}>
        <span>{t('implied ω bound (Cassini, 2σ)', 'cota de ω implícita (Cassini, 2σ)')}</span><span>ω &gt; {fmtSci(wB, 2)}</span>
        <span>{t('check: GR deflection', 'comprobación: deflexión RG')}</span><span>{fmt(limbDeflectionGR(), 4)}″ (4GM/c²R, {t('residual vs 1.7505″', 'residuo frente a 1.7505″')} {fmtSci(Math.abs(limbDeflectionGR() - 1.7505), 1)})</span>
        <span>{t('check: γ=β=1 perihelion', 'comprobación: perihelio γ=β=1')}</span><span>{fmt(mercuryAdvance(1, 1), 2)}″/cy</span>
      </div>
      <Note>{t('Pull = (prediction − measurement)/σ. Mercury has no independent absolute number here: its "measurement" is the GR value 42.98″/cy with σ derived from the PPN limits γ−1 (Cassini) and β−1 < 8×10⁻⁵ (Will 2014, Table 4), so its pull reflects those limits, not a separate fit. The solar quadrupole J₂ adds only about 0.03″/cy and is included in modern ephemeris fits; it is not in the slider prediction.', 'Tensión = (predicción − medida)/σ. Para Mercurio no hay aquí un número absoluto independiente: su "medida" es el valor de la RG, 42.98″/siglo, con σ derivada de las cotas PPN de γ−1 (Cassini) y β−1 < 8×10⁻⁵ (Will 2014, tabla 4), así que su tensión refleja esas cotas y no un ajuste propio. El cuadrupolo solar J₂ aporta solo unos 0.03″/siglo y se incluye en los ajustes modernos de efemérides; no está en la predicción de los deslizadores.')}</Note>
    </>
  );
}

export function Panel() {
  const t = useTr();
  const mode = useTests((s) => s.mode), set = useTests((s) => s.set);
  return (
    <div>
      <Seg label={t('Precision tests mode', 'Modo de pruebas de precisión')} value={mode} cols={2} items={[['history', t('History of bounds', 'Historia de las cotas')], ['ppn', t('PPN explorer', 'Explorador PPN')]]} onPick={(m) => set({ mode: m })} />
      {mode === 'history' ? <History /> : <Ppn />}
      <h2>{t('Equations', 'Ecuaciones')}</h2>
      <Tex block>{'\\delta\\theta=\\frac{1+\\gamma}{2}\\,\\frac{4GM_\\odot}{c^{2}R_\\odot}\\approx\\frac{1+\\gamma}{2}\\,1.751^{\\prime\\prime}'}</Tex>
      <Tex block>{'\\Delta\\varpi=\\frac{2+2\\gamma-\\beta}{3}\\,42.98^{\\prime\\prime}/\\text{cy},\\qquad \\eta_N=4\\beta-\\gamma-3,\\qquad \\gamma=\\frac{1+\\omega}{2+\\omega}'}</Tex>
      <Note><T en="GR has passed every test so far, in the regimes tested. These numbers are the bar any modification of gravity must clear. Scene: the light bending and the Mercury rosette are exaggerated (×10⁴ and ×10⁶) so you can see them; the figures in the panel are the real ones. Nothing here moves, so reduced-motion settings need no change." es="La RG ha superado todas las pruebas hasta ahora, en los regímenes probados. Estos números son el listón que debe superar cualquier modificación de la gravedad. Escena: la curvatura de la luz y la roseta de Mercurio están exageradas (×10⁴ y ×10⁶) para que se vean; las cifras del panel son las reales. Nada se mueve, así que el movimiento reducido no requiere cambios." /></Note>
      <Note>{t('As of Nov 2026. No published ACES (ISS) redshift result or Gaia bound on γ was found, so neither is plotted.', 'A nov 2026. No se encontró ningún resultado publicado de corrimiento al rojo de ACES (ISS) ni una cota de Gaia sobre γ, así que ninguno aparece en la gráfica.')}</Note>
    </div>
  );
}
