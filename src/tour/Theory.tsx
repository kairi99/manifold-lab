import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { MODULES } from '../state/modules';
import { Tex } from '../panels/Tex';
import { GlossaryText } from './Glossary';
import { THEORY, THEORY_ES } from './theory';
import { tr } from '../i18n';
import './tour.css';

/** Paragraphs split on blank lines; a paragraph that is exactly $$...$$ is display math. */
function Prose({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((p, i) => {
    const d = p.trim().match(/^\$\$([\s\S]+)\$\$$/);
    return d ? <Tex key={i} block>{d[1]}</Tex> : <p key={i}><GlossaryText text={p} /></p>;
  })}</>;
}

export function TheoryButton() {
  const set = useStore((s) => s.set), lang = useStore((s) => s.lang);
  return <button className="theory-btn" data-tour="theory" onClick={() => set({ theoryOpen: true, tourOpen: false })}>{tr(lang, 'Motivation & theory', 'Motivación y teoría')}</button>;
}

export function TheoryDialog() {
  const open = useStore((s) => s.theoryOpen), module = useStore((s) => s.module), set = useStore((s) => s.set), lang = useStore((s) => s.lang);
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
  const es = lang === 'es', t = (es ? THEORY_ES : THEORY)[module];
  const mod = MODULES.find((m) => m.id === module)! as { label: string; labelEs?: string };
  const title = es ? mod.labelEs ?? mod.label : mod.label;
  const close = () => set({ theoryOpen: false });
  return (
    <div className="theory-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={box} className="theory" role="dialog" aria-modal="true" aria-labelledby="theory-title" tabIndex={-1}>
        <header>
          <h2 id="theory-title">{es ? `${title}: motivación y teoría` : `${title}: motivation & theory`}</h2>
          <button onClick={close} aria-label={tr(lang, 'Close', 'Cerrar')}>✕</button>
        </header>
        <div className="theory-body">
          <div className="theory-motivation"><Prose text={t.motivation} /></div>
          {t.sections.map((s) => <section key={s.heading}><h3>{s.heading}</h3><Prose text={s.body} /></section>)}
          <h3>{tr(lang, 'Further reading', 'Lecturas recomendadas')}</h3>
          <ul className="theory-refs">{t.refs.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
