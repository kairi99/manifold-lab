import { T, useTr } from '../i18n';

/** Largest |x_i / x_0 − 1| over a series (relative drift of a quantity that should be constant). */
export function maxRelDrift(xs: number[]): number {
  let m = 0;
  for (const x of xs) m = Math.max(m, Math.abs(x / xs[0] - 1));
  return Number.isFinite(m) ? m : NaN;
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** 3.2e-11 → "3×10⁻¹¹" */
export function fmtDrift(x: number): string {
  if (!Number.isFinite(x)) return 'n/a';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  const [mm, ee] = m >= 9.5 ? [1, e + 1] : [Math.round(m), e];
  return `${mm}×10${ee < 0 ? '⁻' : ''}${String(Math.abs(ee)).replace(/\d/g, (d) => SUP[+d])}`;
}

/** Readout rows (inside a .readout grid) + explanatory note; `what` names the quantity. */
export function DriftRows({ label, labelEs, value }: { label: string; labelEs: string; value: number }) {
  const t = useTr();
  return <><span>{t(label, labelEs)}</span><span>{t('numerical drift: ', 'deriva numérica: ')}{fmtDrift(value)}</span></>;
}

export function DriftNote() {
  return (
    <p style={{ fontSize: 12 }}><T
      en="The integrator (RK4) is not exact. A quantity that should stay constant drifts slightly, and that drift measures the integration error."
      es="El integrador (RK4) no es exacto. Una cantidad que debería permanecer constante deriva ligeramente, y esa deriva mide el error de integración." /></p>
  );
}
