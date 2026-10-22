// Flying a doll around a ball. A straight line across a curved floor climbs
// away from it, so the position is kept as a DIRECTION from the center of
// the ball it belongs to — `you.body`, the planet or the moon, see
// refactored/nouns/planet/bodies.js — plus an ALTITUDE, and travel is a
// rotation of that direction; the altitude is a scalar that only the keys,
// gravity and the ground touch.
//
// Outside every ball's gravity shell it belongs to none (`you.body` is
// null) and the position is a plain point in the world: no ground, no
// gravity, the keys pushing in the camera's frame. See shells.
//
// Ported from the vanilla world on main, minus the trampoline pump, the trick
// keys, zero-g and the bleachers. Every knob lives in tuning.js.
import * as THREE from "three";

import { clamp } from "../renderGrid/utils.js";
import { BODIES } from "../nouns/planet/bodies.js";
import {
  KEYS,
  LOOK,
  BANK,
  MOVE,
  FREE,
  SWIM,
  DIVE,
  FALL,
  STAND,
  TURN,
  LEAN,
  BOB,
  ZERO_G,
  TRICKS,
  CAMERA,
  SPLAT,
  MAT,
  JUMP,
  SEAT,
  POOL,
  LAND,
} from "./tuning.js";
import { matUnder, matTop, matWall } from "./mats.js";
import { solidUnder, solidTop, solidWall } from "./solids.js";
import { foliage } from "./foliage.js";
import { waterUnder } from "./waters.js";
import { nearestSeat, seatSpot, seatExit, seatFacing } from "./seats.js";
import { matLand, matDrift, matHoming } from "./pump.js";
import { emit } from "./events.js";

// Scratch. Every one is written before it is read, every frame — they exist so
// that flying a doll around a world allocates nothing at all.
const _up = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _tmp = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _basisX = new THREE.Vector3(1, 0, 0); // local side axis, never mutated
const _basisY = new THREE.Vector3(0, 1, 0); // local up, likewise

const between = (lo, hi) => lo + Math.random() * (hi - lo);

// The edge of the sky, from the middle of the world: free, the doll is
// held inside it (see shells), and reaching it is the way into superspace
// (see Player).
export const SKY_EDGE = BODIES.planet.radius + STAND.ceiling;

// The flight state for one doll, stood on `body` at `dir` with the camera
// looking along `camHeading` (any vector not parallel to `dir` will do — it
// is flattened onto the ground).
export function makeFlyer(doll, dir, camHeading, body = BODIES.planet) {
  const m = doll.metrics();
  const you = {
    doll,
    m,
    body, // the ball `dir` and `alt` are measured from, or null: free
    // The balls that can catch it once it is free — every one, unless the
    // scene has fewer (superspace has none).
    bodies: Object.values(BODIES),
    dir: dir.clone().normalize(),
    alt: STAND.hover - m.chin,
    // Where it is in the world. Held, worked out from `dir` and `alt` every
    // frame; free, the thing itself.
    pos: new THREE.Vector3(),
    // The up it FEELS, which is what it stands to and the camera holds
    // level to. Held, the same as `dir` — except just after drifting into
    // a shell, when it comes round to it (see settle). Free, whatever it
    // was when it was let go.
    up: dir.clone().normalize(),
    vel: new THREE.Vector3(),
    // Tangent, unit, and the way the doll is facing. On a ball there is no
    // shared zero to measure an angle from, so it is carried as a vector.
    heading: new THREE.Vector3(),
    // The camera's heading, likewise tangent — the keys read their
    // directions off this, so dragging the view really does turn "forward".
    camHeading: camHeading.clone(),
    camDist: CAMERA.dist,
    // How far it looks down at the doll. Held, it comes home to
    // CAMERA.pitch — see followCam; free, it is left where it was.
    camPitch: CAMERA.pitch,
    // The arrows' push on the camera, eased — see lookAround.
    look: new THREE.Vector2(),
    // How far it has been turned since the last frame (radians, keys and
    // drag together) and the bank that has earned, eased, -1..1 — see BANK.
    turned: 0,
    bank: 0,
    // The bob's phase is CARRIED rather than worked out from the clock: its
    // rate changes with speed, and sin(t * rate) with a moving rate lurches.
    bobPhase: Math.random() * 6.283,
    bobRate: between(...BOB.rate),
    lean: 0,
    // Swimming: how far into the free-flight lean it is (0 standing, 1
    // all the way). See SWIM.
    swim: 0,
    // The splat: how far onto its belly it is (0 upright, 1 flat) and how
    // long it has left to lie there before it gets up.
    splat: 0,
    splatFor: 0,
    // The dive: how far onto its belly along `diveTo` it is (0 upright, 1
    // flat), and whether something asked for it this frame — a hoop sets
    // `diveTo` and `diveHold` when the doll is flying at it (see
    // nouns/ring); pose() reads the hold and clears it.
    dive: 0,
    diveTo: new THREE.Vector3(0, 0, 1),
    diveHold: false,
    // The trampoline's half of the state: the sheet under the doll this
    // frame, the press waiting to be spent (-1 is none), and the sheet
    // whose launch this flight is, for the leash.
    mat: null,
    solid: null, // likewise the column it is standing on, if any
    seat: null, // and the seat it is sitting on — see sitDown
    pumpGrade: -1,
    matFlight: null,
    // The tricks, as seconds into each, or -1 for not doing one. `spun` is
    // whether the spin has passed its midpoint and had the next doll
    // swapped in; `swapDue` is that request, for whoever owns the doll.
    spin: -1,
    spun: false,
    spinSwap: true, // whether this spin swaps the doll at its midpoint
    swapDue: false,
    flip: -1,
    resting: false, // stood still on its floor last frame
    pinned: false, // pressed against the sky last frame
    floor: STAND.hover - m.chin, // where that floor was, for the hover
    peak: 0, // the highest it has been since it last touched down
    // The push-up: the arm pose handed to the doll while it is down on its
    // belly and getting up — see SPLAT.arms and Doll.armPose.
    armPose: {
      upper: new THREE.Vector3(),
      lower: new THREE.Vector3(),
      right: new THREE.Vector3(),
      elbow: SPLAT.arms.elbow,
      weight: 0,
    },
    // Sitting: how far into the seat it is (0 standing, 1 sat), and the
    // leg pose handed to the doll while it is — see SEAT.legs and
    // Doll.legPose.
    sit: 0,
    // Swimming: the water under it this frame, whether it is afloat in it,
    // how far onto its belly it is (0 upright, 1 flat), and the kick's
    // phase — carried, like the bob's.
    water: 0,
    afloat: false,
    swimming: 0,
    kick: 0,
    legPose: {
      upper: new THREE.Vector3(),
      lower: new THREE.Vector3(),
      right: new THREE.Vector3(),
      knee: SEAT.legs.knee,
      weight: 0,
    },
  };
  localFrame(you);
  you.heading.copy(you.camHeading).negate(); // born facing you
  return you;
}

// The up the keys and the physics work in: the ground's, held; the felt
// one, free.
const upOf = (you) => (you.body ? you.dir : you.up);

// Flatten the camera's heading onto the ground under the doll, and derive
// the frame the keys push in. Writes _up, _fwd and _right.
function localFrame(you) {
  _up.copy(upOf(you));
  _fwd.copy(you.camHeading).addScaledVector(_up, -you.camHeading.dot(_up));
  if (_fwd.lengthSq() < 1e-8) {
    // Straight up or down: pick any tangent rather than divide by nothing.
    _fwd.set(0, 0, 1).addScaledVector(_up, -_up.z);
    if (_fwd.lengthSq() < 1e-8) _fwd.set(1, 0, 0).addScaledVector(_up, -_up.x);
  }
  _fwd.normalize();
  you.camHeading.copy(_fwd);
  _right.crossVectors(_fwd, _up);
}

// Turn the camera's heading about the doll's own up — the one axis that
// keeps it tangent to the ground it is looking across. Held, the tilt is
// not the drag's: a ball is seen from over the hemisphere the doll is
// walking, and the pull on it is what keeps that so (see followCam). Free,
// there is no ground to hold level to, and the tilt turns the doll's whole
// frame — its felt up with the camera's heading — about the right between
// them: the view tips, the doll tips with it, and the camera stays behind
// it looking the way it goes, so the yaw is always about the view's own up
// and a turn is a turn however steeply it is aimed. (Yawing about an up
// left where the planet let go rolled the view once it was aimed along
// it.) Given the camera, it is swung round the doll by the same turns, so
// the turn is instant: left to the chase, the camera trails its goal by
// the turn's whole speed over the chase rate — a held arrow sat it twenty
// degrees behind, and the view swam.
export function turnCamera(you, angle, tilt = 0, camera = null) {
  _up.copy(upOf(you));
  _quat.setFromAxisAngle(_up, angle);
  you.camHeading.applyQuaternion(_quat);
  you.turned += angle;
  if (camera) carry(you, camera);
  if (you.body || Math.abs(tilt) < 1e-9) return;
  // up x heading: turning about it by a positive angle tips the heading
  // down — the drag's tilt, positive looking down.
  _axis.crossVectors(_up, you.camHeading).normalize();
  _quat.setFromAxisAngle(_axis, tilt);
  you.up.applyQuaternion(_quat).normalize();
  you.camHeading.applyQuaternion(_quat).normalize();
  if (camera) carry(you, camera);
}
const carry = (you, camera) =>
  camera.position.sub(you.pos).applyQuaternion(_quat).add(you.pos);

// The arrows: a drag with no mouse. The push eases toward what is held,
// so a tap nudges and a hold sweeps, and the turn is the drag's, in the
// drag's own axes — see LOOK.
const _look = new THREE.Vector2();
const _tmp2 = new THREE.Vector2();
function lookAround(you, held, camera, dt) {
  _look.set(0, 0);
  for (const k of held) {
    const push = LOOK.keys[k];
    if (push) _look.add(_tmp2.set(push[0], push[1]));
  }
  you.look.lerp(_look, 1 - Math.exp(-LOOK.ease * dt));
  if (you.look.lengthSq() < 1e-6) return;
  turnCamera(
    you,
    -you.look.x * LOOK.rate * dt,
    you.look.y * LOOK.tilt * dt,
    camera,
  );
}

function steer(you, held, dt) {
  localFrame(you);
  // Sitting, nothing steers and nothing pulls: it stays put until a travel
  // key stands it up, and then that key gets it going next frame.
  if (you.seat) {
    for (const k of held) if (KEYS[k]) return standUp(you);
    return;
  }
  let mx = 0,
    my = 0,
    mz = 0;
  // Over the sheet SPACE is the pump, not thrust — see pump.js. Letting it
  // also lift would make the timing beside the point.
  const pumping = you.mat !== null;
  // Splatted, nothing steers: it lies there, and gets up, on its own —
  // the keys come back once it is upright again.
  const down = you.splatFor > 0 || you.splat > SPLAT.arms.from;
  for (const k of held) {
    if (down) break;
    if (pumping && k === " ") continue;
    const move = KEYS[k];
    if (!move) continue;
    mx += move[0];
    my += move[1];
    mz += move[2];
  }
  // Normalise the input, not the result: two keys at once is a diagonal, not
  // sqrt(2) times the thrust of one.
  const push = Math.hypot(mx, my, mz);
  const free = you.body === null;
  if (push > 0) {
    const g = ((free ? FREE.accel : MOVE.accel) * dt) / push;
    you.vel.addScaledVector(_right, mx * g);
    you.vel.addScaledVector(_up, my * g);
    you.vel.addScaledVector(_fwd, -mz * g); // the table's -z is "away"
  }
  // Free, there is no down to treat differently: one drag and one cap,
  // all round. Pushing, it STEERS as well: what speed it has swings toward
  // the push at FREE.grip, so a turn comes round in a beat — left to the
  // thrust against the drift's light drag it was a long arc, wider than
  // the planet at full pace — and pushing back is a brake.
  if (free) {
    if (push > 0) {
      const speed = you.vel.length() / push;
      _tmp
        .set(0, 0, 0)
        .addScaledVector(_right, mx * speed)
        .addScaledVector(_up, my * speed)
        .addScaledVector(_fwd, -mz * speed);
      you.vel.lerp(_tmp, 1 - Math.exp(-FREE.grip * dt));
    }
    you.vel.multiplyScalar(Math.exp(-FREE.damp * dt));
    const pace = you.vel.length();
    if (pace > FREE.max) you.vel.multiplyScalar(FREE.max / pace);
    return;
  }
  // Gravity, drag and the speed cap, split into the two axes that want
  // different answers. Horizontal is a glide: it coasts to a stop and has a
  // top speed. Vertical is a fall: near-ballistic and uncapped.
  let climb = you.vel.dot(_up) - FALL.gravity * dt;
  you.vel.addScaledVector(_up, -you.vel.dot(_up));

  you.vel.multiplyScalar(Math.exp(-MOVE.damp * dt));
  const pace = you.vel.length();
  // Swimming is slower going than walking.
  const max = MOVE.max * (1 + (POOL.pace - 1) * you.swimming);
  if (pace > max) you.vel.multiplyScalar(max / pace);

  climb *= Math.exp(-FALL.damp * dt);
  // Thrust has a height, a little over a jump's, and eases up to it: the
  // climb may be no faster than what closes the gap to it at JUMP.ease per
  // second, so it slows into the hover instead of stopping dead against
  // it, and above it only down. A step off a ledge sinks it to the new one.
  if (my > 0 && !pumping) {
    const top = you.floor + JUMP.apex * JUMP.hover;
    climb = Math.min(climb, Math.max(0, (top - you.alt) * JUMP.ease));
  }
  you.vel.addScaledVector(_up, climb);
}

// SPACE tapped off a trampoline: from rest on the ground it is a jump, a
// kick straight up that gravity then has. In the air (or lying splatted)
// the tap does nothing of its own — holding space is thrust, and that
// still works. Over a sheet the tap is the pump's, not this. `quiet` is
// for the hatching jump, which is the hatch's sound and not a jump's.
export function jump(you, quiet = false) {
  if (you.seat || you.mat !== null || !you.resting || you.splatFor > 0) return;
  const climb = you.vel.dot(you.dir);
  you.vel.addScaledVector(you.dir, JUMP.speed - climb);
  you.resting = false;
  if (!quiet) emit("jump");
}

// Sitting down: `e` on the ground beside a seat — within SEAT.reach of its
// edge, on its feet, not mid-jump or flat on its belly — puts the doll on
// it, wherever along it it was standing, its body's underside on the
// seat's top and looking the way the seat faces. It stays sat, held by
// the seat rather than the ground (see bounce), until it stands up: `e`
// again, or any travel key, and it is stood on the ground just clear of
// the seat's front edge. Both say whether they did anything.
export function sitDown(you) {
  if (you.seat || !you.body || !you.resting) return false;
  if (you.mat !== null || you.splatFor > 0 || you.splat > SPLAT.arms.from)
    return false;
  const { seat, dist } = nearestSeat(you);
  if (!seat || dist > SEAT.reach) return false;
  seatSpot(you, seat, you.dir);
  you.seat = seat;
  you.alt =
    you.floor =
    you.peak =
      seat.top + MAT.contact + SEAT.lift - you.m.seat;
  you.vel.set(0, 0, 0);
  you.mat = you.solid = you.matFlight = null;
  you.pumpGrade = -1;
  you.resting = true;
  emit("sit");
  return true;
}

export function standUp(you) {
  const seat = you.seat;
  if (!seat) return false;
  you.seat = null;
  seatExit(you, seat, you.dir);
  you.alt = you.floor = you.peak = STAND.hover - you.m.chin;
  you.vel.set(0, 0, 0);
  you.resting = true;
  emit("stand");
  return true;
}

export const toggleSeat = (you) => (you.seat ? standUp(you) : sitDown(you));

// Travel is a ROTATION of `dir` about the axis it and the velocity define,
// through the angle the arc subtends at the current radius. The velocity,
// the heading and the camera's heading are turned through the same angle,
// which is what keeps "forward" meaning forward after half a lap.
//
// Free, travel is just travel: a straight line through the world.
function travel(you, dt) {
  if (!you.body) {
    you.pos.addScaledVector(you.vel, dt);
    return;
  }
  _up.copy(you.dir);
  const climb = you.vel.dot(_up);
  _tmp.copy(you.vel).addScaledVector(_up, -climb);
  const pace = _tmp.length();
  if (pace > 1e-6) {
    const arc = (pace * dt) / (you.body.radius + you.alt);
    _axis.crossVectors(_up, _tmp).normalize();
    _quat.setFromAxisAngle(_axis, arc);
    you.dir.applyQuaternion(_quat).normalize();
    you.up.applyQuaternion(_quat).normalize();
    you.vel.applyQuaternion(_quat);
    you.heading.applyQuaternion(_quat);
    you.camHeading.applyQuaternion(_quat);
  }
  you.alt += climb * dt;
}

// Nothing of one ground carries over to the next, or to none.
function letGo(you) {
  you.mat = you.solid = you.matFlight = you.seat = null;
  you.pumpGrade = -1;
  you.resting = false;
}

// The gravity shells. Held, the doll is let go the moment it climbs out of
// its ball's shell: the same spot and the same speed, now a point in the
// world with nothing pulling on it. Free, the first ball that catches it
// takes it — drifting into its shell, or, for a ball that only catches by
// touch, its feet coming down to its ground: the spot re-measured from
// that ball's center, its felt up left as it was to come round on its own
// (see settle), and the flight's peak measured afresh so the landing is
// judged by the drop from here. Free, it is also kept inside the sky, the
// way the ceiling keeps it held.
function shells(you) {
  if (you.body) {
    if (you.body.radius + you.alt <= you.body.shell) return;
    you.pos
      .copy(you.body.center)
      .addScaledVector(you.dir, you.body.radius + you.alt);
    const fromPlanet = you.body === BODIES.planet;
    you.body = null;
    letGo(you);
    emit("float");
    // Out through the atmosphere: a front flip.
    if (fromPlanet) startFlip(you);
    return;
  }
  for (const body of you.bodies) {
    _tmp.copy(you.pos).sub(body.center);
    const d = _tmp.length();
    // The feet hang `chin` below the root (negative), so the root is that
    // much further out than the point that has to touch.
    const reach =
      body.catch === "touch" ?
        body.radius + body.touch - you.m.chin
      : body.shell;
    if (d >= reach) continue;
    you.body = body;
    you.dir.copy(_tmp).divideScalar(d);
    you.alt = d - body.radius;
    you.peak = you.alt;
    you.floor = STAND.hover - you.m.chin;
    letGo(you);
    emit("catch", { body });
    return;
  }
  const d = you.pos.length();
  you.pinned = d > SKY_EDGE;
  if (you.pinned) {
    you.pos.multiplyScalar(SKY_EDGE / d);
    _tmp.copy(you.pos).divideScalar(SKY_EDGE);
    const out = you.vel.dot(_tmp);
    if (out > 0) you.vel.addScaledVector(_tmp, -out * (1 + FALL.ceilingBounce));
  }
}

// The felt up comes round to the ground's after the doll drifts into a
// shell. Coming at the moon from the planet the two are all but opposite,
// and there is no shortest way between opposites, so near there it rolls
// about the camera's heading instead — which also keeps the view's up from
// ever sweeping through the way it is looking. Small angles go the short
// way, straight to the ground's up.
function settle(you, dt) {
  const angle = you.up.angleTo(you.dir);
  if (angle < 1e-3) return you.up.copy(you.dir);
  if (angle > Math.PI - 0.05) _axis.copy(you.camHeading);
  else _axis.crossVectors(you.up, you.dir);
  _axis.normalize();
  const step = Math.min(angle, angle * (1 - Math.exp(-TURN.over * dt)));
  _quat.setFromAxisAngle(_axis, step);
  you.up.applyQuaternion(_quat).normalize();
}

// Only the ground and the sky. There is nothing to hit sideways — that is the
// point of a world having no edges. `chin` is measured down from the root
// (negative) and crown is chin + height, so the whole figure clears the
// floor and stays under the ceiling, antennae and all.
//
// Over a sheet the floor IS the sheet, and a landing there is answered by
// whatever you pressed, or failed to press, on the way down.
function bounce(you, dt) {
  // Sitting, the seat is the floor and holds it exactly: no fall, no
  // wall — the seat's own column would otherwise push it back off.
  if (you.seat) {
    you.alt = you.floor;
    you.vel.set(0, 0, 0);
    you.mat = you.solid = null;
    you.resting = true;
    return;
  }
  const climb = you.vel.dot(you.dir);
  // Where it was before this frame's travel — a sheet only catches a doll
  // that was already over it. The sheets and columns know which ball they
  // are on and only answer for the doll's own.
  const mat = (you.mat = matUnder(you, you.alt - climb * dt));
  // A column's top is ground, only higher: a doll over one stands on it.
  const solid = (you.solid =
    mat ? null : solidUnder(you, you.alt - climb * dt));
  // Standing, the floor holds the leg tips off the ground. In a pool it
  // floats, hanging upright with its head out and the water at its neck —
  // or, in one too shallow to float in, wades, stood on the bed its depth
  // down. Flat on its belly it is the
  // body that meets the ground, a good deal lower, so the floor sinks with
  // the splat — and rises again as it gets up.
  // An above-ground pool's water stands `rise` up off the ground, and the
  // doll in it rides that much higher, afloat or wading (see waters.js).
  const dry = STAND.hover - you.m.chin;
  const { depth, rise } = waterUnder(you);
  you.water = depth;
  const surface = POOL.float - you.m.neck + rise;
  you.afloat = depth > 0 && surface > dry - depth + rise;
  const standing = you.afloat ? surface : dry - depth + rise;
  const flat = SPLAT.bed + you.m.skullHalf;
  const floor =
    mat ? matTop(you, mat)
    : solid ? solidTop(you, solid)
    : standing + (flat - standing) * you.splat;
  const high = STAND.ceiling - (you.m.chin + you.m.height);
  you.floor = floor;
  you.peak = Math.max(you.peak, you.alt);

  if (you.alt < floor) {
    you.alt = floor;
    if (climb < 0) {
      const speed = -climb;
      // The press this landing spends, read before matLand spends it.
      const grade = you.pumpGrade;
      // A sheet only bounces a real landing; a brush against it while
      // standing is contact, and spends no press.
      let out =
        mat ?
          speed < MAT.settle ?
            0
          : matLand(you, mat, speed)
        : speed * FALL.restitution;
      // A long fall onto bare ground is a splat: it comes down on its
      // belly, and the ground gives a little of it back. Water is not
      // bare ground: it takes the fall.
      const splat = !mat && !depth && you.peak - floor > SPLAT.drop;
      if (splat) {
        out = speed * SPLAT.bounce;
        you.splatFor = SPLAT.hold;
      }
      // What the landing sounds like. A touch-down softer than LAND.heard
      // is the hover settling, not a landing — and one from a doll that
      // was already stood on its floor (shift held on the ground presses
      // it into the floor every frame) is no landing at all.
      if (mat) {
        if (speed >= MAT.settle && !you.resting) {
          emit("bounce", { speed, grade });
          // The press rings only when the sheet lights for it.
          if (grade > 0) emit("pump", { grade });
        }
      } else if (splat) emit("splat", { speed });
      else if (speed > LAND.heard && !you.resting)
        emit(depth ? "splash" : "land", { speed });
      you.vel.addScaledVector(you.dir, speed + out);
      // Off the mat, a landing is the end of the jump: the travel stops
      // with the fall, instead of skidding on.
      if (!mat && speed > FALL.halt) you.vel.set(0, 0, 0);
      you.peak = floor; // touched down: the next flight measures from here
      // A real launch also picks where it comes down, and the leash latches
      // to it; every landing settles the question until the next launch.
      const launched = mat && out > 2;
      if (launched) matDrift(you, mat, out);
      you.matFlight = launched ? mat : null;
    }
  } else if (you.alt > high) {
    you.alt = high;
    if (climb > 0) {
      you.vel.addScaledVector(you.dir, -climb * (1 + FALL.ceilingBounce));
      // Likewise once: space held at the sky presses it there every frame.
      if (!you.pinned) emit("bump");
    }
  }
  you.pinned = you.alt >= high;

  // Resting. Gravity pushes down every frame and the floor pushes back every
  // frame, and the two never quite cancel — so a doll standing still buzzes
  // unless the last of the vertical motion is taken off it.
  // Every other sheet is a wall from the side, and so is every column;
  // the trees' leaf is softer — see foliage.js.
  matWall(you);
  solidWall(you);
  foliage(you, dt);

  you.resting = false;
  if (you.alt <= floor + 0.02) {
    const now = you.vel.dot(you.dir);
    if (Math.abs(now) < FALL.settle) {
      you.vel.addScaledVector(you.dir, -now);
      you.resting = true;
    }
  }
}

// Shortest way round, for vectors instead of angles: lerping two unit
// vectors and re-normalising takes the short arc for free, and flattening
// back onto the tangent plane keeps a heading a heading. Reads _up.
function turnToward(current, target, rate, dt) {
  // Exactly reversed there is no short arc, and the lerp goes through
  // nothing and sticks: nudged off the line, it swings round instead.
  if (current.dot(target) < -0.999)
    current.addScaledVector(_axis.crossVectors(_up, target), 0.05);
  current.lerp(target, 1 - Math.exp(-rate * dt));
  current.addScaledVector(_up, -current.dot(_up));
  if (current.lengthSq() < 1e-8) current.copy(target); // exactly reversed
  current.normalize();
}

// From the flight state to the doll: where it stands, which way it faces,
// which way its ropes hang, the lean and the bob.
function pose(you, dt) {
  if (you.body) {
    you.pos
      .copy(you.body.center)
      .addScaledVector(you.dir, you.body.radius + you.alt);
    settle(you, dt);
  }

  // It comes round to face the way it is going and keeps that heading when
  // it stops. Below a crawl the heading is left alone; stopped, it comes
  // back round to face you, and takes its time about it. All of it against
  // the FELT up: on the ground the ground's, and through a settle the one
  // it is rolling to.
  _up.copy(you.up);
  _tmp.copy(you.vel).addScaledVector(_up, -you.vel.dot(_up));
  const pace = _tmp.length();
  if (you.seat) {
    // Sat down, it looks the way the seat faces.
    seatFacing(you.seat, _tmp).addScaledVector(_up, -_tmp.dot(_up));
    turnToward(you.heading, _tmp.normalize(), TURN.toward, dt);
  } else if (pace > TURN.crawl)
    turnToward(you.heading, _tmp.divideScalar(pace), TURN.toward, dt);
  else
    turnToward(you.heading, _tmp.copy(you.camHeading).negate(), TURN.home, dt);

  // Free, it swims: still on its feet, but leaning into the way it is
  // going — the faster, the further, up to SWIM.tilt — like a diver
  // kicking off. Drifting, it hangs upright. Chased both ways, so it
  // leans in on being let go and straightens on landing — and the same
  // blend is what eases the weightlessness below in and out.
  const swimGoal = you.body ? 0 : 1;
  you.swim += (swimGoal - you.swim) * (1 - Math.exp(-SWIM.rate * dt));
  const zeroG = you.swim;

  // Down, for the limbs: the pull is at the middle of the ball it is on —
  // and only a whisper of it once the doll is free, so the arms and legs
  // float where they were left instead of hanging. The vector's length is
  // the share of gravity (see advanceRope()); its damping goes slack with
  // it so a limb keeps coasting after the doll has stopped.
  you.doll.down
    .copy(_up)
    .negate()
    .multiplyScalar(1 - zeroG * (1 - ZERO_G.weight));
  you.doll.ropeDamping =
    zeroG > 1e-3 ?
      you.doll.cfg.rope.damping +
      (ZERO_G.damping - you.doll.cfg.rope.damping) * zeroG
    : null;

  // Standing on a ball is a whole orientation, not a yaw.
  const root = you.doll.root;
  _right.crossVectors(_up, you.heading);
  root.quaternion.setFromRotationMatrix(
    _basis.makeBasis(_right, _up, you.heading),
  );
  if (you.swim > 1e-3) {
    _tmp.copy(you.vel).addScaledVector(_up, -you.vel.dot(_up)); // across
    const across = _tmp.length();
    const tilt = SWIM.tilt * Math.min(1, across / SWIM.at) * you.swim;
    if (across > 1e-6 && tilt > 1e-4) {
      // About the axis across both its up and the way it goes: tips the
      // up toward the travel, in the world, whatever way it faces.
      _axis.crossVectors(_up, _tmp.divideScalar(across));
      root.quaternion.premultiply(_quat.setFromAxisAngle(_axis, tilt));
    }
  }
  // The dive: flying at a hoop, it lies on its belly along the line to the
  // hoop's middle — crown that way, belly down the felt up — chased there
  // while the hoop holds it and back off once it is through.
  const diveGoal = you.diveHold ? 1 : 0;
  you.diveHold = false;
  you.dive += (diveGoal - you.dive) * (1 - Math.exp(-DIVE.rate * dt));
  if (you.dive > 1e-3) {
    // Belly (+z) down: the felt down, less its part along the line.
    _tmp.copy(_up).negate().addScaledVector(you.diveTo, _up.dot(you.diveTo));
    if (_tmp.lengthSq() < 1e-8) _tmp.copy(you.heading);
    _tmp.normalize();
    _axis.crossVectors(you.diveTo, _tmp);
    _quat.setFromRotationMatrix(_basis.makeBasis(_axis, you.diveTo, _tmp));
    root.quaternion.slerp(_quat, you.dive);
  }
  // The bank: free, the turn this frame — the keys' and the drag's — as a
  // rate, eased, rolls it about its heading into the turn. Turning left
  // (about its up) tips its up left, away from heading x up, its right.
  const yaw = you.turned / Math.max(dt, 1e-4);
  you.turned = 0;
  const bankGoal = you.body ? 0 : clamp(yaw / BANK.at, -1, 1);
  you.bank += (bankGoal - you.bank) * (1 - Math.exp(-BANK.rate * dt));
  if (Math.abs(you.bank) > 1e-3)
    root.quaternion.premultiply(
      _quat.setFromAxisAngle(you.heading, -you.bank * BANK.doll),
    );
  // The flight lean, chased rather than set.
  const leanGoal = -clamp(you.vel.dot(_up) / LEAN.at, -1, 1) * LEAN.max;
  you.lean += (leanGoal - you.lean) * (1 - Math.exp(-LEAN.rate * dt));
  if (Math.abs(you.lean) > 1e-3)
    root.quaternion.multiply(_quat.setFromAxisAngle(_basisX, you.lean));
  // The tricks, on top of the lean. Each is a whole number of turns eased
  // in and out, so it starts from rest and lands back exactly where it
  // was — about its own up for the spin, its own side for the flip. Both
  // run on `dt` here rather than on a clock, so a paused frame pauses them.
  tricks(you, dt);
  // The splat rides on top: chased flat while the timer runs — the timer
  // only counts down once it has stopped bouncing — and chased back upright
  // after, so it rolls onto its belly through the rebounds and then picks
  // itself up.
  if (you.splatFor > 0 && Math.abs(you.vel.dot(_up)) < FALL.settle)
    you.splatFor -= dt;
  const splatGoal = you.splatFor > 0 ? 1 : 0;
  you.splat += (splatGoal - you.splat) * (1 - Math.exp(-SPLAT.rate * dt));
  if (you.splat > 1e-3)
    root.quaternion.multiply(
      _quat.setFromAxisAngle(
        _basisX,
        (you.splat * SPLAT.pitch * Math.PI) / 180,
      ),
    );
  // Afloat, it takes the water's hold — upright, or tipped forward
  // POOL.pitch if any — chased there and back the way the splat is, on top
  // of everything above.
  const afloatGoal = you.afloat && you.body ? 1 : 0;
  you.swimming += (afloatGoal - you.swimming) * (1 - Math.exp(-POOL.rate * dt));
  if (you.swimming > 1e-3)
    root.quaternion.multiply(
      _quat.setFromAxisAngle(
        _basisX,
        (you.swimming * POOL.pitch * Math.PI) / 180,
      ),
    );
  // Down on its belly the arms are planted: bent at the elbow, upper arm
  // out to the side and the hand on the ground. As it gets up they push —
  // the upper arm swings down under it and the arm straightens out. The
  // pose lets go as it comes upright and the arms drop back to hanging.
  //
  // Not straight away, though: for the first `splay` of the rest it lies
  // there with its arms flung straight out; then the elbows bend and it
  // pushes.
  const A = SPLAT.arms;
  if (you.splat > A.from) {
    const ap = you.armPose;
    ap.right.copy(_right);
    ap.upper.copy(_right).addScaledVector(you.heading, A.forward);
    if (you.splatFor > SPLAT.hold * (1 - A.splay)) {
      ap.upper.addScaledVector(_up, -A.drop).normalize();
      ap.lower.copy(ap.upper); // straight: same line past the elbow
    } else {
      const push = 1 - you.splat;
      ap.upper.addScaledVector(_up, -(A.drop + A.push * push)).normalize();
      ap.lower.copy(_up).negate();
    }
    ap.weight = A.hold * Math.min(1, (you.splat - A.from) / A.fade);
    you.doll.armPose = ap;
  } else you.doll.armPose = null;
  // Sat down, the legs bend at the knee: the thigh along the seat, tipped
  // up a little so it rests on it rather than in it, and the shin down off
  // the front edge. Chased on and off, so it folds as it sits and unfolds
  // as it stands.
  const sitGoal = you.seat ? 1 : 0;
  you.sit += (sitGoal - you.sit) * (1 - Math.exp(-SEAT.legs.rate * dt));
  const G = SEAT.legs;
  if (you.sit > G.from) {
    const lp = you.legPose;
    lp.right.copy(_right);
    lp.upper.copy(you.heading).addScaledVector(_up, G.thigh).normalize();
    lp.lower
      .copy(_up)
      .negate()
      .addScaledVector(you.heading, G.shin)
      .normalize();
    lp.weight = G.hold * Math.min(1, (you.sit - G.from) / G.fade);
    you.doll.legPose = lp;
  } else if (you.swimming > POOL.legs.from) {
    // Swimming, the legs hang under it and tread: straight down, swung
    // forward and back with the beat, the shin trailing the thigh a
    // little.
    const K = POOL.legs;
    you.kick += K.beat * 2 * Math.PI * dt;
    const lp = you.legPose;
    lp.right.copy(_right);
    lp.upper
      .copy(_up)
      .negate()
      .addScaledVector(you.heading, Math.sin(you.kick) * K.kick)
      .normalize();
    lp.lower
      .copy(_up)
      .negate()
      .addScaledVector(you.heading, Math.sin(you.kick - 0.8) * K.kick)
      .normalize();
    lp.weight = K.hold * Math.min(1, (you.swimming - K.from) / K.fade);
    you.doll.legPose = lp;
  } else you.doll.legPose = null;

  // A bob on top of the traveled position, quicker and a little deeper the
  // faster it goes — and free, slowed right down into a drift. Sat down,
  // most of it goes: a body on a seat does not bounce. Afloat it is the
  // water's bob instead, slow and even whatever the pace — see POOL.bob.
  const haste = pace / MOVE.max;
  const seated = you.seat ? SEAT.bob : 1;
  const walkRate =
    (you.bobRate + haste * BOB.swimRate) * (1 + (ZERO_G.bobRate - 1) * zeroG);
  const walkAmp =
    (BOB.rest + haste * BOB.swim) * seated * (1 + (ZERO_G.bobAmp - 1) * zeroG);
  const swimRate = POOL.bob.rate * 2 * Math.PI;
  you.bobPhase += (walkRate + (swimRate - walkRate) * you.swimming) * dt;
  root.position
    .copy(you.pos)
    .addScaledVector(
      _up,
      Math.sin(you.bobPhase) *
        (walkAmp + (POOL.bob.amp - walkAmp) * you.swimming),
    );
}

// One trick's angle: `turns` whole turns, smoothstepped over `time`.
const ease = (t) => t * t * (3 - 2 * t);
function trickAngle(t, T) {
  return T.turns * 2 * Math.PI * ease(Math.min(1, t / T.time));
}

function tricks(you, dt) {
  const root = you.doll.root;
  if (you.spin >= 0) {
    you.spin += dt;
    // Halfway, at full speed, is when it stops being one doll and starts
    // being the next: the swap is asked for once, and carried over.
    if (!you.spun && you.spin >= TRICKS.spin.time / 2) {
      you.spun = true;
      if (you.spinSwap) you.swapDue = true;
    }
    root.quaternion.multiply(
      _quat.setFromAxisAngle(_basisY, trickAngle(you.spin, TRICKS.spin)),
    );
    if (you.spin >= TRICKS.spin.time) {
      you.spin = -1;
      you.spun = false;
    }
  }
  if (you.flip >= 0) {
    you.flip += dt;
    // Positive about the side axis tips the head forward: a FRONT flip.
    root.quaternion.multiply(
      _quat.setFromAxisAngle(_basisX, trickAngle(you.flip, TRICKS.flip)),
    );
    if (you.flip >= TRICKS.flip.time) you.flip = -1;
  }
}

// `r`: the spin that turns this doll into the next. Ignored mid-spin.
// `swap` is whether the doll halfway through is the next one — `r`'s spin
// swaps, a ring's is just the turn.
export function startSpin(you, swap = true) {
  if (you.spin >= 0) return;
  you.spin = 0;
  you.spinSwap = swap;
  emit("spin");
}

// The front flip: thrown on the way out of the atmosphere. Ignored
// mid-flip.
export function startFlip(you) {
  if (you.flip >= 0) return;
  you.flip = 0;
}

// Placed so the doll lands where a camera at this tilt is already looking:
// back along the heading by the cosine, up by the sine. Off `pos`, not the
// drawn position — the bob belongs to the doll, and a camera that chases it
// reads as the whole world twitching.
function followCam(you, camera, dt) {
  _up.copy(you.up);
  // Held, the tilt comes home — to CAMERA.pitch, or the ball's own if it
  // has one (indoors the view is steeper — see interior/objects.js);
  // free, the tilt is the frame's (see turnCamera) and this is left alone.
  if (you.body) {
    const home = you.body.camera?.pitch ?? CAMERA.pitch;
    you.camPitch += (home - you.camPitch) * (1 - Math.exp(-CAMERA.level * dt));
  }
  const pitch = you.camPitch;
  const eye = you.m.chin + you.m.height * CAMERA.eye;
  _tmp
    .copy(you.pos)
    .addScaledVector(_up, eye + you.camDist * Math.sin(pitch))
    .addScaledVector(you.camHeading, -you.camDist * Math.cos(pitch));
  camera.position.lerp(_tmp, 1 - Math.exp(-CAMERA.chase * dt));
  // The horizon tips as the doll walks, and the only up that keeps the view
  // level is the doll's own — the felt one, so a settle is a roll the view
  // goes through with it.
  camera.up.copy(_up);
  _tmp.copy(you.pos).addScaledVector(_up, eye);
  // Banked, the horizon tips with the doll: the up is rolled about the
  // line of sight, left into a left turn.
  if (Math.abs(you.bank) > 1e-3) {
    _axis.copy(_tmp).sub(camera.position).normalize();
    camera.up.applyAxisAngle(_axis, -you.bank * BANK.camera);
  }
  camera.lookAt(_tmp);
}

// The camera put straight where followCam would settle it. A fresh Canvas's
// camera starts wherever the Canvas prop left it, and eased in from there
// it reads as a swoop in over the first half second — going indoors, or
// coming back out — so a new flyer's first frame snaps it instead.
export function snapCam(you, camera) {
  followCam(you, camera, 1e6);
}

// Held where it is — under the card, at the top of the hatching jump. It
// hangs there stood upright and idling: its rest bob, coming round to
// face you, the camera settling on it. Its velocity is let go, so when it
// is released it drops from rest.
export function hold(you, camera, dt) {
  you.vel.set(0, 0, 0);
  pose(you, dt);
  followCam(you, camera, dt);
}

// No `camera`, and the view is someone else's — the orbit while editing
// indoors (see interior/Interior.jsx) — so it is neither turned nor
// followed; the doll still flies.
export function stepFly(you, held, camera, dt) {
  if (camera) lookAround(you, held, camera, dt);
  steer(you, held, dt);
  matHoming(you, dt);
  travel(you, dt);
  shells(you);
  if (you.body) bounce(you, dt);
  pose(you, dt);
  if (camera) followCam(you, camera, dt);
}
