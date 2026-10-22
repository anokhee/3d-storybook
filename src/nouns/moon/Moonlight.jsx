import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import {
  LIGHTING,
  KEY_DIR,
  SUN,
  SUN_DIR,
  SHADOWS,
  bearingOn,
} from "../../lighting.js";
import { SHADOW_TINT } from "../../adjectives/unlit/toon.js";
import { useGameStore } from "../../game/store.js";
import { TREAD } from "../../player/tread.js";
import { live } from "../../player/events.js";

// The world's light: by night the key — the moon's, cast as a directional
// light — and the sky's ambient; by day the sun, from its own bearing,
// with the sky's fill for an ambient and a sunlit shade. The game's
// `daylight` (see game/store.js) crossfades the two, every frame, so the
// terminator swings from the moon's bearing to the sun's as the day comes
// up. Every number is in refactored/lighting.js.
//
// Each light stands at its bearing over the ground under the doll — or,
// with none flying, under the spot on the ball the camera looks at —
// rather than at a fixed one in the world (see bearingOn), so the ball
// has no far side: wherever the doll is, the light is up. Both cast (see
// SHADOWS): each is aimed at the planet's center from its bearing out,
// its shadow camera fitted to the ball, and whichever the daylight has
// all but out casts none.
const _focus = new THREE.Vector3();
const _up = new THREE.Vector3();
const _dir = new THREE.Vector3();
export default function Moonlight() {
  const { key, ambient } = LIGHTING;
  const at = useMemo(
    () => KEY_DIR.clone().multiplyScalar(key.distance).toArray(),
    [key.distance],
  );
  const sunAt = useMemo(
    () => SUN_DIR.clone().multiplyScalar(SUN.distance).toArray(),
    [],
  );
  const night = useMemo(
    () => ({
      ambient: hue(ambient.color),
      shadow: hue(LIGHTING.shadow.tint),
    }),
    [ambient.color],
  );
  const day = useMemo(
    () => ({ ambient: hue(SUN.ambient.color), shadow: hue(SUN.shadow.tint) }),
    [],
  );

  const moon = useRef();
  const sun = useRef();
  const fill = useRef();
  // What the lights aim at, and where they stand, both carried with the
  // focus so their bearings never change.
  const moonAt = useMemo(() => new THREE.Object3D(), []);
  const sunAtTarget = useMemo(() => new THREE.Object3D(), []);
  const { reach, near, far } = SHADOWS.camera;
  const shadow = {
    "shadow-mapSize": [SHADOWS.mapSize, SHADOWS.mapSize],
    "shadow-camera-left": -reach,
    "shadow-camera-right": reach,
    "shadow-camera-top": reach,
    "shadow-camera-bottom": -reach,
    "shadow-camera-near": near,
    "shadow-camera-far": far,
    "shadow-bias": SHADOWS.bias,
    "shadow-normalBias": SHADOWS.normalBias,
  };

  useFrame(({ camera }) => {
    const d = useGameStore.getState().daylight;
    moon.current.intensity = key.intensity * (1 - d);
    sun.current.intensity = SUN.intensity * d;
    moon.current.castShadow = 1 - d > 0.05;
    sun.current.castShadow = d > 0.05;
    // The ground's up under the doll, or under the camera's eye.
    if (TREAD.at.lengthSq() < 1e8) {
      _focus.copy(TREAD.at);
      if (live.you?.up) _up.copy(live.you.up);
      else _up.copy(_focus).normalize();
    } else {
      _up.copy(camera.position).normalize();
    }
    // Aimed at the ball's center from the bearing out, so the shadow
    // camera (which looks the way the light does) takes in the whole ball
    // with the doll's side nearest.
    moonAt.position.set(0, 0, 0);
    sunAtTarget.position.set(0, 0, 0);
    moon.current.position
      .copy(bearingOn(_up, key, _dir))
      .multiplyScalar(key.distance);
    sun.current.position
      .copy(bearingOn(_up, SUN, _dir))
      .multiplyScalar(SUN.distance);
    fill.current.intensity =
      ambient.intensity + (SUN.ambient.intensity - ambient.intensity) * d;
    fill.current.color.copy(night.ambient).lerp(day.ambient, d);
    SHADOW_TINT.copy(night.shadow).lerp(day.shadow, d);
  });

  return (
    <>
      <directionalLight
        ref={moon}
        position={at}
        color={hue(key.color)}
        intensity={key.intensity}
        target={moonAt}
        castShadow
        {...shadow}
      />
      <directionalLight
        ref={sun}
        position={sunAt}
        color={hue(SUN.color)}
        intensity={0}
        target={sunAtTarget}
        {...shadow}
      />
      <primitive object={moonAt} />
      <primitive object={sunAtTarget} />
      <ambientLight
        ref={fill}
        color={hue(ambient.color)}
        intensity={ambient.intensity}
      />
    </>
  );
}
