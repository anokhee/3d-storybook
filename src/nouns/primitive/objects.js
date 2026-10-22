// Plain solids the garland hangs and the posts wear. `radius` is the one size
// knob for every one — a sphere's radius, a cube's half-extent, a
// cylinder's foot, a torus's ring — and `sides` the facet count round it,
// which a cube has no use for. `detail` scales every facet count at once —
// 1 is the table's, 0.5 half as many, never fewer than 3 — for a lower-poly
// look without setting each shape's sides by hand. The rest are proportions
// off the radius: what makes a cylinder read as the same SIZE as a sphere
// of the same radius. There is no cone: a cylinder with
// `form: { top: { inflate: 0 } }` is one, its crown pinched to a point.
export const PRIMITIVES = {
  sphere: { sides: 10 },
  cube: { sides: null },
  cylinder: { sides: 12, height: 2 }, // as a multiple of the radius
  torus: { sides: 16, tube: 0.35 }, // tube radius as a multiple of the ring's
};

// How a primitive is turned about its own middle, the way a tulip is in
// FLOWER_TYPES: degrees round each axis, applied x then y then z. All 0 is
// the solid as built — a cylinder standing on end, a torus lying flat — and
// `{ z: 20 }` alone leans it, the rest falling through to 0.
export const ROTATION = { x: 0, y: 0, z: 0 };

// How a primitive is pushed about, the way a doll's head is: one horizontal
// cut through it, and each side of the cut shaped on its own. Every field
// has a do-nothing value, so a primitive that says nothing is the stock
// solid, and one that says `{ top: { extrude: 0.5 } }` is only pulled up.
//
//   center   where the cut lies along the height — 0 is the foot, 1 the
//            crown, 0.5 the equator. Whatever is above it is `top`, below
//            it `bottom`, wherever it lies
//   feather  how softly the two sides blend into each other across the cut,
//            as a share of the height: 0 is a hard step, 1 a blend that
//            runs the whole height
//   top      `extrude` pulls the top up, as a multiple of the radius (a
//            negative squashes it down); `inflate` scales it out from the
//            axis, 1 keeping it as it is, 0.5 pinching it to half
//   bottom   the same, only `extrude` pulls DOWN
//   widen    scales the WHOLE solid's width — across x, on top of any
//            `inflate` — 1 leaving it as it is, 1.5 pulling it half again
//            as wide without making it any taller or deeper
//   deepen   the same along z — 1 as it is, 0.2 squashing it to a plate
//   tall     the same along y, before any extrude — 1 as it is, 0.1
//            pressing a cylinder to a coin
export const FORM = {
  center: 0.5,
  feather: 0.3,
  top: { extrude: 0, inflate: 1 },
  bottom: { extrude: 0, inflate: 1 },
  widen: 1,
  deepen: 1,
  tall: 1,
};

// Clay: a primitive thrown from the same stock as the dolls. `texture` is
// one of the dolls' texture presets (src/presets/materials/textures.js) and
// `amount` its one dial, the same one a doll draws its lumpiness from;
// `seed` picks which lumps. The solid is built with `segments` facets per
// edge (times `detail`) so it has vertices to lump, welded so it shades as
// one skin — so its edges go soft the way a pinched corner does. Pass
// `clay: {}` for the defaults, or any of these to override them.
export const CLAY = {
  texture: "bumpiness",
  amount: 0.5,
  seed: 0,
  segments: 10,
};
