// THE XYLOPHONE LOOK: toon shading with an ink outline. In the project
// these two helpers live inside script.js and are handed to every builder
// as `{ toonMat, inked }`; here they are the same, made standalone.
//
//   toonMat(hex)  a MeshToonMaterial stepped by MATERIALS.ramp
//   inked(mesh)   casts and catches shadows, and (OUTLINES on) an ink outline: the
//                 mesh drawn again inside-out, pushed out along its normals
//                 by a screen-constant stroke (MATERIALS.outlines.stroke px)
//   setStroke(camera, heightPx)  keeps the stroke that many pixels wide for
//                 this camera and viewport; the stage calls it every frame
import * as THREE from "three";
import { MATERIALS } from "./materials.js";

const ramp = (() => {
  const data = new Uint8Array(MATERIALS.ramp.map((v) => [v, v, v, 255]).flat());
  const tex = new THREE.DataTexture(data, MATERIALS.ramp.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const mats = new Map();
export const toonMat = (hex) => {
  const key = typeof hex === "number" ? hex : String(hex);
  if (!mats.has(key)) mats.set(key, new THREE.MeshToonMaterial({ color: hex, gradientMap: ramp }));
  return mats.get(key);
};

const strokeUniform = { value: 0 };
const OUTLINE_VERTEX = `
  vec4 mvPosition = vec4( transformed, 1.0 );
  vec3 on = normal;
  #ifdef USE_INSTANCING
    mvPosition = instanceMatrix * mvPosition;
    on = mat3( instanceMatrix ) * on;
  #endif
  mvPosition = modelViewMatrix * mvPosition;
  mvPosition.xyz += normalize( normalMatrix * on ) * ( uStroke * -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
`;
export function makeOutlineMat(extra = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: MATERIALS.outlines.color, side: THREE.BackSide, ...extra });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uStroke = strokeUniform;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "uniform float uStroke;\n#include <common>")
      .replace("#include <project_vertex>", OUTLINE_VERTEX);
  };
  mat.customProgramCacheKey = () => "xylophone-outline";
  return mat;
}
export const outlineMat = makeOutlineMat();
export const ink = MATERIALS.outlines.color;

// The library shows the xylophone's objects WITHOUT their ink outlines, so
// they sit with everything else; flip this to get the outlines back.
export const OUTLINES = false;

export function inked(mesh, mat = outlineMat) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (OUTLINES && MATERIALS.outlines.enabled) {
    const hull = new THREE.Mesh(mesh.geometry, mat);
    hull.userData.outline = true;
    mesh.add(hull);
  }
  return mesh;
}

// The push per unit of depth that makes the stroke `px` pixels wide on
// screen, for a perspective camera and a viewport `heightPx` tall.
export function setStroke(camera, heightPx, px = MATERIALS.outlines.stroke) {
  const perPixel = (2 * Math.tan((camera.fov * Math.PI) / 360)) / heightPx;
  strokeUniform.value = px * perPixel;
}
