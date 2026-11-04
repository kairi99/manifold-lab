import { useEffect } from 'react';
import { useStore } from '../state/store';
import { T, tr, useLang, useTr } from '../i18n';
import { Tex, fmt } from '../panels/Tex';
import type { CelestialBody } from '../data/celestial';
import { horizons, ergosphere, iscoKerr, photonOrbitKerr, frameDragging, circularEquatorial } from '../math/kerr';
import { kerrOrbits, kerrPrecession } from '../scene/KerrScene';

const RAD = 180 / Math.PI;
const A_MAX = 0.998;

const W = 360, H = 200, ML = 38, MR = 10, MT = 12, MB = 30, YMAX = 9, N = 60;

/** ISCO(a) and photon-orbit(a) radii, prograde and retrograde, with the horizon and the current spin marked. */
function KerrPlot({ a }: { a: number }) {
  const t = useTr();
  const x = (v: number) => ML + (v / 1) * (W - ML - MR);
  const y = (v: number) => MT + (1 - Math.min(v, YMAX) / YMAX) * (H - MT - MB);
  const as = Array.from({ length: N + 1 }, (_, i) => (i / N) * A_MAX);
  const path = (f: (a: number) => number) => as.map((v, i) => `${i ? 'L' : 'M'}${x(v).toFixed(1)},${y(f(v)).toFixed(1)}`).join('');
  const curves: [string, string, (a: number) => number, string?][] = [
    [t('ISCO pro', 'ISCO prog.'), '#35e0c2', (v) => iscoKerr(v, true)],
    [t('ISCO retro', 'ISCO retr.'), '#ff6bd6', (v) => iscoKerr(v, false)],
    [t('photon pro', 'fotón prog.'), '#ffd166', (v) => photonOrbitKerr(v, true), '4 3'],
    [t('photon retro', 'fotón retr.'), '#ffa94d', (v) => photonOrbitKerr(v, false), '4 3'],
    [t('horizon r+', 'horizonte r+'), '#ff9f43', (v) => horizons(v).rPlus, '1 3'],
  ];
  const label = t(`Radii versus spin a from 0 to 1. At a = 0 the ISCO is 6 M and the photon orbit 3 M. At a = ${fmt(a, 3)} the prograde ISCO is ${fmt(iscoKerr(a, true), 2)} M, retrograde ${fmt(iscoKerr(a, false), 2)} M, prograde photon orbit ${fmt(photonOrbitKerr(a, true), 2)} M, retrograde ${fmt(photonOrbitKerr(a, false), 2)} M.`,
    `Radios frente al espín a de 0 a 1. En a = 0 la ISCO está en 6 M y la órbita de fotones en 3 M. En a = ${fmt(a, 3)} la ISCO progrado está en ${fmt(iscoKerr(a, true), 2)} M, la retrógrada en ${fmt(iscoKerr(a, false), 2)} M, la órbita de fotones progrado en ${fmt(photonOrbitKerr(a, true), 2)} M y la retrógrada en ${fmt(photonOrbitKerr(a, false), 2)} M.`);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', maxWidth: '100%' }}>
        <title>{label}</title>
        <rect x={ML} y={MT} width={W - ML - MR} height={H - MT - MB} style={{ fill: 'none', stroke: 'var(--border)' }} />
        {curves.map(([n, c, f, d]) => <path key={n} d={path(f)} fill="none" strokeWidth="2" strokeDasharray={d} style={{ stroke: c }} />)}
        <line x1={x(a)} x2={x(a)} y1={MT} y2={H - MB} style={{ stroke: 'var(--fg)' }} strokeWidth="1" />
        {[0, 0.5, 1].map((tk) => (
          <g key={tk}><text x={x(tk)} y={H - MB + 14} fontSize="10" textAnchor="middle" style={{ fill: 'var(--fg)' }}>{tk}</text></g>
        ))}
        {[0, 3, 6, 9].map((tk) => <text key={tk} x={ML - 6} y={y(tk) + 3} fontSize="10" textAnchor="end" style={{ fill: 'var(--fg)' }}>{tk}</text>)}
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize="10" textAnchor="middle" style={{ fill: 'var(--muted)' }}>a / M</text>
        <text x={10} y={(MT + H - MB) / 2} fontSize="10" textAnchor="middle" transform={`rotate(-90 10 ${(MT + H - MB) / 2})`} style={{ fill: 'var(--muted)' }}>r / M</text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', fontSize: 11 }}>
        {curves.map(([n, c]) => <span key={n} style={{ color: c }}>{n}</span>)}
      </div>
    </>
  );
}

export function KerrPanel({ body }: { body: CelestialBody | null }) {
  const t = useTr(), lang = useLang();
  const a = useStore((s) => s.grSpin), retro = useStore((s) => s.grRetro), playing = useStore((s) => s.grPlaying);
  const rp = useStore((s) => s.grRp), ra = useStore((s) => s.grRa), set = useStore((s) => s.set);
  // reduced motion: start paused; the play button still works
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) useStore.getState().set({ grPlaying: false });
  }, []);
  const { rPlus, rMinus } = horizons(a);
  const pro = !retro;
  const rI = iscoKerr(a, pro);
  const circ = circularEquatorial(a, rI, pro);
  const orbits = kerrOrbits(a, rp, ra);
  const precPro = kerrPrecession(orbits.pro.traj), precRetro = kerrPrecession(orbits.retro.traj);
  const sp = body?.spin;
  const deg = (v: number | null) => (v === null ? t('n/a (< 2 periapsides)', 'n/d (< 2 periapsis)') : `${fmt(v * RAD, 2)}°`);

  return (
    <div data-tour="gr-kerr">
      <label className="field"><span>{t('Spin', 'Espín')} a/M = {fmt(a, 3)}</span>
        <input type="range" min={0} max={A_MAX} step={0.001} value={a} aria-label={t('Black hole spin a over M', 'Espín a sobre M del agujero negro')} onChange={(e) => set({ grSpin: +e.target.value })} /></label>
      <div role="group" aria-label={t('Orbit direction', 'Sentido de la órbita')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {([['Prograde', 'Progrado', false], ['Retrograde', 'Retrógrado', true]] as const).map(([en, es, v]) => (
          <button key={en} aria-pressed={retro === v} onClick={() => set({ grRetro: v })}
            style={{ padding: 6, background: retro === v ? 'var(--accent)' : 'var(--bg)', color: retro === v ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>{tr(lang, en, es)}</button>
        ))}
      </div>
      <label className="field"><span>{t('Periapsis', 'Periapsis')} r<sub>p</sub> = {fmt(rp, 1)} M</span>
        <input type="range" min={2.5} max={60} step={0.1} value={rp} aria-label={t('Periapsis radius', 'Radio del periapsis')} onChange={(e) => set({ grRp: +e.target.value, grProgress: 0 })} /></label>
      <label className="field"><span>{t('Apoapsis', 'Apoapsis')} r<sub>a</sub> = {fmt(ra, 1)} M</span>
        <input type="range" min={2.5} max={60} step={0.1} value={ra} aria-label={t('Apoapsis radius', 'Radio del apoapsis')} onChange={(e) => set({ grRa: +e.target.value, grProgress: 0 })} /></label>
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button onClick={() => set({ grPlaying: !playing })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => set({ grPlaying: false, grProgress: 0 })}>{t('Reset', 'Reiniciar')}</button>
      </div>

      {sp && body && (
        <>
          <h2>{tr(lang, body.name, body.nameEs ?? body.name)} {t('spin', 'espín')}</h2>
          <div className="readout">
            <span>a/M</span><span>{sp.value}{sp.lower !== undefined && sp.upper !== undefined ? ` (${sp.lower} to ${sp.upper})` : ''}</span>
            <span>{t('method', 'método')}</span><span>{tr(lang, sp.method, sp.methodEs ?? sp.method)}</span>
          </div>
          <p style={{ fontSize: 12 }}>{t('Source', 'Fuente')}: {sp.source.url ? <a href={sp.source.url} target="_blank" rel="noreferrer">{sp.source.label}</a> : sp.source.label}</p>
          <button onClick={() => set({ grSpin: Math.min(A_MAX, sp.value) })}>{t('Set slider to', 'Poner el deslizador en')} {Math.min(A_MAX, sp.value)}</button>
        </>
      )}

      <h2>{t('Kerr metric (Boyer–Lindquist)', 'Métrica de Kerr (Boyer–Lindquist)')}</h2>
      <Tex block>{String.raw`\begin{aligned}ds^2={}&-\Big(1-\tfrac{2Mr}{\Sigma}\Big)dt^2-\tfrac{4Mar\sin^2\theta}{\Sigma}\,dt\,d\varphi\\&+\tfrac{\Sigma}{\Delta}dr^2+\Sigma\,d\theta^2\\&+\Big(r^2+a^2+\tfrac{2Ma^2r\sin^2\theta}{\Sigma}\Big)\sin^2\theta\,d\varphi^2\end{aligned}`}</Tex>
      <Tex block>{String.raw`\Sigma=r^2+a^2\cos^2\theta,\quad \Delta=r^2-2Mr+a^2`}</Tex>
      <Tex block>{String.raw`\begin{aligned}r_\pm&=M\pm\sqrt{M^2-a^2}\\r_E(\theta)&=M+\sqrt{M^2-a^2\cos^2\theta}\\\omega&=-\frac{g_{t\varphi}}{g_{\varphi\varphi}}=\frac{2Mar}{(r^2+a^2)^2-a^2\Delta\sin^2\theta}\end{aligned}`}</Tex>
      <p>{t('ISCO (Bardeen–Press–Teukolsky), upper sign prograde:', 'ISCO (Bardeen–Press–Teukolsky), signo superior progrado:')}</p>
      <Tex block>{String.raw`\begin{aligned}r_{\rm ISCO}&=M\big(3+Z_2\mp\sqrt{(3-Z_1)(3+Z_1+2Z_2)}\big)\\Z_1&=1+(1-\chi^2)^{1/3}\big[(1+\chi)^{1/3}+(1-\chi)^{1/3}\big]\\Z_2&=\sqrt{3\chi^2+Z_1^2},\quad\chi=a/M\end{aligned}`}</Tex>
      <p style={{ fontSize: 12 }}>{t('The horizon is drawn as a sphere of radius r+ in Boyer–Lindquist coordinates, which are not Euclidean; the true embedding is oblate. Inside the ergosphere (purple) no observer can stay static, and even L = 0 observers (ZAMOs, dots) are dragged around at ω(r).', 'El horizonte se dibuja como una esfera de radio r+ en coordenadas de Boyer–Lindquist, que no son euclídeas; la inmersión real es achatada. Dentro de la ergosfera (morado) ningún observador puede permanecer estático, e incluso los observadores con L = 0 (ZAMOs, puntos) son arrastrados a la velocidad ω(r).')}</p>

      <h2>{t('Radii vs spin', 'Radios frente al espín')}</h2>
      <KerrPlot a={a} />

      <h2>{t('Readouts', 'Lecturas')} (a = {fmt(a, 3)}, {pro ? t('prograde', 'progrado') : t('retrograde', 'retrógrado')})</h2>
      <div className="readout">
        <span>r+ , r−</span><span>{fmt(rPlus, 4)}, {fmt(rMinus, 4)} M</span>
        <span>{t('ergosphere (equator)', 'ergosfera (ecuador)')}</span><span>{fmt(ergosphere(a, Math.PI / 2), 3)} M</span>
        <span>{t('ISCO pro, retro', 'ISCO prog., retr.')}</span><span>{fmt(iscoKerr(a, true), 3)}, {fmt(iscoKerr(a, false), 3)} M</span>
        <span>{t('photon pro, retro', 'fotón prog., retr.')}</span><span>{fmt(photonOrbitKerr(a, true), 3)}, {fmt(photonOrbitKerr(a, false), 3)} M</span>
        <span>{t('ZAMO ω at ISCO', 'ω de los ZAMO en la ISCO')}</span><span>{fmt(frameDragging(a, rI, Math.PI / 2), 5)} /M</span>
        {circ ? (
          <>
            <span>{t('orbital Ω at ISCO', 'Ω orbital en la ISCO')}</span><span>{fmt(circ.Omega, 5)} /M</span>
            <span>E<sub>ISCO</sub></span><span>{fmt(circ.E, 5)}</span>
            <span>L<sub>ISCO</sub></span><span>{fmt(circ.L, 4)} M</span>
            <span>{t('efficiency 1 − E', 'eficiencia 1 − E')}</span><span>{fmt((1 - circ.E) * 100, 2)} %</span>
          </>
        ) : <><span>{t('ISCO orbit', 'órbita ISCO')}</span><span>{t('n/a', 'n/d')}</span></>}
      </div>
      <p style={{ fontSize: 12 }}><T en={<>Accretion releases 1 − E<sub>ISCO</sub> of the rest mass: 5.7% at a = 0, up to about 32% at a = 0.998 (prograde).</>} es={<>La acreción libera 1 − E<sub>ISCO</sub> de la masa en reposo: 5.7% en a = 0, hasta cerca del 32% en a = 0.998 (progrado).</>} /></p>

      <h2>{t('Orbit precession', 'Precesión orbital')} (r<sub>p</sub> = {fmt(Math.min(rp, ra), 1)}, r<sub>a</sub> = {fmt(Math.max(rp, ra), 1)} M)</h2>
      <div className="readout">
        <span>{t('prograde / orbit', 'progrado / órbita')}</span><span>{orbits.pro.orb ? deg(precPro) : t('no bound orbit', 'sin órbita ligada')}</span>
        <span>{t('retrograde / orbit', 'retrógrado / órbita')}</span><span>{orbits.retro.orb ? deg(precRetro) : t('no bound orbit', 'sin órbita ligada')}</span>
        <span>{t('fate pro, retro', 'destino prog., retr.')}</span><span>{orbits.pro.traj?.fate ?? '—'}, {orbits.retro.traj?.fate ?? '—'}</span>
      </div>
      <p style={{ fontSize: 12 }}>{t('Compare the two: frame dragging adds a Lense–Thirring contribution whose sign depends on the direction of motion.', 'Compara ambos: el arrastre de marcos añade una contribución de Lense–Thirring cuyo signo depende del sentido del movimiento.')}</p>
    </div>
  );
}
