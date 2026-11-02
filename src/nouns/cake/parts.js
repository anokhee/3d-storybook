import * as THREE from "three";

// The cake's and the loaf's parts (see CAKE and LOAF in ./objects.js), each
// `{ geo, color, at, scale }` with its foot's middle at the origin: drawn
// as meshes by Cake.jsx and Loaf.jsx, and merged in vertex colour by the
// shelves (../shopfront/display.js), so both are the same cake.
const hexOf = (c) => c?.hex ?? c;

export function cakePartsOf(C) {
  const r = C.radius, h = C.height, parts = [];
  parts.push({ geo: new THREE.CylinderGeometry(r, r, h, 20), color: hexOf(C.color), at: [0, h / 2, 0] });
  let top = h;
  if (C.icing) {
    const t = C.icing.thick;
    parts.push({ geo: new THREE.CylinderGeometry(r * 1.02, r * 1.02, t, 20), color: hexOf(C.icing.color), at: [0, h + t * 0.4, 0] });
    top = h + t * 0.9;
  }
  if (C.cherry) {
    const cr = C.cherry.radius;
    parts.push({ geo: new THREE.SphereGeometry(cr, 10, 8), color: hexOf(C.cherry.color), at: [0, top + cr * 0.9, 0] });
  }
  return parts;
}

export function loafPartsOf(L) {
  const s = L.size;
  // a ball squashed to the loaf: `size` long (x), `width` of that across,
  // its half-height `height` of it, sat a little into what it rests on
  return [{ geo: new THREE.SphereGeometry(1, 16, 10), color: hexOf(L.color), at: [0, s * L.height * 0.71, 0], scale: [s / 2, s * L.height, (s * L.width) / 2] }];
}
