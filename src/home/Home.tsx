import { useEffect, useState } from 'react';
import { MODULES } from '../state/modules';
import { useLang, useTr, T } from '../i18n';
import { EXTRA_COPY, PATH, SHORT, loadDone, progressOf } from './path';
import './home.css';

export function Home() {
  const lang = useLang(), t = useTr();
  const [done, setDone] = useState(loadDone);
  useEffect(() => {
    const h = () => setDone(loadDone());
    window.addEventListener('manifoldlab:tasks', h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener('manifoldlab:tasks', h); window.removeEventListener('storage', h); };
  }, []);
  const known = new Set(MODULES.map((m) => m.id as string));
  // path order first, then any registered module the path does not mention
  const order = [...PATH.map((p) => p.id).filter((id) => known.has(id)), ...MODULES.map((m) => m.id as string).filter((id) => !PATH.some((p) => p.id === id))];
  const short = (id: string) => (SHORT[id] ? t(SHORT[id][0], SHORT[id][1]) : id);
  return (
    <main className="home">
      <header className="home-hero">
        <h1>Manifold Lab</h1>
        <p className="home-lead">
          <T en="An interactive explorer for differential geometry and general relativity. Every object on screen is tied to the equations that govern it: drag a point or a vector and the metric, Christoffel symbols, curvature and conserved quantities update live."
            es="Un explorador interactivo de geometría diferencial y relatividad general. Cada objeto en pantalla está ligado a las ecuaciones que lo gobiernan: arrastra un punto o un vector y la métrica, los símbolos de Christoffel, la curvatura y las cantidades conservadas se actualizan en vivo." />
        </p>
        <p className="home-note"><T en="Follow the path from the first card, or jump to any simulation. Each one opens with its own short guide, which you can skip and replay with ?."
          es="Sigue el camino desde la primera tarjeta, o salta a cualquier simulación. Cada una se abre con su propia guía breve, que puedes saltar y repetir con ?." /></p>
      </header>
      <section className="home-group" aria-labelledby="home-path">
        <h2 id="home-path">{t('Learning path', 'Ruta de aprendizaje')} <span>{t('Start here, then follow the numbers', 'Empieza aquí y sigue los números')}</span></h2>
        <ol className="home-grid">
          {order.map((id, i) => {
            const m = MODULES.find((x) => x.id === id)!, x = EXTRA_COPY[id];
            const needs = (PATH.find((p) => p.id === id)?.needs ?? []).filter((n) => known.has(n));
            const { n, total, frac } = progressOf(id, done);
            return (
              <li key={id}>
                <a className="home-card" href={`#${id}`}>
                  <span className="home-num">
                    {String(i + 1).padStart(2, '0')}{i === 0 && <em>{t('Start here', 'Empieza aquí')}</em>}
                  </span>
                  <strong>{lang === 'es' ? (x?.labelEs ?? m.labelEs) : (x?.label ?? m.label)}</strong>
                  <span>{lang === 'es' ? (x?.blurbEs ?? m.blurbEs) : (x?.blurb ?? m.blurb)}</span>
                  <span className="home-needs">{needs.length ? `${t('Needs', 'Requiere')}: ${needs.map(short).join(', ')}` : t('No prerequisites', 'Sin requisitos')}</span>
                  {total > 0 && (
                    <span className="home-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={n}
                      aria-label={t(`Tasks done: ${n} of ${total}`, `Tareas hechas: ${n} de ${total}`)}>
                      <span className="home-bar"><span style={{ width: `${frac * 100}%` }} /></span>
                      <span className="home-count">{n}/{total}</span>
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        <p className="home-hint"><T en="The surface simulations share the sphere, torus, saddle, paraboloid and any surface you type yourself." es="Las simulaciones de superficies comparten la esfera, el toro, la silla, el paraboloide y cualquier superficie que escribas tú mismo." /></p>
      </section>
    </main>
  );
}
