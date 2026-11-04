// Sourced cosmological parameters and objects. `verified` = number checked against the primary paper
// text/abstract in this session; false = recalled from memory, check before quoting.
import type { Source } from './celestial';
import type { CosmoParams } from '../math/cosmology';

export interface CosmoSet { id: string; name: string; params: CosmoParams; note: string; sources: Source[] }
export interface CosmoObject {
  id: string; name: string; kind: 'epoch' | 'galaxy' | 'quasar' | 'supernova' | 'cluster' | 'gw';
  z: number; zErr?: number; note: string; sources: Source[]; verified: boolean;
}

const PLANCK18: Source = { label: 'Planck Collab. 2018 VI, A&A 641, A6, Table 2', url: 'https://arxiv.org/abs/1807.06209' };

/** Radiation: photons (T0 = 2.7255 K, Ogamma h^2 = 2.4728e-5) x (1 + 0.2271 Neff), Neff = 3.046, massless-neutrino
 *  approximation. h = 0.6766 -> Or = 9.13e-5. Planck's Om (0.3111) already includes one 0.06 eV neutrino, so we keep
 *  Om and set OL = 1 - Om - Or (exactly flat) instead of Planck's 0.6889. */
const OR_PLANCK = (2.4728e-5 * (1 + 0.2271 * 3.046)) / 0.6766 ** 2;

export const PLANCK_2018: CosmoSet = {
  id: 'planck2018', name: 'Planck 2018 base LCDM (TT,TE,EE+lowE+lensing+BAO)',
  params: { H0: 67.66, Om: 0.3111, Or: OR_PLANCK, OL: 1 - 0.3111 - OR_PLANCK },
  note: 'H0 = 67.66 +/- 0.42, Om = 0.3111 +/- 0.0056, age 13.787 +/- 0.020 Gyr (last column of Table 2). Radiation added by us, see source comment.',
  sources: [PLANCK18],
};
export const EDS: CosmoSet = {
  id: 'eds', name: 'Einstein-de Sitter (toy, no dark energy)',
  params: { H0: 67.66, Om: 1, Or: 0, OL: 0 },
  note: 'Flat matter-only universe: age = 2/(3 H0) = 9.67 Gyr, younger than the oldest stars. Teaching contrast; not a fit to data.',
  sources: [],
};
export const COSMO_SETS: CosmoSet[] = [PLANCK_2018, EDS];

const GWSIREN: Source = { label: 'Abbott et al. 2017, Nature 551, 85', url: 'https://arxiv.org/abs/1710.05835' };
export const H0_STANDARD_SIREN = { value: 70, plus: 12, minus: 8, unit: 'km/s/Mpc', source: GWSIREN, verified: true };

export const COSMO_OBJECTS: CosmoObject[] = [
  { id: 'cmb', name: 'CMB last scattering', kind: 'epoch', z: 1089.80, zErr: 0.21, verified: true,
    note: 'z_* from the TT,TE,EE+lowE+lensing+BAO column (TT,TE,EE+lowE alone: 1089.92 +/- 0.25).', sources: [PLANCK18] },
  { id: 'reion', name: 'Reionisation (instantaneous-equivalent)', kind: 'epoch', z: 7.67, zErr: 0.73, verified: true,
    note: 'z_re from TT,TE,EE+lowE (Table 2, Plik column). Value for the +BAO column not read.', sources: [PLANCK18] },
  { id: 'jades-gs-z14-0', name: 'JADES-GS-z14-0', kind: 'galaxy', z: 14.32, zErr: 0.1, verified: true,
    note: 'Abstract gives z = 14.32 (+0.08/-0.20); the abstract text does not name which of the two galaxies it is, but 14.32 is the higher one. zErr is a symmetrised guess.',
    sources: [{ label: 'Carniani et al. 2024, Nature 633, 318', url: 'https://arxiv.org/abs/2405.18485' }] },
  { id: 'gn-z11', name: 'GN-z11', kind: 'galaxy', z: 10.603, verified: true,
    note: 'JADES NIRSpec spectroscopic redshift (abstract title quotes z = 10.60).',
    sources: [{ label: 'Bunker et al. 2023, A&A 677, A88', url: 'https://arxiv.org/abs/2302.07256' }] },
  { id: '3c273', name: 'Quasar 3C 273', kind: 'quasar', z: 0.158, verified: false,
    note: 'Textbook value (Schmidt 1963, Nature 197, 1040); not re-fetched this session.',
    sources: [{ label: 'Schmidt 1963, Nature 197, 1040', url: 'https://doi.org/10.1038/1971040a0' }] },
  { id: 'ngc4993', name: 'NGC 4993 (GW170817 host)', kind: 'gw', z: 0.0098, verified: true,
    note: 'Local Hubble-flow velocity v_H = 3017 +/- 166 km/s (z ~ 0.010) after peculiar-velocity correction of the group velocity 3327 km/s. Standard-siren H0 = 70 +12/-8 km/s/Mpc. z = 0.0098 is the catalogue heliocentric value, recalled (unverified).',
    sources: [GWSIREN] },
  { id: 'sn-perlmutter99', name: 'SN Ia sample, Supernova Cosmology Project', kind: 'supernova', z: 0.83, verified: true,
    note: 'Not a single SN: 42 SNe Ia at 0.18 <= z <= 0.83 (abstract); z = 0.83 is the top of the range. Individual SN 1997ff (z ~ 1.7, Riess et al. 2001) not verified.',
    sources: [{ label: 'Perlmutter et al. 1999, ApJ 517, 565', url: 'https://arxiv.org/abs/astro-ph/9812133' }] },
  { id: 'm87', name: 'Virgo cluster / M87', kind: 'cluster', z: 0.0043, verified: false,
    note: 'Recalled catalogue redshift (cz ~ 1280 km/s); not fetched this session. Peculiar velocity dominates, so z gives a poor distance.',
    sources: [] },
];
