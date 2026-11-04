import { Fragment, useState } from 'react';
import { useStore } from '../state/store';
import { Tex, fmt, coordText, Rich } from './Tex';
import { SPACETIMES, defaultParams, nonzeroComponents } from '../math/spacetime';
import { stModel, eventAxes, einsteinCheck, closedForms, maxAbs, metricById } from './SpacetimeModel';
import { Grid4, Note, Seg, sci } from './SpacetimeUi';

const TABS = [['g', 'g'], ['gamma', 'Γ'], ['riem', 'Riemann'], ['ricci', 'Ricci'], ['ein', 'Einstein']] as const;
type Tab = typeof TABS[number][0];

export function TensorsPanel() {
  const id = useStore((s) => s.stMetric), params = useStore((s) => s.stParams), event = useStore((s) => s.stEvent), set = useStore((s) => s.set);
  const [tab, setTab] = useState<Tab>('riem');
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
      <label className="field"><span>Spacetime</span>
        <select value={metric.id} aria-label="Spacetime" onChange={(e) => pick(e.target.value)}>
          {SPACETIMES.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select></label>
      <Tex block>{`\\begin{gathered}${metric.lineElement.split(',\\quad').join('\\\\')}\\end{gathered}`}</Tex>
      {metric.domainNote && <Note>{metric.domainNote}</Note>}
      {metric.params.map((q) => (
        <label className="field" key={q.key}><span><Tex>{q.label}</Tex> = {fmt(p[q.key], 3)}</span>
          <input type="range" min={q.min} max={q.max} step={q.step} value={p[q.key]} aria-label={`Parameter ${q.key}`} onChange={(e) => set({ stParams: { ...p, [q.key]: +e.target.value }, stEvent: x })} /></label>
      ))}
      {eventAxes(metric, p).map((ax) => (
        <label className="field" key={ax.axis}><span>Event {ax.name} = {fmt(x[ax.axis], 3)}{ax.name === 'θ' ? ` rad (${fmt(x[ax.axis] * 180 / Math.PI, 1)}°)` : ax.name === 'r' ? ' (geometric units, G = c = 1)' : ''}</span>
          <input type="range" min={ax.min} max={ax.max} step={ax.step} value={x[ax.axis]} aria-label={`Event ${ax.name}`} onChange={(e) => { const nx = [...x]; nx[ax.axis] = +e.target.value; set({ stEvent: nx }); }} /></label>
      ))}

      <h2>At this event</h2>
      <div className="readout">
        <span>nonzero Γ components</span><span>{gam.length}</span>
        <span>nonzero Riemann components</span><span>{riem.length}</span>
        <span>Ricci scalar R</span><span>{sci(c.scalar)}</span>
        <span>Kretschmann K</span><span>{sci(c.kretschmann)}</span>
        <span>Weyl squared C²</span><span>{sci(c.weylSq)}</span>
        <span>Einstein equation</span><span><Rich>{ein.vacuum ? (ein.ok ? 'G_{μν} = 0 ✓' : `G_{μν} ≠ 0 (max ${sci(ein.resid)})`) : `G_{μν} = 8πT_{μν} ${ein.ok ? '✓' : '✗'}, max|G−8πT| = ${sci(ein.resid, 2)}`}</Rich></span>
        {cf.map((q) => <Fragment key={q.name}>
          <span>closed form {q.name}</span><span>{sci(q.value)} (computed {sci(q.numeric)})</span></Fragment>)}
      </div>
      {cf.map((q) => <Tex key={q.name} block>{q.tex}</Tex>)}
      {metric.id === 'minkowski' && <Note>Flat space in curvilinear coordinates: {gam.length} Christoffel symbols are nonzero, yet every Riemann component vanishes. Γ is not a tensor; R is.</Note>}
      {ricFlat && riem.length > 0 && <Note>Ricci = 0 but Riemann ≠ 0: this is vacuum curvature, pure tidal (Weyl) curvature. Here C² − K = {sci(c.weylSq - c.kretschmann, 2)}, so the Weyl tensor carries all of the Riemann tensor.</Note>}
      {!ricFlat && <Note>Ricci ≠ 0: matter or energy density sources curvature through G<sub>μν</sub> = 8πT<sub>μν</sub> (compare the Einstein tab).</Note>}

      <Seg label="Tensor" value={tab} items={TABS} onPick={setTab} cols={5} />
      {tab === 'g' && <><Tex>{'g_{\\mu\\nu}'}</Tex><Grid4 m={c.g} names={names} label="Metric g_μν" /></>}
      {tab === 'gamma' && <>
        <Tex block>{'\\Gamma^\\rho{}_{\\mu\\nu}=\\tfrac12 g^{\\rho\\lambda}(\\partial_\\mu g_{\\lambda\\nu}+\\partial_\\nu g_{\\lambda\\mu}-\\partial_\\lambda g_{\\mu\\nu})'}</Tex>
        <Note>{gam.length} independent nonzero (symmetric in the lower pair), upper index first.</Note>
        <div className="readout" aria-label="Christoffel symbols">{gam.map((q) => <Fragment key={q.label}><span>Γ<sup>{sub(q.label)[0]}</sup><sub>{sub(q.label)[1]}{sub(q.label)[2]}</sub></span><span>{sci(q.value)}</span></Fragment>)}</div>
        {gam.length === 0 && <Note>All zero (Cartesian-like coordinates on flat space would look like this).</Note>}
      </>}
      {tab === 'riem' && <>
        <Tex block>{'R^\\rho{}_{\\sigma\\mu\\nu}=\\partial_\\mu\\Gamma^\\rho_{\\nu\\sigma}-\\partial_\\nu\\Gamma^\\rho_{\\mu\\sigma}+\\Gamma^\\rho_{\\mu\\lambda}\\Gamma^\\lambda_{\\nu\\sigma}-\\Gamma^\\rho_{\\nu\\lambda}\\Gamma^\\lambda_{\\mu\\sigma}'}</Tex>
        <Note>{riem.length} independent nonzero R<sub>ρσμν</sub> (antisymmetric in each pair, symmetric under pair exchange; tolerance {sci(tolR, 2)}).</Note>
        <div className="readout" aria-label="Riemann components">{riem.map((q) => <Fragment key={q.label}><span>R<sub>{q.label}</sub></span><span>{sci(q.value)}</span></Fragment>)}</div>
        {riem.length === 0 && <Note>Riemann = 0 everywhere: the spacetime is flat.</Note>}
      </>}
      {tab === 'ricci' && <><Tex block>{'R_{\\sigma\\nu}=R^\\rho{}_{\\sigma\\rho\\nu},\\quad R=g^{\\sigma\\nu}R_{\\sigma\\nu}'}</Tex><Grid4 m={c.Ricci} names={names} label="Ricci tensor R_μν" /><p>R = {sci(c.scalar)}</p></>}
      {tab === 'ein' && <>
        <Tex block>{'G_{\\mu\\nu}=R_{\\mu\\nu}-\\tfrac12 R\\,g_{\\mu\\nu}=8\\pi T_{\\mu\\nu}'}</Tex>
        <Grid4 m={c.Einstein} names={names} label="Einstein tensor G_μν" />
        {ein.T ? <><p style={{ fontSize: 12 }}>8πT<sub>μν</sub> from the matter model:</p><Grid4 m={ein.T.map((r) => r.map((v) => 8 * Math.PI * v))} names={names} label="8π T_μν" /></> : <Note>Vacuum: T<sub>μν</sub> = 0.</Note>}
        <p style={{ fontSize: 12 }}>max|G − 8πT| = {sci(ein.resid, 3)} {ein.ok ? '✓' : '✗'}</p>
      </>}

      <h2>Scene: sectional curvatures</h2>
      <Note>Bars in the 3D view: K(∂<sub>a</sub>, ∂<sub>b</sub>) = R<sub>abab</sub> / (g<sub>aa</sub> g<sub>bb</sub> − g<sub>ab</sub><sup>2</sup>) for the six coordinate planes, heights normalised to the largest |K|.</Note>
      <div className="readout">{planes.map(([a, b]) => <Fragment key={`${a}${b}`}><span>K({names[a]},{names[b]})</span><span>{sci(m.K[a][b])}</span></Fragment>)}</div>
    </div>
  );
}
