import { MODULES, type ModuleInfo } from '../state/modules';
import { useLang, useTr, T } from '../i18n';
import './home.css';

const GROUPS: { id: ModuleInfo['group']; title: string; titleEs: string; sub: string; subEs: string }[] = [
  { id: 'surfaces', title: 'Surfaces', titleEs: 'Superficies', sub: 'Differential geometry in two dimensions', subEs: 'Geometría diferencial en dos dimensiones' },
  { id: 'spacetime', title: 'Spacetime', titleEs: 'Espaciotiempo', sub: 'General relativity and cosmology', subEs: 'Relatividad general y cosmología' },
];

export function Home() {
  const lang = useLang(), t = useTr();
  return (
    <main className="home">
      <header className="home-hero">
        <h1>Manifold Lab</h1>
        <p className="home-lead">
          <T en="An interactive explorer for differential geometry and general relativity. Every object on screen is tied to the equations that govern it: drag a point or a vector and the metric, Christoffel symbols, curvature and conserved quantities update live."
            es="Un explorador interactivo de geometría diferencial y relatividad general. Cada objeto en pantalla está ligado a las ecuaciones que lo gobiernan: arrastra un punto o un vector y la métrica, los símbolos de Christoffel, la curvatura y las cantidades conservadas se actualizan en vivo." />
        </p>
        <p className="home-note"><T en="Choose a simulation. Each one opens with its own short guide, which you can skip and replay with ?."
          es="Elige una simulación. Cada una se abre con su propia guía breve, que puedes saltar y repetir con ?." /></p>
      </header>
      {GROUPS.map((g, gi) => (
        <section key={g.id} className="home-group" aria-labelledby={`grp-${g.id}`}>
          <h2 id={`grp-${g.id}`}>{t(g.title, g.titleEs)} <span>{t(g.sub, g.subEs)}</span></h2>
          <ul className="home-grid">
            {MODULES.filter((m) => m.group === g.id).map((m) => (
              <li key={m.id}>
                <a className="home-card" href={`#${m.id}`}>
                  <span className="home-num">{String(MODULES.indexOf(m) + 1).padStart(2, '0')}</span>
                  <strong>{lang === 'es' ? m.labelEs : m.label}</strong>
                  <span>{lang === 'es' ? m.blurbEs : m.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
          {gi === 0 && <p className="home-hint"><T en="The surface simulations share the sphere, torus, saddle, paraboloid and any surface you type yourself." es="Las simulaciones de superficies comparten la esfera, el toro, la silla, el paraboloide y cualquier superficie que escribas tú mismo." /></p>}
        </section>
      ))}
    </main>
  );
}
