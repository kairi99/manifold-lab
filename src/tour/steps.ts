import type { ModuleId } from '../state/store';

export interface TourStep {
  /** data-tour attribute value; null (or a missing element) = centered card */
  target: string | null;
  title: string;
  /** may contain $...$ inline math, rendered with KaTeX */
  body: string;
}

// steps shared by several guides
const VIEW_3D: TourStep = { target: 'canvas', title: 'The 3D view',
  body: 'Left-drag to orbit, right-drag to pan, scroll or pinch to zoom. Drag the yellow point to move $p$ on the surface and the tip of the arrow to edit $V = V^i\\,\\partial_i$. Keyboard: focus the view (Tab or click), then arrows move $p$ (Shift = bigger steps), [ and ] rotate $V$, + and − scale it.' };
const PICKER: TourStep = { target: 'surface-picker', title: 'Choose a surface',
  body: 'Switch between the sphere, torus, saddle and paraboloid, or choose "Custom…" to type your own surface, parametric $(x,y,z)(u,v)$ or a graph $z=f(u,v)$, or load a classic such as the catenoid. The geometry is derived exactly for whatever you pick.' };
const ORBIT_3D: TourStep = { target: 'canvas', title: 'The 3D view',
  body: 'Left-drag to orbit, right-drag to pan, scroll or pinch to zoom.' };
const END: TourStep = { target: 'nav', title: 'Other simulations',
  body: 'Switch simulation with these tabs, or click "Manifold Lab" to go back to the start page. Each simulation has its own short guide; press ? to replay this one. Suggested tasks at the bottom of the panel give you things to try.' };

const THEORY_STEP: TourStep = { target: 'theory', title: 'Motivation & theory',
  body: 'This button opens the background: why the concept matters, the key equations and theorems, and further reading.' };

export const TOURS: Record<ModuleId, TourStep[]> = {
  metric: [
    { target: null, title: 'Metric & tangent spaces',
      body: 'At every point $p$ of a surface sits a tangent plane $T_pM$ spanned by $\\partial_u, \\partial_v$. The metric $g_{ij} = \\partial_i \\cdot \\partial_j$ measures lengths and angles there, and the Christoffel symbols $\\Gamma^k_{ij}$ say how the basis turns as $p$ moves.' },
    VIEW_3D, PICKER,
    { target: 'metric-readout', title: 'Live equations',
      body: 'These are $g_{ij}$, $\\Gamma^k_{ij}$ and the length of $V$ evaluated at the current $p$. Compare $|V|^2 = g_{ij}V^iV^j$ with the Euclidean length of the arrow: they agree.' },
    THEORY_STEP, END,
  ],
  transport: [
    { target: null, title: 'Parallel transport',
      body: 'Slide a vector along a closed loop so that $\\nabla_{\\dot\\gamma} V = 0$, i.e. without turning it intrinsically, and see how it comes back rotated.' },
    VIEW_3D, PICKER,
    { target: 'transport-controls', title: 'Choose a loop, then play',
      body: 'Pick a loop (latitude circle, triangle, or your own clicked points). Press play, or scrub the slider to step through the transport by hand.' },
    { target: 'holonomy', title: 'Holonomy',
      body: 'When the loop closes, the angle between the starting and returning vector is the holonomy. For a loop bounding a region $R$ it equals $\\iint_R K\\,dA$ (Gauss–Bonnet).' },
    THEORY_STEP, END,
  ],
  geodesics: [
    { target: null, title: 'Geodesics',
      body: 'Geodesics solve $\\ddot u^k + \\Gamma^k_{ij}\\,\\dot u^i \\dot u^j = 0$: the straightest curves on the surface, starting at $p$ with velocity $V$.' },
    VIEW_3D, PICKER,
    { target: 'geo-controls', title: 'Fan them out',
      body: 'Shoot several geodesics at once. Positive $K$ refocuses them (conjugate points), negative $K$ spreads them apart.' },
    THEORY_STEP, END,
  ],
  curvature: [
    { target: null, title: 'Curvature',
      body: 'The surface is painted by its Gaussian curvature $K$: warm for $K>0$, cool for $K<0$.' },
    VIEW_3D, PICKER,
    { target: 'curv-egregium', title: 'Theorema Egregium',
      body: '$K$ is computed twice: intrinsically, $K = R_{1212}/\\det g$ from the metric alone, and extrinsically, $K = \\kappa_1\\kappa_2$ from how the surface bends in $\\mathbb{R}^3$. They always agree.' },
    THEORY_STEP, END,
  ],
  fields: [
    { target: null, title: 'Vector fields & the tangent bundle',
      body: 'A vector field is a section $X: M \\to TM$ of the tangent bundle. Pick one and watch its flow move particles over the surface.' },
    VIEW_3D, PICKER,
    { target: 'poincare-hopf', title: 'Poincaré–Hopf',
      body: 'The indices of the zeros of a field add up to the Euler characteristic, $\\sum \\operatorname{ind} = \\chi(M)$. The panel also shows Killing fields ($\\mathcal{L}_X g = 0$) and Lie brackets such as $[L_x, L_y] = -L_z$.' },
    THEORY_STEP, END,
  ],
  relativity: [
    { target: null, title: 'Relativity: Schwarzschild & Kerr',
      body: 'Orbits and light rays are geodesics of $ds^2 = -(1-\\tfrac{2M}{r})dt^2 + \\tfrac{dr^2}{1-2M/r} + r^2 d\\Omega^2$. Compare the predictions with real observations.' },
    ORBIT_3D,
    { target: 'views', title: 'Views',
      body: 'Orbits and Light integrate timelike and null geodesics. Flamm shows the embedded spatial slice. Kerr adds spin: horizons, ergosphere and ISCO. Image ray-traces a black hole. Clocks covers redshift, Shapiro delay and frame dragging.' },
    { target: 'gr-presets', title: 'Real objects',
      body: 'Load a real system, such as Mercury, the star S2 around Sgr A*, or the Hulse–Taylor pulsar, and compare the predicted precession with the measured one.' },
    { target: 'gr-potential', title: 'Effective potential',
      body: 'Radial motion obeys $\\dot r^2 = E^2 - V_{\\text{eff}}(r)$. The plot marks the photon sphere $3M$, the marginally bound orbit $4M$ and the ISCO $6M$.' },
    THEORY_STEP, END,
  ],
  spacetime: [
    { target: null, title: 'Curvature in 4D',
      body: 'The full curvature of spacetime, computed exactly at an event of your choice for Minkowski, Schwarzschild, Kerr, Reissner–Nordström, de Sitter and ΛCDM.' },
    ORBIT_3D,
    { target: 'views', title: 'Three views',
      body: 'Tensors lists $g_{\\mu\\nu}$, $\\Gamma^\\rho_{\\mu\\nu}$, $R_{\\rho\\sigma\\mu\\nu}$, $R_{\\mu\\nu}$ and $G_{\\mu\\nu}$ and checks $G_{\\mu\\nu}=8\\pi T_{\\mu\\nu}$. Tidal drops a ring of particles into a black hole ($\\ddot\\xi^i=-R^i{}_{0j0}\\xi^j$). Waves shows the $+$ and $\\times$ polarisations and the measured GW150914 strain.' },
    { target: 'panel', title: 'Controls and numbers',
      body: 'Choose the spacetime and the event here; every tensor component and invariant updates as you move.' },
    THEORY_STEP, END,
  ],
  cosmos: [
    { target: null, title: 'Causal structure & cosmology',
      body: 'Conformal diagrams squeeze infinite spacetimes into a finite picture while keeping light rays at $45^\\circ$, so causal structure can be read off at a glance.' },
    { target: 'views', title: 'Two views',
      body: 'Penrose diagrams shows Minkowski and the maximally extended Schwarzschild spacetime: follow an observer through the horizon to $r=0$ in finite proper time. Cosmology draws our universe (Planck 2018) with the past light cone, particle and event horizons and the Hubble sphere.' },
    { target: 'canvas', title: 'The diagram',
      body: 'Drag to pan, scroll or pinch to zoom. Light cones and observers in the diagram follow the controls in the panel.' },
    THEORY_STEP, END,
  ],
};
