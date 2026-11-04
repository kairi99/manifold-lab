import type { Surface } from '../types';

export function makeSphere(R = 1): Surface {
  const eps = 0.01;
  return {
    id: 'sphere',
    name: 'Sphere',
    coords: ['\\theta', '\\varphi'],
    domain: { u: [eps, Math.PI - eps], v: [0, 2 * Math.PI], periodicU: false, periodicV: true },
    position: (t, p) => [R * Math.sin(t) * Math.cos(p), R * Math.cos(t), R * Math.sin(t) * Math.sin(p)],
    du: (t, p) => [R * Math.cos(t) * Math.cos(p), -R * Math.sin(t), R * Math.cos(t) * Math.sin(p)],
    dv: (t, p) => [-R * Math.sin(t) * Math.sin(p), 0, R * Math.sin(t) * Math.cos(p)],
    metric: (t) => [[R * R, 0], [0, R * R * Math.sin(t) ** 2]],
    christoffel: (t) => {
      const c = Math.cos(t) / Math.sin(t);
      return [
        [[0, 0], [0, -Math.sin(t) * Math.cos(t)]],
        [[0, c], [c, 0]],
      ];
    },
    gaussK: () => 1 / (R * R),
    latex: {
      param: String.raw`\mathbf r(\theta,\varphi)=R(\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)`,
      metric: String.raw`g=\begin{pmatrix}R^2&0\\0&R^2\sin^2\theta\end{pmatrix}`,
      christoffel: String.raw`\Gamma^\theta_{\varphi\varphi}=-\sin\theta\cos\theta,\quad \Gamma^\varphi_{\theta\varphi}=\Gamma^\varphi_{\varphi\theta}=\cot\theta`,
    },
  };
}
