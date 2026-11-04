import type { ModuleId } from '../state/store';
import type { TourStep } from './steps';
import type { Theory } from './theory';
import type { Task } from './tasks';

const M: ModuleId = 'curves';
const r = String.raw;

export const CURVES_TOUR: TourStep[] = [
  { target: null, title: 'Curves & charts',
    body: 'Before surfaces, two warm-ups. A space curve has a moving frame $(T,N,B)$ whose turning is measured by curvature $\\kappa$ and torsion $\\tau$. And a sphere cannot be covered by one flat coordinate chart, so we use several.' },
  { target: 'canvas', title: 'The 3D view',
    body: 'Left-drag to orbit, right-drag to pan, scroll or pinch to zoom. On a curve you see the point, the arrows $T$, $N$, $B$ and the dashed osculating circle of radius $1/\\kappa$.' },
  { target: 'views', title: 'Two views',
    body: 'Curves: pick a preset, drag the parameter slider or press play. Charts: the sphere covered by a spherical grid (orange) and a stereographic grid (blue), with the point shown in both coordinate systems.' },
  { target: 'panel', title: 'Live readouts',
    body: 'Arc length $s$, speed $|r\'|$, $\\kappa$ and $\\tau$ update as the point moves. Try the helix: $\\kappa = a/(a^2+b^2)$ and $\\tau = b/(a^2+b^2)$ never change. On the Charts view, watch the transition map and $J^T g J$.' },
  { target: 'theory', title: 'Motivation & theory',
    body: 'This button opens the background: why curvature and torsion determine a curve, and why manifolds are defined through overlapping charts.' },
  { target: 'nav', title: 'Other simulations',
    body: 'Switch simulation with these tabs. Next come surfaces: the metric, parallel transport, geodesics and curvature.' },
];
export const CURVES_TOUR_ES: TourStep[] = [
  { target: null, title: 'Curvas y cartas',
    body: 'Antes de las superficies, dos calentamientos. Una curva en el espacio tiene un triedro móvil $(T,N,B)$ cuyo giro miden la curvatura $\\kappa$ y la torsión $\\tau$. Y una esfera no se cubre con una sola carta plana, así que usamos varias.' },
  { target: 'canvas', title: 'La vista 3D',
    body: 'Arrastra con el botón izquierdo para orbitar, con el derecho para desplazar, y usa la rueda o el pellizco para el zoom. En una curva ves el punto, las flechas $T$, $N$, $B$ y el círculo osculador discontinuo de radio $1/\\kappa$.' },
  { target: 'views', title: 'Dos vistas',
    body: 'Curvas: elige una curva, arrastra el deslizador del parámetro o pulsa reproducir. Cartas: la esfera cubierta por una cuadrícula esférica (naranja) y una estereográfica (azul), con el punto en ambos sistemas de coordenadas.' },
  { target: 'panel', title: 'Lecturas en vivo',
    body: 'La longitud de arco $s$, la rapidez $|r\'|$, $\\kappa$ y $\\tau$ se actualizan al mover el punto. Prueba la hélice: $\\kappa = a/(a^2+b^2)$ y $\\tau = b/(a^2+b^2)$ no cambian nunca. En Cartas, observa la función de transición y $J^T g J$.' },
  { target: 'theory', title: 'Motivación y teoría',
    body: 'Este botón abre el trasfondo: por qué la curvatura y la torsión determinan una curva, y por qué las variedades se definen mediante cartas que se solapan.' },
  { target: 'nav', title: 'Otras simulaciones',
    body: 'Cambia de simulación con estas pestañas. A continuación vienen las superficies: la métrica, el transporte paralelo, las geodésicas y la curvatura.' },
];

export const CURVES_THEORY: Theory = {
  motivation: r`How do you describe the shape of a curve without reference to how it sits in space? Two numbers at each point: how much it bends ($\kappa$) and how much it twists out of its plane ($\tau$). And how do you do calculus on a sphere when no single flat map covers it? You use several overlapping maps, called charts. Both ideas are the on-ramp to surfaces and manifolds.`,
  sections: [
    { heading: 'The Frenet–Serret frame', body: r`For a regular curve $r(t)$ define the unit tangent $T=r'/|r'|$, the binormal $B=(r'\times r'')/|r'\times r''|$ and the normal $N=B\times T$. They form an orthonormal frame that moves along the curve. The arc length is $s=\int|r'|\,dt$.` },
    { heading: 'Curvature and torsion', body: r`The frame turns according to

$$\frac{dT}{ds}=\kappa N,\qquad \frac{dN}{ds}=-\kappa T+\tau B,\qquad \frac{dB}{ds}=-\tau N,$$

with $\kappa=|r'\times r''|/|r'|^3$ and $\tau=(r'\times r'')\cdot r'''/|r'\times r''|^2$. The osculating circle has radius $1/\kappa$ and lies in the plane spanned by $T,N$. Where $\kappa=0$ (a straight bit or an inflection) $N$ and $B$ are not defined.` },
    { heading: 'Examples and the fundamental theorem', body: r`A circle of radius $R$ has $\kappa=1/R$, $\tau=0$. The helix $(a\cos t,a\sin t,bt)$ has constant $\kappa=a/(a^2+b^2)$ and $\tau=b/(a^2+b^2)$. A curve is planar exactly when $\tau=0$. Conversely, given $\kappa(s)>0$ and $\tau(s)$ there is a curve with those functions, unique up to a rigid motion.` },
    { heading: 'Charts on the sphere', body: r`The sphere has the spherical chart $(\theta,\varphi)$ with metric $d\theta^2+\sin^2\theta\,d\varphi^2$, which fails at both poles, and the stereographic chart $(x,y)$ from the north pole with metric $\frac{4}{(1+x^2+y^2)^2}(dx^2+dy^2)$, which misses the north pole. On the overlap they are related by the smooth map $(x,y)=(\cot\tfrac\theta2\cos\varphi,\cot\tfrac\theta2\sin\varphi)$, and the metrics agree through $g_{\rm sph}=J^Tg_{\rm st}J$.` },
    { heading: 'Why manifolds have atlases', body: r`No single chart covers the sphere without a singularity, and the failure is in the coordinates, not in the surface: the curvature is $1$ everywhere. A manifold is a space covered by overlapping charts whose transition maps are smooth. Quantities like length are the same in every chart once transformed correctly.` },
  ],
  refs: ['do Carmo, Differential Geometry of Curves and Surfaces, ch. 1 (curves, Frenet formulas)', 'Pressley, Elementary Differential Geometry, ch. 1-2 (curves, curvature and torsion)', 'Lee, Introduction to Smooth Manifolds (2nd ed.), ch. 1 (charts and atlases)'],
};
export const CURVES_THEORY_ES: Theory = {
  motivation: r`¿Cómo se describe la forma de una curva sin referirse a cómo está colocada en el espacio? Con dos números en cada punto: cuánto se curva ($\kappa$) y cuánto se tuerce fuera de su plano ($\tau$). Y ¿cómo se hace cálculo en una esfera cuando ningún mapa plano la cubre? Se usan varios mapas que se solapan, llamados cartas. Ambas ideas son la rampa de acceso a las superficies y a las variedades.`,
  sections: [
    { heading: 'El triedro de Frenet–Serret', body: r`Para una curva regular $r(t)$ se define la tangente unitaria $T=r'/|r'|$, la binormal $B=(r'\times r'')/|r'\times r''|$ y la normal $N=B\times T$. Forman un triedro ortonormal que se mueve a lo largo de la curva. La longitud de arco es $s=\int|r'|\,dt$.` },
    { heading: 'Curvatura y torsión', body: r`El triedro gira según

$$\frac{dT}{ds}=\kappa N,\qquad \frac{dN}{ds}=-\kappa T+\tau B,\qquad \frac{dB}{ds}=-\tau N,$$

con $\kappa=|r'\times r''|/|r'|^3$ y $\tau=(r'\times r'')\cdot r'''/|r'\times r''|^2$. El círculo osculador tiene radio $1/\kappa$ y está en el plano generado por $T,N$. Donde $\kappa=0$ (un tramo recto o una inflexión) $N$ y $B$ no están definidas.` },
    { heading: 'Ejemplos y teorema fundamental', body: r`Un círculo de radio $R$ tiene $\kappa=1/R$, $\tau=0$. La hélice $(a\cos t,a\sin t,bt)$ tiene $\kappa=a/(a^2+b^2)$ y $\tau=b/(a^2+b^2)$ constantes. Una curva es plana exactamente cuando $\tau=0$. Recíprocamente, dadas $\kappa(s)>0$ y $\tau(s)$ existe una curva con esas funciones, única salvo un movimiento rígido.` },
    { heading: 'Cartas en la esfera', body: r`La esfera tiene la carta esférica $(\theta,\varphi)$ con métrica $d\theta^2+\sin^2\theta\,d\varphi^2$, que falla en ambos polos, y la carta estereográfica $(x,y)$ desde el polo norte con métrica $\frac{4}{(1+x^2+y^2)^2}(dx^2+dy^2)$, que no incluye el polo norte. En el solape se relacionan por la función suave $(x,y)=(\cot\tfrac\theta2\cos\varphi,\cot\tfrac\theta2\sin\varphi)$, y las métricas concuerdan mediante $g_{\rm sph}=J^Tg_{\rm st}J$.` },
    { heading: 'Por qué las variedades tienen atlas', body: r`Ninguna carta cubre la esfera sin una singularidad, y el fallo está en las coordenadas, no en la superficie: la curvatura es $1$ en todas partes. Una variedad es un espacio cubierto por cartas que se solapan con funciones de transición suaves. Magnitudes como la longitud son las mismas en cualquier carta una vez transformadas correctamente.` },
  ],
  refs: ['do Carmo, Differential Geometry of Curves and Surfaces, cap. 1 (curvas, fórmulas de Frenet)', 'Pressley, Elementary Differential Geometry, cap. 1-2 (curvas, curvatura y torsión)', 'Lee, Introduction to Smooth Manifolds (2.ª ed.), cap. 1 (cartas y atlas)'],
};

export const CURVES_TASKS: Task[] = [
  { id: 'cv-helix', module: M,
    prompt: 'Choose the helix and move the parameter. Which of $\\kappa$, $\\tau$ change? Then set the pitch $b=0$.',
    hint: 'Compare the readouts with $a/(a^2+b^2)$ and $b/(a^2+b^2)$.',
    answer: 'Neither changes: $\\kappa=a/(a^2+b^2)$ and $\\tau=b/(a^2+b^2)$ are constants. With $b=0$ the helix becomes a circle of radius $a$: $\\kappa=1/a$, $\\tau=0$.' },
  { id: 'cv-circle', module: M,
    prompt: 'On the circle, change the radius $a$. How are $1/\\kappa$ and $\\tau$ related to it?',
    hint: 'The osculating circle of a circle is the circle itself.',
    answer: '$\\kappa=1/a$, so the osculating circle has radius $1/\\kappa=a$ and coincides with the curve. $\\tau=0$ because the curve is planar and $B$ is constant.' },
  { id: 'cv-inflection', module: M,
    prompt: 'Pick the inflection curve $y=x^3$ and pass through $t=0$. What happens to $N$, $B$ and the osculating circle?',
    hint: 'Use $\\kappa=|r\'\\times r\'\'|/|r\'|^3$ with $r\'\'=(0,6t,0)$.',
    answer: 'At $t=0$, $r\'\\times r\'\'=0$, so $\\kappa=0$: the osculating circle has infinite radius and $N$, $B$ (and $\\tau$) are undefined. Away from $t=0$ the sign of the bending flips: $N$ jumps to the other side of the curve.' },
  { id: 'cv-trefoil', module: M,
    prompt: 'On the trefoil knot, find where $\\kappa$ is largest and where $\\tau$ changes sign, if it does.',
    hint: 'Scrub the parameter and watch the readouts; the knot is not planar.',
    answer: 'The curvature peaks at the tight turns of the knot. The torsion is not zero everywhere (the knot is not planar) and varies along the curve; the sign you read off depends on the orientation of the knot.' },
  { id: 'cv-charts', module: M,
    prompt: 'In Charts, move $\\theta$ toward $0$. What happens in each chart? Check that $J^Tg_{\\rm st}J$ equals $g_{\\rm sph}$ elsewhere.',
    hint: 'Look at $g_{\\varphi\\varphi}=\\sin^2\\theta$ and at $r=\\cot(\\theta/2)$.',
    answer: 'Spherical chart: $g_{\\varphi\\varphi}=\\sin^2\\theta\\to0$, so $\\varphi$ is undefined at the pole. Stereographic chart: $r=\\cot(\\theta/2)\\to\\infty$, the north pole is not in the chart. Elsewhere the readout max $|J^Tg\'J-g|$ is zero up to rounding, because the metric is a tensor and transforms with $J$.' },
];
export const CURVES_TASKS_ES: Task[] = [
  { id: 'cv-helix', module: M,
    prompt: 'Elige la hélice y mueve el parámetro. ¿Cuáles de $\\kappa$, $\\tau$ cambian? Luego pon el paso $b=0$.',
    hint: 'Compara las lecturas con $a/(a^2+b^2)$ y $b/(a^2+b^2)$.',
    answer: 'Ninguna cambia: $\\kappa=a/(a^2+b^2)$ y $\\tau=b/(a^2+b^2)$ son constantes. Con $b=0$ la hélice se vuelve un círculo de radio $a$: $\\kappa=1/a$, $\\tau=0$.' },
  { id: 'cv-circle', module: M,
    prompt: 'En el círculo, cambia el radio $a$. ¿Cómo se relacionan $1/\\kappa$ y $\\tau$ con él?',
    hint: 'El círculo osculador de un círculo es el propio círculo.',
    answer: '$\\kappa=1/a$, así que el círculo osculador tiene radio $1/\\kappa=a$ y coincide con la curva. $\\tau=0$ porque la curva es plana y $B$ es constante.' },
  { id: 'cv-inflection', module: M,
    prompt: 'Elige la curva con inflexión $y=x^3$ y pasa por $t=0$. ¿Qué ocurre con $N$, $B$ y el círculo osculador?',
    hint: 'Usa $\\kappa=|r\'\\times r\'\'|/|r\'|^3$ con $r\'\'=(0,6t,0)$.',
    answer: 'En $t=0$, $r\'\\times r\'\'=0$, así que $\\kappa=0$: el círculo osculador tiene radio infinito y $N$, $B$ (y $\\tau$) no están definidos. Al pasar por $t=0$ el signo de la flexión cambia: $N$ salta al otro lado de la curva.' },
  { id: 'cv-trefoil', module: M,
    prompt: 'En el nudo trébol, encuentra dónde $\\kappa$ es máxima y dónde $\\tau$ cambia de signo, si lo hace.',
    hint: 'Desplaza el parámetro y observa las lecturas; el nudo no es plano.',
    answer: 'La curvatura alcanza su máximo en los giros cerrados del nudo. La torsión no es nula en todas partes (el nudo no es plano) y varía a lo largo de la curva; el signo que leas depende de la orientación del nudo.' },
  { id: 'cv-charts', module: M,
    prompt: 'En Cartas, acerca $\\theta$ a $0$. ¿Qué ocurre en cada carta? Comprueba que $J^Tg_{\\rm st}J$ es igual a $g_{\\rm sph}$ en el resto.',
    hint: 'Mira $g_{\\varphi\\varphi}=\\sin^2\\theta$ y $r=\\cot(\\theta/2)$.',
    answer: 'Carta esférica: $g_{\\varphi\\varphi}=\\sin^2\\theta\\to0$, así que $\\varphi$ queda indefinido en el polo. Carta estereográfica: $r=\\cot(\\theta/2)\\to\\infty$, el polo norte no está en la carta. En el resto la lectura máx $|J^Tg\'J-g|$ es cero salvo redondeo, porque la métrica es un tensor y se transforma con $J$.' },
];
