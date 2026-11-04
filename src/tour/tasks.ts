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

TASKS.push(
  { id: 'g-conjugate', module: 'geodesics',
    prompt: 'On the sphere, set length to $1\\pi$ and fan angle to $60^\\circ$. Where do the geodesics meet?',
    hint: 'Watch the marked point $-p$ as playback reaches $s=\\pi$.',
    answer: 'All geodesics from $p$ reconverge at the antipode $-p$ at $s=\\pi$: a conjugate point. The Jacobi field is $J(s)=\\sin(\\sqrt K\\,s)/\\sqrt K$ ($=\\sin s$ for the unit sphere), which vanishes again at $s=\\pi/\\sqrt K$.' },
  { id: 'g-saddle', module: 'geodesics',
    prompt: 'Choose the saddle and play a fan. Do the geodesics converge or spread?',
    hint: 'Compare the spread readout with the sphere case. Sign of $K$?',
    answer: 'They diverge: with $K<0$ the Jacobi equation $J\'\'=-KJ$ gives $(|J|)\'\'\\ge 0$, so $|J|$ is convex, grows at least linearly, and never returns to zero: no conjugate points.' },
  { id: 'g-torus', module: 'geodesics',
    prompt: 'On the torus, launch a geodesic at a small angle to the outer equator ($v=0$). How far into the tube does it go?',
    hint: 'Clairaut: $c=(R+r\\cos v)^2\\dot u$ is conserved. Where does $\\dot u$ reach its largest allowed value?',
    answer: 'It oscillates about the outer equator. Since $|\\dot u|\\le 1/(R+r\\cos v)$ forces $|c|\\le R+r\\cos v$, it turns where $R+r\\cos v=|c|$.' },
  { id: 'g-pole', module: 'geodesics',
    prompt: 'On the sphere, aim the direction handle along a meridian. What happens at the pole?',
    hint: 'A meridian is a great circle. Is the pole special on the sphere itself?',
    answer: 'The geodesic passes straight through the pole. The singularity is only in the $(\\theta,\\varphi)$ chart ($g_{\\varphi\\varphi}=\\sin^2\\theta=0$); the surface is smooth there with $K=1$.' },
);

TASKS.push(
  { id: 'c-torus', module: 'curvature',
    prompt: 'On the torus, move p over the outer part, the inner part, and the top and bottom circles ($v=\\pm\\pi/2$). What is the sign of $K$?',
    hint: 'Watch the heatmap colour and the intrinsic K readout.',
    answer: '$K>0$ on the outer half ($|v|<\\pi/2$), $K<0$ on the inner half, and $K=0$ on the top and bottom circles $v=\\pm\\pi/2$, where $\\cos v=0$.' },
  { id: 'c-saddle', module: 'curvature',
    prompt: 'On the saddle, put p at the origin. Read $H$, $\\kappa_1$, $\\kappa_2$.',
    hint: 'Compare $H=(\\kappa_1+\\kappa_2)/2$ with the principal curvatures.',
    answer: '$\\kappa_1=-1$, $\\kappa_2=1$, so $H=0$: the saddle is minimal at the origin, and $K=\\kappa_1\\kappa_2=-1<0$.' },
  { id: 'c-sphere', module: 'curvature',
    prompt: 'On the sphere, check several points, then compare the geodesic circle circumference $C$ with $2\\pi\\rho$.',
    hint: 'Is $\\kappa_1=\\kappa_2$? Try $\\rho=1$.',
    answer: 'Every point is umbilic ($\\kappa_1=\\kappa_2=1$, $K=1$). A geodesic circle has $C=2\\pi\\sin\\rho<2\\pi\\rho$, matching $1-K\\rho^2/6$ for small $\\rho$.' },
  { id: 'c-egregium', module: 'curvature',
    prompt: 'Theorema Egregium: bending a flat sheet into a cylinder keeps $K$. Use the intrinsic and extrinsic numbers on each surface to see what is preserved.',
    hint: 'Compare K intrinsic and K extrinsic and their difference at several points.',
    answer: 'The two values agree everywhere (difference ~0), although II changes with the embedding. $K$ depends only on $g$, so an isometric bending (flat to cylinder) keeps $K=0$ even though $\\kappa_1\\ne0$.' },
);

TASKS.push(
  { id: 'f-hairy', module: 'fields',
    prompt: 'On the sphere, try every preset field. Does any have no zeros? Add up the indices.',
    hint: 'Read the Poincaré–Hopf table; compare with $\\chi(S^2)$.',
    answer: 'Every preset has zeros and the indices sum to $2=\\chi(S^2)$. The dipole has a single zero of index $2$. By the hairy ball theorem no field on $S^2$ is nowhere zero.' },
  { id: 'f-torus', module: 'fields',
    prompt: 'On the torus pick $\\partial_u$, then the gradient of the side field (gradSide). Compare zeros and $\\chi$.',
    hint: 'Count zeros and their signs.',
    answer: '$\\partial_u$ has no zeros, consistent with $\\chi(T^2)=0$. gradSide has a max, a min and 2 saddles: $1+1-1-1=0=\\chi$.' },
  { id: 'f-so3', module: 'fields',
    prompt: 'On the sphere set X = Lx and Y = Ly, then vary t. What is $[X,Y]$?',
    hint: 'Compare the bracket with the other rotation fields; gap$/t^2$ should approach it.',
    answer: '$[L_x,L_y]=-L_z$ and cyclic, with $L_i=\\epsilon_{ijk}x_j\\partial_k$ in the frame where $z$ is the polar axis. The rotation fields form $\\mathfrak{so}(3)$, the angular momentum algebra; the commutator gap is $\\approx t^2[X,Y]$. (Quantum mechanics writes $\\hat L_i=-i\\hbar L_i$, turning this into $[\\hat L_x,\\hat L_y]=i\\hbar\\hat L_z$.)' },
  { id: 'f-killing', module: 'fields',
    prompt: 'Compare $\\mathcal L_Xg$ and $\\operatorname{div}X$ for Lz and for gradHeight on the sphere.',
    hint: 'Which one has $\\mathcal L_Xg=0$?',
    answer: 'Lz is Killing: $\\mathcal L_Xg=0$, $\\operatorname{div}X=0$, its flow is rotation (isometry). gradHeight has $\\operatorname{div}X\\ne0$, so its flow does not preserve area, hence not an isometry.' },
);

TASKS.push(
  { id: 'r-mercury', module: 'relativity',
    prompt: 'Choose the Sun and the Mercury preset. Compare the predicted perihelion advance with the observed value, then ask why it is so small.',
    hint: 'Read $a/M$ in the panel. The shift per orbit is $6\\pi M/[a(1-e^2)]$.',
    answer: 'Mercury has $a/M\\approx 3.9\\times10^7$, so the shift is only $\\approx 5\\times10^{-7}$ rad ($0.10^{\\prime\\prime}$) per orbit. Over $\\approx 415$ orbits per century this is $\\approx 43^{\\prime\\prime}$/century, matching the observed GR contribution. The scene shows a strong-field toy with the same eccentricity.' },
  { id: 'r-isco', module: 'relativity',
    prompt: 'Pick the generic black hole, custom orbit, with $r_a$ just above $r_p=6$. Then lower $r_p$ just below $6M$.',
    hint: 'Watch the potential plot: the minimum of $V_{\\rm eff}$ where a circular orbit sits.',
    answer: 'For $L^2>12M^2$ $V_{\\rm eff}$ has a minimum (stable circular orbit) and a maximum. At $L=2\\sqrt3\\,M$ they merge at $r=6M$ (the ISCO, $E=\\sqrt{8/9}$). For $r_p<6M$ no stable circular orbit exists and a near-circular orbit spirals in and plunges.' },
  { id: 'r-photon', module: 'relativity',
    prompt: 'In the light view, sweep $b$ through $3\\sqrt3\\,M\\approx5.196M$. What changes? How big is the shadow of Sgr A*?',
    hint: 'Look for the red (captured) rays and the maximum of the light potential, $E^2=1$ versus $L^2/27M^2$.',
    answer: 'The light potential peaks at $r=3M$ with height $L^2/27M^2$; rays with $b<b_c=3\\sqrt3\\,M$ are captured, larger ones are deflected. The shadow has angular radius $b_c/D$; for Sgr A* the diameter $2b_c/D\\approx 53\\,\\mu$as, consistent with EHT ($51.8\\pm2.3\\,\\mu$as).' },
  { id: 'r-flamm', module: 'relativity',
    prompt: 'Open the Flamm view. The slice has $K=-M/r^3\\ne0$, yet the vacuum Ricci tensor vanishes. How can both hold?',
    hint: 'Which object is curved: the 2D spatial slice or spacetime? Are the orbits geodesics of the slice?',
    answer: 'The slice $t=$const is curved ($K=-M/r^3$) but spacetime is Ricci flat: $R_{\\mu\\nu}=0$ only says the trace parts cancel between space and time curvature, the Weyl tensor survives (tides). Orbits are geodesics of the 4D metric, not of the slice, so drawn on the paraboloid they are not geodesics of that surface.' },
);

TASKS.push(
  { id: 'r-kerr-isco', module: 'relativity',
    prompt: 'In the Kerr view move the spin from $a=0$ to $a=0.998$ (prograde) and read the ISCO radius and the efficiency $1-E_{\\rm ISCO}$.',
    hint: 'Watch the ISCO ring shrink toward the horizon and the $E_{\\rm ISCO}$ readout.',
    answer: 'At $a=0$ the ISCO is $6M$ with $E=\\sqrt{8/9}$, efficiency $5.7\\%$. At $a=0.998$ the prograde ISCO drops to about $1.24M$ and the efficiency rises to about $32\\%$, because frame dragging lets matter orbit closer and release more binding energy.' },
  { id: 'r-shadow', module: 'relativity',
    prompt: 'In the Image view compare the shadow curve at $a=0$ with $a=0.99$ at inclination $89^\\circ$ (edge-on).',
    hint: 'Turn the overlay on and look at the left and right edges of the dark region.',
    answer: 'At $a=0$ the shadow is a circle of radius $3\\sqrt3\\,M$ for every inclination. At $a=0.99$ edge-on it is flattened on the side of the approaching disk (a D shape) and displaced, because the prograde photon orbit lies much closer to the hole than the retrograde one.' },
  { id: 'r-gpb', module: 'relativity',
    prompt: 'In the Clocks view choose Gravity Probe B. Compare the frame-dragging prediction with the measurement.',
    hint: 'Read the table: formula, published prediction, observed.',
    answer: 'GP-B measured $37.2\\pm7.2$ mas/yr against the GR prediction $39.2$ mas/yr (about a 19% measurement), consistent with GR; the geodetic term $6601.8\\pm18.3$ vs $6606.1$ mas/yr is far more precise.' },
);

TASKS.push(
  { id: 's-mink', module: 'spacetime',
    prompt: 'Choose Minkowski (spherical coordinates). Count the nonzero $\\Gamma$ and the nonzero Riemann components. Then choose Schwarzschild.',
    hint: 'Are the Christoffel symbols a tensor?',
    answer: 'Minkowski in $(t,r,\\theta,\\varphi)$ has nonzero $\\Gamma$ (e.g. $\\Gamma^r_{\\theta\\theta}=-r$) but $R^\\rho{}_{\\sigma\\mu\\nu}=0$: $\\Gamma$ is coordinate-dependent, curvature is not. Schwarzschild has $R_{\\mu\\nu}=0$ yet $R_{\\rho\\sigma\\mu\\nu}\\ne0$: vacuum curvature is pure Weyl, $C^2=K=48M^2/r^6$.' },
  { id: 's-spaghetti', module: 'spacetime',
    prompt: 'In Tidal compare the tidal acceleration across a 2 m body at the horizon of a 10 $M_\\odot$ hole and of Sgr A*.',
    hint: 'At $r=2M$, $\\Delta a = 2GM L/r^3 \\propto 1/M^2$.',
    answer: 'About $2\\times10^8$ m/s² for 10 $M_\\odot$ (spaghettified well before the horizon) and about $10^{-3}$ m/s² for Sgr A* (nothing felt at the horizon). Tides scale as $M/r^3$, which at $r=2M$ is $1/(8M^2)$.' },
  { id: 's-gw', module: 'spacetime',
    prompt: 'In Waves switch between $+$ and $\\times$. Then read the chirp mass of GW150914 from the component masses.',
    hint: 'Rotate the $+$ pattern by $45^\\circ$. $\\mathcal M=(m_1m_2)^{3/5}/(m_1+m_2)^{1/5}$.',
    answer: '$\\times$ is $+$ rotated by $45^\\circ$ (spin-2: a $180^\\circ$ rotation maps each pattern to itself). With $m_1=36$, $m_2=29\\,M_\\odot$, $\\mathcal M\\approx28\\,M_\\odot$, the combination that sets $\\dot f\\propto\\mathcal M^{5/3}f^{11/3}$ in the inspiral.' },
  { id: 'c-infall', module: 'cosmos',
    prompt: 'In the Penrose view drop an observer from $r_0=10M$. Compare Schwarzschild $t$ and proper time $\\tau$ at the horizon.',
    hint: 'Watch the readouts as the dot crosses $U=0$.',
    answer: '$t\\to\\infty$ at the horizon but $\\tau$ stays finite; $r=0$ is reached at $\\tau=\\pi\\sqrt{r_0^3/8M}\\approx35.1M$ (about 12 minutes for Sgr A*). Inside, $r$ is timelike: the singularity is a moment in the future, not a place.' },
  { id: 'c-superluminal', module: 'cosmos',
    prompt: 'In Cosmology select JADES-GS-z14-0. Is it receding faster than light? How can we see it?',
    hint: 'Compare its distance with the Hubble sphere, then look at the past light cone.',
    answer: 'Today it recedes at several times $c$ ($v=HD$ with $D\\approx34$ Gly beyond the Hubble radius). Light emitted toward us first receded too, but the Hubble sphere grew and overtook it, so the photons now reach us. Recession speed is not a velocity in a local inertial frame.' },
);

TASKS.push(
  { id: 'c-bour', module: 'curvature',
    prompt: 'Choose Custom… and load the Helicoid preset; note $K$ at $p$. Now load the Catenoid and compare $K$ at the same $(u,v)$.',
    hint: 'Both presets are parametrised so that $g_{ij}$ is the same in $(u,v)$; one is a bent copy of the other.',
    answer: '$K=-1/\\cosh^4 u$ for both: the helicoid and catenoid are locally isometric (Bour), and by Theorema Egregium $K$ cannot tell them apart although one is a screw and the other a neck. The bending keeps $g_{ij}$ fixed and changes only II.' },
  { id: 'g-pseudo', module: 'geodesics',
    prompt: 'Load the Pseudosphere preset and fan out geodesics. Do they ever refocus? Read $K$ in the Metric module.',
    hint: '$K=-1$ everywhere, so the Jacobi equation is $J\'\'=J$.',
    answer: 'They spread exponentially, $J\\sim\\sinh s$, and never meet again: constant negative curvature has no conjugate points. The pseudosphere is a piece of the hyperbolic plane; geodesics also run off its rim at $u=0.2$ (the chart edge).' },
  { id: 'm-ellipsoid', module: 'metric',
    prompt: 'Load the Ellipsoid preset and set the sliders $a=b=1$. What surface is this, and what is $K$?',
    hint: 'Compare $g_{ij}$ with the sphere’s $\\mathrm{diag}(1,\\sin^2\\theta)$; then move $a$ away from 1.',
    answer: '$a=b=1$ gives the unit sphere in the $(\\theta,\\varphi)$ chart: $g=\\mathrm{diag}(1,\\sin^2\\theta)$, $K=1$. For $a\\ne1$ the surface is stretched, $g_{12}\\ne0$ and $K$ varies but stays positive.' },
);

// Spanish twin, keyed by task id; TASKS_ES has the same ids and order as TASKS
type TaskText = Pick<Task, 'prompt' | 'hint' | 'answer'>;
const ES: Record<string, TaskText> = {
  'm-pole': {
    prompt: 'En la esfera, mueve p hacia un polo. Observa $g_{\\varphi\\varphi}$.',
    hint: 'Para la esfera en $(\\theta,\\varphi)$ la métrica es diagonal.',
    answer: '$g_{\\varphi\\varphi}=\\sin^2\\theta\\to 0$ en los polos. Es una singularidad de coordenadas (todos los $\\varphi$ confluyen en un punto), no de curvatura: $K=1$ en todas partes.' },
  'm-orth': {
    prompt: 'Comprueba $g_{12}=\\partial_u\\cdot\\partial_v$ en la esfera, el toro y una silla. ¿Dónde se anula?',
    hint: 'Las curvas coordenadas que se cruzan en ángulo recto tienen $g_{12}=0$.',
    answer: 'En la esfera y el toro $g_{12}=0$ en todas partes (las curvas paramétricas son ortogonales). Para una silla dada como gráfico $z=f(u,v)$, $g_{12}=f_uf_v$, que no es nulo fuera de los ejes, así que allí la cuadrícula de coordenadas está sesgada.' },
  'm-induced': {
    prompt: 'Compara $g(V,V)$ con el $|V|^2$ euclídeo de la flecha 3D dibujada.',
    hint: 'La flecha es el empuje hacia delante $V^i\\partial_i$ en $\\mathbb{R}^3$.',
    answer: 'Coinciden: $g_{ij}V^iV^j=|V^i\\partial_i\\mathbf{r}|^2$. La métrica es la inducida por el embebimiento.' },
  'm-torus': {
    prompt: 'En el toro, encuentra dónde cambia de signo la curvatura de Gauss $K$.',
    hint: 'Mueve p alrededor del ángulo del tubo $v$. Compara los ecuadores exterior e interior.',
    answer: '$K=\\dfrac{\\cos v}{r(R+r\\cos v)}$ cambia de signo en $v=\\pm\\pi/2$: es positiva en la mitad exterior ($|v|<\\pi/2$) y negativa en la interior.' },
  't-pi': {
    prompt: 'En la esfera, encuentra el lazo de latitud $\\theta_0$ cuya holonomía es $\\pi$.',
    hint: 'El ángulo de holonomía es el área encerrada por $K=1$: $2\\pi(1-\\cos\\theta_0)$.',
    answer: '$2\\pi(1-\\cos\\theta_0)=\\pi\\Rightarrow\\cos\\theta_0=\\tfrac12$, así que $\\theta_0=60^\\circ$ desde el polo (latitud $30^\\circ$).' },
  't-equator': {
    prompt: '¿Por qué el ecuador da rotación neta nula?',
    hint: '¿Es el ecuador una geodésica? ¿Qué área encierra?',
    answer: 'El ecuador es una geodésica, así que su tangente se transporta paralelamente a sí misma. El hemisferio que encierra tiene área $2\\pi$, luego la holonomía $=2\\pi\\equiv0$ (mod $2\\pi$).' },
  't-gb': {
    prompt: 'Elige el camino "triángulo" (lúnula) en la esfera, o dibuja tu propio lazo. Compara el ángulo de holonomía con el área encerrada.',
    hint: 'Gauss–Bonnet: el ángulo de holonomía es igual a $\\iint_R K\\,dA$ sobre la región encerrada $R$.',
    answer: 'Ángulo de holonomía $=\\iint K\\,dA$, que es el área para $K=1$. Para un $n$-ágono geodésico también es igual al exceso angular $\\sum\\alpha_i-(n-2)\\pi$. El camino incorporado abarca $\\theta\\in[0.05,\\pi/2]$, $\\varphi\\in[0,\\pi/2]$, así que el área es $\\tfrac{\\pi}{2}\\cos 0.05\\approx 89.9^\\circ$.' },
  't-torus': {
    prompt: 'En el toro, transporta alrededor del ecuador exterior ($v=0$) y luego del interior ($v=\\pi$).',
    hint: '¿Son geodésicas estos círculos?',
    answer: 'Ambos círculos son geodésicas, así que el vector mantiene un ángulo constante con la tangente y regresa sin cambios. Estos lazos no son contráctiles, por lo que Gauss-Bonnet sobre un disco no se aplica. K es positiva fuera y negativa dentro.' },
  'g-conjugate': {
    prompt: 'En la esfera, fija la longitud en $1\\pi$ y el ángulo del abanico en $60^\\circ$. ¿Dónde se encuentran las geodésicas?',
    hint: 'Observa el punto marcado $-p$ cuando la reproducción llegue a $s=\\pi$.',
    answer: 'Todas las geodésicas desde $p$ reconvergen en el antípoda $-p$ en $s=\\pi$: un punto conjugado. El campo de Jacobi es $J(s)=\\sin(\\sqrt K\\,s)/\\sqrt K$ ($=\\sin s$ para la esfera unidad), que se anula de nuevo en $s=\\pi/\\sqrt K$.' },
  'g-saddle': {
    prompt: 'Elige la silla y reproduce un abanico. ¿Convergen o se separan las geodésicas?',
    hint: 'Compara la lectura de separación con el caso de la esfera. ¿Signo de $K$?',
    answer: 'Divergen: con $K<0$ la ecuación de Jacobi $J\'\'=-KJ$ da $(|J|)\'\'\\ge 0$, así que $|J|$ es convexa, crece al menos linealmente y nunca vuelve a cero: no hay puntos conjugados.' },
  'g-torus': {
    prompt: 'En el toro, lanza una geodésica con un ángulo pequeño respecto al ecuador exterior ($v=0$). ¿Cuánto se adentra en el tubo?',
    hint: 'Clairaut: $c=(R+r\\cos v)^2\\dot u$ se conserva. ¿Dónde alcanza $\\dot u$ su mayor valor permitido?',
    answer: 'Oscila en torno al ecuador exterior. Como $|\\dot u|\\le 1/(R+r\\cos v)$ obliga a $|c|\\le R+r\\cos v$, da la vuelta donde $R+r\\cos v=|c|$.' },
  'g-pole': {
    prompt: 'En la esfera, apunta el control de dirección a lo largo de un meridiano. ¿Qué ocurre en el polo?',
    hint: 'Un meridiano es un círculo máximo. ¿Es el polo especial en la propia esfera?',
    answer: 'La geodésica atraviesa el polo sin desviarse. La singularidad está solo en la carta $(\\theta,\\varphi)$ ($g_{\\varphi\\varphi}=\\sin^2\\theta=0$); la superficie es suave allí con $K=1$.' },
  'c-torus': {
    prompt: 'En el toro, mueve p sobre la parte exterior, la interior y los círculos superior e inferior ($v=\\pm\\pi/2$). ¿Cuál es el signo de $K$?',
    hint: 'Observa el color del mapa de calor y la lectura de K intrínseca.',
    answer: '$K>0$ en la mitad exterior ($|v|<\\pi/2$), $K<0$ en la interior y $K=0$ en los círculos superior e inferior $v=\\pm\\pi/2$, donde $\\cos v=0$.' },
  'c-saddle': {
    prompt: 'En la silla, pon p en el origen. Lee $H$, $\\kappa_1$, $\\kappa_2$.',
    hint: 'Compara $H=(\\kappa_1+\\kappa_2)/2$ con las curvaturas principales.',
    answer: '$\\kappa_1=-1$, $\\kappa_2=1$, luego $H=0$: la silla es mínima en el origen, y $K=\\kappa_1\\kappa_2=-1<0$.' },
  'c-sphere': {
    prompt: 'En la esfera, comprueba varios puntos y luego compara la circunferencia $C$ del círculo geodésico con $2\\pi\\rho$.',
    hint: '¿Es $\\kappa_1=\\kappa_2$? Prueba con $\\rho=1$.',
    answer: 'Todo punto es umbílico ($\\kappa_1=\\kappa_2=1$, $K=1$). Un círculo geodésico tiene $C=2\\pi\\sin\\rho<2\\pi\\rho$, lo que concuerda con $1-K\\rho^2/6$ para $\\rho$ pequeño.' },
  'c-egregium': {
    prompt: 'Theorema Egregium: doblar una lámina plana hasta formar un cilindro conserva $K$. Usa los números intrínsecos y extrínsecos de cada superficie para ver qué se conserva.',
    hint: 'Compara K intrínseca y K extrínseca y su diferencia en varios puntos.',
    answer: 'Los dos valores coinciden en todas partes (diferencia ~0), aunque II cambia con el embebimiento. $K$ depende solo de $g$, así que una flexión isométrica (plano a cilindro) conserva $K=0$ aunque $\\kappa_1\\ne0$.' },
  'f-hairy': {
    prompt: 'En la esfera, prueba todos los campos predefinidos. ¿Alguno carece de ceros? Suma los índices.',
    hint: 'Lee la tabla de Poincaré–Hopf; compara con $\\chi(S^2)$.',
    answer: 'Todos los campos predefinidos tienen ceros y los índices suman $2=\\chi(S^2)$. El dipolo tiene un único cero de índice $2$. Por el teorema de la bola peluda, ningún campo en $S^2$ es no nulo en todas partes.' },
  'f-torus': {
    prompt: 'En el toro elige $\\partial_u$ y luego el gradiente del campo lateral (gradSide). Compara ceros y $\\chi$.',
    hint: 'Cuenta los ceros y sus signos.',
    answer: '$\\partial_u$ no tiene ceros, de acuerdo con $\\chi(T^2)=0$. gradSide tiene un máximo, un mínimo y 2 sillas: $1+1-1-1=0=\\chi$.' },
  'f-so3': {
    prompt: 'En la esfera fija X = Lx e Y = Ly, y luego varía t. ¿Cuánto vale $[X,Y]$?',
    hint: 'Compara el corchete con los otros campos de rotación; gap$/t^2$ debería aproximarse a él.',
    answer: '$[L_x,L_y]=-L_z$ y cíclicamente, con $L_i=\\epsilon_{ijk}x_j\\partial_k$ en el sistema donde $z$ es el eje polar. Los campos de rotación forman $\\mathfrak{so}(3)$, el álgebra del momento angular; la brecha del conmutador es $\\approx t^2[X,Y]$. (La mecánica cuántica escribe $\\hat L_i=-i\\hbar L_i$, lo que convierte esto en $[\\hat L_x,\\hat L_y]=i\\hbar\\hat L_z$.)' },
  'f-killing': {
    prompt: 'Compara $\\mathcal L_Xg$ y $\\operatorname{div}X$ para Lz y para gradHeight en la esfera.',
    hint: '¿Cuál cumple $\\mathcal L_Xg=0$?',
    answer: 'Lz es de Killing: $\\mathcal L_Xg=0$, $\\operatorname{div}X=0$, su flujo es una rotación (isometría). gradHeight tiene $\\operatorname{div}X\\ne0$, así que su flujo no conserva el área y por tanto no es una isometría.' },
  'r-mercury': {
    prompt: 'Elige el Sol y el preajuste de Mercurio. Compara el avance del perihelio predicho con el valor observado y pregúntate por qué es tan pequeño.',
    hint: 'Lee $a/M$ en el panel. El desplazamiento por órbita es $6\\pi M/[a(1-e^2)]$.',
    answer: 'Mercurio tiene $a/M\\approx 3.9\\times10^7$, así que el desplazamiento es solo $\\approx 5\\times10^{-7}$ rad ($0.10^{\\prime\\prime}$) por órbita. Con $\\approx 415$ órbitas por siglo resultan $\\approx 43^{\\prime\\prime}$/siglo, que concuerdan con la contribución de la RG observada. La escena muestra un modelo de campo fuerte con la misma excentricidad.' },
  'r-isco': {
    prompt: 'Elige el agujero negro genérico, órbita personalizada, con $r_a$ justo por encima de $r_p=6$. Luego baja $r_p$ justo por debajo de $6M$.',
    hint: 'Observa la gráfica del potencial: el mínimo de $V_{\\rm eff}$ donde se sitúa una órbita circular.',
    answer: 'Para $L^2>12M^2$, $V_{\\rm eff}$ tiene un mínimo (órbita circular estable) y un máximo. En $L=2\\sqrt3\\,M$ se funden en $r=6M$ (la ISCO, $E=\\sqrt{8/9}$). Para $r_p<6M$ no existe una órbita circular estable y una órbita casi circular describe una espiral hacia dentro y se precipita.' },
  'r-photon': {
    prompt: 'En la vista de luz, barre $b$ a través de $3\\sqrt3\\,M\\approx5.196M$. ¿Qué cambia? ¿Qué tamaño tiene la sombra de Sgr A*?',
    hint: 'Busca los rayos rojos (capturados) y el máximo del potencial de la luz, $E^2=1$ frente a $L^2/27M^2$.',
    answer: 'El potencial de la luz alcanza su máximo en $r=3M$ con altura $L^2/27M^2$; los rayos con $b<b_c=3\\sqrt3\\,M$ son capturados y los mayores se desvían. La sombra tiene radio angular $b_c/D$; para Sgr A* el diámetro $2b_c/D\\approx 53\\,\\mu$as, coherente con EHT ($51.8\\pm2.3\\,\\mu$as).' },
  'r-flamm': {
    prompt: 'Abre la vista de Flamm. La sección tiene $K=-M/r^3\\ne0$, y sin embargo el tensor de Ricci del vacío se anula. ¿Cómo pueden darse ambas cosas?',
    hint: '¿Qué objeto es curvo: la sección espacial 2D o el espaciotiempo? ¿Son las órbitas geodésicas de la sección?',
    answer: 'La sección $t=$const es curva ($K=-M/r^3$) pero el espaciotiempo es plano de Ricci: $R_{\\mu\\nu}=0$ solo dice que las partes de traza se cancelan entre la curvatura espacial y la temporal; el tensor de Weyl sobrevive (mareas). Las órbitas son geodésicas de la métrica 4D, no de la sección, así que dibujadas sobre el paraboloide no son geodésicas de esa superficie.' },
  'r-kerr-isco': {
    prompt: 'En la vista de Kerr mueve el espín de $a=0$ a $a=0.998$ (prógrado) y lee el radio de la ISCO y la eficiencia $1-E_{\\rm ISCO}$.',
    hint: 'Observa cómo el anillo de la ISCO se encoge hacia el horizonte y la lectura de $E_{\\rm ISCO}$.',
    answer: 'En $a=0$ la ISCO está en $6M$ con $E=\\sqrt{8/9}$, eficiencia $5.7\\%$. En $a=0.998$ la ISCO prógrada baja a unos $1.24M$ y la eficiencia sube a un $32\\%$ aproximadamente, porque el arrastre de marcos permite que la materia orbite más cerca y libere más energía de ligadura.' },
  'r-shadow': {
    prompt: 'En la vista Imagen compara la curva de la sombra en $a=0$ con la de $a=0.99$ con inclinación $89^\\circ$ (de canto).',
    hint: 'Activa la superposición y mira los bordes izquierdo y derecho de la región oscura.',
    answer: 'En $a=0$ la sombra es un círculo de radio $3\\sqrt3\\,M$ para cualquier inclinación. En $a=0.99$ de canto está aplanada en el lado del disco que se acerca (forma de D) y desplazada, porque la órbita de fotones prógrada está mucho más cerca del agujero que la retrógrada.' },
  'r-gpb': {
    prompt: 'En la vista Relojes elige Gravity Probe B. Compara la predicción de arrastre de marcos con la medida.',
    hint: 'Lee la tabla: fórmula, predicción publicada, observado.',
    answer: 'GP-B midió $37.2\\pm7.2$ mas/año frente a la predicción de la RG de $39.2$ mas/año (una medida de alrededor del 19%), coherente con la RG; el término geodésico $6601.8\\pm18.3$ frente a $6606.1$ mas/año es mucho más preciso.' },
  's-mink': {
    prompt: 'Elige Minkowski (coordenadas esféricas). Cuenta los $\\Gamma$ no nulos y las componentes de Riemann no nulas. Luego elige Schwarzschild.',
    hint: '¿Son los símbolos de Christoffel un tensor?',
    answer: 'Minkowski en $(t,r,\\theta,\\varphi)$ tiene $\\Gamma$ no nulos (p. ej. $\\Gamma^r_{\\theta\\theta}=-r$) pero $R^\\rho{}_{\\sigma\\mu\\nu}=0$: $\\Gamma$ depende de las coordenadas, la curvatura no. Schwarzschild tiene $R_{\\mu\\nu}=0$ y aun así $R_{\\rho\\sigma\\mu\\nu}\\ne0$: la curvatura en el vacío es puramente de Weyl, $C^2=K=48M^2/r^6$.' },
  's-spaghetti': {
    prompt: 'En Marea compara la aceleración de marea a lo largo de un cuerpo de 2 m en el horizonte de un agujero de 10 $M_\\odot$ y en el de Sgr A*.',
    hint: 'En $r=2M$, $\\Delta a = 2GM L/r^3 \\propto 1/M^2$.',
    answer: 'Unos $2\\times10^8$ m/s² para 10 $M_\\odot$ (espaguetizado mucho antes del horizonte) y unos $10^{-3}$ m/s² para Sgr A* (no se nota nada en el horizonte). Las mareas escalan como $M/r^3$, que en $r=2M$ es $1/(8M^2)$.' },
  's-gw': {
    prompt: 'En Ondas alterna entre $+$ y $\\times$. Luego calcula la masa de chirp de GW150914 a partir de las masas de los componentes.',
    hint: 'Gira el patrón $+$ $45^\\circ$. $\\mathcal M=(m_1m_2)^{3/5}/(m_1+m_2)^{1/5}$.',
    answer: '$\\times$ es $+$ girado $45^\\circ$ (espín 2: una rotación de $180^\\circ$ lleva cada patrón a sí mismo). Con $m_1=36$, $m_2=29\\,M_\\odot$, $\\mathcal M\\approx28\\,M_\\odot$, la combinación que fija $\\dot f\\propto\\mathcal M^{5/3}f^{11/3}$ en la fase de espiral.' },
  'c-infall': {
    prompt: 'En la vista de Penrose deja caer un observador desde $r_0=10M$. Compara el $t$ de Schwarzschild y el tiempo propio $\\tau$ en el horizonte.',
    hint: 'Observa las lecturas cuando el punto cruza $U=0$.',
    answer: '$t\\to\\infty$ en el horizonte pero $\\tau$ se mantiene finito; $r=0$ se alcanza en $\\tau=\\pi\\sqrt{r_0^3/8M}\\approx35.1M$ (unos 12 minutos para Sgr A*). En el interior, $r$ es temporal: la singularidad es un instante en el futuro, no un lugar.' },
  'c-superluminal': {
    prompt: 'En Cosmología selecciona JADES-GS-z14-0. ¿Se aleja más rápido que la luz? ¿Cómo podemos verla?',
    hint: 'Compara su distancia con la esfera de Hubble y luego mira el cono de luz pasado.',
    answer: 'Hoy se aleja a varias veces $c$ ($v=HD$ con $D\\approx34$ Gly más allá del radio de Hubble). La luz emitida hacia nosotros también se alejó al principio, pero la esfera de Hubble creció y la alcanzó, así que los fotones llegan ahora hasta nosotros. La velocidad de recesión no es una velocidad en un sistema inercial local.' },
  'c-bour': {
    prompt: 'Elige Personalizada… y carga el preajuste Helicoide; anota $K$ en $p$. Ahora carga el Catenoide y compara $K$ en el mismo $(u,v)$.',
    hint: 'Ambos preajustes están parametrizados de modo que $g_{ij}$ es el mismo en $(u,v)$; uno es una copia doblada del otro.',
    answer: '$K=-1/\\cosh^4 u$ para ambos: el helicoide y el catenoide son localmente isométricos (Bour), y por el Theorema Egregium $K$ no puede distinguirlos aunque uno sea un tornillo y el otro un cuello. La flexión mantiene fijo $g_{ij}$ y cambia solo II.' },
  'g-pseudo': {
    prompt: 'Carga el preajuste Pseudoesfera y abre un abanico de geodésicas. ¿Se reenfocan alguna vez? Lee $K$ en el módulo Métrica.',
    hint: '$K=-1$ en todas partes, así que la ecuación de Jacobi es $J\'\'=J$.',
    answer: 'Se separan exponencialmente, $J\\sim\\sinh s$, y nunca vuelven a encontrarse: la curvatura negativa constante no tiene puntos conjugados. La pseudoesfera es un trozo del plano hiperbólico; las geodésicas también salen por su borde en $u=0.2$ (el límite de la carta).' },
  'm-ellipsoid': {
    prompt: 'Carga el preajuste Elipsoide y fija los controles $a=b=1$. ¿Qué superficie es y cuánto vale $K$?',
    hint: 'Compara $g_{ij}$ con el $\\mathrm{diag}(1,\\sin^2\\theta)$ de la esfera; luego aleja $a$ de 1.',
    answer: '$a=b=1$ da la esfera unidad en la carta $(\\theta,\\varphi)$: $g=\\mathrm{diag}(1,\\sin^2\\theta)$, $K=1$. Para $a\\ne1$ la superficie se estira, $g_{12}\\ne0$ y $K$ varía pero sigue siendo positiva.' },
};

export const TASKS_ES: Task[] = TASKS.map((t) => ({ ...t, ...ES[t.id] }));

export const tasksForLang = (m: ModuleId, lang: 'en' | 'es') => (lang === 'es' ? TASKS_ES : TASKS).filter((t) => t.module === m);
