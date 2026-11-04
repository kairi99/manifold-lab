import { useStore } from '../state/store';
import { Tex, fmt, Rich } from './Tex';
import { COSMO_OBJECTS, COSMO_SETS } from '../data/cosmology';
import { curvature, hubbleTimeGyr } from '../math/cosmology';
import { objById, objectNumbers, setById, useCosmoParams, validity } from './CosmoModel';
import { AngularDiameterPlot, ScaleFactorPlot } from './CosmoPlots';
import { COSMO_COLORS } from '../scene/CosmoScene';
import { useTr, useLang } from '../i18n';

const Src = ({ s }: { s: { label: string; url?: string } }) => s.url ? <a href={s.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}><Rich>{s.label}</Rich></a> : <Rich>{s.label}</Rich>;
const big = (x: number, d = 3) => (Math.abs(x) >= 1e5 ? x.toExponential(2) : fmt(x, d));
const LEGEND: [string, string, string][] = [['observer worldline', 'línea de universo del observador', COSMO_COLORS.observer], ['past light cone', 'cono de luz pasado', COSMO_COLORS.cone], ['particle horizon', 'horizonte de partículas', COSMO_COLORS.particle],
  ['event horizon', 'horizonte de sucesos', COSMO_COLORS.event], ['Hubble sphere', 'esfera de Hubble', COSMO_COLORS.hubble], ['galaxy worldlines (comoving)', 'líneas de universo de galaxias (comóviles)', COSMO_COLORS.galaxy], ['selected object', 'objeto seleccionado', COSMO_COLORS.pick]];

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return <label className="field"><span><Rich>{label}</Rich></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} /></label>;
}

export function CosmoPanel() {
  const { csSet, csObj, csTime, csH0, csOm, csOL } = useStore();
  const set = useStore((s) => s.set);
  const p = useCosmoParams(), cs = setById(csSet), obj = objById(csObj);
  const t = useTr(), es = useLang() === 'es';
  const bad = validity(p, es), ok = curvature(p);
  const modified = Math.abs(p.H0 - cs.params.H0) > 1e-4 || Math.abs(p.Om - cs.params.Om) > 1e-4 || Math.abs(p.OL - cs.params.OL) > 1e-4;
  const [mant, ex] = p.Or.toExponential(2).split('e');
  const orTex = p.Or === 0 ? '0' : `${mant}\\times10^{${+ex}}`;
  const n = bad ? null : objectNumbers(obj.z, p);
  const pick = (id: string) => { const s = setById(id); set({ csSet: id, csH0: s.params.H0, csOm: s.params.Om, csOL: s.params.OL }); };

  return (
    <div>
      <label className="field"><span>{t('Cosmological parameters', 'Parámetros cosmológicos')}</span>
        <select value={csSet} onChange={(e) => pick(e.target.value)}>{COSMO_SETS.map((s) => <option key={s.id} value={s.id}>{es ? s.nameEs ?? s.name : s.name}</option>)}</select></label>
      <p style={{ fontSize: 12 }}><Rich>{es ? cs.noteEs ?? cs.note : cs.note}</Rich>{modified && t(' Sliders have been moved away from this set.', ' Los deslizadores se han movido respecto a este conjunto.')} {cs.sources.map((s, i) => <span key={i}><Src s={s} /> </span>)}</p>
      <Slider label={`H₀ = ${fmt(csH0, 2)} km/s/Mpc`} value={csH0} min={50} max={90} step={0.1} onChange={(v) => set({ csH0: v })} />
      <Slider label={`Ω_m = ${fmt(csOm, 3)}`} value={csOm} min={0.05} max={1.5} step={0.005} onChange={(v) => set({ csOm: v })} />
      <Slider label={`Ω_Λ = ${fmt(csOL, 3)}`} value={csOL} min={-0.5} max={1.5} step={0.005} onChange={(v) => set({ csOL: v })} />
      <div className="readout">
        <span>Ω<sub>r</sub> {t('(from set)', '(del conjunto)')}</span><span>{p.Or.toExponential(2)}</span>
        <span>Ω<sub>k</sub> = 1 − Ω<sub>m</sub> − Ω<sub>r</sub> − Ω<sub>Λ</sub></span><span>{fmt(ok, 4)} ({Math.abs(ok) < 1e-3 ? t('flat', 'plano') : ok > 0 ? t('open', 'abierto') : t('closed', 'cerrado')})</span>
        <span>{t('Hubble time 1/H₀', 'tiempo de Hubble 1/H₀')}</span><span>{fmt(hubbleTimeGyr(p), 2)} Gyr</span>
      </div>
      <button style={{ marginTop: 8 }} onClick={() => pick(csSet)}>{t('Reset to set', 'Volver al conjunto')}</button>
      {bad && <p role="alert" style={{ color: '#ff9a9a' }}>{bad}</p>}

      {!bad && n && (
        <>
          <div role="group" aria-label={t('Time axis', 'Eje de tiempo')} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, margin: '12px 0' }}>
            {([['conformal', t('Conformal time', 'Tiempo conforme')], ['cosmic', t('Cosmic time', 'Tiempo cósmico')]] as const).map(([id, label]) => (
              <button key={id} aria-pressed={csTime === id} onClick={() => set({ csTime: id })}
                style={{ background: csTime === id ? 'var(--accent)' : 'var(--bg)', color: csTime === id ? 'var(--bg)' : 'var(--fg)' }}>{label}</button>
            ))}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {LEGEND.map(([en, esL, c]) => <li key={en}><span aria-hidden style={{ display: 'inline-block', width: 14, height: 3, background: c, marginRight: 6, verticalAlign: 'middle' }} />{es ? esL : en}</li>)}
          </ul>

          <h2>{t('Object', 'Objeto')}</h2>
          <label className="field"><span>{t('Observed object', 'Objeto observado')}</span>
            <select value={csObj} onChange={(e) => set({ csObj: e.target.value })}>{COSMO_OBJECTS.map((o) => <option key={o.id} value={o.id}>{es ? o.nameEs ?? o.name : o.name} (z = {o.z})</option>)}</select></label>
          <div className="readout">
            <span>{t('age of universe now', 'edad del universo hoy')}</span><span>{fmt(n.ageNow, 3)} Gyr</span>
            <span>{t('age at emission', 'edad en la emisión')}</span><span>{n.ageThen < 0.01 ? `${fmt(n.ageThen * 1000, 2)} Myr` : `${fmt(n.ageThen, 3)} Gyr`}</span>
            <span>{t('lookback time', 'tiempo de retrospección')}</span><span>{fmt(n.lookback, 3)} Gyr</span>
            <span>D<sub>C</sub> ({t('comoving', 'comóvil')})</span><span>{big(n.dC, 1)} Mpc = {fmt(n.dCgly, 3)} Gly</span>
            <span>D<sub>L</sub> ({t('luminosity', 'luminosidad')})</span><span>{big(n.dL, 1)} Mpc</span>
            <span>D<sub>A</sub> ({t('angular diameter', 'diámetro angular')})</span><span>{big(n.dA, 2)} Mpc</span>
            <span>{t('distance modulus μ', 'módulo de distancia μ')}</span><span>{fmt(n.mu, 3)} mag</span>
            <span>{t('recession speed today', 'velocidad de recesión hoy')}</span><span>{fmt(n.vNow, 3)} c</span>
            <span>{t('recession speed at emission', 'velocidad de recesión en la emisión')}</span><span>{fmt(n.vThen, 3)} c</span>
          </div>
          {(n.vNow > 1 || n.vThen > 1) && (
            <p role="status" style={{ fontSize: 12 }}>{es
              ? `Se aleja más rápido que la luz ${n.vNow > 1 ? 'hoy' : 'cuando se emitió la luz'}, y aun así lo vemos: los fotones atravesaron regiones cuya velocidad de recesión bajó de c (la esfera de Hubble crece en términos comóviles). La expansión del espacio no es movimiento a través del espacio, así que el límite de la relatividad especial no se aplica.`
              : `Receding faster than light${n.vNow > 1 ? ' today' : ' when the light was emitted'}, yet we see it: the photons travelled through regions whose recession speed dropped below c (the Hubble sphere grows in comoving terms). Expansion of space is not motion through space, so special relativity's limit does not apply.`}</p>
          )}
          <p style={{ fontSize: 12 }}><Rich>{es ? obj.noteEs ?? obj.note : obj.note}</Rich></p>
          {!obj.verified && <p role="note" style={{ fontSize: 12, color: '#ffd24a' }}>{t('Unverified: this redshift was not checked against the primary source.', 'Sin verificar: este desplazamiento al rojo no se comprobó con la fuente primaria.')}</p>}
          <p style={{ fontSize: 12 }}>{t('Source', 'Fuente')}: {obj.sources.length ? obj.sources.map((s, i) => <span key={i}>{i > 0 && '; '}<Src s={s} /></span>) : t('none recorded', 'ninguna registrada')}</p>

          <h2>{t('Plots', 'Gráficas')}</h2>
          <ScaleFactorPlot p={p} z={obj.z} />
          <AngularDiameterPlot p={p} z={obj.z} />

          <h2>{t('Equations', 'Ecuaciones')}</h2>
          <Tex block>{String.raw`H^2=H_0^2\big(\Omega_r a^{-4}+\Omega_m a^{-3}+\Omega_k a^{-2}+\Omega_\Lambda\big)`}</Tex>
          <Tex block>{String.raw`\begin{aligned}\Omega_r&=${orTex},\ \Omega_m=${fmt(p.Om, 3)}\\\Omega_k&=${fmt(ok, 3)},\ \Omega_\Lambda=${fmt(p.OL, 3)}\end{aligned}`}</Tex>
          <Tex block>{String.raw`\begin{aligned}D_C&=\frac{c}{H_0}\int_0^z\frac{dz'}{E(z')}=${big(n.dC, 1)}\ \text{Mpc}\\E&=H/H_0\end{aligned}`}</Tex>
          <Tex block>{String.raw`\begin{aligned}D_L&=(1+z)D_M=${big(n.dL, 1)}\ \text{Mpc}\\D_A&=\frac{D_M}{1+z}=${big(n.dA, 2)}\ \text{Mpc}\end{aligned}`}</Tex>
          <Tex block>{String.raw`\begin{aligned}\mu&=5\log_{10}\frac{D_L}{\text{Mpc}}+25=${fmt(n.mu, 2)}\\c\,\eta&=c\!\int\!\frac{da}{a^2H}\end{aligned}`}</Tex>
        </>
      )}
    </div>
  );
}
