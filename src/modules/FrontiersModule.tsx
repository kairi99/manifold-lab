import { Seg } from '../panels/SpacetimeUi';
import { useTr } from '../i18n';
import { useFrontiers, type FrontierView } from '../frontiers/state';
import * as Problems from '../frontiers/problems';
import * as Csf from '../frontiers/csf';
import * as Ricci from '../frontiers/ricci';
import * as Willmore from '../frontiers/willmore';
import * as Penrose from '../frontiers/penrose';
import * as Gauge from '../frontiers/gauge';

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
