import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { registerSeat, unregisterSeat } from "../../player/seats.js";
import { CHAIR } from "./objects.js";

// A box `width` by `height` by `depth`, as a cube pressed to it: built at
// half its width so its clay has facets the whole way along, then
// squashed to its own height and depth (see FORM).
const boxOf = (width, height, depth) => ({
  radius: width / 2,
  form: { widen: 1, tall: height / width, deepen: depth / width },
});

// Where the seat's top is, off the ground.
const seatTopOf = (C) => C.legs.height + C.seat.thickness;

// How tall the chair stands off its ground, for the posts to clear: the
// top of the back.
export function chairHeightOf(C) {
  return seatTopOf(C) - C.back.sink + C.back.height;
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the seat's edges.
export function chairFootprintOf(C) {
  return { x: C.seat.width / 2, z: C.seat.depth / 2 };
}

// Where the four legs stand: one under each corner.
const CORNERS = [
  { x: -1, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: 1, z: 1 },
];

// One chair, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of CHAIR's fields for this one instance.
export default function Chair({ config }) {
  const C = useMemo(() => merge(CHAIR, config), [config]);
  const S = C.seat;
  const G = C.legs;
  const K = C.back;
  const paint = C.colors;

  // Solid to the player, and a seat: registered by where it actually IS,
  // so it may sit anywhere in the tree — the way a bench is. The seat up
  // to its top, the back up to its own, and the seat again as a place to
  // sit, facing the chair's front.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    root.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const ground = at.length() - ball.radius;
    const dirAt = (x, z) =>
      new THREE.Vector3(x, 0, z).applyQuaternion(turn).add(at).normalize();
    const seat = {
      body: ball,
      dir: dirAt(0, 0),
      top: ground + seatTopOf(C),
      frame: turn,
      halfWidth: S.width / 2,
      halfLength: S.depth / 2,
    };
    const solids = [
      registerSolid(seat),
      registerSolid({
        body: ball,
        dir: dirAt(0, -S.depth / 2 + K.thickness / 2),
        top: ground + chairHeightOf(C),
        frame: turn,
        halfWidth: S.width / 2,
        halfLength: K.thickness / 2,
      }),
    ];
    const sit = registerSeat(seat);
    return () => {
      solids.forEach(unregisterSolid);
      unregisterSeat(sit);
    };
  }, [C, S, K, ball]);

  const seat = useMemo(() => boxOf(S.width, S.thickness, S.depth), [S]);
  const back = useMemo(() => boxOf(S.width, K.height, K.thickness), [S, K]);
  const legForm = useMemo(() => ({ tall: G.height / (2 * G.radius) }), [G]);
  const top = seatTopOf(C);
  return (
    <group ref={root}>
      {CORNERS.map(({ x, z }, i) => (
        <group
          key={i}
          position={[
            x * (S.width / 2 - G.inset),
            G.height / 2,
            z * (S.depth / 2 - G.inset),
          ]}
        >
          <Primitive
            shape={G.shape}
            radius={G.radius}
            detail={G.detail}
            form={legForm}
            clay={G.clay}
            swatch={paint.frame}
            light={LIGHT}
          />
        </group>
      ))}
      <group position-y={G.height + S.thickness / 2}>
        <Primitive
          shape="cube"
          radius={seat.radius}
          detail={S.detail}
          form={seat.form}
          clay={S.clay}
          swatch={paint.seat}
          light={LIGHT}
        />
      </group>
      {/* Leaning back a little, about its own middle. */}
      <group
        position={[
          0,
          top - K.sink + K.height / 2,
          -S.depth / 2 + K.thickness / 2,
        ]}
      >
        <Primitive
          shape="cube"
          radius={back.radius}
          detail={K.detail}
          form={back.form}
          clay={K.clay}
          rotation={{ x: -K.lean }}
          swatch={paint.frame}
          light={LIGHT}
        />
      </group>
    </group>
  );
}
