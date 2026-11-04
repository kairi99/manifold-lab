import { describe, expect, it } from 'vitest';
import katex from 'katex';
import * as C from './curves.content';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);
const all = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(all) : []);

describe('curves content', () => {
  it('every formula renders strictly and ES mirrors EN math', () => {
    for (const k of ['TOUR', 'THEORY', 'TASKS'] as const) {
      const en = all(C[`CURVES_${k}`]), es = all(C[`CURVES_${k}_ES`]);
      for (const s of [...en, ...es]) for (const m of math(s)) expect(() => katex.renderToString(m, { throwOnError: true, strict: 'error' }), m).not.toThrow();
      expect(es.flatMap(math).sort(), k).toEqual(en.flatMap(math).sort());
    }
    expect(C.CURVES_TOUR_ES.map((s) => s.target)).toEqual(C.CURVES_TOUR.map((s) => s.target));
  });
});
