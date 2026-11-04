import { SurfacePicker } from '../panels/SurfacePicker';
import { Tex, fmt, coordText } from '../panels/Tex';
import GeodesicFan, { revealCount, useGeoFan } from '../scene/GeodesicFan';
import { clairaut, geodesicAccel, speed } from '../math/geodesic';
import { useStore } from '../state/store';

const DEG = 180 / Math.PI;

export function GeodesicScene() {
  return <GeodesicFan />;
}

export function GeodesicPanel() {
  const { surface, paths, mid } = useGeoFan();
  const { surfaceId, geoCount, geoSpread, geoLength, geoProgress, geoPlaying, set } = useStore();
  const target = geoProgress * geoLength;
  const central = paths[geoCount === 1 ? 0 : mid];
  const cur = central.samples[revealCount(central, target) - 1];
  const acc = geodesicAccel(surface, cur.uv, cur.vel);
  const c = clairaut(surface, cur.uv, cur.vel);
  const [cu, cv] = surface.coords;

  const tip = (p: typeof central) => surface.position(...p.samples[revealCount(p, target) - 1].uv.slice(0, 2) as [number, number]);
  const a = tip(paths[0]), b = tip(paths[paths.length - 1]);
  const chord = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const stopped = paths.find((p) => p.stopped);
  const killing = surfaceId === 'sphere' ? String.raw`\partial_\varphi` : String.raw`\partial_u`;

  return (
    <div>
      <SurfacePicker />
      <label className="field">
        <span>Number of geodesics: {geoCount}</span>
        <input type="range" min={1} max={15} step={1} value={geoCount} onChange={(e) => set({ geoCount: +e.target.value })} />
      </label>
      <label className="field">
        <span>Fan angle: {fmt(geoSpread * DEG, 0)}°</span>
        <input type="range" min={0} max={Math.PI / 2} step={0.01} value={geoSpread} onChange={(e) => set({ geoSpread: +e.target.value })} />
      </label>
      <label className="field">
        <span>Length: {fmt(geoLength / Math.PI, 2)}π</span>
        <input type="range" min={0.5} max={4 * Math.PI} step={0.01} value={geoLength} onChange={(e) => set({ geoLength: +e.target.value })} />
      </label>
      <div data-tour="geo-controls" className="field" role="group" aria-label="Playback">
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => set(geoPlaying ? { geoPlaying: false } : { geoPlaying: true, geoProgress: geoProgress >= 1 ? 0 : geoProgress })}>
            {geoPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => set({ geoPlaying: false, geoProgress: 0 })}>Reset</button>
        </div>
        <label htmlFor="geo-progress">Progress {(geoProgress * 100).toFixed(0)}%</label>
        <input id="geo-progress" type="range" min={0} max={1} step={0.001} value={geoProgress} onChange={(e) => set({ geoProgress: +e.target.value, geoPlaying: false })} />
      </div>

      <h2>Geodesic equation</h2>
      <Tex block>{String.raw`\ddot u^k + \Gamma^k_{ij}\,\dot u^i \dot u^j = 0`}</Tex>
      <Tex block>{surface.latex.christoffel}</Tex>
      <div className="readout">
        <span>({coordText(cu)}, {coordText(cv)})</span><span>({fmt(cur.uv[0])}, {fmt(cur.uv[1])})</span>
        <span>velocity</span><span>({fmt(cur.vel[0])}, {fmt(cur.vel[1])})</span>
        <span>acceleration</span><span>({fmt(acc[0])}, {fmt(acc[1])})</span>
        <span>speed</span><span>{fmt(speed(surface, cur.uv, cur.vel), 5)}</span>
        {c !== null && (<><span>Clairaut c</span><span>{fmt(c, 5)}</span></>)}
      </div>
      {c !== null && (
        <p>c stays constant along the geodesic: conserved because <Tex>{killing}</Tex> is a Killing field (Noether/Clairaut).</p>
      )}
      {stopped && <p>Left the chart at s = {fmt(stopped.samples[stopped.samples.length - 1].s, 2)}.</p>}

      <h2>Geodesic deviation</h2>
      <div className="readout"><span>outer spread</span><span>{fmt(chord, 4)}</span></div>
      <p>Neighbouring geodesics obey the Jacobi equation <Tex>{String.raw`J'' + K J = 0`}</Tex>. If K &gt; 0 they refocus (sphere: conjugate point at distance <Tex>{String.raw`\pi/\sqrt K`}</Tex>); if K &lt; 0 they diverge (saddle).</p>
    </div>
  );
}
