import { PALETTE } from "../../world/palette.js";

// The enclosure round a station: what fences it, how the fence goes round
// the box, and what is strung along it.
//
//   type        what the fence is made of, one of FENCE_TYPES: "posts",
//               bare posts with only what is strung between them;
//               "picket", a white picket fence, pointed boards on two
//               rails; "wooden", a post-and-rail fence in the bench's
//               lumpy clay woods; "chainlink", a wire diamond mesh on
//               thin gray posts under a top rail. Every kind stands its
//               posts the same way (spacing, count, arc, turn, corner,
//               gate) and can have the same strung along the tops; each
//               kind's own look is under its name below, and its posts'
//               look — laid under `posts` — under it too
//   spacing     how far apart the posts stand, at most, in world units:
//               a post at every corner and either side of every gate, and
//               the fence between cut into as few equal bays as keeps each
//               under this (see fencePosts in src/world/layout.js)
//   count       or, set, how many posts, spaced evenly whatever the shape
//               — for a round pen, where there are no corners to keep to
//   arc         how much of the way round they cover, in degrees — 360 is
//               all the way, and the garland closes the ring
//   turn        where the first post stands, in degrees round from +x —
//               or, by spacing, which post counts as the first
//   corner      how round the box is: 0 is square corners, 1 a stadium
//   splay       how far each post leans with the ground under it: the
//               ground is a ball, so a post at the far end of a wide lot
//               stands on a slope and, upright to it, leans outward — 1
//               is that, every post plumb to its own bit of ground; 0
//               stands them all parallel, plumb to the lot's middle, so a
//               wide fence no longer looks splayed; between is between.
//               The panels follow the posts either way
//   strung      what hangs between the posts: "garland" — bare posts are a
//               fence; the garland is what makes it a party — or "sign",
//               a board hung from each neighboring pair, or false for
//               nothing (false, not null: a null override falls through)
//   gate        the openings left in the fence where a path comes in
//               (see Enclosure's `gates`): `clearance` how far each is
//               widened past the path's own width, either side, in world
//               units — room for a doll to walk in without brushing the
//               gateposts
//   posts       overrides on POSTS — the post's look and its cap — over
//               the kind's own (`height` is the fence's height whatever
//               the kind; null is the kind's own, or for bare posts as
//               tall as the tallest thing inside plus their headroom)
//   picket      the picket fence: `height`; its `board`s, each `width`
//               across, `gap` apart, `thickness` through and pointed over
//               the top `point` high; the `rails` behind them, at `at`
//               shares of the height, `height` tall and `thickness`
//               through; `sink` how far the boards are set into the
//               ground; `colors` for board and rail
//   wooden      the wooden fence: `height`; its `rails`, `count` of them
//               from `from` of the height up to the top, `radius` half
//               their square, thrown in `clay` like the bench's slats;
//               `color`
//   chainlink   the chain link: `height`; the mesh's `cell`, a diamond's
//               width, and `wire` gauge in world units; the `rail` along
//               the top, its radius; `sink` how far the mesh is set into
//               the ground; `color`
//   garland     overrides on GARLAND — the string between the posts;
//               its `stand` and `drop` say where on the fence it is tied
//   sign        overrides on SIGN — the boards between them
export const FENCE_TYPES = ["posts", "picket", "wooden", "chainlink"];
export const ENCLOSURE = {
  type: "posts",
  spacing: 4,
  count: null,
  arc: 360,
  turn: 225,
  corner: 1,
  splay: 1,
  strung: "garland",
  gate: { clearance: 0.9 },
  posts: {},
  garland: {},
  sign: {},
  picket: {
    height: 2.4,
    board: { width: 0.36, gap: 0.22, thickness: 0.1, point: 0.3 },
    rails: { at: [0.3, 0.72], height: 0.22, thickness: 0.1 },
    sink: 0.15,
    colors: { board: PALETTE.fence.picket, rail: PALETTE.fence.picketRail },
    posts: {
      post: {
        sides: 4,
        taper: 1,
        baseRadius: 0.18,
        color: PALETTE.fence.picket,
      },
      cap: { shape: "cube", radius: 0.2, light: { type: "unlit" } },
      capColor: PALETTE.fence.picket,
    },
  },
  wooden: {
    height: 2.6,
    rails: {
      count: 3,
      from: 0.28,
      radius: 0.15,
      clay: { amount: 0.4, seed: 21 },
    },
    color: PALETTE.fence.woodRail,
    posts: {
      post: {
        sides: 4,
        taper: 1,
        baseRadius: 0.24,
        color: PALETTE.fence.woodPost,
      },
      cap: { shape: "cube", radius: 0.3, light: { type: "unlit" } },
      capColor: PALETTE.fence.woodPost,
    },
  },
  chainlink: {
    height: 3.2,
    cell: 0.45,
    wire: 0.05,
    rail: 0.06,
    sink: 0.1,
    color: PALETTE.fence.chain,
    posts: {
      post: {
        sides: 8,
        taper: 1,
        baseRadius: 0.09,
        color: PALETTE.fence.chainPost,
      },
      cap: { shape: "sphere", radius: 0.12, light: { type: "unlit" } },
      capColor: PALETTE.fence.chainPost,
    },
  },
};

// The knobs the catalog shows for a fence (stories/helpers/knobs.js): its
// box, which the Enclosure takes beside its config
export const ENCLOSURE_KNOBS = {
  width: { path: "width", range: [4, 24, 1], value: 12 },
  length: { path: "length", range: [4, 24, 1], value: 12 },
};
