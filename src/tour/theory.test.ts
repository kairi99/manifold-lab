import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { THEORY, THEORY_ES } from './theory';
import { TOURS } from './steps';
import { TASKS } from './tasks';
import { richRuns } from '../panels/Tex';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);

describe('theory text', () => {
  for (const [id, t] of [...Object.entries(THEORY), ...Object.entries(THEORY_ES).map(([k, v]) => [`${k} (es)`, v] as const)]) {
    it(`${id}: every formula renders, ≥3 sections, ≥2 refs`, () => {
      expect(t.sections.length).toBeGreaterThanOrEqual(3);
      expect(t.refs.length).toBeGreaterThanOrEqual(2);
      for (const s of [t.motivation, ...t.sections.map((x) => x.body)]) {
        expect(s.split('$').length % 2, `unbalanced $ in ${id}`).toBe(1);
        for (const m of math(s)) expect(() => katex.renderToString(m, { throwOnError: true }), m).not.toThrow();
      }
    });
  }
  it('THEORY_ES mirrors THEORY: sections and math', () => {
    for (const [id, t] of Object.entries(THEORY)) {
      const e = THEORY_ES[id as keyof typeof THEORY_ES];
      expect(e.sections.length, id).toBe(t.sections.length);
      expect(e.refs.length, id).toBe(t.refs.length);
      const all = (x: typeof t) => [x.motivation, ...x.sections.map((s) => s.body)].flatMap(math).sort();
      expect(all(e), id).toEqual(all(t));
    }
  });
  it('guides and tasks: every formula renders', () => {
    const texts = [...Object.values(TOURS).flat().map((s) => s.body), ...JSON.stringify(TASKS).split('"')];
    for (const s of texts) for (const m of math(s.replace(/\\\\/g, '\\'))) expect(() => katex.renderToString(m, { throwOnError: true }), m).not.toThrow();
  });
});

describe('richRuns', () => {
  it('splits sub/superscripts, braces group, leaves plain text alone', () => {
    expect(richRuns('E_{ISCO} = 1')).toEqual([{ t: 'E', k: '' }, { t: 'ISCO', k: 'sub' }, { t: ' = 1', k: '' }]);
    expect(richRuns('gh/c^2 = 2')).toEqual([{ t: 'gh/c', k: '' }, { t: '2', k: 'sup' }, { t: ' = 2', k: '' }]);
    expect(richRuns('no markup here')).toEqual([{ t: 'no markup here', k: '' }]);
    expect(richRuns('snake _case')).toEqual([{ t: 'snake _case', k: '' }]);
  });
});
