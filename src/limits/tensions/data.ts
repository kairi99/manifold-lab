// Cosmological measurements behind the "tensions" view. Every number was read in the cited abstract/paper text
// (arXiv abstract via the arXiv API / page fetch, 2026-11) unless `derived` says otherwise. `checked` = month verified.
export interface Source { label: string; url: string }
const arx = (id: string, label: string): Source => ({ label, url: `https://arxiv.org/abs/${id}` });

export interface H0Meas {
  id: string; group: 'early' | 'late'; name: string; nameEs: string; short: string;
  value: number; plus: number; minus: number; year: number; dataset: string; datasetEs: string;
  derived?: string; source: Source; checked: '2026-11';
}
export const H0_MEAS: H0Meas[] = [
  { id: 'planck', group: 'early', name: 'Planck 2018 CMB', nameEs: 'CMB Planck 2018', short: 'Planck', value: 67.36, plus: 0.54, minus: 0.54, year: 2018,
    dataset: 'TT,TE,EE+lowE+lensing, flat ΛCDM', datasetEs: 'TT,TE,EE+lowE+lensing, ΛCDM plano', source: arx('1807.06209', 'Planck Collab. 2018 VI, Table 2'), checked: '2026-11' },
  { id: 'act', group: 'early', name: 'ACT DR6 + Planck + lensing + DESI BAO', nameEs: 'ACT DR6 + Planck + lentes + BAO de DESI', short: 'P-ACT', value: 68.22, plus: 0.36, minus: 0.36, year: 2025,
    dataset: 'P-ACT-LB (abstract: with DESI DR1 BAO)', datasetEs: 'P-ACT-LB (resumen: con BAO de DESI DR1)', source: arx('2503.14452', 'Louis et al. 2025 (ACT DR6 parameters)'), checked: '2026-11' },
  { id: 'spt', group: 'early', name: 'SPT-3G D1 alone', nameEs: 'SPT-3G D1 solo', short: 'SPT-3G', value: 66.66, plus: 0.60, minus: 0.60, year: 2025,
    dataset: 'SPT-3G CMB, ΛCDM', datasetEs: 'CMB de SPT-3G, ΛCDM', source: arx('2506.20707', 'SPT-3G D1, Camphuis et al. 2025'), checked: '2026-11' },
  { id: 'spa', group: 'early', name: 'CMB-SPA (SPT+ACT+Planck)', nameEs: 'CMB-SPA (SPT+ACT+Planck)', short: 'CMB-SPA', value: 67.19, plus: 0.38, minus: 0.38, year: 2025,
    dataset: 'combined SPT-3G + ACT + Planck', datasetEs: 'SPT-3G + ACT + Planck combinados', source: arx('2506.20707', 'SPT-3G D1, Camphuis et al. 2025'), checked: '2026-11' },
  { id: 'desi', group: 'early', name: 'DESI DR2 BAO + BBN + θ*', nameEs: 'BAO de DESI DR2 + BBN + θ*', short: 'DESI+BBN', value: 68.45, plus: 0.47, minus: 0.47, year: 2025,
    dataset: 'inverse distance ladder, flat ΛCDM', datasetEs: 'escalera de distancias inversa, ΛCDM plano', source: arx('2503.14738', 'DESI Collab. 2025 (DR2 BAO)'), checked: '2026-11' },
  { id: 'h0dn', group: 'late', name: 'H0DN Local Distance Network (baseline)', nameEs: 'Red local de distancias H0DN (base)', short: 'H0DN', value: 73.50, plus: 0.81, minus: 0.81, year: 2025,
    dataset: 'covariance-weighted network of distance indicators', datasetEs: 'red de indicadores de distancia con covarianza', source: arx('2510.23823', 'H0DN Collab. 2025, The Local Distance Network'), checked: '2026-11' },
  { id: 'shoes', group: 'late', name: 'SH0ES Cepheids + SNe Ia (HST)', nameEs: 'SH0ES Cefeidas + SNe Ia (HST)', short: 'SH0ES', value: 73.30, plus: 1.04, minus: 1.04, year: 2022,
    dataset: 'Cepheid ladder, with high-z SNe and q0 fitted', datasetEs: 'escalera de cefeidas, con SNe de z alto y q0 ajustado', source: arx('2112.04510', 'Riess et al. 2022, ApJL 934, L7'), checked: '2026-11' },
  { id: 'cchp', group: 'late', name: 'CCHP TRGB (HST+JWST)', nameEs: 'CCHP TRGB (HST+JWST)', short: 'CCHP', value: 70.39, plus: 1.91, minus: 1.91, year: 2025,
    dataset: 'tip of the red giant branch, 24 SN Ia calibrators', datasetEs: 'punta de la rama de gigantes rojas, 24 calibradoras SN Ia',
    derived: 'paper gives ±1.22 (stat) ±1.33 (sys) ±0.70 (SN); we add them in quadrature: 1.91', source: arx('2408.06153', 'Freedman et al. 2025 (CCHP)'), checked: '2026-11' },
  { id: 'tdcosmo', group: 'late', name: 'TDCOSMO 2025 lens time delays', nameEs: 'TDCOSMO 2025 retrasos de lentes', short: 'TDCOSMO', value: 71.6, plus: 3.9, minus: 3.3, year: 2025,
    dataset: '8 lensed quasars + Pantheon+ Ωm prior', datasetEs: '8 cuásares lenteados + a priori de Ωm de Pantheon+', source: arx('2506.03023', 'TDCOSMO 2025, A&A 704, A63'), checked: '2026-11' },
  { id: 'maser', group: 'late', name: 'Megamaser Cosmology Project', nameEs: 'Megamaser Cosmology Project', short: 'Masers', value: 73.9, plus: 3.0, minus: 3.0, year: 2020,
    dataset: '6 maser galaxies, fixed 250 km/s peculiar-velocity error', datasetEs: '6 galaxias con máseres, error de velocidad peculiar fijo de 250 km/s', source: arx('2001.09213', 'Pesce et al. 2020, ApJL 891, L1'), checked: '2026-11' },
  { id: 'gwtc4', group: 'late', name: 'GWTC-4.0 sirens (+GW170817)', nameEs: 'Sirenas GWTC-4.0 (+GW170817)', short: 'GWTC-4', value: 75.4, plus: 12.8, minus: 9.1, year: 2025,
    dataset: 'dark + bright sirens with GLADE+', datasetEs: 'sirenas oscuras + brillantes con GLADE+', source: arx('2509.04348', 'LVK 2025, GWTC-4.0 cosmic expansion'), checked: '2026-11' },
  { id: 'gw170817', group: 'late', name: 'GW170817 bright siren', nameEs: 'Sirena brillante GW170817', short: 'GW170817', value: 70, plus: 12, minus: 8, year: 2017,
    dataset: 'one neutron-star merger with a counterpart', datasetEs: 'una fusión de estrellas de neutrones con contrapartida', source: arx('1710.05835', 'Abbott et al. 2017, Nature 551, 85'), checked: '2026-11' },
];

export interface S8Meas {
  id: string; group: 'cmb' | 'lensing'; name: string; nameEs: string; short: string;
  value: number; plus: number; minus: number; year: number; dataset: string; datasetEs: string; source: Source; checked: '2026-11';
}
export const S8_MEAS: S8Meas[] = [
  { id: 'planck', group: 'cmb', name: 'Planck 2018 CMB', nameEs: 'CMB Planck 2018', short: 'Planck', value: 0.832, plus: 0.013, minus: 0.013, year: 2018,
    dataset: 'TT,TE,EE+lowE+lensing', datasetEs: 'TT,TE,EE+lowE+lensing', source: arx('1807.06209', 'Planck Collab. 2018 VI'), checked: '2026-11' },
  { id: 'kids1000', group: 'lensing', name: 'KiDS-1000 3×2pt', nameEs: 'KiDS-1000 3×2pt', short: 'KiDS-1000', value: 0.766, plus: 0.020, minus: 0.014, year: 2021,
    dataset: 'cosmic shear + galaxy clustering + galaxy-galaxy lensing', datasetEs: 'cizalla cósmica + agrupamiento + lentes galaxia-galaxia', source: arx('2007.15632', 'Heymans et al. 2021'), checked: '2026-11' },
  { id: 'hsc', group: 'lensing', name: 'HSC Y3 cosmic shear (power spectra)', nameEs: 'HSC Y3 cizalla cósmica (espectros)', short: 'HSC Y3', value: 0.769, plus: 0.031, minus: 0.034, year: 2023,
    dataset: 'cosmic shear power spectra', datasetEs: 'espectros de potencia de la cizalla', source: arx('2304.00702', 'Li et al. 2023 (HSC Y3)'), checked: '2026-11' },
  { id: 'kidsleg', group: 'lensing', name: 'KiDS-Legacy cosmic shear', nameEs: 'KiDS-Legacy cizalla cósmica', short: 'KiDS-Leg.', value: 0.815, plus: 0.016, minus: 0.021, year: 2025,
    dataset: 'final KiDS footprint, 1347 deg²', datasetEs: 'huella final de KiDS, 1347 deg²', source: arx('2503.19441', 'Wright et al. 2025 (KiDS-Legacy)'), checked: '2026-11' },
  { id: 'desy6', group: 'lensing', name: 'DES Y6 3×2pt', nameEs: 'DES Y6 3×2pt', short: 'DES Y6', value: 0.789, plus: 0.012, minus: 0.012, year: 2026,
    dataset: 'cosmic shear + clustering + galaxy-galaxy lensing, flat ΛCDM', datasetEs: 'cizalla + agrupamiento + lentes galaxia-galaxia, ΛCDM plano', source: arx('2601.14559', 'DES Collab. 2026 (Y6 3×2pt)'), checked: '2026-11' },
];

export interface DEMeas {
  id: string; name: string; nameEs: string; short: string; w0: number; w0p: number; w0m: number; wa: number; wap: number; wam: number;
  sigma: number; year: number; source: Source; checked: '2026-11';
}
const DESI: Source = arx('2503.14738', 'DESI Collab. 2025 (DR2 BAO), w0waCDM tables');
export const DE_MEAS: DEMeas[] = [
  { id: 'cmb', name: 'DESI DR2 + CMB', nameEs: 'DESI DR2 + CMB', short: 'D+CMB', w0: -0.42, w0p: 0.21, w0m: 0.21, wa: -1.75, wap: 0.58, wam: 0.58, sigma: 3.1, year: 2025, source: DESI, checked: '2026-11' },
  { id: 'pan', name: 'DESI DR2 + CMB + Pantheon+', nameEs: 'DESI DR2 + CMB + Pantheon+', short: 'D+CMB+Pan+', w0: -0.838, w0p: 0.055, w0m: 0.055, wa: -0.62, wap: 0.22, wam: 0.19, sigma: 2.8, year: 2025, source: DESI, checked: '2026-11' },
  { id: 'un3', name: 'DESI DR2 + CMB + Union3', nameEs: 'DESI DR2 + CMB + Union3', short: 'D+CMB+Un3', w0: -0.667, w0p: 0.088, w0m: 0.088, wa: -1.09, wap: 0.31, wam: 0.27, sigma: 3.8, year: 2025, source: DESI, checked: '2026-11' },
  { id: 'des5', name: 'DESI DR2 + CMB + DESY5', nameEs: 'DESI DR2 + CMB + DESY5', short: 'D+CMB+DES5', w0: -0.752, w0p: 0.057, w0m: 0.057, wa: -0.86, wap: 0.23, wam: 0.20, sigma: 4.2, year: 2025, source: DESI, checked: '2026-11' },
  { id: 'dov', name: 'DESI DR2 + CMB + DES-Dovekie (recalibrated)', nameEs: 'DESI DR2 + CMB + DES-Dovekie (recalibrado)', short: 'Dovekie', w0: -0.803, w0p: 0.054, w0m: 0.054, wa: -0.72, wap: 0.21, wam: 0.21, sigma: 3.2, year: 2025,
    source: arx('2511.07517', 'Popovic et al. 2025/26 (DES-Dovekie reanalysis)'), checked: '2026-11' },
];

/** Planck 2018 TT,TE,EE+lowE+lensing matter density, used for the ΛCDM ages. */
export const OM_PLANCK = { value: 0.3153, err: 0.0073, source: arx('1807.06209', 'Planck Collab. 2018 VI, Table 2') };
export const PLANCK_AGE_GYR = { value: 13.797, err: 0.023, source: OM_PLANCK.source };
