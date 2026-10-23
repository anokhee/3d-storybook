import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts } from "../../world/lump.js";
import { ANTHRO } from "./objects.js";

// Where everything sits, at size 1, standing in a T-pose facing +z. The
// creature is ONE lump (see world/lump.js): `main` are the parts it is
// poured from — a capsule for the trunk with a ball of a belly in front
// of it, a rounded block for the head, two legs down to flat feet, two
// arms straight out to the sides from the shoulders each ending in a
// ball of a hand — and whatever the kind adds to it (the frog's eye
// bumps and fingers, the cat's ears and tail, the dog's snout and
// tail, the duck's wings and the chicken's tail feathers). `accents` are lumps of
// their own in the accent colour (a beak, a bill, bare legs, floppy
// ears) and `crest` in the detail colour (a comb, a wattle). `eyes` are
// the beads or eyeballs, from the world, each `r` big with a pupil if it
// has one; `mouth` is a curve of points drawn as a dark tube, `nose` a
// bead, `whiskers` thin sticks.
// The poses. `legs` are [left, right] (x negative, then positive) each
// { a, b } the thigh's and the shin's angle forward of straight down
// (negative is back), with `tilt` the foot's if it is lifted; `arms`
// are [left, right] each [upper e, upper f, fore e, fore f]: `e` up
// from level out to the side, `f` swung forward from straight out. The
// walk steps the right foot forward and the left arm with it; the run
// is a longer stride with the elbows bent; the jump tucks the knees and
// throws the arms up, `lift` off the ground.
const POSES = {
  "t-pose": { legs: [{ a: 0, b: 0 }, { a: 0, b: 0 }], arms: [[0, 0, 0, 0], [0, 0, 0, 0]] },
  // sat in a car's seat (see stories/helpers/driver.jsx): thighs
  // sloping down forward, shins straight down to feet flat on the car's
  // floor (its ground), both arms reaching ahead and down to the wheel
  drive: {
    legs: [{ a: 1.05, b: 0 }, { a: 1.05, b: 0 }],
    arms: [[-0.6, 1.35, -0.15, 1.45], [-0.6, 1.35, -0.15, 1.45]],
  },
  walk: {
    legs: [{ a: -0.4, b: -0.45 }, { a: 0.45, b: 0.2 }],
    arms: [[-1.1, 0.5, -0.9, 0.7], [-1.1, -0.5, -0.9, -0.3]],
  },
  run: {
    legs: [{ a: -0.5, b: -1.4, tilt: -0.9 }, { a: 0.9, b: 0.15 }],
    arms: [[-0.3, 0.9, 0.8, 0.6], [-0.4, -0.9, 0.9, -0.3]],
  },
  jump: {
    legs: [{ a: 0.9, b: -0.2, tilt: -0.3 }, { a: 0.9, b: -0.2, tilt: -0.3 }],
    arms: [[0.9, 0.2, 1.1, 0.1], [0.9, 0.2, 1.1, 0.1]],
    lift: 0.3,
  },
};
// The ride (see stories/helpers/rider.jsx): sat astride a back, the
// thighs out forward along it, knees to the front, `straddle` [thigh,
// shin] how far each is swung out to the side to clear the animal (the
// thigh round the top of its back, the shin down its flank), the hands
// held ahead of the chest over the animal's neck. `seat` lifts the figure so the bottom of its trunk
// is at y = 0, where the back is, instead of its feet on the ground.
const ridePose = ([out, shinOut] = [0.3, 0.3]) => ({
  legs: [{ a: RIDE.a, b: 0.15, out, shinOut }, { a: RIDE.a, b: 0.15, out, shinOut }],
  arms: [[-0.75, 1.3, -0.1, 1.5], [-0.75, 1.3, -0.1, 1.5]],
  seat: true,
});
const poseOf = (C) => (C.pose === "ride" ? ridePose(C.straddle) : POSES[C.pose] ?? POSES["t-pose"]);
// The animated poses, flipbook-style: a loop of frames, each a pose and
// how long it holds, each frame a lump of its own (the lump is built
// once per frame, never per tick), shown in turn like a stop-motion toy.
// The walk and the run step through a stride, the legs and then the
// arms opposite them, `sin` of the phase; the jump goes crouch, push,
// rise, tuck, fall, land.
const swing = (n, hold, legOf, armOf) => Array.from({ length: n }, (_, i) => {
  const th = (i / n) * Math.PI * 2;
  const leg = (s) => legOf(Math.sin(th + (s < 0 ? Math.PI : 0)), Math.cos(th + (s < 0 ? Math.PI : 0)));
  const arm = (s) => armOf(Math.sin(th + (s < 0 ? Math.PI : 0)));
  return { hold, pose: { legs: [leg(-1), leg(1)], arms: [arm(-1), arm(1)] } };
});
const CYCLES = {
  walk: swing(8, 0.09,
    (v, c) => ({ a: 0.45 * v, b: 0.45 * v - 0.15 - 0.5 * Math.max(0, c) }),
    (v) => [-1.1, -0.5 * v, -0.9, -0.5 * v + 0.2]),
  run: swing(8, 0.06,
    (v) => ({ a: 0.2 + 0.7 * v, b: 0.2 + 0.7 * v - 0.8 + 0.2 * v, tilt: -0.9 * Math.max(0, -v) }),
    (v) => [-0.35, -0.9 * v, 0.85, -0.54 * v + 0.1]),
  jump: [
    { hold: 0.25, pose: { legs: [{ a: 0.8, b: -0.7 }, { a: 0.8, b: -0.7 }], arms: [[-0.6, -0.4, -0.5, -0.5], [-0.6, -0.4, -0.5, -0.5]] } },
    { hold: 0.1, pose: { legs: [{ a: 0.1, b: 0.1 }, { a: 0.1, b: 0.1 }], arms: [[0.9, 0.3, 1.1, 0.2], [0.9, 0.3, 1.1, 0.2]], lift: 0.1 } },
    { hold: 0.12, pose: { legs: [{ a: 0.5, b: -0.1 }, { a: 0.5, b: -0.1 }], arms: [[0.9, 0.2, 1.1, 0.1], [0.9, 0.2, 1.1, 0.1]], lift: 0.3 } },
    { hold: 0.16, pose: { legs: [{ a: 0.9, b: -0.2, tilt: -0.3 }, { a: 0.9, b: -0.2, tilt: -0.3 }], arms: [[0.9, 0.2, 1.1, 0.1], [0.9, 0.2, 1.1, 0.1]], lift: 0.45 } },
    { hold: 0.14, pose: { legs: [{ a: 0.5, b: 0.1 }, { a: 0.5, b: 0.1 }], arms: [[0.5, 0.1, 0.5, 0], [0.5, 0.1, 0.5, 0]], lift: 0.25 } },
    { hold: 0.2, pose: { legs: [{ a: 0.9, b: -0.5 }, { a: 0.9, b: -0.5 }], arms: [[-0.3, 0.3, -0.2, 0.4], [-0.3, 0.3, -0.2, 0.4]] } },
  ],
};
const SHOULDER_Y = 0.86, HIP_Y = 0.6, HIP_X = 0.1;
// The bottom of the trunk, at size 1: where a seated figure sits
export const seatOf = (C) => Math.min(0.58 - C.body.radius, 0.68 - C.body.belly);
// A ridden leg, at size 1 (see rider.jsx): the hips' half-width, the
// thigh and shin, and how far forward the thigh rises
export const RIDE = { hipX: HIP_X, thigh: 0.26, shin: 0.27, a: 0.85, tall: (C) => C.head.y + C.head.height / 2 };
function layoutOf(C, P) {
  const B = C.body, H = C.head, A = C.arm, L = C.legs;
  const main = [], accents = [], crest = [], eyes = [], whiskers = [], noses = [], props = [];
  let mouth = null, mouthR = 0.012;
  // Lumps in colours of their own, each its own lump in `colors[key]`: a
  // witch's hair, a pumpkin's stem, and `skin`, where a dressed kind's
  // head (and with `skin.hands` its hands) go instead of the coat
  const lumps = {};
  const put = (key, part) => (lumps[key] ??= []).push(part);
  const face = C.skin?.head ? (part) => put("skin", part) : (part) => main.push(part);
  const cap = (a, b, ra, rb, blend = 0) => ({ kind: "capsule", a, b, ra, rb, blend });
  const ball = (at, r, blend = 0) => ({ kind: "sphere", at, r, blend });
  const block = (at, size, round, blend = 0, tilt = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, blend, tilt });
  const curve = (points, rootR, tipR) => tailParts(tailBalls({ points, rootR, tipR }));
  const lumpsOfCurve = (parts, key) => parts.forEach((part) => put(key, part));
  // A plain shape's turn: its own y (a cylinder's or cone's length, a
  // disc's face) along `dir`, then spun `spin` round it
  const pointing = (dir, spin = 0) => {
    const d = new THREE.Vector3(...dir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin));
    return new THREE.Euler().setFromQuaternion(q).toArray().slice(0, 3);
  };
  // A pin stuck in at `at`, its shaft out along `dir`, a bead on its end
  const pin = (at, dir, len, head) => {
    const d = new THREE.Vector3(...dir).normalize();
    props.push({ shape: "cylinder", args: [0.006, 0.006, len, 6], at: [at[0] + d.x * len * 0.5, at[1] + d.y * len * 0.5, at[2] + d.z * len * 0.5], rot: pointing(dir), color: "pin" });
    props.push({ shape: "sphere", args: [0.026, 12, 10], at: [at[0] + d.x * len, at[1] + d.y * len, at[2] + d.z * len], rot: [0, 0, 0], color: head });
  };
  // A stitch: a short dark stick across the surface at `at`, turned `turn` in the face's plane
  const stitch = (at, len, turn) => props.push({ shape: "cylinder", args: [0.006, 0.006, len, 6], at, rot: [0, 0, turn], color: "stitch" });

  // The trunk and its belly
  main.push(cap([0, 0.58, 0], [0, 0.9, 0], B.radius, B.radius * 0.88, 0.1));
  main.push(ball([0, 0.68, 0.03], B.belly, 0.12));

  // The head, grown out of the top of the trunk (the pumpkin's is its
  // own, see below)
  const headZ = 0.03, front = headZ + H.depth / 2, top = H.y + H.height / 2;
  if (C.kind !== "pumpkin") face(block([0, H.y, headZ], [H.width, H.height, H.depth], H.round, 0.1));

  // The pose: each leg a thigh at angle `a` (forward of straight down)
  // and a shin at angle `b` (the same, absolute), each arm an upper arm
  // and a forearm, each a direction of `e` up from horizontal and `f`
  // swung forward from straight out — see POSES; a leg's `out` and
  // `shinOut` swing the thigh and the shin out to the side (the ride's).
  // The whole figure is lifted so the lowest foot is on the ground, or
  // by `lift` off it, or (a `seat`ed pose) so its seat is at y = 0.
  // `P` is the pose, one of POSES or a frame of a cycle (see CYCLES).
  const thigh = 0.26, shin = 0.27;
  const legs = [-1, 1].map((s) => {
    const l = P.legs[s < 0 ? 0 : 1];
    const hip = [s * HIP_X, HIP_Y, 0];
    const o = l.out ?? 0, so = l.shinOut ?? 0;
    const knee = [hip[0] + s * thigh * Math.sin(o), hip[1] - thigh * Math.cos(l.a) * Math.cos(o), thigh * Math.sin(l.a) * Math.cos(o)];
    const ankle = [knee[0] + s * shin * Math.sin(so), knee[1] - shin * Math.cos(l.b) * Math.cos(so), knee[2] + shin * Math.sin(l.b) * Math.cos(so)];
    return { s, hip, knee, ankle, tilt: l.tilt ?? 0 };
  });
  const ground = P.seat ? -seatOf(C) : P.lift ?? 0.07 - Math.min(...legs.map((l) => l.ankle[1]));
  for (const { s, hip, knee, ankle, tilt } of legs) {
    const foot = [ankle[0], ankle[1] - 0.03, ankle[2] + 0.06];
    if (L.bare) {
      // a bird's: the thigh in the coat, the shin and webbed foot bare
      main.push(cap(hip, knee, 0.075, 0.06, 0.06));
      // the bare shin from just inside the knee, back along its own line
      // (up, for a straight leg), so its end stays in the thigh's however
      // the knee bends
      const into = (k) => knee[k] - ((ankle[k] - knee[k]) / shin) * 0.01;
      accents.push(cap([into(0), into(1), into(2)], ankle, L.thickness, L.thickness * 0.9));
      accents.push(block(foot, [C.kind === "duck" ? 0.2 : 0.14, 0.04, 0.22], 0.02, 0.05, tilt));
    } else {
      // in trousers or stockings, and shoes, if it has those colours
      const leg = C.colors.trousers ? (part) => put("trousers", part) : (part) => main.push(part);
      const shoe = C.colors.shoes ? (part) => put("shoes", part) : leg;
      leg(cap(hip, knee, 0.08, L.thickness, 0.04));
      leg(cap(knee, ankle, L.thickness, L.thickness * 0.85, 0.02));
      shoe(block(foot, [C.kind === "frog" ? 0.18 : 0.14, 0.08, C.kind === "frog" ? 0.26 : 0.2], 0.03, 0.05, tilt));
      if (C.kind === "scarecrow") {
        // straw poking out of the trouser cuffs, splayed round the ankle
        for (let i = 0; i < 5; i++) {
          const th = (i / 5) * Math.PI * 2 + s * 0.3;
          const from = [ankle[0], ankle[1] + 0.04, ankle[2]];
          put("straw", cap(from, [from[0] + Math.cos(th) * 0.13, from[1] - 0.06, from[2] + Math.sin(th) * 0.13], 0.015, 0.009));
        }
      }
    }
  }

  // Arms: out of the shoulders, an upper arm and a forearm, a mitten
  // of a hand at the end
  const t = A.thickness, half = A.length / 2;
  const dir = (s, e, f) => [s * Math.cos(e) * Math.cos(f), Math.sin(e), Math.cos(e) * Math.sin(f)];
  const along = (from, d, len) => [from[0] + d[0] * len, from[1] + d[1] * len, from[2] + d[2] * len];
  for (const s of [-1, 1]) {
    const arm = P.arms[s < 0 ? 0 : 1];
    const root = [s * 0.1, SHOULDER_Y, 0];
    const d1 = dir(s, arm[0], arm[1]), d2 = dir(s, arm[2], arm[3]);
    const elbow = along(root, d1, 0.03 + half), wrist = along(elbow, d2, half - 0.03);
    main.push(cap(root, elbow, t * 1.3, t * 1.1, 0.08));
    main.push(cap(elbow, wrist, t * 1.1, t * 0.9, 0.03));
    const hand = along(wrist, d2, t);
    if (C.kind === "scarecrow") {
      // no hands: a bunch of straw out of each cuff, fanned round the forearm's line
      for (const [u, v] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35], [0.25, 0.25], [-0.25, -0.25]]) {
        const f = [d2[0] + u * 0.6, d2[1] + v, d2[2] + u * 0.4];
        const n = Math.hypot(...f);
        put("straw", cap(wrist, along(wrist, f.map((c) => c / n), 0.21), 0.016, 0.009));
      }
    } else (C.skin?.hands ? (part) => put("skin", part) : (part) => main.push(part))(ball(hand, t * 1.35, 0.03));
    if (C.kind === "frog") {
      // splayed fingers out of the hand, fanned either side of the forearm
      const side = Math.abs(d2[1]) > 0.9 ? [0, 0, 1] : [-d2[2], 0, d2[0]];
      const n = Math.hypot(...side);
      for (const a of [-0.5, 0, 0.5]) {
        const f = d2.map((v, i) => v * Math.cos(a) + (side[i] / n) * Math.sin(a));
        main.push(cap(hand, along(hand, f, 0.12), t * 0.55, t * 0.4, 0.02));
      }
    }
    if (C.kind === "duck" && C.pose === "t-pose") {
      // a flat wing along the arm, wide front to back
      main.push(block([s * (0.12 + A.length * 0.55), SHOULDER_Y - 0.02, -0.04], [A.length * 0.9, 0.04, 0.2], 0.02, 0.06));
    }
  }

  // The kind's own parts
  const eyeX = H.width * 0.24, eyeY = H.y + H.height * 0.1;
  switch (C.kind) {
    case "frog": {
      // bulging eyes up out of the crown, gold, with a pupil, a wide mouth
      for (const s of [-1, 1]) {
        main.push(ball([s * 0.16, top - 0.02, 0.04], 0.1, 0.07));
        eyes.push({ at: [s * 0.16, top + 0.01, 0.1], r: 0.075, pupil: { scale: [0.4, 1, 0.3] } });
      }
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const x = (-1 + (2 * i) / 16) * 0.22;
        pts.push([x, H.y - 0.07 + 0.03 * (x / 0.22) ** 4, front - 0.005 - 0.07 * (x / 0.26) ** 4]);
      }
      mouth = pts;
      for (const s of [-1, 1]) noses.push({ at: [s * 0.04, H.y + 0.03, front - 0.005], r: 0.012, color: "detail" });
      break;
    }
    case "chicken": {
      // a beak, a comb on top, a wattle under it, tail feathers out of a rump
      accents.push(cap([0, H.y - 0.02, front - 0.04], [0, H.y - 0.04, front + 0.11], 0.05, 0.008, 0.02));
      for (const [x, y, z, r] of [[0, top + 0.01, 0.07, 0.045], [0, top + 0.03, 0.02, 0.055], [0, top + 0.01, -0.04, 0.04]]) crest.push(ball([x, y, z], r, 0.03));
      crest.push(cap([0, H.y - 0.07, front - 0.02], [0, H.y - 0.15, front - 0.01], 0.03, 0.02));
      main.push(ball([0, 0.66, -0.12], 0.13, 0.14)); // a rump the feathers grow out of
      for (const s of [-1, 0, 1]) main.push(...curve([[s * 0.01, 0.64, -0.12], [s * 0.05, 0.76, -0.24], [s * 0.1, 0.92, -0.3]], 0.065, 0.02));
      for (const s of [-1, 1]) eyes.push({ at: [s * eyeX, eyeY, front - 0.02], r: 0.035 });
      break;
    }
    case "human":
    case "witch": {
      // ears either side, a bead of a nose, bead eyes, a small smile; the
      // witch's nose long and hooked down with a wart on it, a pointed
      // hat on a wide brim, and hair hanging from under it
      for (const s of [-1, 1]) {
        face(ball([s * (H.width / 2 - 0.01), H.y - 0.01, headZ], 0.05, 0.03));
        eyes.push({ at: [s * H.width * 0.22, H.y + 0.03, front - 0.012], r: 0.026 });
      }
      const smile = (y, w) => Array.from({ length: 9 }, (_, i) => { const x = (-1 + i / 4) * w; return [x, y + 0.015 * (x / w) ** 2, front - 0.008 - 0.02 * (x / w) ** 2]; });
      mouthR = 0.008;
      if (C.kind === "human") {
        face(ball([0, H.y - 0.03, front - 0.005], 0.035, 0.03));
        mouth = smile(H.y - 0.1, 0.06);
        break;
      }
      face(cap([0, H.y - 0.0, front - 0.03], [0, H.y - 0.08, front + 0.13], 0.04, 0.016, 0.03));
      face(ball([0.018, H.y - 0.05, front + 0.07], 0.016, 0.005));
      mouth = smile(H.y - 0.12, 0.055);
      const brim = top - 0.04;
      props.push({ shape: "cylinder", args: [0.33, 0.33, 0.022, 40], at: [0, brim, headZ], rot: [-0.12, 0, 0], color: "hat" });
      props.push({ shape: "cylinder", args: [0.168, 0.175, 0.05, 32], at: [0, brim + 0.035, headZ - 0.004], rot: [-0.12, 0, 0], color: "band" });
      props.push({ shape: "cone", args: [0.17, 0.46, 32], at: [0, brim + 0.24, headZ - 0.03], rot: [-0.22, 0, 0.08], color: "hat" });
      for (const s of [-1, 1]) for (const [x, z, drop] of [[0.17, 0.0, 0.3], [0.15, -0.09, 0.36], [0.08, -0.15, 0.4]]) {
        lumpsOfCurve(curve([[s * x, brim - 0.01, headZ + z], [s * (x + 0.035), brim - drop * 0.5, headZ + z - 0.02], [s * (x + 0.02), brim - drop, headZ + z - 0.05]], 0.035, 0.018), "hair");
      }
      break;
    }
    case "pumpkin": {
      // a ribbed pumpkin for a head: short upright capsules in a ring,
      // run together, a stem out of the top, and a carved face — triangle
      // eyes and nose and a jagged grin, dark
      const R = H.width / 2, ribs = 8;
      for (let i = 0; i < ribs; i++) {
        const th = (i / ribs) * Math.PI * 2;
        face(cap([Math.cos(th) * R * 0.42, H.y - H.height * 0.12, headZ + Math.sin(th) * R * 0.42], [Math.cos(th) * R * 0.42, H.y + H.height * 0.12, headZ + Math.sin(th) * R * 0.42], R * 0.58, R * 0.58, 0.05));
      }
      const skinZ = headZ + R;
      put("stem", cap([0, H.y + H.height * 0.25, headZ], [0.03, top + 0.07, headZ - 0.03], 0.035, 0.024, 0.02));
      const tri = (x, y, r, flip = 0) => props.push({ shape: "cylinder", args: [r, r, 0.04, 3], at: [x, y, skinZ - 0.035 * (x / R) ** 2 - 0.01], rot: [Math.PI / 2, flip, 0], color: "detail" }); // a three-sided prism, stood on its face, `flip` turning it round
      for (const s of [-1, 1]) tri(s * R * 0.4, H.y + 0.045, 0.05, Math.PI);
      tri(0, H.y - 0.02, 0.028, Math.PI);
      mouth = Array.from({ length: 13 }, (_, i) => {
        const x = (-1 + i / 6) * R * 0.62;
        return [x, H.y - 0.09 + 0.04 * (x / (R * 0.62)) ** 2 + (i % 2 ? -0.018 : 0.012), skinZ - 0.05 * (x / R) ** 2 - 0.006];
      });
      mouthR = 0.016;
      break;
    }
    case "statue": {
      // the field's statue heads (Monuments/Head): a tall plain head on a
      // thick neck, a heavy brow, a long straight nose, full lips, the
      // eyes shut slits under the brow, flat ears
      main.push(cap([0, 0.92, headZ * 0.5], [0, H.y - H.height * 0.2, headZ], 0.11, 0.12, 0.05));
      main.push(block([0, H.y + 0.06, front - 0.035], [H.width * 0.92, 0.05, 0.08], 0.02, 0.04));
      main.push(cap([0, H.y + 0.05, front - 0.01], [0, H.y - 0.07, front + 0.045], 0.026, 0.038, 0.03));
      for (const s of [-1, 1]) {
        main.push(ball([s * 0.025, H.y - 0.125, front - 0.008], 0.03, 0.02));
        main.push(block([s * (H.width / 2), H.y + 0.0, headZ - 0.02], [0.04, 0.13, 0.08], 0.02, 0.03));
        eyes.push({ at: [s * H.width * 0.24, H.y + 0.015, front - 0.014], r: 0.03, scale: [1.6, 0.22, 0.5] });
      }
      main.push(block([0, H.y - 0.18, front - 0.05], [0.14, 0.08, 0.1], 0.04, 0.04)); // the chin
      break;
    }
    case "fish": {
      // an egg of a fish for a head (the Fish Head's), a pale chin, big
      // googly eyes on its sides, a ring of pink lips, a fin up its back
      // and one each side, in the accent colour
      put("chin", ball([0, H.y - 0.1, headZ + 0.05], 0.16, 0.06));
      for (const s of [-1, 1]) {
        eyes.push({ at: [s * (H.width / 2 - 0.05), H.y + 0.08, headZ + 0.1], r: 0.075, pupil: { scale: [1, 1, 0.5] } });
        accents.push(block([s * (H.width / 2 + 0.005), H.y - 0.08, headZ - 0.06], [0.025, 0.09, 0.16], 0.01, 0.03, 0));
      }
      accents.push(block([0, top - 0.005, headZ - 0.1], [0.025, 0.14, 0.22], 0.01, 0.03, 0));
      props.push({ shape: "torus", args: [0.055, 0.024, 12, 28], at: [0, H.y - 0.05, front + 0.005], rot: [0, 0, 0], color: "detail" });
      break;
    }
    case "alien": {
      // a big domed head over a narrow chin, huge black almond eyes slanted
      // up and out, two antennae with bobbles, a small mouth
      face(block([0, H.y - 0.16, headZ + 0.04], [0.22, 0.16, 0.26], 0.07, 0.07));
      for (const s of [-1, 1]) {
        eyes.push({ at: [s * 0.11, H.y - 0.03, front - 0.035], r: 0.075, scale: [1.25, 0.7, 0.45], rot: [0, s * 0.35, s * 0.4] });
        main.push(cap([s * 0.07, top - 0.05, headZ], [s * 0.15, top + 0.2, headZ - 0.03], 0.02, 0.015, 0.02));
        accents.push(ball([s * 0.15, top + 0.22, headZ - 0.03], 0.04));
      }
      mouth = Array.from({ length: 7 }, (_, i) => { const x = (-1 + i / 3) * 0.035; return [x, H.y - 0.2, headZ + 0.04 + 0.13 - 0.004]; }); // on the chin's front
      mouthR = 0.007;
      break;
    }
    case "voodoo": {
      // a little stuffed burlap doll: one button eye and one stitched X,
      // a stitched-up mouth, a red heart patch on its chest and pins stuck
      // in its head and side, each with a coloured bead
      const eyeY = H.y + 0.03;
      eyes.push({ at: [-0.09, eyeY, front - 0.006], r: 0.05, scale: [1, 1, 0.3] });
      for (const [dx, dy] of [[-0.014, 0.012], [0.014, 0.012], [-0.014, -0.012], [0.014, -0.012]]) noses.push({ at: [-0.09 + dx, eyeY + dy, front + 0.008], r: 0.007, color: "coat" });
      for (const turn of [Math.PI / 4, -Math.PI / 4]) props.push({ shape: "cylinder", args: [0.01, 0.01, 0.1, 6], at: [0.09, eyeY, front + 0.002], rot: [0, 0, turn], color: "stitch" });
      const mouthY = H.y - 0.09, sink = (x) => front - 0.004 - 0.008 * Math.max(0, (Math.abs(x) - 0.03) / 0.05) ** 2;
      mouth = Array.from({ length: 9 }, (_, i) => { const x = (-1 + i / 4) * 0.08; return [x, mouthY, sink(x)]; });
      mouthR = 0.006;
      for (let i = -2; i <= 2; i++) stitch([i * 0.035, mouthY, sink(i * 0.035) + 0.002], 0.045, 0);
      // the heart: two balls and a cone's point down between them, all
      // squashed flat and turned to face out of the chest
      const face = Math.atan2(0.45, 1), c = new THREE.Vector3(0.07, 0.84, 0.18);
      const r = new THREE.Vector3(Math.cos(face), 0, -Math.sin(face));
      const at = (u, v) => c.clone().addScaledVector(r, u).add(new THREE.Vector3(0, v, 0)).toArray();
      const down = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), face).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI))).toArray().slice(0, 3);
      for (const u of [-0.025, 0.025]) props.push({ shape: "sphere", args: [0.032, 16, 12], at: at(u, 0.012), rot: [0, face, 0], scale: [1, 1, 0.35], color: "patch" });
      const tip = at(0, -0.03);
      props.push({ shape: "cone", args: [0.056, 0.065, 24], at: [tip[0] + 0.006, tip[1], tip[2] + 0.014], rot: down, scale: [1, 1, 0.35], color: "patch" }); // a little out, clear of the belly
      pin([0.07, top - 0.02, headZ], [0.5, 1, 0.1], 0.16, "pinA");
      pin([-0.12, H.y + 0.1, headZ + 0.05], [-1, 0.7, 0.3], 0.14, "pinB");
      pin([-0.16, 0.74, 0.04], [-1, 0.25, 0.35], 0.15, "pinC");
      break;
    }
    case "scarecrow": {
      // a burlap sack for a head, tied off at the neck with rope, straw
      // out of the collar, button eyes, a stitched grin, a triangle nose,
      // a straw hat with a band, and a patch on its shirt
      for (const s of [-1, 1]) eyes.push({ at: [s * 0.08, H.y + 0.04, front - 0.006], r: 0.036, scale: [1, 1, 0.35] });
      props.push({ shape: "cylinder", args: [0.03, 0.03, 0.02, 3], at: [0, H.y - 0.02, front], rot: [Math.PI / 2, Math.PI, 0], color: "nose" });
      const mouthY = H.y - 0.1;
      mouth = Array.from({ length: 11 }, (_, i) => { const x = (-1 + i / 5) * 0.1; return [x, mouthY + 0.03 * (x / 0.1) ** 2, front - 0.004 - 0.012 * (x / 0.1) ** 2]; });
      mouthR = 0.007;
      for (let i = -3; i <= 3; i++) { const x = i * 0.03; stitch([x, mouthY + 0.03 * (x / 0.1) ** 2, front - 0.002 - 0.012 * (x / 0.1) ** 2], 0.04, -x * 2); }
      const neck = H.y - H.height / 2 + 0.03;
      props.push({ shape: "torus", args: [0.148, 0.022, 8, 28], at: [0, neck, headZ], rot: [Math.PI / 2, 0, 0], color: "rope" });
      for (let i = 0; i < 11; i++) {
        const th = (i / 11) * Math.PI * 2;
        put("straw", cap([Math.cos(th) * 0.12, neck - 0.05, headZ + Math.sin(th) * 0.12], [Math.cos(th) * 0.23, neck + 0.02, headZ + Math.sin(th) * 0.23], 0.016, 0.009));
      }
      const brim = top - 0.03;
      props.push({ shape: "cylinder", args: [0.34, 0.34, 0.02, 40], at: [0, brim, headZ], rot: [0.08, 0, -0.1], color: "hat" });
      props.push({ shape: "cylinder", args: [0.16, 0.19, 0.16, 32], at: [0.008, brim + 0.08, headZ - 0.006], rot: [0.08, 0, -0.1], color: "hat" });
      props.push({ shape: "cylinder", args: [0.192, 0.196, 0.04, 32], at: [0.004, brim + 0.025, headZ - 0.003], rot: [0.08, 0, -0.1], color: "band" });
      props.push({ shape: "box", args: [0.1, 0.016, 0.1], at: [-0.08, 0.8, 0.165], rot: pointing([-0.45, 0, 1], 0.2), color: "patch" });
      break;
    }
    case "doll": {
      // a rag doll of a girl: red hair over the top and back of her head
      // with a fringe, two pigtails out to the sides tied with blue bows,
      // freckles, a smile, a white collar and a flared skirt
      put("hair", ball([0, H.y + 0.07, headZ - 0.06], 0.22, 0.04));
      put("hair", block([0, top - 0.05, front - 0.06], [0.34, 0.09, 0.1], 0.04, 0.04));
      for (const s of [-1, 1]) {
        put("hair", cap([s * 0.17, H.y + 0.02, headZ - 0.05], [s * 0.3, H.y - 0.13, headZ - 0.06], 0.06, 0.04, 0.03));
        props.push({ shape: "sphere", args: [0.03, 12, 10], at: [s * 0.21, H.y + 0.0, headZ - 0.01], rot: [0, 0, 0], color: "ribbon" });
        props.push({ shape: "sphere", args: [0.03, 12, 10], at: [s * 0.22, H.y - 0.02, headZ - 0.09], rot: [0, 0, 0], color: "ribbon" });
        eyes.push({ at: [s * H.width * 0.2, H.y + 0.01, front - 0.012], r: 0.034 });
        for (const [dx, dy] of [[0, 0], [0.025, 0.01], [0.012, -0.02]]) noses.push({ at: [s * (0.1 + dx), H.y - 0.05 + dy, front - 0.012], r: 0.008, color: "freckle" });
        props.push({ shape: "cylinder", args: [0.075, 0.075, 0.016, 24], at: [s * 0.06, 0.98, 0.1], rot: pointing([s * 0.3, 1, 0.8]), color: "collar" });
      }
      face(ball([0, H.y - 0.03, front - 0.004], 0.026, 0.02));
      mouth = Array.from({ length: 9 }, (_, i) => { const x = (-1 + i / 4) * 0.07; return [x, H.y - 0.1 + 0.02 * (x / 0.07) ** 2, front - 0.006 - 0.012 * (x / 0.07) ** 2]; });
      mouthR = 0.008;
      props.push({ shape: "cylinder", args: [0.2, 0.31, 0.22, 32], at: [0, 0.52, 0.03], rot: [0, 0, 0], color: "coat" });
      break;
    }
    case "cat": {
      // pointed ears, a small pink nose, whiskers, a long tail
      for (const s of [-1, 1]) {
        main.push(cap([s * 0.12, top - 0.04, 0], [s * 0.17, top + 0.14, 0], 0.07, 0.015, 0.05));
        eyes.push({ at: [s * eyeX, eyeY, front - 0.01], r: 0.05, pupil: { scale: [0.3, 1, 0.3] } });
        for (const k of [-1, 1]) whiskers.push({ at: [s * 0.2, H.y - 0.04 + k * 0.025, front - 0.02], turn: -s * k * 0.15, side: s });
      }
      noses.push({ at: [0, H.y - 0.03, front], r: 0.025, color: "detail" });
      main.push(...curve([[0, 0.66, -0.16], [0, 0.62, -0.34], [0, 0.78, -0.48], [0, 1.0, -0.46]], 0.05, 0.035));
      break;
    }
    case "dog": {
      // a snout out of the face, a dark nose, floppy ears, a short tail
      main.push(block([0, H.y - 0.05, front + 0.03], [0.17, 0.14, 0.2], 0.05, 0.07));
      noses.push({ at: [0, H.y - 0.02, front + 0.13], r: 0.035, color: "detail" });
      for (const s of [-1, 1]) {
        accents.push(cap([s * (H.width / 2 - 0.02), top - 0.04, -0.02], [s * (H.width / 2 + 0.06), H.y - 0.14, -0.02], 0.06, 0.05, 0));
        eyes.push({ at: [s * eyeX, eyeY + 0.02, front - 0.015], r: 0.035 });
      }
      main.push(...curve([[0, 0.64, -0.16], [0, 0.7, -0.28], [0, 0.86, -0.32]], 0.05, 0.035));
      break;
    }
    case "duck": {
      // a flat bill, bead eyes, a small upturned tail
      accents.push(block([0, H.y - 0.04, front + 0.02], [0.2, 0.05, 0.2], 0.022, 0.03));
      for (const s of [-1, 1]) eyes.push({ at: [s * eyeX, eyeY + 0.02, front - 0.04], r: 0.035 });
      main.push(...curve([[0, 0.66, -0.16], [0, 0.72, -0.28], [0, 0.84, -0.32]], 0.07, 0.025));
      break;
    }
    default:
  }
  return { main, accents, crest, eyes, whiskers, noses, mouth, mouthR, props, lumps, ground };
}

// One creature, standing on the ground at y = 0 in a T-pose facing +z.
// `config` overrides any of ANTHRO's fields for this one instance.
export default function Anthro({ config }) {
  const C = useMemo(() => merge(ANTHRO, config), [config]);
  const paint = C.colors;

  // The frames: one (the pose, still) or, with `animate` on a moving
  // pose, the cycle, each frame a lump of its own at a coarser grid. The
  // face, comb and mouth do not move with the pose, so they come from the
  // first frame's layout.
  const moving = C.animate && CYCLES[C.pose];
  const frames = useMemo(() => {
    const list = moving ? CYCLES[C.pose] : [{ hold: 1, pose: poseOf(C) }];
    const resolution = moving ? Math.min(C.resolution, 56) : C.resolution;
    return list.map(({ hold, pose }) => {
      const lay = layoutOf(C, pose);
      const extras = Object.entries(lay.lumps).map(([key, parts]) => ({ key, geo: lumpOf(parts, { resolution: moving ? 40 : 48 }) }));
      return { hold, lay, body: lumpOf(lay.main, { resolution }), accent: lay.accents.length ? lumpOf(lay.accents, { resolution: moving ? 36 : 40 }) : null, extras };
    });
  }, [C, moving]);
  useEffect(() => () => frames.forEach((f) => { f.body.dispose(); f.accent?.dispose(); f.extras.forEach((e) => e.geo.dispose()); }), [frames]);
  const lay = frames[0].lay;
  const crest = useMemo(() => (lay.crest.length ? lumpOf(lay.crest, { resolution: 36 }) : null), [lay]);
  useEffect(() => () => crest?.dispose(), [crest]);
  const mouth = useMemo(() => (lay.mouth ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lay.mouth.map((p) => new THREE.Vector3(...p))), 48, lay.mouthR, 6) : null), [lay]);
  useEffect(() => () => mouth?.dispose(), [mouth]);

  // The flipbook: show the frame whose turn it is, and lift the whole
  // figure by that frame's ground offset.
  const group = useRef();
  const shown = useRef([]);
  const clock = useRef({ t: 0, i: 0 });
  useFrame((_, delta) => {
    const c = clock.current;
    c.t += Math.min(delta, 0.1);
    while (c.t >= frames[c.i % frames.length].hold) { c.t -= frames[c.i % frames.length].hold; c.i++; }
    const at = frames.length > 1 ? c.i % frames.length : 0;
    shown.current.forEach((g, i) => { if (g) g.visible = i === at; });
    if (group.current) group.current.position.y = frames[at].lay.ground * C.size;
  });

  return (
    <group scale={C.size} position-y={lay.ground * C.size} ref={group}>
      {frames.map((f, i) => (
        <group key={i} ref={(g) => { shown.current[i] = g; }} visible={i === 0}>
          {/* The lump: body, head, legs and arms, one form. */}
          <mesh geometry={f.body} castShadow receiveShadow material={unlitMat(paint.coat)} />
          {/* The beak, bill, bare legs or ears, in the accent colour. */}
          {f.accent && <mesh geometry={f.accent} castShadow receiveShadow material={unlitMat(paint.accent)} />}
          {/* The skin, hair, stem or chin, each in its own colour. */}
          {f.extras.map((e) => <mesh key={e.key} geometry={e.geo} castShadow receiveShadow material={unlitMat(paint[e.key])} />)}
        </group>
      ))}
      {/* The comb and wattle. */}
      {crest && <mesh geometry={crest} castShadow receiveShadow material={unlitMat(paint.detail)} />}
      {/* The frog's wide mouth. */}
      {mouth && <mesh geometry={mouth} material={unlitMat(paint.detail)} />}
      {/* The eyes: a bead or an eyeball, with a pupil if it has one. */}
      {lay.eyes.map((e, i) => (
        <group key={i} position={e.at} rotation={e.rot ?? [0, 0, 0]} scale={e.scale ?? [1, 1, 1]}>
          <mesh castShadow material={unlitMat(paint.eyes)}>
            <sphereGeometry args={[e.r, 16, 12]} />
          </mesh>
          {e.pupil && (
            <mesh position={[0, 0, e.r * 0.85]} scale={e.pupil.scale} material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[e.r * 0.55, 12, 8]} />
            </mesh>
          )}
        </group>
      ))}
      {/* Noses and nostrils, beads. */}
      {lay.noses.map((n, i) => (
        <mesh key={i} position={n.at} castShadow material={unlitMat(paint[n.color])}>
          <sphereGeometry args={[n.r, 12, 8]} />
        </mesh>
      ))}
      {/* Hats, lips and carved faces: plain shapes in their colours. */}
      {lay.props.map((p, i) => {
        const Geo = { cone: "coneGeometry", cylinder: "cylinderGeometry", torus: "torusGeometry", sphere: "sphereGeometry", box: "boxGeometry" }[p.shape];
        return (
          <mesh key={i} position={p.at} rotation={p.rot} scale={p.scale ?? [1, 1, 1]} castShadow material={unlitMat(paint[p.color])}>
            <Geo args={p.args} />
          </mesh>
        );
      })}
      {/* The cat's whiskers, thin sticks out of its cheeks. */}
      {lay.whiskers.map((w, i) => (
        <mesh key={i} position={[w.at[0] + w.side * 0.06, w.at[1], w.at[2]]} rotation={[0, 0, w.turn + Math.PI / 2]} material={unlitMat(paint.whisker ?? paint.pupil)}>
          <cylinderGeometry args={[0.004, 0.004, 0.14, 4]} />
        </mesh>
      ))}
    </group>
  );
}
