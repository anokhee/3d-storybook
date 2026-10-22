// FIELD: a ground cover instanced over the whole of the stage's disc, the
// way the dollies' GroundCover lays its layers over the planet
// (src/nouns/groundCover): a few variants of the thing, each rolled its
// own way from its `hand` ranges, each an InstancedMesh of its share of
// the density; every copy stood at a random spot on the disc, turned,
// sized, leaned and sunk a little, and colored from the layer's blocks,
// pooled over the ground in patches with a little grain. Shared by the
// Grass and Pebble stories.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mulberry32, between } from "../../src/world/random.js";
import { hue } from "../../src/world/palette.js";
import { toon } from "../../src/adjectives/unlit/toon.js";

const STAGE_R = 18; // the stage's ground disc (.storybook/stage.jsx)
// One white toon material for every field: each copy's color is its own
// (instanceColor), multiplied over the white
const material = toon(new THREE.Color(0xffffff));

// `make(rand)` builds one variant: { geometry, up }, `up` how high its
// middle sits over the ground at scale 1 (0 for a thing rooted at its
// foot). `colors` are palette blocks, `pool` the size of a patch of one
// color in world units, `grain` how much each copy drifts from its block.
export function Field({ make, variants = 8, density = 2000, colors, size = [0.8, 1.2], lean = 15, sink = [0, 0.05], pool = 5, grain = 0.1, seed = 1 }) {
  const meshes = useMemo(() => {
    const rand = mulberry32(seed);
    const blockAt = (x, z) => {
      // the same block over a whole patch: a hash of the patch's cell
      const i = Math.floor(x / pool + 1e3), j = Math.floor(z / pool + 1e3);
      const h = Math.abs(Math.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1;
      return colors[Math.floor(h * colors.length)];
    };
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), tilt = new THREE.Vector3(), c = new THREE.Color();
    const per = Math.max(1, Math.round(density / variants));
    return Array.from({ length: variants }, () => {
      const { geometry, up = 0 } = make(rand);
      const mesh = new THREE.InstancedMesh(geometry, material, per);
      for (let n = 0; n < per; n++) {
        const r = Math.sqrt(rand()) * STAGE_R, a = rand() * Math.PI * 2, k = between(size, rand);
        const down = between(sink, rand);
        p.set(Math.cos(a) * r, up * k - down, Math.sin(a) * r);
        // turned any way round, and leaned off upright by up to `lean` degrees
        q.setFromAxisAngle(tilt.set(0, 1, 0), rand() * Math.PI * 2);
        q.premultiply(new THREE.Quaternion().setFromAxisAngle(tilt.set(Math.cos(a), 0, Math.sin(a)).normalize(), THREE.MathUtils.degToRad(rand() * lean)));
        s.setScalar(k);
        mesh.setMatrixAt(n, m.compose(p, q, s));
        hue(blockAt(p.x, p.z), c).offsetHSL(0, 0, (rand() - 0.5) * grain * 0.3);
        mesh.setColorAt(n, c);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      return mesh;
    });
  }, [make, variants, density, colors, size, lean, sink, pool, grain, seed]);
  useEffect(() => () => meshes.forEach((mesh) => { mesh.geometry.dispose(); mesh.dispose(); }), [meshes]);
  return meshes.map((mesh, i) => <primitive key={i} object={mesh} />);
}
