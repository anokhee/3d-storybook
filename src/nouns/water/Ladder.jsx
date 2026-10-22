import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { poolDistance } from "./pools.js";

// A pool's ladder — see POOL.ladder, and TUB's: two rails hanging down
// into the water from the rim, bent over its top and stood outside, with
// rungs between them down both sides where there is a way to climb. It
// stands at the middle of the pool's right side — its first lobe's, as
// the object is turned — walked out onto the water's edge where lobes run
// together. `L` is its config; `top` how high the rim it goes over stands
// off the ground; `bed(x, z)` how far below that the bed lies where it
// hangs, for the rails to stop short of; and `footDrop` how far below the
// rim its outer feet stand — 0 on a pool's border, the wall's height on
// an above-ground pool, down to the ground. Built in its own frame at the
// rim, -x into the water and y up, then stood on the ball's curve there
// and turned to face in.
const EPS = 0.01;
const UP = new THREE.Vector3(0, 1, 0);

export default function Ladder({ pool, L, top: rim, bed, footDrop = 0 }) {
  const R = pool.body.radius;

  const { position, quaternion, rails, rungs } = useMemo(() => {
    const l = pool.lobes[0];
    const c = Math.cos(l.rad),
      s = Math.sin(l.rad);
    // The middle of the lobe's right side, in the pool's frame, then onto
    // the water's edge itself: down the field's slope by its distance,
    // twice over, the way the sheet's points are.
    let x = l.x + l.halfWidth * c;
    let z = l.z - l.halfWidth * s;
    const d = (x, z) => poolDistance(pool, x, z);
    for (let step = 0; step < 2; step++) {
      const dist = d(x, z);
      const gx = (d(x + EPS, z) - d(x - EPS, z)) / (2 * EPS);
      const gz = (d(x, z + EPS) - d(x, z - EPS)) / (2 * EPS);
      const g = Math.hypot(gx, gz) || 1;
      x -= (gx / g) * dist;
      z -= (gz / g) * dist;
    }
    // Onto the ball's curve at the border's top, and stood up along the
    // ground's up there — the ball's center is at (0, -R, 0).
    const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
    const n = new THREE.Vector3(x / R, y / R, z / R);
    const position = n
      .clone()
      .multiplyScalar(R + rim)
      .sub(new THREE.Vector3(0, R, 0));
    const quaternion = new THREE.Quaternion()
      .setFromUnitVectors(UP, n)
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, l.rad));

    // How far the rails reach under the water, short of the bed.
    const drop = Math.max(0.5, Math.min(L.drop, bed(x, z) - 0.3));
    const r = Math.min(0.35, L.rise, (L.in + L.out) / 2);
    const top = L.rise;
    const path = new THREE.CurvePath();
    const at = (x, y) => new THREE.Vector3(x, y, 0);
    path.add(new THREE.LineCurve3(at(-L.in, -drop), at(-L.in, top - r)));
    path.add(
      new THREE.QuadraticBezierCurve3(
        at(-L.in, top - r),
        at(-L.in, top),
        at(-L.in + r, top),
      ),
    );
    path.add(new THREE.LineCurve3(at(-L.in + r, top), at(L.out - r, top)));
    path.add(
      new THREE.QuadraticBezierCurve3(
        at(L.out - r, top),
        at(L.out, top),
        at(L.out, top - r),
      ),
    );
    path.add(new THREE.LineCurve3(at(L.out, top - r), at(L.out, -footDrop)));
    const rails = new THREE.TubeGeometry(path, 48, L.radius, 8, false);

    // The rungs, spread down the rails: inside, under the water; and
    // outside too, down to the ground, where the feet go that far.
    const count = Math.max(0, Math.round(L.rungs));
    const spread = (first, last) =>
      Array.from({ length: count }, (_, k) =>
        count > 1 ?
          first + ((last - first) * k) / (count - 1)
        : (first + last) / 2,
      );
    const ys = [
      ...spread(-0.4, -drop + 0.3).map((y) => [-L.in, y]),
      ...(footDrop > 0.6 ?
        spread(-0.4, -footDrop + 0.3).map((y) => [L.out, y])
      : []),
    ];
    const rung = new THREE.CylinderGeometry(L.radius, L.radius, L.apart, 8);
    rung.rotateX(Math.PI / 2);
    return { position, quaternion, rails, rungs: { rung, ys } };
  }, [pool, L, R, rim, bed, footDrop]);
  useEffect(
    () => () => (rails.dispose(), rungs.rung.dispose()),
    [rails, rungs],
  );

  const material = unlitMat(L.color);
  return (
    <group position={position} quaternion={quaternion}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={rails}
          material={material}
          position-z={(side * L.apart) / 2}
        />
      ))}
      {rungs.ys.map(([x, y], k) => (
        <mesh
          key={k}
          geometry={rungs.rung}
          material={material}
          position={[x, y, 0]}
        />
      ))}
    </group>
  );
}
