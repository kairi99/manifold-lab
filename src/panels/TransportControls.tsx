import { useStore } from '../state/store';
import { useTr } from '../i18n';

export function TransportControls() {
  const { progress, playing, set } = useStore();
  const t = useTr();
  return (
    <div data-tour="transport-controls" className="field" role="group" aria-label={t('Playback', 'Reproducción')}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => set(playing ? { playing: false } : { playing: true, progress: progress >= 1 ? 0 : progress })}
        >
          {playing ? t('Pause', 'Pausa') : t('Play', 'Reproducir')}
        </button>
        <button onClick={() => set({ playing: false, progress: 0 })}>{t('Reset', 'Reiniciar')}</button>
      </div>
      <label htmlFor="transport-progress">{t('Progress', 'Progreso')} {(progress * 100).toFixed(0)}%</label>
      <input
        id="transport-progress"
        type="range" min={0} max={1} step={0.001} value={progress}
        onChange={(e) => set({ progress: +e.target.value, playing: false })}
      />
    </div>
  );
}
