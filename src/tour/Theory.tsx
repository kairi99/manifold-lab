import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { MODULES } from '../state/modules';
import { MathText, Tex } from '../panels/Tex';
import { THEORY } from './theory';
import './tour.css';

/** Paragraphs split on blank lines; a paragraph that is exactly $$...$$ is display math. */
function Prose({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((p, i) => {
    const d = p.trim().match(/^\$\$([\s\S]+)\$\$$/);
    return d ? <Tex key={i} block>{d[1]}</Tex> : <p key={i}><MathText text={p} /></p>;
  })}</>;
}

export function TheoryButton() {
  const set = useStore((s) => s.set);
  return <button className="theory-btn" data-tour="theory" onClick={() => set({ theoryOpen: true, tourOpen: false })}>Motivation &amp; theory</button>;
}

export function TheoryDialog() {
  const open = useStore((s) => s.theoryOpen), module = useStore((s) => s.module), set = useStore((s) => s.set);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') set({ theoryOpen: false }); };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); opener.current?.focus?.(); };
  }, [open, set]);
  if (!open) return null;
  const t = THEORY[module], title = MODULES.find((m) => m.id === module)!.label;
  const close = () => set({ theoryOpen: false });
  return (
    <div className="theory-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={box} className="theory" role="dialog" aria-modal="true" aria-labelledby="theory-title" tabIndex={-1}>
        <header>
          <h2 id="theory-title">{title}: motivation &amp; theory</h2>
          <button onClick={close} aria-label="Close">✕</button>
        </header>
        <div className="theory-body">
          <div className="theory-motivation"><Prose text={t.motivation} /></div>
          {t.sections.map((s) => <section key={s.heading}><h3>{s.heading}</h3><Prose text={s.body} /></section>)}
          <h3>Further reading</h3>
          <ul className="theory-refs">{t.refs.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
