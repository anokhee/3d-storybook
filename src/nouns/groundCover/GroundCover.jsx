import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { PALETTE, hue, swatchList, swatchOf } from "../../world/palette.js";
import { mulberry32, between } from "../../world/random.js";
import { latLonDir, scatter, standOn } from "../../world/layout.js";
import { merge } from "../../world/merge.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import {
  cardGeometry,
  strandGeometry,
  frostShader,
  frostKey,
} from "../../cutout.js";
import { plant, tread, rustle } from "../../player/tread.js";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { registerCanopy, unregisterCanopy } from "../../player/foliage.js";
import { PLANET } from "../planet/objects.js";
import { BODIES } from "../planet/bodies.js";
import { groundRadiusAt } from "../planet/ground.js";
import { GRASS } from "../grass/objects.js";
import { clayStrand } from "../grass/clay.js";
import { PEBBLE } from "../pebble/objects.js";
import { pebbleGeometry } from "../pebble/geometry.js";
import { TREE } from "../tree/objects.js";
import { treeGeometry } from "../tree/geometry.js";
import { FLOWER, FLOWER_TYPES } from "../flower/objects.js";
import { flowerHead } from "../flower/Flower.jsx";
import { PRIMITIVES } from "../primitive/objects.js";
import { primitiveGeometry, turnedGeometry } from "../primitive/geometry.js";
import { poolDistance } from "../water/pools.js";
import { haloTexture } from "../../adjectives/lit/halo.js";
import { litMat } from "../../adjectives/lit/material.js";
import { CEL } from "../../adjectives/unlit/toon.js";
import { lightOf } from "../../adjectives/lit/objects.js";
import { GLOW } from "../../lighting.js";
import { glowingMat } from "../../adjectives/glowing/material.js";
import { LAYER, GROUND_COVER } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// A smooth field over the ball, roughly 0..1, from three sine waves crossed
// at angles that do not line up. Not real noise — it does not need to be. All
// it has to do is drift SLOWLY, so neighboring instances come out nearly the
// same color and the tint pools across the ground in washes.
//
// This is the whole watercolour trick. Rolling each instance independently
// gives the same colors in the same amounts and looks like television
// static; the eye reads variation as painted only when it varies in patches
// bigger than the thing being varied.
const washAt = (dir, turns) => {
  const x = dir.x * turns;
  const y = dir.y * turns;
  const z = dir.z * turns;
  const n =
    Math.sin(x * 2.1 + y * 1.3) * 0.5 +
    Math.sin(y * 1.7 - z * 2.3) * 0.32 +
    Math.sin(z * 3.1 + x * 1.1) * 0.18;
  return Math.min(1, Math.max(0, 0.5 + 0.5 * n));
};

// One white halo, tinted per instance the way the body is. Made once, on
// first use, since it needs a canvas.
let _halo = null;
const halo = () => (_halo ??= haloTexture({ hex: "#ffffff" }, 1));

// What a layer's `type` plants: the body's geometry, how far it reaches from
// its origin (for the halo), whether the body is flat (so both faces are
// drawn), the middle it has, if any, `extras`, if any — more bodies
// planted with the first, each in one fixed color of its own: a tree's
// trunk under its canopy, and a flowering tree's blossoms over it, in the
// tree's own blossom color, the canopy being what the layer's colors
// roll — and `solid`,
// if the plant is: the column the doll meets, `top` high and `radius`
// wide before the size roll (see player/solids.js). A tree's trunk is,
// the same as one stood in a lot (see Tree.jsx). And `canopy`, if it has
// one: the ball of leaf over the trunk, its middle `at` high and `radius`
// wide before the size roll, soft to the doll (see player/foliage.js) and
// rustled by it — the body and any extra marked `leaf` (see rustle in
// player/tread.js).
function plantOf(type, where, L) {
  if (type === "tree") {
    const T = merge(TREE, L.tree);
    const { trunk, canopy, blooms, top, reach } = treeGeometry(T);
    // Where the leaf begins up the trunk: a conifer's tiers from `from`
    // of the way up, the rest at the crown.
    const base =
      T.kind === "conifer" ? T.trunk.height * T.conifer.from : T.trunk.height;
    return {
      body: canopy ?? trunk,
      radius: reach,
      flat: false,
      middle: 0,
      leaf: Boolean(canopy),
      extras: [
        canopy && { geometry: trunk, color: T.trunk.color },
        // Blossom is flower heads, cards: both faces drawn.
        blooms && {
          geometry: blooms,
          color: T.blooms.color,
          leaf: true,
          flat: true,
        },
      ].filter(Boolean),
      solid: { top: T.trunk.height, radius: T.trunk.radius },
      canopy: canopy && {
        at: (base + top) / 2,
        radius: Math.max(reach, (top - base) / 2),
      },
    };
  }
  if (type === "pebbles") {
    const P = merge(PEBBLE, L.pebble);
    return {
      body: pebbleGeometry(P),
      radius: P.radius * Math.max(P.widen, P.deepen),
      flat: false,
      middle: 0,
      finish: P.finish,
    };
  }
  if (type === "grass") {
    const G = merge(GRASS, L.grass);
    const strand = strandGeometry({
      length: G.height,
      radius: G.baseRadius,
      taper: G.taper,
      cap: G.cap,
      bend: G.bend,
      stiff: G.stiff,
      shaft: G.shaft,
      dome: G.dome,
      radial: G.radial,
      shade: G.shade,
      soft: G.soft,
      tip: G.tip,
      tipFrom: G.tipFrom,
    });
    return {
      body: clayStrand(strand, G.height, G.clay),
      radius: G.height,
      flat: false,
      middle: 0,
      finish: G.finish,
    };
  }
  if (typeof type === "string") {
    // A primitive has no size of its own, so its name alone is not enough.
    if (type in PRIMITIVES)
      throw new Error(
        `${where}: a primitive needs a radius — write ` +
          `type: { shape: "${type}", radius: 0.2 } rather than type: "${type}"`,
      );
    if (!(type in FLOWER_TYPES))
      throw new Error(
        `${where}: unknown type ${JSON.stringify(type)} — expected "grass", "pebbles", one of ` +
          Object.keys(FLOWER_TYPES)
            .map((n) => `"${n}"`)
            .join(", ") +
          ", or a primitive spec { shape, radius }",
      );
    const { petals, pistilRadius } = flowerHead(type, FLOWER.radius);
    return {
      body: petals,
      radius: FLOWER.radius,
      flat: true,
      middle: pistilRadius,
    };
  }
  if (!(type?.radius > 0))
    throw new Error(
      `${where}: a primitive type needs a radius, got ${JSON.stringify(type)}`,
    );
  // Instanced, so there is no group to turn each one by: the rotation is
  // baked into the body once instead.
  return {
    body: turnedGeometry(
      primitiveGeometry(
        type.shape,
        type.radius,
        type.sides,
        type.detail,
        type.form,
      ),
      type.rotation,
    ),
    radius: type.radius,
    flat: false,
    middle: 0,
  };
}

// A random unit direction.
function randomDir(rand) {
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return new THREE.Vector3(r * Math.cos(a), z, r * Math.sin(a));
}

// One layer: everything of one kind, as instanced meshes sharing one set of
// placements — the body, a middle where the plant has one, a stem where the
// layer gives one — one draw call each however many there are. Where each
// stands, which way it leans, how big it is and what color it is all live
// in the instance buffers rather than in separate objects.
function Layer({ config: L, clearings, where, crowd }) {
  const body = useRef();
  const middle = useRef();
  const stem = useRef();
  const bulb = useRef();
  const glow = useRef();
  // The meshes as planted, for the tread pass to lean from and restore to
  // — and, for a wood, the leaf the rustle swings.
  const fields = useRef([]);
  const leaves = useRef([]);

  const extras = useRef([]);
  const P = useMemo(
    () => plantOf(L.type, where, L),
    [L.type, where, L.grass, L.pebble, L.tree],
  );

  // The stem hangs from the plant down to the ground. A cylinder is built
  // centered on its origin, so it is dropped half its length to put its top
  // at the plant. The size roll scales it too, so a small head gets a short
  // stem: the length is stretched by the smallest roll so every stem still
  // reaches dirt, the rest sinking a little under it. With `leaves`, a few
  // leaf cards grow off it on the way down — see LAYER.stem.
  const stemGeo = useMemo(() => {
    if (!L.stem || !(L.lift > 0)) return null;
    const length = L.lift / L.size[0];
    const stalk = new THREE.CylinderGeometry(
      L.stem.radius * L.stem.taper,
      L.stem.radius,
      length,
      6,
    );
    stalk.translate(0, -length / 2, 0);
    const F = L.stem.leaves;
    if (!F || !(F.count > 0)) return stalk;
    const card = cardGeometry({
      base: F.width,
      tip: F.width * F.taper,
      length: F.length,
      depth: L.stem.radius,
    });
    const leaves = Array.from({ length: F.count }, (_, i) => {
      const g = card.clone();
      // The card is cut in xy, its base at the origin, depth along +z:
      // laid flat, set with its base against the stalk, pitched up about
      // it, dropped to its height down the stem, and turned round it — a
      // golden turn each, so no two lie the same way.
      g.rotateX(Math.PI / 2);
      g.translate(L.stem.radius, 0, 0);
      g.rotateZ((F.pitch * Math.PI) / 180);
      const t =
        F.count === 1 ? F.from : F.from + ((F.to - F.from) * i) / (F.count - 1);
      g.translate(0, -length * t, 0);
      g.rotateY(i * 2.39996);
      return g;
    });
    // The cards are cut unindexed; the stalk has to match to merge.
    return mergeGeometries([stalk.toNonIndexed(), ...leaves], false);
  }, [L.stem, L.lift, L.size]);

  // The layer's light, filled in from its type's defaults — see lightOf.
  // Lit, every instance is its own color with a halo round it; glowing,
  // it is a translucent shell with a bulb in it, the way a Primitive is.
  const G = useMemo(() => lightOf(L.light), [L.light]);
  const isLit = G.type === "lit" && G.brightness > 0;
  const isGlowing = G.type === "glowing";
  // The bulb inside a glowing instance, as the Bulb in Glowing.jsx: a small
  // lit ball, `bulb` of the plant's reach, or nothing when the light is not
  // to be seen.
  const bulbRadius = isGlowing && G.showBulb ? P.radius * G.bulb : 0;
  const bulbGeo = useMemo(
    () => (bulbRadius > 0 ? new THREE.SphereGeometry(bulbRadius, 12, 8) : null),
    [bulbRadius],
  );

  // A lit layer's halo: one flat disc per instance, laid in the plant's own
  // plane round its origin and sized off its reach — a pool of light about
  // each one, tinted its color. Flat rather than a billboard because the
  // ball is mostly seen from above, and a disc on the ground reads as glow
  // spilled onto it. A glowing layer's is the bulb's, sized off the bulb.
  const haloRadius =
    isLit ? P.radius
    : G.brightness > 0 ? bulbRadius
    : 0;
  // The halos are each plant's own color unless the light names one, in
  // which case every halo in the layer is that color.
  const glowTint = useMemo(
    () =>
      L.light.color ?
        hue(swatchOf(L.light.color, `${where} light.color`))
      : null,
    [L.light.color, where],
  );
  const haloGeo = useMemo(() => {
    if (!(haloRadius > 0)) return null;
    const across = haloRadius * GLOW.halo.reach * G.brightness * 2;
    const g = new THREE.PlaneGeometry(across, across);
    g.rotateX(-Math.PI / 2); // upright in xy -> flat in xz, facing up
    return g;
  }, [haloRadius, G.brightness]);

  const swatches = useMemo(
    () => swatchList(L.colors, `${where} colors`),
    [L.colors, where],
  );

  // A new plant under the same material — a slot gone from grass to
  // flowers in the edit panel — needs its program built again: three only
  // recompiles on its own short list of changes, and `vertexColors` (on
  // for the strand's root-to-tip shading, off for a petal) and the frost
  // patch are not on it. Left as it was, a petal drawn with the strand's
  // program reads the color attribute it does not have as black.
  useLayoutEffect(() => {
    const m = body.current?.material;
    if (m) m.needsUpdate = true;
  }, [P.body]);

  // Planted once, never per frame: this writes straight into the instance
  // buffers and only re-runs if the layer or the clearings change.
  useLayoutEffect(() => {
    const rand = mulberry32(L.seed);
    const one = new THREE.Object3D();
    const tint = new THREE.Color();
    // Mixed toward, if the layer asks — see LAYER.harmony. In linear light,
    // the way the colors are held, so a tint goes toward it the way light
    // would.
    const harmony =
      L.harmony && hue(swatchOf(L.harmony.color, `${where} harmony.color`));
    const hsl = {};
    const R = PLANET.radius;

    // A round clearing is compared by ANGLE — on a sphere the straight line
    // between two surface points is not the distance you walk, and near a
    // wide clearing the two disagree enough to leave a ragged edge. A
    // rectangular one is measured in its own plane: the spot is carried
    // into the rectangle's frame and checked against its half sizes — on
    // the rectangle's own side of the ball only, or the far side of the
    // ball along its axis would be bare in the same shape — with
    // the corners rounded off by `cornerRadius` — the box is shrunk by the
    // radius, and the spot is inside if it pokes out of the shrunken box by
    // no more than the radius. A strip (a path — see pathClearing) is a
    // chain of great-circle segments between its points, and the spot is
    // inside if it lies within the strip's half width of the nearest one,
    // by angle again: how far off the segment's own great circle it is,
    // when it falls between the segment's ends, or how far from the
    // nearer end when it does not.
    const _q = new THREE.Quaternion();
    const _v = new THREE.Vector3();
    const _n = new THREE.Vector3();
    const bare = clearings.map((c) => {
      if (c.points) {
        const segs = [];
        for (let i = 0; i + 1 < c.points.length; i++) {
          const a = c.points[i];
          const b = c.points[i + 1];
          const n = _n.crossVectors(a, b);
          if (n.lengthSq() < 1e-12) continue; // two samples on one spot
          segs.push({
            a,
            b,
            n: n.clone().normalize(),
            // The wider of its two ends, so the edge steps rather than
            // tears where the fray changes between samples.
            reach: Math.max(c.halfWidths[i], c.halfWidths[i + 1]) / R,
          });
        }
        return {
          has: (dir) =>
            segs.some(({ a, b, n, reach }) => {
              // Between the ends: the spot is on the segment's side of
              // both end planes — each through the center, an end, and
              // the circle's pole.
              const between =
                _v.crossVectors(a, dir).dot(n) >= 0 &&
                _v.crossVectors(dir, b).dot(n) >= 0;
              const off =
                between ?
                  Math.asin(Math.min(1, Math.abs(dir.dot(n))))
                : Math.min(dir.angleTo(a), dir.angleTo(b));
              return off < reach;
            }),
        };
      }
      if (c.pool) {
        // A pool: its own field, read in its frame, `pad` wider all round.
        const into = _q.copy(c.frame).invert().clone();
        return {
          has: (dir) => {
            _v.copy(dir).multiplyScalar(R).sub(c.origin).applyQuaternion(into);
            if (_v.y <= -R) return false; // the far side of the ball
            return poolDistance(c.pool, _v.x, _v.z) <= c.pad;
          },
        };
      }
      if (c.origin) {
        const into = _q.copy(c.frame).invert().clone();
        const r = Math.min(c.cornerRadius ?? 0, c.halfWidth, c.halfLength);
        return {
          has: (dir) => {
            _v.copy(dir).multiplyScalar(R).sub(c.origin).applyQuaternion(into);
            if (_v.y <= -R) return false; // the far side of the ball
            const dx = Math.max(Math.abs(_v.x) - (c.halfWidth - r), 0);
            const dz = Math.max(Math.abs(_v.z) - (c.halfLength - r), 0);
            return dx * dx + dz * dz <= r * r;
          },
        };
      }
      const at = c.dir ?? latLonDir(c.lat, c.lon);
      const angle = c.radius / R;
      return { has: (dir) => dir.angleTo(at) < angle };
    });
    // The clumps it grows in, if it is patchy: dense in the middle of each,
    // thinning to nothing at `patchSize` out.
    const clumps = Array.from({ length: L.patchiness }, () => randomDir(rand));
    const edge = L.patchSize / R;
    const inClump = (dir) => {
      if (!clumps.length) return true;
      let nearest = Infinity;
      for (const c of clumps) nearest = Math.min(nearest, dir.angleTo(c));
      const t = nearest / edge;
      return t < 1 && rand() < 1 - t * t;
    };

    // A layer grows on the open ground the clearings leave, or only inside
    // them — the dry ones, or the pools — see LAYER.ground.
    if (!["open", "clearings", "water"].includes(L.ground))
      throw new Error(
        `${where}: ground must be "open", "clearings" or "water", got ${JSON.stringify(L.ground)}`,
      );
    const inside = L.ground !== "open";
    const wet = L.ground === "water";
    // A swimming pool's bed is tile, and grows nothing.
    const kept = bare.filter(
      (_, i) => !!clearings[i].water === wet && !(wet && clearings[i].tiled),
    );

    // Kept apart, if the layer asks: each instance's reach on the ground —
    // the plant's, times its size roll — must not overlap a neighbor's,
    // this layer's or any other's that asked the same, by `apart`.
    // `crowd` is shared across every layer, planted in order, so a later
    // one keeps off what an earlier one stood; this layer's own entry is
    // replaced whole, so a re-plant does not check against its own last
    // planting.
    const others =
      L.apart > 0 ?
        [...crowd.entries()]
          .filter(([k]) => k !== where)
          .flatMap(([, stood]) => stood)
      : [];
    const mine = [];
    const clashes = (dir, reach) => {
      const near = (o) => dir.angleTo(o.dir) * R < (o.reach + reach) * L.apart;
      return others.some(near) || mine.some(near);
    };

    const dirs = [];
    const roots = [];
    // The columns this planting stood, to take up again on the next, and
    // the canopies it hung — by instance, for the rustle.
    const solids = [];
    const canopies = [];
    let n = 0;
    for (const dir of scatter(L.density, L.jitter, rand)) {
      if ((inside ? kept : bare).some((b) => b.has(dir)) !== inside) continue;
      if (!inClump(dir)) continue;

      // Rolled first, because how far a thing is pushed into the ground is
      // a share of ITS OWN size, not of the nominal one.
      const size = between(L.size, rand);
      if (L.apart > 0) {
        const reach = P.radius * size;
        if (clashes(dir, reach)) continue;
        mine.push({ dir, reach });
      }
      const sunk = between(L.sink, rand) * size;
      // The root: where it meets the ground — the thumbed ground, so a
      // plant in a hollow grows from the bottom of it — and what it leans
      // about.
      const ground = groundRadiusAt(dir);
      const root = dir.clone().multiplyScalar(ground - sunk);
      // Solid to the doll, if the plant is: its column stood at the root,
      // its own height and width times the size roll.
      if (P.solid)
        solids.push(
          registerSolid({
            body: BODIES.planet,
            dir,
            top: ground - sunk - R + P.solid.top * size,
            radius: P.solid.radius * size,
          }),
        );
      // And soft, where it has leaf: the canopy hung over the root.
      canopies.push(
        P.canopy ?
          registerCanopy({
            body: BODIES.planet,
            center: dir
              .clone()
              .multiplyScalar(ground - sunk + P.canopy.at * size),
            radius: P.canopy.radius * size,
          })
        : null,
      );

      // `standOn` puts the plant's own up along the surface normal, so its
      // root meets the ground squarely wherever on the ball it grows; a
      // lifted plant stands `lift` above that, on its stem.
      one.position.copy(dir).multiplyScalar(ground - sunk + L.lift);
      one.quaternion.copy(standOn(dir));
      // Spun to face anywhere, so the field does not all lean one way.
      one.rotateY(rand() * Math.PI * 2);
      // Tipped off vertical, pivoting at its own origin.
      one.rotateZ(rad(between([-L.lean, L.lean], rand)));
      one.scale.setScalar(size);
      one.updateMatrix();
      body.current.setMatrixAt(n, one.matrix);
      middle.current?.setMatrixAt(n, one.matrix);
      extras.current.forEach((m) => m?.setMatrixAt(n, one.matrix));
      stem.current?.setMatrixAt(n, one.matrix);
      bulb.current?.setMatrixAt(n, one.matrix);
      glow.current?.setMatrixAt(n, one.matrix);

      // One swatch rolled per instance, then drifted inside its vary ranges
      // — mostly by the wash, with a little per-instance grain shaken over.
      const swatch = swatches[Math.floor(rand() * swatches.length)];
      const { vary } = swatch;
      const w = washAt(dir, L.wash);
      const mix = (r) => {
        const t = w * (1 - L.grain) + rand() * L.grain;
        return r[0] + t * (r[1] - r[0]);
      };
      hue(swatch, tint).getHSL(hsl, THREE.SRGBColorSpace);
      tint.setHSL(
        (((hsl.h + mix(vary.hue) / 360) % 1) + 1) % 1,
        Math.min(1, Math.max(0, hsl.s + mix(vary.sat))),
        Math.min(1, Math.max(0, hsl.l + mix(vary.bright))),
        THREE.SRGBColorSpace,
      );
      if (harmony) tint.lerp(harmony, L.harmony.amount);
      body.current.setColorAt(n, tint);
      bulb.current?.setColorAt(n, glowTint ?? tint);
      glow.current?.setColorAt(n, glowTint ?? tint);

      dirs.push(dir);
      roots.push(root);
      n++;
    }

    // Whatever the clearings and clumps left unplanted goes undrawn rather
    // than being parked at the origin in a heap.
    const done = (m) => {
      if (!m) return;
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    done(body.current);
    done(middle.current);
    extras.current.forEach(done);
    done(stem.current);
    done(bulb.current);
    done(glow.current);
    crowd.set(where, mine);
    fields.current =
      L.tread ?
        [
          body.current,
          middle.current,
          ...extras.current,
          stem.current,
          bulb.current,
          glow.current,
        ]
          .filter(Boolean)
          .map((m) => plant(m, dirs, roots))
      : [];
    // The leaf, for the rustle: the body if it is leaf, and any extra
    // that is.
    leaves.current =
      L.rustle && P.canopy ?
        [
          P.leaf && body.current,
          ...extras.current.filter((m, j) => m && P.extras[j]?.leaf),
        ]
          .filter(Boolean)
          .map((m) => plant(m, dirs, roots, canopies))
      : [];
    return () => {
      solids.forEach(unregisterSolid);
      canopies.forEach((c) => c && unregisterCanopy(c));
    };
  }, [L, clearings, swatches, P, stemGeo, bulbGeo, haloGeo, where, crowd]);

  // The layer giving way under the player — see tread.js. Body, middle and
  // stem share a root, so they lean as one plant. Every frame, smooth: it
  // is a REACTION to the doll, which is drawn smooth, and a reaction that
  // steps behind a smooth body reads as lag, not as stop-motion.
  useFrame((_, dt) => {
    for (const f of fields.current) tread(f, L.tread, dt);
    for (const f of leaves.current) rustle(f, L.rustle, dt);
  });

  // A field wraps a whole planet, so its bounding sphere is useless as a cull
  // test and computing one over thousands of instances is wasted work.
  //
  // Everything takes the cast shadows; only the trees cast them — a field
  // of thousands of blades or flowers drawn again into the shadow map,
  // once per casting light, is the one cost that would show (see SHADOWS
  // in lighting.js). A wood is a few dozen instances.
  const casts = L.type === "tree";
  return (
    <group>
      {/* Fully rough and unmetallic: a specular highlight is the fastest way
          to make painted grass look like plastic tubing. `vertexColors`
          picks up any shading baked into the geometry (the strand's
          root-to-tip), and the instance color multiplies the wash on top —
          white here so neither is tinted twice. Lit, it is basic instead:
          its own color from any angle, shaded by nothing. Glowing, it is
          the glass shell — white too, the instance color tinting it. */}
      <instancedMesh
        ref={body}
        args={[P.body, undefined, L.density]}
        frustumCulled={false}
        castShadow={casts}
        receiveShadow
      >
        {isGlowing ?
          <primitive object={glowingMat(PALETTE.white, G)} attach="material" />
        : isLit ?
          <meshBasicMaterial
            color="#ffffff"
            vertexColors={Boolean(P.body.attributes.color)}
            side={P.flat ? THREE.DoubleSide : THREE.FrontSide}
          />
          // Toon: the light stepped into flat bands — see TOON.
        : <meshToonMaterial
            color="#ffffff"
            vertexColors={Boolean(P.body.attributes.color)}
            {...CEL}
            side={P.flat ? THREE.DoubleSide : THREE.FrontSide}
            // A frosted strand's tips, mixed toward white — see cutout.js
            // — on top of the cel patch, not in place of it.
            {...(P.body.attributes.frost && {
              onBeforeCompile: (shader) => {
                CEL.onBeforeCompile(shader);
                frostShader(shader);
              },
              customProgramCacheKey: frostKey,
            })}
          />
        }
      </instancedMesh>
      {(P.extras ?? []).map((x, i) => (
        <instancedMesh
          key={i}
          ref={(m) => (extras.current[i] = m)}
          args={[x.geometry, undefined, L.density]}
          frustumCulled={false}
          castShadow={casts}
          receiveShadow
        >
          <meshToonMaterial
            color={hue(x.color)}
            {...CEL}
            side={x.flat ? THREE.DoubleSide : THREE.FrontSide}
          />
        </instancedMesh>
      ))}
      {P.middle > 0 && (
        <instancedMesh
          ref={middle}
          args={[undefined, undefined, L.density]}
          frustumCulled={false}
          receiveShadow
        >
          <sphereGeometry args={[P.middle, 8, 6]} />
          {isLit ?
            <meshBasicMaterial color={hue(FLOWER.pistilColor)} />
          : <meshToonMaterial color={hue(FLOWER.pistilColor)} {...CEL} />}
        </instancedMesh>
      )}
      {haloGeo && (
        <instancedMesh
          ref={glow}
          args={[haloGeo, undefined, L.density]}
          frustumCulled={false}
        >
          <meshBasicMaterial
            map={halo()}
            color="#ffffff"
            transparent
            opacity={GLOW.halo.alpha * G.brightness}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            fog={false}
          />
        </instancedMesh>
      )}
      {bulbGeo && (
        <instancedMesh
          ref={bulb}
          args={[bulbGeo, litMat(PALETTE.white), L.density]}
          frustumCulled={false}
        />
      )}
      {stemGeo && (
        <instancedMesh
          ref={stem}
          args={[stemGeo, undefined, L.density]}
          frustumCulled={false}
          receiveShadow
        >
          <meshToonMaterial color={hue(L.stem.color)} {...CEL} />
        </instancedMesh>
      )}
    </group>
  );
}

// The ground cover: every layer in `layers`, planted one over the other.
// `clearings` are places to leave bare: round ones as { lat, lon, radius }
// or { dir, radius } (`dir` a unit vector to the middle), rectangular ones
// as { origin, frame, halfWidth, halfLength, cornerRadius } (see
// stationClearings), strips as { points, halfWidths } (see pathClearing),
// pools as { origin, frame, pool, pad } marked `water: true` (see
// poolClearings) — in world units — otherwise it all grows straight up
// through the trampolines.
export default function GroundCover({ clearings = [], layers = GROUND_COVER }) {
  // Where every kept-apart layer's instances stood, by layer, so the
  // layers keep off each other too — see LAYER.apart.
  const crowd = useMemo(() => new Map(), []);
  const configs = useMemo(
    () => layers.flatMap((l, i) => variantsOf(merge(LAYER, l), i)),
    [layers],
  );
  return configs.map(({ L, where }, i) => (
    <Layer
      key={i}
      config={L}
      clearings={clearings}
      where={where}
      crowd={crowd}
    />
  ));
}

// What a layer's `variants` are rolled from, by type: the stock plant, and
// which of its `hand` ranges belong to its clay rather than its shape.
const HANDS = {
  grass: { stock: GRASS, key: "grass", clayHand: ["lumps", "depth"] },
  pebbles: { stock: PEBBLE, key: "pebble", clayHand: [] },
};

// A grass or pebbles layer grown in `variants`, as that many layers: each
// one tuft (or stone) pinched its own way — its shape rolled from the
// plant's `hand` off the layer's seed, its clay thrown from its own seed —
// sharing the density between them and each scattered from its own seed so
// they interleave rather than stack. Anything else, or one variant, is the
// layer as it is.
function variantsOf(L, i) {
  const where = `GROUND_COVER[${i}]`;
  const H = HANDS[L.type];
  if (!H || !(L.variants > 1)) return [{ L, where }];
  const G = merge(H.stock, L[H.key]);
  const rand = mulberry32(L.seed * 7919 + i);
  // Every field `hand` gives a range for, rolled; the rest stay as set.
  const rolled = (fields) =>
    Object.fromEntries(
      fields.filter((f) => G.hand[f]).map((f) => [f, between(G.hand[f], rand)]),
    );
  const shapeHand = Object.keys(G.hand).filter((f) => !H.clayHand.includes(f));
  return Array.from({ length: L.variants }, (_, v) => ({
    where: `${where} variant ${v}`,
    L: merge(L, {
      variants: 1,
      density: Math.round(L.density / L.variants),
      seed: L.seed + v,
      [H.key]: {
        ...rolled(shapeHand),
        clay: G.clay && {
          seed: G.clay.seed + v,
          ...rolled(H.clayHand),
        },
      },
    }),
  }));
}
