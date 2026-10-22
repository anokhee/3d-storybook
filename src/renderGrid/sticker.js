// The doll as a 2D sticker — its portrait: a flat disc with a cardboard
// thickness, standing face-on, the doll's own head printed on it. Built
// from the config alone, no rng, no measuring of rendered output. Ported
// from the vanilla grid's sticker tab. Every knob is in
// presets/model/sticker.js.
import * as THREE from "three";

import { clamp, lerp } from "./utils.js";
import { deformWith, mouthRise } from "../parts/head.js";
import { beadRadius } from "../parts/limbs.js";
import { plasticine } from "../world/finish.js";
import {
  STICKER,
  IDENTITY_STRENGTH,
  IDENTITY_KEEP,
  STICKER_CANON,
  STICKER_CLAMPS,
  STICKER_FIT,
} from "../presets/model/sticker.js";

// The chip's own colors, off the doll's. The head prints in the doll's
// skin; the background is COMPUTED to contrast with it rather than
// repeating a color off the figure — the skin's hue swung halfway round
// the wheel, mid-saturated, lightness pushed to whichever side the skin
// doesn't occupy.
function stickerOf(cfg) {
  const hsl = {};
  new THREE.Color(cfg.palette.skin).getHSL(hsl);
  const bg = new THREE.Color()
    .setHSL(
      (hsl.h + 0.5) % 1,
      clamp(hsl.s, ...STICKER.bgSaturation),
      hsl.l > 0.5 ?
        clamp(hsl.l - 0.45, 0.12, 0.35)
      : clamp(hsl.l + 0.45, 0.65, 0.88),
    )
    .getHex();
  return { ...STICKER, bg, head: cfg.palette.skin };
}

// A color knocked down for a keyline: the same hue, its brightness cut.
const knocked = (hex) => {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  return c.setHSL(hsl.h, hsl.s, hsl.l * 0.7);
};

// ---- the identity map ----------------------------------------------------
// The mapping layer between doll params and sticker params. The doll's true
// 3D proportions read as caricature at chip scale, so each feature is lerped
// from a canonical ID-photo face toward the doll's actual value and then
// clamped — identity survives as the direction and part of the distance a
// feature sits off canon, never the full exaggeration.
//
// `rawAspect` is the one measured input — the silhouette's own width over
// height, sampled by the caller — because the head's aspect lives in the
// deformer rather than in any single param.
// The leaf tip's own outline, flattened once: the same two bezier curves
// the leaf tip extrudes — base at (0,0), point at (0,1), unit half-width —
// so the printed leaf is the blade's true profile rather than a stand-in.
const STICKER_LEAF_PTS = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.05, 0);
  s.bezierCurveTo(0.75, 0.14, 1, 0.5, 0, 1);
  s.bezierCurveTo(-1, 0.5, -0.75, 0.14, -0.05, 0);
  s.lineTo(0.05, 0);
  return s.getPoints(12);
})();

export function dollyToStickerParams(cfg, rawAspect) {
  const C = STICKER_CANON,
    L = STICKER_CLAMPS;
  const iden = (key, actual) =>
    clamp(
      lerp(C[key], actual, IDENTITY_KEEP[key] ?? IDENTITY_STRENGTH),
      L[key][0],
      L[key][1],
    );
  const E = cfg.eyes,
    NO = cfg.nose,
    CH = cfg.cheeks,
    MO = cfg.mouth,
    H = cfg.hair;
  const beadR = beadRadius(H);

  // ---- antenna layout ----------------------------------------------------
  // A deterministic non-overlap fan, closed form, no iteration: the minimum
  // angular separation between neighbors is the tip gap over the length
  // (tip chord ≈ separation × length), base angles distribute evenly and
  // centered on the crown, and the full fan is capped at antMaxSpreadDeg.
  // When the count can't fit at minimum separation under the cap, the fan is
  // pinned AT the cap and the antennae uniformly LENGTHEN to the exact fit
  // length — the inverse of sep = gap / len — because count is the stronger
  // identity signal than length. Only past antMaxLen does the count drop, to
  // exactly what the cap holds.
  const ant = (() => {
    const A = STICKER_FIT;
    let n = H.count;
    let len = Math.max(H.length, A.antMinLen);
    let sep = 0;
    if (n > 1) {
      const cap = (A.antMaxSpreadDeg * Math.PI) / 180;
      const minSep = A.antMinTipGap / len;
      if ((n - 1) * minSep <= cap) {
        // Fits: the doll's own separation, floored at the minimum and held
        // under the cap — identity survives where the geometry allows it.
        const dollSep = (2 * Math.max(H.spread, beadR)) / (n - 1);
        sep = clamp(dollSep, minSep, cap / (n - 1));
        // Sticker-only: the horn pair reads better a shade wider apart.
        if (cfg.hairKey === "horns")
          sep = Math.min(sep * A.hornSepBoost, cap / (n - 1));
      } else {
        const fit = (A.antMinTipGap * (n - 1)) / cap;
        if (fit <= A.antMaxLen) {
          len = fit;
          sep = cap / (n - 1);
        } else {
          len = A.antMaxLen;
          n = Math.max(2, Math.floor((cap * len) / A.antMinTipGap) + 1);
          sep = A.antMinTipGap / len;
        }
      }
    }
    return { count: n, len, fan: ((n - 1) * sep) / 2 };
  })();

  return {
    headAspect: iden("headAspect", rawAspect),
    eyeLat: iden("eyeLat", E.latitude),
    eyeAz: iden("eyeAz", E.azimuth),
    eyeSize: iden("eyeSize", E.size),
    // The RESOLVED placements, not the relative bands: the nose has already
    // dropped off the eye line and the cheeks off the nose, so canon and
    // actual compare in the same coordinates.
    noseLat: iden("noseLat", NO.y),
    noseR: iden("noseR", NO.radius),
    // A cheekless doll stays cheekless — its absence IS identity, and the
    // lerp would otherwise print canonical cheeks on it.
    cheekSize: CH.size > 0.001 ? iden("cheekSize", CH.size) : 0,
    cheekLat: iden("cheekLat", clamp(NO.y - CH.latitude, -1, 1)),
    cheekAz: iden("cheekAz", E.azimuth + CH.azimuth),
    mouthLat: iden("mouthLat", MO.y),
    mouthW: iden("mouthW", MO.width),
    mouthH: iden("mouthH", MO.height),
    mouthTaper: iden("mouthTaper", MO.taper),
    // Magnitude only — the sign is the expression, and canon has no business
    // turning a frown into a smile.
    mouthBow: Math.sign(MO.bow || 1) * iden("mouthBow", Math.abs(MO.bow)),
    // Antennae, straight off the layout above. `antFan` is the HALF-angle.
    antCount: ant.count,
    antLen: ant.len,
    antFan: ant.fan,
    antBeadR: beadR,
    // The presets the stalk+bead abstraction misreads: a horn IS its tip,
    // so horns print as plain triangles; a mushroom's cap prints as a
    // semicircle on its stalk. Everything else is a stalk and a bead.
    antShape:
      cfg.hairKey === "horns" ? "triangle"
      : cfg.hairKey === "mushroom" ? "dome"
      : "stalk",
    antAspect: H.tipAspect,
    antTip: H.tip,
  };
}

// ---- the chip ------------------------------------------------------------
// The sticker for one doll config: `mesh` is a group facing +z, the disc
// centered on its origin, `radius` its reach. `dispose()` frees what it
// made.
// `finish` makes the chip's material from a color — plasticine by
// default, the r3f world's toon when it hands one in (see Doll).
export function makeSticker(cfg, finish = plasticine) {
  const S = stickerOf(cfg);
  const geos = [];
  const mats = [];
  // A group rather than a bare mesh: the disc carries a baked quarter-turn
  // (a cylinder stands on its axis; a sticker faces you) and the printed
  // head rides on top.
  const group = new THREE.Group();

  const geo = new THREE.CylinderGeometry(
    S.radius,
    S.radius,
    S.thickness,
    S.segments,
  );
  // The doll's own finish, in the chip's own color: the print needs
  // ground to stand on.
  const mat = finish(S.bg);
  const disc = new THREE.Mesh(geo, mat);
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  geos.push(geo);
  mats.push(mat);

  // ---- the print ---------------------------------------------------------
  // The doll's own head, in TRUE 2D: the silhouette the head deformer gives
  // the equator that faces the camera, traced round as a flat filled shape.
  // The same deformWith() the head mesh runs through, chin cut and texture
  // lumps included, so a lumpy doll gets a lumpy sticker.
  const STEPS = 96;
  const pts = [];
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < STEPS; i++) {
    const th = (i / STEPS) * Math.PI * 2;
    n.set(Math.cos(th), Math.sin(th), 0);
    v.copy(n);
    deformWith(cfg.shape, v, n);
    pts.push(new THREE.Vector2(v.x, v.y));
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  // ---- the identity map, applied -----------------------------------------
  // Every feature below draws from the mapped params, not the raw config —
  // see dollyToStickerParams(). The silhouette's aspect is the one measured
  // input, blended here as a single anisotropic scale in x so the outline
  // (and everything projected through it) leans toward the canon without
  // resampling the deformer.
  const rawAspect = (maxX - minX) / Math.max(1e-6, maxY - minY);
  const F = dollyToStickerParams(cfg, rawAspect);
  const sx = F.headAspect / Math.max(1e-6, rawAspect);
  minX *= sx;
  maxX *= sx;
  for (const p of pts) p.x *= sx;

  // Centered on the HEAD's bounding box — a chin-cut head is bottom-heavy —
  // and scaled so the head fills a fixed fraction of the chip whatever the
  // doll's world size. The antennae are left OUT of the box on purpose:
  // toppers overflow toward the rim rather than shrinking the face to fit.
  const cx = (minX + maxX) / 2;
  let cy = (minY + maxY) / 2;
  const halfHead = Math.max(maxX - minX, maxY - minY) / 2;
  const k = (S.radius * STICKER_FIT.headFill) / halfHead;
  // The WHOLE print — silhouette, antennae, features — slides down the chip
  // by yTranslation. Folded into the centering, so everything that maps
  // through cy moves together.
  cy += (S.yTranslation * S.radius) / k;
  for (const p of pts) p.set((p.x - cx) * k, (p.y - cy) * k);

  // The antennae, abstracted: not the ropes' true 3D lean — a ring seen from
  // the front foreshortens into overlap — but an even 2D fan over the crown,
  // built straight in chip space. The fan angle, count and length all come
  // out of the mapping layer's closed-form layout; the one render-space
  // touch left here is the rim: a bead that would cross it is pulled back
  // along its own stalk.
  //
  // The bead's chip radius is floored against the keyline width so a tiny
  // bead never vanishes into its own stalk — a render-space floor, so it
  // lives here where the chip scale exists rather than in the pure map.
  const beadChipR = Math.max(
    F.antBeadR * k * STICKER_FIT.beadScale,
    (STICKER_FIT.beadMinRatio * S.radius * S.stroke) / 2,
  );
  const ants = [];
  if (F.antCount > 0 && F.antLen > 0.01) {
    const fan = F.antFan;
    const rim = STICKER_FIT.rimSafety * S.radius;
    // Leaves hug the head on a sticker: their stalk is cut to a fraction so
    // the blade sits against the crown instead of waving off the chip.
    const stalkLen =
      F.antTip === "leaf" ? F.antLen * STICKER_FIT.leafStalkScale : F.antLen;
    for (let i = 0; i < F.antCount; i++) {
      const th = F.antCount === 1 ? 0 : -fan + (2 * fan * i) / (F.antCount - 1);
      const d3 = new THREE.Vector3(Math.sin(th), Math.cos(th), 0);
      const root3 = d3.clone();
      deformWith(cfg.shape, root3, d3);
      const root = new THREE.Vector2(
        (root3.x * sx - cx) * k,
        (root3.y - cy) * k,
      );
      const dir = new THREE.Vector2(Math.sin(th), Math.cos(th));
      const bead = root.clone().addScaledVector(dir, stalkLen * k);
      const over = bead.length() + beadChipR - rim;
      if (over > 0) bead.addScaledVector(dir, -over);
      ants.push({ root, dir, bead });
    }
  }

  // The border first, underneath: the same outline pushed out along its own
  // 2D normals, so the stroke keeps one width round a lumpy silhouette where
  // a scaled-up copy would go thick on the bulges and thin in the dents.
  // Points wind counter-clockwise (θ runs 0 → 2π), so outward is the
  // tangent's (ty, -tx).
  const w = S.radius * S.stroke;
  const strokePts = pts.map((p, i) => {
    const a = pts[(i - 1 + STEPS) % STEPS];
    const b = pts[(i + 1) % STEPS];
    const tx = b.x - a.x,
      ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    return new THREE.Vector2(p.x + (ty / len) * w, p.y - (tx / len) * w);
  });

  // Both unlit on purpose: a decal is printed on, not molded, so it should
  // not pick up the shading of a surface. The head wears the head's color;
  // the stroke is that color with the brightness knocked down — a drawn
  // border, not a new ink.
  const strokeGeo = new THREE.ShapeGeometry(new THREE.Shape(strokePts));
  const strokeMat = new THREE.MeshBasicMaterial({ color: knocked(S.head) });
  const border = new THREE.Mesh(strokeGeo, strokeMat);
  // A hair off the face, so the print never z-fights the cardboard — and the
  // fill a hair off the border again, for the same reason.
  border.position.z = S.thickness / 2 + 0.002;
  group.add(border);
  geos.push(strokeGeo);
  mats.push(strokeMat);

  const headGeo = new THREE.ShapeGeometry(new THREE.Shape(pts));
  const headMat = new THREE.MeshBasicMaterial({ color: S.head });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.z = S.thickness / 2 + 0.0035;
  group.add(head);
  geos.push(headGeo);
  mats.push(headMat);

  // The antennae sit BEHIND the whole head print — under the keyline as well
  // as the fill — so they read as sprouting from behind the portrait, and
  // their roots hide under the silhouette wherever they land. Stalks are
  // keylines themselves: the border's own ink at the border's own width, so
  // the print carries one line weight throughout; only the bead keeps its
  // own block. Bead size is the floored chip radius from above.
  if (ants.length) {
    const AZ = S.thickness / 2 + 0.0012;
    const beadColor = cfg.palette.antennaBead;
    const tipMat = new THREE.MeshBasicMaterial({ color: beadColor });
    mats.push(tipMat);
    const beadGeo = new THREE.CircleGeometry(beadChipR, 20);
    geos.push(beadGeo);
    // The ball's own stroke: its color knocked down the same way the head's
    // keyline is, drawn as a wider disc underneath the bead.
    const tipStrokeMat = new THREE.MeshBasicMaterial({
      color: knocked(beadColor),
    });
    mats.push(tipStrokeMat);
    const beadRingGeo = new THREE.CircleGeometry(
      beadChipR + w * STICKER_FIT.beadStrokeScale,
      20,
    );
    geos.push(beadRingGeo);
    // The mushroom's cap, shared by every stalk on the crown: a semicircle —
    // flat edge across the stalk's end, dome outward — at a fraction of the
    // bead radius it would otherwise get.
    const capGeo =
      F.antShape === "dome" ?
        new THREE.CircleGeometry(
          beadChipR * STICKER_FIT.mushroomScale,
          16,
          0,
          Math.PI,
        )
      : null;
    if (capGeo) geos.push(capGeo);
    // The stalks, heavier than the keyline — see STICKER.stalkWidth.
    const hw = (w * S.stalkWidth) / 2;
    for (const a of ants) {
      const px = -a.dir.y,
        py = a.dir.x;
      if (F.antShape === "triangle") {
        // The horn exception: one filled triangle standing on the
        // silhouette — base half-width off the bead dial (the horn's own
        // base-radius knob), height off the cone's aspect, in the bead's
        // block like the horn it stands for. No stalk, no bead, no keyline.
        // hornScale is a sticker-only shrink: full-size horn dials read as
        // a bull at chip scale.
        const bw = F.antBeadR * k * STICKER_FIT.hornScale;
        const hh = 2 * bw * F.antAspect;
        const tri = new THREE.Shape([
          new THREE.Vector2(a.root.x + px * bw, a.root.y + py * bw),
          new THREE.Vector2(a.root.x + a.dir.x * hh, a.root.y + a.dir.y * hh),
          new THREE.Vector2(a.root.x - px * bw, a.root.y - py * bw),
        ]);
        const triGeo = new THREE.ShapeGeometry(tri);
        geos.push(triGeo);
        const horn = new THREE.Mesh(triGeo, tipMat);
        horn.position.z = AZ;
        group.add(horn);
        continue;
      }
      const quad = new THREE.Shape([
        new THREE.Vector2(a.root.x + px * hw, a.root.y + py * hw),
        new THREE.Vector2(a.bead.x + px * hw, a.bead.y + py * hw),
        new THREE.Vector2(a.bead.x - px * hw, a.bead.y - py * hw),
        new THREE.Vector2(a.root.x - px * hw, a.root.y - py * hw),
      ]);
      const stalkGeo = new THREE.ShapeGeometry(quad);
      geos.push(stalkGeo);
      const stalk = new THREE.Mesh(stalkGeo, strokeMat);
      stalk.position.z = AZ;
      group.add(stalk);
      if (F.antTip === "leaf") {
        // A leaf, not a circle: the blade's own profile, base on the stalk's
        // end and growing outward along it — half-width off the bead dial,
        // length off the tip's aspect cut by the sticker's own scale. Width
        // holds; only the length shortens — and it is capped outright,
        // because the bead dial divides by count and one or two leaves come
        // out towering.
        const lh = Math.min(
          2 * beadChipR * F.antAspect * STICKER_FIT.leafLenScale,
          STICKER_FIT.leafMaxLen * S.radius,
        );
        const leaf = new THREE.Shape(
          STICKER_LEAF_PTS.map(
            (q) =>
              new THREE.Vector2(
                a.bead.x + px * (q.x * beadChipR) + a.dir.x * (q.y * lh),
                a.bead.y + py * (q.x * beadChipR) + a.dir.y * (q.y * lh),
              ),
          ),
        );
        const leafGeo = new THREE.ShapeGeometry(leaf);
        geos.push(leafGeo);
        const blade = new THREE.Mesh(leafGeo, tipMat);
        blade.position.z = AZ;
        group.add(blade);
      } else if (capGeo) {
        const cap = new THREE.Mesh(capGeo, tipMat);
        cap.position.set(a.bead.x, a.bead.y, AZ);
        // The flat edge lies across the stalk's end, dome pointing the way
        // the stalk grows.
        cap.rotation.z = Math.atan2(a.dir.y, a.dir.x) - Math.PI / 2;
        group.add(cap);
      } else {
        const ring = new THREE.Mesh(beadRingGeo, tipStrokeMat);
        ring.position.set(a.bead.x, a.bead.y, AZ);
        group.add(ring);
        // A hair above its ring, still under the head print's border.
        const tip = new THREE.Mesh(beadGeo, tipMat);
        tip.position.set(a.bead.x, a.bead.y, AZ + 0.0004);
        group.add(tip);
      }
    }
  }

  // ---- the face ----------------------------------------------------------
  // The doll's features off the identity map: each mapped placement goes
  // through the same deformer projection the real face uses, so features
  // still land on the head — a wide head keeps its eyes wide-set, just
  // damped toward canon — and every size rides the same k the silhouette
  // does.
  const P = cfg.palette;
  // Two layers, so a cheek that drifts under an eye always reads as BEHIND
  // it — the cheek is skin, the eye is ink on top of it.
  const CHEEK_Z = S.thickness / 2 + 0.0042;
  const FACE_Z = S.thickness / 2 + 0.005;
  const ringAt = (lat, az) => {
    const r = Math.sqrt(Math.max(0, 1 - lat * lat));
    return new THREE.Vector3(Math.sin(az) * r, lat, Math.cos(az) * r);
  };
  const project = (dir) => {
    const p = dir.clone();
    deformWith(cfg.shape, p, dir);
    // The same anisotropic x the outline took, so a feature projected onto
    // the blended silhouette still sits on it. yTranslation rides in cy, so
    // features move with the head.
    return new THREE.Vector2((p.x * sx - cx) * k, (p.y - cy) * k);
  };
  const stamp = (geo2, mat2, at, z = FACE_Z) => {
    const m2 = new THREE.Mesh(geo2, mat2);
    m2.position.set(at.x, at.y, z);
    group.add(m2);
  };
  // The same blocks the real face is pinched from: paint for the eyes and
  // mouth, the skin knocked down the way the nose is, the cheek's own for
  // the cheeks. Unlit like the rest of the print.
  const inkMat = new THREE.MeshBasicMaterial({ color: P.paint });
  const noseMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(P.skin).offsetHSL(0, 0.02, -0.14),
  });
  const cheekMat = new THREE.MeshBasicMaterial({ color: P.cheek });
  mats.push(inkMat, noseMat, cheekMat);

  // Eyes: the one absolute placement, mirrored in x like the real ones.
  const eyeGeo = new THREE.CircleGeometry(F.eyeSize * k, 24);
  geos.push(eyeGeo);
  for (const sign of [1, -1])
    stamp(eyeGeo, inkMat, project(ringAt(F.eyeLat, sign * F.eyeAz)));

  // The nose, at its mapped resolved latitude.
  const noseGeo = new THREE.CircleGeometry(F.noseR * k, 24);
  geos.push(noseGeo);
  stamp(noseGeo, noseMat, project(ringAt(F.noseLat, 0)));

  // Cheeks — already resolved and damped in the map, and zero when the doll
  // has none.
  if (F.cheekSize > 0) {
    const cheekGeo = new THREE.CircleGeometry(F.cheekSize * k, 24);
    geos.push(cheekGeo);
    for (const sign of [1, -1])
      stamp(
        cheekGeo,
        cheekMat,
        project(ringAt(F.cheekLat, sign * F.cheekAz)),
        CHEEK_Z,
      );
  }

  // The mouth: the same stadium bar the real mouth is built from — bow,
  // taper and the corner caps included, so a frown prints as a frown —
  // traced as an outline in the local unit square, then scaled out by the
  // mouth's own width and height around its projected anchor.
  const rise = mouthRise({
    bow: F.mouthBow,
    width: F.mouthW,
    height: F.mouthH,
  });
  const aspect = F.mouthH / Math.max(1e-6, F.mouthW);
  const capX = 0.5 * aspect;
  const halfAt = (s) => {
    const round = capX * Math.sqrt(Math.max(0, 1 - (s / 0.5) * (s / 0.5)));
    return Math.max(0, 0.5 * lerp(1, F.mouthTaper, s + 0.5) - capX) + round;
  };
  const bend = (x) => rise * (4 * x * x - 0.5);
  const mPts = [];
  const MSEG = 16,
    CSEG = 8;
  // Bottom edge left to right, right cap up, top edge right to left, left
  // cap down — counter-clockwise, and the Shape closes itself.
  for (let i = 0; i <= MSEG; i++) {
    const x = halfAt(-0.5) * (-1 + (2 * i) / MSEG);
    mPts.push(new THREE.Vector2(x, -0.5 + bend(x)));
  }
  for (let j = 1; j < CSEG; j++) {
    const s = -0.5 + j / CSEG;
    mPts.push(new THREE.Vector2(halfAt(s), s + bend(halfAt(s))));
  }
  for (let i = 0; i <= MSEG; i++) {
    const x = halfAt(0.5) * (1 - (2 * i) / MSEG);
    mPts.push(new THREE.Vector2(x, 0.5 + bend(x)));
  }
  for (let j = 1; j < CSEG; j++) {
    const s = 0.5 - j / CSEG;
    mPts.push(new THREE.Vector2(-halfAt(s), s + bend(-halfAt(s))));
  }
  const mAt = project(ringAt(F.mouthLat, 0));
  for (const p of mPts)
    p.set(mAt.x + p.x * F.mouthW * k, mAt.y + p.y * F.mouthH * k);
  const mouthGeo = new THREE.ShapeGeometry(new THREE.Shape(mPts));
  geos.push(mouthGeo);
  const mouth = new THREE.Mesh(mouthGeo, inkMat);
  mouth.position.z = FACE_Z;
  group.add(mouth);

  return {
    mesh: group,
    radius: S.radius,
    dispose() {
      group.parent?.remove(group);
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    },
  };
}
