// Status cards for the Limits of Relativity module. Every number below was checked against the sources listed on its
// card (see `checked`). Strings with $...$ are KaTeX; ES math must equal EN math (content.test.ts).
const r = String.raw;

export type StatusKind = 'confirmed' | 'theory' | 'tension' | 'debated' | 'resolved';
export type StatusView = 'rotation' | 'tensions' | 'tests' | 'quantum';

export interface StatusCard {
  id: string;
  kind: StatusKind;
  /** which Limits view the "Open view" button jumps to */
  view?: StatusView;
  /** hash id of a related module */
  module?: string;
  sources: { label: string; url: string }[];
  /** month the status was last checked */
  checked: string;
  en: CardText;
  es: CardText;
}
export interface CardText {
  title: string;
  statusNote: string;
  plain: string;
  formal: string;
  why: string;
}

const CHECKED = '2026-11';
const ARXIV = (id: string, label: string) => ({ label, url: `https://arxiv.org/abs/${id}` });
const DOI = (doi: string, label: string) => ({ label, url: `https://doi.org/${doi}` });
const WEB = (url: string, label: string) => ({ label, url });

const WILL = ARXIV('1403.7377', 'Will, The Confrontation between General Relativity and Experiment, Living Rev. Relativ. (2014)');
const PLANCK18 = ARXIV('1807.06209', 'Planck 2018 results. VI. Cosmological parameters');

export const CARDS: StatusCard[] = [
  // ---------- confirmed to high precision ----------
  {
    id: 'equivalence', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('2209.15487', 'MICROSCOPE final results (2022)'), DOI('10.1103/PhysRevLett.129.121102', 'MICROSCOPE, Phys. Rev. Lett. 129, 121102')],
    en: {
      title: 'Equivalence principle',
      statusNote: 'Confirmed to high precision. The MICROSCOPE satellite compared titanium and platinum test masses in orbit for two and a half years. Its final result (2022) is η(Ti,Pt) = [−1.5 ± 2.3 (stat) ± 1.5 (syst)] × 10⁻¹⁵: no violation at the level of about one part in 10¹⁵.',
      plain: 'Different materials fall with the same acceleration in the same gravitational field. This is why gravity can be described as geometry.',
      formal: r`The Eötvös parameter $\eta=2\,|a_1-a_2|/|a_1+a_2|$ of two test masses vanishes in general relativity.`,
      why: 'If the equivalence principle failed at some level, gravity could not be pure spacetime geometry. Almost every modified theory predicts a small violation, so this test is a strong filter.',
    },
    es: {
      title: 'Principio de equivalencia',
      statusNote: 'Confirmado con alta precisión. El satélite MICROSCOPE comparó en órbita masas de prueba de titanio y platino durante dos años y medio. Su resultado final (2022) es η(Ti,Pt) = [−1,5 ± 2,3 (estad.) ± 1,5 (sist.)] × 10⁻¹⁵: ninguna violación al nivel de una parte en 10¹⁵.',
      plain: 'Materiales distintos caen con la misma aceleración en el mismo campo gravitatorio. Por eso la gravedad puede describirse como geometría.',
      formal: r`El parámetro de Eötvös $\eta=2\,|a_1-a_2|/|a_1+a_2|$ de dos masas de prueba es nulo en relatividad general.`,
      why: 'Si el principio de equivalencia fallara en algún nivel, la gravedad no podría ser pura geometría del espaciotiempo. Casi todas las teorías modificadas predicen una violación pequeña, así que esta prueba es un filtro muy exigente.',
    },
  },
  {
    id: 'light-delay', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [DOI('10.1038/nature01997', 'Bertotti, Iess & Tortora (Cassini), Nature 425, 374 (2003)'), WILL],
    en: {
      title: 'Light bending and Shapiro delay',
      statusNote: 'Confirmed. The Cassini radio-link experiment near solar conjunction (2002) gave γ = 1 + (2.1 ± 2.3) × 10⁻⁵, consistent with general relativity (γ = 1) at the level of 2 parts in 10⁵.',
      plain: 'Light is deflected by the Sun and takes longer to pass it than in flat space. The deflection is twice what Newtonian gravity acting on light would give; the delay has no Newtonian counterpart.',
      formal: r`Deflection $\delta\phi=\tfrac{1+\gamma}{2}\,\tfrac{4GM}{c^2 b}$ and delay both scale with $(1+\gamma)/2$; $\gamma=1$ in general relativity ($1.75''$ at the solar limb).`,
      why: 'The parameter γ measures how much space curvature each unit of mass produces. Scalar–tensor theories generally shift it away from 1, so a tight bound on γ constrains them.',
    },
    es: {
      title: 'Curvatura de la luz y retardo de Shapiro',
      statusNote: 'Confirmado. El experimento de radioenlace de Cassini cerca de la conjunción solar (2002) dio γ = 1 + (2,1 ± 2,3) × 10⁻⁵, compatible con la relatividad general (γ = 1) al nivel de 2 partes en 10⁵.',
      plain: 'La luz se desvía al pasar junto al Sol y tarda más en pasar que en el espacio plano. La desviación es el doble de lo que daría la gravedad newtoniana actuando sobre la luz; el retraso no tiene equivalente newtoniano.',
      formal: r`La desviación $\delta\phi=\tfrac{1+\gamma}{2}\,\tfrac{4GM}{c^2 b}$ y el retardo escalan con $(1+\gamma)/2$; $\gamma=1$ en relatividad general ($1.75''$ en el borde solar).`,
      why: 'El parámetro γ mide cuánta curvatura espacial produce cada unidad de masa. Las teorías escalar–tensor suelen desplazarlo de 1, así que una cota estrecha sobre γ las restringe.',
    },
  },
  {
    id: 'redshift', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('1812.03711', 'Delva et al., Galileo 5 and 6 redshift test, Phys. Rev. Lett. 121, 231101 (2018)'), WEB('https://www.esa.int/Applications/Navigation/Galileo_satellites_prove_Einstein_s_Relativity_Theory_to_highest_accuracy_yet', 'ESA: Galileo satellites and relativity')],
    en: {
      title: 'Gravitational redshift and clocks',
      statusNote: 'Confirmed. Using 1008 days of data from the two Galileo satellites that ended up in elliptical orbits, the fractional deviation from the general-relativistic redshift is (0.19 ± 2.48) × 10⁻⁵ (1σ), a 5.6-fold improvement on the 1976 Gravity Probe A. No ACES (space clock on the ISS) result was found as of November 2026.',
      plain: 'Clocks deeper in a gravitational field tick slower. Satellite navigation depends on correcting for this.',
      formal: r`$\Delta f/f=\Delta\Phi/c^2$ between clocks at potentials $\Phi_1,\Phi_2$.`,
      why: 'The redshift tests the equivalence principle in its time-dilation form (local position invariance) and shows that spacetime curvature affects the rate of clocks, not just the paths of particles.',
    },
    es: {
      title: 'Corrimiento al rojo gravitacional y relojes',
      statusNote: 'Confirmado. Con 1008 días de datos de los dos satélites Galileo que acabaron en órbitas elípticas, la desviación fraccionaria respecto al corrimiento al rojo de la relatividad general es (0,19 ± 2,48) × 10⁻⁵ (1σ), una mejora de 5,6 veces sobre Gravity Probe A (1976). A noviembre de 2026 no se encontró ningún resultado de ACES (reloj espacial en la ISS).',
      plain: 'Los relojes situados más hondo en un campo gravitatorio van más lentos. La navegación por satélite depende de corregir este efecto.',
      formal: r`$\Delta f/f=\Delta\Phi/c^2$ entre relojes en potenciales $\Phi_1,\Phi_2$.`,
      why: 'El corrimiento al rojo prueba el principio de equivalencia en su forma de dilatación del tiempo (invariancia local de posición) y muestra que la curvatura del espaciotiempo afecta al ritmo de los relojes, no solo a las trayectorias de las partículas.',
    },
  },
  {
    id: 'pulsars', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('2112.06795', 'Kramer et al., Strong-field gravity tests with the double pulsar, Phys. Rev. X 11, 041050 (2021)'), WILL],
    en: {
      title: 'Binary pulsars',
      statusNote: 'Confirmed. Sixteen years of timing of the double pulsar PSR J0737−3039A/B give seven post-Keplerian parameters. They test general relativity’s quadrupole description of gravitational-wave emission at the level of 1.3 × 10⁻⁴ (95% confidence), the most precise test of this kind so far (2021).',
      plain: 'Two neutron stars orbiting each other lose orbital energy to gravitational waves, and their orbit shrinks exactly as general relativity predicts.',
      formal: r`With masses $m_A,m_B$ known from two post-Keplerian parameters, each further parameter must agree with the general-relativistic value.`,
      why: 'Pulsars test gravity in the strong-field regime (neutron-star surface potentials of order 0.2 c²) and, unlike the solar system, include radiation damping. They constrain scalar–tensor theories tightly.',
    },
    es: {
      title: 'Púlsares binarios',
      statusNote: 'Confirmado. Dieciséis años de cronometría del púlsar doble PSR J0737−3039A/B dan siete parámetros post-keplerianos. Prueban la descripción cuadrupolar de la emisión de ondas gravitacionales de la relatividad general al nivel de 1,3 × 10⁻⁴ (95% de confianza), la prueba más precisa de este tipo hasta ahora (2021).',
      plain: 'Dos estrellas de neutrones que se orbitan pierden energía orbital en forma de ondas gravitacionales, y su órbita se encoge exactamente como predice la relatividad general.',
      formal: r`Con las masas $m_A,m_B$ conocidas a partir de dos parámetros post-keplerianos, cada parámetro adicional debe coincidir con el valor de la relatividad general.`,
      why: 'Los púlsares prueban la gravedad en régimen de campo fuerte (potenciales en la superficie de una estrella de neutrones del orden de 0,2 c²) y, a diferencia del sistema solar, incluyen el amortiguamiento por radiación. Restringen mucho las teorías escalar–tensor.',
    },
  },
  {
    id: 'gravitational-waves', kind: 'confirmed', view: 'tests', module: 'spacetime', checked: CHECKED,
    sources: [ARXIV('1710.05834', 'GW170817 and GRB 170817A: gravitational waves and gamma rays (2017)'), ARXIV('2112.06861', 'LVK, Tests of General Relativity with GWTC-3'), ARXIV('2509.08054', 'LVK, GW250114: testing Hawking’s area law and the Kerr nature of black holes (2025)')],
    en: {
      title: 'Gravitational waves',
      statusNote: 'Confirmed. The speed of gravity was bounded by GW170817 and GRB 170817A, which arrived 1.74 s apart: −3 × 10⁻¹⁵ ≤ (c_GW − c)/c ≤ +7 × 10⁻¹⁶. The LIGO–Virgo–KAGRA catalogue tests (GWTC-3) find no deviation from general relativity. For the loud 2025 event GW250114, analyses report the remnant’s horizon area larger than the sum of the two initial areas with high credibility, as Hawking’s area theorem requires.',
      plain: 'Ripples of spacetime from merging black holes and neutron stars travel at the speed of light and have the shape general relativity predicts.',
      formal: r`Speed $c_{GW}=c$ in general relativity, and Hawking’s area theorem gives $A_{\rm final}\ge A_1+A_2$.`,
      why: 'The speed bound eliminated many scalar–tensor and Horndeski models that predicted a different speed. Merger signals are the first tests of gravity in the dynamical, strong-field regime.',
    },
    es: {
      title: 'Ondas gravitacionales',
      statusNote: 'Confirmado. La velocidad de la gravedad quedó acotada por GW170817 y GRB 170817A, que llegaron con 1,74 s de diferencia: −3 × 10⁻¹⁵ ≤ (c_GW − c)/c ≤ +7 × 10⁻¹⁶. Las pruebas del catálogo de LIGO–Virgo–KAGRA (GWTC-3) no hallan desviaciones de la relatividad general. Para el evento intenso de 2025 GW250114, los análisis informan que el área del horizonte del remanente supera la suma de las dos áreas iniciales con alta credibilidad, como exige el teorema del área de Hawking.',
      plain: 'Las ondulaciones del espaciotiempo de fusiones de agujeros negros y estrellas de neutrones viajan a la velocidad de la luz y tienen la forma que predice la relatividad general.',
      formal: r`Velocidad $c_{GW}=c$ en relatividad general, y el teorema del área de Hawking da $A_{\rm final}\ge A_1+A_2$.`,
      why: 'La cota de velocidad eliminó muchos modelos escalar–tensor y de Horndeski que predecían otra velocidad. Las señales de fusión son las primeras pruebas de la gravedad en régimen dinámico y de campo fuerte.',
    },
  },
  {
    id: 'shadows', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [DOI('10.3847/2041-8213/ab0ec7', 'EHT, First M87 Event Horizon Telescope Results. I (2019)'), DOI('10.3847/2041-8213/ac6674', 'EHT, First Sagittarius A* Results. I (2022)'), DOI('10.3847/2041-8213/ac6736', 'EHT, First Sagittarius A* Results. IV (2022)')],
    en: {
      title: 'Black-hole shadows',
      statusNote: 'Confirmed, with modest precision. The Event Horizon Telescope imaged a bright ring around M87* (2019) and around Sgr A* (2022, ring diameter 51.8 ± 2.3 μas). Both rings are consistent with the shadow of a Kerr black hole of the known mass. The constraints on alternatives are far weaker than the solar-system or pulsar tests.',
      plain: 'Radio images of the gas around two supermassive black holes show a dark centre surrounded by a ring of the predicted size.',
      formal: r`For a Schwarzschild black hole the shadow edge is at impact parameter $b_c=3\sqrt3\,GM/c^2$.`,
      why: 'This is a direct test of the geometry near a horizon, a region no other experiment reaches. At present it agrees with general relativity but cannot yet separate it from close alternatives.',
    },
    es: {
      title: 'Sombras de agujeros negros',
      statusNote: 'Confirmado, con precisión modesta. El Event Horizon Telescope obtuvo imágenes de un anillo brillante alrededor de M87* (2019) y de Sgr A* (2022, diámetro del anillo 51,8 ± 2,3 μas). Ambos anillos son compatibles con la sombra de un agujero negro de Kerr de la masa conocida. Las restricciones sobre alternativas son mucho más débiles que las de las pruebas del sistema solar o de los púlsares.',
      plain: 'Las imágenes de radio del gas alrededor de dos agujeros negros supermasivos muestran un centro oscuro rodeado por un anillo del tamaño predicho.',
      formal: r`Para un agujero negro de Schwarzschild el borde de la sombra está en el parámetro de impacto $b_c=3\sqrt3\,GM/c^2$.`,
      why: 'Es una prueba directa de la geometría cerca de un horizonte, una región que ningún otro experimento alcanza. Por ahora coincide con la relatividad general, pero aún no la distingue de alternativas cercanas.',
    },
  },
  {
    id: 'frame-dragging', kind: 'confirmed', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [ARXIV('1105.3456', 'Everitt et al., Gravity Probe B: final results, Phys. Rev. Lett. 106, 221101 (2011)')],
    en: {
      title: 'Frame dragging',
      statusNote: 'Confirmed at roughly the 20% level. Gravity Probe B measured a frame-dragging drift of −37.2 ± 7.2 mas/yr (predicted −39.2) and a geodetic drift of −6601.8 ± 18.3 mas/yr (predicted −6606.1).',
      plain: 'A rotating mass drags the local inertial frames around with it, and gyroscopes in orbit around the Earth precess accordingly.',
      formal: r`The gyroscope drift has a geodetic part from space curvature and a frame-dragging part $\propto GJ/(c^2 r^3)$ from the Earth’s angular momentum $J$.`,
      why: 'Frame dragging is the signature of a rotating source, the same effect that is huge near a Kerr black hole. It had never been measured with gyroscopes before 2011.',
    },
    es: {
      title: 'Arrastre de sistemas inerciales',
      statusNote: 'Confirmado a nivel de aproximadamente el 20%. Gravity Probe B midió una deriva de arrastre de −37,2 ± 7,2 mas/año (predicha −39,2) y una deriva geodésica de −6601,8 ± 18,3 mas/año (predicha −6606,1).',
      plain: 'Una masa en rotación arrastra consigo los sistemas inerciales locales, y los giroscopios en órbita alrededor de la Tierra precesan en consecuencia.',
      formal: r`La deriva del giroscopio tiene una parte geodésica por la curvatura espacial y una parte de arrastre $\propto GJ/(c^2 r^3)$ debida al momento angular $J$ de la Tierra.`,
      why: 'El arrastre es la firma de una fuente en rotación, el mismo efecto que es enorme cerca de un agujero negro de Kerr. Hasta 2011 nunca se había medido con giroscopios.',
    },
  },

  // ---------- open theoretical problems ----------
  {
    id: 'singularities', kind: 'theory', view: 'quantum', module: 'spacetime', checked: CHECKED,
    sources: [DOI('10.1103/PhysRevLett.14.57', 'Penrose, Gravitational collapse and space-time singularities, Phys. Rev. Lett. 14, 57 (1965)'), WEB('https://www.nobelprize.org/prizes/physics/2020/summary/', 'Nobel Prize in Physics 2020')],
    en: {
      title: 'Singularities',
      statusNote: 'Open theoretical problem. Penrose (1965) proved that once a trapped surface forms, general relativity predicts incomplete geodesics; Hawking and Penrose extended this. The theorems do not say what happens at the incompleteness, and they assume classical energy conditions on matter. Penrose shared the 2020 Nobel Prize in Physics for showing that black-hole formation is a robust prediction of the theory.',
      plain: 'General relativity predicts that matter collapsing far enough reaches a place where the theory itself stops making sense.',
      formal: r`If a closed trapped surface exists and $R_{\mu\nu}k^\mu k^\nu\ge0$ for all null $k$, then some null geodesic cannot be extended.`,
      why: 'A theory that predicts its own breakdown must be replaced or completed there. Whether the singularities are hidden from outside observers is the separate cosmic-censorship question (see Frontiers).',
    },
    es: {
      title: 'Singularidades',
      statusNote: 'Problema teórico abierto. Penrose (1965) demostró que, una vez que se forma una superficie atrapada, la relatividad general predice geodésicas incompletas; Hawking y Penrose lo ampliaron. Los teoremas no dicen qué ocurre en la incompletitud y suponen condiciones de energía clásicas para la materia. Penrose compartió el Nobel de Física de 2020 por mostrar que la formación de agujeros negros es una predicción robusta de la teoría.',
      plain: 'La relatividad general predice que la materia que colapsa lo suficiente llega a un lugar donde la propia teoría deja de tener sentido.',
      formal: r`Si existe una superficie atrapada cerrada y $R_{\mu\nu}k^\mu k^\nu\ge0$ para todo $k$ nulo, alguna geodésica nula no se puede prolongar.`,
      why: 'Una teoría que predice su propia ruptura debe sustituirse o completarse allí. Si las singularidades quedan ocultas a los observadores exteriores es la pregunta distinta de la censura cósmica (véase Fronteras).',
    },
  },
  {
    id: 'quantum-gravity', kind: 'theory', view: 'quantum', checked: CHECKED,
    sources: [ARXIV('gr-qc/9405057', 'Donoghue, General relativity as an effective field theory (1994)'), ARXIV('gr-qc/0311082', 'Burgess, Quantum gravity in everyday life, Living Rev. Relativ. (2004)')],
    en: {
      title: 'Quantum gravity',
      statusNote: 'Open theoretical problem. Treated like other quantum field theories, general relativity is non-renormalisable: Newton’s constant has dimensions of length squared in natural units, and loop calculations need infinitely many new parameters. As an effective field theory it makes sound quantum predictions at energies far below the Planck scale. String theory, loop quantum gravity and asymptotic safety are active programmes. None has made an experimentally confirmed prediction.',
      plain: 'We do not have a theory that treats gravity and quantum mechanics together at the Planck length, about 10⁻³⁵ m.',
      formal: r`$\ell_P=\sqrt{\hbar G/c^3}\approx1.6\times10^{-35}\,\mathrm{m}$, where quantum and gravitational effects are comparable.`,
      why: 'Singularities, black-hole evaporation and the early universe all need this scale. The scale is far beyond any accelerator, so guidance comes mostly from consistency arguments.',
    },
    es: {
      title: 'Gravedad cuántica',
      statusNote: 'Problema teórico abierto. Tratada como las demás teorías cuánticas de campos, la relatividad general no es renormalizable: la constante de Newton tiene dimensiones de longitud al cuadrado en unidades naturales, y los cálculos a bucles necesitan infinitos parámetros nuevos. Como teoría de campos efectiva da predicciones cuánticas sólidas a energías muy inferiores a la escala de Planck. La teoría de cuerdas, la gravedad cuántica de bucles y la seguridad asintótica son programas activos. Ninguno ha hecho una predicción confirmada experimentalmente.',
      plain: 'No tenemos una teoría que trate juntas la gravedad y la mecánica cuántica a la longitud de Planck, de unos 10⁻³⁵ m.',
      formal: r`$\ell_P=\sqrt{\hbar G/c^3}\approx1.6\times10^{-35}\,\mathrm{m}$, donde los efectos cuánticos y gravitatorios son comparables.`,
      why: 'Las singularidades, la evaporación de agujeros negros y el universo primitivo necesitan esta escala. Está muy por encima de cualquier acelerador, así que la guía viene sobre todo de argumentos de coherencia.',
    },
  },
  {
    id: 'information', kind: 'theory', view: 'quantum', checked: CHECKED,
    sources: [DOI('10.1103/PhysRevD.14.2460', 'Hawking, Breakdown of predictability in gravitational collapse, Phys. Rev. D 14, 2460 (1976)'), ARXIV('2006.06872', 'Almheiri, Hartman, Maldacena, Shaghoulian & Tajdini, The entropy of Hawking radiation, Rev. Mod. Phys. (2021)')],
    en: {
      title: 'Black-hole information problem',
      statusNote: 'Open theoretical problem, with recent progress. Hawking (1976) argued that evaporation turns a pure state into thermal radiation, which would violate quantum mechanics. Since 2019, semiclassical calculations with “islands” reproduce the unitary Page curve for the radiation entropy, widely seen as progress. A complete account for a real evaporating black hole is still missing.',
      plain: 'A black hole radiates and evaporates. If it started as a pure quantum state, where does the information in what fell in end up?',
      formal: r`Hawking temperature $T_H=\hbar c^3/(8\pi G M k_B)$; unitarity requires the radiation entropy to follow the Page curve, rising and then falling.`,
      why: 'The puzzle forces a choice between giving up unitarity, locality or the semiclassical picture of the horizon. It is the sharpest known conflict between gravity and quantum theory.',
    },
    es: {
      title: 'Problema de la información en agujeros negros',
      statusNote: 'Problema teórico abierto, con avances recientes. Hawking (1976) sostuvo que la evaporación convierte un estado puro en radiación térmica, lo que violaría la mecánica cuántica. Desde 2019, cálculos semiclásicos con “islas” reproducen la curva de Page unitaria para la entropía de la radiación, algo que se ve ampliamente como un avance. Aún falta una explicación completa para un agujero negro real que se evapora.',
      plain: 'Un agujero negro irradia y se evapora. Si empezó como un estado cuántico puro, ¿a dónde va a parar la información de lo que cayó dentro?',
      formal: r`Temperatura de Hawking $T_H=\hbar c^3/(8\pi G M k_B)$; la unitariedad exige que la entropía de la radiación siga la curva de Page, que sube y luego baja.`,
      why: 'El enigma obliga a elegir entre renunciar a la unitariedad, a la localidad o a la imagen semiclásica del horizonte. Es el conflicto más agudo conocido entre la gravedad y la teoría cuántica.',
    },
  },
  {
    id: 'cc-problem', kind: 'theory', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [DOI('10.1103/RevModPhys.61.1', 'Weinberg, The cosmological constant problem, Rev. Mod. Phys. 61, 1 (1989)'), ARXIV('1205.3365', 'Martin, Everything you always wanted to know about the cosmological constant problem, C. R. Phys. (2012)'), PLANCK18],
    en: {
      title: 'The cosmological-constant problem',
      statusNote: 'Open theoretical problem. Naive estimates of the quantum vacuum energy, cut off near the Planck scale, exceed the observed dark-energy density by roughly 120 orders of magnitude (the exact figure depends on the cutoff). Planck 2018 gives Ω_Λ ≈ 0.685. No accepted mechanism explains why the effective value is so small but not zero.',
      plain: 'Quantum fields should gravitate through their vacuum energy, yet the observed accelerating expansion is vastly smaller than they suggest.',
      formal: r`$G_{\mu\nu}+\Lambda g_{\mu\nu}=8\pi G\,T_{\mu\nu}$, with $\rho_\Lambda=\Lambda/(8\pi G)$ the vacuum energy density.`,
      why: 'It is a question of fine-tuning and of how quantum fields couple to curvature. It shows that the cosmological dark energy cannot be explained without understanding gravity and quantum theory together.',
    },
    es: {
      title: 'El problema de la constante cosmológica',
      statusNote: 'Problema teórico abierto. Las estimaciones ingenuas de la energía del vacío cuántico, cortadas cerca de la escala de Planck, superan la densidad de energía oscura observada en unos 120 órdenes de magnitud (la cifra exacta depende del corte). Planck 2018 da Ω_Λ ≈ 0,685. Ningún mecanismo aceptado explica por qué el valor efectivo es tan pequeño pero no nulo.',
      plain: 'Los campos cuánticos deberían gravitar mediante su energía del vacío, pero la expansión acelerada observada es muchísimo menor que la que sugieren.',
      formal: r`$G_{\mu\nu}+\Lambda g_{\mu\nu}=8\pi G\,T_{\mu\nu}$, con $\rho_\Lambda=\Lambda/(8\pi G)$ la densidad de energía del vacío.`,
      why: 'Es una cuestión de ajuste fino y de cómo se acoplan los campos cuánticos a la curvatura. Muestra que la energía oscura cosmológica no se explica sin entender juntas la gravedad y la teoría cuántica.',
    },
  },
  {
    id: 'dark-energy-nature', kind: 'theory', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [PLANCK18, WEB('https://www.nobelprize.org/prizes/physics/2011/summary/', 'Nobel Prize in Physics 2011: accelerating expansion')],
    en: {
      title: 'What is dark energy?',
      statusNote: 'Open. The accelerating expansion was found with supernovae in 1998 (Nobel Prize 2011). A cosmological constant fits nearly all data: Planck 2018 with BAO gives w = −1.03 ± 0.03. Whether the acceleration is a constant Λ, an evolving field or a modification of gravity is not settled. See the DESI card for a hint of evolution.',
      plain: 'About 70% of the universe’s energy budget behaves as a smooth component that makes the expansion speed up. We do not know what it is.',
      formal: r`Equation of state $w=p/\rho$; a cosmological constant has $w=-1$ exactly.`,
      why: 'This is the main reason cosmologists look for extensions of general relativity at the largest scales.',
    },
    es: {
      title: '¿Qué es la energía oscura?',
      statusNote: 'Abierto. La expansión acelerada se descubrió con supernovas en 1998 (Nobel 2011). Una constante cosmológica ajusta casi todos los datos: Planck 2018 con BAO da w = −1,03 ± 0,03. No está decidido si la aceleración es una constante Λ, un campo que evoluciona o una modificación de la gravedad. Mira la tarjeta de DESI para una pista de evolución.',
      plain: 'Cerca del 70% del presupuesto de energía del universo se comporta como una componente suave que acelera la expansión. No sabemos qué es.',
      formal: r`Ecuación de estado $w=p/\rho$; una constante cosmológica tiene exactamente $w=-1$.`,
      why: 'Es la razón principal por la que los cosmólogos buscan extensiones de la relatividad general a las mayores escalas.',
    },
  },

  // ---------- tensions and unexplained observations ----------
  {
    id: 'dark-matter', kind: 'tension', view: 'rotation', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('1605.04909', 'Bertone & Hooper, A History of Dark Matter, Rev. Mod. Phys. (2018)'), ARXIV('astro-ph/0608407', 'Clowe et al., A direct empirical proof of the existence of dark matter (Bullet Cluster, 2006)'), DOI('10.1103/4dyc-z8zf', 'LZ, Dark matter search results from 4.2 tonne-years, Phys. Rev. Lett. 135 (2025)')],
    en: {
      title: 'Dark matter',
      statusNote: 'Evidence strong, nature unknown. Flat galaxy rotation curves, gravitational lensing, the Bullet Cluster (where the lensing mass is offset from the hot gas) and the CMB acoustic peaks all point to unseen matter that gravitates. Direct detection has found nothing: LZ’s 2025 result (4.2 tonne-years) set a world-leading spin-independent limit, 2.2 × 10⁻⁴⁸ cm² at 40 GeV/c² (90% confidence), with no excess over background. This does not rule out other dark-matter candidates.',
      plain: 'Stars and gas in galaxies move as if there were much more mass than we see. Either that mass is real and invisible, or gravity differs from what we assume.',
      formal: r`For circular orbits $v^2(r)=GM(<r)/r$; a flat curve $v\approx{\rm const}$ requires $M(<r)\propto r$.`,
      why: 'Dark matter is inferred by applying general relativity (or Newtonian gravity) to observations. The same inference could fail if gravity is modified, which is why the Bullet Cluster and the CMB matter: they are hard for simple modified-gravity models.',
    },
    es: {
      title: 'Materia oscura',
      statusNote: 'Evidencia sólida, naturaleza desconocida. Las curvas de rotación planas, las lentes gravitacionales, el Cúmulo Bala (donde la masa de la lente está desplazada del gas caliente) y los picos acústicos del fondo cósmico de microondas apuntan a materia invisible que gravita. La detección directa no ha encontrado nada: el resultado de LZ de 2025 (4,2 toneladas-año) fijó un límite independiente del espín de los más estrictos del mundo, 2,2 × 10⁻⁴⁸ cm² a 40 GeV/c² (90% de confianza), sin exceso sobre el fondo. Eso no descarta otros candidatos de materia oscura.',
      plain: 'Las estrellas y el gas de las galaxias se mueven como si hubiera mucha más masa que la que vemos. O esa masa es real e invisible, o la gravedad es distinta de lo que suponemos.',
      formal: r`Para órbitas circulares $v^2(r)=GM(<r)/r$; una curva plana $v\approx{\rm const}$ exige $M(<r)\propto r$.`,
      why: 'La materia oscura se infiere aplicando la relatividad general (o la gravedad newtoniana) a las observaciones. Esa inferencia podría fallar si la gravedad se modifica; por eso importan el Cúmulo Bala y el fondo cósmico de microondas: son difíciles para los modelos sencillos de gravedad modificada.',
    },
  },
  {
    id: 'hubble-tension', kind: 'tension', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('2510.23823', 'H0DN Collaboration, Local Distance Network, A&A 708, A166 (2026)'), ARXIV('2506.20707', 'Camphuis et al. (SPT-3G), Phys. Rev. D (2026)'), ARXIV('2408.06153', 'Freedman et al. (CCHP), TRGB and JAGB with JWST (2024)')],
    en: {
      title: 'The Hubble tension',
      statusNote: 'Observational tension, about 7σ for the most precise pair. The Local Distance Network (H0DN, 2026) combines many distance indicators and finds H₀ = 73.50 ± 0.81 km/s/Mpc, 7.1σ above ΛCDM fitted to Planck + SPT + ACT (CMB combination: 67.19 ± 0.38). SH0ES alone had reported 73.04 ± 1.04 in 2022. Not all local data agree: the CCHP group’s TRGB calibration with JWST gives 70.39 ± 1.22 (stat) ± 1.33 (sys) ± 0.70 (SN), and disputes the size of the tension. The cause (systematics or new physics) is unknown.',
      plain: 'The universe’s expansion rate today, measured with a ladder of nearby distances, is higher than the rate inferred from the early universe by the CMB and a standard cosmological model.',
      formal: r`$N_\sigma=|H_a-H_b|/\sqrt{\sigma_a^2+\sigma_b^2}$; for 73.50 ± 0.81 and 67.19 ± 0.38 this is about 7.`,
      why: 'Both sides are precise and have been checked many ways. If neither has an unrecognised error, ΛCDM, the standard model built on general relativity, needs something new before recombination or in the late universe.',
    },
    es: {
      title: 'La tensión de Hubble',
      statusNote: 'Tensión observacional, de unos 7σ para el par más preciso. La Red de Distancias Locales (H0DN, 2026) combina muchos indicadores de distancia y obtiene H₀ = 73,50 ± 0,81 km/s/Mpc, 7,1σ por encima de ΛCDM ajustado a Planck + SPT + ACT (combinación del fondo cósmico: 67,19 ± 0,38). SH0ES solo había dado 73,04 ± 1,04 en 2022. No todos los datos locales coinciden: la calibración TRGB del grupo CCHP con JWST da 70,39 ± 1,22 (estad.) ± 1,33 (sist.) ± 0,70 (SN) y discute el tamaño de la tensión. La causa (sistemáticos o física nueva) se desconoce.',
      plain: 'El ritmo actual de expansión del universo, medido con una escalera de distancias cercanas, es mayor que el ritmo deducido del universo primitivo mediante el fondo cósmico de microondas y un modelo cosmológico estándar.',
      formal: r`$N_\sigma=|H_a-H_b|/\sqrt{\sigma_a^2+\sigma_b^2}$; para 73,50 ± 0,81 y 67,19 ± 0,38 sale cerca de 7.`,
      why: 'Los dos lados son precisos y se han comprobado de muchas formas. Si ninguno tiene un error no reconocido, ΛCDM, el modelo estándar construido sobre la relatividad general, necesita algo nuevo antes de la recombinación o en el universo tardío.',
    },
  },
  {
    id: 's8', kind: 'tension', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('2503.19441', 'Wright et al. (KiDS-Legacy), cosmic shear, A&A (2025)'), ARXIV('2601.14559', 'DES Collaboration, Year 6: galaxy clustering and weak lensing (2026)')],
    en: {
      title: 'The S₈ tension',
      statusNote: 'Mild and not settled. KiDS-Legacy (2025) finds S₈ = 0.815 (+0.016, −0.021), agreeing with Planck at 0.73σ, so the earlier KiDS tension has gone. DES Year 6 (2026) 3×2pt finds S₈ = 0.789 ± 0.012, which differs from the CMB (Planck 2018, ACT-DR6, SPT-3G) by 1.8σ in the full parameter space and 2.6σ in S₈ alone. Weak lensing and the CMB therefore agree better than a few years ago, but not uniformly.',
      plain: 'Weak lensing measures how clumpy matter is today. Early analyses found it clumpier than expected from the CMB; the newest ones differ much less.',
      formal: r`$S_8=\sigma_8\sqrt{\Omega_m/0.3}$ is the combination that weak lensing constrains best.`,
      why: 'Clumpiness depends on the growth of structure, which tests gravity on cosmological scales. A persistent deficit could point to modified gravity or to neutrino or dark-matter physics, but at about 2σ the safe conclusion is to wait for more data.',
    },
    es: {
      title: 'La tensión S₈',
      statusNote: 'Leve y no resuelta. KiDS-Legacy (2025) obtiene S₈ = 0,815 (+0,016, −0,021), de acuerdo con Planck a 0,73σ, de modo que la tensión anterior de KiDS ha desaparecido. DES Año 6 (2026), con 3×2pt, obtiene S₈ = 0,789 ± 0,012, que difiere del fondo cósmico (Planck 2018, ACT-DR6, SPT-3G) en 1,8σ en todo el espacio de parámetros y 2,6σ solo en S₈. Así, las lentes débiles y el fondo cósmico concuerdan mejor que hace unos años, pero no de forma uniforme.',
      plain: 'Las lentes débiles miden cuán aglomerada está hoy la materia. Los primeros análisis la encontraron más aglomerada de lo esperado según el fondo cósmico; los más recientes difieren mucho menos.',
      formal: r`$S_8=\sigma_8\sqrt{\Omega_m/0.3}$ es la combinación que mejor restringen las lentes débiles.`,
      why: 'La aglomeración depende del crecimiento de estructuras, que prueba la gravedad a escalas cosmológicas. Un déficit persistente podría apuntar a gravedad modificada o a física de neutrinos o de materia oscura, pero con unos 2σ lo prudente es esperar más datos.',
    },
  },
  {
    id: 'desi', kind: 'tension', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('2503.14738', 'DESI Collaboration, DR2 BAO cosmological constraints (2025)'), ARXIV('2512.10585', 'Is dark energy dynamical in the DESI era? A critical review (2025)')],
    en: {
      title: 'DESI and evolving dark energy',
      statusNote: 'Tension of 2.8–4.2σ, below the 5σ discovery threshold. DESI DR2 BAO (more than 14 million galaxies and quasars) with CMB data prefers a time-evolving dark energy over ΛCDM at 3.1σ. Adding supernovae raises the preference to 2.8–4.2σ depending on the supernova sample. Critics argue the result is driven by particular supernova subsets and by tensions between datasets. No newer DESI data release with a dark-energy result was found as of November 2026.',
      plain: 'Combined galaxy, CMB and supernova data fit slightly better if dark energy weakens over time rather than staying constant.',
      formal: r`CPL form $w(a)=w_0+w_a(1-a)$; ΛCDM is $w_0=-1,\ w_a=0$.`,
      why: 'If confirmed, dark energy is not a cosmological constant, which would change what a “solution” to the cosmological-constant problem must be. Right now it is a hint that needs independent data.',
    },
    es: {
      title: 'DESI y la energía oscura evolutiva',
      statusNote: 'Tensión de 2,8–4,2σ, por debajo del umbral de descubrimiento de 5σ. Las oscilaciones acústicas de bariones (BAO) de DESI DR2 (más de 14 millones de galaxias y cuásares) con datos del fondo cósmico prefieren una energía oscura que evoluciona con el tiempo frente a ΛCDM a 3,1σ. Al añadir supernovas, la preferencia sube a 2,8–4,2σ según la muestra de supernovas. Los críticos sostienen que el resultado depende de ciertos subconjuntos de supernovas y de tensiones entre conjuntos de datos. A noviembre de 2026 no se encontró una publicación de datos de DESI más reciente con un resultado sobre energía oscura.',
      plain: 'Los datos combinados de galaxias, fondo cósmico y supernovas se ajustan algo mejor si la energía oscura se debilita con el tiempo en vez de permanecer constante.',
      formal: r`Forma CPL $w(a)=w_0+w_a(1-a)$; ΛCDM es $w_0=-1,\ w_a=0$.`,
      why: 'Si se confirma, la energía oscura no es una constante cosmológica, lo que cambiaría lo que debe ser una “solución” del problema de la constante cosmológica. Ahora mismo es una pista que necesita datos independientes.',
    },
  },
  {
    id: 'cmb-anomalies', kind: 'tension', view: 'tensions', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('1906.02552', 'Planck 2018 results. VII. Isotropy and statistics of the CMB'), ARXIV('1510.07929', 'Schwarz et al., CMB anomalies after Planck, Class. Quantum Grav. (2016)')],
    en: {
      title: 'Large-angle CMB anomalies',
      statusNote: 'Modest significance, chosen after seeing the data. Planck reports a low quadrupole and a power deficit at large angles, a hemispherical power asymmetry, and a cold spot, each at roughly the 2–3σ level. Because these features were picked a posteriori, their true significance is hard to state. They are consistent with statistical flukes, and no confirmed physical cause exists.',
      plain: 'The cosmic microwave background has a few odd features on the largest angular scales that look slightly less random than the standard model expects.',
      formal: r`The temperature power spectrum $C_\ell$ at $\ell=2,3$ lies below the ΛCDM mean.`,
      why: 'The standard model assumes the universe is statistically isotropic. Systematic deviations would challenge that assumption, but today the evidence is weak.',
    },
    es: {
      title: 'Anomalías del fondo cósmico a gran ángulo',
      statusNote: 'Significancia modesta, elegidas tras ver los datos. Planck informa de un cuadrupolo bajo y un déficit de potencia a grandes ángulos, una asimetría hemisférica de potencia y una mancha fría, cada una en torno a 2–3σ. Como se escogieron a posteriori, su significancia real es difícil de fijar. Son compatibles con fluctuaciones estadísticas, y no existe ninguna causa física confirmada.',
      plain: 'El fondo cósmico de microondas tiene algunos rasgos extraños a las mayores escalas angulares que parecen algo menos aleatorios de lo que espera el modelo estándar.',
      formal: r`El espectro de potencias de temperatura $C_\ell$ en $\ell=2,3$ queda por debajo de la media de ΛCDM.`,
      why: 'El modelo estándar supone que el universo es estadísticamente isótropo. Desviaciones sistemáticas desafiarían esa suposición, pero hoy la evidencia es débil.',
    },
  },
  {
    id: 'wide-binaries', kind: 'debated', view: 'rotation', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('2305.04613', 'Chae, Breakdown of the Newton–Einstein standard gravity at low acceleration, ApJ 952, 128 (2023)'), WEB('https://academic.oup.com/mnras/article/527/3/4573/7342478', 'Banik et al., Strong constraints on the gravitational law from Gaia DR3 wide binaries, MNRAS 527, 4573 (2024)'), ARXIV('2504.07569', 'Pittordis et al., Wide binaries from Gaia DR3: testing GR vs MOND (2025)')],
    en: {
      title: 'Wide binaries and low-acceleration gravity',
      statusNote: 'Under debate; analyses disagree. Chae (2023) analysed about 26,600 Gaia DR3 wide binaries and reported an anomaly at the low accelerations where MOND departs from Newton, matching MOND-like behaviour. Banik et al. (2024) analysed a different sample and found data consistent with Newtonian gravity, excluding MOND at more than 5σ. A later analysis (Pittordis et al. 2025) still prefers Newtonian gravity but says undetected hidden companions (triples) must be modelled carefully. The result depends on sample cuts and on the treatment of contamination.',
      plain: 'Very wide pairs of stars orbit so slowly that their gravity is as weak as at the edge of a galaxy. If gravity changes at low acceleration, the stars would move faster than Newton predicts.',
      formal: r`MOND replaces Newton’s law below $a_0\approx1.2\times10^{-10}\,\mathrm{m/s^2}$, giving $g\approx\sqrt{a_0 g_N}$.`,
      why: 'This is one of the few tests of low-acceleration gravity that does not rely on dark matter. It is also a lesson in how sensitive a result is to the modelling of unseen companions.',
    },
    es: {
      title: 'Binarias anchas y gravedad a baja aceleración',
      statusNote: 'En debate; los análisis discrepan. Chae (2023) analizó unas 26 600 binarias anchas de Gaia DR3 e informó de una anomalía a las bajas aceleraciones donde MOND se separa de Newton, con un comportamiento tipo MOND. Banik et al. (2024) analizaron otra muestra y hallaron datos compatibles con la gravedad newtoniana, excluyendo MOND a más de 5σ. Un análisis posterior (Pittordis et al. 2025) sigue prefiriendo la gravedad newtoniana, pero advierte de que hay que modelar con cuidado los compañeros ocultos no detectados (tripletes). El resultado depende de los cortes de la muestra y del tratamiento de la contaminación.',
      plain: 'Las parejas de estrellas muy separadas se orbitan tan despacio que su gravedad es tan débil como en el borde de una galaxia. Si la gravedad cambia a baja aceleración, las estrellas se moverían más rápido de lo que predice Newton.',
      formal: r`MOND sustituye la ley de Newton por debajo de $a_0\approx1.2\times10^{-10}\,\mathrm{m/s^2}$, con $g\approx\sqrt{a_0 g_N}$.`,
      why: 'Es una de las pocas pruebas de la gravedad a baja aceleración que no depende de la materia oscura. También enseña cuánto depende un resultado del modelado de compañeros invisibles.',
    },
  },
  {
    id: 'flyby', kind: 'tension', view: 'tests', checked: CHECKED,
    sources: [DOI('10.1103/PhysRevLett.100.091102', 'Anderson et al., Anomalous orbital-energy changes observed during spacecraft flybys of Earth, Phys. Rev. Lett. 100, 091102 (2008)'), ARXIV('1505.06884', 'Acedo, The flyby anomaly: a case for strong gravitomagnetism? (2015)')],
    en: {
      title: 'The flyby anomaly',
      statusNote: 'Unexplained, not an established violation of general relativity. Some spacecraft gained small unexpected speed changes in Earth flybys (Galileo 1990: +3.92 mm/s; NEAR 1998: +13.46 mm/s), while other flybys show none. A 2015 paper states that no viable conventional explanation had been proposed; proposed new-physics explanations are speculative. Whether orbit-modelling systematics play a part is not settled.',
      plain: 'A few spacecraft passing close to the Earth left with a speed slightly different from the prediction. The differences are millimetres per second.',
      formal: r`The reported residuals are of order $\Delta v_\infty/v_\infty\sim10^{-7}$ to $10^{-6}$.`,
      why: 'Small unexplained effects are worth recording, but a signal seen in some flybys and absent in others is more likely to come from unmodelled details than from new gravity.',
    },
    es: {
      title: 'La anomalía de los sobrevuelos',
      statusNote: 'Sin explicar, y no es una violación establecida de la relatividad general. Algunas naves ganaron pequeños cambios de velocidad inesperados en sobrevuelos de la Tierra (Galileo 1990: +3,92 mm/s; NEAR 1998: +13,46 mm/s), mientras que otros sobrevuelos no muestran ninguno. Un artículo de 2015 afirma que no se había propuesto ninguna explicación convencional viable; las explicaciones de física nueva son especulativas. No está decidido si los sistemáticos del modelado orbital influyen.',
      plain: 'Unas pocas naves que pasaron cerca de la Tierra salieron con una velocidad algo distinta de la predicha. Las diferencias son de milímetros por segundo.',
      formal: r`Los residuos informados son del orden de $\Delta v_\infty/v_\infty\sim10^{-7}$ a $10^{-6}$.`,
      why: 'Los efectos pequeños sin explicar merecen registrarse, pero una señal presente en unos sobrevuelos y ausente en otros se debe más probablemente a detalles sin modelar que a gravedad nueva.',
    },
  },
  {
    id: 'big-g', kind: 'tension', view: 'tests', checked: CHECKED,
    sources: [ARXIV('2409.03787', 'CODATA recommended values of the fundamental physical constants: 2022')],
    en: {
      title: 'The scatter in laboratory measurements of G',
      statusNote: 'A measurement puzzle, not evidence against general relativity. The CODATA 2022 value is G = 6.67430(15) × 10⁻¹¹ m³ kg⁻¹ s⁻², a relative uncertainty of 2.2 × 10⁻⁵, the largest of any fundamental constant. The 16 input measurements disagree more than their stated uncertainties allow, so CODATA expanded the uncertainties by a factor of 3.9. The suspected cause is unrecognised systematic errors in torsion-balance and other tabletop experiments.',
      plain: 'Newton’s constant is the least precisely known fundamental constant because careful laboratories get slightly different answers.',
      formal: r`$F=G\,m_1m_2/r^2$; the quoted relative uncertainty is $u_r(G)=2.2\times10^{-5}$.`,
      why: 'It shows how hard it is to measure the weakest force in the lab. The value of G does not affect general relativity’s predictions for orbits (these depend on GM), which are known to much higher precision.',
    },
    es: {
      title: 'La dispersión en las medidas de G en el laboratorio',
      statusNote: 'Un enigma de medición, no una evidencia contra la relatividad general. El valor CODATA 2022 es G = 6,67430(15) × 10⁻¹¹ m³ kg⁻¹ s⁻², con una incertidumbre relativa de 2,2 × 10⁻⁵, la mayor de cualquier constante fundamental. Las 16 medidas de entrada discrepan más de lo que permiten sus incertidumbres declaradas, así que CODATA las amplió por un factor 3,9. Se sospecha que la causa son errores sistemáticos no reconocidos en balanzas de torsión y otros experimentos de laboratorio.',
      plain: 'La constante de Newton es la constante fundamental peor conocida porque laboratorios cuidadosos obtienen respuestas ligeramente distintas.',
      formal: r`$F=G\,m_1m_2/r^2$; la incertidumbre relativa citada es $u_r(G)=2.2\times10^{-5}$.`,
      why: 'Muestra lo difícil que es medir en el laboratorio la más débil de las fuerzas. El valor de G no afecta a las predicciones de órbitas de la relatividad general (que dependen de GM), conocidas con mucha más precisión.',
    },
  },

  // ---------- resolved anomalies, and one claim not confirmed ----------
  {
    id: 'mercury', kind: 'resolved', view: 'tests', module: 'relativity', checked: CHECKED,
    sources: [WILL],
    en: {
      title: 'Mercury’s perihelion',
      statusNote: 'Resolved in 1915. After other planets are accounted for, about 43 arcseconds per century of Mercury’s perihelion advance remained unexplained under Newtonian gravity. Einstein’s new theory gave 42.98″ per century with no free parameters.',
      plain: 'Mercury’s elliptical orbit turns slowly. Newton’s law explained most of it, but a small piece was missing.',
      formal: r`General relativity adds $\Delta\phi=6\pi GM/[c^2a(1-e^2)]$ per orbit.`,
      why: 'A hypothetical inner planet, “Vulcan”, was proposed first; the anomaly turned out to be new physics instead. It is the cleanest case of an anomaly that was real and was resolved by a better theory.',
    },
    es: {
      title: 'El perihelio de Mercurio',
      statusNote: 'Resuelta en 1915. Una vez descontados los demás planetas, quedaban sin explicar con la gravedad newtoniana unos 43 segundos de arco por siglo del avance del perihelio de Mercurio. La nueva teoría de Einstein dio 42,98″ por siglo sin parámetros libres.',
      plain: 'La órbita elíptica de Mercurio gira lentamente. La ley de Newton explicaba casi todo, pero faltaba un trozo pequeño.',
      formal: r`La relatividad general añade $\Delta\phi=6\pi GM/[c^2a(1-e^2)]$ por órbita.`,
      why: 'Primero se propuso un planeta interior hipotético, “Vulcano”; la anomalía resultó ser física nueva. Es el caso más limpio de una anomalía real resuelta por una teoría mejor.',
    },
  },
  {
    id: 'pioneer', kind: 'resolved', view: 'tests', checked: CHECKED,
    sources: [ARXIV('1204.2507', 'Turyshev et al., Support for the thermal origin of the Pioneer anomaly, Phys. Rev. Lett. 108, 241101 (2012)'), ARXIV('gr-qc/0104064', 'Anderson et al., Study of the anomalous acceleration of Pioneer 10 and 11 (2002)')],
    en: {
      title: 'The Pioneer anomaly',
      statusNote: 'Resolved in 2012. Pioneer 10 and 11 showed an unexplained acceleration towards the Sun of about 8.7 × 10⁻¹⁰ m/s². A detailed thermal model built from the spacecraft design and telemetry (Turyshev et al., 2012) shows that heat radiated unevenly from the spacecraft produces a recoil of the right size, direction and time dependence, leaving no anomalous acceleration.',
      plain: 'Two probes leaving the solar system seemed to be pulled slightly towards the Sun. The cause was their own heat.',
      formal: r`A recoil force $F=P/c$ from anisotropic thermal radiation of power $P$ gives $a=F/m$.`,
      why: 'Many modified-gravity papers tried to explain it. It was an engineering effect, which is why new-physics claims need a full error budget first.',
    },
    es: {
      title: 'La anomalía de las Pioneer',
      statusNote: 'Resuelta en 2012. Pioneer 10 y 11 mostraron una aceleración inexplicada hacia el Sol de unos 8,7 × 10⁻¹⁰ m/s². Un modelo térmico detallado construido a partir del diseño y la telemetría de las naves (Turyshev et al., 2012) muestra que el calor radiado de forma desigual produce un retroceso de tamaño, dirección y dependencia temporal correctos, sin dejar aceleración anómala.',
      plain: 'Dos sondas que salían del sistema solar parecían tiradas ligeramente hacia el Sol. La causa fue su propio calor.',
      formal: r`Una fuerza de retroceso $F=P/c$ por radiación térmica anisótropa de potencia $P$ da $a=F/m$.`,
      why: 'Muchos artículos de gravedad modificada intentaron explicarla. Era un efecto de ingeniería, por eso las afirmaciones de física nueva necesitan primero un balance completo de errores.',
    },
  },
  {
    id: 'opera', kind: 'resolved', view: 'tests', checked: CHECKED,
    sources: [ARXIV('1109.4897', 'OPERA Collaboration, Measurement of the neutrino velocity with the OPERA detector in the CNGS beam (revised)'), ARXIV('1212.1276', 'OPERA Collaboration, neutrino velocity using the 2012 dedicated data')],
    en: {
      title: 'OPERA’s faster-than-light neutrinos',
      statusNote: 'Resolved in 2012. In 2011 OPERA reported neutrinos arriving about 60 ns early over 730 km, (v−c)/c ≈ 2.5 × 10⁻⁵. The collaboration found two timing faults: a fibre-optic connection that was not seated correctly and a clock-oscillator effect. The corrected analysis gives (v−c)/c = (2.7 ± 3.1 +3.4/−3.3) × 10⁻⁶, consistent with zero. This was a test of special relativity (Lorentz invariance), not of curved spacetime.',
      plain: 'A famous experiment appeared to show particles faster than light. A bad cable connection in the timing chain was one of the causes.',
      formal: r`$\delta=(v-c)/c$, with a time of flight $L/c\approx2.4\,\mathrm{ms}$ so $60\,\mathrm{ns}$ gives $\delta\approx2.5\times10^{-5}$.`,
      why: 'Extraordinary claims need independent checks. Other experiments (including ICARUS) measured the speed of the same beam and found it equal to c within errors.',
    },
    es: {
      title: 'Los neutrinos más rápidos que la luz de OPERA',
      statusNote: 'Resuelta en 2012. En 2011 OPERA informó de neutrinos que llegaban unos 60 ns antes en 730 km, (v−c)/c ≈ 2,5 × 10⁻⁵. La colaboración encontró dos fallos de sincronización: una conexión de fibra óptica mal acoplada y un efecto del oscilador del reloj. El análisis corregido da (v−c)/c = (2,7 ± 3,1 +3,4/−3,3) × 10⁻⁶, compatible con cero. Fue una prueba de la relatividad especial (invariancia de Lorentz), no del espaciotiempo curvo.',
      plain: 'Un experimento famoso pareció mostrar partículas más rápidas que la luz. Una conexión de cable defectuosa en la cadena de sincronización fue una de las causas.',
      formal: r`$\delta=(v-c)/c$, con un tiempo de vuelo $L/c\approx2.4\,\mathrm{ms}$, de modo que $60\,\mathrm{ns}$ da $\delta\approx2.5\times10^{-5}$.`,
      why: 'Las afirmaciones extraordinarias necesitan comprobaciones independientes. Otros experimentos (entre ellos ICARUS) midieron la velocidad del mismo haz y la hallaron igual a c dentro de los errores.',
    },
  },
  {
    id: 'bicep2', kind: 'resolved', view: 'tests', module: 'cosmos', checked: CHECKED,
    sources: [ARXIV('1502.00612', 'BICEP2/Keck and Planck, A joint analysis of BICEP2/Keck Array and Planck data, Phys. Rev. Lett. 114, 101301 (2015)'), ARXIV('1403.3985', 'BICEP2, Detection of B-mode polarization at degree angular scales, Phys. Rev. Lett. 112, 241101 (2014)')],
    en: {
      title: 'BICEP2 primordial B-modes',
      statusNote: 'Resolved in 2015. In March 2014 BICEP2 announced B-mode polarization it read as a primordial gravitational-wave signal, with tensor-to-scalar ratio r ≈ 0.2. The joint BICEP2/Keck–Planck analysis found strong evidence for polarized galactic dust and no statistically significant evidence of primordial tensor modes, with r < 0.12 (95% confidence).',
      plain: 'A detection thought to come from gravitational waves in the very early universe turned out to be mostly dust in our own galaxy.',
      formal: r`The tensor-to-scalar ratio $r=\mathcal P_t/\mathcal P_s$ measures primordial gravitational-wave power.`,
      why: 'The search continues with better dust modelling. The episode shows why foreground checks at several frequencies come before any claim.',
    },
    es: {
      title: 'Los modos B primordiales de BICEP2',
      statusNote: 'Resuelta en 2015. En marzo de 2014 BICEP2 anunció una polarización de modos B que interpretó como señal de ondas gravitacionales primordiales, con cociente tensor-escalar r ≈ 0,2. El análisis conjunto BICEP2/Keck–Planck halló evidencia sólida de polvo galáctico polarizado y ninguna evidencia estadísticamente significativa de modos tensoriales primordiales, con r < 0,12 (95% de confianza).',
      plain: 'Una detección que se creyó producida por ondas gravitacionales del universo muy primitivo resultó ser sobre todo polvo de nuestra propia galaxia.',
      formal: r`El cociente tensor-escalar $r=\mathcal P_t/\mathcal P_s$ mide la potencia de ondas gravitacionales primordiales.`,
      why: 'La búsqueda continúa con mejor modelado del polvo. El episodio muestra por qué las comprobaciones de primer plano en varias frecuencias van antes de cualquier afirmación.',
    },
  },
  {
    id: 'echoes', kind: 'debated', view: 'quantum', checked: CHECKED,
    sources: [ARXIV('1712.09966', 'Westerweck et al., Low significance of evidence for black hole echoes in gravitational wave data (2018)'), ARXIV('1906.00838', 'Uchikata et al., Searching for black hole echoes from the LIGO–Virgo Catalog GWTC-1 (2019)')],
    en: {
      title: 'Gravitational-wave “echoes”',
      statusNote: 'Claim not confirmed. In 2016–17 Abedi, Dykaar and Afshordi reported tentative echoes after merger signals, which could signal structure at the horizon scale. Independent reanalyses (Westerweck et al. 2018) found the evidence consistent with noise; a GWTC-1 catalogue search (Uchikata et al. 2019) reported no significant evidence. Authors of the original claim defend their statistics. No echo detection has been established.',
      plain: 'If a black hole had a surface instead of a horizon, waves could bounce back and arrive as faint repeats after the main merger signal.',
      formal: r`For a reflecting surface at a small proper distance $\epsilon$ outside the horizon, the echo delay grows like $\Delta t\sim (GM/c^3)\ln(1/\epsilon)$, up to constants.`,
      why: 'Echoes are one of few ways to test horizon-scale quantum-gravity ideas directly. The debate is mainly about how to estimate the noise background.',
    },
    es: {
      title: '“Ecos” de ondas gravitacionales',
      statusNote: 'Afirmación no confirmada. En 2016–17 Abedi, Dykaar y Afshordi informaron de ecos tentativos tras señales de fusión, que podrían indicar estructura a la escala del horizonte. Reanálisis independientes (Westerweck et al. 2018) hallaron la evidencia compatible con ruido; una búsqueda en el catálogo GWTC-1 (Uchikata et al. 2019) no halló evidencia significativa. Los autores de la afirmación original defienden su estadística. No se ha establecido ninguna detección de ecos.',
      plain: 'Si un agujero negro tuviera una superficie en lugar de un horizonte, las ondas podrían rebotar y llegar como repeticiones débiles tras la señal principal de la fusión.',
      formal: r`Para una superficie reflectante a una pequeña distancia propia $\epsilon$ fuera del horizonte, el retardo del eco crece como $\Delta t\sim (GM/c^3)\ln(1/\epsilon)$, salvo constantes.`,
      why: 'Los ecos son una de las pocas formas de probar directamente ideas de gravedad cuántica a escala del horizonte. El debate trata sobre todo de cómo estimar el fondo de ruido.',
    },
  },
];

export const KINDS: StatusKind[] = ['confirmed', 'theory', 'tension', 'debated', 'resolved'];
