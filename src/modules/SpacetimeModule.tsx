import { useStore } from '../state/store';
import { Seg } from '../panels/SpacetimeUi';
import { TensorsPanel } from '../panels/SpacetimeTensors';
import { TidalPanel } from '../panels/TidalPanel';
import { GWPanel } from '../panels/GWPanel';
import { TensorScene } from '../scene/SpacetimeTensorScene';
import { TidalScene } from '../scene/TidalScene';
import { GWScene } from '../scene/GWScene';
import { useTr } from '../i18n';

const VIEWS = [['tensors', 'Tensors'], ['tidal', 'Tidal'], ['waves', 'Waves']] as const;
const VIEWS_ES = { tensors: 'Tensores', tidal: 'Marea', waves: 'Ondas' } as const;

export function SpacetimeScene() {
  const v = useStore((s) => s.stView);
  return v === 'tensors' ? <TensorScene /> : v === 'tidal' ? <TidalScene /> : <GWScene />;
}

export function SpacetimePanel() {
  const v = useStore((s) => s.stView), set = useStore((s) => s.set);
  const t = useTr();
  const views = VIEWS.map(([id, en]) => [id, t(en, VIEWS_ES[id])] as const);
  return (
    <div>
      <div data-tour="views"><Seg label={t('View', 'Vista')} value={v} items={views} onPick={(id) => set({ stView: id, stProgress: 0, stPlaying: id !== 'tensors' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches })} /></div>
      {v === 'tensors' ? <TensorsPanel /> : v === 'tidal' ? <TidalPanel /> : <GWPanel />}
    </div>
  );
}
