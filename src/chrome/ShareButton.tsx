import { useEffect, useState } from 'react';
import { encodeShare } from '../state/share';
import { useStore } from '../state/store';
import { useTr } from '../i18n';

/** Copies a link to the current view (`#module?s=…`) to the clipboard and confirms with a short toast. */
export function ShareButton() {
  const t = useTr();
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(''), 2500);
    return () => clearTimeout(id);
  }, [msg]);
  const copy = async () => {
    const st = useStore.getState();
    const url = `${location.origin}${location.pathname}#${st.module}?s=${encodeShare(st)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg(t('Link copied', 'Enlace copiado'));
    } catch {
      // clipboard blocked (insecure context / permissions): show the link so it can be copied by hand
      window.prompt(t('Copy this link', 'Copia este enlace'), url);
    }
  };
  return (
    <>
      <button onClick={copy}>{t('Copy link', 'Copiar enlace')}</button>
      <div role="status" aria-live="polite" style={msg ? { position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--panel, #222)', color: 'var(--fg, #fff)', border: '1px solid var(--accent, #888)', borderRadius: 8, padding: '8px 14px', fontSize: 13 } : { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{msg}</div>
    </>
  );
}
