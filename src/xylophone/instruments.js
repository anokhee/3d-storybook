// THE INSTRUMENTS, from the xylophone project: the bars fan round a half
// circle, and each instrument is a base built under the same bars with
// the bars restyled: the toy xylophone's wooden pull-along plate on wheels,
// the vibraphone's steel frame with resonator tubes, the piano's keys on a
// thin body, the kalimba's box with the bars as tines, the steel drums'
// pans with the bars as pads, and the handheld's buttons with a console
// behind. In the project all of this is inline in script.js and switched
// between at play; here each is one builder returning a group, stood on
// the ground with the arc's center at the origin.
//
//   buildXylophone(scene, tools) .. buildHandheld(scene, tools): like the
//   project's other builders, each adds what it builds to `scene` and
//   returns it; `tools` is { toonMat, inked } (see ink.js).
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { ARC, XYLOPHONE } from "./xylophone.js";
import { VIBRAPHONE } from "./vibraphone.js";
import { PIANO } from "./piano.js";
import { KALIMBA } from "./kalimba.js";
import { STEELDRUM } from "./steeldrum.js";
import { GAMEBOY } from "./gameboy.js";
import { MATERIALS } from "./materials.js";

// ---------- the notes and the arc ----------
const KEY_ORDER = "zxcvbnmasdfghjklqwertyuiop";
const SCALE = [{ name: "C", semis: 0 }, { name: "D", semis: 2 }, { name: "E", semis: 4 }, { name: "F#", semis: 6, acc: true }, { name: "G", semis: 7 }, { name: "A", semis: 9 }, { name: "B", semis: 11 }];
const RAINBOW = XYLOPHONE.colors.bars;
export const BAR_T = ARC.barThickness;
export const NOTES = [...KEY_ORDER].map((key, i) => {
  const deg = SCALE[i % SCALE.length], octave = 3 + Math.floor(i / SCALE.length);
  return { note: deg.name + octave, key, sharp: !!deg.acc, freq: 130.81 * Math.pow(2, octave - 3 + deg.semis / 12), color: RAINBOW[i % RAINBOW.length] };
});
const BAR_W = ARC.barWidth, RAIL_H = 0.5, RAIL_W = 0.46;
// The arc's center is the origin here (the project puts it at ARC.center).
const ACX = 0, ACZ = 0;
const thetaAt = (t) => Math.PI - ARC.span * t;
const barLenAt = (t) => ARC.lenMax - (ARC.lenMax - ARC.lenMin) * t;
const railOff = (t) => barLenAt(t) / 2 - 0.55;
const yawAt = (th) => Math.atan2(Math.cos(th), Math.sin(th));
const END_PAD = 0.8 / ARC.radius;
const plateTop = XYLOPHONE.plateT, railTopY = plateTop + RAIL_H, barY = railTopY + 0.06 + BAR_T / 2;
const onArc = (th, r = ARC.radius) => [ACX + r * Math.cos(th), ACZ + r * Math.sin(th)];
const plateW = XYLOPHONE.plateWidth, plateR = ARC.radius + XYLOPHONE.plateOffset;

function roundedBar(w, l, t) {
  const r = 0.16, hw = w / 2 - 0.05, hl = l / 2 - 0.05, sh = new THREE.Shape();
  sh.moveTo(-hw + r, -hl); sh.lineTo(hw - r, -hl); sh.quadraticCurveTo(hw, -hl, hw, -hl + r); sh.lineTo(hw, hl - r);
  sh.quadraticCurveTo(hw, hl, hw - r, hl); sh.lineTo(-hw + r, hl); sh.quadraticCurveTo(-hw, hl, -hw, hl - r); sh.lineTo(-hw, -hl + r);
  sh.quadraticCurveTo(-hw, -hl, -hw + r, -hl);
  const g = new THREE.ExtrudeGeometry(sh, { depth: t - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.center();
  return g;
}
// a curved band round the arc: radiusAt(t) ± width/2, standing `height` tall from y = 0
function arcBand(radiusAt, width, height, pad = END_PAD, steps = 48) {
  const t0 = -pad / ARC.span, t1 = 1 + pad / ARC.span, sh = new THREE.Shape();
  const edge = (k, off) => onArc(thetaAt(t0 + ((t1 - t0) * k) / steps), radiusAt(t0 + ((t1 - t0) * k) / steps) + off);
  for (let k = 0; k <= steps; k++) { const [x, z] = edge(k, width / 2); k ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  for (let k = steps; k >= 0; k--) sh.lineTo(...edge(k, -width / 2));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: height, bevelEnabled: false });
  g.rotateX(Math.PI / 2); g.translate(0, height, 0);
  return g;
}
// a cylinder from a to b (Vector3s), for legs that lean
const rod = (inked, a, b, r, mat) => {
  const dir = b.clone().sub(a), m = inked(new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 10), mat));
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
};

// The bars, low to high round the arc, each pointing out along its radius,
// with their washers and pins. Returns the instrument group (lifted by
// XYLOPHONE.lift + raise) and the bars for a base to build under.
export function buildBars({ toonMat, inked }, raise = 0) {
  const metal = toonMat(COLOR_PALETTE.metal);
  const xylophone = new THREE.Group();
  xylophone.position.y = XYLOPHONE.lift + raise;
  const bars = [], barMeshes = [];
  NOTES.forEach((note, i) => {
    const t = i / (NOTES.length - 1), th = thetaAt(t), len = barLenAt(t), [bx, bz] = onArc(th);
    const bar = new THREE.Group();
    bar.position.set(bx, barY, bz);
    bar.rotation.y = yawAt(th);
    // `hit` is where a mallet lands on it, in the scene (the group is lifted
    // by XYLOPHONE.lift + raise); `angle` which way it lies from the arc's center.
    bar.userData = { note: note.note, freq: note.freq, index: bars.length, angle: Math.atan2(bx, bz), len, sharp: note.sharp, posts: [], restY: barY, hit: new THREE.Vector3(bx, XYLOPHONE.lift + raise + barY, bz) };
    const mesh = inked(new THREE.Mesh(roundedBar(BAR_W, len, BAR_T), toonMat(note.color)));
    mesh.userData.bar = bar;
    bar.add(mesh);
    barMeshes.push(mesh);
    [1, -1].forEach((side) => {
      const zz = side * railOff(t);
      const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), metal);
      washer.position.set(0, BAR_T / 2 + 0.015, zz);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal);
      head.position.set(0, BAR_T / 2 + 0.03, zz);
      head.castShadow = true;
      bar.add(washer, head);
      bar.userData.posts.push(washer, head);
    });
    xylophone.add(bar);
    bars.push(bar);
  });
  return { xylophone, bars, barMeshes };
}
const hidePosts = (bars) => bars.forEach((b) => b.userData.posts.forEach((p) => (p.visible = false)));

// ---------- the toy xylophone: a wooden pull-along plate on wheels, with a cord ----------
function _buildXylophone(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars } = buildBars(tools, 0);
  const wood = toonMat(XYLOPHONE.colors.wood), woodDark = toonMat(XYLOPHONE.colors.woodDark), felt = toonMat(COLOR_PALETTE.felt), metal = toonMat(COLOR_PALETTE.metal);
  const toyBase = new THREE.Group();
  xylophone.add(toyBase);
  toyBase.add(inked(new THREE.Mesh(arcBand(() => plateR, plateW, XYLOPHONE.plateT, END_PAD + 0.08), woodDark)));
  [-1, 1].forEach((side) => {
    const rail = inked(new THREE.Mesh(arcBand((t) => ARC.radius + side * railOff(t), RAIL_W, RAIL_H), wood));
    rail.position.y = plateTop;
    const pad = new THREE.Mesh(arcBand((t) => ARC.radius + side * railOff(t), RAIL_W * 0.6, 0.06), felt);
    pad.position.y = railTopY;
    pad.receiveShadow = true;
    toyBase.add(rail, pad);
  });
  [-END_PAD / ARC.span, 1 + END_PAD / ARC.span].forEach((t) => {
    const th = thetaAt(t), span = 2 * railOff(Math.max(0, Math.min(1, t))) + RAIL_W + 0.3;
    const cap = inked(new THREE.Mesh(new THREE.BoxGeometry(0.5, RAIL_H * 0.8, span), woodDark));
    cap.position.set(onArc(th)[0], plateTop + RAIL_H * 0.4, onArc(th)[1]);
    cap.rotation.y = yawAt(th);
    toyBase.add(cap);
  });
  // wheels: an axle through the plate at each stop along the arc
  const wheelMat = toonMat(XYLOPHONE.colors.wheel), hubMat = toonMat(XYLOPHONE.colors.wheelHub);
  XYLOPHONE.wheelAt.forEach((t) => {
    const th = thetaAt(t), axle = new THREE.Group();
    axle.position.set(onArc(th)[0], XYLOPHONE.wheelR - XYLOPHONE.lift, onArc(th)[1]);
    axle.rotation.y = yawAt(th);
    const reach = plateW / 2 + 0.1 + XYLOPHONE.wheelW / 2;
    const axleRod = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2 * reach + XYLOPHONE.wheelW, 12), metal));
    axleRod.rotation.x = Math.PI / 2;
    axle.add(axleRod);
    [-1, 1].forEach((side) => {
      const wheel = inked(new THREE.Mesh(new THREE.CylinderGeometry(XYLOPHONE.wheelR, XYLOPHONE.wheelR, XYLOPHONE.wheelW, 28), wheelMat));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.z = side * reach;
      const hub = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), hubMat));
      hub.rotation.x = Math.PI / 2;
      hub.position.z = side * (reach + XYLOPHONE.wheelW / 2 + 0.04);
      axle.add(wheel, hub);
    });
    toyBase.add(axle);
  });
  // pull cord: from the low end of the plate, trailing out across the grass to a wooden bead
  const cordGroup = new THREE.Group();
  {
    const th = thetaAt(-END_PAD / ARC.span), [ex, ez] = onArc(th), y0 = XYLOPHONE.lift + plateTop * 0.5, out = [Math.cos(th), Math.sin(th)];
    const at = (d, y, s) => new THREE.Vector3(ex + out[0] * d - out[1] * s, y, ez + out[1] * d + out[0] * s);
    const cord = new THREE.CatmullRomCurve3([at(0.2, y0, 0), at(1.2, 0.15, 0.3), at(2.6, 0.05, 0.9), at(3.8, 0.04, 1.4)]);
    cordGroup.add(inked(new THREE.Mesh(new THREE.TubeGeometry(cord, 40, 0.035, 8, false), toonMat(XYLOPHONE.colors.cord))));
    const bead = inked(new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), toonMat(XYLOPHONE.colors.bead)));
    bead.position.copy(at(4.05, 0.26, 1.55));
    cordGroup.add(bead);
  }
  const all = new THREE.Group();
  all.add(xylophone, cordGroup);
  return all;
}

// ---------- the vibraphone: a steel frame, resonator tubes under the bars, legs on casters ----------
function _buildVibraphone(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars, barMeshes } = buildBars(tools, VIBRAPHONE.raise);
  const steel = toonMat(COLOR_PALETTE.vibraFrame), vibraMat = toonMat(COLOR_PALETTE.vibraBar), vibraSharpMat = toonMat(COLOR_PALETTE.vibraSharp), resonatorMat = toonMat(COLOR_PALETTE.resonator), casterMat = toonMat(COLOR_PALETTE.caster), felt = toonMat(COLOR_PALETTE.felt);
  barMeshes.forEach((m) => (m.material = m.userData.bar.userData.sharp ? vibraSharpMat : vibraMat));
  const base = new THREE.Group();
  const groundY = -(XYLOPHONE.lift + VIBRAPHONE.raise);
  [-1, 1].forEach((side) => {
    const rail = inked(new THREE.Mesh(arcBand((t) => ARC.radius + side * railOff(t), 0.3, 0.25), steel));
    rail.position.y = railTopY - 0.25;
    const strip = new THREE.Mesh(arcBand((t) => ARC.radius + side * railOff(t), 0.3 * 0.6, 0.06), felt);
    strip.position.y = railTopY;
    strip.receiveShadow = true;
    base.add(rail, strip);
  });
  bars.forEach((bar, i) => {
    const pitch = i / (bars.length - 1), L = VIBRAPHONE.tube[0] + (VIBRAPHONE.tube[1] - VIBRAPHONE.tube[0]) * pitch;
    const tube = inked(new THREE.Mesh(new THREE.CylinderGeometry(VIBRAPHONE.tubeR, VIBRAPHONE.tubeR, L, 18), resonatorMat));
    tube.position.set(bar.position.x, barY - BAR_T / 2 - 0.02 - L / 2, bar.position.z);
    base.add(tube);
  });
  const rackY = barY - BAR_T / 2 - 0.02 - VIBRAPHONE.tube[0] - 0.12;
  const rack = inked(new THREE.Mesh(arcBand(() => ARC.radius, 0.28, 0.12), steel));
  rack.position.y = rackY;
  base.add(rack);
  VIBRAPHONE.legsAt.forEach((t) => {
    const th = thetaAt(t), legs = new THREE.Group();
    legs.position.set(onArc(th)[0], 0, onArc(th)[1]);
    legs.rotation.y = yawAt(th);
    const top = railTopY - 0.25, bottom = groundY + VIBRAPHONE.casterR;
    [top - 0.06, bottom].forEach((y) => {
      const bar = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2 * VIBRAPHONE.legSpread + 0.3, 12), steel));
      bar.rotation.x = Math.PI / 2;
      bar.position.y = y;
      legs.add(bar);
    });
    [-1, 1].forEach((side) => {
      const post = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, top - bottom, 12), steel));
      post.position.set(0, (top + bottom) / 2, side * VIBRAPHONE.legSpread);
      const caster = inked(new THREE.Mesh(new THREE.SphereGeometry(VIBRAPHONE.casterR, 14, 10), casterMat));
      caster.position.set(0, bottom, side * VIBRAPHONE.legSpread);
      legs.add(post, caster);
    });
    base.add(legs);
  });
  xylophone.add(base);
  return xylophone;
}

// ---------- the piano: the bars as white keys on a thin body, black keys between, on a leg frame ----------
function _buildPiano(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars, barMeshes } = buildBars(tools, PIANO.raise);
  const caseMat = toonMat(COLOR_PALETTE.pianoCase), whiteMat = toonMat(COLOR_PALETTE.pianoWhite), blackMat = toonMat(COLOR_PALETTE.pianoBlack);
  barMeshes.forEach((m) => { m.material = whiteMat; m.scale.set(PIANO.keyWidth / BAR_W, 1, PIANO.keyLength / m.userData.bar.userData.len); });
  hidePosts(bars);
  const base = new THREE.Group();
  const bodyBottom = barY - BAR_T / 2 - 0.02 - PIANO.bodyH, groundY = -(XYLOPHONE.lift + PIANO.raise), legH = bodyBottom - groundY, pad = END_PAD * PIANO.endPad;
  const keyFront = ARC.radius - PIANO.keyLength / 2 - PIANO.bodyPad, keyBack = ARC.radius + PIANO.blackBack + PIANO.blackLength / 2 + PIANO.bodyPad, bodyMid = (keyFront + keyBack) / 2;
  const body = inked(new THREE.Mesh(arcBand(() => bodyMid, keyBack - keyFront, PIANO.bodyH, pad), caseMat));
  body.position.y = bodyBottom;
  base.add(body);
  [-pad / ARC.span, 1 + pad / ARC.span].forEach((t) => {
    const th = thetaAt(t), legs = new THREE.Group();
    legs.position.set(onArc(th, bodyMid)[0], 0, onArc(th, bodyMid)[1]);
    legs.rotation.y = yawAt(th);
    const top = bodyBottom - 0.06, bottom = groundY + 0.06;
    [top, bottom].forEach((y) => {
      const bar = inked(new THREE.Mesh(new THREE.CylinderGeometry(PIANO.postR, PIANO.postR, 2 * PIANO.legSpread + 0.2, 12), caseMat));
      bar.rotation.x = Math.PI / 2; bar.position.y = y;
      legs.add(bar);
    });
    [-1, 1].forEach((side) => {
      const post = inked(new THREE.Mesh(new THREE.CylinderGeometry(PIANO.postR, PIANO.postR, top - bottom, 12), caseMat));
      post.position.set(0, (top + bottom) / 2, side * PIANO.legSpread);
      legs.add(post);
    });
    base.add(legs);
  });
  const band = inked(new THREE.Mesh(arcBand(() => bodyMid, PIANO.band.w, PIANO.band.h, pad), caseMat));
  band.position.y = groundY + legH * PIANO.band.at;
  base.add(band);
  // the music stand at the middle of the arc, with a page of sheet music
  {
    const M = PIANO.music, th = thetaAt(0.5), [mx, mz] = onArc(th, keyBack - 0.18), stand = new THREE.Group();
    stand.position.set(mx, bodyBottom + PIANO.bodyH, mz);
    stand.rotation.y = yawAt(th) + Math.PI;
    const post = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, M.postH, 10), caseMat));
    post.position.y = M.postH / 2;
    const desk = new THREE.Group();
    desk.position.y = M.postH;
    desk.rotation.x = -M.tilt;
    const panel = inked(new THREE.Mesh(new THREE.BoxGeometry(M.w, M.h, 0.04), caseMat));
    panel.position.y = M.h / 2;
    const ledge = inked(new THREE.Mesh(new THREE.BoxGeometry(M.w, 0.05, 0.12), caseMat));
    ledge.position.set(0, 0.025, 0.06);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(M.w - 0.25, M.h - 0.2), new THREE.MeshToonMaterial({ map: sheetMusicTexture(), gradientMap: toonMat(0xffffff).gradientMap }));
    page.position.set(0, M.h / 2 - 0.02, 0.025);
    desk.add(panel, ledge, page);
    stand.add(post, desk);
    base.add(stand);
  }
  // black keys: one between each pair of neighboring notes a whole tone apart
  const blackGeo = roundedBar(PIANO.blackWidth, PIANO.blackLength, 0.3);
  for (let i = 0; i < bars.length - 1; i++) {
    const semis = Math.round(12 * Math.log2(bars[i + 1].userData.freq / bars[i].userData.freq));
    if (semis !== 2) continue;
    const th = (thetaAt(i / (bars.length - 1)) + thetaAt((i + 1) / (bars.length - 1))) / 2, [kx, kz] = onArc(th, ARC.radius + PIANO.blackBack);
    const key = inked(new THREE.Mesh(blackGeo, blackMat));
    key.position.set(kx, barY + PIANO.blackRaise, kz);
    key.rotation.y = yawAt(th);
    base.add(key);
  }
  xylophone.add(base);
  return xylophone;
}
// a page of made-up sheet music: two staves, clefs, and a scatter of notes, drawn to a canvas
function sheetMusicTexture() {
  const W = 640, H = 448, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fbf7ea"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2b2b33"; ctx.font = "bold 30px Georgia, serif"; ctx.textAlign = "center";
  ctx.fillText("Meadow Song", W / 2, 52);
  ctx.font = "italic 18px Georgia, serif"; ctx.fillText("for caterpillar and tentacles", W / 2, 80);
  ctx.strokeStyle = "#2b2b33"; ctx.lineWidth = 2;
  const gap = 14;
  [150, 300].forEach((top) => {
    for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(50, top + l * gap); ctx.lineTo(W - 50, top + l * gap); ctx.stroke(); }
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(72, top + 4 * gap + 14);
    ctx.bezierCurveTo(40, top + 2 * gap, 100, top + 1.5 * gap, 78, top - 18);
    ctx.bezierCurveTo(60, top + 8, 66, top + 4 * gap + 6, 84, top + 4 * gap - 4); ctx.stroke(); ctx.lineWidth = 2;
    for (let b = 0; b < 4; b++) {
      const x0 = 110 + b * 120;
      ctx.beginPath(); ctx.moveTo(x0 + 110, top); ctx.lineTo(x0 + 110, top + 4 * gap); ctx.stroke();
      const n = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const x = x0 + 15 + (k * 95) / n, line = Math.floor(Math.random() * 9), y = top + (line * gap) / 2;
        ctx.beginPath(); ctx.ellipse(x, y, 7, 5, -0.4, 0, Math.PI * 2);
        if (Math.random() < 0.8) ctx.fill(); else ctx.stroke();
        const up = line > 4;
        ctx.beginPath(); ctx.moveTo(x + (up ? 6 : -6), y); ctx.lineTo(x + (up ? 6 : -6), y + (up ? -34 : 34)); ctx.stroke();
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------- the kalimba: a wooden box, the bars as steel tines over a bridge ----------
function _buildKalimba(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars, barMeshes } = buildBars(tools, KALIMBA.raise);
  const K = KALIMBA, groundY = -(XYLOPHONE.lift + K.raise), topY = barY + K.box.top, boxMid = ARC.radius + (K.box.inner + K.box.outer) / 2, boxW = K.box.outer - K.box.inner, pad = END_PAD * 0.9;
  const base = new THREE.Group();
  const box = inked(new THREE.Mesh(arcBand(() => boxMid, boxW, topY - 0.08 - groundY, pad), toonMat(K.colors.box)));
  box.position.y = groundY;
  const top = inked(new THREE.Mesh(arcBand(() => boxMid, boxW + 0.1, 0.08, pad + 0.01), toonMat(K.colors.top)));
  top.position.y = topY - 0.08;
  const [hx, hz] = onArc(thetaAt(0.5), ARC.radius - 0.6), hole = new THREE.Mesh(new THREE.CylinderGeometry(K.holeR, K.holeR, 0.02, 32), toonMat(K.colors.hole));
  hole.position.set(hx, topY + 0.01, hz);
  const bridgeMat = toonMat(K.colors.bridge), bridgeH = 0.14;
  const bridge = inked(new THREE.Mesh(arcBand(() => ARC.radius + K.bridge, 0.14, bridgeH, pad * 0.8), bridgeMat));
  bridge.position.y = topY;
  const clamp = inked(new THREE.Mesh(arcBand(() => ARC.radius + K.clamp, 0.18, 0.12, pad * 0.8), bridgeMat));
  clamp.position.y = topY + bridgeH + K.tine.thickness;
  base.add(box, top, hole, bridge, clamp);
  const tineMat = toonMat(K.colors.tine);
  barMeshes.forEach((m, i) => {
    const t = i / (barMeshes.length - 1), len = K.tine.long - (K.tine.long - K.tine.short) * Math.abs(2 * t - 1), { len: barLen } = m.userData.bar.userData;
    m.material = tineMat;
    m.scale.set(K.tine.width / BAR_W, K.tine.thickness / BAR_T, len / barLen);
    m.position.set(0, topY + bridgeH + K.tine.thickness / 2 - barY, K.clamp - len / 2);
  });
  hidePosts(bars);
  xylophone.add(base);
  return xylophone;
}

// ---------- the steel drums: chrome pans round the arc, the bars as pads sunk in the dishes ----------
function _buildSteelDrums(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars, barMeshes } = buildBars(tools, STEELDRUM.raise);
  const P = STEELDRUM, groundY = -(XYLOPHONE.lift + P.raise), rimY = barY + P.rim, rimMat = toonMat(P.colors.rim), standMat = toonMat(P.colors.stand);
  const dishMat = new THREE.MeshToonMaterial({ color: P.colors.chrome, gradientMap: toonMat(0xffffff).gradientMap, side: THREE.DoubleSide });
  const base = new THREE.Group();
  let first = 0;
  P.pans.forEach((count, p) => {
    const group = barMeshes.slice(first, first + count).map((m) => m.userData.bar);
    first += count;
    const th = (thetaAt(group[0].userData.index / (bars.length - 1)) + thetaAt(group[count - 1].userData.index / (bars.length - 1))) / 2, [cx, cz] = onArc(th),
      dist = (bar) => Math.hypot(bar.position.x - cx, bar.position.z - cz), r = Math.max(...group.map(dist)) + P.margin;
    const R = (r * r + P.dish * P.dish) / (2 * P.dish), a = Math.asin(r / R), cy = rimY + R * Math.cos(a), surfaceAt = (d) => cy - Math.sqrt(R * R - d * d);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 12, 0, Math.PI * 2, Math.PI - a, a), dishMat);
    dish.position.set(cx, cy, cz);
    dish.receiveShadow = true;
    const H = P.skirts[p] * (rimY - groundY), skirt = inked(new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 48, 1, true), dishMat));
    skirt.position.set(cx, rimY - H / 2, cz);
    const ring = (y) => { const m = inked(new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 64), rimMat)); m.rotation.x = Math.PI / 2; m.position.set(cx, y, cz); return m; };
    base.add(dish, skirt, ring(rimY), ring(rimY - H));
    if (P.skirts[p] < 1)
      for (let k = 0; k < 3; k++) {
        const ang = th + Math.PI + (k * 2 * Math.PI) / 3, at = (f, y) => new THREE.Vector3(cx + f * r * Math.cos(ang), y, cz + f * r * Math.sin(ang));
        base.add(rod(inked, at(0.55, rimY - H), at(0.85, groundY), 0.05, standMat));
      }
    group.forEach((bar) => {
      const m = barMeshes[bar.userData.index], D = P.pad;
      m.scale.set(D.width / BAR_W, D.thickness / BAR_T, D.length / bar.userData.len);
      m.position.y = surfaceAt(dist(bar)) + D.thickness * 0.2 - barY;
    });
  });
  hidePosts(bars);
  xylophone.add(base);
  return xylophone;
}

// ---------- the handheld: a gray base with a button for every note, and a console behind ----------
function _buildHandheld(tools) {
  const { toonMat, inked } = tools;
  const { xylophone, bars, barMeshes } = buildBars(tools, GAMEBOY.raise);
  const G = GAMEBOY, B = G.button, groundY = -(XYLOPHONE.lift + G.raise), topY = barY + G.base.top, pad = END_PAD * 0.9;
  const base = new THREE.Group();
  const slab = inked(new THREE.Mesh(arcBand(() => ARC.radius + (G.base.inner + G.base.outer) / 2, G.base.outer - G.base.inner, topY - groundY, pad), toonMat(G.colors.base)));
  slab.position.y = groundY;
  base.add(slab);
  const buttonMat = toonMat(G.colors.button), wellMat = toonMat(G.colors.well), buttonGeo = new THREE.CylinderGeometry(B.r, B.r, B.h, 28), wellGeo = new THREE.CylinderGeometry(B.well, B.well, 0.06, 28);
  bars.forEach((bar, i) => {
    const out = (i % 2 ? 1 : -1) * B.stagger, { angle } = bar.userData;
    const well = new THREE.Mesh(wellGeo, wellMat);
    well.position.set(bar.position.x + Math.sin(angle) * out, topY + 0.03, bar.position.z + Math.cos(angle) * out);
    well.receiveShadow = true;
    base.add(well);
    const button = inked(new THREE.Mesh(buttonGeo, buttonMat));
    button.position.set(0, topY + 0.02 + B.h / 2 - barY, out);
    bar.add(button);
    barMeshes[i].visible = false;
  });
  hidePosts(bars);
  const pillMat = toonMat(G.colors.pill);
  [-0.4, 0.4].forEach((dx) => {
    const th = thetaAt(0.5) + dx / ARC.radius, [px, pz] = onArc(th, ARC.radius + G.base.inner + 0.3), holder = new THREE.Group(), pill = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 12), pillMat));
    holder.position.set(px, topY + 0.08, pz);
    holder.rotation.y = yawAt(th) + 0.4;
    pill.rotation.z = Math.PI / 2;
    holder.add(pill);
    base.add(holder);
  });
  xylophone.add(base);
  // the console: a tall rounded slab behind the player, its screen a canvas in four greens
  const console3d = new THREE.Group();
  {
    const C = G.console, col = G.colors, W = C.width, H = C.height;
    console3d.position.set(0, 0, -C.back - C.depth);
    const slabShape = (x0, y0, x1, y1, r, rb) => {
      const s = new THREE.Shape();
      s.moveTo(x0 + r, y0); s.lineTo(x1 - rb, y0); s.quadraticCurveTo(x1, y0, x1, y0 + rb); s.lineTo(x1, y1 - r);
      s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r);
      s.quadraticCurveTo(x0, y0, x0 + r, y0);
      return s;
    };
    const flat = (shape, depth, mat, z) => {
      const m = inked(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: Math.min(0.08, depth / 2), bevelSize: 0.06, bevelSegments: 3, curveSegments: 16 }), mat));
      m.position.z = z;
      console3d.add(m);
      return m;
    };
    flat(slabShape(-W / 2, 0, W / 2, H, C.corner, C.bigCorner), C.depth, toonMat(col.body), 0);
    const front = C.depth + 0.08;
    const bz = { x0: -W * 0.42, x1: W * 0.42, y0: H * 0.55, y1: H * 0.93 };
    flat(slabShape(bz.x0, bz.y0, bz.x1, bz.y1, 0.2, 0.9), 0.04, toonMat(col.bezel), front);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshBasicMaterial({ color: col.led }));
    led.position.set(bz.x0 + 0.45, (bz.y0 + bz.y1) / 2 + 0.3, front + 0.12);
    console3d.add(led);
    // the screen: a still of the little game, hills and a craft, in the four greens
    const PX = 160, PY = 144, canvas = document.createElement("canvas");
    canvas.width = PX; canvas.height = PY;
    const ctx = canvas.getContext("2d"), L = col.lcd;
    ctx.fillStyle = L[0]; ctx.fillRect(0, 0, PX, PY);
    const hill = (x, base, a, b, fa, fb) => base + a * Math.sin(x * fa) + b * Math.sin(x * fb + 1.3);
    for (let x = 0; x < PX; x++) {
      const far = hill(x, 95, 8, 5, 0.05, 0.11), near = hill(x, 120, 7, 4, 0.08, 0.17);
      ctx.fillStyle = L[1]; ctx.fillRect(x, Math.round(far), 1, PY);
      ctx.fillStyle = L[2]; ctx.fillRect(x, Math.round(near), 1, PY);
    }
    ctx.fillStyle = L[3]; ctx.fillRect(0, 134, PX, PY - 134);
    for (const [x, gap] of [[90, 60], [150, 80]]) { ctx.fillRect(x, 0, 8, gap - 18); ctx.fillRect(x, gap + 18, 8, 134 - gap - 18); }
    ctx.fillRect(40, 60, 6, 6);
    ctx.fillStyle = L[2]; ctx.fillRect(34, 61, 4, 4); ctx.fillRect(28, 62, 3, 3);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
    const sh = (bz.y1 - bz.y0) * 0.78, lcd = new THREE.Mesh(new THREE.PlaneGeometry((sh * PX) / PY, sh), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    lcd.position.set(0.25, (bz.y0 + bz.y1) / 2, front + 0.13);
    console3d.add(lcd);
    const dpadMat = toonMat(col.dpad);
    [[1.5, 0.5], [0.5, 1.5]].forEach(([w, h]) => { const arm = inked(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), dpadMat)); arm.position.set(-W * 0.27, H * 0.37, front + 0.1); console3d.add(arm); });
    const abMat = toonMat(col.button);
    [[W * 0.17, H * 0.35], [W * 0.33, H * 0.4]].forEach(([x, y]) => { const b = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.25, 28), abMat)); b.rotation.x = Math.PI / 2; b.position.set(x, y, front + 0.1); console3d.add(b); });
    const pillMat2 = toonMat(col.pill);
    [-0.6, 0.6].forEach((x) => { const p = inked(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.12), pillMat2)); p.position.set(x, H * 0.2, front + 0.06); p.rotation.z = 0.45; console3d.add(p); });
    const slotMat = toonMat(col.slot);
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.04), slotMat); s.position.set(W * 0.2 + k * 0.28, H * 0.1 + k * 0.16, front + 0.03); s.rotation.z = 0.5; console3d.add(s); }
  }
  const all = new THREE.Group();
  all.add(xylophone, console3d);
  return all;
}
export const buildXylophone = (scene, tools) => { const g = _buildXylophone(tools); scene.add(g); return g; };
export const buildVibraphone = (scene, tools) => { const g = _buildVibraphone(tools); scene.add(g); return g; };
export const buildPiano = (scene, tools) => { const g = _buildPiano(tools); scene.add(g); return g; };
export const buildKalimba = (scene, tools) => { const g = _buildKalimba(tools); scene.add(g); return g; };
export const buildSteelDrums = (scene, tools) => { const g = _buildSteelDrums(tools); scene.add(g); return g; };
export const buildHandheld = (scene, tools) => { const g = _buildHandheld(tools); scene.add(g); return g; };
