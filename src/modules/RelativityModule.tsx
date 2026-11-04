import { useStore } from '../state/store';
import { T, tr, useLang, useTr } from '../i18n';
import { KerrPanel } from './KerrPanel';
import { BlackHoleImage } from '../panels/BlackHoleImage';
import { ClocksPanel } from '../panels/ClocksPanel';
import { Tex, fmt, Rich } from '../panels/Tex';
import { PotentialPlot } from '../panels/PotentialPlot';
import { RelativityScene, bodyMass, lightModel, orbitModel, periapsides, sampleAt } from '../scene/RelativityScene';
import { BODIES, LIGHT, ORBITS, GM_SUN, YEAR, bodyById } from '../data/celestial';
import type { CelestialBody, LightPreset, OrbitPreset } from '../data/celestial';
import {
  B_CRIT, ISCO, PHOTON_SPHERE, circularClockRate, deflection, perihelionShift, shadowAngularRadius, staticClockRate,
} from '../math/schwarzschild';

export { RelativityScene };

const RAD = 180 / Math.PI, ARCSEC = RAD * 3600;
const VIEWS = [['orbits', 'Orbits', 'Órbitas'], ['light', 'Light', 'Luz'], ['flamm', 'Flamm', 'Flamm'], ['kerr', 'Kerr', 'Kerr'], ['image', 'Image', 'Imagen'], ['clocks', 'Clocks', 'Relojes']] as const;
const sci = (x: number, d = 3) => (Math.abs(x) >= 1e4 || (x !== 0 && Math.abs(x) < 1e-2) ? x.toExponential(d - 1) : fmt(x, d));
const Src = ({ s }: { s: { label: string; url?: string } }) =>
  s.url ? <a href={s.url} target="_blank" rel="noreferrer"><Rich>{s.label}</Rich></a> : <Rich>{s.label}</Rich>;

function BodyCard({ body }: { body: CelestialBody }) {
  const t = useTr(), lang = useLang();
  const Mm = bodyMass(body)!;
  const rs = 2 * Mm;
  const R = body.radiusM;
  return (
    <>
      <h2>{tr(lang, body.name, body.nameEs ?? body.name)}</h2>
      <div className="readout">
        <span>{t('mass', 'masa')}</span><span>{sci(body.gm / GM_SUN)} M☉</span>
        <span>M = GM/c²</span><span>{sci(Mm)} m</span>
        <span>r<sub>s</sub> = 2GM/c²</span><span>{rs >= 1000 ? `${sci(rs / 1000)} km` : `${sci(rs)} m`}</span>
        {R !== null ? (
          <>
            <span>R / r<sub>s</sub></span><span>{sci(R / rs)}</span>
            <span>{t('photon sphere (3M)', 'esfera de fotones (3M)')}</span><span>{R > PHOTON_SPHERE * Mm ? t('outside surface', 'fuera de la superficie') : t('above the surface (exists)', 'sobre la superficie (existe)')}</span>
            <span>ISCO (6M)</span><span>{R > ISCO * Mm ? t('inside the body: no ISCO', 'dentro del cuerpo: no hay ISCO') : t('outside surface', 'fuera de la superficie')}</span>
          </>
        ) : (<><span>{t('surface', 'superficie')}</span><span>{t('none (black hole)', 'ninguna (agujero negro)')}</span></>)}
      </div>
      <p><Rich>{tr(lang, body.note, body.noteEs ?? body.note)}</Rich></p>
      <ul style={{ fontSize: 12, paddingLeft: 18 }}>{body.sources.map((s, i) => <li key={i}><Src s={s} /></li>)}</ul>
    </>
  );
}

function OrbitReadouts({ preset, Mm, toy, rp, ra }: { preset: OrbitPreset | null; Mm: number | null; toy: boolean; rp: number; ra: number }) {
  const t = useTr(), lang = useLang();
  const oq = (o: { quantity: string; quantityEs?: string }) => tr(lang, o.quantity, o.quantityEs ?? o.quantity);
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
    if (o?.unit === 'arcsec/century') pred = `${fmt(real.numeric * ARCSEC * 100 * orbitsPerYear, 2)} ″/${t('century', 'siglo')} (${t('weak field', 'campo débil')} ${fmt(real.weakField * ARCSEC * 100 * orbitsPerYear, 2)})`;
    else if (o?.unit === 'deg/yr') pred = `${fmt(real.numeric * RAD * orbitsPerYear, 4)} °/${t('yr', 'año')} (${t('weak field', 'campo débil')} ${fmt(real.weakField * RAD * orbitsPerYear, 4)})`;
    else pred = `${fmt((real.numeric * ARCSEC) / 60, 2)} ′/${t('orbit', 'órbita')} (${t('weak field', 'campo débil')} ${fmt((real.weakField * ARCSEC) / 60, 2)}); f_SP = 1`;
    if (o && o.unit) obs = `${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''} ${tr(lang, o.unit, o.unit.replace('arcsec/century', 'arcsec/siglo').replace('deg/yr', 'deg/año').replace('us/day', 'μs/día'))}`;
    else if (o) obs = `${oq(o).split(';')[0]}: ${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''}`;
  }
  const gps = preset && /gps/i.test(preset.id) && Mm ? (() => {
    const rSat = preset.aM / Mm, rG = bodyById(preset.centralId)!.radiusM! / Mm, day = 86400e6;
    const grav = (staticClockRate(rSat) / staticClockRate(rG) - 1) * day;
    const vel = (circularClockRate(rSat) / staticClockRate(rSat) - 1) * day;
    return { grav, vel, net: grav + vel };
  })() : null;
  return (
    <>
      <h2>{t('Perihelion shift', 'Avance del perihelio')}</h2>
      <div className="readout">
        <span>{t('per orbit, numeric', 'por órbita, numérico')}</span><span>{fmt(sh.numeric * RAD, 3)}° = {fmt(sh.numeric * ARCSEC, 0)}″</span>
        <span>{t('per orbit, 6πM/p', 'por órbita, 6πM/p')}</span><span>{fmt(sh.weakField * RAD, 3)}° = {fmt(sh.weakField * ARCSEC, 0)}″</span>
      </div>
      {toy && <p>{t('Strong-field illustration: same eccentricity as', 'Ilustración de campo fuerte: misma excentricidad que')} {tr(lang, preset!.name, preset!.nameEs ?? preset!.name)}{t(', but', ', pero con')} r_p = {fmt(rp, 1)} M {t('so the precession is visible.', 'para que la precesión sea visible.')}</p>}
      {real && preset && (
        <>
          <h2>{t('Real', 'Real:')} {tr(lang, preset.name, preset.nameEs ?? preset.name)}</h2>
          <div className="readout">
            <span>a / M</span><span>{sci(real.a)}</span>
            <span>{t('shift / orbit', 'avance / órbita')}</span><span>{sci(real.numeric * ARCSEC)}″ ({t('weak', 'débil')} {sci(real.weakField * ARCSEC)}″)</span>
            <span>{t('GR prediction', 'predicción de la RG')}</span><span>{pred}</span>
            {o && <><span>{t('observed', 'observado')}</span><span>{obs}</span></>}
          </div>
          {o && <p style={{ fontSize: 12 }}>{t('Observed', 'Observado')}: {oq(o)}. {t('Source', 'Fuente')}: <Src s={o.source} /></p>}
          {preset.caveat && <p style={{ fontSize: 12 }}>{t('Caveat', 'Salvedad')}: {tr(lang, preset.caveat, preset.caveatEs ?? preset.caveat)}</p>}
          <p style={{ fontSize: 12 }}><Rich>{tr(lang, preset.note, preset.noteEs ?? preset.note)}</Rich></p>
        </>
      )}
      {gps && (
        <>
          <h2>{t('GPS clock offset (μs/day vs ground)', 'Desfase del reloj GPS (μs/día respecto al suelo)')}</h2>
          <div className="readout">
            <span>{t('gravitational', 'gravitacional')}</span><span>{fmt(gps.grav, 1)}</span>
            <span>{t('velocity', 'velocidad')}</span><span>{fmt(gps.vel, 1)}</span>
            <span>{t('net', 'neto')}</span><span>{fmt(gps.net, 1)}</span>
            <span>{t('observed', 'observado')}</span><span>{preset!.observed!.value} {preset!.observed!.unit === 'us/day' ? t('us/day', 'μs/día') : preset!.observed!.unit}</span>
          </div>
        </>
      )}
    </>
  );
}

function LightReadouts({ preset, Mm, body, b }: { preset: LightPreset | null; Mm: number | null; body: CelestialBody | null; b: number }) {
  const t = useTr(), lang = useLang();
  const d = deflection(b);
  let real = null as null | { pred: string; obs: string };
  if (preset && Mm && body) {
    const o = preset.observed;
    const shadow = /shadow/i.test(preset.id) && body.distanceM;
    if (shadow) {
      const ang = 2 * shadowAngularRadius(Mm / body.distanceM!) * ARCSEC * 1e6;
      real = { pred: `${t('shadow diameter', 'diámetro de la sombra')} ${fmt(ang, 1)} μas`, obs: o ? `${o.value} ± ${o.uncertainty} μas` : '' };
    } else {
      const bm = preset.impactParameterM / Mm, dd = deflection(bm);
      real = {
        pred: `${fmt(dd.weakField * ARCSEC, 3)}″ (${t('weak', 'débil')} 4M/b)${dd.numeric !== null ? `, ${t('numeric', 'numérico')} ${fmt(dd.numeric * ARCSEC, 3)}″` : ''}`,
        obs: o ? `${tr(lang, o.quantity, o.quantityEs ?? o.quantity)}: ${o.value}${o.uncertainty ? ` ± ${o.uncertainty}` : ''}` : t('none', 'ninguna'),
      };
    }
  }
  return (
    <>
      <h2>{t('Deflection', 'Deflexión')} ({t('slider', 'deslizador')} b = {fmt(b, 2)} M)</h2>
      <div className="readout">
        <span>{t('numeric', 'numérico')}</span><span>{d.numeric === null ? t('captured (b ≤ b_c)', 'capturado (b ≤ b_c)') : `${fmt(d.numeric * RAD, 3)}° `}</span>
        <span>{t('weak field 4M/b', 'campo débil 4M/b')}</span><span>{fmt(d.weakField * RAD, 3)}°</span>
        <span>b<sub>c</sub> = 3√3 M</span><span>{fmt(B_CRIT, 4)} M</span>
      </div>
      {preset && real && (
        <>
          <h2>{t('Real', 'Real')}: {tr(lang, preset.name, preset.nameEs ?? preset.name)}</h2>
          <div className="readout"><span>{t('GR', 'RG')}</span><span>{real.pred}</span><span>{t('observed', 'observado')}</span><span>{real.obs}</span></div>
          {preset.observed && <p style={{ fontSize: 12 }}>{t('Source', 'Fuente')}: <Src s={preset.observed.source} /></p>}
          <p style={{ fontSize: 12 }}><Rich>{tr(lang, preset.note, preset.noteEs ?? preset.note)}</Rich></p>
        </>
      )}
    </>
  );
}

export function RelativityPanel() {
  const t = useTr(), lang = useLang();
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
      <div data-tour="views" role="group" aria-label={t('View', 'Vista')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {VIEWS.map(([id, en, es]) => (
          <button key={id} aria-pressed={view === id} onClick={() => set({ grView: id })}
            style={{ padding: '6px', background: view === id ? 'var(--accent)' : 'var(--bg)', color: view === id ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
            {tr(lang, en, es)}
          </button>
        ))}
      </div>

      {(view === 'kerr' || view === 'image' || view === 'clocks') && (
        <>
          {view !== 'clocks' && <label className="field">
            <span>{t('Central object', 'Objeto central')}</span>
            <select value={grBody} onChange={(e) => set({ grBody: e.target.value, grOrbit: 'custom', grProgress: 0 })}>
              <option value="">{t('generic black hole, M = 1', 'agujero negro genérico, M = 1')}</option>
              {BODIES.map((b) => <option key={b.id} value={b.id}>{tr(lang, b.name, b.nameEs ?? b.name)}</option>)}
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
          <span>{t('Central object', 'Objeto central')}</span>
          <select value={grBody} onChange={(e) => set({ grBody: e.target.value, grOrbit: 'custom', grProgress: 0 })}>
            <option value="">{t('generic black hole, M = 1', 'agujero negro genérico, M = 1')}</option>
            {BODIES.map((b) => <option key={b.id} value={b.id}>{tr(lang, b.name, b.nameEs ?? b.name)}</option>)}
          </select>
        </label>
        {view !== 'flamm' && (
          <label className="field">
            <span>{view === 'light' ? t('Light preset', 'Luz predefinida') : t('Orbit preset', 'Órbita predefinida')}</span>
            <select value={custom ? 'custom' : grOrbit} onChange={(e) => set({ grOrbit: e.target.value, grProgress: 0 })}>
              <option value="custom">{t('custom', 'personalizada')}</option>
              {presets.map((p) => <option key={p.id} value={p.id}>{tr(lang, p.name, p.nameEs ?? p.name)}</option>)}
            </select>
          </label>
        )}
      </div>

      {view === 'orbits' && custom && (
        <>
          <label className="field"><span>{t('Periapsis', 'Periapsis')} r<sub>p</sub> = {fmt(grRp, 1)} M</span>
            <input type="range" min={2.5} max={60} step={0.1} value={grRp} onChange={(e) => set({ grRp: +e.target.value, grProgress: 0 })} /></label>
          <label className="field"><span>{t('Apoapsis', 'Apoapsis')} r<sub>a</sub> = {fmt(grRa, 1)} M</span>
            <input type="range" min={2.5} max={60} step={0.1} value={grRa} onChange={(e) => set({ grRa: +e.target.value, grProgress: 0 })} /></label>
        </>
      )}
      {view === 'light' && (
        <label className="field"><span>{t('Impact parameter', 'Parámetro de impacto')} b = {fmt(grB, 2)} M</span>
          <input type="range" min={2} max={20} step={0.05} value={grB} onChange={(e) => set({ grB: +e.target.value })} /></label>
      )}
      {view !== 'flamm' && (
        <label className="check"><input type="checkbox" checked={showFlamm} onChange={(e) => set({ grShowFlamm: e.target.checked })} /> {t('Lift curves onto the Flamm paraboloid', 'Elevar las curvas al paraboloide de Flamm')}</label>
      )}
      {view === 'orbits' && (
        <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
          <button onClick={() => set({ grPlaying: !playing })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
          <button onClick={() => set({ grPlaying: false, grProgress: 0 })}>{t('Reset', 'Reiniciar')}</button>
        </div>
      )}

      <h2>{t('Schwarzschild geometry', 'Geometría de Schwarzschild')}</h2>
      <Tex block>{String.raw`\begin{aligned}ds^2={}&-\Big(1-\tfrac{2M}{r}\Big)dt^2\\&+\Big(1-\tfrac{2M}{r}\Big)^{-1}dr^2+r^2\,d\Omega^2\end{aligned}`}</Tex>
      <p><T en={<>The Killing fields <Tex>{String.raw`\partial_t`}</Tex> and <Tex>{String.raw`\partial_\varphi`}</Tex> give conserved quantities along geodesics (see the Killing-field module):</>} es={<>Los campos de Killing <Tex>{String.raw`\partial_t`}</Tex> y <Tex>{String.raw`\partial_\varphi`}</Tex> dan cantidades conservadas a lo largo de las geodésicas (véase el módulo de campos de Killing):</>} /></p>
      <Tex block>{String.raw`E=\Big(1-\tfrac{2M}{r}\Big)\dot t,\qquad L=r^2\dot\varphi`}</Tex>
      <Tex block>{String.raw`\dot r^{2}=E^{2}-V_{\rm eff}(r)`}</Tex>
      <Tex block>{String.raw`\begin{aligned}V_{\rm eff}^{\rm massive}&=\Big(1-\tfrac{2M}{r}\Big)\Big(1+\tfrac{L^2}{r^2}\Big)\\V_{\rm eff}^{\rm light}&=\Big(1-\tfrac{2M}{r}\Big)\tfrac{L^2}{r^2}\end{aligned}`}</Tex>

      {view !== 'flamm' && (
        <>
          <h2>{t('Effective potential', 'Potencial efectivo')}</h2>
          <div data-tour="gr-potential">
            <PotentialPlot L={L} E2={E2} kind={view === 'light' ? 'null' : 'timelike'}
              rMax={view === 'light' ? 30 : Math.min(60, Math.max(20, om.ra * 1.2))} />
          </div>
        </>
      )}

      {view === 'orbits' && (
        <>
          <h2>{t('Orbit', 'Órbita')}</h2>
          {om.orb ? (
            <div className="readout">
              <span>E</span><span>{fmt(om.orb.E, 5)}</span>
              <span>L</span><span>{fmt(om.orb.L, 4)} M</span>
              <span>{t('fate', 'destino')}</span><span>{om.traj?.fate}</span>
              <span>r<sub>p</sub>, r<sub>a</sub></span><span>{fmt(om.rp, 2)}, {fmt(om.ra, 2)} M</span>
              <span>{t('measured shift / orbit', 'avance medido / órbita')}</span><span>{avg === null ? t('n/a (< 2 periapsides)', 'n/d (< 2 periapsis)') : `${fmt(avg * RAD, 2)}°`}</span>
            </div>
          ) : <p>{t('No bound orbit with these apsides (unbound, or inside the stability limit).', 'No hay órbita ligada con estos ápsides (no ligada, o dentro del límite de estabilidad).')}</p>}
          <h2>{t('Clocks at', 'Relojes en')} r = {fmt(rNow, 2)} M</h2>
          <div className="readout">
            <span>{t('static dτ/dt', 'dτ/dt estático')}</span><span>{rNow > 2 ? fmt(staticClockRate(rNow), 5) : '—'}</span>
            <span>{t('circular dτ/dt', 'dτ/dt circular')}</span><span>{rNow > 3 ? fmt(circularClockRate(rNow), 5) : '— (r ≤ 3M)'}</span>
          </div>
          <OrbitReadouts preset={om.preset} Mm={Mm} toy={om.toy} rp={om.rp} ra={om.ra} />
          {!om.toy && <p style={{ fontSize: 12 }}>{t('numeric vs weak field', 'numérico frente a campo débil')}: {fmt(sh.numeric / sh.weakField, 3)}×.</p>}
        </>
      )}
      {view === 'light' && (
        <LightReadouts preset={lm.preset} Mm={Mm} body={body} b={grB} />
      )}
      {view === 'flamm' && (
        <>
          <h2>{t('Flamm paraboloid', 'Paraboloide de Flamm')}</h2>
          <Tex block>{String.raw`\begin{aligned}r&=2M+\frac{z^2}{8M}\\ds^2_{\rm slice}&=\frac{dr^2}{1-2M/r}+r^2d\varphi^2\end{aligned}`}</Tex>
          <p><T en={<>The equatorial slice <Tex>{String.raw`t=\text{const}`}</Tex> embeds in flat <Tex>{String.raw`\mathbb R^3`}</Tex> as this surface, with Gaussian curvature <Tex>{String.raw`K=-M/r^3`}</Tex>. The throat <Tex>r=2M</Tex> joins two exteriors (Einstein–Rosen bridge) but is not traversable: the full spacetime is dynamical. The green ruler measures proper radial distance, which exceeds the coordinate distance <Tex>{String.raw`\Delta r`}</Tex>.</>} es={<>La sección ecuatorial <Tex>{String.raw`t=\text{const}`}</Tex> se sumerge en el <Tex>{String.raw`\mathbb R^3`}</Tex> plano como esta superficie, con curvatura gaussiana <Tex>{String.raw`K=-M/r^3`}</Tex>. La garganta <Tex>r=2M</Tex> une dos exteriores (puente de Einstein–Rosen) pero no es atravesable: el espaciotiempo completo es dinámico. La regla verde mide la distancia radial propia, que supera a la distancia coordenada <Tex>{String.raw`\Delta r`}</Tex>.</>} /></p>
        </>
      )}

      {body && <BodyCard body={body} />}
      {!body && <p><T en={<>Generic black hole in geometric units G = c = 1, lengths in M; r<sub>s</sub> = 2M.</>} es={<>Agujero negro genérico en unidades geométricas G = c = 1, longitudes en M; r<sub>s</sub> = 2M.</>} /></p>}
      </>}
    </div>
  );
}
