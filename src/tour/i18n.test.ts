import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { TOURS, TOURS_ES } from './steps';
import { TASKS, TASKS_ES } from './tasks';
import { MODULES } from '../state/modules';

const math = (s: string) => [...s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]).sort();
const checkMath = (en: string, es: string, where: string) => {
  const m = math(es);
  expect(m, where).toEqual(math(en));
  for (const x of m) expect(() => katex.renderToString(x, { throwOnError: true }), `${where}: ${x}`).not.toThrow();
};

describe('Spanish guides', () => {
  for (const id of Object.keys(TOURS) as (keyof typeof TOURS)[]) {
    it(`${id}: same steps, targets and math`, () => {
      expect(TOURS_ES[id].length).toBe(TOURS[id].length);
      TOURS[id].forEach((s, i) => {
        expect(TOURS_ES[id][i].target).toBe(s.target);
        checkMath(s.body, TOURS_ES[id][i].body, `${id}[${i}]`);
      });
    });
  }
  it('modules have Spanish text', () => {
    for (const m of MODULES) { expect(m.labelEs).toBeTruthy(); expect(m.blurbEs).toBeTruthy(); }
  });
});

describe('Spanish tasks', () => {
  it('same ids and order, translated, same math', () => {
    expect(TASKS_ES.map((t) => t.id)).toEqual(TASKS.map((t) => t.id));
    TASKS.forEach((t, i) => {
      const e = TASKS_ES[i];
      expect(e.module).toBe(t.module);
      for (const k of ['prompt', 'hint', 'answer'] as const) {
        expect(e[k], `${t.id}.${k}`).not.toBe(t[k]);
        checkMath(t[k], e[k], `${t.id}.${k}`);
      }
    });
  });
});
