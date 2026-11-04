import { useEffect, useState } from 'react';
import { GlossaryDialog } from '../tour/Glossary';
import { ShareButton } from './ShareButton';
import { useStore } from '../state/store';
import { useTr } from '../i18n';
import './chrome.css';

const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

/** Applies theme and language to <html> and persists them. */
export function useAppearance() {
  const theme = useStore((s) => s.theme), lang = useStore((s) => s.lang);
  useEffect(() => { document.documentElement.dataset.theme = theme; save('manifoldlab.theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; save('manifoldlab.lang', lang); }, [lang]);
}

export function TopBar() {
  const theme = useStore((s) => s.theme), lang = useStore((s) => s.lang), onHome = useStore((s) => s.onHome), set = useStore((s) => s.set);
  const t = useTr();
  const dark = theme === 'dark';
  const [gloss, setGloss] = useState(false);
  return (
    <header className="topbar">
      <a href="#" className="home-link brand" title={t('Back to the start page', 'Volver a la página de inicio')}>Manifold Lab</a>
      <div className="topbar-tools">
        <button className="tb-icon" onClick={() => set({ theme: dark ? 'light' : 'dark' })}
          aria-label={dark ? t('Switch to light theme', 'Cambiar a tema claro') : t('Switch to dark theme', 'Cambiar a tema oscuro')}
          title={dark ? t('Light theme', 'Tema claro') : t('Dark theme', 'Tema oscuro')}>{dark ? '☀' : '☾'}</button>
        <div className="tb-seg" role="group" aria-label={t('Language', 'Idioma')}>
          {(['en', 'es'] as const).map((l) => (
            <button key={l} aria-pressed={lang === l} onClick={() => set({ lang: l })} lang={l}
              title={l === 'en' ? 'English' : 'Español'}>{l.toUpperCase()}</button>
          ))}
        </div>
        {!onHome && <ShareButton />}
        <button onClick={() => setGloss(true)}>{t('Glossary', 'Glosario')}</button>
        <button onClick={() => set({ infoOpen: 'technical', theoryOpen: false, tourOpen: false })}>{t('Technical', 'Técnico')}</button>
        <button onClick={() => set({ infoOpen: 'legal', theoryOpen: false, tourOpen: false })}>{t('Legal', 'Legal')}</button>
      </div>
      <GlossaryDialog open={gloss} onClose={() => setGloss(false)} />
    </header>
  );
}
