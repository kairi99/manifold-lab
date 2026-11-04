import { describe, expect, it } from 'vitest';
import { makeCustomSurface } from './custom';
import { PRESETS } from './presets';

const pts: [number, number][] = [[0.3, 0.4], [-1.7, 1.1], [2.2, -0.9], [1.2, 0.05]];

describe('isometric bending presets: metric independent of a', () => {
  for (const id of ['bend-cat', 'bend-roll']) {
    const p = PRESETS.find((q) => q.id === id)!;
    it(id, () => {
      const [lo, hi] = p.bend!;
      const at = (a: number) => makeCustomSurface({ ...p.spec, params: { a, b: 0 } });
      const ref = at(lo);
      for (let k = 0; k <= 6; k++) {
        const s = at(lo + ((hi - lo) * k) / 6);
        for (const [u, v] of pts) {
          const g = s.metric(u, v), g0 = ref.metric(u, v);
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(g[i][j]).toBeCloseTo(g0[i][j], 9);
          expect(s.gaussK(u, v)).toBeCloseTo(ref.gaussK(u, v), 8);
        }
      }
      if (id === 'bend-cat') for (const [u, v] of pts) expect(ref.metric(u, v)[0][0]).toBeCloseTo(Math.cosh(v) ** 2, 9);
    });
  }
});
