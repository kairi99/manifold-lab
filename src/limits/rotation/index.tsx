import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Seg, Note, Src } from '../../panels/SpacetimeUi';
import { Tex, fmt, fmtSci } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { PAL } from '../../theme/palette';
import { GALAXIES, SPARC_SOURCE } from './data';
import { useRot } from './state';
import {
  A0_DEFAULT, G, baryonMass, chi2Dof, fitHalo, halfRadius, modelSpeed, v2Nfw, v2NfwNumeric, rar,
  vBarAt, vHaloTotAt, vMondAt, v2Halo, type Model, type Params,
} from './math';

const useParams = (): Params => {
  const s = useRot();
  return { yd: s.yd, yb: s.yb, halo: s.halo, logRho: s.logRho, rs: s.rs, a0: s.a0 };
};
const useGal = () => {
  const id = useRot((s) => s.gal);
  return GALAXIES.find((g) => g.id === id) ?? GALAXIES[0];
};

const N = 4000, TRACERS = [0.25, 0.5, 0.85], R_SCENE = 1.6;

function Layer({ r, th, pos, size, color, omega, clock }: { r: Float32Array; th: Float32Array; pos: Float32Array; size: number; color: Float32Array | string; omega: React.MutableRefObject<Float32Array>; clock: React.MutableRefObject<number> }) {
  const attr = useRef<THREE.BufferAttribute>(null);
  const apply = () => {
    const w = omega.current, n = w.length - 1, arr = attr.current?.array as Float32Array | undefined;
    if (!arr) return;
    for (let i = 0; i < r.length; i++) {
      const f = Math.min(r[i], 1) * n, k = Math.min(Math.floor(f), n - 1);
      const om = w[k] + (w[k + 1] - w[k]) * (f - k);
      const a = th[i] + om * clock.current;
      arr[3 * i] = r[i] * R_SCENE * Math.cos(a);
      arr[3 * i + 2] = r[i] * R_SCENE * Math.sin(a);
    }
    attr.current!.needsUpdate = true;
  };
  useFrame(apply);
  const col = typeof color === 'string';
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={attr} attach="attributes-position" args={[pos, 3]} />
        {!col && <bufferAttribute attach="attributes-color" args={[color, 3]} />}
      </bufferGeometry>
      <pointsMaterial size={size} sizeAttenuation vertexColors={!col} color={col ? color : '#ffffff'} transparent opacity={col ? 1 : 0.85} depthWrite={false} />
    </points>
  );
}

export function Scene() {
  const gal = useGal(), p = useParams();
  const { drive, playing, resetTick } = useRot();
  const rmax = gal.r[gal.r.length - 1];
  const clk = useRef(0);
  const omega = useRef(new Float32Array(65));
  // angular speed (rad per scene second) tabulated on a normalised radius grid
  useMemo(() => {
    const w = new Float32Array(65);
    for (let k = 0; k <= 64; k++) {
      const r = Math.max(k / 64, 0.02) * rmax;
      w[k] = (modelSpeed(gal, p, drive, r) / r) * 0.04;
    }
    omega.current = w;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gal, p.yd, p.yb, p.halo, p.logRho, p.rs, p.a0, drive, rmax]);
  useEffect(() => { clk.current = 0; }, [resetTick, gal]);
  useFrame((_, dt) => { if (playing) clk.current += Math.min(dt, 0.05); });

  const disc = useMemo(() => {
    let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const r = new Float32Array(N), th = new Float32Array(N), pos = new Float32Array(3 * N), col = new Float32Array(3 * N);
    const h = 0.28, norm = 1 - Math.exp(-1 / h);
    const c0 = new THREE.Color(PAL.p), c1 = new THREE.Color(PAL.dv), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      r[i] = Math.max(0.02, -h * Math.log(1 - rnd() * norm));
      // two logarithmic spiral arms plus a smooth background; differential rotation then winds them
      th[i] = rnd() < 0.7 ? Math.floor(rnd() * 2) * Math.PI + 3 * Math.log(r[i] / 0.3) + (rnd() - 0.5) * 0.9 : rnd() * 2 * Math.PI;
      pos[3 * i + 1] = (rnd() - 0.5) * 0.04 * (1.2 - r[i]);
      c.lerpColors(c0, c1, Math.min(1, r[i] * 1.3));
      col.set([c.r, c.g, c.b], 3 * i);
    }
    return { r, th, pos, col };
  }, []);
  const tr = useMemo(() => {
    const r = Float32Array.from(TRACERS), th = new Float32Array(TRACERS.length), pos = new Float32Array(3 * TRACERS.length);
    return { r, th, pos };
  }, []);
  return (
    <group>
      <ambientLight />
      <Layer {...disc} size={0.018} color={disc.col} omega={omega} clock={clk} />
      <Layer {...tr} size={0.08} color={PAL.warn} omega={omega} clock={clk} />
    </group>
  );
}

const W = 360, H = 250, ML = 40, MR = 8, MT = 8, MB = 34;

function Plot({ p }: { p: Params }) {
  const t = useTr();
  const g = useGal();
  const rmax = g.r[g.r.length - 1];
  const vmax = Math.max(...g.vObs.map((v, i) => v + g.err[i])) * 1.1;
  const x = (r: number) => ML + (r / rmax) * (W - ML - MR);
  const y = (v: number) => H - MB - (v / vmax) * (H - MT - MB);
  const rs = useMemo(() => Array.from({ length: 121 }, (_, k) => (k / 120) * rmax), [rmax]);
  const curve = (m: Model | 'halo-only') => rs.map((r, k) => {
    const v = r === 0 ? 0 : m === 'halo-only' ? Math.sqrt(Math.max(0, v2Halo(p.halo, 10 ** p.logRho, p.rs, r))) : modelSpeed(g, p, m, r);
    return `${k ? 'L' : 'M'}${x(r).toFixed(1)},${y(v).toFixed(1)}`;
  }).join('');
  const ticks = [0, 1, 2, 3, 4].map((k) => (k / 4) * rmax);
  const vt = Array.from({ length: 5 }, (_, k) => Math.round(((k / 4) * vmax) / 50) * 50).filter((v, k, a) => a.indexOf(v) === k);
  const items: [string, string, string, string][] = [
    ['bar', PAL.warn, '6 3', t('V_bar (visible matter)', 'V_bar (materia visible)')],
    ['hon', PAL.metric, '1 3', t('dark halo alone', 'halo oscuro solo')],
    ['halo', PAL.path, '', t('baryons + halo', 'bariones + halo')],
    ['mond', PAL.du, '8 3 2 3', 'MOND (RAR)'],
  ];
  const d = { bar: curve('bar'), hon: curve('halo-only'), halo: curve('halo'), mond: curve('mond') };
  return (
    <svg viewBox={`0 0 ${W} ${H + 48}`} role="img" width="100%" aria-label={t(`Rotation curve of ${g.name}: observed speeds with error bars, visible-matter curve, halo and MOND models`, `Curva de rotación de ${g.name}: velocidades observadas con barras de error y modelos de materia visible, halo y MOND`)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}>
      {vt.map((v) => <g key={v}><line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={0.5} /><text x={ML - 4} y={y(v) + 3} fontSize={9} textAnchor="end" fill="var(--muted)">{v}</text></g>)}
      {ticks.map((r) => <text key={r} x={x(r)} y={H - MB + 12} fontSize={9} textAnchor="middle" fill="var(--muted)">{fmt(r, 0)}</text>)}
      <text x={(ML + W - MR) / 2} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--fg)">{t('radius r (kpc)', 'radio r (kpc)')}</text>
      <text transform={`translate(10,${(MT + H - MB) / 2}) rotate(-90)`} fontSize={10} textAnchor="middle" fill="var(--fg)">{t('speed V (km/s)', 'velocidad V (km/s)')}</text>
      {g.r.map((r, i) => (
        <g key={i} stroke="var(--fg)" strokeWidth={1}>
          <line x1={x(r)} x2={x(r)} y1={y(g.vObs[i] - g.err[i])} y2={y(g.vObs[i] + g.err[i])} />
          <circle cx={x(r)} cy={y(g.vObs[i])} r={2.2} fill="var(--fg)" />
        </g>
      ))}
      {items.map(([id, c, dash]) => <path key={id} d={d[id as keyof typeof d]} fill="none" stroke={c} strokeWidth={2} strokeDasharray={dash} />)}
      <g transform={`translate(${ML},${H + 2})`} fontSize={9.5} fill="var(--fg)">
        <g><circle cx={10} cy={4} r={2.2} fill="var(--fg)" /><line x1={10} x2={10} y1={-1} y2={9} stroke="var(--fg)" /><text x={24} y={7}>{t('observed (SPARC) ± error', 'observado (SPARC) ± error')}</text></g>
        {items.map(([id, c, dash, label], k) => (
          <g key={id} transform={`translate(${(k % 2) * 160},${14 + Math.floor(k / 2) * 14 + 0})`}>
            <line x1={0} x2={20} y1={3} y2={3} stroke={c} strokeWidth={2} strokeDasharray={dash} /><text x={24} y={6}>{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

const DRIVES: [Model, string, string][] = [['obs', 'Observed', 'Observada'], ['bar', 'Baryons only', 'Solo bariones'], ['halo', 'With halo', 'Con halo'], ['mond', 'MOND', 'MOND']];
const SRCS = [
  { label: 'SPARC: Lelli, McGaugh & Schombert 2016, AJ 152, 157', url: 'https://astroweb.cwru.edu/SPARC/' },
  { label: 'McGaugh, Lelli & Schombert 2016, PRL 117, 201101 (radial acceleration relation)', url: 'https://doi.org/10.1103/PhysRevLett.117.201101' },
  { label: 'Navarro, Frenk & White 1996, ApJ 462, 563 (NFW profile)', url: 'https://doi.org/10.1086/177173' },
  { label: 'Milgrom 1983, ApJ 270, 365 (MOND)', url: 'https://doi.org/10.1086/161130' },
  { label: 'Clowe et al. 2006, ApJ 648, L109 (Bullet Cluster)', url: 'https://doi.org/10.1086/508162' },
  { label: 'Planck Collaboration 2020, A&A 641, A6 (cosmological parameters)', url: 'https://doi.org/10.1051/0004-6361/201833910' },
];

export function Panel() {
  const t = useTr();
  const s = useRot();
  const g = useGal(), p = useParams();
  const { set } = s;
  const rmax = g.r[g.r.length - 1];
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const dof = (k: number, f: (i: number) => number) => chi2Dof(g, k, f);
  const cBar = dof(0, (i) => vBarAt(g, i, p));
  const cHalo = dof(2, (i) => vHaloTotAt(g, i, p));
  const cMond = dof(0, (i) => vMondAt(g, i, p));
  const half = halfRadius(g, p);
  const mb = baryonMass(g, p);
  const rho = 10 ** p.logRho;
  const chk = rmax / 2;
  const nfwA = v2Nfw(rho, p.rs, chk), nfwB = v2NfwNumeric(rho, p.rs, chk);
  const gHi = 1e3 * A0_DEFAULT, gLo = 1e-6 * A0_DEFAULT;
  const doFit = (halo = p.halo) => {
    const f = fitHalo(g, { ...p, halo });
    set({ logRho: f.logRho, rs: f.rs, fits: { ...s.fits, [halo]: f } });
  };
  const pickGal = (id: string) => {
    const gg = GALAXIES.find((x) => x.id === id) ?? GALAXIES[0];
    const f = fitHalo(gg, p);
    set({ gal: id, logRho: f.logRho, rs: f.rs, resetTick: s.resetTick + 1, fits: { [p.halo]: f } });
  };
  // keep the fit button in sync after a halo-type switch
  const pickHalo = (h: 'iso' | 'nfw') => {
    const f = fitHalo(g, { ...p, halo: h });
    set({ halo: h, logRho: f.logRho, rs: f.rs, fits: { ...s.fits, [h]: f } });
  };
  return (
    <div>
      <Seg label={t('Galaxy', 'Galaxia')} value={s.gal} cols={2} items={GALAXIES.map((x) => [x.id, x.name] as const)} onPick={pickGal} />
      <Note>{t(`${g.type}, distance ${g.distMpc} Mpc, ${g.r.length} radii out to ${fmt(rmax, 1)} kpc.`, `${g.typeEs}, distancia ${g.distMpc} Mpc, ${g.r.length} radios hasta ${fmt(rmax, 1)} kpc.`)}</Note>
      <Plot p={p} />
      <Note>{t('Dots: measured speeds with error bars. Line styles differ as well as colours.', 'Puntos: velocidades medidas con barras de error. Los estilos de línea difieren además de los colores.')}</Note>

      <h2>{t('What drives the animation', 'Qué mueve la animación')}</h2>
      <Seg label={t('Rotation curve driving the disc', 'Curva de rotación que mueve el disco')} value={s.drive} cols={2} items={DRIVES.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ drive: v })} />
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button onClick={() => set({ playing: !s.playing })}>{s.playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => set({ resetTick: s.resetTick + 1 })}>{t('Reset', 'Reiniciar')}</button>
      </div>
      {reduce && <Note>{t('Reduced motion is on: the disc does not rotate until you press Play.', 'Movimiento reducido activado: el disco no gira hasta que pulses Reproducir.')}</Note>}
      <Note>{t('Illustration only: stars are random, the spiral arms are painted on, only the rotation speed profile comes from the model. The three orange tracers started in a line; outer ones lag when the curve falls.', 'Solo ilustración: las estrellas son aleatorias, los brazos espirales son un dibujo, solo el perfil de velocidad de rotación viene del modelo. Los tres trazadores naranjas empezaron alineados; los externos se rezagan si la curva decae.')}</Note>

      <h2>{t('Visible matter', 'Materia visible')}</h2>
      <label className="field"><span>{t('stellar disc', 'disco estelar')} Υ<sub>disk</sub> = {fmt(s.yd, 2)} M☉/L☉</span>
        <input type="range" min={0.1} max={1.2} step={0.01} value={s.yd} aria-label={t('Disc mass-to-light ratio', 'Cociente masa-luminosidad del disco')} onChange={(e) => set({ yd: +e.target.value })} /></label>
      <label className="field"><span>{t('bulge', 'bulbo')} Υ<sub>bul</sub> = {fmt(s.yb, 2)} M☉/L☉</span>
        <input type="range" min={0.1} max={1.2} step={0.01} value={s.yb} aria-label={t('Bulge mass-to-light ratio', 'Cociente masa-luminosidad del bulbo')} onChange={(e) => set({ yb: +e.target.value })} /></label>

      <h2>{t('Dark-matter halo', 'Halo de materia oscura')}</h2>
      <Seg label={t('Halo profile', 'Perfil del halo')} value={s.halo} items={[['iso', t('Pseudo-isothermal', 'Pseudo-isotérmico')], ['nfw', 'NFW']] as const} onPick={pickHalo} />
      <label className="field"><span>log<sub>10</sub> ρ{s.halo === 'iso' ? '₀' : '_s'} = {fmt(s.logRho, 2)} (M☉/kpc³)</span>
        <input type="range" min={4} max={11} step={0.01} value={s.logRho} aria-label={t('Halo log density', 'Log de la densidad del halo')} onChange={(e) => set({ logRho: +e.target.value })} /></label>
      <label className="field"><span>{s.halo === 'iso' ? 'r_c' : 'r_s'} = {fmt(s.rs, 2)} kpc</span>
        <input type="range" min={0.3} max={60} step={0.1} value={Math.min(60, s.rs)} aria-label={t('Halo scale radius', 'Radio de escala del halo')} onChange={(e) => set({ rs: +e.target.value })} /></label>
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}><button onClick={() => doFit()}>{t('Fit halo (least squares)', 'Ajustar halo (mínimos cuadrados)')}</button></div>

      <h2>MOND</h2>
      <label className="field"><span>a₀ = {fmt(s.a0 * 1e10, 2)} × 10⁻¹⁰ m/s²</span>
        <input type="range" min={0.3e-10} max={3e-10} step={0.01e-10} value={s.a0} aria-label="a0" onChange={(e) => set({ a0: +e.target.value })} /></label>

      <div className="readout" aria-label={t('Fit readouts', 'Lecturas del ajuste')}>
        <span>χ²/dof, {t('baryons only', 'solo bariones')}</span><span>{fmt(cBar, 1)}</span>
        <span>χ²/dof, {t('baryons + halo', 'bariones + halo')}</span><span>{fmt(cHalo, 2)}</span>
        <span>χ²/dof, MOND (a₀ {t('as set', 'fijado')})</span><span>{fmt(cMond, 2)}</span>
        <span>{s.halo === 'iso' ? 'ρ₀' : 'ρ_s'}</span><span>{fmtSci(rho, 2)} M☉/kpc³</span>
        <span>{s.halo === 'iso' ? 'r_c' : 'r_s'}</span><span>{fmt(p.rs, 2)} kpc</span>
        <span>{t('halo mass in r<R_last', 'masa del halo en r<R_últ')}</span><span>{fmtSci(Math.max(0, v2Halo(p.halo, rho, p.rs, rmax)) * rmax / G, 2)} M☉</span>
        <span>{t('baryonic mass ≈ V_bar²R/G', 'masa bariónica ≈ V_bar²R/G')}</span><span>{fmtSci(mb, 2)} M☉</span>
        <span>{t('V_bar = ½ V_obs at r', 'V_bar = ½ V_obs en r')}</span><span>{half === null ? t('never in data', 'nunca en los datos') : `${fmt(half, 1)} kpc`}</span>
        <span>{t('check: NFW V² closed form vs ∫ρ', 'comprobación: V² NFW cerrada vs ∫ρ')}</span><span>{fmt(nfwA, 2)} vs {fmt(nfwB, 2)}, Δ = {fmtSci(Math.abs(nfwA - nfwB), 1)}</span>
        <span>{t('check: RAR g_obs/g_bar at 10³a₀; /√(g_bar a₀) at 10⁻⁶a₀', 'comprobación: RAR g_obs/g_bar a 10³a₀; /√(g_bar a₀) a 10⁻⁶a₀')}</span><span>{fmt(rar(gHi, A0_DEFAULT) / gHi, 5)}; {fmt(rar(gLo, A0_DEFAULT) / Math.sqrt(gLo * A0_DEFAULT), 5)}</span>
      </div>
      <Note>{t('SPARC errors are small for some points, so χ²/dof values are large when a model misses by even a few km/s; halo and MOND values compare the shapes, not the physics. The halo has 2 free parameters (dof = N − 2), MOND none here (Υ and a₀ held at the slider values).', 'Los errores de SPARC son pequeños en algunos puntos, así que χ²/dof es grande si un modelo falla por unos pocos km/s; los valores de halo y MOND comparan formas, no la física. El halo tiene 2 parámetros libres (dof = N − 2), MOND ninguno aquí (Υ y a₀ fijos en los valores de los deslizadores).')}</Note>

      <h2>{t('Equations', 'Ecuaciones')}</h2>
      <Tex block>{'V_{\\rm bar}^2=V_{\\rm gas}|V_{\\rm gas}|+\\Upsilon_{\\rm disk}V_{\\rm disk}|V_{\\rm disk}|+\\Upsilon_{\\rm bul}V_{\\rm bul}|V_{\\rm bul}|,\\qquad V_{\\rm tot}^2=V_{\\rm bar}^2+V_{\\rm halo}^2'}</Tex>
      <Tex block>{'V_{\\rm iso}^2=4\\pi G\\rho_0 r_c^2\\left[1-\\tfrac{r_c}{r}\\arctan\\tfrac{r}{r_c}\\right],\\qquad V_{\\rm NFW}^2=\\frac{4\\pi G\\rho_s r_s^3}{r}\\left[\\ln(1+x)-\\tfrac{x}{1+x}\\right],\\ x=\\tfrac{r}{r_s}'}</Tex>
      <Tex block>{'g_{\\rm obs}=\\frac{g_{\\rm bar}}{1-e^{-\\sqrt{g_{\\rm bar}/a_0}}},\\quad g_{\\rm bar}=\\frac{V_{\\rm bar}^2}{r},\\quad V_{\\rm MOND}^2=g_{\\rm obs}\\,r'}</Tex>
      <Note>G = 4.30091×10⁻⁶ kpc (km/s)² / M☉. {t('For a point mass V ∝ r^(−1/2) (Kepler); a constant V needs M(<r) ∝ r.', 'Para una masa puntual V ∝ r^(−1/2) (Kepler); una V constante necesita M(<r) ∝ r.')}</Note>

      <h2>{t('Dark matter or modified gravity?', '¿Materia oscura o gravedad modificada?')}</h2>
      <Note><T
        en={<>At galactic speeds (v/c ~ 10⁻³) Newtonian gravity is an excellent limit of general relativity, so the mismatch between the visible-mass curve and the data is not a relativistic correction. Two families of explanation exist. <b>Unseen mass</b> (ΛCDM, the standard cosmological model): a halo of non-baryonic dark matter, which also accounts for the CMB power spectrum (Planck 2018) and for the separation of lensing mass from gas in the Bullet Cluster. <b>Modified dynamics</b> (MOND, Milgrom 1983): below a single acceleration a₀ ≈ 1.2×10⁻¹⁰ m/s² the effective gravity is √(g_bar a₀); this reproduces many rotation curves and the tight radial acceleration relation with one constant, but as of Nov 2026 it does not by itself account for the CMB or for galaxy-cluster mass without extra unseen matter. Both are active research; ΛCDM is the standard model, and relativistic MOND-like theories are still being tested. The demo cannot decide between them.</>}
        es={<>A velocidades galácticas (v/c ~ 10⁻³) la gravedad newtoniana es un límite excelente de la relatividad general, así que la discrepancia entre la curva de la masa visible y los datos no es una corrección relativista. Hay dos familias de explicación. <b>Masa no vista</b> (ΛCDM, el modelo cosmológico estándar): un halo de materia oscura no bariónica, que también explica el espectro de potencias del CMB (Planck 2018) y la separación entre masa de lente y gas en el Cúmulo Bala. <b>Dinámica modificada</b> (MOND, Milgrom 1983): por debajo de una aceleración a₀ ≈ 1.2×10⁻¹⁰ m/s² la gravedad efectiva es √(g_bar a₀); reproduce muchas curvas de rotación y la ajustada relación de aceleración radial con una sola constante, pero a noviembre de 2026 no explica por sí sola el CMB ni la masa de los cúmulos sin materia no vista adicional. Ambas son líneas de investigación activas; ΛCDM es el modelo estándar y las teorías relativistas tipo MOND aún se ponen a prueba. La demostración no puede decidir entre ellas.</>} /></Note>
      <Note>{t('Υ is uncertain by a factor ~2 and the data cover a limited radius range; both change the baryonic curve. Fitted halo parameters are degenerate with Υ.', 'Υ es incierto en un factor ~2 y los datos cubren un rango limitado de radios; ambos cambian la curva bariónica. Los parámetros del halo ajustado son degenerados con Υ.')}</Note>

      <h2>{t('Sources', 'Fuentes')}</h2>
      <ul style={{ fontSize: 12, paddingLeft: 18 }}>
        {SRCS.map((x) => <li key={x.url}><Src s={x} /></li>)}
        <li>{t('Data files: ', 'Archivos de datos: ')}{GALAXIES.map((x) => x.file).join(', ')} (<Src s={SPARC_SOURCE} />, Rotmod_LTG.zip)</li>
      </ul>
    </div>
  );
}
