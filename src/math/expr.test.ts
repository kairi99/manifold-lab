import { describe, expect, it } from 'vitest';
import { evalConst, evaluate, ExprError, parse, toLatex } from './expr';
import { variable } from './jet';
import type { Jet } from './jet';

const val = (s: string, env: Record<string, number> = {}) => evaluate(parse(s), { u: 0, v: 0, a: 0, b: 0, ...env }) as number;
const err = (s: string) => { try { parse(s); } catch (e) { return e as ExprError; } throw new Error(`no error for ${s}`); };

describe('parser', () => {
  it('precedence and associativity', () => {
    expect(val('1+2*3')).toBe(7);
    expect(val('(1+2)*3')).toBe(9);
    expect(val('2^3^2')).toBe(512); // right-assoc
    expect(val('8/4/2')).toBe(1); // left-assoc
    expect(val('10-4-3')).toBe(3);
    expect(val('2*3^2')).toBe(18);
  });
  it('unary minus binds looser than ^', () => {
    expect(val('-u^2', { u: 3 })).toBe(-9);
    expect(val('2^-1')).toBe(0.5);
    expect(val('--u', { u: 3 })).toBe(3);
    expect(val('3--2')).toBe(5);
  });
  it('numbers, constants, functions', () => {
    expect(val('1e-3')).toBe(0.001);
    expect(val('.5+2.')).toBe(2.5);
    expect(val('2*pi')).toBeCloseTo(2 * Math.PI, 14);
    expect(val('e^1')).toBeCloseTo(Math.E, 14);
    expect(val('sin(pi/2)+cosh(0)+sqrt(16)+abs(-2)+atan(0)')).toBeCloseTo(8, 14);
    expect(val('a*u+b', { a: 2, u: 3, b: 1 })).toBe(7);
    expect(evalConst('2*pi')).toBeCloseTo(6.283185307, 8);
  });
  it('errors carry message and position', () => {
    const e1 = err('sin(u)+sni(v)');
    expect(e1.message).toBe("unknown function 'sni' at 7");
    expect(e1.pos).toBe(7);
    expect(err('(1+2').message).toBe("expected ')' at 4");
    expect(err('2u').message).toMatch(/missing operator before 'u'.* at 1$/);
    expect(err('2 (u)').pos).toBe(2);
    expect(err('u v').pos).toBe(2);
    expect(err('1+').message).toBe('expected a value, found end of input at 2');
    expect(err('1 $ 2').message).toBe("unexpected character '$' at 2");
    expect(err('w+1').message).toBe("unknown variable 'w' at 0");
    expect(err('sin u').message).toMatch(/is a function/);
    expect(err('').message).toBe('empty expression at 0');
    expect(err('1)').message).toBe("unexpected ')' at 1");
  });
});

describe('latex', () => {
  const tex = (s: string, n = {}) => toLatex(parse(s), n);
  it('prints functions, fractions, powers', () => {
    expect(tex('sin(u)*cos(v)')).toBe('\\sin\\left(u\\right)\\,\\cos\\left(v\\right)');
    expect(tex('1/(1+u^2)')).toBe('\\frac{1}{1+u^{2}}');
    expect(tex('2*u')).toBe('2\\,u');
    expect(tex('u*2')).toBe('u\\cdot 2');
    expect(tex('u*2^v')).toBe('u\\cdot 2^{v}');
    expect(tex('sqrt(u)+exp(v)')).toBe('\\sqrt{u}+e^{v}');
    expect(tex('(u+v)^2')).toBe('\\left(u+v\\right)^{2}');
    expect(tex('sin(u)^2')).toBe('\\left(\\sin\\left(u\\right)\\right)^{2}');
    expect(tex('-u^2')).toBe('-u^{2}');
    expect(tex('u-(v-1)')).toBe('u-\\left(v-1\\right)');
    expect(tex('2*pi', { u: '\\theta' })).toBe('2\\,\\pi');
    expect(tex('u*v', { u: '\\theta', v: '\\varphi' })).toBe('\\theta\\,\\varphi');
  });
});

describe('jets', () => {
  const srcs = ['sin(u)*cos(v)', 'u^3-3*u*v^2', 'exp(u*v)/(1+u^2)', 'sqrt(u^2+v^2+1)', 'u^v', 'atan(u)*tanh(v)+log(2+u)', '(1+u/2*cos(v/2))*sin(u)'];
  for (const s of srcs) {
    it(`derivatives of ${s} match finite differences`, () => {
      const ast = parse(s);
      const f = (u: number, v: number) => evaluate(ast, { u, v, a: 0, b: 0 }) as number;
      const [u0, v0, h] = [0.7, 1.1, 1e-4];
      const j = evaluate(ast, { u: variable(2, 0, u0), v: variable(2, 1, v0), a: 0, b: 0 }) as Jet;
      expect(j.v).toBeCloseTo(f(u0, v0), 12);
      expect(j.g[0]).toBeCloseTo((f(u0 + h, v0) - f(u0 - h, v0)) / (2 * h), 6);
      expect(j.g[1]).toBeCloseTo((f(u0, v0 + h) - f(u0, v0 - h)) / (2 * h), 6);
      expect(j.h[0]).toBeCloseTo((f(u0 + h, v0) - 2 * f(u0, v0) + f(u0 - h, v0)) / (h * h), 4);
      expect(j.h[3]).toBeCloseTo((f(u0, v0 + h) - 2 * f(u0, v0) + f(u0, v0 - h)) / (h * h), 4);
      expect(j.h[1]).toBeCloseTo((f(u0 + h, v0 + h) - f(u0 + h, v0 - h) - f(u0 - h, v0 + h) + f(u0 - h, v0 - h)) / (4 * h * h), 4);
    });
  }
});
