import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { registerSeat, unregisterSeat } from "../../player/seats.js";
import Pattern from "../pattern/Pattern.jsx";
import { COUCH } from "./objects.js";

// A box `width` by `height` by `depth`, as a cube pressed to it: built at
// half its width so its clay has facets the whole way along, then
// squashed to its own height and depth (see FORM).
const boxOf = (width, height, depth) => ({
  radius: width / 2,
  form: { widen: 1, tall: height / width, deepen: depth / width },
});

// Where everything stands, off the ground: the base from the legs' tops,
// the cushions on the base, the arms and back cushions up from there.
function layoutOf(C) {
  const B = C.base;
  const G = C.legs;
  const A = C.arms;
  const S = C.cushions;
  const K = C.back;
  const P = C.pillows;
  const baseTop = G.height + B.height;
  const armTop = baseTop + A.height;
  // The seat cushions share the base between the arms, less the back
  // cushions' room behind them and the inset in front.
  const span = B.width - 2 * A.width;
  const wide = (span - S.spacing * (S.count - 1)) / S.count;
  if (!(wide > 0))
    throw new Error(
      `COUCH.cushions: ${S.count} cushions with ${S.spacing} between do not fit between the arms in a width of ${B.width}`,
    );
  const deep = B.depth - K.thickness - S.inset;
  const seatTop = baseTop - S.sink + S.thickness;
  const backTop = baseTop - K.sink + K.height;
  // The throw pillows: square, stood on the seat at each end against
  // the back cushions' fronts, leaning back with them, and turned about
  // their own faces. Turned, a pillow stands taller than its side — up
  // to its diagonal, set on a corner — so its lowest point stays on the
  // seat: `stand` is how far its middle is above that point.
  const pillowLean = THREE.MathUtils.degToRad(K.lean + P.lean);
  const pillowTurn = THREE.MathUtils.degToRad(P.turn);
  const stand =
    (P.size / 2) *
    (Math.abs(Math.cos(pillowTurn)) + Math.abs(Math.sin(pillowTurn)));
  const backFront = -B.depth / 2 + K.thickness;
  const xs = Array.from(
    { length: S.count },
    (_, i) => -span / 2 + wide / 2 + i * (wide + S.spacing),
  );
  return {
    baseTop,
    armTop,
    seatTop,
    backTop,
    xs,
    cushion: {
      ...boxOf(wide, S.thickness, deep),
      wide,
      deep,
      y: baseTop - S.sink + S.thickness / 2,
      z: B.depth / 2 - S.inset - deep / 2,
    },
    pillow: {
      ...boxOf(P.size, P.size, P.thickness),
      x: P.spread / 2,
      y: seatTop + stand * Math.cos(pillowLean) - P.thickness / 2,
      z: backFront + P.thickness / 2 + stand * Math.sin(pillowLean),
      lean: K.lean + P.lean,
      turn: P.turn,
    },
    back: {
      ...boxOf(wide, K.height, K.thickness),
      y: baseTop - K.sink + K.height / 2,
      z: -B.depth / 2 + K.thickness / 2,
    },
    arm: {
      ...boxOf(A.width, B.height + A.height, B.depth),
      x: B.width / 2 - A.width / 2,
      y: G.height + (B.height + A.height) / 2,
    },
    base: {
      ...boxOf(span, B.height, B.depth),
      y: G.height + B.height / 2,
    },
    leg: {
      x: B.width / 2 - G.inset,
      z: B.depth / 2 - G.inset,
      form: { tall: G.height / (2 * G.radius) },
      y: G.height / 2,
    },
  };
}

// How tall the couch stands off its ground, for the posts to clear: the
// arms or the back cushions, whichever is higher.
export function couchHeightOf(C) {
  const L = layoutOf(C);
  return Math.max(L.armTop, L.backTop);
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the base's edges.
export function couchFootprintOf(C) {
  return { x: C.base.width / 2, z: C.base.depth / 2 };
}

// Where the four legs stand: one under each corner.
const CORNERS = [
  { x: -1, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: 1, z: 1 },
];

// One couch, standing on the ground at y = 0 with its length running x
// and its front facing +z. `config` overrides any of COUCH's fields for
// this one instance.
export default function Couch({ config }) {
  const C = useMemo(() => merge(COUCH, config), [config]);
  const L = useMemo(() => layoutOf(C), [C]);

  // Solid to the player, and a seat: registered by where it actually IS,
  // so it may sit anywhere in the tree — the way a bench is (see
  // ../bench/Bench.jsx). Three boxes — the seat, the whole base up to
  // the cushions' tops, the back cushions up to their tops, and each arm
  // up to its top — and the seat again as a place to sit, facing the
  // couch's front.
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
    // A spot in the couch's own plane, as a direction from the ball's
    // center.
    const dirAt = (x, z) =>
      new THREE.Vector3(x, 0, z).applyQuaternion(turn).add(at).normalize();
    const B = C.base;
    const seat = {
      body: ball,
      dir: dirAt(0, 0),
      top: ground + L.seatTop,
      frame: turn,
      halfWidth: B.width / 2,
      halfLength: B.depth / 2,
    };
    const solids = [
      registerSolid(seat),
      registerSolid({
        body: ball,
        dir: dirAt(0, L.back.z),
        top: ground + L.backTop,
        frame: turn,
        halfWidth: B.width / 2 - C.arms.width,
        halfLength: C.back.thickness / 2,
      }),
      ...[-1, 1].map((side) =>
        registerSolid({
          body: ball,
          dir: dirAt(side * L.arm.x, 0),
          top: ground + L.armTop,
          frame: turn,
          halfWidth: C.arms.width / 2,
          halfLength: B.depth / 2,
        }),
      ),
    ];
    const sit = registerSeat(seat);
    return () => {
      solids.forEach(unregisterSolid);
      unregisterSeat(sit);
    };
  }, [C, L, ball]);

  const B = C.base;
  const G = C.legs;
  const A = C.arms;
  const S = C.cushions;
  const K = C.back;
  const P = C.pillows;
  const paint = C.colors;
  return (
    <group ref={root}>
      {CORNERS.map(({ x, z }, i) => (
        <group key={i} position={[x * L.leg.x, L.leg.y, z * L.leg.z]}>
          <Primitive
            shape={G.shape}
            radius={G.radius}
            detail={G.detail}
            form={L.leg.form}
            clay={G.clay}
            swatch={paint.legs}
            light={LIGHT}
          />
        </group>
      ))}
      <group position-y={L.base.y}>
        <Primitive
          shape="cube"
          radius={L.base.radius}
          detail={B.detail}
          form={L.base.form}
          clay={B.clay}
          swatch={paint.frame}
          light={LIGHT}
        />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * L.arm.x, L.arm.y, 0]}>
          <Primitive
            shape="cube"
            radius={L.arm.radius}
            detail={A.detail}
            form={L.arm.form}
            clay={A.clay}
            swatch={paint.frame}
            light={LIGHT}
          />
        </group>
      ))}
      {L.xs.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <group position={[0, L.cushion.y, L.cushion.z]}>
            <Primitive
              shape="cube"
              radius={L.cushion.radius}
              detail={S.detail}
              form={L.cushion.form}
              clay={S.clay}
              swatch={paint.cushions}
              light={LIGHT}
            />
            {/* Its pattern, on its top. */}
            <group position-y={S.thickness / 2}>
              <Pattern
                width={L.cushion.wide}
                length={L.cushion.deep}
                pattern={S.pattern}
              />
            </group>
          </group>
          {/* Leaning back a little, about its own middle — its pattern
            on its front, leaning with it: the pattern lies flat, so it
            is stood up to face +z. */}
          <group position={[0, L.back.y, L.back.z]}>
            <Primitive
              shape="cube"
              radius={L.back.radius}
              detail={K.detail}
              form={L.back.form}
              clay={K.clay}
              rotation={{ x: -K.lean }}
              swatch={paint.cushions}
              light={LIGHT}
            />
            <group rotation-x={THREE.MathUtils.degToRad(-K.lean)}>
              <group position-z={K.thickness / 2} rotation-x={Math.PI / 2}>
                <Pattern
                  width={L.cushion.wide}
                  length={K.height}
                  pattern={S.pattern}
                />
              </group>
            </group>
          </group>
        </group>
      ))}
      {/* The square throw pillows, `count` of them spread evenly along the
        back (two: one at each end; one: in the middle), leaning on it,
        each turned about its own face — the turn first, then the lean
        (an XYZ euler turns z before x), so it twists where it stands;
        the turn goes with which side of the middle the pillow is on. */}
      {Array.from({ length: P.count ?? 2 }, (_, i) => ((P.count ?? 2) === 1 ? 0 : -1 + (2 * i) / ((P.count ?? 2) - 1))).map((side, i) => (
        <group
          key={i}
          position={[side * L.pillow.x, L.pillow.y, L.pillow.z]}
        >
          <Primitive
            shape="cube"
            radius={L.pillow.radius}
            detail={P.detail}
            form={L.pillow.form}
            clay={P.clay}
            rotation={{ x: -L.pillow.lean, z: side * L.pillow.turn }}
            swatch={paint.pillows}
            light={LIGHT}
          />
          {/* Its pattern, on its front, turned and leaning with it —
            the same euler the pillow itself takes. */}
          <group
            rotation={[
              THREE.MathUtils.degToRad(-L.pillow.lean),
              0,
              THREE.MathUtils.degToRad(side * L.pillow.turn),
            ]}
          >
            <group position-z={P.thickness / 2} rotation-x={Math.PI / 2}>
              <Pattern width={P.size} length={P.size} pattern={P.pattern} />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
