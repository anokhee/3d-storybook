import * as THREE from "three";

import { PLANET } from "../nouns/planet/objects.js";
import { touched } from "./foliage.js";

// Where the player's doll is, in world space, written every frame by Player
// and read by whatever gives way to it. `at` is its lowest point, for the
// fields that part under it (the grass, the flowers). `body` is the whole
// figure as a capsule — chin to crown along its up, `radius` wide — for the
// things it pushes past (the garland's festoons). Parked far away while
// nobody is flying.
export const TREAD = {
  at: new THREE.Vector3(0, 1e6, 0),
  body: {
    foot: new THREE.Vector3(0, 1e6, 0),
    head: new THREE.Vector3(0, 1e6, 0),
    radius: 0,
  },
};

const rad = (deg) => (deg * Math.PI) / 180;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Scratch for the tread pass — written before read, every frame.
const _tread = new THREE.Vector3();
const _treadDir = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _lean = new THREE.Matrix4();
const _shift = new THREE.Matrix4();

// A planted InstancedMesh that gives way underfoot: its instances as they
// stand at rest, for the tread pass to lean from and restore to. `dirs` is
// each instance's bearing from the planet's center and `roots` the point in
// the ground it is hinged at — a grass strand's own origin, a flower's stem
// foot — both indexed the way the mesh is.
// `canopies`, for a field that rustles rather than bends, is each
// instance's canopy as registered with foliage.js — see rustle.
export function plant(mesh, dirs, roots, canopies = null) {
  return {
    mesh,
    dirs,
    roots,
    canopies,
    rest: mesh.instanceMatrix.array.slice(),
    // The instances leaning right now: index -> how far, eased — or, for
    // a rustling field, index -> { energy, phase }.
    active: new Map(),
    wasLeaning: false,
  };
}

// One frame of a wood rustling as the doll pushes through it: every
// canopy the doll is in (see foliage.js) is set swinging — rocked about
// its root, away from the doll and back, `tilt` degrees at most, `wobble`
// radians a second — and left to die away at `rate` once it has gone. As
// tread, only the instances moving are rewritten.
export function rustle(field, { tilt, rate, wobble }, dt) {
  const { mesh, dirs, roots, canopies, rest, active } = field;
  if (!canopies) return;
  const now = performance.now();
  for (let i = 0; i < mesh.count; i++) {
    const c = canopies[i];
    const hit = c && touched(c, now);
    let s = active.get(i);
    if (!hit && !s) continue;
    if (!s) active.set(i, (s = { energy: 0, phase: 0 }));
    if (hit) s.energy = 1;
    else s.energy *= Math.exp(-rate * dt);
    s.phase += wobble * dt;
    if (s.energy < 0.01) {
      mesh.instanceMatrix.array.set(rest.subarray(i * 16, i * 16 + 16), i * 16);
      active.delete(i);
      continue;
    }
    // About the axis across its up and the way it was pushed, so a
    // positive swing carries the crown the way the doll pushed it.
    const dir = dirs[i];
    _axis.crossVectors(dir, c.away);
    if (_axis.lengthSq() < 1e-10) continue;
    _axis.normalize();
    _lean.makeRotationAxis(_axis, rad(tilt) * s.energy * Math.sin(s.phase));
    const root = roots[i];
    _m.fromArray(rest, i * 16);
    _m.premultiply(_shift.makeTranslation(-root.x, -root.y, -root.z))
      .premultiply(_lean)
      .premultiply(_shift.makeTranslation(root.x, root.y, root.z));
    mesh.setMatrixAt(i, _m);
  }
  if (active.size || field.wasLeaning) mesh.instanceMatrix.needsUpdate = true;
  field.wasLeaning = active.size > 0;
}

// One frame of a field giving way under the player: every instance within
// `reach` of the doll's lowest point is tipped away from it about its own
// root — physically, by rewriting its instance matrix — by more the closer
// it is, and eased both ways so it bows as the doll arrives and springs back
// after. Only the instances near the doll are touched each frame; the rest
// of the field is never rewritten.
export function tread(field, { reach, tilt, rate }, dt) {
  const { mesh, dirs, roots, rest, active } = field;
  const R = PLANET.radius;
  // Near, as an angle between bearings — cheaper than a distance per
  // instance, and the same test on a ball.
  const near = Math.cos(reach / R);
  _tread.copy(TREAD.at);
  const treadR = _tread.length();
  _treadDir.copy(_tread).divideScalar(treadR || 1);
  // How high the doll is over the field: high up, the reach shrinks to
  // nothing so a flier does not comb the field from the sky.
  const hover = clamp01(1 - (treadR - R) / reach);
  const ease = 1 - Math.exp(-rate * dt);

  for (let i = 0; i < mesh.count; i++) {
    const dir = dirs[i];
    const along = dir.dot(_treadDir);
    let goal = 0;
    if (hover > 0 && along > near) {
      // Ground distance to the tread, 0..1 across the reach, eased so the
      // edge of the patch fades rather than steps.
      const t = (Math.acos(Math.min(1, along)) * R) / reach;
      const w = 1 - t * t * (3 - 2 * t);
      goal = w * hover;
    }
    const was = active.get(i);
    if (goal === 0 && was === undefined) continue;
    const now = (was ?? 0) + (goal - (was ?? 0)) * ease;
    if (now < 0.005 && goal === 0) {
      // Back at rest: put the planted matrix back and forget it.
      mesh.instanceMatrix.array.set(rest.subarray(i * 16, i * 16 + 16), i * 16);
      active.delete(i);
      continue;
    }
    active.set(i, now);
    // Tip AWAY from the doll, about the root, around the axis across both
    // the instance's up and the way to the doll.
    _axis.crossVectors(_treadDir, dir);
    if (_axis.lengthSq() < 1e-10) continue; // dead underfoot: no way to lean
    _axis.normalize();
    _lean.makeRotationAxis(_axis, rad(tilt) * now);
    // Lean about the root by moving it to the origin, turning, and moving
    // it back out again.
    const root = roots[i];
    _m.fromArray(rest, i * 16);
    _m.premultiply(_shift.makeTranslation(-root.x, -root.y, -root.z))
      .premultiply(_lean)
      .premultiply(_shift.makeTranslation(root.x, root.y, root.z));
    mesh.setMatrixAt(i, _m);
  }
  if (active.size || field.wasLeaning) mesh.instanceMatrix.needsUpdate = true;
  field.wasLeaning = active.size > 0;
}
