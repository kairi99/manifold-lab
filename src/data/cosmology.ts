// Sourced cosmological parameters and objects. `verified` = number checked against the primary paper
// text/abstract in this session; false = recalled from memory, check before quoting.
import type { Source } from './celestial';
import type { CosmoParams } from '../math/cosmology';

export interface CosmoSet { id: string; name: string; nameEs?: string; params: CosmoParams; note: string; noteEs?: string; sources: Source[] }
export interface CosmoObject {
  id: string; name: string; kind: 'epoch' | 'galaxy' | 'quasar' | 'supernova' | 'cluster' | 'gw';
  z: number; zErr?: number; note: string; sources: Source[]; verified: boolean;
  nameEs?: string; noteEs?: string;
}

const PLANCK18: Source = { label: 'Planck Collab. 2018 VI, A&A 641, A6, Table 2', url: 'https://arxiv.org/abs/1807.06209' };

/** Radiation: photons (T0 = 2.7255 K, Ogamma h^2 = 2.4728e-5) x (1 + 0.2271 Neff), Neff = 3.046, massless-neutrino
 *  approximation. h = 0.6766 -> Or = 9.13e-5. Planck's Om (0.3111) already includes one 0.06 eV neutrino, so we keep
 *  Om and set OL = 1 - Om - Or (exactly flat) instead of Planck's 0.6889. */
const OR_PLANCK = (2.4728e-5 * (1 + 0.2271 * 3.046)) / 0.6766 ** 2;

export const PLANCK_2018: CosmoSet = {
  id: 'planck2018', name: 'Planck 2018 base LCDM (TT,TE,EE+lowE+lensing+BAO)', nameEs: 'Planck 2018 LCDM base (TT,TE,EE+lowE+lensing+BAO)',
  params: { H0: 67.66, Om: 0.3111, Or: OR_PLANCK, OL: 1 - 0.3111 - OR_PLANCK },
  note: 'H0 = 67.66 +/- 0.42, Om = 0.3111 +/- 0.0056, age 13.787 +/- 0.020 Gyr (last column of Table 2). Radiation added by us, see source comment.',
  noteEs: 'H0 = 67.66 ± 0.42, Om = 0.3111 ± 0.0056, edad 13.787 ± 0.020 Gyr (última columna de la Tabla 2). La radiación la añadimos nosotros; ver el comentario del código.',
  sources: [PLANCK18],
};
export const EDS: CosmoSet = {
  id: 'eds', name: 'Einstein-de Sitter (toy, no dark energy)', nameEs: 'Einstein-de Sitter (de juguete, sin energía oscura)',
  params: { H0: 67.66, Om: 1, Or: 0, OL: 0 },
  note: 'Flat matter-only universe: age = 2/(3 H0) = 9.63 Gyr, younger than the oldest stars. Teaching contrast; not a fit to data.',
  noteEs: 'Universo plano solo con materia: edad = 2/(3 H0) = 9.63 Gyr, más joven que las estrellas más viejas. Contraste didáctico; no es un ajuste a los datos.',
  sources: [],
};
export const COSMO_SETS: CosmoSet[] = [PLANCK_2018, EDS];

const GWSIREN: Source = { label: 'Abbott et al. 2017, Nature 551, 85', url: 'https://arxiv.org/abs/1710.05835' };
export const H0_STANDARD_SIREN = { value: 70, plus: 12, minus: 8, unit: 'km/s/Mpc', source: GWSIREN, verified: true };

export const COSMO_OBJECTS: CosmoObject[] = [
  { id: 'cmb', name: 'CMB last scattering', nameEs: 'Última dispersión del CMB', kind: 'epoch', z: 1089.80, zErr: 0.21, verified: true,
    noteEs: 'z_* de la columna TT,TE,EE+lowE+lensing+BAO (solo TT,TE,EE+lowE: 1089.92 ± 0.25).',
    note: 'z_* from the TT,TE,EE+lowE+lensing+BAO column (TT,TE,EE+lowE alone: 1089.92 +/- 0.25).', sources: [PLANCK18] },
  { id: 'reion', name: 'Reionisation (instantaneous-equivalent)', nameEs: 'Reionización (equivalente instantáneo)', kind: 'epoch', z: 7.67, zErr: 0.73, verified: true,
    noteEs: 'z_re de TT,TE,EE+lowE (Tabla 2, columna Plik). No se leyó el valor de la columna +BAO.',
    note: 'z_re from TT,TE,EE+lowE (Table 2, Plik column). Value for the +BAO column not read.', sources: [PLANCK18] },
  { id: 'jades-gs-z14-0', name: 'JADES-GS-z14-0', kind: 'galaxy', z: 14.32, zErr: 0.1, verified: true,
    noteEs: 'El resumen da z = 14.32 (+0.08/−0.20); el texto del resumen no dice cuál de las dos galaxias es, pero 14.32 es la más alta. zErr es una estimación simetrizada.',
    note: 'Abstract gives z = 14.32 (+0.08/-0.20); the abstract text does not name which of the two galaxies it is, but 14.32 is the higher one. zErr is a symmetrised guess.',
    sources: [{ label: 'Carniani et al. 2024, Nature 633, 318', url: 'https://arxiv.org/abs/2405.18485' }] },
  { id: 'gn-z11', name: 'GN-z11', kind: 'galaxy', z: 10.603, verified: true,
    noteEs: 'Desplazamiento al rojo espectroscópico de JADES NIRSpec (el título del resumen cita z = 10.60).',
    note: 'JADES NIRSpec spectroscopic redshift (abstract title quotes z = 10.60).',
    sources: [{ label: 'Bunker et al. 2023, A&A 677, A88', url: 'https://arxiv.org/abs/2302.07256' }] },
  { id: '3c273', name: 'Quasar 3C 273', nameEs: 'Cuásar 3C 273', kind: 'quasar', z: 0.158339, verified: true,
    noteEs: 'Desplazamiento al rojo heliocéntrico de NED z = 0.158339 (cz = 47469 km/s), comprobado con NED; Schmidt (1963) dio por primera vez z = 0.158.',
    note: 'NED heliocentric redshift z = 0.158339 (cz = 47469 km/s), checked against NED; Schmidt (1963) first reported z = 0.158.',
    sources: [{ label: 'NED: 3C 273', url: 'https://ned.ipac.caltech.edu/byname?objname=3C+273' }, { label: 'Schmidt 1963, Nature 197, 1040', url: 'https://doi.org/10.1038/1971040a0' }] },
  { id: 'ngc4993', name: 'NGC 4993 (GW170817 host)', nameEs: 'NGC 4993 (anfitriona de GW170817)', kind: 'gw', z: 0.009877, verified: true,
    noteEs: 'Velocidad local del flujo de Hubble v_H = 3017 ± 166 km/s (z ~ 0.010) tras corregir la velocidad peculiar de la velocidad del grupo, 3327 km/s. H0 por sirena estándar = 70 +12/−8 km/s/Mpc. z = 0.009877 es el valor heliocéntrico de NED (cz = 2961 km/s), comprobado con NED.',
    note: 'Local Hubble-flow velocity v_H = 3017 +/- 166 km/s (z ~ 0.010) after peculiar-velocity correction of the group velocity 3327 km/s. Standard-siren H0 = 70 +12/-8 km/s/Mpc. z = 0.009877 is the NED heliocentric value (cz = 2961 km/s), checked against NED.',
    sources: [GWSIREN, { label: 'NED: NGC 4993', url: 'https://ned.ipac.caltech.edu/byname?objname=NGC+4993' }] },
  { id: 'sn-perlmutter99', name: 'SN Ia sample, Supernova Cosmology Project', nameEs: 'Muestra de SN Ia, Supernova Cosmology Project', kind: 'supernova', z: 0.83, verified: true,
    noteEs: 'No es una sola SN: 42 SNe Ia con 0.18 ≤ z ≤ 0.83 (resumen); z = 0.83 es el extremo superior. La SN 1997ff individual (z ~ 1.7, Riess et al. 2001) no está verificada.',
    note: 'Not a single SN: 42 SNe Ia at 0.18 <= z <= 0.83 (abstract); z = 0.83 is the top of the range. Individual SN 1997ff (z ~ 1.7, Riess et al. 2001) not verified.',
    sources: [{ label: 'Perlmutter et al. 1999, ApJ 517, 565', url: 'https://arxiv.org/abs/astro-ph/9812133' }] },
  { id: 'm87', name: 'Virgo cluster / M87', nameEs: 'Cúmulo de Virgo / M87', kind: 'cluster', z: 0.004283, verified: true,
    noteEs: 'Desplazamiento al rojo heliocéntrico de M87 en NED z = 0.004283 (cz = 1284 km/s), comprobado con NED. Domina la velocidad peculiar, así que z da una mala distancia.',
    note: 'NED heliocentric redshift of M87 z = 0.004283 (cz = 1284 km/s), checked against NED. Peculiar velocity dominates, so z gives a poor distance.',
    sources: [{ label: 'NED: Messier 87', url: 'https://ned.ipac.caltech.edu/byname?objname=Messier+87' }] },
];
