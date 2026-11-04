import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore, type ModuleId } from './state/store';
import 'katex/dist/katex.min.css';
import { MetricScene, MetricPanel } from './modules/MetricModule';
import { TransportScene, TransportPanel } from './modules/TransportModule';
import { GeodesicScene, GeodesicPanel } from './modules/GeodesicModule';
import { CurvatureScene, CurvaturePanel } from './modules/CurvatureModule';
import { FieldsScene, FieldsPanel } from './modules/FieldsModule';
import { RelativityScene, RelativityPanel } from './modules/RelativityModule';
import { Tour, TourButton, useFirstVisitTour } from './tour/Tour';
import { SuggestedTasks } from './tour/SuggestedTasks';

const MODULES: { id: ModuleId; label: string }[] = [
  { id: 'metric', label: 'Metric & Tangent Spaces' },
  { id: 'transport', label: 'Parallel Transport' },
  { id: 'geodesics', label: 'Geodesics' },
  { id: 'curvature', label: 'Curvature' },
  { id: 'fields', label: 'Vector Fields & TM' },
  { id: 'relativity', label: 'Relativity: Schwarzschild' },
];

export default function App() {
  const module = useStore((s) => s.module);
  const set = useStore((s) => s.set);
  useFirstVisitTour();
  // on phones the tabs scroll sideways; keep the active one visible (also when the tour switches module)
  useEffect(() => { document.querySelector('.nav button.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [module]);
  return (
    <div className="app">
      <nav className="nav" data-tour="nav">
        <h1>Manifold Lab</h1>
        {MODULES.map((m) => (
          <button key={m.id} className={m.id === module ? 'active' : ''} onClick={() => set({ module: m.id, playing: false, geoPlaying: false })}>
            {m.label}
          </button>
        ))}
      </nav>
      <main className="canvas" data-tour="canvas">
        <Canvas camera={{ position: [3, 2.5, 3], fov: 45 }}>
          <color attach="background" args={['#0f1117']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls makeDefault />
          {module === 'metric' ? <MetricScene /> : module === 'transport' ? <TransportScene /> : module === 'geodesics' ? <GeodesicScene /> : module === 'curvature' ? <CurvatureScene /> : module === 'fields' ? <FieldsScene /> : <RelativityScene />}
        </Canvas>
      </main>
      <aside className="panel" data-tour="panel">
        {module === 'metric' ? <MetricPanel /> : module === 'transport' ? <TransportPanel /> : module === 'geodesics' ? <GeodesicPanel /> : module === 'curvature' ? <CurvaturePanel /> : module === 'fields' ? <FieldsPanel /> : <RelativityPanel />}
        <SuggestedTasks module={module} />
      </aside>
      <Tour />
      <TourButton />
    </div>
  );
}
