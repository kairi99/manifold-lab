import { useState } from 'react';
import { useStore } from '../state/store';
import { Tex, fmt, Rich } from './Tex';
import { REDSHIFT_TESTS, SHAPIRO_TESTS, FRAME_DRAG_TESTS } from '../data/grTests';
import { bodyById, C, YEAR } from '../data/celestial';
import type { Source } from '../data/celestial';
import { gravRedshift, redshiftWeakSI, shapiroDelaySI, geodeticPrecessionSI, lenseThirringPolarSI } from '../math/grEffects';

const MAS = (180 / Math.PI) * 3600e3 * YEAR; // rad/s -> mas/yr
const sci = (x: number, d = 3) => (x !== 0 && (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2) ? x.toExponential(d - 1) : fmt(x, d));
const Src = ({ s }: { s: Source }) => (s.url ? <a href={s.url} target="_blank" rel="noreferrer"><Rich>{s.label}</Rich></a> : <Rich>{s.label}</Rich>);
const ALL = [...REDSHIFT_TESTS, ...SHAPIRO_TESTS, ...FRAME_DRAG_TESTS];

export function ClocksPanel() {
  const preset = useStore((s) => s.grClockPreset), set = useStore((s) => s.set);
  const [rGen, setRGen] = useState(6);
  const id = ALL.some((t) => t.id === preset) ? preset : REDSHIFT_TESTS[0].id;
  const rs = REDSHIFT_TESTS.find((t) => t.id === id), sh = SHAPIRO_TESTS.find((t) => t.id === id), fd = FRAME_DRAG_TESTS.find((t) => t.id === id);
  const test = (rs ?? sh ?? fd)!;
  const body = bodyById(test.centralId)!;
  const unc = (o: { value: number; uncertainty?: number; unit: string }) => `${sci(o.value)}${o.uncertainty !== undefined ? ` ± ${sci(o.uncertainty)}` : ''} ${o.unit}`;

  return (
    <div data-tour="gr-clocks">
      <label className="field"><span>Test</span>
        <select value={id} onChange={(e) => set({ grClockPreset: e.target.value })}>
          <optgroup label="Gravitational redshift">{REDSHIFT_TESTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
          <optgroup label="Shapiro delay">{SHAPIRO_TESTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
          <optgroup label="Frame dragging">{FRAME_DRAG_TESTS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
        </select></label>
      <p style={{ fontSize: 12 }}>Central body: {body.name}. <Rich>{test.note}</Rich></p>

      {rs && (() => {
        const z = redshiftWeakSI(body.gm, rs.r1M, rs.r2M ?? Infinity);
        return (
          <>
            <h2>Gravitational redshift</h2>
            <p>A static clock at radius <Tex>r</Tex> ticks slower than one far away because <Tex>{String.raw`g_{tt}=-(1-2GM/rc^2)`}</Tex>. A photon climbing from <Tex>r_1</Tex> to <Tex>r_2</Tex> is shifted by (weak field):</p>
            <Tex block>{String.raw`\frac{\Delta\nu}{\nu}\approx\frac{GM}{c^2}\Big(\frac1{r_1}-\frac1{r_2}\Big)`}</Tex>
            <div className="readout">
              <span>r₁</span><span>{sci(rs.r1M)} m</span>
              <span>r₂</span><span>{rs.r2M === null ? '∞' : `${sci(rs.r2M)} m`}</span>
              <span>GR predicted |Δν/ν|</span><span>{sci(Math.abs(z))}</span>
              {rs.id === 'sirius-b' && <><span>as velocity</span><span>{fmt((Math.abs(z) * C) / 1000, 1)} km/s</span></>}
              <span>observed</span><span>{unc(rs.observed)}</span>
            </div>
            <p style={{ fontSize: 12 }}>{rs.observed.quantity}. Source: <Src s={rs.observed.source} /></p>
          </>
        );
      })()}
      {sh && (() => {
        const dt = shapiroDelaySI(body.gm, sh.r1M, sh.r2M, sh.bM);
        return (
          <>
            <h2>Shapiro delay</h2>
            <p>Light passing a mass is slowed in coordinate time. One way, for endpoints at <Tex>r_1,r_2</Tex> and closest approach <Tex>b</Tex>:</p>
            <Tex block>{String.raw`\Delta t=(1+\gamma)\,\frac{GM}{c^3}\ln\frac{4r_1r_2}{b^2}`}</Tex>
            <div className="readout">
              <span>GM/c³</span><span>{sci(body.gm / C ** 3)} s</span>
              <span>b</span><span>{sci(sh.bM)} m</span>
              <span>one-way delay</span><span>{fmt(dt * 1e6, 1)} μs</span>
              <span>round trip</span><span>{fmt(dt * 2e6, 1)} μs</span>
              <span>observed</span><span>{unc(sh.observed)}</span>
            </div>
            <p style={{ fontSize: 12 }}>{sh.observed.quantity}. Source: <Src s={sh.observed.source} /></p>
          </>
        );
      })()}
      {fd && (() => {
        const J = body.angularMomentum;
        const geo = geodeticPrecessionSI(body.gm, fd.orbitRadiusM) * MAS;
        const lt = J !== undefined ? lenseThirringPolarSI(J, fd.orbitRadiusM) * MAS : null;
        return (
          <>
            <h2>Gyroscope precession</h2>
            <p>The geodetic (de Sitter) term comes from space curvature plus motion; the Lense–Thirring term from the rotating body dragging inertial frames:</p>
            <Tex block>{String.raw`\Omega_{\rm dS}=\tfrac32\frac{(GM)^{3/2}}{c^2a^{5/2}},\qquad \Omega_{\rm LT}=\frac{GJ}{2c^2a^3}`}</Tex>
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
              <caption style={{ textAlign: 'left', color: 'var(--muted)' }}>{test.name}, mas/yr</caption>
              <thead><tr><th scope="col" align="left"></th><th scope="col" align="left">formula</th><th scope="col" align="left">published</th><th scope="col" align="left">observed</th></tr></thead>
              <tbody>
                <tr><th scope="row" align="left">geodetic</th><td>{fmt(geo, 1)}</td><td>{fd.predicted.geodetic}</td><td>{fd.observed.geodetic.value} ± {fd.observed.geodetic.uncertainty}</td></tr>
                <tr><th scope="row" align="left">frame dragging</th><td>{lt === null ? 'n/a' : fmt(lt, 1)}</td><td>{fd.predicted.frameDragging}</td><td>{fd.observed.frameDragging.value} ± {fd.observed.frameDragging.uncertainty}</td></tr>
              </tbody>
            </table>
            <p style={{ fontSize: 12 }}>The polar-orbit formula gives about 40.8 mas/yr; GP-B's 39.2 projects it onto the guide-star direction. Source: <Src s={fd.observed.source} /></p>
          </>
        );
      })()}

      <h2>Clock rate near a mass</h2>
      <label className="field"><span>r = {fmt(rGen, 1)} M</span>
        <input type="range" min={2.1} max={50} step={0.1} value={rGen} aria-label="Emitter radius in units of M" onChange={(e) => setRGen(+e.target.value)} /></label>
      <Tex block>{String.raw`1+z=\Big(1-\frac{2M}{r}\Big)^{-1/2},\qquad \frac{d\tau}{dt}=\sqrt{1-\frac{2M}{r}}`}</Tex>
      <div className="readout">
        <span>redshift z (to ∞)</span><span>{fmt(gravRedshift(rGen), 4)}</span>
        <span>clock rate dτ/dt</span><span>{fmt(Math.sqrt(1 - 2 / rGen), 4)}</span>
      </div>
    </div>
  );
}
