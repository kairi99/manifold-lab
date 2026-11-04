import { Component, type ReactNode } from 'react';

/** True if the browser can create a WebGL context (hardware or software). */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function NoWebGL({ detail }: { detail?: string }) {
  return (
    <div className="no-webgl" role="alert">
      <p><strong>The 3D view needs WebGL</strong>, which this browser could not start.</p>
      <p>Enable hardware acceleration in the browser settings, or try another browser. The equations and readouts in the panel still work.</p>
      {detail && <p className="no-webgl-detail">{detail}</p>}
    </div>
  );
}

/**
 * Keeps a WebGL failure inside the 3D area: without it, three.js throws while creating the renderer
 * and React unmounts the whole app, leaving a blank page.
 */
export class WebGLGuard extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: hasWebGL() ? null : 'WebGL is unavailable.' };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  render() {
    return this.state.error ? <NoWebGL detail={this.state.error} /> : this.props.children;
  }
}
