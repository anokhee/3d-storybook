import { PALETTE } from "../../world/palette.js";

// A station: a fenced patch of ground with things in it. What is in it is
// the station's business, not the fence's — a station may hold one
// trampoline, three, or none, and anything else that can stand on the
// ground beside them.
//
//   type         what the station is: "lot", a patch of ground with things
//                on it, fenced or not — the only kind there is now. Bodies
//                of water and patches of bare ground are objects IN a lot
//                (see below)
//   boundingBox  the patch, as { width, length } in world units: width runs
//                x (left to right, seen from the camera), length runs z
//                (back to front). The enclosure stands on its edge, as
//                round at the corners as `enclosure.corner` says
//   objects      what stands inside, each `{ type, position, config }`:
//                  type      any noun the station knows — "empty",
//                            "trampoline", "gachapon", "vendingMachine",
//                            "bench", "capsule", "house", "twoStoryHouse",
//                            "mushroomHouse", "trailer", "cupcake", "post"
//                            (see NOUNS in Station.jsx) — or "waterFeature", a
//                            body of water lying in the ground where it
//                            stands, its own `width` by `length` (see
//                            WATER in ../water/objects.js; two that touch
//                            are one pool), or "ground", a patch of bare
//                            ground the same way, an island where it lies
//                            in a pool (see GROUND there)
//                            — or any ornament shape (see Ornament):
//                            "sphere", "daisy", "pentagram"...
//                  position  { x, y, z } where it stands. x and y are
//                            fractions of the box — x 0 is its left edge and
//                            1 its right, y 0 its back edge and 1 its front,
//                            so { x: 0.5, y: 0.5 } is dead center — and z is
//                            how far above the ground it stands, in world
//                            units. Left out, it is dead center on the ground
//                  rotation  { x, y, z } how it is turned about its own spot,
//                            in DEGREES about its own axes — y spins it in
//                            place, x and z tip it. Left out, it stands as
//                            drawn
//                  config    overrides on that type's own config const
//                            (TRAMPOLINE for a trampoline, GACHAPON for a
//                            gachapon, VENDING_MACHINE for a vending
//                            machine, BENCH for a bench, CAPSULE for a
//                            capsule, HOUSE for a house, TWO_STORY_HOUSE
//                            for a two-story house, MUSHROOM_HOUSE
//                            for a mushroom house, TRAILER for a trailer,
//                            CUPCAKE for a cupcake, EMPTY for an empty,
//                            WATER for water — its kind, size, corners,
//                            depth — GROUND for ground,
//                            POSTS.post plus
//                            `cap` and `capColor` for a post; an ornament's
//                            `{ radius, sides, light, color }`)
//   rotation     how the whole station is turned about its own middle, on
//                the ground: `{ x, y, z }` in DEGREES about its own axes —
//                y spins it in place, x and z tip it
//   hasEnclosure whether there is a fence round it at all
//   cleared      whether the lot is cleared land: the grass kept off the
//                whole of it, fence or no fence, rather than only a patch
//                round each object (see stationClearings)
//   enclosure    overrides on ENCLOSURE for that fence and the garland
//                along it
//   clearing     how far out the grass is kept back, as a multiple of the
//                fence's reach from the station's middle — or, with no
//                fence, of each object's own reach from where it stands,
//                one patch per object, never less than that reach (see
//                stationClearings)
export const STATION = {
  type: "lot",
  boundingBox: { width: 12, length: 12 },
  objects: [],
  rotation: { x: 0, y: 0, z: 0 },
  hasEnclosure: true,
  cleared: false,
  enclosure: {},
  clearing: 0.75,
};

// An empty: a spot in the lot with nothing on it — what the edit panel's
// + puts down, to be made into something from its dropdown — drawn as a
// flat disc `radius` across on the ground in the edit view, so it can be
// picked and dragged, and not at all in the game. The grass is kept back
// that far round it.
export const EMPTY = { radius: 1, color: PALETTE.house.walls };

// Where an object stands when it does not say: the middle, on the ground.
export const AT_CENTRE = { x: 0.5, y: 0.5, z: 0 };
