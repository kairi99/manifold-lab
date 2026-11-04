import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { getSurface } from '../math';
import { useStore, type AppState } from '../state/store';
import { coordText, fmt } from '../panels/Tex';
import { SURFACE_MODULES } from '../state/modules';
import { tr, useTr, type Lang } from '../i18n';

export const KEYS_HELP =
  'Keyboard (3D view focused): arrow keys move p (left/right: first coordinate, up/down: second; Shift = larger step). [ and ] rotate V, + and − scale V.';

const KEYS_HELP_ES =
  'Teclado (vista 3D enfocada): las flechas mueven p (izquierda/derecha: primera coordenada, arriba/abajo: segunda; Shift = paso mayor). [ y ] giran V, + y − escalan V.';

export const keysHelp = (lang: Lang) => tr(lang, KEYS_HELP, KEYS_HELP_ES);

const MOVE: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, -1], ArrowUp: [0, 1] };

/** One-line spoken summary of the current state. Returns a string so the store selector can skip equal renders. */
function describe(s: AppState): string {
  const t = (en: string, es: string) => tr(s.lang, en, es);
  if (s.module === 'relativity') return t('Relativity: Schwarzschild spacetime. Use the controls panel to change the view.', 'Relatividad: espaciotiempo de Schwarzschild. Usa el panel de controles para cambiar la vista.');
  if (s.module === 'spacetime') return t(`Curvature in 4D, ${s.stView} view. Use the controls panel to change the view.`, `Curvatura en 4D, vista ${s.stView}. Usa el panel de controles para cambiar la vista.`);
  if (s.module === 'cosmos') return t(`Causal structure and cosmology, ${s.csView} view. Use the controls panel to change the view.`, `Estructura causal y cosmología, vista ${s.csView}. Usa el panel de controles para cambiar la vista.`);
  const surf = getSurface(s.surfaceId);
  const [cu, cv] = surf.coords.map(coordText);
  const pct = (x: number) => `${Math.round(x * 10) * 10}%`;
  let extra = '';
  if (s.module === 'transport') extra = t(`; loop ${s.pathKind}, transport ${pct(s.progress)}${s.playing ? ', playing' : ''}`, `; lazo ${s.pathKind}, transporte ${pct(s.progress)}${s.playing ? ', reproduciendo' : ''}`);
  else if (s.module === 'geodesics') extra = t(`; ${s.geoCount} geodesics, progress ${pct(s.geoProgress)}${s.geoPlaying ? ', playing' : ''}`, `; ${s.geoCount} geodésicas, progreso ${pct(s.geoProgress)}${s.geoPlaying ? ', reproduciendo' : ''}`);
  else if (s.module === 'curvature') extra = t(`; Gaussian curvature K = ${fmt(surf.gaussK(s.uv[0], s.uv[1]), 2)}`, `; curvatura de Gauss K = ${fmt(surf.gaussK(s.uv[0], s.uv[1]), 2)}`);
  else if (s.module === 'fields') extra = t(`; flow animation ${s.flowPlaying ? 'on' : 'off'}`, `; animación del flujo ${s.flowPlaying ? 'activada' : 'desactivada'}`);
  return t(`${surf.name}; point ${cu} = ${fmt(s.uv[0], 2)}, ${cv} = ${fmt(s.uv[1], 2)}; tangent vector V = (${fmt(s.vector[0], 2)}, ${fmt(s.vector[1], 2)})${extra}`, `${surf.name}; punto ${cu} = ${fmt(s.uv[0], 2)}, ${cv} = ${fmt(s.uv[1], 2)}; vector tangente V = (${fmt(s.vector[0], 2)}, ${fmt(s.vector[1], 2)})${extra}`);
}

/** Updates at most every 500 ms so a drag or animation does not flood the screen reader. */
function useThrottled(text: string) {
  const [t, setT] = useState(text);
  const last = useRef(0);
  useEffect(() => {
    const id = setTimeout(() => { last.current = Date.now(); setT(text); }, Math.max(0, last.current + 500 - Date.now()));
    return () => clearTimeout(id);
  }, [text]);
  return t;
}

function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return;
  const st = useStore.getState();
  if (!SURFACE_MODULES.has(st.module)) return;
  const s = getSurface(st.surfaceId);
  const mv = MOVE[e.key];
  if (mv) {
    e.preventDefault();
    const k = e.shiftKey ? 0.1 : 0.02;
    const nxt = (x: number, [lo, hi]: [number, number], periodic: boolean, d: number) => {
      const y = x + d * k * (hi - lo);
      return periodic ? lo + ((((y - lo) % (hi - lo)) + (hi - lo)) % (hi - lo)) : Math.min(hi, Math.max(lo, y));
    };
    const { u, v, periodicU, periodicV } = s.domain;
    st.set({ uv: [nxt(st.uv[0], u, periodicU, mv[0]), nxt(st.uv[1], v, periodicV, mv[1])] });
    return;
  }
  const [V0, V1] = st.vector;
  if ('[]{}'.includes(e.key) && e.key.length === 1) {
    e.preventDefault();
    // rotate in the metric-orthonormal frame e1 = ∂u/a, e2 = (∂v − g01/g00 ∂u)·a/D (Cholesky, as in MetricScene)
    const g = s.metric(st.uv[0], st.uv[1]);
    const a = Math.sqrt(g[0][0]), D = Math.sqrt(g[0][0] * g[1][1] - g[0][1] ** 2);
    if (!(a > 0 && D > 0)) return;
    const c = a * V0 + (g[0][1] / a) * V1, sn = (D / a) * V1;
    const th = (e.key === ']' || e.key === '}' ? 1 : -1) * (e.shiftKey || e.key === '{' || e.key === '}' ? 0.4 : 0.1);
    const c2 = c * Math.cos(th) - sn * Math.sin(th), s2 = c * Math.sin(th) + sn * Math.cos(th);
    st.set({ vector: [c2 / a - (g[0][1] / (a * D)) * s2, (a / D) * s2] });
    return;
  }
  const f = e.key === '+' || e.key === '=' ? 1.1 : e.key === '-' || e.key === '_' ? 1 / 1.1 : 0;
  if (f) {
    e.preventDefault();
    const n = Math.hypot(V0, V1) * f;
    if (n > 0.05 && n < 4) st.set({ vector: [V0 * f, V1 * f] });
  }
}

/** Focusable, labelled wrapper around the 3D canvas: keyboard control of p and V plus a throttled live description. */
export function CanvasAccess({ children }: { children: ReactNode }) {
  const t = useTr();
  const text = useThrottled(useStore(describe));
  return (
    <div
      className="canvas-app" tabIndex={0} role="application" aria-label={t('Interactive 3D view of the surface', 'Vista 3D interactiva de la superficie')}
      aria-describedby="kbd-help" onKeyDown={onKeyDown}
      onPointerDown={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true }); }}
    >
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{text}</div>
    </div>
  );
}
