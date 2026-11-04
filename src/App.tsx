import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore } from './state/store';
import 'katex/dist/katex.min.css';
import { MODULE_VIEWS } from './modules/registry';
import { Tour, TourButton, useFirstVisitTour } from './tour/Tour';
import { SuggestedTasks } from './tour/SuggestedTasks';
import { TheoryButton, TheoryDialog } from './tour/Theory';
import { CanvasAccess, KEYS_HELP } from './a11y/CanvasAccess';
import { WebGLGuard } from './scene/WebGLGuard';
import { FitCamera } from './scene/FitCamera';
import { SURFACE_MODULES, MODULES, moduleFromHash } from './state/modules';
import { Home } from './home/Home';

export default function App() {
  const module = useStore((s) => s.module);
  const set = useStore((s) => s.set);
  const onHome = useStore((s) => s.onHome);
  useFirstVisitTour();
  // the URL hash is the source of truth: '' = start page, '#metric' = that module (back button works)
  useEffect(() => {
    const sync = () => {
      const m = moduleFromHash(location.hash), s = useStore.getState();
      if (!m) set({ onHome: true, tourOpen: false, theoryOpen: false });
      else if (s.onHome || s.module !== m) set({ module: m, onHome: false, playing: false, geoPlaying: false });
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [set]);
  // honour prefers-reduced-motion: nothing animates until the user asks
  useEffect(() => { if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) set({ flowPlaying: false, grPlaying: false, stPlaying: false, csPlaying: false }); }, [set]);
  const { Scene, Panel } = MODULE_VIEWS[module];
  // on phones the tabs scroll sideways; keep the active one visible
  useEffect(() => { document.querySelector('.nav button.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [module, onHome]);
  if (onHome) return <Home />;
  return (
    <div className="app">
      <a className="skip" href="#controls" onClick={(e) => { e.preventDefault(); document.getElementById('controls')?.focus(); }}>Skip to controls</a>
      <nav className="nav" data-tour="nav" aria-label="Modules">
        <h1><a href="#" className="home-link" title="Back to the start page">Manifold Lab</a></h1>
        {MODULES.map((m) => (
          <button key={m.id} className={m.id === module ? 'active' : ''} aria-current={m.id === module ? 'page' : undefined} onClick={() => { location.hash = m.id; }}>
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
          <FitCamera />
          <Suspense fallback={null}><Scene /></Suspense>
        </Canvas>
        </WebGLGuard>
        </CanvasAccess>
      </main>
      <aside id="controls" className="panel" data-tour="panel" tabIndex={-1} aria-label="Controls and equations">
        <TheoryButton />
        {SURFACE_MODULES.has(module) && <p id="kbd-help" className="kbd-help">{KEYS_HELP}</p>}
        <Suspense fallback={<p className="loading">Loading module…</p>}><Panel /></Suspense>
        <SuggestedTasks module={module} />
        <TourButton />
      </aside>
      <Tour />
      <TheoryDialog />
    </div>
  );
}
