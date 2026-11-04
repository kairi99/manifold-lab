import { describe, expect, it } from 'vitest';
import { DERIVATIONS } from './derivationData';
import { SURFACES } from '../math';

const pts: [number, number][] = [[0.4, 0.3], [1.2, 2.5], [-0.7, 0.9], [2.0, -1.1]];

describe('printed Christoffel formulas match surface.christoffel', () => {
  for (const id of Object.keys(DERIVATIONS)) {
    it(id, () => {
      const s = SURFACES[id];
      for (const [a, b] of pts) {
        // stay inside each chart's domain
        const u = Math.min(Math.max(a, s.domain.u[0] + 0.05), s.domain.u[1] - 0.05);
        const v = Math.min(Math.max(b, s.domain.v[0] + 0.05), s.domain.v[1] - 0.05);
        const want = s.christoffel(u, v), got = DERIVATIONS[id].gamma(u, v);
        for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(got[k][i][j]).toBeCloseTo(want[k][i][j], 12);
      }
    });
  }
});
