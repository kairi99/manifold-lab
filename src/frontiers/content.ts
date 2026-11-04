import type { TourStep } from '../tour/steps';
import type { Theory } from '../tour/theory';
import type { Task } from '../tour/tasks';

const M = 'frontiers' as const;
const r = String.raw;

export const FRONTIERS_TOUR: TourStep[] = [
  { target: null, title: 'Frontiers',
    body: 'Differential geometry is not finished. This module shows problems that were solved recently, and problems that are still open, together with small demos of the geometry around them. A demo is never a proof, and it never "solves" anything.' },
  { target: 'canvas', title: 'The 3D view',
    body: 'Left-drag to orbit, right-drag to pan, scroll or pinch to zoom. On the Problems view it shows the demo of the card you opened, or a calm torus of revolution with $R/r=\\sqrt2$ when that card has none.' },
  { target: 'views', title: 'Six views',
    body: 'Problems is the list of cards. The other five are demos: curve shortening, Ricci flow, Willmore energy, the Penrose inequality and Yang–Mills holonomy. Each has live numbers checked against an exact formula.' },
  { target: 'panel', title: 'Problem cards',
    body: 'Filter by area and by status. Open a card for the formal statement, why it is hard, sources and the date it was checked. Where a result is only claimed or disputed, the card says so. Use "Open demo" to jump to the matching demo.' },
  { target: 'theory', title: 'Motivation & theory',
    body: 'This button opens the background: what makes a problem open, Ricci flow and the Poincaré conjecture, the Willmore problem, gauge theory, and the Penrose inequality with cosmic censorship.' },
  { target: 'nav', title: 'Other simulations',
    body: 'Switch simulation with these tabs. Most Frontiers problems grow out of the earlier ones: curvature, holonomy, geodesics and spacetime.' },
];
export const FRONTIERS_TOUR_ES: TourStep[] = [
  { target: null, title: 'Fronteras',
    body: 'La geometría diferencial no está terminada. Este módulo muestra problemas resueltos hace poco y problemas aún abiertos, con pequeñas demos de la geometría que los rodea. Una demo nunca es una demostración y nunca "resuelve" nada.' },
  { target: 'canvas', title: 'La vista 3D',
    body: 'Arrastra con el botón izquierdo para orbitar, con el derecho para desplazar, y usa la rueda o el pellizco para el zoom. En la vista Problemas muestra la demo de la tarjeta que abriste, o un toro de revolución tranquilo con $R/r=\\sqrt2$ si la tarjeta no tiene demo.' },
  { target: 'views', title: 'Seis vistas',
    body: 'Problemas es la lista de tarjetas. Las otras cinco son demos: acortamiento de curvas, flujo de Ricci, energía de Willmore, desigualdad de Penrose y holonomía de Yang–Mills. Cada una tiene números en vivo comprobados con una fórmula exacta.' },
  { target: 'panel', title: 'Tarjetas de problemas',
    body: 'Filtra por área y por estado. Abre una tarjeta para ver el enunciado formal, por qué es difícil, las fuentes y la fecha en que se comprobó. Cuando un resultado solo está afirmado o disputado, la tarjeta lo dice. Usa "Abrir demo" para saltar a la demo correspondiente.' },
  { target: 'theory', title: 'Motivación y teoría',
    body: 'Este botón abre el trasfondo: qué hace que un problema esté abierto, el flujo de Ricci y la conjetura de Poincaré, el problema de Willmore, la teoría gauge, y la desigualdad de Penrose con la censura cósmica.' },
  { target: 'nav', title: 'Otras simulaciones',
    body: 'Cambia de simulación con estas pestañas. La mayoría de los problemas de Fronteras nacen de los anteriores: curvatura, holonomía, geodésicas y espaciotiempo.' },
];

export const FRONTIERS_THEORY: Theory = {
  motivation: r`Textbooks present geometry as finished. It is not: a 1-line question about eggs, tori or black holes can still be open, and some famous ones were settled only in this century. Here you meet a few of them through the same tools as the other modules (curvature, [[holonomy|holonomy]], [[geodesic|geodesics]]), and see exactly what is known, what is claimed, and what is not.`,
  sections: [
    { heading: 'What makes a problem "open"', body: r`A problem is open when it is stated precisely and no proof has been accepted by the community. Acceptance is social as well as logical: a preprint is a claim, a refereed paper is checked by experts, and a machine-checked formalisation (for example in Lean) verifies that the proof follows from the stated definitions, not that the definitions say what was meant. Statuses move. Some cards here carry 2026 announcements that so far exist only as preprints or press reports; they are marked as claims, not results. Also, a conjecture can be true in one regularity class and false in another: the Carathéodory conjecture is proved for real-analytic surfaces (Hamburger), while its status for merely smooth surfaces is contested.` },
    { heading: 'Ricci flow and the Poincaré conjecture', body: r`Hamilton's [[ricci-flow|Ricci flow]] deforms a metric by

$$\partial_t g=-2\,\mathrm{Ric}(g).$$

On a surface $\mathrm{Ric}=Kg$, so the flow shrinks regions of positive curvature and expands regions of negative curvature. The area then obeys $\frac{dA}{dt}=-2\int K\,dA=-4\pi\chi$, so a sphere loses area at the constant rate $8\pi$, however distorted it starts, and it flows to a round point. In dimension 3 the flow can form necks that pinch (a neckpinch). Perelman controlled these with a monotone entropy, cut them out ("surgery") and continued the flow; this proved the Poincaré conjecture (2002-03) and Thurston's geometrization conjecture. The Clay Institute awarded the prize in 2010 and Perelman declined it.` },
    { heading: 'The Willmore problem', body: r`The [[willmore-energy|Willmore energy]] of a surface is

$$W=\int_\Sigma H^2\,dA,\qquad H=\tfrac12(\kappa_1+\kappa_2).$$

It is at least $4\pi$, with equality for round spheres, and it is unchanged by Möbius transformations. For a torus of revolution with $c=R/r$ one computes $W=\pi^2c^2/\sqrt{c^2-1}$, minimal at $c=\sqrt2$ with $W=2\pi^2$. Willmore conjectured in 1965 that $2\pi^2$ is the minimum over all tori; Marques and Neves proved it in 2012-14 with min-max theory. Next to it sits the Carathéodory conjecture about [[umbilic|umbilic points]], where $\kappa_1=\kappa_2$: every closed convex surface should have at least two, but for non-analytic smooth surfaces the situation is currently disputed.` },
    { heading: 'Gauge theory and Yang–Mills', body: r`A gauge field is a connection $A$ on a bundle; its curvature is $F=dA+A\wedge A$, and the [[holonomy|holonomy]] around a small loop measures $F$. For an abelian group (electromagnetism) holonomies commute and depend only on the enclosed flux. For a non-abelian group such as $SU(2)$ they do not commute, and the loop order matters. A [[yang-mills|Yang–Mills connection]] is critical for $\int|F|^2$, i.e. it satisfies $d_A\star F=0$. The Clay problem asks for a rigorous quantum Yang–Mills theory on $\mathbb{R}^4$ with a mass gap; it remains open, and no claimed proof is established.` },
    { heading: 'The Penrose inequality and cosmic censorship', body: r`Penrose argued that if the laws of gravity are predictable, a black hole with horizon area $A$ must have mass

$$m\ge\sqrt{\frac{A}{16\pi}},$$

with equality for Schwarzschild, where $A=16\pi m^2$. For time-symmetric initial data this was proved by Huisken-Ilmanen and Bray (2001); the general case is open. The inequality is a quantitative cousin of [[cosmic-censorship|cosmic censorship]]. Weak censorship says collapse singularities are hidden behind horizons; strong censorship says the spacetime is determined by its initial data. Dafermos and Luk showed that the $C^0$ version of the strong statement fails for Kerr, while revised versions remain open. Nonlinear stability of Kerr is known only for small angular momentum.` },
  ],
  refs: [
    'Morgan & Tian, Ricci Flow and the Poincaré Conjecture (AMS/Clay, 2007); Kleiner & Lott, Notes on Perelman’s papers, Geom. Topol. 12 (2008)',
    'Marques & Neves, Min-max theory and the Willmore conjecture, Ann. of Math. 179 (2014)',
    'Jaffe & Witten, Quantum Yang–Mills Theory (Clay Millennium Problem statement); Bleecker, Gauge Theory and Variational Principles (1981)',
    'Bray, Black holes and the Penrose inequality in general relativity (ICM 2002); Mars, Present status of the Penrose inequality, Class. Quantum Grav. 26 (2009)',
    'Dafermos & Luk, The interior of dynamical vacuum black holes I, Ann. of Math. 202 (2025); Klainerman & Szeftel, Kerr stability for small angular momentum (arXiv 2021)',
    'Arnold & Khesin, Topological Methods in Hydrodynamics (Springer, 1998)',
  ],
};
export const FRONTIERS_THEORY_ES: Theory = {
  motivation: r`Los libros presentan la geometría como algo terminado. No lo está: una pregunta de una línea sobre huevos, toros o agujeros negros puede seguir abierta, y algunas famosas se resolvieron solo en este siglo. Aquí te encuentras con varias usando las mismas herramientas que en los otros módulos (curvatura, [[holonomy|holonomía]], [[geodesic|geodésicas]]) y ves con exactitud qué se sabe, qué se afirma y qué no.`,
  sections: [
    { heading: 'Qué hace que un problema esté "abierto"', body: r`Un problema está abierto cuando se enuncia con precisión y la comunidad no ha aceptado ninguna demostración. La aceptación es social además de lógica: un preprint es una afirmación, un artículo arbitrado ha sido revisado por expertos, y una formalización verificada por máquina (por ejemplo en Lean) comprueba que la prueba se sigue de las definiciones enunciadas, no que esas definiciones digan lo que se quería decir. Los estados cambian. Algunas tarjetas recogen anuncios de 2026 que por ahora solo existen como preprints o notas de prensa; están marcados como afirmaciones, no como resultados. Además, una conjetura puede ser cierta en una clase de regularidad y falsa en otra: la conjetura de Carathéodory está demostrada para superficies real-analíticas (Hamburger), mientras que su estado para superficies meramente suaves está disputado.` },
    { heading: 'El flujo de Ricci y la conjetura de Poincaré', body: r`El [[ricci-flow|flujo de Ricci]] de Hamilton deforma una métrica según

$$\partial_t g=-2\,\mathrm{Ric}(g).$$

En una superficie $\mathrm{Ric}=Kg$, así que el flujo encoge las regiones de curvatura positiva y expande las de curvatura negativa. El área cumple entonces $\frac{dA}{dt}=-2\int K\,dA=-4\pi\chi$, de modo que una esfera pierde área a ritmo constante $8\pi$, por muy deformada que empiece, y fluye hacia un punto redondo. En dimensión 3 el flujo puede formar cuellos que se estrangulan (un "neckpinch"). Perelman los controló con una entropía monótona, los cortó ("cirugía") y continuó el flujo; así demostró la conjetura de Poincaré (2002-03) y la conjetura de geometrización de Thurston. El Instituto Clay concedió el premio en 2010 y Perelman lo rechazó.` },
    { heading: 'El problema de Willmore', body: r`La [[willmore-energy|energía de Willmore]] de una superficie es

$$W=\int_\Sigma H^2\,dA,\qquad H=\tfrac12(\kappa_1+\kappa_2).$$

Es al menos $4\pi$, con igualdad para esferas redondas, y no cambia bajo transformaciones de Möbius. Para un toro de revolución con $c=R/r$ se calcula $W=\pi^2c^2/\sqrt{c^2-1}$, mínima en $c=\sqrt2$ con $W=2\pi^2$. Willmore conjeturó en 1965 que $2\pi^2$ es el mínimo entre todos los toros; Marques y Neves lo demostraron en 2012-14 con teoría min-max. A su lado está la conjetura de Carathéodory sobre los [[umbilic|puntos umbílicos]], donde $\kappa_1=\kappa_2$: toda superficie convexa cerrada debería tener al menos dos, pero para superficies suaves no analíticas la situación está ahora disputada.` },
    { heading: 'Teoría gauge y Yang–Mills', body: r`Un campo gauge es una conexión $A$ en un fibrado; su curvatura es $F=dA+A\wedge A$, y la [[holonomy|holonomía]] alrededor de un lazo pequeño mide $F$. Para un grupo abeliano (electromagnetismo) las holonomías conmutan y solo dependen del flujo encerrado. Para un grupo no abeliano como $SU(2)$ no conmutan, y el orden de los lazos importa. Una [[yang-mills|conexión de Yang–Mills]] es crítica para $\int|F|^2$, es decir, cumple $d_A\star F=0$. El problema de Clay pide una teoría cuántica de Yang–Mills rigurosa en $\mathbb{R}^4$ con brecha de masa; sigue abierto, y ninguna demostración afirmada está establecida.` },
    { heading: 'La desigualdad de Penrose y la censura cósmica', body: r`Penrose argumentó que, si las leyes de la gravedad son predecibles, un agujero negro con área de horizonte $A$ debe tener masa

$$m\ge\sqrt{\frac{A}{16\pi}},$$

con igualdad para Schwarzschild, donde $A=16\pi m^2$. Para datos iniciales simétricos en el tiempo la demostraron Huisken-Ilmanen y Bray (2001); el caso general está abierto. La desigualdad es una prima cuantitativa de la [[cosmic-censorship|censura cósmica]]. La censura débil dice que las singularidades del colapso quedan ocultas tras horizontes; la fuerte, que el espaciotiempo queda determinado por sus datos iniciales. Dafermos y Luk mostraron que la versión $C^0$ del enunciado fuerte falla para Kerr, mientras que las versiones corregidas siguen abiertas. La estabilidad no lineal de Kerr solo se conoce para momento angular pequeño.` },
  ],
  refs: [
    'Morgan y Tian, Ricci Flow and the Poincaré Conjecture (AMS/Clay, 2007); Kleiner y Lott, Notes on Perelman’s papers, Geom. Topol. 12 (2008)',
    'Marques y Neves, Min-max theory and the Willmore conjecture, Ann. of Math. 179 (2014)',
    'Jaffe y Witten, Quantum Yang–Mills Theory (enunciado del problema del milenio de Clay); Bleecker, Gauge Theory and Variational Principles (1981)',
    'Bray, Black holes and the Penrose inequality in general relativity (ICM 2002); Mars, Present status of the Penrose inequality, Class. Quantum Grav. 26 (2009)',
    'Dafermos y Luk, The interior of dynamical vacuum black holes I, Ann. of Math. 202 (2025); Klainerman y Szeftel, Kerr stability for small angular momentum (arXiv 2021)',
    'Arnold y Khesin, Topological Methods in Hydrodynamics (Springer, 1998)',
  ],
};

export const FRONTIERS_TASKS: Task[] = [
  { id: 'fr-csf-area', module: M,
    prompt: 'In Curve shortening, compare the measured $dA/dt$ with $-2\\pi$ for two different curves. Why is it the same?',
    hint: 'Under curve shortening the normal speed is $\\kappa$. Compute $dA/dt=-\\oint\\kappa\\,ds$ and use the turning number.',
    answer: 'For a simple closed curve $\\oint\\kappa\\,ds=2\\pi$ (the tangent turns once), so $dA/dt=-2\\pi$ whatever the shape. Hence a curve shrinks to a point at $T=A_0/2\\pi$.' },
  { id: 'fr-ricci-2d', module: M,
    prompt: 'In Ricci flow, why can the 2D dumbbell not pinch?',
    hint: 'Which sign does the Gaussian curvature of the thin neck have, and what does $\\partial_t g=-2Kg$ do where $K<0$?',
    answer: 'On a surface $\\mathrm{Ric}=Kg$. A neck of a dumbbell is saddle-shaped, so $K<0$ there and the flow expands it, while the positive-curvature bulbs shrink. In 2D the flow therefore rounds the sphere (Hamilton), and no neckpinch occurs. In 3D a neck can have positive Ricci curvature in the cross-section directions and pinches, which is why Perelman needed surgery.' },
  { id: 'fr-willmore-c', module: M,
    prompt: 'In Willmore, find the $c=R/r$ that minimises $W$ for a torus of revolution.',
    hint: 'Look for the lowest value of $W$ as you slide $c$. It is near 1.4. Compare with $2\\pi^2$, about 19.74.',
    answer: '$W(c)=\\pi^2c^2/\\sqrt{c^2-1}$ is minimal at $c=\\sqrt2$, where $W=2\\pi^2$ (about 19.74). This is the Clifford torus, the minimiser in the Willmore conjecture (Marques–Neves).' },
  { id: 'fr-penrose-eq', module: M,
    prompt: 'In Penrose inequality, when is $m=\\sqrt{A/16\\pi}$?',
    hint: 'Try the Schwarzschild example, where the horizon is at $r=2m$.',
    answer: 'For Schwarzschild, $A=4\\pi(2m)^2=16\\pi m^2$, so equality holds. In the Riemannian case equality happens only for a slice of Schwarzschild; for any other data $m$ is strictly larger.' },
  { id: 'fr-gauge-order', module: M,
    prompt: 'In Yang–Mills holonomy, set $\\lambda=0$: does the order of the loops matter?',
    hint: 'At $\\lambda=0$ only one generator of $SU(2)$ is involved. Do those matrices commute?',
    answer: 'At $\\lambda=0$ the field is abelian, so holonomies commute and the order does not matter. For $\\lambda\\neq0$ the generators do not commute, and traversing the loops in the opposite order gives a different result. That difference is the non-abelian curvature.' },
  { id: 'fr-open-claim', module: M,
    prompt: 'In Problems, open a card whose status note mentions a 2026 claim. What does the card say is still missing?',
    hint: 'Look for words such as "preprint", "unverified" or "awaits validation".',
    answer: 'Cards list a claim as a claim until it is refereed or independently confirmed. A preprint or announcement is not yet an accepted theorem, even when a machine-checked formalisation exists.' },
];
export const FRONTIERS_TASKS_ES: Task[] = [
  { id: 'fr-csf-area', module: M,
    prompt: 'En Acortamiento de curvas, compara el $dA/dt$ medido con $-2\\pi$ para dos curvas distintas. ¿Por qué sale igual?',
    hint: 'En el acortamiento de curvas la velocidad normal es $\\kappa$. Calcula $dA/dt=-\\oint\\kappa\\,ds$ y usa el índice de giro.',
    answer: 'Para una curva cerrada simple $\\oint\\kappa\\,ds=2\\pi$ (la tangente da una vuelta), así que $dA/dt=-2\\pi$ sea cual sea la forma. Por eso una curva se contrae a un punto en $T=A_0/2\\pi$.' },
  { id: 'fr-ricci-2d', module: M,
    prompt: 'En Flujo de Ricci, ¿por qué la mancuerna 2D no puede estrangularse?',
    hint: '¿Qué signo tiene la curvatura de Gauss del cuello delgado, y qué hace $\\partial_t g=-2Kg$ donde $K<0$?',
    answer: 'En una superficie $\\mathrm{Ric}=Kg$. El cuello de una mancuerna tiene forma de silla, así que allí $K<0$ y el flujo lo expande, mientras que los bulbos de curvatura positiva se encogen. En 2D el flujo redondea la esfera (Hamilton) y no hay neckpinch. En 3D un cuello puede tener curvatura de Ricci positiva en las direcciones de la sección y se estrangula, por eso Perelman necesitó la cirugía.' },
  { id: 'fr-willmore-c', module: M,
    prompt: 'En Willmore, halla el $c=R/r$ que minimiza $W$ en un toro de revolución.',
    hint: 'Busca el menor valor de $W$ al deslizar $c$. Está cerca de 1,4. Compáralo con $2\\pi^2$, unos 19,74.',
    answer: '$W(c)=\\pi^2c^2/\\sqrt{c^2-1}$ es mínima en $c=\\sqrt2$, donde $W=2\\pi^2$ (unos 19,74). Es el toro de Clifford, el minimizador de la conjetura de Willmore (Marques–Neves).' },
  { id: 'fr-penrose-eq', module: M,
    prompt: 'En Desigualdad de Penrose, ¿cuándo se cumple $m=\\sqrt{A/16\\pi}$?',
    hint: 'Prueba el ejemplo de Schwarzschild, donde el horizonte está en $r=2m$.',
    answer: 'En Schwarzschild, $A=4\\pi(2m)^2=16\\pi m^2$, así que hay igualdad. En el caso riemanniano la igualdad solo ocurre para una sección de Schwarzschild; para cualquier otro dato $m$ es estrictamente mayor.' },
  { id: 'fr-gauge-order', module: M,
    prompt: 'En Holonomía de Yang–Mills, pon $\\lambda=0$: ¿importa el orden de los lazos?',
    hint: 'Con $\\lambda=0$ solo interviene un generador de $SU(2)$. ¿Conmutan esas matrices?',
    answer: 'Con $\\lambda=0$ el campo es abeliano, así que las holonomías conmutan y el orden no importa. Para $\\lambda\\neq0$ los generadores no conmutan, y recorrer los lazos en el orden contrario da un resultado distinto. Esa diferencia es la curvatura no abeliana.' },
  { id: 'fr-open-claim', module: M,
    prompt: 'En Problemas, abre una tarjeta cuya nota de estado mencione una afirmación de 2026. ¿Qué dice la tarjeta que sigue faltando?',
    hint: 'Busca palabras como "preprint", "sin verificar" o "espera validación".',
    answer: 'Las tarjetas tratan una afirmación como afirmación hasta que está arbitrada o confirmada de forma independiente. Un preprint o un anuncio aún no es un teorema aceptado, aunque exista una formalización verificada por máquina.' },
];
