import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { merge } from "../../world/merge.js";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerMat, unregisterMat } from "../../player/mats.js";
import { MAT } from "../../player/tuning.js";
import { TRAMPOLINE } from "./objects.js";
import { CEL } from "../../adjectives/unlit/toon.js";

// `config` overrides any of TRAMPOLINE's fields for this one instance,
// colors included.
export default function Trampoline({ config }) {
  const T = useMemo(() => merge(TRAMPOLINE, config), [config]);
  const F = T.frame;

  const sheet = useRef();
  const skin = useRef();

  // The sheet the player lands on, registered by where it actually IS: its
  // world position, measured from the ball it is on, gives both the bearing
  // and its height above the ground there, so a sheet may sit anywhere in
  // the tree — offset inside a station, or two to a ring of posts.
  const body = useBody();
  const mat = useRef(null);
  useEffect(() => {
    const at = new THREE.Vector3();
    sheet.current.updateWorldMatrix(true, false);
    sheet.current.getWorldPosition(at);
    at.sub(body.center);
    const m = (mat.current = registerMat({
      body,
      dir: at.clone().normalize(),
      top: at.length() - body.radius,
      radius: T.radius,
    }));
    return () => {
      unregisterMat(m);
      mat.current = null;
    };
  }, [T, body]);

  // The sheet sinks by what landed on it and lights by how well the landing
  // was timed, both easing back — see MAT.dip.
  useFrame((_, dt) => {
    const m = mat.current;
    if (!m) return;
    const D = MAT.dip;
    m.dip *= Math.exp(-D.rate * dt);
    m.flash *= Math.exp(-D.fade * dt);
    if (sheet.current) sheet.current.position.y = T.height - m.dip;
    if (skin.current) skin.current.emissiveIntensity = m.flash * D.glow;
  });

  return (
    <group>
      {/* Open-ended cylinder. Three starts a cylinder's first facet at +z
          and a circle's (and a torus's) at +x, so at any segment count not
          divisible by four the skirt's corners miss the sheet's and the rim
          cuts through the skirt's faces. A quarter turn lines them up. */}
      {T.hasSkirt && (
        <mesh position={[0, T.height / 2, 0]} rotation-y={Math.PI / 2}>
          <cylinderGeometry
            args={[
              T.radius,
              T.radius * T.skirt.taper,
              T.height,
              F.segments,
              1,
              true,
            ]}
          />
          <meshToonMaterial
            color={hue(T.skirt.color)}
            {...CEL}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Legs, otherwise: from the ground (the whole trampoline is dropped
          by `sink`, so that is `sink` below here) up to just under the
          sheet, spaced evenly round from `turn`. */}
      {!T.hasSkirt &&
        Array.from({ length: F.numLegs }, (_, i) => {
          const a = ((F.turn + (360 / F.numLegs) * i) * Math.PI) / 180;
          const r = T.radius * F.in;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * r,
                (T.height - T.sink) / 2 - 0.05,
                Math.sin(a) * r,
              ]}
            >
              <cylinderGeometry
                args={[
                  F.thickness * F.legTaper,
                  F.thickness,
                  T.height + T.sink,
                  F.legDetail,
                ]}
              />
              <meshToonMaterial color={hue(T.frameColor)} {...CEL} />
            </mesh>
          );
        })}

      {/* A circle is created standing upright in xy, so it gets laid flat. */}
      <mesh ref={sheet} rotation-x={-Math.PI / 2} position={[0, T.height, 0]}>
        <circleGeometry args={[T.radius, F.segments]} />
        <meshToonMaterial
          ref={skin}
          color={hue(T.matColor)}
          emissive={hue(T.frameColor)}
          emissiveIntensity={0}
          {...CEL}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* A torus is created standing upright in xy, so it gets laid flat. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, T.height, 0]}>
        <torusGeometry args={[T.radius, F.thickness, 8, F.segments]} />
        <meshToonMaterial color={hue(T.frameColor)} {...CEL} />
      </mesh>
    </group>
  );
}
