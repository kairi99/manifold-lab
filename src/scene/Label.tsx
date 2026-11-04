import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../math/types';

/** Canvas-texture sprite label: no DOM root inside the Canvas, so unmounting is safe (drei <Html> raced React 19 unmounts). */
export function Label({ text, position, color = '#ffffff', height = 0.09 }: { text: string; position: Vec3; color?: string; height?: number }) {
  const { tex, aspect } = useMemo(() => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const font = '600 48px system-ui, sans-serif';
    ctx.font = font;
    c.width = Math.ceil(ctx.measureText(text).width) + 16;
    c.height = 64;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    ctx.fillText(text, 8, 34);
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
