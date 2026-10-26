import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";

import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn, paintWhere } from "../../world/paint.js";
import { hash3, noise3 } from "../../world/random.js";
import { Eye } from "../../world/eye.jsx";
import { TIGER } from "./objects.js";

// Where everything sits, at size 1: the cat's standing frame (see
// cat/Cat.jsx) a size up, with a tiger's parts on it. The tiger is one
// lump (see world/lump.js): `parts` are the forms it is poured from —
// ONE rounded block for head and body together, each leg a sturdier
// block pulled straight down out of one of its corners to the ground,
// and the tail a run of capsules out of its rear. The face is drawn on
// the block's front: `face` is the middle of it, on the front surface;
// `ears` where the two ears sit, from `face`. `frame` is the block's
// plan, for the stripes down the flanks and round the legs (see
// tigerMark); `brow` the
// short stripes on the forehead and the cheeks, each a box `at`, turned
// `turn`, `size` across, tall and deep, projected onto the head from
// ahead or in from a side; `chest` the white bib painted on the front, projected
// from `at` straight back along -z, `size` across and tall, `depth` how
// far back it reaches, its top arched and its bottom corners rounded
// off by `radius`. The tail is a curve of `points`
// from where it leaves the rear to its tip, `rootR` thick where it
// leaves and `tipR` at the tip; the swish bends it from the root. `top`
// is how tall the tiger stands.
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, blend: 0 });
  // A leg: a block from up inside the body straight down to the ground,
  // its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the face on its
  // front, the tail out of the top of its rear, curling up.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const bottom = 0.26, top = bottom + B.height;
  const front = B.length / 2, rear = -B.length / 2;
  const face = [0, top - 0.2, front];
  return {
    parts: [block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length]), ...feet.map(([x, , z]) => leg(x, z, 0.5))],
    face,
    ears: [0.2, 0.17, -0.16],
    frame: { L, feet, bottom, top, front, rear },
    // The forehead: three short strokes up from above the eyes over the
    // brow, the outer two leaning out, projected onto the front from
    // ahead; the cheeks: two short dashes a side on the side of the head
    // behind the eye, leaning back, projected in from that side
    brow: [
      { at: [0, face[1] + 0.15, front - 0.05], turn: [0, 0, 0], size: [0.04, 0.13, 0.22] },
      { at: [-0.09, face[1] + 0.145, front - 0.05], turn: [0, 0, 0.3], size: [0.035, 0.1, 0.22] },
      { at: [0.09, face[1] + 0.145, front - 0.05], turn: [0, 0, -0.3], size: [0.035, 0.1, 0.22] },
      ...[-1, 1].flatMap((s) => [
        { at: [s * (B.width / 2 + 0.05), face[1] + 0.02, front - 0.12], turn: [0, s * Math.PI / 2, s * 0.5], size: [0.035, 0.11, 0.2] },
        { at: [s * (B.width / 2 + 0.05), face[1] - 0.03, front - 0.21], turn: [0, s * Math.PI / 2, s * 0.5], size: [0.035, 0.09, 0.2] },
      ]),
    ],
    // The bib: up the chest's flat front from just over the block's
    // rounded bottom edge (below it, between the front legs, the paint
    // would turn under the belly and hang as a flap) to behind the
    // muzzle, its top arched and its bottom corners rounded off
    chest: { at: [0, 0.55, front + 0.02], size: [0.34, 0.3], depth: 0.4, radius: 0.08 },
    tail: {
      points: [[0, top - 0.14, rear + 0.08], [0, top - 0.26, rear - 0.22], [0, top - 0.18, rear - 0.44], [0, top + 0.04, rear - 0.54], [0, top + 0.28, rear - 0.46]],
      rootR: 0.1,
      tipR: 0.06,
    },
    top,
  };
}

// How tall the tiger stands off its ground: the top of its ears.
export function tigerHeightOf(C) {
  return (layoutOf(C).top + 0.1) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// whiskers' tips across, the tail's tip along.
export function tigerFootprintOf(C) {
  return { x: 0.62 * C.size, z: 1.2 * C.size };
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
const MUZZLE_R = 0.12;
// An ear: a sphere flattened front to back to a round disc, its lower
// half down in the block; the pink a smaller disc of the same, sat
// forward so its front stands EAR_PROUD out through the ear's.
const EAR_R = 0.11, EAR_FLAT = 0.5, EAR_PINK = 0.6, EAR_PROUD = 0.012;
const EYE_X = 0.17, EYE_Y = 0.05, EYE_R = 0.05;

const Y = new THREE.Vector3(0, 1, 0);

// THE STRIPES down the flanks: narrow dark strokes from over the spine
// (where they meet across the back) down the sides, each leaning back a
// little, bowed a little its own way, tapering to a point at a height
// of its own above the white belly, and every few forking into two
// lower down, as a tiger's do; none on the face (its strokes are
// `brow`'s) or the rump's end, where the tail leaves. On the legs, short
// bars across the outside of each, fading out round to the inside.
// `gap` between strokes along the body, from `from` in front of the
// rump to `to` behind the face; `width` the widest a stroke gets; the
// height it tapers out at somewhere in `ends` (0 the belly, 1 the back).
const STRIPES = { from: 0.1, to: 0.3, gap: 0.085, width: 0.03, slant: 0.06, ends: [0.15, 0.5], fork: 0.3, legs: [0.21, 0.15, 0.09], leg: 0.016, wobble: 0.008 };
function tigerMark({ L, feet, bottom, top, front, rear }, seed = 3) {
  const S = STRIPES, strokes = [];
  for (let z = rear + S.from, k = 0; z < front - S.to; z += S.gap, k++) {
    strokes.push({
      z: z + (hash3(k, 0, 0, seed) - 0.5) * 0.025,
      end: S.ends[0] + hash3(k, 1, 0, seed) * (S.ends[1] - S.ends[0]),
      w: S.width * (0.7 + 0.5 * hash3(k, 2, 0, seed)),
      bow: (hash3(k, 3, 0, seed) - 0.5) * 0.06,
      fork: hash3(k, 4, 0, seed) < S.fork,
    });
  }
  return (p) => {
    const wob = S.wobble * noise3(p.x * 10, p.y * 10, p.z * 10, seed);
    if (p.y < bottom) {
      const [fx, , fz] = feet.reduce((a, b) => (Math.hypot(p.x - b[0], p.z - b[2]) < Math.hypot(p.x - a[0], p.z - a[2]) ? b : a));
      const out = Math.min(1, Math.max(0, ((Math.abs(p.x) - Math.abs(fx)) / L.thickness + 0.5 - 0.25) / 0.5)); // 0 on the inside, 1 on the outside
      const y = p.y + 0.15 * (p.z - fz) + wob;
      return (S.leg / 2) * out - Math.min(...S.legs.map((b) => Math.abs(y - b)));
    }
    if (p.z < rear + 0.05 || p.z > front - S.to + 0.02) return -1;
    const h = (p.y - bottom) / (top - bottom);
    let best = -1;
    for (const k of strokes) {
      if (h < k.end) continue;
      const taper = Math.pow((h - k.end) / (1 - k.end), 0.6);
      let d = Math.abs(p.z - (k.z + S.slant * (1 - h) + k.bow * Math.sin(h * Math.PI) + wob));
      if (k.fork && h < (k.end + 1) / 2) d = Math.abs(d - k.w * 0.6); // forked: two strokes either side of the line
      best = Math.max(best, (k.w / 2) * taper - d);
    }
    return best;
  };
}

// One tiger, standing on the ground at y = 0 facing +z. `config`
// overrides any of TIGER's fields for this one instance.
export default function Tiger({ config }) {
  const C = useMemo(() => merge(TIGER, config), [config]);
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

  // The bib: painted on the front, from straight ahead, its top arched;
  // projected `depth` deep, no further, so it stays on the front it is
  // meant for.
  const chest = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), [lay.chest.size[0], lay.chest.size[1], lay.chest.depth], { arch: true, radius: lay.chest.radius }), [lump, lay.chest]);
  useEffect(() => () => chest.dispose(), [chest]);

  // The stripes, painted on: the strokes down the flanks and the bars
  // round the legs, wherever tigerMark falls; short strokes on the forehead and the cheeks,
  // projected onto the front from ahead; and rings round the tail, each
  // projected in from the side, square across the tail where it is. The
  // tail's carry the same weights as the lump's tail, so the swish bends
  // them with it.
  const stripes = useMemo(() => {
    if (!C.stripes) return null;
    const backs = [paintWhere(lump.geo, tigerMark(lay.frame))];
    const brows = lay.brow.map((b) => paintOn(lump.geo, new THREE.Vector3(...b.at), new THREE.Euler(...b.turn), b.size));
    const tails = [0.3, 0.55, 0.8].map((f) => Math.round(f * (tail.length - 1))).map((k) => { // how far down the tail each ring goes
      const at = new THREE.Vector3(...tail[k].at);
      const t = new THREE.Vector3(...tail[k + 1].at).sub(new THREE.Vector3(...tail[k - 1].at)).normalize();
      const side = new THREE.Vector3().crossVectors(t, Y).normalize();
      if (side.lengthSq() < 0.5) side.set(1, 0, 0);
      const across = new THREE.Vector3().crossVectors(t, side);
      const turn = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, t, side));
      const geo = paintOn(lump.geo, at, turn, [tail[k].r * 4, 0.05, tail[k].r * 4]);
      return { geo, ...tailWeights(geo, tail), rest: restOf(geo) };
    });
    return { backs, brows, tails };
  }, [C.stripes, lay, lump, tail]);
  useEffect(() => () => { stripes?.backs.forEach((g) => g.dispose()); stripes?.brows.forEach((g) => g.dispose()); stripes?.tails.forEach((t) => t.geo.dispose()); }, [stripes]);

  // The swish: the tail bent side to side about its root, each vertex by
  // its weight, the normals turned with it — the lump's, and the painted
  // rings' on it.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.2) * 0.5 * C.swish;
    bendTail(lump, lump.root, angle);
    stripes?.tails.forEach((t) => bendTail(t, lump.root, angle));
  });

  const head = new THREE.Vector3(...lay.face);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  const F = 0; // the face's middle is on the front surface
  const muzzle = head.clone().add(new THREE.Vector3(0, -0.07, F + 0.02));
  const noseGeo = useMemo(() => {
    const t = new THREE.Shape();
    t.moveTo(-0.045, 0.022);
    t.lineTo(0.045, 0.022);
    t.lineTo(0, -0.045);
    t.closePath();
    return new THREE.ExtrudeGeometry(t, { depth: 0.02, bevelEnabled: false });
  }, []);
  useEffect(() => () => noseGeo.dispose(), [noseGeo]);
  return (
    <group scale={C.size}>
      {/* The lump: head, body, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={fur} />
      {/* The bib: a white patch painted on the chest. */}
      <mesh geometry={chest} receiveShadow material={belly} />
      {/* Stripes down the flanks and round the legs, on the face and round the tail. */}
      {stripes?.backs.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow material={markings} />
      ))}
      {stripes?.brows.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow material={markings} />
      ))}
      {stripes?.tails.map((t, i) => (
        <mesh key={i} geometry={t.geo} receiveShadow material={markings} />
      ))}
      {/* The face, drawn on the block's front. */}
      <group position={lay.face}>
        {/* Ears: round discs on the top front corners, leant out a
            little, their feet down in the block so they meet it along
            its edge; the pink a smaller disc showing through the front. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} rotation-z={-s * 0.25}>
            <mesh scale={[1, 1, EAR_FLAT]} castShadow receiveShadow material={fur}>
              <sphereGeometry args={[EAR_R, 16, 12]} />
            </mesh>
            <mesh position={[0, 0.005, EAR_R * EAR_FLAT * (1 - EAR_PINK) + EAR_PROUD]} scale={[EAR_PINK, EAR_PINK, EAR_FLAT * EAR_PINK]} material={unlitMat(paint.ear)}>
              <sphereGeometry args={[EAR_R, 16, 12]} />
            </mesh>
          </group>
        ))}
        {/* The muzzle bump, white; the nose, a pink triangle point-down
            on its front; and the mouth, a line drawn down from the nose
            like a decal, leaning back with the bump. */}
        <mesh position={[0, -0.07, F + 0.02]} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[MUZZLE_R, 16, 12]} />
        </mesh>
        <mesh geometry={noseGeo} position={[0, -0.02, F + 0.02 + MUZZLE_R - 0.012]} castShadow material={unlitMat(paint.nose)} />
        <mesh position={[0, -0.09, F + 0.02 + MUZZLE_R - 0.02]} rotation-x={0.5} material={unlitMat(paint.pupil)}>
          <boxGeometry args={[0.012, 0.08, 0.012]} />
        </mesh>
        {/* Eyes: white eyeballs with a round dark pupil (world/eye.jsx). */}
        {[-1, 1].map((s) => (
          <Eye key={s} position={[s * EYE_X, EYE_Y, F + 0.004]} r={EYE_R} pupil={paint.pupil} />
        ))}
      </group>
      {/* Whiskers: three hair-thin cylinders a side, fanned, from the
          front of the muzzle, clear of the face. */}
      {[-1, 1].map((s) =>
        FANS.map((fan, i) => {
          const at = whiskerDir(s, fan).multiplyScalar(0.22).add(muzzle).add(new THREE.Vector3(s * 0.05, 0, MUZZLE_R * 0.55));
          return (
            <mesh key={`${s}${i}`} position={at.toArray()} rotation={whiskerTurn(s, fan)} material={belly}>
              <cylinderGeometry args={[0.006, 0.006, 0.46, 4]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}
