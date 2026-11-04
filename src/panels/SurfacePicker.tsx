import { SURFACES } from '../math';
import { useStore } from '../state/store';

export function SurfacePicker({ only }: { only?: string[] }) {
  const surfaceId = useStore((st) => st.surfaceId);
  const set = useStore((st) => st.set);
  const ids = only ?? Object.keys(SURFACES);
  return (
    <label className="field" data-tour="surface-picker">
      <span>Surface</span>
      <select
        value={surfaceId}
        onChange={(e) => {
          const s = SURFACES[e.target.value];
          const { u, v } = s.domain;
          // reset p to the domain centre so it is valid on the new surface
          set({ surfaceId: s.id, uv: [(u[0] + u[1]) / 2, (v[0] + v[1]) / 2 + 0.3], progress: 0, playing: false, freePoints: [], fieldId: '', fieldId2: '',
            // loop slider means θ0 on sphere, v on torus, radius ρ on graphs
            latitude: s.id === 'sphere' ? Math.PI / 3 : s.id === 'torus' ? 0 : 0.6,
            vector: [0.5, 0] });
        }}
      >
        {ids.map((id) => <option key={id} value={id}>{SURFACES[id].name}</option>)}
      </select>
    </label>
  );
}
