import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";

import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { CAT, coatOf } from "./objects.js";

// Where everything sits for each pose, at size 1. The cat is one lump
// (see world/lump.js): `parts` are the forms it is poured from — ONE rounded
// block for head and body together, each leg a slimmer block pulled
// straight down out of it to the ground, and the tail a run of capsules
// out of its rear. The face is drawn on the block's front: `face` is the
// middle of it, on the front surface, and `lean` how the front leans
// back (the eyes, muzzle and ears go with it); `ears` where the two ears
// stand, from `face`. `spine` is where the stripes go, along the top,
// with how wide; `socks` the feet a tuxedo's socks cover, each a box
// round the foot, `at` and `size` across, tall and deep (turned `yaw`),
// that the sock is painted within; `chest` the lighter patch
// painted on the front, projected from `at` straight back along -z,
// `size` across and tall, `depth` how far back it reaches, its top
// arched and its bottom corners rounded off by `radius`, or null;
// `belly` the same paint carried on down the gap between the front legs
// when sitting, a box the same way, or null; `collar`
// the band painted across the front under the muzzle, a box `at`,
// turned `turn`, `size` across, tall and deep, thin top to bottom and
// reaching back round the front corners. The tail is a curve of `points` from
// where it leaves the rear to its tip, `rootR` thick where it leaves and
// `tipR` at the tip; the swish bends it from the root, `sway` scaling
// that, small when the tail lies on the ground. `top` is how tall the
// cat stands.
//
// Sitting, the chest slab (see there) runs from the front legs' tops up
// to the top of the head; the legs' tops run up into it past its
// rounded bottom edge and CHEST_EMBED beyond, their backs LEG_EMBED into
// the block, and the slab itself back to the block's middle, all so
// nothing meets at a seam.
const CHEST_EMBED = 0.03, LEG_EMBED = 0.03;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size, tilt = 0) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, tilt, blend: 0 });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  if (C.pose === "sitting") {
    // The block stood on end, its base on the ground as the seat (no
    // haunches of its own), leant back a little. A CHEST slab stands on
    // its front from the tops of the front legs right up to the top of
    // the head: as wide, flush with the top, leaning with it, its front
    // S.chestDepth forward of the block's own, and run back into the
    // block so there is no seam — so the neck and face sit straight over
    // the collar, and the block's lower front, between the front legs,
    // is set back under the chest as the belly. The
    // front legs are columns from up inside the chest slab down to the
    // ground, leaning back with it so their fronts lie in its front's
    // own plane (or S.legForward proud of it) and their backs run into
    // the block's front, with a paw block at the foot of each nudged
    // forward. The
    // hind feet are flat blocks under the block's base at either side,
    // well back of the front legs under the rear of the seat, their
    // fronts S.footBack behind the base's front, turned out so the toes
    // point to the sides, and a little outboard of the front legs. See CAT.sitting for the knobs.
    const S = C.sitting;
    const lean = -0.12;
    const sw = B.width * 0.9, sh = 0.78, sl = B.length * 0.52;
    const at = [0, sh / 2 + 0.04, -0.1];
    const top = at[1] + sh / 2, faceY = top - 0.14, chin = faceY - 0.08, collarY = faceY - 0.215;
    // Where the block's front face is at a height, leaning as it does
    const frontAt = (y) => at[2] + (y - at[1]) * Math.sin(lean) + (sl / 2) * Math.cos(lean);
    // A point `dy` up and `dz` forward of the block's middle, in its own leaning frame
    const onBlock = (dy, dz) => [0, at[1] + dy * Math.cos(lean) - dz * Math.sin(lean), at[2] + dy * Math.sin(lean) + dz * Math.cos(lean)];
    // ...and `dy` up it so that the point lands at height `y` with `dz` forward
    const upTo = (y, dz) => (y - at[1] + dz * Math.sin(lean)) / Math.cos(lean);
    // The chest slab: from low over the belly — down over the top
    // quarter of the front legs — up to the block's top, from its middle
    // out past its front, its edges rounded the same as the block's so
    // the two tops and sides run as one
    const chestBottom = 0.33;
    const cd = S.chestDepth + sl / 2, cz = cd / 2; // forward of the block's middle
    const cBottom = upTo(chestBottom, sl / 2), ch = sh / 2 - cBottom, cy = (sh / 2 + cBottom) / 2; // up it
    const cr = Math.min(B.round, ch / 2 - 0.03, cd / 2 - 0.03);
    const chestFront = (y) => frontAt(y) + S.chestDepth;
    // The front legs: up into the slab past its rounded bottom edge, so
    // their fronts carry straight on up into the slab's flat front —
    // leaning with it, so the two lie in one plane and nothing bulges
    // where they meet — and their backs run LEG_EMBED into the block
    // (and never slimmer front to back than across)
    const legTop = chestBottom + cr + CHEST_EMBED;
    const legDepth = Math.max(S.chestDepth + S.legForward + LEG_EMBED, L.thickness);
    const legFrontAt = (y) => chestFront(y) + S.legForward; // where a leg's front is at a height
    const legZ = legFrontAt(legTop / 2) - legDepth / 2;
    const pawZ = legFrontAt(0.05) + 0.045 - 0.075; // the paw's front a hair proud of the leg's
    const lx = S.legSpacing / 2;
    const feet = [[-lx, 0, legZ], [lx, 0, legZ]];
    const footLen = 0.22, footZ = frontAt(0) - footLen / 2 - S.footBack, footX = sw / 2 - 0.01;
    const yaw = THREE.MathUtils.degToRad(S.footYaw);
    const bibW = 0.3, stripW = S.legSpacing - L.thickness - 0.02; // the chest and belly patches across
    return {
      parts: [
        block(at, [sw, sh, sl], lean),
        { kind: "box", at: onBlock(cy, cz), half: [sw / 2 - cr, ch / 2 - cr, cd / 2 - cr], round: cr, tilt: lean, blend: 0 }, // the chest
        ...feet.map(([x, , z]) => ({ kind: "box", at: [x, legTop / 2, z], half: [L.thickness / 2 - L.round, legTop / 2 - L.round, legDepth / 2 - L.round], round: L.round, tilt: lean, blend: 0 })),
        ...feet.map(([x]) => ({ kind: "box", at: [x, 0.045, pawZ], half: [L.thickness / 2 - 0.03, 0.015, 0.045], round: 0.03, blend: 0.02 })), // the paws
        ...[-1, 1].map((side) => ({ kind: "box", at: [side * footX, 0.04, footZ], half: [0.02, 0.01, footLen / 2 - 0.03], round: 0.03, yaw: side * yaw, blend: 0.02 })), // the hind feet
      ],
      face: [0, faceY, chestFront(faceY)],
      lean,
      ears: [0.15, 0.14, -0.14],
      spine: [{ at: [0, top, -0.3], r: 0.18 }, { at: [0, top, -0.1], r: 0.18 }],
      socks: [
        ...feet.map(([x]) => ({ at: [x, 0.05, pawZ], size: [L.thickness + 0.04, 0.1, 0.15 + 0.04] })),
        ...[-1, 1].map((side) => ({ at: [side * footX, 0.04, footZ], size: [0.1 + 0.04, 0.09, footLen + 0.04], yaw: side * yaw })),
      ],
      // The chest patch: a bib up the chest's front to the chin from its
      // bottom edge, over the tops of the legs, its bottom corners
      // rounded off so its shoulders run into the belly patch, which
      // carries it on down the gap between the front legs — from up
      // under that edge, where it meets the bib, down to the base's
      // bottom edge — as wide as the gap, short of the legs' inner faces
      chest: { at: [0, (chestBottom - 0.01 + chin) / 2, chestFront((chestBottom + chin) / 2) + 0.12], size: [bibW, chin - chestBottom + 0.01], depth: 0.3, radius: (bibW - stripW) / 2 },
      belly: { at: [0, (0.04 + chestBottom + 0.14) / 2, chestFront(chestBottom) + 0.05], size: [stripW, chestBottom + 0.14 - 0.04], depth: 0.4 },
      collar: { at: [0, collarY, chestFront(collarY) - 0.1], turn: [lean, 0, 0], size: [sw + 0.1, 0.07, 0.3] }, // under the muzzle, round the chest's front
      tail: {
        points: [[0.1, 0.2, -0.3], [0.3, 0.1, -0.44], [0.46, 0.08, -0.2], [0.46, 0.08, 0.02]], // out the back and round to lie beside the right hind foot
        rootR: 0.09,
        tipR: 0.055,
        sway: 0.25,
      },
      top: top + 0.05,
    };
  }
  if (C.pose === "loaf") {
    // The block low and long, flat on the ground; two paws out in front.
    const px = (B.width + 0.06) / 2 - 0.04 - 0.01;
    const feet = [[-px, 0.06, 0.42], [px, 0.06, 0.42]];
    return {
      parts: [
        block([0, 0.3, -0.05], [B.width + 0.06, 0.6, B.length]),
        { kind: "box", at: feet[0], half: [0.03, 0.02, 0.06], round: 0.035, blend: 0.05 },
        { kind: "box", at: feet[1], half: [0.03, 0.02, 0.06], round: 0.035, blend: 0.05 },
      ],
      face: [0, 0.4, 0.45],
      lean: 0,
      ears: [0.15, 0.14, -0.14],
      spine: [{ at: [0, 0.6, -0.36], r: 0.26 }, { at: [0, 0.6, -0.1], r: 0.26 }, { at: [0, 0.6, 0.16], r: 0.24 }],
      socks: feet.map(([x, y]) => ({ at: [x, y, 0.485], size: [0.14, 0.12, 0.09] })), // what shows of each paw, ahead of the block
      // The chest patch: a bib on the front from under the muzzle all
      // the way down to the floor, round the block's bottom edge, between
      // the paws
      chest: { at: [0, (-0.01 + 0.32) / 2, 0.45 + 0.12], size: [0.3, 0.32 + 0.01], depth: 0.3 },
      belly: null,
      collar: { at: [0, 0.17, 0.35], turn: [0, 0, 0], size: [B.width + 0.16, 0.07, 0.3] }, // under the muzzle, above the paws, over the bib
      tail: {
        points: [[0.1, 0.2, -0.5], [0.3, 0.09, -0.6], [0.4, 0.08, -0.3], [0.38, 0.08, 0.1], [0.28, 0.08, 0.42]],
        rootR: 0.09,
        tipR: 0.055,
        sway: 0.2,
      },
      top: 0.6,
    };
  }
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the face on its
  // front, the tail out of the top of its rear, curling up.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const top = 0.3 + B.height;
  return {
    parts: [block([0, 0.3 + B.height / 2, 0], [B.width, B.height, B.length]), ...feet.map(([x, , z]) => leg(x, z, 0.5))],
    face: [0, top - 0.18, B.length / 2],
    lean: 0,
    ears: [0.15, 0.12, -0.16],
    spine: [{ at: [0, top, -0.3], r: 0.22 }, { at: [0, top, -0.05], r: 0.22 }, { at: [0, top, 0.2], r: 0.2 }],
    socks: feet.map(([x, , z]) => ({ at: [x, L.thickness / 2, z], size: [L.thickness + 0.04, L.thickness, L.thickness + 0.04] })),
    chest: { at: [0, 0.41, B.length / 2 + 0.02], size: [0.26, 0.24] },
    belly: null,
    collar: { at: [0, top - 0.18 - 0.08 - MUZZLE_R - 0.04, B.length / 2 - 0.1], turn: [0, 0, 0], size: [B.width + 0.1, 0.07, 0.3] }, // under the muzzle
    tail: {
      points: [[0, top - 0.12, -B.length / 2 + 0.06], [0, top - 0.18, -B.length / 2 - 0.18], [0, top - 0.06, -B.length / 2 - 0.34], [0, top + 0.14, -B.length / 2 - 0.4], [0, top + 0.3, -B.length / 2 - 0.32]],
      rootR: 0.09,
      tipR: 0.055,
      sway: 1,
    },
    top,
  };
}

// How tall the cat stands off its ground: the top of its head.
export function catHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// whiskers' tips across, the tail's tip along.
export function catFootprintOf(C) {
  return { x: 0.55 * C.size, z: 1.15 * C.size };
}

// A whisker's turn: lying along x on side `s` (-1 left, +1 right), fanned
// up by `fan` radians and swept a little forward — the face is a flat
// front, so swept back they would run into it. Euler XYZ applies z
// first, which lays the cylinder flat and tilts it; then y sweeps it.
const WHISKER_SWEEP = -0.06;
const whiskerTurn = (s, fan) => [0, s * WHISKER_SWEEP, -s * (Math.PI / 2 - fan)];
const whiskerDir = (s, fan) =>
  new THREE.Vector3(s * Math.cos(fan) * Math.cos(WHISKER_SWEEP), Math.sin(fan), -Math.cos(fan) * Math.sin(WHISKER_SWEEP));
const FANS = [-0.16, 0, 0.16];
const MUZZLE_R = 0.11;
const EAR_BASE = 0.13, EAR_H = 0.3, EAR_TIP = 0.22; // the tip, as a share of the base: blunt, not a point

// The pink of an ear: a shape lying flat on the pyramid's front face.
// The pyramid (a four-sided cone turned an eighth, its point taken off)
// has that face from a base edge EAR_BASE / √2 forward of its axis up to
// a short top edge EAR_TIP of that, so the face leans back by `tilt`; the
// pink is the face shrunk toward its middle, set EAR_PROUD off it along
// its normal.
const EAR_PROUD = 0.004;
function earPaint() {
  const d = EAR_BASE / Math.SQRT2; // the front edge, forward of the axis
  const dTop = d * EAR_TIP; // the top edge, forward of the axis
  const L = Math.hypot(EAR_H, d - dTop); // the face, base to top
  const tilt = Math.atan2(d - dTop, EAR_H);
  const w = 2 * d * 0.6, wTop = 2 * dTop * 0.6, h = L * 0.6;
  const t = new THREE.Shape();
  t.moveTo(-w / 2, 0);
  t.lineTo(w / 2, 0);
  t.lineTo(wTop / 2, h);
  t.lineTo(-wTop / 2, h);
  t.closePath();
  const up = new THREE.Vector3(0, EAR_H, dTop - d).divideScalar(L); // along the face, base to top
  const out = new THREE.Vector3(0, d - dTop, EAR_H).divideScalar(L); // the face's normal
  const at = new THREE.Vector3(0, -EAR_H / 2, d).addScaledVector(up, (L - h) * 0.45).addScaledVector(out, EAR_PROUD);
  return { geo: new THREE.ShapeGeometry(t), at: at.toArray(), tilt };
}
const EYE_X = 0.15, EYE_Y = 0.05, EYE_R = 0.038, IRIS_SPREAD = 0.8;

// A turn that points local z along `dir`, as an Euler for a mesh.
const Z = new THREE.Vector3(0, 0, 1);
const along = (dir) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, dir.clone().normalize())).toArray().slice(0, 3);

const Y = new THREE.Vector3(0, 1, 0);

// One cat, standing on the ground at y = 0 facing +z. `config` overrides
// any of CAT's fields for this one instance; the coat it names lays its
// colours and markings under the rest of it.
export default function Cat({ config }) {
  const C = useMemo(() => merge(merge(CAT, coatOf(config?.coat ?? CAT.coat)), config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: head, body, legs and tail as one, poured round the pose's
  // balls and the tail's; with a copy of where every vertex rests, and
  // which are tail, for the swish to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The chest: painted on the front, from straight ahead, its top arched;
  // projected `depth` deep (0.4 unless the layout says), no further, so
  // it stays on the front it is meant for.
  const chest = useMemo(() => lay.chest && paintOn(lump.geo, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), [lay.chest.size[0], lay.chest.size[1], lay.chest.depth ?? 0.4], { arch: true, radius: lay.chest.radius ?? 0 }), [lump, lay.chest]);
  useEffect(() => () => chest?.dispose(), [chest]);
  // The belly: the same paint carried on down between the front legs,
  // sitting, projected the same way
  const bellyPatch = useMemo(() => lay.belly && paintOn(lump.geo, new THREE.Vector3(...lay.belly.at), new THREE.Euler(0, 0, 0), [lay.belly.size[0], lay.belly.size[1], lay.belly.depth]), [lump, lay.belly]);
  useEffect(() => () => bellyPatch?.dispose(), [bellyPatch]);

  // A tabby's stripes, painted on: bands across the back, each projected
  // straight down over one point of the spine; and bands round the tail,
  // each projected in from the side, square across the tail where it is.
  // The tail's carry the same weights as the lump's tail, so the swish
  // bends them with it.
  const stripes = useMemo(() => {
    if (!C.stripes) return null;
    const backs = lay.spine.map((b) => paintOn(lump.geo, new THREE.Vector3(b.at[0], b.at[1] + 0.1, b.at[2]), new THREE.Euler(-Math.PI / 2, 0, 0), [b.r * 2, 0.07, 0.6]));
    const tails = [0.38, 0.62, 0.85].map((f) => Math.round(f * (tail.length - 1))).map((k) => { // how far down the tail each ring goes
      const at = new THREE.Vector3(...tail[k].at);
      const t = new THREE.Vector3(...tail[k + 1].at).sub(new THREE.Vector3(...tail[k - 1].at)).normalize();
      const side = new THREE.Vector3().crossVectors(t, Y).normalize();
      if (side.lengthSq() < 0.5) side.set(1, 0, 0);
      const across = new THREE.Vector3().crossVectors(t, side);
      const turn = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, t, side));
      const geo = paintOn(lump.geo, at, turn, [tail[k].r * 4, 0.045, tail[k].r * 4]);
      return { geo, ...tailWeights(geo, tail), rest: restOf(geo) };
    });
    return { backs, tails };
  }, [C.stripes, lay, lump, tail]);
  useEffect(() => () => { stripes?.backs.forEach((g) => g.dispose()); stripes?.tails.forEach((t) => t.geo.dispose()); }, [stripes]);

  // The swish: the tail bent side to side about its root, each vertex by
  // its weight, the normals turned with it — the lump's, and the painted
  // stripes' on it.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.6) * 0.5 * C.swish * lay.tail.sway;
    bendTail(lump, lump.root, angle);
    stripes?.tails.forEach((t) => bendTail(t, lump.root, angle));
  });

  const head = new THREE.Vector3(...lay.face);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  const F = 0; // the face's middle is on the front surface
  const muzzle = head.clone().add(new THREE.Vector3(0, -0.08, F + 0.02));
  // The collar, if it wears one: a band painted across the front under
  // the muzzle, over the chest patch where they meet.
  const collar = useMemo(() => (C.collar ? paintOn(lump.geo, new THREE.Vector3(...lay.collar.at), new THREE.Euler(...lay.collar.turn), lay.collar.size, { lift: 0.009 }) : null), [C.collar, lump, lay.collar]);
  useEffect(() => () => collar?.dispose(), [collar]);
  // Socks, on a tuxedo: each foot painted white, the lump's surface
  // wherever it falls within a box round the foot.
  const socks = useMemo(() => (C.paws ? lay.socks.map((sock) => paintOn(lump.geo, new THREE.Vector3(...sock.at), new THREE.Euler(0, sock.yaw ?? 0, 0), sock.size)) : []), [C.paws, lump, lay.socks]);
  useEffect(() => () => socks.forEach((g) => g.dispose()), [socks]);
  const earPink = useMemo(() => earPaint(), []);
  useEffect(() => () => earPink.geo.dispose(), [earPink]);
  // The iris: a cap of the bead's sphere, the front IRIS_SPREAD of it
  // either way from straight ahead, a hair proud. Built round +y and
  // turned to face +z.
  const irisGeo = useMemo(() => new THREE.SphereGeometry(EYE_R + 0.002, 14, 6, 0, Math.PI * 2, 0, IRIS_SPREAD).rotateX(Math.PI / 2), []);
  useEffect(() => () => irisGeo.dispose(), [irisGeo]);
  const noseGeo = useMemo(() => {
    const t = new THREE.Shape();
    t.moveTo(-0.04, 0.02);
    t.lineTo(0.04, 0.02);
    t.lineTo(0, -0.04);
    t.closePath();
    return new THREE.ExtrudeGeometry(t, { depth: 0.02, bevelEnabled: false });
  }, []);
  useEffect(() => () => noseGeo.dispose(), [noseGeo]);
  return (
    <group scale={C.size}>
      {/* The lump: head, body and legs, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={fur} />
      {/* The chest: a lighter patch painted on the front. */}
      {chest && <mesh geometry={chest} receiveShadow material={belly} />}
      {bellyPatch && <mesh geometry={bellyPatch} receiveShadow material={belly} />}
      {/* Stripes painted over the back and round the tail, on a tabby. */}
      {stripes?.backs.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow material={markings} />
      ))}
      {stripes?.tails.map((t, i) => (
        <mesh key={i} geometry={t.geo} receiveShadow material={markings} />
      ))}
      {/* The collar, a band under the muzzle. */}
      {collar && <mesh geometry={collar} receiveShadow material={unlitMat(paint.collar)} />}
      {/* Socks painted round every foot, on a tuxedo. */}
      {socks.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow material={belly} />
      ))}
      {/* The face, drawn on the block's front, leaning back with it. */}
      <group position={lay.face} rotation-x={lay.lean}>
        {/* Ears: four-sided pyramids with the point taken off, turned so
            a face looks forward, their feet down in the block so they
            meet it along its edge;
            the pink painted on that front face, a flat triangle lying
            on it a hair proud. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * lay.ears[0], lay.ears[1] + EAR_H / 2 - 0.06, lay.ears[2]]} rotation-z={-s * 0.3}>
            <mesh rotation-y={Math.PI / 4} castShadow receiveShadow material={fur}>
              <cylinderGeometry args={[EAR_BASE * EAR_TIP, EAR_BASE, EAR_H, 4]} />
            </mesh>
            <mesh geometry={earPink.geo} position={earPink.at} rotation-x={-earPink.tilt} material={unlitMat(paint.ear)} />
          </group>
        ))}
        {/* The muzzle bump, in the belly colour; the nose, a little
            triangle point-down on its front; and the mouth, a line drawn
            down from the nose like a decal, leaning back with the bump. */}
        <mesh position={[0, -0.08, F + 0.02]} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[MUZZLE_R, 16, 12]} />
        </mesh>
        <mesh geometry={noseGeo} position={[0, -0.03, F + 0.02 + MUZZLE_R - 0.012]} castShadow material={unlitMat(paint.nose)} />
        <mesh position={[0, -0.095, F + 0.02 + MUZZLE_R - 0.018]} rotation-x={0.5} material={unlitMat(paint.pupil)}>
          <boxGeometry args={[0.012, 0.075, 0.012]} />
        </mesh>
        {/* Eyes: a dark bead with the iris painted on its front — a cap
            of a sphere a hair bigger than the bead, lying on it. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * EYE_X, EYE_Y, F + 0.004]}>
            <mesh castShadow material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[EYE_R, 12, 8]} />
            </mesh>
            <mesh geometry={irisGeo} material={unlitMat(paint.eyes)} />
          </group>
        ))}
      </group>
      {/* Whiskers: three hair-thin cylinders a side, fanned, from the
          front of the muzzle, clear of the face. */}
      {[-1, 1].map((s) =>
        FANS.map((fan, i) => {
          const at = whiskerDir(s, fan).multiplyScalar(0.2).add(muzzle).add(new THREE.Vector3(s * 0.05, 0, MUZZLE_R * 0.55));
          return (
            <mesh key={`${s}${i}`} position={at.toArray()} rotation={whiskerTurn(s, fan)} material={belly}>
              <cylinderGeometry args={[0.006, 0.006, 0.42, 4]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}
