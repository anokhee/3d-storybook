import { useMemo } from "react";

import { merge } from "../world/merge.js";
import { LIGHT } from "../adjectives/lit/objects.js";
import Primitive from "../nouns/primitive/Primitive.jsx";

// An opening indoors — a door, or a window — as the house's architecture
// has it (see DWELLING.interior in nouns/house/objects.js, and the edit
// mode indoors, DwellingPanel.jsx): a slab `width` across and `height`
// tall, its top and bottom edges each bowed out on a curve — `topCurve`
// and `bottomCurve`, 1 a half-round as wide as the slab, 0 flat; both 1
// on a slab as tall as it is wide is a coin — built the way the mushroom
// house's Arch is (see mushroom/MushroomHouse.jsx): a box for the
// straight part with a half-coin pressed flatter or rounder on each
// curved end. Its foot is at y = 0, its back against z = 0, bulging out
// along +z: the `frame`, when there is one, a wider and taller slab of
// the same shape behind it — `thickness` more each way, `depth` thick,
// `color` its own — then the slab itself `depth` thick, and on its face
// the `knob` of a door (`radius`, `side` which way from the middle, as
// a share of the half width, `color`) or the dividers of a window —
// `style` "plain" for none, or "pane" for `panes` panes: two columns,
// bars between them and between the rows, but for an odd count, whose
// top row is one long pane on its own. `depth`, `detail`, `clay`,
// `color` and `light` as a primitive's. The rest of a house's door or
// window config rides along unread. `shadows` "dividers" keeps the
// slab, its frame and its knob out of the shadows (see Primitive), so
// only the dividers cast one — a window with the day behind it (see
// Interior.jsx's Daylight).
export default function Opening({ O, shadows = "all" }) {
  const shadow = shadows !== "dividers";
  const light = useMemo(() => merge(LIGHT, O.light), [O.light]);
  const F = O.frame;
  const K = O.knob;
  const r = O.width / 2;
  // The two curves, each as much of the height as the width allows —
  // scaled back together where they would meet past it.
  const [top, bottom] = useMemo(() => {
    const t = clamp01(O.topCurve);
    const b = clamp01(O.bottomCurve);
    const fit = Math.min(1, O.height / Math.max(1e-6, r * (t + b)));
    return [t * fit, b * fit];
  }, [O.topCurve, O.bottomCurve, O.height, r]);
  const straight = O.height - r * (top + bottom);
  const face = F?.depth ?? 0;
  const common = { detail: O.detail, clay: O.clay };
  return (
    <group>
      {F && (
        // The frame springs from the same heights as the slab, so it is
        // `thickness` bigger all round: its curves start `thickness`
        // times theirs lower and end that much higher.
        <group position-y={-F.thickness * bottom}>
          <Slab
            r={r + F.thickness}
            straight={straight}
            top={top}
            bottom={bottom}
            depth={F.depth}
            swatch={F.color}
            shadow={shadow}
            {...common}
          />
        </group>
      )}
      <group position-z={face}>
        <Slab
          r={r}
          straight={straight}
          top={top}
          bottom={bottom}
          depth={O.depth}
          swatch={O.color}
          light={light}
          shadow={shadow}
          {...common}
        />
      </group>
      {K && (
        <group
          position={[K.side * r, O.height / 2, face + O.depth + K.radius * 0.6]}
        >
          <Primitive
            shape="sphere"
            radius={K.radius}
            swatch={K.color}
            shadow={shadow}
          />
        </group>
      )}
      {O.style === "pane" && (O.panes ?? 0) > 1 && (
        <group position-z={face + O.depth}>
          <Dividers
            r={r}
            height={O.height}
            straight={straight}
            top={top}
            bottom={bottom}
            panes={O.panes}
            thickness={(F?.thickness ?? 0.15) * 0.6}
            swatch={F?.color ?? O.color}
            {...common}
          />
        </group>
      )}
    </group>
  );
}

const clamp01 = (v) => Math.max(0, Math.min(1, v ?? 0));

// The slab: a cube `r` wide pressed to `straight` tall and `depth` deep
// with its foot at y = r * bottom, and a half-coin on each curved end —
// the top's rise r * top, the bottom's r * bottom — pressed `depth`
// thick and each as flat as its curve says. Built centred on z, so it
// stands from z = 0 to `depth`.
function Slab({
  r,
  straight,
  top,
  bottom,
  depth,
  detail,
  clay,
  swatch,
  light,
  shadow = true,
}) {
  const forms = useMemo(
    () => ({
      box: { tall: straight / (2 * r), deepen: depth / (2 * r) },
      top: { tall: depth / (2 * r), deepen: top },
      bottom: { tall: depth / (2 * r), deepen: bottom },
    }),
    [r, straight, depth, top, bottom],
  );
  const part = (shape, y, form, half) => (
    <group position-y={y}>
      <Primitive
        shape={shape}
        radius={r}
        detail={detail}
        form={form}
        half={half}
        clay={clay}
        rotation={half ? { x: 90 } : undefined}
        swatch={swatch}
        light={light}
        shadow={shadow}
      />
    </group>
  );
  const foot = r * bottom;
  return (
    <group position-z={depth / 2}>
      {straight > 1e-3 && part("cube", foot + straight / 2, forms.box)}
      {/* A cylinder's "back" half is its -z half, which turned x 90 is
        its top; its "front" half its bottom. */}
      {top > 1e-3 && part("cylinder", foot + straight, forms.top, "back")}
      {bottom > 1e-3 && part("cylinder", foot, forms.bottom, "front")}
    </group>
  );
}

// A window's dividers: `panes` panes in two columns, a bar up the middle
// between them and a bar across between each row — but for an odd count,
// whose top row is one long pane across, with no bar up it. Each bar is
// `thickness` wide and as deep, stood on the face at z = 0; the ones
// across are cut to the slab's width where they cross a curved end.
function Dividers({
  r,
  height,
  straight,
  top,
  bottom,
  panes,
  thickness,
  detail,
  clay,
  swatch,
}) {
  const t = thickness;
  const rows = Math.ceil(panes / 2);
  const rowHeight = height / rows;
  const odd = panes % 2 === 1;
  const foot = r * bottom;
  // How far across the slab reaches at `y`: its full half width along the
  // straight part, and an ellipse's worth into either curve.
  const reach = (y) => {
    const rise = (d, curve) =>
      r * Math.sqrt(Math.max(0, 1 - (d / Math.max(1e-6, r * curve)) ** 2));
    if (y < foot) return rise(foot - y, bottom);
    if (y > foot + straight) return rise(y - foot - straight, top);
    return r;
  };
  const bars = [];
  const up = odd ? height - rowHeight : height;
  bars.push({ x: 0, y: up / 2, w: t, h: up });
  for (let k = 1; k < rows; k++) {
    const y = k * rowHeight;
    bars.push({ x: 0, y, w: 2 * reach(y), h: t });
  }
  return (
    <group position-z={t / 2}>
      {bars.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          <Primitive
            shape="cube"
            radius={b.w / 2}
            detail={detail}
            form={{ tall: b.h / b.w, deepen: t / b.w }}
            clay={clay}
            swatch={swatch}
          />
        </group>
      ))}
    </group>
  );
}
