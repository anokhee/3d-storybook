// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- teddy bears: the toy xylophone's audience ----------
// Loaded after palette.js, before script.js. Rows of teddy bears sitting on the playroom floor in front of the
// instrument, where the piano's audience sits, each turned to face the player. They sit still until music plays,
// then sway side to side with it, each a little out of step, keep going through rests, and settle again once
// it has stopped a while. Each bear is
// a round tummy and head, ears, a muzzle, arms at its sides and legs out in front, in its own fur color with a
// contrasting tummy, muzzle and ear insides (its color pair), and dark eyes and nose. Toon shaded and inked like everything else;
// each bear's pieces are merged into one mesh per color.
const TEDDIES = {
  rows: [11.3, 13.2], // how far in front of the player each row sits
  perRow: [4, 3], // bears in each row, front to back
  spread: 22, // how wide the rows are
  size: [0.85, 1.2], // random per-bear size multiplier
  turn: 0.25, // how far a bear may be turned from facing the player, radians
  tilt: 0.2, // how far its head may lean to one side, radians
  lift: 0.06, // how far above the floor a bear's origin sits, so its round bottom and legs stay clear as it sways
  // swaying with the music: every note adds to the bears' energy, which dies away when the notes stop
  sway: {
    angle: 0.12, // radians side to side, at full energy
    nod: 0.05, // radians it leans back (never forward, or its legs would dip into the floor), at full energy
    rate: 0.9, // sways a second
    perNote: 0.2, // how much energy each note adds (1 = full)
    hold: 2.5, // seconds they keep going at full swing after the last note, so rests don't stop them
    settle: 2, // then seconds for full energy to die away
  },
  colors: {
    // each bear takes the next pair: its fur, then its tummy, muzzle and ear insides
    pairs: [
      ["#9B7BD4", "#F7B8CE"], // purple and pink
      ["#F7F2EA", "#F4A7C0"], // white and pink
      ["#F29A4A", "#FFF3E3"], // orange and white
      ["#F2A0BE", "#FFF3E8"], // pink and white
      ["#FFF6EC", "#B79BE6"], // white and purple
      ["#F7A35C", "#F7B8CE"], // orange and pink
      ["#B08FE0", "#FFF3E8"], // purple and white
    ],
    dark: "#2B1D1A", // eyes and nose
  },
};

// sits the bears in `scene` in front of the player at (x, z). `toonMat` and `inked` come from script.js. Returns
// the group, hear(): a note was played, and animate(dt)
function buildTeddies(scene, { toonMat, inked }, x, z) {
  const T = TEDDIES,
    C = T.colors,
    group = new THREE.Group();
  group.name = "teddies";
  scene.add(group);
  const between = ([a, b]) => a + Math.random() * (b - a),
    ball = (r, sx, sy, sz, px, py, pz) =>
      new THREE.SphereGeometry(r, 18, 14).scale(sx, sy, sz).translate(px, py, pz);
  // joins geometries (positions and normals) into one
  const merge = (geos) => {
    const pos = [],
      nrm = [];
    geos.forEach((geo) => {
      const g = geo.index ? geo.toNonIndexed() : geo;
      pos.push(...g.attributes.position.array);
      nrm.push(...g.attributes.normal.array);
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    return out;
  };
  const darkMat = toonMat(C.dark),
    pairMats = C.pairs
      .map(([fur, light]) => [toonMat(fur), toonMat(light)])
      .sort(() => Math.random() - 0.5); // shuffled, so the pairs land in a different order each time
  let n = 0;
  const bears = []; // { bear, phase }
  T.rows.forEach((rowZ, r) => {
    const perRow = T.perRow[r];
    for (let i = 0; i < perRow; i++, n++) {
      // the back row sits in the gaps of the front one
      const bx = x + (i - (perRow - 1) / 2) * (T.spread / Math.max(...T.perRow)),
        bz = z + rowZ,
        bear = new THREE.Group(),
        tilt = (Math.random() * 2 - 1) * T.tilt;
      const size = between(T.size);
      bear.position.set(bx, T.lift * size, bz);
      bear.scale.setScalar(size);
      bear.rotation.order = "YXZ"; // sway and nod in the bear's own frame, then turn it to face the player
      // local +z is the bear's front: turn it to the player, give or take
      bear.rotation.y = Math.atan2(x - bx, z - bz) + (Math.random() * 2 - 1) * T.turn;
      group.add(bear);
      bears.push({ bear, phase: Math.random() * Math.PI * 2 });
      // the head's pieces lean together, round the neck
      const lean = new THREE.Matrix4().makeRotationZ(tilt),
        neck = new THREE.Matrix4().makeTranslation(0, 1.28, 0),
        onHead = (g) => g.applyMatrix4(neck.clone().multiply(lean)),
        fur = [
          ball(0.62, 1, 1.05, 0.92, 0, 0.62, 0), // tummy
          onHead(ball(0.48, 1, 0.95, 0.95, 0, 0.1, 0)), // head
          onHead(ball(0.17, 1, 1, 0.6, -0.34, 0.48, -0.02)), // ears
          onHead(ball(0.17, 1, 1, 0.6, 0.34, 0.48, -0.02)),
          ball(0.2, 0.9, 1.6, 0.9, -0.62, 0.72, 0.15), // arms, hanging at the sides
          ball(0.2, 0.9, 1.6, 0.9, 0.62, 0.72, 0.15),
          ball(0.24, 0.95, 0.85, 1.6, -0.3, 0.2, 0.5), // legs, out in front
          ball(0.24, 0.95, 0.85, 1.6, 0.3, 0.2, 0.5),
        ],
        light = [
          ball(0.4, 1, 1.1, 0.5, 0, 0.6, 0.38), // tummy patch
          onHead(ball(0.19, 1.15, 0.85, 0.8, 0, 0.0, 0.42)), // muzzle
          onHead(ball(0.1, 1, 1, 0.4, -0.34, 0.48, 0.07)), // ear insides
          onHead(ball(0.1, 1, 1, 0.4, 0.34, 0.48, 0.07)),
          ball(0.13, 1, 1, 0.4, -0.3, 0.2, 0.86), // foot pads
          ball(0.13, 1, 1, 0.4, 0.3, 0.2, 0.86),
        ],
        dark = [
          onHead(ball(0.06, 1, 1, 0.6, -0.17, 0.18, 0.43)), // eyes
          onHead(ball(0.06, 1, 1, 0.6, 0.17, 0.18, 0.43)),
          onHead(ball(0.07, 1.3, 0.9, 0.8, 0, 0.06, 0.6)), // nose
        ];
      bear.add(
        inked(new THREE.Mesh(merge(fur), pairMats[n % pairMats.length][0])),
        inked(new THREE.Mesh(merge(light), pairMats[n % pairMats.length][1])),
        new THREE.Mesh(merge(dark), darkMat),
      );
    }
  });
  const W = T.sway;
  let energy = 0,
    clock = 0,
    sinceNote = Infinity;
  return {
    group,
    hear() {
      energy = Math.min(1, energy + W.perNote);
      sinceNote = 0;
    },
    animate(dt) {
      clock += dt;
      sinceNote += dt;
      if (sinceNote > W.hold) energy = Math.max(0, energy - dt / W.settle);
      const a = clock * W.rate * Math.PI * 2;
      // rocking from where it sits (the bear's origin is on the floor), in its own frame: sideways and a nod
      bears.forEach(({ bear, phase }) => {
        bear.rotation.z = W.angle * energy * Math.sin(a + phase);
        bear.rotation.x = -W.nod * energy * (0.5 + 0.5 * Math.sin(2 * a + phase)); // leaning back, then upright
      });
    },
  };
}


export { buildTeddies, TEDDIES };
