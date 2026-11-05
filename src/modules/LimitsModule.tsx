import { Seg } from '../panels/SpacetimeUi';
import { useTr } from '../i18n';
import { useLimits, type LimitsView } from '../limits/state';
import * as Status from '../limits/status';
import * as Rotation from '../limits/rotation';
import * as Tensions from '../limits/tensions';
import * as Tests from '../limits/tests';
import * as Quantum from '../limits/quantum';
import { registerShare, num, bool, oneOf, id as idCheck } from '../state/share';
import { useRot } from '../limits/rotation/state';
import { GALAXIES } from '../limits/rotation/data';
import { useTensions } from '../limits/tensions/state';
import { useTests } from '../limits/tests/state';
import { useQuantum } from '../limits/quantum/state';

registerShare('limits', {
  v: { store: useLimits, fields: { view: oneOf(['status', 'rotation', 'tensions', 'tests', 'quantum'] as const) } },
  rot: {
    store: useRot,
    fields: { gal: oneOf(GALAXIES.map((g) => g.id)), yd: num(0.1, 1.2), yb: num(0.1, 1.2), halo: oneOf(['iso', 'nfw'] as const), logRho: num(4, 11), rs: num(0.3, 60), a0: num(0.3e-10, 3e-10), drive: oneOf(['obs', 'bar', 'halo', 'mond'] as const) },
    // cached fits belong to the old galaxy/halo; resetTick restarts the disc
    apply: (v) => useRot.setState((s) => ({ ...v, fits: {}, resetTick: s.resetTick + 1 })),
  },
  ten: { store: useTensions, fields: { mode: oneOf(['h0', 's8', 'de'] as const), a: idCheck, b: idCheck, w0: num(-1.5, -0.2), wa: num(-3, 1), z: num(0, 3) } },
  pt: { store: useTests, fields: { mode: oneOf(['history', 'ppn'] as const), gamma: num(0.9, 1.1), beta: num(0.9, 1.1), useBD: bool, omega: num(1, 1e7), sel: idCheck } },
  q: { store: useQuantum, fields: { mode: oneOf(['hawking', 'lambda', 'scales'] as const), logM: num(10, 40.3), logE: num(-3, 28.1), logM3: num(10, 40.3) } },
});

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
