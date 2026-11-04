import { useStore } from '../state/store';
import { Tex, fmt, fmtSci, Rich } from './Tex';
import { BLACK_HOLES, fmtDuration, infallState, massSeconds, probeAt } from './PenroseModel';
import { infallGeodesic } from '../math/penrose';
import { useTr, useLang } from '../i18n';

const PI = Math.PI;
const inf = (x: number, d = 3, es = false) => (Number.isFinite(x) ? fmt(x, d) : `${x > 0 ? '+∞' : '−∞'} ${es ? '(en un horizonte)' : '(on a horizon)'}`);
const ROLE: Record<string, string> = {
  I: 'exterior: r and t are ordinary space and time coordinates',
  III: 'second exterior, causally disconnected from I',
  II: 'black hole interior: r is a time coordinate here; every future-directed path reaches r = 0',
  IV: 'white hole interior: r is a time coordinate here; every past-directed path comes from r = 0',
};
const ROLE_ES: Record<string, string> = {
  I: 'exterior: r y t son coordenadas ordinarias de espacio y tiempo',
  III: 'segundo exterior, causalmente desconectado de I',
  II: 'interior del agujero negro: aquí r es una coordenada temporal; todo camino dirigido al futuro llega a r = 0',
  IV: 'interior del agujero blanco: aquí r es una coordenada temporal; todo camino dirigido al pasado viene de r = 0',
};

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="field"><span><Rich>{label}</Rich></span>
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
  const es = useLang() === 'es';
  const dur = (m: number) => (Msec ? `${fmtDuration(m * Msec, es)}` : '—');
  const xMin = sch ? -PI : 0;
  const t = useTr();

  return (
    <div>
      <label className="field"><span>{t('Spacetime', 'Espaciotiempo')}</span>
        <select value={space} onChange={(e) => { const s = e.target.value as typeof space; set({ csSpace: s, csPt: s === 'minkowski' ? [1.2, 0.4] : [1.2, 0.3] }); }}>
          <option value="minkowski">{t('Minkowski (flat)', 'Minkowski (plano)')}</option>
          <option value="schwarzschild">{t('Schwarzschild, maximally extended (Kruskal)', 'Schwarzschild, extensión máxima (Kruskal)')}</option>
        </select></label>
      <p style={{ fontSize: 12 }}>{t('Drag in the diagram (or use the sliders) to place an event; its light cone is drawn at 45°. Dashed rays are the past cone.', 'Arrastra en el diagrama (o usa los deslizadores) para colocar un suceso; su cono de luz se dibuja a 45°. Los rayos discontinuos son el cono pasado.')}</p>
      <Slider label={`${t('Event', 'Suceso')} X = ${fmt(pt[0], 2)} (horizontal)`} value={pt[0]} min={xMin} max={PI} step={0.01} onChange={(v) => set({ csPt: [v, pt[1]] })} />
      <Slider label={`${t('Event', 'Suceso')} T = ${fmt(pt[1], 2)} (vertical)`} value={pt[1]} min={-PI} max={PI} step={0.01} onChange={(v) => set({ csPt: [pt[0], v] })} />

      <h2>{t('Probe event', 'Suceso de prueba')}</h2>
      {probe ? (
        <>
          <div className="readout">
            {probe.region && <><span>{t('region', 'región')}</span><span>{probe.region}</span></>}
            <span>r / M</span><span>{fmt(probe.r, 3)}</span>
            <span>t / M</span><span>{inf(probe.t, 3, es)}</span>
            {probe.U !== null && probe.V !== null && <><span>Kruskal U</span><span>{fmt(probe.U, 4)}</span><span>Kruskal V</span><span>{fmt(probe.V, 4)}</span></>}
          </div>
          <p style={{ fontSize: 12 }}>{probe.region ? (es ? ROLE_ES : ROLE)[probe.region] : t('flat space: r = (v−u)/2, t = (u+v)/2 with u = tan((T−X)/2), v = tan((T+X)/2).', 'espacio plano: r = (v−u)/2, t = (u+v)/2 con u = tan((T−X)/2), v = tan((T+X)/2).')}</p>
        </>
      ) : <p style={{ fontSize: 12 }}>{t('Outside the diagram', 'Fuera del diagrama')}{sch ? t(' (or beyond the singularity r = 0)', ' (o más allá de la singularidad r = 0)') : ''}: {t('move the event back inside.', 'vuelve a meter el suceso dentro.')}</p>}

      {sch && (
        <>
          <h2>{t('Infalling observer', 'Observador en caída')}</h2>
          <Slider label={`${t('Start radius', 'Radio inicial')} r₀ = ${fmt(r0, 1)} M ${t('(from rest)', '(desde el reposo)')}`} value={r0} min={2.5} max={50} step={0.1} onChange={(v) => set({ csR0: v, csProgress: 0 })} />
          <div className="field" role="group" aria-label={t('Playback', 'Reproducción')} style={{ flexDirection: 'row', gap: 8 }}>
            <button onClick={() => set({ csPlaying: !playing })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
            <button onClick={() => set({ csPlaying: false, csProgress: 0 })}>{t('Reset', 'Reiniciar')}</button>
          </div>
          <Slider label={`${t('Infall progress', 'Progreso de la caída')} ${fmt(progress * 100, 0)}%`} value={progress} min={0} max={1} step={0.001} onChange={(v) => set({ csProgress: v, csPlaying: false })} />
          <label className="field"><span>{t('Real black hole (for units)', 'Agujero negro real (para las unidades)')}</span>
            <select value={body} onChange={(e) => set({ csBody: e.target.value })}>
              <option value="">{t('geometric units only', 'solo unidades geométricas')}</option>
              {BLACK_HOLES.map((b) => <option key={b.id} value={b.id}>{es ? (b as { nameEs?: string }).nameEs ?? b.name : b.name}</option>)}
            </select></label>
          <div className="readout">
            <span>{t('r now', 'r ahora')}</span><span>{fmt(st.r, 3)} M ({inside ? t('inside horizon', 'dentro del horizonte') : t('outside horizon', 'fuera del horizonte')})</span>
            <span>{t('τ now', 'τ ahora')}</span><span>{fmt(st.tau, 3)} M{Msec ? ` = ${dur(st.tau)}` : ''}</span>
            <span>{t('Schwarzschild t now', 't de Schwarzschild ahora')}</span><span>{inf(st.t, 2, es)} M</span>
            <span>{t('τ to horizon', 'τ hasta el horizonte')}</span><span>{fmt(g.tauHorizon, 3)} M{Msec ? ` = ${dur(g.tauHorizon)}` : ''}</span>
            <span>{t('τ to singularity', 'τ hasta la singularidad')}</span><span>{fmt(g.tauSingularity, 3)} M{Msec ? ` = ${dur(g.tauSingularity)}` : ''}</span>
            <span>{t('τ from horizon to r = 0', 'τ del horizonte a r = 0')}</span><span>{fmt(g.tauSingularity - g.tauHorizon, 3)} M{Msec ? ` = ${dur(g.tauSingularity - g.tauHorizon)}` : ''}</span>
          </div>
          <p style={{ fontSize: 12 }}>{t('Schwarzschild t → ∞ as the observer reaches the horizon, but proper time τ stays finite and the worldline crosses U = 0 smoothly in Kruskal coordinates.', 'La t de Schwarzschild → ∞ cuando el observador llega al horizonte, pero el tiempo propio τ sigue siendo finito y la línea de universo cruza U = 0 suavemente en coordenadas de Kruskal.')} {Msec && t(`One M of time is GM/c³ = ${fmtSci(Msec, 3)} s for this black hole.`, `Una M de tiempo es GM/c³ = ${fmtSci(Msec, 3)} s para este agujero negro.`)}</p>
          <Tex block>{String.raw`\tau_{\rm sing}=\pi\sqrt{\frac{r_0^3}{8M}}=${fmt(g.tauSingularity, 2)}\,M`}</Tex>
        </>
      )}

      <h2>{t('Equations', 'Ecuaciones')}</h2>
      {sch ? (
        <>
          <p>{t('Kruskal–Szekeres coordinates remove the coordinate singularity at r = 2M:', 'Las coordenadas de Kruskal–Szekeres eliminan la singularidad de coordenadas en r = 2M:')}</p>
          <Tex block>{String.raw`\begin{aligned}\Big(\tfrac{r}{2M}-1\Big)e^{r/2M}&=-UV\\ \frac{t}{2M}&=\ln\Big|\frac{V}{U}\Big|\end{aligned}`}</Tex>
          <Tex block>{String.raw`ds^2=-\tfrac{32M^3}{r}e^{-r/2M}\,dU\,dV+r^2d\Omega^2`}</Tex>
          <p>{t('Compactify with arctangents so infinity lands at finite distance:', 'Se compactifica con arcotangentes para llevar el infinito a distancia finita:')}</p>
          <Tex block>{String.raw`\begin{aligned}\tilde U&=\arctan U,\quad \tilde V=\arctan V\\T&=\tilde U+\tilde V,\quad X=\tilde V-\tilde U\end{aligned}`}</Tex>
          <p>{t('Radial light rays are the lines U, V = const, i.e. 45° in (X, T). The singularity r = 0 is UV = 1, which maps to the spacelike line T = ±π/2.', 'Los rayos de luz radiales son las rectas U, V = const, es decir, a 45° en (X, T). La singularidad r = 0 es UV = 1, que se transforma en la recta espacial T = ±π/2.')}</p>
        </>
      ) : (
        <>
          <Tex block>{String.raw`\begin{aligned}u&=t-r,\quad v=t+r\\T&=\arctan v+\arctan u\\R&=\arctan v-\arctan u\end{aligned}`}</Tex>
          <p>{t('Infinity is the boundary |T| + R = π: ℐ⁺ and ℐ⁻ are null, i⁰ is the corner (R, T) = (π, 0), and timelike worldlines run from i⁻ to i⁺. Rays reaching R = 0 pass through the origin and reflect.', 'El infinito es el borde |T| + R = π: ℐ⁺ e ℐ⁻ son nulos, i⁰ es la esquina (R, T) = (π, 0) y las líneas de universo temporales van de i⁻ a i⁺. Los rayos que llegan a R = 0 pasan por el origen y se reflejan.')}</p>
        </>
      )}
    </div>
  );
}
