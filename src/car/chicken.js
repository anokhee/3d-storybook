/* ============================================================
   the chicken from chickens3d (Desktop/chickens3d/main.js), lifted out of
   its page so it can be stood anywhere: the same blob torso as the frog
   (blob.js), the scalloped white icing cap, a four-sided beak, bead eyes,
   bent-plate wings hinged at the shoulders, and orange shanks on three-toed
   feet. Faces +X. Up is +Y.

   `finish(color, extra)` makes every material, so a page can hand in its
   own (chickens3d's standard, or a toon); `extra.flatShading` asks for the
   folded-paper facets on the beak, legs and wings.
   ============================================================ */
import * as THREE from "three";
import { buildBlobGeometry } from "./blob.js";

// colors borrowed from the 2D folk-art palette (+ one orange for the legs)
export const CHICKEN_COLORS = {
  body: 0xf3e3b4, // warm cream
  head: 0xffffff, // white "icing" cap
  beak: 0xf08a24, // orange, same as the legs, like a toy
  wing: 0xffffff, // white, matching the head cap
  eye: 0x232120, // near black
  legs: 0xf08a24, // orange
};

// the knobs. Neck length is the distance between the two cut faces: the
// body's cut plane and the head's cut plane (which passes through the head's
// center, since the head is sliced in half).
export const CHICKEN_PARAMS = {
  bodySize: 1.0,
  headSize: 0.55,
  neckLength: 0.6,
  resolution: 30, // marching-cubes grid: lower = chunkier facets
  // wing, in units of the body radius (so it scales with the body), same
  // parameters as the 2D version: a circle on the body + a tip point
  wingSize: 0.32, // circle radius
  wingTipX: 0.05, // how far BACK the tip reaches
  wingTipY: -0.75, // how far UP the tip reaches (negative: down, so the wing hangs like an arm)
  scallops: 4, // scallops on the trailing edge, tip -> bottom of circle
  wingRaise: 0.35, // 0 = resting flat against the body, 1 = straight out (T-pose)
};
const SHOULDER_ELEV = 0.55; // radians: how far the resting arm's plate leans in to follow the body at the shoulder
const SHOULDER_UP = 0.6; // shoulder height as a fraction of the body's half-height, from its center
const BODY_SHAPE = new THREE.Vector3(0.85, 1.15, 0.85); // the body is an upright egg: these scale the body radius
const SCALLOP_RATIO = 0.5; // scallop height as a fraction of its width (same as 2D)
// the neck runs forward (+X) and up from the body, like the 2D version
const NECK_DIR = new THREE.Vector3(0.12, 1, 0).normalize();
const UP = new THREE.Vector3(0, 1, 0);

const standard = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

export function buildChicken(overrides = {}, finish = standard) {
  const params = { ...CHICKEN_PARAMS, ...overrides };
  const K = CHICKEN_COLORS;
  // flat shading keeps the icosphere facets visible — a low-poly "folded paper" look
  const mat = (color) => finish(color, { roughness: 0.85, flatShading: true });
  const addMesh = (parent, geo, material, pos) => {
    const m = new THREE.Mesh(geo, material);
    m.position.copy(pos);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const chicken = new THREE.Group();
  // legs: a chicken's knee is hidden up in the feathers, so what shows is the
  // shank, leaving the belly at a forward angle, with the foot flat below it
  const toeLen = 0.38, toeR = 0.035;
  const shankLen = 0.75, shankTilt = 0.12; // radians forward of vertical
  const legH = toeR * 2 + shankLen * Math.cos(shankTilt); // hip height: shank bottom sits on the toes
  // everything above the hips sits in the torso, which bobs when walking and
  // pitches in the air; the legs hang from hip pivots directly on the chicken
  const torso = new THREE.Group();
  chicken.add(torso);

  // body + neck + head: ONE continuous surface (see blob.js)
  const blob = addMesh(torso, new THREE.BufferGeometry(), finish(K.body), new THREE.Vector3());
  // the head "icing": the blob's own surface, cut exactly along a scalloped
  // line and pushed outward as a thin solid shell with a visible rim
  const icing = addMesh(
    torso,
    new THREE.BufferGeometry(),
    finish(K.head, { side: THREE.DoubleSide }),
    new THREE.Vector3(),
  );
  const ICING = 0.035; // shell thickness
  const bodyCenter = new THREE.Vector3();
  const headCenter = new THREE.Vector3(); // where the head's center lands, for the beak and eyes
  function buildBlob(bodyR, headR, len) {
    const r = buildBlobGeometry({
      bodyR,
      bodyShape: BODY_SHAPE,
      headR,
      headShape: new THREE.Vector3(1, 1, 1),
      neckDir: NECK_DIR,
      neckLen: len,
      resolution: params.resolution,
      cap: { scallops: Math.round(params.scallops) * 2, drip: 0.25 * bodyR, thick: ICING },
    });
    blob.geometry.dispose();
    blob.geometry = r.geometry;
    blob.position.copy(bodyCenter);
    icing.geometry.dispose();
    icing.geometry = r.cap;
    icing.position.copy(bodyCenter);
    headCenter.copy(bodyCenter).add(r.headCenter);
    return r;
  }
  // eyes: two black beads set into the sides of the head
  const eyeMat = finish(K.eye, { roughness: 0.35 });
  const eyes = [-1, 1].map((side) => {
    const eye = addMesh(torso, new THREE.SphereGeometry(1, 16, 12), eyeMat, new THREE.Vector3());
    eye.userData.side = side;
    return eye;
  });

  // wing: the 2D silhouette extruded into a thin flat plate, hinged at the
  // shoulder. Path (in the wing's own plane, x = forward, y = up, with the
  // TOP of the circle at the origin, since that's where it hangs from):
  //   top of circle (shoulder) -> straight leading edge to the tip -> scalloped
  //   trailing edge back to the bottom of the circle -> front arc back up.
  function wingShape(r, tipX, tipY, n) {
    const N = { x: 0, y: 0 }, S = { x: 0, y: -2 * r }, tip = { x: -tipX, y: tipY - r };
    const sh = new THREE.Shape();
    sh.moveTo(N.x, N.y);
    sh.lineTo(tip.x, tip.y);
    for (let i = 0; i < n; i++) {
      const p0 = { x: tip.x + ((S.x - tip.x) * i) / n, y: tip.y + ((S.y - tip.y) * i) / n };
      const p1 = { x: tip.x + ((S.x - tip.x) * (i + 1)) / n, y: tip.y + ((S.y - tip.y) * (i + 1)) / n };
      const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len;
      const m = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      if (nx * m.x + ny * (m.y + r) < 0) { nx = -nx; ny = -ny; } // point away from the circle's center
      const d = len * SCALLOP_RATIO;
      sh.quadraticCurveTo(m.x + nx * d, m.y + ny * d, p1.x, p1.y);
    }
    sh.absarc(0, -r, r, -Math.PI / 2, Math.PI / 2, false); // S -> front -> N
    sh.closePath();
    return sh;
  }
  const WING_THICK = 0.07, WING_BANDS = 6; // plate thickness; flat strips the wing bends in
  const wingMat = mat(K.wing);
  wingMat.roughness = 0.6;
  wingMat.side = THREE.DoubleSide; // the bent plate is built by hand, so don't depend on winding

  // clip a convex polygon to the horizontal band yMin <= y <= yMax (Sutherland-Hodgman)
  function clipBand(poly, yMin, yMax) {
    const at = (a, b, y) => ({ x: a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y), y });
    const clip = (pts, inside, y) => {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (inside(a)) out.push(a);
        if (inside(a) !== inside(b)) out.push(at(a, b, y));
      }
      return out;
    };
    let p = clip(poly, (q) => q.y >= yMin, yMin);
    if (p.length) p = clip(p, (q) => q.y <= yMax, yMax);
    return p;
  }

  // the wing mesh: the silhouette, triangulated, sliced into horizontal bands,
  // given thickness, then BENT around the body (curvature = 1/radius; 0 is a
  // flat plate). Every vertex sits on a band line, so each band is a flat
  // strip after bending: a few clean facets rather than a smooth tube.
  function wingGeometry(r, tipX, tipY, n, curvature, side) {
    const pts = wingShape(r, tipX, tipY, n).getPoints(6).map((p) => ({ x: p.x, y: p.y }));
    const last = pts[pts.length - 1];
    if (Math.hypot(pts[0].x - last.x, pts[0].y - last.y) < 1e-9) pts.pop(); // closed path repeats its start
    const tris = THREE.ShapeUtils.triangulateShape(pts.map((p) => new THREE.Vector2(p.x, p.y)), []);
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const dy = (maxY - minY) / WING_BANDS + 1e-9;
    const bandOf = (y) => Math.floor((y - minY) / dy);
    const h = WING_THICK / 2;

    const bend = (x, y, z) => {
      z *= side; // work in the +z wing's frame, mirror back after
      let ny = y, nz = z;
      if (curvature > 1e-6) {
        const rho = 1 / curvature, a = y * curvature; // arc length y -> angle around the body
        ny = (rho + z) * Math.sin(a);
        nz = (rho + z) * Math.cos(a) - rho; // hanging part (y < 0) curls inward
      }
      return [x, ny, nz * side];
    };
    const out = [];
    const push = (p, z) => out.push(...bend(p.x, p.y, z));
    const tri = (a, b, c, z) => { push(a, z); push(b, z); push(c, z); };

    // faces: every triangle is cut at the band lines it crosses
    for (const [ia, ib, ic] of tris) {
      const t = [pts[ia], pts[ib], pts[ic]];
      const ys = t.map((p) => p.y);
      for (let k = bandOf(Math.min(...ys)); k <= bandOf(Math.max(...ys)); k++) {
        const poly = clipBand(t, minY + k * dy, minY + (k + 1) * dy);
        for (let i = 1; i + 1 < poly.length; i++) {
          tri(poly[0], poly[i], poly[i + 1], h);
          tri(poly[0], poly[i], poly[i + 1], -h);
        }
      }
    }
    // rim: each outline edge, split at the band lines, becomes a quad between the two faces
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dir = Math.sign(b.y - a.y);
      const cuts = [];
      for (let k = Math.min(bandOf(a.y), bandOf(b.y)) + 1; k <= Math.max(bandOf(a.y), bandOf(b.y)); k++) {
        const y = minY + k * dy;
        cuts.push({ x: a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y), y });
      }
      cuts.sort((p, q) => (p.y - q.y) * dir); // walk them in a -> b order
      const chain = [a, ...cuts, b];
      for (let j = 0; j + 1 < chain.length; j++) {
        const p = chain[j], q = chain[j + 1];
        push(p, h); push(q, h); push(q, -h);
        push(p, h); push(q, -h); push(p, -h);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
    geo.computeVertexNormals();
    return geo;
  }
  // each wing hangs off a pivot at its shoulder; raising it is one rotation
  // about the forward (X) axis through that point
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    const plate = addMesh(pivot, new THREE.BufferGeometry(), wingMat, new THREE.Vector3());
    pivot.userData.side = side;
    torso.add(pivot);
    return { pivot, plate };
  });

  // beak: a 4-sided cone. Its 4 base corners sit on the X/Z axes, so once the
  // axis is turned from +Y to +X the corners land on Y/Z: a diamond seen head-on.
  const beak = addMesh(torso, new THREE.ConeGeometry(1, 1, 4).translate(0, 0.5, 0), mat(K.beak), new THREE.Vector3());
  beak.quaternion.setFromUnitVectors(UP, new THREE.Vector3(1, 0, 0)); // point forward

  // legs: side by side (spread along Z), from the belly to the floor, each with a foot
  const legMat = mat(K.legs);
  const hips = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(0, legH, side * 0.28);
    hip.rotation.z = shankTilt;
    hip.userData.side = side;
    chicken.add(hip);
    addMesh(hip, new THREE.CylinderGeometry(0.055, 0.05, shankLen, 8), legMat, new THREE.Vector3(0, -shankLen / 2, 0));
    const foot = new THREE.Group();
    foot.position.set(0, -shankLen, 0);
    foot.rotation.z = -shankTilt;
    hip.add(foot);
    // three toes fanning forward from the base of the shank, plus a shorter back talon
    const toeGeo = new THREE.CylinderGeometry(toeR, toeR * 0.8, toeLen, 6).translate(0, toeLen / 2, 0); // base at origin
    for (const spread of [-1, 0, 1]) {
      const toe = addMesh(foot, toeGeo, legMat, new THREE.Vector3(0, -toeR, 0));
      toe.rotation.set(0, spread * 0.45, -Math.PI / 2, "YZX"); // lay it forward (+X) then fan it around Y
      toe.receiveShadow = false;
    }
    const talon = addMesh(foot, toeGeo, legMat, new THREE.Vector3(0, -toeR, 0));
    talon.rotation.z = Math.PI / 2; // lay it backward (-X)
    talon.scale.y = 0.55; // shorter than the front toes (y = cylinder axis = length)
    talon.receiveShadow = false;
    return hip;
  });

  // raise = 0: the wing is bent to the body's radius and lies tangent at the
  // shoulder, wrapping the body's side. raise = 1: a flat plate sticking
  // straight out to the side (T-pose).
  let currentRaise = -1;
  function setWingRaise(raise) {
    if (raise === currentRaise) return;
    currentRaise = raise;
    const bodyR = params.bodySize;
    const wr = bodyR * params.wingSize;
    const Rc = bodyR * BODY_SHAPE.x * 0.95 + WING_THICK / 2 + 0.015; // the body's radius the resting arm curls around
    const shoulderOut = bodyR * BODY_SHAPE.x * Math.sqrt(1 - SHOULDER_UP * SHOULDER_UP) + WING_THICK / 2 + 0.015;
    const curvature = (1 - raise) / Rc;
    const angle = SHOULDER_ELEV + raise * (Math.PI / 2 - SHOULDER_ELEV);
    for (const { pivot, plate } of wings) {
      const side = pivot.userData.side;
      plate.geometry.dispose();
      plate.geometry = wingGeometry(wr, bodyR * params.wingTipX, bodyR * params.wingTipY, Math.round(params.scallops), curvature, side);
      pivot.position.set(
        bodyCenter.x - bodyR * 0.05,
        bodyCenter.y + bodyR * BODY_SHAPE.y * SHOULDER_UP,
        side * shoulderOut,
      );
      pivot.rotation.x = -side * angle;
    }
  }

  function rebuild() {
    currentRaise = -1; // other params may have changed; force the wings to rebuild
    const bodyR = params.bodySize;
    const headR = params.headSize;
    // body sits on top of the legs
    bodyCenter.set(0, legH + bodyR * BODY_SHAPE.y * 0.9, 0);
    const len = Math.max(params.neckLength, 0.001);
    buildBlob(bodyR, headR, len); // also sets headCenter
    setWingRaise(params.wingRaise);
    // beak: base buried inside the front of the head, slightly below center, sized relative to the head
    beak.scale.set(headR * 0.42, headR * 1.3, headR * 0.42);
    beak.position.set(headCenter.x + headR * 0.55, headCenter.y - headR * 0.1, 0);
    // eyes: on the head's surface, forward and a little up from its center
    for (const eye of eyes) {
      const dir = new THREE.Vector3(0.6, 0.3, eye.userData.side * 0.75).normalize();
      eye.scale.setScalar(headR * 0.17);
      eye.position.copy(headCenter).addScaledVector(dir, headR * 0.97 + ICING);
    }
  }
  rebuild();

  // ---- animation (the chicken's half of chickens3d's tick) ----
  // wings: folded on the ground, flapping on the way up, spread while
  // gliding, half-tucked in a plain fall. Legs: a walk cycle on the ground;
  // in a glide they splay out and trail back. Torso: bob with the steps,
  // nose up on the way up and a little in a glide. Arms (the wings) swing
  // opposite their leg while walking.
  let flapT = 0, walkPhase = 0;
  const lerpTo = (cur, target, rate, dt) => cur + (target - cur) * Math.min(1, rate * dt);
  // state: { moving, grounded, gliding, vy }
  function animate(state, dt) {
    let raise = params.wingRaise;
    if (!state.grounded) {
      if (state.vy > 0) { flapT += dt * 22; raise = 0.55 + 0.45 * Math.sin(flapT); }
      else raise = state.gliding ? 1 : 0.25;
    }
    setWingRaise(Math.round(raise * 50) / 50); // quantized: only rebuild when it visibly changes
    const walking = state.grounded && state.moving;
    if (walking) walkPhase += dt * 11;
    for (const hip of hips) {
      const side = hip.userData.side;
      let swing = 0, splay = 0;
      if (walking) swing = side * 0.55 * Math.sin(walkPhase);
      else if (!state.grounded) { swing = state.gliding ? -0.45 : -0.2; splay = -side * (state.gliding ? 0.4 : 0.12); }
      hip.rotation.z = lerpTo(hip.rotation.z, shankTilt + swing, 12, dt);
      hip.rotation.x = lerpTo(hip.rotation.x, splay, 8, dt);
    }
    for (const { pivot } of wings) {
      const side = pivot.userData.side;
      const target = walking ? -side * 0.45 * Math.sin(walkPhase) : 0;
      pivot.rotation.z = lerpTo(pivot.rotation.z, target, 12, dt);
    }
    const bob = walking ? 0.05 * (1 - Math.cos(2 * walkPhase)) / 2 : 0; // two small bobs per stride
    torso.position.y = lerpTo(torso.position.y, bob, 20, dt);
    const pitch = !state.grounded ? (state.vy > 0 ? 0.18 : state.gliding ? 0.1 : -0.08) : 0;
    torso.rotation.z = lerpTo(torso.rotation.z, pitch, 6, dt);
  }

  return { group: chicken, animate, legs: hips, torso, wings, setWingRaise, rebuild, params };
}
