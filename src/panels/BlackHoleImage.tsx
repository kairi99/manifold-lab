import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { fmt } from './Tex';
import { shadowBoundary } from '../math/shadow';
import { shadowAngularRadius } from '../math/schwarzschild';
import { iscoKerr } from '../math/kerr';
import type { TraceParams } from '../math/raytrace';
import { LIGHT, bodyById, massInGeometricUnits } from '../data/celestial';
import { DISK_OUTER } from '../scene/KerrScene';

const FOV = 12; // screen half-extent in M: α, β in [-FOV, FOV]
const DISTANCE = 100;
const ARCSEC = (180 / Math.PI) * 3600;
const TICKS = [-10, -5, 0, 5, 10];

export function BlackHoleImage() {
  const a = useStore((s) => s.grSpin), incl = useStore((s) => s.grIncl), res = useStore((s) => s.grImgRes);
  const target = useStore((s) => s.grImgTarget), grBody = useStore((s) => s.grBody), set = useStore((s) => s.set);
  const [overlay, setOverlay] = useState(true);
  const [pct, setPct] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | null>(null);
  const jobId = useRef(0);

  useEffect(() => {
    const w = new Worker(new URL('../workers/raytrace.worker.ts', import.meta.url), { type: 'module' });
    worker.current = w;
    w.onmessage = (e: MessageEvent<{ id: number; row?: number; data?: Uint8ClampedArray; done?: boolean }>) => {
      const m = e.data;
      if (m.id !== jobId.current) return;
      const c = canvas.current;
      if (m.done) { setPct(100); return; }
      if (!c || m.row === undefined || !m.data) return;
      c.getContext('2d')?.putImageData(new ImageData(m.data as Uint8ClampedArray<ArrayBuffer>, c.width, 1), 0, m.row);
      setPct(Math.round(((m.row + 1) / c.height) * 100));
    };
    return () => { w.terminate(); worker.current = null; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const c = canvas.current;
      if (!c || !worker.current) return;
      const id = ++jobId.current;
      c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
      setPct(0);
      const params: TraceParams = {
        a, inclinationDeg: incl, distance: DISTANCE, fov: FOV, width: res, height: res,
        disk: target !== 'sky', sky: target !== 'disk', diskOuter: DISK_OUTER,
      };
      worker.current.postMessage({ id, params });
    }, 250);
    return () => clearTimeout(t);
  }, [a, incl, res, target]);

  const path = useMemo(() => shadowBoundary(a, incl).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)},${(-y).toFixed(3)}`).join('') + 'Z', [a, incl]);
  const body = grBody ? bodyById(grBody) : null;
  const eht = body && body.distanceM ? (() => {
    const ang = 2 * shadowAngularRadius(massInGeometricUnits(body.gm) / body.distanceM) * ARCSEC * 1e6;
    return { ang, p: LIGHT.find((l) => l.centralId === body.id && /shadow/.test(l.id)) };
  })() : null;
  const desc = `Ray-traced image of a Kerr black hole with spin ${fmt(a, 3)}, seen at ${fmt(incl, 0)} degrees from the spin axis, showing ${target === 'disk' ? 'an accretion disk' : target === 'sky' ? 'a lensed sky checkerboard' : 'an accretion disk and a lensed sky checkerboard'}. The dark shadow is centred on the hole; the disk side moving towards the observer (left) is brighter.`;
  const btn = (v: 'disk' | 'sky' | 'both') => ({
    'aria-pressed': target === v, onClick: () => set({ grImgTarget: v }),
    style: { padding: 6, background: target === v ? 'var(--accent)' : 'var(--bg)', color: target === v ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' } as const,
  });

  return (
    <div data-tour="gr-image">
      <label className="field"><span>Spin a/M = {fmt(a, 3)}</span>
        <input type="range" min={0} max={0.998} step={0.001} value={a} aria-label="Black hole spin a over M" onChange={(e) => set({ grSpin: +e.target.value })} /></label>
      <label className="field"><span>Inclination = {fmt(incl, 0)}° (0° face-on, 90° edge-on)</span>
        <input type="range" min={1} max={89} step={1} value={incl} aria-label="Observer inclination in degrees" onChange={(e) => set({ grIncl: +e.target.value })} /></label>
      <label className="field"><span>Resolution</span>
        <select value={res} onChange={(e) => set({ grImgRes: +e.target.value })}>
          {[80, 120, 160, 240, 320].map((n) => <option key={n} value={n}>{n} × {n}</option>)}
        </select></label>
      <div role="group" aria-label="Ray-trace target" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <button {...btn('disk')}>Disk</button><button {...btn('sky')}>Sky</button><button {...btn('both')}>Both</button>
      </div>
      <label className="check"><input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} /> Overlay Bardeen shadow curve</label>

      <div role="status" aria-live="polite" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
        {pct < 100 ? `tracing… ${pct}%` : 'trace complete'}
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#000', border: '1px solid var(--border)' }}>
        <canvas ref={canvas} width={res} height={res} role="img" aria-label={desc}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />
        <svg viewBox={`${-FOV} ${-FOV} ${2 * FOV} ${2 * FOV}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <line x1={-FOV} x2={FOV} y1={0} y2={0} stroke="#8a8f98" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeOpacity="0.5" />
          <line y1={-FOV} y2={FOV} x1={0} x2={0} stroke="#8a8f98" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeOpacity="0.5" />
          {TICKS.filter((t) => t !== 0).map((t) => (
            <g key={t} fill="#cfd3da" fontSize="0.8">
              <text x={t} y={FOV - 0.4} textAnchor="middle">{t}</text>
              <text x={-FOV + 0.3} y={-t + 0.25}>{t}</text>
            </g>
          ))}
          <text x={FOV - 0.3} y={-0.4} textAnchor="end" fill="#cfd3da" fontSize="0.8">α / M</text>
          <text x={0.4} y={-FOV + 1} fill="#cfd3da" fontSize="0.8">β / M</text>
          {overlay && <path d={path} fill="none" stroke="#35e0c2" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />}
        </svg>
      </div>

      <h2>What you see</h2>
      <p style={{ fontSize: 13 }}>Thin Keplerian disk from the ISCO ({fmt(iscoKerr(a, true), 2)} M) to {DISK_OUTER} M, ray-traced backwards through Kerr in Boyer–Lindquist coordinates. Brightness ∝ g⁴ (Doppler boosting plus gravitational redshift).</p>
      <ul style={{ fontSize: 13, paddingLeft: 18 }}>
        <li><b>Shadow:</b> the dark region is the set of rays that fall into the horizon. Its edge is the Bardeen critical curve (dashed). For a = 0 it is a circle of radius 3√3 M ≈ 5.196 M; with spin it is displaced and flattened (a D shape, most visible edge-on at a near 1).</li>
        <li><b>Photon ring:</b> light that loops partly around the hole near the photon orbit piles up just outside the shadow edge as a thin bright ring (the higher-order images of the disk).</li>
        <li><b>Doppler beaming:</b> the disk and hole rotate about the vertical axis. The side moving toward the observer is the left of the screen (α &lt; 0): blueshifted and much brighter. The right side recedes and is dimmer.</li>
      </ul>
      {eht && body && (
        <>
          <h2>{body.name}: shadow vs EHT</h2>
          <div className="readout">
            <span>Schwarzschild shadow ⌀ 2·3√3·GM/(c²D)</span><span>{fmt(eht.ang, 1)} μas</span>
            {eht.p?.observed && <><span>EHT ring ⌀</span><span>{eht.p.observed.value} ± {eht.p.observed.uncertainty} μas</span></>}
          </div>
          <p style={{ fontSize: 12 }}>The EHT images are at 230 GHz with emission from a hot, geometrically thick flow, not a thin disk,. The picture above is illustrative.</p>
        </>
      )}
    </div>
  );
}
