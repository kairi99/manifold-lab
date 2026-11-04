import { Fragment, useState } from 'react';
import { useStore } from '../state/store';
import { Tex, fmt, coordText, Rich } from './Tex';
import { SPACETIMES, defaultParams, nonzeroComponents } from '../math/spacetime';
import { stModel, eventAxes, einsteinCheck, closedForms, maxAbs, metricById } from './SpacetimeModel';
import { Grid4, Note, Seg, sci } from './SpacetimeUi';
import { T, useTr, useLang } from '../i18n';

const TABS = [['g', 'g'], ['gamma', 'Γ'], ['riem', 'Riemann'], ['ricci', 'Ricci'], ['ein', 'Einstein']] as const;
type Tab = typeof TABS[number][0];

export function TensorsPanel() {
  const id = useStore((s) => s.stMetric), params = useStore((s) => s.stParams), event = useStore((s) => s.stEvent), set = useStore((s) => s.set);
  const [tab, setTab] = useState<Tab>('riem');
  const t = useTr(), lang = useLang();
  const m = stModel(id, params, event), { c, metric, p, x } = m;
  const names = metric.coords.map(coordText);
  const ein = einsteinCheck(m), cf = closedForms(m);
  const nz = (t: unknown, sym: { a: number; b: number; sign: 1 | -1 }[], pair = false) => nonzeroComponents(t, 1e-9 * (maxAbs(t) || 1), sym, names, pair);
  const gam = nz(c.Gamma, [{ a: 1, b: 2, sign: 1 }]);
  const riem = nz(c.RiemannLow, [{ a: 0, b: 1, sign: -1 }, { a: 2, b: 3, sign: -1 }], true);
  const tolR = 1e-9 * (maxAbs(c.RiemannLow) || 1);
  const ricFlat = maxAbs(c.Ricci) < 1e-9 * (1 + maxAbs(c.RiemannLow));
  const planes = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const pick = (v: string) => { const mm = metricById(v); set({ stMetric: mm.id, stParams: defaultParams(mm), stEvent: null }); };
  const sub = (k: string) => k.split('').map((ch) => names[+ch]);

  return (
    <div>
      <label className="field"><span>{t('Spacetime', 'Espaciotiempo')}</span>
        <select value={metric.id} aria-label={t('Spacetime', 'Espaciotiempo')} onChange={(e) => pick(e.target.value)}>
          {SPACETIMES.map((q) => <option key={q.id} value={q.id}>{lang === 'es' ? q.nameEs ?? q.name : q.name}</option>)}
        </select></label>
      <Tex block>{`\\begin{gathered}${metric.lineElement.split(',\\quad').join('\\\\')}\\end{gathered}`}</Tex>
      {metric.domainNote && <Note>{lang === 'es' ? metric.domainNoteEs ?? metric.domainNote : metric.domainNote}</Note>}
      {metric.params.map((q) => (
        <label className="field" key={q.key}><span><Tex>{q.label}</Tex> = {fmt(p[q.key], 3)}</span>
          <input type="range" min={q.min} max={q.max} step={q.step} value={p[q.key]} aria-label={`${t('Parameter', 'Parámetro')} ${q.key}`} onChange={(e) => set({ stParams: { ...p, [q.key]: +e.target.value }, stEvent: x })} /></label>
      ))}
      {eventAxes(metric, p).map((ax) => (
        <label className="field" key={ax.axis}><span>{t('Event', 'Suceso')} {ax.name} = {fmt(x[ax.axis], 3)}{ax.name === 'θ' ? ` rad (${fmt(x[ax.axis] * 180 / Math.PI, 1)}°)` : ax.name === 'r' ? t(' (geometric units, G = c = 1)', ' (unidades geométricas, G = c = 1)') : ''}</span>
          <input type="range" min={ax.min} max={ax.max} step={ax.step} value={x[ax.axis]} aria-label={`${t('Event', 'Suceso')} ${ax.name}`} onChange={(e) => { const nx = [...x]; nx[ax.axis] = +e.target.value; set({ stEvent: nx }); }} /></label>
      ))}

      <h2>{t('At this event', 'En este suceso')}</h2>
      <div className="readout">
        <span>{t('nonzero Γ components', 'componentes de Γ no nulas')}</span><span>{gam.length}</span>
        <span>{t('nonzero Riemann components', 'componentes de Riemann no nulas')}</span><span>{riem.length}</span>
        <span>{t('Ricci scalar R', 'escalar de Ricci R')}</span><span>{sci(c.scalar)}</span>
        <span>{t('Kretschmann K', 'Kretschmann K')}</span><span>{sci(c.kretschmann)}</span>
        <span>{t('Weyl squared C²', 'Weyl al cuadrado C²')}</span><span>{sci(c.weylSq)}</span>
        <span>{t('Einstein equation', 'ecuación de Einstein')}</span><span><Rich>{ein.vacuum ? (ein.ok ? 'G_{μν} = 0 ✓' : `G_{μν} ≠ 0 (max ${sci(ein.resid)})`) : `G_{μν} = 8πT_{μν} ${ein.ok ? '✓' : '✗'}, max|G−8πT| = ${sci(ein.resid, 2)}`}</Rich></span>
        {cf.map((q) => <Fragment key={q.name}>
          <span>{t('closed form', 'forma cerrada')} {q.name}</span><span>{sci(q.value)} ({t('computed', 'calculado')} {sci(q.numeric)})</span></Fragment>)}
      </div>
      {cf.map((q) => <Tex key={q.name} block>{q.tex}</Tex>)}
      {metric.id === 'minkowski' && <Note><T en={<>Flat space in curvilinear coordinates: {gam.length} Christoffel symbols are nonzero, yet every Riemann component vanishes. Γ is not a tensor; R is.</>} es={<>Espacio plano en coordenadas curvilíneas: {gam.length} símbolos de Christoffel no son nulos, pero todas las componentes de Riemann se anulan. Γ no es un tensor; R sí.</>} /></Note>}
      {ricFlat && riem.length > 0 && <Note><T en={<>Ricci = 0 but Riemann ≠ 0: this is vacuum curvature, pure tidal (Weyl) curvature. Here C² − K = {sci(c.weylSq - c.kretschmann, 2)}, so the Weyl tensor carries all of the Riemann tensor.</>} es={<>Ricci = 0 pero Riemann ≠ 0: es curvatura de vacío, curvatura de marea pura (de Weyl). Aquí C² − K = {sci(c.weylSq - c.kretschmann, 2)}, así que el tensor de Weyl contiene todo el tensor de Riemann.</>} /></Note>}
      {!ricFlat && <Note><T en={<>Ricci ≠ 0: matter or energy density sources curvature through G<sub>μν</sub> = 8πT<sub>μν</sub> (compare the Einstein tab).</>} es={<>Ricci ≠ 0: la materia o la densidad de energía generan curvatura mediante G<sub>μν</sub> = 8πT<sub>μν</sub> (compara la pestaña Einstein).</>} /></Note>}

      <Seg label={t('Tensor', 'Tensor')} value={tab} items={TABS} onPick={setTab} cols={5} />
      {tab === 'g' && <><Tex>{'g_{\\mu\\nu}'}</Tex><Grid4 m={c.g} names={names} label={t('Metric g_μν', 'Métrica g_μν')} /></>}
      {tab === 'gamma' && <>
        <Tex block>{'\\Gamma^\\rho{}_{\\mu\\nu}=\\tfrac12 g^{\\rho\\lambda}(\\partial_\\mu g_{\\lambda\\nu}+\\partial_\\nu g_{\\lambda\\mu}-\\partial_\\lambda g_{\\mu\\nu})'}</Tex>
        <Note>{gam.length} {t('independent nonzero (symmetric in the lower pair), upper index first.', 'independientes no nulos (simétricos en el par inferior), índice superior primero.')}</Note>
        <div className="readout" aria-label={t('Christoffel symbols', 'Símbolos de Christoffel')}>{gam.map((q) => <Fragment key={q.label}><span>Γ<sup>{sub(q.label)[0]}</sup><sub>{sub(q.label)[1]}{sub(q.label)[2]}</sub></span><span>{sci(q.value)}</span></Fragment>)}</div>
        {gam.length === 0 && <Note>{t('All zero (Cartesian-like coordinates on flat space would look like this).', 'Todos nulos (así se verían unas coordenadas de tipo cartesiano en espacio plano).')}</Note>}
      </>}
      {tab === 'riem' && <>
        <Tex block>{'R^\\rho{}_{\\sigma\\mu\\nu}=\\partial_\\mu\\Gamma^\\rho_{\\nu\\sigma}-\\partial_\\nu\\Gamma^\\rho_{\\mu\\sigma}+\\Gamma^\\rho_{\\mu\\lambda}\\Gamma^\\lambda_{\\nu\\sigma}-\\Gamma^\\rho_{\\nu\\lambda}\\Gamma^\\lambda_{\\mu\\sigma}'}</Tex>
        <Note><T en={<>{riem.length} independent nonzero R<sub>ρσμν</sub> (antisymmetric in each pair, symmetric under pair exchange; tolerance {sci(tolR, 2)}).</>} es={<>{riem.length} R<sub>ρσμν</sub> independientes no nulas (antisimétricas en cada par, simétricas al intercambiar los pares; tolerancia {sci(tolR, 2)}).</>} /></Note>
        <div className="readout" aria-label={t('Riemann components', 'Componentes de Riemann')}>{riem.map((q) => <Fragment key={q.label}><span>R<sub>{q.label}</sub></span><span>{sci(q.value)}</span></Fragment>)}</div>
        {riem.length === 0 && <Note>{t('Riemann = 0 everywhere: the spacetime is flat.', 'Riemann = 0 en todas partes: el espaciotiempo es plano.')}</Note>}
      </>}
      {tab === 'ricci' && <><Tex block>{'R_{\\sigma\\nu}=R^\\rho{}_{\\sigma\\rho\\nu},\\quad R=g^{\\sigma\\nu}R_{\\sigma\\nu}'}</Tex><Grid4 m={c.Ricci} names={names} label={t('Ricci tensor R_μν', 'Tensor de Ricci R_μν')} /><p>R = {sci(c.scalar)}</p></>}
      {tab === 'ein' && <>
        <Tex block>{'G_{\\mu\\nu}=R_{\\mu\\nu}-\\tfrac12 R\\,g_{\\mu\\nu}=8\\pi T_{\\mu\\nu}'}</Tex>
        <Grid4 m={c.Einstein} names={names} label={t('Einstein tensor G_μν', 'Tensor de Einstein G_μν')} />
        {ein.T ? <><p style={{ fontSize: 12 }}>8πT<sub>μν</sub> {t('from the matter model:', 'del modelo de materia:')}</p><Grid4 m={ein.T.map((r) => r.map((v) => 8 * Math.PI * v))} names={names} label="8π T_μν" /></> : <Note>{t('Vacuum', 'Vacío')}: T<sub>μν</sub> = 0.</Note>}
        <p style={{ fontSize: 12 }}>max|G − 8πT| = {sci(ein.resid, 3)} {ein.ok ? '✓' : '✗'}</p>
      </>}

      <h2>{t('Scene: sectional curvatures', 'Escena: curvaturas seccionales')}</h2>
      <Note>{t('Bars in the 3D view', 'Barras en la vista 3D')}: K(∂<sub>a</sub>, ∂<sub>b</sub>) = R<sub>abab</sub> / (g<sub>aa</sub> g<sub>bb</sub> − g<sub>ab</sub><sup>2</sup>) {t('for the six coordinate planes, heights normalised to the largest |K|.', 'para los seis planos coordenados, alturas normalizadas al mayor |K|.')}</Note>
      <div className="readout">{planes.map(([a, b]) => <Fragment key={`${a}${b}`}><span>K({names[a]},{names[b]})</span><span>{sci(m.K[a][b])}</span></Fragment>)}</div>
    </div>
  );
}
