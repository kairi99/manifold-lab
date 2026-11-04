import { useStore } from '../state/store';
import { KerrPanel } from './KerrPanel';
import { BlackHoleImage } from '../panels/BlackHoleImage';
import { ClocksPanel } from '../panels/ClocksPanel';
import { Tex, fmt } from '../panels/Tex';
import { PotentialPlot } from '../panels/PotentialPlot';
import { RelativityScene, bodyMass, lightModel, orbitModel, periapsides, sampleAt } from '../scene/RelativityScene';
import { BODIES, LIGHT, ORBITS, GM_SUN, YEAR, bodyById } from '../data/celestial';
import type { CelestialBody, LightPreset, OrbitPreset } from '../data/celestial';
import {
  B_CRIT, ISCO, PHOTON_SPHERE, circularClockRate, deflection, perihelionShift, shadowAngularRadius, staticClockRate,
} from '../math/schwarzschild';

export { RelativityScene };

const RAD = 180 / Math.PI, ARCSEC = RAD * 3600;
const VIEWS = [['orbits', 'Orbits'], ['light', 'Light'], ['flamm', 'Flamm'], ['kerr', 'Kerr'], ['image', 'Image'], ['clocks', 'Clocks']] as const;
const sci = (x: number, d = 3) => (Math.abs(x) >= 1e4 || (x !== 0 && Math.abs(x) < 1e-2) ? x.toExponential(d - 1) : fmt(x, d));
const Src = ({ s }: { s: { label: string; url?: string } }) =>
  s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : <>{s.label}</>;

function BodyCard({ body }: { body: CelestialBody }) {
  const Mm = bodyMass(body)!;
  const rs = 2 * Mm;
  const R = body.radiusM;
  return (
    <>
      <h2>{body.name}</h2>
      <div className="readout">
        <span>mass</span><span>{sci(body.gm / GM_SUN)} M☉</span>
        <span>M = GM/c²</span><span>{sci(Mm)} m</span>
        <span>r_s = 2GM/c²</span><span>{rs >= 1000 ? `${sci(rs / 1000)} km` : `${sci(rs)} m`}</span>
        {R !== null ? (
          <>
            <span>R / r_s</span><span>{sci(R / rs)}</span>
            <span>photon sphere (3M)</span><span>{R > PHOTON_SPHERE * Mm ? 'outside surface' : 'above the surface (exists)'}</span>
            <span>ISCO (6M)</span><span>{R > ISCO * Mm ? 'inside the body: no ISCO' : 'outside surface'}</span>
          </>
        ) : (<><span>surface</span><span>none (black hole)</span></>)}
      </div>
      <p>{body.note}</p>
      <ul style={{ fontSize: 12, paddingLeft: 18 }}>{body.sources.map((s, i) => <li key={i}><Src s={s} /></li>)}</ul>
    </>
  );
}

function OrbitReadouts({ preset, Mm, toy, rp, ra }: { preset: OrbitPreset | null; Mm: number | null; toy: boolean; rp: number; ra: number }) {
  const sh = perihelionShift(rp, ra);
  const real = preset && Mm ? (() => {
    const a = preset.aM / Mm;
    const s = perihelionShift(a * (1 - preset.e), a * (1 + preset.e));
    return { a, ...s };
  })() : null;
  const o = preset?.observed;
  let pred = '', obs = '';
  if (real && preset) {
    const orbitsPerYear = YEAR / preset.periodS;
    if (o?.unit === 'arcsec/century') pred = `${fmt(real.numeric * ARCSEC * 100 * orbitsPerYear, 2)} ″/century (weak field ${fmt(real.weakField * ARCSEC * 100 * orbitsPerYear, 2)})`;
    else if (o?.unit === 'deg/yr') pred = `${fmt(real.numeric * RAD * orbitsPerYear, 4)} °/yr (weak field ${fmt(real.weakField * RAD * orbitsPerYear, 4)})`;
    else pred = `${fmt((real.numeric * ARCSEC) / 60, 2)} ′/orbit (weak field ${fmt((real.weakField * ARCSEC) / 60, 2)}); f_SP = 1`;
    if (o && o.unit) obs = `${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''} ${o.unit}`;
    else if (o) obs = `${o.quantity.split(';')[0]}: ${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''}`;
  }
  const gps = preset && /gps/i.test(preset.id) && Mm ? (() => {
    const rSat = preset.aM / Mm, rG = bodyById(preset.centralId)!.radiusM! / Mm, day = 86400e6;
    const grav = (staticClockRate(rSat) / staticClockRate(rG) - 1) * day;
    const vel = (circularClockRate(rSat) / staticClockRate(rSat) - 1) * day;
    return { grav, vel, net: grav + vel };
  })() : null;
  return (
    <>
      <h2>Perihelion shift</h2>
      <div className="readout">
        <span>per orbit, numeric</span><span>{fmt(sh.numeric * RAD, 3)}° = {fmt(sh.numeric * ARCSEC, 0)}″</span>
        <span>per orbit, 6πM/p</span><span>{fmt(sh.weakField * RAD, 3)}° = {fmt(sh.weakField * ARCSEC, 0)}″</span>
      </div>
      {toy && <p>Strong-field illustration: same eccentricity as {preset!.name}, but r_p = {fmt(rp, 1)} M so the precession is visible.</p>}
      {real && preset && (
        <>
          <h2>Real {preset.name}</h2>
          <div className="readout">
            <span>a / M</span><span>{sci(real.a)}</span>
            <span>shift / orbit</span><span>{sci(real.numeric * ARCSEC)}″ (weak {sci(real.weakField * ARCSEC)}″)</span>
            <span>GR prediction</span><span>{pred}</span>
            {o && <><span>observed</span><span>{obs}</span></>}
          </div>
          {o && <p style={{ fontSize: 12 }}>Observed: {o.quantity}. Source: <Src s={o.source} /></p>}
          {preset.caveat && <p style={{ fontSize: 12 }}>Caveat: {preset.caveat}</p>}
          <p style={{ fontSize: 12 }}>{preset.note}</p>
        </>
      )}
      {gps && (
        <>
          <h2>GPS clock offset (μs/day vs ground)</h2>
          <div className="readout">
            <span>gravitational</span><span>{fmt(gps.grav, 1)}</span>
            <span>velocity</span><span>{fmt(gps.vel, 1)}</span>
            <span>net</span><span>{fmt(gps.net, 1)}</span>
            <span>observed</span><span>{preset!.observed!.value} {preset!.observed!.unit}</span>
          </div>
        </>
      )}
    </>
  );
}

function LightReadouts({ preset, Mm, body, b }: { preset: LightPreset | null; Mm: number | null; body: CelestialBody | null; b: number }) {
  const d = deflection(b);
  let real = null as null | { pred: string; obs: string };
  if (preset && Mm && body) {
    const o = preset.observed;
    const shadow = /shadow/i.test(preset.id) && body.distanceM;
    if (shadow) {
      const ang = 2 * shadowAngularRadius(Mm / body.distanceM!) * ARCSEC * 1e6;
      real = { pred: `shadow diameter ${fmt(ang, 1)} μas`, obs: o ? `${o.value} ± ${o.uncertainty} μas` : '' };
    } else {
      const bm = preset.impactParameterM / Mm, dd = deflection(bm);
      real = {
        pred: `${fmt(dd.weakField * ARCSEC, 3)}″ (weak 4M/b)${dd.numeric !== null ? `, numeric ${fmt(dd.numeric * ARCSEC, 3)}″` : ''}`,
        obs: o ? `${o.quantity}: ${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''}` : 'none',
      };
    }
  }
  return (
    <>
      <h2>Deflection (slider b = {fmt(b, 2)} M)</h2>
      <div className="readout">
        <span>numeric</span><span>{d.numeric === null ? 'captured (b ≤ b_c)' : `${fmt(d.numeric * RAD, 3)}° `}</span>
        <span>weak field 4M/b</span><span>{fmt(d.weakField * RAD, 3)}°</span>
        <span>b_c = 3√3 M</span><span>{fmt(B_CRIT, 4)} M</span>
      </div>
      {preset && real && (
        <>
          <h2>Real: {preset.name}</h2>
          <div className="readout"><span>GR</span><span>{real.pred}</span><span>observed</span><span>{real.obs}</span></div>
          {preset.observed && <p style={{ fontSize: 12 }}>Source: <Src s={preset.observed.source} /></p>}
          <p style={{ fontSize: 12 }}>{preset.note}</p>
        </>
      )}
    </>
  );
}

export function RelativityPanel() {
  const view = useStore((s) => s.grView), grBody = useStore((s) => s.grBody), grOrbit = useStore((s) => s.grOrbit);
  const grRp = useStore((s) => s.grRp), grRa = useStore((s) => s.grRa), grB = useStore((s) => s.grB);
  const showFlamm = useStore((s) => s.grShowFlamm), playing = useStore((s) => s.grPlaying), progress = useStore((s) => s.grProgress);
  const set = useStore((s) => s.set);
  const body = grBody ? bodyById(grBody) ?? null : null;
  const Mm = bodyMass(body);
  const om = orbitModel(grBody, grOrbit, grRp, grRa);
  const lm = lightModel(grBody, grOrbit, grB);
  const orbPresets = ORBITS.filter((o) => o.centralId === grBody);
  const lightPresets = LIGHT.filter((o) => o.centralId === grBody);
  const presets = view === 'light' ? lightPresets : orbPresets;
  const custom = !presets.some((p) => p.id === grOrbit);

  const L = view === 'light' ? grB : om.orb?.L ?? 0;
  const E2 = view === 'light' ? 1 : om.orb ? om.orb.E ** 2 : 0.9;
  const cur = om.traj && view === 'orbits' ? sampleAt(om.traj, progress) : null;
  const rNow = cur?.r ?? om.rp;
  const peri = om.traj ? periapsides(om.traj) : [];
  const avg = peri.length > 1
    ? (om.traj!.samples[peri[peri.length - 1]].phi - om.traj!.samples[peri[0]].phi) / (peri.length - 1) - 2 * Math.PI
    : null;
  const sh = perihelionShift(om.rp, om.ra);

  return (
    <div>
      <div role="group" aria-label="View" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {VIEWS.map(([id, t]) => (
          <button key={id} aria-pressed={view === id} onClick={() => set({ grView: id })}
            style={{ padding: '6px', background: view === id ? 'var(--accent)' : 'var(--bg)', color: view === id ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {(view === 'kerr' || view === 'image' || view === 'clocks') && (
        <>
          {view !== 'clocks' && <label className="field">
            <span>Central object</span>
            <select value={grBody} onChange={(e) => set({ grBody: e.target.value, grOrbit: 'custom', grProgress: 0 })}>
              <option value="">generic black hole, M = 1</option>
              {BODIES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>}
          {view === 'kerr' && <KerrPanel body={body} />}
          {view === 'image' && <BlackHoleImage />}
          {view === 'clocks' && <ClocksPanel />}
        </>
      )}
      {view !== 'kerr' && view !== 'image' && view !== 'clocks' && <>
      <div data-tour="gr-presets">
        <label className="field">
          <span>Central object</span>
          <select value={grBody} onChange={(e) => set({ grBody: e.target.value, grOrbit: 'custom', grProgress: 0 })}>
            <option value="">generic black hole, M = 1</option>
            {BODIES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        {view !== 'flamm' && (
          <label className="field">
            <span>{view === 'light' ? 'Light preset' : 'Orbit preset'}</span>
            <select value={custom ? 'custom' : grOrbit} onChange={(e) => set({ grOrbit: e.target.value, grProgress: 0 })}>
              <option value="custom">custom</option>
              {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {view === 'orbits' && custom && (
        <>
          <label className="field"><span>Periapsis r_p = {fmt(grRp, 1)} M</span>
            <input type="range" min={2.5} max={60} step={0.1} value={grRp} onChange={(e) => set({ grRp: +e.target.value, grProgress: 0 })} /></label>
          <label className="field"><span>Apoapsis r_a = {fmt(grRa, 1)} M</span>
            <input type="range" min={2.5} max={60} step={0.1} value={grRa} onChange={(e) => set({ grRa: +e.target.value, grProgress: 0 })} /></label>
        </>
      )}
      {view === 'light' && (
        <label className="field"><span>Impact parameter b = {fmt(grB, 2)} M</span>
          <input type="range" min={2} max={20} step={0.05} value={grB} onChange={(e) => set({ grB: +e.target.value })} /></label>
      )}
      {view !== 'flamm' && (
        <label className="check"><input type="checkbox" checked={showFlamm} onChange={(e) => set({ grShowFlamm: e.target.checked })} /> Lift curves onto the Flamm paraboloid</label>
      )}
      {view === 'orbits' && (
        <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
          <button onClick={() => set({ grPlaying: !playing })}>{playing ? 'Pause' : 'Play'}</button>
          <button onClick={() => set({ grPlaying: false, grProgress: 0 })}>Reset</button>
        </div>
      )}

      <h2>Schwarzschild geometry</h2>
      <Tex block>{String.raw`\begin{aligned}ds^2={}&-\Big(1-\tfrac{2M}{r}\Big)dt^2\\&+\Big(1-\tfrac{2M}{r}\Big)^{-1}dr^2+r^2\,d\Omega^2\end{aligned}`}</Tex>
      <p>The Killing fields <Tex>{String.raw`\partial_t`}</Tex> and <Tex>{String.raw`\partial_\varphi`}</Tex> give conserved quantities along geodesics (see the Killing-field module):</p>
      <Tex block>{String.raw`E=\Big(1-\tfrac{2M}{r}\Big)\dot t,\qquad L=r^2\dot\varphi`}</Tex>
      <Tex block>{String.raw`\dot r^{2}=E^{2}-V_{\rm eff}(r)`}</Tex>
      <Tex block>{String.raw`\begin{aligned}V_{\rm eff}^{\rm massive}&=\Big(1-\tfrac{2M}{r}\Big)\Big(1+\tfrac{L^2}{r^2}\Big)\\V_{\rm eff}^{\rm light}&=\Big(1-\tfrac{2M}{r}\Big)\tfrac{L^2}{r^2}\end{aligned}`}</Tex>

      {view !== 'flamm' && (
        <>
          <h2>Effective potential</h2>
          <div data-tour="gr-potential">
            <PotentialPlot L={L} E2={E2} kind={view === 'light' ? 'null' : 'timelike'}
              rMax={view === 'light' ? 30 : Math.min(60, Math.max(20, om.ra * 1.2))} />
          </div>
        </>
      )}

      {view === 'orbits' && (
        <>
          <h2>Orbit</h2>
          {om.orb ? (
            <div className="readout">
              <span>E</span><span>{fmt(om.orb.E, 5)}</span>
              <span>L</span><span>{fmt(om.orb.L, 4)} M</span>
              <span>fate</span><span>{om.traj?.fate}</span>
              <span>r_p, r_a</span><span>{fmt(om.rp, 2)}, {fmt(om.ra, 2)} M</span>
              <span>measured shift / orbit</span><span>{avg === null ? 'n/a (< 2 periapsides)' : `${fmt(avg * RAD, 2)}°`}</span>
            </div>
          ) : <p>No bound orbit with these apsides (unbound, or inside the stability limit).</p>}
          <h2>Clocks at r = {fmt(rNow, 2)} M</h2>
          <div className="readout">
            <span>static dτ/dt</span><span>{rNow > 2 ? fmt(staticClockRate(rNow), 5) : '—'}</span>
            <span>circular dτ/dt</span><span>{rNow > 3 ? fmt(circularClockRate(rNow), 5) : '— (r ≤ 3M)'}</span>
          </div>
          <OrbitReadouts preset={om.preset} Mm={Mm} toy={om.toy} rp={om.rp} ra={om.ra} />
          {!om.toy && <p style={{ fontSize: 12 }}>numeric vs weak field: {fmt(sh.numeric / sh.weakField, 3)}×.</p>}
        </>
      )}
      {view === 'light' && (
        <LightReadouts preset={lm.preset} Mm={Mm} body={body} b={grB} />
      )}
      {view === 'flamm' && (
        <>
          <h2>Flamm paraboloid</h2>
          <Tex block>{String.raw`\begin{aligned}r&=2M+\frac{z^2}{8M}\\ds^2_{\rm slice}&=\frac{dr^2}{1-2M/r}+r^2d\varphi^2\end{aligned}`}</Tex>
          <p>The equatorial slice <Tex>{String.raw`t=\text{const}`}</Tex> embeds in flat <Tex>{String.raw`\mathbb R^3`}</Tex> as this surface, with Gaussian curvature <Tex>{String.raw`K=-M/r^3`}</Tex>. The throat <Tex>r=2M</Tex> joins two exteriors (Einstein–Rosen bridge) but is not traversable: the full spacetime is dynamical. The green ruler measures proper radial distance, which exceeds the coordinate distance <Tex>{String.raw`\Delta r`}</Tex>.</p>
        </>
      )}

      {body && <BodyCard body={body} />}
      {!body && <p>Generic black hole in geometric units G = c = 1, lengths in M; r_s = 2M.</p>}
      </>}
    </div>
  );
}
