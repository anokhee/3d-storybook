import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { WOLF } from "./objects.js";

// Where everything sits, at size 1: the dog's standing frame (see
// dog/Dog.jsx) stretched into a big wild dog. The wolf is one lump (see
// world/lump.js): `parts` are the forms it is poured from — ONE rounded
// block for head and body together, each leg a slimmer, longer block
// pulled straight down out of one of its corners to the ground, the
// snout a longer, narrower block out of the front, and the tail a run
// of capsules out of its rump, held low and straight back. The face is
// drawn on the block's front: `face` is the middle of it, on the front
// surface; `ears` where the two ears stand, from `face`. `muzzle` is
// the cream painted round the lower half of the snout, a box `at`,
// `size` across, tall and deep, that the lump's surface is painted
// within; `chest` the lighter bib painted on the front below it,
// projected from `at` straight back along -z, `size` across and tall,
// `depth` how far back it reaches, its top arched; `belly` the same
// paint under the body between the legs, a box `at`, `size` across,
// long and deep, projected up from below; `saddle` the darker patch
// down the spine, a box projected down onto the back from `at`, `size`
// across, long and deep, turned so its arched end is behind the ears
// and its bottom corners, rounded `radius`, are at the rump. The tail
// is a curve of `points` from where it leaves the rump to its tip,
// `rootR` thick where it leaves and `tipR` at the tip; the wag bends it
// from the root, `sway` scaling that. `top` is how tall the wolf
// stands, to the top of its head (the ears rise above that).
//
// The snout: a block out of the lower half of the face, `size` across,
// tall and deep, its edges rounded `round`, its front `out` ahead of the
// face, its middle `down` below the face's.
const SNOUT = { size: [0.22, 0.18, 0.4], round: 0.06, out: 0.24, down: 0.07 };
const EYE_X = 0.14, EYE_Y = 0.05, EYE_R = 0.04, PUPIL_R = 0.02;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, blend: 0 });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The snout: a block run back into the face
  const snout = (face) => ({
    kind: "box",
    at: [0, face[1] - SNOUT.down, face[2] + SNOUT.out - SNOUT.size[2] / 2],
    half: SNOUT.size.map((s) => s / 2 - SNOUT.round),
    round: SNOUT.round,
    blend: 0.03,
  });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the face on its
  // front, the tail out of its rump, low, straight back and drooping a
  // little toward the tip.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = 0.62, bottom = legTop - 0.17, top = bottom + B.height;
  const front = B.length / 2;
  const face = [0, top - 0.17, front];
  const snoutBottom = face[1] - SNOUT.down - SNOUT.size[1] / 2; // the underside of the snout
  const bibW = 0.22, bibTop = snoutBottom + 0.02, bibBottom = bottom + 0.02;
  const saddleFront = front - 0.34, saddleBack = -front + 0.06;
  return {
    parts: [block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length]), ...feet.map(([x, , z]) => leg(x, z, legTop)), snout(face)],
    face,
    ears: [0.17, 0.1, -0.16],
    // The muzzle: a box round the lower half of the snout, from a hair
    // behind the face's front to past the snout's end, so the chin and
    // the sides of the snout are painted along with its front
    muzzle: { at: [0, snoutBottom + 0.045, front + SNOUT.out / 2 + 0.01], size: [SNOUT.size[0] + 0.06, 0.09, SNOUT.out + 0.08] },
    // The bib: from up under the muzzle down the chest to the block's
    // bottom edge, between the front legs, its top arched
    chest: { at: [0, (bibTop + bibBottom) / 2, front + 0.02], size: [bibW, bibTop - bibBottom], depth: 0.4 },
    // The belly: a strip along the underside between the legs, short of
    // their inner faces
    belly: { at: [0, bottom - 0.02, 0], size: [0.18, lz * 2 - L.thickness - 0.12, 0.3] },
    // The saddle: down the spine from behind the ears to the rump
    saddle: { at: [0, top + 0.05, (saddleFront + saddleBack) / 2], size: [0.28, saddleFront - saddleBack, 0.3], radius: 0.1 },
    tail: {
      points: [[0, top - 0.2, -front + 0.08], [0, top - 0.3, -front - 0.16], [0, top - 0.42, -front - 0.38], [0, top - 0.5, -front - 0.56]], // out of the rump, back and down a little
      rootR: 0.095,
      tipR: 0.075,
      sway: 1,
    },
    top,
  };
}

// How tall the wolf stands off its ground: the top of its head.
export function wolfHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, nose to the tail's tip along.
export function wolfFootprintOf(C) {
  return { x: 0.32 * C.size, z: 1.2 * C.size };
}

const EAR_BASE = 0.15, EAR_H = 0.34, EAR_TIP = 0.12; // the tip, as a share of the base: a point, near enough
const EAR_TILT = 0.25; // how far each ear leans outward

// The cream of an ear: a shape lying flat on the pyramid's front face.
// The pyramid (a four-sided cone turned an eighth, its point taken off)
// has that face from a base edge EAR_BASE / √2 forward of its axis up to
// a short top edge EAR_TIP of that, so the face leans back by `tilt`; the
// cream is the face shrunk toward its middle, set EAR_PROUD off it along
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

const Y = new THREE.Vector3(0, 1, 0);

// One wolf, standing on the ground at y = 0 facing +z. `config` overrides
// any of WOLF's fields for this one instance.
export default function Wolf({ config }) {
  const C = useMemo(() => merge(WOLF, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: head, body, snout, legs and tail as one, poured round the
  // pose's parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The cream: the muzzle, a box round the lower half of the snout; the
  // chest, painted on the front from straight ahead, its top arched; and
  // the belly, a strip under the body from below.
  const muzzle = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(0, 0, 0), lay.muzzle.size), [lump, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);
  const chest = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), [lay.chest.size[0], lay.chest.size[1], lay.chest.depth], { arch: true }), [lump, lay.chest]);
  useEffect(() => () => chest.dispose(), [chest]);
  const belly = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.belly.at), new THREE.Euler(Math.PI / 2, 0, 0), lay.belly.size), [lump, lay.belly]);
  useEffect(() => () => belly.dispose(), [belly]);

  // The markings: the saddle, painted down onto the back — turned so
  // the arch of its top is at the front, behind the ears, and its
  // rounded bottom corners at the rump — and the tail's tip, a box
  // square across the tail near its end, projected in from the side,
  // carrying the same weights as the lump's tail so the wag bends it
  // with it.
  const saddle = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.saddle.at), new THREE.Euler(-Math.PI / 2, 0, Math.PI), lay.saddle.size, { arch: true, radius: lay.saddle.radius }), [lump, lay.saddle]);
  useEffect(() => () => saddle.dispose(), [saddle]);
  const tip = useMemo(() => {
    const k = tail.length - 3; // how far down the tail the tip's paint starts
    const at = new THREE.Vector3(...tail[k].at);
    const t = new THREE.Vector3(...tail[k + 1].at).sub(new THREE.Vector3(...tail[k - 1].at)).normalize();
    const side = new THREE.Vector3().crossVectors(t, Y).normalize();
    if (side.lengthSq() < 0.5) side.set(1, 0, 0);
    const across = new THREE.Vector3().crossVectors(t, side);
    const turn = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, t, side));
    const geo = paintOn(lump.geo, at, turn, [tail[k].r * 4, 0.24, tail[k].r * 4]);
    return { geo, ...tailWeights(geo, tail), rest: restOf(geo) };
  }, [lump, tail]);
  useEffect(() => () => tip.geo.dispose(), [tip]);

  // The wag: the tail swung slowly side to side about its root, each
  // vertex by its weight, the normals turned with it — the lump's, and
  // the painted tip's on it.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 4) * 0.35 * C.wag * lay.tail.sway;
    bendTail(lump, lump.root, angle);
    bendTail(tip, lump.root, angle);
  });

  const earCream = useMemo(() => earPaint(), []);
  useEffect(() => () => earCream.geo.dispose(), [earCream]);

  const coat = unlitMat(paint.coat);
  const cream = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  return (
    <group scale={C.size}>
      {/* The lump: head, body, snout, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The cream: round the muzzle, a bib on the chest, a strip under
          the belly. */}
      <mesh geometry={muzzle} receiveShadow material={cream} />
      <mesh geometry={chest} receiveShadow material={cream} />
      <mesh geometry={belly} receiveShadow material={cream} />
      {/* The markings: the saddle down the back, the tail's dark tip. */}
      <mesh geometry={saddle} receiveShadow material={markings} />
      <mesh geometry={tip.geo} receiveShadow material={markings} />
      {/* The face, drawn on the block's front. */}
      <group position={lay.face}>
        {/* Ears: four-sided pyramids with the point all but kept, turned
            so a face looks forward, their feet down in the block so they
            meet it along its edge, leaning a little outward; the cream
            painted on that front face, a flat triangle lying on it a hair
            proud. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * lay.ears[0], lay.ears[1] + EAR_H / 2 - 0.06, lay.ears[2]]} rotation-z={-s * EAR_TILT}>
            <mesh rotation-y={Math.PI / 4} castShadow receiveShadow material={coat}>
              <cylinderGeometry args={[EAR_BASE * EAR_TIP, EAR_BASE, EAR_H, 4]} />
            </mesh>
            <mesh geometry={earCream.geo} position={earCream.at} rotation-x={-earCream.tilt} material={cream} />
          </group>
        ))}
        {/* The nose: a dark bead on the end of the snout. */}
        <mesh position={[0, -SNOUT.down + 0.03, SNOUT.out - 0.01]} castShadow material={unlitMat(paint.nose)}>
          <sphereGeometry args={[0.06, 12, 8]} />
        </mesh>
        {/* Eyes: a pale amber bead either side above the snout, a
            small dark bead of a pupil set on the front of each. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * EYE_X, EYE_Y, 0.004]}>
            <mesh castShadow material={unlitMat(paint.eyes)}>
              <sphereGeometry args={[EYE_R, 12, 8]} />
            </mesh>
            <mesh position={[0, 0, EYE_R - PUPIL_R * 0.6]} material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[PUPIL_R, 10, 6]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
