import type { Surface } from '../types';

export function makeTorus(R = 1, r = 0.4): Surface {
  const tp = 2 * Math.PI;
  return {
    id: 'torus',
    name: 'Torus',
    nameEs: 'Toro',
    coords: ['u', 'v'],
    domain: { u: [0, tp], v: [0, tp], periodicU: true, periodicV: true },
    position: (u, v) => [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)],
    du: (u, v) => [-(R + r * Math.cos(v)) * Math.sin(u), 0, (R + r * Math.cos(v)) * Math.cos(u)],
    dv: (u, v) => [-r * Math.sin(v) * Math.cos(u), r * Math.cos(v), -r * Math.sin(v) * Math.sin(u)],
    metric: (_u, v) => [[(R + r * Math.cos(v)) ** 2, 0], [0, r * r]],
    christoffel: (_u, v) => {
      const a = R + r * Math.cos(v);
      const guv = (-r * Math.sin(v)) / a;
      return [
        [[0, guv], [guv, 0]],
        [[(a * Math.sin(v)) / r, 0], [0, 0]],
      ];
    },
    gaussK: (_u, v) => Math.cos(v) / (r * (R + r * Math.cos(v))),
    latex: {
      param: String.raw`\mathbf r(u,v)=\big((R+r\cos v)\cos u,\ r\sin v,\ (R+r\cos v)\sin u\big)`,
      metric: String.raw`g=\begin{pmatrix}(R+r\cos v)^2&0\\0&r^2\end{pmatrix}`,
      christoffel: String.raw`\Gamma^u_{uv}=\Gamma^u_{vu}=\frac{-r\sin v}{R+r\cos v},\quad \Gamma^v_{uu}=\frac{(R+r\cos v)\sin v}{r}`,
    },
  };
}
