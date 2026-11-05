import { describe, expect, it } from 'vitest';
import katex from 'katex';
import * as C from './content';
import { CARDS, KINDS } from './status/data';
import { GLOSSARY } from '../tour/glossary';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);
const all = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(all) : []);
const strict = (m: string) => expect(() => katex.renderToString(m, { throwOnError: true, strict: 'error' }), m).not.toThrow();

describe('limits content', () => {
  it('every formula renders strictly and ES mirrors EN math', () => {
    for (const k of ['TOUR', 'THEORY', 'TASKS'] as const) {
      const en = all(C[`LIMITS_${k}`]), es = all(C[`LIMITS_${k}_ES`]);
      for (const s of [...en, ...es]) for (const m of math(s)) strict(m);
      expect(es.flatMap(math).sort(), k).toEqual(en.flatMap(math).sort());
    }
    expect(C.LIMITS_TOUR_ES.map((s) => s.target)).toEqual(C.LIMITS_TOUR.map((s) => s.target));
    for (const s of C.LIMITS_TOUR) expect([null, 'canvas', 'views', 'panel', 'theory', 'nav']).toContain(s.target);
    expect(C.LIMITS_TASKS_ES.map((t) => t.id)).toEqual(C.LIMITS_TASKS.map((t) => t.id));
    expect(C.LIMITS_TASKS.length).toBeGreaterThanOrEqual(5);
    for (const t of C.LIMITS_TASKS) expect(t.id.startsWith('lim-') && t.module === 'limits' && !t.check).toBe(true);
    expect(C.LIMITS_THEORY.sections.length).toBe(C.LIMITS_THEORY_ES.sections.length);
    expect(C.LIMITS_THEORY.sections.length).toBeGreaterThanOrEqual(4);
  });
  it('glossary links point to existing terms', () => {
    const ids = new Set(GLOSSARY.map((g) => g.id));
    for (const s of [...all(C.LIMITS_THEORY), ...all(C.LIMITS_THEORY_ES), ...all(C.LIMITS_TOUR), ...all(C.LIMITS_TASKS)])
      for (const m of s.matchAll(/\[\[([^|\]]+)/g)) expect(ids.has(m[1]), m[1]).toBe(true);
  });
});

describe('status cards', () => {
  it('ids unique, sources https, checked date, formulas render and ES mirrors EN', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const k of KINDS) expect(CARDS.some((c) => c.kind === k), k).toBe(true);
    for (const c of CARDS) {
      expect(c.sources.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.sources.length, c.id).toBeLessThanOrEqual(3);
      for (const s of c.sources) expect(s.url.startsWith('https://'), s.url).toBe(true);
      expect(c.checked, c.id).toBe('2026-11');
      const en = all(c.en), es = all(c.es);
      expect(en.length).toBe(es.length);
      for (const s of [...en, ...es]) {
        expect(s.split('$').length % 2, `unbalanced $ in ${c.id}`).toBe(1);
        for (const m of math(s)) strict(m);
      }
      expect(es.flatMap(math).sort(), c.id).toEqual(en.flatMap(math).sort());
    }
  });
});
