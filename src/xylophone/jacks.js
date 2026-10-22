// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- jack-in-the-boxes: what the toy xylophone's notes set off instead of growing flowers ----------
// Loaded after palette.js, before script.js. A row of giant toy boxes on the playroom floor behind the player,
// facing the camera, low notes' end on the left to high notes' end on the right. The boxes are always there; a
// note pops the jack out of the box nearest it: the lid flips open, the spring shoots up and overshoots, the clown head wobbles on top, the crank on the
// side spins. Every clown's head is its own size, with ears, a hat tipped its own way, and either open eyes or
// happy closed ones. It stays up while notes keep coming nearby and sinks back once they stop. Toon shaded and inked
// like everything else.
const JACKS = {
  count: 8,
  scale: 3, // how much bigger than toy size everything is: the sizes below are before this
  row: {
    x: [-20, 20], // where the leftmost and rightmost boxes stand, across the scene
    z: [11, 14.5], // how far behind the player they stand: alternate boxes go to the nearer and the further
  },
  box: 1.1, // edge length of a box
  spring: { length: 1.4, radius: 0.2, turns: 7, wire: 0.04 }, // fully out
  head: 0.42, // radius of the clown's head, before its own size
  headSize: [0.8, 1.4], // random per-clown head size multiplier (the hat, face and ears grow with it)
  hatTip: [0.12, 0.42], // how far a hat tips from upright, radians, in a random direction (never far forward over the eyes)
  sleepy: 3, // every this many clowns has its eyes closed in a smile, starting with the second
  linger: 2, // seconds a jack stays up after the last note near it
  boing: { stiffness: 170, damping: 7 }, // the spring's bounce: stiffer is faster, less damping overshoots more
  // two notes for the same box at once (a chord, or both hands on neighbors): the whole box hops
  together: 0.1, // seconds apart two notes can be and still count as at once
  hop: { speed: 9, gravity: 40, squash: 0.25 }, // take-off speed and gravity in world units, and how much it squashes on landing
  // each side of a box is decorated: a raised border frame in the lid's color and a big shape in the middle,
  // both standing a little proud of the side so they take the same ink outline as everything else. Shapes: a
  // number is a polygon with that many sides, "star5" a five-point star
  decoration: {
    shapes: [3, 4, 5, 6, 8, "star5"],
    border: 0.16, // how wide the frame is, as a share of the side
    center: 0.26, // the middle shape's radius, as a share of the side
    raise: 0.025, // how far the frame stands off the side, and the shapes off the frame (toy size)
  },
  colors: {
    boxes: COLOR_PALETTE.blockColors, // each box takes one of these, and its lid and border frame the next
    face: "#FFE3C8",
    earInside: "#F4B6A6",
    features: "#2B1D1A", // eyes
    nose: "#E63946",
    hats: ["#4D96FF", "#FFD93D", "#B983FF", "#6BCB77"],
    pompom: "#FFFFFF",
    collar: "#FFFFFF",
    spring: "#C9CFD8",
    crank: "#8E98A6",
  },
};

// builds the boxes into `scene`, in a row behind the player standing at (x, z). Returns the group, pop(k): set
// off box k (0 is the leftmost), and animate(dt)
function buildJacks(scene, { toonMat, inked }, x0, z0) {
  const J = JACKS,
    C = J.colors,
    S = J.spring,
    group = new THREE.Group();
  group.name = "jacks";
  scene.add(group);
  // the spring: a helix of wire, one unit tall, stretched to how far out it is
  class Helix extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const a = t * S.turns * Math.PI * 2;
      return target.set(Math.cos(a) * S.radius, t, Math.sin(a) * S.radius);
    }
  }
  const springGeo = new THREE.TubeGeometry(new Helix(), S.turns * 16, S.wire, 6, false),
    springMat = toonMat(C.spring),
    faceMat = toonMat(C.face),
    featureMat = toonMat(C.features),
    noseMat = toonMat(C.nose),
    pompomMat = toonMat(C.pompom),
    collarMat = toonMat(C.collar),
    crankMat = toonMat(C.crank),
    earInsideMat = toonMat(C.earInside),
    eyeGeo = new THREE.SphereGeometry(0.055, 10, 8),
    eyeArcGeo = new THREE.TorusGeometry(0.055, 0.017, 6, 12, Math.PI), // the top half of a ring: ^
    earGeo = new THREE.SphereGeometry(1, 14, 10).scale(0.05, 0.13, 0.1),
    earInsideGeo = new THREE.SphereGeometry(1, 12, 8).scale(0.02, 0.085, 0.06),
    B = J.box,
    lidT = 0.1;
  // the decorations are flat pieces built on a side lying in x-y facing +z, then turned onto each side of the
  // box. Each box's pieces are merged into one geometry per color, so a whole box is only a few draw calls
  const D = J.decoration;
  // a flat shape r across, `t` thick, facing +z from z = 0: a polygon of n sides (flat bottomed), or a star
  function shapeGeo(shape, r, t) {
    const star = typeof shape === "string",
      n = star ? parseInt(shape.slice(4)) * 2 : shape,
      outline = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + (i * 2 * Math.PI) / n + (!star && n % 2 === 0 ? Math.PI / n : 0),
        rr = star && i % 2 ? r * 0.45 : r;
      outline[i ? "lineTo" : "moveTo"](rr * Math.cos(a), rr * Math.sin(a));
    }
    return new THREE.ExtrudeGeometry(outline, { depth: t, bevelEnabled: false });
  }
  // the frame: a square B across with a square hole, `t` thick
  function frameGeo(side, band, t) {
    const h = side / 2,
      g = h - band,
      outer = new THREE.Shape([
        new THREE.Vector2(-h, -h),
        new THREE.Vector2(h, -h),
        new THREE.Vector2(h, h),
        new THREE.Vector2(-h, h),
      ]);
    outer.holes.push(
      new THREE.Path([new THREE.Vector2(-g, -g), new THREE.Vector2(-g, g), new THREE.Vector2(g, g), new THREE.Vector2(g, -g)]),
    );
    return new THREE.ExtrudeGeometry(outer, { depth: t, bevelEnabled: false });
  }
  // joins geometries (positions and normals) into one
  function merge(geos) {
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
  }
  const jacks = Array.from({ length: J.count }, (_, k) => {
    const root = new THREE.Group(),
      [xa, xb] = J.row.x;
    root.position.set(x0 + xa + ((xb - xa) * k) / (J.count - 1), 0, z0 - J.row.z[k % 2]);
    root.scale.setScalar(J.scale); // local +z faces the camera
    group.add(root);
    const boxCol = C.boxes[k % C.boxes.length],
      lidCol = C.boxes[(k + 1) % C.boxes.length];
    const box = inked(new THREE.Mesh(new THREE.BoxGeometry(B, B, B), toonMat(boxCol)));
    box.position.y = B / 2;
    root.add(box);
    // the four sides each decorated differently: a different big shape on each
    {
      const band = D.border * B,
        t = D.raise,
        frames = [],
        bigs = [],
        onSide = new THREE.Matrix4(),
        spin = new THREE.Matrix4();
      for (let f = 0; f < 4; f++) {
        // side f faces +z turned f quarter turns round y, its middle at the box's middle height
        const place = (geo, x, y, z) =>
          geo.translate(x, y, z).applyMatrix4(onSide.makeRotationY((f * Math.PI) / 2).multiply(spin.makeTranslation(0, B / 2, B / 2)));
        frames.push(place(frameGeo(B, band, t), 0, 0, 0));
        bigs.push(place(shapeGeo(D.shapes[(k + f) % D.shapes.length], D.center * B, t * 2), 0, 0, 0));
      }
      [
        [frames, lidCol],
        [bigs, C.hats[k % C.hats.length]],
      ].forEach(([geos, col]) => root.add(inked(new THREE.Mesh(merge(geos), toonMat(col)))));
    }
    // the lid, hinged along the box's back edge, so it flips back out of the way of the clown's face
    const hinge = new THREE.Group();
    hinge.position.set(0, B, -B / 2);
    const lid = inked(new THREE.Mesh(new THREE.BoxGeometry(B + 0.08, lidT, B + 0.08), toonMat(lidCol)));
    lid.position.set(0, lidT / 2, B / 2);
    hinge.add(lid);
    root.add(hinge);
    // the crank on the right side: an axle, an arm, and a knob
    const crank = new THREE.Group();
    crank.position.set(B / 2 + 0.1, B * 0.5, 0); // clear of the side's raised decoration
    const axle = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10), crankMat));
    axle.rotation.z = Math.PI / 2;
    const arm = inked(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.08), crankMat));
    arm.position.set(0.08, 0.18, 0);
    const knob = inked(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), toonMat(lidCol)));
    knob.position.set(0.16, 0.36, 0);
    crank.add(axle, arm, knob);
    root.add(crank);
    // the jack: the spring from the bottom of the box, and on top of it the collar, the head and the hat
    const jack = new THREE.Group();
    const spring = new THREE.Mesh(springGeo, springMat);
    spring.position.y = 0.1;
    jack.add(spring);
    const top = new THREE.Group(); // rides the top of the spring
    const collar = inked(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.09, 8, 20), collarMat));
    collar.rotation.x = Math.PI / 2;
    // the face: built round the head's center, then the whole thing sized, so the features, ears and hat grow
    // with the head. It sits on the collar
    const size = J.headSize[0] + Math.random() * (J.headSize[1] - J.headSize[0]),
      face = new THREE.Group();
    face.position.y = J.head * size + 0.05;
    face.scale.setScalar(size);
    const head = inked(new THREE.Mesh(new THREE.SphereGeometry(J.head, 24, 16), faceMat));
    face.add(head);
    const sleepy = k % J.sleepy === 1;
    [-1, 1].forEach((side) => {
      const at = new THREE.Vector3(side * 0.15, 0.09, J.head * 0.9);
      if (sleepy) {
        // closed and smiling: a little arch of ink, like ^, lying on the face
        const arc = new THREE.Mesh(eyeArcGeo, featureMat);
        arc.position.copy(at).multiplyScalar(1.02);
        arc.lookAt(at.clone().multiplyScalar(2));
        face.add(arc);
      } else {
        const eye = new THREE.Mesh(eyeGeo, featureMat);
        eye.position.copy(at);
        face.add(eye);
      }
      // an ear on each side: a flattened oval standing out from the head, with a pinker inside
      const ear = inked(new THREE.Mesh(earGeo, faceMat));
      ear.position.set(side * J.head * 0.95, 0.0, -0.02);
      ear.rotation.y = side * 0.35; // turned a little to the front
      face.add(ear);
      const inside = new THREE.Mesh(earInsideGeo, earInsideMat);
      inside.position.set(side * (J.head * 0.95 + 0.035), 0.0, 0.0);
      inside.rotation.y = side * 0.35;
      face.add(inside);
    });
    const nose = inked(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), noseMat));
    nose.position.set(0, -0.03, J.head + 0.02);
    face.add(nose);
    // the hat sits on the crown, tipped its own way. It turns about the head's center rather than its own, so
    // its base stays down on the head all round however far it tips: the base is as high above the center as
    // the head's surface is where it is as wide as the hat
    const hatR = 0.3,
      hatH = 0.6,
      seat = Math.sqrt(J.head * J.head - hatR * hatR),
      hatPivot = new THREE.Group(),
      tip = J.hatTip[0] + Math.random() * (J.hatTip[1] - J.hatTip[0]),
      way = Math.random() * Math.PI * 2;
    hatPivot.rotation.set(Math.min(0.08, Math.sin(way) * tip), 0, Math.cos(way) * tip); // x > 0 tips it forward
    const hat = inked(
      new THREE.Mesh(new THREE.ConeGeometry(hatR, hatH, 16), toonMat(C.hats[k % C.hats.length])),
    );
    hat.position.y = seat + hatH / 2;
    const pompom = inked(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), pompomMat));
    pompom.position.y = seat + hatH + 0.03;
    hatPivot.add(hat, pompom);
    face.add(hatPivot);
    top.add(collar, face);
    jack.add(top);
    root.add(jack);
    return { root, hinge, crank, jack, spring, top, x: 0, v: 0, lid: 0, upFor: 0, last: -1, y: 0, vy: 0, squash: 0 };
  });
  // a jack tucked away: squashed flat inside its box, out of sight under the lid
  function place(j) {
    const out = Math.max(0, j.x),
      len = 0.05 + out * S.length;
    j.spring.scale.y = len;
    j.top.position.y = 0.1 + len;
    j.jack.visible = j.lid > 0.05 || out > 0.01;
    j.top.rotation.z = Math.sin(j.x * 9) * 0.25 * Math.min(1, j.v * j.v * 0.02); // a wobble while it bounces
    j.hinge.rotation.x = -j.lid * 2.2; // open, it lies back past upright
  }
  jacks.forEach(place);
  let clock = 0;
  return {
    group,
    // every jack straight back in its box with the lid shut, no bounce or hop left over
    reset() {
      jacks.forEach((j) => {
        Object.assign(j, { x: 0, v: 0, lid: 0, upFor: 0, y: 0, vy: 0, squash: 0 });
        j.root.position.y = 0;
        j.root.scale.setScalar(J.scale);
        place(j);
      });
    },
    pop(k) {
      const j = jacks[k];
      if (!j) return;
      if (j.upFor <= 0 && j.x < 0.5) j.v += 4; // a kick, so it shoots up rather than easing out
      j.upFor = J.linger;
      // a second note for this box at the same moment: it hops, and the jack gets an extra boing
      if (clock - j.last < J.together && j.y <= 0) {
        j.vy = J.hop.speed;
        j.v += 3;
      }
      j.last = clock;
    },
    animate(dt) {
      clock += dt;
      jacks.forEach((j) => {
        // the hop: up and down under gravity, then a squash on landing that springs back
        if (j.y > 0 || j.vy > 0) {
          j.vy -= J.hop.gravity * dt;
          j.y += j.vy * dt;
          if (j.y <= 0) {
            j.y = j.vy = 0;
            j.squash = 1;
          }
        }
        j.squash = Math.max(0, j.squash - dt * 5);
        const sq = J.hop.squash * Math.sin(j.squash * Math.PI);
        j.root.position.y = j.y;
        j.root.scale.set(J.scale * (1 + sq * 0.5), J.scale * (1 - sq), J.scale * (1 + sq * 0.5));
        j.upFor -= dt;
        const up = j.upFor > 0;
        // the lid: open fast when the jack is on its way up, shut once it is back down inside
        const lidTo = up || j.x > 0.08 ? 1 : 0;
        j.lid += (lidTo - j.lid) * Math.min(1, dt * (lidTo ? 18 : 10));
        // the spring: out once the lid is mostly open, back in when its time is up
        const target = up && j.lid > 0.6 ? 1 : 0;
        j.v += ((target - j.x) * J.boing.stiffness - j.v * J.boing.damping) * dt;
        j.x += j.v * dt;
        if (!up && j.x < 0) j.x = j.v = 0; // it doesn't bounce below the bottom of the box
        j.crank.rotation.x -= (up ? 10 : 0) * dt * (1 - Math.min(1, j.x)); // cranking, until it pops
        place(j);
      });
    },
  };
}


export { buildJacks, JACKS };
