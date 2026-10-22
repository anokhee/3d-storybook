import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { primitiveExtent } from "../primitive/geometry.js";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { registerSeat, unregisterSeat } from "../../player/seats.js";
import { BENCH } from "./objects.js";

// A leg is `height` tall: its `form` pressed to that along y — a primitive
// stands two radii tall — over whatever else the form says.
const legFormOf = (G) => ({ ...G.form, tall: G.height / (2 * G.radius) });

// Where a leg's foot and crown really are once formed, so it can be stood
// on the ground by what it is rather than by its nominal size.
const legExtentOf = (G) =>
  primitiveExtent(
    G.shape,
    G.radius,
    undefined,
    G.detail,
    legFormOf(G),
    undefined,
    G.clay,
  );

// The seat is `count` slats sharing its `depth` front to back with
// `spacing` between, so one slat is the whole depth and two are each half
// of it less the gap. Each is a cube pressed flat: built at half its width
// so its clay has facets the whole way along, then squashed across and
// through to its own depth and `thickness`.
const seatRadiusOf = (S) => S.width / 2;
const seatSlatDepthOf = (S) => {
  const deep = (S.depth - S.spacing * (S.count - 1)) / S.count;
  if (!(deep > 0))
    throw new Error(
      `BENCH.seat: ${S.count} slats with ${S.spacing} between do not fit in a depth of ${S.depth}`,
    );
  return deep;
};
const seatFormOf = (S) => ({
  widen: 1,
  deepen: seatSlatDepthOf(S) / S.width,
  tall: S.thickness / S.width,
});
// Where each slat's middle lies across the seat, back to front.
const seatSlatsOf = (S) => {
  const deep = seatSlatDepthOf(S);
  return Array.from(
    { length: S.count },
    (_, i) => -S.depth / 2 + deep / 2 + i * (deep + S.spacing),
  );
};
const seatExtentOf = (S) =>
  primitiveExtent(
    "cube",
    seatRadiusOf(S),
    undefined,
    S.detail,
    seatFormOf(S),
    undefined,
    S.clay,
  );

// Where the legs' tops meet the seat's underside, off the ground.
const legTopOf = (B) => {
  const G = B.legs;
  const e = legExtentOf(G);
  return e.top - e.bottom - G.sink;
};

// Where the seat's top is, off the ground.
const seatTopOf = (B) => {
  const e = seatExtentOf(B.seat);
  return legTopOf(B) + e.top - e.bottom;
};

// The frame's bars are `height` tall along their own y — a primitive stands
// two radii tall.
const barFormOf = (F) => ({ ...F.form, tall: F.height / (2 * F.radius) });
const barExtentOf = (F) =>
  primitiveExtent(
    F.shape,
    F.radius,
    undefined,
    F.detail,
    barFormOf(F),
    undefined,
    F.clay,
  );

// Where the frame stands: just behind the seat's back edge, touching it,
// each bar's foot set into the seat's top.
const frameOf = (B) => {
  const F = B.backFrame;
  const bar = barExtentOf(F);
  const foot = seatTopOf(B) - F.sink;
  return {
    z: -(B.seat.depth / 2 + F.radius),
    lift: foot - bar.bottom,
    top: foot + bar.top - bar.bottom,
  };
};

// The armrests: each an arm lying forward along z from the frame's bar,
// `height` above the seat, and a post at its front end standing on the
// seat. Both bars are built standing along their own y — a primitive
// stands two radii tall — and the arm is turned to lie along z. The arm
// starts at the bar's front face rather than its middle, touching it and
// never inside it, and owns the corner at the other end: it runs on past
// the post's middle to its front face, and the post stops at the arm's
// underside, so the two meet in a square L rather than the post poking up
// through the arm. Null when the bench has none.
const armrestsOf = (B) => {
  const A = B.armrests;
  if (!A) return null;
  const F = B.backFrame;
  const top = seatTopOf(B);
  const foot = top - A.sink;
  const y = top + A.height;
  const back = -(B.seat.depth / 2 + F.radius);
  // From the bar's front face to the post's: the post has to stand clear
  // of the bar for there to be an arm between them at all.
  const start = back + F.radius;
  const armLength = A.length + A.radius - F.radius;
  if (!(A.length - A.radius > F.radius))
    throw new Error(
      `BENCH.armrests: a length of ${A.length} puts the post inside the back frame's bar — it needs more than ${F.radius + A.radius}`,
    );
  const postLength = y - A.radius - foot;
  return {
    x: F.apart,
    arm: {
      form: { ...A.form, tall: armLength / (2 * A.radius) },
      position: [0, y, start + armLength / 2],
    },
    post: {
      form: { ...A.form, tall: postLength / (2 * A.radius) },
      position: [0, foot + postLength / 2, back + A.length],
    },
  };
};

// The back's slats: `count` of them sharing `height` with `spacing`
// between, so one slat is the whole height and two are each half of it
// less the gap. Each is a cube pressed flat, built at half its width — the
// span between the frame's bars, so its ends are buried in them — and
// stacked from `lift` above the seat's top, in the bars' own plane.
const slatsOf = (B) => {
  const K = B.back;
  const width = 2 * B.backFrame.apart;
  const tall = (K.height - K.spacing * (K.count - 1)) / K.count;
  if (!(tall > 0))
    throw new Error(
      `BENCH.back: ${K.count} slats with ${K.spacing} between do not fit in a height of ${K.height}`,
    );
  const foot = seatTopOf(B) + K.lift;
  return {
    radius: width / 2,
    form: { widen: 1, deepen: K.thickness / width, tall: tall / width },
    ys: Array.from(
      { length: K.count },
      (_, i) => foot + tall / 2 + i * (tall + K.spacing),
    ),
  };
};

// How tall the bench stands off its ground, for the posts to clear: the top
// of the frame.
export function benchHeightOf(B) {
  return frameOf(B).top;
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the far edge of the far leg, or of the
// seat, whichever is further.
export function benchFootprintOf(B) {
  const G = B.legs;
  const S = B.seat;
  const F = B.backFrame;
  const A = B.armrests;
  return {
    x: Math.max(
      G.apart.x + G.radius,
      S.width / 2,
      F.apart + F.radius,
      A ? F.apart + A.radius : 0,
    ),
    z: Math.max(
      G.apart.z + G.radius,
      S.depth / 2,
      S.depth / 2 + 2 * F.radius,
      A ? A.length + A.radius - S.depth / 2 - F.radius : 0,
    ),
  };
}

// Where the four legs stand: one at each corner, `apart` from the middle.
const CORNERS = [
  { x: -1, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: 1, z: 1 },
];

// One bench, standing on the ground at y = 0 with its length running x and
// its front facing +z. `config` overrides any of BENCH's fields for this
// one instance.
export default function Bench({ config }) {
  const B = useMemo(() => merge(BENCH, config), [config]);

  // Solid to the player, and a seat: registered by where it actually IS,
  // so it may sit anywhere in the tree. Two boxes — the seat, its whole
  // width and depth up to its top, and the back, the frame's bars and the
  // slats between them up to the bars' tops — and the seat again as a
  // place to sit, facing the bench's front.
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
    // A spot in the bench's own plane, as a direction from the ball's center.
    const dirAt = (x, z) =>
      new THREE.Vector3(x, 0, z).applyQuaternion(turn).add(at).normalize();
    const S = B.seat;
    const F = B.backFrame;
    const seat = {
      body: ball,
      dir: dirAt(0, 0),
      top: ground + seatTopOf(B),
      frame: turn,
      halfWidth: S.width / 2,
      halfLength: S.depth / 2,
    };
    const frame = frameOf(B);
    const solids = [
      registerSolid(seat),
      registerSolid({
        body: ball,
        dir: dirAt(0, frame.z),
        top: ground + frame.top,
        frame: turn,
        halfWidth: F.apart + F.radius,
        halfLength: F.radius,
      }),
    ];
    const sit = registerSeat(seat);
    return () => {
      solids.forEach(unregisterSolid);
      unregisterSeat(sit);
    };
  }, [B, ball]);

  const G = B.legs;
  // Each leg is built about its own middle: lifted so its foot meets the
  // ground, less what is sunk into it.
  const lift = useMemo(() => -legExtentOf(G).bottom - G.sink, [G]);
  const form = useMemo(() => legFormOf(G), [G]);
  // The seat, built about its own middle too: lifted so its underside
  // rests on the legs' tops.
  const S = B.seat;
  const seatLift = useMemo(() => legTopOf(B) - seatExtentOf(S).bottom, [B, S]);
  const seatForm = useMemo(() => seatFormOf(S), [S]);
  const seatSlats = useMemo(() => seatSlatsOf(S), [S]);
  // The back frame: two bars standing up from the seat, one at each end.
  const F = B.backFrame;
  const frame = useMemo(() => frameOf(B), [B]);
  const barForm = useMemo(() => barFormOf(F), [F]);
  // The back: its slats stacked between the bars.
  const K = B.back;
  const slats = useMemo(() => slatsOf(B), [B]);
  // The armrests, one each end, if any.
  const A = B.armrests;
  const arms = useMemo(() => armrestsOf(B), [B]);
  return (
    <group ref={root}>
      {arms &&
        [-1, 1].map((side) => (
          <group key={side} position={[side * arms.x, 0, 0]}>
            <group position={arms.arm.position}>
              <Primitive
                shape={A.shape}
                radius={A.radius}
                detail={A.detail}
                form={arms.arm.form}
                clay={A.clay}
                rotation={{ x: 90 }}
                swatch={A.color}
                light={LIGHT}
              />
            </group>
            <group position={arms.post.position}>
              <Primitive
                shape={A.shape}
                radius={A.radius}
                detail={A.detail}
                form={arms.post.form}
                clay={A.clay}
                swatch={A.color}
                light={LIGHT}
              />
            </group>
          </group>
        ))}
      {slats.ys.map((y, i) => (
        <group key={i} position={[0, y, frame.z]}>
          <Primitive
            shape="cube"
            radius={slats.radius}
            detail={K.detail}
            form={slats.form}
            clay={K.clay}
            swatch={K.color}
            light={LIGHT}
          />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * F.apart, frame.lift, frame.z]}>
          <Primitive
            shape={F.shape}
            radius={F.radius}
            detail={F.detail}
            form={barForm}
            clay={F.clay}
            swatch={F.color}
            light={LIGHT}
          />
        </group>
      ))}
      {seatSlats.map((z, i) => (
        <group key={i} position={[0, seatLift, z]}>
          <Primitive
            shape="cube"
            radius={seatRadiusOf(S)}
            detail={S.detail}
            form={seatForm}
            clay={S.clay}
            swatch={S.color}
            light={LIGHT}
          />
        </group>
      ))}
      {CORNERS.map(({ x, z }, i) => (
        <group key={i} position={[x * G.apart.x, lift, z * G.apart.z]}>
          <Primitive
            shape={G.shape}
            radius={G.radius}
            detail={G.detail}
            form={form}
            clay={G.clay}
            swatch={G.color}
            light={LIGHT}
          />
        </group>
      ))}
    </group>
  );
}
