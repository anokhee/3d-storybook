import { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import { hue } from "../../world/palette.js";
import { CEL } from "../../adjectives/unlit/toon.js";
import { HOLED } from "../water/Basin.jsx";
import { PLANET } from "./objects.js";
import { groundRadiusAt } from "./ground.js";

export default function Planet() {
  // WELDED, which three's polyhedra are not: they come three vertices per
  // triangle with nothing reused, and the thumbing below wants one skin.
  // Each vertex is then pushed in to where the ground really is — see
  // ./ground.js — and shaded smooth over the result. useMemo is where R3F
  // puts the work that must happen once rather than on every render.
  const geometry = useMemo(() => {
    const g = mergeVertices(
      new THREE.IcosahedronGeometry(PLANET.radius, PLANET.detail),
    );
    const pos = g.attributes.position;
    const d = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      d.fromBufferAttribute(pos, i).normalize();
      d.multiplyScalar(groundRadiusAt(d));
      pos.setXYZ(i, d.x, d.y, d.z);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  // Casts as well as takes: the ball is what keeps the light off its own
  // far side, with the shadow camera taking in the whole of it.
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {/* Toon, the same stepped light as the grass — see TOON. Left
        unpainted over the swimming pools' openings — see HOLED. */}
      <meshToonMaterial color={hue(PLANET.color)} {...CEL} {...HOLED} />
    </mesh>
  );
}
