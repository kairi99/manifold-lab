import { Seg } from '../panels/SpacetimeUi';
import { useTr } from '../i18n';
import { useFrontiers, type FrontierView } from '../frontiers/state';
import * as Problems from '../frontiers/problems';
import * as Csf from '../frontiers/csf';
import * as Ricci from '../frontiers/ricci';
import * as Willmore from '../frontiers/willmore';
import * as Penrose from '../frontiers/penrose';
import * as Gauge from '../frontiers/gauge';
import { registerShare, num, nums, bool, oneOf } from '../state/share';
import { useCsf } from '../frontiers/csf/state';
import { PRESET_IDS } from '../frontiers/csf/math';
import { useRicci } from '../frontiers/ricci/state';
import { useWillmore } from '../frontiers/willmore/state';
import { usePenrose } from '../frontiers/penrose/state';
import { useGauge } from '../frontiers/gauge/state';

// a hand-drawn CSF curve is not shared (only presets); the link then keeps the default curve
registerShare('frontiers', {
  v: { store: useFrontiers, fields: { view: oneOf(['problems', 'csf', 'ricci', 'willmore', 'penrose', 'gauge'] as const) } },
  csf: {
    store: useCsf, fields: { preset: oneOf(PRESET_IDS), speed: num(0.2, 4) },
    apply: ({ preset, ...rest }) => { if (preset) useCsf.getState().load(preset as (typeof PRESET_IDS)[number]); useCsf.setState(rest); },
  },
  ri: { store: useRicci, fields: { kind: oneOf(['round', 'peanut', 'dumbbell'] as const), depth: num(0.6, 0.95), rescale: bool, p: num(0, 1), speed: (x) => ([0.25, 1, 3].includes(x as number) ? x : undefined) } },
  wi: {
    store: useWillmore, fields: { mode: oneOf(['energy', 'umbilics'] as const), c: num(1.05, 4), inv: num(0, 1), ax: nums(3, 0.3, 2) },
    apply: ({ ax, ...rest }) => useWillmore.setState({ ...rest, ...(ax ? { ax: [...(ax as number[])].sort((x, y) => y - x) as [number, number, number] } : {}) }),
  },
  pe: { store: usePenrose, fields: { mode: oneOf(['kn', 'slice'] as const), a: num(0, 1), Q: num(0, 1), m1: num(1, 100), m2: num(1, 100) }, apply: (v) => usePenrose.getState().set(v) },
  ga: { store: useGauge, fields: { B: num(0, 3), lam: num(0, 1.5), ra: num(0.3, 1.2), rb: num(0.3, 1.2), order: oneOf(['ab', 'ba'] as const), gauge: bool } },
});

const VIEWS: readonly (readonly [FrontierView, string, string])[] = [
  ['problems', 'Problems', 'Problemas'],
  ['csf', 'Curve shortening', 'Acortamiento de curvas'],
  ['ricci', 'Ricci flow', 'Flujo de Ricci'],
  ['willmore', 'Willmore', 'Willmore'],
  ['penrose', 'Penrose inequality', 'Desigualdad de Penrose'],
  ['gauge', 'Yang–Mills holonomy', 'Holonomía de Yang–Mills'],
];
const PARTS = { problems: Problems, csf: Csf, ricci: Ricci, willmore: Willmore, penrose: Penrose, gauge: Gauge } as const;

export function FrontiersScene() {
  const { Scene } = PARTS[useFrontiers((s) => s.view)];
  return <Scene />;
}

export function FrontiersPanel() {
  const { view, set } = useFrontiers();
  const t = useTr();
  const { Panel } = PARTS[view];
  return (
    <div>
      <div data-tour="views"><Seg label={t('View', 'Vista')} value={view} cols={2} items={VIEWS.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ view: v })} /></div>
      <Panel key={view} />
    </div>
  );
}
