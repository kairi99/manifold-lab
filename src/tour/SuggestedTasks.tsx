import { useState } from 'react';
import { MathText as Rich } from '../panels/Tex';
import type { ModuleId } from '../state/store';
import { tasksForLang } from './tasks';
import { useLang, useTr } from '../i18n';
import './tour.css';

const KEY = 'manifoldlab.tasksDone';

function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}


export function SuggestedTasks({ module }: { module: ModuleId }) {
  const lang = useLang(), t0 = useTr();
  const [done, setDone] = useState<string[]>(load);
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState<Record<string, 'hint' | 'answer' | undefined>>({});
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    save(next);
  };
  return (
    <section className="tasks">
      <button className="tasks-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} {t0('Suggested tasks', 'Tareas sugeridas')}
      </button>
      {open && (
        <ul>
          {tasksForLang(module, lang).map((t) => (
            <li key={t.id} className={done.includes(t.id) ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={done.includes(t.id)} onChange={() => toggle(t.id)} />
                <span><Rich text={t.prompt} /></span>
              </label>
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
