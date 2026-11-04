import { SURFACES } from '../math';
import { applyCustomSpec, useStore } from '../state/store';
import { useTr } from '../i18n';
import { CustomSurfaceEditor } from './CustomSurfaceEditor';

export function SurfacePicker({ only }: { only?: string[] }) {
  const surfaceId = useStore((st) => st.surfaceId);
  const customName = useStore((st) => st.customSpec.name);
  const set = useStore((st) => st.set);
  const t = useTr();
  const ids = only ?? Object.keys(SURFACES);
  return (
    <>
    <label className="field" data-tour="surface-picker">
      <span>{t('Surface', 'Superficie')}</span>
      <select
        value={surfaceId}
        onChange={(e) => {
          if (e.target.value === 'custom') return applyCustomSpec(useStore.getState().customSpec);
          const s = SURFACES[e.target.value];
          const { u, v } = s.domain;
          // reset p to the domain centre so it is valid on the new surface
          set({ surfaceId: s.id, uv: [(u[0] + u[1]) / 2, (v[0] + v[1]) / 2 + 0.3], progress: 0, playing: false, freePoints: [], fieldId: '', fieldId2: '',
            // loop slider means θ0 on sphere, v on torus, radius ρ on graphs
            latitude: s.id === 'sphere' ? Math.PI / 3 : s.id === 'torus' ? 0 : 0.6,
            vector: [0.5, 0] });
        }}
      >
        {ids.map((id) => <option key={id} value={id}>{t(SURFACES[id].name, SURFACES[id].nameEs ?? SURFACES[id].name)}</option>)}
        {!only && <option value="custom">{t('Custom…', 'Personalizada…')}{surfaceId === 'custom' && customName ? ` (${customName})` : ''}</option>}
      </select>
    </label>
    {surfaceId === 'custom' && <CustomSurfaceEditor />}
    </>
  );
}
