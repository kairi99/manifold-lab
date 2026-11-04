import katex from 'katex';
import { Children, createElement, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useStore } from '../state/store';
import '../theme/highlight.css';

/** KaTeX trust callback: only \htmlClass (for linked highlighting); \href, \url, \includegraphics etc. stay blocked. */
export const trustHtmlClass = (ctx: { command: string }) => ctx.command === '\\htmlClass';

/** Silence only the htmlExtension warning that \htmlClass triggers; every other strict check stays on. */
export const strictHtml = (code: string) => (code === 'htmlExtension' ? 'ignore' : 'warn');

/** Highlight key (`du`, `dv`, `V`, `p`, `g`) of an element tagged with `\htmlClass{hl-KEY}{...}`. */
export const hlKeyOf = (el: Element | null): string | null => {
  const tagged = el?.closest('[class*="hl-"]');
  return tagged?.className.toString().match(/(?:^|\s)hl-(\w+)/)?.[1] ?? null;
};

/**
 * Render a KaTeX string; `block` for display math. Errors render as red source, never throw.
 * Parts tagged `\htmlClass{hl-du}{\partial_u}` are keyboard-focusable, set the store's `hl` on hover/focus,
 * and glow while `hl` matches (also when set from the 3D scene).
 */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, output: 'htmlAndMathml', trust: trustHtmlClass, strict: strictHtml }),
    [children, block],
  );
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    const tagged = root?.querySelectorAll<HTMLElement>('[class*="hl-"]');
    if (!root || !tagged?.length) return;
    tagged.forEach((el) => { el.tabIndex = 0; });
    const paint = (hl: string | null) => tagged.forEach((el) => el.classList.toggle('hl-on', hlKeyOf(el) === hl));
    paint(useStore.getState().hl);
    return useStore.subscribe((st) => paint(st.hl));
  }, [html]);
  const on = (e: { target: EventTarget }) => { const k = hlKeyOf(e.target as Element); if (k) useStore.getState().set({ hl: k }); };
  const off = (e: { target: EventTarget }) => { if (hlKeyOf(e.target as Element)) useStore.getState().set({ hl: null }); };
  return <span ref={ref} className={block ? 'tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }}
    onPointerOver={on} onPointerOut={off} onFocus={on} onBlur={off} />;
}

/** Fixed-precision number for live readouts; keeps the sign column stable. */
export const fmt = (x: number, d = 3) => (Math.abs(x) < 10 ** -d / 2 ? 0 : x).toFixed(d);

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** Scientific notation with Unicode superscripts and a true minus: 2.1×10⁷, −4.5×10⁻³. `d` = digits after the point. */
export const fmtSci = (x: number, d = 1): string => {
  if (!Number.isFinite(x)) return String(x);
  const [m, e] = x.toExponential(d).split('e');
  const ex = String(Math.abs(+e)).replace(/\d/g, (c) => SUP[+c]);
  return `${m.replace('-', '−')}×10${+e < 0 ? '⁻' : ''}${ex}`;
};

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
