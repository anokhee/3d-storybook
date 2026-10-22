// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { FENCE } from "./fence.js";

// ---------- the toad: a gigantic toad sitting in the conifers behind the fence, for the kalimba ----------
// Loaded after palette.js and materials.js, before script.js. A fat warty body sitting up, a broad head with a
// wide mouth and two nostrils, two eyes bulging up out of the top of it (gold, with the toad's sideways pupil,
// under heavy sleepy lids), front legs planted on splayed toes and big haunches folded at its sides. It blinks
// now and then, and nods its head along to every note. Turned to face the player, give or take. Toon shaded and
// inked like everything else. Its colors live in palette.js (toadSkin, toadWarts, toadEye, toadPupil,
// toadMouth). Which instrument shows it is each instrument's `backdrop` setting ("toad")
const TOAD = {
  at: 2, // how far off to the side of the player it sits, world units (+ = right, from the camera's home view)
  gap: 1.2, // clear ground between the fence and the front of it
  scale: 1.3, // the whole toad: at 1 it's about 5 tall and 6.5 wide
  turn: -Math.PI / 4, // turned this far from facing the player, radians: negative faces off to the left
  warts: 46, // bumps scattered over its back and head
  lid: 0.55, // how far down the eyelids hang at rest: 0 = wide open, about 1.7 = shut
  blink: [3, 8], // seconds between blinks
  // the nod: every note gives the head a push down, and a spring brings it back up. Notes in quick succession
  // keep it bobbing
  nod: { kick: 2.2, spring: 11, damping: 0.45, max: 0.3 }, // push (radians/second), spring rate, damping ratio, furthest down it goes (radians)
  colors: {
    skin: COLOR_PALETTE.toadSkin,
    warts: COLOR_PALETTE.toadWarts,
    eye: COLOR_PALETTE.toadEye,
    pupil: COLOR_PALETTE.toadPupil,
    mouth: COLOR_PALETTE.toadMouth,
  },
};

// builds the toad into `scene`, behind the fence line that runs through (x, z) along the x axis. `toonMat` and
// `inked` come from script.js. Returns the group, nearToad(px, pz): whether a spot on the ground is under it,
// footprint: { x, z, r } in world space (for the trees to stand round), nod(): bob its head to a note, and
// animate(now, dt): its blinks and the nod's spring
function buildToad(scene, { toonMat, inked }, x, z) {
  const T = TOAD,
    K = T.colors,
    toad = new THREE.Group();
  toad.name = "toad";
  scene.add(toad);
  const skin = toonMat(K.skin),
    wartMat = toonMat(K.warts),
    eyeMat = toonMat(K.eye),
    pupilMat = new THREE.MeshBasicMaterial({ color: K.pupil }),
    mouthMat = new THREE.MeshBasicMaterial({ color: K.mouth }),
    ball = new THREE.SphereGeometry(1, 32, 20),
    blob = (mat, sx, sy, sz, px, py, pz) => {
      const m = inked(new THREE.Mesh(ball, mat));
      m.scale.set(sx, sy, sz);
      m.position.set(px, py, pz);
      return m;
    };

  // the body: sitting up, its front tipped higher than its back
  const bodyG = new THREE.Group(),
    BODY = [3.2, 2.2, 2.8];
  bodyG.position.set(0, 2.0, -0.2);
  bodyG.rotation.x = -0.25;
  bodyG.add(blob(skin, ...BODY, 0, 0, 0));
  toad.add(bodyG);
  // the head, broad and flat, over the front of the body. It and everything on it (eyes, mouth, warts) hang
  // from a pivot at the neck, low at the back of the head, so the head can nod
  const HEAD = [2.6, 1.5, 2.0],
    NECK = new THREE.Vector3(0, 2.8, 0.2),
    headG = new THREE.Group(),
    headAt = new THREE.Vector3(0, 3.3, 1.5).sub(NECK); // the head's middle, from the neck
  headG.position.copy(NECK);
  toad.add(headG);
  headG.add(blob(skin, ...HEAD, ...headAt.toArray()));
  // warts: bumps over the upper back and the back of the head, kept off the face
  const wart = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < T.warts; i++) {
    const onHead = i % 4 === 0,
      [sx, sy, sz] = onHead ? HEAD : BODY;
    let d;
    do d = new THREE.Vector3(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1);
    while (d.lengthSq() > 1 || d.lengthSq() < 0.05 || (onHead ? d.z > -0.1 : d.z > 0.5));
    d.normalize();
    const r = 0.12 + Math.random() * 0.16,
      w = inked(new THREE.Mesh(wart, wartMat));
    w.position.set(d.x * sx, d.y * sy, d.z * sz).multiplyScalar(0.99);
    w.scale.setScalar(r);
    (onHead ? headG : bodyG).add(w);
    if (onHead) w.position.add(headAt);
  }
  // the mouth: a dark line round the front of the head, a little below its middle, turned up a touch at the ends
  {
    const y = -0.35,
      k = Math.sqrt(1 - (y / HEAD[1]) ** 2),
      pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -1.25 + (2.5 * i) / 16;
      pts.push(
        new THREE.Vector3(
          HEAD[0] * k * 1.01 * Math.sin(a),
          y + 0.12 * (a / 1.25) ** 4,
          HEAD[2] * k * 1.01 * Math.cos(a),
        ).add(headAt),
      );
    }
    headG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.07, 6), mouthMat));
  }
  // the nostrils: two small dark slits up on the snout, above the middle of the mouth, set flat into the skin
  [-1, 1].forEach((sx) => {
    const d = new THREE.Vector3(sx * 0.14, 0.3, 0.94).normalize(),
      n = new THREE.Vector3(d.x / HEAD[0], d.y / HEAD[1], d.z / HEAD[2]).normalize(), // the surface's normal there
      nostril = new THREE.Mesh(ball, mouthMat);
    nostril.position.set(d.x * HEAD[0], d.y * HEAD[1], d.z * HEAD[2]).add(headAt);
    nostril.lookAt(nostril.position.clone().add(n)); // its local z along the normal (the head is unrotated here)
    nostril.rotateZ(sx * 0.35); // slanting in toward the middle at the top
    nostril.scale.set(0.12, 0.07, 0.03);
    headG.add(nostril);
  });
  // the eyes: a bump of skin up out of the head each side, a gold eyeball in it with a sideways pupil, and a
  // heavy lid that hangs over the top of it (and comes down to blink)
  const lids = [];
  [-1, 1].forEach((sx) => {
    const eye = new THREE.Group();
    eye.position.set(sx * 1.25, 4.35, 1.2).sub(NECK);
    eye.rotation.y = sx * 0.3; // looking a little outward
    headG.add(eye);
    eye.add(blob(skin, 0.78, 0.7, 0.78, 0, -0.15, 0));
    const R = 0.6,
      eyeball = blob(eyeMat, R, R, R, 0, 0.05, 0.3),
      pupil = new THREE.Mesh(ball, pupilMat);
    pupil.scale.set(0.3, 0.1, 0.1);
    pupil.position.set(0, 0.05, 0.3 + R * 0.97);
    const lid = inked(
      new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin),
    );
    lid.material.side = THREE.DoubleSide;
    lid.position.set(0, 0.05, 0.3);
    lid.rotation.x = T.lid;
    eye.add(eyeball, pupil, lid);
    lids.push(lid);
  });
  // front legs: planted at the front, under the head, on feet with splayed toes
  const limb = (mat, from, to, r) => {
    const m = inked(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 1, 12), mat));
    m.position.copy(from).lerp(to, 0.5);
    m.scale.y = from.distanceTo(to);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return m;
  };
  const foot = (fx, fz, turn, size) => {
    const f = new THREE.Group();
    f.position.set(fx, 0, fz);
    f.rotation.y = turn;
    f.add(blob(skin, 0.5 * size, 0.2 * size, 0.55 * size, 0, 0.1, 0));
    for (let i = 0; i < 4; i++) {
      const a = -0.75 + (1.5 * i) / 3,
        len = (0.55 + (i === 1 || i === 2 ? 0.15 : 0)) * size,
        toe = blob(skin, 0.1 * size, 0.08 * size, len / 2, Math.sin(a) * (0.35 * size + len / 2), 0.08, Math.cos(a) * (0.35 * size + len / 2));
      toe.rotation.y = a;
      const tip = blob(skin, 0.13 * size, 0.1 * size, 0.13 * size, Math.sin(a) * (0.35 * size + len), 0.08, Math.cos(a) * (0.35 * size + len));
      f.add(toe, tip);
    }
    return f;
  };
  [-1, 1].forEach((sx) => {
    toad.add(limb(skin, new THREE.Vector3(sx * 1.6, 2.6, 1.8), new THREE.Vector3(sx * 1.95, 0.25, 2.7), 0.4));
    toad.add(foot(sx * 2.05, 2.9, sx * 0.35, 1));
    // the back legs: a big haunch folded at the side, and a long foot flat on the ground ahead of it
    const haunch = blob(skin, 1.3, 1.15, 1.8, sx * 2.7, 1.1, -0.5);
    haunch.rotation.y = sx * 0.35;
    toad.add(haunch);
    toad.add(foot(sx * 3.2, 1.6, sx * 0.6, 1.25));
  });

  // stand it behind the fence, facing the player (who is F.back in front of the fence)
  toad.scale.setScalar(T.scale);
  const px = x + T.at,
    pz = z - T.gap - 3.4 * T.scale; // its front toes reach about 3.4 ahead of its middle
  toad.position.set(px, 0, pz);
  toad.rotation.y = Math.atan2(x - px, z + FENCE.back - pz) + T.turn;
  toad.traverse((o) => {
    if (o.isMesh) o.castShadow = false; // too big and too far back for the sun's shadow camera
  });

  const footprint = { x: px, z: pz, r: 4.2 * T.scale },
    nearToad = (qx, qz) => Math.hypot(qx - px, qz - pz) < footprint.r;
  let nextBlink = 2,
    blinkT = -1,
    nodAngle = 0, // how far the head is tipped down, radians
    nodSpeed = 0;
  const nod = () => (nodSpeed += T.nod.kick);
  const animate = (now, dt) => {
    // the nod: a damped spring pulling the head back up, stepped in small pieces so it stays steady
    const N = T.nod;
    for (let left = Math.min(dt, 0.1); left > 0; left -= 1 / 120) {
      const h = Math.min(left, 1 / 120);
      nodSpeed += (-N.spring * N.spring * nodAngle - 2 * N.damping * N.spring * nodSpeed) * h;
      nodAngle = Math.max(-N.max * 0.4, Math.min(N.max, nodAngle + nodSpeed * h));
    }
    headG.rotation.x = nodAngle; // positive tips the face down
    // blinking: the lids drop over the eyes and lift again
    if (blinkT < 0 && (nextBlink -= dt) <= 0) blinkT = 0;
    let shut = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      shut = Math.sin(Math.min(1, blinkT / 0.35) * Math.PI);
      if (blinkT >= 0.35) {
        blinkT = -1;
        nextBlink = T.blink[0] + Math.random() * (T.blink[1] - T.blink[0]);
      }
    }
    lids.forEach((l) => (l.rotation.x = T.lid + (1.75 - T.lid) * shut));
  };
  return { toad, nearToad, footprint, nod, animate };
}


export { buildToad, TOAD };
