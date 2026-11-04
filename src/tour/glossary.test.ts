import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { GLOSSARY } from './glossary';
import { THEORY, THEORY_ES } from './theory';
import { TOURS, TOURS_ES } from './steps';
import { TASKS, TASKS_ES } from './tasks';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);
const ids = new Set(GLOSSARY.map((g) => g.id));

describe('glossary', () => {
  it('has unique ids, both languages, ~30 terms', () => {
    expect(ids.size).toBe(GLOSSARY.length);
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(30);
    for (const g of GLOSSARY) for (const k of ['term', 'termEs', 'def', 'defEs', 'module'] as const) expect(g[k], `${g.id}.${k}`).toBeTruthy();
  });
  it('every definition renders in strict KaTeX and EN/ES math agree', () => {
    for (const g of GLOSSARY) {
      expect(math(g.defEs).sort(), g.id).toEqual(math(g.def).sort());
      for (const m of [...math(g.def), ...math(g.defEs)]) expect(() => katex.renderToString(m, { throwOnError: true, strict: 'error' }), `${g.id}: ${m}`).not.toThrow();
    }
  });
  it('every [[id]] used in text exists', () => {
    const texts = [
      ...[...Object.values(THEORY), ...Object.values(THEORY_ES)].flatMap((t) => [t.motivation, ...t.sections.map((s) => s.body)]),
      ...[...Object.values(TOURS), ...Object.values(TOURS_ES)].flat().map((s) => s.body),
      ...[...TASKS, ...TASKS_ES].flatMap((t) => [t.prompt, t.hint, t.answer, t.predict?.label ?? '', t.predict?.labelEs ?? '']),
    ];
    let n = 0;
    for (const s of texts) for (const m of s.matchAll(/\[\[([\w-]+)(?:\|[^\]]*)?\]\]/g)) { n++; expect(ids.has(m[1]), `unknown term ${m[1]}`).toBe(true); }
    expect(n).toBeGreaterThan(40);
  });
});
