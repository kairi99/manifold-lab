import { useStore } from '../state/store';
import { Seg } from '../panels/SpacetimeUi';
import { TensorsPanel } from '../panels/SpacetimeTensors';
import { TidalPanel } from '../panels/TidalPanel';
import { GWPanel } from '../panels/GWPanel';
import { TensorScene } from '../scene/SpacetimeTensorScene';
import { TidalScene } from '../scene/TidalScene';
import { GWScene } from '../scene/GWScene';

const VIEWS = [['tensors', 'Tensors'], ['tidal', 'Tidal'], ['waves', 'Waves']] as const;

export function SpacetimeScene() {
  const v = useStore((s) => s.stView);
  return v === 'tensors' ? <TensorScene /> : v === 'tidal' ? <TidalScene /> : <GWScene />;
}

export function SpacetimePanel() {
  const v = useStore((s) => s.stView), set = useStore((s) => s.set);
  return (
    <div>
      <Seg label="View" value={v} items={VIEWS} onPick={(id) => set({ stView: id, stProgress: 0, stPlaying: id !== 'tensors' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches })} />
      {v === 'tensors' ? <TensorsPanel /> : v === 'tidal' ? <TidalPanel /> : <GWPanel />}
    </div>
  );
}
