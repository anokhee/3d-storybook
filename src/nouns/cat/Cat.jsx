import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

import { lumpOf } from "./lump.js";
import { CAT, coatOf } from "./objects.js";

// Where everything sits for each pose, at size 1. The cat is one lump
// (see lump.js): `parts` are the forms it is poured from — ONE rounded
// block for head and body together, each leg a slimmer block pulled
// straight down out of it to the ground, and the tail a run of capsules
// out of its rear. The face is drawn on the block's front: `face` is the
// middle of it, on the front surface, and `lean` how the front leans
// back (the eyes, muzzle and ears go with it); `ears` where the two ears
// stand, from `face`. `spine` is where the stripes go, along the top,
// with how wide; `feet` where the socks go; `chest` the lighter patch
// painted on the front, projected from `at` straight back along -z,
// `size` across and tall, or null. The tail is a curve of `points` from
// where it leaves the rear to its tip, `rootR` thick where it leaves and
// `tipR` at the tip; the swish bends it from the root, `sway` scaling
// that, small when the tail lies on the ground. `top` is how tall the
// cat stands.
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size, tilt = 0) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, tilt, blend: 0 });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  if (C.pose === "sitting") {
    // The block stood on end and tipped back to rest on its bottom rear
    // edge, so its front lifts off the ground; the front legs hang from
    // the raised front corners down to the ground, and the hind toes peek
    // out under it at the sides. No haunches of its own: the block's
    // base is the seat.
    const lean = -0.35;
    const sw = B.width * 0.9, sh = 0.9, sl = B.length * 0.55;
    const lx = sw / 2 - L.thickness / 2 - 0.01;
    const feet = [[-lx, 0, 0.28], [lx, 0, 0.28]];
    return {
      parts: [
        block([0, 0.64, -0.06], [sw, sh, sl], lean),
        { kind: "box", at: [-0.2, 0.05, 0.1], half: [0.03, 0.02, 0.07], round: 0.035, blend: 0.03 }, // the hind toes
        { kind: "box", at: [0.2, 0.05, 0.1], half: [0.03, 0.02, 0.07], round: 0.035, blend: 0.03 },
        leg(-lx, 0.28, 0.45),
        leg(lx, 0.28, 0.45),
      ],
      face: [0, 0.96, 0.1],
      lean,
      ears: [0.15, 0.2, -0.14],
      spine: [{ at: [0, 1.0, -0.32], r: 0.18 }, { at: [0, 1.0, -0.12], r: 0.18 }],
      feet,
      chest: { at: [0, 0.62, 0.4], size: [0.26, 0.4] },
      tail: {
        points: [[0.1, 0.2, -0.26], [0.3, 0.1, -0.4], [0.46, 0.08, -0.1], [0.4, 0.08, 0.25], [0.12, 0.08, 0.42]],
        rootR: 0.09,
        tipR: 0.055,
        sway: 0.25,
      },
      top: 1.18,
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
      feet,
      chest: null,
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
    feet,
    chest: { at: [0, 0.41, B.length / 2 + 0.02], size: [0.26, 0.24] },
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

// The tail: TAIL_SAMPLES points along its curve, thinning from the root
// to the tip, and the capsules between them for the lump. The first point
// sits inside the rump, so the tail grows out of it with no seam.
const TAIL_SAMPLES = 14;
function tailBalls(tail) {
  const curve = new THREE.CatmullRomCurve3(tail.points.map((p) => new THREE.Vector3(...p)));
  return Array.from({ length: TAIL_SAMPLES }, (_, i) => {
    const u = i / (TAIL_SAMPLES - 1);
    return { at: curve.getPointAt(u).toArray(), r: THREE.MathUtils.lerp(tail.rootR, tail.tipR, u), u };
  });
}
const tailParts = (samples) =>
  samples.slice(1).map((b, i) => ({ kind: "capsule", a: samples[i].at, b: b.at, ra: samples[i].r, rb: b.r, blend: i === 0 ? 0.1 : 0.02 }));

// Which of the lump's vertices are tail, and how far along it: each is
// given the `u` of the nearest tail ball if it lies within reach of it,
// eased so the root barely moves and the tip moves fully, or 0 for the
// rest of the cat. The swish then bends the tail about a vertical axis
// through the root, every vertex by its own share of the angle, so the
// tail curls from where it leaves the rump rather than hinging.
function tailWeights(geo, balls) {
  const pos = geo.attributes.position.array;
  const n = pos.length / 3;
  const weights = new Float32Array(n);
  const index = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    let best = -1, bestD = Infinity;
    for (let k = 1; k < balls.length; k++) {
      const b = balls[k];
      const d = v.distanceTo(new THREE.Vector3(...b.at));
      if (d < b.r * 1.8 && d < bestD) { bestD = d; best = k; }
    }
    if (best < 0) continue;
    const u = balls[best].u;
    weights[i] = u * u * (3 - 2 * u);
    index.push(i);
  }
  return { weights, index: Int32Array.from(index) };
}

// Paint on the lump: its own surface where a box at `at`, turned `turn`
// and `size` across, tall and deep, falls on it, copied out as a decal
// and lifted a hair along its normals so it sits on the fur. `arch`
// rounds the patch's top off into a half-circle as wide as the patch:
// the decal's triangles are trimmed against a fan of planes tangent to
// that circle, in the box's own frame, the way the decal itself was
// trimmed to the box.
function paintOn(geo, at, turn, size, { arch = false } = {}) {
  const onto = new THREE.Mesh(geo);
  onto.updateMatrixWorld();
  let decal = new DecalGeometry(onto, at, turn, new THREE.Vector3(...size));
  if (arch) decal = archTop(decal, at, turn, size);
  const p = decal.attributes.position.array, n = decal.attributes.normal.array;
  for (let i = 0; i < p.length; i++) p[i] += n[i] * 0.006;
  return decal;
}

// A triangle clipped to the half-space n·p <= d (Sutherland–Hodgman),
// as a polygon of { p, n } corners, each new corner interpolated along
// the edge it cuts.
function clipPolygon(poly, normal, d) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = a.p.dot(normal) - d, db = b.p.dot(normal) - d;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() });
    }
  }
  return out;
}

const ARCH_PLANES = 9;
function archTop(decal, at, turn, size) {
  const frame = new THREE.Matrix4().makeRotationFromEuler(turn).setPosition(at);
  const into = frame.clone().invert();
  const r = size[0] / 2, cy = size[1] / 2 - r; // the circle: as wide as the patch, at its top
  const planes = Array.from({ length: ARCH_PLANES }, (_, k) => {
    const a = (Math.PI * (k + 1)) / (ARCH_PLANES + 1);
    const normal = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    return { normal, d: normal.y * cy + r };
  });
  const pos = decal.attributes.position, nor = decal.attributes.normal;
  const outP = [], outN = [];
  const rot = new THREE.Matrix3().setFromMatrix4(into), back = new THREE.Matrix3().setFromMatrix4(frame);
  for (let i = 0; i < pos.count; i += 3) {
    let poly = [0, 1, 2].map((k) => ({
      p: new THREE.Vector3().fromBufferAttribute(pos, i + k).applyMatrix4(into),
      n: new THREE.Vector3().fromBufferAttribute(nor, i + k).applyMatrix3(rot),
    }));
    for (const { normal, d } of planes) {
      poly = clipPolygon(poly, normal, d);
      if (poly.length < 3) break;
    }
    for (let k = 1; k + 1 < poly.length; k++) {
      for (const c of [poly[0], poly[k], poly[k + 1]]) {
        outP.push(...c.p.clone().applyMatrix4(frame).toArray());
        outN.push(...c.n.clone().applyMatrix3(back).toArray());
      }
    }
  }
  decal.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(outP, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(outN, 3));
  return geo;
}
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
    const rest = { position: geo.attributes.position.array.slice(), normal: geo.attributes.normal.array.slice() };
    return { geo, rest, ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The chest: painted on the front, from straight ahead, its top arched.
  const chest = useMemo(() => lay.chest && paintOn(lump.geo, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), [lay.chest.size[0], lay.chest.size[1], 0.4], { arch: true }), [lump, lay.chest]);
  useEffect(() => () => chest?.dispose(), [chest]);

  // A tabby's stripes, painted on: bands across the back, each projected
  // straight down over one point of the spine; and bands round the tail,
  // each projected in from the side, square across the tail where it is.
  // The tail's carry the same weights as the lump's tail, so the swish
  // bends them with it.
  const stripes = useMemo(() => {
    if (!C.stripes) return null;
    const backs = lay.spine.map((b) => paintOn(lump.geo, new THREE.Vector3(b.at[0], b.at[1] + 0.1, b.at[2]), new THREE.Euler(-Math.PI / 2, 0, 0), [b.r * 2, 0.07, 0.6]));
    const tails = [5, 8, 11].map((k) => {
      const at = new THREE.Vector3(...tail[k].at);
      const t = new THREE.Vector3(...tail[k + 1].at).sub(new THREE.Vector3(...tail[k - 1].at)).normalize();
      const side = new THREE.Vector3().crossVectors(t, Y).normalize();
      if (side.lengthSq() < 0.5) side.set(1, 0, 0);
      const across = new THREE.Vector3().crossVectors(t, side);
      const turn = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, t, side));
      const geo = paintOn(lump.geo, at, turn, [tail[k].r * 4, 0.045, tail[k].r * 4]);
      return { geo, ...tailWeights(geo, tail), rest: { position: geo.attributes.position.array.slice(), normal: geo.attributes.normal.array.slice() } };
    });
    return { backs, tails };
  }, [C.stripes, lay, lump, tail]);
  useEffect(() => () => { stripes?.backs.forEach((g) => g.dispose()); stripes?.tails.forEach((t) => t.geo.dispose()); }, [stripes]);

  // The swish: the tail bent side to side about its root, each vertex by
  // its weight, the normals turned with it — the lump's, and the painted
  // stripes' on it.
  const clock = useRef(0);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.6) * 0.5 * C.swish * lay.tail.sway;
    const root = lump.root;
    const bend = ({ geo, rest, weights, index }) => {
      const pos = geo.attributes.position.array;
      const nor = geo.attributes.normal.array;
      for (let j = 0; j < index.length; j++) {
        const i = index[j], o = i * 3;
        q.setFromAxisAngle(Y, angle * weights[i]);
        v.set(rest.position[o] - root.x, rest.position[o + 1] - root.y, rest.position[o + 2] - root.z).applyQuaternion(q);
        pos[o] = v.x + root.x; pos[o + 1] = v.y + root.y; pos[o + 2] = v.z + root.z;
        v.set(rest.normal[o], rest.normal[o + 1], rest.normal[o + 2]).applyQuaternion(q);
        nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
    };
    bend(lump);
    stripes?.tails.forEach(bend);
  });

  const head = new THREE.Vector3(...lay.face);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  const F = 0; // the face's middle is on the front surface
  const muzzle = head.clone().add(new THREE.Vector3(0, -0.08, F + 0.02));
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
      {/* Stripes painted over the back and round the tail, on a tabby. */}
      {stripes?.backs.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow material={markings} />
      ))}
      {stripes?.tails.map((t, i) => (
        <mesh key={i} geometry={t.geo} receiveShadow material={markings} />
      ))}
      {/* Socks: a foot again, a hair bigger, in white, on a tuxedo. */}
      {C.paws &&
        lay.feet.map((at, i) => (
          <mesh key={i} position={[at[0], at[1] + C.legs.thickness / 2, at[2]]} castShadow material={belly}>
            <sphereGeometry args={[C.legs.thickness / 2 + 0.014, 12, 8]} />
          </mesh>
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
