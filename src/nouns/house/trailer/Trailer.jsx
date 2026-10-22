import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../../world/merge.js";
import { LIGHT } from "../../../adjectives/lit/objects.js";
import { unlitMat } from "../../../adjectives/unlit/material.js";
import Primitive from "../../primitive/Primitive.jsx";
import { useBody } from "../../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../../player/solids.js";
import { Window, Door } from "../House.jsx";
import { TRAILER } from "./objects.js";

// The shell is a cube pressed to `width` by `height` by `depth`, built at
// half its width so its clay has facets the whole way along.
const bodyFormOf = (B) => ({
  widen: 1,
  tall: B.height / B.width,
  deepen: B.depth / B.width,
});

// Where the roof's top is, off the ground.
const roofTopOf = (T) => T.body.lift + T.body.height + T.roof.thickness;

// How tall the trailer stands off its ground, for the posts to clear: the
// roof, or the vent on it.
export function trailerHeightOf(T) {
  const V = T.roof.vent;
  return roofTopOf(T) + (V ? V.height : 0);
}

// How far out from its middle it spreads, across (x) and along (z), for
// the player to be kept out of and the grass to keep back from: the
// shell, and the hitch out past its end.
export function trailerFootprintOf(T) {
  const B = T.body;
  return {
    x: B.width / 2 + (T.hitch ? T.hitch.length : 0),
    z: B.depth / 2,
  };
}

// One trailer, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of TRAILER's fields for this one instance.
export default function Trailer({ config }) {
  const T = useMemo(() => merge(TRAILER, config), [config]);
  const B = T.body;
  const S = T.stripe;
  const R = T.roof;
  const W = T.wheels;
  const H = T.hitch;

  // Solid to the player, up to the roof: registered by where it actually
  // IS, so it may sit anywhere in the tree — a box the shell's size,
  // turned the way the trailer is.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    root.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + roofTopOf(T),
      frame: turn,
      halfWidth: B.width / 2,
      halfLength: B.depth / 2,
    });
    return () => unregisterSolid(solid);
  }, [T, B, ball]);

  const bodyForm = useMemo(() => bodyFormOf(B), [B]);
  const face = B.depth / 2;
  const floor = B.lift;
  // Inside: the shell's color, the roof's underfoot, and its own rooms.
  const room = useMemo(
    () => ({
      walls: B.color,
      floor: R.color,
      rooms: T.interior.rooms,
      ways: {
        arch: T.interior.arch,
        door: T.interior.door,
        window: T.interior.window,
      },
      door: T.door,
      window: T.window,
    }),
    [B, R, T.interior, T.door, T.window],
  );
  return (
    <group ref={root}>
      <group position-y={floor + B.height / 2}>
        <Primitive
          shape="cube"
          radius={B.width / 2}
          detail={B.detail}
          form={bodyForm}
          clay={B.clay}
          swatch={B.color}
          light={LIGHT}
        />
      </group>
      {S && (
        <mesh position-y={floor + S.y * B.height} material={unlitMat(S.color)}>
          <boxGeometry args={[B.width - 0.6, S.height, B.depth + 2 * S.out]} />
        </mesh>
      )}
      <mesh
        position-y={floor + B.height + R.thickness / 2 - 0.16}
        material={unlitMat(R.color)}
      >
        <boxGeometry
          args={[B.width - 2 * R.inset, R.thickness, B.depth - 2 * R.inset]}
        />
      </mesh>
      {R.vent && (
        <mesh
          position={[R.vent.x, roofTopOf(T) + R.vent.height / 2 - 0.08, 0]}
          material={unlitMat(R.vent.color)}
        >
          <cylinderGeometry
            args={[R.vent.radius, R.vent.radius, R.vent.height, 10]}
          />
        </mesh>
      )}
      {/* The door's foot is on the trailer's floor, and the window is
          measured off it too. */}
      <group position={[T.door.x, floor, 0]}>
        <Door D={T.door} face={face} room={room} />
      </group>
      <group position-y={floor}>
        <Window W={T.window} x={T.window.x} face={face} />
      </group>
      {W &&
        [-1, 1].map((side) => (
          <group
            key={side}
            position={[W.x, W.radius, side * (face - W.width / 2)]}
            rotation-x={Math.PI / 2}
          >
            <mesh material={unlitMat(W.color)}>
              <cylinderGeometry args={[W.radius, W.radius, W.width, 14]} />
            </mesh>
            <mesh
              position-y={side * (W.width / 2 + W.hub.depth / 2)}
              material={unlitMat(W.hub.color)}
            >
              <cylinderGeometry
                args={[W.hub.radius, W.hub.radius, W.hub.depth, 10]}
              />
            </mesh>
          </group>
        ))}
      {H && (
        <group position-x={-B.width / 2}>
          <mesh
            position={[-H.length / 2, H.y, 0]}
            rotation-z={Math.PI / 2}
            material={unlitMat(H.color)}
          >
            <cylinderGeometry args={[H.radius, H.radius, H.length, 8]} />
          </mesh>
          {/* The jockey wheel: a leg down from near the bar's end, and
              the little wheel under it. */}
          <mesh
            position={[-H.length + 0.6, (H.y + H.wheel.radius) / 2, 0]}
            material={unlitMat(H.color)}
          >
            <cylinderGeometry
              args={[H.radius * 0.7, H.radius * 0.7, H.y - H.wheel.radius, 8]}
            />
          </mesh>
          <mesh
            position={[-H.length + 0.6, H.wheel.radius, 0]}
            rotation-x={Math.PI / 2}
            material={unlitMat(W ? W.color : H.color)}
          >
            <cylinderGeometry
              args={[H.wheel.radius, H.wheel.radius, H.wheel.width, 10]}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
