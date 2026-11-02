import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { PEDAL } from "../anthro/Anthro.jsx";
import { BICYCLE, BICYCLE_SEAT } from "./objects.js";

// One bicycle (see BICYCLE): stood on y = 0 facing +z. With `pedalling`
// its cranks go round in the "cycle" pose's own steps (PEDAL.frames a
// turn, each held PEDAL.hold), so a rider mounted at the same moment keeps
// their feet on the pedals, and its wheels roll `gear` turns to the
// cranks' one; `phase` (seconds) starts it that far into its turn, so
// bicycles together needn't pedal in step; `hold`, a ref, stops the cranks
// and wheels where they are while it is true (a rider stopped with a foot
// down: Anthro's "cycle stop"). Where everything is comes from the rider: the saddle at
// BICYCLE_SEAT, the cranks at PEDAL.crank, the grips where the pose's
// hands come (for the characters' usual arms).
const GEAR = 2;
const Y = new THREE.Vector3(0, 1, 0);

// the pose's hands, at size 1: as Anthro lays out an arm (a 0.5 arm, 0.06 thick)
function handOf(s) {
  const [e1, f1, e2, f2] = PEDAL.arms;
  const dir = (e, f) => [s * Math.cos(e) * Math.cos(f), Math.sin(e), Math.cos(e) * Math.sin(f)];
  const d1 = dir(e1, f1), d2 = dir(e2, f2), half = 0.25;
  const p = [s * 0.1, 0.86, 0].map((v, k) => v + d1[k] * (0.03 + half) + d2[k] * (half - 0.03 + 0.06));
  return p;
}

// A rod from `a` to `b`, `r` thick
function Rod({ a, b, r, material }) {
  const { position, quaternion, length } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    return { position: A.add(B).multiplyScalar(0.5), quaternion: new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize()), length: d.length() };
  }, [a, b]);
  return (
    <mesh position={position} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[r, r, length, 10]} />
    </mesh>
  );
}

// A wheel in the YZ plane about its axle: tyre, rim, hub and spokes
function Wheel({ W, mats, spin }) {
  const R = W.radius, rim = R - W.tire - 0.006;
  const spokes = useMemo(() => Array.from({ length: W.spokes }, (_, i) => {
    const th = (i / W.spokes) * Math.PI * 2, side = i % 2 ? 1 : -1;
    return { a: [side * 0.018, 0, 0], b: [0, Math.sin(th) * rim, Math.cos(th) * rim] };
  }), [W.spokes, rim]);
  return (
    <group ref={spin}>
      <mesh rotation-y={Math.PI / 2} material={mats.tire} castShadow>
        <torusGeometry args={[R - W.tire, W.tire, 10, 40]} />
      </mesh>
      <mesh rotation-y={Math.PI / 2} material={mats.metal}>
        <torusGeometry args={[rim, 0.007, 6, 40]} />
      </mesh>
      <mesh rotation-z={Math.PI / 2} material={mats.metal}>
        <cylinderGeometry args={[0.016, 0.016, 0.07, 10]} />
      </mesh>
      {spokes.map((s, i) => <Rod key={i} a={s.a} b={s.b} r={0.003} material={mats.metal} />)}
    </group>
  );
}

// A mudguard: an arc over a wheel, from `from` to `to` (radians round
// from straight behind, through the top)
function Fender({ R, from, to, material }) {
  return (
    <group rotation-y={Math.PI / 2}>
      <mesh rotation-z={from} material={material} castShadow>
        <torusGeometry args={[R + 0.018, 0.013, 6, 24, to - from]} />
      </mesh>
    </group>
  );
}

export default function Bicycle({ config, pedalling = false, phase = 0, hold }) {
  const C = useMemo(() => merge(BICYCLE, config), [config]);
  const W = C.wheel, R = W.radius, t = C.tube;
  const mats = useMemo(() => Object.fromEntries(Object.entries(C.colors).map(([k, v]) => [k, unlitMat(v)])), [C.colors]);

  // the fit: the saddle, the cranks and the grips where the rider's seat, pedals and hands are
  const seatY = BICYCLE_SEAT[1], lift = seatY - PEDAL.nominal; // the figure's standing frame, raised onto the saddle
  const crank = [0, PEDAL.crank[1] + lift, PEDAL.crank[0]], pr = PEDAL.radius;
  const rear = [0, R, crank[2] - 0.28], front = [0, R, crank[2] + 0.44];
  const hand = handOf(1), grip = [hand[0], hand[1] + lift, hand[2]];
  const seatTop = [0, seatY - 0.08, -0.025];
  const headTop = [0, grip[1] - 0.11, grip[2] - 0.07], headBot = [0, R * 2 + 0.06, grip[2] - 0.03];

  // the turning: cranks in the pose's steps, the pedals kept level, the wheels smoothly
  const crankRef = useRef(), pedals = useRef([]), wheels = useRef([]);
  const clock = useRef(phase);
  useEffect(() => { clock.current = phase; }, [pedalling, phase]);
  useFrame((_, delta) => {
    if (!pedalling) return;
    if (!hold?.current) clock.current += Math.min(delta, 0.1); // `hold`: stopped where it is (a rider with a foot down)
    const turn = Math.PI * 2, step = Math.floor(clock.current / PEDAL.hold);
    const th = (step / PEDAL.frames) * turn;
    if (crankRef.current) crankRef.current.rotation.x = th;
    pedals.current.forEach((p) => p && (p.rotation.x = -th));
    const roll = (clock.current / (PEDAL.frames * PEDAL.hold)) * turn * GEAR;
    wheels.current.forEach((w) => w && (w.rotation.x = roll));
  });

  const stays = (from) => [-1, 1].map((s) => <Rod key={s} a={from} b={[s * 0.035, rear[1], rear[2]]} r={t * 0.8} material={mats.frame} />);
  const low = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, crank[1] + 0.08, crank[2] - 0.03), new THREE.Vector3(0, crank[1] + 0.07, crank[2] + 0.12),
    new THREE.Vector3(0, crank[1] + 0.16, crank[2] + 0.28), new THREE.Vector3(...headBot),
  ]), 24, t, 8), [crank[1], crank[2], headBot[1], headBot[2], t]);
  useEffect(() => () => low.dispose(), [low]);

  return (
    <group>
      {/* the wheels */}
      {[rear, front].map((at, i) => (
        <group key={i} position={at}>
          <Wheel W={W} mats={mats} spin={(g) => { wheels.current[i] = g; }} />
          {C.fenders && <Fender R={R} from={i ? 0.9 : 0.15} to={i ? 2.75 : 2.3} material={mats.frame} />}
        </group>
      ))}

      {/* the frame: seat tube, down tube, the top tube (or the low step-through one), stays, head tube and fork */}
      <Rod a={crank} b={seatTop} r={t} material={mats.frame} />
      <Rod a={crank} b={headBot} r={t * 1.1} material={mats.frame} />
      {C.style === "step-through"
        ? <mesh geometry={low} material={mats.frame} castShadow />
        : <Rod a={[0, seatTop[1] - 0.015, seatTop[2] + 0.005]} b={[0, headTop[1] - 0.02, headTop[2] + 0.008]} r={t} material={mats.frame} />}
      {stays(crank)}
      {stays(seatTop)}
      <Rod a={headBot} b={headTop} r={t * 1.5} material={mats.frame} />
      {[-1, 1].map((s) => <Rod key={s} a={[s * 0.03, headBot[1] - 0.01, headBot[2]]} b={[s * 0.03, front[1], front[2]]} r={t * 0.8} material={mats.frame} />)}
      <Rod a={[-0.035, headBot[1] - 0.01, headBot[2]]} b={[0.035, headBot[1] - 0.01, headBot[2]]} r={t} material={mats.frame} />

      {/* the seat post and saddle: a pad wide at the back, narrowing to its nose */}
      <Rod a={seatTop} b={[0, seatY - 0.02, -0.035]} r={t * 0.7} material={mats.metal} />
      <mesh position={[0, seatY - 0.022, -0.06]} scale={[0.06, 0.022, 0.07]} material={mats.saddle} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      <mesh position={[0, seatY - 0.02, 0.02]} scale={[0.028, 0.018, 0.07]} material={mats.saddle} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>

      {/* the stem, the bar across, and the grips where the hands come */}
      <Rod a={headTop} b={[0, grip[1], grip[2] - 0.02]} r={t * 0.9} material={mats.metal} />
      <Rod a={[-grip[0] - 0.04, grip[1], grip[2] - 0.02]} b={[grip[0] + 0.04, grip[1], grip[2] - 0.02]} r={t * 0.75} material={mats.metal} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * grip[0], grip[1], grip[2] - 0.02]} rotation-z={Math.PI / 2} material={mats.grips} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.085, 10]} />
        </mesh>
      ))}
      {C.bell && (
        <mesh position={[grip[0] - 0.08, grip[1] + 0.02, grip[2] - 0.02]} material={mats.bell} castShadow>
          <sphereGeometry args={[0.022, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}

      {/* the drive: the chain from the chainring back to the rear cog, then the cranks and pedals */}
      {[1, -1].map((u) => <Rod key={u} a={[0.045, crank[1] + u * 0.05, crank[2]]} b={[0.045, rear[1] + u * 0.025, rear[2]]} r={0.005} material={mats.metal} />)}
      <mesh position={[0.045, rear[1], rear[2]]} rotation-z={Math.PI / 2} material={mats.metal}>
        <cylinderGeometry args={[0.028, 0.028, 0.01, 14]} />
      </mesh>
      <group position={crank} ref={crankRef}>
        <mesh position-x={0.045} rotation-z={Math.PI / 2} material={mats.metal} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.01, 20]} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} material={mats.metal}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 10]} />
        </mesh>
        {[1, -1].map((s, i) => (
          <group key={s}>
            <Rod a={[s * 0.055, 0, 0]} b={[s * 0.055, s * pr, 0]} r={0.008} material={mats.metal} />
            <group position={[s * 0.1, s * pr, 0]} ref={(g) => { pedals.current[i] = g; }}>
              <mesh material={mats.tire} castShadow>
                <boxGeometry args={[0.07, 0.018, 0.05]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* a wicker basket on the front, over the wheel, held to the bar and the fork */}
      {C.basket && (() => {
        const w = 0.22, h = 0.13, d = 0.16, c = [0, grip[1] - 0.09, grip[2] + d / 2 + 0.03], th = 0.008;
        const sides = [
          [[0, -h / 2, 0], [w, th, d]], [[0, 0, d / 2], [w, h, th]], [[0, 0, -d / 2], [w, h, th]],
          [[w / 2, 0, 0], [th, h, d]], [[-w / 2, 0, 0], [th, h, d]],
        ];
        return (
          <group>
            <group position={c}>
              {sides.map(([p, s], i) => (
                <mesh key={i} position={p} material={mats.basket} castShadow>
                  <boxGeometry args={s} />
                </mesh>
              ))}
              {/* the rim round its top */}
              <mesh position-y={h / 2} material={mats.basket}>
                <boxGeometry args={[w + 0.02, 0.015, d + 0.02]} />
              </mesh>
            </group>
            {[-1, 1].map((s) => <Rod key={s} a={[s * 0.06, c[1] - h / 2, c[2]]} b={[s * 0.03, front[1] + 0.02, front[2]]} r={0.005} material={mats.metal} />)}
          </group>
        );
      })()}
    </group>
  );
}
