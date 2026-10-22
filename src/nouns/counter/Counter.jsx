import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { roundedRect } from "../water/Pad.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { COUNTER } from "./objects.js";

// A shape pulled up `height` and laid flat, its underside at y = 0: the
// way everything flat here is built (see ../rug/Rug.jsx). The shape's
// own y runs down world z.
function slabOf(shape, height) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 8,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

// How tall the counter stands off its ground, for the posts to clear:
// the worktop, or the tap over a sink.
export function counterHeightOf(C) {
  const tap = C.kind === "sink" && C.tap ? C.tap.height : 0;
  return C.body.height + tap;
}

// How far out from its middle it spreads, across (x) and along (z), for
// the grass to keep back from: the worktop's edges.
export function counterFootprintOf(C) {
  return {
    x: C.body.width / 2 + C.top.overhang,
    z: C.body.depth / 2 + C.top.overhang,
  };
}

// One kitchen counter, standing on the ground at y = 0 with its front
// facing +z. `config` overrides any of COUNTER's fields for this one
// instance.
export default function Counter({ config }) {
  const C = useMemo(() => merge(COUNTER, config), [config]);
  const B = C.body;
  const T = C.top;
  const N = C.basin;
  const sink = C.kind === "sink";
  // The basin, as big as the worktop has room for.
  const basin = useMemo(() => {
    const room = (span, over) => Math.max(0.2, span - 2 * (over + N.thickness));
    const width = Math.min(N.width, room(B.width, T.overhang));
    const length = Math.min(N.length, room(B.depth, T.overhang));
    const along = THREE.MathUtils.clamp(
      N.along,
      -(B.width / 2 - width / 2 - N.thickness),
      B.width / 2 - width / 2 - N.thickness,
    );
    return { width, length, along, depth: N.depth, r: N.cornerRadius };
  }, [N, B, T.overhang]);

  // Solid to the player up to the worktop: registered by where it
  // actually IS, so it may sit anywhere in the tree — a box its size.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    root.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const f = counterFootprintOf(C);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + B.height,
      frame: turn,
      halfWidth: f.x,
      halfLength: f.z,
    });
    return () => unregisterSolid(solid);
  }, [C, B.height, ball]);

  // The cabinet, from the floor to the worktop's underside.
  const cabinet = useMemo(
    () =>
      slabOf(
        roundedRect(B.width, B.depth, B.cornerRadius),
        B.height - T.thickness,
      ),
    [B, T.thickness],
  );
  // The worktop, with the basin's opening cut out of it on a sink.
  const top = useMemo(() => {
    const shape = roundedRect(
      B.width + 2 * T.overhang,
      B.depth + 2 * T.overhang,
      T.cornerRadius,
    );
    if (sink)
      shape.holes.push(
        roundedRect(basin.width, basin.length, basin.r, basin.along, 0),
      );
    return slabOf(shape, T.thickness);
  }, [B, T, sink, basin]);
  // The basin hanging under the opening: its walls, a ring just outside
  // the opening so the worktop's edge hides their tops, and its bed
  // across the bottom.
  const hollow = useMemo(() => {
    if (!sink) return null;
    const t = N.thickness;
    const walls = roundedRect(
      basin.width + 2 * t,
      basin.length + 2 * t,
      basin.r + t,
      basin.along,
      0,
    );
    walls.holes.push(
      roundedRect(basin.width, basin.length, basin.r, basin.along, 0),
    );
    const ring = slabOf(walls, basin.depth);
    const bed = slabOf(
      roundedRect(
        basin.width + 2 * t,
        basin.length + 2 * t,
        basin.r + t,
        basin.along,
        0,
      ),
      t,
    ).translate(0, -t, 0);
    return mergeGeometries([ring, bed], false);
  }, [sink, basin, N.thickness]);
  useEffect(
    () => () => {
      cabinet.dispose();
      top.dispose();
      hollow?.dispose();
    },
    [cabinet, top, hollow],
  );
  const P = C.tap;
  // The tap: a pipe standing behind the basin with a spout leaning out
  // over it — a cylinder stands two radii tall, so each is pressed to
  // its own length (see FORM).
  const tapForms = useMemo(
    () =>
      P ?
        {
          pipe: { tall: P.height / (2 * P.radius) },
          spout: { tall: P.reach / (2 * P.radius) },
        }
      : null,
    [P],
  );
  const tapZ = -(basin.length / 2 + N.thickness + (P?.radius ?? 0) * 1.6);
  return (
    <group ref={root}>
      <mesh geometry={cabinet} material={unlitMat(C.colors.body)} />
      <mesh
        geometry={top}
        position-y={B.height - T.thickness}
        material={unlitMat(C.colors.top)}
      />
      {hollow && (
        <mesh
          geometry={hollow}
          position-y={B.height - T.thickness - basin.depth}
          material={unlitMat(C.colors.basin)}
        />
      )}
      {sink && P && (
        <group position={[basin.along, B.height, tapZ]}>
          <group position-y={P.height / 2}>
            <Primitive
              shape="cylinder"
              radius={P.radius}
              form={tapForms.pipe}
              swatch={C.colors.tap}
              light={LIGHT}
            />
          </group>
          {/* The spout, lying along z out over the basin. */}
          <group position={[0, P.height - P.radius, P.reach / 2]}>
            <Primitive
              shape="cylinder"
              radius={P.radius}
              form={tapForms.spout}
              rotation={{ x: 90 }}
              swatch={C.colors.tap}
              light={LIGHT}
            />
          </group>
        </group>
      )}
    </group>
  );
}
