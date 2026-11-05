import type { TourStep } from '../tour/steps';
import type { Theory } from '../tour/theory';
import type { Task } from '../tour/tasks';

const M = 'limits' as const;
const r = String.raw;

export const LIMITS_TOUR: TourStep[] = [
  { target: null, title: 'Limits of relativity',
    body: 'General relativity has passed every precision test so far, and still leaves open questions: dark matter, dark energy, singularities and quantum gravity. This module separates what is confirmed from what is open, from what is a statistical tension and from what was a false alarm. Statuses are as of November 2026.' },
  { target: 'canvas', title: 'The 3D view',
    body: 'Left-drag to orbit, right-drag to pan, scroll or pinch to zoom. In the State of the art view it shows the view linked to the card you opened, or a calm wireframe light cone when the card has none.' },
  { target: 'views', title: 'Five views',
    body: 'State of the art is the list of status cards. Rotation curves, Cosmic tensions, Precision tests and Quantum limits are demos with live numbers checked against closed forms. A demo shows the geometry around a problem. It never solves one.' },
  { target: 'panel', title: 'Status cards',
    body: 'Filter by kind: confirmed, open theory problem, tension or unexplained, under debate, resolved. Open a card for the status note, the key equation, why it matters, sources and the date it was checked. "Open view" jumps to the matching demo.' },
  { target: 'theory', title: 'Motivation & theory',
    body: 'This button opens the background: what "general relativity works" means in numbers, the dark sector, how to read a σ, where the theory predicts its own breakdown, and a short, unranked list of candidate extensions.' },
  { target: 'nav', title: 'Other simulations',
    body: 'Switch simulation with these tabs. The limits grow out of the relativity, spacetime and cosmology modules, so those are the best companions to this one.' },
];
export const LIMITS_TOUR_ES: TourStep[] = [
  { target: null, title: 'Límites de la relatividad',
    body: 'La relatividad general ha superado todas las pruebas de precisión hasta ahora, y aun así deja preguntas abiertas: materia oscura, energía oscura, singularidades y gravedad cuántica. Este módulo separa lo confirmado de lo abierto, de lo que es una tensión estadística y de lo que fue una falsa alarma. Los estados son de noviembre de 2026.' },
  { target: 'canvas', title: 'La vista 3D',
    body: 'Arrastra con el botón izquierdo para orbitar, con el derecho para desplazar, y usa la rueda o el pellizco para el zoom. En la vista Estado actual muestra la vista ligada a la tarjeta que abriste, o un tranquilo cono de luz de alambre si la tarjeta no tiene ninguna.' },
  { target: 'views', title: 'Cinco vistas',
    body: 'Estado actual es la lista de tarjetas de estado. Curvas de rotación, Tensiones cosmológicas, Pruebas de precisión y Límites cuánticos son demos con números en vivo comprobados con fórmulas cerradas. Una demo muestra la geometría alrededor de un problema. Nunca lo resuelve.' },
  { target: 'panel', title: 'Tarjetas de estado',
    body: 'Filtra por tipo: confirmado, problema teórico abierto, tensión o sin explicar, en debate, resuelto. Abre una tarjeta para ver la nota de estado, la ecuación clave, por qué importa, las fuentes y la fecha en que se comprobó. "Abrir vista" salta a la demo correspondiente.' },
  { target: 'theory', title: 'Motivación y teoría',
    body: 'Este botón abre el trasfondo: qué significa en números que "la relatividad general funciona", el sector oscuro, cómo leer un σ, dónde la teoría predice su propia ruptura, y una lista breve y sin clasificar de extensiones candidatas.' },
  { target: 'nav', title: 'Otras simulaciones',
    body: 'Cambia de simulación con estas pestañas. Los límites nacen de los módulos de relatividad, espaciotiempo y cosmología, que son los mejores compañeros de este.' },
];

export const LIMITS_THEORY: Theory = {
  motivation: r`General relativity has survived more than a century of tests, from the orbit of Mercury to merging black holes. Yet it leaves questions open: what makes up [[dark-matter|dark matter]] and dark energy, what happens at a singularity, and how gravity fits with quantum theory. This module keeps four things apart that are easy to confuse: a result confirmed to high precision, an open theoretical problem, an observational tension with a stated significance, and an anomaly that was later explained.`,
  sections: [
    { heading: 'What "general relativity works" means', body: r`The parametrised post-Newtonian (PPN) framework turns "does gravity behave like general relativity?" into numbers. The parameter $\gamma$ says how much space curvature a unit mass produces, and general relativity has $\gamma=1$. The Cassini radio-link measurement near the Sun gave $\gamma-1=(2.1\pm2.3)\times10^{-5}$. The weak equivalence principle holds to about $10^{-15}$ (MICROSCOPE). Binary pulsars confirm the loss of orbital energy to gravitational waves, and LIGO–Virgo–KAGRA signals from merging black holes fit the predicted waveforms. Black-hole shadows from the Event Horizon Telescope agree with the Kerr geometry, but only at modest precision. These tests cover very different regimes, which is why they constrain whole families of alternative theories and not just one.

"Works" therefore means: no confirmed deviation, in a range of conditions, with the stated precision. It does not mean the theory is complete or valid everywhere.` },
    { heading: 'The dark sector', body: r`Dark matter and dark energy are inferred, not seen. Galaxy rotation curves are flat when the stars and gas alone would give $v^2(r)=GM(<r)/r$ falling with radius. Gravitational lensing, the dynamics of galaxy clusters, the Bullet Cluster and the acoustic peaks of the CMB tell the same story on larger scales. Dark energy comes from the accelerated expansion seen with supernovae, with the CMB and with baryon acoustic oscillations, and a [[cosmological-constant|cosmological constant]] $\Lambda$ fits almost everything.

Both inferences apply general relativity (or Newtonian gravity) to observations and ask what must be present. They would be wrong if gravity were different. That is why they are not a settled proof of new particles or a new field. Direct-detection experiments such as LZ have so far found no dark-matter particle, so the question of what dark matter is remains open.` },
    { heading: 'Tension, systematics and how σ is quoted', body: r`When two measurements of the same quantity disagree, the tension is often quoted as

$$N_\sigma=\frac{|x_a-x_b|}{\sqrt{\sigma_a^2+\sigma_b^2}}.$$

A $3\sigma$ difference arises by chance about 0.3% of the time, and $5\sigma$ about once in 1.7 million, if the errors are Gaussian and the analysis was fixed in advance. Both conditions often fail. Unrecognised systematic errors do not follow Gaussian statistics, and a feature picked after looking at the data (as with the large-angle CMB anomalies) overstates its own significance. A tension can also depend on which datasets are combined, as in the DESI dark-energy preference of 2.8–4.2σ.

Examples show the range. The Hubble tension is about $7\sigma$ between the most precise local and CMB values, and local data are not unanimous. The $S_8$ tension has eased with KiDS-Legacy and persists mildly in DES Year 6. The Pioneer anomaly and the OPERA neutrinos were instrumental. BICEP2 was dust. Reading a $\sigma$ well means asking where the error budget could be wrong.` },
    { heading: 'Where general relativity predicts its own breakdown', body: r`The Penrose singularity theorem shows that once a trapped surface forms, and the matter satisfies the null energy condition, some null geodesic cannot be extended. The theory has no way to continue past it. Whether such singularities are hidden behind horizons is the cosmic-censorship question (see Frontiers).

Quantum effects bring a second limit. Newton's constant fixes the Planck length $\ell_P=\sqrt{\hbar G/c^3}\approx1.6\times10^{-35}\,\mathrm{m}$. General relativity treated as a quantum field theory is non-renormalisable, but as an effective field theory it works well far below that scale. Hawking radiation, with temperature $T_H=\hbar c^3/(8\pi GMk_B)$, raises the information problem: how an evaporating black hole can be consistent with unitary quantum mechanics. Semiclassical "island" calculations reproduce the Page curve, which is progress, but the problem is not closed. The cosmological-constant problem is a third mismatch, between the vacuum energy expected from quantum fields and the observed $\Lambda$.` },
    { heading: 'Candidate extensions', body: r`This is a map of the field, not a ranking. None of the following is established.

Modified gravity. Theories such as $f(R)$ gravity, scalar–tensor and Horndeski theories add degrees of freedom to general relativity. After GW170817 showed that gravitational waves travel at the speed of light to about one part in $10^{15}$, many Horndeski models in which the speed differs were eliminated. Models whose waves travel at $c$, including $f(R)$, remain, and they need screening to pass solar-system tests.

MOND and its relativistic versions (TeVeS and later models). MOND modifies the dynamics below an acceleration $a_0\approx1.2\times10^{-10}\,\mathrm{m/s^2}$ and fits rotation curves with one parameter. It has difficulty with galaxy clusters and the CMB peaks unless extra components are added, and wide-binary tests give contested results.

Quantum-gravity programmes. String theory, loop quantum gravity and asymptotic safety attack the Planck-scale problem from different starting points. Each has partial results. None has made a confirmed experimental prediction.` },
  ],
  refs: [
    'Will, The Confrontation between General Relativity and Experiment, Living Rev. Relativ. 17, 4 (2014)',
    'Particle Data Group, Review of Particle Physics: reviews on Dark Matter, Dark Energy and Cosmological Parameters (pdg.lbl.gov)',
    'Abdalla et al., Cosmology intertwined: a review of the particle physics, astrophysics, and cosmology associated with the cosmological tensions and anomalies, JHEAp 34, 49 (2022)',
    'Bertone & Hooper, History of dark matter, Rev. Mod. Phys. 90, 045002 (2018)',
    'Weinberg, The cosmological constant problem, Rev. Mod. Phys. 61, 1 (1989); Martin, Everything you always wanted to know about the cosmological constant problem, C. R. Physique 13, 566 (2012)',
    'Penrose, Gravitational collapse and space-time singularities, Phys. Rev. Lett. 14, 57 (1965); Almheiri et al., The entropy of Hawking radiation, Rev. Mod. Phys. 93, 035002 (2021)',
    'Ezquiaga & Zumalacárregui, Dark energy after GW170817, Phys. Rev. Lett. 119, 251304 (2017); Donoghue, General relativity as an effective field theory, Phys. Rev. D 50, 3874 (1994)',
  ],
};
export const LIMITS_THEORY_ES: Theory = {
  motivation: r`La relatividad general ha sobrevivido a más de un siglo de pruebas, desde la órbita de Mercurio hasta las fusiones de agujeros negros. Aun así deja preguntas abiertas: de qué están hechas la [[dark-matter|materia oscura]] y la energía oscura, qué ocurre en una singularidad y cómo encaja la gravedad con la teoría cuántica. Este módulo mantiene separadas cuatro cosas que es fácil confundir: un resultado confirmado con alta precisión, un problema teórico abierto, una tensión observacional con una significancia declarada y una anomalía que luego se explicó.`,
  sections: [
    { heading: 'Qué significa que "la relatividad general funciona"', body: r`El marco post-newtoniano parametrizado (PPN) convierte "¿se comporta la gravedad como la relatividad general?" en números. El parámetro $\gamma$ dice cuánta curvatura espacial produce una unidad de masa, y la relatividad general tiene $\gamma=1$. La medida de radioenlace de Cassini cerca del Sol dio $\gamma-1=(2.1\pm2.3)\times10^{-5}$. El principio de equivalencia débil se cumple hasta cerca de $10^{-15}$ (MICROSCOPE). Los púlsares binarios confirman la pérdida de energía orbital en ondas gravitacionales, y las señales de LIGO–Virgo–KAGRA de agujeros negros en fusión encajan con las formas de onda predichas. Las sombras de agujeros negros del Event Horizon Telescope concuerdan con la geometría de Kerr, pero solo con precisión modesta. Estas pruebas cubren regímenes muy distintos, por eso restringen familias enteras de teorías alternativas y no solo una.

"Funciona" significa entonces: ninguna desviación confirmada, en un rango de condiciones, con la precisión declarada. No significa que la teoría sea completa ni válida en todas partes.` },
    { heading: 'El sector oscuro', body: r`La materia oscura y la energía oscura se infieren, no se ven. Las curvas de rotación de las galaxias son planas cuando las estrellas y el gas por sí solos darían $v^2(r)=GM(<r)/r$ decreciente con el radio. Las lentes gravitacionales, la dinámica de los cúmulos de galaxias, el Cúmulo Bala y los picos acústicos del fondo cósmico de microondas cuentan la misma historia a escalas mayores. La energía oscura viene de la expansión acelerada observada con supernovas, con el fondo cósmico y con las oscilaciones acústicas de bariones, y una [[cosmological-constant|constante cosmológica]] $\Lambda$ ajusta casi todo.

Ambas inferencias aplican la relatividad general (o la gravedad newtoniana) a las observaciones y preguntan qué debe estar presente. Serían erróneas si la gravedad fuera distinta. Por eso no son una prueba cerrada de partículas nuevas ni de un campo nuevo. Experimentos de detección directa como LZ no han encontrado hasta ahora ninguna partícula de materia oscura, así que la pregunta de qué es sigue abierta.` },
    { heading: 'Tensión, sistemáticos y cómo se cita un σ', body: r`Cuando dos medidas de la misma cantidad discrepan, la tensión suele citarse como

$$N_\sigma=\frac{|x_a-x_b|}{\sqrt{\sigma_a^2+\sigma_b^2}}.$$

Una diferencia de $3\sigma$ aparece por azar cerca del 0,3% de las veces, y una de $5\sigma$ una vez de cada 1,7 millones, si los errores son gaussianos y el análisis se fijó de antemano. Ambas condiciones suelen fallar. Los errores sistemáticos no reconocidos no siguen estadística gaussiana, y un rasgo escogido después de mirar los datos (como las anomalías del fondo cósmico a gran ángulo) exagera su propia significancia. Una tensión también puede depender de qué conjuntos de datos se combinan, como en la preferencia de DESI por energía oscura evolutiva de 2,8–4,2σ.

Los ejemplos muestran el rango. La tensión de Hubble es de unos $7\sigma$ entre los valores local y del fondo cósmico más precisos, y los datos locales no son unánimes. La tensión en $S_8$ ha disminuido con KiDS-Legacy y persiste levemente en DES Año 6. La anomalía de las Pioneer y los neutrinos de OPERA fueron instrumentales. BICEP2 fue polvo. Leer bien un $\sigma$ es preguntarse dónde podría estar mal el balance de errores.` },
    { heading: 'Dónde la relatividad general predice su propia ruptura', body: r`El teorema de singularidades de Penrose muestra que, una vez que se forma una superficie atrapada y la materia cumple la condición de energía nula, alguna geodésica nula no se puede prolongar. La teoría no tiene forma de continuar más allá. Si esas singularidades quedan ocultas tras horizontes es la pregunta de la censura cósmica (véase Fronteras).

Los efectos cuánticos traen un segundo límite. La constante de Newton fija la longitud de Planck $\ell_P=\sqrt{\hbar G/c^3}\approx1.6\times10^{-35}\,\mathrm{m}$. La relatividad general tratada como teoría cuántica de campos no es renormalizable, pero como teoría de campos efectiva funciona bien muy por debajo de esa escala. La radiación de Hawking, con temperatura $T_H=\hbar c^3/(8\pi GMk_B)$, plantea el problema de la información: cómo puede un agujero negro que se evapora ser compatible con la mecánica cuántica unitaria. Los cálculos semiclásicos con "islas" reproducen la curva de Page, lo que es un avance, pero el problema no está cerrado. El problema de la constante cosmológica es un tercer desajuste, entre la energía del vacío esperada de los campos cuánticos y la $\Lambda$ observada.` },
    { heading: 'Extensiones candidatas', body: r`Esto es un mapa del campo, no una clasificación. Nada de lo siguiente está establecido.

Gravedad modificada. Teorías como la gravedad $f(R)$, las escalar–tensor y las de Horndeski añaden grados de libertad a la relatividad general. Tras mostrar GW170817 que las ondas gravitacionales viajan a la velocidad de la luz con una precisión de una parte en $10^{15}$, se eliminaron muchos modelos de Horndeski en los que la velocidad difiere. Quedan los modelos cuyas ondas viajan a $c$, entre ellos $f(R)$, que necesitan apantallamiento para pasar las pruebas del sistema solar.

MOND y sus versiones relativistas (TeVeS y modelos posteriores). MOND modifica la dinámica por debajo de una aceleración $a_0\approx1.2\times10^{-10}\,\mathrm{m/s^2}$ y ajusta las curvas de rotación con un solo parámetro. Tiene dificultades con los cúmulos de galaxias y los picos del fondo cósmico a menos que se añadan componentes extra, y las pruebas con binarias anchas dan resultados disputados.

Programas de gravedad cuántica. La teoría de cuerdas, la gravedad cuántica de bucles y la seguridad asintótica atacan el problema de la escala de Planck desde puntos de partida distintos. Cada una tiene resultados parciales. Ninguna ha hecho una predicción experimental confirmada.` },
  ],
  refs: [
    'Will, The Confrontation between General Relativity and Experiment, Living Rev. Relativ. 17, 4 (2014)',
    'Particle Data Group, Review of Particle Physics: reseñas sobre Materia oscura, Energía oscura y Parámetros cosmológicos (pdg.lbl.gov)',
    'Abdalla et al., Cosmology intertwined: a review of the particle physics, astrophysics, and cosmology associated with the cosmological tensions and anomalies, JHEAp 34, 49 (2022)',
    'Bertone y Hooper, History of dark matter, Rev. Mod. Phys. 90, 045002 (2018)',
    'Weinberg, The cosmological constant problem, Rev. Mod. Phys. 61, 1 (1989); Martin, Everything you always wanted to know about the cosmological constant problem, C. R. Physique 13, 566 (2012)',
    'Penrose, Gravitational collapse and space-time singularities, Phys. Rev. Lett. 14, 57 (1965); Almheiri et al., The entropy of Hawking radiation, Rev. Mod. Phys. 93, 035002 (2021)',
    'Ezquiaga y Zumalacárregui, Dark energy after GW170817, Phys. Rev. Lett. 119, 251304 (2017); Donoghue, General relativity as an effective field theory, Phys. Rev. D 50, 3874 (1994)',
  ],
};

export const LIMITS_TASKS: Task[] = [
  { id: 'lim-rot-baryons', module: M,
    prompt: 'In Rotation curves, switch to baryons only: at what radius does the prediction fall below the data?',
    hint: 'The baryon-only curve peaks and then declines roughly as $1/\\sqrt r$, while the data stay flat. Look for where the two curves separate.',
    answer: 'The exact radius depends on the galaxy, but it is typically at a few disc scale lengths, beyond the visible disc, where the baryon-only curve falls like $v\\propto 1/\\sqrt r$ (Keplerian) and the observed curve stays flat. For NGC 3198 with the default mass-to-light ratios the baryon curve stays below the data beyond the inner few kpc and falls to half the observed speed near 22 kpc (see the readout). That gap is what dark matter, or a change of gravity, must supply.' },
  { id: 'lim-h0-sigma', module: M,
    prompt: 'In Cosmic tensions, compute the tension between the two most precise $H_0$ values.',
    hint: 'Use $N_\\sigma=|H_a-H_b|/\\sqrt{\\sigma_a^2+\\sigma_b^2}$ with the values and errors shown in the module.',
    answer: 'For about $73.50\\pm0.81$ (local) and $67.19\\pm0.38$ (CMB), $N_\\sigma=6.31/\\sqrt{0.81^2+0.38^2}\\approx7.1$. Check which values your view lists. A tension of this size cannot be a statistical fluke, so something in the data analysis or the model has to change.' },
  { id: 'lim-hawking-cmb', module: M,
    prompt: 'In Quantum limits, find the mass whose Hawking temperature equals the CMB temperature, $2.725\\,\\mathrm{K}$.',
    hint: 'Solve $T_H=\\hbar c^3/(8\\pi G M k_B)$ for $M$.',
    answer: '$M=\\hbar c^3/(8\\pi G k_B T)\\approx4.5\\times10^{22}\\,\\mathrm{kg}$, about 0.6 lunar masses. Heavier black holes are colder than the CMB and absorb more than they emit, so they grow. Every astrophysical black hole is far heavier.' },
  { id: 'lim-cassini', module: M,
    prompt: 'In Precision tests, how large would $\\gamma-1$ need to be for Cassini to see it?',
    hint: 'Compare with the quoted uncertainty of the Cassini measurement.',
    answer: 'Cassini measured $\\gamma-1=(2.1\\pm2.3)\\times10^{-5}$, so a deviation of order $2\\times10^{-5}$ would be at the edge of detection, and a few $10^{-5}$ would be visible. A Newtonian-like value $\\gamma=0$ would be off by $1$, about $4\\times10^4$ standard deviations.' },
  { id: 'lim-loose-cable', module: M,
    prompt: 'Which anomaly in the cards was resolved by a loose cable?',
    hint: 'It concerned particles apparently faster than light, and it tested special relativity, not gravity.',
    answer: 'OPERA’s neutrino velocity (2011–12). A fibre-optic connection in the timing chain (together with a clock-oscillator effect) shifted the measured time of flight, and the corrected result is consistent with the speed of light.' },
  { id: 'lim-debated-card', module: M,
    prompt: 'In State of the art, open a card of kind "Under debate". Why is it not settled?',
    hint: 'Read the status note for who disagrees with whom, and on what.',
    answer: 'For wide binaries, analyses of the same Gaia data disagree because the result depends on sample selection and on how undetected companions are modelled. For gravitational-wave echoes, the dispute is how to estimate the noise background. Disagreement of method, not of data, is the usual reason a claim stays under debate.' },
];
export const LIMITS_TASKS_ES: Task[] = [
  { id: 'lim-rot-baryons', module: M,
    prompt: 'En Curvas de rotación, cambia a solo bariones: ¿a qué radio la predicción cae por debajo de los datos?',
    hint: 'La curva solo de bariones tiene un máximo y luego decrece aproximadamente como $1/\\sqrt r$, mientras los datos se mantienen planos. Busca dónde se separan las dos curvas.',
    answer: 'El radio exacto depende de la galaxia, pero suele estar a unas pocas escalas de longitud del disco, más allá del disco visible, donde la curva solo de bariones cae como $v\\propto 1/\\sqrt r$ (kepleriana) y la observada se mantiene plana. En NGC 3198, con las razones masa-luminosidad por defecto, la curva de bariones queda por debajo de los datos más allá de los primeros kpc y cae a la mitad de la velocidad observada cerca de 22 kpc (mira la lectura). Esa diferencia es lo que deben aportar la materia oscura o un cambio de la gravedad.' },
  { id: 'lim-h0-sigma', module: M,
    prompt: 'En Tensiones cosmológicas, calcula la tensión entre los dos valores de $H_0$ más precisos.',
    hint: 'Usa $N_\\sigma=|H_a-H_b|/\\sqrt{\\sigma_a^2+\\sigma_b^2}$ con los valores y errores que muestra el módulo.',
    answer: 'Para unos $73.50\\pm0.81$ (local) y $67.19\\pm0.38$ (fondo cósmico), $N_\\sigma=6.31/\\sqrt{0.81^2+0.38^2}\\approx7.1$. Comprueba qué valores lista tu vista. Una tensión de este tamaño no puede ser una casualidad estadística, así que algo en el análisis de datos o en el modelo tiene que cambiar.' },
  { id: 'lim-hawking-cmb', module: M,
    prompt: 'En Límites cuánticos, halla la masa cuya temperatura de Hawking iguala la del fondo cósmico, $2.725\\,\\mathrm{K}$.',
    hint: 'Despeja $M$ en $T_H=\\hbar c^3/(8\\pi G M k_B)$.',
    answer: '$M=\\hbar c^3/(8\\pi G k_B T)\\approx4.5\\times10^{22}\\,\\mathrm{kg}$, unas 0,6 masas lunares. Los agujeros negros más pesados son más fríos que el fondo cósmico y absorben más de lo que emiten, así que crecen. Todo agujero negro astrofísico es mucho más pesado.' },
  { id: 'lim-cassini', module: M,
    prompt: 'En Pruebas de precisión, ¿qué tan grande tendría que ser $\\gamma-1$ para que Cassini lo viera?',
    hint: 'Compáralo con la incertidumbre citada de la medida de Cassini.',
    answer: 'Cassini midió $\\gamma-1=(2.1\\pm2.3)\\times10^{-5}$, así que una desviación del orden de $2\\times10^{-5}$ estaría en el borde de la detección, y unos pocos $10^{-5}$ serían visibles. Un valor tipo newtoniano $\\gamma=0$ se desviaría en $1$, unas $4\\times10^4$ desviaciones típicas.' },
  { id: 'lim-loose-cable', module: M,
    prompt: '¿Qué anomalía de las tarjetas se resolvió por un cable suelto?',
    hint: 'Trataba de partículas aparentemente más rápidas que la luz, y probaba la relatividad especial, no la gravedad.',
    answer: 'La velocidad de los neutrinos de OPERA (2011–12). Una conexión de fibra óptica en la cadena de sincronización (junto con un efecto del oscilador del reloj) desplazó el tiempo de vuelo medido, y el resultado corregido es compatible con la velocidad de la luz.' },
  { id: 'lim-debated-card', module: M,
    prompt: 'En Estado actual, abre una tarjeta del tipo "En debate". ¿Por qué no está resuelta?',
    hint: 'Lee la nota de estado para ver quién discrepa de quién, y en qué.',
    answer: 'En las binarias anchas, los análisis de los mismos datos de Gaia discrepan porque el resultado depende de la selección de la muestra y de cómo se modelan los compañeros no detectados. En los ecos de ondas gravitacionales, la disputa es cómo estimar el fondo de ruido. Un desacuerdo de método, no de datos, es la razón habitual de que una afirmación siga en debate.' },
];
