// Problem cards for the Frontiers module. Statuses were checked against the sources listed on each card
// (see `checked`). Anything moving or disputed says so in statusNote. Strings with $...$ are KaTeX.
const r = String.raw;

export type ProblemArea = 'millennium' | 'geometry' | 'relativity';
export type ProblemStatus = 'solved' | 'partial' | 'open';
export type DemoView = 'csf' | 'ricci' | 'willmore' | 'penrose' | 'gauge';

export interface Problem {
  id: string;
  area: ProblemArea;
  status: ProblemStatus;
  demo?: DemoView;
  /** hash id of a related module */
  module?: string;
  sources: { label: string; url: string }[];
  /** month the status was last checked */
  checked: string;
  en: ProblemText;
  es: ProblemText;
}
export interface ProblemText {
  title: string;
  statusNote: string;
  plain: string;
  formal: string;
  why: string;
}

const CHECKED = '2026-11';
const CLAY = (slug: string, label: string) => ({ label, url: `https://www.claymath.org/millennium-problems/${slug}/` });
const ARXIV = (id: string, label: string) => ({ label, url: `https://arxiv.org/abs/${id}` });

export const PROBLEMS: Problem[] = [
  {
    id: 'poincare', area: 'millennium', status: 'solved', demo: 'ricci', module: 'curvature', checked: CHECKED,
    sources: [CLAY('poincare-conjecture', 'Clay Mathematics Institute: Poincaré conjecture'), ARXIV('math/0211159', 'Perelman, The entropy formula for the Ricci flow (2002)'), ARXIV('math/0307245', 'Perelman, Ricci flow with surgery, third paper (2003)'), ARXIV('math/0605667', 'Kleiner–Lott, Notes on Perelman’s papers')],
    en: {
      title: 'Poincaré conjecture',
      statusNote: 'Solved. Perelman posted the proof in 2002–03 using Ricci flow with surgery; the details were written out by Kleiner–Lott, Morgan–Tian and Cao–Zhu. The Clay Institute awarded him the prize in March 2010 and he declined it. It is the only Millennium Prize awarded so far.',
      plain: 'A closed 3-dimensional space with no holes of any kind (every loop can be shrunk to a point) must be a 3-sphere.',
      formal: r`If $M^3$ is closed and simply connected, then $M^3$ is diffeomorphic to $S^3$. Hamilton’s Ricci flow $\partial_t g = -2\,\mathrm{Ric}(g)$ is run with surgery on the singularities that develop.`,
      why: r`Ricci flow smooths a metric like heat flow, but 3-dimensional flows form necks that pinch off. Perelman found a monotone quantity (his entropy $\mathcal{W}$) that controls these singularities and lets one cut them out and continue. The argument decomposes every closed 3-manifold into geometric pieces.`,
    },
    es: {
      title: 'Conjetura de Poincaré',
      statusNote: 'Resuelta. Perelman publicó la demostración en 2002–03 con el flujo de Ricci con cirugía; los detalles los escribieron Kleiner–Lott, Morgan–Tian y Cao–Zhu. El Instituto Clay le concedió el premio en marzo de 2010 y lo rechazó. Es el único Premio del Milenio concedido hasta ahora.',
      plain: 'Un espacio tridimensional cerrado sin agujeros de ningún tipo (todo lazo se puede contraer a un punto) tiene que ser una 3-esfera.',
      formal: r`Si $M^3$ es cerrada y simplemente conexa, entonces $M^3$ es difeomorfa a $S^3$. El flujo de Ricci de Hamilton $\partial_t g = -2\,\mathrm{Ric}(g)$ se ejecuta con cirugía en las singularidades que aparecen.`,
      why: r`El flujo de Ricci suaviza una métrica como el calor, pero en dimensión 3 se forman cuellos que se estrangulan. Perelman encontró una cantidad monótona (su entropía $\mathcal{W}$) que controla esas singularidades y permite cortarlas y continuar. El argumento descompone toda 3-variedad cerrada en piezas geométricas.`,
    },
  },
  {
    id: 'geometrization', area: 'geometry', status: 'solved', demo: 'ricci', checked: CHECKED,
    sources: [ARXIV('math/0605667', 'Kleiner–Lott, Notes on Perelman’s papers'), ARXIV('math/0307245', 'Perelman, Ricci flow with surgery, third paper (2003)'), CLAY('poincare-conjecture', 'Clay Mathematics Institute: Poincaré conjecture')],
    en: {
      title: 'Thurston’s geometrization conjecture',
      statusNote: 'Solved by Perelman (2003), building on Hamilton’s Ricci flow and Thurston’s earlier work on Haken manifolds. The Poincaré conjecture is a special case.',
      plain: 'Every closed 3-dimensional space can be cut along spheres and tori into pieces, each of which has one of eight uniform geometries.',
      formal: r`Every closed orientable 3-manifold decomposes along embedded spheres and incompressible tori into pieces that carry a complete locally homogeneous metric modelled on one of eight geometries ($S^3$, $\mathbb{R}^3$, $\mathbb{H}^3$, $S^2\times\mathbb{R}$, $\mathbb{H}^2\times\mathbb{R}$, $\widetilde{SL_2\mathbb{R}}$, Nil, Sol).`,
      why: r`It is a complete classification of 3-manifolds, the 3-dimensional analogue of the uniformisation theorem for surfaces. The hyperbolic geometry $\mathbb{H}^3$ turns out to be the generic one.`,
    },
    es: {
      title: 'Conjetura de geometrización de Thurston',
      statusNote: 'Resuelta por Perelman (2003), a partir del flujo de Ricci de Hamilton y del trabajo previo de Thurston sobre variedades de Haken. La conjetura de Poincaré es un caso particular.',
      plain: 'Todo espacio tridimensional cerrado se puede cortar a lo largo de esferas y toros en piezas, cada una con una de ocho geometrías uniformes.',
      formal: r`Toda 3-variedad cerrada y orientable se descompone a lo largo de esferas y toros incompresibles encajados en piezas que admiten una métrica completa localmente homogénea modelada en una de ocho geometrías ($S^3$, $\mathbb{R}^3$, $\mathbb{H}^3$, $S^2\times\mathbb{R}$, $\mathbb{H}^2\times\mathbb{R}$, $\widetilde{SL_2\mathbb{R}}$, Nil, Sol).`,
      why: r`Es una clasificación completa de las 3-variedades, el análogo tridimensional del teorema de uniformización de superficies. La geometría hiperbólica $\mathbb{H}^3$ resulta ser la genérica.`,
    },
  },
  {
    id: 'yang-mills', area: 'millennium', status: 'open', demo: 'gauge', checked: CHECKED,
    sources: [{ label: 'Clay Mathematics Institute: Yang–Mills and the mass gap (Jaffe–Witten statement)', url: 'https://www.claymath.org/millennium/yang-mills-the-maths-gap/' }, { label: 'Wikipedia: Millennium Prize Problems (status summary, Oct 2026)', url: 'https://en.wikipedia.org/wiki/Millennium_Prize_Problems' }],
    en: {
      title: 'Yang–Mills existence and mass gap',
      statusNote: 'Open. No proof has been accepted and the Clay prize is unawarded.',
      plain: 'Physicists use Yang–Mills theories to describe the strong force. The problem asks for a mathematically rigorous version of the theory in 4 dimensions, and a proof that its lightest particle has strictly positive mass.',
      formal: r`For a compact simple gauge group $G$, construct a quantum Yang–Mills theory on $\mathbb{R}^4$ satisfying the Osterwalder–Schrader axioms, and show it has a mass gap $\Delta>0$. Classically, the field is a connection $A$ with curvature $F_A$ and action $\int |F_A|^2$.`,
      why: r`The classical theory is differential geometry: connections on principal bundles, holonomy and curvature. The quantum theory needs a path integral over such connections, which nobody has defined rigorously in 4 dimensions. Lattice simulations strongly suggest a mass gap, but there is no proof.`,
    },
    es: {
      title: 'Existencia de Yang–Mills y brecha de masa',
      statusNote: 'Abierto. No se ha aceptado ninguna demostración y el premio Clay sigue sin concederse.',
      plain: 'Los físicos usan las teorías de Yang–Mills para describir la fuerza fuerte. El problema pide una versión matemáticamente rigurosa de la teoría en 4 dimensiones y una demostración de que su partícula más ligera tiene masa estrictamente positiva.',
      formal: r`Para un grupo de gauge $G$ compacto y simple, construir una teoría cuántica de Yang–Mills en $\mathbb{R}^4$ que cumpla los axiomas de Osterwalder–Schrader y probar que tiene una brecha de masa $\Delta>0$. Clásicamente, el campo es una conexión $A$ con curvatura $F_A$ y acción $\int |F_A|^2$.`,
      why: r`La teoría clásica es geometría diferencial: conexiones en fibrados principales, holonomía y curvatura. La teoría cuántica necesita una integral de caminos sobre esas conexiones, que nadie ha definido con rigor en dimensión 4. Las simulaciones en retículo sugieren con fuerza una brecha de masa, pero no hay demostración.`,
    },
  },
  {
    id: 'hodge', area: 'millennium', status: 'open', checked: CHECKED,
    sources: [CLAY('hodge-conjecture', 'Clay Mathematics Institute: Hodge conjecture (Deligne statement)'), { label: 'Wikipedia: Millennium Prize Problems (status summary, Oct 2026)', url: 'https://en.wikipedia.org/wiki/Millennium_Prize_Problems' }],
    en: {
      title: 'Hodge conjecture',
      statusNote: 'Open.',
      plain: 'On a smooth complex projective variety, certain cohomology classes that look like they come from geometry should really be combinations of classes of algebraic subvarieties.',
      formal: r`On a smooth complex projective variety $X$, every Hodge class in $H^{2k}(X,\mathbb{Q})\cap H^{k,k}(X)$ is a rational linear combination of classes of algebraic cycles of codimension $k$.`,
      why: r`It links the analysis of harmonic forms on a Kähler manifold with the algebra of subvarieties. It is known for $k=1$ (Lefschetz $(1,1)$ theorem) but not in general. This module has no demo for it; it sits at the border of differential and algebraic geometry.`,
    },
    es: {
      title: 'Conjetura de Hodge',
      statusNote: 'Abierta.',
      plain: 'En una variedad proyectiva compleja y lisa, ciertas clases de cohomología que parecen venir de la geometría deberían ser realmente combinaciones de clases de subvariedades algebraicas.',
      formal: r`En una variedad proyectiva compleja y lisa $X$, toda clase de Hodge en $H^{2k}(X,\mathbb{Q})\cap H^{k,k}(X)$ es una combinación lineal racional de clases de ciclos algebraicos de codimensión $k$.`,
      why: r`Conecta el análisis de las formas armónicas en una variedad de Kähler con el álgebra de las subvariedades. Se conoce para $k=1$ (teorema $(1,1)$ de Lefschetz) pero no en general. Este módulo no tiene demo para ella; está en la frontera entre la geometría diferencial y la algebraica.`,
    },
  },
  {
    id: 'navier-stokes', area: 'millennium', status: 'open', module: 'geodesics', checked: CHECKED,
    sources: [CLAY('navier-stokes-equation', 'Clay Mathematics Institute: Navier–Stokes equation (Fefferman statement)'), { label: 'Arnold 1966, Ann. Inst. Fourier 16: geodesics on groups of diffeomorphisms', url: 'https://www.numdam.org/item/AIF_1966__16_1_319_0/' }, { label: 'Wikipedia: Millennium Prize Problems (status summary, Oct 2026)', url: 'https://en.wikipedia.org/wiki/Millennium_Prize_Problems' }],
    en: {
      title: 'Navier–Stokes existence and smoothness',
      statusNote: 'Open, with a major claim under review. Clay’s statement can be settled either by proving regularity (alternatives A, B) or by a breakdown example (C, D), and the breakdown alternatives allow a smooth external force. On 8 Sept 2026 OpenAI posted a claimed finite-time blow-up of this forced kind, with a Lean formalisation. If it is verified it would settle the problem; as of Nov 2026 it has not been refereed, and Clay awards a prize only after publication and two years of general acceptance.',
      plain: 'Do the equations for water flow always have smooth solutions in 3D, or can a perfectly smooth flow develop an infinite velocity in finite time?',
      formal: r`For $\partial_t u + (u\cdot\nabla)u = -\nabla p + \nu\Delta u + f$, $\ \nabla\cdot u = 0$ on $\mathbb{R}^3$ with smooth data, either prove global smooth solutions exist or show a solution blows up. Arnold (1966): Euler’s equations ($\nu=0$) are the geodesic equation of the $L^2$ metric on the group of volume-preserving diffeomorphisms.`,
      why: r`Energy is conserved but gives no control on derivatives, and the nonlinear term can in principle concentrate energy at small scales. Arnold’s observation puts the inviscid problem inside Riemannian geometry: fluid motion is a geodesic in an infinite-dimensional manifold, whose curvature governs stability.`,
    },
    es: {
      title: 'Existencia y regularidad de Navier–Stokes',
      statusNote: 'Abierto, con una afirmación importante en revisión. El enunciado de Clay se resuelve demostrando la regularidad (alternativas A, B) o con un ejemplo de explosión (C, D), y las alternativas de explosión admiten una fuerza externa suave. El 8 de septiembre de 2026 OpenAI publicó una supuesta explosión en tiempo finito de este tipo forzado, con formalización en Lean. Si se verifica, resolvería el problema; en noviembre de 2026 no ha sido arbitrada, y Clay solo concede el premio tras la publicación y dos años de aceptación general.',
      plain: '¿Las ecuaciones del flujo del agua siempre tienen soluciones suaves en 3D, o un flujo perfectamente suave puede desarrollar velocidad infinita en tiempo finito?',
      formal: r`Para $\partial_t u + (u\cdot\nabla)u = -\nabla p + \nu\Delta u + f$, $\ \nabla\cdot u = 0$ en $\mathbb{R}^3$ con datos suaves, probar que hay soluciones suaves globales o mostrar que una solución explota. Arnold (1966): las ecuaciones de Euler ($\nu=0$) son la ecuación geodésica de la métrica $L^2$ en el grupo de difeomorfismos que preservan el volumen.`,
      why: r`La energía se conserva pero no controla las derivadas, y el término no lineal podría concentrar energía en escalas pequeñas. La observación de Arnold sitúa el problema no viscoso dentro de la geometría riemanniana: el movimiento del fluido es una geodésica en una variedad de dimensión infinita, cuya curvatura gobierna la estabilidad.`,
    },
  },
  {
    id: 'other-millennium', area: 'millennium', status: 'open', checked: CHECKED,
    sources: [CLAY('riemann-hypothesis', 'Clay Mathematics Institute: Riemann hypothesis'), { label: 'Clay Mathematics Institute: P vs NP', url: 'https://www.claymath.org/millennium/p-vs-np/' }, CLAY('birch-and-swinnerton-dyer-conjecture', 'Clay Mathematics Institute: Birch and Swinnerton-Dyer conjecture')],
    en: {
      title: 'Three Millennium problems that are not differential geometry',
      statusNote: 'All three open as listed by Clay and Wikipedia (Oct 2026).',
      plain: 'For completeness: Riemann hypothesis, P vs NP, and Birch–Swinnerton-Dyer.',
      formal: r`Riemann hypothesis: all non-trivial zeros of $\zeta(s)$ have $\mathrm{Re}\,s=\tfrac12$. P vs NP: is every problem whose solutions can be checked quickly also solvable quickly? Birch–Swinnerton-Dyer: for an elliptic curve $E/\mathbb{Q}$ of rank $r$, $L(E,s)$ vanishes to order $r$ at $s=1$.`,
      why: r`They belong to number theory and computer science. They are listed here so the Millennium list is complete.`,
    },
    es: {
      title: 'Tres problemas del milenio que no son geometría diferencial',
      statusNote: 'Los tres siguen abiertos según Clay y Wikipedia (oct. 2026).',
      plain: 'Para completar la lista: la hipótesis de Riemann, P frente a NP y Birch–Swinnerton-Dyer.',
      formal: r`Hipótesis de Riemann: todos los ceros no triviales de $\zeta(s)$ cumplen $\mathrm{Re}\,s=\tfrac12$. P frente a NP: ¿todo problema cuyas soluciones se comprueban rápido también se resuelve rápido? Birch–Swinnerton-Dyer: para una curva elíptica $E/\mathbb{Q}$ de rango $r$, $L(E,s)$ se anula con orden $r$ en $s=1$.`,
      why: r`Pertenecen a la teoría de números y a la informática. Se incluyen aquí para que la lista del milenio esté completa.`,
    },
  },
  {
    id: 'willmore', area: 'geometry', status: 'solved', demo: 'willmore', module: 'curvature', checked: CHECKED,
    sources: [ARXIV('1202.6036', 'Marques–Neves, Min-max theory and the Willmore conjecture, Ann. of Math. 179 (2014)'), { label: 'Annals of Mathematics (doi 10.4007/annals.2014.179.2.6)', url: 'https://doi.org/10.4007/annals.2014.179.2.6' }],
    en: {
      title: 'Willmore conjecture',
      statusNote: 'Solved by Fernando Codá Marques and André Neves (preprint 2012, Annals of Mathematics 2014) using min-max theory. Willmore posed it in 1965.',
      plain: 'Among all smooth tori in 3-space, the “roundest” one, the one that bends least on average, is a particular torus of revolution with $R/r=\\sqrt2$.',
      formal: r`For every smooth embedded torus $\Sigma\subset\mathbb{R}^3$, $W(\Sigma)=\int_\Sigma H^2\,dA \ge 2\pi^2$, with equality only for the Clifford torus (up to Möbius transformations), where $H$ is the mean curvature.`,
      why: r`$W$ is invariant under Möbius transformations (including inversions), so one must minimise over a non-compact family and rule out degenerating tori. Marques and Neves used a min-max argument over families of surfaces. The conjecture for higher genus is a different, still active, problem.`,
    },
    es: {
      title: 'Conjetura de Willmore',
      statusNote: 'Resuelta por Fernando Codá Marques y André Neves (preprint de 2012, Annals of Mathematics 2014) con teoría min-max. Willmore la planteó en 1965.',
      plain: 'Entre todos los toros suaves en el espacio, el más “redondo”, el que se curva menos en promedio, es un toro de revolución concreto con $R/r=\\sqrt2$.',
      formal: r`Para todo toro $\Sigma\subset\mathbb{R}^3$ liso y encajado, $W(\Sigma)=\int_\Sigma H^2\,dA \ge 2\pi^2$, con igualdad solo para el toro de Clifford (salvo transformaciones de Möbius), donde $H$ es la curvatura media.`,
      why: r`$W$ es invariante por transformaciones de Möbius (incluidas las inversiones), así que hay que minimizar sobre una familia no compacta y descartar toros que degeneran. Marques y Neves usaron un argumento min-max sobre familias de superficies. La conjetura para género mayor es otro problema, todavía activo.`,
    },
  },
  {
    id: 'caratheodory', area: 'geometry', status: 'partial', demo: 'willmore', checked: CHECKED,
    sources: [{ label: 'Wikipedia: Carathéodory conjecture (history of the claimed proofs)', url: 'https://en.wikipedia.org/wiki/Carath%C3%A9odory_conjecture' }, ARXIV('0808.0851', 'Guilfoyle–Klingenberg, Proof of the Carathéodory conjecture (2008, C^{3,α})'), ARXIV('2610.34036', 'Ando–Umehara, smooth counterexamples to the Loewner and Carathéodory conjectures (Oct 2026)'), { label: 'Wikipedia: Levent Alpöge (Aug 2026 announcement of a C^∞ counterexample)', url: 'https://en.wikipedia.org/wiki/Levent_Alp%C3%B6ge' }],
    en: {
      title: 'Carathéodory conjecture',
      statusNote: 'Disputed and moving. The real-analytic case goes back to Hamburger (1940–41), with later treatments (Ivanov, 2002). Guilfoyle and Klingenberg announced a proof for $C^{3,\\alpha}$ surfaces in 2008, which has not been generally accepted. In August 2026 Alpöge announced an explicit $C^\\infty$ counterexample (a convex surface with a single umbilic), and in October 2026 Ando–Umehara posted a simpler construction. These are not yet refereed and conflict with the 2008 claim, so the smooth case is unsettled.',
      plain: 'Every smooth egg-shaped surface should have at least two points where it curves equally in all directions, like a point on a sphere.',
      formal: r`Every closed, strictly convex, sufficiently smooth surface in $\mathbb{R}^3$ has at least two umbilic points, where the principal curvatures satisfy $\kappa_1=\kappa_2$. Equivalently, the lines of curvature field has total index $2$ by Poincaré–Hopf, and the question is whether it can be concentrated in a single umbilic of index $2$.`,
      why: r`Away from umbilics the principal directions give a line field whose singularities have index $\tfrac k2$. Poincaré–Hopf forces total index $2$ on a sphere, so the hard part is a local bound: can an isolated umbilic have index greater than $1$? Hamburger’s theorem says no for analytic surfaces; whether smoothness alone suffices is exactly what is now contested.`,
    },
    es: {
      title: 'Conjetura de Carathéodory',
      statusNote: 'Disputada y en movimiento. El caso real-analítico se remonta a Hamburger (1940–41), con tratamientos posteriores (Ivanov, 2002). Guilfoyle y Klingenberg anunciaron en 2008 una prueba para superficies $C^{3,\\alpha}$, que no ha sido aceptada de forma general. En agosto de 2026 Alpöge anunció un contraejemplo explícito $C^\\infty$ (una superficie convexa con un solo umbílico), y en octubre de 2026 Ando–Umehara publicaron una construcción más sencilla. Aún no están arbitrados y contradicen la afirmación de 2008, así que el caso suave no está resuelto.',
      plain: 'Toda superficie suave con forma de huevo debería tener al menos dos puntos donde se curva igual en todas las direcciones, como un punto de una esfera.',
      formal: r`Toda superficie cerrada, estrictamente convexa y suficientemente suave en $\mathbb{R}^3$ tiene al menos dos puntos umbílicos, donde las curvaturas principales cumplen $\kappa_1=\kappa_2$. Equivalentemente, el campo de líneas de curvatura tiene índice total $2$ por Poincaré–Hopf, y la cuestión es si puede concentrarse en un solo umbílico de índice $2$.`,
      why: r`Lejos de los umbílicos las direcciones principales dan un campo de líneas cuyas singularidades tienen índice $\tfrac k2$. Poincaré–Hopf fuerza índice total $2$ en la esfera, así que lo difícil es una cota local: ¿puede un umbílico aislado tener índice mayor que $1$? El teorema de Hamburger dice que no para superficies analíticas; si basta la suavidad es justo lo que ahora se discute.`,
    },
  },
  {
    id: 'hopf', area: 'geometry', status: 'open', module: 'curvature', checked: CHECKED,
    sources: [{ label: 'MathWorld: Hopf conjecture', url: 'https://mathworld.wolfram.com/HopfConjecture.html' }, ARXIV('2608.19068', 'Brendle–Hung, A metric on S²×S² with positive sectional curvature (Aug 2026 preprint)'), ARXIV('2609.11980', 'Metric with positive sectional curvature on S³×S³ (Sept 2026 preprint)')],
    en: {
      title: 'Hopf conjectures',
      statusNote: 'Open as classically stated, but moving. In August 2026 Brendle and Hung posted a preprint constructing a metric of positive sectional curvature on $S^2\\times S^2$, with computer-algebra code attached; in September 2026 another preprint claimed the same for $S^3\\times S^3$. Neither has been refereed or independently confirmed as of Nov 2026.',
      plain: 'Hopf asked two questions. Can the product of two spheres ever be given a metric that curves like a sphere everywhere (positive sectional curvature)? And does positive curvature in even dimension force a positive Euler characteristic?',
      formal: r`(1) Does $S^2\times S^2$ admit a metric with $K>0$ for every 2-plane? (2) If $M^{2n}$ is closed with sectional curvature $K>0$, is $\chi(M)>0$? For $n=1$ it holds by Gauss–Bonnet, since $K>0$ forces $\chi=2$.`,
      why: r`Very few closed manifolds are known to have positive sectional curvature, and almost all known examples come from symmetry. The standard product metric on $S^2\times S^2$ has flat 2-planes, and Hsiang–Kleiner (1989) showed any positive-curvature metric on a 4-manifold cannot have a continuous symmetry, which is why constructing one needs delicate perturbations.`,
    },
    es: {
      title: 'Conjeturas de Hopf',
      statusNote: 'Abiertas tal como se enuncian clásicamente, pero en movimiento. En agosto de 2026 Brendle y Hung publicaron un preprint que construye una métrica de curvatura seccional positiva en $S^2\\times S^2$, con el código de álgebra computacional adjunto; en septiembre de 2026 otro preprint afirmó lo mismo para $S^3\\times S^3$. Ninguno está arbitrado ni confirmado de forma independiente en noviembre de 2026.',
      plain: 'Hopf planteó dos preguntas. ¿Se puede dar al producto de dos esferas una métrica que se curve como una esfera en todas partes (curvatura seccional positiva)? ¿Y la curvatura positiva en dimensión par obliga a que la característica de Euler sea positiva?',
      formal: r`(1) ¿Admite $S^2\times S^2$ una métrica con $K>0$ en todo plano? (2) Si $M^{2n}$ es cerrada con curvatura seccional $K>0$, ¿es $\chi(M)>0$? Para $n=1$ se cumple por Gauss–Bonnet, pues $K>0$ fuerza $\chi=2$.`,
      why: r`Se conocen muy pocas variedades cerradas con curvatura seccional positiva, y casi todos los ejemplos conocidos vienen de simetrías. La métrica producto estándar de $S^2\times S^2$ tiene planos planos, y Hsiang–Kleiner (1989) mostraron que una métrica de curvatura positiva en una 4-variedad no puede tener simetría continua, de ahí que construir una exija perturbaciones delicadas.`,
    },
  },
  {
    id: 'chern-affine', area: 'geometry', status: 'partial', module: 'curvature', checked: CHECKED,
    sources: [{ label: 'Klingler, Chern’s conjecture for special affine manifolds, Ann. of Math. 186 (2017)', url: 'https://annals.math.princeton.edu/2017/186-1/p02' }, ARXIV('1504.04852', 'Cocos, On polarized Pfaffians and the Euler characteristic of flat affine manifolds (preprint, claims a full proof)')],
    en: {
      title: 'Chern’s conjecture on affine manifolds',
      statusNote: 'Partly solved. Known for surfaces (Benzécri 1955), for complete affine structures (Kostant–Sullivan 1975), and for special affine manifolds, those with a parallel volume form (Klingler 2017). The general case is open; a long-standing preprint claiming a proof (Cocos) has not been accepted.',
      plain: 'If a closed space can be covered by flat coordinate charts glued by straight-line (affine) maps, its Euler characteristic must be zero.',
      formal: r`If a closed manifold $M$ admits a flat torsion-free connection (an affine structure), then $\chi(M)=0$.`,
      why: r`A flat connection has zero curvature, so the Euler class of $TM$ should vanish by Chern–Weil theory. The catch is that the connection is not metric, so the usual Pfaffian formula for $\chi$ does not apply. Smillie’s examples show the torsion-free hypothesis cannot be dropped.`,
    },
    es: {
      title: 'Conjetura de Chern sobre variedades afines',
      statusNote: 'Resuelta en parte. Se conoce para superficies (Benzécri 1955), para estructuras afines completas (Kostant–Sullivan 1975) y para variedades afines especiales, las que tienen una forma de volumen paralela (Klingler 2017). El caso general está abierto; un preprint antiguo que afirma una demostración (Cocos) no ha sido aceptado.',
      plain: 'Si un espacio cerrado se puede cubrir con cartas planas pegadas mediante aplicaciones afines (rectas a rectas), su característica de Euler tiene que ser cero.',
      formal: r`Si una variedad cerrada $M$ admite una conexión plana sin torsión (una estructura afín), entonces $\chi(M)=0$.`,
      why: r`Una conexión plana tiene curvatura cero, así que la clase de Euler de $TM$ debería anularse por la teoría de Chern–Weil. El problema es que la conexión no es métrica, y la fórmula habitual del pfaffiano para $\chi$ no se aplica. Los ejemplos de Smillie muestran que no se puede quitar la hipótesis de torsión nula.`,
    },
  },
  {
    id: 'poincare-4d', area: 'geometry', status: 'open', checked: CHECKED,
    sources: [{ label: 'Open Problem Garden: smooth 4-dimensional Poincaré conjecture', url: 'https://openproblemgarden.org/comment/reply/37125' }],
    en: {
      title: 'Smooth 4-dimensional Poincaré conjecture',
      statusNote: 'Open. The topological version in dimension 4 was proved by Freedman (1982); whether every smooth homotopy 4-sphere is diffeomorphic to the standard $S^4$ is unknown.',
      plain: 'Is every smooth 4-dimensional space that looks like a 4-sphere (up to homotopy) actually a 4-sphere with its usual smooth structure?',
      formal: r`If a closed smooth 4-manifold $M$ is homotopy equivalent to $S^4$, is $M$ diffeomorphic to $S^4$? (Equivalently, does $S^4$ have an exotic smooth structure?)`,
      why: r`In dimension 4 smooth and topological manifolds behave very differently: $\mathbb{R}^4$ has uncountably many smooth structures. Ricci flow, which settled dimension 3, has no known way to attack this, and the smooth invariants that detect exotic 4-manifolds all vanish on homotopy spheres.`,
    },
    es: {
      title: 'Conjetura de Poincaré suave en dimensión 4',
      statusNote: 'Abierta. La versión topológica en dimensión 4 la demostró Freedman (1982); no se sabe si toda 4-esfera de homotopía suave es difeomorfa a la $S^4$ estándar.',
      plain: '¿Todo espacio suave de dimensión 4 que se parece a una 4-esfera (salvo homotopía) es de verdad una 4-esfera con su estructura suave usual?',
      formal: r`Si una 4-variedad suave y cerrada $M$ es homotópicamente equivalente a $S^4$, ¿es $M$ difeomorfa a $S^4$? (Equivalentemente, ¿tiene $S^4$ una estructura suave exótica?)`,
      why: r`En dimensión 4 las variedades suaves y las topológicas se comportan de forma muy distinta: $\mathbb{R}^4$ tiene una cantidad no numerable de estructuras suaves. El flujo de Ricci, que resolvió la dimensión 3, no tiene una vía conocida aquí, y los invariantes suaves que detectan 4-variedades exóticas se anulan en las esferas homotópicas.`,
    },
  },
  {
    id: 'yau-minimal', area: 'geometry', status: 'solved', checked: CHECKED,
    sources: [{ label: 'Song, Existence of infinitely many minimal hypersurfaces in closed manifolds, Ann. of Math. 197 (2023)', url: 'https://annals.math.princeton.edu/2023/197-3/p01' }, ARXIV('1806.08816', 'Song (arXiv 2018 preprint)')],
    en: {
      title: 'Yau’s conjecture on minimal surfaces',
      statusNote: 'Solved. Yau asked it in 1982. Marques–Neves proved it for positive Ricci curvature (2017) and Irie–Marques–Neves for generic metrics (2018), and Antoine Song settled it in dimensions 3 to 7 for every metric (arXiv 2018, Annals 2023).',
      plain: 'Every closed curved 3-dimensional space contains not just one but infinitely many minimal surfaces, surfaces like soap films that cannot reduce their area by small deformations.',
      formal: r`Every closed Riemannian manifold $(M^n,g)$ with $3\le n\le7$ contains infinitely many distinct smooth embedded closed minimal hypersurfaces ($H\equiv0$).`,
      why: r`Minimal surfaces are critical points of the area functional. Area-minimisers are easy to find, but the others are saddles, and a min-max (mountain pass) method is needed. Showing the process does not run out of new surfaces was the hard part.`,
    },
    es: {
      title: 'Conjetura de Yau sobre superficies mínimas',
      statusNote: 'Resuelta. Yau la planteó en 1982. Marques–Neves la probaron con curvatura de Ricci positiva (2017) e Irie–Marques–Neves para métricas genéricas (2018), y Antoine Song la resolvió en dimensiones 3 a 7 para toda métrica (arXiv 2018, Annals 2023).',
      plain: 'Todo espacio curvo cerrado de dimensión 3 contiene no una sino infinitas superficies mínimas, superficies como películas de jabón que no pueden reducir su área con deformaciones pequeñas.',
      formal: r`Toda variedad riemanniana cerrada $(M^n,g)$ con $3\le n\le7$ contiene infinitas hipersuperficies mínimas cerradas, suaves, encajadas y distintas ($H\equiv0$).`,
      why: r`Las superficies mínimas son puntos críticos del funcional de área. Los minimizadores son fáciles de hallar, pero los demás son puntos silla y hace falta un método min-max (de paso de montaña). Lo difícil era probar que el proceso no se queda sin superficies nuevas.`,
    },
  },
  {
    id: 'penrose', area: 'relativity', status: 'partial', demo: 'penrose', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('math/0304261', 'Bray, Black holes and the Penrose inequality in general relativity (ICM 2002)'), ARXIV('0705.1128', 'Bray–Lee, On the Riemannian Penrose inequality in dimensions less than 8'), ARXIV('0906.5566', 'Mars, Present status of the Penrose inequality')],
    en: {
      title: 'Penrose inequality',
      statusNote: 'Partly solved. The Riemannian (time-symmetric) case was proved by Huisken–Ilmanen (2001, one horizon) and Bray (2001, all horizons), and extended to dimensions below 8 by Bray–Lee (2009). The general case, with matter obeying the dominant energy condition and data that are not time-symmetric, is open; preprints claiming it exist, but none has been accepted.',
      plain: 'A black hole of horizon area $A$ must have total mass at least $\\sqrt{A/16\\pi}$, with equality only for Schwarzschild.',
      formal: r`If $(M^3,g)$ is complete, asymptotically flat, with scalar curvature $R_g\ge0$ and outermost minimal surface of area $A$, then the ADM mass satisfies $m\ge\sqrt{A/16\pi}$, with equality iff $M$ is a slice of Schwarzschild.`,
      why: r`It is a quantitative form of cosmic censorship: if a naked singularity could form, it would violate it. The Riemannian proof uses inverse mean curvature flow (Huisken–Ilmanen) or a conformal flow of metrics (Bray). Neither extends easily to initial data with extrinsic curvature.`,
    },
    es: {
      title: 'Desigualdad de Penrose',
      statusNote: 'Resuelta en parte. El caso riemanniano (simétrico en el tiempo) lo probaron Huisken–Ilmanen (2001, un horizonte) y Bray (2001, todos los horizontes), y Bray–Lee lo extendieron a dimensiones menores que 8 (2009). El caso general, con materia que cumple la condición de energía dominante y datos no simétricos en el tiempo, está abierto; existen preprints que lo afirman, pero ninguno ha sido aceptado.',
      plain: 'Un agujero negro con área de horizonte $A$ debe tener masa total al menos $\\sqrt{A/16\\pi}$, con igualdad solo para Schwarzschild.',
      formal: r`Si $(M^3,g)$ es completa, asintóticamente plana, con curvatura escalar $R_g\ge0$ y superficie mínima más externa de área $A$, entonces la masa ADM cumple $m\ge\sqrt{A/16\pi}$, con igualdad si y solo si $M$ es una sección de Schwarzschild.`,
      why: r`Es una forma cuantitativa de la censura cósmica: si pudiera formarse una singularidad desnuda, la violaría. La prueba riemanniana usa el flujo de curvatura media inversa (Huisken–Ilmanen) o un flujo conforme de métricas (Bray). Ninguno se extiende con facilidad a datos iniciales con curvatura extrínseca.`,
    },
  },
  {
    id: 'cosmic-censorship', area: 'relativity', status: 'open', module: 'cosmos', checked: CHECKED,
    sources: [{ label: 'Dafermos–Luk, The interior of dynamical vacuum black holes I: the C⁰-stability of the Kerr Cauchy horizon, Ann. of Math. 202 (2025)', url: 'https://annals.math.princeton.edu/2025/202-2/p01' }, ARXIV('2501.13180', 'The Strong Cosmic Censorship Conjecture (review, Jan 2025)'), ARXIV('1710.01722', 'Dafermos–Luk (arXiv 2017)')],
    en: {
      title: 'Weak and strong cosmic censorship',
      statusNote: 'Open in general. Christodoulou (1999) showed that in spherically symmetric Einstein–scalar-field collapse naked singularities exist but are unstable. Dafermos–Luk (arXiv 2017, Annals 2025) showed that the $C^0$ formulation of strong censorship fails for Kerr, because the Cauchy horizon is $C^0$-extendible; they argue it is still singular in a weaker sense, so revised formulations remain open.',
      plain: 'Weak: singularities from collapse are hidden inside black holes. Strong: the future of every observer is determined by initial data, so the laws of physics do not break down.',
      formal: r`Weak: for generic asymptotically flat data, the maximal development has a complete future null infinity. Strong: for generic data, the maximal Cauchy development is inextendible as a Lorentzian manifold with a suitably regular metric. The correct regularity (here $C^0$ fails, $C^2$ or $H^1_{loc}$ type remain) is itself part of the question.`,
      why: r`Inside a rotating black hole the Cauchy horizon is where predictability could end. Linearised perturbations blow up there (a “blue-shift” instability), but the nonlinear effect is milder than expected. Settling which regularity class makes the statement true needs control of the nonlinear interior of dynamical black holes.`,
    },
    es: {
      title: 'Censura cósmica débil y fuerte',
      statusNote: 'Abierta en general. Christodoulou (1999) mostró que en el colapso esféricamente simétrico de Einstein con campo escalar existen singularidades desnudas pero son inestables. Dafermos–Luk (arXiv 2017, Annals 2025) mostraron que la formulación $C^0$ de la censura fuerte falla para Kerr, porque el horizonte de Cauchy es $C^0$-extendible; argumentan que sigue siendo singular en un sentido más débil, así que las formulaciones corregidas siguen abiertas.',
      plain: 'Débil: las singularidades del colapso quedan ocultas dentro de agujeros negros. Fuerte: el futuro de todo observador queda determinado por los datos iniciales, así que las leyes de la física no se rompen.',
      formal: r`Débil: para datos genéricos asintóticamente planos, el desarrollo máximo tiene un infinito nulo futuro completo. Fuerte: para datos genéricos, el desarrollo máximo de Cauchy no es extendible como variedad lorentziana con una métrica de regularidad adecuada. La regularidad correcta (aquí $C^0$ falla, quedan las de tipo $C^2$ o $H^1_{loc}$) es parte de la pregunta.`,
      why: r`Dentro de un agujero negro en rotación el horizonte de Cauchy es donde podría acabar la predictibilidad. Las perturbaciones linealizadas explotan allí (inestabilidad por corrimiento al azul), pero el efecto no lineal es más suave de lo esperado. Decidir qué clase de regularidad hace cierto el enunciado exige controlar el interior no lineal de agujeros negros dinámicos.`,
    },
  },
  {
    id: 'kerr-stability', area: 'relativity', status: 'partial', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('2104.08222', 'Dafermos–Holzegel–Rodnianski–Taylor, The non-linear stability of the Schwarzschild family of black holes'), ARXIV('2104.11857', 'Klainerman–Szeftel, Kerr stability for small angular momentum'), ARXIV('2205.14808', 'Giorgi–Klainerman–Szeftel, Wave equations estimates and the nonlinear stability of slowly rotating Kerr'), ARXIV('2506.21183', 'Häfner–Hintz–Vasy, Linear stability of Kerr in the full subextremal range')],
    en: {
      title: 'Nonlinear stability of Kerr black holes',
      statusNote: 'Partly solved. Nonlinear stability is proved for slowly rotating Kerr, $|a|/M$ small, by Klainerman–Szeftel with Giorgi and Shen (a series of preprints, last part arXiv 2022). Dafermos–Holzegel–Rodnianski–Taylor proved nonlinear stability of the Schwarzschild family for a codimension-3 class of perturbations (arXiv 2021). Linear stability in the full subextremal range $|a|<M$ was posted in 2025; nonlinear stability for the full subextremal range is open.',
      plain: 'If you nudge a rotating black hole slightly, does the spacetime settle back down to some rotating black hole, rather than blowing up or falling apart?',
      formal: r`Small perturbations of the vacuum Einstein equations $\mathrm{Ric}(g)=0$ with initial data close to those of Kerr$(M,a)$, $|a|<M$, evolve to a spacetime that converges to Kerr$(M',a')$ with $M'\approx M$, $a'\approx a$.`,
      why: r`Waves on a black hole background can decay only if they do not trap, but rotation introduces superradiance and trapped null geodesics. The Einstein equations also have gauge freedom, so one must fix coordinates adapted to the final black hole as part of the proof. The slow-rotation proofs run to hundreds of pages.`,
    },
    es: {
      title: 'Estabilidad no lineal de los agujeros negros de Kerr',
      statusNote: 'Resuelta en parte. La estabilidad no lineal está probada para Kerr de rotación lenta, $|a|/M$ pequeño, por Klainerman–Szeftel con Giorgi y Shen (una serie de preprints, la última parte en arXiv 2022). Dafermos–Holzegel–Rodnianski–Taylor probaron la estabilidad no lineal de la familia de Schwarzschild para una clase de perturbaciones de codimensión 3 (arXiv 2021). La estabilidad lineal en todo el rango subextremal $|a|<M$ se publicó en 2025; la estabilidad no lineal en todo ese rango sigue abierta. No pude confirmar la publicación en revista de la serie sobre Kerr.',
      plain: 'Si empujas un poco un agujero negro en rotación, ¿el espaciotiempo vuelve a asentarse en algún agujero negro en rotación, en lugar de explotar o desintegrarse?',
      formal: r`Pequeñas perturbaciones de las ecuaciones de Einstein en el vacío $\mathrm{Ric}(g)=0$, con datos iniciales cercanos a los de Kerr$(M,a)$, $|a|<M$, evolucionan a un espaciotiempo que converge a Kerr$(M',a')$ con $M'\approx M$, $a'\approx a$.`,
      why: r`Las ondas sobre un agujero negro solo decaen si no quedan atrapadas, pero la rotación introduce superradiancia y geodésicas nulas atrapadas. Las ecuaciones de Einstein tienen además libertad de gauge, así que hay que fijar coordenadas adaptadas al agujero negro final como parte de la prueba. Las demostraciones para rotación lenta ocupan cientos de páginas.`,
    },
  },
];
