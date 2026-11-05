import { Seg } from '../panels/SpacetimeUi';
import { useTr } from '../i18n';
import { useLimits, type LimitsView } from '../limits/state';
import * as Status from '../limits/status';
import * as Rotation from '../limits/rotation';
import * as Tensions from '../limits/tensions';
import * as Tests from '../limits/tests';
import * as Quantum from '../limits/quantum';

const VIEWS: readonly (readonly [LimitsView, string, string])[] = [
  ['status', 'State of the art', 'Estado actual'],
  ['rotation', 'Rotation curves', 'Curvas de rotación'],
  ['tensions', 'Cosmic tensions', 'Tensiones cosmológicas'],
  ['tests', 'Precision tests', 'Pruebas de precisión'],
  ['quantum', 'Quantum limits', 'Límites cuánticos'],
];
const PARTS = { status: Status, rotation: Rotation, tensions: Tensions, tests: Tests, quantum: Quantum } as const;

export function LimitsScene() {
  const { Scene } = PARTS[useLimits((s) => s.view)];
  return <Scene />;
}

export function LimitsPanel() {
  const { view, set } = useLimits();
  const t = useTr();
  const { Panel } = PARTS[view];
  return (
    <div>
      <div data-tour="views"><Seg label={t('View', 'Vista')} value={view} cols={2} items={VIEWS.map(([id, en, es]) => [id, t(en, es)] as const)} onPick={(v) => set({ view: v })} /></div>
      <Panel key={view} />
    </div>
  );
}
