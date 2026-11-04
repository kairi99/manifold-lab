import type { ModuleId } from '../state/store';

export interface Task { id: string; module: ModuleId; prompt: string; hint: string; answer: string }

// LaTeX allowed inside $...$ segments (rendered by SuggestedTasks)
export const TASKS: Task[] = [
  { id: 'm-pole', module: 'metric',
    prompt: 'On the sphere, move p toward a pole. Watch $g_{\\varphi\\varphi}$.',
    hint: 'For the sphere in $(\\theta,\\varphi)$ the metric is diagonal.',
    answer: '$g_{\\varphi\\varphi}=\\sin^2\\theta\\to 0$ at the poles. This is a coordinate singularity (all $\\varphi$ meet at one point), not a curvature one: $K=1$ everywhere.' },
  { id: 'm-orth', module: 'metric',
    prompt: 'Check $g_{12}=\\partial_u\\cdot\\partial_v$ on the sphere, torus and a saddle. Where is it zero?',
    hint: 'Coordinate curves that cross at right angles have $g_{12}=0$.',
    answer: 'On the sphere and torus $g_{12}=0$ everywhere (parameter curves are orthogonal). For a saddle given as a graph $z=f(u,v)$, $g_{12}=f_uf_v$, which is nonzero off the axes, so the coordinate grid is skewed there.' },
  { id: 'm-induced', module: 'metric',
    prompt: 'Compare $g(V,V)$ with the Euclidean $|V|^2$ of the drawn 3D arrow.',
    hint: 'The arrow is the pushforward $V^i\\partial_i$ in $\\mathbb{R}^3$.',
    answer: 'They agree: $g_{ij}V^iV^j=|V^i\\partial_i\\mathbf{r}|^2$. The metric is the one induced by the embedding.' },
  { id: 'm-torus', module: 'metric',
    prompt: 'On the torus, find where the Gaussian curvature $K$ changes sign.',
    hint: 'Move p around the tube angle $v$. Compare outer and inner equators.',
    answer: '$K=\\dfrac{\\cos v}{r(R+r\\cos v)}$ changes sign at $v=\\pm\\pi/2$: positive on the outer half ($|v|<\\pi/2$), negative on the inner half.' },
  { id: 't-pi', module: 'transport',
    prompt: 'On the sphere, find the latitude loop $\\theta_0$ whose holonomy is $\\pi$.',
    hint: 'The holonomy angle is the enclosed area times $K=1$: $2\\pi(1-\\cos\\theta_0)$.',
    answer: '$2\\pi(1-\\cos\\theta_0)=\\pi\\Rightarrow\\cos\\theta_0=\\tfrac12$, so $\\theta_0=60^\\circ$ from the pole (latitude $30^\\circ$).' },
  { id: 't-equator', module: 'transport',
    prompt: 'Why does the equator give zero net rotation?',
    hint: 'Is the equator a geodesic? What area does it enclose?',
    answer: 'The equator is a geodesic, so its tangent is itself parallel transported. The enclosed hemisphere has area $2\\pi$, so holonomy $=2\\pi\\equiv0$ (mod $2\\pi$).' },
  { id: 't-gb', module: 'transport',
    prompt: 'Pick the "triangle" (lune) path on the sphere, or draw your own loop. Compare the holonomy angle with the enclosed area.',
    hint: 'Gauss–Bonnet: the holonomy angle equals $\\iint_R K\\,dA$ over the enclosed region $R$.',
    answer: 'Holonomy angle $=\\iint K\\,dA$, which is the area for $K=1$. For a geodesic $n$-gon it also equals the angle excess $\\sum\\alpha_i-(n-2)\\pi$. The built-in path spans $\\theta\\in[0.05,\\pi/2]$, $\\varphi\\in[0,\\pi/2]$, so the area is $\\tfrac{\\pi}{2}\\cos 0.05\\approx 89.9^\\circ$.' },
  { id: 't-torus', module: 'transport',
    prompt: 'On the torus, transport around the outer equator ($v=0$), then the inner one ($v=\\pi$).',
    hint: 'Are these circles geodesics?',
    answer: 'Both circles are geodesics, so the vector keeps a constant angle to the tangent and returns unchanged. These loops are not contractible, so Gauss-Bonnet over a disc does not apply. K is positive outside and negative inside.' },
];

export const tasksFor = (m: ModuleId) => TASKS.filter((t) => t.module === m);
