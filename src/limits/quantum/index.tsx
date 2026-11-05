import { Fragment, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { Tex, fmt, fmtSci } from '../../panels/Tex';
import { C, G } from '../../data/celestial';
import { Seg, Note, Src } from '../../panels/SpacetimeUi';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { useTr, T } from '../../i18n';
import { useQuantum, type QMode } from './state';
import * as m from './math';
import { HOLES, SCALES, SRC, type Src as SrcT } from './data';

const YEAR = 365.25 * 86400;
const LOG_E_MAX = Math.log10(m.E_P_EV);
const log = Math.log10;

const Cite = ({ list }: { list: SrcT[] }) => (
  <Note>{list.map((s, i) => <span key={s.url}>{i > 0 && '; '}<Src s={s} /></span>)} ({list[0]?.checked ?? ''})</Note>
);
const Readout = ({ label, rows }: { label: string; rows: [ReactNode, ReactNode][] }) => (
  <div className="readout" aria-label={label}>{rows.map(([a, b], i) => <Fragment key={i}><span>{a}</span><span>{b}</span></Fragment>)}</div>
);
const Slider = ({ label, value, min, max, step, onChange, text }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; text: string }) => (
  <label className="field"><span>{text}</span>
    <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(+e.target.value)} /></label>
);

/** Small log-log SVG plot. Points are already in log10 coordinates. */
function Plot({ pts, xr, yr, xl, yl, marks, hline, label }: {
  pts: [number, number][]; xr: [number, number]; yr: [number, number]; xl: string; yl: string; label: string;
  marks: { x: number; y: number; text: string; color: string }[]; hline?: { y: number; text: string };
}) {
  const W = 300, H = 190, L = 34, B = 26;
  const X = (x: number) => L + ((x - xr[0]) / (xr[1] - xr[0])) * (W - L - 8);
  const Y = (y: number) => H - B - ((y - yr[0]) / (yr[1] - yr[0])) * (H - B - 8);
  const cl = (y: number) => Math.max(yr[0], Math.min(yr[1], y));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: '100%', maxWidth: 360, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}>
      <rect x={L} y={8} width={W - L - 8} height={H - B - 8} fill="none" stroke="var(--border)" />
      <polyline fill="none" stroke={PAL.path} strokeWidth={2} points={pts.map(([x, y]) => `${X(x)},${Y(cl(y))}`).join(' ')} />
      {hline && <><line x1={L} x2={W - 8} y1={Y(hline.y)} y2={Y(hline.y)} stroke={PAL.warn} strokeDasharray="4 3" />
        <text x={W - 10} y={Y(hline.y) - 3} fontSize={9} fill={PAL.warn} textAnchor="end">{hline.text}</text></>}
      {marks.map((k) => (
        <g key={k.text}><circle cx={X(k.x)} cy={Y(cl(k.y))} r={4} fill={k.color} stroke="#000" />
          <text x={X(k.x) + 6} y={Y(cl(k.y)) - 4} fontSize={9} fill="var(--fg)">{k.text}</text></g>
      ))}
      <text x={(W + L) / 2} y={H - 6} fontSize={10} fill="var(--muted)" textAnchor="middle">{xl}</text>
      <text x={10} y={H / 2} fontSize={10} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>{yl}</text>
      {[xr[0], xr[1]].map((v) => <text key={`x${v}`} x={X(v)} y={H - B + 11} fontSize={9} fill="var(--muted)" textAnchor="middle">{Math.round(v)}</text>)}
      {[yr[0], yr[1]].map((v) => <text key={`y${v}`} x={L - 3} y={Y(v) + 3} fontSize={9} fill="var(--muted)" textAnchor="end">{Math.round(v)}</text>)}
    </svg>
  );
}

const sample = (a: number, b: number, f: (x: number) => number, n = 60): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, f(x)]; });

/* ------------------------------ Hawking ------------------------------ */
const LOGM_MIN = 10, LOGM_MAX = log(1e10 * m.M_SUN);

function HawkingPanel() {
  const t = useTr();
  const { logM, set } = useQuantum();
  const M = 10 ** logM, temp = m.hawkingT(M);
  const tev = m.evapTime(M) / YEAR;
  const Mx = m.crossoverMass();
  return (
    <div>
      <Slider label={t('Black-hole mass, log scale', 'Masa del agujero negro, escala log')} value={logM} min={LOGM_MIN} max={LOGM_MAX} step={0.01} onChange={(v) => set({ logM: v })}
        text={`M = ${fmtSci(M, 2)} kg = ${fmtSci(M / m.M_SUN, 2)} M☉`} />
      <Tex block>{'T_H=\\dfrac{\\hbar c^3}{8\\pi G M k_B}'}</Tex>
      <Tex block>{'\\dfrac{S}{k_B}=\\dfrac{A c^3}{4G\\hbar},\\quad A=\\dfrac{16\\pi G^2M^2}{c^4}'}</Tex>
      <Readout label={t('Hawking readouts', 'Lecturas de Hawking')} rows={[
        [<Tex key="a">T_H</Tex>, `${fmtSci(temp, 3)} K`],
        [<Tex key="b">{'T_H/T_{CMB}'}</Tex>, fmtSci(temp / m.T_CMB, 3)],
        [<Tex key="c">S/k_B</Tex>, fmtSci(m.bhEntropy(M), 3)],
        [<Tex key="d">r_s</Tex>, `${fmtSci(m.schwarzschildR(M), 3)} m`],
        [t('photon-only t_ev (estimate)', 't_ev solo fotones (estimación)'), `${fmtSci(tev, 2)} yr`],
        [t('check T_H·M·k_B·8πG/(ħc³)', 'comprobación T_H·M·k_B·8πG/(ħc³)'), `${fmt((temp * M * m.KB * 8 * Math.PI * G) / (m.HBAR * C ** 3), 6)} (1)`],
      ]} />
      <p style={{ fontSize: 12 }}><T
        en={<>The evaporation time <Tex>{'t_{ev}=5120\\pi G^2M^3/(\\hbar c^4)'}</Tex> counts photons only and ignores greybody factors: an order-of-magnitude estimate. Page (1976) showed that emitting all particle species and greybody factors change it; the commonly quoted mass of a primordial black hole evaporating today is about 5×10¹¹ kg (5×10¹⁴ g; Carr et al. 2021 use it as M<sub>*</sub>).</>}
        es={<>El tiempo de evaporación <Tex>{'t_{ev}=5120\\pi G^2M^3/(\\hbar c^4)'}</Tex> cuenta solo fotones e ignora los factores de cuerpo gris: es una estimación de orden de magnitud. Page (1976) mostró que emitir todas las especies y los factores de cuerpo gris lo cambian; la masa que suele citarse para un agujero negro primordial que se evapora hoy es de unos 5×10¹¹ kg (5×10¹⁴ g; Carr et al. 2021 la usan como M<sub>*</sub>).</>} /></p>
      <h2>{t('Hotter or colder than the CMB?', '¿Más caliente o más frío que el CMB?')}</h2>
      <p style={{ fontSize: 12 }}><T
        en={<>T_H equals the CMB (2.7255 K) at M = {fmtSci(Mx, 3)} kg. A hole heavier than this is colder than the CMB, so it absorbs more than it emits and does not shrink. Every astrophysical black hole is far above that mass, so Hawking radiation from them has never been observed. Steinhauer (2016) reported Hawking-like radiation in a Bose–Einstein condensate: that is an analogue system, not an astrophysical black hole.</>}
        es={<>T_H iguala al CMB (2,7255 K) con M = {fmtSci(Mx, 3)} kg. Un agujero más pesado está más frío que el CMB, así que absorbe más de lo que emite y no se encoge. Todo agujero negro astrofísico supera con creces esa masa, así que nunca se ha observado su radiación de Hawking. Steinhauer (2016) informó de radiación tipo Hawking en un condensado de Bose–Einstein: es un sistema análogo, no un agujero negro astrofísico.</>} /></p>
      <Plot label={t('Hawking temperature versus mass, log-log', 'Temperatura de Hawking frente a masa, log-log')}
        pts={sample(LOGM_MIN, LOGM_MAX, (x) => log(m.hawkingT(10 ** x)))} xr={[LOGM_MIN, LOGM_MAX]} yr={[-18, 14]}
        xl="log₁₀ M [kg]" yl="log₁₀ T_H [K]" hline={{ y: log(m.T_CMB), text: 'T_CMB' }}
        marks={[{ x: logM, y: log(temp), text: t('you', 'tú'), color: PAL.p }, ...HOLES.map((h) => ({ x: log(h.M), y: log(m.hawkingT(h.M)), text: t(h.en, h.es), color: PAL.du }))]} />
      <Note>{t('Real-hole masses: celestial data (Sgr A*: GRAVITY 2022; M87*: EHT 2019).', 'Masas de los agujeros reales: datos celestes (Sgr A*: GRAVITY 2022; M87*: EHT 2019).')} {HOLES.map((h) => `${h.en}: ${fmtSci(m.hawkingT(h.M), 2)} K`).join('; ')}</Note>
      <Cite list={[SRC.hawking75, SRC.page76, SRC.carr21, SRC.fixsen, SRC.steinhauer, SRC.codata, ...HOLES[1].sources.map((s) => ({ ...s, checked: SRC.codata.checked }))]} />
    </div>
  );
}

function HawkingScene() {
  const { logM } = useQuantum();
  const lt = log(m.hawkingT(10 ** logM)); // -18 .. 13
  const k = Math.min(1, Math.max(0, (lt + 18) / 31));
  const color = useMemo(() => new THREE.Color().setHSL(0.02 + 0.58 * k, 1, 0.35 + 0.3 * k), [k]);
  return (
    <group>
      <mesh><sphereGeometry args={[0.65, 48, 32]} /><meshBasicMaterial color={color} transparent opacity={0.1 + 0.35 * k} side={THREE.BackSide} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[0.5, 48, 32]} /><meshBasicMaterial color="#000000" /></mesh>
      <Label text="r_s" position={[0, 0.82, 0]} color="#ffffff" />
      <Label text="illustration only: glow colour ~ log T_H" position={[0, -0.9, 0]} color={PAL.ghost} height={0.07} />
    </group>
  );
}

/* ------------------------------ Lambda ------------------------------ */
function LambdaPanel() {
  const t = useTr();
  const { logE, set } = useQuantum();
  const Ec = 10 ** logE;
  const mm = m.logMismatch(Ec);
  const rl = m.rhoLambda();
  return (
    <div>
      <Slider label={t('Cutoff energy, log scale', 'Energía de corte, escala log')} value={logE} min={-3} max={LOG_E_MAX} step={0.01} onChange={(v) => set({ logE: v })}
        text={`E_c = ${fmtSci(Ec, 3)} eV`} />
      <Tex block>{'\\rho_{vac}\\approx\\dfrac{E_c^4}{16\\pi^2(\\hbar c)^3}'}</Tex>
      <Tex block>{'\\rho_\\Lambda=\\Omega_\\Lambda\\dfrac{3H_0^2}{8\\pi G}'}</Tex>
      <Readout label={t('Cosmological-constant readouts', 'Lecturas de la constante cosmológica')} rows={[
        [<Tex key="a">{'\\rho_{vac}c^2'}</Tex>, `${fmtSci(m.rhoVacEnergy(Ec * m.EV), 3)} J/m³`],
        [<Tex key="b">{'\\rho_\\Lambda c^2'}</Tex>, `${fmtSci(rl * C ** 2, 3)} J/m³ (${fmtSci(rl, 3)} kg/m³)`],
        [<Tex key="c">{'\\log_{10}(\\rho_{vac}/\\rho_\\Lambda)'}</Tex>, fmt(mm, 2)],
        [t('at E_c = E_P', 'con E_c = E_P'), `${fmt(m.logMismatch(m.E_P_EV), 2)}`],
        [<Tex key="d">{'\\rho_\\Lambda^{1/4}'}</Tex>, `${fmt(m.lambdaFourthRootEv() * 1e3, 3)} meV`],
        [t('E_c with ρ_vac = ρ_Λ', 'E_c con ρ_vac = ρ_Λ'), `${fmt(m.lambdaScaleEv() * 1e3, 3)} meV`],
        [t('check at that E_c', 'comprobación con ese E_c'), fmtSci(m.logMismatch(m.lambdaScaleEv()), 2)],
      ]} />
      <Note>{t('Planck 2018 base ΛCDM (H0 = 67.66, Ω_Λ = 1 − Ω_m − Ω_r from the repo). ρ_Λ^{1/4} is the familiar ~2.3 meV; the 1/(16π²) convention moves the matching cutoff to the larger value shown.',
        'ΛCDM base de Planck 2018 (H0 = 67,66; Ω_Λ = 1 − Ω_m − Ω_r del repositorio). ρ_Λ^{1/4} es el conocido ~2,3 meV; la convención 1/(16π²) lleva el corte equivalente al valor mayor mostrado.')}</Note>
      <p style={{ fontSize: 12 }}><T
        en={<>Honest caveat: this naive cutoff estimate is itself contested. Martin (2012) argues the discrepancy is overstated once zero-point energy is properly renormalised, though a fine-tuning problem remains. There is no accepted resolution as of Nov 2026.</>}
        es={<>Aviso honesto: esta estimación ingenua con corte es en sí misma discutida. Martin (2012) sostiene que la discrepancia se exagera cuando la energía del punto cero se renormaliza bien, aunque sigue habiendo un problema de ajuste fino. No hay una resolución aceptada a noviembre de 2026.</>} /></p>
      <Cite list={[SRC.planck18, SRC.martin, SRC.pdg, SRC.lhc, SRC.amaterasu]} />
    </div>
  );
}

const ladderY = (le: number) => -1.4 + (2.8 * (le + 3)) / (LOG_E_MAX + 3);
function LambdaScene() {
  const { logE } = useQuantum();
  const ticks: [string, number, string][] = [
    ['meV', -3, '#fff'], ['E_Λ', log(m.lambdaScaleEv()), PAL.warn], ['eV', 0, '#fff'], ['GeV', 9, '#fff'],
    ...SCALES.map((s): [string, number, string] => [s.en, log(s.eV), PAL.du]), ['E_P', LOG_E_MAX, PAL.warn],
  ];
  return (
    <group>
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.04, 2.8, 0.04]} /><meshBasicMaterial color={PAL.ghost} /></mesh>
      {ticks.map(([txt, le, c]) => (
        <group key={txt}><mesh position={[0, ladderY(le), 0]}><boxGeometry args={[0.16, 0.012, 0.04]} /><meshBasicMaterial color={c} /></mesh>
          <Label text={txt} position={[0.62, ladderY(le), 0]} color={c} height={0.075} /></group>
      ))}
      <mesh position={[0, ladderY(logE), 0]}><sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color={PAL.p} /></mesh>
      <Label text="E_c" position={[-0.3, ladderY(logE), 0]} color={PAL.p} height={0.09} />
    </group>
  );
}

/* ------------------------------ Scales ------------------------------ */
function ScalesPanel() {
  const t = useTr();
  const { logM3, set } = useQuantum();
  const M = 10 ** logM3, rs = m.schwarzschildR(M), rP = m.planckCurvatureRadius(M);
  const xr: [number, number] = [log(rP) - 1, log(rs) + 2];
  return (
    <div>
      <h2>{t('Planck units (CODATA 2018)', 'Unidades de Planck (CODATA 2018)')}</h2>
      <Readout label={t('Planck units', 'Unidades de Planck')} rows={[
        [t('length l_P', 'longitud l_P'), `${fmtSci(m.L_P, 4)} m`], [t('time t_P', 'tiempo t_P'), `${fmtSci(m.T_P, 4)} s`],
        [t('mass m_P', 'masa m_P'), `${fmtSci(m.M_P, 4)} kg`], [t('energy E_P', 'energía E_P'), `${fmtSci(m.E_P_EV / 1e9, 4)} GeV`],
        [t('density', 'densidad'), `${fmtSci(m.RHO_P, 4)} kg/m³`],
      ]} />
      <Note>l_P = √(ħG/c³), t_P = l_P/c, m_P = √(ħc/G), E_P = m_P c², ρ_P = c⁵/(ħG²). <Src s={SRC.codata} /> ({SRC.codata.checked})</Note>
      <h2>{t('Where theory is expected to fail', 'Dónde se espera que falle la teoría')}</h2>
      <ul style={{ fontSize: 12, paddingLeft: 18 }}>
        <li><T en={<>Singularity theorems: Penrose (1965) showed that a trapped surface forces an incomplete geodesic; Hawking–Penrose (1970) extended this to generic conditions, cosmological and collapse. They signal that classical GR breaks down; they do not say what happens.</>}
          es={<>Teoremas de singularidad: Penrose (1965) mostró que una superficie atrapada fuerza una geodésica incompleta; Hawking–Penrose (1970) lo extendieron a condiciones genéricas, cosmológicas y de colapso. Indican que la RG clásica falla; no dicen qué ocurre.</>} /> (<Src s={SRC.penrose65} />; <Src s={SRC.hawkingPenrose} />)</li>
        <li><T en={<>Non-renormalisability: Goroff & Sagnotti (1986) found an uncancelled two-loop divergence in pure gravity, so GR is not a predictive perturbative quantum field theory.</>}
          es={<>No renormalizabilidad: Goroff y Sagnotti (1986) hallaron una divergencia a dos lazos que no se cancela en gravedad pura, así que la RG no es una teoría cuántica de campos perturbativa predictiva.</>} /> (<Src s={SRC.goroff} />)</li>
        <li><T en={<>Information problem: Hawking (1976) argued evaporation turns pure states into mixed ones; Page (1993) described the entropy of the radiation (the Page curve). In 2019 Penington and Almheiri–Engelhardt–Marolf–Maxfield obtained a Page-curve-like result using "islands" and replica wormholes in toy models. Its relevance to real black holes is still debated as of Nov 2026.</>}
          es={<>Problema de la información: Hawking (1976) argumentó que la evaporación convierte estados puros en mixtos; Page (1993) describió la entropía de la radiación (la curva de Page). En 2019 Penington y Almheiri–Engelhardt–Marolf–Maxfield obtuvieron un resultado tipo curva de Page con "islas" y agujeros de gusano de réplicas en modelos simplificados. Su relevancia para agujeros negros reales sigue debatida a noviembre de 2026.</>} /> (<Src s={SRC.hawking76} />; <Src s={SRC.page93} />; <Src s={SRC.penington} />; <Src s={SRC.aemm} />)</li>
      </ul>
      <h2>{t('Curvature dial', 'Dial de curvatura')}</h2>
      <Slider label={t('Schwarzschild mass, log scale', 'Masa de Schwarzschild, escala log')} value={logM3} min={LOGM_MIN} max={LOGM_MAX} step={0.01} onChange={(v) => set({ logM3: v })}
        text={`M = ${fmtSci(M, 2)} kg = ${fmtSci(M / m.M_SUN, 2)} M☉`} />
      <Tex block>{'K=\\dfrac{48G^2M^2}{c^4r^6},\\qquad \\sqrt K=\\ell_P^{-2}\\ \\text{at}\\ r_P'}</Tex>
      <Readout label={t('Curvature readouts', 'Lecturas de curvatura')} rows={[
        [<Tex key="a">r_s</Tex>, `${fmtSci(rs, 3)} m`],
        [<Tex key="b">{'\\sqrt{K}(r_s)\\,\\ell_P^2'}</Tex>, fmtSci(m.curvaturePlanck(M, rs), 3)],
        [<Tex key="c">r_P</Tex>, `${fmtSci(rP, 3)} m`],
        [<Tex key="d">r_P/r_s</Tex>, fmtSci(rP / rs, 3)],
        [t('check √K(r_P)·l_P²', 'comprobación √K(r_P)·l_P²'), fmt(m.curvaturePlanck(M, rP), 6)],
      ]} />
      <Plot label={t('Curvature versus radius, log-log', 'Curvatura frente a radio, log-log')}
        pts={sample(xr[0], xr[1], (x) => log(m.curvaturePlanck(M, 10 ** x)))} xr={xr} yr={[-40, 5]}
        xl="log₁₀ r [m]" yl="log₁₀ √K ℓ_P²" hline={{ y: 0, text: t('Planck curvature', 'curvatura de Planck') }}
        marks={[{ x: log(rs), y: log(m.curvaturePlanck(M, rs)), text: 'r_s', color: PAL.du }, { x: log(rP), y: 0, text: 'r_P', color: PAL.warn }]} />
      <Note>{t('For a solar-mass hole the curvature at the horizon is tiny compared with the Planck curvature; quantum gravity is expected to matter only deep inside, near the singularity. "Expected" is the key word: this is where the classical formula would stop being trustworthy, not a prediction of what happens.',
        'En un agujero de una masa solar la curvatura en el horizonte es diminuta frente a la de Planck; se espera que la gravedad cuántica importe solo muy adentro, cerca de la singularidad. "Se espera" es la clave: ahí la fórmula clásica dejaría de ser fiable, no es una predicción de lo que ocurre.')}</Note>
    </div>
  );
}

function ScalesScene() {
  const { logM3 } = useQuantum();
  const M = 10 ** logM3, ratio = Math.max(0.02, m.planckCurvatureRadius(M) / m.schwarzschildR(M));
  return (
    <group>
      <mesh><sphereGeometry args={[0.7, 48, 32]} /><meshBasicMaterial color="#000000" /></mesh>
      <mesh><sphereGeometry args={[0.7, 32, 16]} /><meshBasicMaterial color={PAL.ghost} wireframe transparent opacity={0.25} /></mesh>
      <mesh><sphereGeometry args={[0.7 * Math.min(1, ratio), 24, 16]} /><meshBasicMaterial color={PAL.warn} wireframe /></mesh>
      <Label text="r_s" position={[0, 0.95, 0]} />
      <Label text="r_P (not to scale)" position={[0, -0.95, 0]} color={PAL.warn} height={0.08} />
    </group>
  );
}

/* ------------------------------ exports ------------------------------ */
export function Scene() {
  const mode = useQuantum((s) => s.mode);
  return mode === 'hawking' ? <HawkingScene /> : mode === 'lambda' ? <LambdaScene /> : <ScalesScene />;
}

export function Panel() {
  const t = useTr();
  const { mode, set } = useQuantum();
  const items: readonly (readonly [QMode, string])[] = [['hawking', t('Hawking', 'Hawking')], ['lambda', 'Λ'], ['scales', t('Breakdown scales', 'Escalas de ruptura')]];
  return (
    <div>
      <Seg label={t('Quantum limits mode', 'Modo de límites cuánticos')} value={mode} items={items} onPick={(v) => set({ mode: v })} />
      <Note>{t('Everything here is the geometry around open problems: numbers from formulas, not a resolution of anything. Scenes are illustrations; no animation.', 'Todo esto es la geometría alrededor de problemas abiertos: números de fórmulas, no una resolución de nada. Las escenas son ilustraciones; sin animación.')}</Note>
      {mode === 'hawking' ? <HawkingPanel /> : mode === 'lambda' ? <LambdaPanel /> : <ScalesPanel />}
    </div>
  );
}
