import { useEffect, useState } from 'react';
import { GlossaryText as Rich } from './Glossary';
import { MathText, fmtSci } from '../panels/Tex';
import { useStore, type ModuleId } from '../state/store';
import { tasksForLang, type Predict, type Task } from './tasks';
import { useLang, useTr } from '../i18n';
import { loadDone as load } from '../home/path';
import './tour.css';

const KEY = 'manifoldlab.tasksDone';

function save(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  window.dispatchEvent(new Event('manifoldlab:tasks'));
}

// 3 significant figures; very large or small values in the house ×10ⁿ notation instead of toPrecision's 1e+22
const fmtN = (x: number) => (x !== 0 && (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-3) ? fmtSci(x, 2) : String(+x.toPrecision(3)));

/** Type a number first; the answer and feedback appear after submitting. */
function PredictBox({ p }: { p: Predict }) {
  const lang = useLang(), t = useTr();
  const [val, setVal] = useState(''), [res, setRes] = useState<{ ans: number; ok: boolean; off: number } | null>(null);
  const submit = () => {
    const x = parseFloat(val.replace(',', '.'));
    if (!Number.isFinite(x)) return;
    const ans = p.answer(useStore.getState());
    setRes({ ans, ok: Math.abs(x - ans) <= p.tol, off: Math.abs(x - ans) });
  };
  const unit = p.unit ? ` ${p.unit}` : '';
  return (
    <form className="task-predict" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <span><MathText text={lang === 'es' ? p.labelEs : p.label} /></span>
      <input value={val} onChange={(e) => { setVal(e.target.value); setRes(null); }} inputMode="decimal"
        aria-label={t('Your prediction', 'Tu predicción')} placeholder={p.unit ?? '#'} />
      <button type="submit" disabled={!val.trim()}>{t('Reveal', 'Revelar')}</button>
      {res && (
        <span className="task-feedback" role="status">
          {res.ok ? t('Close!', '¡Cerca!') : t(`Off by ${fmtN(res.off)}${unit}.`, `Te desvías ${fmtN(res.off)}${unit}.`)}
          {' '}{t('Answer', 'Respuesta')}: <b>{fmtN(res.ans)}{unit}</b>
        </span>
      )}
    </form>
  );
}

export function SuggestedTasks({ module }: { module: ModuleId }) {
  const lang = useLang(), t0 = useTr();
  const [done, setDone] = useState<string[]>(load);
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState<Record<string, 'hint' | 'answer' | undefined>>({});
  const [detected, setDetected] = useState<string[]>([]);
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    save(next);
  };
  // auto-tick tasks whose check() holds in the live store
  const tasks = tasksForLang(module, lang);
  useEffect(() => {
    const scan = (st: ReturnType<typeof useStore.getState>) => {
      const fresh = tasks.filter((x: Task) => x.check && !detected.includes(x.id) && x.check(st)).map((x) => x.id);
      if (!fresh.length) return;
      setDetected((d) => [...d, ...fresh]);
      const cur = load(), next = [...cur, ...fresh.filter((i) => !cur.includes(i))];
      if (next.length !== cur.length) { save(next); setDone(next); }
    };
    scan(useStore.getState());
    return useStore.subscribe(scan);
  });
  useEffect(() => {
    const h = () => setDone(load());
    window.addEventListener('manifoldlab:tasks', h);
    return () => window.removeEventListener('manifoldlab:tasks', h);
  }, []);
  return (
    <section className="tasks">
      <button className="tasks-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} {t0('Suggested tasks', 'Tareas sugeridas')}
      </button>
      {open && (
        <ul>
          {tasks.map((t) => (
            <li key={t.id} className={done.includes(t.id) ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={done.includes(t.id)} onChange={() => toggle(t.id)} />
                <span><Rich text={t.prompt} /></span>
                {detected.includes(t.id) && done.includes(t.id) && <span className="task-detected">{t0('✓ detected', '✓ detectado')}</span>}
              </label>
              {t.predict && <PredictBox p={t.predict} />}
              <div className="task-actions">
                <button aria-expanded={shown[t.id] === 'hint'} onClick={() => setShown({ ...shown, [t.id]: shown[t.id] === 'hint' ? undefined : 'hint' })}>
                  {shown[t.id] === 'hint' ? t0('Hide hint', 'Ocultar pista') : t0('Show hint', 'Ver pista')}
                </button>
                <button aria-expanded={shown[t.id] === 'answer'} onClick={() => setShown({ ...shown, [t.id]: shown[t.id] === 'answer' ? undefined : 'answer' })}>
                  {shown[t.id] === 'answer' ? t0('Hide answer', 'Ocultar respuesta') : t0('Show answer', 'Ver respuesta')}
                </button>
              </div>
              {shown[t.id] && (
                <p className="task-reveal"><Rich text={shown[t.id] === 'hint' ? t.hint : t.answer} /></p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
