// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- fish heads: what the steel drums grow when a note is played ----------
// Loaded after palette.js, before script.js. A fish pokes its head up out of the sand where a note flower would
// bloom, facing the player: it springs up with a little overshoot, sways with its mouth drawn along its belly line,
// then slips back down into the sand. Its body is tinted toward the note's color. One big fish per note. script.js places them (sproutNoteFlower) and ticks them along with the flowers; the
// building and animating is here (makeFishHeads). Colors live in palette.js (fish, fishBelly, fishFin, fishLips,
// fishEye, fishPupil)
const FISH_HEADS = {
  sizeByPitch: [1.9, 1.9], // head height for the lowest note and for the highest, world units: every note a big fish
  size: [0.9, 1.1], // random per-fish jitter on top of that
  body: [0.62, 1, 0.72], // the head's proportions: width, height, depth
  showing: 0.8, // how much of the head's height rises clear of the sand
  rise: 0.45, // seconds: popping up
  hold: 2.4, // seconds: up, swaying
  sink: 0.5, // seconds: slipping back down
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
    // the belly: a paler patch over the lower front (+z, where the sphere's phi is a quarter turn), a hair outside the
    // body. Its top edge arches: highest in the middle, coming down toward the sides (bellyTop is its theta at a phi)
    bellyTop = (phi) => Math.PI * (0.46 - 0.1 * Math.sin(((phi - Math.PI * 0.2) / (Math.PI * 0.6)) * Math.PI)),
    bellyGeo = (() => {
      // (started off the pole: from theta 0, three drops half the top row's triangles and the edge comes out jagged)
      const geo = new THREE.SphereGeometry(1, 24, 12, Math.PI * 0.2, Math.PI * 0.6, 1, 1),
        pos = geo.attributes.position,
        uv = geo.attributes.uv;
      // each vertex re-placed: its phi kept, its theta run from the arched top down to the bottom edge
      for (let i = 0; i < pos.count; i++) {
        const phi = Math.PI * (0.2 + 0.6 * uv.getX(i)),
          top = bellyTop(phi),
          th = top + (1 - uv.getY(i)) * (Math.PI * 0.9 - top);
        pos.setXYZ(i, -Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th));
      }
      geo.computeVertexNormals();
      return geo.scale((bw / 2) * 1.01, (bh / 2) * 1.01, (bd / 2) * 1.01);
    })(),
    // the eyes, as the wolf's: a white bead, unoutlined, with a black bead of a pupil half its size set on the
    // front of it. Each sits up on the face, sunk a little into the body: eyeAt is where the body's surface is
    // at that x and y, eyeSink how far in from it the bead's center sits
    eyeR = 0.1,
    pupilR = eyeR / 2,
    eyeAt = [bw * 0.27, bh * 0.34],
    eyeSink = 0.03,
    eyeZ = (bd / 2) * Math.sqrt(1 - (eyeAt[0] / (bw / 2)) ** 2 - (eyeAt[1] / (bh / 2)) ** 2) - eyeSink,
    eyeGeo = new THREE.SphereGeometry(eyeR, 14, 10),
    pupilGeo = new THREE.SphereGeometry(pupilR, 10, 8),
    // the mouth: two lips, thin lines with round ends a hair proud of the surface, across the middle of the belly.
    // The bottom lip lies along the belly's arched top edge, the top lip runs parallel just above it (lift is how
    // far up, in theta)
    lipGap = Math.PI * 0.032, // just under two lip radii, so they touch
    mouthAt = (phi, lift) => {
      const th = bellyTop(phi) - lift,
        r = 1.025;
      return new THREE.Vector3(
        -Math.cos(phi) * Math.sin(th) * (bw / 2) * r,
        Math.cos(th) * (bh / 2) * r,
        Math.sin(phi) * Math.sin(th) * (bd / 2) * r,
      );
    },
    lips = [0, lipGap].map((lift) => ({
      geo: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => mouthAt(Math.PI * (0.33 + (0.34 * i) / 8), lift))),
        24,
        0.026,
        8,
      ),
      ends: [mouthAt(Math.PI * 0.33, lift), mouthAt(Math.PI * 0.67, lift)],
    })),
    mouthEndGeo = new THREE.SphereGeometry(0.026, 8, 6),
    finGeo = new THREE.SphereGeometry(1, 12, 8).scale(0.22, 0.03, 0.12).translate(0.2, 0, 0), // runs out along +x from its root
    dorsalGeo = new THREE.CircleGeometry(0.28, 14, 0, Math.PI),
    // a tail lobe: a flat leaf running back along -z from its root; two of them, splayed, make the forked tail
    tailGeo = new THREE.SphereGeometry(1, 12, 8).scale(0.03, 0.1, 0.16).translate(0, 0, -0.15),
    bodyMats = new Map(),
    bellyMat = toonMat(K.belly),
    finMat = toonMat(K.fin),
    lipsMat = toonMat(K.lips),
    eyeMat = toonMat(K.eye),
    pupilMat = toonMat(K.pupil);
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
    // the mouth, below the eyes, curving along where the belly meets the body: a bottom lip and a top lip
    lips.forEach((lip) => {
      head.add(inked(new THREE.Mesh(lip.geo, lipsMat)));
      lip.ends.forEach((p) => {
        const end = new THREE.Mesh(mouthEndGeo, lipsMat);
        end.position.copy(p);
        head.add(end);
      });
    });
    // eyes either side up near the top, above the mouth, looking straight ahead
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * eyeAt[0], eyeAt[1], eyeZ);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, eyeR - pupilR * 0.6);
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
    dorsal.position.set(0, bh * 0.18, -bd * 0.45);
    head.add(dorsal);
    // the tail, low on its back just above the sand: two lobes forking up and down behind, wagging
    const tail = new THREE.Group();
    tail.position.set(0, -bh * 0.2, -bd * 0.46);
    [-1, 1].forEach((side) => {
      const lobe = inked(new THREE.Mesh(tailGeo, finMat));
      lobe.rotation.x = side * 0.5;
      tail.add(lobe);
    });
    head.add(tail);
    head.scale.setScalar(height);
    parent.add(g);
    return {
      g,
      head,
      fins: head.children.filter((c) => c.geometry === finGeo),
      tail,
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
    f.fins.forEach((fin, i) => (fin.rotation.z = 0.5 + Math.sin(t * 7 + i * Math.PI) * 0.3));
    f.tail.rotation.y = Math.sin(t * 5 + f.phase) * 0.35;
    return true;
  }
  return { sprout, update };
}


export { makeFishHeads, FISH_HEADS };
