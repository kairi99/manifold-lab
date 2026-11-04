import { Seg, Note } from '../panels/SpacetimeUi';
import { Tex, fmt, fmtSci } from '../panels/Tex';
import { T, useTr } from '../i18n';
import { useCurves } from './curvesState';
import { CurveScene } from '../scene/CurveScene';
import { ChartsScene, GRID_SPH, GRID_ST } from '../scene/ChartsScene';
import { CURVES, arcLength, frenet, type CurveId } from '../math/frenet';
import { detJ, gSph, jacobian, lambdaStereo, pullbackStereo, toStereo } from '../math/charts';
import { PAL } from '../theme/palette';

const VIEWS = [['curves', 'Curves', 'Curvas'], ['charts', 'Charts', 'Cartas']] as const;
const PRESETS: CurveId[] = ['circle', 'helix', 'trefoil', 'viviani', 'ellipse', 'twisted', 'inflect'];

export function CurvesScene() {
  return useCurves((s) => s.view) === 'curves' ? <CurveScene /> : <ChartsScene />;
}

export function CurvesPanel() {
  const { view, set } = useCurves();
  const t = useTr();
  return (
    <div>
      <div data-tour="views"><Seg label={t('View', 'Vista')} value={view} items={VIEWS.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ view: v, playing: false })} /></div>
      {view === 'curves' ? <CurvesView /> : <ChartsView />}
    </div>
  );
}

function CurvesView() {
  const { preset, a, b, u, playing, set } = useCurves();
  const t = useTr();
  const def = CURVES[preset];
  const tt = def.range[0] + u * (def.range[1] - def.range[0]);
  const f = frenet(def.jet(tt, a, b));
  const s = arcLength(def, a, b, tt, 200);
  const hasA = preset === 'circle' || preset === 'helix' || preset === 'ellipse';
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div>
      <Seg label={t('Curve', 'Curva')} value={preset} cols={2} items={PRESETS.map((id) => [id, t(CURVES[id].en, CURVES[id].es)] as const)} onPick={(id) => set({ preset: id, u: 0.25, playing: false })} />
      {hasA && <label className="field"><span>{preset === 'ellipse' ? t('semi-axis a', 'semieje a') : t('radius a', 'radio a')} = {fmt(a, 2)}</span>
        <input type="range" min={0.3} max={2.5} step={0.05} value={a} aria-label={t('radius a', 'radio a')} onChange={(e) => set({ a: +e.target.value })} /></label>}
      {preset === 'helix' && <label className="field"><span>{t('pitch b', 'paso b')} = {fmt(b, 2)}</span>
        <input type="range" min={0} max={2} step={0.05} value={b} aria-label={t('pitch b', 'paso b')} onChange={(e) => set({ b: +e.target.value })} /></label>}
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button onClick={() => set({ playing: !playing, ...(!playing && !def.closed && u >= 1 ? { u: 0 } : {}) })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => set({ playing: false, u: 0 })}>{t('Reset', 'Reiniciar')}</button>
      </div>
      <label className="field"><span>{t('parameter t', 'parámetro t')} = {fmt(tt, 2)}</span>
        <input type="range" min={0} max={1} step={0.001} value={u} aria-label={t('Scrub parameter t', 'Desplazar el parámetro t')} onChange={(e) => set({ playing: false, u: +e.target.value })} /></label>
      {reduce && <Note>{t('Reduced motion is on: use the slider to move the point.', 'Movimiento reducido activado: usa el deslizador para mover el punto.')}</Note>}

      <div className="readout" aria-label={t('Curve readouts', 'Lecturas de la curva')}>
        <span>{t('arc length', 'longitud de arco')} s</span><span>{fmt(s, 3)}</span>
        <span>{t('speed', 'rapidez')} |r′|</span><span>{fmt(f.speed, 3)}</span>
        <span>κ</span><span>{fmt(f.kappa, 4)}</span>
        <span>{t('radius', 'radio')} 1/κ</span><span>{f.defined ? fmt(1 / f.kappa, 3) : '∞'}</span>
        <span>τ</span><span>{f.defined ? fmt(f.tau, 4) : t('undefined', 'indefinida')}</span>
      </div>
      {!f.defined && <Note><span style={{ color: PAL.warn }}>{t('κ ≈ 0 here (straight bit or inflection): the principal normal N, the binormal B, the osculating circle and τ are undefined, so only T is drawn.', 'κ ≈ 0 aquí (tramo recto o inflexión): la normal principal N, la binormal B, el círculo osculador y τ no están definidos, así que solo se dibuja T.')}</span></Note>}
      {preset === 'helix' && <Note><T en={<>Helix check: κ = a/(a²+b²) = {fmt(a / (a * a + b * b), 4)}, τ = b/(a²+b²) = {fmt(b / (a * a + b * b), 4)}, for every t. Constant curvature and torsion characterise the helices.</>} es={<>Comprobación de la hélice: κ = a/(a²+b²) = {fmt(a / (a * a + b * b), 4)}, τ = b/(a²+b²) = {fmt(b / (a * a + b * b), 4)}, para todo t. Curvatura y torsión constantes caracterizan a las hélices.</>} /></Note>}
      {def.planar && <Note>{t('Planar curve: B is constant (the plane normal), so τ = 0.', 'Curva plana: B es constante (la normal del plano), así que τ = 0.')}</Note>}

      <h2>{t('Frenet–Serret frame', 'Triedro de Frenet–Serret')}</h2>
      <Note><span style={{ color: PAL.du }}>T</span> {t('tangent', 'tangente')}, <span style={{ color: PAL.dv }}>N</span> {t('normal', 'normal')}, <span style={{ color: PAL.V }}>B</span> {t('binormal', 'binormal')}, <span style={{ color: PAL.metric }}>{t('osculating circle (dashed)', 'círculo osculador (discontinuo)')}</span></Note>
      <Tex block>{'\\frac{d}{ds}\\begin{pmatrix}T\\\\N\\\\B\\end{pmatrix}=\\begin{pmatrix}0&\\kappa&0\\\\-\\kappa&0&\\tau\\\\0&-\\tau&0\\end{pmatrix}\\begin{pmatrix}T\\\\N\\\\B\\end{pmatrix}'}</Tex>
      <Tex block>{'\\kappa=\\frac{|r\'\\times r\'\'|}{|r\'|^{3}},\\qquad \\tau=\\frac{(r\'\\times r\'\')\\cdot r\'\'\'}{|r\'\\times r\'\'|^{2}}'}</Tex>
    </div>
  );
}

const W = 150;
const Svg = ({ w, h, label, children }: { w: number; h: number; label: string; children: React.ReactNode }) => (
  <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w * 1.4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}>{children}</svg>
);

function ChartsView() {
  const { th, ph, set } = useCurves();
  const t = useTr();
  const stOk = th > 1e-3;
  const [x, y] = stOk ? toStereo(th, ph) : [Infinity, Infinity];
  const J = jacobian(th, ph), G = gSph(th), P = pullbackStereo(th, ph);
  const lam = lambdaStereo(x, y);
  const nearPole = th < 0.05 || th > Math.PI - 0.05;
  const L = 3, sx = (v: number) => ((v + L) / (2 * L)) * W, inside = stOk && Math.abs(x) < L && Math.abs(y) < L;
  const ex = stOk ? Math.max(-L, Math.min(L, x)) : 0, ey = stOk ? Math.max(-L, Math.min(L, y)) : 0;
  const hh = W * 0.6;
  const dev = Math.max(...[0, 1].flatMap((i) => [0, 1].map((j) => Math.abs(P[i][j] - G[i][j]))));
  return (
    <div>
      <label className="field"><span>θ = {fmt(th, 2)} ({fmt((th * 180) / Math.PI, 0)}°)</span>
        <input type="range" min={0} max={Math.PI} step={0.01} value={th} aria-label="θ" onChange={(e) => set({ th: +e.target.value })} /></label>
      <label className="field"><span>φ = {fmt(ph, 2)} ({fmt((ph * 180) / Math.PI, 0)}°)</span>
        <input type="range" min={0} max={2 * Math.PI} step={0.01} value={ph} aria-label="φ" onChange={(e) => set({ ph: +e.target.value })} /></label>
      <Note>{t('You can also click the sphere to place the point.', 'También puedes hacer clic en la esfera para colocar el punto.')}</Note>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'end' }}>
        <div>
          <Svg w={W} h={hh} label={t('Spherical chart domain, φ horizontal and θ vertical', 'Dominio de la carta esférica, φ horizontal y θ vertical')}>
            {[1, 2, 3, 4, 5].map((i) => <line key={`a${i}`} x1={0} x2={W} y1={(hh * i) / 6} y2={(hh * i) / 6} stroke={GRID_SPH} strokeOpacity={0.6} />)}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => <line key={`b${i}`} y1={0} y2={hh} x1={(W * i) / 12} x2={(W * i) / 12} stroke={GRID_SPH} strokeOpacity={0.6} />)}
            <line x1={0} x2={W} y1={1} y2={1} stroke={PAL.warn} strokeWidth={2} /><line x1={0} x2={W} y1={hh - 1} y2={hh - 1} stroke={PAL.warn} strokeWidth={2} />
            <circle cx={(ph / (2 * Math.PI)) * W} cy={(th / Math.PI) * hh} r={4} fill={PAL.p} stroke="#000" />
          </Svg>
          <Note><span style={{ color: GRID_SPH }}>(θ, φ)</span> — <span style={{ color: PAL.warn }}>{t('poles: whole edges collapse to a point', 'polos: bordes enteros colapsan a un punto')}</span></Note>
        </div>
        <div>
          <Svg w={W} h={W} label={t('Stereographic chart domain, plane (x, y)', 'Dominio de la carta estereográfica, plano (x, y)')}>
            {[-3, -2, -1, 0, 1, 2, 3].map((c) => <g key={c}><line x1={sx(c)} x2={sx(c)} y1={0} y2={W} stroke={GRID_ST} strokeOpacity={0.6} /><line y1={sx(c)} y2={sx(c)} x1={0} x2={W} stroke={GRID_ST} strokeOpacity={0.6} /></g>)}
            <circle cx={sx(ex)} cy={sx(-ey)} r={4} fill={inside ? PAL.p : 'none'} stroke={inside ? '#000' : PAL.warn} strokeWidth={inside ? 1 : 2} />
          </Svg>
          <Note><span style={{ color: GRID_ST }}>(x, y)</span> — {inside ? t('whole plane; north pole = ∞', 'todo el plano; polo norte = ∞') : <span style={{ color: PAL.warn }}>{t('point is off this view (or at ∞)', 'el punto queda fuera (o en ∞)')}</span>}</Note>
        </div>
      </div>

      <div className="readout" aria-label={t('Coordinates in both charts', 'Coordenadas en ambas cartas')}>
        <span>(θ, φ)</span><span>({fmt(th, 3)}, {fmt(ph, 3)})</span>
        <span>(x, y)</span><span>{stOk ? `(${fmt(x, 3)}, ${fmt(y, 3)})` : t('∞ (north pole)', '∞ (polo norte)')}</span>
        <span>g<sub>θθ</sub>, g<sub>φφ</sub></span><span>{fmt(G[0][0], 3)}, {fmt(G[1][1], 3)}</span>
        <span>{t('conformal factor', 'factor conforme')} 4/(1+r²)²</span><span>{stOk ? fmt(lam, 4) : '0'}</span>
        <span>det J</span><span>{stOk ? fmt(detJ(th), 3) : '∞'}</span>
        {stOk && <><span>J = ∂(x,y)/∂(θ,φ)</span><span>[{fmt(J[0][0], 2)} {fmt(J[0][1], 2)}; {fmt(J[1][0], 2)} {fmt(J[1][1], 2)}]</span></>}
        {stOk && <><span>Jᵀ g′ J</span><span>diag({fmt(P[0][0], 3)}, {fmt(P[1][1], 3)})</span></>}
        {stOk && <><span>{t('max |Jᵀg′J − g|', 'máx |Jᵀg′J − g|')}</span><span>{fmtSci(dev, 1)}</span></>}
      </div>
      {nearPole && <Note><span style={{ color: PAL.warn }}>{th < 0.05 ? t('Near the north pole: the spherical chart has g_φφ = sin²θ → 0 (φ undefined) and the stereographic chart sends the point to infinity.', 'Cerca del polo norte: la carta esférica tiene g_φφ = sin²θ → 0 (φ indefinido) y la estereográfica envía el punto al infinito.') : t('Near the south pole: the spherical chart fails (g_φφ = sin²θ → 0, φ undefined), but the stereographic chart is fine: (x, y) ≈ (0, 0).', 'Cerca del polo sur: la carta esférica falla (g_φφ = sin²θ → 0, φ indefinido), pero la estereográfica va bien: (x, y) ≈ (0, 0).')}</span></Note>}

      <h2>{t('Transition map', 'Función de transición')}</h2>
      <Tex block>{'(x,y)=\\Big(\\cot\\tfrac{\\theta}{2}\\cos\\varphi,\\ \\cot\\tfrac{\\theta}{2}\\sin\\varphi\\Big),\\qquad \\det J=-\\frac{\\cot(\\theta/2)}{2\\sin^2(\\theta/2)}'}</Tex>
      <Tex block>{'g_{\\text{sph}}=d\\theta^2+\\sin^2\\theta\\,d\\varphi^2,\\qquad g_{\\text{st}}=\\frac{4}{(1+x^2+y^2)^2}\\,(dx^2+dy^2)'}</Tex>
      <Tex block>{'g_{\\text{sph}}=J^{T} g_{\\text{st}}\\,J'}</Tex>
      <Note>{t('Each chart fails somewhere, but together they cover the sphere and the transition map is smooth on the overlap. That is a manifold: patches glued by smooth maps.', 'Cada carta falla en algún sitio, pero juntas cubren la esfera y la función de transición es suave en el solape. Eso es una variedad: parches pegados por funciones suaves.')}</Note>
    </div>
  );
}
