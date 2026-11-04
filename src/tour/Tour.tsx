import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { MathText } from '../panels/Tex';
import { STEPS } from './steps';
import './tour.css';

const SEEN = 'manifoldlab.tourSeen';

function markSeen() {
  try { localStorage.setItem(SEEN, '1'); } catch { /* ignore */ }
}

export function useFirstVisitTour() {
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN) !== null; } catch { /* treat as unseen */ }
    if (!seen) useStore.getState().set({ tourOpen: true });
  }, []);
}

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  // sliders, checkboxes and radios take no text, so '?' should still open the tour from them
  if (el.tagName === 'INPUT') return !/^(range|checkbox|radio|button|submit|reset)$/.test((el as HTMLInputElement).type);
  return el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName);
}

export function TourButton() {
  const set = useStore((s) => s.set);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey) set({ tourOpen: true });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [set]);
  return (
    <button className="tour-fab" aria-label="Open guided tour" title="Guided tour (?)" onClick={() => set({ tourOpen: true })}>
      ?
    </button>
  );
}

export function Tour() {
  const open = useStore((s) => s.tourOpen);
  const set = useStore((s) => s.set);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = STEPS[i];

  const close = () => { markSeen(); set({ tourOpen: false }); setI(0); };
  const go = (d: number) => {
    const n = i + d;
    if (n < 0) return;
    if (n >= STEPS.length) return close();
    setI(n);
  };

  // switch module for the step
  useEffect(() => {
    if (open && step.module) set({ module: step.module });
  }, [open, i, step.module, set]);

  // locate target: lazy modules mount a few frames late, and targets low in a scrolling panel must be scrolled into view
  useLayoutEffect(() => {
    if (!open) return;
    let tries = 0, raf = 0, scrolled = false;
    const measure = () => {
      const el = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      if (el && !scrolled) { scrolled = true; el.scrollIntoView({ block: 'nearest' }); }
      const r = el?.getBoundingClientRect();
      setRect(r && r.width > 0 && r.height > 0 ? r : null);
      return !!el;
    };
    const poll = () => { if (!measure() && step.target && ++tries < 60) raf = requestAnimationFrame(poll); };
    poll();
    raf = requestAnimationFrame(poll);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, i, step.target]);

  // real card height, so the card can be kept fully on screen
  const [cardH, setCardH] = useState(220);
  useLayoutEffect(() => { if (open && card.current) setCardH(card.current.offsetHeight); });

  // remember the opener and give focus back to it on close
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    return () => opener.current?.focus?.();
  }, [open]);

  useEffect(() => { if (open) card.current?.focus(); }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab' && card.current) {
        // focus trap: cycle through the card's buttons
        const f = [...card.current.querySelectorAll<HTMLElement>('button:not(:disabled)')];
        const a = document.activeElement, first = f[0], last = f[f.length - 1];
        if (!card.current.contains(a) || a === card.current) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (!open) return null;
  const pad = 6;
  const last = i === STEPS.length - 1;
  // place card below target if room, else above; clamp to viewport
  const cardStyle: React.CSSProperties = rect
    ? {
        top: Math.max(8, Math.min(window.innerHeight - cardH - 8,
          rect.bottom + 12 + cardH < window.innerHeight ? rect.bottom + 12 : rect.top - 12 - cardH)),
        left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 348)),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="tour-overlay">
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + 2 * pad, height: rect.height + 2 * pad }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div ref={card} className="tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1}>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-body"><MathText text={step.body} /></p>
        <div className="tour-foot">
          <span className="tour-count">{i + 1} / {STEPS.length}</span>
          <button onClick={close}>Skip</button>
          <button onClick={() => go(-1)} disabled={i === 0}>Back</button>
          <button className="primary" onClick={() => go(1)}>{last ? 'Done' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
