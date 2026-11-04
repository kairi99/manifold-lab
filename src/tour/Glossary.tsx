import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MathText } from '../panels/Tex';
import { MODULES } from '../state/modules';
import { useLang, tr } from '../i18n';
import { GLOSSARY, termById, type GlossaryTerm } from './glossary';
import './tour.css';

/** `[[id]]` or `[[id|shown words]]` */
const MARK = /\[\[([\w-]+)(?:\|([^\]]*))?\]\]/g;

const hasModule = (id: string) => MODULES.some((m) => m.id === id);

function Definition({ g, lang }: { g: GlossaryTerm; lang: 'en' | 'es' }) {
  return (
    <>
      <MathText text={lang === 'es' ? g.defEs : g.def} />
      {hasModule(g.module) && (
        <a className="gl-open" href={`#${g.module}`}>{tr(lang, 'Open in simulation', 'Abrir en la simulación')}</a>
      )}
    </>
  );
}

function Term({ g, shown }: { g: GlossaryTerm; shown?: string }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null), btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLSpanElement>(null);
  const [dx, setDx] = useState(0);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  // keep the popover inside the viewport horizontally
  useLayoutEffect(() => {
    if (!open || !pop.current) return;
    const r = pop.current.getBoundingClientRect();
    const l = r.left - dx, rt = r.right - dx;
    let d = Math.min(0, window.innerWidth - 8 - rt);
    if (l + d < 8) d = 8 - l;
    setDx(d);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={wrap} className="gl-wrap" onKeyDown={(e) => {
      if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); btn.current?.focus(); }
    }}>
      <button ref={btn} type="button" className="gl-term" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
        {shown ?? (lang === 'es' ? g.termEs : g.term)}
      </button>
      {open && (
        <span ref={pop} id={id} className="gl-pop" role="group" aria-label={lang === 'es' ? g.termEs : g.term} style={{ left: dx }}>
          <strong>{lang === 'es' ? g.termEs : g.term}</strong>
          <Definition g={g} lang={lang} />
        </span>
      )}
    </span>
  );
}

/** Prose with `$math$` and `[[term]]` / `[[term|shown words]]` glossary markup. Unknown ids render as plain words. */
export function GlossaryText({ text }: { text: string }) {
  const parts = useMemo(() => {
    const out: ({ s: string } | { id: string; shown?: string })[] = [];
    let i = 0;
    for (const m of text.matchAll(MARK)) {
      if (m.index > i) out.push({ s: text.slice(i, m.index) });
      out.push({ id: m[1], shown: m[2] });
      i = m.index + m[0].length;
    }
    if (i < text.length) out.push({ s: text.slice(i) });
    return out;
  }, [text]);
  return <>{parts.map((p, k) => {
    if ('s' in p) return <MathText key={k} text={p.s} />;
    const g = termById(p.id);
    return g ? <Term key={k} g={g} shown={p.shown || undefined} /> : <Fragment key={k}>{p.shown ?? p.id}</Fragment>;
  })}</>;
}

export function GlossaryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useLang();
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLInputElement>('input')?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); opener.current?.focus?.(); };
  }, [open, onClose]);
  const list = useMemo(() => {
    const name = (g: GlossaryTerm) => (lang === 'es' ? g.termEs : g.term);
    const n = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => !n || `${g.term} ${g.termEs} ${g.def} ${g.defEs}`.toLowerCase().includes(n))
      .sort((a, b) => name(a).localeCompare(name(b), lang));
  }, [lang, q]);
  if (!open) return null;
  return (
    <div className="theory-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} className="theory" role="dialog" aria-modal="true" aria-labelledby="gl-title">
        <header>
          <h2 id="gl-title">{tr(lang, 'Glossary', 'Glosario')}</h2>
          <button onClick={onClose} aria-label={tr(lang, 'Close', 'Cerrar')}>✕</button>
        </header>
        <div className="theory-body">
          <input type="search" className="gl-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={tr(lang, 'Search terms…', 'Buscar términos…')} aria-label={tr(lang, 'Search terms', 'Buscar términos')} />
          <dl className="gl-list">
            {list.map((g) => (
              <Fragment key={g.id}>
                <dt>{lang === 'es' ? g.termEs : g.term}</dt>
                <dd><Definition g={g} lang={lang} /></dd>
              </Fragment>
            ))}
          </dl>
          {!list.length && <p>{tr(lang, 'No matching terms.', 'Ningún término coincide.')}</p>}
        </div>
      </div>
    </div>
  );
}
