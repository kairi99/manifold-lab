import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { fmtSci, strictHtml, trustHtmlClass } from './Tex';

const render = (s: string) => katex.renderToString(s, { throwOnError: false, trust: trustHtmlClass, strict: strictHtml });

describe('Tex trust', () => {
  it('allows htmlClass', () => expect(render(String.raw`\htmlClass{hl-du}{\partial_u}`)).toContain('hl-du'));
  it('rejects href and url', () => {
    expect(render(String.raw`\href{https://x.org}{a}`)).not.toContain('<a ');
    expect(render(String.raw`\url{https://x.org}`)).not.toContain('<a ');
  });
});

describe('fmtSci', () => {
  it('uses superscripts and a true minus', () => {
    expect(fmtSci(2.06e7, 1)).toBe('2.1×10⁷');
    expect(fmtSci(-4.5e-3, 1)).toBe('−4.5×10⁻³');
    expect(fmtSci(1.029e-3, 3)).toBe('1.029×10⁻³');
    expect(fmtSci(2.45e-15, 2)).toBe('2.45×10⁻¹⁵');
    expect(fmtSci(NaN)).toBe('NaN');
  });
});
