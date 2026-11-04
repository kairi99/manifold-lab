import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore, type ModuleId } from './state/store';
import 'katex/dist/katex.min.css';
import { MODULE_VIEWS } from './modules/registry';
import { Tour, TourButton, useFirstVisitTour } from './tour/Tour';
import { SuggestedTasks } from './tour/SuggestedTasks';
import { CanvasAccess, KEYS_HELP } from './a11y/CanvasAccess';
import { WebGLGuard } from './scene/WebGLGuard';
import { SURFACE_MODULES } from './state/modules';

const MODULES: { id: ModuleId; label: string }[] = [
  { id: 'metric', label: 'Metric & Tangent Spaces' },
  { id: 'transport', label: 'Parallel Transport' },
  { id: 'geodesics', label: 'Geodesics' },
  { id: 'curvature', label: 'Curvature' },
  { id: 'fields', label: 'Vector Fields & TM' },
  { id: 'relativity', label: 'Relativity: Schwarzschild & Kerr' },
  { id: 'spacetime', label: 'Curvature in 4D' },
  { id: 'cosmos', label: 'Causal Structure & Cosmology' },
];

export default function App() {
  const module = useStore((s) => s.module);
  const set = useStore((s) => s.set);
  useFirstVisitTour();
  // honour prefers-reduced-motion: nothing animates until the user asks
  useEffect(() => { if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) set({ flowPlaying: false, grPlaying: false, stPlaying: false, csPlaying: false }); }, [set]);
  const { Scene, Panel } = MODULE_VIEWS[module];
  // on phones the tabs scroll sideways; keep the active one visible (also when the tour switches module)
  useEffect(() => { document.querySelector('.nav button.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [module]);
  return (
    <div className="app">
      <a className="skip" href="#controls" onClick={(e) => { e.preventDefault(); document.getElementById('controls')?.focus(); }}>Skip to controls</a>
      <nav className="nav" data-tour="nav" aria-label="Modules">
        <h1>Manifold Lab</h1>
        {MODULES.map((m) => (
          <button key={m.id} className={m.id === module ? 'active' : ''} aria-current={m.id === module ? 'page' : undefined} onClick={() => set({ module: m.id, playing: false, geoPlaying: false })}>
            {m.label}
          </button>
        ))}
      </nav>
      <main className="canvas" data-tour="canvas">
        <CanvasAccess>
        <WebGLGuard>
        <Canvas camera={{ position: [3, 2.5, 3], fov: 45 }}>
          <color attach="background" args={['#0f1117']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls makeDefault />
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
        </WebGLGuard>
        </CanvasAccess>
      </main>
      <aside id="controls" className="panel" data-tour="panel" tabIndex={-1} aria-label="Controls and equations">
        {SURFACE_MODULES.has(module) && <p id="kbd-help" className="kbd-help">{KEYS_HELP}</p>}
        <Suspense fallback={<p className="loading">Loading module…</p>}><Panel /></Suspense>
        <SuggestedTasks module={module} />
        <TourButton />
      </aside>
      <Tour />
    </div>
  );
}
