import type { ReactNode } from 'react';
import { fmt, Rich } from './Tex';
import { useTr } from '../i18n';

export const sci = (x: number, d = 4) => (x === 0 || Math.abs(x) < 1e-14 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(d - 1) : fmt(x, d));

export const Src = ({ s }: { s: { label: string; url?: string } }) =>
  s.url ? <a href={s.url} target="_blank" rel="noreferrer"><Rich>{s.label}</Rich></a> : <Rich>{s.label}</Rich>;

/** Segmented button row (role=group), same look as the Relativity view switcher. */
export function Seg<T extends string>({ label, value, items, onPick, cols }: { label: string; value: T; items: readonly (readonly [T, string])[]; onPick: (v: T) => void; cols?: number }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols ?? items.length}, 1fr)`, gap: 6, marginBottom: 12 }}>
      {items.map(([id, t]) => (
        <button key={id} aria-pressed={value === id} onClick={() => onPick(id)}
          style={{ padding: '6px', background: value === id ? 'var(--accent)' : 'var(--bg)', color: value === id ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>{t}</button>
      ))}
    </div>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <p style={{ fontSize: 12, color: 'var(--muted)' }}>{children}</p>;

/** Numbers in a 4x4 grid. */
export function Grid4({ m, names, label, tol = 1e-12 }: { m: number[][]; names: string[]; label: string; tol?: number }) {
  return (
    <div role="table" aria-label={label} style={{ display: 'grid', gridTemplateColumns: 'auto repeat(4, 1fr)', gap: '2px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 11, overflowX: 'auto' }}>
      <span />
      {names.map((n) => <span key={n} style={{ color: 'var(--muted)' }}>{n}</span>)}
      {m.map((row, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span style={{ color: 'var(--muted)' }}>{names[i]}</span>
          {row.map((v, j) => <span key={j} style={{ color: Math.abs(v) <= tol ? 'var(--muted)' : 'var(--fg)' }}>{sci(Math.abs(v) <= tol ? 0 : v, 3)}</span>)}
        </span>
      ))}
    </div>
  );
}

/** Play/Pause/Reset plus a scrub slider on stProgress. */
export function Transport({ playing, progress, set, label }: { playing: boolean; progress: number; set: (p: { stPlaying?: boolean; stProgress?: number }) => void; label: string }) {
  const t = useTr();
  return (
    <>
      <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
        <button onClick={() => set({ stPlaying: !playing })}>{playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}</button>
        <button onClick={() => set({ stPlaying: false, stProgress: 0 })}>{t('Reset', 'Reiniciar')}</button>
      </div>
      <label className="field"><span>{label} {fmt(progress * 100, 0)} %</span>
        <input type="range" min={0} max={1} step={0.001} value={progress} aria-label={`${t('Scrub', 'Desplazar')} ${label}`} onChange={(e) => set({ stPlaying: false, stProgress: +e.target.value })} /></label>
    </>
  );
}
