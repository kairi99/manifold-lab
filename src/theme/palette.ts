// Colour-blind-safe roles (Okabe–Ito hues, lightened where needed for the dark 3D backdrop).
// One colour per mathematical object, shared by the 3D scene, the chart inset and the equations,
// so ∂_u in an equation has the same colour as its arrow.
export const PAL = {
  du: '#E69F00',      // ∂_u basis vector (orange)
  dv: '#56B4E9',      // ∂_v basis vector (sky blue)
  V: '#CC79A7',       // tangent vector V (reddish purple)
  p: '#F0E442',       // point p (yellow)
  path: '#2BC79A',    // loops / curves (bluish green)
  ghost: '#9AA7C7',   // reference / ghost vectors (grey-blue)
  metric: '#B9A3FF',  // metric circle / Tissot ellipses (lavender)
  warn: '#D55E00',    // singular points, conjugate points (vermillion)
} as const;
export type PalKey = keyof typeof PAL;
