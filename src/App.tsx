import { Suspense, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore } from './state/store';
import 'katex/dist/katex.min.css';
import { MODULE_VIEWS } from './modules/registry';
import { Tour, TourButton, useFirstVisitTour } from './tour/Tour';
import { SuggestedTasks } from './tour/SuggestedTasks';
import { TheoryButton, TheoryDialog } from './tour/Theory';
import { CanvasAccess, keysHelp } from './a11y/CanvasAccess';
import { WebGLGuard } from './scene/WebGLGuard';
import { FitCamera } from './scene/FitCamera';
import { SURFACE_MODULES, MODULES, moduleFromHash } from './state/modules';
import { Home } from './home/Home';
import { parseShareHash, decodeShare, applyShareExt } from './state/share';
import { applyCustomSpec } from './state/store';
// lazy: it pulls the scene helpers (three, drei) that the module chunks already load
const ChartInset = lazy(() => import('./scene/ChartInset'));
import { TopBar, useAppearance } from './chrome/TopBar';
import { InfoDialog } from './chrome/InfoDialog';
import { useTr } from './i18n';

export default function App() {
  const module = useStore((s) => s.module);
  const set = useStore((s) => s.set);
  const onHome = useStore((s) => s.onHome);
  const lang = useStore((s) => s.lang), t = useTr();
  useFirstVisitTour();
  useAppearance();
  // the URL hash is the source of truth: '' = start page, '#metric' = that module (back button works)
  useEffect(() => {
    const sync = () => {
      // shared link '#module?s=…': decodeShare validates and clamps everything, unknown keys are dropped
      const sh = parseShareHash(location.hash);
      if (sh) {
        const { customSpec, ...rest } = decodeShare(sh.s);
        if (customSpec) applyCustomSpec(customSpec, false);
        set({ ...rest, module: sh.module, onHome: false });
        applyShareExt(sh.module, sh.s);
      }
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
  return (
    <div className="shell">
    <TopBar />
    {onHome ? <Home /> : <div className="app">
      <a className="skip" href="#controls" onClick={(e) => { e.preventDefault(); document.getElementById('controls')?.focus(); }}>{t('Skip to controls', 'Saltar a los controles')}</a>
      <nav className="nav" data-tour="nav" aria-label={t('Modules', 'Módulos')}>
        {MODULES.map((m) => (
          <button key={m.id} className={m.id === module ? 'active' : ''} aria-current={m.id === module ? 'page' : undefined} onClick={() => { location.hash = m.id; }}>
            {lang === 'es' ? m.labelEs : m.label}
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
        {SURFACE_MODULES.has(module) && <Suspense fallback={null}><ChartInset /></Suspense>}
      </main>
      <aside id="controls" className="panel" data-tour="panel" tabIndex={-1} aria-label={t('Controls and equations', 'Controles y ecuaciones')}>
        <TheoryButton />
        {SURFACE_MODULES.has(module) && <p id="kbd-help" className="kbd-help">{keysHelp(lang)}</p>}
        <Suspense fallback={<p className="loading">{t('Loading module…', 'Cargando módulo…')}</p>}><Panel /></Suspense>
        <SuggestedTasks module={module} />
        <TourButton />
      </aside>
      <Tour />
      <TheoryDialog />
    </div>}
    <InfoDialog />
    </div>
  );
}
