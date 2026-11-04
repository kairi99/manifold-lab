import { MODULES, type ModuleInfo } from '../state/modules';
import './home.css';

const GROUPS: { id: ModuleInfo['group']; title: string; sub: string }[] = [
  { id: 'surfaces', title: 'Surfaces', sub: 'Differential geometry in two dimensions' },
  { id: 'spacetime', title: 'Spacetime', sub: 'General relativity and cosmology' },
];

export function Home() {
  return (
    <main className="home">
      <header className="home-hero">
        <h1>Manifold Lab</h1>
        <p className="home-lead">
          An interactive explorer for differential geometry and general relativity. Every object on screen is
          tied to the equations that govern it: drag a point or a vector and the metric, Christoffel symbols,
          curvature and conserved quantities update live.
        </p>
        <p className="home-note">Choose a simulation. Each one opens with its own short guide, which you can skip and replay with ?.</p>
      </header>
      {GROUPS.map((g, gi) => (
        <section key={g.id} className="home-group" aria-labelledby={`grp-${g.id}`}>
          <h2 id={`grp-${g.id}`}>{g.title} <span>{g.sub}</span></h2>
          <ul className="home-grid">
            {MODULES.filter((m) => m.group === g.id).map((m) => (
              <li key={m.id}>
                <a className="home-card" href={`#${m.id}`}>
                  <span className="home-num">{String(MODULES.indexOf(m) + 1).padStart(2, '0')}</span>
                  <strong>{m.label}</strong>
                  <span>{m.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
          {gi === 0 && <p className="home-hint">The surface simulations share the sphere, torus, saddle, paraboloid and any surface you type yourself.</p>}
        </section>
      ))}
    </main>
  );
}
