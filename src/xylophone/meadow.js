// THE MEADOW'S PLANTS, from the xylophone project: the flowers scattered
// through its grass, and the ferns and toadstools that spring up as the
// vibraphone and kalimba are played. In the project these are built
// inline in script.js, instanced and animated (growing, unfurling, sinking
// back); here each is one plant, built once and posed fully grown.
//   buildMeadowFlower(tools, scale)      a tulip-cupped flower on a stem
//   buildFern(tools, pitch, size)        a frond, unfurled and arched over
//   buildToadstools(tools, pitch, color) a cluster of spotted toadstools
// `tools` is { toonMat, inked } (see ink.js); `pitch` runs 0 (a low note:
// short and big) to 1 (a high note: tall and small), as in the game.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { FERNS } from "./ferns.js";
import { MUSHROOM_SPROUTS as MS } from "./mushrooms.js";

const lerp = (a, b, t) => a + (b - a) * t;
const mid = ([a, b]) => (a + b) / 2;

// ---------- the meadow flower (script.js: "flowers: scattered through the grass") ----------
export const FLOWERS = {
  stemHeight: 0.85,
  stemRadius: 0.025,
  headRadius: 0.09,
  petals: 6,
  petalLength: 0.32,
  petalWidth: 0.15,
  petalTilt: 1.05, // how steeply the petals rise from the center, radians. 0 = flat daisy, ~1 = tulip cup
  leaves: 2,
  leafLength: 0.3,
  leafWidth: 0.13,
  leafRise: 0.7,
  colors: COLOR_PALETTE.flowerColors,
  center: COLOR_PALETTE.flowerCenter,
  stem: COLOR_PALETTE.flowerStem,
  leaf: COLOR_PALETTE.flowerLeaf,
};

// concatenates geometries (positions and normals only) into one
function mergeGeos(geos) {
  const pos = [], nrm = [];
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

export function buildMeadowFlower({ toonMat, inked }, scale = 1, color = FLOWERS.colors[0]) {
  const F = FLOWERS, H = F.stemHeight;
  const g = new THREE.Group();
  const stem = new THREE.CylinderGeometry(F.stemRadius * 0.8, F.stemRadius, H, 6).translate(0, H / 2, 0);
  const center = new THREE.SphereGeometry(F.headRadius, 12, 8).scale(1, 0.55, 1).translate(0, H, 0);
  const petals = [];
  for (let i = 0; i < F.petals; i++) {
    const a = (i / F.petals) * Math.PI * 2, L = F.petalLength,
      d = F.headRadius * 0.5 + L / 2, out = Math.cos(F.petalTilt) * d, up = Math.sin(F.petalTilt) * d;
    petals.push(new THREE.SphereGeometry(1, 12, 8).scale(L / 2, 0.035, F.petalWidth / 2).rotateZ(F.petalTilt).rotateY(-a).translate(Math.cos(a) * out, H + up, Math.sin(a) * out));
  }
  const leaves = [];
  for (let k = 0; k < F.leaves; k++) {
    const L = F.leafLength, rise = F.leafRise, yaw = k * 2.4 + 0.5,
      y0 = H * (0.3 + (0.3 * k) / Math.max(1, F.leaves - 1)), out = (Math.cos(rise) * L) / 2;
    leaves.push(new THREE.SphereGeometry(1, 12, 8).scale(L / 2, 0.03, F.leafWidth / 2).rotateZ(rise).rotateY(-yaw).translate(Math.cos(yaw) * out, y0 + (Math.sin(rise) * L) / 2, Math.sin(yaw) * out));
  }
  g.add(
    inked(new THREE.Mesh(stem, toonMat(F.stem))),
    inked(new THREE.Mesh(center, toonMat(F.center))),
    inked(new THREE.Mesh(mergeGeos(petals), toonMat(color))),
    inked(new THREE.Mesh(mergeGeos(leaves), toonMat(F.leaf))),
  );
  g.scale.setScalar(scale);
  return g;
}

// ---------- the fern (script.js: "ferns: what the vibraphone grows") ----------
const fernStemGeo = new THREE.CylinderGeometry(0.03, 0.045, 1, 8).translate(0, 0.5, 0);
const fernLeafletGeo = new THREE.SphereGeometry(1, 10, 6).scale(FERNS.leafletLength / 2, 0.02, FERNS.leafletWidth / 2).translate(FERNS.leafletLength / 2, 0, 0);

// A fern of `count` fronds, each a chain of segments with a pair of
// leaflets at the end of each; `pose` bends it as the game's updateFern
// does once it is fully grown.
export function buildFern({ toonMat, inked }, pitch = 0.5, size = mid(FERNS.size), tint = null) {
  const P = FERNS;
  const stemH = lerp(P.stemByPitch[0], P.stemByPitch[1], pitch);
  const headScale = lerp(P.sizeByPitch[0], P.sizeByPitch[1], pitch) * size;
  const green = new THREE.Color(P.colors[0]);
  if (tint) green.lerp(new THREE.Color(tint), P.tint);
  const leafMat = toonMat(green), stemMat = toonMat(P.stem);
  const g = new THREE.Group(), segLen = stemH / P.segments, n = P.segments;
  // the tip curl is shared out over the last tipShare of the frond, and the middle bend over a hump at midAt
  const tipWeight = (t) => Math.max(0, t - (1 - P.tipShare)), midWeight = (t) => Math.max(0, 1 - Math.abs(t - P.midAt) / P.midWidth);
  let tipNorm = 0, midNorm = 0;
  for (let i = 0; i < n; i++) { tipNorm += tipWeight((i + 1) / n); midNorm += midWeight((i + 1) / n); }
  for (let k = 0; k < P.fronds; k++) {
    const frond = new THREE.Group();
    frond.rotation.order = "YXZ";
    frond.rotation.y = (k / P.fronds) * Math.PI * 2 + Math.random() * 0.6;
    frond.rotation.x = P.lean * (0.7 + Math.random() * 0.6);
    let parent = frond;
    for (let i = 0; i < n; i++) {
      const seg = new THREE.Group(), tipness = (i + 1) / n;
      const stem = inked(new THREE.Mesh(fernStemGeo, stemMat));
      stem.scale.set(1 - 0.5 * (i / n), segLen, 1 - 0.5 * (i / n));
      seg.add(stem);
      // fully grown and open: the arch, the middle bend and the tip curl, no furl left
      seg.rotation.x = P.arch / n + (midNorm ? (P.midArch * midWeight(tipness)) / midNorm : 0) + (tipNorm ? (P.tipCurl * tipWeight(tipness)) / tipNorm : 0);
      seg.position.y = i ? segLen : 0;
      const u = (i + 1) / (n + 1);
      [-1, 1].forEach((side) => {
        const pivot = new THREE.Object3D();
        pivot.rotation.y = side < 0 ? Math.PI : 0;
        pivot.position.y = segLen;
        pivot.scale.setScalar(headScale);
        const leaf = inked(new THREE.Mesh(fernLeafletGeo, leafMat));
        leaf.scale.setScalar(1 - 0.75 * u);
        leaf.rotation.z = P.open;
        pivot.add(leaf);
        seg.add(pivot);
      });
      parent.add(seg);
      parent = seg;
    }
    g.add(frond);
  }
  return g;
}

// ---------- the toadstools (script.js: "mushroom sprouts: what the kalimba grows") ----------
const msStemGeo = new THREE.CylinderGeometry(0.8, 1, 1, 12).translate(0, 0.5, 0);
const msCapGeo = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2 + 0.15).scale(1, MS.capH, 1);
const msGillGeo = new THREE.CylinderGeometry(0.95, 0.45, MS.capH * 0.3, 20).translate(0, -MS.capH * 0.15, 0);
const msSpotGeo = new THREE.SphereGeometry(1, 10, 6);
const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

function buildToadstool({ toonMat, inked }, capMat, capR, stemH) {
  const m = new THREE.Group(), stem = inked(new THREE.Mesh(msStemGeo, toonMat(MS.stemColor))), cap = new THREE.Group();
  cap.add(inked(new THREE.Mesh(msCapGeo, capMat)), inked(new THREE.Mesh(msGillGeo, toonMat(MS.gillColor))));
  const count = Math.round(between(MS.spots));
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2, ph = 0.15 + Math.random() * 0.95, sr = between(MS.spot),
      n = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) / MS.capH, Math.sin(ph) * Math.sin(th)),
      spot = inked(new THREE.Mesh(msSpotGeo, toonMat(MS.spotColor)));
    spot.scale.set(sr, sr * 0.5, sr);
    spot.position.set(Math.sin(ph) * Math.cos(th) * 0.97, Math.cos(ph) * MS.capH * 0.97, Math.sin(ph) * Math.sin(th) * 0.97);
    spot.lookAt(spot.position.clone().add(n));
    spot.rotateX(Math.PI / 2);
    cap.add(spot);
  }
  // fully grown and popped open (updateMushrooms at the end of its pop)
  stem.scale.set(capR * MS.stem, stemH, capR * MS.stem);
  cap.position.y = stemH;
  cap.scale.setScalar(capR);
  m.add(stem, cap);
  return m;
}

export function buildToadstools(tools, pitch = 0.5, color = null, size = mid(MS.size)) {
  const cap = new THREE.Color(MS.capBase);
  if (color) cap.lerp(new THREE.Color(color), MS.tint);
  const capMat = tools.toonMat(cap);
  const capR = lerp(MS.capByPitch[0], MS.capByPitch[1], pitch) * size;
  const stemH = lerp(MS.stemByPitch[0], MS.stemByPitch[1], pitch);
  const g = new THREE.Group(), n = Math.round(between(MS.cluster)), a0 = Math.random() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const k = i ? between(MS.little) : 1;
    const m = buildToadstool(tools, capMat, capR * k, stemH * (i ? 0.9 * k : 1));
    if (i) { const a = a0 + i * 2.2, d = capR * (0.45 + 0.9 * k); m.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); }
    m.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.25);
    g.add(m);
  }
  return g;
}
