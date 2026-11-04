import { useState } from 'react';
import { useStore } from '../state/store';
import { T, tr, useLang, useTr } from '../i18n';
import { Tex, fmt, fmtSci, Rich } from './Tex';
import { REDSHIFT_TESTS, SHAPIRO_TESTS, FRAME_DRAG_TESTS, unitEs } from '../data/grTests';
import { bodyById, C, YEAR } from '../data/celestial';
import type { Source } from '../data/celestial';
import { gravRedshift, redshiftWeakSI, shapiroDelaySI, geodeticPrecessionSI, lenseThirringPolarSI } from '../math/grEffects';

const MAS = (180 / Math.PI) * 3600e3 * YEAR; // rad/s -> mas/yr
const sci = (x: number, d = 3) => (x !== 0 && (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2) ? fmtSci(x, d - 1) : fmt(x, d));
const Src = ({ s }: { s: Source }) => (s.url ? <a href={s.url} target="_blank" rel="noreferrer"><Rich>{s.label}</Rich></a> : <Rich>{s.label}</Rich>);
const ALL = [...REDSHIFT_TESTS, ...SHAPIRO_TESTS, ...FRAME_DRAG_TESTS];

export function ClocksPanel() {
  const t = useTr(), lang = useLang();
  const nm = (o: { name: string; nameEs?: string }) => tr(lang, o.name, o.nameEs ?? o.name);
  const qn = (o: { quantity: string; quantityEs?: string }) => tr(lang, o.quantity, o.quantityEs ?? o.quantity);
  const preset = useStore((s) => s.grClockPreset), set = useStore((s) => s.set);
  const [rGen, setRGen] = useState(6);
  const id = ALL.some((x) => x.id === preset) ? preset : REDSHIFT_TESTS[0].id;
  const rs = REDSHIFT_TESTS.find((x) => x.id === id), sh = SHAPIRO_TESTS.find((x) => x.id === id), fd = FRAME_DRAG_TESTS.find((x) => x.id === id);
  const test = (rs ?? sh ?? fd)!;
  const body = bodyById(test.centralId)!;
  const unc = (o: { value: number; uncertainty?: number; unit: string }) => `${sci(o.value)}${o.uncertainty !== undefined ? ` ± ${sci(o.uncertainty)}` : ''} ${lang === 'es' ? unitEs(o.unit) : o.unit}`;

  return (
    <div data-tour="gr-clocks">
      <label className="field"><span>{t('Test', 'Prueba')}</span>
        <select value={id} onChange={(e) => set({ grClockPreset: e.target.value })}>
          <optgroup label={t('Gravitational redshift', 'Desplazamiento al rojo gravitacional')}>{REDSHIFT_TESTS.map((x) => <option key={x.id} value={x.id}>{nm(x)}</option>)}</optgroup>
          <optgroup label={t('Shapiro delay', 'Retraso de Shapiro')}>{SHAPIRO_TESTS.map((x) => <option key={x.id} value={x.id}>{nm(x)}</option>)}</optgroup>
          <optgroup label={t('Frame dragging', 'Arrastre de marcos')}>{FRAME_DRAG_TESTS.map((x) => <option key={x.id} value={x.id}>{nm(x)}</option>)}</optgroup>
        </select></label>
      <p style={{ fontSize: 12 }}>{t('Central body', 'Cuerpo central')}: {nm(body)}. <Rich>{tr(lang, test.note, test.noteEs ?? test.note)}</Rich></p>

      {rs && (() => {
        const z = redshiftWeakSI(body.gm, rs.r1M, rs.r2M ?? Infinity);
        return (
          <>
            <h2>{t('Gravitational redshift', 'Desplazamiento al rojo gravitacional')}</h2>
            <p><T en={<>A static clock at radius <Tex>r</Tex> ticks slower than one far away because <Tex>{String.raw`g_{tt}=-(1-2GM/rc^2)`}</Tex>. A photon climbing from <Tex>r_1</Tex> to <Tex>r_2</Tex> is shifted by (weak field):</>} es={<>Un reloj estático a radio <Tex>r</Tex> marcha más lento que uno lejano porque <Tex>{String.raw`g_{tt}=-(1-2GM/rc^2)`}</Tex>. Un fotón que asciende de <Tex>r_1</Tex> a <Tex>r_2</Tex> sufre un desplazamiento (campo débil):</>} /></p>
            <Tex block>{String.raw`\frac{\Delta\nu}{\nu}\approx\frac{GM}{c^2}\Big(\frac1{r_1}-\frac1{r_2}\Big)`}</Tex>
            <div className="readout">
              <span>r₁</span><span>{sci(rs.r1M)} m</span>
              <span>r₂</span><span>{rs.r2M === null ? '∞' : `${sci(rs.r2M)} m`}</span>
              <span>{t('GR predicted |Δν/ν|', '|Δν/ν| predicho por la RG')}</span><span>{sci(Math.abs(z))}</span>
              {rs.id === 'sirius-b' && <><span>{t('as velocity', 'como velocidad')}</span><span>{fmt((Math.abs(z) * C) / 1000, 1)} km/s</span></>}
              <span>{t('observed', 'observado')}</span><span>{unc(rs.observed)}</span>
            </div>
            <p style={{ fontSize: 12 }}>{qn(rs.observed)}. {t('Source', 'Fuente')}: <Src s={rs.observed.source} /></p>
          </>
        );
      })()}
      {sh && (() => {
        const dt = shapiroDelaySI(body.gm, sh.r1M, sh.r2M, sh.bM);
        return (
          <>
            <h2>{t('Shapiro delay', 'Retraso de Shapiro')}</h2>
            <p><T en={<>Light passing a mass is slowed in coordinate time. One way, for endpoints at <Tex>r_1,r_2</Tex> and closest approach <Tex>b</Tex>:</>} es={<>La luz que pasa junto a una masa se retrasa en tiempo coordenado. En un sentido, para extremos en <Tex>r_1,r_2</Tex> y máximo acercamiento <Tex>b</Tex>:</>} /></p>
            <Tex block>{String.raw`\Delta t=(1+\gamma)\,\frac{GM}{c^3}\ln\frac{4r_1r_2}{b^2}`}</Tex>
            <div className="readout">
              <span>GM/c³</span><span>{sci(body.gm / C ** 3)} s</span>
              <span>b</span><span>{sci(sh.bM)} m</span>
              <span>{t('one-way delay', 'retraso de ida')}</span><span>{fmt(dt * 1e6, 1)} μs</span>
              <span>{t('round trip', 'ida y vuelta')}</span><span>{fmt(dt * 2e6, 1)} μs</span>
              <span>{t('observed', 'observado')}</span><span>{unc(sh.observed)}</span>
            </div>
            <p style={{ fontSize: 12 }}>{qn(sh.observed)}. {t('Source', 'Fuente')}: <Src s={sh.observed.source} /></p>
          </>
        );
      })()}
      {fd && (() => {
        const J = body.angularMomentum;
        const geo = geodeticPrecessionSI(body.gm, fd.orbitRadiusM) * MAS;
        const lt = J !== undefined ? lenseThirringPolarSI(J, fd.orbitRadiusM) * MAS : null;
        return (
          <>
            <h2>{t('Gyroscope precession', 'Precesión del giróscopo')}</h2>
            <p>{t('The geodetic (de Sitter) term comes from space curvature plus motion; the Lense–Thirring term from the rotating body dragging inertial frames:', 'El término geodésico (de Sitter) procede de la curvatura del espacio más el movimiento; el término de Lense–Thirring, del cuerpo en rotación que arrastra los marcos inerciales:')}</p>
            <Tex block>{String.raw`\Omega_{\rm dS}=\tfrac32\frac{(GM)^{3/2}}{c^2a^{5/2}},\qquad \Omega_{\rm LT}=\frac{GJ}{2c^2a^3}`}</Tex>
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
              <caption style={{ textAlign: 'left', color: 'var(--muted)' }}>{nm(test)}, mas/{t('yr', 'año')}</caption>
              <thead><tr><th scope="col" align="left"></th><th scope="col" align="left">{t('formula', 'fórmula')}</th><th scope="col" align="left">{t('published', 'publicado')}</th><th scope="col" align="left">{t('observed', 'observado')}</th></tr></thead>
              <tbody>
                <tr><th scope="row" align="left">{t('geodetic', 'geodésico')}</th><td>{fmt(geo, 1)}</td><td>{fd.predicted.geodetic}</td><td>{fd.observed.geodetic.value} ± {fd.observed.geodetic.uncertainty}</td></tr>
                <tr><th scope="row" align="left">{t('frame dragging', 'arrastre de marcos')}</th><td>{lt === null ? t('n/a', 'n/d') : fmt(lt, 1)}</td><td>{fd.predicted.frameDragging}</td><td>{fd.observed.frameDragging.value} ± {fd.observed.frameDragging.uncertainty}</td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: 12 }}>{t("The polar-orbit formula gives about 40.8 mas/yr; GP-B's 39.2 projects it onto the guide-star direction.", 'La fórmula de órbita polar da unos 40.8 mas/año; los 39.2 de GP-B la proyectan sobre la dirección de la estrella guía.')} {t('Source', 'Fuente')}: <Src s={fd.observed.source} /></p>
          </>
        );
      })()}

      <h2>{t('Clock rate near a mass', 'Ritmo del reloj cerca de una masa')}</h2>
      <label className="field"><span>r = {fmt(rGen, 1)} M</span>
        <input type="range" min={2.1} max={50} step={0.1} value={rGen} aria-label={t('Emitter radius in units of M', 'Radio del emisor en unidades de M')} onChange={(e) => setRGen(+e.target.value)} /></label>
      <Tex block>{String.raw`1+z=\Big(1-\frac{2M}{r}\Big)^{-1/2},\qquad \frac{d\tau}{dt}=\sqrt{1-\frac{2M}{r}}`}</Tex>
      <div className="readout">
        <span>{t('redshift z (to ∞)', 'desplazamiento al rojo z (hasta ∞)')}</span><span>{fmt(gravRedshift(rGen), 4)}</span>
        <span>{t('clock rate dτ/dt', 'ritmo del reloj dτ/dt')}</span><span>{fmt(Math.sqrt(1 - 2 / rGen), 4)}</span>
      </div>
    </div>
  );
}
