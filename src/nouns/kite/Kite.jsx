import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { KITE } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;
const UP = new THREE.Vector3(0, 1, 0);

// How tall it stands off its ground: the sail's top corner, flying.
export function kiteHeightOf(K) {
  return K.height + K.sail.size * K.sail.above;
}

// How far out from the peg it spreads: the sail across, and forward to
// where it flies plus its tail trailing on.
export function kiteFootprintOf(K) {
  return {
    x: K.sail.size / 2,
    z: K.height * K.forward + K.sail.size,
  };
}

// Half the diamond, from the spine out to one side: the spar's end, the
// top corner and the bottom corner, as a flat shape to extrude.
function halfSail(side, size, above, below) {
  const s = new THREE.Shape();
  s.moveTo(0, size * above);
  s.lineTo((side * size) / 2, 0);
  s.lineTo(0, -size * below);
  s.closePath();
  return s;
}

// Where the tail hangs at rest and in a wind: from the sail's bottom
// corner, away from the peg (-z) and down, rippling across (x) with the
// wind — in the kite's own frame, which is leant back and bobbing already.
function tailPoint(T, s, t, wind, out) {
  const back = s * T.length;
  const ripple = wind * 0.35 * Math.sin(s * 7 - t * 3) * s;
  const lift = wind * 0.3 * s;
  return out.set(ripple, -back * T.sag * (1 - lift) + 0.05, -back);
}

// One kite, flying up and back (-z) at the end of its line from a peg at
// the origin on the ground, its sail facing the peg (+z). `config` overrides any of KITE's fields for this instance.
export default function Kite({ config }) {
  const K = useMemo(() => merge(KITE, config), [config]);
  const S = K.sail;
  const P = K.spars;
  const T = K.tail;
  const paint = K.colors;

  const halves = useMemo(() => {
    const opts = { depth: S.depth, bevelEnabled: false };
    return [
      new THREE.ExtrudeGeometry(halfSail(-1, S.size, S.above, S.below), opts),
      new THREE.ExtrudeGeometry(halfSail(1, S.size, S.above, S.below), opts),
    ];
  }, [S.size, S.above, S.below, S.depth]);
  useEffect(() => () => halves.forEach((g) => g.dispose()), [halves]);

  const rod = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6), []);
  useEffect(() => () => rod.dispose(), [rod]);

  const segments = Math.max(2, Math.round(T.segments));
  const bows = Math.max(0, Math.round(T.bows));
  const seg = T.length / segments;

  const kite = useRef();
  const line = useRef();
  const tailRefs = useRef([]);
  const bowRefs = useRef([]);
  const clock = useRef(0);

  // Where the sail flies, and where its bridle is, in the world.
  const home = useMemo(
    () => new THREE.Vector3(0, K.height, -K.height * K.forward),
    [K.height, K.forward],
  );
  const tmp = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      d: new THREE.Vector3(),
      bridle: new THREE.Vector3(),
      peg: new THREE.Vector3(0, K.peg.height, 0),
      q: new THREE.Quaternion(),
    }),
    [K.peg.height],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt * K.rate;
    const t = clock.current;
    const w = K.wind;
    const g = kite.current;
    if (!g) return;
    // The kite bobs about its home and leans with the gusts.
    g.position.set(
      w * 0.3 * Math.sin(t * 0.9),
      home.y + w * 0.35 * Math.sin(t * 1.3),
      home.z - w * 0.2 * Math.sin(t * 0.7 + 2),
    );
    g.rotation.set(-rad(S.tilt) - w * 0.1 * Math.sin(t * 1.1), 0, w * 0.18 * Math.sin(t * 0.8 + 1));
    g.updateMatrixWorld();

    // The tail, segment by segment, in the kite's frame.
    const { a, b, d, q } = tmp;
    for (let i = 0; i < segments; i++) {
      const m = tailRefs.current[i];
      if (!m) continue;
      tailPoint(T, i / segments, t, w, a);
      tailPoint(T, (i + 1) / segments, t, w, b);
      d.subVectors(b, a);
      const len = d.length() || 1e-4;
      m.position.addVectors(a, b).multiplyScalar(0.5);
      m.quaternion.copy(q.setFromUnitVectors(UP, d.normalize()));
      m.scale.set(T.radius, len, T.radius);
    }
    for (let i = 0; i < bows; i++) {
      const m = bowRefs.current[i];
      if (!m) continue;
      const s = (i + 1) / (bows + 1);
      tailPoint(T, s, t, w, a);
      m.position.copy(a);
      m.rotation.z = w * 0.6 * Math.sin(t * 2 + i);
    }

    // The line, from the peg up to the bridle, wherever the kite has got to.
    const { bridle, peg } = tmp;
    bridle.set(0, 0, P.bridle).applyMatrix4(g.matrixWorld);
    d.subVectors(bridle, peg);
    const len = d.length() || 1e-4;
    const l = line.current;
    if (l) {
      l.position.addVectors(peg, bridle).multiplyScalar(0.5);
      l.quaternion.copy(q.setFromUnitVectors(UP, d.normalize()));
      l.scale.set(K.line.radius, len, K.line.radius);
    }
  });

  // The bridle: two short strings from the spine's ends to the knot the
  // line ties on, out in front of the sail toward the peg.
  const bridles = useMemo(() => {
    const knot = new THREE.Vector3(0, 0, P.bridle);
    return [new THREE.Vector3(0, S.size * S.above, 0), new THREE.Vector3(0, -S.size * S.below * 0.6, 0)].map(
      (end) => {
        const d = new THREE.Vector3().subVectors(knot, end);
        return {
          mid: new THREE.Vector3().addVectors(knot, end).multiplyScalar(0.5),
          q: new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()),
          length: d.length(),
        };
      },
    );
  }, [P.bridle, S.size, S.above, S.below]);

  const sailMat = [unlitMat(paint.sailA), unlitMat(paint.sailB)];
  const tallness = S.size * (S.above + S.below);
  return (
    <group>
      {/* The peg in the ground at the origin. */}
      <group position-y={K.peg.height / 2}>
        <mesh material={unlitMat(paint.peg)} castShadow receiveShadow>
          <cylinderGeometry args={[K.peg.radius, K.peg.radius * 0.7, K.peg.height, 8]} />
        </mesh>
      </group>
      <mesh ref={line} geometry={rod} material={unlitMat(paint.line)} />
      <group ref={kite} position={home} rotation-x={-rad(S.tilt)}>
        {/* The sail faces the peg (+z), leant back away from it; the
            spars lie on its back (-z). */}
        <group>
          {halves.map((g, i) => (
            <mesh key={i} geometry={g} material={sailMat[i]} castShadow receiveShadow />
          ))}
        </group>
        <mesh
          geometry={rod}
          position={[0, (S.size * (S.above - S.below)) / 2, -P.radius]}
          scale={[P.radius, tallness, P.radius]}
          material={unlitMat(paint.spar)}
          castShadow
        />
        <mesh
          geometry={rod}
          position-z={-P.radius}
          rotation-z={Math.PI / 2}
          scale={[P.radius, S.size, P.radius]}
          material={unlitMat(paint.spar)}
          castShadow
        />
        {bridles.map((b, i) => (
          <mesh
            key={i}
            geometry={rod}
            position={b.mid}
            quaternion={b.q}
            scale={[K.line.radius, b.length, K.line.radius]}
            material={unlitMat(paint.line)}
          />
        ))}
        {/* The tail off the bottom corner, laid out every frame. */}
        <group position-y={-S.size * S.below}>
          {Array.from({ length: segments }, (_, i) => (
            <mesh
              key={i}
              ref={(el) => (tailRefs.current[i] = el)}
              geometry={rod}
              material={unlitMat(paint.tail)}
              castShadow
            />
          ))}
          {Array.from({ length: bows }, (_, i) => (
            <group key={i} ref={(el) => (bowRefs.current[i] = el)}>
              <mesh material={unlitMat(paint.tail)} castShadow receiveShadow>
                <boxGeometry args={[T.bow, T.bow * 0.42, T.bow * 0.2]} />
              </mesh>
              <mesh material={unlitMat(paint.sailB)} castShadow>
                <boxGeometry args={[T.bow * 0.22, T.bow * 0.5, T.bow * 0.24]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
