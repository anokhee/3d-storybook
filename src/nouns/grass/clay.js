import * as THREE from "three";

import {
  bumpAt,
  bumpFrom,
  textureDefaults,
  textures,
} from "../../presets/materials/textures.js";
import { CLAY_ON } from "../../world/clay.js";

// A tuft thumbed in clay: the dolls' own bump field (see GRASS.clay)
// sampled at each vertex's bearing from the tuft's middle and pushed out
// along the normal the strand already has. The normals are left as they
// were — they were leaned toward up on purpose (see strandGeometry's
// `soft`), and the lumps are small enough that the soft lighting over them
// reads as clay better than a true recompute would. The stock strand is
// shared and cached, so this works on a COPY.
const tufts = new Map();
export function clayStrand(strand, height, C) {
  if (!C || !CLAY_ON) return strand; // see world/clay.js
  const key = `${strand.uuid}:${JSON.stringify(C)}`;
  if (tufts.has(key)) return tufts.get(key);
  const g = strand.clone();
  const bump = bumpFrom(C.amount, C.seed, {
    ...textureDefaults,
    ...textures[C.texture],
    detail: 14,
  });
  const pos = g.attributes.position;
  const nrm = g.attributes.normal;
  const d = new THREE.Vector3();
  const n = new THREE.Vector3();
  const k = C.lumps;
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i);
    d.y -= height / 2;
    d.normalize();
    // The field runs about -1..1 once its own amplitude is divided out.
    const f = bumpAt(bump, d.x * k, d.y * k, d.z * k) / bump.amplitude;
    n.fromBufferAttribute(nrm, i);
    pos.setXYZ(
      i,
      pos.getX(i) + n.x * f * C.depth,
      pos.getY(i) + n.y * f * C.depth,
      pos.getZ(i) + n.z * f * C.depth,
    );
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
  tufts.set(key, g);
  return g;
}
