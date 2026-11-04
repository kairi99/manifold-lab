import type { Christoffel } from '../math/types';

export interface DerivStep { tex: string; en: string; es: string }
export interface Derivation {
  steps: DerivStep[];
  /** the final Γ printed in the last step, as a function: gamma(u,v)[k][i][j] = Γ^k_ij (tested against surface.christoffel) */
  gamma: (u: number, v: number) => Christoffel;
}

const FORMULA: DerivStep = {
  tex: String.raw`\Gamma^k_{ij}=\tfrac12\,g^{kl}\big(\partial_i g_{jl}+\partial_j g_{il}-\partial_l g_{ij}\big)`,
  en: 'The Christoffel symbols are built from g, its inverse and its first derivatives only.',
  es: 'Los símbolos de Christoffel se construyen solo con g, su inversa y sus primeras derivadas.',
};

// R = 1, r = 0.4 are the default radii of the built-in sphere and torus.
const sphere: Derivation = {
  steps: [
    { tex: String.raw`\mathbf r=R(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)`, en: 'Start from the parametrization.', es: 'Partimos de la parametrización.' },
    { tex: String.raw`\partial_\theta\mathbf r=R(\cos\theta\cos\varphi,\ \cos\theta\sin\varphi,\ -\sin\theta),\quad \partial_\varphi\mathbf r=R(-\sin\theta\sin\varphi,\ \sin\theta\cos\varphi,\ 0)`, en: 'Differentiate once in each coordinate: these span the tangent plane.', es: 'Derivamos una vez en cada coordenada: generan el plano tangente.' },
    { tex: String.raw`g_{\theta\theta}=R^2,\quad g_{\theta\varphi}=0,\quad g_{\varphi\varphi}=R^2\sin^2\theta`, en: 'Dot products of the tangent vectors give g_ij.', es: 'Los productos escalares de los vectores tangentes dan g_ij.' },
    { tex: String.raw`\partial_\theta g_{\varphi\varphi}=2R^2\sin\theta\cos\theta,\quad\text{all other }\partial_k g_{ij}=0`, en: 'g depends only on θ, and only g_φφ changes with it.', es: 'g depende solo de θ, y solo g_φφ cambia con ella.' },
    FORMULA,
    { tex: String.raw`g^{\theta\theta}=\frac1{R^2},\quad g^{\varphi\varphi}=\frac1{R^2\sin^2\theta}`, en: 'g is diagonal, so its inverse is too.', es: 'g es diagonal, así que su inversa también.' },
    { tex: String.raw`\Gamma^\theta_{\varphi\varphi}=\tfrac12 g^{\theta\theta}(-\partial_\theta g_{\varphi\varphi})=-\sin\theta\cos\theta,\quad \Gamma^\varphi_{\theta\varphi}=\tfrac12 g^{\varphi\varphi}\partial_\theta g_{\varphi\varphi}=\cot\theta`, en: 'Only terms with ∂_θ g_φφ survive.', es: 'Solo sobreviven los términos con ∂_θ g_φφ.' },
    { tex: String.raw`\Gamma^\theta_{\varphi\varphi}=-\sin\theta\cos\theta,\quad \Gamma^\varphi_{\theta\varphi}=\Gamma^\varphi_{\varphi\theta}=\cot\theta,\quad\text{others }0`, en: 'Final result (independent of R).', es: 'Resultado final (independiente de R).' },
  ],
  gamma: (t) => { const c = Math.cos(t) / Math.sin(t); return [[[0, 0], [0, -Math.sin(t) * Math.cos(t)]], [[0, c], [c, 0]]]; },
};

const torus: Derivation = {
  steps: [
    { tex: String.raw`\mathbf r=\big((R+r\cos v)\cos u,\ r\sin v,\ (R+r\cos v)\sin u\big)`, en: 'Start from the parametrization.', es: 'Partimos de la parametrización.' },
    { tex: String.raw`\partial_u\mathbf r=(R+r\cos v)(-\sin u,\ 0,\ \cos u),\quad \partial_v\mathbf r=r(-\sin v\cos u,\ \cos v,\ -\sin v\sin u)`, en: 'Differentiate once in each coordinate.', es: 'Derivamos una vez en cada coordenada.' },
    { tex: String.raw`g_{uu}=(R+r\cos v)^2,\quad g_{uv}=0,\quad g_{vv}=r^2`, en: 'Dot products give g_ij.', es: 'Los productos escalares dan g_ij.' },
    { tex: String.raw`\partial_v g_{uu}=-2r\sin v\,(R+r\cos v),\quad\text{all other }\partial_k g_{ij}=0`, en: 'Only g_uu depends on a coordinate (v).', es: 'Solo g_uu depende de una coordenada (v).' },
    FORMULA,
    { tex: String.raw`g^{uu}=\frac1{(R+r\cos v)^2},\quad g^{vv}=\frac1{r^2}`, en: 'Invert the diagonal metric.', es: 'Invertimos la métrica diagonal.' },
    { tex: String.raw`\Gamma^u_{uv}=\tfrac12 g^{uu}\partial_v g_{uu},\quad \Gamma^v_{uu}=-\tfrac12 g^{vv}\partial_v g_{uu}`, en: 'Keep the terms containing ∂_v g_uu.', es: 'Conservamos los términos con ∂_v g_uu.' },
    { tex: String.raw`\Gamma^u_{uv}=\Gamma^u_{vu}=\frac{-r\sin v}{R+r\cos v},\quad \Gamma^v_{uu}=\frac{(R+r\cos v)\sin v}{r},\quad\text{others }0`, en: 'Final result.', es: 'Resultado final.' },
  ],
  gamma: (_u, v) => {
    const R = 1, r = 0.4, a = R + r * Math.cos(v), guv = (-r * Math.sin(v)) / a;
    return [[[0, guv], [guv, 0]], [[(a * Math.sin(v)) / r, 0], [0, 0]]];
  },
};

/** Monge patch z = f(x,y), f_x = x, f_y = s·y (s = −1 saddle, +1 paraboloid), f_xx = 1, f_yy = s. */
function graphDeriv(s: 1 | -1): Derivation {
  const name = s > 0 ? 'paraboloid' : 'saddle';
  const f = s > 0 ? String.raw`\tfrac12(x^2+y^2)` : String.raw`\tfrac12(x^2-y^2)`;
  const sy = s > 0 ? 'y' : '-y';
  const sg = s > 0 ? '+' : '-';
  return {
    steps: [
      { tex: String.raw`\mathbf r(x,y)=(x,\ y,\ f),\quad f=${f}`, en: `Start from the ${name} as a graph.`, es: `Partimos ${s > 0 ? 'del paraboloide' : 'de la silla'} como gráfica.` },
      { tex: String.raw`\partial_x\mathbf r=(1,0,x),\quad \partial_y\mathbf r=(0,1,${sy})`, en: 'Differentiate once in each coordinate.', es: 'Derivamos una vez en cada coordenada.' },
      { tex: String.raw`g=\begin{pmatrix}1+x^2&${sg}xy\\${sg}xy&1+y^2\end{pmatrix},\quad \det g=w:=1+x^2+y^2`, en: 'Dot products give g_ij = δ_ij + f_i f_j.', es: 'Los productos escalares dan g_ij = δ_ij + f_i f_j.' },
      { tex: String.raw`\partial_k g_{ij}=f_{ik}f_j+f_if_{jk}`, en: 'Product rule on g_ij = δ_ij + f_i f_j.', es: 'Regla del producto sobre g_ij = δ_ij + f_i f_j.' },
      FORMULA,
      { tex: String.raw`\tfrac12\big(\partial_i g_{jl}+\partial_j g_{il}-\partial_l g_{ij}\big)=f_{ij}f_l`, en: 'Substitute: four of the six terms cancel in pairs.', es: 'Sustituimos: cuatro de los seis términos se cancelan por pares.' },
      { tex: String.raw`g^{-1}=I-\frac{\nabla f\,\nabla f^{T}}{w}\ \Rightarrow\ g^{kl}f_l=\frac{f_k}{w}`, en: 'The inverse metric (Sherman–Morrison) turns f_l into f_k / w.', es: 'La métrica inversa (Sherman–Morrison) convierte f_l en f_k / w.' },
      { tex: String.raw`\Gamma^k_{ij}=\frac{f_k f_{ij}}{w}`, en: 'Combine the last two steps.', es: 'Combinamos los dos últimos pasos.' },
      { tex: s > 0
        ? String.raw`\Gamma^x_{xx}=\Gamma^x_{yy}=\frac{x}{w},\quad \Gamma^y_{xx}=\Gamma^y_{yy}=\frac{y}{w},\quad\text{others }0`
        : String.raw`\Gamma^x_{xx}=\frac{x}{w},\ \Gamma^y_{xx}=\frac{-y}{w},\ \Gamma^x_{yy}=\frac{-x}{w},\ \Gamma^y_{yy}=\frac{y}{w},\quad\text{others }0`,
      en: `Insert f_xx = 1, f_yy = ${s}, f_xy = 0, f_x = x, f_y = ${sy}.`, es: `Insertamos f_xx = 1, f_yy = ${s}, f_xy = 0, f_x = x, f_y = ${sy}.` },
    ],
    gamma: (x, y) => {
      const w = 1 + x * x + y * y;
      return [[[x / w, 0], [0, (s * x) / w]], [[(s * y) / w, 0], [0, y / w]]];
    },
  };
}

export const DERIVATIONS: Record<string, Derivation> = {
  sphere,
  torus,
  saddle: graphDeriv(-1),
  paraboloid: graphDeriv(1),
};
