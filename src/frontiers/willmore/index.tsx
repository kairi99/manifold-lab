import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Seg, Note } from '../../panels/SpacetimeUi';
import { Tex, fmt, fmtSci } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { useWillmore } from './state';
import { ellipsoidCurv, ellipsoidPt, ellipsoidUmbilics, torusData, torusWClosed, type Ax, type V3 } from './math';

const TWO_PI_SQ = 2 * Math.PI * Math.PI;

// Viridis stops: sequential and colour-blind safe.
const VIRIDIS = ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c', '#28ae80', '#5ec962', '#addc30', '#fde725'].map((h) => new THREE.Color(h));
function ramp(x: number, out: THREE.Color) {
  const t = Math.min(1, Math.max(0, x)) * (VIRIDIS.length - 1), i = Math.min(VIRIDIS.length - 2, Math.floor(t));
  return out.copy(VIRIDIS[i]).lerp(VIRIDIS[i + 1], t - i);
}

/** Periodic nu × nv grid → indexed mesh. */
function gridGeometry(nu: number, nv: number, pos: ArrayLike<number>, normal: ArrayLike<number>, val: ArrayLike<number>, vmax: number) {
  const g = new THREE.BufferGeometry(), col = new Float32Array(val.length * 3), c = new THREE.Color();
  for (let k = 0; k < val.length; k++) { ramp(vmax > 0 ? val[k] / vmax : 0, c); col.set([c.r, c.g, c.b], 3 * k); }
  const idx: number[] = [];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = i * nv + j, b = ((i + 1) % nu) * nv + j, d = i * nv + ((j + 1) % nv), e = ((i + 1) % nu) * nv + ((j + 1) % nv);
    idx.push(a, b, d, b, e, d);
  }
  g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(normal), 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
const useDispose = (o: { dispose: () => void }) => useEffect(() => () => o.dispose(), [o]);

function TorusScene() {
  const c = useWillmore((s) => s.c), inv = useWillmore((s) => s.inv);
  const geo = useMemo(() => {
    const d = torusData(c, inv);
    return gridGeometry(d.nu, d.nv, d.pos, d.normal, d.H2, Math.max(...d.H2));
  }, [c, inv]);
  useDispose(geo);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.55} metalness={0.05} /></mesh>;
}

function EllipsoidScene() {
  const ax = useWillmore((s) => s.ax);
  const { geo, ticks, umb } = useMemo(() => {
    const A = ax as Ax, nth = 49, nph = 96;
    const pos: number[] = [], nor: number[] = [], val: number[] = [], idx: number[] = [];
    for (let i = 0; i < nth; i++) for (let j = 0; j < nph; j++) {
      const p = ellipsoidPt(A, 1e-3 + ((Math.PI - 2e-3) * i) / (nth - 1), (2 * Math.PI * j) / nph), k = ellipsoidCurv(A, p);
      pos.push(...p); nor.push(...k.normal); val.push(k.diff);
    }
    for (let i = 0; i < nth - 1; i++) for (let j = 0; j < nph; j++) {
      const a = i * nph + j, b = (i + 1) * nph + j, d = i * nph + ((j + 1) % nph), e = (i + 1) * nph + ((j + 1) % nph);
      idx.push(a, b, d, b, e, d);
    }
    const vmax = Math.max(...val);
    const g = gridGeometry(nth, nph, pos, nor, val, vmax > 1e-6 ? vmax : 0);
    g.setIndex(idx); // no wrap in θ
    // principal-direction line field (max curvature), short segments centred on grid points
    const L = 0.05 * (A[0] + A[1] + A[2]) / 3, seg: number[] = [];
    for (let i = 1; i < 24; i++) for (let j = 0; j < 48; j++) {
      const p = ellipsoidPt(A, (Math.PI * i) / 24, (2 * Math.PI * (j + 0.5 * (i % 2))) / 48), k = ellipsoidCurv(A, p);
      if (k.diff < 1e-9) continue;
      const q = p.map((x, m) => x + 0.015 * k.normal[m]) as V3;
      seg.push(...q.map((x, m) => x - L * k.dir[m]), ...q.map((x, m) => x + L * k.dir[m]));
    }
    const t = new THREE.BufferGeometry();
    t.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    return { geo: g, ticks: t, umb: ellipsoidUmbilics(A) };
  }, [ax]);
  useDispose(geo); useDispose(ticks);
  const rad = 0.035 * (ax[0] + ax[1] + ax[2]) / 3;
  return (
    <group>
      <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} /></mesh>
      <lineSegments geometry={ticks}><lineBasicMaterial color="#ffffff" /></lineSegments>
      {umb.map((p, i) => (
        <group key={i}>
          <mesh position={p}><sphereGeometry args={[rad, 16, 12]} /><meshBasicMaterial color={PAL.p} /></mesh>
          <Label text={`U_${i + 1}`} position={[p[0] * 1.12, p[1] + 0.12, p[2] * 1.12]} color={PAL.p} />
        </group>
      ))}
    </group>
  );
}

export function Scene() {
  const mode = useWillmore((s) => s.mode);
  return mode === 'energy' ? <TorusScene /> : <EllipsoidScene />;
}

// ---------------------------------------------------------------- panel

function WPlot({ c }: { c: number }) {
  const t = useTr();
  const w = 280, h = 130, x0 = 34, x1 = w - 8, y0 = 8, y1 = h - 22, lo = 15, hi = 45;
  const X = (cc: number) => x0 + ((cc - 1.05) / (4 - 1.05)) * (x1 - x0), Y = (ww: number) => y1 - ((ww - lo) / (hi - lo)) * (y1 - y0);
  const path = Array.from({ length: 80 }, (_, i) => { const cc = 1.05 + (2.95 * i) / 79; return `${i ? 'L' : 'M'}${X(cc).toFixed(1)},${Y(torusWClosed(cc)).toFixed(1)}`; }).join('');
  return (
    <svg role="img" aria-label={t('Plot of W against c with the line 2π², minimum at c = √2', 'Gráfica de W frente a c con la recta 2π², mínimo en c = √2')}
      viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w * 1.4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6 }}>
      <line x1={x0} x2={x1} y1={Y(TWO_PI_SQ)} y2={Y(TWO_PI_SQ)} stroke={PAL.warn} strokeDasharray="4 3" />
      <text x={x1} y={Y(TWO_PI_SQ) - 3} fontSize={9} textAnchor="end" fill={PAL.warn}>2π²</text>
      <path d={path} fill="none" stroke={PAL.dv} strokeWidth={2} />
      <line x1={X(c)} x2={X(c)} y1={y0} y2={y1} stroke="var(--muted)" strokeDasharray="2 3" />
      <circle cx={X(c)} cy={Y(torusWClosed(c))} r={4} fill={PAL.p} stroke="var(--fg)" />
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke="var(--muted)" />
      <line x1={x0} x2={x0} y1={y0} y2={y1} stroke="var(--muted)" />
      {[1, 2, 3, 4].map((v) => <text key={v} x={X(v < 1.05 ? 1.05 : v)} y={y1 + 11} fontSize={9} textAnchor="middle" fill="var(--muted)">{v}</text>)}
      {[20, 30, 40].map((v) => <text key={v} x={x0 - 4} y={Y(v) + 3} fontSize={9} textAnchor="end" fill="var(--muted)">{v}</text>)}
      <text x={(x0 + x1) / 2} y={h - 2} fontSize={9} textAnchor="middle" fill="var(--muted)">c = R/r</text>
    </svg>
  );
}

function EnergyPanel() {
  const t = useTr();
  const { c, inv, set } = useWillmore();
  const d = useMemo(() => torusData(c, inv), [c, inv]);
  const wc = torusWClosed(c);
  return (
    <div>
      <label className="field"><span>c = R/r = {fmt(c, 3)}</span>
        <input type="range" min={1.05} max={4} step={0.01} value={c} aria-label={t('Torus ratio c = R/r', 'Cociente del toro c = R/r')} onChange={(e) => set({ c: +e.target.value })} /></label>
      <button onClick={() => set({ c: Math.SQRT2 })} style={{ marginBottom: 12 }}>{t('Set c = √2', 'Poner c = √2')}</button>
      <label className="field"><span>{t('invert', 'invertir')} = {fmt(inv, 2)}</span>
        <input type="range" min={0} max={1} step={0.01} value={inv} aria-label={t('Inversion amount: moves the centre of inversion', 'Cantidad de inversión: mueve el centro de inversión')} onChange={(e) => set({ inv: +e.target.value })} /></label>
      <div className="readout" aria-label={t('Willmore readouts', 'Lecturas de Willmore')}>
        <span>c = R/r</span><span>{fmt(c, 3)}</span>
        <span>W {t('numeric', 'numérico')}</span><span>{fmt(d.W, 5)}</span>
        <span>W {t('closed form', 'forma cerrada')} π²c²/√(c²−1)</span><span>{fmt(wc, 5)}</span>
        <span>W / 2π²</span><span>{fmt(d.W / TWO_PI_SQ, 5)}</span>
        <span>{t('residual', 'residuo')} |W − W<sub>cf</sub>|/W<sub>cf</sub></span><span>{fmtSci(Math.abs(d.W - wc) / wc, 2)}</span>
        <span>∫K dA</span><span>{fmt(d.intK, 5)} ({t('expect', 'esperado')} 2πχ = 0)</span>
        <span>{t('residual', 'residuo')} |∫K dA|</span><span>{fmtSci(Math.abs(d.intK), 2)}</span>
        {c === Math.SQRT2 && <><span>W − 2π²</span><span>{fmtSci(d.W - TWO_PI_SQ, 2)}</span></>}
      </div>
      <Note>{inv > 0
        ? t('Inverted: the surface is now a Dupin cyclide, yet W is the same number (inversions in a sphere centred off the surface leave W unchanged). The closed form above is the torus value, which the cyclide shares.',
            'Invertido: la superficie es ahora una ciclida de Dupin y, sin embargo, W es el mismo número (las inversiones en una esfera con centro fuera de la superficie dejan W invariante). La forma cerrada de arriba es el valor del toro, que la ciclida comparte.')
        : t('Move the invert slider: the torus morphs into a cyclide and W does not change.', 'Mueve el deslizador de inversión: el toro se transforma en una ciclida y W no cambia.')}</Note>
      <WPlot c={c} />
      <Note>{t('Colour: H² (dark = low, yellow = high, scaled to the maximum on this surface). Plot: W(c) with the line 2π².', 'Color: H² (oscuro = bajo, amarillo = alto, escalado al máximo de esta superficie). Gráfica: W(c) con la recta 2π².')}</Note>
      <h2>{t('Equations', 'Ecuaciones')}</h2>
      <Tex block>{String.raw`W(\Sigma)=\int_\Sigma H^2\,dA,\qquad H=\tfrac{\kappa_1+\kappa_2}{2}`}</Tex>
      <Tex block>{String.raw`W_{\text{torus}}=\frac{\pi^2c^2}{\sqrt{c^2-1}},\quad c=\tfrac Rr,\qquad W(\sqrt2)=2\pi^2`}</Tex>
      <p style={{ fontSize: 13 }}><T
        en={<>Round sphere: <Tex>{String.raw`W=4\pi`}</Tex> for every radius. Willmore (1965): every closed surface in R³ has <Tex>{String.raw`W\ge4\pi`}</Tex>, with equality only for round spheres. Willmore conjecture: every torus immersed in R³ has <Tex>{String.raw`W\ge2\pi^2`}</Tex>; proved by Marques and Neves (Annals of Mathematics, 2014).</>}
        es={<>Esfera redonda: <Tex>{String.raw`W=4\pi`}</Tex> para todo radio. Willmore (1965): toda superficie cerrada en R³ cumple <Tex>{String.raw`W\ge4\pi`}</Tex>, con igualdad solo en esferas redondas. Conjetura de Willmore: todo toro inmerso en R³ cumple <Tex>{String.raw`W\ge2\pi^2`}</Tex>; demostrada por Marques y Neves (Annals of Mathematics, 2014).</>} /></p>
      <Note>{t('W (and ∫(H² − K) dA) is invariant under Möbius transformations. For a closed surface ∫K dA = 2πχ is fixed, so W itself is invariant.', 'W (y ∫(H² − K) dA) es invariante por transformaciones de Möbius. En una superficie cerrada ∫K dA = 2πχ es fijo, así que W es invariante.')}</Note>
      <Note>{t('Honest framing: this demo only checks the inequality on tori of revolution and their inversions. The theorem covers every immersed torus and is proved with min–max theory, not by numerics.',
        'Con honestidad: esta demo solo comprueba la desigualdad en toros de revolución y sus inversiones. El teorema cubre todo toro inmerso y se demuestra con teoría min–max, no con numérica.')}</Note>
    </div>
  );
}

function UmbilicPanel() {
  const t = useTr();
  const { ax, setAxis } = useWillmore();
  const A = ax as Ax, names = ['a', 'b', 'c'] as const;
  const umb = useMemo(() => ellipsoidUmbilics(A), [ax]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = umb.map((p) => { const k = ellipsoidCurv(A, p); return { p, d: k.diff, rel: k.diff / (k.k1 + k.k2) }; });
  const count = A[0] - A[2] < 1e-9 ? null : umb.length;
  return (
    <div>
      {([0, 1, 2] as const).map((k) => { const n = names[k]; return (
        <label className="field" key={n}><span>{t('semi-axis', 'semieje')} {n} = {fmt(ax[k], 2)}</span>
          <input type="range" min={0.3} max={2} step={0.05} value={ax[k]} aria-label={t(`Semi-axis ${n}`, `Semieje ${n}`)} onChange={(e) => setAxis(k, +e.target.value)} /></label>
      ); })}
      <Note>{t('The axes are kept ordered a ≥ b ≥ c: moving one pushes the others.', 'Los ejes se mantienen ordenados a ≥ b ≥ c: al mover uno se empujan los demás.')}</Note>
      <div className="readout" aria-label={t('Umbilic readouts', 'Lecturas de los ombligos')}>
        <span>{t('umbilic count', 'número de ombligos')}</span><span>{count === null ? t('all points (sphere)', 'todos los puntos (esfera)') : count}</span>
        {rows.map((r, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <span>U<sub>{i + 1}</sub> (x, y, z)</span><span>({fmt(r.p[0], 4)}, {fmt(r.p[1], 4)}, {fmt(r.p[2], 4)})</span>
            <span>κ₁ − κ₂ {t('at', 'en')} U<sub>{i + 1}</sub></span><span>{fmtSci(r.d, 2)} ({t('relative', 'relativo')} {fmtSci(r.rel, 2)})</span>
          </span>
        ))}
      </div>
      <Note>{t('Colour: κ₁ − κ₂ (dark = 0 = umbilic, yellow = largest). White ticks: the max-curvature direction on a grid; watch it swirl around the yellow-marked umbilics.', 'Color: κ₁ − κ₂ (oscuro = 0 = ombligo, amarillo = máximo). Marcas blancas: la dirección de máxima curvatura sobre una malla; mira cómo gira alrededor de los ombligos marcados en amarillo.')}</Note>
      <h2>{t('Equations', 'Ecuaciones')}</h2>
      <Tex block>{String.raw`\text{umbilic: }\kappa_1=\kappa_2\iff II=\lambda\,I`}</Tex>
      <Tex block>{String.raw`\Bigl(\pm a\sqrt{\tfrac{a^2-b^2}{a^2-c^2}},\;0,\;\pm c\sqrt{\tfrac{b^2-c^2}{a^2-c^2}}\Bigr),\quad a>b>c`}</Tex>
      <p style={{ fontSize: 13 }}>{t('A triaxial ellipsoid a > b > c has exactly 4 umbilics; a spheroid a = b > c (or a > b = c) has 2 (the poles); the round sphere is all umbilics.', 'Un elipsoide triaxial a > b > c tiene exactamente 4 ombligos; un esferoide a = b > c (o a > b = c) tiene 2 (los polos); la esfera redonda es todo ombligos.')}</p>
      <p style={{ fontSize: 13 }}>{t('Carathéodory conjecture: every smooth closed convex surface in R³ has at least 2 umbilics. Status: proved for real-analytic surfaces (Hamburger, 1940s, with later corrections); for smooth surfaces a proof has been claimed (Guilfoyle–Klingenberg) — see the problem card for its current status.',
        'Conjetura de Carathéodory: toda superficie cerrada convexa y suave en R³ tiene al menos 2 ombligos. Estado: demostrada para superficies analíticas reales (Hamburger, años 1940, con correcciones posteriores); para superficies suaves se ha afirmado una demostración (Guilfoyle–Klingenberg): consulta la ficha del problema para su estado actual.')}</p>
      <Note>{t('Honest framing: this demo only shows the ellipsoid, where the umbilics are known in closed form; it does not test the conjecture.', 'Con honestidad: esta demo solo muestra el elipsoide, donde los ombligos se conocen en forma cerrada; no pone a prueba la conjetura.')}</Note>
    </div>
  );
}

export function Panel() {
  const t = useTr();
  const { mode, set } = useWillmore();
  return (
    <div>
      <Seg label={t('Willmore view', 'Vista de Willmore')} value={mode}
        items={[['energy', t('Willmore energy', 'Energía de Willmore')], ['umbilics', t('Umbilics (Carathéodory)', 'Ombligos (Carathéodory)')]] as const}
        onPick={(m) => set({ mode: m })} />
      {mode === 'energy' ? <EnergyPanel /> : <UmbilicPanel />}
    </div>
  );
}
