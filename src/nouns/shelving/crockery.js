import { solid } from "../../world/palette.js";
import { MUG } from "../mug/objects.js";
import { TEAPOT } from "../teapot/objects.js";
import { BOWL } from "../bowl/objects.js";
import { OIL, VINEGAR } from "../cruet/objects.js";
import { SHAKERS } from "../shaker/objects.js";
import { GLASS } from "../glass/objects.js";
import { PLATE } from "../plate/objects.js";

// a design's colours, hexes made swatches, all the way down
export const swatches = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? solid(v) : swatches(v)]));

// The crockery's size against the shelves: the café's furniture scale
// (SHOP_INTERIOR.scale), so a mug stands about 12cm
export const CROCKERY_SCALE = 0.27;

// THE CROCKERY on a shelf (the Shelving's "cafe", a café's shelves —
// in its kitchen and behind its shop windows — and its counters): the library's Mug,
// Teapot and Bowl (Food/Kitchen), set out along each of `ys` (heights)
// from x0 to x1 at depth z, at the furniture's scale `S` — mostly mugs
// (some with coffee in), now and then a bowl (some with fruit in, some
// empty), and `teapots` at most of the teapots, tall or short — in the
// shop's `colors`. The bowls are plain in those colours, or, given `bowls`
// (a café style's: each { design, colors } of hexes, see the Bowl's
// designs), one of those each. Each { k, x, y, z, ry, cfg }, cfg the
// piece's config.
// How wide each stands is worked from its config as its own footprint
// helpers would (mugFootprintOf, teapotFootprintOf, bowlFootprintOf).
export function crockery({ x0, x1, ys, z, S, r, colors, bowls = null, teapots = 1 }) {
  const out = [], hue = () => solid(colors[Math.floor(r() * colors.length)]);
  let pots = teapots;
  ys.forEach((y) => {
    for (let x = x0 + 0.02; ; ) {
      let k, cfg, half;
      const roll = r();
      if (pots > 0 && roll < 0.14) {
        const tall = r() < 0.5;
        k = "teapot";
        cfg = { body: tall ? { tall: 1.45, belly: 0.4 } : { tall: 0.8, belly: 0.55 }, colors: { body: hue(), lid: solid("#F2E9DC") } };
        half = TEAPOT.size * Math.max(cfg.body.belly + TEAPOT.handle.reach + TEAPOT.handle.radius, 0.72 * TEAPOT.spout.length + TEAPOT.spout.radius);
      } else if (roll < 0.36) {
        k = "bowl";
        const n = r() < 0.45 ? 0 : 1 + Math.floor(r() * 3);
        const look = bowls?.length ? bowls[Math.floor(r() * bowls.length)] : null;
        cfg = {
          radius: 0.4, depth: 0.28,
          ...(look ? { design: look.design, colors: swatches(look.colors) } : { colors: { bowl: hue() } }),
          contents: n ? "orange and apple" : "empty", fruit: { count: n, radius: 0.1 },
        };
        half = cfg.radius * (1 + 0.15 * BOWL.flare);
      } else {
        k = "mug";
        cfg = { full: r() < 0.5 ? MUG.full : 0, colors: { mug: hue() } };
        half = MUG.radius + MUG.handle.radius + MUG.handle.tube;
      }
      const w = 2 * half * S;
      if (x + w > x1) break;
      if (k === "teapot") pots--;
      out.push({ k, x: x + w / 2, y, z, ry: k === "mug" ? (r() - 0.5) * 0.6 : 0, cfg });
      x += w + 0.015 + r() * 0.03;
    }
  });
  return out;
}

// THE KITCHENWARE on a kitchen's shelf (over its sink): the library's Oil
// and Vinegar and Salt and Pepper (Food/Condiments) on the top board, and
// along the rest, empty — Bowls (in `bowls`' designs, as `crockery`'s), a
// Stack of Plates now and then, Glasses and Mugs in the shop's `colors`.
// The same { k, x, y, z, ry, cfg } as `crockery`'s, drawn by Crockery.jsx.
export function kitchenware({ x0, x1, ys, z, S, r, colors, bowls = null }) {
  const out = [], hue = () => solid(colors[Math.floor(r() * colors.length)]);
  const gap = () => 0.02 + r() * 0.03;
  const place = (k, cfg, half, x, y) => {
    const w = 2 * half * S;
    if (x + w > x1) return null;
    out.push({ k, x: x + w / 2, y, z, ry: k === "mug" ? (r() - 0.5) * 0.6 : 0, cfg });
    return x + w + gap();
  };
  const top = ys[ys.length - 1], lower = ys.slice(0, -1);
  // the condiments, together on the top board, then mugs along the rest of it
  let x = x0 + 0.02;
  for (const [k, half] of [["oil", OIL.radius], ["vinegar", VINEGAR.radius], ["shakers", SHAKERS.radius * 2 + SHAKERS.gap / 2]]) {
    const nx = place(k, {}, half, x, top);
    if (nx == null) break;
    x = nx;
  }
  const mugHalf = MUG.radius + MUG.handle.radius + MUG.handle.tube;
  for (let nx; (nx = place("mug", { full: 0, colors: { mug: hue() } }, mugHalf, x, top)) != null; ) x = nx;
  // the lower boards: plates, bowls, glasses, a board of each in turn as
  // there are boards (glasses again, then bowls, if there are more)
  const kinds = ["plates", "bowl", "glass"];
  lower.forEach((y, i) => {
    const k = kinds[i % kinds.length];
    let at = x0 + 0.02;
    for (let tries = 0; tries < 40; tries++) {
      let cfg, half;
      if (k === "plates") {
        // in one of the café's looks, if it has them (a plain one's colour its china)
        const look = bowls?.length ? bowls[Math.floor(r() * bowls.length)] : null;
        const plate = !look ? { color: solid("#F7F4EE") }
          : look.design === "basic" ? { color: solid(look.colors.bowl) }
          : { design: look.design, colors: swatches(look.colors) };
        cfg = { count: 4 + Math.floor(r() * 4), plate };
        half = PLATE.radius;
      }
      else if (k === "bowl") {
        const look = bowls?.length ? bowls[Math.floor(r() * bowls.length)] : null;
        cfg = { radius: 0.4, depth: 0.28, contents: "empty", ...(look ? { design: look.design, colors: swatches(look.colors) } : { colors: { bowl: hue() } }) };
        half = cfg.radius * (1 + 0.15 * BOWL.flare);
      } else { cfg = { full: 0 }; half = GLASS.radius; }
      const nx = place(k, cfg, half, at, y);
      if (nx == null) break;
      at = nx;
    }
  });
  return out;
}
