import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import Arrow from '../../scene/Arrow';
import { Label } from '../../scene/Label';
import { Note, Seg, Transport } from '../../panels/SpacetimeUi';
import { Tex, fmt, fmtDeg } from '../../panels/Tex';
import { T, useTr } from '../../i18n';
import { PAL } from '../../theme/palette';
import { adj, axisAngle, circleLoop, concat, curvatureFD, DEFAULT_GAUGE, family, familyF, gaugeAt, gaugeField, gaugeF, holonomy, polyArea, qconj, qmul, qnorm, qsub, smallLoopF, transport, wilson, expSu2, type Field, type Q, type V3 } from './math';
import { useGauge } from './state';

const BASE: [number, number] = [0, 0];
const E: V3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const TRIAD = [PAL.du, PAL.dv, PAL.V];
const SP: [number, number] = [0.6, 0.4]; // point of the small-loop check
const EPS = 1e-2;

/** Everything the scene and panel show, derived from the sliders. */
function useModel() {
  const { B, lam, ra, rb, gauge } = useGauge();
  return useMemo(() => {
    const A0 = family(B, lam), A: Field = gauge ? gaugeField(A0, DEFAULT_GAUGE) : A0;
    const a = circleLoop(BASE, ra, -1), b = circleLoop(BASE, rb, 1);
    const ab = concat(a, b), ba = concat(b, a);
    const F0 = familyF(B, lam), F = gauge ? gaugeF(F0, DEFAULT_GAUGE) : F0;
    return { A0, A, a, b, ab, ba, F0, F, Uab: transport(A, ab), Uba: transport(A, ba), hab: holonomy(A, ab), hba: holonomy(A, ba), hab0: holonomy(A0, ab), hab1: holonomy(gaugeField(A0, DEFAULT_GAUGE), ab) };
  }, [B, lam, ra, rb, gauge]);
}

const pt = (p: [number, number], z = 0.005): [number, number, number] => [p[0], p[1], z];

function Triad({ U, at, scale = 0.35, ghost = false }: { U: Q; at: [number, number, number]; scale?: number; ghost?: boolean }) {
  return (
    <group>
      {E.map((e, i) => {
        const v = adj(U, e);
        return <Arrow key={i} origin={at} dir={[v[0] * scale, v[1] * scale, v[2] * scale]} color={ghost ? PAL.ghost : TRIAD[i]} opacity={ghost ? 0.45 : 1} radius={ghost ? 0.01 : 0.014} />;
      })}
    </group>
  );
}

export function Scene() {
  const m = useModel();
  const { ra, rb, order } = useGauge();
  const U = order === 'ab' ? m.Uab : m.Uba, path = order === 'ab' ? m.ab : m.ba;
  const [mover, setMover] = useState<{ pos: [number, number, number]; q: Q }>({ pos: [0, 0, 0.02], q: [1, 0, 0, 0] });
  const group = useRef<import('three').Group>(null);
  const drawn = useRef(''), cur = useRef(0), pub = useRef(0), last = useRef(0);
  useFrame((_, dt) => {
    const s = useGauge.getState();
    if (s.t !== pub.current) { cur.current = s.t; pub.current = s.t; }
    if (s.playing) {
      cur.current = Math.min(1, cur.current + Math.min(dt, 0.1) / 12);
      last.current += dt;
      if (last.current > 0.1 || cur.current >= 1) { last.current = 0; pub.current = cur.current; useGauge.setState({ t: cur.current, playing: cur.current < 1 }); }
    }
    const sig = `${cur.current}|${path.length}|${U[1][0]}|${U[U.length - 1][0]}`;
    if (sig === drawn.current) return;
    drawn.current = sig;
    const x = cur.current * (path.length - 1), i = Math.min(path.length - 2, Math.floor(x)), f = x - i;
    const q0 = U[i], q1 = U[i + 1], q = [0, 1, 2, 3].map((k) => (1 - f) * q0[k] + f * q1[k]) as Q, n = qnorm(q);
    setMover({ pos: pt([path[i][0] + f * (path[i + 1][0] - path[i][0]), path[i][1] + f * (path[i + 1][1] - path[i][1])], 0.02), q: q.map((c) => c / n) as Q });
  });
  const m2 = Math.max(ra, rb) + 0.9;
  const field = useMemo(() => {
    const out: ReactNode[] = [];
    for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
      const x = i * 0.6, y = j * 0.6, F = m.F(x, y), n = Math.hypot(F[0], F[1], F[2]), L = Math.min(0.4, 0.12 * n);
      if (L > 1e-3) out.push(<Arrow key={`${i},${j}`} origin={[x, y, 0]} dir={[F[0] / n * L, F[1] / n * L, F[2] / n * L]} color={PAL.metric} opacity={0.3} radius={0.01} />);
    }
    return out;
  }, [m]);
  return (
    <group ref={group} scale={0.6} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[8, 16, '#3a4260', '#262c42']} rotation={[Math.PI / 2, 0, 0]} />
      {field}
      <Line points={m.a.map((p) => pt(p))} color={PAL.path} lineWidth={2} />
      <Line points={m.b.map((p) => pt(p))} color={PAL.p} lineWidth={2} />
      <Label text="α" position={[-2 * ra - 0.15, 0, 0.15]} color={PAL.path} />
      <Label text="β" position={[2 * rb + 0.15, 0, 0.15]} color={PAL.p} />
      <Triad U={[1, 0, 0, 0]} at={[0, 0, 0.005]} scale={0.45} ghost />
      <Triad U={mover.q} at={mover.pos} />
      {([['αβ', -0.7, m.hab], ['βα', 0.7, m.hba]] as const).map(([name, x, h]) => (
        <group key={name}>
          <Triad U={[1, 0, 0, 0]} at={[x, -m2, 0]} ghost />
          <Triad U={h} at={[x, -m2, 0]} />
          <Label text={name} position={[x, -m2 - 0.15, 0.5]} />
        </group>
      ))}
    </group>
  );
}

const vec = (v: V3) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)}, ${fmt(v[2], 2)})`;

export function Panel() {
  const t = useTr();
  const s = useGauge();
  const m = useModel();
  const { B, lam } = s;
  const dAB = axisAngle(m.hab), dBA = axisAngle(m.hba);
  const comm = qnorm(qsub(m.hab, m.hba));
  const g0 = gaugeAt(DEFAULT_GAUGE, 0, 0);
  const conjRes = qnorm(qsub(m.hab1, qmul(qmul(g0, m.hab0), qconj(g0))));
  const Fs = m.F0(SP[0], SP[1]), Fsl = smallLoopF(m.A0, SP[0], SP[1], EPS);
  const Ffd = curvatureFD(m.A0, SP[0], SP[1]);
  const slRes = Math.hypot(Fsl[0] - Fs[0], Fsl[1] - Fs[1], Fsl[2] - Fs[2]);
  const fdRes = Math.hypot(Ffd[0] - Fs[0], Ffd[1] - Fs[1], Ffd[2] - Fs[2]);
  const stokes = qnorm(qsub(holonomy(m.A0, m.a), expSu2([0, 0, -B * polyArea(m.a)])));
  const setT = (p: { stPlaying?: boolean; stProgress?: number }) => s.set({ ...(p.stPlaying !== undefined ? { playing: p.stPlaying } : {}), ...(p.stProgress !== undefined ? { t: p.stProgress } : {}) });
  const slider = (label: string, aria: string, k: 'B' | 'lam' | 'ra' | 'rb', min: number, max: number, step: number) => (
    <label className="field"><span>{label} = {fmt(s[k], 2)}</span>
      <input type="range" min={min} max={max} step={step} value={s[k]} aria-label={aria} onChange={(e) => s.set({ [k]: +e.target.value, t: 0, playing: false })} /></label>
  );
  return (
    <div>
      <h2>{t('Non-abelian holonomy', 'Holonomía no abeliana')}</h2>
      <Note><T en="The Yang–Mills existence and mass gap problem (Clay Millennium Problem, Jaffe–Witten statement) asks to prove that for every compact simple gauge group G a non-trivial quantum Yang–Mills theory exists on R⁴ and has a mass gap Δ > 0. It is open, and it is quantum. This demo shows only the classical geometry that theory is built on (connections, parallel transport, curvature) and says nothing about the mass gap."
        es="El problema de existencia de Yang–Mills y del salto de masa (Problema del Milenio del Clay, enunciado de Jaffe–Witten) pide demostrar que, para todo grupo de gauge G compacto y simple, existe en R⁴ una teoría cuántica de Yang–Mills no trivial con salto de masa Δ > 0. Está abierto, y es cuántico. Esta demo solo muestra la geometría clásica sobre la que se construye (conexiones, transporte paralelo, curvatura) y no dice nada sobre el salto de masa." /></Note>
      {slider('B', t('Abelian field strength B', 'Intensidad abeliana B'), 'B', 0, 3, 0.05)}
      {slider('λ', t('Non-abelian part lambda', 'Parte no abeliana lambda'), 'lam', 0, 1.5, 0.05)}
      {slider(t('radius α', 'radio α'), t('Radius of loop alpha', 'Radio del lazo alfa'), 'ra', 0.3, 1.2, 0.05)}
      {slider(t('radius β', 'radio β'), t('Radius of loop beta', 'Radio del lazo beta'), 'rb', 0.3, 1.2, 0.05)}
      <Seg label={t('Order', 'Orden')} value={s.order} items={[['ab', t('α then β', 'α y luego β')], ['ba', t('β then α', 'β y luego α')]]} onPick={(v) => s.set({ order: v, t: 0, playing: false })} />
      <Seg label={t('Gauge', 'Gauge')} value={s.gauge ? 'on' : 'off'} items={[['off', t('Original A', 'A original')], ['on', t('Gauge-transformed A', 'A transformada')]]} onPick={(v) => s.set({ gauge: v === 'on' })} />
      <Transport playing={s.playing} progress={s.t} set={setT} label={t('progress', 'progreso')} />
      <Note>{t('Frame at the moving point = adjoint action of U(t) on e₁, e₂, e₃ (orange, blue, pink); grey = initial frame. In front: the frames left by αβ and βα. Faint arrows: curvature F_xy in su(2).', 'Triedro en el punto móvil = acción adjunta de U(t) sobre e₁, e₂, e₃ (naranja, azul, rosa); gris = triedro inicial. Delante: los triedros que dejan αβ y βα. Flechas tenues: curvatura F_xy en su(2).')}</Note>
      <Tex block>{String.raw`\frac{dU}{dt}=-A_\mu(x(t))\,\dot x^\mu\,U,\quad U(0)=1,\qquad \mathrm{Hol}=U(1)`}</Tex>
      <Tex block>{String.raw`F_{xy}=\partial_xA_y-\partial_yA_x+[A_x,A_y],\quad A_x=-\tfrac B2 yT_3+\lambda T_1,\ A_y=\tfrac B2 xT_3+\lambda T_2`}</Tex>
      <Tex block>{String.raw`F_{xy}=\tfrac{\lambda B}{2}\,y\,T_1-\tfrac{\lambda B}{2}\,x\,T_2+(B+\lambda^2)\,T_3,\qquad [T_1,T_2]=T_3`}</Tex>
      <Tex block>{String.raw`A\mapsto gAg^{-1}-(dg)g^{-1},\quad F\mapsto gFg^{-1},\quad \mathrm{Hol}_{x_0}\mapsto g(x_0)\,\mathrm{Hol}\,g(x_0)^{-1},\quad W=\tfrac12\operatorname{tr}\mathrm{Hol}`}</Tex>
      <div className="readout" aria-label={t('Holonomy readouts', 'Lecturas de holonomía')}>
        <span>Hol(αβ)</span><span>{fmtDeg(dAB.angle)} {t('about', 'en torno a')} {vec(dAB.axis)}</span>
        <span>Hol(βα)</span><span>{fmtDeg(dBA.angle)} {t('about', 'en torno a')} {vec(dBA.axis)}</span>
        <span>‖Hol(αβ) − Hol(βα)‖</span><span>{fmt(comm, 5)}{lam === 0 ? ` (${t('abelian: 0', 'abeliano: 0')})` : ''}</span>
        <span>W(αβ), W(βα)</span><span>{fmt(wilson(m.hab), 6)}, {fmt(wilson(m.hba), 6)} ({t('difference', 'diferencia')} {fmt(Math.abs(wilson(m.hab) - wilson(m.hba)), 6)})</span>
        <span>W(αβ) {t('before / after gauge', 'antes / después del gauge')}</span><span>{fmt(wilson(m.hab0), 9)} / {fmt(wilson(m.hab1), 9)} ({t('residual', 'residuo')} {fmt(Math.abs(wilson(m.hab0) - wilson(m.hab1)), 9)})</span>
        <span>‖Hol′ − g Hol g⁻¹‖</span><span>{fmt(conjRes, 9)}</span>
        <span>F_xy({SP[0]}, {SP[1]})</span><span>{vec(Fs)} ({t('finite-diff. residual', 'residuo dif. finitas')} {fmt(fdRes, 8)})</span>
        <span>‖(1 − Hol)/ε² − F‖</span><span>{fmt(slRes, 4)} (ε = {EPS})</span>
        {lam === 0 && <><span>‖Hol(α) − exp(−B·Area·T₃)‖</span><span>{fmt(stokes, 9)}</span></>}
      </div>
      <Note><T en="Hol(αβ) = Hol(β)Hol(α) and Hol(βα) = Hol(α)Hol(β) are different rotations, but tr(XY) = tr(YX), so the two Wilson loops agree exactly (the numbers above confirm it up to rounding). The Wilson loop sees only the conjugacy class, not the axis."
        es="Hol(αβ) = Hol(β)Hol(α) y Hol(βα) = Hol(α)Hol(β) son rotaciones distintas, pero tr(XY) = tr(YX), así que los dos lazos de Wilson coinciden exactamente (los números de arriba lo confirman salvo redondeo). El lazo de Wilson solo ve la clase de conjugación, no el eje." /></Note>
      <Tex block>{String.raw`S_{YM}=\tfrac12\int|F|^2\,d^2x,\qquad D{\star}F=0`}</Tex>
      <Note><T en="Fact: Levi-Civita transport on a surface has structure group SO(2), which is abelian, so the Parallel transport module's holonomy depends only on ∬K dA. Fact: the Yang–Mills equations D⋆F = 0 are the critical points of ½∫|F|². Fact: Wilson's lattice gauge theory is built from holonomies around small plaquettes."
        es="Hecho: el transporte de Levi-Civita en una superficie tiene grupo de estructura SO(2), que es abeliano, por eso la holonomía del módulo de transporte paralelo solo depende de ∬K dA. Hecho: las ecuaciones de Yang–Mills D⋆F = 0 son los puntos críticos de ½∫|F|². Hecho: la teoría de gauge en retículo de Wilson se construye con holonomías alrededor de pequeñas plaquetas." /></Note>
    </div>
  );
}
