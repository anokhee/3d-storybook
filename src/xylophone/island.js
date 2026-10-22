// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the coast: a beach, palm trees, an island with a palm tree and a sailboat, for the steel drums ----------
// Loaded after palette.js and materials.js, before script.js. Behind the fence the meadow ends in a strip of sand,
// and the sea (the kalimba's sea, moved up the beach: script.js) runs out to the horizon. Out on the water: a
// little sandy island with a leaning palm tree and a ring of foam, and a sailboat that bobs and rocks and drifts
// slowly back and forth. Everything out there stays within about 31 of the camera's target, inside the
// horizon cut (pushed out to 32 for the steel drums: STEELDRUM.horizon), so it always sits on the water however the camera turns. Which instrument shows it is each
// instrument's `coast` setting. Colors live in palette.js (islandSand, palmTrunk, palmLeaf, coconut, boatHull,
// boatDeck, sail, pennant, sand, foam)
const COAST = {
  beach: [8, 9.5], // the sand strip: from this far behind the player to where the water starts
  island: {
    at: [-10, -24], // x, z of its middle, relative to the player
    scale: 1.25, // scaled up (palm and all) to make up for being further out, so it looks as big as it did at 17 out
    r: 2.6, // radius at the waterline
    h: 0.8, // how high the mound rises
    foam: 0.3, // width of the foam ring round it
  },
  palm: {
    at: [0.4, 0.2], // where on the island it stands, relative to the island's middle
    h: 4.2, // trunk height
    lean: 0.35, // how far the trunk bends over at the top, radians
    segments: 9, // stacked pieces of trunk, each a slightly flared ring
    r: [0.2, 0.13], // trunk radius at the foot and at the crown
    fronds: 8,
    frond: { length: 2.6, width: 0.7, droop: 1.3 }, // droop: how far the tip hangs below where the frond starts
    coconuts: 3,
  },
  // palms on the sand either side of the player, just behind the ends of the arc, leaning out away from it:
  // at is x, z relative to the player, h the trunk height, turn which way the trunk bends (rotation.y)
  shorePalms: [
    { at: [-10, -1.5], h: 5.2, turn: Math.PI + 0.3 },
    { at: [-8, -6], h: 4.4, turn: Math.PI - 0.5 },
    { at: [10.5, -3], h: 5, turn: -0.2 },
  ],
  // little shells scattered over the sand, like the meadow's flowers: three kinds (a ribbed scallop fan, a round
  // ribbed cockle and a coiled spiral shell lying on its side), spun and tipped at random, a pastel each
  shells: {
    count: 60,
    keepClear: 11.5, // none within this distance of the player, where the pans and stool stand
    reach: 32, // nor further out than this (the horizon cuts them off before then anyway)
    palmClear: 1.6, // and none right up against a palm trunk
    kinds: { scallop: 0.45, cockle: 0.35, whelk: 0.2 }, // how often each turns up
    size: { scallop: [0.75, 1.05], cockle: [0.5, 0.7], whelk: [0.7, 0.95] }, // scale range of each
    tilt: 0.25, // how far one can lie tipped over, radians
  },
  boat: {
    at: [6, -14], // x, z of its home spot, relative to the player
    scale: 2, // the whole boat (its bob scales with it; drift is in world units)
    drift: 2.5, // how far either side of home it sails, world units
    driftTime: 40, // seconds for one full trip there and back
    bob: 0.08, // how far it rises and falls, world units
    roll: 0.07, // how far it rocks side to side, radians
    length: 2.6,
    beam: 0.9, // width at its widest
    hullH: 0.5,
    mast: 3.2,
  },
  colors: {
    beach: COLOR_PALETTE.sand,
    sand: COLOR_PALETTE.islandSand,
    foam: COLOR_PALETTE.foam,
    trunk: COLOR_PALETTE.palmTrunk,
    leaf: COLOR_PALETTE.palmLeaf,
    coconut: COLOR_PALETTE.coconut,
    hull: COLOR_PALETTE.boatHull,
    deck: COLOR_PALETTE.boatDeck,
    sail: COLOR_PALETTE.sail,
    pennant: COLOR_PALETTE.pennant,
    shells: COLOR_PALETTE.shells,
  },
};

// builds the coast into `scene`, hidden, positioned relative to the player at (x, z). `toonMat` and `inked` come
// from script.js, `ink` the outline material for instanced meshes (clipped at the horizon; null with outlines off), and `clip`
// is the horizon's clipping plane for the beach strip and the shells. Returns the group and
// animate(now): rocks and drifts the boat
function buildCoast(scene, { toonMat, inked, ink }, x, z, clip) {
  const C = COAST,
    coast = new THREE.Group();
  coast.name = "coast";
  coast.visible = false;
  coast.position.set(x, 0, z);
  scene.add(coast);
  const K = C.colors,
    mat = (hex) => toonMat(hex);

  // the beach: a long flat strip of sand from the fence to the water, cut at the horizon like the ground
  const beachMat = toonMat(K.beach);
  beachMat.clippingPlanes = [clip];
  const beachW = C.beach[1] - C.beach[0],
    beach = new THREE.Mesh(new THREE.PlaneGeometry(140, beachW), beachMat);
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, 0.015, -(C.beach[0] + beachW / 2));
  beach.receiveShadow = true;
  coast.add(beach);

  // the island: a low mound of sand with a foam ring round it at the waterline
  const I = C.island,
    island = new THREE.Group();
  island.position.set(I.at[0], 0, I.at[1]);
  island.scale.setScalar(I.scale);
  coast.add(island);
  const mound = inked(
    new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(I.r, I.h, I.r),
      mat(K.sand),
    ),
  );
  island.add(mound);
  const foam = new THREE.Mesh(
    new THREE.RingGeometry(I.r * 0.98, I.r + I.foam, 48).rotateX(-Math.PI / 2),
    mat(K.foam),
  );
  foam.position.y = 0.03;
  island.add(foam);

  // the palm, standing on the mound's surface
  const P = C.palm,
    palm = buildPalm(P, K, mat, inked);
  palm.position.set(P.at[0], I.h * Math.sqrt(Math.max(0, 1 - (Math.hypot(...P.at) / I.r) ** 2)) - 0.1, P.at[1]);
  palm.rotation.y = 0.6; // leans off to one side, and a little toward the viewer
  island.add(palm);

  // the sailboat (buildBoat), sailing across the view
  const B = C.boat,
    { boat, rocker, pennant } = buildBoat({ toonMat, inked }, B, K);
  boat.position.set(B.at[0], 0, B.at[1]);
  boat.rotation.y = Math.PI / 2 + 0.25;
  boat.scale.setScalar(B.scale);
  coast.add(boat);

  // nothing out here needs to throw shadows: it's beyond the sun's shadow camera
  coast.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });

  // the shells: one instanced mesh per kind, scattered over the sand in front of the water (built after the
  // traverse above, so they keep their shadows)
  const S = C.shells,
    shellGeos = { scallop: scallopGeo(), cockle: cockleGeo(), whelk: whelkGeo() },
    kinds = Object.keys(S.kinds),
    total = kinds.reduce((a, k) => a + S.kinds[k], 0),
    spots = Object.fromEntries(kinds.map((k) => [k, []])),
    between = ([a, b]) => a + Math.random() * (b - a);
  for (let i = 0; i < S.count; i++) {
    let px, pz;
    do {
      const r = Math.sqrt(between([(S.keepClear / S.reach) ** 2, 1])) * S.reach,
        th = Math.random() * Math.PI * 2;
      px = r * Math.sin(th);
      pz = r * Math.cos(th);
    } while (pz < -C.beach[1] + 0.3 || C.shorePalms.some(({ at }) => Math.hypot(px - at[0], pz - at[1]) < S.palmClear));
    let pick = Math.random() * total,
      kind = kinds.find((k) => (pick -= S.kinds[k]) < 0) || kinds[0];
    spots[kind].push([px, pz]);
  }
  const beachY = beach.position.y,
    v = new THREE.Vector3(),
    // the lowest y of a geometry's vertices once it's turned by q (at unit scale)
    lowest = (geo, q) => {
      const p = geo.attributes.position;
      let min = Infinity;
      for (let k = 0; k < p.count; k++) min = Math.min(min, v.fromBufferAttribute(p, k).applyQuaternion(q).y);
      return min;
    };
  const m = new THREE.Object3D(),
    axis = new THREE.Vector3(),
    tilt = new THREE.Quaternion(),
    col = new THREE.Color();
  kinds.forEach((kind) => {
    const shellMat = toonMat(0xffffff);
    shellMat.clippingPlanes = [clip];
    shellMat.side = THREE.DoubleSide; // the scallop is an open fan, and the spiral's mouth is open
    shellMat.vertexColors = true; // the stripes and rings
    const shells = new THREE.InstancedMesh(shellGeos[kind], shellMat, spots[kind].length);
    spots[kind].forEach(([px, pz], i) => {
      m.quaternion.setFromAxisAngle(axis.set(0, 1, 0), Math.random() * Math.PI * 2);
      const a = Math.random() * Math.PI * 2;
      m.quaternion.premultiply(tilt.setFromAxisAngle(axis.set(Math.cos(a), 0, Math.sin(a)), Math.random() * S.tilt));
      const size = between(S.size[kind]);
      m.scale.setScalar(size);
      // however it's tipped, lift it so its lowest point rests on the sand (the beach strip sits a hair above
      // the ground) and nothing pokes down through it
      const onBeach = pz < -C.beach[0] && pz > -C.beach[1],
        floorY = (onBeach ? beachY : 0) + 0.004;
      m.position.set(px, floorY - lowest(shellGeos[kind], m.quaternion) * size, pz);
      m.updateMatrix();
      shells.setMatrixAt(i, m.matrix);
      shells.setColorAt(i, col.set(K.shells[Math.floor(Math.random() * K.shells.length)]).convertSRGBToLinear());
    });
    shells.castShadow = shells.receiveShadow = true;
    shells.frustumCulled = false; // spread all over the sand
    coast.add(shells);
    if (ink) {
      const hull = new THREE.InstancedMesh(shellGeos[kind], ink, spots[kind].length);
      hull.instanceMatrix = shells.instanceMatrix; // same placements, shared buffer
      hull.frustumCulled = false;
      coast.add(hull);
    }
  });

  // palms on the shore either side of the player, near enough to throw shadows on the sand (built after the
  // traverse above, so they keep theirs)
  C.shorePalms.forEach(({ at, h, turn }) => {
    const p = buildPalm({ ...C.palm, h }, K, mat, inked);
    p.position.set(at[0], -0.05, at[1]);
    p.rotation.y = turn;
    coast.add(p);
  });

  const phase = Math.random() * 10;
  const animate = (now) => {
    const t = now / 1000 + phase;
    boat.position.x = B.at[0] + Math.sin((t / B.driftTime) * Math.PI * 2) * B.drift;
    rockBoat({ rocker, pennant }, t, B);
  };
  return { coast, animate };
}

// the sailboat: a hull tapering in toward its keel, a deck, a mast with a mainsail and a jib, and a pennant.
// Pointing along +x, its waterline at the group's origin, at unit scale (COAST.boat's shape in `B`, the coast's
// colors in `K`). Returns the group, the `rocker` inside it (what bobs and rocks, so the group itself can
// drift) and the `pennant`, for the breeze; rockBoat moves them
function buildBoat({ toonMat, inked }, B = COAST.boat, K = COAST.colors) {
  const mat = (hex) => toonMat(hex),
    boat = new THREE.Group(),
    rocker = new THREE.Group();
  boat.add(rocker);
  const L = B.length / 2,
    W = B.beam / 2,
    outline = new THREE.Shape();
  // the deck seen from above: a pointed bow at +x, a squared-off, rounded stern at -x
  outline.moveTo(-L, -W * 0.75);
  outline.quadraticCurveTo(-L * 0.2, -W * 1.05, L * 0.45, -W * 0.8);
  outline.quadraticCurveTo(L * 0.85, -W * 0.45, L, 0);
  outline.quadraticCurveTo(L * 0.85, W * 0.45, L * 0.45, W * 0.8);
  outline.quadraticCurveTo(-L * 0.2, W * 1.05, -L, W * 0.75);
  outline.quadraticCurveTo(-L * 1.06, 0, -L, -W * 0.75);
  const hullGeo = new THREE.ExtrudeGeometry(outline, { depth: B.hullH, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2);
  // pull the bottom in toward the keel, so the hull narrows below the waterline and sits down in the water
  const hp = hullGeo.attributes.position;
  for (let k = 0; k < hp.count; k++)
    if (hp.getY(k) < B.hullH / 2) {
      hp.setX(k, hp.getX(k) * 0.8);
      hp.setZ(k, hp.getZ(k) * 0.35);
    }
  hullGeo.computeVertexNormals();
  const hull = inked(new THREE.Mesh(hullGeo, mat(K.hull)));
  hull.position.y = -B.hullH * 0.45;
  rocker.add(hull);
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(outline, 10).rotateX(-Math.PI / 2).scale(0.9, 1, 0.85), mat(K.deck));
  deck.position.y = B.hullH * 0.55 + 0.01;
  rocker.add(deck);
  const mastX = L * 0.15,
    mastMat = mat(K.deck),
    mast = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, B.mast, 8).translate(0, B.mast / 2, 0), mastMat));
  mast.position.set(mastX, B.hullH * 0.55, 0);
  rocker.add(mast);
  const boom = inked(
    new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L * 1.05, 6).rotateZ(Math.PI / 2).translate(-L * 0.52, 0, 0), mastMat),
  );
  boom.position.set(mastX, B.hullH * 0.55 + 0.35, 0);
  rocker.add(boom);
  // sails: flat triangles in the boat's center plane
  const sailMat = mat(K.sail);
  sailMat.side = THREE.DoubleSide;
  const sail = (pts) =>
    inked(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)))), sailMat));
  const y0 = B.hullH * 0.55 + 0.37;
  const main = sail([[0, 0], [0, B.mast - 0.45], [-L * 1.05, 0]]);
  main.position.set(mastX - 0.03, y0, 0);
  rocker.add(main);
  const jib = sail([[0, 0], [0, B.mast * 0.78], [L * 0.8, -0.05]]);
  jib.position.set(mastX + 0.05, y0 - 0.1, 0);
  rocker.add(jib);
  const pennant = new THREE.Mesh(
    new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.55, -0.1), new THREE.Vector2(0, -0.22)])),
    mat(K.pennant),
  );
  pennant.material.side = THREE.DoubleSide;
  pennant.position.set(mastX, B.hullH * 0.55 + B.mast, 0);
  rocker.add(pennant);

  return { boat, rocker, pennant };
}
// one frame of the boat's bob and rock (t in seconds)
function rockBoat({ rocker, pennant }, t, B = COAST.boat) {
  rocker.position.y = Math.sin(t * 1.3) * B.bob;
  rocker.rotation.x = Math.sin(t * 0.9) * B.roll; // side to side (the boat points along its local x)
  rocker.rotation.z = Math.sin(t * 1.1 + 1) * B.roll * 0.5; // bow up and down
  pennant.rotation.y = Math.sin(t * 5) * 0.25;
}

// a palm tree, its foot at the group's origin: a trunk of stacked flared rings following a curve that bends over
// toward the top (along local +x), a crown of drooping fronds, and coconuts under them. `P` is COAST.palm's shape
function buildPalm(P, K, mat, inked) {
  const palm = new THREE.Group();
  const trunkMat = mat(K.trunk),
    along = (u) => new THREE.Vector3(Math.sin(u * u * P.lean * 2) * P.h * 0.35, u * P.h, 0), // the trunk's center line, bending over as it rises
    segLen = P.h / P.segments;
  for (let i = 0; i < P.segments; i++) {
    const u0 = i / P.segments,
      u1 = (i + 1) / P.segments,
      a = along(u0),
      b = along(u1),
      r0 = P.r[0] + (P.r[1] - P.r[0]) * u0,
      r1 = P.r[0] + (P.r[1] - P.r[0]) * u1,
      // each ring flares out at its top, so the trunk reads as stacked scales
      seg = inked(
        new THREE.Mesh(new THREE.CylinderGeometry(r1 * 1.25, r0 * 0.95, segLen * 1.05, 10).translate(0, segLen / 2, 0), trunkMat),
      );
    seg.position.copy(a);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    palm.add(seg);
  }
  const top = along(1);
  // a frond: a strip tapering to a point, folded along its midrib and arching down toward its tip
  const F = P.frond,
    frondGeo = new THREE.PlaneGeometry(F.length, F.width, 12, 2).translate(F.length / 2, 0, 0).rotateX(-Math.PI / 2),
    pos = frondGeo.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const u = pos.getX(k) / F.length, // 0 at the crown, 1 at the tip
      side = pos.getZ(k) / (F.width / 2); // -1 .. 1 across
    const w = Math.sin(Math.min(1, u * 1.15) * Math.PI) * (1 - 0.3 * u); // widest a third along, a point at each end
    pos.setZ(k, side * (F.width / 2) * w);
    pos.setY(k, 0.25 * u - F.droop * u * u + Math.abs(side) * w * 0.12); // up a little, then arching down; the V fold
  }
  frondGeo.computeVertexNormals();
  const leafMat = mat(K.leaf);
  leafMat.side = THREE.DoubleSide;
  for (let i = 0; i < P.fronds; i++) {
    const frond = inked(new THREE.Mesh(frondGeo, leafMat));
    frond.position.copy(top);
    frond.rotation.set(0, (i / P.fronds) * Math.PI * 2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.3, "YXZ");
    palm.add(frond);
  }
  const nutMat = mat(K.coconut);
  for (let i = 0; i < P.coconuts; i++) {
    const a = (i / P.coconuts) * Math.PI * 2,
      nut = inked(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), nutMat));
    nut.position.copy(top).add(new THREE.Vector3(Math.cos(a) * 0.2, -0.22, Math.sin(a) * 0.2));
    palm.add(nut);
  }
  return palm;
}

// the shells, each about a unit across. Each carries a vertex color (stripes, growth rings) that the instance's
// pastel tints, so the markings show whatever color it gets
const shellShade = (g, shade) => {
  const p = g.attributes.position,
    c = new Float32Array(p.count * 3);
  for (let k = 0; k < p.count; k++) c.fill(shade(k), k * 3, k * 3 + 3);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
};
// a scallop: a fan of ribs spreading from a straight hinge (the two corners of which make its "ears"), domed up
// in the middle, with a wavy rim where the ribs meet it and a stripe down every other rib
function scallopGeo() {
  const A = 0.95, // half the fan's spread, radians
    ribs = 15,
    us = 10,
    as = 90,
    pos = [],
    shade = [],
    idx = [];
  for (let i = 0; i <= us; i++) {
    const u = i / us; // 0 at the hinge, 1 at the rim
    for (let j = 0; j <= as; j++) {
      const a = -A + (2 * A * j) / as,
        wave = Math.cos(((a + A) / (2 * A)) * ribs * Math.PI * 2), // +1 on a rib, -1 in a groove
        R = (1 - 0.28 * (a / A) ** 4) * (1 + 0.035 * wave * u), // shoulders rounded in; the rim scalloped
        w = 0.27 * (a / A) * (1 - u); // the hinge line, narrowing into the fan
      pos.push(
        w + Math.sin(a) * u * R,
        0.26 * Math.sin(u * Math.PI * 0.8) * (1 - 0.45 * (a / A) ** 2) + 0.045 * u * Math.max(0, wave),
        0.5 - Math.cos(a) * u * R,
      );
      shade.push(wave > 0.2 ? 1 : 0.72);
    }
  }
  for (let i = 0; i < us; i++)
    for (let j = 0; j < as; j++) {
      const a = i * (as + 1) + j,
        b = a + as + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return shellShade(g, (k) => shade[k]);
}
// a cockle: a tall dome with its peak (the umbo) pushed toward the hinge end, deep ribs running down to a wavy
// rim, and darker growth rings round it
function cockleGeo() {
  const g = new THREE.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.9, 0.7, 1),
    p = g.attributes.position,
    ring = [];
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k),
      y = p.getY(k),
      z = p.getZ(k),
      rib = 1 + 0.1 * Math.cos(Math.atan2(z, x) * 16) * (1 - y / 0.7);
    p.setXYZ(k, x * rib, y, z * rib + 0.3 * (y / 0.7) ** 2);
    ring.push(y);
  }
  g.computeVertexNormals();
  return shellShade(g, (k) => (Math.sin((ring[k] / 0.7) * Math.PI * 4.5) > 0.55 ? 0.75 : 1));
}
// a spiral shell: a tube that coils up a cone, thickening from the pointed tip to an open mouth, lying on its side,
// with a band running round each whorl
function whelkGeo() {
  const turns = 3.3,
    helixR = (t) => 0.04 + 0.34 * t ** 1.3,
    tubeR = (t) => 0.03 + 0.3 * t ** 1.3,
    curve = new THREE.Curve();
  curve.getPoint = (t, out = new THREE.Vector3()) => {
    const th = t * turns * Math.PI * 2;
    return out.set(helixR(t) * Math.cos(th), 1.2 * (1 - t) ** 1.2, helixR(t) * Math.sin(th));
  };
  const segs = 140,
    radial = 12,
    g = new THREE.TubeGeometry(curve, segs, 1, radial, false),
    p = g.attributes.position,
    c = new THREE.Vector3(),
    v = new THREE.Vector3(),
    band = [];
  // the tube comes out at radius 1: pull each ring in round its center to the size the shell has there
  for (let i = 0; i <= segs; i++) {
    const t = curve.getUtoTmapping(i / segs);
    curve.getPoint(t, c);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(tubeR(t)).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
      band.push(Math.cos((j / radial) * Math.PI * 2) > 0.6 ? 0.72 : 1);
    }
  }
  g.computeVertexNormals();
  g.rotateZ(Math.PI / 2 - 0.25).center();
  return shellShade(g, (k) => band[k]);
}


export { buildCoast, buildPalm, buildBoat, rockBoat, COAST, scallopGeo, cockleGeo, whelkGeo };
