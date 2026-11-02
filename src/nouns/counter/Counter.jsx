import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { roundedRect } from "../water/Pad.jsx";
import { solid } from "../../world/palette.js";
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
// the grass to keep back from: the worktop's edges, or the handles on the
// front if they stand out further.
export function counterFootprintOf(C) {
  const out =
    C.under && C.under !== "plain" ?
      C.front.thickness + C.front.knob * 2.2
    : 0;
  return {
    x: C.body.width / 2 + C.top.overhang,
    z: C.body.depth / 2 + Math.max(C.top.overhang, out),
  };
}

// What stands on the cabinet's front, from `under`: a list of pieces,
// each `{ t: "door" | "oven" | "dishwasher", x, w }` — its middle along
// the counter and its width. An appliance takes a slot `F.slot` wide at
// `F.along` (as wide as the cabinet allows); the rest, each side of it,
// is cupboard doors no wider than `F.door`, where there's room for one.
export function counterFrontOf(C) {
  const F = C.front;
  const under = C.under ?? "plain";
  if (under === "plain") return [];
  const lo = -C.body.width / 2 + F.inset;
  const hi = C.body.width / 2 - F.inset;
  const pieces = [];
  const doors = (a, b) => {
    const len = b - a;
    if (len < 0.5) return;
    const n = Math.max(1, Math.ceil((len + F.gap) / (F.door + F.gap)));
    const w = (len - (n - 1) * F.gap) / n;
    for (let i = 0; i < n; i++)
      pieces.push({ t: "door", x: a + w / 2 + i * (w + F.gap), w, of: n, i });
  };
  if (under === "cupboard") {
    doors(lo, hi);
    return pieces;
  }
  const w = Math.min(F.slot, hi - lo);
  const x = THREE.MathUtils.clamp(F.along, lo + w / 2, hi - w / 2);
  doors(lo, x - w / 2 - F.gap);
  pieces.push({ t: under, x, w });
  doors(x + w / 2 + F.gap, hi);
  return pieces;
}

// The pieces on the front, standing off the cabinet's face at z = 0 (the
// group they're in sits on the face), each from the kick up to `top`.
function Front({ C, top }) {
  const F = C.front;
  const pieces = useMemo(() => counterFrontOf(C), [C]);
  const door = useMemo(
    () =>
      C.colors.door ??
      solid(
        "#" +
          new THREE.Color(C.colors.body.hex)
            .offsetHSL(0, 0, -0.07)
            .getHexString(),
      ),
    [C.colors.door, C.colors.body],
  );
  const bottom = F.kick;
  const h = top - bottom;
  const t = F.thickness;
  const r = F.knob;
  const box = (key, x, y, w, hh, d, z, swatch) => (
    <mesh key={key} position={[x, y, z + d / 2]} material={unlitMat(swatch)}>
      <boxGeometry args={[w, hh, d]} />
    </mesh>
  );
  // A bar lying along x, `out` off the face at height y.
  const bar = (key, x, y, w, z) => (
    <group key={key} position={[x, y, z + r]}>
      <Primitive
        shape="cylinder"
        radius={r * 0.8}
        form={{ tall: w / (2 * r * 0.8) }}
        rotation={{ z: 90 }}
        swatch={C.colors.handle}
        light={LIGHT}
      />
    </group>
  );
  // A knob pointing out of the face (+z).
  const knob = (key, x, y, z, rr = r) => (
    <group key={key} position={[x, y, z + rr * 0.6]}>
      <Primitive
        shape="cylinder"
        radius={rr}
        form={{ tall: 0.6 }}
        rotation={{ x: 90 }}
        swatch={C.colors.handle}
        light={LIGHT}
      />
    </group>
  );
  return (
    <group>
      {pieces.map((p, k) => {
        if (p.t === "door") {
          // the knob by the edge it opens from: the middle of a pair,
          // else the edge nearer the counter's middle
          const side =
            p.of === 2 ? (p.i === 0 ? 1 : -1)
            : p.x > 0.01 ? -1
            : 1;
          return (
            <group key={k}>
              {box("d", p.x, bottom + h / 2, p.w, h, t, 0, door)}
              {knob(
                "k",
                p.x + side * (p.w / 2 - r * 2.6),
                top - r * 3.2,
                t,
              )}
            </group>
          );
        }
        if (p.t === "oven") {
          // a strip of dials along the top, the door under it with a
          // window in it and a bar across its top
          const strip = Math.min(0.36, h * 0.18);
          const dh = h - strip - F.gap;
          const dy = bottom + dh / 2;
          return (
            <group key={k}>
              {box("s", p.x, top - strip / 2, p.w, strip, t, 0, C.colors.appliance)}
              {[-1, 0, 1].map((i) =>
                knob(`k${i}`, p.x + i * p.w * 0.28, top - strip / 2, t, Math.min(r * 1.2, strip * 0.32)),
              )}
              {box("d", p.x, dy, p.w, dh, t, 0, C.colors.appliance)}
              {box("g", p.x, dy - dh * 0.06, p.w * 0.7, dh * 0.5, t * 0.5, t, C.colors.glass)}
              {bar("h", p.x, bottom + dh - r * 3, p.w * 0.75, t)}
            </group>
          );
        }
        // a dishwasher: one panel, a darker strip along its top and a
        // bar under that
        const strip = Math.min(0.2, h * 0.1);
        return (
          <group key={k}>
            {box("d", p.x, bottom + h / 2, p.w, h, t, 0, C.colors.appliance)}
            {box("s", p.x, top - strip / 2 - F.gap, p.w * 0.94, strip, t * 0.4, t, C.colors.glass)}
            {bar("h", p.x, top - strip - F.gap - r * 3.4, p.w * 0.7, t)}
          </group>
        );
      })}
    </group>
  );
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
      {/* What's under the worktop, on the cabinet's face (see Front). */}
      {C.under && C.under !== "plain" && (
        <group position-z={B.depth / 2}>
          <Front C={C} top={B.height - T.thickness - C.front.inset} />
        </group>
      )}
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
