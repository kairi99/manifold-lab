import { useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { MathText } from '../../panels/Tex';
import { Note } from '../../panels/SpacetimeUi';
import { useLang, useTr } from '../../i18n';
import { PAL } from '../../theme/palette';
import { useLimits } from '../state';
import { CARDS, KINDS, type StatusCard, type StatusKind, type StatusView } from './data';
import { Scene as RotationScene } from '../rotation';
import { Scene as TensionsScene } from '../tensions';
import { Scene as TestsScene } from '../tests';
import { Scene as QuantumScene } from '../quantum';

/** Which card is expanded; the Scene follows it. */
const useOpenCard = create<{ open: string | null; set: (id: string | null) => void }>((set) => ({ open: null, set: (open) => set({ open }) }));

const VIEWS: Record<StatusView, () => ReactNode> = { rotation: RotationScene, tensions: TensionsScene, tests: TestsScene, quantum: QuantumScene };
const VIEW_NAME: Record<StatusView, [string, string]> = {
  rotation: ['Rotation curves', 'Curvas de rotación'], tensions: ['Cosmic tensions', 'Tensiones cosmológicas'],
  tests: ['Precision tests', 'Pruebas de precisión'], quantum: ['Quantum limits', 'Límites cuánticos'],
};

const KIND: Record<StatusKind, { en: string; es: string; color: string; mark: string }> = {
  confirmed: { en: 'Confirmed', es: 'Confirmado', color: PAL.path, mark: '✓' },
  theory: { en: 'Open theory problem', es: 'Problema teórico abierto', color: PAL.metric, mark: '○' },
  tension: { en: 'Tension / unexplained', es: 'Tensión / sin explicar', color: PAL.warn, mark: '△' },
  debated: { en: 'Under debate', es: 'En debate', color: PAL.p, mark: '◐' },
  resolved: { en: 'Resolved anomaly', es: 'Anomalía resuelta', color: PAL.dv, mark: '●' },
};

export function Scene() {
  const open = useOpenCard((s) => s.open);
  const view = CARDS.find((c) => c.id === open)?.view;
  const View = view ? VIEWS[view] : null;
  return View ? <View /> : <LightCone />;
}

/** Calm decorative object: the light cone of an event as two wireframe cones. */
function LightCone() {
  const ref = useRef<Group>(null);
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useFrame((_, dt) => { if (!reduce && ref.current) ref.current.rotation.y += 0.15 * dt; });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.6, 0]}><coneGeometry args={[0.6, 1.2, 32, 6, true]} /><meshBasicMaterial color={PAL.path} wireframe /></mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.6, 1.2, 32, 6, true]} /><meshBasicMaterial color={PAL.dv} wireframe /></mesh>
    </group>
  );
}

const chip = (on: boolean) => ({ padding: '4px 10px', background: on ? 'var(--accent)' : 'var(--bg)', color: on ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontSize: 13 }) as const;

export function Panel() {
  const t = useTr();
  const [kind, setKind] = useState<StatusKind | 'all'>('all');
  const list = CARDS.filter((c) => kind === 'all' || c.kind === kind);
  const items: [StatusKind | 'all', string][] = [['all', t('All', 'Todos')], ...KINDS.map((k) => [k, t(KIND[k].en, KIND[k].es)] as [StatusKind, string])];
  return (
    <div>
      <h2>{t('Where general relativity stands', 'Dónde está la relatividad general')}</h2>
      <Note>{t('Statuses as of November 2026, checked against the sources on each card. Each card says whether a result is confirmed, an open theory problem, a statistical tension, a claim under debate or a resolved anomaly.', 'Estados a noviembre de 2026, comprobados con las fuentes de cada tarjeta. Cada tarjeta indica si el resultado está confirmado, es un problema teórico abierto, una tensión estadística, una afirmación en debate o una anomalía resuelta.')}</Note>
      <div role="group" aria-label={t('Kind', 'Tipo')} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {items.map(([id, text]) => <button key={id} aria-pressed={kind === id} onClick={() => setKind(id)} style={chip(kind === id)}>{text}</button>)}
      </div>
      {list.length === 0 && <Note>{t('No cards match this filter.', 'Ninguna tarjeta cumple este filtro.')}</Note>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {list.map((c) => <li key={c.id}><Card c={c} /></li>)}
      </ul>
    </div>
  );
}

function Card({ c }: { c: StatusCard }) {
  const t = useTr();
  const lang = useLang();
  const { open, set } = useOpenCard();
  const expanded = open === c.id;
  const x = lang === 'es' ? c.es : c.en;
  const k = KIND[c.kind];
  const panelId = `lim-card-${c.id}`;
  const h = { fontSize: 13, margin: '10px 0 2px' } as const;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--panel, var(--bg))' }}>
      <button aria-expanded={expanded} aria-controls={panelId} onClick={() => set(expanded ? null : c.id)}
        style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%' }}>
        <span style={{ fontWeight: 600 }}>{expanded ? '▾ ' : '▸ '}{x.title}</span>
        <span style={{ display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 10, fontSize: 12, border: `1px solid ${k.color}`, color: k.color }}>
          <span aria-hidden>{k.mark} </span>{t(k.en, k.es)}
        </span>
      </button>
      <p style={{ margin: '6px 0 0', fontSize: 14 }}><MathText text={x.plain} /></p>
      {expanded && (
        <div id={panelId}>
          <h3 style={h}>{t('Status', 'Estado')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.statusNote} /></p>
          <h3 style={h}>{t('Key equation', 'Ecuación clave')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.formal} /></p>
          <h3 style={h}>{t('Why it matters', 'Por qué importa')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.why} /></p>
          <h3 style={h}>{t('Sources', 'Fuentes')}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {c.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}
          </ul>
          <Note>{t('Checked', 'Comprobado')}: {c.checked}</Note>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {c.view && <button onClick={() => useLimits.getState().set({ view: c.view! })}>{t('Open view', 'Abrir vista')}: {t(...VIEW_NAME[c.view])}</button>}
            {c.module && <button onClick={() => { location.hash = c.module!; }}>{t('Related module', 'Módulo relacionado')}: {c.module}</button>}
          </div>
        </div>
      )}
    </div>
  );
}
