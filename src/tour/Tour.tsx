import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { GlossaryText } from './Glossary';
import { TOURS, TOURS_ES } from './steps';
import { useTr } from '../i18n';
import './tour.css';

const seenKey = (m: string) => `manifoldlab.tourSeen.${m}`;

function markSeen(m: string) {
  try { localStorage.setItem(seenKey(m), '1'); } catch { /* ignore */ }
}

/** Opens a module's own guide the first time that module is visited. */
export function useFirstVisitTour() {
  const module = useStore((s) => s.module), onHome = useStore((s) => s.onHome);
  useEffect(() => {
    if (onHome) return;
    let seen = false;
    try { seen = localStorage.getItem(seenKey(module)) !== null; } catch { /* treat as unseen */ }
    useStore.getState().set({ tourOpen: !seen });
  }, [module, onHome]);
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
  const t = useTr();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey) set({ tourOpen: true });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [set]);
  return (
    <button className="tour-fab" aria-label={t('Open guided tour', 'Abrir la visita guiada')} title={t('Guided tour (?)', 'Visita guiada (?)')} onClick={() => set({ tourOpen: true })}>
      ?
    </button>
  );
}

export function Tour() {
  const open = useStore((s) => s.tourOpen);
  const module = useStore((s) => s.module);
  const set = useStore((s) => s.set);
  const t = useTr();
  const STEPS = (t(TOURS, TOURS_ES))[module];
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [module]);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = STEPS[Math.min(i, STEPS.length - 1)];

  const close = () => { markSeen(module); set({ tourOpen: false }); setI(0); };
  const go = (d: number) => {
    const n = i + d;
    if (n < 0) return;
    if (n >= STEPS.length) return close();
    setI(n);
  };

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
        <p id="tour-body"><GlossaryText text={step.body} /></p>
        <div className="tour-foot">
          <span className="tour-count">{i + 1} / {STEPS.length}</span>
          <button onClick={close}>{t('Skip', 'Saltar')}</button>
          <button onClick={() => go(-1)} disabled={i === 0}>{t('Back', 'Atrás')}</button>
          <button className="primary" onClick={() => go(1)}>{last ? t('Done', 'Hecho') : t('Next', 'Siguiente')}</button>
        </div>
      </div>
    </div>
  );
}
