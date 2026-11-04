import type { Surface } from './types';

/** Flamm paraboloid r(z) = r_s + z²/(4 r_s), r_s = 2 (M = 1). Upper sheet z>0 <-> r>2. */
export const rOfZ = (z: number): number => 2 + (z * z) / 8;
export const zOfR = (r: number): number => Math.sqrt(8 * (r - 2));

/**
 * Spatial slice t=const, θ=π/2 of Schwarzschild, both sheets (Einstein–Rosen bridge).
 * g = A dz² + r² dφ², A = 1 + (z/4)² = r/2 = (dr/dz)² + 1; equals dr²/(1−2/r) + r²dφ².
 */
export function makeFlamm(zmax = 8): Surface {
  const tp = 2 * Math.PI;
  const A = (z: number) => 1 + (z * z) / 16;
  return {
    id: 'flamm',
    name: 'Flamm paraboloid',
    coords: ['z', '\\varphi'],
    domain: { u: [-zmax, zmax], v: [0, tp], periodicU: false, periodicV: true },
    position: (z, p) => [rOfZ(z) * Math.cos(p), z, rOfZ(z) * Math.sin(p)],
    du: (z, p) => [(z / 4) * Math.cos(p), 1, (z / 4) * Math.sin(p)],
    dv: (z, p) => [-rOfZ(z) * Math.sin(p), 0, rOfZ(z) * Math.cos(p)],
    metric: (z) => [[A(z), 0], [0, rOfZ(z) ** 2]],
    christoffel: (z) => {
      const r = rOfZ(z), a = A(z);
      const Bp = (r * z) / 2; // d(r²)/dz
      const gzzz = z / 8 / (2 * a);
      const gzpp = -Bp / (2 * a);
      const gpzp = Bp / (2 * r * r);
      return [
        [[gzzz, 0], [0, gzpp]],
        [[0, gpzp], [gpzp, 0]],
      ];
    },
    gaussK: (z) => -1 / rOfZ(z) ** 3,
    latex: {
      param: String.raw`\mathbf r(z,\varphi)=\big(r\cos\varphi,\ z,\ r\sin\varphi\big),\quad r=2M+\frac{z^2}{8M}`,
      metric: String.raw`ds^2=\frac{dr^2}{1-2M/r}+r^2d\varphi^2=\Big(1+\frac{z^2}{16M^2}\Big)dz^2+r^2d\varphi^2`,
      christoffel: String.raw`\Gamma^z_{zz}=\frac{A'}{2A},\ \Gamma^z_{\varphi\varphi}=-\frac{(r^2)'}{2A},\ \Gamma^\varphi_{z\varphi}=\frac{(r^2)'}{2r^2},\quad A=1+\tfrac{z^2}{16M^2},\ K=-\frac{M}{r^3}`,
    },
  };
}
