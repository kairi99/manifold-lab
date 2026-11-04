import { useStore } from '../state/store';

export function TransportControls() {
  const { progress, playing, set } = useStore();
  return (
    <div data-tour="transport-controls" className="field">
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => set(playing ? { playing: false } : { playing: true, progress: progress >= 1 ? 0 : progress })}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => set({ playing: false, progress: 0 })}>Reset</button>
      </div>
      <span>Progress {(progress * 100).toFixed(0)}%</span>
      <input
        type="range" min={0} max={1} step={0.001} value={progress}
        onChange={(e) => set({ progress: +e.target.value, playing: false })}
      />
    </div>
  );
}
