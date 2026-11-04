import { useStore } from '../state/store';
import { Tex, fmt } from './Tex';
import { BODIES } from '../data/celestial';
import { C } from '../data/celestial';
import { GM_BH_10, horizonTidalSI, tidalTensor, radialObserver, fallState } from '../math/tidal';
import { schwarzschild } from '../math/spacetime';
import { tidalFrame } from '../scene/TidalScene';
import { Note, Src, Transport, sci } from './SpacetimeUi';

const G0 = 9.80665;
const HOLES = [{ id: 'bh10', name: '10 solar-mass black hole', gm: GM_BH_10, sources: [] as { label: string; url?: string }[] },
  ...['sgr-a', 'm87', 'cyg-x1'].map((id) => BODIES.find((b) => b.id === id)!).map((b) => ({ id: b.id, name: b.name, gm: b.gm, sources: b.sources }))];

export function TidalPanel() {
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
      <label className="field"><span>Black hole</span>
        <select aria-label="Black hole" value={hole.id} onChange={(e) => set({ stBody: e.target.value })}>
          {HOLES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
      <label className="field"><span>Release radius r0 = {r0} M (at rest)</span>
        <input type="range" min={6} max={60} step={1} value={r0} aria-label="Release radius r0" onChange={(e) => set({ stR0: +e.target.value, stProgress: 0 })} /></label>
      <label className="field"><span>Body length L = {fmt(len, 1)} m</span>
        <input type="range" min={0.5} max={10} step={0.5} value={len} aria-label="Body length" onChange={(e) => set({ stLen: +e.target.value })} /></label>
      <Transport playing={playing} progress={prog} set={set} label="fall" />

      <h2>Geodesic deviation</h2>
      <Tex block>{'\\frac{D^2\\xi^i}{d\\tau^2}=-R^i{}_{0j0}\\,\\xi^j=-E^i{}_j\\,\\xi^j'}</Tex>
      <Tex block>{'E=\\mathrm{diag}\\!\\left(-\\tfrac{2M}{r^3},\\ +\\tfrac{M}{r^3},\\ +\\tfrac{M}{r^3}\\right)'}</Tex>
      <Note>Signs: E_rr &lt; 0 means ξ̈ = +2M ξ/r³ along r (stretching); the transverse E &gt; 0 squeezes. Trace E = 0 (vacuum), so the volume is preserved at first order.</Note>
      <div className="readout">
        <span>r / M</span><span>{fmt(f.r, 3)}</span>
        <span>τ / M</span><span>{fmt(f.tau, 2)} of {fmt(tauH, 2)} (at r = 2.002 M)</span>
        <span>E_rr (radial)</span><span>{sci(E[0][0])} / M² (= −2M/r³ = {sci(-2 / f.r ** 3)})</span>
        <span>E_θθ, E_φφ</span><span>{sci(E[1][1])}, {sci(E[2][2])} / M²</span>
        <span>trace E</span><span>{sci(E[0][0] + E[1][1] + E[2][2], 2)}</span>
      </div>
      <Note>The animation stops just outside the horizon (r = 2.002 M) because Schwarzschild coordinates are singular at r = 2M; the infaller itself crosses smoothly in proper time, and the tidal tensor stays finite there.</Note>

      <h2>{hole.name}</h2>
      <div className="readout">
        <span>horizon radius</span><span>{sci(rs)} m</span>
        <span>M in time units GM/c³</span><span>{sci(tM)} s</span>
        <span>τ to horizon (this fall)</span><span>{sci(tauH * tM)} s</span>
        <span>tidal accel. across L at horizon, radial</span><span>{sci(hz.radial)} m/s² = {sci(gH)} g</span>
        <span>tidal accel., transverse</span><span>{sci(hz.transverse)} m/s² = {sci(hz.transverse / G0)} g</span>
        <span>radial tidal = 1 g at</span><span>{sci(rOneG)} m = {fmt(rOneG / rs, 2)} r_s</span>
      </div>
      <Note>{stellarVerdict
        ? `Spaghettification before the horizon: a ${fmt(len, 1)} m body feels ${sci(gH, 2)} g between head and feet at r = 2GM/c², and 1 g already at ${fmt(rOneG / rs, 1)} r_s.`
        : atHorizonIsInside ? `Nothing dramatic at the horizon: the stretch is ${sci(gH, 2)} g, and the 1 g point lies inside it (${fmt(rOneG / rs, 2)} r_s). Tidal forces become lethal only deeper in.` : `Radial stretch ${sci(gH, 2)} g at the horizon.`}</Note>
      <Tex block>{'a_{\\rm tidal}\\simeq\\frac{2GM}{r^3}L=\\frac{c^6}{4G^2M^2}\\,L\\ \\text{at}\\ r=\\frac{2GM}{c^2}'}</Tex>
      {hole.sources.length > 0 && <ul style={{ fontSize: 12, paddingLeft: 18 }}>{hole.sources.map((s, i) => <li key={i}><Src s={s} /></li>)}</ul>}
    </div>
  );
}
