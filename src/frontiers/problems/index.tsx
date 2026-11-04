import { useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { MathText } from '../../panels/Tex';
import { Note } from '../../panels/SpacetimeUi';
import { useLang, useTr } from '../../i18n';
import { PAL } from '../../theme/palette';
import { useFrontiers } from '../state';
import { PROBLEMS, type DemoView, type Problem, type ProblemArea, type ProblemStatus } from './data';
import { Scene as CsfScene } from '../csf';
import { Scene as RicciScene } from '../ricci';
import { Scene as WillmoreScene } from '../willmore';
import { Scene as PenroseScene } from '../penrose';
import { Scene as GaugeScene } from '../gauge';

/** Which card is expanded; the Scene follows it. */
const useOpenCard = create<{ open: string | null; set: (id: string | null) => void }>((set) => ({ open: null, set: (open) => set({ open }) }));

const DEMOS: Record<DemoView, () => ReactNode> = { csf: CsfScene, ricci: RicciScene, willmore: WillmoreScene, penrose: PenroseScene, gauge: GaugeScene };

const STATUS: Record<ProblemStatus, { en: string; es: string; color: string; mark: string }> = {
  solved: { en: 'Solved', es: 'Resuelto', color: PAL.path, mark: '✓' },
  partial: { en: 'Partly solved / disputed', es: 'Resuelto en parte / disputado', color: PAL.p, mark: '◐' },
  open: { en: 'Open', es: 'Abierto', color: PAL.warn, mark: '○' },
};
const AREAS: [ProblemArea | 'all', string, string][] = [['all', 'All', 'Todos'], ['millennium', 'Millennium', 'Milenio'], ['geometry', 'Geometry', 'Geometría'], ['relativity', 'Relativity', 'Relatividad']];
const STATUSES: [ProblemStatus | 'all', string, string][] = [['all', 'Any status', 'Cualquier estado'], ['solved', 'Solved', 'Resuelto'], ['partial', 'Partly', 'En parte'], ['open', 'Open', 'Abierto']];

export function Scene() {
  const open = useOpenCard((s) => s.open);
  const demo = PROBLEMS.find((p) => p.id === open)?.demo;
  const Demo = demo ? DEMOS[demo] : null;
  return Demo ? <Demo /> : <Torus />;
}

/** Calm decorative object: torus of revolution with R/r = √2 (the Clifford torus up to a Möbius map). */
function Torus() {
  const ref = useRef<Mesh>(null);
  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useFrame((_, dt) => { if (!reduce && ref.current) { ref.current.rotation.y += 0.15 * dt; ref.current.rotation.x = 0.9; } });
  const r = 0.45;
  return (
    <mesh ref={ref} rotation={[0.9, 0, 0]}>
      <torusGeometry args={[r * Math.SQRT2, r, 20, 64]} />
      <meshBasicMaterial color={PAL.metric} wireframe />
    </mesh>
  );
}

const chip = (on: boolean) => ({ padding: '4px 10px', background: on ? 'var(--accent)' : 'var(--bg)', color: on ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', fontSize: 13 }) as const;

function Chips<T extends string>({ label, value, items, onPick }: { label: string; value: T; items: [T, string][]; onPick: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
      {items.map(([id, text]) => <button key={id} aria-pressed={value === id} onClick={() => onPick(id)} style={chip(value === id)}>{text}</button>)}
    </div>
  );
}

export function Panel() {
  const t = useTr();
  const [area, setArea] = useState<ProblemArea | 'all'>('all');
  const [status, setStatus] = useState<ProblemStatus | 'all'>('all');
  const list = PROBLEMS.filter((p) => (area === 'all' || p.area === area) && (status === 'all' || p.status === status));
  return (
    <div>
      <h2>{t('Open and recently solved problems', 'Problemas abiertos y resueltos recientemente')}</h2>
      <Note>{t('Statuses were checked in November 2026 against the sources on each card. Where a result is disputed or only claimed, the card says so.', 'Los estados se comprobaron en noviembre de 2026 con las fuentes de cada tarjeta. Cuando un resultado está disputado o solo afirmado, la tarjeta lo dice.')}</Note>
      <Chips label={t('Area', 'Área')} value={area} items={AREAS.map(([id, en, es]) => [id, t(en, es)] as [ProblemArea | 'all', string])} onPick={setArea} />
      <Chips label={t('Status', 'Estado')} value={status} items={STATUSES.map(([id, en, es]) => [id, t(en, es)] as [ProblemStatus | 'all', string])} onPick={setStatus} />
      {list.length === 0 && <Note>{t('No problems match these filters.', 'Ningún problema cumple estos filtros.')}</Note>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {list.map((p) => <li key={p.id}><Card p={p} /></li>)}
      </ul>
    </div>
  );
}

function Card({ p }: { p: Problem }) {
  const t = useTr();
  const lang = useLang();
  const { open, set } = useOpenCard();
  const expanded = open === p.id;
  const x = lang === 'es' ? p.es : p.en;
  const st = STATUS[p.status];
  const panelId = `fr-card-${p.id}`;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--panel, var(--bg))' }}>
      <button aria-expanded={expanded} aria-controls={panelId} onClick={() => set(expanded ? null : p.id)}
        style={{ background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'block', width: '100%' }}>
        <span style={{ fontWeight: 600 }}>{expanded ? '▾ ' : '▸ '}{x.title}</span>
        <span style={{ display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 10, fontSize: 12, border: `1px solid ${st.color}`, color: st.color }}>
          <span aria-hidden>{st.mark} </span>{t(st.en, st.es)}
        </span>
      </button>
      <p style={{ margin: '6px 0 0', fontSize: 14 }}><MathText text={x.plain} /></p>
      {expanded && (
        <div id={panelId}>
          <h3 style={{ fontSize: 13, margin: '10px 0 2px' }}>{t('Status', 'Estado')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.statusNote} /></p>
          <h3 style={{ fontSize: 13, margin: '10px 0 2px' }}>{t('Formal statement', 'Enunciado formal')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.formal} /></p>
          <h3 style={{ fontSize: 13, margin: '10px 0 2px' }}>{t('Why it is hard / why it matters', 'Por qué es difícil / por qué importa')}</h3>
          <p style={{ margin: 0, fontSize: 13 }}><MathText text={x.why} /></p>
          <h3 style={{ fontSize: 13, margin: '10px 0 2px' }}>{t('Sources', 'Fuentes')}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {p.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}
          </ul>
          <Note>{t('Checked', 'Comprobado')}: {p.checked}</Note>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {p.demo && <button onClick={() => useFrontiers.getState().set({ view: p.demo! })}>{t('Open demo', 'Abrir demo')}</button>}
            {p.module && <button onClick={() => { location.hash = p.module!; }}>{t('Related module', 'Módulo relacionado')}: {p.module}</button>}
          </div>
        </div>
      )}
    </div>
  );
}
