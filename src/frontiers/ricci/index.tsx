import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { Seg, Note } from '../../panels/SpacetimeUi';
import { Tex, fmt } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { embed, frameAt, simulate, N, type Frame, type Kind, type Run } from './math';
import { useRicci } from './state';

const M = 40; // segments around the axis
const SIDE = 1.4;
const NEG = new THREE.Color(PAL.warn), MID = new THREE.Color('#d8dde8'), POS = new THREE.Color(PAL.dv);
const SPEED = 1 / 16; // fraction of the time axis per second at 1x

function useRuns() {
  const kind = useRicci((s) => s.kind), depth = useRicci((s) => s.depth);
  return useMemo(() => {
    const runs = [simulate(1, kind, depth), simulate(2, kind, depth)] as const;
    return { runs, tAll: Math.max(runs[0].tEnd, runs[1].tEnd) };
  }, [kind, depth]);
}

/** One surface of revolution, rebuilt in place when the displayed frame changes. */
function Body({ run, cx, tAll }: { run: Run; cx: number; tAll: number }) {
  const rescale = useRicci((s) => s.rescale);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * (M + 1) * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * (M + 1) * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j, b = a + M + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    g.setIndex(idx);
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const s0 = useMemo(() => fit(run.frames[0]), [run]);
  const shown = useRef<Frame | null>(null), shownScale = useRef(NaN);
  useFrame(() => {
    const f = frameAt(run, useRicci.getState().p * tAll);
    const sc = rescale ? fit(f) : s0;
    if (shown.current === f && shownScale.current === sc) return;
    shown.current = f; shownScale.current = sc;
    const { r, z } = embed(f);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute, col = geo.getAttribute('color') as THREE.BufferAttribute;
    const c = new THREE.Color(), nn = run.n;
    for (let i = 0; i < N; i++) {
      const v = Math.tanh((f.scalar[i] * f.psiMax ** 2) / (nn * (nn + 1))); // scale-free: the round sphere is one uniform colour
      c.copy(v < 0 ? NEG : POS).lerp(MID, 1 - Math.abs(v));
      for (let j = 0; j <= M; j++) {
        const a = (2 * Math.PI * j) / M, k = i * (M + 1) + j;
        pos.setXYZ(k, cx + r[i] * sc * Math.cos(a), z[i] * sc, r[i] * sc * Math.sin(a));
        col.setXYZ(k, c.r, c.g, c.b);
      }
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  });
  return <mesh geometry={geo} frustumCulled={false}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.55} metalness={0.05} /></mesh>;
}

/** Scale that keeps the shape (radius and half height) inside a unit box. */
function fit(f: Frame) {
  const { z } = embed(f);
  return 1 / Math.max(f.psiMax, z[N - 1], 1e-6);
}

export function Scene() {
  const { camera, controls, size } = useThree();
  const { runs, tAll } = useRuns();
  const aspect = size.width / Math.max(1, size.height);
  const z = Math.max(3.4, 6 / aspect) / (2 * Math.tan(Math.PI / 8));
  useEffect(() => {
    const c = controls as unknown as { target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    camera.position.set(0, 0.2, z);
    camera.lookAt(0, 0, 0);
    if (c) { c.target.set(0, 0, 0); c.update(); }
    return () => {
      camera.position.set(3, 2.5, 3);
      if (c) { c.target.set(0, 0, 0); c.update(); }
    };
  }, [camera, controls, z]);
  const tr = useTr();
  useFrame((_, dt) => {
    const st = useRicci.getState();
    if (!st.playing) return;
    const p = st.p + Math.min(dt, 0.1) * SPEED * st.speed;
    st.set(p >= 1 ? { p: 1, playing: false } : { p });
  });
  return (
    <group>
      <Body run={runs[0]} cx={-SIDE} tAll={tAll} />
      <Body run={runs[1]} cx={SIDE} tAll={tAll} />
      <Label text={tr('2D: surface', '2D: superficie')} position={[-SIDE, 1.3, 0]} height={0.14} />
      <Label text={tr('3D: each circle stands for a 2-sphere', '3D: cada círculo representa una 2-esfera')} position={[SIDE, 1.3, 0]} height={0.14} />
    </group>
  );
}

const KINDS: readonly (readonly [Kind, string, string])[] = [['round', 'Round', 'Redonda'], ['peanut', 'Mild peanut', 'Cacahuete suave'], ['dumbbell', 'Deep dumbbell', 'Mancuerna profunda']];

function Readouts({ runs, tAll, kind }: { runs: readonly [Run, Run]; tAll: number; kind: Kind }) {
  const t = useTr();
  const p = useRicci((s) => s.p);
  return (
    <>
      {runs.map((run) => {
        const f = frameAt(run, p * tAll);
        const n = run.n, end = f === run.frames[run.frames.length - 1] && p * tAll >= run.tEnd;
        const exact = 1 - 2 * n * f.t;
        return (
          <div key={n}>
            <h2>{n === 1 ? t('2D surface (n = 1)', 'Superficie 2D (n = 1)') : t('3D sphere (n = 2)', 'Esfera 3D (n = 2)')}</h2>
            <div className="readout" aria-label={t(`Readouts for n = ${n}`, `Lecturas para n = ${n}`)}>
              <span>t</span><span>{fmt(f.t, 4)}</span>
              <span>{t('neck', 'cuello')} ψ<sub>min</sub></span><span>{f.neck === null ? t('none (no neck)', 'ninguno (sin cuello)') : fmt(f.neck, 4)}</span>
              <span>{t('max', 'máx')} |K|</span><span>{fmt(f.maxK, 3)}</span>
              {n === 1 && <><span>K<sub>max</sub>/K<sub>min</sub></span><span>{f.kMin > 1e-9 ? fmt(f.kMax / f.kMin, 3) : t('K ≤ 0 somewhere', 'K ≤ 0 en algún punto')}</span></>}
              {n === 1 && <><span>∫K dA / 4π</span><span>{fmt(f.gb / (4 * Math.PI), 4)} ({t('residual', 'residuo')} {fmt(f.gb / (4 * Math.PI) - 1, 4)})</span></>}
              <span>{n === 1 ? t('area', 'área') : t('volume', 'volumen')}</span><span>{fmt(f.size, 3)}</span>
              {kind === 'round' && <><span>r² {t('(measured)', '(medido)')}</span><span>{fmt(f.psiMax ** 2, 4)}</span>
                <span>r₀² − {2 * n}t</span><span>{fmt(exact, 4)} ({t('residual', 'residuo')} {fmt(f.psiMax ** 2 - exact, 5)})</span></>}
            </div>
            {end && run.status === 'singular' && <Note><span style={{ color: PAL.warn }}>{t('neckpinch: the flow becomes singular here; Perelman’s surgery cuts the neck and caps the two pieces.', 'estrangulamiento: el flujo se vuelve singular aquí; la cirugía de Perelman corta el cuello y tapa las dos piezas.')}</span></Note>}
            {end && run.status === 'extinct' && <Note>{t('The sphere has shrunk to (almost) a point, and it is round.', 'La esfera se ha encogido casi a un punto, y es redonda.')}</Note>}
          </div>
        );
      })}
    </>
  );
}

function Transport() {
  const t = useTr();
  const { playing, p, speed, set } = useRicci();
  return (
    <>
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button onClick={() => set({ playing: !playing, ...(!playing && p >= 1 ? { p: 0 } : {}) })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => set({ playing: false, p: 0 })}>{t('Reset', 'Reiniciar')}</button>
      </div>
      <label className="field"><span>{t('flow time', 'tiempo del flujo')} {fmt(p * 100, 0)} %</span>
        <input type="range" min={0} max={1} step={0.001} value={p} aria-label={t('Scrub flow time', 'Desplazar el tiempo del flujo')} onChange={(e) => set({ playing: false, p: +e.target.value })} /></label>
      <Seg label={t('Speed', 'Velocidad')} value={String(speed)} items={[['0.25', '¼×'], ['1', '1×'], ['3', '3×']] as const} onPick={(v) => set({ speed: +v })} />
    </>
  );
}

export function Panel() {
  const t = useTr();
  const { kind, depth, rescale, set } = useRicci();
  const { runs, tAll } = useRuns();
  const clamped = runs.some((r) => r.clamped);
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div>
      <p style={{ fontSize: 13 }}><T en={<>The same lumpy sphere, evolved by Ricci flow in two dimensions (left) and three (right). Both are rotationally symmetric, so the whole flow is one function of one variable. This is a numerical illustration of known results, not a proof.</>}
        es={<>La misma esfera abultada, evolucionada por el flujo de Ricci en dos dimensiones (izquierda) y en tres (derecha). Ambas tienen simetría de rotación, así que todo el flujo es una función de una variable. Es una ilustración numérica de resultados conocidos, no una demostración.</>} /></p>
      <Seg label={t('Profile', 'Perfil')} value={kind} cols={3} items={KINDS.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ kind: v, playing: false, p: 0 })} />
      {kind === 'dumbbell' && <label className="field"><span>{t('neck depth', 'profundidad del cuello')} = {fmt(depth, 2)}</span>
        <input type="range" min={0.6} max={0.95} step={0.05} value={depth} aria-label={t('Neck depth', 'Profundidad del cuello')} onChange={(e) => set({ depth: +e.target.value, playing: false, p: 0 })} /></label>}
      <Transport />
      <label className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <input type="checkbox" checked={rescale} onChange={(e) => set({ rescale: e.target.checked })} />
        <span>{t('rescale to fixed size', 'reescalar a tamaño fijo')}</span></label>
      {reduce && <Note>{t('Reduced motion is on: nothing plays by itself; use the slider.', 'Movimiento reducido activado: nada se reproduce solo; usa el deslizador.')}</Note>}
      <Note>{t('Colour: scalar curvature (blue positive, orange negative), scale-free so a round sphere is one uniform colour. The surface is drawn with radius ψ(s) and height ∫√(1 − ψ′²) ds; for the 3D side each circle is a 2-sphere.', 'Color: curvatura escalar (azul positiva, naranja negativa), sin escala, así que una esfera redonda es de un solo color. La superficie se dibuja con radio ψ(s) y altura ∫√(1 − ψ′²) ds; en el lado 3D cada círculo es una 2-esfera.')}</Note>
      {clamped && <Note><span style={{ color: PAL.warn }}>{t('Here |ψ′| > 1 somewhere, so the profile cannot be embedded isometrically; the slope is clamped to 1 and the drawn height is a little short (the numbers are not affected).', 'Aquí |ψ′| > 1 en algún punto, así que el perfil no se puede sumergir isométricamente; la pendiente se limita a 1 y la altura dibujada queda algo corta (los números no cambian).')}</span></Note>}
      <Readouts runs={runs} tAll={tAll} kind={kind} />

      <h2>{t('Equations', 'Ecuaciones')}</h2>
      <Tex block>{String.raw`\partial_t g = -2\,\mathrm{Ric}`}</Tex>
      <Note>{t('On S^{n+1} take g = ds² + ψ(s)² g_{S^n}, with ds = φ(x) dx on a fixed coordinate x. Then (Angenent–Knopf 2004):', 'En S^{n+1} toma g = ds² + ψ(s)² g_{S^n}, con ds = φ(x) dx en una coordenada fija x. Entonces (Angenent–Knopf 2004):')}</Note>
      <Tex block>{String.raw`\partial_t\varphi = n\,\frac{\psi_{ss}}{\psi}\,\varphi,\qquad \partial_t\psi = \psi_{ss}-(n-1)\frac{1-\psi_s^2}{\psi}`}</Tex>
      <Tex block>{String.raw`K_{\mathrm{rad}}=-\frac{\psi_{ss}}{\psi},\quad K_{\mathrm{tan}}=\frac{1-\psi_s^2}{\psi^2}`}</Tex>
      <Note>{t('Round sphere of radius r: ψ = r sin(s/r), Ric = (n/r²) g, so', 'Esfera redonda de radio r: ψ = r sin(s/r), Ric = (n/r²) g, así que')}</Note>
      <Tex block>{String.raw`r(t)^2 = r_0^2 - 2n\,t`}</Tex>

      <h2>{t('Why the two sides differ', 'Por qué difieren los dos lados')}</h2>
      <Note>{t('In 2D (n = 1) the term (n − 1)(1 − ψ′²)/ψ is absent and ∂ₜg = −2Kg is a pure heat-type flow of K. By Gauss–Bonnet ∫K dA = 4π never changes, so area shrinks at the fixed rate 8π and nothing can concentrate: Hamilton (1988) and Chow (1991) showed every metric on S² becomes round after normalising. In 3D (n = 2) that extra term, driven by the tangential curvature 1/ψ² of the small neck, is there, and Angenent–Knopf proved that a sufficiently pinched neck pinches off in finite time before the sphere shrinks away.', 'En 2D (n = 1) el término (n − 1)(1 − ψ′²)/ψ no aparece y ∂ₜg = −2Kg es un flujo tipo calor para K. Por Gauss–Bonnet ∫K dA = 4π nunca cambia, así que el área decrece a ritmo fijo 8π y nada puede concentrarse: Hamilton (1988) y Chow (1991) probaron que toda métrica en S² se vuelve redonda tras normalizar. En 3D (n = 2) ese término extra, impulsado por la curvatura tangencial 1/ψ² del cuello pequeño, sí existe, y Angenent–Knopf probaron que un cuello suficientemente estrecho se estrangula en tiempo finito antes de que la esfera se encoja del todo.')}</Note>
      <Note>{t('That pinch is why Hamilton’s programme needed surgery. Perelman (2002–03) showed how to control Ricci flow with surgery, which led to the proof of the Poincaré conjecture; the Clay Institute offered him its prize in 2010, which he declined. The numerics here stop at the pinch (ψ_min below 2 % of max ψ); they do not perform surgery.', 'Ese estrangulamiento es la razón por la que el programa de Hamilton necesitaba cirugía. Perelman (2002–03) mostró cómo controlar el flujo de Ricci con cirugía, lo que llevó a la demostración de la conjetura de Poincaré; el Instituto Clay le ofreció su premio en 2010 y él lo rechazó. La numérica de aquí se detiene en el estrangulamiento (ψ_min por debajo del 2 % de máx ψ); no hace cirugía.')}</Note>
      <Note>{t(`Numerics: explicit Euler on ${N} nodes in an arclength gauge; the three cells next to each pole are tied to ψ = s + b s³ (smoothness) to keep the 1/ψ terms stable. Colours follow the shape, so compare the neck readouts, not only the picture.`, `Numérica: Euler explícito con ${N} nodos en una gauge de longitud de arco; las tres celdas junto a cada polo se atan a ψ = s + b s³ (suavidad) para estabilizar los términos 1/ψ. Los colores siguen la forma, así que compara las lecturas del cuello, no solo la imagen.`)}</Note>
    </div>
  );
}
