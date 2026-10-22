// THE STAGE: the one 3D scene every object is shown on.
//
// Why this file exists at all: Storybook throws away a story's whole React
// tree every time you click a different entry in the sidebar. If the
// <Canvas> (the WebGL renderer) lived inside that tree it would be torn
// down and rebuilt on every click, with a visible blank and a stutter. So
// the Canvas is mounted ONCE, here, on the page body, in its own React
// root that Storybook does not know about. A story never renders a scene;
// it hands its object to this stage (through the little store below) and
// the stage swaps what it is showing. Lights, ground and camera survive.
//
// The toolbar's lightbulb picks a LOOK (see LOOKS below): "toon" is the
// Wooden Dollies cel shading; "flat" is the albatross matte light. The
// slider picks the HOUR, 0 = night to 1 = day, and each look lights its
// hours its own way: the dollies cross-fade their moon and sun, albatross
// blends through twilight and sunrise (adjectives/flat/daylight.js).
// Switching look swaps every mesh's material on the stage and the lights
// round it; the objects themselves know nothing about it.
//
// What to edit here:
//   LOOKS         the sky colors and lights of each look
//   the ground    the <mesh> with the circleGeometry
//   margin        on <Bounds>, how much air is left round an object

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { create } from "zustand";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useBounds } from "@react-three/drei";

// These came with the objects, so the stage lights them the way
// they were lit where they came from. Swap these for a different mood.
import { hue, PALETTE } from "../src/world/palette.js";
import { SUN, LIGHTING, KEY_DIR, bearingOn } from "../src/lighting.js";
import { SHADOW_TINT } from "../src/adjectives/unlit/toon.js";
import { flatMat } from "../src/adjectives/flat/material.js";
import { hourOf } from "../src/adjectives/flat/daylight.js";
import { HOLED } from "../src/nouns/water/Basin.jsx";
import { PLANET } from "../src/nouns/planet/objects.js";
import { SKY as PLANETS_SKY } from "../src/planets/worlds.js";

// The planets project's space: its own near-black.
const SPACE_BACKGROUND = PLANETS_SKY.background;

// The store. `node` is the React element to show (the story's object, or
// null when no story is open, e.g. on the About page); `storyId` says which
// story it came from, so the camera can tell "a new object" apart from "the
// same object with a slider moved"; `lighting` and `daylight` are the
// toolbar's choices.
export const useStage = create(() => ({
  node: null,
  storyId: null,
  lighting: "toon",
  daylight: 1,
  view: "default", // or "front" / "top": a story's parameters.stage.view
  ground: "flat", // or "planet" / "wide": a story's parameters.stage.ground
  lights: "look", // or "own": the story brings its own lights (the planets do)
  backdrop: "sky", // or "space": the planets' dark space, no ground
}));

// Where the lights stand. The dollies' sun and moon each have a bearing
// (elevation and azimuth, in degrees) in lighting.js; albatross's sun uses
// the dollies' sun bearing, and its rim light stands opposite and low.
const SUN_POS = bearingOn(new THREE.Vector3(0, 1, 0), SUN, new THREE.Vector3())
  .multiplyScalar(SUN.distance);
const MOON_POS = KEY_DIR.clone().multiplyScalar(LIGHTING.key.distance);
const RIM_POS = new THREE.Vector3(-SUN_POS.x, SUN_POS.y * 0.4, -SUN_POS.z);

const lerpHex = (a, b, f) =>
  "#" + new THREE.Color(a).lerp(new THREE.Color(b), f).getHexString();
// A color read off a list of stops [[at, hex], ...] at t.
const stopsAt = (stops, t) => {
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [a, ca] = stops[i], [b, cb] = stops[i + 1];
  return lerpHex(ca, cb, (t - a) / (b - a));
};

// The two looks. Each is a function of the hour t (0 night, 1 day) giving
// the sky color and a Lights component.
//
// TOON is the dollies' own: by night the moon is the key light and the sky's
// blue the ambient; by day the sun and its ambient; the game cross-fades
// the two, and so does this. The day sky is the library's pale blue (it
// matches the shell, theme.js); the night sky is the game's.
// FLAT is albatross's day: a skylight split into sky and ground colors, a
// sun, a rim, all read off its hour table.
const TOON_SKY = [
  [0, hue(PALETTE.sky.night).getStyle()],
  [0.45, "#6B5B8C"],
  [1, "#DDE4EA"],
];
const night = {
  ambient: hue(LIGHTING.ambient.color),
  key: hue(LIGHTING.key.color),
  shadow: hue(LIGHTING.shadow.tint),
};
const day = {
  ambient: hue(SUN.ambient.color),
  key: hue(SUN.color),
  shadow: hue(SUN.shadow.tint),
};
export const LOOKS = {
  toon: {
    sky: (t) => stopsAt(TOON_SKY, t),
    Lights: ({ t, shadow }) => {
      const ambient = useMemo(() => night.ambient.clone().lerp(day.ambient, t), [t]);
      useEffect(() => {
        // The toon shader's shadow tint is ONE shared color the game
        // cross-fades at dusk; the stage does the same.
        SHADOW_TINT.copy(night.shadow).lerp(day.shadow, t);
      }, [t]);
      return (
        <>
          <ambientLight
            color={ambient}
            intensity={THREE.MathUtils.lerp(LIGHTING.ambient.intensity, SUN.ambient.intensity, t)}
          />
          <directionalLight castShadow position={MOON_POS} color={night.key} intensity={LIGHTING.key.intensity * (1 - t)} {...shadow} />
          <directionalLight castShadow position={SUN_POS} color={day.key} intensity={SUN.intensity * t} {...shadow} />
        </>
      );
    },
  },
  flat: {
    sky: (t) => hourOf(t).sky,
    Lights: ({ t, shadow }) => {
      const h = useMemo(() => hourOf(t), [t]);
      return (
        <>
          <hemisphereLight color={h.hemiSky} groundColor={h.hemiGround} intensity={h.hemiPower} />
          <directionalLight castShadow position={SUN_POS} intensity={h.sunPower} color={h.sunColor} {...shadow} />
          <directionalLight position={RIM_POS} intensity={h.rimPower} color={h.rimColor} />
        </>
      );
    },
  },
};

// The sun's shadow: the box, in world units, inside which shadows are
// drawn. Make it bigger for bigger objects.
const shadowBox = (reach) => ({
  "shadow-mapSize": [2048, 2048],
  "shadow-camera-left": -reach,
  "shadow-camera-right": reach,
  "shadow-camera-top": reach,
  "shadow-camera-bottom": -reach,
  "shadow-camera-near": 1,
  "shadow-camera-far": 90 + reach * 2,
  "shadow-bias": -0.0002,
  // ...and the sample pushed along the surface's normal, so a smooth
  // form does not shadow itself in streaks where the light grazes it
  "shadow-normalBias": 0.04,
});
// 20 units round the origin for one object; the whole grid for "wide".
export const SHADOW = shadowBox(20);
const WIDE_SHADOW = shadowBox(120);

// Flags every mesh on the stage for shadows and swaps it to the look's
// materials. Toon materials
// are what the objects were made with, so "toon" means putting those back;
// "flat" means standing a flat material of the same color in for each,
// remembering the original on the mesh.
export function applyLook(scene, lighting) {
  scene.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    // Shadows. The objects do not flag themselves; in the game the lot
    // flags everything on it after each render, so the stage does the same.
    o.castShadow = true;
    o.receiveShadow = true;
    const one = !Array.isArray(o.material);
    const list = one ? [o.material] : o.material;
    if (lighting === "flat") {
      const out = list.map((m) => (m.isMeshToonMaterial ? flatMat(m.color, m) : m));
      if (out.some((m, i) => m !== list[i])) {
        o.userData.toonMaterial ??= o.material;
        o.material = one ? out[0] : out;
      }
    } else if (o.userData.toonMaterial) {
      o.material = o.userData.toonMaterial;
      delete o.userData.toonMaterial;
    }
  });
}

// Renders whatever object is in the store, and refits the camera to it.
function Slot() {
  const node = useStage((s) => s.node);
  const storyId = useStage((s) => s.storyId);
  const bounds = useBounds();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const view = useStage((s) => s.view);
  // Refit the camera when the OBJECT changes or the viewport resizes (the
  // Controls panel opening, say), but NOT when a slider moves: a color
  // change should not throw the view around. Bounds keeps the camera's
  // direction when it fits, so a story that wants a particular angle gets
  // the camera put there first (parameters.stage.view, see preview.jsx).
  //
  // An object with a NaN in it (a box given an undefined size, say) has no
  // bounds, and fitting the camera to none would put NaN into the camera
  // and the controls' target, and the stage stays blank for every story
  // after it until the page is reloaded. So the fit is skipped for one,
  // and the controls' target is put back on the ground, with a warning
  // naming the story.
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    if (!storyId) return;
    if (view === "front") camera.position.set(0, 2.5, 20);
    else if (view === "top") camera.position.set(0, 60, 36);
    else camera.position.set(14, 10, 18);
    if (controls?.target && !Number.isFinite(controls.target.lengthSq())) controls.target.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(scene);
    if (!Number.isFinite(box.min.lengthSq() + box.max.lengthSq())) {
      console.warn(`stage: ${storyId} has no finite bounds (a NaN size somewhere?); not fitting the camera to it`);
      camera.lookAt(0, 1, 0);
      return;
    }
    bounds.refresh().clip().fit();
  }, [storyId, size.width, size.height]);
  // The look, applied to whatever just mounted (or re-applied when the
  // toolbar changes it). A story that brings its own lights (the planets:
  // lights "own") keeps its own materials too, whatever the toolbar says:
  // the flat look is the albatross light, and the planets were never lit
  // by it, so swapping their toon shading for it drew them wrong in the
  // catalog's pictures (taken under the flat look) and right on the stage.
  const lighting = useStage((s) => s.lighting);
  const lights = useStage((s) => s.lights);
  useEffect(() => {
    applyLook(scene, lights === "own" ? "toon" : lighting);
  }, [scene, lighting, lights, node]);
  // For poking at the stage from the browser console: window.__stage.scene
  useEffect(() => {
    window.__stage = { scene, camera, bounds };
  }, [scene, camera, bounds]);
  return node;
}

function Stage() {
  const hasNode = useStage((s) => s.node !== null);
  const lighting = useStage((s) => s.lighting);
  const t = useStage((s) => s.daylight);
  const ground = useStage((s) => s.ground);
  const lights = useStage((s) => s.lights);
  const backdrop = useStage((s) => s.backdrop);
  const look = LOOKS[lighting] ?? LOOKS.toon;

  // Hide the stage when nothing is on it (docs pages), but wait a beat so
  // the one-frame gap between one story leaving and the next arriving does
  // not flicker.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (hasNode) return setShown(true);
    const t = setTimeout(() => setShown(false), 80);
    return () => clearTimeout(t);
  }, [hasNode]);

  // The toon shader tints its shadows with ONE shared color that
  // the game crossfades between night and day. The stage is always day, so
  // pin it there once.
  useEffect(() => {
    SHADOW_TINT.copy(hue(SUN.shadow.tint));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        visibility: shown ? "visible" : "hidden",
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      {/* `flat` turns tone mapping off, so colors come out as authored.
          `shadows="pcf"` is the plain shadow filter the toon shader wants. */}
      <Canvas
        flat
        shadows="pcf"
        dpr={[1, 2]}
        camera={{ fov: 40, near: 0.1, far: 2000, position: [14, 10, 18] }}
      >
        {/* The sky at this hour, or the planets' space (SPACE_BACKGROUND). */}
        <color attach="background" args={[backdrop === "space" ? SPACE_BACKGROUND : look.sky(t)]} />

        {/* The look's lights at this hour (see LOOKS), unless the story
            brought its own. */}
        {lights !== "own" && <look.Lights t={t} shadow={ground === "wide" ? WIDE_SHADOW : SHADOW} />}

        {/* The ground. Usually a flat disc, lying down (rotated -90° about
            x) and a hair below zero so objects standing at y=0 do not
            z-fight. A story may ask for the PLANET's ground instead: the
            top of a ball the planet's size, since water features are
            built to its curve (a pool's coping follows the ground falling
            away from its middle). Either wears HOLED, as the planet does,
            so a pool's stencil mask leaves its opening unpainted and the
            pool sits IN the ground rather than on it. */}
        {backdrop === "space" ? null : ground === "planet" ?
          <mesh receiveShadow position-y={-PLANET.radius - 0.01}>
            <sphereGeometry args={[PLANET.radius, 128, 64, 0, Math.PI * 2, 0, 0.7]} />
            <meshStandardMaterial color={hue(PALETTE.planet.ground)} {...HOLED} />
          </mesh>
        : <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.01}>
            {/* "wide" is the same disc, big enough for the whole catalog. */}
            <circleGeometry args={[ground === "wide" ? 400 : 18, 64]} />
            <meshStandardMaterial color={hue(PALETTE.planet.ground)} {...HOLED} />
          </mesh>
        }

        {/* Bounds measures whatever is inside it so Slot can fit the
            camera; `margin` is how much bigger than the object the frame
            is (1 = edge to edge). */}
        <Bounds margin={1.6}>
          <Suspense fallback={null}>
            <Slot />
          </Suspense>
        </Bounds>

        {/* Drag to orbit, scroll to zoom. maxPolarAngle stops the camera
            going under the ground. */}
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
}

// Mounts the stage the first time it is asked for, and never again.
let root = null;
export function ensureStage() {
  if (root || typeof document === "undefined") return;
  const el = document.createElement("div");
  el.id = "object-stage";
  document.body.appendChild(el);
  root = createRoot(el);
  root.render(<Stage />);
}
