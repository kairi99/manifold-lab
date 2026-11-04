import type { ReactNode } from 'react';
import { useStore, type Lang } from './state/store';

export type { Lang };
export const useLang = () => useStore((s) => s.lang);

/** Pick the value for `lang`: strings, nodes, arrays, objects alike. */
export const tr = <X,>(lang: Lang, en: X, es: X): X => (lang === 'es' ? es : en);

/** Hook form: `const t = useTr(); t('Close', 'Cerrar')`. */
export function useTr() {
  const lang = useLang();
  return <X,>(en: X, es: X): X => tr(lang, en, es);
}

/** Inline bilingual JSX: `<T en={<>…</>} es={<>…</>} />`. */
export function T({ en, es }: { en: ReactNode; es: ReactNode }) {
  return <>{tr(useLang(), en, es)}</>;
}
