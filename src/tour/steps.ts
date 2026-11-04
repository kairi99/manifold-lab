import type { ModuleId } from '../state/store';

export interface TourStep {
  /** data-tour attribute value; null (or a missing element) = centered card */
  target: string | null;
  title: string;
  /** may contain $...$ inline math, rendered with KaTeX */
  body: string;
  /** switch to this module when the step is shown */
  module?: ModuleId;
}

export const STEPS: TourStep[] = [
  { target: null, title: 'Welcome to Manifold Lab',
    body: 'Explore surfaces by seeing their geometry: tangent spaces $T_pM$, the metric $g_{ij}$, Christoffel symbols $\\Gamma^k_{ij}$, parallel transport, geodesics, curvature, vector fields and Schwarzschild spacetime, with live equations that update as you move. This tour takes about a minute and you can skip it any time.' },
  { target: 'nav', title: 'Modules',
    body: 'Pick a module here. "Metric & tangent spaces" shows how lengths and angles are measured at a point. "Parallel transport" carries a vector around a loop and shows how it turns. "Geodesics" shoots the straightest possible curves from a point. "Curvature" compares intrinsic and extrinsic curvature. "Vector Fields & TM" explores flows, Lie brackets and zeros of vector fields. "Relativity" applies it all to Schwarzschild spacetime.' },
  { target: 'surface-picker', title: 'Choose a surface',
    body: 'Switch between surfaces such as the sphere, torus and saddle. The Gaussian curvature $K$, and so the equations, change with the surface. Choose "Custom…" to type your own surface, either parametric $(x,y,z)(u,v)$ or a graph $z=f(u,v)$, or load a classic such as the catenoid or Möbius band: every module then works on it, with exact derivatives.' },
  { target: 'canvas', title: 'The 3D view', module: 'metric',
    body: 'Left-drag to orbit, right-drag to pan, scroll to zoom. Drag the yellow point to move $p$ on the surface. Drag the tip of the vector to edit $V = V^i\\,\\partial_i$. Keyboard: focus the 3D view (Tab or click), then arrow keys move $p$ (Shift = bigger steps), [ and ] rotate $V$, + and − scale it.' },
  { target: 'panel', title: 'Live equations',
    body: 'This panel shows $g_{ij}$, $\\Gamma^k_{ij}$ and related numbers evaluated at the current $p$, and updates as you drag.' },
  { target: 'nav', title: 'Parallel transport', module: 'transport',
    body: 'Now the second module: slide a vector along a closed loop so that $\\nabla_{\\dot\\gamma} V = 0$, i.e. without turning it intrinsically, and see what happens when it comes back.' },
  { target: 'transport-controls', title: 'Choose a loop, then play',
    body: 'Choose a loop (latitude circle, triangle, or your own clicked points). Press play, or scrub the slider to step through the transport by hand.' },
  { target: 'holonomy', title: 'Holonomy',
    body: 'When the loop closes, the angle between the starting and returning vector is the holonomy. For a loop bounding a region $R$ it equals $\\iint_R K\\,dA$ (Gauss–Bonnet).' },
  { target: 'nav', title: 'Geodesics', module: 'geodesics',
    body: 'The third module integrates $\\ddot u^k + \\Gamma^k_{ij}\\,\\dot u^i \\dot u^j = 0$ from a point $p$ with initial velocity $V$. Fan several geodesics out and watch positive $K$ refocus them and negative $K$ spread them.' },
  { target: 'curv-egregium', title: 'Curvature', module: 'curvature',
    body: 'The fourth module paints $K$ over the surface. It computes $K$ twice: intrinsically, $K = R_{1212}/\\det g$ from the metric alone, and extrinsically, $K = \\kappa_1\\kappa_2$ from how the surface bends in $\\mathbb{R}^3$. They always agree: Theorema Egregium.' },
  { target: 'poincare-hopf', title: 'Vector fields & the tangent bundle', module: 'fields',
    body: 'The fifth module draws a vector field as a section $X: M \\to TM$ of the tangent bundle and animates its flow. It shows Killing fields ($\\mathcal{L}_X g = 0$), Lie brackets such as $[L_x, L_y] = -L_z$, and the Poincaré–Hopf theorem $\\sum \\operatorname{ind} = \\chi(M)$.' },
  { target: 'gr-presets', title: 'Relativity: Schwarzschild & Kerr', module: 'relativity',
    body: 'The sixth module leaves surfaces for spacetime: orbits and light rays are geodesics of $ds^2 = -(1-\\tfrac{2M}{r})dt^2 + \\tfrac{dr^2}{1-2M/r} + r^2 d\\Omega^2$. Pick a real object, such as Mercury, the star S2 around Sgr A*, or the M87* shadow, and compare the prediction with the observation.' },
  { target: 'gr-potential', title: 'Effective potential',
    body: 'Radial motion obeys $\\dot r^2 = E^2 - V_{\\text{eff}}(r)$. The plot marks the photon sphere $3M$, the marginally bound orbit $4M$ and the ISCO $6M$.' },
  { target: 'panel', title: 'Curvature in 4D', module: 'spacetime',
    body: 'Pick a spacetime and an event: the panel lists the exact $g_{\\mu\\nu}$, $\\Gamma^\\rho_{\\mu\\nu}$, $R_{\\rho\\sigma\\mu\\nu}$, $R_{\\mu\\nu}$ and $G_{\\mu\\nu}$ there and checks $G_{\\mu\\nu}=8\\pi T_{\\mu\\nu}$. Tidal drops a ring of particles into a black hole (geodesic deviation $\\ddot\\xi^i=-R^i{}_{0j0}\\xi^j$); Waves shows the $+$ and $\\times$ polarisations and the measured GW150914 strain.' },
  { target: 'panel', title: 'Causal structure & cosmology', module: 'cosmos',
    body: 'Penrose diagrams compactify spacetime so light moves at $45^\\circ$: follow an observer through the Schwarzschild horizon to $r=0$ in finite proper time. Cosmology draws the conformal diagram of our universe (Planck 2018) with the past light cone, particle and event horizons and the Hubble sphere.' },
  { target: null, title: 'You are set',
    body: 'Try the suggested tasks in each module. Press ? at any time to reopen this tour.' },
];
