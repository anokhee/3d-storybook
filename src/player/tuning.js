import { SKY } from "../nouns/sky/objects.js";
import { PLANET } from "../nouns/planet/objects.js";
// Units are world units (the planet's radius is 20) and seconds.

// Where each key pushes, in the GROUND's axes under the doll: x is right on
// screen, y is up off the ground, -z is away from the camera toward the
// horizon. WASD travels; the arrows are the camera's — see LOOK.
export const KEYS = {
  w: [0, 0, -1],
  s: [0, 0, 1],
  a: [-1, 0, 0],
  d: [1, 0, 0],
  // Space held is a THRUST: keep it down and you rise — a little over a
  // jump's height, then hover there. A single tap from the ground is a
  // JUMP — see JUMP. Shift (or q) is the way down: free, that is how you
  // come in to land.
  " ": [0, 1, 0],
  Shift: [0, -1, 0],
  q: [0, -1, 0],
};

// The arrows turn the camera, as the drag does, so the two hands stay on
// the keyboard: left and right sweep it round the doll, up and down aim it
// up and down (free only — held, the ground is level and the tilt is the
// camera's own, see CAMERA). Each is where it pushes in the drag's own
// pixel axes (x right, y down), so a key and a drag the same way turn the
// same way. The push eases in and out at `ease` rather than snapping, and
// turns at `rate` once it is on.
export const LOOK = {
  keys: {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  },
  rate: 1.8, // radians per second the sweep turns at, at the full push
  tilt: 1.1, // ...and the tilt: slower, since it aims the flight
  ease: 10, // e-folding rate the push comes on and off at
};

// The two hands swapped — the arrows travel and WASD turns — for whoever
// holds it that way round: each key in either set, as the other's. Set
// from the sfx panel; see game/store.js, `reverseArrows`.
export const SWAP = {
  w: "ArrowUp",
  s: "ArrowDown",
  a: "ArrowLeft",
  d: "ArrowRight",
  ArrowUp: "w",
  ArrowDown: "s",
  ArrowLeft: "a",
  ArrowRight: "d",
};

// Travel along the ground.
export const MOVE = {
  accel: 44, // units/s^2 while a key is down
  damp: 3.4, // e-folding drag, so it coasts to a stop rather than sailing
  max: 11, // top speed along the ground
};

// Free flight: outside every gravity shell (see the bodies) there is no
// ground and no gravity, and the keys push in the camera's frame — W the
// way it looks, aimed up or down and all (see turnCamera), A and D across
// it, space and shift up and down the screen. A lighter drag than on the
// ground, so it drifts, and a higher top speed, so the gap between the
// shells is a crossing rather than a crawl.
export const FREE = {
  accel: 30,
  damp: 0.5,
  max: 30,
  grip: 4, // e-folding rate the speed it has swings onto the push
};

// Swimming: free, it stays on its feet but leans into the way it is going,
// like a diver kicking off — upright when it drifts.
export const SWIM = {
  rate: 4, // chase into the lean on being let go, and out of it on landing
  tilt: 0.7, // radians at the full lean
  at: 12, // speed across the felt up that earns the full lean
};

// The dive: drawn at a hoop (see nouns/ring), it goes onto its belly and
// points its crown at the hoop's middle, and swims through head first.
export const DIVE = {
  rate: 5, // chase onto the line, and back off it once past
};

// Up and down.
// What a landing has to arrive at, in world units per second, to be heard
// at all — below it the hover is settling, not touching down. See bounce.
export const LAND = { heard: 0.5 };

export const FALL = {
  gravity: 20,
  damp: 0.0, // vertical air resistance — near-ballistic, so a drop isn't mush
  settle: 0.06, // below this vertical speed a doll on the ground is at rest
  restitution: 0, // what bare ground gives back on landing: 0 is "stay down"
  halt: 2, // land on bare ground harder than this and the travel stops dead
  ceilingBounce: 0.4, // and what the ceiling gives back
};

// The jump: one tap of space from a standstill on the ground (or on a
// column) kicks it straight up at this speed, then gravity has it. Over a
// trampoline the tap is the pump instead — see MAT.pump.
//
// `apex` is how high that carries it off its floor. Held, space flies it
// up to `hover` times that and holds it there: a little over the jump, so
// the hover reads as its own thing rather than a jump stopped short. It
// EASES in — the last stretch closes at `ease` per second, e-folding — so
// it settles at the top instead of hitting an invisible ceiling. Off a
// ledge it drifts down to the new height.
export const JUMP = {
  speed: 18,
  get apex() {
    return (this.speed * this.speed) / (2 * FALL.gravity);
  },
  hover: 1.35,
  ease: 3,
};

// The splat: come down on bare ground hard enough and it lands on its
// belly, bounces a little, and picks itself back up.
// The tricks. `spin` is the change of doll: on `r` it turns `turns` times
// about its own up over `time`, and the next doll is swapped in at the
// midpoint, where it is going fastest. `flip` is breaking out of the
// atmosphere, and flying through a ring in space: it throws `turns` front
// flips over `time`. Both are eased in and out, so they start and finish
// at rest.
export const TRICKS = {
  spin: { time: 0.9, turns: 2 },
  flip: { time: 0.8, turns: 1 },
};

export const SPLAT = {
  // World units it has to come down from, peak to ground, to splat: well
  // above the top of a held hover (`clear` times it), so no jump or hover
  // off level ground splats — only a real drop, off the trampoline or out
  // of the upper atmosphere, does.
  clear: 1.5,
  get drop() {
    return JUMP.apex * JUMP.hover * this.clear;
  },
  bounce: 0, // what the ground gives back on one, as a share of the impact
  pitch: 80, // degrees it tips forward onto its belly
  hold: 2, // seconds it lies there once the bouncing stops
  rate: 9, // chase, both onto the belly and back up
  bed: 0, // how far off the ground the belly rests — in the grass, not on it
  // The push-up it gets up with. The arms are pulled onto a bent pose: the
  // upper arm out to the side, the forearm straight down to the ground.
  arms: {
    elbow: 0.5, // where along the arm it bends, 0 shoulder .. 1 hand
    splay: 0.5, // share of the rest it lies with its arms straight out first
    forward: 0.35, // how far ahead of the shoulder the elbow sits
    drop: 0.15, // how far down the upper arm points lying flat...
    push: 1.4, // ...and how much further it swings down as it pushes up
    hold: 0.35, // per-solve pull onto the pose (1 bolts it there)
    from: 0.04, // splat amount below which the arms are let go
    fade: 0.3, // splat amount over which the pull fades in and out
  },
};

// In a pool — see waters.js. Deep enough to float in, the doll swims: it
// drops in off the bank and hangs upright in the water, its head out and
// everything below the neck under, riding `float` above the surface and
// bobbing gently on it, its legs treading below. Too shallow to float
// in, it wades: it stands on the bed.
export const POOL = {
  float: 0.06, // how far the skull's underside rides above the surface
  pitch: 0, // degrees it tips forward, 0 upright — leaning is for divers
  rate: 5, // chase, both into the water's hold and back out of it
  pace: 0.55, // top speed in the water, as a share of the ground's
  // The bob afloat, in place of the walking one: slow and easy, the way a
  // thing rides a swell — `amp` in world units, `rate` in cycles a second.
  bob: {
    amp: 0.09,
    rate: 0.7,
  },
  // The legs: hanging straight down, treading — swung forward and back
  // `kick` of the way, `beat` times a second, the shin swinging a little
  // behind the thigh. Pulled onto the pose the way the splat's arms are
  // — see SPLAT.arms.
  legs: {
    kick: 0.3,
    beat: 1,
    hold: 0.35,
    from: 0.04,
    fade: 0.3,
  },
};

// Sitting down: `e` beside a seat sits the doll on it — see seats.js.
export const SEAT = {
  reach: 2.5, // ground distance from a seat's edge within which `e` sits
  // The body sits back from the seat's front edge by the length of a
  // thigh, less this, so the knees hang just past the edge and the shins
  // drop clear in front of the seat rather than into it.
  edge: 0.1,
  lift: 0.12, // how far the body is held above the seat: the thighs' room
  step: 0.4, // world units clear of the front edge it stands up onto
  bob: 0.25, // the standing bob's share while sitting
  // The legs, bent at the knee: the thigh along the seat, the shin down
  // off its edge. Pulled onto the pose the way the splat's arms are — see
  // SPLAT.arms — and eased in and out as it sits and stands.
  legs: {
    knee: 0.5, // where along the leg it bends, 0 hip .. 1 foot
    thigh: 0.15, // how far the thigh tips up off the seat, as a share of forward
    shin: 0.1, // how far the shin swings forward of straight down
    hold: 0.4, // per-solve pull onto the pose (1 bolts it there)
    rate: 7, // chase, both onto the seat and back off it
    from: 0.04, // sit amount below which the legs are let go
    fade: 0.3, // sit amount over which the pull fades in and out
  },
};

// Going in: `e` on the ground within `reach` of a door's foot takes the
// doll indoors — see doors.js.
export const DOOR = {
  reach: 2.5,
};

// The keycap floated over the nearest seat, or door, while `e` would take
// it — see Hints.jsx: `above` how far over the seat's top or the door's
// head it floats, in world units, `size` the cap in px, `color` its own.
export const HINT = {
  above: 1,
  size: 28,
  color: "#fff4d6",
};

// Where it may be.
export const STAND = {
  hover: 0.3, // how far the lowest point (a leg tip) is held off the ground
  ceiling: SKY.shell, // altitude the crown may not pass: the sky itself
};

// How it turns to face the way it goes...
export const TURN = {
  toward: 9, // ...quickly, setting off
  home: 3.6, // ...and slowly, coming back round to face you once stopped
  crawl: 0.4, // below this speed the heading is left alone
  // ...and how fast its felt up — the one it stands to, and the camera
  // holds level to — comes round to the new ground's after it drifts into
  // a shell. E-folding, per second: mostly done in half a second.
  over: 3,
};

// The flight lean: tipping back on the climb, nosing forward into the fall.
export const LEAN = {
  max: 0.2, // radians at full lean
  at: 40, // vertical speed that earns full lean
  rate: 6, // chase, so a landing eases it upright instead of snapping
};

// The bank: free, a turn is leaned into, so steering looks like steering.
// The yaw (radians a second, keys or drag together) rolls the doll about
// its heading and the camera about its line of sight — `doll` and
// `camera` radians each at `at` radians a second of turn, both chased at
// `rate` — and the jetpack flares `flare` of full on top of its speed, at
// the full bank. Held, none of it: the ground is level.
export const BANK = {
  at: 1.8,
  doll: 0.55,
  camera: 0.12,
  rate: 6,
  flare: 0.5,
};

// The bob that says it is under its own power.
export const BOB = {
  rest: 0.18, // amplitude standing still
  swim: 0.09, // extra amplitude at top speed
  rate: [1.1, 1.9], // per-doll bob rate, rolled once
  swimRate: 3, // extra rate at top speed
};

// Weightlessness, eased in by the swim blend on being let go and out again
// on landing. Free, nothing was telling the limbs or the bob the doll had
// left the ground: the arms and legs hung straight down under full rope
// gravity and it bobbed as if treading water.
export const ZERO_G = {
  weight: 0.08, // how much of the rope gravity is left: a whisper, not none
  damping: 0.995, // the ropes' per-step damping, so a limb keeps coasting
  bobRate: 0.35, // the bob's rate, as a share of the grounded one
  bobAmp: 1.2, // ...and its amplitude: a slow, slightly deeper drift
};

// The space helmet: on whenever the doll is off the planet. See Helmet.jsx.
export const HELMET = {
  rate: 6, // e-folding fade in and out, per second
  metal: { color: "#C8CDD6" }, // toon like everything — see unlit/toon.js
  // A ring threaded on each antenna where its stalk leaves the glass —
  // never lower than `at` of the way up the stalk, never higher than `top`
  // — standing `gap` off the stalk's own width there. An antenna whose
  // stalk is shorter than `stub` (the horns: a buried nub under a cone)
  // wears it round the foot of its tip instead, `base` of the way up the
  // cone.
  ring: { at: 0.25, top: 0.85, tube: 0.035, gap: 0.015, stub: 0.1, base: 0.2 },
  // A ring round the body, `down` of the way from its crown to its floor
  // — never lower than `aboveArms` clear of the arms' roots — standing
  // `gap` off the skin.
  body: { down: 0.1, tube: 0.05, gap: 0.02, aboveArms: 0.04 },
  // The dome between them. `room` is the air round the skull's widest,
  // `crown` the air over its crown, and `alpha` how much glass there is to
  // see.
  glass: { room: 0.3, crown: 0.3, alpha: 0.22, color: "#DDF3FF" },
};

// The jetpack, worn with the helmet: on off the planet, and firing only
// free, in zero-g — a low idle glow drifting, and the harder the doll
// moves the harder it burns. See Jetpack.jsx.
export const JETPACK = {
  rate: 6, // e-folding fade in and out, per second
  // The pack on the back, in the helmet's metal: a rounded box, its face
  // `gap` off the smooth back (the texture's lumps ignored), centered
  // `down` of the way from the body's crown to its floor, `across` of the
  // body's width there wide, `tall` of its height high and `depth` thick
  // (world units). Strapped on: a belt round the body at the pack's foot,
  // and two shoulder straps up from the pack's top, over the shoulders
  // and down the chest, curving out to meet the belt right under each
  // arm. Each a tube `tube` thick laid `lift` off the smooth skin, in
  // `color`. The straps leave the pack `apart` of its half-width either
  // side of the middle.
  pack: {
    color: "#C8CDD6", // toon like everything — see unlit/toon.js
    down: 0.42,
    across: 0.45,
    tall: 0.5,
    depth: 0.32,
    gap: 0.1,
    straps: {
      color: "#3B3F4A",
      tube: 0.038,
      lift: 0.012,
      apart: 0.6,
    },
    // A raised panel on its back face, in the doll's own skin knocked
    // down by `darken`: `across` and `tall` of the pack's width and
    // height, standing `depth` proud (world units). With `sticker` on, the
    // doll's own sticker (its portrait — see renderGrid/sticker.js) is
    // worn there instead, a chip as wide as the panel's narrower side.
    panel: {
      across: 0.62,
      tall: 0.5,
      depth: 0.06,
      darken: 0.1,
      sticker: false,
    },
    // Two thrusters under it: open cones hanging off the pack's foot,
    // `apart` of its half-width either side of the middle, `length` of the
    // pack's height long, `throat` wide where they leave the pack and
    // flaring to `mouth` at the bottom (world units, radii) — and the
    // flame comes out of that mouth.
    nozzle: { apart: 0.5, length: 0.2, throat: 0.1, mouth: 0.2 },
  },
  // The flame out of the nozzles: `idle` of full strength drifting, and
  // full at `at` world units a second. Chased at `rate`, so it flares and
  // dies down rather than snapping.
  flame: {
    idle: 0.18,
    at: 18,
    rate: 5,
    // Particles: `emit` a second at full strength, each living `life`
    // seconds, leaving at `speed` with `spread` of that sideways and
    // `inherit` of the doll's own velocity, `size` across, fading through
    // `colors` from birth to death. `pool` is the most alive at once.
    emit: 160,
    life: [0.22, 0.45],
    speed: [4, 7],
    spread: 0.3,
    inherit: 0.7,
    size: [0.07, 0.15],
    damp: 3, // e-folding drag on a particle, per second
    colors: ["#FFF6D0", "#FFB347", "#FF6B9A"],
    pool: 200,
  },
  // The glow at each nozzle: a halo `radius` across at full strength (half
  // that idling), `alpha` strong, and one real light of `light` intensity
  // reaching `distance`.
  glow: {
    color: "#FFB070",
    radius: 1.2,
    alpha: 0.7,
    light: 4,
    distance: 7,
  },
};

// The camera that follows.
export const CAMERA = {
  dist: 23, // how far back it starts
  min: 5, // the wheel's reach, in...
  max: 40, // ...and out
  pitch: 0.24, // radians it looks down at the doll
  // Held, the tilt eases home to `pitch` at this e-folding rate, so on a
  // ball the view stays over the hemisphere the doll walks.
  level: 3,
  eye: 0.62, // where on the doll it aims, as a fraction of its height
  chase: 5, // e-folding rate it closes on its goal
  turn: 0.004, // radians per pixel of drag
  zoom: 0.001, // exp(deltaY * this) per wheel tick
};

// The trampoline. Its GEOMETRY (radius, height, sink) is the station's, from
// refactored/nouns/trampoline/objects.js; everything here is how it plays.
// The launch speed that just reaches the planet's shell from its ground.
const escapeSpeed = () =>
  Math.sqrt(2 * FALL.gravity * (PLANET.shell - PLANET.radius));

// The pump ratio that lands a perfect run's `jumps`th launch on `margin`
// times the escape speed. v_n rises monotonically with the ratio, so it
// bisects cleanly.
function solveGive(P) {
  const goal = P.margin * escapeSpeed();
  const last = (give) => {
    let v = JUMP.speed;
    for (let i = 1; i < P.jumps; i++) v = v * give + P.kick;
    return v;
  };
  let lo = 0.5,
    hi = 3;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (last(mid) < goal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// The leaf of a tree's canopy, as the doll pushes into it — see
// player/foliage.js. Solid, but with give: the doll sinks into the leaf
// so far and is held there, from any side and from above, so a crown is
// a squishy ball it bounces off and can stand in the top of, not a wall
// and not air.
export const FOLIAGE = {
  // How far into the leaf the doll may sink, as a share of the canopy's
  // radius, before it is held: the give.
  give: 0.3,
  // How hard the leaf slows the doll, per second, right in the middle of
  // that give; less at the leaf's edge.
  drag: 8,
  // How hard the leaf eases the doll back out, in world units per second
  // per second, right in — so it is set back toward the edge rather than
  // held stuck at the give.
  push: 30,
  // A doll coming into leaf faster than this makes the rustle sound; the
  // faster, the louder (see sfx/manifest.js).
  rustleSpeed: 0.5,
  // How long after the doll has left the leaves still count as touched,
  // ms — see rustle in tread.js.
  linger: 60,
};

export const MAT = {
  // How far above the sheet the leg tips rest. Nearly nothing: it stands
  // ON the mat, and nothing of it goes through.
  contact: 0.1,
  // The sheet catches a doll whose body overlaps it by this much of its
  // half-width beyond the rim. 0: its middle has to be over the sheet.
  catch: 0,
  // What a bounce gives back when you do NOTHING. Under 1 so every bounce
  // you don't press for comes down shorter, and the run dies on its own.
  restitution: 0.55,
  // Under this landing speed the sheet gives NOTHING back: it is standing
  // on the mat, not a bounce. Without it the frame-by-frame push of gravity
  // into the sheet came back as a buzz that never let the doll count as at
  // rest — so a press on the sheet was never the standing jump.
  settle: 1,
  // Every launch aims the doll at a fresh random point within this of the
  // sheet's center, so a run wanders around the mat instead of pogoing.
  landingRadius: 0.5,
  // The catch line, as a ground distance from a sheet's center: a launched
  // doll falling within it of ANY sheet is pulled toward that one — so it
  // is both how far you can stray from your own trampoline and still be
  // caught, and how close to the next one you have to get for it to take
  // over. Past it from every sheet, the flight is let go for good.
  escapeRadius: 0,
  homing: 5, // per-second chase of that pull-back — a tug, not a teleport

  // THE PUMP. Over the mat SPACE stops being thrust and becomes a press,
  // graded the instant it is made by how much of the fall was left: inside
  // `sweet` seconds of landing it is perfect, tapering to nothing by
  // `window`. One press per flight, the first one counts.
  pump: {
    sweet: 0.26,
    window: 0.8,
    ease: 0.5, // under 1 holds the grade high and drops it late
    // A perfect press hands back MORE than it landed with — by `give`,
    // which is not a number here but SOLVED: whatever ratio makes a
    // perfect run from a standstill break out of the planet's shell on
    // exactly the `jumps`th jump, however big the shell is. The run is
    // v, v·give + kick, ... from JUMP.speed; the speed that clears the
    // shell is sqrt(2 g h) for the height up to it; the ratio is found by
    // bisection so that the last jump launches `margin` faster than that
    // — well over, so the one before falls short. Ballistic (FALL.damp is
    // 0), and measured from the ground rather than the mat, which only
    // adds a little more margin.
    jumps: 10,
    margin: 1.06,
    get give() {
      return (this._give ??= solveGive(this));
    },
    kick: 2, // plus a little, so the smallest hops never stall
    // A press from a standstill on the sheet is a JUMP — JUMP.speed, the
    // same as off the ground — so a run starts from the jump's own apex.
    miss: 0.55, // a mistimed press gives back no more than no press
    // Launch speed cap — where the climbing stops. Never under what the
    // shell takes, or the run could never leave.
    get ceiling() {
      return Math.max(100, this.margin * 1.1 * escapeSpeed());
    },
  },
  // What the sheet does about a landing: sinks by what you landed with,
  // lights up by how well you timed it. A bad press sinks deeper and lights
  // nothing — you went into the mat instead of off it.
  dip: {
    per: 0.03, // world units of sink per unit of landing speed
    max: 0.9,
    sink: 1.7, // ...times this when the press was a bad one
    rate: 9, // e-folding return, per second
    glow: 1.5, // emissive at a perfect press
    fade: 6,
  },
};
