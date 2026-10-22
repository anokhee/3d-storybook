// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- fish heads: what the steel drums grow when a note is played ----------
// Loaded after palette.js, before script.js. A fish pokes its head up out of the sand where a note flower would
// bloom, facing the player: it springs up with a little overshoot, gulps a few times with its round mouth, sways,
// then slips back down into the sand. Its body is tinted toward the note's color. One big fish per note. script.js places them (sproutNoteFlower) and ticks them along with the flowers; the
// building and animating is here (makeFishHeads). Colors live in palette.js (fish, fishBelly, fishFin, fishLips,
// fishEye, fishPupil)
const FISH_HEADS = {
  sizeByPitch: [1.9, 1.9], // head height for the lowest note and for the highest, world units: every note a big fish
  size: [0.9, 1.1], // random per-fish jitter on top of that
  body: [0.62, 1, 0.72], // the head's proportions: width, height, depth
  showing: 0.8, // how much of the head's height rises clear of the sand
  rise: 0.45, // seconds: popping up
  hold: 2.4, // seconds: up, gulping
  sink: 0.5, // seconds: slipping back down
  gulps: 2.6, // mouth opening and closing, per second
  sway: 0.12, // how far it rocks side to side, radians
  tint: 0.6, // how much of the note's color goes into the body (the rest is COLOR_PALETTE.fish)
  colors: {
    body: COLOR_PALETTE.fish,
    belly: COLOR_PALETTE.fishBelly,
    fin: COLOR_PALETTE.fishFin,
    lips: COLOR_PALETTE.fishLips,
    eye: COLOR_PALETTE.fishEye,
    pupil: COLOR_PALETTE.fishPupil,
  },
};

// shared geometry and materials, and the two functions script.js needs: sprout(x, y, z, color, height, facing)
// adds a fish head to `parent` and returns its record, update(fish, dt) moves it on and returns false once it's
// gone back under
function makeFishHeads(parent, { toonMat, inked }) {
  const F = FISH_HEADS,
    K = F.colors,
    [bw, bh, bd] = F.body,
    bodyGeo = new THREE.SphereGeometry(1, 24, 16).scale(bw / 2, bh / 2, bd / 2),
    // the belly: a paler patch over the lower front (+z, where the sphere's phi is a quarter turn), a hair outside the body
    bellyGeo = new THREE.SphereGeometry(1, 20, 12, Math.PI * 0.2, Math.PI * 0.6, Math.PI * 0.4, Math.PI * 0.5).scale(
      (bw / 2) * 1.01,
      (bh / 2) * 1.01,
      (bd / 2) * 1.01,
    ),
    eyeGeo = new THREE.SphereGeometry(0.13, 14, 10),
    pupilGeo = new THREE.SphereGeometry(0.065, 10, 8),
    lipsGeo = new THREE.TorusGeometry(0.11, 0.05, 8, 20),
    throatGeo = new THREE.CircleGeometry(0.11, 16),
    finGeo = new THREE.SphereGeometry(1, 12, 8).scale(0.22, 0.03, 0.12).translate(0.2, 0, 0), // runs out along +x from its root
    dorsalGeo = new THREE.CircleGeometry(0.28, 14, 0, Math.PI),
    bodyMats = new Map(),
    bellyMat = toonMat(K.belly),
    finMat = toonMat(K.fin),
    lipsMat = toonMat(K.lips),
    eyeMat = toonMat(K.eye),
    pupilMat = toonMat(K.pupil),
    throatMat = toonMat("#3A1420");
  finMat.side = THREE.DoubleSide;
  const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, u), 3),
    backOut = (u) => {
      const c = 1.8,
        v = Math.min(1, u) - 1;
      return 1 + (c + 1) * v * v * v + c * v * v;
    };

  function sprout(x, y, z, color, height, facing) {
    if (!bodyMats.has(color)) bodyMats.set(color, toonMat(new THREE.Color(K.body).lerp(new THREE.Color(color), F.tint)));
    const g = new THREE.Group(), // stays on the sand, turned to face the player
      head = new THREE.Group(); // rises and sinks inside it, built one unit tall
    g.position.set(x, y, z);
    g.rotation.y = facing;
    g.add(head);
    head.add(inked(new THREE.Mesh(bodyGeo, bodyMats.get(color))));
    head.add(new THREE.Mesh(bellyGeo, bellyMat));
    // the mouth on the front, below the eyes, tipped up a little: lips round a dark throat
    const mouth = new THREE.Group();
    mouth.position.set(0, bh * 0.1, bd * 0.47);
    mouth.rotation.x = -0.25;
    const lips = inked(new THREE.Mesh(lipsGeo, lipsMat)),
      throat = new THREE.Mesh(throatGeo, throatMat);
    throat.position.z = -0.01;
    mouth.add(lips, throat);
    head.add(mouth);
    // eyes out on either side up near the top, above the mouth, looking forward
    [-1, 1].forEach((side) => {
      const eye = inked(new THREE.Mesh(eyeGeo, eyeMat));
      eye.position.set(side * bw * 0.33, bh * 0.32, bd * 0.18);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(side * 0.04, 0.02, 0.09);
      eye.add(pupil);
      head.add(eye);
      // a side fin just above the sand, flicking
      const fin = inked(new THREE.Mesh(finGeo, finMat));
      fin.position.set(side * bw * 0.42, -bh * 0.5 + (bh * F.showing) * 0.35, 0);
      fin.rotation.set(0, side < 0 ? Math.PI : 0, 0.5);
      head.add(fin);
    });
    // a fin down its back
    const dorsal = inked(new THREE.Mesh(dorsalGeo, finMat));
    dorsal.rotation.set(0, Math.PI / 2, -(Math.PI / 2 - 0.4)); // the half disc turned to stick out behind, raked up a little
    dorsal.position.set(0, bh * 0.05, -bd * 0.45);
    head.add(dorsal);
    head.scale.setScalar(height);
    parent.add(g);
    return {
      g,
      head,
      lips,
      fins: head.children.filter((c) => c.geometry === finGeo),
      height,
      phase: Math.random() * Math.PI * 2,
      t: 0,
    };
  }

  // where the head's center sits: down = buried, up = showing F.showing of its height
  function update(f, dt) {
    f.t += dt;
    const t = f.t,
      down = -f.height * 0.6,
      up = f.height * (F.showing - 0.5);
    let rise;
    if (t < F.rise) rise = backOut(t / F.rise);
    else if (t < F.rise + F.hold) rise = 1;
    else if (t < F.rise + F.hold + F.sink) rise = 1 - easeOut((t - F.rise - F.hold) / F.sink);
    else return false;
    f.head.position.y = down + (up - down) * rise;
    f.head.rotation.z = Math.sin(t * 2.2 + f.phase) * F.sway;
    // gulping: the lips squeeze shut and pop open
    const gulp = 0.5 + 0.5 * Math.sin(t * F.gulps * Math.PI * 2 + f.phase);
    f.lips.scale.set(1, 0.35 + 0.65 * gulp, 1);
    f.fins.forEach((fin, i) => (fin.rotation.z = 0.5 + Math.sin(t * 7 + i * Math.PI) * 0.3));
    return true;
  }
  return { sprout, update };
}


export { makeFishHeads, FISH_HEADS };
