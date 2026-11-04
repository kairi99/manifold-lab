// Safe expression language for user-typed surfaces: tokenizer + recursive-descent parser -> AST,
// evaluated over numbers or second-order jets (no eval / Function).
//
// Grammar (lowest to highest precedence):
//   expr   := term (('+' | '-') term)*
//   term   := unary (('*' | '/') unary)*
//   unary  := ('-' | '+') unary | power
//   power  := atom ('^' unary)?          right-associative; -u^2 = -(u^2); 2^-u allowed
//   atom   := number | name | fn '(' expr ')' | '(' expr ')'
// Names: u, v, pi, e and the parameters a, b. Implicit multiplication (2u, u v, 2(u)) is an error.
import * as jet from './jet';
import type { J, Jet } from './jet';

export class ExprError extends Error {
  pos: number;
  constructor(msg: string, pos: number) {
    super(`${msg} at ${pos}`);
    this.pos = pos;
  }
}

export type Ast =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string; pos: number }
  | { t: 'neg'; a: Ast }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Ast; b: Ast }
  | { t: 'call'; fn: string; a: Ast };

type Fn = [(x: number) => number, (x: Jet) => Jet];
const FUNCS: Record<string, Fn> = {
  sin: [Math.sin, jet.sin], cos: [Math.cos, jet.cos], tan: [Math.tan, jet.tan],
  exp: [Math.exp, jet.exp], log: [Math.log, jet.log], sqrt: [Math.sqrt, jet.sqrt], abs: [Math.abs, jet.abs],
  sinh: [Math.sinh, jet.sinh], cosh: [Math.cosh, jet.cosh], tanh: [Math.tanh, jet.tanh],
  asin: [Math.asin, jet.asin], acos: [Math.acos, jet.acos], atan: [Math.atan, jet.atan],
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };
/** Variable names a caller may bind (besides the constants). */
export const VARS = ['u', 'v', 'a', 'b'];

type Tok = { k: 'num'; v: number; pos: number } | { k: 'id'; s: string; pos: number } | { k: 'op'; s: string; pos: number } | { k: 'end'; pos: number };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_]\w*)|([-+*/^()])/y;
  let i = 0;
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) throw new ExprError(`unexpected character '${src[i]}'`, i);
    if (m[1] !== undefined) out.push({ k: 'num', v: parseFloat(m[1]), pos: i });
    else if (m[2] !== undefined) out.push({ k: 'id', s: m[2], pos: i });
    else out.push({ k: 'op', s: m[3], pos: i });
    i = re.lastIndex;
  }
  out.push({ k: 'end', pos: src.length });
  return out;
}

/** Parse `src`; `names` are the variable/parameter names allowed (default u, v, a, b). Throws ExprError. */
export function parse(src: string, names: readonly string[] = VARS): Ast {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (s: string) => peek().k === 'op' && (peek() as { s: string }).s === s;
  const expect = (s: string) => {
    if (!isOp(s)) throw new ExprError(`expected '${s}'`, peek().pos);
    p++;
  };
  const describe = (t: Tok) => (t.k === 'end' ? 'end of input' : t.k === 'num' ? 'number' : t.k === 'id' ? `'${t.s}'` : `'${t.s}'`);

  function expr(): Ast {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { s: '+' | '-' }).s;
      a = { t: 'bin', op, a, b: term() };
    }
    return a;
  }
  function term(): Ast {
    let a = unary();
    while (isOp('*') || isOp('/')) {
      const op = (toks[p++] as { s: '*' | '/' }).s;
      a = { t: 'bin', op, a, b: unary() };
    }
    return a;
  }
  function unary(): Ast {
    if (isOp('-')) { p++; return { t: 'neg', a: unary() }; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power(): Ast {
    const a = atom();
    if (isOp('^')) { p++; return { t: 'bin', op: '^', a, b: unary() }; }
    return a;
  }
  function atom(): Ast {
    const t = peek();
    if (t.k === 'num') { p++; return { t: 'num', v: t.v }; }
    if (t.k === 'id') {
      p++;
      const call = isOp('(');
      if (call) {
        if (!(t.s in FUNCS)) throw new ExprError(`unknown function '${t.s}'`, t.pos);
        p++;
        const a = expr();
        expect(')');
        return { t: 'call', fn: t.s, a };
      }
      if (t.s in FUNCS) throw new ExprError(`'${t.s}' is a function; write ${t.s}(...)`, t.pos);
      if (!(t.s in CONSTS) && !names.includes(t.s)) throw new ExprError(`unknown variable '${t.s}'`, t.pos);
      return { t: 'var', name: t.s, pos: t.pos };
    }
    if (isOp('(')) { p++; const a = expr(); expect(')'); return a; }
    throw new ExprError(`expected a value, found ${describe(t)}`, t.pos);
  }

  if (toks.length === 1) throw new ExprError('empty expression', 0);
  const ast = expr();
  const rest = peek();
  if (rest.k !== 'end') {
    if (rest.k === 'num' || rest.k === 'id' || (rest.k === 'op' && rest.s === '('))
      throw new ExprError(`missing operator before ${describe(rest)} (implicit multiplication is not supported; write '*')`, rest.pos);
    throw new ExprError(`unexpected ${describe(rest)}`, rest.pos);
  }
  return ast;
}

const isConst = (a: J) => typeof a === 'number';
function powJ(a: J, b: J): J {
  if (typeof a === 'number' && typeof b === 'number') return a ** b;
  if (typeof b === 'number') return jet.pow(a as Jet, b);
  const la = typeof a === 'number' ? jet.constant(b.n, a) : a;
  return jet.exp(jet.mul(b, jet.log(la)));
}

/** Evaluate over numbers or jets; `env` binds every variable name (constants pi, e are built in). */
export function evaluate(ast: Ast, env: Record<string, J>): J {
  switch (ast.t) {
    case 'num': return ast.v;
    case 'var': return ast.name in CONSTS ? CONSTS[ast.name] : env[ast.name];
    case 'neg': { const a = evaluate(ast.a, env); return isConst(a) ? -(a as number) : jet.neg(a as Jet); }
    case 'call': {
      const a = evaluate(ast.a, env);
      return typeof a === 'number' ? FUNCS[ast.fn][0](a) : FUNCS[ast.fn][1](a);
    }
    case 'bin': {
      const a = evaluate(ast.a, env), b = evaluate(ast.b, env);
      if (ast.op === '^') return powJ(a, b);
      if (typeof a === 'number' && typeof b === 'number')
        return ast.op === '+' ? a + b : ast.op === '-' ? a - b : ast.op === '*' ? a * b : a / b;
      return ast.op === '+' ? jet.add(a, b) : ast.op === '-' ? jet.sub(a, b) : ast.op === '*' ? jet.mul(a, b) : jet.div(a, b);
    }
  }
}

/** Numeric value of an expression without variables (ranges such as `2*pi`). */
export const evalConst = (src: string): number => evaluate(parse(src, []), {}) as number;

/* ---------- LaTeX ---------- */

const TEX_FN: Record<string, string> = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', log: '\\ln',
};
// precedence: 1 add/sub, 2 mul/div, 3 unary minus, 4 power, 5 atom (frac / sqrt / abs / exp print as self-delimited)
const prec = (a: Ast): number =>
  a.t === 'bin' ? ({ '+': 1, '-': 1, '*': 2, '/': 4, '^': 4 })[a.op] : a.t === 'neg' ? 3
    : a.t === 'call' ? (['sqrt', 'abs'].includes(a.fn) ? 5 : 4) : 5;

function numTex(v: number): string {
  const s = String(v);
  const m = /^(.*)e([+-]?\d+)$/.exec(s);
  return m ? `${m[1]}\\times10^{${parseInt(m[2], 10)}}` : s;
}
const startsWithDigit = (a: Ast): boolean =>
  a.t === 'num' || (a.t === 'bin' && (a.op === '*' || a.op === '^') && startsWithDigit(a.a));

/** `names` maps u/v (and a/b) to display LaTeX, e.g. { u: '\\theta' }. */
export function toLatex(ast: Ast, names: Record<string, string> = {}): string {
  const go = (a: Ast): string => toLatex(a, names);
  const wrap = (a: Ast, min: number) => (prec(a) < min ? `\\left(${go(a)}\\right)` : go(a));
  switch (ast.t) {
    case 'num': return numTex(ast.v);
    case 'var': return ast.name === 'pi' ? '\\pi' : (names[ast.name] ?? ast.name);
    case 'neg': return `-${wrap(ast.a, 4)}`;
    case 'call':
      if (ast.fn === 'sqrt') return `\\sqrt{${go(ast.a)}}`;
      if (ast.fn === 'abs') return `\\left|${go(ast.a)}\\right|`;
      if (ast.fn === 'exp') return `e^{${go(ast.a)}}`;
      return `${TEX_FN[ast.fn]}\\left(${go(ast.a)}\\right)`;
    case 'bin': {
      const { op, a, b } = ast;
      if (op === '/') return `\\frac{${go(a)}}{${go(b)}}`;
      if (op === '^') return `${wrap(a, 5)}^{${go(b)}}`;
      const paren = (x: Ast) => `\\left(${go(x)}\\right)`;
      if (op === '+') return `${go(a)}+${prec(b) === 3 ? paren(b) : go(b)}`;
      if (op === '-') return `${go(a)}-${prec(b) === 1 || prec(b) === 3 ? paren(b) : go(b)}`;
      return `${wrap(a, 2)}${startsWithDigit(b) ? '\\cdot ' : '\\,'}${prec(b) < 2 || prec(b) === 3 ? paren(b) : go(b)}`;
    }
  }
}
