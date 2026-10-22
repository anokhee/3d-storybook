import * as THREE from "three";

import {
  mulberry32,
  smoothstep,
  smoothGeo,
  lerp,
  clamp,
  pickKey,
  reader,
  drawCount,
  facetSag,
  FORWARD,
  UP,
} from "./utils.js";
import { BANDS } from "../presets/index.js";
import { bumpFrom } from "../presets/materials/textures.js";
import { varied } from "../world/palette.js";
import { plasticine } from "../world/finish.js";
import {
  mouthRise,
  deformWith,
  earGeometry,
  EYE_GEO,
  faceBands,
} from "../parts/head.js";
import { buildBand } from "../parts/body.js";
import {
  STALKS,
  BALL_GEO,
  beadRadius,
  stalkRadius,
  stalkTopRadius,
  rampRadius,
  fitBeadStack,
  buildLimbBands,
} from "../parts/limbs.js";
import {
  tubeGeometry,
  TIPS,
  tipOffset,
  orientStack,
} from "../parts/antennae.js";

// The ticked textures this head will actually wear — the head's own
// `omitTexture` denylist, with the never-empty fallback every compatibility
// filter here shares. Bodies will grow the same param, and this is where
// their list joins the intersection.
function compatibleTextures(headKey, texSet) {
  const omit =
    BANDS.heads[headKey].omitTexture ?? BANDS.headDefaults.omitTexture;
  const ok = [...texSet].filter((k) => !omit.includes(k));
  return ok.length ? ok : [...texSet];
}

// Same filter for the hair axis, off the head's `omitHair` denylist, with the
// same never-empty fallback.
function compatibleHairs(headKey, hairSet) {
  const omit = BANDS.heads[headKey].omitHair ?? BANDS.headDefaults.omitHair;
  const ok = [...hairSet].filter((k) => !omit.includes(k));
  return ok.length ? ok : [...hairSet];
}

// And for the limb axis, off the BODY's `omit` denylist — limbs hang off the
// torso, so which stringing a doll refuses is the body preset's say. Same
// never-empty fallback as the other two.
function compatibleLimbs(bodyKey, limbSet) {
  const omit = BANDS.bodies[bodyKey].omit ?? BANDS.bodyDefaults.omit;
  const ok = [...limbSet].filter((k) => !omit.includes(k));
  return ok.length ? ok : [...limbSet];
}

function randomConfig(
  seed,
  headKey,
  bodyKey,
  limbKey,
  hairKey,
  texKey,
  colorKey,
  tune = null,
) {
  const R = mulberry32(seed);

  // Tuning modes pin some draws instead of sampling them, but ALWAYS consume
  // R() first so the stream stays aligned: one seed yields the same doll with
  // a mode on or off, differing only where the mode deliberately pins it.
  const axis = tune?.axis ?? null;
  const sweepT = tune?.sweepT ?? null;
  const flatten = tune?.flatten ?? false;
  // null rolls the band's own smile/frown ratio; "smile" / "frown" force it.
  const mood = tune?.mouth ?? null;
  let phase = "head";
  const roll = () => {
    const r = R();
    if (!axis) return r;
    if (phase === axis) return sweepT === null ? r : sweepT;
    return flatten ? 0.5 : r;
  };
  const range = (a, b) => lerp(a, b, roll());
  const draw = reader(range);
  const chance = (p) => roll() < p;

  const B = BANDS;
  // Face bands belong to the head shape, not to the generator: a latitude that
  // lands mid-cheek on a tomato is up a pear's neck.
  const F = faceBands(headKey);
  const build = buildBand(draw, headKey, bodyKey, (p) => {
    phase = p;
  });

  // Its own phase, so opening the texture tab sweeps the skin and pins
  // everything else — the whole point of having a tab per axis. With one dial
  // left, sweeping it IS the slider: doll 0 comes out smooth and doll 7 as
  // lumpy as the band goes.
  phase = "texture";
  const tex = { ...B.textureDefaults, ...B.textures[texKey] };
  // The mesh half of the preset, kept apart from the field half: the Doll
  // constructor needs it before it can cut a geometry, and nothing
  // downstream of the deformer ever wants it.
  const texture = { detail: tex.detail };
  const bump = bumpFrom(
    draw(tex.amount),
    // Drawn rather than taken from the doll's seed, so a sweep moves the FIELD
    // as well as the dial — otherwise all eight wear the same lumps at
    // different depths.
    draw([0, 1000]),
    tex,
  );
  build.shape.bump = bump;
  // The same field on the body, so a doll is one piece of stock rather than a
  // head and a body that happen to be near each other. Both deformers read
  // their bump at the UNDEFORMED direction, so the two surfaces agree about
  // where a lump is even though they are different shapes at different scales.
  build.body.bump = bump;

  // The color comes off the dealt BLOCK: one pinch of it for the head and
  // body, wandered inside the swatch's own `vary`, so two dolls off the same
  // block are the same stock rather than the same hex. Every other piece is
  // pinched from ANY block on the rack — a cheek, an arm, the bead on an
  // antenna tip is another piece of stock, not a dab of color. The antennae
  // grow out of the head, so `hair.shiftColor` lets them keep the skin
  // instead of `limb`; arms and legs share ONE block, since a matched set out
  // of four reads as a parts bin. pinch() consumes the same draws whichever
  // block lands, so the stream stays aligned.
  phase = "material";
  const pinch = (swatch) => varied(swatch, roll).getHex();
  const anyBlock = () => pinch(B.colors[pickKey(draw, Object.keys(B.colors))]);
  const palette = {
    skin: pinch(B.colors[colorKey]),
    paint: pinch(B.paint),
    limb: anyBlock(),
    limbBoard: anyBlock(),
    cheek: anyBlock(),
    antennaBead: anyBlock(),
  };

  // Limbs have a tab of their own: opening it sweeps length, taper and spread
  // while pinning the doll they hang off.
  phase = "limb";
  const limbs = buildLimbBands(draw, build.body.size, bodyKey, limbKey);

  // Its own axis, so the face tab sweeps ears, nose, eyes, cheeks and mouth
  // together and pins the skull and everything else to mid-band — the only
  // way to pressure-test how far the FEATURES can drift on one fixed head.
  phase = "face";

  // Hoisted out of the literal below only so the nose can be measured against
  // the eyes after both are drawn. Same three, drawn in the same order, so no
  // seed moves.
  const ears = {
    latitude: draw(F.ears.latitude),
    size: draw(F.ears.size),
    pointiness: draw(F.ears.pointiness),
    extrusion: draw(F.ears.extrusion),
    // A count, so the draw is rounded; earGeometry clamps anything under 2
    // back up to 2 (one pair can't curve).
    pointSets: Math.round(draw(F.ears.pointSets)),
  };
  const nose = {
    y: draw(F.nose.y),
    length: draw(F.nose.length),
    radius: draw(F.nose.radius),
    scrunch: draw(F.nose.scrunch),
    bulbosity: draw(F.nose.bulbosity),
  };
  const eyes = {
    latitude: draw(F.eyes.latitude),
    azimuth: draw(F.eyes.azimuth),
    size: draw(F.eyes.size),
  };
  // The eyes are the one placement on the face that is ABSOLUTE — a latitude
  // and an azimuth on the head — and everything else hangs off them: the nose
  // drops from the eye line here, the mouth drops from the nose, and the
  // cheeks anchor to the eyes' azimuth crossed with the nose's latitude (see
  // cheekPlacement()). So `F.nose.y` is not a latitude any more: it is how far
  // the TOP of the nose sits below the eye line, and 0 tucks it right under
  // the eyes. Radius is in the anchor so a fat nose rides lower instead of
  // peeking over.
  //
  // This replaces the old clamp (min(y, eyes.y - radius)), which kept noses
  // out of eyes by silently overwriting the authored number — on some presets
  // it fired on nearly every doll and the band read as dead. A drop can't be
  // eaten that way: every part of the band moves the nose.
  nose.y = eyes.latitude - nose.radius - nose.y;

  return {
    seed,
    headKey,
    bodyKey,
    limbKey,
    hairKey,
    texKey,
    texture,
    colorKey,
    bump,
    shape: build.shape,
    body: build.body,
    neck: build.neck,
    ears,
    nose,
    eyes,
    cheeks: {
      azimuth: draw(F.cheeks.azimuth),
      latitude: draw(F.cheeks.latitude),
      size: draw(F.cheeks.size),
      bulge: draw(F.cheeks.bulge),
    },
    mouth: {
      // Hung off the resolved nose — after its own clamp against the eyes, so
      // a nose pushed down carries the mouth with it. The band is a DISTANCE
      // BELOW, so it subtracts: 0 sits on the nose, bigger drops further.
      //
      // Nothing clamps the result. It briefly did, against the nose, and that
      // had to go — this is a rig for hand-authoring bands, and a placement
      // that silently overrides the number you just typed is worse than a
      // mouth that overlaps a nose. You can see an overlap and fix it; you
      // cannot see a clamp.
      y: nose.y - draw(F.mouth.latitude),
      width: draw(F.mouth.width),
      height: draw(F.mouth.height),
      lift: draw(F.mouth.lift),
      taper: draw(F.mouth.taper),
      gap: draw(F.mouth.gap),
      // Magnitude and sign come off two separate rolls, and BOTH happen
      // whatever the mood override says — so forcing every mouth to smile
      // changes which way they curve and nothing else about the doll.
      bow: (() => {
        const mag = draw(F.mouth.bow);
        const up = chance(F.mouth.smileBias);
        return mag * (mood === "smile" || (mood === null && up) ? 1 : -1);
      })(),
    },
    arms: limbs.arms,
    legs: limbs.legs,
    // Its own axis, so the antennae tab sweeps the stalks and pins the rest.
    // The phase is set INSIDE the literal because the draws happen here, in
    // source order, and put back afterwards so the draws below stay on the
    // axis it has always been on.
    hair: (() => {
      phase = "hair";
      // Defaults, then the hair preset, then the head's own say — a head
      // preset's `hair[hairKey]` block partially overrides the catalog, so
      // carrot leaves can run bigger without leaves changing for anyone else.
      // Seed-safe: the reads below walk a fixed key list, so overriding band
      // VALUES never adds or removes a draw.
      const h = {
        ...B.hairDefaults,
        ...B.hairs[hairKey],
        ...((B.heads[headKey].hair ?? {})[hairKey] ?? {}),
      };
      const out = {
        count: drawCount(draw, h.count, h.omit),
        startAtCenter: draw(h.startAtCenter),
        spread: draw(h.spread),
        length: draw(h.length),
        radius: draw(h.radius),
        taper: draw(h.taper),
        // A mesh count, so it lands on a whole number — mkRope() builds this
        // many segment meshes, and stepRope() solves this many links.
        segments: Math.round(draw(h.segments)),
        topRadius: draw(h.topRadius),
        stalk: draw(h.stalk),
        stalkCurve: draw(h.stalkCurve),
        beadSize: draw(h.beadSize),
        // A string through the same reader as everything else: it consumes its
        // draw like any other key, so the stream stays aligned whether a
        // preset varies it or not.
        tip: draw(h.tip),
        tipAspect: draw(h.tipAspect),
        tipFlat: draw(h.tipFlat),
        capBulge: draw(h.capBulge),
        capWobble: draw(h.capWobble),
        stiffness: draw(h.stiffness),
        // Last in the object on purpose: a key added here consumes its draw
        // after every other hair param, so the presets that predate it come
        // out of a given seed exactly as they did. One roll either way — the
        // coin is flipped for every preset, and the ones that don't ramp
        // simply have nothing to show for it.
        stack: chance(h.ascendingChance) ? "ascending" : "descending",
        // After `stack` for the same reason `stack` sits after everything
        // else: newest key draws last, so every seed that predates it holds.
        // One amount per doll — the per-antenna scatter it feeds comes off a
        // local rng in hairDirections(), so no count-dependent draws ever
        // touch this stream.
        jitter: draw(h.jitter),
        rigidity: draw(h.rigidity),
        // Newest key, so it draws last — see `stack` above.
        seat: draw(h.seat),
        // Newer still, so it draws after `seat` — same rule.
        azimuth: draw(h.azimuth),
        // Newest key of all, so it draws last — same rule as `stack`, `seat`.
        shiftColor: draw(h.shiftColor),
        // Newer than `shiftColor`, so after it — same rule again.
        lean: draw(h.lean),
      };
      phase = "head";
      return fitBeadStack(orientStack(out));
    })(),
    palette,
    rope: B.rope,
  };
}

// ---- blinking ------------------------------------------------------------
// Seconds a blink takes end to end, and the longest wait between two.
const BLINK_TIME = 0.13;
const BLINK_GAP = 5;

// ============================================================ Doll
// Scratch for carryRopes(), which runs once per doll per frame and has no
// business allocating.
const _carryM = new THREE.Matrix4();
const _carryRef = new THREE.Vector3();

// Scratch for the rest of the per-step rope work — step(), advanceRope(),
// collideWithBody() and drawRope() between them ran to a few hundred fresh
// vectors per doll per solve, which at a world scene's headcount was megabytes
// of garbage a second and most of what the tab's memory graph was climbing.
// None of these calls re-enter each other with the same scratch in hand, so
// one set of module temps per function is safe.
const _stV = new THREE.Vector3(); // step(): deform input
const _stN = new THREE.Vector3(); // step(): deform normal
const _stUp = new THREE.Vector3();
const _stRef = new THREE.Vector3();
const _stRest = new THREE.Vector3();
const _stArm = [0, 1, 2, 3].map(() => new THREE.Vector3());
const _stLeg = [0, 1, 2, 3].map(() => new THREE.Vector3());
// `v` for the first arm; for the second (`i` = 1) the same reflected across
// the plane normal to `right`, so the two make a pair.
function mirror(out, v, right, i) {
  return out
    .copy(v)
    .addScaledVector(right, i ? -2 * v.dot(right) : 0)
    .normalize();
}
const _arIdeal = new THREE.Vector3();
const _arDir = new THREE.Vector3();
const _cbLocal = new THREE.Vector3();
const _cbV = new THREE.Vector3();
const _cbN = new THREE.Vector3();
const _drD = new THREE.Vector3();
const _drLast = new THREE.Vector3();
const _drY = new THREE.Vector3();
const _drX = new THREE.Vector3();
const _drM = new THREE.Matrix4();
const _X_AXIS = new THREE.Vector3(1, 0, 0);

// The invisible ellipsoid every doll is picked by. One geometry, one material,
// scaled per doll — see fitHitProxy().
const PROXY_GEO = new THREE.SphereGeometry(1, 8, 8);
const PROXY_MAT = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});

class Doll {
  // `finish` makes a material from a color and the odd extra flag — the
  // plasticine the grid is pinched from by default; the r3f world hands in
  // its toon (see r3f/src/refactored/adjectives/unlit/toon.js) so a doll
  // out there is shaded the same way as the ground it stands on.
  constructor(cfg, position, finish = plasticine) {
    this.cfg = cfg;
    // The skull is the ceiling on how fat an antenna base may be drawn. The
    // root is sunk one radius down its own axis to hide the flat rim (see
    // drawRope()), so a base wider than the head comes out the far side — a
    // disc through the face. Measured rather than assumed 1: the balloons
    // pull heads well off the unit sphere, so sample the top hemisphere and
    // take its tightest point. The check runs first, and a radius that
    // already fits passes through untouched. Times `count` because
    // stalkRadius() divides the band by it before anything is drawn, and
    // times `scale` because the fit is measured on the unit head (see
    // hairDirections()).
    if (cfg.hair.count > 0) {
      let fit = Infinity;
      const v = new THREE.Vector3(),
        n = new THREE.Vector3();
      for (let j = 0; j <= 6; j++) {
        const polar = (j / 6) * (Math.PI / 2);
        const ring = j === 0 ? 1 : 16;
        for (let i = 0; i < ring; i++) {
          const th = (i / ring) * Math.PI * 2;
          n.set(
            Math.sin(polar) * Math.cos(th),
            Math.cos(polar),
            Math.sin(polar) * Math.sin(th),
          );
          fit = Math.min(fit, this.deformPoint(v.copy(n), n).length());
        }
      }
      cfg.hair.radius = Math.min(
        cfg.hair.radius,
        fit * cfg.hair.count * (cfg.hair.scale ?? 1),
      );
    }
    this.root = new THREE.Group();
    this.root.position.copy(position);
    // The ropes' meshes. They are solved and drawn in WORLD space, so they
    // cannot hang under `root` — this group has to sit at the scene's top
    // level with an identity transform. The doll adds nothing to any scene
    // itself: whoever builds it parents `root` and `ropeGroup`, which is what
    // lets one class stand on the grid's flat wall and on the planet.
    this.ropeGroup = new THREE.Group();
    // Which way is down for the ropes — arms, legs and antennae. World space,
    // because that is where they are solved, and a plain -y until something
    // puts this doll somewhere that disagrees. See advanceRope().
    this.down = new THREE.Vector3(0, -1, 0);
    // The ropes' damping, when whoever carries the doll wants a say — the
    // player floating in zero-g slackens it so a limb keeps coasting. Null
    // reads the preset's. Set per frame like `down`, never on the config:
    // `cfg.rope` is the preset's own object, shared by every doll.
    this.ropeDamping = null;
    // Anything ELSE the ropes have to stay out of, as a function that takes a
    // world-space point and nudges it back out of whatever it is inside. The
    // doll's own body is handled separately and always — this is for the set a
    // scene has stood it on. Null for a doll with nothing but air around it,
    // which is every doll on the grid and the one you fly.
    this.collider = null;
    // A pose HELD on the arms, or null to let them hang. `upper` and `lower`
    // are world-space directions for the arm above and below the elbow,
    // `elbow` where along the arm it bends (0..1), and `weight` how hard the
    // solved rope is pulled onto it each solve — see the rigidity pass in
    // advanceRope(). The flight sets it for the push-up after a splat.
    this.armPose = null;
    // The same for the legs: `upper` the thigh, `lower` the shin, `knee`
    // where along the leg it bends. The flight sets it for sitting down.
    this.legPose = null;
    // Where the doll stood the last time its ropes were solved. carryRopes()
    // reads it to work out how far the body has moved since, and a doll that
    // has not moved at all compares equal and costs nothing.
    this.solveAt = new THREE.Matrix4();

    this.face = new THREE.Group();
    this.root.add(this.face);
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    // materials
    const P = cfg.palette;
    const noseColor = new THREE.Color(P.skin)
      .offsetHSL(0, 0.02, -0.14)
      .getHex();
    // Every piece is in the one `finish` — see above. One material per
    // color on the doll.
    this.mats = {
      skin: finish(P.skin),
      nose: finish(noseColor),
      cheek: finish(P.cheek),
      paint: finish(P.paint, { side: THREE.DoubleSide }),
      limb: finish(P.limb),
      // Arms and legs, ball ends included.
      limbBoard: finish(P.limbBoard),
      antennaBead: finish(P.antennaBead),
    };

    // head
    const detail = cfg.texture.detail;
    this.headGeo = smoothGeo(new THREE.IcosahedronGeometry(1, detail));
    this.headBase = this.headGeo.attributes.position.array.slice();
    this.head = new THREE.Mesh(this.headGeo, this.mats.skin);
    this.face.add(this.head);

    this.bodyGeo = smoothGeo(new THREE.IcosahedronGeometry(1, detail));
    this.bodyBase = this.bodyGeo.attributes.position.array.slice();
    this.body = new THREE.Mesh(this.bodyGeo, this.mats.skin);
    this.bodyGroup.add(this.body);

    const G = {
      // Built fresh per doll for its own `pointiness`/`extrusion`.
      ear: earGeometry(
        cfg.ears.pointiness,
        cfg.ears.extrusion,
        cfg.ears.pointSets,
      ),
      // Eyes and cheeks are the same dome.
      eye: EYE_GEO,
      // Hands, feet, and the ball on the end of an antenna.
      ball: BALL_GEO,
    };
    this.geo = G;

    // parts
    this.leftEar = new THREE.Mesh(G.ear, this.mats.skin);
    this.rightEar = new THREE.Mesh(G.ear, this.mats.skin);
    this.face.add(this.leftEar, this.rightEar);

    this.noseMesh = new THREE.Mesh(this.makeNoseGeo(), this.mats.nose);
    this.face.add(this.noseMesh);

    this.leftEye = new THREE.Mesh(G.eye, this.mats.paint);
    this.rightEye = new THREE.Mesh(G.eye, this.mats.paint);
    this.face.add(this.leftEye, this.rightEye);

    // The eye's own dome, squashed flat by `bulge` when it is placed.
    this.leftCheek = new THREE.Mesh(G.eye, this.mats.cheek);
    this.rightCheek = new THREE.Mesh(G.eye, this.mats.cheek);
    this.face.add(this.leftCheek, this.rightCheek);

    this.mouthMesh = new THREE.Mesh(this.makeMouthGeo(), this.mats.paint);
    this.face.add(this.mouthMesh);

    this.neckMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.skin);
    this.root.add(this.neckMesh);

    // Antennae live in the SCENE, not under root. They are simulated in world
    // space, so parenting them to a doll that gets moved and spun would fight
    // the solver — step() anchors them to the head each frame instead.
    this.ropes = { hair: [] };
    // The two stalks state their profile differently, and each states it the
    // way that stalk is actually thought about:
    //
    //   barrel  `radius` and `taper` — a base radius and a RATIO for the tip.
    //           Rounded ends hide the joins, so drawRope() just ramps the
    //           per-segment scale linearly and lets neighbors differ.
    //   tube    `radius` and `topRadius` — both ABSOLUTE, both bands, dialled
    //           independently. Flat ends have to meet exactly, so the radius
    //           down the rope is geometric, and the ratio one segment steps by
    //           is the nth root of the whole stalk's.
    //
    // Which means each stalk ignores the other's key: a tube never reads
    // `taper`, a barrel never reads `topRadius`. Both are still drawn by every
    // preset, so the draw count stays the same either way.
    const stalk = STALKS[cfg.hair.stalk];
    this.stalkStep =
      stalk.frustum ?
        Math.pow(
          Math.max(1e-4, stalkTopRadius(cfg.hair)) /
            Math.max(1e-4, stalkRadius(cfg.hair)),
          1 / Math.max(1, cfg.hair.segments),
        )
      : 1;
    // Built per doll only when the shape depends on the draw; otherwise the
    // one shared barrel. dispose() drops it iff we made it.
    // The curve is a property of ONE segment's profile. On a single-segment
    // stalk that is the whole stalk, which is what the curved presets use; on
    // a multi-segment one the same curve repeats per link, so a strong curve
    // there scallops rather than sweeping. Keep `stalkCurve` and `segments`
    // in mind together, the same way `length` and `segments` go together.
    this.stalkGeo =
      stalk.frustum ? tubeGeometry(this.stalkStep, cfg.hair.stalkCurve) : null;
    // Same deal for the tip: cut per doll only when its shape was drawn.
    const tipSpec = TIPS[cfg.hair.tip];
    this.tipGeo =
      tipSpec.make ? tipSpec.make(cfg.hair, cfg.seed, cfg.bump) : null;

    // `step` and `geo` ride the ROPE rather than the doll. They used to be
    // doll-level, which was true while the antennae were the only ropes on it;
    // with limbs back a doll can carry a tube-stalked antenna and a
    // barrel-stalked arm at once, and drawRope() has to be able to tell them
    // apart. Antennae still hand it the per-doll cut, the limbs their own.
    const mkRope = (n, segGeo, segMat, tipGeo, tipMat, stalkGeo, step) => {
      const segs = [];
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(segGeo, segMat);
        this.ropeGroup.add(m);
        segs.push(m);
      }
      const tip = new THREE.Mesh(tipGeo, tipMat);
      this.ropeGroup.add(tip);
      return { segs, tip, points: [], prev: [], stalkGeo, step };
    };
    for (let i = 0; i < cfg.hair.count; i++) {
      const r = mkRope(
        cfg.hair.segments,
        this.stalkGeo ?? stalk.geo,
        cfg.hair.shiftColor ? this.mats.limb : this.mats.skin,
        this.tipGeo ?? (tipSpec.geo === BALL_GEO ? G.ball : tipSpec.geo),
        this.mats.antennaBead,
        this.stalkGeo,
        this.stalkStep,
      );
      this.ropes.hair.push(r);
    }

    // A limb is a barrel or a bead run with a ball on the end — either way a
    // stalk with shared geometry, no per-doll cut, and `step` stays 1 so
    // drawRope() reads its width off the linear ramp (the bead stalk follows
    // the barrel's radius law on purpose — see BEAD_STACK_GEO).
    //
    // Between neighboring segments sits a SPACER: a torus threaded on the
    // rope at each interior joint, the washer on a strung doll's elastic. Cut
    // per doll rather than shared, because the body's band deals its `tube`
    // as a ratio of the ring and no uniform scale can re-proportion a torus —
    // one cut, though, worn by all four limbs, since arms and legs draw one
    // spacer. It wears the BEAD board, not the limb's: a spacer is a bead,
    // and that is also what keeps it a different color from the segments.
    this.spacerGeo = new THREE.TorusGeometry(1, cfg.arms.spacer.tube, 8, 18);
    for (const key of ["arms", "legs"]) {
      this.ropes[key] = [];
      for (let i = 0; i < 2; i++) {
        const r = mkRope(
          cfg[key].segments,
          STALKS[cfg[key].stalk].geo,
          this.mats.limbBoard,
          G.ball,
          this.mats.limbBoard,
          null,
          1,
        );
        // One per interior joint — the ends have the body and the ball.
        r.spacers = [];
        for (let j = 1; j < cfg[key].segments; j++) {
          const m = new THREE.Mesh(this.spacerGeo, this.mats.antennaBead);
          this.ropeGroup.add(m);
          r.spacers.push(m);
        }
        this.ropes[key].push(r);
      }
    }

    // An invisible ellipsoid wrapping the head. Raycasting against eight of
    // these is effectively free; raycasting against every doll's actual
    // triangles is not.
    // Shared, both of them: every proxy is the same invisible sphere, and it is
    // only ever scaled. Cut per doll they were also never disposed, so each
    // rebuild leaked eight geometries and eight materials.
    this.hitProxy = new THREE.Mesh(PROXY_GEO, PROXY_MAT);
    this.hitProxy.userData.doll = this;
    this.root.add(this.hitProxy);

    // A blink clock of its own, seeded off the doll, so eight of them on
    // screen do not blink in chorus. `next` counts down to the next one;
    // `phase` runs 0 to 1 through the blink itself and is negative between.
    const br = mulberry32(cfg.seed ^ 0x5eed);
    this.blink = { next: 0.6 + br() * BLINK_GAP, phase: -1, rng: br };

    this.build();
    this.fitHitProxy();
  }

  fitHitProxy() {
    const m = this.metrics();
    // The FIGURE, not the crown: skull down to the foot of the body, and
    // nothing above it. Stretching it up over the antennae would hand you a
    // doll from a hand's width of empty air over its head.
    this.hitProxy.position.y = (m.skullTop + m.chin) / 2;
    // A shade larger, so ears and nose stay grabbable.
    const w = m.skullHalf * 1.15;
    this.hitProxy.scale.set(w, (m.skullHeight / 2) * 1.1, w);
  }

  deformPoint(v, n) {
    return deformWith(this.cfg.shape, v, n);
  }

  // The surface a FEATURE sits on: the bumped head, standing off it by a
  // little. Features RIDE the texture — an eye on the flank of a lump tilts
  // with it — and `relief` only decides how proud of it they sit.
  //
  // This is a CLEARANCE, not a height, and it wants to stay small. It was
  // briefly 1.3-1.7 x amplitude, which threw the eyes and ears clean off the
  // head: on a texture 0.385 deep that is 0.58 of a head radius, ten times the
  // eye it was lifting. Keep it under about 0.3 and a feature sits proud of
  // the crust beside it without leaving the surface.
  //
  // Lifting off the SMOOTH form instead — cancelling the texture and hanging
  // the face at a fixed height — was the other way to fix the flying, and it
  // is wrong here: the lumps at low `detail` are far bigger than a feature, so
  // the face would hang in space wherever the surface below it dipped. Ride
  // the form, clear the crust.
  //
  // Everything mounted on the face goes through here — ears, nose, eyes,
  // cheeks, mouth, and the snap in closestSurfacePoint() — so they lift
  // together and keep their spacing. The head mesh, the silhouette
  // measurements and the antenna anchors deliberately do NOT.
  featureLift() {
    const b = this.cfg.bump;
    // Plus this mesh's own facet sag — at detail 14 it is 0.0007, which is
    // not worth a branch to avoid.
    return b.amplitude * b.relief + facetSag(this.cfg.texture.detail);
  }

  featurePoint(v, n) {
    const p = this.deformPoint(v, n);
    const lift = this.featureLift();
    return lift ? p.addScaledVector(n, lift) : p;
  }
  deformBodyPoint(v, n) {
    return deformWith(this.cfg.body, v, n);
  }

  makeNoseGeo() {
    const { scrunch, bulbosity } = this.cfg.nose;
    const pts = [];
    const k = 2 + (1 - bulbosity) * 10;
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const t = 1 + (scrunch - 1) * u;
      const r = Math.pow(1 - Math.pow(u, k), 1 / k);
      pts.push(new THREE.Vector2(Math.max(0, t * r), u));
    }
    const g = smoothGeo(new THREE.LatheGeometry(pts, 12));
    g.rotateX(Math.PI / 2);
    // The vertices that sit on the face — placeNose() lands each one on the
    // head's surface.
    this.noseRing = [];
    const p0 = g.attributes.position;
    for (let i = 0; i < p0.count; i++) {
      if (Math.abs(p0.getZ(i)) < 1e-6) this.noseRing.push(i);
    }
    this.noseBase = g.attributes.position.array.slice();
    return g;
  }

  // One lip: a rounded bar lying across the face, bent by the bow. It used to
  // be two of these stacked with a parting between them, and at mouth scale
  // that parting never read as a mouth — it read as a seam, or at small sizes
  // as one thick slab with a scratch through it. One bar carries the same
  // expression, because the expression was never in the parting: it is all in
  // the bow.
  //
  // The bar is a stadium — flat along its length, a half-round cap at each
  // end — sheared by bend(). The shear is measured against the mouth's WIDTH
  // while the shape is only as tall as its HEIGHT, so on a wide thin mouth an
  // honoured slope folds it into a chevron; mouthRise() is where that gets
  // clamped. placeMouth() drops the finished patch onto the head.
  makeMouthGeo() {
    const { taper, width, height } = this.cfg.mouth;
    const NU = 24,
      NV = 6;

    // Local space is a unit square that gets stretched to width x height when
    // it lands, so anything shaped here has to undo that stretch first.
    const aspect = height / Math.max(1e-6, width);
    const rise = mouthRise(this.cfg.mouth);
    const bend = (x) => rise * (4 * x * x - 0.5);

    // The single bar takes the whole local height, so the cap is a half-round
    // of half that.
    const capR = 0.5; // cap radius, in local y
    const capX = capR * aspect; // the same radius measured in local x

    const verts = [];
    const index = [];
    for (let j = 0; j <= NV; j++) {
      const s = -0.5 + j / NV; // across the bar, -0.5 at the bottom edge
      // Stadium: flat along the top and bottom, a round cap at each end.
      const round = capX * Math.sqrt(Math.max(0, 1 - (s / capR) * (s / capR)));
      // `taper` draws the top edge in relative to the bottom, so the lip can
      // sit fuller below than above rather than being a plain lozenge.
      const halfLen = 0.5 * lerp(1, taper, s + 0.5);
      const half = Math.max(0, halfLen - capX) + round;
      for (let i = 0; i <= NU; i++) {
        const x = (-1 + (2 * i) / NU) * half;
        verts.push(x, s + bend(x), 0);
      }
    }
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NU; i++) {
        const a = j * (NU + 1) + i,
          b = a + 1,
          c = b + NU + 1,
          d = a + NU + 1;
        index.push(a, b, c, a, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(index);
    this.mouthBase = Float32Array.from(verts);
    return g;
  }

  build() {
    // head vertices
    const applyMesh = (geo, base, deformer) => {
      const pos = geo.attributes.position;
      const v = new THREE.Vector3(),
        n = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
        n.copy(v).normalize();
        deformer(v, n);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };
    applyMesh(this.headGeo, this.headBase, (v, n) => this.deformPoint(v, n));
    applyMesh(this.bodyGeo, this.bodyBase, (v, n) =>
      this.deformBodyPoint(v, n),
    );
    this.body.scale.setScalar(this.cfg.body.size);

    this.placeEars();
    this.placeNose();
    this.placeEyes();
    this.placeCheeks();
    this.placeMouth();
    this.layout();
    this.buildNeck();
  }

  placeEars() {
    const { latitude: yTop, size } = this.cfg.ears;
    this.leftEar.visible = this.rightEar.visible = size > 0.001;
    if (size <= 0.001) return;
    const edgeLen = 2 * size;
    for (const [ear, sign] of [
      [this.rightEar, 1],
      [this.leftEar, -1],
    ]) {
      const xTop = Math.sqrt(Math.max(0, 1 - yTop * yTop));
      const topBase = new THREE.Vector3(sign * xTop, yTop, 0);
      const topAttach = this.featurePoint(
        topBase.clone(),
        topBase.clone().normalize(),
      );
      const targetY = topAttach.y - edgeLen;
      let bottomAttach = topAttach,
        best = Infinity;
      for (let s = 1; s <= 80; s++) {
        const yB = yTop - (s / 80) * (yTop + 1);
        const xS = Math.sqrt(Math.max(0, 1 - yB * yB));
        const p = new THREE.Vector3(sign * xS, yB, 0);
        const d = this.featurePoint(p.clone(), p.clone().normalize());
        const dist = Math.abs(d.y - targetY);
        if (dist < best) {
          best = dist;
          bottomAttach = d;
        }
      }
      const chord = bottomAttach.clone().sub(topAttach);
      const cl = chord.length() || 1e-6;
      const dxn = chord.x / cl,
        dyn = chord.y / cl;
      ear.position.copy(topAttach).multiplyScalar(0.98);
      ear.scale.set(size, cl / 2, size);
      const rotZ = sign === 1 ? Math.atan2(dxn, -dyn) : Math.atan2(-dxn, -dyn);
      ear.rotation.set(0, sign === 1 ? 0 : Math.PI, rotZ);
    }
  }

  // The surface's OWN normal at a sphere direction, rather than the direction
  // itself. Every feature until now mounted by treating `dir` as the normal,
  // which is only true on an undeformed sphere: balloon, point and shift all
  // slide mass in y, and the bump lays a crust over the result, so the real
  // tangent plane can tilt a long way off radial. A dome oriented radially on
  // that surface digs its rim in on the uphill side and floats it on the
  // downhill — which is exactly the "not lying flat" you see on the deformed
  // presets, and not at all on a round one.
  //
  // `span` is a FOOTPRINT, not an epsilon. Sampling at ±span along the two
  // tangents and taking the plane through those four points fits the patch the
  // feature actually covers, so a cheek sits on the average of the ground it
  // spans instead of chasing whatever the bump does at its center point. Pass
  // the feature's own radius. A true derivative (span → 0) is the wrong tool
  // here: on a bumpy head it reads one noise sample and tips the feature off
  // a crumb.
  //
  // `sag` is how far those rim samples fall below the tangent plane — the gap
  // a dome would leave under its own edge on a convex surface. Sink by it and
  // the rim meets the head instead of hovering over it.
  surfaceFrame(dir, span = 0.02) {
    const n0 = dir.clone().normalize();
    const up =
      Math.abs(n0.y) < 0.99 ?
        new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(n0, up).normalize();
    const t2 = new THREE.Vector3().crossVectors(n0, t1).normalize();
    // Off the sphere, then through the deformer exactly once — the same round
    // trip placeMouth() is careful about, for the same reason.
    const at = (a, b) => {
      const d = n0
        .clone()
        .addScaledVector(t1, a)
        .addScaledVector(t2, b)
        .normalize();
      return this.featurePoint(d.clone(), d.clone());
    };

    const point = at(0, 0);
    // `span` is a WORLD length, but `at` takes an offset in direction space,
    // and on a stretched head those are not the same thing in the two tangents
    // — nor even the same on both sides of one. Left uncorrected the four
    // samples sit at unequal distances, the secant plane tilts toward the
    // near ones, and the fit comes out worse than it needs to: on a head
    // deflated to 0.68 wide and stretched to 2.4 tall, 15 degrees off. So buy
    // the local exchange rate first, exactly as placeMouth() does for width
    // and height, and spend `span` at that rate.
    const PROBE = 1e-3;
    const rate = (a, b) => Math.max(1e-6, at(a, b).distanceTo(point) / PROBE);
    const e1 = Math.max(1e-3, span / rate(PROBE, 0));
    const e2 = Math.max(1e-3, span / rate(0, PROBE));
    const pu = at(e1, 0),
      mu = at(-e1, 0),
      pv = at(0, e2),
      mv = at(0, -e2);
    const normal = new THREE.Vector3()
      .crossVectors(pu.clone().sub(mu), pv.clone().sub(mv))
      .normalize();
    // Degenerate patch (a pole, a pinched tip, a collapsed balloon) leaves the
    // cross product at zero length and normalize() hands back garbage. Fall
    // back to the direction — which is what every caller used to do anyway.
    if (!Number.isFinite(normal.x) || normal.lengthSq() < 0.5) {
      return { point, normal: n0, sag: 0 };
    }
    if (normal.dot(n0) < 0) normal.negate();

    let sag = 0;
    for (const q of [pu, mu, pv, mv]) sag += point.clone().sub(q).dot(normal);

    // The exchange rates above are also what lets a caller ask for the surface
    // at a WORLD offset in the tangent plane: resolve the offset onto the two
    // tangents, spend each at its own rate, and read the deformer there. It is
    // the honest answer — an actual point of the actual surface — rather than
    // a plane fitted near one.
    const r1 = rate(PROBE, 0),
      r2 = rate(0, PROBE);
    const surfaceAt = (w) => at(w.dot(t1) / r1, w.dot(t2) / r2);

    return { point, normal, sag: Math.max(0, sag / 4), surfaceAt };
  }

  /* PARKED — nearest-point search on the deformed surface.
     placeNose() was its only caller and it was WRONG there. The search starts
     from p normalised — that is, it assumes the surface near direction d is
     near d — and then refines over three levels of at most 0.15 radians. The
     deformer breaks the assumption: a zucchini's bottom shift is -1.38, so the
     face sits two thirds of a radius below the direction that generated it,
     and the search cannot walk that far. On doll #2 it moved every base-ring
     vertex about 0.2 — five times the nose's own radius — and unevenly, which
     is a splayed skirt under the nose rather than a join.
     surfaceFrame().surfaceAt() replaces it: no search, no starting guess, just
     the surface read at a stated tangent offset.
  closestSurfacePoint(p) {
    let n = p.clone().normalize();
    let best = this.featurePoint(n.clone(), n.clone());
    let bestD = best.distanceToSquared(p);
    const up =
      Math.abs(n.y) < 0.99 ?
        new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    for (let step = 0.15; step > 0.02; step *= 0.4) {
      const t1 = new THREE.Vector3().crossVectors(n, up).normalize();
      const t2 = new THREE.Vector3().crossVectors(n, t1).normalize();
      for (const [a, b] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const c = n
          .clone()
          .addScaledVector(t1, a * step)
          .addScaledVector(t2, b * step)
          .normalize();
        const sp = this.featurePoint(c.clone(), c.clone());
        const d = sp.distanceToSquared(p);
        if (d < bestD) {
          bestD = d;
          best = sp;
          n = c;
        }
      }
    }
    return best;
  }
*/

  placeNose() {
    const cfg = this.cfg.nose;
    const zF = Math.sqrt(Math.max(0, 1 - cfg.y * cfg.y));
    const base = new THREE.Vector3(0, cfg.y, zF);
    // The nose used to keep the identity rotation and always point down +Z,
    // wherever on the face it was mounted. On a round head that reads fine
    // because +Z IS the normal there; on a long or tipped one a low nose grew
    // out of the face sideways, and the base ring below had to snap a long way
    // to catch up — which is what dented the nostrils. Grown along the local
    // normal instead, the lathe leaves the face square to it and the snap has
    // almost nothing left to correct.
    const {
      point: attach,
      normal,
      surfaceAt,
    } = this.surfaceFrame(base.clone().normalize(), cfg.radius);
    this.noseMesh.position.copy(attach);
    this.noseMesh.quaternion.setFromUnitVectors(FORWARD, normal);
    this.noseMesh.scale.set(cfg.radius, cfg.radius, cfg.length);
    // The mesh now carries a rotation, so the round trip out to face space and
    // back has to honour it: world = position + q * (scale * local).
    const q = this.noseMesh.quaternion;
    const qInv = q.clone().invert();
    // How far the finished ring is buried under the skin. A ring landed exactly
    // ON the surface shows its seam wherever the two meshes disagree by a
    // rounding error; a fraction of the nose's own radius is enough to hide
    // that and is invisible on the nose's length.
    const SINK = 0.2;
    const pos = this.noseMesh.geometry.attributes.position;
    for (const i of this.noseRing) {
      const local = new THREE.Vector3(
        this.noseBase[i * 3],
        this.noseBase[i * 3 + 1],
        this.noseBase[i * 3 + 2],
      );
      // The base ring lies at local z = 0, and the mesh is aimed along the
      // surface normal — so once scaled and rotated this offset is a vector in
      // the tangent plane, which is exactly what surfaceAt() takes.
      const tangent = local
        .clone()
        .multiply(this.noseMesh.scale)
        .applyQuaternion(q);
      const landed = surfaceAt(tangent).addScaledVector(
        normal,
        -SINK * cfg.radius,
      );
      const back = landed
        .sub(this.noseMesh.position)
        .applyQuaternion(qInv)
        .divide(this.noseMesh.scale);
      pos.setXYZ(i, back.x, back.y, back.z);
    }
    pos.needsUpdate = true;
    this.noseMesh.geometry.computeVertexNormals();
  }

  placeEyes() {
    const cfg = this.cfg.eyes;
    const ringR = Math.sqrt(Math.max(0, 1 - cfg.latitude * cfg.latitude));
    for (const [eye, sign] of [
      [this.rightEye, 1],
      [this.leftEye, -1],
    ]) {
      const base = new THREE.Vector3(
        sign * Math.sin(cfg.azimuth) * ringR,
        cfg.latitude,
        Math.cos(cfg.azimuth) * ringR,
      );
      const normal = base.clone().normalize();
      const attach = this.featurePoint(base.clone(), normal);
      eye.position.copy(attach).multiplyScalar(0.99);
      eye.scale.setScalar(cfg.size);
      eye.quaternion.setFromUnitVectors(FORWARD, normal);
    }
  }

  // Where the cheeks actually land. The anchor crosses the eye's own azimuth
  // with the nose's own latitude — the same two coordinates placeEyes() and
  // the nose generator already resolve — and `azimuth` / `latitude` are
  // OFFSETS from that anchor: 0, 0 sits the cheek there exactly, and each
  // band pushes it further round the side or up/down the face from it.
  cheekPlacement() {
    const c = this.cfg.cheeks,
      eyes = this.cfg.eyes,
      nose = this.cfg.nose;

    const az = eyes.azimuth + c.azimuth;
    // Minus, not plus: positive-is-DOWN, the same convention mouth.y reads
    // off the nose with (nose.y - draw(F.mouth.latitude)).
    const lat = clamp(nose.y - c.latitude, -1, 1);
    const ring = Math.sqrt(Math.max(0, 1 - lat * lat));
    const dir = new THREE.Vector3(
      Math.sin(az) * ring,
      lat,
      Math.cos(az) * ring,
    );

    return {
      size: c.size,
      dirs: [1, -1].map(
        (sign) => new THREE.Vector3(sign * dir.x, dir.y, dir.z),
      ),
    };
  }

  placeCheeks() {
    const { size, dirs } = this.cheekPlacement();
    const show = size > 0.001;
    this.leftCheek.visible = this.rightCheek.visible = show;
    if (!show) return;
    [this.rightCheek, this.leftCheek].forEach((cheek, i) => {
      // Measured over the cheek's own footprint, so it lies on the average of
      // the ground it covers rather than tilting to a single point.
      const { point, normal, sag } = this.surfaceFrame(dirs[i], size);
      // Sunk along the SURFACE normal by the gap its own rim would leave, not
      // radially by a flat 1%. The old radial nudge was a guess that had to be
      // big enough for the worst case, which buried the shallow ones; this is
      // the measured number, so every cheek lands with its edge on the head.
      cheek.position.copy(point).addScaledVector(normal, -sag);
      // Round in the plane of the face, flattened along the way out.
      cheek.scale.set(size, size, size * this.cfg.cheeks.bulge);
      cheek.quaternion.setFromUnitVectors(FORWARD, normal);
    });
  }

  placeMouth() {
    const cfg = this.cfg.mouth;
    // The patch carries absolute face-space positions, so the mesh's own
    // transform stays out of it — every vertex is placed by hand below.
    this.mouthMesh.position.set(0, 0, 0);
    this.mouthMesh.quaternion.identity();
    this.mouthMesh.scale.setScalar(1);

    // One point of the UNDEFORMED sphere, through the deformer exactly once —
    // the same way ears, eyes, nose and cheeks are placed.
    //
    // The patch used to be built the other way round: step out from the
    // DEFORMED attach point, re-normalise that back into a direction, and
    // deform it a second time. On a near-sphere that round trip is close
    // enough to identity that it never showed; on a head deflated to 0.68 wide
    // and stretched to 4 tall it is not. A mouth asked for at y0 -0.20 landed
    // at -0.667, and the error grew with distance from the equator, so the
    // band read as broken rather than merely offset.
    const surfaceAt = (y, az) => {
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const p = new THREE.Vector3(Math.sin(az) * r, y, Math.cos(az) * r);
      return this.featurePoint(p.clone(), p.clone().normalize());
    };

    // `width` and `height` are world lengths, but the patch is laid out in
    // latitude and azimuth — so each needs the local exchange rate: how much
    // world distance one unit of that parameter buys HERE. Skip it and the
    // mouth stretches with the head, pinched and tall on a long one.
    const EPS = 1e-3;
    const attach = surfaceAt(cfg.y, 0);
    const perAz = Math.max(
      1e-6,
      surfaceAt(cfg.y, EPS).distanceTo(attach) / EPS,
    );
    const perY = Math.max(
      1e-6,
      surfaceAt(cfg.y + EPS, 0).distanceTo(attach) / EPS,
    );

    const pos = this.mouthMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const az = (this.mouthBase[i * 3] * cfg.width) / perAz;
      const y = cfg.y + (this.mouthBase[i * 3 + 1] * cfg.height) / perY;
      const s = surfaceAt(y, az);
      pos.setXYZ(i, s.x, s.y, s.z);
    }
    pos.needsUpdate = true;

    // Now stand it clear of the head by a hair. The head is a faceted
    // icosphere and this patch samples the smooth surface those facets
    // approximate, so flush on the surface the two interleave and the mouth
    // speckles. Lift along the patch's OWN normals rather than radially: the
    // deformer slides each mass in y, which tilts the surface away from
    // radial, and a radial nudge there pushes part of the lip back INTO the
    // head. Sitting on the surface, the patch's normals are the head's.
    this.mouthMesh.geometry.computeVertexNormals();
    const nrm = this.mouthMesh.geometry.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + nrm.getX(i) * cfg.lift,
        pos.getY(i) + nrm.getY(i) * cfg.lift,
        pos.getZ(i) + nrm.getZ(i) * cfg.lift,
      );
    }
    pos.needsUpdate = true;
  }

  // Stack the head on the body across the neck, then center the whole figure
  // on the doll's own origin — so every cell in the grid is framed the same
  // way however tall or squat the pairing it holds.
  //
  // The head is measured at unit scale and the body at its own, which is the
  // only place `size` has to be applied by hand: both deformers work on a unit
  // sphere and the body mesh carries the scale as a transform.
  layout() {
    const up = new THREE.Vector3(0, 1, 0),
      down = new THREE.Vector3(0, -1, 0);
    const headTop = this.deformPoint(up.clone(), up.clone()).y;
    const headBottom = this.deformPoint(down.clone(), down.clone()).y;
    const bodyTop =
      this.deformBodyPoint(up.clone(), up.clone()).y * this.cfg.body.size;
    const bodyBottom =
      this.deformBodyPoint(down.clone(), down.clone()).y * this.cfg.body.size;
    // Hang the body off the bottom of the head by the neck's length, then slide
    // both so the figure straddles y = 0.
    const bodyY = headBottom - this.cfg.neck.length - bodyTop;
    const mid = (headTop + (bodyY + bodyBottom)) / 2;
    this.face.position.y = -mid;
    this.bodyGroup.position.y = bodyY - mid;
  }

  neckRing(radius, deformer, surfaceScale, poleSign, offsetY, theta) {
    const nk = this.cfg.neck;
    const frac = Math.min(0.985, Math.max(0.02, radius / surfaceScale));
    const phi = Math.asin(frac);
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi) * poleSign,
      Math.sin(phi) * Math.sin(theta),
    );
    const p = deformer(dir.clone(), dir.clone()).multiplyScalar(surfaceScale);
    p.multiplyScalar(1 - nk.sink);
    p.y += offsetY;
    return p;
  }

  buildNeck() {
    const nk = this.cfg.neck;
    const RAD = 12,
      SEG = 12;
    const hOff = this.face.position.y,
      bOff = this.bodyGroup.position.y;
    const top = [],
      bot = [];
    for (let i = 0; i < RAD; i++) {
      const th = (i / RAD) * Math.PI * 2;
      top.push(
        this.neckRing(
          nk.topRadius,
          (v, n) => this.deformPoint(v, n),
          1,
          -1,
          hOff,
          th,
        ),
      );
      bot.push(
        this.neckRing(
          nk.bottomRadius,
          (v, n) => this.deformBodyPoint(v, n),
          this.cfg.body.size,
          1,
          bOff,
          th,
        ),
      );
    }
    const botR = Math.hypot(bot[0].x, bot[0].z),
      topR = Math.hypot(top[0].x, top[0].z);

    const shapeF = (t) => {
      const linear = botR + (topR - botR) * t;
      const shaped = topR + (botR - topR) * Math.pow(1 - t, nk.blend);
      return linear > 1e-6 ? shaped / linear : 1;
    };
    const bodyAtRadius = (theta, radius) => {
      const frac = Math.min(0.985, Math.max(0.02, radius / this.cfg.body.size));
      const phi = Math.asin(frac);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      const p = this.deformBodyPoint(dir.clone(), dir.clone()).multiplyScalar(
        this.cfg.body.size,
      );
      p.y += bOff;
      return p;
    };
    const pointAt = (i, t) => {
      const p = bot[i].clone().lerp(top[i], t);
      const f = shapeF(t);
      p.x *= f;
      p.z *= f;
      if (nk.fillet > 0.001 && t < nk.fillet) {
        const w = smoothstep(0, nk.fillet, t);
        const th = (i / RAD) * Math.PI * 2;
        p.lerp(bodyAtRadius(th, Math.hypot(p.x, p.z)), 1 - w);
      }
      return p;
    };

    const verts = [];
    const push = (v) => verts.push(v.x, v.y, v.z);
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG,
        t1 = (j + 1) / SEG;
      for (let i = 0; i < RAD; i++) {
        const i2 = (i + 1) % RAD;
        const a = pointAt(i, t0),
          b = pointAt(i2, t0),
          c = pointAt(i2, t1),
          d = pointAt(i, t1);
        push(a);
        push(c);
        push(b);
        push(a);
        push(d);
        push(c);
      }
    }
    let g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g = smoothGeo(g);
    this.neckMesh.geometry.dispose();
    this.neckMesh.geometry = g;
  }

  // Where the four limbs leave the body. Arms ring it at `y` and lean forward
  // by `spread`; legs hang off the bottom and splay sideways by theirs.
  limbDirections() {
    const a = this.cfg.arms,
      l = this.cfg.legs;
    const out = { arms: [], legs: [] };
    for (const sign of [1, -1]) {
      const ringR = Math.sqrt(Math.max(0, 1 - a.y * a.y));
      out.arms.push(
        new THREE.Vector3(
          sign * Math.cos(a.spread) * ringR,
          a.y,
          Math.sin(a.spread) * ringR,
        ).normalize(),
      );
      out.legs.push(
        new THREE.Vector3(
          sign * Math.sin(l.spread),
          -Math.cos(l.spread),
          0,
        ).normalize(),
      );
    }
    return out;
  }

  // Where each antenna leaves the skull. The first one stands dead on the
  // crown and the rest ring it at `spread` off vertical — so one antenna is a
  // single spike rather than a lonely tilted one, and every count after that
  // stays symmetric about the middle.
  hairDirections() {
    const h = this.cfg.hair;
    const out = [];
    // With `startAtCenter` on, one antenna stands dead on the crown and the
    // rest ring it; with it off there is no middle one and the whole count
    // goes round the ring. That single flag is the whole arrangement, and it
    // is why the counts fall out the way they do:
    //
    //   on              off
    //   1  center       1  a lone tilted one
    //   2  a pair       2  a mirrored pair
    //   3  center + 2   3  a triangle
    //   4  center + 3   4  a square — a 2x2 grid seen from above
    //   5+ center + 4+  5+ an even ring
    //
    // The ring starts at +x and runs round, so an even count off-center always
    // comes out symmetric about the face rather than landing one antenna on
    // the nose.
    //
    // Two is the one count that overrides the flag. Center + 1 is not a pair,
    // it is a spike with a single companion leaning off it — lopsided every
    // time, with nothing on the far side to balance it. There is no seed where
    // that reads as intended, so it is refused here rather than left to every
    // preset to remember not to ask for.
    const centre = h.startAtCenter && h.count !== 2;
    const ring = centre ? h.count - 1 : h.count;
    // The ring never closes tighter than the tips are wide. `spread` is a
    // polar angle off vertical, and the head is unit scale, so an angle in
    // radians IS an arc length across the crown — which makes the tip's own
    // radius the natural floor: below it a ring antenna is standing on top of
    // the center one rather than beside it.
    //
    // Derived here rather than clamped into the config on the way in, because
    // the floor moves with `beadSize` and `count`, and a number pinned at draw
    // time would go stale the moment either was retuned. This is the only
    // place `spread` is read, so there is nowhere for the two to disagree.
    //
    // The bead is a world size and the head is a unit sphere, so the two only
    // compare on a doll drawn at unit scale. `hair.scale` is how many times
    // that the hair sizes have been blown up to sit on a bigger head
    // (superspace's orbiting heads — see superspace/SuperSpace.jsx); read in
    // head units the bead is that much smaller. Without it a horn's bead on
    // a five-times head is a floor of two radians, which is past the
    // equator: the horns come out on the chin.
    const bead = beadRadius(h) / (h.scale ?? 1);
    const spread = Math.max(h.spread, bead);
    // The scatter off the perfect ring. Per-antenna rolls come off their own
    // rng seeded from the doll, so the config's draw stream never sees a
    // count-dependent number of draws. Gated to
    // counts of 4+ for EVERY type: 1-3 read as composed, and jitter on a pair
    // or a triangle just reads as misplaced. `jitter` is a fraction of the
    // slot width, capped at half, so neighbors can meet but never swap; the
    // same roll's partner wobbles the lean off vertical, which is what
    // actually breaks the circle.
    const jig = h.count > 3 ? Math.min(h.jitter, 1) : 0;
    const slot = Math.PI / Math.max(1, ring); // half the gap between slots
    const jr = mulberry32(this.cfg.seed ^ 0x0a17);
    for (let i = 0; i < h.count; i++) {
      if (centre && i === 0) {
        out.push(new THREE.Vector3(0, 1, 0));
        continue;
      }
      const th =
        h.azimuth +
        ((centre ? i - 1 : i) / Math.max(1, ring)) * Math.PI * 2 +
        (jr() * 2 - 1) * jig * slot;
      // The lean wobble re-clears the bead floor, so a jittered-inward ring
      // antenna still can't stand on the center one.
      const sp = Math.max(spread * (1 + (jr() * 2 - 1) * jig * 0.35), bead);
      out.push(
        new THREE.Vector3(
          Math.sin(sp) * Math.cos(th),
          Math.cos(sp),
          Math.sin(sp) * Math.sin(th),
        ).normalize(),
      );
    }
    return out;
  }

  // Verlet: integrate, then satisfy the segment lengths a few times. Written
  // for arms and legs too, which is why it carries `noCollide` and takes the
  // config rather than reading this.cfg.hair — the antennae are the only ones
  // using it for now.
  // How long a newborn rope is relaxed before it is allowed on screen, and the
  // timestep it is relaxed at. Fixed rather than the frame's own dt, so a doll
  // built during a slow frame settles into the same pose as one built during a
  // fast one.
  // 300 is where it stops paying: measured on a mid-band arm, the first frame
  // after a settle of 0/30/90/300 steps moves the tip 0.0287 / 0.0042 / 0.0024
  // / 0.0004 world units, and 600 only buys another 0.0004. It is a few
  // hundred frames of rope work, once, at build.
  static SETTLE_STEPS = 300;
  static SETTLE_DT = 1 / 60;

  stepRope(r, anchor, cfg, dt, opts = {}) {
    const n = cfg.segments;
    const segLen = cfg.length / n;

    if (r.points.length !== n + 1) {
      const restDir = opts.restDir || null;
      const start = restDir ? restDir.clone() : this.down.clone();
      r.points = [];
      r.prev = [];
      for (let i = 0; i <= n; i++) {
        const p = anchor.clone().addScaledVector(start, segLen * i);
        r.points.push(p);
        r.prev.push(p.clone());
      }
      // A newborn arm is a straight line hanging off the side of the body,
      // which means it is a straight line THROUGH the body. Left to the first
      // real frame, collideWithBody() shoves every point of it out at once,
      // Verlet reads that shove as velocity, and the doll comes up swinging —
      // the flail on reload.
      //
      // So run the rope to its resting pose here instead, and hand the first
      // frame a limb that is already hanging where gravity wants it. The
      // velocity is zeroed after every settle step rather than only at the
      // end: with momentum carried between them this is a pendulum finding its
      // own rest, which takes a long time and overshoots on the way; without
      // it, it is a relaxation that just walks downhill into the answer.
      for (let k = 0; k < Doll.SETTLE_STEPS; k++) {
        this.advanceRope(r, anchor, cfg, Doll.SETTLE_DT, opts);
        for (let i = 0; i <= n; i++) r.prev[i].copy(r.points[i]);
      }
    }
    this.advanceRope(r, anchor, cfg, dt, opts);
  }

  // One frame of the solver: gravity by Verlet, then the constraints. Split
  // out of stepRope() so a newborn rope can be run through it a hundred times
  // before anyone sees it.
  advanceRope(r, anchor, cfg, dt, opts = {}) {
    const ropeCfg = this.cfg.rope;
    const n = cfg.segments;
    const segLen = cfg.length / n;
    const restDir = opts.restDir || null;
    const stiffness = opts.stiffness || 0;
    const damping = this.ropeDamping ?? ropeCfg.damping;
    // The root link is held within a cone round restDir — see below.
    const cone =
      restDir && opts.lean != null ? Math.cos((opts.lean * Math.PI) / 2) : null;

    // Down the doll's OWN down, not the world's. The ropes are solved in world
    // space, so on a plane those are the same vector and this never mattered;
    // on a ball, a doll standing on the far side has arms, legs and antennae
    // being pulled at the sky. That is the whole of what made flying round the
    // back feel upside down — not the camera, which was already carrying the
    // doll's up, but a doll whose hair stood on end when it got there.
    //
    // `down` is centripetal: it points at the middle of the world, which is
    // where a thing moving in a circle is held toward. It is set per frame by
    // whatever is carrying the doll; a doll on the grid never touches it and
    // keeps the world's -y. Its LENGTH is the share of gravity that applies:
    // the player in zero-g shortens it to a whisper rather than aiming it
    // anywhere else.
    const g = ropeCfg.gravity * dt * dt;
    const gx = this.down.x * g,
      gy = this.down.y * g,
      gz = this.down.z * g;
    for (let i = 1; i <= n; i++) {
      const p = r.points[i],
        pv = r.prev[i];
      const vx = (p.x - pv.x) * damping;
      const vy = (p.y - pv.y) * damping;
      const vz = (p.z - pv.z) * damping;
      pv.copy(p);
      p.set(p.x + vx + gx, p.y + vy + gy, p.z + vz + gz);
    }
    const ideal = _arIdeal,
      dir = _arDir;
    for (let it = 0; it < ropeCfg.iterations; it++) {
      r.points[0].copy(anchor);
      if (stiffness > 0) {
        for (let i = 1; i <= n; i++) {
          if (i === 1) {
            if (!restDir) continue;
            dir.copy(restDir);
          } else dir.subVectors(r.points[i - 1], r.points[i - 2]).normalize();
          ideal.copy(r.points[i - 1]).addScaledVector(dir, segLen);
          r.points[i].lerp(ideal, stiffness * 0.5);
        }
      }
      // The root link is rooted: it may lean off restDir only so far (see
      // `hair.lean`). An antenna passes noCollide — nothing keeps it off the
      // skull — and once knocked flat across the head by a swing, its first
      // link is drawn from one radius INSIDE the skull (drawRope()'s root
      // inset), which then shows out the far side. A constraint, like the
      // lengths: the position is folded back to the cone's edge and prev is
      // left alone, so the sim reads it as the swing stopping, not a kick.
      if (cone != null) {
        const p1 = r.points[1];
        dir.subVectors(p1, r.points[0]);
        const len = dir.length();
        if (len > 1e-6 && dir.dot(restDir) / len < cone) {
          // Split off the part across restDir and rebuild at the cone's edge.
          const along = dir.dot(restDir);
          ideal.copy(dir).addScaledVector(restDir, -along);
          const sin = Math.sqrt(Math.max(0, 1 - cone * cone));
          if (ideal.lengthSq() < 1e-12) ideal.copy(restDir);
          else ideal.normalize();
          p1.copy(r.points[0])
            .addScaledVector(restDir, len * cone)
            .addScaledVector(ideal, len * sin);
        }
      }
      for (let i = 0; i < n; i++) {
        const a = r.points[i],
          b = r.points[i + 1];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          dz = b.z - a.z;
        const len = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = (len - segLen) / len;
        if (i === 0) b.set(b.x - dx * diff, b.y - dy * diff, b.z - dz * diff);
        else {
          const h = diff * 0.5;
          a.set(a.x + dx * h, a.y + dy * h, a.z + dz * h);
          b.set(b.x - dx * h, b.y - dy * h, b.z - dz * h);
        }
      }
      // Antennae pass noCollide — they leave the skull, not the body, and the
      // solver would push them out of a mass they never entered. Arms and legs
      // do not, so a slack limb lies along the body instead of through it —
      // held off by `clearance`, its own half-width at each point, so the
      // beads and spacers rest on the surface rather than sinking to their
      // centerline.
      // The skull is a second solid, held off the same way: an arm flung up
      // or a leg swung high by a pose rests on the head, not through it.
      if (!opts.noCollide) {
        const cl = cfg.clearance;
        for (let i = 1; i <= n; i++) {
          const clear = cl ? cl[i - 1] : 0;
          this.collideWithBody(r.points[i], clear);
          this.collideWithHead(r.points[i], clear);
        }
      }
      // The set, if this doll is sat on one. No noCollide exemption: a doll
      // sitting on a step has the next step up right behind its head, and its
      // antennae have as much business staying out of that as its legs do.
      // Inside the iteration loop, like the body, so the length constraint and
      // the push-out get to argue it out rather than the last one winning.
      // Handed the same clearance as the body, so a foot's ball rests ON the
      // ground rather than sinking to its center.
      if (this.collider) {
        const cl = cfg.clearance;
        for (let i = 1; i <= n; i++)
          this.collider(r.points[i], cl ? cl[i - 1] : 0);
      }
    }
    // The blend `stiffness` turned out not to be. These ropes are re-forced
    // every frame — gravity per step is a sixth of a leaf's segment length —
    // so a flap is not remembered momentum that damping could bleed off, it
    // is re-created each solve, and no amount of stiffness or damping reads
    // as calm. This pulls the SOLVED pose toward the rigid spike along
    // restDir, prev included, so the correction is a teleport and never a
    // kick that next frame reads back as velocity. 0 is the raw sim, 1 bolts
    // the antenna to the skull; in between, flap amplitude scales down by
    // exactly (1 - rigidity) per solve. Runs last so it has the final word
    // over gravity and the constraints.
    //
    // `bend` folds the spike: `{ at, dir }` puts an elbow `at` of the way
    // along, and the rest of the rope runs from there along `dir` — an arm
    // bent at the halfway point is `{ at: 0.5, dir }`.
    const rigidity = opts.rigidity || 0;
    if (rigidity > 0 && restDir) {
      const bend = opts.bend || null;
      const elbow = bend ? Math.round(n * bend.at) : n;
      const ex = anchor.x + restDir.x * segLen * elbow;
      const ey = anchor.y + restDir.y * segLen * elbow;
      const ez = anchor.z + restDir.z * segLen * elbow;
      for (let i = 1; i <= n; i++) {
        let rx, ry, rz;
        if (i <= elbow) {
          rx = anchor.x + restDir.x * segLen * i;
          ry = anchor.y + restDir.y * segLen * i;
          rz = anchor.z + restDir.z * segLen * i;
        } else {
          rx = ex + bend.dir.x * segLen * (i - elbow);
          ry = ey + bend.dir.y * segLen * (i - elbow);
          rz = ez + bend.dir.z * segLen * (i - elbow);
        }
        const p = r.points[i],
          pv = r.prev[i];
        p.set(
          p.x + (rx - p.x) * rigidity,
          p.y + (ry - p.y) * rigidity,
          p.z + (rz - p.z) * rigidity,
        );
        pv.set(
          pv.x + (rx - pv.x) * rigidity,
          pv.y + (ry - pv.y) * rigidity,
          pv.z + (rz - pv.z) * rigidity,
        );
      }
      // The pose may want a hand where the floor is; the floor wins.
      if (this.collider && !opts.noCollide) {
        const cl = cfg.clearance;
        for (let i = 1; i <= n; i++)
          this.collider(r.points[i], cl ? cl[i - 1] : 0);
      }
    }
  }

  // Push a rope point back out to the body's surface if it has sunk inside it.
  // One radial correction per point per iteration — cheap, and enough, because
  // the solver runs it every iteration and a limb only ever grazes.
  //
  // `clear` is how far OUTSIDE the surface the point must stay — the limb's
  // own half-width there, from cfg.clearance. Zero treats the rope as a bare
  // line, which is all a point with nothing drawn on it needs.
  collideWithBody(p, clear = 0) {
    const local = this.bodyGroup.worldToLocal(_cbLocal.copy(p));
    const len = local.length();
    if (len < 1e-5) return;
    // deformWith() writes into the point it is handed, so the direction is
    // copied out twice — once to deform, once to read the normal from.
    _cbN.copy(local).divideScalar(len);
    const surfaceR =
      this.deformBodyPoint(_cbV.copy(_cbN), _cbN).length() *
        this.cfg.body.size +
      clear;
    if (len < surfaceR) {
      local.multiplyScalar(surfaceR / len);
      p.copy(this.bodyGroup.localToWorld(local));
    }
  }

  // The same, for the skull: the head mesh sits at unit scale in `face`, so
  // its deformed radius along the point's direction IS the surface.
  collideWithHead(p, clear = 0) {
    const local = this.face.worldToLocal(_cbLocal.copy(p));
    const len = local.length();
    if (len < 1e-5) return;
    _cbN.copy(local).divideScalar(len);
    const surfaceR = this.deformPoint(_cbV.copy(_cbN), _cbN).length() + clear;
    if (len < surfaceR) {
      local.multiplyScalar(surfaceR / len);
      p.copy(this.face.localToWorld(local));
    }
  }

  // `ref` is the direction the tip's broad face should look — the outward
  // radial at the anchor. A ball and a cap are both figures of revolution and
  // could not care less, but a leaf is a flat blade, and without a stated roll
  // setFromUnitVectors() picks whatever the shortest arc happens to be: every
  // blade in the ring lands at a different arbitrary angle and the crown reads
  // as debris. Rolled to face outward it reads as a sprout.
  // `ref` is optional because only a flat tip has a roll worth stating. A ball
  // on the end of an arm is a figure of revolution, so the limbs leave it out
  // and take the fallback; the checks below already cope with a `ref` that
  // happens to lie along the stalk.
  // `pts` is which copy of the rope to draw at. It defaults to the solved
  // points, which is what the physics step hands it; carryRopes() hands it a
  // carried copy instead — see there for why the two are not the same thing.
  drawRope(r, cfg, ref = FORWARD, pts = r.points) {
    const n = cfg.segments;
    // Remembered so the carry can bring the roll over with everything else. A
    // ball tip is faceted, so its roll is not a free variable: leaving this at
    // the solve's value while the doll turns under it makes the facets snap.
    // Only when drawing the solved points: a carried draw is handed a ref that
    // has ALREADY been carried, and storing that would carry it again next
    // frame, and again, until the tip has rolled right round.
    if (pts === r.points) (r.ref ??= new THREE.Vector3()).copy(ref);
    for (let i = 0; i < n; i++) {
      const a = pts[i],
        b = pts[i + 1];
      const d = _drD.subVectors(b, a);
      const len = d.length() || 1e-6;
      d.divideScalar(len);
      // A tube steps geometrically so each flat top meets the next flat
      // bottom; a barrel ramps linearly and hides the mismatch in its ends.
      const radius =
        r.stalkGeo ?
          stalkRadius(cfg) * Math.pow(r.step, i)
        : rampRadius(cfg, i, n);
      // The root, the tip's `seat` trick played at the other end. A stalk's
      // base is a flat rim, and the skull curves away under it — by the
      // sagitta, about radius²/2 on a unit head — so a base laid right at the
      // anchor shows its rim on the downhill side and reads as cut off. The
      // first link is drawn from one radius INSIDE the head instead, down its
      // own direction: the rim is under the skin however the stalk leans
      // (radius always covers radius²/2), and what shows is the stalk rising
      // out of the head's own curve. Antennae only — a pointed stalk closes
      // to a point at its base and has no rim to hide, and the limbs anchor
      // into the body's underside where there is nothing to see.
      const root =
        i === 0 && cfg.stalk && !STALKS[cfg.stalk].pointed ? radius : 0;
      // The bead's own width over the ramp — the body's `bead.scale` say,
      // limbs only (the antennae never state one and wear the ramp as-is).
      // Only the segment mesh reads it: the spacers below and the tip ball
      // keep sizing off the bare ramp, so fattening the beads moves nothing
      // strung between them.
      const w = cfg.beadWidth ?? 1;
      r.segs[i].position.copy(a).addScaledVector(d, -root);
      r.segs[i].scale.set(radius * w, radius * w, len + root);
      r.segs[i].quaternion.setFromUnitVectors(FORWARD, d);
    }
    // The spacers, on the ropes that are strung with them (limbs only — the
    // antennae never made any). Each one is threaded on its joint: centered on
    // the interior point, aimed down the chord of its two neighbors so it
    // bisects the bend, and sized off the same ramp the segments read at that
    // joint — the mean of the two radii meeting there, times the preset's say.
    if (r.spacers) {
      for (let i = 1; i < n; i++) {
        const m = r.spacers[i - 1];
        const d = _drD.subVectors(pts[i + 1], pts[i - 1]);
        if (d.lengthSq() > 1e-12) d.normalize();
        else d.copy(FORWARD);
        m.position.copy(pts[i]);
        m.scale.setScalar(
          cfg.spacer.scale *
            ((rampRadius(cfg, i - 1, n) + rampRadius(cfg, i, n)) / 2),
        );
        m.quaternion.setFromUnitVectors(FORWARD, d);
      }
    }
    // Aimed along the LAST segment, so a tip that has drooped comes over with
    // the stalk it is on rather than staying stubbornly upright.
    const last = _drLast.subVectors(pts[n], pts[n - 1]);
    const z = last.lengthSq() > 1e-12 ? last.normalize() : last.copy(FORWARD);
    // Local +Y is the blade normal. Take the part of `ref` square to the
    // stalk; if there isn't one — a dead-center antenna standing straight up,
    // where "outward" has no meaning — any perpendicular will do.
    const y = _drY.copy(ref).addScaledVector(z, -ref.dot(z));
    if (y.lengthSq() < 1e-8) y.crossVectors(z, FORWARD);
    if (y.lengthSq() < 1e-8) y.crossVectors(z, _X_AXIS);
    y.normalize();
    // y cross z, in that order, is the handedness makeBasis wants.
    const x = _drX.crossVectors(y, z);
    const bead = beadRadius(cfg);
    // Seat an anchored tip into the skull: its base is a flat disc laid
    // tangent at the rope point, and the head (radius ~1 in these units)
    // falls away under the rim by the sagitta, about bead²/2 — so `seat`
    // pulls the tip back down its own axis by that much to close the gap.
    // Worked on the unit head and scaled back out, for the same reason
    // hairDirections() reads the bead in head units.
    const hs = cfg.scale ?? 1;
    const hb = bead / hs;
    const sink =
      cfg.seat > 0 ?
        cfg.seat * hs * (1 - Math.sqrt(Math.max(0, 1 - Math.min(1, hb * hb))))
      : 0;
    r.tip.position.copy(pts[n]).addScaledVector(z, tipOffset(cfg) - sink);
    r.tip.quaternion.setFromRotationMatrix(_drM.makeBasis(x, y, z));
    r.tip.scale.set(bead, bead * cfg.tipFlat, bead * cfg.tipAspect);
  }

  // Work the eyelids. Runs at the TOP of step(), before updateMatrixWorld —
  // cheap, and it keeps everything that animates a doll in one place.
  updateBlink(dt) {
    // `phase` negative means the eyes are open and the clock is still running
    // down.
    const b = this.blink;
    if (b.phase >= 0) {
      b.phase += dt / BLINK_TIME;
      if (b.phase >= 1) {
        b.phase = -1;
        // Two in a row now and then, which is most of what makes it read as a
        // creature rather than as a timer.
        b.next = b.rng() < 0.22 ? 0.14 : 0.9 + b.rng() * BLINK_GAP;
      }
    } else if ((b.next -= dt) <= 0) {
      b.phase = 0;
    }
    // One arch of a sine: shut and open again over the blink, and never quite
    // to zero — a lid scaled flat leaves a degenerate mesh and a black speck.
    const lid = b.phase >= 0 ? 1 - 0.94 * Math.sin(Math.PI * b.phase) : 1;
    const size = this.cfg.eyes.size;
    this.leftEye.scale.y = size * lid;
    this.rightEye.scale.y = size * lid;
  }

  step(dt) {
    this.updateBlink(dt);
    this.root.updateMatrixWorld(true);
    // The directions are pure functions of the config, and the config never
    // changes under a built doll — so they are worked out once and reread
    // every step instead of being re-derived sixty times a second.
    const dirs = (this.limbDirs ??= this.limbDirections());
    dirs.arms.forEach((dir, i) => {
      const local = this.deformBodyPoint(
        _stV.copy(dir),
        _stN.copy(dir),
      ).multiplyScalar(this.cfg.body.size * 0.94);
      const pose = this.armPose;
      this.stepRope(
        this.ropes.arms[i],
        this.bodyGroup.localToWorld(local),
        this.cfg.arms,
        dt,

        pose ?
          {
            // The upper arm goes OUT to its own side: the pose's `upper`
            // is for the first arm, and the second mirrors it across the
            // doll's `right`.
            restDir: mirror(_stArm[i], pose.upper, pose.right, i),
            bend: {
              at: pose.elbow,
              dir: mirror(_stArm[2 + i], pose.lower, pose.right, i),
            },
            rigidity: pose.weight,
          }
        : undefined,
      );
      this.drawRope(this.ropes.arms[i], this.cfg.arms);
    });
    dirs.legs.forEach((dir, i) => {
      const local = this.deformBodyPoint(
        _stV.copy(dir),
        _stN.copy(dir),
      ).multiplyScalar(this.cfg.body.size * 0.94);
      const pose = this.legPose;
      this.stepRope(
        this.ropes.legs[i],
        this.bodyGroup.localToWorld(local),
        this.cfg.legs,
        dt,
        pose ?
          {
            // The thigh goes out to its own side the way the arm does:
            // the pose's `upper` is for the first leg, and the second
            // mirrors it across the doll's `right`.
            restDir: mirror(_stLeg[i], pose.upper, pose.right, i),
            bend: {
              at: pose.knee,
              dir: mirror(_stLeg[2 + i], pose.lower, pose.right, i),
            },
            rigidity: pose.weight,
          }
        : undefined,
      );
      this.drawRope(this.ropes.legs[i], this.cfg.legs);
    });
    (this.hairDirs ??= this.hairDirections()).forEach((dir, i) => {
      const r = this.ropes.hair[i];
      if (!r) return;
      const local = this.deformPoint(
        _stV.copy(dir),
        _stN.copy(dir),
      ).multiplyScalar(0.96);
      const anchor = this.face.localToWorld(local);
      const restDir = _stRest
        .copy(dir)
        .transformDirection(this.face.matrixWorld);
      this.stepRope(r, anchor, this.cfg.hair, dt, {
        restDir,
        stiffness: this.cfg.hair.stiffness,
        rigidity: this.cfg.hair.rigidity,
        lean: this.cfg.hair.lean,
        noCollide: true,
      });
      // Outward from the head's own axis, in world space — so the roll follows
      // a spinning doll instead of being pinned to the scene. The center
      // antenna has no outward, and falls back to the way the face looks.
      const up = _stUp.copy(UP).transformDirection(this.face.matrixWorld);
      const ref = _stRef.copy(restDir).addScaledVector(up, -restDir.dot(up));
      if (ref.lengthSq() < 1e-8)
        ref.copy(FORWARD).transformDirection(this.face.matrixWorld);
      this.drawRope(r, this.cfg.hair, ref.normalize());
    });
    // The pose everything above was solved and drawn against.
    this.solveAt.copy(this.root.matrixWorld);
  }

  // ---- carrying the ropes between solves ---------------------------------
  // The ropes are solved on the FIXED clock — see PHYSICS_STEP — and their
  // meshes live in the scene rather than under `root`, so they only move when
  // a solve runs. The doll itself does not wait for that: stepFly() writes
  // root.position and root.quaternion, bob included, every frame, and the grid
  // slides under a pan. So on any machine whose frames are not exactly the
  // physics step — a 120Hz panel is every other frame — the head glides while
  // the antennae hold and catch up, and the first stalk segment is left drawn
  // at an anchor the skull has already walked away from. That is what reads as
  // juddering antennae, and as a stalk that parts from the head at the seam.
  //
  // The fix is not to solve more often: Verlet wants its fixed dt, and that is
  // the whole reason the two clocks exist. It is to DRAW where the doll is
  // NOW. Whatever the body did between solves it did rigidly, so the same
  // transform is applied to the whole rope and it is redrawn there. The solve
  // is untouched and so are its points — what is carried is a copy, so no
  // float drift is ever fed back into the physics.
  //
  // What this does NOT do is invent physics: an antenna carried this way swings
  // exactly as much as its last solve said, which is right, because the doll
  // has not been anywhere between solves that it did not go rigidly.
  carryRopes() {
    this.root.updateMatrixWorld(true);
    // Nothing has moved since the solve. This is every doll on a still grid,
    // every frame, and it is the whole cost of the pass for them.
    if (this.root.matrixWorld.equals(this.solveAt)) return;
    // now * inverse(then) — the rigid move the body made between the two.
    _carryM.copy(this.solveAt).invert().premultiply(this.root.matrixWorld);
    this.carryGroup(this.ropes.arms, this.cfg.arms);
    this.carryGroup(this.ropes.legs, this.cfg.legs);
    this.carryGroup(this.ropes.hair, this.cfg.hair);
  }

  carryGroup(ropes, cfg) {
    for (const r of ropes) {
      // A rope that has never been solved has no points and nothing to carry —
      // the first physics step of its life is what fills it in.
      if (!r || !r.points.length || !r.ref) continue;
      const pts = (r.carried ??= []);
      for (let i = 0; i < r.points.length; i++)
        (pts[i] ??= new THREE.Vector3())
          .copy(r.points[i])
          .applyMatrix4(_carryM);
      // The roll goes with it. A tip is faceted — a jittered ball especially —
      // so leaving its reference axis at the solve's value while the doll
      // turns underneath makes the facets snap round at 60Hz.
      this.drawRope(
        r,
        cfg,
        _carryRef.copy(r.ref).transformDirection(_carryM),
        pts,
      );
    }
  }

  // The limb half of the reach. Arms and legs are rope segments living in the
  // scene rather than under root, so a Box3 over the doll would miss them and
  // this has to be derived from the config. Like the antennae, it is the
  // STANDING bound — the anchor plus the limb's own width — rather than where
  // the solver happens to have swung it this frame, which would make the row
  // spacing breathe.
  limbReach() {
    const dirs = this.limbDirections();
    const reach = (dir, cfg) =>
      Math.abs(
        this.deformBodyPoint(dir.clone(), dir.clone()).x *
          this.cfg.body.size *
          0.94,
      ) + Math.max(cfg.radius, cfg.ballSize);
    return Math.max(
      reach(dirs.arms[0], this.cfg.arms),
      reach(dirs.legs[0], this.cfg.legs),
    );
  }

  // How far a deformed unit sphere reaches sideways. Sampling a ladder of
  // latitudes rather than just the equator matters now that presets exist — a
  // pear is widest well below it and an acorn well above, and reading the
  // equator alone parks those two too close to their neighbors.
  //
  // Shared by the skull and the body, because with the body dealt out of the
  // same preset table there is only one kind of shape to measure.
  shapeHalfWidth(deformer) {
    let out = 0;
    for (let i = 0; i <= 24; i++) {
      const y = -1 + (2 * i) / 24;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const p = new THREE.Vector3(r, y, 0).normalize();
      out = Math.max(out, Math.abs(deformer(p.clone(), p).x));
    }
    return out;
  }

  // The head's own reach: the widest point of the skull, or an ear if one
  // stands proud of it. The nose points down +z, so it never enters this.
  halfWidth() {
    const skull = this.shapeHalfWidth((v, n) => this.deformPoint(v, n));
    const ears = this.cfg.ears;
    const earHalf =
      ears.size > 0.001 ? Math.abs(this.rightEar.position.x) + ears.size : 0;
    return Math.max(skull, earHalf);
  }

  // The body's, at its own scale.
  bodyHalfWidth() {
    return (
      this.shapeHalfWidth((v, n) => this.deformBodyPoint(v, n)) *
      this.cfg.body.size
    );
  }

  // Every extent the layout needs, in one place, in the doll's own local space
  // — y = 0 is the height the doll sits at in the grid. Row spacing, column
  // spacing, the shadow and the hit proxy all read this rather than each
  // working the numbers out again, which is how the crown and the chin used to
  // get computed twice with two different answers.
  //
  // The antennae are why this can't just be a Box3 over the group. They are
  // rope meshes living in the SCENE rather than under root, and they are
  // simulated — at build time, which is exactly when the grid gets spaced,
  // there is nothing on screen to measure. So their reach comes off the config
  // the same way the skull's does.
  //
  // That reach is the STANDING bound: the anchor plus a full length along the
  // rest direction. A floppy antenna falls short of it and just leaves a
  // little extra air; a stiff one sits exactly there, and under-guessing that
  // one puts its tip through the row above.
  metrics() {
    const up = new THREE.Vector3(0, 1, 0),
      down = new THREE.Vector3(0, -1, 0);
    const hOff = this.face.position.y;
    const skullTop = hOff + this.deformPoint(up.clone(), up.clone()).y;
    // The underside of the skull, where the neck starts: everything below
    // it is body and legs. Afloat, the water comes up to here.
    const neck = hOff + this.deformPoint(down.clone(), down.clone()).y;
    const chin = this.floorY();

    const h = this.cfg.hair;
    // How far the tip reaches past the end of the stalk, and how far it sticks
    // out sideways. A ball straddles the last rope point, so it only ever adds
    // its own radius; a leaf or a cap is anchored there and grows the full
    // `tipAspect` beyond it. Get this wrong and the row spacing is measured
    // against a bead while a leaf spears the doll above.
    const bead = beadRadius(h);
    const along =
      tipOffset(h) +
      bead * (TIPS[h.tip].anchored ? Math.max(1, h.tipAspect) : 1);
    const across = bead;
    let crownTop = skullTop;
    let antennaHalf = 0;
    for (const dir of this.hairDirections()) {
      const tip = this.deformPoint(dir.clone(), dir.clone())
        .multiplyScalar(0.96)
        .addScaledVector(dir, h.length);
      crownTop = Math.max(crownTop, hOff + tip.y + along);
      antennaHalf = Math.max(
        antennaHalf,
        Math.hypot(tip.x, tip.z) + Math.max(stalkRadius(h), across),
      );
    }

    const skullHalf = this.halfWidth();
    const bodyHalf = this.bodyHalfWidth();
    // Arms swing wider than the body they hang off, so they belong in the
    // SKULL half as well as the full one — that is the number the shadow is
    // laid out from, and a shadow narrower than the doll standing on it reads
    // as the figure floating off its own puddle.
    const limbHalf = this.limbReach();
    return {
      skullTop, // crown of the skull itself
      crownTop, // tip of the tallest antenna
      neck, // the underside of the skull — the body hangs below this
      chin, // the bottom — what the figure stands on
      // The underside of the BODY, ignoring the legs. `chin` is whichever of
      // the two hangs lower and that is nearly always the leg tips, which are
      // rope: fine for holding a flier off the ground, wrong for anything the
      // doll actually sits on. The trampoline lands on this one.
      seat: this.seatY(),
      // How wide the body alone is. `skullHalf` below folds in the arms, which
      // are rope and swing — for asking whether a doll is over the mat it is
      // the solid middle of it that should answer.
      bodyHalf,
      // Skull, ears and body: everything under root that is not an antenna.
      // The shadow is scaled off this, so a wide body gets a wide shadow while
      // a splayed set of antennae still does not.
      skullHalf: Math.max(skullHalf, bodyHalf, limbHalf),
      halfWidth: Math.max(skullHalf, bodyHalf, limbHalf, antennaHalf),
      skullHeight: skullTop - chin,
      height: crownTop - chin,
    };
  }

  // The bottom of the figure — what it stands on, and what the shadow is laid
  // under. The body hangs below the head, and the legs hang below the body, so
  // this reads all three.
  //
  // The legs are taken at their STANDING length, the same bound the antennae
  // use and for the same reason: they are solved in world space a frame at a
  // time, and spacing a row off wherever they happened to swing would make the
  // grid twitch. A leg that has kicked out to the side falls short of it and
  // just leaves a little air under the doll.
  floorY() {
    const down = new THREE.Vector3(0, -1, 0);
    const bodyFloor =
      this.bodyGroup.position.y +
      this.deformBodyPoint(down.clone(), down.clone()).y * this.cfg.body.size;
    const l = this.cfg.legs;
    const anchor = this.limbDirections().legs[0];
    const hang =
      this.bodyGroup.position.y +
      this.deformBodyPoint(anchor.clone(), anchor.clone()).y *
        this.cfg.body.size *
        0.94 -
      l.length -
      // On a bead leg the foot rests ON the last bead rather than straddling
      // the rope's end, so it hangs one tipOffset lower — same law drawRope
      // places it by.
      tipOffset(l) -
      l.ballSize;
    return Math.min(bodyFloor, hang);
  }

  // The underside of the BODY alone — what a doll rests on when it sits.
  // floorY() reads lower, to the standing reach of the legs; a seated doll's
  // legs dangle past its perch instead of holding it up.
  seatY() {
    const down = new THREE.Vector3(0, -1, 0);
    return (
      this.bodyGroup.position.y +
      this.deformBodyPoint(down.clone(), down.clone()).y * this.cfg.body.size
    );
  }

  dispose() {
    this.root.removeFromParent();
    // Rope meshes live in their own top-level group, not under root.
    this.ropeGroup.removeFromParent();
    for (const m of Object.values(this.mats)) m.dispose();
    this.stalkGeo?.dispose();
    this.tipGeo?.dispose();
    // Cut per doll for its preset's tube ratio, shared by every spacer on it.
    this.spacerGeo.dispose();
    this.headGeo.dispose();
    // Cut fresh per doll for its own pointiness/extrusion — see G.ear — and
    // shared by both ears, so it is disposed once, here. It was never
    // disposed at all before, which leaked one extruded flap per doll per
    // reroll for as long as the tab lived.
    this.leftEar.geometry.dispose();
    this.noseMesh.geometry.dispose();
    this.mouthMesh.geometry.dispose();
    this.bodyGeo.dispose();
    this.neckMesh.geometry.dispose();
  }
}

export {
  Doll,
  randomConfig,
  compatibleTextures,
  compatibleHairs,
  compatibleLimbs,
};
