import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { registerDoor, unregisterDoor } from "../../player/doors.js";
import { useThing } from "../station/thing.js";
import { HOUSE, indoorWindowOf } from "./objects.js";
import { Muntins, WindowPane } from "./Panes.jsx";

// The gable's slopes: how long each runs from eave to ridge, and how
// steeply — the angle it climbs off the level.
const slopeOf = (B) => {
  const run = B.width / 2;
  const rise = B.gableHeight;
  return { length: Math.hypot(run, rise), angle: Math.atan2(rise, run) };
};

// Where the ridge lies off the ground, once the body is sunk.
const ridgeOf = (B) => B.wallHeight + B.gableHeight - B.sink;

// The pentagon — a square with a gable on it, its foot on y = 0 — pulled
// out `depth` along z and centered on it, so the front face lies at
// z = depth / 2. Cached by its sizes, like a primitive's geometry.
const bodies = new Map();
function bodyGeometry(B) {
  const key = `${B.width}:${B.depth}:${B.wallHeight}:${B.gableHeight}`;
  if (bodies.has(key)) return bodies.get(key);
  const w = B.width / 2;
  const shape = new THREE.Shape()
    .moveTo(-w, 0)
    .lineTo(w, 0)
    .lineTo(w, B.wallHeight)
    .lineTo(0, B.wallHeight + B.gableHeight)
    .lineTo(-w, B.wallHeight);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: B.depth,
    bevelEnabled: false,
  }).translate(0, 0, -B.depth / 2);
  g.computeVertexNormals();
  g.computeBoundingBox();
  bodies.set(key, g);
  return g;
}

// The two roof slabs: each a box laid along its slope, its length the slope
// plus `overhang` down past the eave, its width the depth plus `eaves` out
// past each face, stood off the slope by half its own thickness — as
// `{ position, rotation, size }` for a box built about its middle. The
// right slope climbs from (+w, eaves) to the ridge, so its slab is turned
// back by the slope's angle; the left one forward.
function slabsOf(H) {
  const B = H.body;
  const R = H.roof;
  const { length, angle } = slopeOf(B);
  const w = B.width / 2;
  const eave = B.wallHeight - B.sink;
  const ridge = ridgeOf(B);
  return [-1, 1].map((side) => {
    // Along the slope, from the ridge down: a unit step and the outward
    // normal, on this side.
    const along = { x: (side * w) / length, y: -B.gableHeight / length };
    const out = { x: side * Math.sin(angle), y: Math.cos(angle) };
    const total = length + R.overhang;
    const mid = total / 2;
    return {
      position: [
        along.x * mid + (out.x * R.thickness) / 2,
        ridge + along.y * mid + (out.y * R.thickness) / 2,
        0,
      ],
      rotation: [0, 0, -side * angle],
      size: [total, R.thickness, B.depth + 2 * R.eaves],
    };
  });
}
// And the eave's far corner, once the slab hangs past it: how far out
// from the middle the roof reaches across.
const roofReachOf = (H) => {
  const B = H.body;
  const { angle } = slopeOf(B);
  return B.width / 2 + H.roof.overhang * Math.cos(angle);
};

// How tall the house stands off its ground, for the posts to clear: the
// ridge, and the beam or the slabs' crowns above it, whichever is higher.
export function houseHeightOf(H) {
  const B = H.body;
  const R = H.roof;
  const { angle } = slopeOf(B);
  const ridge = ridgeOf(B);
  // The slabs meet above the ridge, each lifted off its slope by its
  // thickness: at the ridge that is thickness / cos(angle) straight up.
  const slabs = ridge + R.thickness / Math.cos(angle);
  return Math.max(slabs, R.ridge ? ridge + R.ridge.radius * 2 : 0);
}

// How far out from its middle it spreads, across (x) and along (z), for
// the player to be kept out of and the grass to keep back from: the roof's
// reach, since it hangs past the walls both ways.
export function houseFootprintOf(H) {
  return {
    x: roofReachOf(H),
    z: H.body.depth / 2 + H.roof.eaves,
  };
}

// A flat thing stood on the front wall (the trailer's too — see
// Trailer.jsx — so these are exported): a cube pressed to `width` by
// `height`, `depth` thick, its back against the face and its middle `y`
// off the ground, `x` across from the house's middle. Built at half its
// width so its facets run the whole way along, then pressed to shape.
export function Plaque({
  x,
  y,
  width,
  height,
  depth,
  face,
  detail,
  clay,
  color,
  light = LIGHT,
}) {
  const form = useMemo(
    () => ({ widen: 1, tall: height / width, deepen: depth / width }),
    [width, height, depth],
  );
  return (
    <group position={[x, y, face + depth / 2]}>
      <Primitive
        shape="cube"
        radius={width / 2}
        detail={detail}
        form={form}
        clay={clay}
        swatch={color}
        light={light}
      />
    </group>
  );
}

// A window: its frame's four bars standing off the wall, and the pane
// between them, lit as the config says — or, of `type` "arched" or
// "round", the pane the mushroom house's are (see Panes.jsx).
export function Window({ W, x, face }) {
  const F = W.frame;
  const light = useMemo(() => merge(LIGHT, W.light), [W.light]);
  const t = F.thickness;
  const bars = [
    // Top and bottom, the full width plus the frame's own corners; then
    // the sides between them.
    { x: 0, y: W.height / 2 + t / 2, w: W.width + 2 * t, h: t },
    { x: 0, y: -(W.height / 2 + t / 2), w: W.width + 2 * t, h: t },
    { x: W.width / 2 + t / 2, y: 0, w: t, h: W.height },
    { x: -(W.width / 2 + t / 2), y: 0, w: t, h: W.height },
  ];
  if (W.type === "arched" || W.type === "round")
    return (
      <group position={[x, W.y, face]}>
        <WindowPane config={W} />
      </group>
    );
  return (
    <group position-x={x}>
      <Plaque
        x={0}
        y={W.y}
        width={W.width}
        height={W.height}
        depth={W.depth}
        face={face}
        detail={W.detail}
        clay={W.clay}
        color={W.color}
        light={light}
      />
      {W.columns > 1 || W.rows > 1 ? (
        <group position={[0, W.y, face]}>
          <Muntins R={W} z={W.depth} />
        </group>
      ) : null}
      {bars.map((b, i) => (
        <Plaque
          key={i}
          x={b.x}
          y={W.y + b.y}
          width={b.w}
          height={b.h}
          depth={F.depth}
          face={face}
          detail={W.detail}
          clay={W.clay}
          color={F.color}
        />
      ))}
    </group>
  );
}

// A door the doll can go in at: registered with the player by where the
// group at `ref` actually is — its foot, on the ground — so it may sit
// anywhere in the tree (see player/doors.js). `height` is how tall the
// door stands, for the prompt to float over; `room` what it opens onto,
// `{ walls, floor, rooms, ways, door, window }` — swatches for the rooms
// to be done in, the rooms themselves and the ways through and out of
// them (see interior/), and the house's own door and window, whose
// colors, frames and knob the ones drawn again inside take — the door
// as the way out and hung in the doorways, a window on each outside
// wall — at the ways' own sizes and shapes (see interior/Opening.jsx)
// — told which house's it is by the station (see ../station/thing.js);
// or `{ out: true }`, a door in a room, the way back out. No `room`, and
// it is only a door to look at.
export function useDoorAt(ref, height, room) {
  const ball = useBody();
  const thing = useThing();
  useEffect(() => {
    if (!room) return;
    const at = new THREE.Vector3();
    ref.current.updateWorldMatrix(true, false);
    ref.current.getWorldPosition(at);
    // the door is as tall as the house's scale makes it
    const k = ref.current.getWorldScale(new THREE.Vector3()).y;
    at.sub(ball.center);
    const door = registerDoor({
      body: ball,
      dir: at.clone().normalize(),
      top: height * k,
      room: {
        id: thing ? `${thing.station}:${thing.index}` : null,
        ...room,
      },
    });
    return () => unregisterDoor(door);
  }, [ref, height, room, ball, thing]);
}

// The door, its foot on the ground, and the knob on it. Given a `room`,
// it can be gone in at — see useDoorAt.
export function Door({ D, face, room = null }) {
  const K = D.knob;
  const foot = useRef();
  useDoorAt(foot, D.height, room);
  return (
    <group>
      <group ref={foot} position-z={face} />
      <Plaque
        x={0}
        y={D.height / 2}
        width={D.width}
        height={D.height}
        depth={D.depth}
        face={face}
        detail={D.detail}
        clay={D.clay}
        color={D.color}
      />
      {K && (
        <group
          position={[
            (K.side * D.width) / 2,
            D.height / 2,
            face + D.depth + K.radius * 0.6,
          ]}
        >
          <Primitive shape="sphere" radius={K.radius} swatch={K.color} />
        </group>
      )}
    </group>
  );
}

// One house, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of HOUSE's fields for this one instance.
export default function House({ config }) {
  const H = useMemo(() => merge(HOUSE, config), [config]);
  const B = H.body;
  const R = H.roof;

  // Solid to the player, up to the ridge: registered by where it actually
  // IS, so it may sit anywhere in the tree — a box the walls' size, turned
  // the way the house is.
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
      top: at.length() - ball.radius + ridgeOf(B) * H.scale,
      frame: turn,
      halfWidth: (B.width / 2) * H.scale,
      halfLength: (B.depth / 2) * H.scale,
    });
    return () => unregisterSolid(solid);
  }, [B, ball, H.scale]);

  const body = useMemo(() => bodyGeometry(B), [B]);
  const slabs = useMemo(() => slabsOf(H), [H]);
  const face = B.depth / 2;
  const W = H.windows;
  // Inside: the walls' color, the roof's underfoot, and its own rooms.
  const room = useMemo(
    () => ({
      walls: B.color,
      floor: R.color,
      rooms: H.interior.rooms,
      ways: {
        arch: H.interior.arch,
        door: H.interior.door,
        front: H.interior.front,
        window: indoorWindowOf(H.interior.window, W),
        frame: H.interior.frame,
      },
      door: H.door,
      window: H.windows,
    }),
    [B, R, H.interior, H.door, H.windows],
  );
  return (
    <group ref={root} scale={H.scale}>
      <group position-y={-B.sink}>
        <mesh geometry={body} material={unlitMat(B.color)} />
      </group>
      <Door D={H.door} face={face} room={room} />
      {[-1, 1].map((side) => (
        <Window key={side} W={W} x={side * W.apart} face={face} />
      ))}
      {slabs.map(({ position, rotation, size }, i) => (
        <mesh
          key={i}
          position={position}
          rotation={rotation}
          material={unlitMat(R.color)}
        >
          <boxGeometry args={size} />
        </mesh>
      ))}
      {R.ridge && (
        <mesh
          position-y={ridgeOf(B) + R.ridge.radius}
          rotation-x={Math.PI / 2}
          material={unlitMat(R.ridge.color)}
        >
          <cylinderGeometry
            args={[R.ridge.radius, R.ridge.radius, B.depth + 2 * R.eaves, 8]}
          />
        </mesh>
      )}
    </group>
  );
}
