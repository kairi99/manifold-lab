import katex from 'katex';
import { useMemo } from 'react';

/** Render a KaTeX string; `block` for display math. Errors render as red source, never throw. */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false }),
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
