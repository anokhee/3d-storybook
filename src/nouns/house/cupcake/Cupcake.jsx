import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../../world/merge.js";
import { mulberry32 } from "../../../world/random.js";
import { LIGHT } from "../../../adjectives/lit/objects.js";
import { hue } from "../../../world/palette.js";
import { unlitMat } from "../../../adjectives/unlit/material.js";
import { litMat } from "../../../adjectives/lit/material.js";
import Primitive from "../../primitive/Primitive.jsx";
import Seated from "../../primitive/Seated.jsx";
import { useBody } from "../../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../../player/solids.js";
import { Arch, WindowPane } from "../Panes.jsx";
import { useDoorAt } from "../House.jsx";
import Ornament, { ornamentOf } from "../../ornament/Ornament.jsx";
import { eulerOf } from "../../primitive/geometry.js";
import { FLOWER, FLOWER_TYPES } from "../../flower/objects.js";
import { STAR, STAR_TYPES } from "../../starPolygon/objects.js";
import { indoorWindowOf } from "../objects.js";
import { topperOf } from "./toppers.js";
import { Straw, strawBearing } from "../../chocolateStraw/ChocolateStraw.jsx";
import { CHOCOLATE_STRAW } from "../../chocolateStraw/objects.js";
import { CANDLE, CUPCAKE, MAX_STICKS } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// The paper case: a drum tapering to its foot, pleated — every other
// vertex round it pushed out by `pleat`, the ones between pulled in, so
// its rim is a zigzag and its wall a ring of ridges — and shaded flat, so
// each pleat's two faces catch the light apart, the way folded paper
// does. Where the door or a window would straddle several of those faces,
// they are pressed into one flat (see facetsOf), a plane through the
// vertices at its two edges, for the opening to lie square on. Built about
// its own middle, like a primitive, so the door and windows can be seated
// on it (see Seated). Cached by its sizes and flats.
const cups = new Map();

// Whether pleat vertex `k` (counted round from the front) is a ridge.
const ridge = (k) => k % 2 === 0;

// The flats on the case's front, as `{ lo, hi }` — the pleat vertices, from
// the front, a flat runs between the faces of. One for the door and one for
// each window, spanning every face its frame reaches across; made an even
// number of faces wide, so its two edges are both ridges or both folds
// and the plane stands upright; and any that overlap merged into one.
function facetsOf(K) {
  const C = K.cup;
  const step = Math.PI / C.flutes;
  const lift = C.height / 2 - C.sink;
  const reach = (y) =>
    C.radius * (C.foot + (1 - C.foot) * (y / C.height + 0.5)) * (1 - C.pleat);
  // The faces an opening crosses: `x` its middle across, `half` its width
  // out to its frame's edge, `foot` how high its bottom stands off the
  // ground (where the case is narrowest, so reaches furthest round).
  const span = (x, half, foot) => {
    const rho = reach(foot - lift);
    const round = (v) => Math.asin(Math.max(-1, Math.min(1, v / rho))) / step;
    return { lo: Math.floor(round(x - half)), hi: Math.ceil(round(x + half)) };
  };
  const reachOf = (O) => O.width / 2 + (O.frame?.thickness ?? 0);
  const spans = [
    span(0, reachOf(K.door), 0),
    ...[-1, 1].map((side) =>
      span(
        side * K.windows.apart,
        reachOf(K.windows),
        K.windows.y - K.windows.height / 2,
      ),
    ),
  ].sort((a, b) => a.lo - b.lo);
  const merged = [];
  for (const f of spans) {
    const last = merged[merged.length - 1];
    if (last && f.lo < last.hi) last.hi = Math.max(last.hi, f.hi);
    else merged.push({ ...f });
  }
  // Even wide, widening outward from the front.
  return merged.map((f) =>
    (f.hi - f.lo) % 2 === 0
      ? f
      : f.hi > 0
        ? { lo: f.lo, hi: f.hi + 1 }
        : { lo: f.lo - 1, hi: f.hi },
  );
}

// How far from the case's middle a flat's plane stands at height `y` about
// it, along the flat's own middle.
const facetD = (C, f, y) =>
  C.radius *
  (C.foot + (1 - C.foot) * (y / C.height + 0.5)) *
  (1 + (ridge(f.lo) ? C.pleat : -C.pleat)) *
  Math.cos(((f.hi - f.lo) / 2) * (Math.PI / C.flutes));

// Where the case's front wall is at height `y` off its middle and `x`
// across: its depth `z` and the bearing `a` its face looks out along — on
// a flat, the flat's plane; on the pleats, the ridge circle.
function wallAt(C, facets, x, y) {
  const reach = C.radius * (C.foot + (1 - C.foot) * (y / C.height + 0.5));
  const step = Math.PI / C.flutes;
  const k = Math.round(Math.asin(Math.max(-1, Math.min(1, x / reach))) / step);
  const f = facets.find((g) => k >= g.lo && k <= g.hi);
  if (!f) return { z: Math.sqrt(Math.max(0, reach * reach - x * x)), a: 0 };
  const a = ((f.lo + f.hi) / 2) * step;
  return { z: (facetD(C, f, y) - x * Math.sin(a)) / Math.cos(a), a };
}

function cupGeometry(C, facets) {
  const key = `${C.radius}:${C.foot}:${C.height}:${C.flutes}:${C.pleat}:${facets.map((f) => `${f.lo},${f.hi}`)}`;
  if (cups.has(key)) return cups.get(key);
  const g = new THREE.CylinderGeometry(
    C.radius,
    C.radius * C.foot,
    C.height,
    C.flutes * 2,
    1,
    false,
  );
  const pos = g.attributes.position;
  const step = Math.PI / C.flutes;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i);
    const rho = Math.hypot(x, z);
    if (rho < 1e-6) continue;
    const k = Math.round(Math.atan2(x, z) / step);
    const scale = 1 + (ridge(k) ? C.pleat : -C.pleat);
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
    const facet = facets.find((f) => k >= f.lo && k <= f.hi);
    if (facet) {
      // Pressed onto the flat's plane: its along-the-plane share kept,
      // the rest set to the plane's distance.
      const a = ((facet.lo + facet.hi) / 2) * step;
      const d = facetD(C, facet, pos.getY(i));
      const s = pos.getX(i) * Math.cos(a) - pos.getZ(i) * Math.sin(a);
      pos.setX(i, s * Math.cos(a) + d * Math.sin(a));
      pos.setZ(i, -s * Math.sin(a) + d * Math.cos(a));
    }
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  flat.computeBoundingBox();
  g.dispose();
  cups.set(key, flat);
  return flat;
}

// Where the case's rim is, off the ground.
const rimOf = (C) => C.height - C.sink;

// The cake's dome: a sphere's top half, pressed down to `squash` of its
// height, its cut on the rim.
const cakeRadiusOf = (K) => K.cup.radius * K.cake.radius;
const cakeTopOf = (K) => rimOf(K.cup) + cakeRadiusOf(K) * K.cake.squash;

// The frosting's tiers, stacked from the cake's crown: each a sphere
// pressed to `tall` of its height, sat `overlap` of its own half-height
// down into what is under it — as `{ radius, tall, y }`, its middle off
// the ground, and where the top of the stack ends up.
function tiersOf(K) {
  const F = K.frosting;
  let top = cakeTopOf(K);
  const tiers = F.tiers
    .slice(0, F.stack ?? F.tiers.length)
    .map(({ radius, tall }) => {
      const r = K.cup.radius * radius;
      const half = r * tall;
      const y = top - half * F.overlap + half;
      top = y + half;
      return { radius: r, tall, y, half };
    });
  return { tiers, top };
}

// How tall the cupcake stands off its ground, for the posts to clear: the
// topper's top, or the frosting's without one.
export function cupcakeHeightOf(K) {
  const { top } = tiersOf(K);
  return topperOf(K.topper, top)?.top ?? top;
}

// How far out from its middle it spreads, for the player to be kept out
// of and the grass to keep back from: the cake's swell or the case's rim,
// round with it.
export function cupcakeFootprintOf(K) {
  const r = Math.max(K.cup.radius * (1 + K.cup.pleat), cakeRadiusOf(K));
  return { x: r, z: r, round: true };
}

// The sprinkles: each laid on a tier's surface where the roll puts it —
// which tier, how far up it and round it — lying flat along the surface
// there, turned a random way about its own up, and colored in turn. A rod
// (a cylinder) is laid over on its side; any other shape stands on the
// surface as it is built. None overlaps another: each roll that lands
// within two footprints (a rod's half its length, the rest their radius) of
// one already down is thrown out and rolled again, a few tries over, so
// a crowded cake ends up with fewer than `count` rather than a pile.
function sprinklesOf(K, tiers) {
  const S = K.sprinkles;
  if (!S || !tiers.length) return [];
  const rand = mulberry32(S.seed);
  const up = new THREE.Vector3(0, 1, 0);
  const rod = S.shape === "cylinder";
  // How far, in radii, its middle stands off the surface: a rod's a third
  // of the way up, the rest right on it — the frosting is faceted, so
  // lies a little inside the smooth sphere it is placed on.
  const lift = rod ? 0.35 : 0;
  const clear = 2 * (rod ? Math.max(S.length / 2, S.radius) : S.radius);
  const placed = [];
  for (
    let tries = 0;
    placed.length < S.count && tries < S.count * 40;
    tries++
  ) {
    const t = tiers[Math.floor(rand() * tiers.length)];
    const la = rad(S.lat + rand() * (88 - S.lat));
    const lo = rand() * Math.PI * 2;
    // A point on the pressed sphere, and its normal — the sphere's
    // scaled by the squash, the way a squashed ball's normal goes.
    const dir = new THREE.Vector3(
      Math.cos(la) * Math.sin(lo),
      Math.sin(la),
      Math.cos(la) * Math.cos(lo),
    );
    const at = new THREE.Vector3(
      dir.x * t.radius,
      t.y + dir.y * t.radius * t.tall,
      dir.z * t.radius,
    );
    const normal = new THREE.Vector3(dir.x, dir.y / t.tall, dir.z).normalize();
    // Stood on the surface: y along the normal, spun about it, then the
    // rod — built standing along y — laid over on its side.
    const stand = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(
      up,
      rand() * Math.PI * 2,
    );
    const lie = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      rod ? Math.PI / 2 : 0,
    );
    at.addScaledVector(normal, S.radius * lift);
    if (placed.some((p) => p.at.distanceTo(at) < clear)) continue;
    placed.push({
      at,
      position: at.toArray(),
      quaternion: stand.multiply(spin).multiply(lie).toArray(),
      color: S.colors[placed.length % S.colors.length],
    });
  }
  return placed;
}

// The syrup: a ribbon round each tier of frosting, as a closed curve that
// goes once round it while swinging up and down `waves` times — sine-soft,
// a rounded zigzag — about a latitude kept low enough to clear the tier
// above, and lying a little sunk into the surface. As the curves'
// points, one list a tier.
function syrupOf(K, tiers) {
  const S = K.syrup;
  if (!S) return [];
  return tiers.map((t, i) => {
    const next = tiers[i + 1];
    // Where the tier above stands on this one, as a latitude.
    const clear = next
      ? (Math.acos(Math.min(1, (next.radius * 1.2) / t.radius)) * 180) / Math.PI
      : 80;
    const mid = Math.max(S.amp * 0.5, Math.min(S.lat, clear - S.amp));
    const steps = Math.max(8, S.waves) * 16;
    return Array.from({ length: steps }, (_, n) => {
      const lo = (n / steps) * Math.PI * 2;
      const la = rad(mid + S.amp * Math.sin(lo * S.waves));
      const dir = new THREE.Vector3(
        Math.cos(la) * Math.sin(lo),
        Math.sin(la),
        Math.cos(la) * Math.cos(lo),
      );
      const normal = new THREE.Vector3(
        dir.x,
        dir.y / t.tall,
        dir.z,
      ).normalize();
      return new THREE.Vector3(
        dir.x * t.radius,
        t.y + dir.y * t.radius * t.tall,
        dir.z * t.radius,
      ).addScaledVector(normal, S.radius * 0.4);
    });
  });
}

// How high the frosting and cake stand at `d` from the cupcake's middle: the
// highest of the tiers' domes, or the cake's, there.
function surfaceAt(K, tiers, d) {
  const dome = (r, tall, y) =>
    d < r ? y + tall * Math.sqrt(r * r - d * d) : -Infinity;
  // Each dome a sphere pressed to `tall` of its height: so `tall` of the
  // height a round one would stand at that distance.
  const cake = dome(cakeRadiusOf(K), K.cake.squash, rimOf(K.cup));
  return Math.max(cake, ...tiers.map((t) => dome(t.radius, t.tall, t.y)));
}

// The turn, in degrees, that puts a flower or star back flat, face up —
// undoing the pose its type hangs in (the tulip's cup mouth-down) — so
// that a sprinkle stood on the frosting looks out of it, not into it.
// Shapes with no pose of their own need none.
function uprightOf(shape) {
  const type = FLOWER_TYPES[shape] ? FLOWER : STAR;
  const own = (FLOWER_TYPES[shape] ?? STAR_TYPES[shape])?.rotation;
  if (!own) return undefined;
  const pose = new THREE.Euler(...eulerOf({ ...type.rotation, ...own }));
  const undo = new THREE.Matrix4().makeRotationFromEuler(pose).invert();
  const back = new THREE.Euler().setFromRotationMatrix(undo, "XYZ");
  return {
    x: THREE.MathUtils.radToDeg(back.x),
    y: THREE.MathUtils.radToDeg(back.y),
    z: THREE.MathUtils.radToDeg(back.z),
  };
}

// A candle's flame, drawn like the campfire's: a lathe drawn to a point, a
// paler core inside a warmer shell, both lit so they show at night, flickering
// on their own, with a point light just over the tip. Stands at the candle's
// tip; the sizes are in the candle's units.
function flameGeometry(width, height) {
  const pts = [
    [0, 0],
    [0.7, 0.05],
    [1, 0.25],
    [0.85, 0.5],
    [0.5, 0.74],
    [0.18, 0.92],
    [0, 1],
  ].map(([x, y]) => new THREE.Vector2(x * width, y * height));
  return new THREE.LatheGeometry(pts, 10);
}

const beat = (t, phase) =>
  0.5 * Math.sin(t + phase) +
  0.3 * Math.sin(t * 1.7 + phase * 2.1) +
  0.2 * Math.sin(t * 2.9 + phase * 0.7);

function CandleFlame({ config, phase }) {
  const { flame, flameColor, flameCore, glow } = config;
  const tall = flame * 3.4;
  const shell = useMemo(() => flameGeometry(flame, tall), [flame, tall]);
  const core = useMemo(() => flameGeometry(flame * 0.55, tall * 0.65), [flame, tall]);
  useEffect(
    () => () => {
      shell.dispose();
      core.dispose();
    },
    [shell, core],
  );
  const body = useRef();
  const light = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    clock.current += Math.min(delta, 0.05) * 9;
    const t = clock.current;
    const b = beat(t, phase);
    if (body.current) {
      body.current.scale.set(1 - 0.1 * b, 1 + 0.22 * b, 1 - 0.1 * b);
      body.current.rotation.z = 0.12 * beat(t * 0.8, phase * 1.7 + 1);
      body.current.rotation.x = 0.1 * beat(t * 0.7, phase * 1.3 + 2);
    }
    if (light.current) {
      light.current.intensity = glow.intensity * (1 + 0.3 * beat(t * 1.3, phase + 0.4));
    }
  });
  return (
    <group>
      <group ref={body}>
        <mesh geometry={shell} material={litMat(flameColor)} />
        <mesh geometry={core} material={litMat(flameCore)} />
      </group>
      <pointLight
        ref={light}
        position-y={tall * 0.5}
        color={hue(glow.color)}
        intensity={glow.intensity}
        distance={glow.distance}
        decay={2}
      />
    </group>
  );
}

// One cupcake, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of CUPCAKE's fields for this one instance.
export default function Cupcake({ config }) {
  const K = useMemo(() => merge(CUPCAKE, config), [config]);
  const C = K.cup;
  const A = K.cake;
  const F = K.frosting;

  // Solid to the player: registered by where it actually IS, as a column
  // the cake's reach and the cupcake's height, so it may sit anywhere in
  // the tree.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + cupcakeHeightOf(K) * K.scale,
      radius: cupcakeFootprintOf(K).x * K.scale,
    });
    return () => unregisterSolid(solid);
  }, [K, ball]);

  const facets = useMemo(() => facetsOf(K), [K]);
  const cup = useMemo(() => cupGeometry(C, facets), [C, facets]);
  // The case is built about its middle: lifted so its foot meets the
  // ground less what is sunk into it.
  const cupLift = C.height / 2 - C.sink;
  const cakeRadius = cakeRadiusOf(K);
  const cakeForm = useMemo(() => ({ tall: A.squash }), [A.squash]);
  const { tiers, top: tiersTop } = useMemo(() => tiersOf(K), [K]);
  const tierForms = useMemo(() => tiers.map(({ tall }) => ({ tall })), [tiers]);
  const sprinkles = useMemo(() => sprinklesOf(K, tiers), [K, tiers]);
  const syrup = useMemo(
    () =>
      syrupOf(K, tiers).map(
        (points) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points, true),
            points.length,
            K.syrup.radius,
            6,
            true,
          ),
      ),
    [K, tiers],
  );
  useEffect(() => () => syrup.forEach((g) => g.dispose()), [syrup]);
  // What each sprinkle is: an ornament of the config's shape, a cylinder
  // pressed to the rod's length.
  const sprinkleShape = useMemo(() => {
    const S = K.sprinkles;
    if (!S) return null;
    const spec = { shape: S.shape, radius: S.radius };
    if (S.shape === "cylinder") spec.form = { tall: S.length / (2 * S.radius) };
    const upright = uprightOf(S.shape);
    if (upright) spec.rotation = upright;
    return ornamentOf(spec, "CUPCAKE.sprinkles");
  }, [K.sprinkles]);
  // The chocolate straws, each stood where the ring puts it, its foot let
  // down into whatever the frosting is there, tipped out from upright.
  const straws = useMemo(() => {
    const Z = K.straws;
    if (!Z || Z.kind === "none") return null;
    const base = Z.kind === "candles" ? merge(CHOCOLATE_STRAW, CANDLE) : CHOCOLATE_STRAW;
    const config = merge(base, { ...Z.config, scale: Z.size });
    const count = Math.min(Z.count, MAX_STICKS);
    const stand = Array.from({ length: count }, (_, i) => {
      const a = strawBearing(i, count);
      return {
        a,
        x: Math.sin(a) * Z.ring,
        z: Math.cos(a) * Z.ring,
        y: surfaceAt(K, tiers, Z.ring) - 0.2 * Z.size,
      };
    });
    return { config, stand };
  }, [K, tiers]);
  // The window boxes and the mat: each stood on the ground against the
  // front wall, square to the flat it meets.
  const fixtures = useMemo(() => {
    const ground = -cupLift;
    const stand = (x, depth, gap = 0) => {
      const { z, a } = wallAt(C, facets, x, ground + 0.3);
      return {
        a,
        position: [
          x + Math.sin(a) * (depth / 2 - 0.05 + gap),
          0,
          z + Math.cos(a) * (depth / 2 - 0.05 + gap),
        ],
      };
    };
    const Bx = K.boxes;
    const boxes = Bx?.on
      ? [-1, 1].map((side) => ({
          ...stand(side * K.windows.apart, Bx.depth),
          side,
        }))
      : [];
    const mat = K.mat?.on ? stand(0, K.mat.depth, K.mat.gap) : null;
    return { boxes, mat };
  }, [K.boxes, K.mat, C, facets, cupLift, K.windows.apart]);
  const boxFlower = useMemo(() => {
    const Fl = K.boxes?.flowers;
    if (!Fl) return null;
    const spec = { shape: Fl.shape, radius: Fl.radius };
    const upright = uprightOf(Fl.shape);
    if (upright) spec.rotation = upright;
    return ornamentOf(spec, "CUPCAKE.boxes.flowers");
  }, [K.boxes]);
  const topper = useMemo(
    () => topperOf(K.topper, tiersTop),
    [K.topper, tiersTop],
  );
  // Where the door and windows sit on the case, as Seated reads it: x
  // across, y DOWN from the case's mid-height, z out from the face. The
  // door's foot is on the ground; a window round the case at `apart`
  // degrees from the front lands where a ray fired in at that x meets it.
  const W = K.windows;
  const D = K.door;
  // The door can be gone in at (see ../House.jsx, useDoorAt): its foot is
  // on the ground at the case's front, where the case is its foot's
  // radius. Inside: the case's color, and the frosting's underfoot.
  const foot = useRef();
  const room = useMemo(
    () => ({
      walls: C.color,
      floor: F.color,
      rooms: K.interior.rooms,
      ways: {
        arch: K.interior.arch,
        door: K.interior.door,
        window: indoorWindowOf(K.interior.window, W),
      },
      door: D,
      window: W,
    }),
    [C, F, K.interior, D, W],
  );
  useDoorAt(foot, D.height, room);
  const seats = useMemo(() => {
    return {
      door: { translation: { x: 0, y: cupLift - D.height / 2, z: 0 }, ...D },
      windows: [-1, 1].map((side) => ({
        translation: {
          x: side * W.apart,
          y: cupLift - W.y,
          z: 0,
        },
        ...W,
      })),
    };
  }, [C, cupLift, W, D]);
  return (
    <group ref={root} scale={K.scale}>
      <group
        ref={foot}
        position-z={facetD(
          C,
          facets.find((f) => f.lo <= 0 && f.hi >= 0),
          -C.height / 2,
        )}
      />
      <group position-y={cupLift}>
        <mesh geometry={cup} material={unlitMat(C.color)} />
        <Seated body={cup} spec={seats.door} part={Arch} />
        {seats.windows.map((spec, i) => (
          <Seated key={i} body={cup} spec={spec} part={WindowPane} />
        ))}
      </group>
      <group position-y={rimOf(C)}>
        <Primitive
          shape="sphere"
          radius={cakeRadius}
          detail={A.detail}
          form={cakeForm}
          clay={A.clay}
          half="top"
          swatch={A.color}
        />
        <group position-y={-A.base / 2}>
          <Primitive
            shape="cylinder"
            radius={cakeRadius}
            detail={A.detail}
            form={{ tall: A.base / (2 * cakeRadius) }}
            swatch={A.color}
          />
        </group>
      </group>
      {tiers.map(({ radius, y }, i) => (
        <group key={i} position-y={y}>
          <Primitive
            shape="sphere"
            radius={radius}
            detail={F.detail}
            form={tierForms[i]}
            clay={{ ...F.clay, seed: F.clay.seed + i }}
            swatch={F.color}
            light={LIGHT}
          />
        </group>
      ))}
      {syrup.map((geometry, i) => (
        <mesh key={i} geometry={geometry} material={unlitMat(K.syrup.color)} />
      ))}
      {sprinkles.map(({ position, quaternion, color }, i) => (
        <group key={i} position={position} quaternion={quaternion}>
          <Ornament ornament={sprinkleShape} swatch={color} />
        </group>
      ))}
      {straws &&
        straws.stand.map(({ a, x, z, y }, i) => (
          <group
            key={i}
            position={[x, y, z]}
            rotation-y={a}
            scale={straws.config.scale}
          >
            <group rotation-x={(straws.config.lean * Math.PI) / 180}>
              <Straw config={straws.config} />
              {straws.config.flame > 0 && (
                <>
                  <mesh
                    position-y={straws.config.length}
                    rotation-x={Math.PI / 2}
                    material={unlitMat(straws.config.stripe)}
                  >
                    <circleGeometry args={[straws.config.radius, 12]} />
                  </mesh>
                  <CandleFlame config={straws.config} phase={i * 1.9} />
                </>
              )}
            </group>
          </group>
        ))}
      {fixtures.boxes.map(({ a, position, side }) => {
        const Bx = K.boxes;
        const Fl = Bx.flowers;
        const width = W.width + 2 * Bx.overhang;
        return (
          <group key={side} position={position} rotation-y={a}>
            <mesh position-y={Bx.height / 2} material={unlitMat(Bx.color)}>
              <boxGeometry args={[width, Bx.height, Bx.depth]} />
            </mesh>
            <mesh position-y={Bx.height - 0.03} material={unlitMat(Bx.color)}>
              <boxGeometry args={[width + 0.08, 0.07, Bx.depth + 0.08]} />
            </mesh>
            <mesh position-y={Bx.height - 0.005} material={unlitMat(Bx.soil)}>
              <boxGeometry args={[width - 0.06, 0.05, Bx.depth - 0.06]} />
            </mesh>
            {Fl &&
              boxFlower &&
              Array.from({ length: Fl.count }, (_, i) => {
                const x = ((i + 0.5) / Fl.count - 0.5) * (width - 0.3);
                return (
                  <group key={i} position={[x, Bx.height, 0]}>
                    <mesh
                      position-y={Fl.stem / 2}
                      material={unlitMat(Fl.stemColor)}
                    >
                      <cylinderGeometry args={[0.02, 0.02, Fl.stem, 5]} />
                    </mesh>
                    <group position-y={Fl.stem} rotation-x={0.5}>
                      <Ornament
                        ornament={boxFlower}
                        swatch={Fl.colors[i % Fl.colors.length]}
                      />
                    </group>
                  </group>
                );
              })}
          </group>
        );
      })}
      {fixtures.mat && (
        <group position={fixtures.mat.position} rotation-y={fixtures.mat.a}>
          <mesh position-y={K.mat.thick / 2} material={unlitMat(K.mat.border)}>
            <boxGeometry args={[K.mat.width, K.mat.thick, K.mat.depth]} />
          </mesh>
          <mesh
            position-y={K.mat.thick / 2 + 0.005}
            material={unlitMat(K.mat.color)}
          >
            <boxGeometry
              args={[
                K.mat.width - 2 * K.mat.inset,
                K.mat.thick,
                K.mat.depth - 2 * K.mat.inset,
              ]}
            />
          </mesh>
        </group>
      )}
      {topper && (
        <group position-y={topper.y} rotation-x={rad(K.topper.tilt ?? 0)}>
          <group
            position-y={K.topper.flip ? topper.top - topper.y : 0}
            rotation-x={K.topper.flip ? Math.PI : 0}
          >
            <topper.Component config={topper.config} />
          </group>
        </group>
      )}
    </group>
  );
}
