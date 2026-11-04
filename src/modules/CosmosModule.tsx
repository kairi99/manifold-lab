import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '../state/store';
import { PenroseScene } from '../scene/PenroseScene';
import { CosmoScene } from '../scene/CosmoScene';
import { PenrosePanel } from '../panels/PenrosePanel';
import { CosmoPanel } from '../panels/CosmoPanel';

const VIEWS = [['penrose', 'Penrose diagrams'], ['cosmology', 'Cosmology']] as const;

/** Flat diagrams: look head-on at the origin with rotation off; restore the shared default camera on exit. */
export function CosmosScene() {
  const view = useStore((s) => s.csView);
  const { camera, controls, size } = useThree();
  const space = useStore((s) => s.csSpace);
  const aspect = size.width / Math.max(1, size.height);
  // distance at which the diagram (plus its labels) fits the canvas, width- or height-limited
  const [needW, needH] = view === 'cosmology' ? [5.0, 3.3] : space === 'minkowski' ? [2.6, 3.9] : [4.0, 3.0];
  const z = Math.max(needH, needW / aspect) / (2 * Math.tan(Math.PI / 8));
  useEffect(() => {
    const c = controls as unknown as { enableRotate: boolean; target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);
    if (c) { c.enableRotate = false; c.target.set(0, 0, 0); c.update(); }
    return () => {
      camera.position.set(3, 2.5, 3);
      if (c) { c.enableRotate = true; c.target.set(0, 0, 0); c.update(); }
    };
  }, [camera, controls, z]);
  return view === 'penrose' ? <PenroseScene /> : <CosmoScene />;
}

export function CosmosPanel() {
  const view = useStore((s) => s.csView), set = useStore((s) => s.set);
  return (
    <div>
      <div data-tour="views" role="group" aria-label="View" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 12 }}>
        {VIEWS.map(([id, t]) => (
          <button key={id} aria-pressed={view === id} onClick={() => set({ csView: id })}
            style={{ padding: '6px', background: view === id ? 'var(--accent)' : 'var(--bg)', color: view === id ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
      {view === 'penrose' ? <PenrosePanel /> : <CosmoPanel />}
    </div>
  );
}
