import { useTr } from '../i18n';
import type { Surface } from '../math/types';
import { Rich, Tex, fmt } from './Tex';
import { DERIVATIONS } from './derivationData';

/** Collapsible worked derivation r → ∂r → g → ∂g → Γ for the four built-in surfaces; numeric summary for custom ones. */
export function Derivation({ surface, uv }: { surface: Surface; uv: [number, number] }) {
  const t = useTr();
  const d = DERIVATIONS[surface.id];
  const [cu, cv] = surface.coords;
  const g = surface.metric(uv[0], uv[1]), G = surface.christoffel(uv[0], uv[1]);
  return (
    <details className="derivation" style={{ margin: '8px 0' }}>
      <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>{t('Show the derivation', 'Mostrar la deducción')}</summary>
      {d ? (
        <ol style={{ paddingLeft: 18 }}>
          {d.steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 13 }}><Rich>{t(s.en, s.es)}</Rich></p>
              <Tex block>{s.tex}</Tex>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <p>{t(
            'For a custom surface the app does these steps for you with automatic differentiation: it evaluates r and its first and second partial derivatives exactly (no finite differences), forms g_ij = ∂_i r · ∂_j r, and uses Γ^k_ij = g^{kl} (∂_i∂_j r · ∂_l r), which equals the formula above.',
            'Para una superficie personalizada la aplicación hace estos pasos con diferenciación automática: evalúa r y sus derivadas parciales primeras y segundas de forma exacta (sin diferencias finitas), forma g_ij = ∂_i r · ∂_j r y usa Γ^k_ij = g^{kl} (∂_i∂_j r · ∂_l r), que equivale a la fórmula anterior.')}</p>
          <p>{t('Numeric values at p', 'Valores numéricos en p')} = ({fmt(uv[0])}, {fmt(uv[1])}):</p>
          <Tex block>{String.raw`g=\begin{pmatrix}${fmt(g[0][0], 4)}&${fmt(g[0][1], 4)}\\${fmt(g[1][0], 4)}&${fmt(g[1][1], 4)}\end{pmatrix}`}</Tex>
          <div className="readout">
            {[[0, 0, 0], [0, 0, 1], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 1]].map(([k, i, j]) => [
              <span key={`l${k}${i}${j}`}><Tex>{`\\Gamma^{${[cu, cv][k]}}_{${[cu, cv][i]}${[cu, cv][j]}}`}</Tex></span>,
              <span key={`v${k}${i}${j}`}>{fmt(G[k][i][j], 4)}</span>,
            ])}
          </div>
        </>
      )}
    </details>
  );
}
