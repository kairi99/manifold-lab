import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../math/types';
import { richRuns } from '../panels/Tex';

/** Canvas-texture sprite label: no DOM root inside the Canvas, so unmounting is safe (drei <Html> raced React 19 unmounts). */
export function Label({ text, position, color = '#ffffff', height = 0.09 }: { text: string; position: Vec3; color?: string; height?: number }) {
  const { tex, aspect } = useMemo(() => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    // `T_pM`, `r_0`, `c^2` markup draws as real subscripts / superscripts
    const runs = richRuns(text);
    const font = (k: string) => `600 ${k ? 32 : 48}px system-ui, sans-serif`;
    const widths = runs.map((r) => { ctx.font = font(r.k); return ctx.measureText(r.t).width; });
    c.width = Math.ceil(widths.reduce((a, b) => a + b, 0)) + 16;
    c.height = 64;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    let x = 8;
    runs.forEach((r, i) => { ctx.font = font(r.k); ctx.fillText(r.t, x, r.k === 'sub' ? 46 : r.k === 'sup' ? 20 : 34); x += widths[i]; });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, aspect: c.width / c.height };
  }, [text, color]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}
