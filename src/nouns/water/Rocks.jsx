import { useMemo } from "react";
import * as THREE from "three";

import { mulberry32, between } from "../../world/random.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { primitiveGeometry } from "../primitive/geometry.js";
import { groundRadiusAt } from "../planet/ground.js";
import { gradientAt, poolContours } from "./basin.js";

// The rocks round a hot spring — see SPRING.rocks in objects.js: clay
// boulders stood along the water's edge, `spacing` apart round it and
// wandering a little off the line, each rolled its own size and shape
// from the ranges there and turned its own way, sat `sink` into the
// ground where it stands — the ground itself, hollows and all, the way
// the sheet lies on it. The stones are `variants` lumps of clay, each a
// unit ball thumbed with its own seed, and each rock is one of them pulled
// to its own width, length and height, so a bank of forty is six
// geometries drawn forty times. Dealt by a seeded roll, so the same
// spring has the same rocks on reload — and the same ones again as it is
// dragged, since they are laid out in the pool's own frame.
const UP = new THREE.Vector3(0, 1, 0);

export default function Rocks({ pool }) {
  const W = pool.W;
  const K = W.spring.rocks;
  const R = pool.body.radius;

  const variants = useMemo(
    () =>
      Array.from({ length: K.variants }, (_, v) =>
        primitiveGeometry(
          "sphere",
          1,
          undefined,
          K.detail,
          undefined,
          undefined,
          K.clay ? { ...K.clay, seed: K.clay.seed + v } : null,
        ),
      ),
    [K.variants, K.detail, K.clay],
  );

  const rocks = useMemo(() => {
    const rand = mulberry32(K.seed);
    const groundAt =
      pool.body.name === "planet" ? groundRadiusAt : () => pool.body.radius;
    const dir = new THREE.Vector3();
    const out = [];
    for (const loop of poolContours(pool, W.stitch)) {
      // Round the loop by arc length, a rock every `spacing`, each nudged
      // along and out by its own roll.
      const n = loop.length;
      let carried = 0;
      for (let k = 0; k < n; k++) {
        const [ax, az] = loop[k];
        const [bx, bz] = loop[(k + 1) % n];
        const len = Math.hypot(bx - ax, bz - az);
        let t = carried;
        while (t < len) {
          const slide = (rand() * 2 - 1) * K.jitter * K.spacing;
          const u = Math.min(len, Math.max(0, t + slide)) / len;
          let x = ax + (bx - ax) * u;
          let z = az + (bz - az) * u;
          const [gx, gz] = gradientAt(pool, x, z);
          const radius = between(K.radius, rand);
          const widen = between(K.widen, rand);
          const deepen = between(K.deepen, rand);
          const squash = between(K.squash, rand);
          const away = K.out + (rand() * 2 - 1) * K.jitter * K.spacing;
          x += gx * (away + radius * 0.5);
          z += gz * (away + radius * 0.5);
          // Onto the ground there, and sat into it.
          const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
          const n = dir.set(x / R, y / R, z / R).clone();
          const ground = groundAt(dir.applyQuaternion(pool.frame));
          const half = radius * squash;
          const lift = ground - R + half - K.sink * 2 * half;
          const position = n
            .clone()
            .multiplyScalar(R + lift)
            .sub(new THREE.Vector3(0, R, 0));
          const quaternion = new THREE.Quaternion()
            .setFromUnitVectors(UP, n)
            .multiply(
              new THREE.Quaternion().setFromAxisAngle(UP, rand() * Math.PI * 2),
            );
          out.push({
            position,
            quaternion,
            scale: [radius * widen, half, radius * deepen],
            variant: Math.floor(rand() * K.variants) % K.variants,
            color: K.colors[out.length % K.colors.length],
          });
          t += K.spacing;
        }
        carried = t - len;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.key, K, W.stitch]);

  return rocks.map((rock, i) => (
    <mesh
      key={i}
      geometry={variants[rock.variant]}
      material={unlitMat(rock.color)}
      position={rock.position}
      quaternion={rock.quaternion}
      scale={rock.scale}
      castShadow
    />
  ));
}
