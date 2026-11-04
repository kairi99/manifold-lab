import { useStore } from '../state/store';
import { Tex, fmt, Rich } from './Tex';
import { BODIES } from '../data/celestial';
import { C } from '../data/celestial';
import { GM_BH_10, horizonTidalSI, tidalTensor, radialObserver, fallState } from '../math/tidal';
import { schwarzschild } from '../math/spacetime';
import { tidalFrame } from '../scene/TidalScene';
import { Note, Src, Transport, sci } from './SpacetimeUi';
import { T, useTr, useLang } from '../i18n';

const G0 = 9.80665;
const HOLES = [{ id: 'bh10', name: '10 solar-mass black hole', nameEs: 'Agujero negro de 10 masas solares', gm: GM_BH_10, sources: [] as { label: string; url?: string }[] },
  ...['sgr-a', 'm87', 'cyg-x1'].map((id) => BODIES.find((b) => b.id === id)!).map((b) => ({ id: b.id, name: b.name, nameEs: (b as { nameEs?: string }).nameEs ?? b.name, gm: b.gm, sources: b.sources }))];

export function TidalPanel() {
  const t = useTr(), lang = useLang();
  const { stBody: bodyId, stR0: r0, stLen: len, stProgress: prog, stPlaying: playing } = useStore();
  const set = useStore((s) => s.set);
  const hole = HOLES.find((h) => h.id === bodyId) ?? HOLES[0];
  const f = tidalFrame(r0, prog);
  const fs = fallState(r0, f.tau), o = radialObserver(f.r, fs.u[1]);
  const E = tidalTensor(schwarzschild, [0, f.r, Math.PI / 2, 0], { M: 1 }, o.u, o.triad);
  const hz = horizonTidalSI(hole.gm, len), rs = hz.rHorizon;
  const Mm = rs / 2, tM = Mm / C; // M in metres and seconds
  const rOneG = ((2 * hole.gm * len) / G0) ** (1 / 3); // radial tidal accel = g
  const gH = hz.radial / G0;
  const atHorizonIsInside = rOneG < rs;
  const stellarVerdict = gH > 10;
  const tauH = f.res.tau[f.res.tau.length - 1];
  return (
    <div>
      <label className="field"><span>{t('Black hole', 'Agujero negro')}</span>
        <select aria-label="Black hole" value={hole.id} onChange={(e) => set({ stBody: e.target.value })}>
          {HOLES.map((h) => <option key={h.id} value={h.id}>{lang === 'es' ? h.nameEs : h.name}</option>)}</select></label>
      <label className="field"><span>{t('Release radius', 'Radio de suelta')} r<sub>0</sub> = {r0} M {t('(at rest)', '(en reposo)')}</span>
        <input type="range" min={6} max={60} step={1} value={r0} aria-label="Release radius r0" onChange={(e) => set({ stR0: +e.target.value, stProgress: 0 })} /></label>
      <label className="field"><span>{t('Body length', 'Longitud del cuerpo')} L = {fmt(len, 1)} m</span>
        <input type="range" min={0.5} max={10} step={0.5} value={len} aria-label="Body length" onChange={(e) => set({ stLen: +e.target.value })} /></label>
      <Transport playing={playing} progress={prog} set={set} label={t('fall', 'caída')} />

      <h2>{t('Geodesic deviation', 'Desviación geodésica')}</h2>
      <Tex block>{'\\frac{D^2\\xi^i}{d\\tau^2}=-R^i{}_{0j0}\\,\\xi^j=-E^i{}_j\\,\\xi^j'}</Tex>
      <Tex block>{'E=\\mathrm{diag}\\!\\left(-\\tfrac{2M}{r^3},\\ +\\tfrac{M}{r^3},\\ +\\tfrac{M}{r^3}\\right)'}</Tex>
      <Note><T en={<>Signs: E<sub>rr</sub> &lt; 0 means ξ̈ = +2M ξ/r³ along r (stretching); the transverse E &gt; 0 squeezes. Trace E = 0 (vacuum), so the volume is preserved at first order.</>} es={<>Signos: E<sub>rr</sub> &lt; 0 significa ξ̈ = +2M ξ/r³ a lo largo de r (estiramiento); la E transversal &gt; 0 comprime. Traza E = 0 (vacío), así que el volumen se conserva a primer orden.</>} /></Note>
      <div className="readout">
        <span>r / M</span><span>{fmt(f.r, 3)}</span>
        <span>τ / M</span><span>{fmt(f.tau, 2)} {t('of', 'de')} {fmt(tauH, 2)} ({t('at', 'en')} r = 2.002 M)</span>
        <span>E<sub>rr</sub> ({t('radial', 'radial')})</span><span>{sci(E[0][0])} / M² (= −2M/r³ = {sci(-2 / f.r ** 3)})</span>
        <span>E<sub>θθ</sub>, E<sub>φφ</sub></span><span>{sci(E[1][1])}, {sci(E[2][2])} / M²</span>
        <span>{t('trace E', 'traza E')}</span><span>{sci(E[0][0] + E[1][1] + E[2][2], 2)}</span>
      </div>
      <Note>{t('The animation stops just outside the horizon (r = 2.002 M) because Schwarzschild coordinates are singular at r = 2M; the infaller itself crosses smoothly in proper time, and the tidal tensor stays finite there.', 'La animación se detiene justo fuera del horizonte (r = 2.002 M) porque las coordenadas de Schwarzschild son singulares en r = 2M; el observador en caída lo cruza suavemente en tiempo propio, y el tensor de marea sigue siendo finito allí.')}</Note>

      <h2>{lang === 'es' ? hole.nameEs : hole.name}</h2>
      <div className="readout">
        <span>{t('horizon radius', 'radio del horizonte')}</span><span>{sci(rs)} m</span>
        <span>{t('M in time units GM/c³', 'M en unidades de tiempo GM/c³')}</span><span>{sci(tM)} s</span>
        <span>{t('τ to horizon (this fall)', 'τ hasta el horizonte (esta caída)')}</span><span>{sci(tauH * tM)} s</span>
        <span>{t('tidal accel. across L at horizon, radial', 'acel. de marea a lo largo de L en el horizonte, radial')}</span><span>{sci(hz.radial)} m/s² = {sci(gH)} g</span>
        <span>{t('tidal accel., transverse', 'acel. de marea, transversal')}</span><span>{sci(hz.transverse)} m/s² = {sci(hz.transverse / G0)} g</span>
        <span>{t('radial tidal = 1 g at', 'marea radial = 1 g en')}</span><span>{sci(rOneG)} m = {fmt(rOneG / rs, 2)} r<sub>s</sub></span>
      </div>
      <Note><Rich>{stellarVerdict
        ? t(`Spaghettification before the horizon: a ${fmt(len, 1)} m body feels ${sci(gH, 2)} g between head and feet at r = 2GM/c², and 1 g already at ${fmt(rOneG / rs, 1)} r_s.`,
            `Espaguetización antes del horizonte: un cuerpo de ${fmt(len, 1)} m nota ${sci(gH, 2)} g entre cabeza y pies en r = 2GM/c², y ya 1 g en ${fmt(rOneG / rs, 1)} r_s.`)
        : atHorizonIsInside ? t(`Nothing dramatic at the horizon: the stretch is ${sci(gH, 2)} g, and the 1 g point lies inside it (${fmt(rOneG / rs, 2)} r_s). Tidal forces become lethal only deeper in.`,
            `Nada dramático en el horizonte: el estiramiento es de ${sci(gH, 2)} g y el punto de 1 g está dentro (${fmt(rOneG / rs, 2)} r_s). Las fuerzas de marea solo se vuelven letales más adentro.`)
          : t(`Radial stretch ${sci(gH, 2)} g at the horizon.`, `Estiramiento radial de ${sci(gH, 2)} g en el horizonte.`)}</Rich></Note>
      <Tex block>{'a_{\\rm tidal}\\simeq\\frac{2GM}{r^3}L=\\frac{c^6}{4G^2M^2}\\,L\\ \\text{at}\\ r=\\frac{2GM}{c^2}'}</Tex>
      {hole.sources.length > 0 && <ul style={{ fontSize: 12, paddingLeft: 18 }}>{hole.sources.map((s, i) => <li key={i}><Src s={s} /></li>)}</ul>}
    </div>
  );
}
