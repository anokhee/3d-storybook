import { PALETTE } from "../../world/palette.js";

// Water: a pool lying in the ground, a rounded rectangle of it — or
// several run together, where two bodies of water in a lot touch (see
// pools.js) — the grass kept back from its bank. A body of water is an
// object in a lot like a bench is (see ../station/objects.js), stood
// where its `position` says and turned as its `rotation` says, `width`
// by `length` with corners `cornerRadius` round — all its own, not the
// lot's. The sheet is knitted onto the ground —
// the ball's curve, and the planet's thumbed hollows with it — so a wide
// pool lies on the ground the whole way across rather than floating off
// it at the edges, and it is see-through, so the ground shows as its bed.
// The doll drops in and swims, or wades in a shallow one.
// Colors come from PALETTE (src/world/palette.js).
//
//   kind          what body of water it is: "pond", water lying in the
//                 ground as it is — or "pool", a swimming pool: a tiled
//                 tub dug into the ground to its `depth`, a tiled border
//                 round its rim and a ladder down into it (see `pool`
//                 below, and Basin.jsx). A pool's water is its own color
//                 whatever the grass, and lies level, not draped over the
//                 ground's hollows — or "spring", a hot spring: milky
//                 water lying in the ground like a pond's, steam drifting
//                 off it, and rocks round its bank (see `spring` below,
//                 and Rocks.jsx) — or "tub", an above-ground pool: a
//                 tiled tub standing ON the ground, the water up in it,
//                 a ladder up its side (see `tub` below, and Tub.jsx).
//                 Or "kiddie", a kiddie pool: a low inflatable ring pool
//                 standing on the ground, shallow enough to wade (see
//                 `kiddie` below, and Kiddie.jsx). The kind's own stock
//                 (see KINDS) goes under the object's overrides
//   width         across (x) and `length` along (z), in world units
//   cornerRadius  how round the corners are, in world units — 0 is a
//                 box, half the short side a stadium (never more)
//   depth         how deep it is. Deeper than the doll is tall, near
//                 enough, and it swims (see POOL in player/tuning.js);
//                 shallower and it wades, stood on the bed that far down
//   turn          how it lies on the ground, degrees about its own up
//   blend         how far apart two pools may be and still run together
//                 into one, near enough: the width of the smooth minimum
//                 that joins their edges (see pools.js) — 0 for a hard
//                 join
//   lift          how far the sheet floats above the ground's level, so
//                 the flat ground between the hollows does not fight it
//   alpha         how solid the sheet is, 1 opaque — low, so the bed and
//                 whatever wades show through, the mirror doing the rest
//   gloss         what makes it read as water: what it mirrors. The sheet
//                 reflects a sky of its own — the night, with the moon
//                 hung in it where the real one is — `reflect` how
//                 brightly, `roughness` how sharply (0 a mirror). `moon`
//                 is how big the moon looms in that sky, as a share of the
//                 way to it, and `haze` the glow round it, `hazeAlpha`
//                 how thick, so the sheet catches a broad soft shine
//                 rather than one pinprick
//   foam          the foam lying on the sheet: a LIST of layers, one over
//                 the other, each leaving out what it does not change from
//                 FOAM below — or an empty list for none. Replaced whole by
//                 an override, the way any list is
//   bank          how far past its edge the grass is kept back
//   stitch        how fine the sheet is knitted, world units per stitch —
//                 finer follows the ball's curve and the corners closer
//   color         the sheet's own
//   pool          for a pool (`kind` "pool"), the tub — see POOL
//   spring        for a spring (`kind` "spring"), its rocks and the steam
//                 off it — see SPRING
//   tub           for an above-ground pool (`kind` "tub") — see TUB
//   kiddie        for a kiddie pool (`kind` "kiddie") — see KIDDIE
//   bath          for a bath (`kind` "bath"): a tub up on clawed feet,
//                 with a tap and a duck — see BATH
// One layer of foam: patches of it cut with a hard edge, the way clay is,
// gathered along the bank and thinning out over the open water, wandering
// slowly.
//
//   rim     how far in from the bank it gathers, in world units
//   cover   how much of the open water it laces, 0 none, 1 all of it
//   scale   a patch's size, in world units
//   drift   how fast the lace wanders, in world units per second —
//           negative wanders the other way
//   lift    how far it floats above the water's sheet
//   alpha   how solid, 1 opaque
//   soft    how soft a patch's edge is, 0 cut hard like clay — wider is
//           mist rather than foam, feathered over that much of the lace
//   edge    how solid the line of foam right along the bank is, 0 none
//   color   its own
export const FOAM = {
  rim: 1.4,
  cover: 0.18,
  scale: 1.2,
  drift: 0.12,
  lift: 0.02,
  alpha: 0.9,
  soft: 0,
  edge: 1,
  color: PALETTE.water.foam,
};

// The tub a pool is: the tiles that line it, the border round it and the
// ladder into it. Depth is the water's `depth`; size and corners the
// station's box.
//
//   tile      a tile's size, in world units, on the bed and the walls
//   grout     how wide the line between tiles is
//   border    how wide the tiled border (the coping) round the rim is,
//             out from the water's edge
//   lip       how far the border's top stands above the ground
//   skirt     how far the border's outer wall drops below the ground, so
//             it meets the ground where a hollow dips under it, and how far
//             the tub's walls run on under the bed, so the two never part
//   waterline how far below the border's top the water stands
//   ladder    the ladder down into it, at the middle of the pool's right
//             side — null for none: `apart` its rails' spacing, `radius`
//             their thickness, `drop` how far the rails reach under the
//             water, `rise` how high the bend stands over the border, `in`
//             how far inside the water's edge the rails hang, `out` how far
//             outside it the feet stand, `rungs` how many, `color` its own
//   colors    the tiles and grout on the bed and walls, the tiles and grout
//             of the border, the water's own
export const POOL = {
  tile: 0.8,
  grout: 0.07,
  border: 1.2,
  lip: 0.15,
  skirt: 0.5,
  waterline: 0.35,
  ladder: {
    apart: 0.7,
    radius: 0.07,
    drop: 2,
    rise: 0.9,
    in: 0.35,
    out: 0.6,
    rungs: 3,
    color: PALETTE.water.pool.ladder,
  },
  colors: {
    tile: PALETTE.water.pool.tile,
    grout: PALETTE.water.pool.grout,
    border: PALETTE.water.pool.border,
    borderGrout: PALETTE.water.pool.borderGrout,
  },
};

// The rocks round a hot spring — see Rocks.jsx: clay boulders stood along
// the water's edge, half in the ground, no two the same.
//
//   spacing   how far apart along the bank they are stood, in world units
//   jitter    how far off that each may wander, along the bank and out
//             from it, as a share of the spacing
//   out       how far past the water's edge each stands, in world units,
//             before its own size — so a big one laps the water
//   radius    how big, the range a stone is rolled from
//   widen     how much wider than tall, and `deepen` how much longer, the
//             ranges rolled from — 1 is round
//   squash    how tall it stands as a share of its radius, the range
//   sink      how far into the ground it sits, as a share of its height
//   variants  how many differently-lumped stones the bank draws on
//   detail    facets, as a multiple of a sphere's (see PRIMITIVES)
//   clay      thumbed like a doll — see CLAY; null for smooth
//   seed      which stones, and where
//   colors    the blocks the stones are rolled from, dealt in turn
//
// And the steam off it — see Steam.jsx: soft puffs rising off the water
// all over it, each on its own loop, growing and thinning as it climbs.
//
//   density   how many puffs are in the air per square world unit of water
//   rise      how high a puff climbs before it is gone, in world units
//   life      how long that takes, in seconds — a range, rolled per puff
//   size      how big a puff is, across, in world units — a range, rolled
//             per puff, and reached at the end of its climb; it starts at
//             `born` of that
//   born      how big it starts, as a share of its size
//   sway      how far it wanders sideways as it climbs, in world units
//   lift      how far above the water a puff is born
//   alpha     how thick, at its thickest, 1 opaque
//   color     its own
export const SPRING = {
  steam: {
    density: 0.5,
    rise: 3.2,
    life: [3, 5],
    size: [1.2, 2.2],
    born: 0.35,
    sway: 0.5,
    lift: 0.1,
    alpha: 0.4,
    color: PALETTE.water.spring.steam,
  },
  rocks: {
    spacing: 1.1,
    jitter: 0.35,
    out: 0.25,
    radius: [0.45, 0.9],
    widen: [0.9, 1.5],
    deepen: [0.8, 1.3],
    squash: [0.55, 0.9],
    sink: 0.3,
    variants: 6,
    detail: 1.2,
    clay: { texture: "bumpiness", amount: 0.45, seed: 3 },
    seed: 11,
    colors: PALETTE.water.spring.rocks,
  },
};

// A patch of plain ground: nothing in itself, but laid in a pool it is
// an island, the water cut away round it (see pools.js). An object in a
// lot like water is, `width` by `length` with corners `cornerRadius`
// round.
export const GROUND = {
  width: 6,
  length: 6,
  cornerRadius: 3,
};

// The objects that lie IN the ground rather than stand on it: a water
// feature (a body of water of any kind) and ground — and a rug, which
// lies flat on it for things to stand on (see ../rug/objects.js), and a
// wall hanging, which hangs over them (see ../wallHanging/). Nothing
// to fence in or keep the grass off in themselves — the pools do that
// their own way — and nothing another object may not stand beside; only
// water is anything to keep out of (see level/water.js).
export const IN_GROUND = ["waterFeature", "ground", "rug", "wallHanging"];

// An above-ground pool: a wall standing up off the ground round the
// water's edge, the water up in it, a rim round the top, and a ladder up
// the outside and over. Tiled inside like a pool (see POOL for `tile`,
// `grout` and the tile colors, which it shares); its `depth` is not
// read — the water is as deep as the wall is tall, less the waterline.
//
//   height     how tall the wall stands off the ground
//   thickness  how thick the wall is
//   bed        how far off the ground the bed lies inside, so the ground's
//              hollows never show through it
//   skirt      how far the wall runs on under the ground, to meet a hollow
//   waterline  how far below the top of the wall the water stands
//   rim        the lip round the top: `in` how far it overhangs the water,
//              `out` how far it stands past the wall's outer face,
//              `thickness` how thick
//   band       a band of darker panel round the outside, `height` tall
//              from `lift` off the ground — 0 for none
//   ladder     as POOL's, up the outside from the ground and over the rim
//   colors     the outer wall's panels and band, and the rim
export const TUB = {
  height: 1.7,
  thickness: 0.12,
  bed: 0.06,
  skirt: 0.4,
  waterline: 0.3,
  rim: { in: 0.18, out: 0.14, thickness: 0.1 },
  band: { height: 0.35, lift: 0.5 },
  ladder: {
    apart: 0.7,
    radius: 0.07,
    drop: 1.2,
    rise: 0.7,
    in: 0.4,
    out: 0.7,
    rungs: 4,
    color: PALETTE.water.pool.ladder,
  },
  colors: {
    panel: PALETTE.water.tub.panel,
    band: PALETTE.water.tub.band,
    rim: PALETTE.water.tub.rim,
  },
};

// A kiddie pool: inflatable rings stacked round the water's edge on a
// vinyl floor, the water up to just under the top ring. Its `depth` is
// not read — it is as deep as the rings stand, less the waterline.
//
//   rings      the inflated rings: `count` stacked, each `radius` thick,
//              pressed to `squash` of that tall, so they sit plump rather
//              than round; `colors` dealt to them bottom to top
//   bed        how far off the ground the floor lies, over the hollows
//   skirt      how far under the ground the base runs: the vinyl carried
//              out under the rings and down from the bottom one's outer
//              edge, so nothing shows under its curve
//   waterline  how far below the top ring's crown the water stands
//   colors     the floor's own — the rings' are under `rings`
export const KIDDIE = {
  rings: {
    count: 3,
    radius: 0.4,
    squash: 0.8,
    colors: PALETTE.water.kiddie.rings,
  },
  bed: 0.05,
  skirt: 0.3,
  waterline: 0.12,
  colors: { floor: PALETTE.water.kiddie.floor },
};

// A bath: an above-ground pool's tub (see TUB, as KINDS.bath resets it —
// low, plain porcelain, no band or ladder) stood up on four clawed feet,
// a tap on the rim at its +x end, and a rubber duck afloat in it. The
// tub is lifted onto the feet — see bathStandOf, and pools.js's lift.
//
//   feet   one at each corner, `in` from the tub's edge: a ball `ball`
//          big on the floor with a stem `radius` thick and `height` tall
//          up from it, `sink` into the tub's underside; `clay` as any
//          primitive's (see CLAY); `color`
//   tap    a post `radius` thick standing `height` off the rim, `in` from
//          the +x end, and a spout `reach` long turned in over the
//          water; `color`
//   duck   its body a ball `radius` big, its head a smaller one on top,
//          afloat at `at` { x, z } from the tub's middle; `color` and
//          `beak` its own. Null for none
export const BATH = {
  feet: {
    ball: 0.28,
    radius: 0.14,
    height: 0.4,
    sink: 0.1,
    in: 0.55,
    clay: { amount: 0.4, seed: 31 },
    color: PALETTE.water.bath.feet,
  },
  tap: {
    radius: 0.09,
    height: 0.6,
    in: 0.4,
    reach: 0.6,
    color: PALETTE.water.bath.tap,
  },
  duck: {
    radius: 0.26,
    at: { x: -0.8, z: 0.25 },
    color: PALETTE.water.bath.duck,
    beak: PALETTE.water.bath.beak,
  },
};

// How far a bath's tub stands off the floor, on its feet: the ball and
// the stem, less what is sunk into the tub. Nothing, for any other kind.
export const bathStandOf = (W) => {
  if (W.kind !== "bath") return 0;
  const F = W.bath.feet;
  return 2 * F.ball + F.height - F.sink;
};

// The kinds up in a tub — an above-ground pool, and a bath — for what
// reads the tub's shape (see TUB).
export const TUBBED = ["tub", "bath"];

export const WATER = {
  kind: "pond",
  width: 12,
  length: 9,
  cornerRadius: 3,
  depth: 3,
  turn: 0,
  blend: 2,
  lift: 0.04,
  alpha: 0.32,
  gloss: {
    reflect: 1.4,
    roughness: 0.08,
    moon: 0.16,
    haze: 0.5,
    hazeAlpha: 0.35,
  },
  foam: [
    // The rind along the bank, and a thin lace out in the open.
    {},
    // A finer, fainter lace over that, drifting the other way, so the
    // two slide against each other and the surface seems to move.
    { rim: 0.6, cover: 0.3, scale: 0.55, drift: -0.08, lift: 0.03, alpha: 0.6 },
  ],
  bank: 0.6,
  stitch: 0.4,
  color: PALETTE.water.surface,
  pool: POOL,
  spring: SPRING,
  tub: TUB,
  kiddie: KIDDIE,
  bath: BATH,
};

// What each kind of water changes on WATER, under a station's own
// overrides (see pools.js's lobeConfigOf). A pond is WATER as it is. A
// pool's water is clearer and its own blue, with only a thin line of foam
// where it laps the tiles. A spring's is milky and near opaque, with a
// scum of minerals at its edge and steam drifting off it — two sheets of
// mist, soft-edged, one over the other, wandering opposite ways. A tub's
// is a pool's; a bath's too, its tub low, plain porcelain, with no band
// or ladder and next to no skirt, up on its feet.
export const WATER_KINDS = ["pond", "pool", "spring", "tub", "kiddie", "bath"];
export const KINDS = {
  pond: {},
  pool: {
    alpha: 0.4,
    foam: [{ rim: 0.3, cover: 0, scale: 0.6, drift: 0.05, alpha: 0.55 }],
    color: PALETTE.water.pool.water,
  },
  tub: {
    alpha: 0.4,
    foam: [{ rim: 0.3, cover: 0, scale: 0.6, drift: 0.05, alpha: 0.55 }],
    color: PALETTE.water.pool.water,
  },
  bath: {
    alpha: 0.4,
    foam: [{ rim: 0.3, cover: 0, scale: 0.6, drift: 0.05, alpha: 0.55 }],
    color: PALETTE.water.pool.water,
    tub: {
      height: 1.5,
      skirt: 0.05,
      waterline: 0.28,
      band: { height: 0 },
      ladder: false,
      colors: {
        panel: PALETTE.water.bath.porcelain,
        rim: PALETTE.water.bath.porcelain,
      },
    },
  },
  // A kiddie pool's: clear, and too small for foam.
  kiddie: {
    alpha: 0.35,
    foam: [],
    color: PALETTE.water.pool.water,
  },
  spring: {
    alpha: 0.78,
    gloss: { reflect: 0.6, roughness: 0.35 },
    foam: [
      // The scum along the rocks.
      {
        rim: 0.9,
        cover: 0.06,
        scale: 0.9,
        drift: 0.04,
        alpha: 0.7,
        color: PALETTE.water.spring.scum,
      },
      // The steam: soft, broad and faint, drifting.
      {
        rim: 0,
        cover: 0.55,
        scale: 2.4,
        drift: 0.22,
        lift: 0.3,
        alpha: 0.32,
        soft: 0.22,
        edge: 0,
        color: PALETTE.water.spring.mist,
      },
      {
        rim: 0,
        cover: 0.4,
        scale: 3.2,
        drift: -0.15,
        lift: 0.65,
        alpha: 0.2,
        soft: 0.3,
        edge: 0,
        color: PALETTE.water.spring.mist,
      },
    ],
    color: PALETTE.water.spring.water,
  },
};

// The knobs the catalog shows for a water feature (stories/helpers/knobs.js)
export const WATER_KNOBS = {
  width: { path: "width", range: [2, 20, 0.5] },
  length: { path: "length", range: [2, 20, 0.5] },
  cornerRadius: { path: "cornerRadius", range: [0, 6, 0.5], name: "corner" },
  depth: { path: "depth", range: [0, 6, 0.5] },
};
