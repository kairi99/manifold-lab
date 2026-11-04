import type { Surface } from '../types';

type F2 = (x: number, y: number) => number;

/** Monge patch z=f(x,y), Y-up: position [x, f, y]. K computed from the Hessian. */
export function makeGraph(
  id: string, name: string,
  f: F2, fx: F2, fy: F2, fxx: F2, fxy: F2, fyy: F2,
  latex: Surface['latex'],
  half = 1.2,
  nameEs?: string,
): Surface {
  return {
    id,
    name,
    nameEs,
    coords: ['x', 'y'],
    domain: { u: [-half, half], v: [-half, half], periodicU: false, periodicV: false },
    position: (x, y) => [x, f(x, y), y],
    du: (x, y) => [1, fx(x, y), 0],
    dv: (x, y) => [0, fy(x, y), 1],
    metric: (x, y) => {
      const a = fx(x, y), b = fy(x, y);
      return [[1 + a * a, a * b], [a * b, 1 + b * b]];
    },
    christoffel: (x, y) => {
      const p = [fx(x, y), fy(x, y)];
      const H = [[fxx(x, y), fxy(x, y)], [fxy(x, y), fyy(x, y)]];
      const w = 1 + p[0] * p[0] + p[1] * p[1];
      const G = (k: number): [[number, number], [number, number]] => [
        [(p[k] * H[0][0]) / w, (p[k] * H[0][1]) / w],
        [(p[k] * H[1][0]) / w, (p[k] * H[1][1]) / w],
      ];
      return [G(0), G(1)];
    },
    gaussK: (x, y) => {
      const w = 1 + fx(x, y) ** 2 + fy(x, y) ** 2;
      return (fxx(x, y) * fyy(x, y) - fxy(x, y) ** 2) / (w * w);
    },
    latex,
  };
}

const gammaLatex = String.raw`\Gamma^k_{ij}=\frac{f_k f_{ij}}{1+|\nabla f|^2}`;
const metricLatex = String.raw`g=\begin{pmatrix}1+f_x^2&f_xf_y\\f_xf_y&1+f_y^2\end{pmatrix}`;

export const saddle = makeGraph(
  'saddle', 'Saddle',
  (x, y) => (x * x - y * y) / 2, (x) => x, (_x, y) => -y,
  () => 1, () => 0, () => -1,
  { param: String.raw`\mathbf r(x,y)=\big(x,\ \tfrac12(x^2-y^2),\ y\big)`, metric: metricLatex,
    christoffel: String.raw`\Gamma^x_{xx}=\frac{x}{w},\ \Gamma^y_{xx}=\frac{-y}{w},\ \Gamma^x_{yy}=\frac{-x}{w},\ \Gamma^y_{yy}=\frac{y}{w},\ w=1+x^2+y^2` },
  1.2, 'Silla',
);

export const paraboloid = makeGraph(
  'paraboloid', 'Paraboloid',
  (x, y) => (x * x + y * y) / 2, (x) => x, (_x, y) => y,
  () => 1, () => 0, () => 1,
  { param: String.raw`\mathbf r(x,y)=\big(x,\ \tfrac12(x^2+y^2),\ y\big)`, metric: metricLatex,
    christoffel: gammaLatex + String.raw`\ \Rightarrow\ \Gamma^x_{xx}=\Gamma^x_{yy}=\frac{x}{w},\ \Gamma^y_{xx}=\Gamma^y_{yy}=\frac{y}{w},\ w=1+x^2+y^2` },
  1.2, 'Paraboloide',
);
