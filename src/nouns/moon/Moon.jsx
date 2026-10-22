import { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import { hue } from "../../world/palette.js";
import { latLonDir } from "../../world/layout.js";
import {
  bumpAt,
  bumpFrom,
  textureDefaults,
  textures,
} from "../../presets/materials/textures.js";
import { MOON } from "./objects.js";
import { MOON_SUN, SUN_DIR } from "../../lighting.js";
import { RAMP, TOON } from "../../adjectives/unlit/toon.js";
import { HOLED } from "../water/Basin.jsx";
import { CLAY_ON } from "../../world/clay.js";

// The moon you can see, and stand on: a ball of clay hung at MOON.center,
// lumpy the way a doll's head is — the same bump field, off the same
// texture preset, pushed along the normals of a welded icosphere. Nothing
// here is the moon's own: it is a doll's skin at forty times the size.
//
// It is lit by a sun that is never drawn, and takes nothing from the
// scene's lights — those are ITS light, thrown back onto the planet (see
// Moonlight) — so its light is baked into the mesh: the sun's bearing
// against the lumpy normals per vertex, so the disc shows a phase and
// every lump a lit side and a shaded one. The shading itself happens per
// pixel, in the material below, so its steps cut clean across a triangle.
function clay(radius, T) {
  const g = mergeVertices(new THREE.IcosahedronGeometry(radius, T.detail));
  const tex = { ...textureDefaults, ...textures[T.texture], detail: T.detail };
  const bump = bumpFrom(T.amount, T.seed, tex);
  const clear = T.clear.map((c) => ({
    dir: latLonDir(c.lat, c.lon),
    arc: c.radius / radius,
    fade: c.fade / radius,
  }));

  // The lumps, sampled at the bare direction the way a head samples its
  // skin, in the head's own units — a share of the radius. Eased flat
  // inside a clearing so a station has level ground.
  const pos = g.attributes.position;
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    let h = CLAY_ON ? bumpAt(bump, n.x, n.y, n.z) : 0; // see world/clay.js
    for (const c of clear) {
      const arc = Math.acos(THREE.MathUtils.clamp(n.dot(c.dir), -1, 1));
      const t = THREE.MathUtils.clamp((arc - c.arc) / c.fade, 0, 1);
      h *= t * t * (3 - 2 * t);
    }
    const r = radius * (1 + h);
    pos.setXYZ(i, n.x * r, n.y * r, n.z * r);
  }
  pos.needsUpdate = true;

  // The sun, against the lumpy surface: the normals are only right once
  // the lumps are in. Stored the way the toon material reads it, -1..1
  // squeezed to 0..1, so the moon steps through the same ramp.
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  const color = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const dotNL = n.fromBufferAttribute(nrm, i).dot(SUN_DIR);
    color[i * 3] = color[i * 3 + 1] = color[i * 3 + 2] = dotNL * 0.5 + 0.5;
  }
  g.setAttribute("color", new THREE.BufferAttribute(color, 3));
  return g;
}

// Toon, by hand: an unlit material that steps the baked sun through the
// world's own RAMP, exactly as MeshToonMaterial steps a scene light, then
// stretches the ramp's floor down to `night` — the toon floor is what a
// lit thing keeps in shadow; the moon's dark side is a phase, and darker.
function moonMaterial(color, sun) {
  // Left unpainted over a swimming pool's opening, like the planet — see
  // HOLED.
  const m = new THREE.MeshBasicMaterial({
    color,
    vertexColors: true,
    ...HOLED,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.ramp = { value: RAMP };
    shader.uniforms.rampFloor = { value: TOON.bands[0].tone };
    shader.uniforms.night = { value: sun.night };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `uniform sampler2D ramp;
         uniform float rampFloor;
         uniform float night;
         void main() {`,
      )
      .replace(
        "#include <color_fragment>",
        `float band = texture2D(ramp, vec2(vColor.r, 0.5)).r;
         float lit = (band - rampFloor) / (1.0 - rampFloor);
         diffuseColor.rgb *= mix(night, 1.0, lit);`,
      );
  };
  return m;
}

export default function Moon() {
  const geometry = useMemo(() => clay(MOON.radius, MOON.terrain), []);
  const material = useMemo(() => moonMaterial(hue(MOON.color), MOON_SUN), []);

  return (
    <mesh geometry={geometry} material={material} position={MOON.center} />
  );
}
