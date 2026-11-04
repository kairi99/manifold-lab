import katex from 'katex';
import { Children, createElement, useMemo, type ReactNode } from 'react';

/** Render a KaTeX string; `block` for display math. Errors render as red source, never throw. */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, output: 'htmlAndMathml' }),
    [children, block],
  );
  return <span className={block ? 'tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Fixed-precision number for live readouts; keeps the sign column stable. */
export const fmt = (x: number, d = 3) => (Math.abs(x) < 10 ** -d / 2 ? 0 : x).toFixed(d);

const GREEK: Record<string, string> = { '\\theta': 'θ', '\\varphi': 'φ', '\\phi': 'φ' };
/** Plain-text form of a coordinate's LaTeX name, for canvas labels and monospace readouts. */
export const coordText = (latex: string) => GREEK[latex] ?? latex.replace(/\\/g, '');

/** Angle in degrees wrapped to (−180, 180]; −180 shows as 180 so equal-mod-2π values read the same. */
export const fmtDeg = (rad: number, d = 2) => {
  let x = (Math.atan2(Math.sin(rad), Math.cos(rad)) * 180) / Math.PI;
  if (x <= -180 + 10 ** -d) x = 180;
  return fmt(x, d);
};

/** Prose with $...$ inline-math segments rendered by KaTeX (tour cards, task text). */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/\$([^$]+)\$/);
  return <>{parts.map((p, i) => (i % 2 ? <Tex key={i}>{p}</Tex> : <span key={i}>{p}</span>))}</>;
}

export type Run = { t: string; k: '' | 'sub' | 'sup' };
/** Split plain text with `x_i`, `x_{ij}`, `c^2` markup into normal / subscript / superscript runs. */
export function richRuns(s: string): Run[] {
  const out: Run[] = [];
  let i = 0;
  for (const m of s.matchAll(/(?<=[^\s(])([_^])(?:\{([^}]*)\}|([\p{L}\p{Nd}]+))/gu)) {
    if (m.index > i) out.push({ t: s.slice(i, m.index), k: '' });
    out.push({ t: m[2] ?? m[3], k: m[1] === '_' ? 'sub' : 'sup' });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: s.slice(i), k: '' });
  return out;
}

/** Plain prose whose string children may use `r_s`, `E_{ISCO}`, `c^2` markup; renders real sub/superscripts. */
export function Rich({ children }: { children?: ReactNode }) {
  return <>{Children.map(children, (c) => (typeof c === 'string'
    ? richRuns(c).map((r, i) => (r.k ? createElement(r.k, { key: i }, r.t) : r.t))
    : c))}</>;
}

/** Same markup inside SVG <text>. */
export const richSvg = (s: string) => richRuns(s).map((r, i) => (r.k
  ? <tspan key={i} fontSize="75%" baselineShift={r.k === 'sub' ? 'sub' : 'super'}>{r.t}</tspan>
  : r.t));
