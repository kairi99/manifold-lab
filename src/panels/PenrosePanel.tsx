import { useStore } from '../state/store';
import { Tex, fmt } from './Tex';
import { BLACK_HOLES, fmtDuration, infallState, massSeconds, probeAt } from './PenroseModel';
import { infallGeodesic } from '../math/penrose';

const PI = Math.PI;
const inf = (x: number, d = 3) => (Number.isFinite(x) ? fmt(x, d) : x > 0 ? '+∞ (on a horizon)' : '−∞ (on a horizon)');
const ROLE: Record<string, string> = {
  I: 'exterior: r and t are ordinary space and time coordinates',
  III: 'second exterior, causally disconnected from I',
  II: 'black hole interior: r is a time coordinate here; every future-directed path reaches r = 0',
  IV: 'white hole interior: r is a time coordinate here; every past-directed path comes from r = 0',
};

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="field"><span>{label}</span>
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} /></label>
  );
}

export function PenrosePanel() {
  const space = useStore((s) => s.csSpace), pt = useStore((s) => s.csPt), r0 = useStore((s) => s.csR0);
  const body = useStore((s) => s.csBody), progress = useStore((s) => s.csProgress), playing = useStore((s) => s.csPlaying), set = useStore((s) => s.set);
  const sch = space === 'schwarzschild';
  const probe = probeAt(space, pt[0], pt[1]);
  const g = infallGeodesic(r0);
  const st = infallState(r0, progress);
  const Msec = massSeconds(body);
  const inside = st.eta > g.etaHorizon;
  const dur = (m: number) => (Msec ? `${fmtDuration(m * Msec)}` : '—');
  const xMin = sch ? -PI : 0;

  return (
    <div>
      <label className="field"><span>Spacetime</span>
        <select value={space} onChange={(e) => { const s = e.target.value as typeof space; set({ csSpace: s, csPt: s === 'minkowski' ? [1.2, 0.4] : [1.2, 0.3] }); }}>
          <option value="minkowski">Minkowski (flat)</option>
          <option value="schwarzschild">Schwarzschild, maximally extended (Kruskal)</option>
        </select></label>
      <p style={{ fontSize: 12 }}>Drag in the diagram (or use the sliders) to place an event; its light cone is drawn at 45°. Dashed rays are the past cone.</p>
      <Slider label={`Event X = ${fmt(pt[0], 2)} (horizontal)`} value={pt[0]} min={xMin} max={PI} step={0.01} onChange={(v) => set({ csPt: [v, pt[1]] })} />
      <Slider label={`Event T = ${fmt(pt[1], 2)} (vertical)`} value={pt[1]} min={-PI} max={PI} step={0.01} onChange={(v) => set({ csPt: [pt[0], v] })} />

      <h2>Probe event</h2>
      {probe ? (
        <>
          <div className="readout">
            {probe.region && <><span>region</span><span>{probe.region}</span></>}
            <span>r / M</span><span>{fmt(probe.r, 3)}</span>
            <span>t / M</span><span>{inf(probe.t)}</span>
            {probe.U !== null && probe.V !== null && <><span>Kruskal U</span><span>{fmt(probe.U, 4)}</span><span>Kruskal V</span><span>{fmt(probe.V, 4)}</span></>}
          </div>
          <p style={{ fontSize: 12 }}>{probe.region ? ROLE[probe.region] : 'flat space: r = (v−u)/2, t = (u+v)/2 with u = tan((T−X)/2), v = tan((T+X)/2).'}</p>
        </>
      ) : <p style={{ fontSize: 12 }}>Outside the diagram{sch ? ' (or beyond the singularity r = 0)' : ''}: move the event back inside.</p>}

      {sch && (
        <>
          <h2>Infalling observer</h2>
          <Slider label={`Start radius r₀ = ${fmt(r0, 1)} M (from rest)`} value={r0} min={2.5} max={50} step={0.1} onChange={(v) => set({ csR0: v, csProgress: 0 })} />
          <div className="field" role="group" aria-label="Playback" style={{ flexDirection: 'row', gap: 8 }}>
            <button onClick={() => set({ csPlaying: !playing })}>{playing ? 'Pause' : 'Play'}</button>
            <button onClick={() => set({ csPlaying: false, csProgress: 0 })}>Reset</button>
          </div>
          <Slider label={`Infall progress ${fmt(progress * 100, 0)}%`} value={progress} min={0} max={1} step={0.001} onChange={(v) => set({ csProgress: v, csPlaying: false })} />
          <label className="field"><span>Real black hole (for units)</span>
            <select value={body} onChange={(e) => set({ csBody: e.target.value })}>
              <option value="">geometric units only</option>
              {BLACK_HOLES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></label>
          <div className="readout">
            <span>r now</span><span>{fmt(st.r, 3)} M ({inside ? 'inside' : 'outside'} horizon)</span>
            <span>τ now</span><span>{fmt(st.tau, 3)} M{Msec ? ` = ${dur(st.tau)}` : ''}</span>
            <span>Schwarzschild t now</span><span>{inf(st.t, 2)} M</span>
            <span>τ to horizon</span><span>{fmt(g.tauHorizon, 3)} M{Msec ? ` = ${dur(g.tauHorizon)}` : ''}</span>
            <span>τ to singularity</span><span>{fmt(g.tauSingularity, 3)} M{Msec ? ` = ${dur(g.tauSingularity)}` : ''}</span>
            <span>τ from horizon to r = 0</span><span>{fmt(g.tauSingularity - g.tauHorizon, 3)} M{Msec ? ` = ${dur(g.tauSingularity - g.tauHorizon)}` : ''}</span>
          </div>
          <p style={{ fontSize: 12 }}>Schwarzschild t → ∞ as the observer reaches the horizon, but proper time τ stays finite and the worldline crosses U = 0 smoothly in Kruskal coordinates. {Msec && `One M of time is GM/c³ = ${Msec.toExponential(3)} s for this black hole.`}</p>
          <Tex block>{String.raw`\tau_{\rm sing}=\pi\sqrt{\frac{r_0^3}{8M}}=${fmt(g.tauSingularity, 2)}\,M`}</Tex>
        </>
      )}

      <h2>Equations</h2>
      {sch ? (
        <>
          <p>Kruskal–Szekeres coordinates remove the coordinate singularity at r = 2M:</p>
          <Tex block>{String.raw`\begin{aligned}\Big(\tfrac{r}{2M}-1\Big)e^{r/2M}&=-UV\\ \frac{t}{2M}&=\ln\Big|\frac{V}{U}\Big|\end{aligned}`}</Tex>
          <Tex block>{String.raw`ds^2=-\tfrac{32M^3}{r}e^{-r/2M}\,dU\,dV+r^2d\Omega^2`}</Tex>
          <p>Compactify with arctangents so infinity lands at finite distance:</p>
          <Tex block>{String.raw`\begin{aligned}\tilde U&=\arctan U,\quad \tilde V=\arctan V\\T&=\tilde U+\tilde V,\quad X=\tilde V-\tilde U\end{aligned}`}</Tex>
          <p>Radial light rays are the lines U, V = const, i.e. 45° in (X, T). The singularity r = 0 is UV = 1, which maps to the spacelike line T = ±π/2.</p>
        </>
      ) : (
        <>
          <Tex block>{String.raw`\begin{aligned}u&=t-r,\quad v=t+r\\T&=\arctan v+\arctan u\\R&=\arctan v-\arctan u\end{aligned}`}</Tex>
          <p>Infinity is the boundary |T| + R = π: ℐ⁺ and ℐ⁻ are null, i⁰ is the corner (R, T) = (π, 0), and timelike worldlines run from i⁻ to i⁺. Rays reaching R = 0 pass through the origin and reflect.</p>
        </>
      )}
    </div>
  );
}
