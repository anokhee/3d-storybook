import { span, clamp, smoothstep } from "../renderGrid/utils.js";
import { BANDS } from "../presets/index.js";

// What `point` turns into when a preset switches it on. 1 puts the profile
// linear in the distance to the pole, which is exactly a cone — the number is
// fixed here so the bands stay a yes/no rather than one more thing to tune.
const POINT_EXPONENT = 1;

// The two head balloons blend across the split, so what actually reads on the
// finished head is the DIFFERENCE between them. At zero difference every point
// on the sphere moves by the same amount: the split does no work and the head
// is a ball, however large the balloons themselves are.
//
// A hard floor would fix that but pile every affected head onto one identical
// taper. This remaps [0, knee] onto [floor, knee] instead — continuous at the
// knee — so near-flat heads grow, clearly-tapered ones pass through untouched,
// and no two heads collapse onto the same value. (The remap itself is
// monotonic in the gap; the band clamp below can perturb that slightly near
// the edges, where there simply isn't room.)
//
// Thresholds are fractions of the widest gap the bands can produce, so they
// keep meaning as those bands get tuned. Costs no draws: seeds don't move.
function separateBalloons(top, bot, h) {
  const [topLo, topHi] = span(h.topBalloon);
  const [botLo, botHi] = span(h.botBalloon);
  const maxGap = Math.max(Math.abs(botHi - topLo), Math.abs(botLo - topHi));
  const knee = h.balloonGapKnee * maxGap;
  const gap = bot - top;
  const mag = Math.abs(gap);
  if (mag >= knee || knee <= 0) return [top, bot];

  const floor = h.minBalloonGap * maxGap;
  // Signed, so the head keeps whichever way it was already tapering.
  const target =
    (floor + (mag / knee) * (knee - floor)) * (Math.sign(gap) || 1);
  const mid = (top + bot) / 2;

  // Open the gap around the midpoint, but keep both ends inside their bands —
  // a param should never leave the range you set. Split evenly, then let each
  // side absorb whatever the other one couldn't take: botBalloon's ceiling is
  // often far below topBalloon's, so an even split alone loses most of the gap
  // exactly where headroom is tightest.
  let t = clamp(mid - target / 2, topLo, topHi);
  let b = clamp(t + target, botLo, botHi);
  t = clamp(b - target, topLo, topHi);
  return [t, b];
}

// One silhouette preset turned into a deformer config. Heads and bodies come
// out of different tables now, but they are the same eight bands feeding the
// same deformer — so this takes the merged preset rather than a key, and both
// callers do their own merging.
function shapeFrom(h, draw) {
  const split = draw(h.split);
  const feather = draw(h.feather);
  const topBalloon = draw(h.topBalloon);
  const pullUp = draw(h.pullUp);
  const topPoint = draw(h.topPoint);
  let botBalloon = draw(h.botBalloon);
  let pullDown = draw(h.pullDown);
  const botPoint = draw(h.botPoint);
  const chin = draw(h.chin);
  // Symmetric shapes mirror the bottom off the top's draws instead of keeping
  // the bottom's own — both bands read positive-is-outward along their own
  // axis, so the mirror is a straight copy. The bottom's draws above are still
  // consumed so flipping `symmetry` on a preset leaves every draw up to here
  // where it was; only the two offset draws below are new. `symmetryOffset`
  // jitters each mirrored value independently so the ends match without being
  // clones.
  if (h.symmetry) {
    botBalloon = topBalloon + draw(h.symmetryOffset);
    pullDown = pullUp + draw(h.symmetryOffset);
  }
  // separateBalloons exists to keep a head from collapsing into a ball, which
  // is exactly what a symmetric shape is asking for — so symmetry skips it
  // rather than having the mirror forced back open.
  const [top, bot] =
    h.symmetry ?
      [topBalloon, botBalloon]
    : separateBalloons(topBalloon, botBalloon, h);

  // Where the deformed bottom pole lands, computed here once rather than
  // hunted for per vertex: the pole starts at y -1, the balloon moves it out
  // along its own normal (straight down), and the shift carries it further —
  // both blended across the split exactly the way deformBase blends them.
  // The pinch (`point`) only squeezes x/z, so it never moves this. `chin` is
  // a DEPTH above that pole; the plane and its round-over radius are resolved
  // to a y here so the deformer just clamps.
  const chalf = feather / 2;
  const ctw = smoothstep(split - chalf, split + chalf, -1);
  const poleY =
    -1 - (top * ctw + bot * (1 - ctw)) + (pullUp * ctw - pullDown * (1 - ctw));
  return {
    split,
    feather,
    // The bands read as pullUp / pullDown, both positive-is-outward. The
    // deformer works in plain +y, so the bottom flips here — the one place
    // the two conventions meet.
    top: {
      balloon: top,
      shift: pullUp,
      point: topPoint ? POINT_EXPONENT : 0,
    },
    bottom: {
      balloon: bot,
      shift: -pullDown,
      point: botPoint ? POINT_EXPONENT : 0,
      // The round-over radius scales off the cut depth; `chinSoft` and
      // `chinTuck` are bare multipliers read without a draw, so tuning them
      // never moves a seed.
      chin:
        chin > 0 ?
          {
            y: poleY + chin,
            soft: chin * (h.chinSoft ?? 1),
            tuck: h.chinTuck ?? 0.25,
          }
        : null,
    },
  };
}

// `setPhase` is how the body gets its own tab. The draws for the two shapes
// are made in one place, but they belong to different axes — so the caller
// hands in a way to say which one is being drawn right now, and buildBand
// flips it around the body's block and puts it back.
function buildBand(draw, headKey, bodyKey, setPhase) {
  const B = BANDS;

  // Heads state split/feather/balloonGapKnee flat and group top's and
  // bottom's own three keys together for readability — merged one level
  // deep, the same shape neck gets below — then flattened back to the flat
  // shape shapeFrom expects, since that's shared with the body's own table.
  const hd = B.headDefaults;
  const hp = B.heads[headKey];
  const top = { ...hd.top, ...hp.top };
  const bottom = { ...hd.bottom, ...hp.bottom };
  const h = {
    ...hd,
    ...hp,
    topBalloon: top.topBalloon,
    pullUp: top.pullUp,
    topPoint: top.topPoint,
    botBalloon: bottom.botBalloon,
    pullDown: bottom.pullDown,
    botPoint: bottom.botPoint,
  };
  const shape = shapeFrom(h, draw);

  setPhase("body");
  // The body preset over the shared defaults, with `neck` merged one level
  // deeper — the same shape of merge faceBands() does for a head's face.
  const bp = B.bodies[bodyKey];
  const b = { ...B.bodyDefaults, ...bp };
  const n = { ...B.bodyDefaults.neck, ...bp.neck };
  const size = draw(b.size);
  // Own table, own draws — taken AFTER the head's, so pinning the body axis
  // leaves the head's stream exactly where it was.
  const body = { size, ...shapeFrom(b, draw) };
  // The neck rides the BODY axis rather than one of its own: it is part of the
  // body preset, it is drawn from the body's size, and a tab per part stops
  // being useful somewhere around here. See presets/bodies.js for what the
  // ring radii mean and why the bottom is a fraction.
  const neck = (() => {
    // Order matters: these draws come off the same stream, so keep them in
    // the sequence they were written in or every seed downstream shifts.
    const length = draw(n.length);
    const topRadius = draw(n.topRadius);
    return {
      length,
      topRadius,
      // Floored against the top so the neck never flares into a funnel.
      bottomRadius: Math.max(draw(n.bottomFrac) * size, topRadius * n.minFlare),
      blend: draw(n.blend),
      fillet: n.fillet,
      sink: n.sink,
    };
  })();
  setPhase("head");

  return { shape, body, neck };
}

export { buildBand };
