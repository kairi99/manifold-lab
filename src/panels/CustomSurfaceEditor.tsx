import { useMemo, useState } from 'react';
import { compileSpec, makeCustomSurface, validateSurface, type CustomSpec } from '../math/surfaces/custom';
import { PRESETS } from '../math/surfaces/presets';
import { applyCustomSpec, useStore } from '../state/store';
import { Tex, fmt } from './Tex';

const same = (a: CustomSpec, b: CustomSpec) => JSON.stringify(a) === JSON.stringify(b);

/** Editor for the user's surface: expressions in u, v, a, b (see src/math/expr.ts). Apply commits; the a, b sliders apply live. */
export function CustomSurfaceEditor() {
  const applied = useStore((s) => s.customSpec);
  const [draft, setDraft] = useState<CustomSpec>(applied);
  const [note, setNote] = useState('');
  const patch = (p: Partial<CustomSpec>) => setDraft((d) => ({ ...d, ...p }));

  const check = useMemo(() => {
    const { c, errors } = compileSpec(draft);
    if (!c) return { errors, warnings: [] as string[], param: '' };
    const s = makeCustomSurface(draft), r = validateSurface(s);
    if (r.errors.length) errors.surface = r.errors[0];
    return { errors, warnings: r.warnings, param: s.latex.param };
  }, [draft]);
  const bad = Object.keys(check.errors).length > 0;
  const err = (...keys: string[]) => keys.map((k) => check.errors[k]).filter(Boolean).join('; ');

  const field = (key: 'x' | 'y' | 'z' | 'f', label: string) => (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={draft[key]} spellCheck={false} autoComplete="off" aria-invalid={!!check.errors[key]}
        aria-describedby={check.errors[key] ? `ce-${key}` : undefined}
        onChange={(e) => patch({ [key]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !bad) applyCustomSpec(draft); }} />
      {check.errors[key] && <span id={`ce-${key}`} role="alert" className="err">{check.errors[key]}</span>}
    </label>
  );
  const range = (axis: 'u' | 'v') => {
    const key = `${axis}Range` as 'uRange' | 'vRange';
    const e = err(`${axis}Min`, `${axis}Max`, key);
    return (
      <div className="field" role="group" aria-label={`${axis} range`}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1].map((i) => (
            <label key={i} style={{ flex: 1 }}>
              <span>{axis} {i ? 'max' : 'min'}</span>
              <input type="text" style={{ width: '100%' }} value={draft[key][i]} spellCheck={false} aria-invalid={!!e}
                onChange={(ev) => patch({ [key]: i ? [draft[key][0], ev.target.value] : [ev.target.value, draft[key][1]] })} />
            </label>
          ))}
          <label style={{ alignSelf: 'end' }}>
            <input type="checkbox" checked={axis === 'u' ? draft.periodicU : draft.periodicV}
              onChange={(ev) => patch(axis === 'u' ? { periodicU: ev.target.checked } : { periodicV: ev.target.checked })} /> periodic {axis}
          </label>
        </div>
        {e && <span role="alert" className="err">{e}</span>}
      </div>
    );
  };
  const slider = (k: 'a' | 'b') => (
    <label className="field">
      <span>parameter {k} = {fmt(draft.params[k], 2)}</span>
      <input type="range" min={-3} max={3} step={0.05} value={draft.params[k]}
        onChange={(e) => {
          const next = { ...draft, params: { ...draft.params, [k]: +e.target.value } };
          setDraft(next);
          // live only when the text is already applied; otherwise the next Apply picks the value up
          if (same({ ...draft, params: applied.params }, applied)) applyCustomSpec({ ...applied, params: next.params }, false);
        }} />
    </label>
  );

  return (
    <details open className="custom-editor" style={{ marginBottom: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>Custom surface editor</summary>
      <label className="field" style={{ marginTop: 8 }}>
        <span>Preset</span>
        <select value="" aria-label="Preset surface" onChange={(e) => {
          const p = PRESETS.find((q) => q.id === e.target.value);
          if (p) { setDraft(p.spec); setNote(p.note); applyCustomSpec(p.spec); }
        }}>
          <option value="">choose a classic surface…</option>
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      {note && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0 }}>{note}</p>}
      <fieldset className="field group">
        <legend>Definition</legend>
        {(['parametric', 'graph'] as const).map((m) => (
          <label key={m}><input type="radio" name="cmode" checked={draft.mode === m} onChange={() => patch({ mode: m })} /> {m === 'parametric' ? 'parametric X(u,v) = (x, y, z)' : 'graph z = f(u,v)'}</label>
        ))}
      </fieldset>
      {draft.mode === 'parametric' ? <>{field('x', 'x(u, v)')}{field('y', 'y(u, v)')}{field('z', 'z(u, v)')}</> : field('f', 'f(u, v)')}
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '-6px 0 8px' }}>
        Variables u, v; parameters a, b; constants pi, e; operators + - * / ^ and ( ); functions sin cos tan exp log sqrt abs sinh cosh tanh asin acos atan. Write 2*u, not 2u.
      </p>
      {range('u')}{range('v')}
      <div style={{ display: 'flex', gap: 8 }}>
        {([0, 1] as const).map((i) => (
          <label key={i} className="field" style={{ flex: 1 }}>
            <span>name of {i ? 'v' : 'u'} (LaTeX)</span>
            <input type="text" value={draft.coords[i]} spellCheck={false}
              onChange={(e) => patch({ coords: i ? [draft.coords[0], e.target.value] : [e.target.value, draft.coords[1]] })} />
          </label>
        ))}
      </div>
      {slider('a')}{slider('b')}
      <label className="field">
        <span>Name</span>
        <input type="text" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
      </label>
      {check.errors.surface && <p role="alert" className="err">{check.errors.surface}</p>}
      {check.warnings.map((w) => <p key={w} role="status" className="warn">{w}</p>)}
      {check.param && <Tex block>{check.param}</Tex>}
      <button type="button" disabled={bad} onClick={() => applyCustomSpec(draft)}>Apply</button>
      {bad && <span className="err" style={{ marginLeft: 8 }}>fix the errors to apply</span>}
    </details>
  );
}
