import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// The studio rig the grid stands in, the environment behind it, and the tone
// map the whole thing is viewed through — including the FLAT switch that
// turns the whole rig off.
// ---- flat mode ----------------------------------------------------------
// Unlit: every surface renders as the raw color it was authored in, with no
// key, no rim, no environment and no tone curve on top. It is not a look —
// it is the lights being off, so that a new rig can be designed against what
// the scene actually IS rather than against what the old one was doing to it.
//
// Done with a single white ambient rather than by swapping every material for
// a MeshBasic: nothing about the dolls, the ground or the props changes, so
// flipping this back off restores the old scene exactly.
export const FLAT = false;
// Why PI and not 1: three has been physically correct since r155, so ambient
// irradiance arrives un-scaled and the Lambert BRDF divides it by PI on the
// way out. An intensity of PI cancels that exactly, and the fragment is the
// albedo and nothing else. At 1 the whole scene comes out a third as bright,
// which is dim, not flat.
const FLAT_AMBIENT = Math.PI;

// The palette came over as p5's 0-255 sRGB triplets, kept in that form so they
// can still be diffed against the original file. This is the one place they
// stop being that: three works in linear light and does the conversion itself
// if you name the space the numbers were written in. Everything downstream is
// a THREE.Color.
export function hue(rgb, target = new THREE.Color()) {
  return target.setRGB(
    rgb[0] / 255,
    rgb[1] / 255,
    rgb[2] / 255,
    THREE.SRGBColorSpace,
  );
}

// ---- the studio ---------------------------------------------------------
// A three-point rig and a sky fill, aimed at a doll stood square on in a room.
// Gathered into one list because the world takes it DOWN — see
// enterWorldLighting(). It is a rig for looking at an object on a table, and
// left on outdoors it lights the whole ball from two fixed directions that
// nothing in the sky accounts for, which is most of what stopped the night
// side ever being night.
const hemi = new THREE.HemisphereLight(0xffe9cc, 0x4a4258, 0.35);
const key = new THREE.DirectionalLight(0xfff0dd, 1.1);
key.position.set(3, 4, 3);
const fill = new THREE.DirectionalLight(0xc3d0ff, 0.3);
fill.position.set(-4, -0.5, 2);
const rim = new THREE.DirectionalLight(0xffd9b0, 1.4);
rim.position.set(-1.5, 2.5, -4);
const studio = [hemi, key, fill, rim];

// The one light of flat mode, and the only one it ever adds.
const flatFill = new THREE.AmbientLight(0xffffff, FLAT_AMBIENT);


let pmrem = null;
let roomEnv = null; // the grid's surroundings — a PMREM'd RoomEnvironment

// Stood up once, at boot, before anything is built: the PMREM generator needs
// the renderer, and every environment in here comes out of it.
export function initLighting(scene, renderer) {
  // ACES is a look — a filmic shoulder that rolls highlights off. In flat mode
  // that is one more thing between the authored color and the pixel, so it
  // goes with the lights.
  renderer.toneMapping = FLAT
    ? THREE.NoToneMapping
    : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  pmrem = new THREE.PMREMGenerator(renderer);

  // Returned so a renderer that mounts and unmounts the rig (R3F) can take it
  // back down. The vanilla page never calls it.
  const teardown = () => {
    scene.environment = null;
    scene.remove(flatFill, ...studio);
    roomEnv?.dispose();
    pmrem.dispose();
    roomEnv = pmrem = null;
  };

  if (FLAT) {
    // No environment either: an env map is indirect light, and indirect light
    // is still light. Ambient only, so the fragment is the albedo.
    scene.environment = null;
    scene.add(flatFill);
    return teardown;
  }

  roomEnv = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  scene.environment = roomEnv;
  scene.add(...studio);
  return teardown;
}
