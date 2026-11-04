// Sourced constants and objects for the GR teaching module. See each entry's `sources`.
// Items marked "not re-verified" were recalled from the cited paper, not fetched in this session.
export const G = 6.67430e-11;           // CODATA 2018, m^3 kg^-1 s^-2
export const C = 299792458;              // m/s exact
export const GM_SUN = 1.3271244e20;      // IAU 2015 Resolution B3 nominal, m^3 s^-2
export const M_SUN = GM_SUN / G;         // kg
export const AU = 1.495978707e11;        // m exact (IAU 2012)
export const PC = 3.0856775814913673e16; // m (648000/pi AU)
export const YEAR = 365.25 * 86400;      // Julian year, s

export interface Source { label: string; url?: string }
export interface CelestialBody {
  id: string; name: string;
  kind: 'star' | 'planet' | 'white dwarf' | 'neutron star' | 'black hole';
  gm: number; radiusM: number | null; distanceM?: number;
  note: string; sources: Source[];
}
export interface OrbitPreset {
  id: string; name: string; centralId: string;
  aM: number; e: number; periodS: number;
  observed?: { quantity: string; value: number; unit: string; uncertainty?: number; source: Source };
  note: string; caveat?: string;
}
export interface LightPreset {
  id: string; name: string; centralId: string;
  impactParameterM: number;
  observed?: { quantity: string; value: number; unit: string; uncertainty?: number; source: Source };
  note: string;
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
  { id: 'sun', name: 'Sun', kind: 'star', gm: GM_SUN, radiusM: R_SUN, distanceM: AU,
    note: 'Weak field: r_s is only about 3 km, so effects are tiny but measurable (Mercury, light bending, Shapiro delay).',
    sources: [IAU] },
  { id: 'earth', name: 'Earth', kind: 'planet', gm: 3.986004418e14, radiusM: R_EARTH,
    note: 'r_s is under 1 cm. GPS clocks still need GR corrections of tens of microseconds per day.',
    sources: [{ label: 'GM: IAU 2015 B3 / CODATA-era TT value 3.986004418e14; R: IAU 2015 B3 nominal equatorial', url: IAU.url }] },
  { id: 'jupiter', name: 'Jupiter', kind: 'planet', gm: 1.2668653e17, radiusM: 7.1492e7,
    note: 'Most massive planet; r_s about 2.8 m, a useful comparison with the Sun.',
    sources: [{ label: 'IAU 2015 B3 nominal GM_J = 1.2668653e17, R_eq = 7.1492e7 m', url: IAU.url }] },
  { id: 'sirius-b', name: 'Sirius B', kind: 'white dwarf', gm: 1.018 * GM_SUN, radiusM: 0.0084 * R_SUN, distanceM: 2.64 * PC,
    note: 'Earth-sized star with about one solar mass, so GM/(c^2 R) is about 3e-4; gravitational redshift was measured from its spectrum.',
    sources: [{ label: 'Bond et al. 2017, ApJ 840, 70 (1.018 +/- 0.011 Msun, R = 0.0084 Rsun); distance 2.64 pc (Hipparcos). Not re-verified' }] },
  { id: 'psr-j0740', name: 'PSR J0740+6620', kind: 'neutron star', gm: 2.08 * GM_SUN, radiusM: 12.39e3, distanceM: 1.14e3 * PC,
    note: 'Among the most massive known neutron stars; r_s about 6.1 km against R about 12 km, so the surface sits at only about 2 r_s.',
    sources: [FONSECA, RILEY21, MILLER21] },
  { id: 'psr-b1913', name: 'PSR B1913+16 (Hulse-Taylor, total system)', kind: 'neutron star', gm: 2.828 * GM_SUN, radiusM: null,
    note: 'GM is the TOTAL binary mass (1.438 + 1.390 Msun), used for orbital dynamics. The first binary pulsar; its orbital decay confirmed gravitational radiation.',
    sources: [{ label: 'Weisberg & Huang 2016, ApJ 829, 55 (m1 = 1.438(1), m2 = 1.390(1) Msun)', url: 'https://arxiv.org/abs/1606.02744' }] },
  { id: 'sgr-a', name: 'Sagittarius A*', kind: 'black hole', gm: 4.297e6 * GM_SUN, radiusM: null, distanceM: 8277 * PC,
    note: 'Black hole at the Galactic Center; the star S2 orbits it with a measured Schwarzschild precession.',
    sources: [{ ...GRAV22, label: GRAV22.label + ': M = (4.297 +/- 0.012 stat, +/-0.040 sys)e6 Msun, R0 = 8277 +/- 9 stat, +/-30 sys pc (abstract text rounds M to 4.30e6)' }] },
  { id: 'm87', name: 'M87*', kind: 'black hole', gm: 6.5e9 * GM_SUN, radiusM: null, distanceM: 16.8e6 * PC,
    note: 'First black hole imaged by the EHT; its shadow ring is about 42 microarcseconds across.',
    sources: [{ ...EHT_M87, label: EHT_M87.label + ': M = (6.5 +/- 0.7)e9 Msun; D = 16.8 Mpc' }] },
  { id: 'cyg-x1', name: 'Cygnus X-1', kind: 'black hole', gm: 21.2 * GM_SUN, radiusM: null, distanceM: 2.22e3 * PC,
    note: 'First widely accepted stellar-mass black hole candidate, now 21.2 +/- 2.2 Msun at 2.22 kpc.',
    sources: [{ label: 'Miller-Jones et al. 2021, Science 371, 1046 (21.2 +/- 2.2 Msun; D = 2.22 +0.18/-0.17 kpc, distance error bars from a garbled record)', url: 'https://arxiv.org/abs/2102.09091' }] },
  { id: 'gw150914', name: 'GW150914 remnant', kind: 'black hole', gm: 62 * GM_SUN, radiusM: null,
    note: 'Final black hole of the first detected merger; about 3 Msun of energy radiated as gravitational waves in about 0.2 s.',
    sources: [{ label: 'LIGO/Virgo 2016, PRL 116, 241102 (final mass 62 +4/-4 Msun, source frame, 90%)', url: 'https://arxiv.org/abs/1602.03840' }] },
];

const mercuryA = 57.909e9;
const s2a = 0.12495 * 8277 * AU; // arcsec x pc = AU numerically
const htA = Math.cbrt(2.828 * GM_SUN * (0.322997448911 * 86400 / (2 * Math.PI)) ** 2);
const gpsA = 26.56e6;

export const ORBITS: OrbitPreset[] = [
  { id: 'mercury', name: 'Mercury', centralId: 'sun', aM: mercuryA, e: 0.2056, periodS: 87.969 * 86400,
    observed: { quantity: 'GR perihelion advance', value: 42.98, unit: 'arcsec/century', uncertainty: 0.04,
      source: { label: 'Park et al. 2017, AJ 153, 121 (MESSENGER ranging; uncertainty not re-verified); classic 43"/cy: Clemence 1947', url: 'https://dspace.mit.edu/handle/1721.1/109312' } },
    note: 'The classic test: 6 pi GM / (c^2 a (1-e^2)) per orbit gives about 43 arcsec per century.' },
  { id: 's2', name: 'S2 around Sgr A*', centralId: 'sgr-a', aM: s2a, e: 0.88441, periodS: kepler(s2a, 4.297e6 * GM_SUN),
    observed: { quantity: 'Schwarzschild precession factor f_SP (0 Newtonian, 1 GR); about 12 arcmin per orbit', value: 1.10, unit: '', uncertainty: 0.19,
      source: { label: 'GRAVITY Collab. 2020, A&A 636, L5', url: 'https://arxiv.org/abs/2004.07187' } },
    note: 'a = 0.12495" x 8277 pc, about 1034 AU, from the 2022 four-star fit; period follows from Kepler (about 16.0 yr).',
    caveat: 'Orbital elements are the GRAVITY 2022 values (a = 0.12495", e = 0.88441), not the 2020 ones (a = 125.058 mas, e = 0.88466, R0 = 8178 pc, M = 4.261e6 Msun).' },
  { id: 'hulse-taylor', name: 'Hulse-Taylor PSR B1913+16', centralId: 'psr-b1913', aM: htA, e: 0.6171334, periodS: 0.322997448911 * 86400,
    observed: { quantity: 'Periastron advance', value: 4.226598, unit: 'deg/yr', uncertainty: 0.000005,
      source: { label: 'Weisberg & Huang 2016, ApJ 829, 55 (value and error recalled, not re-verified; Wikipedia confirms about 4.2 deg/yr)', url: 'https://arxiv.org/abs/1606.02744' } },
    note: 'Periastron advances about 4.2 degrees per year, about 35,000 times Mercury. a comes from Kepler\'s third law with the total mass.',
    caveat: 'Two comparable masses: the test-particle formula is only valid with the TOTAL mass, and then it matches the 1PN two-body result.' },
  { id: 'gps', name: 'GPS satellite', centralId: 'earth', aM: gpsA, e: 0, periodS: kepler(gpsA, 3.986004418e14),
    observed: { quantity: 'Net clock offset vs ground (+45.7 gravitational, -7.2 velocity)', value: 38.6, unit: 'us/day',
      source: { label: 'Ashby 2003, Living Rev. Relativity 6, 1 (breakdown not re-verified; the two terms sum to 38.5)', url: 'https://doi.org/10.12942/lrr-2003-1' } },
    note: 'Orbital period about 11.97 h. Without GR corrections, positions would drift by about 10 km per day.' },
  { id: 'iss', name: 'ISS', centralId: 'earth', aM: 6.78e6, e: 0, periodS: kepler(6.78e6, 3.986004418e14),
    note: 'Small-effect example: low orbit, v about 7.7 km/s, so GR corrections are below a microsecond per day relative to the ground.' },
];

export const LIGHT: LightPreset[] = [
  { id: 'sun-graze', name: 'Ray grazing the Sun', centralId: 'sun', impactParameterM: R_SUN,
    observed: { quantity: 'PPN gamma from VLBI deflection (GR: 1)', value: 0.99984, unit: '', uncertainty: 0.00015,
      source: { label: 'Lambert & Le Poncin-Lafitte 2009, A&A 499, 331 (value from a review table; the 2011 update was not verified)', url: 'https://arxiv.org/abs/0903.1615' } },
    note: 'GR predicts 4GM/(c^2 R) = 1.75 arcsec, twice the Newtonian value. Eddington 1919 first measured it at about this level.' },
  { id: 'm87-shadow', name: 'M87* shadow', centralId: 'm87', impactParameterM: 3 * Math.sqrt(3) * 6.5e9 * GM_SUN / C ** 2,
    observed: { quantity: 'Ring diameter', value: 42, unit: 'uas', uncertainty: 3, source: EHT_M87 },
    note: 'Critical impact parameter 3 sqrt(3) GM/c^2. Angular diameter = 2 b_c / D, about 40 uas for the adopted M and D.' },
  { id: 'sgra-shadow', name: 'Sgr A* shadow', centralId: 'sgr-a', impactParameterM: 3 * Math.sqrt(3) * 4.297e6 * GM_SUN / C ** 2,
    observed: { quantity: 'Ring diameter', value: 51.8, unit: 'uas', uncertainty: 2.3, source: EHT_SGR },
    note: 'Schwarzschild prediction is about 53 uas; the EHT ring is 51.8 +/- 2.3 uas.' },
  { id: 'ns-graze', name: 'Ray grazing PSR J0740+6620', centralId: 'psr-j0740', impactParameterM: 12.39e3,
    note: 'No observation. Weak-field 4GM/(c^2 b) would be about 1.4 rad, so the weak-field formula fails: a strong-field regime.' },
];

export const massInGeometricUnits = (gm: number) => gm / C ** 2;
export const bodyById = (id: string) => BODIES.find((b) => b.id === id);
