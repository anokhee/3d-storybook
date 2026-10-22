import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

import { lumpOf } from "./lump.js";
import { CAT, coatOf } from "./objects.js";

// Where everything sits for each pose, at size 1. The cat is one lump
// (see lump.js): `balls` are the metaballs it is poured round — the body
// as a row of them, the head on a neck ball, each leg a chain pulled down
// out of the body to a foot on the ground. `spine` is the body's balls in
// order, for the stripes to ring; `feet` where the socks go; `chest` the
// lighter patch painted on the front — projected onto the lump from
// `at`, straight back along -z, `size` across and tall — or null. The tail is a curve of
// `points` from where it leaves the rump to its tip, poured into the lump
// too, `rootR` thick where it leaves and `tipR` at the tip; the swish
// bends it from the root, `sway` scaling that, small when the tail lies
// on the ground. `top` is how tall the cat stands, at the head.
const LEG_SAMPLES = 8;
function layoutOf(C) {
  const B = C.body;
  const H = C.head;
  const L = C.legs;
  // A leg: a thicker ball up in the body and the foot on the ground, with
  // balls between them on a curve — thinning fast just under the body,
  // then easing into an even shaft down to the foot — so the leg flares
  // smoothly out of the belly instead of beading or coning.
  const leg = (x, z, top) =>
    Array.from({ length: LEG_SAMPLES }, (_, i) => {
      const u = i / (LEG_SAMPLES - 1);
      const flare = (1 - u) * (1 - u);
      return { at: [x, THREE.MathUtils.lerp(top, L.radius, u), z], r: L.radius + 0.035 * flare };
    });
  if (C.pose === "sitting") {
    const spine = [
      { at: [0, 0.38, -0.2], r: B.radius + 0.02 },
      { at: [0, 0.62, -0.08], r: B.radius - 0.02 },
      { at: [0, 0.84, 0.08], r: B.radius - 0.07 },
    ];
    const head = [0, 1.05, 0.3];
    const feet = [[-0.16, L.radius, 0.3], [0.16, L.radius, 0.3]];
    return {
      balls: [
        ...spine,
        { at: [0, 0.95, 0.2], r: 0.2 }, // the neck
        { at: head, r: H.radius },
        { at: [-0.2, 0.26, -0.2], r: 0.25 }, // the haunches
        { at: [0.2, 0.26, -0.2], r: 0.25 },
        { at: [-0.2, 0.1, 0.1], r: 0.1 }, // the hind feet, toes forward
        { at: [0.2, 0.1, 0.1], r: 0.1 },
        ...leg(-0.16, 0.3, 0.55),
        ...leg(0.16, 0.3, 0.55),
      ],
      spine,
      feet,
      chest: { at: [0, 0.66, 0.5], size: [0.32, 0.42] },
      head,
      // Out of the rump low down and round the feet along the ground.
      tail: {
        points: [[0.1, 0.3, -0.42], [0.3, 0.1, -0.5], [0.48, 0.08, -0.2], [0.42, 0.08, 0.2], [0.15, 0.08, 0.45]],
        rootR: 0.1,
        tipR: 0.06,
        sway: 0.25,
      },
      top: head[1] + H.radius,
    };
  }
  if (C.pose === "loaf") {
    const spine = [
      { at: [0, 0.3, -0.35], r: B.radius - 0.02 },
      { at: [0, 0.32, -0.05], r: B.radius + 0.01 },
      { at: [0, 0.3, 0.2], r: B.radius - 0.02 },
    ];
    const head = [0, 0.6, 0.35];
    const feet = [[-0.15, 0.08, 0.5], [0.15, 0.08, 0.5]];
    return {
      balls: [
        ...spine,
        { at: [0, 0.5, 0.3], r: 0.2 }, // the neck
        { at: head, r: H.radius },
        { at: feet[0], r: 0.09 }, // the paws, peeking out
        { at: feet[1], r: 0.09 },
      ],
      spine,
      feet,
      chest: { at: [0, 0.36, 0.7], size: [0.3, 0.26] },
      head,
      // Out of the rump and laid along the side.
      tail: {
        points: [[0.1, 0.22, -0.56], [0.3, 0.09, -0.65], [0.42, 0.08, -0.3], [0.4, 0.08, 0.15], [0.28, 0.08, 0.5]],
        rootR: 0.1,
        tipR: 0.06,
        sway: 0.2,
      },
      top: head[1] + H.radius,
    };
  }
  const spine = [
    { at: [0, 0.66, -0.3], r: B.radius - 0.05 },
    { at: [0, 0.68, 0.0], r: B.radius - 0.02 },
    { at: [0, 0.66, 0.26], r: B.radius - 0.06 },
  ];
  const head = [0, 0.96, 0.52];
  const feet = [[-0.2, L.radius, 0.3], [0.2, L.radius, 0.3], [-0.2, L.radius, -0.3], [0.2, L.radius, -0.3]];
  return {
    balls: [
      ...spine,
      { at: [0, 0.84, 0.4], r: 0.17 }, // the neck
      { at: head, r: H.radius },
      ...feet.flatMap(([x, , z]) => leg(x, z, 0.44)),
    ],
    spine,
    feet,
    chest: { at: [0, 0.5, 0.66], size: [0.3, 0.36] },
    head,
    // Out of the top of the rump, dipping, then curling up.
    tail: {
      points: [[0, 0.78, -0.46], [0, 0.72, -0.68], [0, 0.82, -0.84], [0, 1.02, -0.9], [0, 1.2, -0.82]],
      rootR: 0.1,
      tipR: 0.06,
      sway: 1,
    },
    top: head[1] + H.radius,
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
// up by `fan` radians and swept back a little. Euler XYZ applies z first,
// which lays the cylinder flat and tilts it; then y sweeps it back.
const WHISKER_SWEEP = 0.3;
const whiskerTurn = (s, fan) => [0, s * WHISKER_SWEEP, -s * (Math.PI / 2 - fan)];
const whiskerDir = (s, fan) =>
  new THREE.Vector3(s * Math.cos(fan) * Math.cos(WHISKER_SWEEP), Math.sin(fan), -Math.cos(fan) * Math.sin(WHISKER_SWEEP));
const FANS = [-0.16, 0, 0.16];
const MUZZLE_R = 0.11;

// An ear, its foot at y = 0 and its front at z = 0: a triangle EAR_W
// across the foot and EAR_H tall. The front is flat — a rim EAR_RIM wide
// and EAR_LIP deep round the pink inner, which lies at the back of that
// rim, set in — and behind it the ear is a pyramid, its three back faces
// drawing in to a point EAR_DEPTH behind the front.
const EAR_W = 0.24, EAR_H = 0.27, EAR_RIM = 0.035, EAR_LIP = 0.03, EAR_DEPTH = 0.12;
const triangle = (w, h, lift = 0) => {
  const t = new THREE.Shape();
  t.moveTo(-w / 2, lift);
  t.lineTo(w / 2, lift);
  t.lineTo(0, lift + h);
  t.closePath();
  return t;
};
function earGeometry() {
  const innerW = EAR_W - 2 * EAR_RIM * 1.7, innerH = EAR_H - EAR_RIM * 3.4;
  const outer = triangle(EAR_W, EAR_H);
  outer.holes.push(triangle(innerW, innerH, EAR_RIM));
  const rim = new THREE.ExtrudeGeometry(outer, { depth: EAR_LIP, bevelEnabled: false }).translate(0, 0, -EAR_LIP);
  const pink = new THREE.ExtrudeGeometry(triangle(innerW, innerH, EAR_RIM), { depth: 0.01, bevelEnabled: false }).translate(0, 0, -EAR_LIP);
  // The pyramid: the front triangle's three corners at the rim's back,
  // and an apex behind them, a third of the way up; three faces between.
  const a = [-EAR_W / 2, 0, -EAR_LIP], b = [EAR_W / 2, 0, -EAR_LIP], c = [0, EAR_H, -EAR_LIP], d = [0, EAR_H * 0.35, -EAR_LIP - EAR_DEPTH];
  const back = new THREE.BufferGeometry();
  back.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...d, ...b, ...b, ...d, ...c, ...c, ...d, ...a, ...a, ...b, ...c], 3));
  back.computeVertexNormals();
  return { rim, back, inner: pink };
}

// A turn that points local z along `dir`, as an Euler for a mesh.
const Z = new THREE.Vector3(0, 0, 1);
const along = (dir) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, dir.clone().normalize())).toArray().slice(0, 3);

// The tail as metaballs: TAIL_SAMPLES along its curve, thinning from the
// root to the tip. The first sits inside the rump, so the tail swells out
// of it with no seam.
const TAIL_SAMPLES = 14;
function tailBalls(tail) {
  const curve = new THREE.CatmullRomCurve3(tail.points.map((p) => new THREE.Vector3(...p)));
  return Array.from({ length: TAIL_SAMPLES }, (_, i) => {
    const u = i / (TAIL_SAMPLES - 1);
    return { at: curve.getPointAt(u).toArray(), r: THREE.MathUtils.lerp(tail.rootR, tail.tipR, u), u };
  });
}

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

// One cat, standing on the ground at y = 0 facing +z. `config` overrides
// any of CAT's fields for this one instance; the coat it names lays its
// colours and markings under the rest of it.
export default function Cat({ config }) {
  const C = useMemo(() => merge(merge(CAT, coatOf(config?.coat ?? CAT.coat)), config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const H = C.head;
  const L = C.legs;
  const paint = C.colors;

  // The lump: head, body, legs and tail as one, poured round the pose's
  // balls and the tail's; with a copy of where every vertex rests, and
  // which are tail, for the swish to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.balls, ...tail], { resolution: C.resolution });
    const rest = { position: geo.attributes.position.array.slice(), normal: geo.attributes.normal.array.slice() };
    return { geo, rest, ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The chest: the lump's own surface where the patch falls, copied and
  // lifted a hair off it along its normals, in the belly colour — paint,
  // not a bump.
  const chest = useMemo(() => {
    if (!lay.chest) return null;
    const onto = new THREE.Mesh(lump.geo);
    onto.updateMatrixWorld();
    const geo = new DecalGeometry(onto, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), new THREE.Vector3(lay.chest.size[0], lay.chest.size[1], 0.5));
    const p = geo.attributes.position.array, n = geo.attributes.normal.array;
    for (let i = 0; i < p.length; i++) p[i] += n[i] * 0.006;
    return geo;
  }, [lump, lay.chest]);
  useEffect(() => () => chest?.dispose(), [chest]);

  // A tabby's stripes: half-rings of the markings colour over the back,
  // one round each ball of the spine, turned to sit square across it;
  // and full rings round the tail, square across it where they are,
  // which the swish carries along.
  const stripes = useMemo(() => {
    if (!C.stripes) return null;
    const S = lay.spine;
    const backs = S.map((b, i) => {
      const dir = new THREE.Vector3(...S[Math.min(i + 1, S.length - 1)].at).sub(new THREE.Vector3(...S[Math.max(i - 1, 0)].at));
      return { at: b.at, turn: along(dir), geo: new THREE.TorusGeometry(b.r * 1.06, 0.03, 6, 20, Math.PI) };
    });
    const rings = [5, 8, 11].map((k) => {
      const dir = new THREE.Vector3(...tail[k + 1].at).sub(new THREE.Vector3(...tail[k - 1].at));
      return { at: new THREE.Vector3(...tail[k].at), turn: along(dir), u: tail[k].u, geo: new THREE.TorusGeometry(tail[k].r + 0.004, 0.018, 6, 14) };
    });
    return { backs, rings };
  }, [C.stripes, lay, tail]);
  useEffect(() => () => { stripes?.backs.forEach((b) => b.geo.dispose()); stripes?.rings.forEach((r) => r.geo.dispose()); }, [stripes]);

  // The swish: the tail bent side to side about its root, each vertex by
  // its weight, the normals turned with it; the tail's rings likewise.
  const ringRefs = useRef([]);
  const clock = useRef(0);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const Y = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.6) * 0.5 * C.swish * lay.tail.sway;
    const { geo, rest, weights, index, root } = lump;
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
    stripes?.rings.forEach((r, k) => {
      const m = ringRefs.current[k];
      if (!m) return;
      const w = r.u * r.u * (3 - 2 * r.u);
      q.setFromAxisAngle(Y, angle * w);
      m.position.copy(r.at).sub(root).applyQuaternion(q).add(root);
      m.rotation.set(...r.turn);
      m.rotateOnWorldAxis(Y, angle * w);
    });
  });

  const head = new THREE.Vector3(...lay.head);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  const muzzle = head.clone().add(new THREE.Vector3(0, -0.08, H.radius * 0.84));
  const ear = useMemo(() => earGeometry(), []);
  useEffect(() => () => { ear.rim.dispose(); ear.back.dispose(); ear.inner.dispose(); }, [ear]);
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
      {/* Stripes over the back, on a tabby. */}
      {stripes?.backs.map((b, i) => (
        <mesh key={i} geometry={b.geo} position={b.at} rotation={b.turn} castShadow material={markings} />
      ))}
      {/* Socks: a foot again, a hair bigger, in white, on a tuxedo. */}
      {C.paws &&
        lay.feet.map((at, i) => (
          <mesh key={i} position={at} castShadow material={belly}>
            <sphereGeometry args={[L.radius + 0.012, 12, 8]} />
          </mesh>
        ))}
      {/* The face, on the head. */}
      <group position={lay.head}>
        {/* Ears: a triangle each, standing up from the head and tilted
            outward — a flat front, a rim of fur round a pink inner set
            back inside it, and a pyramid drawing to a point behind. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.17, H.radius * 0.8, -0.04]} rotation={[0, s * 0.3, -s * 0.32]}>
            <mesh geometry={ear.rim} castShadow receiveShadow material={fur} />
            <mesh geometry={ear.back} castShadow receiveShadow material={fur} />
            <mesh geometry={ear.inner} material={unlitMat(paint.ear)} />
          </group>
        ))}
        {/* The muzzle bump, in the belly colour; the nose, a little
            triangle point-down on its front; and the mouth, a line drawn
            down from the nose like a decal, leaning back with the bump. */}
        <mesh position={[0, -0.08, H.radius * 0.84]} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[MUZZLE_R, 16, 12]} />
        </mesh>
        <mesh geometry={noseGeo} position={[0, -0.03, H.radius * 0.84 + MUZZLE_R - 0.012]} castShadow material={unlitMat(paint.nose)} />
        <mesh position={[0, -0.095, H.radius * 0.84 + MUZZLE_R - 0.018]} rotation-x={0.5} material={unlitMat(paint.pupil)}>
          <boxGeometry args={[0.012, 0.075, 0.012]} />
        </mesh>
        {/* Eyes: a dark bead with the iris set in its front. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.12, 0.05, H.radius * 0.96]}>
            <mesh castShadow material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[0.05, 12, 8]} />
            </mesh>
            <mesh position-z={0.025} material={unlitMat(paint.eyes)}>
              <sphereGeometry args={[0.035, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Whiskers: three hair-thin cylinders a side, fanned, from the
          sides of the muzzle. */}
      {[-1, 1].map((s) =>
        FANS.map((fan, i) => {
          const at = whiskerDir(s, fan).multiplyScalar(0.2).add(muzzle).add(new THREE.Vector3(s * 0.06, 0, 0));
          return (
            <mesh key={`${s}${i}`} position={at.toArray()} rotation={whiskerTurn(s, fan)} material={belly}>
              <cylinderGeometry args={[0.006, 0.006, 0.42, 4]} />
            </mesh>
          );
        }),
      )}
      {/* Rings round the tail, on a tabby; the swish carries them. */}
      {stripes?.rings.map((r, k) => (
        <mesh key={k} ref={(m) => (ringRefs.current[k] = m)} geometry={r.geo} position={r.at} rotation={r.turn} castShadow material={markings} />
      ))}
    </group>
  );
}
