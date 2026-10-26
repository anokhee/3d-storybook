import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";

// The openings cut into a house's front, which Seated stands flush on a
// curved wall and Window on a flat one: a round pane, an arched slab (the
// doors too), and WindowPane, which picks between them and a square one by
// the config's `type`.

// A round pane (exported, for WindowPane): a cylinder lying along z — a coin, `depth` thick — with
// its frame, a wider coin, behind it against the wall. Built lying in x/y
// and bulging out along +z, so Seated can stand it flush on the stem.
export function Coin({ config: R }) {
  const light = useMemo(() => merge(LIGHT, R.light), [R.light]);
  const F = R.frame;
  const form = useMemo(
    () => ({ tall: R.depth / (2 * R.radius) }),
    [R.depth, R.radius],
  );
  const frameForm = useMemo(
    () => (F ? { tall: F.depth / (2 * (R.radius + F.thickness)) } : null),
    [F, R.radius],
  );
  const K = R.knob;
  return (
    <group>
      {F && (
        <group position-z={F.depth / 2}>
          <Primitive
            shape="cylinder"
            radius={R.radius + F.thickness}
            detail={R.detail}
            form={frameForm}
            clay={R.clay}
            rotation={{ x: 90 }}
            swatch={F.color}
          />
        </group>
      )}
      <group position-z={(F?.depth ?? 0) + R.depth / 2}>
        <Primitive
          shape="cylinder"
          radius={R.radius}
          detail={R.detail}
          form={form}
          clay={R.clay}
          rotation={{ x: 90 }}
          swatch={R.color}
          light={light}
        />
      </group>
      {K && (
        <group
          position={[
            K.side * R.radius,
            0,
            (F?.depth ?? 0) + R.depth + K.radius * 0.6,
          ]}
        >
          <Primitive shape="sphere" radius={K.radius} swatch={K.color} />
        </group>
      )}
    </group>
  );
}

// How an arch's two solids are pressed to shape: a cube `radius` wide
// stretched to `straight` tall and `depth` deep, and a coin of `radius`
// `depth` thick.
const archFormsOf = (radius, depth, straight) => ({
  box: { tall: straight / (2 * radius), deepen: depth / (2 * radius) },
  arch: { tall: depth / (2 * radius) },
});

// An arched slab (the doors too, so it is exported): a box `width`
// across standing under a half-coin of the same width, `height` tall from
// its foot to the crown of the arch, with its frame, a wider arch, behind
// it against the wall, and a knob on it. Its `type` "square" leaves the
// arch off — a plain slab, `height` of box, its frame a bar wider all round. Built like the Coin
// — lying in x/y, bulging out along +z, its middle at mid-height — so
// Seated can stand it flush on the stem.
export function Arch({ config: R }) {
  const light = useMemo(() => merge(LIGHT, R.light), [R.light]);
  const F = R.frame;
  const K = R.knob;
  const r = R.width / 2;
  // The straight part stands from the foot up to where the arch springs.
  // The frame's springs from the same height: it is `thickness` wider each
  // side and taller by that over the top, so its arch is that much bigger.
  const square = R.type === "square";
  const straight = square ? R.height : R.height - r;
  const at = -R.height / 2 + straight / 2;
  const frameStraight = square && F ? straight + 2 * F.thickness : straight;
  const forms = useMemo(
    () => archFormsOf(r, R.depth, straight),
    [r, R.depth, straight],
  );
  const frameForms = useMemo(
    () => (F ? archFormsOf(r + F.thickness, F.depth, frameStraight) : null),
    [F, r, frameStraight],
  );
  const part = (radius, depth, forms, swatch, light) => (
    <group>
      <group position-y={at}>
        <Primitive
          shape="cube"
          radius={radius}
          detail={R.detail}
          form={forms.box}
          clay={R.clay}
          swatch={swatch}
          light={light}
        />
      </group>
      {!square && (
        <group position-y={-R.height / 2 + straight}>
          <Primitive
            shape="cylinder"
            radius={radius}
            detail={R.detail}
            form={forms.arch}
            half="back"
            clay={R.clay}
            rotation={{ x: 90 }}
            swatch={swatch}
            light={light}
          />
        </group>
      )}
    </group>
  );
  return (
    <group>
      {F && (
        <group position-z={F.depth / 2}>
          {part(r + F.thickness, F.depth, frameForms, F.color)}
        </group>
      )}
      <group position-z={(F?.depth ?? 0) + R.depth / 2}>
        {part(r, R.depth, forms, R.color, light)}
      </group>
      {R.columns > 1 || R.rows > 1 ? (
        <Muntins
          R={{ ...R, type: square ? "square" : "arched" }}
          z={(F?.depth ?? 0) + R.depth}
        />
      ) : null}
      {K && (
        <group
          position={[K.side * r, 0, (F?.depth ?? 0) + R.depth + K.radius * 0.6]}
        >
          <Primitive shape="sphere" radius={K.radius} swatch={K.color} />
        </group>
      )}
    </group>
  );
}

// A window's muntins — the bars that divide its glass into panes: `columns`
// across and `rows` down (1 and 1 for none), each bar `bar` thick, in the
// frame's color, standing proud of the glass, whose front is `z` off the
// wall. The glass is `width` by `height` about its middle, of `type`
// "square", "arched" (a half-round on top, as Arch) or "round" (an oval);
// each bar runs to the glass's edge where it meets it.
function muntinsOf(R) {
  const cols = Math.max(1, Math.round(R.columns ?? 1));
  const rows = Math.max(1, Math.round(R.rows ?? 1));
  const t = R.bar ?? 0.06;
  const w = R.width,
    h = R.height,
    r = w / 2;
  const spring = h / 2 - r;
  const root = (v) => Math.sqrt(Math.max(0, v));
  const top = (x) =>
    R.type === "round"
      ? (h / 2) * root(1 - ((2 * x) / w) ** 2)
      : R.type === "arched"
        ? spring + root(r * r - x * x)
        : h / 2;
  const bottom = (x) => (R.type === "round" ? -top(x) : -h / 2);
  const half = (y) =>
    R.type === "round"
      ? r * root(1 - ((2 * y) / h) ** 2)
      : R.type === "arched" && y > spring
        ? root(r * r - (y - spring) ** 2)
        : r;
  const bars = [];
  for (let i = 1; i < cols; i++) {
    const x = -r + (w * i) / cols;
    bars.push({ x, y: (top(x) + bottom(x)) / 2, w: t, h: top(x) - bottom(x) });
  }
  for (let j = 1; j < rows; j++) {
    const y = -h / 2 + (h * j) / rows;
    bars.push({ x: 0, y, w: 2 * half(y), h: t });
  }
  return bars;
}

export function Muntins({ R, z }) {
  const bars = useMemo(
    () => muntinsOf(R),
    [R.columns, R.rows, R.bar, R.width, R.height, R.type],
  );
  const depth = 0.05;
  const mat = useMemo(() => unlitMat(R.frame?.color), [R.frame?.color]);
  return (
    <group position-z={z + depth / 2}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]} material={mat}>
          <boxGeometry args={[b.w, b.h, depth]} />
        </mesh>
      ))}
    </group>
  );
}

// A window, of `type` "square", "arched" or "round" (square if none): a
// slab `width` by `height`, the round one an oval that size. Built like the
// Coin and Arch — lying in x/y, bulging out along +z, its middle at
// mid-height.
export function WindowPane({ config: R }) {
  const round = useMemo(() => ({ ...R, radius: R.height / 2 }), [R]);
  if (R.type === "round")
    return (
      <group scale-x={R.width / R.height}>
        <Coin config={round} />
        <Muntins
          R={{ ...R, width: R.height, type: "round" }}
          z={(R.frame?.depth ?? 0) + R.depth}
        />
      </group>
    );
  return <Arch config={{ ...R, type: R.type ?? "square" }} />;
}
