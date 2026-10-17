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
// What to edit here:
//   SKY           the viewport background colour
//   the lights    inside <Stage>, if you want a different mood
//   the ground    the <mesh> with the circleGeometry
//   margin        on <Bounds>, how much air is left round an object

import React, { Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { create } from "zustand";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useBounds } from "@react-three/drei";

// These come from the dollies project so the stage lights objects the way
// the game does. Another project could bring its own lighting; swap these.
import { hue, PALETTE } from "@world/palette.js";
import { SUN, bearingOn } from "@dollies/refactored/lighting.js";
import { SHADOW_TINT } from "@dollies/refactored/adjectives/unlit/toon.js";

// The store. Two fields: `node` is the React element to show (the story's
// object, or null when no story is open, e.g. on the About page), and
// `storyId` says which story it came from, so the camera can tell "a new
// object" apart from "the same object with a slider moved".
export const useStage = create(() => ({ node: null, storyId: null }));

// Where the sun is: the project's own bearing (elevation + azimuth, in
// degrees) turned into a position `distance` units away from the origin.
const SUN_POS = bearingOn(new THREE.Vector3(0, 1, 0), SUN, new THREE.Vector3())
  .multiplyScalar(SUN.distance);

// The viewport background. Chosen to sit with the shell's palette in
// theme.js; change both if you change one.
const SKY = "#DDE4EA";

// Renders whatever object is in the store, and refits the camera to it.
function Slot() {
  const node = useStage((s) => s.node);
  const storyId = useStage((s) => s.storyId);
  const bounds = useBounds();
  const size = useThree((s) => s.size);
  // Refit when the OBJECT changes or the viewport resizes (the Controls
  // panel opening, say), but NOT when a slider moves: a colour change
  // should not throw the view around.
  useEffect(() => {
    if (storyId) bounds.refresh().clip().fit();
  }, [storyId, size.width, size.height]);
  return node;
}

function Stage() {
  const hasNode = useStage((s) => s.node !== null);

  // Hide the stage when nothing is on it (docs pages), but wait a beat so
  // the one-frame gap between one story leaving and the next arriving does
  // not flicker.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (hasNode) return setShown(true);
    const t = setTimeout(() => setShown(false), 80);
    return () => clearTimeout(t);
  }, [hasNode]);

  // The dollies toon shader tints its shadows with ONE shared colour that
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
      {/* `flat` turns tone mapping off, so colours come out as authored.
          `shadows="pcf"` is the plain shadow filter the toon shader wants. */}
      <Canvas
        flat
        shadows="pcf"
        dpr={[1, 2]}
        camera={{ fov: 40, near: 0.1, far: 200, position: [14, 10, 18] }}
      >
        <color attach="background" args={[SKY]} />

        {/* Lights: a soft fill from everywhere, and the sun, which casts
            the shadows. The shadow-camera-* numbers are the box, in world
            units, inside which shadows are drawn; make it bigger for
            bigger objects. */}
        <ambientLight
          intensity={SUN.ambient.intensity}
          color={hue(SUN.ambient.color)}
        />
        <directionalLight
          castShadow
          position={SUN_POS}
          intensity={SUN.intensity}
          color={hue(SUN.color)}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={1}
          shadow-camera-far={90}
          shadow-bias={-0.0002}
        />

        {/* The ground: a flat disc, lying down (rotated -90° about x) and
            a hair below zero so objects standing at y=0 do not z-fight. */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.01}>
          <circleGeometry args={[18, 64]} />
          <meshStandardMaterial color={hue(PALETTE.planet.ground)} />
        </mesh>

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
