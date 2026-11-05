import { BODIES, M_SUN, GM_SUN, G } from '../../data/celestial';
import type { Source } from '../../data/celestial';

export const CHECKED = '2026-11';
export type Src = Source & { checked: string };
const s = (label: string, url: string): Src => ({ label, url, checked: CHECKED });

export const SRC = {
  codata: s('CODATA 2018, Tiesinga et al. 2021, Rev. Mod. Phys. 93, 025010', 'https://arxiv.org/abs/2010.03624'),
  hawking75: s('Hawking 1975, Commun. Math. Phys. 43, 199', 'https://doi.org/10.1007/BF02345020'),
  hawking76: s('Hawking 1976, Phys. Rev. D 14, 2460', 'https://doi.org/10.1103/PhysRevD.14.2460'),
  page76: s('Page 1976, Phys. Rev. D 13, 198', 'https://doi.org/10.1103/PhysRevD.13.198'),
  carr21: s('Carr, Kohri, Sendouda & Yokoyama 2021, Rep. Prog. Phys. 84, 116902', 'https://arxiv.org/abs/2002.12778'),
  fixsen: s('Fixsen 2009, ApJ 707, 916 (T_CMB = 2.72548 K)', 'https://arxiv.org/abs/0911.1955'),
  steinhauer: s('Steinhauer 2016, Nature Physics 12, 959', 'https://arxiv.org/abs/1510.00621'),
  planck18: s('Planck Collab. 2018 VI, A&A 641, A6', 'https://arxiv.org/abs/1807.06209'),
  martin: s('Martin 2012, C. R. Physique 13, 566', 'https://arxiv.org/abs/1205.3365'),
  amaterasu: s('Telescope Array 2023, Science 382, 903', 'https://doi.org/10.1126/science.abo5095'),
  pdg: s('Particle Data Group (electroweak scale v = 246 GeV)', 'https://pdg.lbl.gov/'),
  lhc: s('CERN: LHC Run 3, 13.6 TeV collisions', 'https://home.cern/science/accelerators/large-hadron-collider'),
  penrose65: s('Penrose 1965, Phys. Rev. Lett. 14, 57', 'https://doi.org/10.1103/PhysRevLett.14.57'),
  hawkingPenrose: s('Hawking & Penrose 1970, Proc. R. Soc. A 314, 529', 'https://doi.org/10.1098/rspa.1970.0021'),
  goroff: s('Goroff & Sagnotti 1986, Nucl. Phys. B 266, 709', 'https://doi.org/10.1016/0550-3213(86)90193-8'),
  page93: s('Page 1993, Phys. Rev. Lett. 71, 3743', 'https://arxiv.org/abs/hep-th/9306083'),
  penington: s('Penington 2019/2020, JHEP 09 (2020) 002', 'https://arxiv.org/abs/1905.08255'),
  aemm: s('Almheiri, Engelhardt, Marolf & Maxfield 2019, JHEP 12 (2019) 063', 'https://arxiv.org/abs/1905.08762'),
  replica: s('Penington, Shenker, Stanford & Yang 2019; Almheiri et al. 2019 (replica wormholes)', 'https://arxiv.org/abs/1911.12333'),
};

const body = (id: string) => BODIES.find((b) => b.id === id)!;
/** Real black holes marked on the T_H plot; masses come from src/data/celestial.ts. */
export const HOLES = [
  { id: 'stellar', en: '10 M☉ stellar hole', es: 'Agujero estelar de 10 M☉', M: 10 * M_SUN, sources: [] as Src[] },
  { id: 'sgr', en: 'Sgr A*', es: 'Sgr A*', M: body('sgr-a').gm / G, sources: body('sgr-a').sources },
  { id: 'm87', en: 'M87*', es: 'M87*', M: body('m87').gm / G, sources: body('m87').sources },
];

export const SCALES = [
  { id: 'ew', en: 'electroweak scale', es: 'escala electrodébil', eV: 246e9, src: SRC.pdg },
  { id: 'lhc', en: 'LHC 13.6 TeV', es: 'LHC 13,6 TeV', eV: 13.6e12, src: SRC.lhc },
  { id: 'cr', en: 'cosmic ray (Amaterasu)', es: 'rayo cósmico (Amaterasu)', eV: 2.4e20, src: SRC.amaterasu },
];
export { GM_SUN };
