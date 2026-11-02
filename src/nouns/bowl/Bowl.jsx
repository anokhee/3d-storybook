import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { BOWL } from "./objects.js";
import { designMat, disposeDesign, groundOf } from "./designs.js";
import { APPLE } from "../apple/objects.js";
import { buildApple } from "../apple/build.js";
import { ORANGE } from "../orange/objects.js";
import { buildOrange } from "../orange/build.js";
import { BANANA } from "../banana/objects.js";
import { buildBanana } from "../banana/build.js";
import { buildCurry, buildNoodles, disposeFill } from "../../world/food/fill.js";

// How tall it stands: the rim (the fruit may peek over it).
export function bowlHeightOf(C) {
  return C.depth;
}

// How far out from its middle it spreads: the rim, flare and all.
export function bowlFootprintOf(C) {
  const r = C.radius * (1 + 0.15 * C.flare);
  return { x: r, z: r };
}

// The bowl's outside, as a radius at each height `t` up it (0 the foot,
// 1 the rim): a quarter curve swelling from the foot, with the flare
// kicking the rim out at the very top.
const outsideAt = (C, t) => {
  const foot = C.radius * C.foot.radius;
  const curve = Math.pow(Math.sin((t * Math.PI) / 2), 0.85);
  return foot + (C.radius - foot) * curve + C.radius * 0.15 * C.flare * Math.pow(t, 4);
};

// One bowl (see BOWL), standing on the ground at y = 0. `config` overrides
// any of BOWL's fields for this one.
export default function Bowl({ config }) {
  const C = useMemo(() => merge(BOWL, config), [config]);
  const floor = C.foot.height + C.wall; // the inside's floor, off the ground

  // The shell and the inside profile it leaves: up the outside from the
  // foot ring, over the rim and back down the inside, `wall` in from the
  // outside, to a flat floor.
  const { geometry, inside } = useMemo(() => {
    const n = 9;
    const pts = [];
    const footR = C.radius * C.foot.radius;
    pts.push(new THREE.Vector2(footR - C.wall, 0));
    pts.push(new THREE.Vector2(footR, 0));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(new THREE.Vector2(outsideAt(C, t), C.foot.height + t * (C.depth - C.foot.height)));
    }
    const inside = [];
    for (let i = n; i >= 1; i--) {
      const t = i / n;
      const p = new THREE.Vector2(outsideAt(C, t) - C.wall, C.foot.height + t * (C.depth - C.foot.height));
      pts.push(p);
      inside.push(p);
    }
    const bottom = new THREE.Vector2(0, floor);
    pts.push(bottom);
    inside.push(bottom);
    return { geometry: new THREE.LatheGeometry(pts, C.sides), inside };
  }, [C, floor]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // The design, painted on a skin over the outside, from the foot up to the
  // rim (./designs.js); the shell itself in the design's ground colour.
  const skin = useMemo(() => {
    if (!C.design || C.design === "basic") return null;
    const n = 9, pts = [new THREE.Vector2(C.radius * C.foot.radius * 1.004, 0)];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(new THREE.Vector2(outsideAt(C, t) * 1.004 + 0.001, C.foot.height + t * (C.depth - C.foot.height)));
    }
    return new THREE.LatheGeometry(pts, Math.max(C.sides, 48));
  }, [C]);
  const painted = useMemo(() => skin && designMat(C.design, C.colors), [skin, C.design, C.colors]);
  useEffect(() => () => { skin?.dispose(); disposeDesign(painted); }, [skin, painted]);

  // What's in it, built: the fruit at rest in a ring (or one in the
  // middle), each lowered until it just touches the inside; or the
  // noodles or curry at `fill` of the way up.
  const contents = useMemo(() => {
    const g = new THREE.Group();
    // (the older names: "fruits", "fruits2")
    const what = { fruits: "apple and banana", fruits2: "orange and apple" }[C.contents] ?? C.contents ?? "apple and banana";
    const count = Math.max(0, Math.min(6, Math.round(C.fruit.count)));
    const fr = C.fruit.radius;
    // one Apple at the back and one Banana in front, lying in the bowl's
    // curve — a banana about two and a half apples long, under half one thick
    if (what === "apple and banana" && count > 0) {
      const apple = buildApple({ ...APPLE, radius: fr });
      apple.position.set(fr * 0.25, restAt(inside, floor, fr * 0.75, fr) - fr, -fr * 0.7);
      apple.rotation.y = 0.6;
      g.add(apple);
      const thick = fr * 0.48;
      const b = buildBanana({ ...BANANA, count: 1, length: Math.min(fr * 5, C.radius * 1.6), thick });
      b.position.set(0, restAt(inside, floor, fr * 0.55, thick) - thick, fr * 0.55);
      b.rotation.y = 0.15;
      g.add(b);
    }
    // Oranges and Apples, turn and turn about, in a ring
    if (what === "orange and apple" && count > 0) {
      const ring = count > 1 ? Math.min(C.radius * 0.5, Math.max(fr * 1.05, (fr * count) / Math.PI)) : 0;
      const y = restAt(inside, floor, ring, fr) - fr;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.4;
        const f = i % 2 === 0
          ? buildOrange({ ...ORANGE, radius: fr })
          : buildApple({ ...APPLE, radius: fr, leaf: i === 1 ? APPLE.leaf : null });
        f.position.set(Math.sin(a) * ring, y, Math.cos(a) * ring);
        f.rotation.y = i * 2.3;
        g.add(f);
      }
    }
    if (what === "noodles" || what === "curry") {
      const lvl = floor + Math.max(0, Math.min(1, C.fill)) * (C.depth - floor);
      const R = insideRadiusAt(inside, lvl) * 0.98;
      const f = what === "curry" ? buildCurry(R, C.seed) : buildNoodles(R, C.seed);
      f.position.y = lvl;
      g.add(f);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }, [C.contents, C.fruit, C.radius, C.depth, C.fill, C.seed, inside, floor]);
  useEffect(() => () => disposeFill(contents), [contents]);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={geometry} material={unlitMat(groundOf(C.design, C.colors))} />
      {skin && painted && <mesh receiveShadow geometry={skin} material={painted} />}
      <primitive object={contents} />
    </group>
  );
}

// How high a ball `fr` round sits `rho` out from the middle, resting on
// the inside (its profile `inside`, from the rim down to the floor).
function restAt(inside, floor, rho, fr) {
  const segs = inside.slice(0, -1).map((p, i) => [p, inside[i + 1]]);
  const dist = (y) => {
    let best = Infinity;
    const c = new THREE.Vector2(rho, y);
    for (const [a, b] of segs) {
      const ab = b.clone().sub(a);
      const k = Math.max(0, Math.min(1, c.clone().sub(a).dot(ab) / ab.lengthSq()));
      best = Math.min(best, c.distanceTo(a.clone().addScaledVector(ab, k)));
    }
    return best;
  };
  let y = floor + fr;
  for (let i = 0; i < 40 && dist(y) < fr * 0.98; i++) y += fr * 0.05;
  return y;
}

// The inside's radius at height y (the profile runs from the rim down).
function insideRadiusAt(inside, y) {
  for (let i = 0; i < inside.length - 2; i++) {
    const a = inside[i], b = inside[i + 1];
    if (y <= a.y && y >= b.y) return b.x + ((a.x - b.x) * (y - b.y)) / Math.max(a.y - b.y, 1e-6);
  }
  return inside[inside.length - 2].x;
}
