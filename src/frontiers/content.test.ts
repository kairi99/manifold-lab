import { describe, expect, it } from 'vitest';
import katex from 'katex';
import * as C from './content';
import { PROBLEMS } from './problems/data';
import { GLOSSARY } from '../tour/glossary';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);
const all = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(all) : []);
const strict = (m: string) => expect(() => katex.renderToString(m, { throwOnError: true, strict: 'error' }), m).not.toThrow();

describe('frontiers content', () => {
  it('every formula renders strictly and ES mirrors EN math', () => {
    for (const k of ['TOUR', 'THEORY', 'TASKS'] as const) {
      const en = all(C[`FRONTIERS_${k}`]), es = all(C[`FRONTIERS_${k}_ES`]);
      for (const s of [...en, ...es]) for (const m of math(s)) strict(m);
      expect(es.flatMap(math).sort(), k).toEqual(en.flatMap(math).sort());
    }
    expect(C.FRONTIERS_TOUR_ES.map((s) => s.target)).toEqual(C.FRONTIERS_TOUR.map((s) => s.target));
    expect(C.FRONTIERS_TASKS_ES.map((t) => t.id)).toEqual(C.FRONTIERS_TASKS.map((t) => t.id));
    for (const t of C.FRONTIERS_TASKS) expect(t.id.startsWith('fr-') && t.module === 'frontiers').toBe(true);
  });
  it('glossary links point to existing terms', () => {
    const ids = new Set(GLOSSARY.map((g) => g.id));
    for (const s of [...all(C.FRONTIERS_THEORY), ...all(C.FRONTIERS_THEORY_ES), ...all(C.FRONTIERS_TOUR), ...all(C.FRONTIERS_TASKS)])
      for (const m of s.matchAll(/\[\[([^|\]]+)/g)) expect(ids.has(m[1]), m[1]).toBe(true);
  });
});

describe('problem cards', () => {
  it('ids unique, sources https, checked date, formulas render and ES mirrors EN', () => {
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(PROBLEMS.length);
    for (const p of PROBLEMS) {
      expect(p.sources.length, p.id).toBeGreaterThanOrEqual(1);
      expect(p.sources.length, p.id).toBeLessThanOrEqual(4);
      for (const s of p.sources) expect(s.url.startsWith('https://'), s.url).toBe(true);
      expect(p.checked, p.id).toMatch(/^\d{4}-\d{2}$/);
      const en = all(p.en), es = all(p.es);
      expect(en.length).toBe(es.length);
      for (const s of [...en, ...es]) {
        expect(s.split('$').length % 2, `unbalanced $ in ${p.id}`).toBe(1);
        for (const m of math(s)) strict(m);
      }
      expect(es.flatMap(math).sort(), p.id).toEqual(en.flatMap(math).sort());
    }
  });
});
