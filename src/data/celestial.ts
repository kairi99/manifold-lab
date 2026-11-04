// Sourced constants and objects for the GR teaching module. See each entry's `sources`.
// Items marked "not re-verified" were recalled from the cited paper, not fetched. All other values were read in the cited primary source (arXiv/NTRS/IOP) on 2026-11-04.
export const G = 6.67430e-11;           // CODATA 2018, m^3 kg^-1 s^-2
export const C = 299792458;              // m/s exact
export const GM_SUN = 1.3271244e20;      // IAU 2015 Resolution B3 nominal, m^3 s^-2
export const M_SUN = GM_SUN / G;         // kg
export const AU = 1.495978707e11;        // m exact (IAU 2012)
export const PC = 3.0856775814913673e16; // m (648000/pi AU)
export const YEAR = 365.25 * 86400;      // Julian year, s

export interface Source { label: string; url?: string }
export interface CelestialBody {
  id: string; name: string; nameEs?: string;
  kind: 'star' | 'planet' | 'white dwarf' | 'neutron star' | 'black hole';
  gm: number; radiusM: number | null; distanceM?: number;
  note: string; noteEs?: string; sources: Source[];
  /** Dimensionless spin a* = Jc/(GM^2); lower/upper are bounds (a lone `lower` means a lower limit). */
  spin?: { value: number; lower?: number; upper?: number; method: string; methodEs?: string; source: Source };
  /** Spin angular momentum J, kg m^2/s. */
  angularMomentum?: number;
}
export interface OrbitPreset {
  id: string; name: string; nameEs?: string; centralId: string;
  aM: number; e: number; periodS: number;
  observed?: { quantity: string; quantityEs?: string; value: number; unit: string; uncertainty?: number; source: Source };
  note: string; noteEs?: string; caveat?: string; caveatEs?: string;
}
export interface LightPreset {
  id: string; name: string; nameEs?: string; centralId: string;
  impactParameterM: number;
  observed?: { quantity: string; quantityEs?: string; value: number; unit: string; uncertainty?: number; source: Source };
  note: string; noteEs?: string;
}

const kepler = (a: number, gm: number) => 2 * Math.PI * Math.sqrt(a ** 3 / gm);
const R_SUN = 6.957e8; // IAU 2015 B3 nominal
const R_EARTH = 6.3781e6; // IAU 2015 B3 nominal equatorial
const IAU = { label: 'IAU 2015 Resolution B3 (nominal solar and planetary values)', url: 'https://arxiv.org/abs/1510.07674' };
const GRAV22 = { label: 'GRAVITY Collab. 2022, A&A 657, L12', url: 'https://arxiv.org/abs/2112.07478' };
const EHT_M87 = { label: 'EHT Collab. 2019, ApJL 875, L1', url: 'https://arxiv.org/abs/1906.11238' };
const EHT_SGR = { label: 'EHT Collab. 2022, ApJL 930, L12', url: 'https://arxiv.org/abs/2311.08680' };
const FONSECA = { label: 'Fonseca et al. 2021, ApJL 915, L12 (mass 2.08 +/- 0.07 Msun)', url: 'https://arxiv.org/abs/2104.00880' };
const RILEY21 = { label: 'Riley et al. 2021, ApJL 918, L27 (R = 12.39 +1.30/-0.98 km)', url: 'https://arxiv.org/abs/2105.06978' };
const MILLER21 = { label: 'Miller et al. 2021, ApJL 918, L28 (R = 13.7 +2.6/-1.5 km)', url: 'https://arxiv.org/abs/2105.06979' };

export const BODIES: CelestialBody[] = [
  { id: 'sun', name: 'Sun',
    nameEs: "Sol", kind: 'star', gm: GM_SUN, radiusM: R_SUN, distanceM: AU,
    note: 'Weak field: r_s is only about 3 km, so effects are tiny but measurable (Mercury, light bending, Shapiro delay).',
    noteEs: "Campo débil: r_s es de apenas unos 3 km, así que los efectos son minúsculos pero medibles (Mercurio, deflexión de la luz, retraso de Shapiro).",
    sources: [IAU] },
  { id: 'earth', name: 'Earth',
    nameEs: "Tierra", kind: 'planet', gm: 3.986004418e14, radiusM: R_EARTH,
    note: 'r_s is under 1 cm. GPS clocks still need GR corrections of tens of microseconds per day.',
    noteEs: "r_s es menor que 1 cm. Aun así, los relojes GPS necesitan correcciones relativistas de decenas de microsegundos por día.",
    sources: [{ label: 'GM: IAU 2015 B3 / CODATA-era TT value 3.986004418e14; R: IAU 2015 B3 nominal equatorial', url: IAU.url }],
    angularMomentum: 0.3308 * 5.9722e24 * 6.378137e6 ** 2 * 7.292115e-5, // J = (I/MR^2) M R_eq^2 omega = 5.861e33; I/MR^2 = 0.3308, M, R_eq from the NASA Earth fact sheet (it does not state which radius I/MR^2 uses; equatorial assumed, mean radius would give 5.847e33); omega = sidereal rate 7.292115e-5 rad/s
  },
  { id: 'jupiter', name: 'Jupiter',
    nameEs: "Júpiter", kind: 'planet', gm: 1.2668653e17, radiusM: 7.1492e7,
    note: 'Most massive planet; r_s about 2.8 m, a useful comparison with the Sun.',
    noteEs: "El planeta más masivo; r_s ronda los 2.8 m, una comparación útil con el Sol.",
    sources: [{ label: 'IAU 2015 B3 nominal GM_J = 1.2668653e17, R_eq = 7.1492e7 m', url: IAU.url }] },
  { id: 'sirius-b', name: 'Sirius B',
    nameEs: "Sirius B", kind: 'white dwarf', gm: 1.018 * GM_SUN, radiusM: 0.008098 * R_SUN, distanceM: 2.64 * PC,
    note: 'Earth-sized star with about one solar mass, so GM/(c^2 R) is about 3 × 10^{−4}; gravitational redshift was measured from its spectrum.',
    noteEs: "Estrella del tamaño de la Tierra con aproximadamente una masa solar, de modo que GM/(c^2 R) es de unos 3 × 10^{−4}; el desplazamiento al rojo gravitacional se midió a partir de su espectro.",
    sources: [{ label: 'Bond et al. 2017, ApJ 840, 70: M = 1.018 +/- 0.011 Msun (abstract, Sec. 6); R = 0.008098 +/- 0.000046 Rsun (model fit, Sec. 6.2, internal error); distance 2.64 pc = 1/weighted-mean parallax of 0.3777" +/- 0.0031" and Hipparcos 0.37921" +/- 0.00158" (Sec. 6.1, mean computed here)', url: 'https://arxiv.org/abs/1703.10625' }] },
  { id: 'psr-j0740', name: 'PSR J0740+6620',
    nameEs: "PSR J0740+6620", kind: 'neutron star', gm: 2.08 * GM_SUN, radiusM: 12.39e3, distanceM: 1.14e3 * PC,
    note: 'Among the most massive known neutron stars; r_s about 6.1 km against R about 12 km, so the surface sits at only about 2 r_s.',
    noteEs: "Entre las estrellas de neutrones más masivas conocidas; r_s ronda los 6.1 km frente a R de unos 12 km, así que la superficie queda a solo unos 2 r_s.",
    sources: [FONSECA, RILEY21, MILLER21] },
  { id: 'psr-b1913', name: 'PSR B1913+16 (Hulse-Taylor, total system)',
    nameEs: "PSR B1913+16 (Hulse-Taylor, sistema total)", kind: 'neutron star', gm: 2.828 * GM_SUN, radiusM: null,
    note: 'GM is the TOTAL binary mass (1.438 + 1.390 Msun), used for orbital dynamics. The first binary pulsar; its orbital decay confirmed gravitational radiation.',
    noteEs: "GM es la masa TOTAL del sistema binario (1.438 + 1.390 Msun), usada para la dinámica orbital. Primer púlsar binario; su decaimiento orbital confirmó la radiación gravitacional.",
    sources: [{ label: 'Weisberg & Huang 2016, ApJ 829, 55 (m1 = 1.438 +/- 0.001, m2 = 1.390 +/- 0.001 Msun, abstract and Sec. 4.3)', url: 'https://arxiv.org/abs/1606.02744' }] },
  { id: 'sgr-a', name: 'Sagittarius A*',
    nameEs: "Sagittarius A*", kind: 'black hole', gm: 4.297e6 * GM_SUN, radiusM: null, distanceM: 8277 * PC,
    note: 'Black hole at the Galactic Center; the star S2 orbits it with a measured Schwarzschild precession.',
    noteEs: "Agujero negro del centro galáctico; la estrella S2 lo orbita con una precesión de Schwarzschild medida.",
    sources: [{ ...GRAV22, label: GRAV22.label + ': M = (4.297 +/- 0.012 stat, +/-0.040 sys)e6 Msun, R0 = 8277 +/- 9 stat, +/-30 sys pc (abstract text rounds M to 4.30e6)' }] },
  { id: 'm87', name: 'M87*',
    nameEs: "M87*", kind: 'black hole', gm: 6.5e9 * GM_SUN, radiusM: null, distanceM: 16.8e6 * PC,
    note: 'First black hole imaged by the EHT; its shadow ring is about 42 microarcseconds across.',
    noteEs: "Primer agujero negro captado en imagen por el EHT; el anillo de su sombra mide unos 42 microsegundos de arco.",
    sources: [{ ...EHT_M87, label: EHT_M87.label + ': M = (6.5 +/- 0.7)e9 Msun; D = 16.8 Mpc' }] },
  { id: 'cyg-x1', name: 'Cygnus X-1',
    nameEs: "Cygnus X-1", kind: 'black hole', gm: 21.2 * GM_SUN, radiusM: null, distanceM: 2.22e3 * PC,
    note: 'First widely accepted stellar-mass black hole candidate, now 21.2 +/- 2.2 Msun at 2.22 kpc.',
    noteEs: "Primer candidato a agujero negro estelar ampliamente aceptado, hoy con 21.2 +/- 2.2 Msun a 2.22 kpc.",
    spin: { value: 0.9985, lower: 0.9985, method: 'X-ray continuum fitting; 3-sigma LOWER limit a* > 0.9985, assumes spin aligned with orbit and neglects counteracting torque',
    methodEs: "Ajuste del continuo de rayos X; límite INFERIOR a 3 sigma a* > 0.9985, supone el espín alineado con la órbita y desprecia el par contrarrestante",
      source: { label: 'Zhao et al. 2021, ApJ 908, 117 abstract: a* > 0.9985 at 3 sigma, without the counteracting-torque correction (arXiv:2102.09093)', url: 'https://arxiv.org/abs/2102.09093' } },
    sources: [{ label: 'Miller-Jones et al. 2021, Science 371, 1046 (21.2 +/- 2.2 Msun; D = 2.22 +0.18/-0.17 kpc; abstract and main text)', url: 'https://arxiv.org/abs/2102.09091' }] },
  { id: 'gw150914', name: 'GW150914 remnant',
    nameEs: "Remanente de GW150914", kind: 'black hole', gm: 62 * GM_SUN, radiusM: null,
    note: 'Final black hole of the first detected merger; about 3 Msun of energy radiated as gravitational waves in about 0.2 s.',
    noteEs: "Agujero negro final de la primera fusión detectada; unas 3 Msun de energía se radiaron como ondas gravitacionales en unos 0.2 s.",
    sources: [{ label: 'LIGO/Virgo 2016, PRL 116, 241102 (final mass 62.0 +4.1/-3.7 Msun, source frame, 90%, Table I overall column)', url: 'https://arxiv.org/abs/1602.03840' }],
    spin: { value: 0.67, lower: 0.60, upper: 0.72, method: 'Gravitational-wave waveform fit, final spin 0.67 +0.05/-0.07 (90% credible)',
    methodEs: "Ajuste de la forma de onda gravitacional, espín final 0.67 +0.05/-0.07 (90% creíble)",
      source: { label: 'LIGO/Virgo 2016, PRL 116, 241102 Table I, overall column: final spin 0.67 +0.05/-0.07 (90% credible; arXiv:1602.03840 full text read)', url: 'https://arxiv.org/abs/1602.03840' } } },
  { id: 'grs1915', name: 'GRS 1915+105',
    nameEs: "GRS 1915+105", kind: 'black hole', gm: 12.4 * GM_SUN, radiusM: null, distanceM: 8.6e3 * PC,
    note: 'Microquasar with a near-extremal Kerr black hole; Reid 2014 parallax lowered the mass from 14 to 12.4 Msun.',
    noteEs: "Microcuásar con un agujero negro de Kerr casi extremo; el paralaje de Reid 2014 redujo la masa de 14 a 12.4 Msun.",
    sources: [{ label: 'Reid et al. 2014, ApJ 796, 2 (abstract: parallax D = 8.6 +2.0/-1.6 kpc, M = 12.4 +2.0/-1.8 Msun, jet inclination 60 +/- 5 deg; spin from the text: a* > 0.98, preliminary 0.98 +/- 0.01 stat, > 0.92 at 3 sigma)', url: 'https://arxiv.org/abs/1409.2453' }],
    spin: { value: 0.98, lower: 0.98, method: 'X-ray continuum fitting; a* > 0.98 LOWER limit computed for the older 14 Msun, 11 kpc, 66 deg inputs; Reid 2014 preliminary a* = 0.98 +/- 0.01 (stat), > 0.92 (3 sigma, with systematics) with revised inputs',
    methodEs: "Ajuste del continuo de rayos X; límite INFERIOR a* > 0.98 calculado para los datos antiguos de 14 Msun, 11 kpc, 66 deg; Reid 2014 preliminar a* = 0.98 +/- 0.01 (est.), > 0.92 (3 sigma, con sistemáticos) con datos revisados",
      source: { label: 'McClintock et al. 2006, ApJ 652, 518; Reid et al. 2014', url: 'https://arxiv.org/abs/astro-ph/0606076' } } },
];

const mercuryA = 57.909e9;
const s2a = 0.12495 * 8277 * AU; // arcsec x pc = AU numerically
const htA = Math.cbrt(2.828 * GM_SUN * (0.322997448918 * 86400 / (2 * Math.PI)) ** 2);
const gpsA = 26.56e6;

export const ORBITS: OrbitPreset[] = [
  { id: 'mercury', name: 'Mercury',
    nameEs: "Mercurio", centralId: 'sun', aM: mercuryA, e: 0.2056, periodS: 87.969 * 86400,
    observed: { quantity: 'GR perihelion advance',
    quantityEs: "Avance GR del perihelio", value: 42.9799, unit: 'arcsec/century', uncertainty: 0.0009,
      source: { label: 'Park et al. 2017, AJ 153, 121 Table 3: gravitoelectric (GR) term 42.9799 +/- 0.0009 arcsec/century (total 575.3100 +/- 0.0015); classic 43"/cy: Clemence 1947, not re-read', url: 'https://dspace.mit.edu/handle/1721.1/109312' } },
    note: 'The classic test: 6πGM/(c^2 a(1 − e^2)) per orbit gives about 43 arcsec per century.',
    noteEs: "El test clásico: 6πGM/(c^2 a(1 − e^2)) por órbita da unos 43 segundos de arco por siglo." },
  { id: 's2', name: 'S2 around Sgr A*',
    nameEs: "S2 alrededor de Sgr A*", centralId: 'sgr-a', aM: s2a, e: 0.88441, periodS: kepler(s2a, 4.297e6 * GM_SUN),
    observed: { quantity: 'Schwarzschild precession factor f_SP (0 Newtonian, 1 GR); about 12 arcmin per orbit',
    quantityEs: "Factor de precesión de Schwarzschild f_SP (0 newtoniano, 1 RG); unos 12 minutos de arco por órbita", value: 1.10, unit: '', uncertainty: 0.19,
      source: { label: 'GRAVITY Collab. 2020, A&A 636, L5 (abstract: f_SP = 1.10 +/- 0.19)', url: 'https://arxiv.org/abs/2004.07187' } },
    note: 'a = 0.12495" x 8277 pc, about 1034 AU, from the 2022 four-star fit; period follows from Kepler (about 16.0 yr).',
    noteEs: "a = 0.12495\" x 8277 pc, unas 1034 AU, a partir del ajuste de cuatro estrellas de 2022; el periodo sale de Kepler (unos 16.0 años).",
    caveat: 'Orbital elements are the GRAVITY 2022 values (A&A 657, L12, arXiv:2112.07478 orbital-elements table, S2 column: a = 0.12495" +/- 0.00004, e = 0.88441 +/- 0.00006), not the 2020 ones (a = 125.058 mas, e = 0.88466, R0 = 8178 pc, M = 4.261e6 Msun).',
    caveatEs: "Los elementos orbitales son los valores de GRAVITY 2022 (A&A 657, L12, arXiv:2112.07478, tabla de elementos orbitales, columna S2: a = 0.12495\" +/- 0.00004, e = 0.88441 +/- 0.00006), no los de 2020 (a = 125.058 mas, e = 0.88466, R0 = 8178 pc, M = 4.261e6 Msun)." },
  { id: 'hulse-taylor', name: 'Hulse-Taylor PSR B1913+16',
    nameEs: "Hulse-Taylor PSR B1913+16", centralId: 'psr-b1913', aM: htA, e: 0.6171340, periodS: 0.322997448918 * 86400,
    observed: { quantity: 'Periastron advance',
    quantityEs: "Avance del periastro", value: 4.226585, unit: 'deg/yr', uncertainty: 0.000004,
      source: { label: 'Weisberg & Huang 2016, ApJ 829, 55 Table 1: omega-dot = 4.226585(4) deg/yr, e = 0.6171340(4), Pb = 0.322997448918(3) d', url: 'https://arxiv.org/abs/1606.02744' } },
    note: 'Periastron advances about 4.2 degrees per year, about 35,000 times Mercury. a comes from Kepler\'s third law with the total mass.',
    noteEs: "El periastro avanza unos 4.2 grados por año, unas 35,000 veces más que Mercurio. a sale de la tercera ley de Kepler con la masa total.",
    caveat: 'Two comparable masses: the test-particle formula is only valid with the TOTAL mass, and then it matches the 1PN two-body result.',
    caveatEs: "Dos masas comparables: la fórmula de partícula de prueba solo es válida con la masa TOTAL, y entonces coincide con el resultado posnewtoniano de primer orden para dos cuerpos." },
  { id: 'gps', name: 'GPS satellite',
    nameEs: "Satélite GPS", centralId: 'earth', aM: gpsA, e: 0, periodS: kepler(gpsA, 3.986004418e14),
    observed: { quantity: 'Net clock offset vs ground (+45.7 gravitational, -7.2 velocity)',
    quantityEs: "Desfase neto del reloj respecto al suelo (+45.7 gravitacional, -7.2 velocidad)", value: 38.6, unit: 'us/day',
      source: { label: 'Net: Ashby (arXiv/AAPT version "Relativistic Effects in the Global Positioning System", Eq. 34): constant fractional rate offset 4.4647e-10 = 38.6 us/day for a = 26,562 km. The +45.7 / -7.2 split is computed here from GM, geoid potential and a = 26,560 km (gives +45.75, -7.21); the Living Reviews 2003 text itself was not readable', url: 'https://doi.org/10.12942/lrr-2003-1' } },
    note: 'Orbital period about 11.97 h. Without GR corrections, positions would drift by about 10 km per day.',
    noteEs: "Periodo orbital de unas 11.97 h. Sin correcciones relativistas, las posiciones derivarían unos 10 km por día." },
  { id: 'iss', name: 'ISS',
    nameEs: "ISS", centralId: 'earth', aM: 6.78e6, e: 0, periodS: kepler(6.78e6, 3.986004418e14),
    note: 'Small-effect example: low orbit, v about 7.7 km/s, so GR corrections are below a microsecond per day relative to the ground.',
    noteEs: "Ejemplo de efecto pequeño: órbita baja, v de unos 7.7 km/s, así que las correcciones relativistas son inferiores a un microsegundo por día respecto al suelo." },
];

export const LIGHT: LightPreset[] = [
  { id: 'sun-graze', name: 'Ray grazing the Sun',
    nameEs: "Rayo rasante al Sol", centralId: 'sun', impactParameterM: R_SUN,
    observed: { quantity: 'PPN gamma from VLBI deflection (GR: 1)',
    quantityEs: "gamma PPN a partir de la deflexión por VLBI (RG: 1)", value: 0.99984, unit: '', uncertainty: 0.00015,
      source: { label: 'Lambert & Le Poncin-Lafitte 2009, A&A 499, 331 Table 1, 1979-2008 solution: gamma = 0.99984 +/- 0.00015 (abstract: gamma not better than 2e-4; 2011 update not checked)', url: 'https://arxiv.org/abs/0903.1615' } },
    note: 'GR predicts 4GM/(c^2 R) = 1.75 arcsec, twice the Newtonian value. Eddington 1919 first measured it at about this level.',
    noteEs: "La relatividad general predice 4GM/(c^2 R) = 1.75 segundos de arco, el doble del valor newtoniano. Eddington lo midió por primera vez en 1919 con una precisión de ese orden." },
  { id: 'm87-shadow', name: 'M87* shadow',
    nameEs: "Sombra de M87*", centralId: 'm87', impactParameterM: 3 * Math.sqrt(3) * 6.5e9 * GM_SUN / C ** 2,
    observed: { quantity: 'Ring diameter',
    quantityEs: "Diámetro del anillo", value: 42, unit: 'uas', uncertainty: 3, source: EHT_M87 },
    note: 'Critical impact parameter 3√3 GM/c^2. Angular diameter = 2b_c/D, about 40 μas for the adopted M and D.',
    noteEs: "Parámetro de impacto crítico 3√3 GM/c^2. Diámetro angular = 2b_c/D, unos 40 μas para la M y la D adoptadas." },
  { id: 'sgra-shadow', name: 'Sgr A* shadow',
    nameEs: "Sombra de Sgr A*", centralId: 'sgr-a', impactParameterM: 3 * Math.sqrt(3) * 4.297e6 * GM_SUN / C ** 2,
    observed: { quantity: 'Ring diameter',
    quantityEs: "Diámetro del anillo", value: 51.8, unit: 'uas', uncertainty: 2.3, source: EHT_SGR },
    note: 'Schwarzschild prediction is about 53 μas; the EHT ring is 51.8 ± 2.3 μas.',
    noteEs: "La predicción de Schwarzschild es de unos 53 μas; el anillo del EHT mide 51.8 ± 2.3 μas." },
  { id: 'ns-graze', name: 'Ray grazing PSR J0740+6620',
    nameEs: "Rayo rasante a PSR J0740+6620", centralId: 'psr-j0740', impactParameterM: 12.39e3,
    note: 'No observation. Weak-field 4GM/(c^2 b) would be about 1.4 rad, so the weak-field formula fails: a strong-field regime.',
    noteEs: "Sin observación. La fórmula de campo débil 4GM/(c^2 b) daría unos 1.4 rad, así que falla: es un régimen de campo fuerte." },
];

export const massInGeometricUnits = (gm: number) => gm / C ** 2;
export const bodyById = (id: string) => BODIES.find((b) => b.id === id);
