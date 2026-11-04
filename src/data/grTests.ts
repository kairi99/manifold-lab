// Classic experimental tests of GR, tied to BODIES via centralId. Radii in metres (suffix M).
// Values were read in the cited primary source unless the source label says otherwise (Pound-Snider, Shapiro radar, Viking, Cassini geometry, GP-B semi-major axis remain unverified).
// GPS clock offset is not duplicated here: see ORBITS id 'gps' in celestial.ts.
import type { Source } from './celestial';
import { AU } from './celestial';

export interface RedshiftTest { id: string; name: string; centralId: string; r1M: number; r2M: number | null /* null = infinity */; observed: { quantity: string; value: number; unit: string; uncertainty?: number; source: Source }; note: string }
export interface ShapiroTest { id: string; name: string; centralId: string; r1M: number; r2M: number; bM: number; observed: { quantity: string; value: number; unit: string; uncertainty?: number; source: Source }; note: string }
export interface FrameDragTest { id: string; name: string; centralId: string; orbitRadiusM: number; observed: { geodetic: { value: number; uncertainty: number; unit: 'mas/yr' }; frameDragging: { value: number; uncertainty: number; unit: 'mas/yr' }; source: Source }; predicted: { geodetic: number; frameDragging: number; unit: 'mas/yr'; source: Source }; note: string }

const R_SUN = 6.957e8; // IAU 2015 B3 nominal
const R_EARTH = 6.3781e6; // IAU 2015 B3 nominal equatorial
const GPB = { label: 'Everitt et al. 2011, PRL 106, 221101 (abstract: geodetic -6,601.8 +/- 18.3, frame dragging -37.2 +/- 7.2, GR -6,606.1 and -39.2 mas/yr; arXiv:1105.3456 full text read)', url: 'https://arxiv.org/abs/1105.3456' };

export const REDSHIFT_TESTS: RedshiftTest[] = [
  { id: 'pound-snider', name: 'Pound-Rebka / Pound-Snider (Harvard tower)', centralId: 'earth', r1M: R_EARTH, r2M: R_EARTH + 22.5,
    observed: { quantity: 'Measured / GR-predicted shift ratio', value: 0.9990, unit: '', uncertainty: 0.0076,
      source: { label: 'Pound & Snider 1965, Phys. Rev. 140, B788. Ratio 0.9990 +/- 0.0076 seen only on a secondary site (physics.it.com); Physics Today says about 1%. Pound-Rebka 1960 alone: (2.57 +/- 0.26)e-15 vs 2.46e-15' } },
    note: 'Gamma rays (Fe-57, 14.4 keV) over the 22.5 m Jefferson tower; predicted fractional shift gh/c^2 = 2.46e-15.' },
  { id: 'gpa', name: 'Gravity Probe A (hydrogen maser rocket, 1976)', centralId: 'earth', r1M: R_EARTH, r2M: R_EARTH + 10.0e6,
    observed: { quantity: 'Agreement with GR, fractional', value: 7e-5, unit: '', uncertainty: 7e-5,
      source: { label: 'Vessot et al. 1980, PRL 45, 2081. NASA NTRS abstract (ntrs.nasa.gov/citations/19810032669): agreement 70e-6, rocket launched nearly vertically to 10,000 km (nominal altitude used here). Full paper not read' } },
    note: 'Maser flew to about 10,000 km altitude on a Scout rocket; Doppler and gravity-clock effects were separated with a two-way link.' },
  { id: 'sirius-b', name: 'Sirius B gravitational redshift', centralId: 'sirius-b', r1M: 0.008098 * R_SUN, r2M: null,
    observed: { quantity: 'Gravitational redshift (velocity equivalent)', value: 80.65, unit: 'km/s', uncertainty: 0.77,
      source: { label: 'Joyce et al. 2018, MNRAS 481, 2361 abstract: 80.65 +/- 0.77 km/s, M = 1.017 +/- 0.025 Msun (arXiv:1809.01240). Older: Barstow et al. 2005 gave 80.42 +/- 4.83 km/s', url: 'https://arxiv.org/abs/1809.01240' } },
    note: 'GM/(R c) with r1 = Sirius B radius (0.008098 Rsun, Bond 2017) and M = 1.018 Msun gives about 80 km/s; the measured value implies M = 1.017 +/- 0.025 Msun.' },
  { id: 'galileo-5-6', name: 'Galileo 5 and 6 (eccentric orbits)', centralId: 'earth', r1M: 27.9776e6 * (1 - 0.162), r2M: 27.9776e6 * (1 + 0.162),
    observed: { quantity: 'Fractional deviation from GR redshift (0 = GR)', value: 0.19e-5, unit: '', uncertainty: 2.48e-5,
      source: { label: 'Delva et al. 2018, PRL 121, 231101 abstract: (+0.19 +/- 2.48)e-5 at 1 sigma, 5.6x better than Gravity Probe A; e = 0.162 and ~8500 km altitude change from the text (arXiv:1812.03711). Semi-major axis a = 27,977.6 km is NOT verified (the paper table was unreadable). Herrmann et al. 2018 (PRL 121, 231102) is the companion, not read', url: 'https://arxiv.org/abs/1812.03711' } },
    note: 'Launch failure left the satellites in elliptical orbits, so the clock-rate modulation over about 8500 km of altitude change tests redshift; improves on Gravity Probe A by about 5.6x.' },
];

export const SHAPIRO_TESTS: ShapiroTest[] = [
  { id: 'shapiro-radar', name: 'Shapiro radar echoes, Venus and Mercury (1960s-70s)', centralId: 'sun', r1M: AU, r2M: 0.723 * AU, bM: R_SUN,
    observed: { quantity: 'Maximum GR excess round-trip delay (rough scale)', value: 200, unit: 'us',
      source: { label: 'Shapiro 1964-1971. About 20% agreement in 1966-67, better than 0.1% later (secondary review). The 200 us scale and the geometry (Venus 0.723 AU, b = 1 Rsun) are approximate; the 1971 paper was not found' } },
    note: 'Radar pings grazing the Sun near superior conjunction.' },
  { id: 'viking', name: 'Viking Mars ranging (1976-77)', centralId: 'sun', r1M: AU, r2M: 1.52 * AU, bM: 1.5 * R_SUN,
    observed: { quantity: 'PPN gamma (GR: 1), taken as 0.1% accuracy', value: 1, unit: '', uncertainty: 0.001,
      source: { label: 'Reasenberg et al. 1979, ApJ 234, L219 (0.1% accuracy of the delay; a review gives |Delta| <= 0.002). The impact parameter 1.5 Rsun and r2 = 1.52 AU are illustrative, not from the paper' } },
    note: 'Round-trip radio delay to landers and orbiters during 14 months, including superior conjunction.' },
  { id: 'cassini', name: 'Cassini solar conjunction (2002)', centralId: 'sun', r1M: AU, r2M: 7.43 * AU, bM: 1.6 * R_SUN,
    observed: { quantity: 'PPN gamma - 1', value: 2.1e-5, unit: '', uncertainty: 2.3e-5,
      source: { label: 'Bertotti, Iess & Tortora 2003, Nature 425, 374 (abstract text, as quoted by search-result mirrors: gamma = 1 + (2.1 +/- 2.3)e-5; the Nature page itself was not fetched; Kopeikin 2009 argues a possible bias of 1.2e-4, not re-checked). Closest approach 1.6 Rsun is consistent with 9 arcmin from the limb. r2 = 7.43 AU is a DERIVED guess from 8.43 AU, which is probably the Earth-spacecraft distance; geometry NOT verified', url: 'https://doi.org/10.1038/nature01997' } },
    note: 'Doppler frequency shift of the Ka-band link measured near 6 June-7 July 2002 conjunction.' },
];

const a = 7027.4e3; // m; GP-B semi-major axis from the Wikipedia infobox (secondary, 7027.4 km); the PRL verifies only the 642 km altitude
export const FRAME_DRAG_TESTS: FrameDragTest[] = [
  { id: 'gpb', name: 'Gravity Probe B', centralId: 'earth', orbitRadiusM: a,
    observed: { geodetic: { value: 6601.8, uncertainty: 18.3, unit: 'mas/yr' }, frameDragging: { value: 37.2, uncertainty: 7.2, unit: 'mas/yr' }, source: GPB },
    predicted: { geodetic: 6606.1, frameDragging: 39.2, unit: 'mas/yr', source: GPB },
    note: 'Polar orbit at 642 km altitude, guide star IM Pegasi; data 28 Aug 2004 - 14 Aug 2005. Orbit radius 7027.4 km is from Wikipedia, not the paper. Uncertainties are 0.28% (geodetic) and 19% (frame dragging) of the GR values (PRL text).' },
];
