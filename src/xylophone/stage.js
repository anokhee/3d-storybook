// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the stage: a raised platform under the player, with an audience of blobs in front ----------
// Loaded after palette.js and materials.js, before script.js. A smooth (or planked) platform with a darker front board,
// standing on the meadow with the instrument and player on top. In front of it, between the stage and the
// viewer, rows of blob heads seen from behind, bobbing gently. Which instrument shows it is each instrument's
// `stage` setting. Colors live in palette.js (stageFloor, stageLip, audience, antenna)
const STAGE = {
  height: 0.6, // the platform's top above the meadow
  front: 9.5, // z of the front edge at the sides, toward the viewer
  bulge: 3.5, // how much further the front edge curves out in the middle: an apron stage
  back: -9, // z of the back edge, toward the backdrop
  halfWidth: 15, // half the platform's width
  plank: 0, // plank width; a thin groove runs between planks. 0 = one smooth polished floor
  lip: 0.18, // thickness of the darker board along the front edge
  audience: {
    rows: 2,
    perRow: 9,
    headR: [0.55, 0.85], // random head size
    firstRow: 1.8, // how far in front of the stage edge the first row sits
    rowGap: 1.7, // between rows
    spread: 26, // how wide the rows are
    sink: 0.15, // heads sit this fraction of their radius into the ground, as if seated
    bob: 0.06, // how far they bob at rest, world units
    antennae: true,
    // dancing: a note makes the heads nearest its side of the arc hop (low notes left, high notes right) and
    // gets the whole crowd grooving harder for a moment
    hop: 0.9, // how high a head jumps for a note it's near, world units
    reach: 5, // how far from the note's spot heads still join the hop, world units
    groove: 0.35, // how much each note adds to the crowd's energy (1 = full swing)
    settle: 1.8, // seconds for that energy to die away
  },
  colors: {
    floor: COLOR_PALETTE.stageFloor,
    lip: COLOR_PALETTE.stageLip,
    audience: COLOR_PALETTE.audience,
    antenna: COLOR_PALETTE.antenna,
    antennaTip: COLOR_PALETTE.antennaTip,
  },
};

// builds the stage and audience into `scene`. `toonMat` and `inked` come from script.js. Returns the groups,
// onStage(px, pz): whether a spot on the ground is under the platform, and animate(now): bobs the audience
function buildStage(scene, { toonMat, inked }) {
  const S = STAGE,
    stage = new THREE.Group(),
    audience = new THREE.Group();
  stage.name = "stage";
  audience.name = "audience";
  scene.add(stage, audience);
  const floorMat = toonMat(S.colors.floor),
    lipMat = toonMat(S.colors.lip);
  // the front edge curves out toward the audience: z of the edge at any x across the stage
  const frontAt = (x) => S.front + S.bulge * Math.sqrt(Math.max(0, 1 - (x / S.halfWidth) ** 2));
  // a shape in the ground plane stood up into a slab (the same trick as the instrument's curved bands)
  const slab = (points, height) => {
    const sh = new THREE.Shape();
    points.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z)));
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: height, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(0, height, 0);
    return g;
  };
  const STEPS = 48,
    edge = [];
  for (let k = 0; k <= STEPS; k++) {
    const x = S.halfWidth - (2 * S.halfWidth * k) / STEPS;
    edge.push([x, frontAt(x)]);
  }
  const floor = inked(new THREE.Mesh(slab([[-S.halfWidth, S.back], [S.halfWidth, S.back], ...edge], S.height), floorMat));
  stage.add(floor);
  // grooves between planks: thin dark strips let into the top, running front to back, each cut to the curve
  for (let x = -S.halfWidth + S.plank; S.plank > 0 && x < S.halfWidth - 0.01; x += S.plank) {
    const len = frontAt(x) - S.back - 0.2;
    const groove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, len), lipMat);
    groove.position.set(x, S.height + 0.005, S.back + 0.05 + len / 2);
    stage.add(groove);
  }
  // the front board follows the curve
  const outer = edge.map(([x, z]) => [x, z + S.lip]);
  const lip = inked(new THREE.Mesh(slab([...edge, ...outer.reverse()], S.height + 0.04), lipMat));
  stage.add(lip);

  // the audience: rows of blob heads from behind, a random color and size each, seated in front of the stage
  const A = S.audience,
    heads = [],
    headMats = A.colors ? [] : S.colors.audience.map((c) => toonMat(c)),
    stalkMat = toonMat(S.colors.antenna),
    tipMat = toonMat(S.colors.antennaTip),
    up = new THREE.Vector3(0, 1, 0);
  for (let row = 0; row < A.rows; row++)
    for (let i = 0; i < A.perRow; i++) {
      const r = A.headR[0] + Math.random() * (A.headR[1] - A.headR[0]),
        head = new THREE.Group();
      const hx = (i - (A.perRow - 1) / 2) * (A.spread / (A.perRow - 1)) + (row % 2) * (A.spread / (A.perRow - 1)) * 0.5 + (Math.random() - 0.5) * 0.6;
      // the rows follow the curve of the stage's front
      head.position.set(hx, r * (1 - A.sink), frontAt(hx) + A.firstRow + row * A.rowGap + (Math.random() - 0.5) * 0.5);
      head.add(inked(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), headMats[Math.floor(Math.random() * headMats.length)])));
      if (A.antennae)
        [-1, 1].forEach((sx) => {
          const base = new THREE.Vector3(sx * 0.3, 0.95, -0.1).normalize().multiplyScalar(r),
            dir = new THREE.Vector3(sx * 0.45, 1, -0.1).normalize(),
            len = r * 0.7;
          const stalk = inked(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.03, r * 0.035, len, 8), stalkMat));
          stalk.position.copy(base).addScaledVector(dir, len / 2);
          stalk.quaternion.setFromUnitVectors(up, dir);
          const tip = inked(new THREE.Mesh(new THREE.SphereGeometry(r * 0.12, 10, 8), tipMat));
          tip.position.copy(base).addScaledVector(dir, len + r * 0.08);
          head.add(stalk, tip);
        });
      head.userData = {
        restY: head.position.y,
        phase: Math.random() * Math.PI * 2,
        rate: 1.2 + Math.random() * 0.8,
        hop: 0, // 1 at the top of a jump, easing back to 0
        lean: Math.random() < 0.5 ? -1 : 1, // which way it sways when grooving
      };
      audience.add(head);
      heads.push(head);
    }
  const onStage = (px, pz) => Math.abs(px) < S.halfWidth && pz > S.back && pz < frontAt(px);
  let energy = 0; // how hard the crowd is grooving, 0 = idle sway, 1 = full swing
  // a note was played: pitch 0 (lowest) .. 1 (highest) picks which side of the crowd jumps
  const dance = (pitch) => {
    const x = (pitch - 0.5) * A.spread;
    heads.forEach((h) => {
      const near = 1 - Math.min(1, Math.abs(h.position.x - x) / A.reach);
      if (near > 0) h.userData.hop = Math.max(h.userData.hop, 0.4 + 0.6 * near);
    });
    energy = Math.min(1, energy + A.groove);
  };
  const animate = (now, dt) => {
    energy = Math.max(0, energy - dt / A.settle);
    const t = now * 0.001,
      swing = 1 + energy * 3; // grooving: bigger bob, faster, and a side-to-side sway
    heads.forEach((h) => {
      const u = h.userData;
      u.hop = Math.max(0, u.hop - dt * 2.6);
      const jump = Math.sin(Math.min(1, u.hop) * Math.PI) * A.hop * u.hop; // up and back down
      h.position.y = u.restY + Math.sin(t * u.rate * swing + u.phase) * A.bob * swing + jump;
      h.rotation.z = Math.sin(t * 0.7 * u.rate * swing + u.phase) * (0.06 + energy * 0.22) * u.lean;
      // a little squash on landing, stretch at the top of the jump
      const stretch = 1 + u.hop * 0.15;
      h.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
    });
  };
  return { stage, audience, onStage, animate, dance };
}


export { buildStage, STAGE };
