import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Seg, Note } from '../../panels/SpacetimeUi';
import { Tex, fmt } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { Label } from '../../scene/Label';
import { PAL } from '../../theme/palette';
import { GW150914_GWTC1 } from '../../data/gw150914';
import { usePenrose } from './state';
import { flammZ, kn, knIdentityResidual, mergerMaxRadiated, mergerMinFinalMass, qMax } from './math';

const MODES = [['kn', 'Kerr–Newman', 'Kerr–Newman'], ['slice', 'Time-symmetric slice', 'Corte simétrico en el tiempo']] as const;
const M_W = 0.5; // world-unit mass: the 2m sphere has radius 1

export function Scene() {
  return usePenrose((s) => s.mode) === 'kn' ? <KNScene /> : <SliceScene />;
}

function KNScene() {
  const { a, Q } = usePenrose();
  const k = kn(1, a, Q);
  const R = k.rA / 2; // R_A/(2m): the 2m sphere has radius 1
  return (
    <group>
      <mesh>
        <sphereGeometry args={[R, 48, 32]} />
        <meshStandardMaterial color={PAL.path} transparent opacity={0.45} roughness={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={PAL.ghost} wireframe transparent opacity={0.55} />
      </mesh>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />
      <Label text="2m" position={[1.15, 0.15, 0]} color={PAL.ghost} />
      <Label text="√(A/4π)" position={[0, R + 0.12, 0]} color={PAL.path} />
    </group>
  );
}

function SliceScene() {
  const t = useTr();
  const m = M_W, rMax = 2.2;
  const { meridians, rings } = useMemo(() => {
    const mer: [number, number, number][][] = [];
    for (let i = 0; i < 16; i++) {
      const p = (i / 16) * 2 * Math.PI;
      for (const sg of [1, -1]) {
        const pts: [number, number, number][] = [];
        for (let j = 0; j <= 40; j++) {
          const r = 2 * m + ((rMax - 2 * m) * j * j) / 1600;
          pts.push([r * Math.cos(p), sg * flammZ(m, r), r * Math.sin(p)]);
        }
        mer.push(pts);
      }
    }
    const ring = (r: number, y: number) =>
      Array.from({ length: 65 }, (_, i): [number, number, number] => [r * Math.cos((i / 64) * 2 * Math.PI), y, r * Math.sin((i / 64) * 2 * Math.PI)]);
    const rs: [number, number, number][][] = [];
    for (const r of [1.25, 1.5, 1.8, 2.2]) for (const sg of [1, -1]) rs.push(ring(r, sg * flammZ(m, r)));
    return { meridians: mer, rings: rs };
  }, [m]);
  return (
    <group>
      {meridians.map((p, i) => <Line key={`m${i}`} points={p} color={PAL.ghost} lineWidth={0.6} transparent opacity={0.45} />)}
      {rings.map((p, i) => <Line key={`r${i}`} points={p} color={PAL.ghost} lineWidth={0.6} transparent opacity={0.45} />)}
      <Line points={Array.from({ length: 65 }, (_, i): [number, number, number] => [Math.cos((i / 64) * 2 * Math.PI), 0, Math.sin((i / 64) * 2 * Math.PI)])} color={PAL.path} lineWidth={3} />
      <Label text={t('r = 2m: horizon (outermost minimal surface)', 'r = 2m: horizonte (superficie mínima más externa)')} position={[0, 0.2, 0]} color={PAL.path} height={0.1} />
    </group>
  );
}

/** Quarter disc a² + Q² ≤ 1, shaded by √(A/16π)/m (darker = smaller ratio); click sets the point. */
function Disc() {
  const { a, Q, set } = usePenrose();
  const t = useTr();
  const N = 24, S = 150, pad = 18, L = S - pad - 4, cell = L / N;
  const cells = useMemo(() => {
    const out: { x: number; y: number; o: number }[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const A = (i + 0.5) / N, q = (j + 0.5) / N;
      if (A * A + q * q > 1) continue;
      out.push({ x: i, y: j, o: 0.1 + 0.9 * (kn(1, A, q).ratio - 0.5) / 0.5 });
    }
    return out;
  }, []);
  const px = (v: number) => pad + v * L, py = (v: number) => S - pad - v * L;
  const arc = Array.from({ length: 41 }, (_, i) => `${px(Math.cos((i / 40) * Math.PI / 2))},${py(Math.sin((i / 40) * Math.PI / 2))}`).join(' ');
  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 220 }} role="img"
      aria-label={t('Sub-extremal region in the (a, Q) plane shaded by the ratio sqrt(A/16π) over m', 'Región subextremal en el plano (a, Q) sombreada por el cociente sqrt(A/16π) entre m')}
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        const A = ((e.clientX - b.left) / b.width * S - pad) / L, q = ((S - (e.clientY - b.top) / b.height * S) - pad) / L;
        if (A >= 0 && q >= 0) set({ a: Math.min(1, A), Q: q });
      }}>
      {cells.map((c) => <rect key={`${c.x}-${c.y}`} x={px(c.x / N)} y={py((c.y + 1) / N)} width={cell + 0.4} height={cell + 0.4} fill={PAL.path} opacity={c.o} />)}
      <polyline points={arc} fill="none" stroke="var(--muted)" strokeWidth={1} />
      <line x1={pad} y1={S - pad} x2={pad + L} y2={S - pad} stroke="var(--muted)" />
      <line x1={pad} y1={S - pad} x2={pad} y2={S - pad - L} stroke="var(--muted)" />
      <circle cx={px(a)} cy={py(Q)} r={4} fill={PAL.p} stroke="#000" strokeWidth={1} />
      <text x={pad + L} y={S - 5} fontSize={9} textAnchor="end" fill="var(--muted)">a/m</text>
      <text x={3} y={pad - 6} fontSize={9} fill="var(--muted)">Q/m</text>
    </svg>
  );
}

export function Panel() {
  const { mode, m1, m2, set } = usePenrose();
  const t = useTr();
  return (
    <div>
      <Seg label={t('View', 'Vista')} value={mode} items={MODES.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ mode: v })} />
      <Tex block>{String.raw`m_{\mathrm{ADM}}\;\ge\;\sqrt{\frac{A}{16\pi}}`}</Tex>
      <Note>{t('G = c = 1. A is the area of the outermost horizon. Penrose (1973) proposed this as a test of cosmic censorship.', 'G = c = 1. A es el área del horizonte más externo. Penrose (1973) lo propuso como prueba de la censura cósmica.')}</Note>
      {mode === 'kn' ? <KNPanel /> : <SlicePanel />}
      <MergerSection m1={m1} m2={m2} set={set} />
      <h2>{t('Status', 'Estado')}</h2>
      <Note>{t('Riemannian (time-symmetric) case: proved by Huisken–Ilmanen (2001, connected horizon, inverse mean curvature flow) and Bray (2001, any number of horizon components, conformal flow). Equality only for the Schwarzschild slice. The general (non-time-symmetric) case is open.', 'Caso riemanniano (simétrico en el tiempo): demostrado por Huisken–Ilmanen (2001, horizonte conexo, flujo por curvatura media inversa) y Bray (2001, cualquier número de componentes del horizonte, flujo conforme). Igualdad solo para el corte de Schwarzschild. El caso general (no simétrico en el tiempo) está abierto.')}</Note>
      <Note>{t('Honest framing: checking the inequality on known exact solutions is not a proof. The content of the problem is the general statement, for all initial data, which this page does not touch.', 'Aviso honesto: comprobar la desigualdad en soluciones exactas conocidas no es una demostración. El contenido del problema es el enunciado general, para todos los datos iniciales, que esta página no toca.')}</Note>
    </div>
  );
}

function KNPanel() {
  const { a, Q, set } = usePenrose();
  const t = useTr();
  const k = kn(1, a, Q);
  const res = knIdentityResidual(1, a, Q);
  return (
    <div>
      <label className="field"><span>a/m = {fmt(a, 3)}</span>
        <input type="range" min={0} max={1} step={0.005} value={a} aria-label={t('spin a over m', 'espín a entre m')} onChange={(e) => set({ a: +e.target.value })} /></label>
      <label className="field"><span>Q/m = {fmt(Q, 3)} ({t('max', 'máx')} {fmt(qMax(a), 3)})</span>
        <input type="range" min={0} max={1} step={0.005} value={Q} aria-label={t('charge Q over m', 'carga Q entre m')} onChange={(e) => set({ Q: Math.min(+e.target.value, qMax(a)) })} /></label>
      <Disc />
      <Note>{t('Allowed region a² + Q² ≤ m²; brighter = ratio closer to 1. Click to set the point.', 'Región permitida a² + Q² ≤ m²; más brillante = cociente más cercano a 1. Haz clic para fijar el punto.')}</Note>
      <div className="readout" aria-label={t('Kerr–Newman readouts (m = 1)', 'Lecturas de Kerr–Newman (m = 1)')}>
        <span>r₊ / m</span><span>{fmt(k.rPlus, 4)}</span>
        <span>A / (4π m²)</span><span>{fmt(k.area / (4 * Math.PI), 4)}</span>
        <span>√(A/16π) / m</span><span>{fmt(k.sqrtA16pi, 4)}</span>
        <span>{t('ratio to m', 'cociente con m')}</span><span>{fmt(k.ratio, 4)}</span>
        <span>(m − √(A/16π)) / m</span><span>{fmt(k.margin, 4)}</span>
        <span>{t('check', 'comprobación')} r₊²+a²−(2m r₊−Q²)</span><span>{res.toExponential(1)}</span>
      </div>
      <Tex block>{String.raw`A=4\pi\,(r_+^2+a^2),\quad r_+=m+\sqrt{m^2-a^2-Q^2}`}</Tex>
      <Tex block>{String.raw`r_+^2+a^2=2mr_+-Q^2`}</Tex>
      <Note>{t('Extremal Kerr (a = m): ratio 1/√2 ≈ 0.7071. Extremal Reissner–Nordström (Q = m): ratio 1/2. Equality only at a = Q = 0.', 'Kerr extremo (a = m): cociente 1/√2 ≈ 0,7071. Reissner–Nordström extremo (Q = m): cociente 1/2. Igualdad solo en a = Q = 0.')}</Note>
      <Note>{t('Scene: green sphere of radius √(A/4π); wire sphere of radius 2m (the Schwarzschild horizon of the same mass). Equality means they coincide.', 'Escena: esfera verde de radio √(A/4π); esfera de alambre de radio 2m (el horizonte de Schwarzschild de la misma masa). La igualdad significa que coinciden.')}</Note>
    </div>
  );
}

function SlicePanel() {
  const t = useTr();
  return (
    <div>
      <Tex block>{String.raw`z=\pm\sqrt{8m\,(r-2m)}`}</Tex>
      <Note>{t('Flamm paraboloid: the equatorial plane of the t = const slice of Schwarzschild, both sheets (two asymptotic regions). The highlighted circle r = 2m is the throat, the outermost minimal surface, with area 16π m². There √(A/16π) = m exactly: equality.', 'Paraboloide de Flamm: el plano ecuatorial del corte t = const de Schwarzschild, ambas hojas (dos regiones asintóticas). El círculo resaltado r = 2m es la garganta, la superficie mínima más externa, de área 16π m². Allí √(A/16π) = m exactamente: igualdad.')}</Note>
      <Note>{t('Only the Schwarzschild slice gives equality in the Riemannian case.', 'En el caso riemanniano solo el corte de Schwarzschild da igualdad.')}</Note>
    </div>
  );
}

function MergerSection({ m1, m2, set }: { m1: number; m2: number; set: (p: { m1?: number; m2?: number }) => void }) {
  const t = useTr();
  const mf = mergerMinFinalMass(m1, m2), E = mergerMaxRadiated(m1, m2);
  const g = GW150914_GWTC1;
  const gE = mergerMaxRadiated(g.m1.value, g.m2.value);
  return (
    <div>
      <h2>{t('Merger bound', 'Cota de fusión')}</h2>
      <Tex block>{String.raw`m_f\ge\sqrt{m_1^2+m_2^2}`}</Tex>
      <Tex block>{String.raw`E_{\mathrm{rad}}\le m_1+m_2-\sqrt{m_1^2+m_2^2}`}</Tex>
      <Note>{t("Hawking's area theorem (classical, null energy condition): horizon area never decreases, so A_f ≥ A₁ + A₂; with the Penrose inequality for the final state this gives the bound. It assumes non-spinning initial holes.", 'El teorema del área de Hawking (clásico, condición de energía nula): el área del horizonte nunca decrece, así que A_f ≥ A₁ + A₂; con la desigualdad de Penrose para el estado final se obtiene la cota. Supone agujeros iniciales sin espín.')}</Note>
      <label className="field"><span>m₁ = {fmt(m1, 1)}</span>
        <input type="range" min={1} max={100} step={0.5} value={m1} aria-label="m1" onChange={(e) => set({ m1: +e.target.value })} /></label>
      <label className="field"><span>m₂ = {fmt(m2, 1)}</span>
        <input type="range" min={1} max={100} step={0.5} value={m2} aria-label="m2" onChange={(e) => set({ m2: +e.target.value })} /></label>
      <div className="readout" aria-label={t('Merger bound readouts', 'Lecturas de la cota de fusión')}>
        <span>{t('min final mass', 'masa final mín.')} √(m₁²+m₂²)</span><span>{fmt(mf, 3)}</span>
        <span>E<sub>rad</sub> {t('max', 'máx')}</span><span>{fmt(E, 3)}</span>
        <span>E<sub>rad</sub> / (m₁+m₂)</span><span>{fmt(E / (m1 + m2), 4)}</span>
      </div>
      <Note><T en="Equal masses: E_rad/M ≤ 1 − 1/√2 ≈ 0.2929." es="Masas iguales: E_rad/M ≤ 1 − 1/√2 ≈ 0,2929." /></Note>
      <Note>{t(
        `GW150914 (GWTC-1 source-frame medians): m₁ = ${g.m1.value}, m₂ = ${g.m2.value} M☉ give a bound E_rad ≤ ${fmt(gE, 1)} M☉ c². Measured: ${g.energyRadiated.value} M☉ c². The bound is far above the measurement, and it assumes non-spinning holes, which these were not (the final spin is about 0.69), so read it as an order-of-magnitude comparison only.`,
        `GW150914 (medianas GWTC-1, sistema de la fuente): m₁ = ${g.m1.value}, m₂ = ${g.m2.value} M☉ dan una cota E_rad ≤ ${fmt(gE, 1)} M☉ c². Medido: ${g.energyRadiated.value} M☉ c². La cota queda muy por encima de la medida, y supone agujeros sin espín, que no era el caso (el espín final es de unos 0,69), así que léela solo como comparación de orden de magnitud.`)}</Note>
    </div>
  );
}
