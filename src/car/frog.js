/* ============================================================
   (from Desktop/chickens3d/frog.js, with a `finish` for the materials)
   the frog: built on the same smooth torso as the chicken (blob.js: an egg
   body, a short neck and, here, a wide flat head), standing on the same
   hip-and-shoulder rig, so the two characters match. Its features come from
   the toad in the xylophone game: gold eyes with sideways pupils under
   heavy sleepy lids that blink, a wide mouth, two nostrils, warts over the
   back and crown, arms ending in splayed hands, and thighs over short
   shins on wide flat feet. Faces +X like the chicken.
   ============================================================ */
import * as THREE from "three";
import { buildBlobGeometry } from "./blob.js";

const FROG = {
  bodyR: 1.0,
  bodyShape: new THREE.Vector3(0.9, 1.15, 0.88), // the same upright egg as the chicken, a touch slimmer
  headR: 0.6,
  headShape: new THREE.Vector3(1.2, 0.72, 1.15),  // broad and flat
  neckLen: 0.2,
  neckDir: new THREE.Vector3(0.12, 1, 0).normalize(),
  resolution: 30,
  warts: 40,
  lid: 0.55, // how far down the eyelids hang at rest: 0 = wide open, about 1.7 = shut
  blink: [3, 8], // seconds between blinks
  colors: { skin: 0x8c9a4b, warts: 0x6e7b37, eye: 0xe8b23a, pupil: 0x1e1a14, mouth: 0x3a2e1f },
};

const standard = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

// `finish(color, extra)` makes every lit material, so a page can hand in its
// own (chickens3d's standard, or a world's toon).
export function buildFrog(finish = standard) {
  const T = FROG, K = T.colors;
  const group = new THREE.Group(); // the game moves and turns this
  const torso = new THREE.Group(); // bob, pitch and squash happen here; legs hang off the group
  group.add(torso);
  const mat = finish;
  const skin = mat(K.skin), wartMat = mat(K.warts), eyeMat = mat(K.eye, { roughness: 0.35 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: K.pupil });
  const mouthMat = new THREE.MeshBasicMaterial({ color: K.mouth });
  const ball = new THREE.SphereGeometry(1, 24, 16);
  const shadowed = (m) => { m.castShadow = m.receiveShadow = true; return m; };
  const blob = (parent, material, sx, sy, sz, px, py, pz) => {
    const m = shadowed(new THREE.Mesh(ball, material));
    m.scale.set(sx, sy, sz); m.position.set(px, py, pz); parent.add(m); return m;
  };

  // --- legs: the same rig as the chicken (hip pivots at legH), frog-shaped ---
  const shankLen = 0.75, shankTilt = 0.12, toeR = 0.035;
  const legH = toeR * 2 + shankLen * Math.cos(shankTilt);
  const foot = (size) => { // the toad's foot: a flat pad with four splayed toes, toes along +x
    const f = new THREE.Group();
    blob(f, skin, 0.55 * size, 0.2 * size, 0.5 * size, 0.05 * size, 0.1 * size, 0);
    for (let i = 0; i < 4; i++) {
      const a = -0.75 + (1.5 * i) / 3, len = (0.55 + (i === 1 || i === 2 ? 0.15 : 0)) * size;
      const toe = blob(f, skin, len / 2, 0.08 * size, 0.1 * size, Math.cos(a) * (0.35 * size + len / 2), 0.08 * size, Math.sin(a) * (0.35 * size + len / 2));
      toe.rotation.y = -a;
      blob(f, skin, 0.13 * size, 0.1 * size, 0.13 * size, Math.cos(a) * (0.35 * size + len), 0.08 * size, Math.sin(a) * (0.35 * size + len));
    }
    return f;
  };
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(0, legH, side * 0.3);
    hip.rotation.z = shankTilt;
    hip.userData.side = side;
    group.add(hip);
    blob(hip, skin, 0.22, 0.34, 0.24, 0, -0.28, 0); // thigh
    const shin = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, shankLen * 0.6, 10), skin));
    shin.position.set(0, -shankLen * 0.68, 0);
    hip.add(shin);
    const f = foot(0.55);
    f.position.set(0.02, -shankLen - toeR, 0);
    f.rotation.z = -shankTilt; // keep the foot flat
    hip.add(f);
    return hip;
  });

  // --- torso: the shared blob ---
  const bodyCenter = new THREE.Vector3(0, legH + T.bodyR * T.bodyShape.y * 0.9, 0);
  const r = buildBlobGeometry({ bodyR: T.bodyR, bodyShape: T.bodyShape, headR: T.headR, headShape: T.headShape, neckDir: T.neckDir, neckLen: T.neckLen, resolution: T.resolution });
  const body = shadowed(new THREE.Mesh(r.geometry, skin));
  body.position.copy(bodyCenter);
  torso.add(body);
  const headCenter = bodyCenter.clone().add(r.headCenter);
  const H = new THREE.Vector3(T.headShape.x, T.headShape.y, T.headShape.z).multiplyScalar(T.headR); // head half-sizes: x forward, y up, z sideways
  const onHead = (fwd, up, side) => headCenter.clone().add(new THREE.Vector3(fwd * H.x, up * H.y, side * H.z)); // unit-ellipsoid coords -> world

  // --- arms: shoulder pivots on the egg's sides, a limb down to a hand (a small foot hanging fingers-down) ---
  const shoulderUp = 0.6, shoulderOut = T.bodyR * T.bodyShape.z * Math.sqrt(1 - shoulderUp * shoulderUp);
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(bodyCenter.x - 0.05, bodyCenter.y + T.bodyR * T.bodyShape.y * shoulderUp, side * shoulderOut);
    shoulder.userData.side = side;
    torso.add(shoulder);
    const wrist = new THREE.Vector3(0.05, -0.85, side * 0.12);
    const limb = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1, 10), skin));
    limb.position.copy(wrist).multiplyScalar(0.5);
    limb.scale.y = wrist.length();
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wrist.clone().normalize());
    shoulder.add(limb);
    const hand = foot(0.4);
    hand.position.copy(wrist);
    hand.rotation.z = -Math.PI / 2; // toes along +x -> hanging down
    hand.rotation.y = side * 0.2;
    shoulder.add(hand);
    return shoulder;
  });

  // --- face ---
  // eyes: a bump of skin up out of the crown each side, a gold eyeball with a sideways pupil, a heavy lid
  const lids = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.copy(onHead(-0.1, 0.72, side * 0.5));
    eye.rotation.y = -side * 0.3; // looking a little outward
    torso.add(eye);
    const s = H.x * 0.3;
    blob(eye, skin, s, s * 0.9, s, 0, -0.2 * s, 0);
    const R = s * 0.78;
    blob(eye, eyeMat, R, R, R, 0.35 * s, 0.05 * s, 0); // eyeball, forward of the bump's center
    const pupil = new THREE.Mesh(ball, pupilMat);
    pupil.scale.set(R * 0.17, R * 0.17, R * 0.5);
    pupil.position.set(0.35 * s + R * 0.97, 0.05 * s, 0);
    eye.add(pupil);
    const lid = shadowed(new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(K.skin, { side: THREE.DoubleSide })));
    lid.position.set(0.35 * s, 0.05 * s, 0);
    lid.rotation.z = -T.lid; // the dome tips forward over the eye; more = more shut
    eye.add(lid);
    lids.push(lid);
  }
  // mouth: a dark line round the front of the head, a little below its middle, turned up a touch at the ends
  {
    const y = -0.3, k = Math.sqrt(1 - y * y), pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -1.25 + (2.5 * i) / 16;
      pts.push(onHead(k * 1.01 * Math.cos(a), y + 0.09 * (a / 1.25) ** 4, k * 1.01 * Math.sin(a)));
    }
    torso.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.028, 6), mouthMat));
  }
  // nostrils: two small dark slits on the snout, above the mouth's middle, flat to the skin
  for (const side of [-1, 1]) {
    const d = new THREE.Vector3(0.94, 0.3, side * 0.14).normalize();
    const n = new THREE.Vector3(d.x / H.x, d.y / H.y, d.z / H.z).normalize(); // the surface normal there
    const nostril = new THREE.Mesh(ball, mouthMat);
    nostril.position.copy(onHead(d.x, d.y, d.z));
    nostril.lookAt(nostril.position.clone().add(n));
    nostril.scale.set(0.05, 0.03, 0.012);
    torso.add(nostril);
  }
  // warts: over the back of the body and the crown, kept off the face
  const wart = new THREE.SphereGeometry(1, 10, 7);
  for (let i = 0; i < T.warts; i++) {
    const head = i % 3 === 0;
    let d;
    do d = new THREE.Vector3(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1);
    while (d.lengthSq() > 1 || d.lengthSq() < 0.05 || d.x > (head ? -0.15 : 0.2)); // behind the face / the belly's front
    d.normalize();
    const w = shadowed(new THREE.Mesh(wart, wartMat));
    if (head) w.position.copy(onHead(d.x * 0.98, d.y * 0.98, d.z * 0.98));
    else w.position.copy(bodyCenter).add(new THREE.Vector3(d.x * T.bodyShape.x, d.y * T.bodyShape.y, d.z * T.bodyShape.z).multiplyScalar(T.bodyR * 0.985));
    w.scale.setScalar(0.04 + Math.random() * 0.05);
    torso.add(w);
  }

  // ---- animation ----
  let nextBlink = 2, blinkT = -1, walkPhase = 0, squash = 1, wasGrounded = true;
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, t);
  // state: { moving, grounded, gliding, vy }
  function animate(state, dt) {
    // blinking
    if (blinkT < 0 && (nextBlink -= dt) <= 0) blinkT = 0;
    let shut = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      shut = Math.sin(Math.min(1, blinkT / 0.35) * Math.PI);
      if (blinkT >= 0.35) { blinkT = -1; nextBlink = T.blink[0] + Math.random() * (T.blink[1] - T.blink[0]); }
    }
    const rest = state.grounded ? T.lid : 0.1; // eyes wide in the air
    for (const l of lids) l.rotation.z = -(rest + (1.75 - rest) * shut);
    // walking: legs swing alternately from the hips, arms swing opposite their leg, a small bob twice a stride
    const walking = state.moving && state.grounded;
    if (walking) walkPhase += dt * 8;
    for (const hip of legs) {
      const ph = walkPhase + (hip.userData.side > 0 ? Math.PI : 0);
      const target = shankTilt + (walking ? 0.55 * Math.sin(ph) : !state.grounded ? -0.35 : 0); // trail back in the air
      hip.rotation.z = lerp(hip.rotation.z, target, 12 * dt);
    }
    for (const shoulder of arms) {
      const ph = walkPhase + (shoulder.userData.side > 0 ? Math.PI : 0);
      const target = walking ? -0.4 * Math.sin(ph) : !state.grounded ? 1.0 : 0; // arms up in the air
      shoulder.rotation.z = lerp(shoulder.rotation.z, target, 12 * dt);
    }
    const bob = walking ? 0.05 * (1 - Math.cos(2 * walkPhase)) / 2 : 0;
    torso.position.y = lerp(torso.position.y, bob, 15 * dt);
    // in the air: nose up on the way up, level in a glide, a little nose down in a fall
    const pitch = !state.grounded ? (state.vy > 0 ? 0.18 : state.gliding ? 0.08 : -0.1) : 0;
    torso.rotation.z = lerp(torso.rotation.z, pitch, 6 * dt);
    // landing: squash, then spring back
    if (state.grounded && !wasGrounded) squash = 0.75;
    wasGrounded = state.grounded;
    squash = lerp(squash, 1, 8 * dt);
    torso.scale.set((2 - squash) ** 0.5, squash, (2 - squash) ** 0.5);
  }
  return { group, animate, legs };
}
