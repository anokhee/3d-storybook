// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { COLOR_PALETTE } from "./palette.js";
import { clayLumps } from "./clay.js";

// ---------- the blob: the character that plays the instruments ----------
// Loaded after palette.js and materials.js, before script.js. A squashy round body with eyes, a mouth and two
// caterpillar antennae, sitting at the center of the bars' arc, and eight noodle arms that reach out of its
// flanks to strike the bars with mallets (or with their bare tentacle tips, on the piano). It breathes, squishes
// on every hit and turns to face wherever the notes have been lately. Its skin is thumbed plasticine, the
// same stock as the dollies (see `shape.lumps` and `clay`); the rest of it is toon shaded and inked like
// everything else. It blinks, and its mouth hangs open until, while it plays, it now and then smiles, concentrates (tongue
// out, eyes narrowed) or goes "ooh". It keeps a fairly straight face, and has no mouth at all when it isn't
// playing. Some instruments dress it up: sunglasses, a clown nose, headphones, stars on its antennae, or party
// hats or toadstools in place of them (or no antennae at all). Its colors live in palette.js (skin, eyeWhite,
// pupil, tongue, sunglassLens, sunglassFrame, clownNose, headphones, headphonePad, headphoneLight, starBauble,
// blobHats, blobPompom, mushroomCap, mushroomSpots, mushroomStem, mushroomGills, antenna, antennaTip, mallets).
const BLOB = {
  r: 1.9, // radius of the body, before its squash
  // the body's shape: a dolly's head, set down on the ground, made the way the dollies' game makes one
  // (3d-storybook src/parts/head.js deformBase, and its heads in src/presets/model/head.js). A ball of radius
  // `r` is split at a latitude (`split`, -1 underneath to 1 at the crown, eased over `feather` of that) into a
  // top and a bottom; each is `balloon`ed out along its own normal (in, when negative) and `pull`ed away from
  // the middle along the axis (up for the top, down for the bottom; in, when negative), and a `point`ed end
  // is pinched toward its pole. All in units of `r`. `heads` are the dolls' own heads at the middle of their
  // dials; `head` picks one. `base` is the dolls' chin cut, used to sit it on the ground: the bottom is cut
  // off flat `cut` up from its lowest point, rounded over `soft` of that, and pulled in by `tuck` toward the
  // cut so it meets the ground in a tucked-under jaw rather than a flared rim. `lumps` is the dollies' thumbed
  // clay (clay.js), pushed in and out of the skin all over as a share of `r` (their "bumpiness" texture at
  // the middle of its dial); `wobble` pushes the whole body in and out by up to that much of itself besides,
  // so it is never quite symmetrical. `rest` is how it is squashed when it sits still, [across, up, forward]:
  // a dolly's head is not
  shape: {
    head: "tomato",
    heads: {
      tomato: { split: 0.42, feather: 1.4, top: { balloon: 0.2, pull: -0.08 }, bottom: { balloon: 0.2, pull: -0.08 } },
      pear: { split: 0.42, feather: 0.5, top: { balloon: -0.5, pull: 1 }, bottom: { balloon: 0.5, pull: -0.06 } },
      acorn: { split: 0.22, feather: 1, top: { balloon: 0.25, pull: -0.21 }, bottom: { balloon: -0.1, pull: 0.42, point: true } },
      squash: { split: 0, feather: 1.45, top: { balloon: -0.17, pull: 0.45 }, bottom: { balloon: 0.17, pull: 0.11 } },
      eggplant: { split: -0.2, feather: 1.05, top: { balloon: -0.5, pull: 0.01 }, bottom: { balloon: -0.02, pull: 0.19 } },
      grape: { split: -0.29, feather: 1, top: { balloon: -0.3, pull: -0.06 }, bottom: { balloon: -0.35, pull: 0.29 } },
    },
    base: { cut: 0.22, soft: 1, tuck: 0.35 },
    lumps: { amplitude: 0.026, frequency: 6.5, roughness: 0.1, octaves: 2, warp: 1.6, seed: 3 },
    wobble: 0.02,
    rest: [1, 1, 1],
  },
  arm: {
    r: 0.19, // radius of an arm tube where it leaves the body, before the taper
    linger: 1.8, // seconds an arm stays out after its last note before it is sucked back in
    // the arms' idle drift while they are out: how far the elbow sways out and up (world units), and how fast
    sway: { out: 0.05, up: 0.04, rate: 1.1 },
  },
  mallet: { stick: 3.3, head: 0.36 }, // length of the stick and radius of the head
  blink: { every: [2.5, 6], close: 0.06, open: 0.1, double: 0.2 }, // seconds between blinks, to shut and to reopen; chance of a second one straight after
  // its faces ("none" when not playing, "open" while playing, the rest now and then while playing): the mouth,
  // how open the eyes are (1 = as built), where the pupils drift (up +), and how often it picks each. It holds one for `hold` seconds, then goes back to "open" for `rest` seconds
  faces: {
    none: { eyes: 0.8, look: 0, weight: 0 }, // not playing: a small closed smile
    open: { eyes: 0.8, look: -0.03, weight: 0 }, // playing, between the others: deadpan, eyes a little lidded
    smile: { eyes: 0.65, look: 0, weight: 0.1 }, // rarely, and only a small one
    focused: { eyes: 0.5, look: -0.1, weight: 0.6 }, // tongue poking out of the corner, eyes on the bars
    ooh: { eyes: 0.95, look: 0, weight: 0.3 },
  },
  hold: [0.8, 2],
  rest: [1.2, 3.5],
  // the nucleus inside: its radius and where its middle is, [across, up, forward], both in units of `r`
  // before the squash (the head is about 1 round its middle)
  // the eyes, the dollies' (see buildBlob): `r` each one's radius, `protrude` how far its dome stands out of
  // the face (1 a half ball, less flatter), `apart` and `up` where the pair sits on the face (across and up,
  // as a direction before the squash)
  // `shines` are the kawaii dots on each: [size as a part of `r`, how far up the dome from its rim (radians,
  // pi/2 the top), and which way round from the right (radians, pi/2 up)], a big one up and to the left and a
  // small one down and to the right; `shineOpacity` how much they show (their color is colors.eyeShine)
  eyes: {
    r: 0.24,
    protrude: 0.75,
    apart: 0.4,
    up: 0.3,
    shines: [[0.3, 1.1, 2.4], [0.14, 1.15, -0.75]],
    shineOpacity: 0.75,
    // while it smiles: each shine a four-point sparkle `size` times the dot's, its points pinched in to `waist`
    // of that between them, turning `spin` radians a second
    sparkle: { size: 1.9, waist: 0.32, spin: 1.2 },
  },
  // the dolly nose (see buildBlob): `radius` across and `length` out from the face (world units), how full it
  // holds before rounding off (`bulbosity`, 0 to 1) and how pinched its tip (`scrunch`, 1 none), where it sits
  // (`up`, as a direction before the squash, between the eyes' and the mouth's) and how far it is sunk in
  dollyNose: { radius: 0.24, length: 0.42, bulbosity: 0.75, scrunch: 0.6, up: 0.2, sink: 0.06 },
  // which eyes it has: "statue", the albatross statues' sculpted almonds, or "dolly", a dolly's painted domes
  // (both placed by `eyes` below, and both wear its shines)
  eyeStyle: "statue",
  // the statue eyes (see buildBlob): `scale` from the statue's head to this face, then `width` and `height` as
  // the statues' head lab has them (the stock head's are 1 and 0.85; taller here, so the shines fit), and
  // `bulge` how far the pupil bump stands out (the statues' EYE_BULGE)
  statueEyes: { scale: 2.2, width: 1, height: 1.3, bulge: 2 },
  // which mouth it wears: "statue", the albatross statues' sculpted lips, or "dolly", a dolly's painted bar
  mouthStyle: "statue",
  // the statue mouth (see buildBlob): `scale` from the statue's head to this face, `y` the lip line up from where
  // the mouth sits (world units), `width` how much wider than the statue's it is, every face; and for each face its knobs as the statues' head lab has them: `width`,
  // `upperLip` and `lowerLip` heights, `fullness` how far the lips stand off the face, all 1 as the stock head
  // has them, and `shift` off to one side (world units)
  statueMouth: { scale: 1.4, width: 1.45, y: -0.06 },
  statueMouths: {
    none: {},
    open: { lowerLip: 1.15 },
    smile: { width: 1.2, upperLip: 0.85 },
    focused: { width: 0.8, fullness: 1.15, shift: 0.1 },
    ooh: { width: 0.65, upperLip: 1.2, lowerLip: 1.3, fullness: 1.3 },
  },
  // the mouth for each face, a dolly's (see buildBlob): `width` and `height` (world units), `bow` (up a smile,
  // down a frown), `taper` (under 1, fuller below), `shift` it off to one side
  mouths: {
    none: { width: 0.42, height: 0.1, bow: 0.22 }, // not playing: a small soft smile
    open: { width: 0.48, height: 0.12, bow: 0.04 }, // playing: near straight
    smile: { width: 0.6, height: 0.13, bow: 0.42, taper: 0.85 }, // rarely: a fuller smile (the eyes sparkle)
    focused: { width: 0.32, height: 0.1, bow: -0.12, shift: 0.1 }, // pressed off to one side, turned down a touch
    ooh: { width: 0.2, height: 0.2, bow: 0 }, // a little o
  },
  // the dolly cheeks (see buildBlob): `size` across (world units), `bulge` how far they stand out as a part of
  // that, and `dir` where the right one sits as a direction before the squash (the left is its mirror): further
  // round than the eyes, down level with the nose. Their color is colors.cheek
  cheeks: { size: 0.3, bulge: 0.45, dir: [0.66, 0.08, 0.75] },
  // the nucleus's feet: radius, how flat and how long that makes them, how far apart their middles are and
  // how far forward of the nucleus's middle (world units), and how far their toes turn out (radians)
  feet: { r: 0.3, flat: 0.55, long: 1.4, apart: 0.5, forward: 0.8, turn: 0.3 },
  nucleus: { r: 0.92, at: [0, -0.04, 0] }, // as big as fits, a little inside the head all round
  // the glow round it: `size` how far the halo reaches (1.1 is a tenth of the body past its skin), `strength`
  // how bright, `falloff` how fast it fades out from the skin (higher is a tighter glow). Its color is
  // colors.glow
  glow: { show: false, size: 1.1, strength: 0.6, falloff: 2.5 }, // off for now: `show` true brings it back
  // the skin, body and arms alike: plasticine, the dollies' finish (3d-storybook src/world/finish.js, FINISH):
  // a mostly rough body with a faint, blurred coat of wax over it, and no sharp shine, which would read as
  // plastic. `roughness` is how blurred the light on it is (0 a mirror), `clearcoat` the coat and
  // `clearcoatRoughness` how blurred that is; keep those three the dolls'. `opacity` under 1 makes it
  // see-through jelly again (and shows the nucleus). `envMapIntensity` is how much of the page's soft
  // surroundings it takes in (main.js gives the scene a room for it; the toon materials around it read none):
  // a fill from all round that lifts its shaded side, so the sun does not cut it hard in two. The dolls take
  // all of theirs, under the storybook's rig; here, with a stronger sun, less
  clay: { opacity: 1, roughness: 0.6, clearcoat: 0.18, clearcoatRoughness: 0.35, envMapIntensity: 0.45 },
  // the shimmer that was over the jelly (its colors are B.colors.shimmer), off: clay has no film on it. `show`
  // true brings it back: `amount` how much it takes the skin over, at its edges (a little of it everywhere);
  // `edge` how tight to the outline it rings (higher is a thinner ring); `bands` how many times it runs through
  // the colors from the middle out to the edge; `glow` how much it lights itself, so it stays pastel in the shade
  shimmer: { show: false, amount: 0.3, edge: 1.4, bands: 1.3, glow: 0.12 },
  colors: {
    skin: COLOR_PALETTE.skin,
    nucleus: COLOR_PALETTE.nucleus,
    shimmer: COLOR_PALETTE.shimmer,
    glow: COLOR_PALETTE.blobGlow,
    eyeWhite: COLOR_PALETTE.eyeWhite,
    eyePaint: COLOR_PALETTE.eyePaint,
    eyeShine: COLOR_PALETTE.eyeShine,
    cheek: COLOR_PALETTE.blobCheek,
    pupil: COLOR_PALETTE.pupil,
    tongue: COLOR_PALETTE.tongue,
    lens: COLOR_PALETTE.sunglassLens,
    frame: COLOR_PALETTE.sunglassFrame,
    nose: COLOR_PALETTE.clownNose,
    phones: COLOR_PALETTE.headphones,
    phonePad: COLOR_PALETTE.headphonePad,
    phoneLight: COLOR_PALETTE.headphoneLight,
    star: COLOR_PALETTE.starBauble,
    hats: COLOR_PALETTE.blobHats, // left, right
    capRed: COLOR_PALETTE.mushroomCap, // the toadstools'
    capSpots: COLOR_PALETTE.mushroomSpots,
    capStem: COLOR_PALETTE.mushroomStem,
    capGills: COLOR_PALETTE.mushroomGills,
    pompom: COLOR_PALETTE.blobPompom,
    antenna: COLOR_PALETTE.antenna,
    antennaTip: COLOR_PALETTE.antennaTip,
    mallets: COLOR_PALETTE.mallets, // in order: left, right, then extras 1-6
  },
};

// builds the character into `scene`, sitting on the ground at (x, z): the center of the bars' arc, so every bar
// is within reach. `toonMat`, `inked` and `outlineMat` come from script.js; `wood` is the material for the mallet
// sticks. `bars` are the playable bars (each with userData.hit, where a mallet lands, and .angle, its direction
// from the character) and `barT` their thickness. Returns:
//   creature: the group holding the body, so it can be moved
//   play(bar): swing a free arm at this bar (the sound and the bar's bounce are script.js's business)
//   setInstrument(mallets, y, { sunglasses, clownNose, headphones, antennae }): whether the arms hold mallets
//     or play bare, the height the character sits at, whether it wears sunglasses, a clown nose and headphones,
//     and what grows where its antennae are: "antennae", "stars" (star-tipped antennae), "hats" (party hats),
//     "mushrooms" (toadstools) or "none"
//   holdArms(n): n arms out and held, raised over their home bars, for looking at it (the storybook)
//   animate(now, dt): advance the arms, the breathing and the facing by one frame (now in milliseconds, as
//     performance.now() gives it)
function buildBlob(scene, { toonMat, inked, outlineMat, wood }, x, z, { bars, barT }) {
  const B = BLOB;
  const BLOB_R = B.r;
  // ---------- mallets (origin at the handle end, so they pivot from the hand) ----------
  const STICK = B.mallet.stick,
    HEAD_R = B.mallet.head;
  const skin = new THREE.MeshPhysicalMaterial({ color: B.colors.skin, metalness: 0, transparent: B.clay.opacity < 1, ...B.clay });
  // the shimmer, when it is on: the skin's color run round B.colors.shimmer by how far it turns from the eye,
  // so it rings through the colors toward its edges and they slide over it as it is looked at from round
  // about; a little of it glows besides, so the pastels stay bright in the shade. See B.shimmer
  if (B.shimmer.show) {
    const S = B.shimmer,
      [c0, c1, c2] = B.colors.shimmer.map((c) => new THREE.Color(c));
    skin.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, {
        uShimA: { value: c0 },
        uShimB: { value: c1 },
        uShimC: { value: c2 },
        uShim: { value: new THREE.Vector4(S.amount, S.edge, S.bands, S.glow) },
      });
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "varying float vShimY;\n#include <common>")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvShimY = position.y;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `uniform vec3 uShimA, uShimB, uShimC;
          uniform vec4 uShim; // amount, edge, bands, glow
          varying float vShimY;
          vec3 shimmerAt(float t) {
            t = fract(t) * 3.0;
            return t < 1.0 ? mix(uShimA, uShimB, t) : t < 2.0 ? mix(uShimB, uShimC, t - 1.0) : mix(uShimC, uShimA, t - 2.0);
          }
          #include <common>`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          {
            float facing = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
            float rim = pow(1.0 - facing, uShim.y);
            vec3 shim = shimmerAt(rim * uShim.z + vShimY * 0.08);
            diffuseColor.rgb = mix(diffuseColor.rgb, shim, uShim.x * (0.3 + 0.7 * rim));
            totalEmissiveRadiance += shim * uShim.w * (0.4 + 0.6 * rim);
          }`,
        );
    };
    skin.customProgramCacheKey = () => "blob-shimmer";
  }
  function mallet(color) {
    const g = new THREE.Group();
    const stick = inked(
      new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, STICK, 16), wood),
    );
    stick.rotation.z = Math.PI / 2;
    stick.position.x = STICK / 2;
    const head = inked(
      new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 32, 24), toonMat(color)),
    );
    head.position.x = STICK;
    // the hand: the tentacle's tip coils around the handle, plus a small knuckle at the origin that hides the
    // join with the arm tube (which ends here)
    const hand = inked(new THREE.Mesh(tentacleGrip(), skin));
    const knuckle = inked(
      new THREE.Mesh(new THREE.SphereGeometry(ARM_R * TAPER_TIP, 16, 12), skin),
    );
    g.add(stick, head, hand, knuckle);
    g.userData.mallet = [stick, head, hand]; // hidden on the piano, where the tentacle's tip plays the keys itself
    return g;
  }

  // ---------- the body ----------
  const creature = new THREE.Group();
  creature.name = "blob";
  creature.position.set(x, 0, z);
  scene.add(creature);

  // where the body's skin is along unit direction `d`, before its squash/stretch and in units of BLOB_R: the
  // dollies' head deformer (see B.shape). The ball's point at `d` is ballooned, pinched and pulled, top and
  // bottom blended across the split; then thumbed with the dollies' clay lumps and wobbled, pushed out along
  // `d` (the dolls push theirs out along the deformed surface's own normal; these heads are gentle enough
  // for `d` to serve), scaled down where the balloon or the pinch has thinned the body, as theirs are; and
  // last the base cut, after the lumps so they do not poke back through it. The face, antennae and headphones
  // are placed with it too, so they ride the lumps as a doll's features do
  const { wobble: WOBBLE, lumps: LUMPS, rest: REST } = B.shape,
    HEAD = B.shape.heads[B.shape.head];
  // the silhouette alone: `out` (a copy of `d`) ballooned, pinched and pulled. Returns how much thinner that
  // left the body there, 0 to 1, for the lumps
  function deformBase(d, out) {
    const tw = THREE.MathUtils.smoothstep(d.y, HEAD.split - HEAD.feather / 2, HEAD.split + HEAD.feather / 2),
      bw = 1 - tw,
      balloon = HEAD.top.balloon * tw + HEAD.bottom.balloon * bw;
    out.addScaledVector(d, balloon);
    // a pointed end: the ring radius runs (1 - y^2)^(point/2) instead of a sphere's (1 - y^2)^0.5, so it meets
    // the pole in a cone (point 1) rather than a dome; faded out toward the equator by y^2
    const point = Math.max(0, (HEAD.top.point ? 1 : 0) * tw + (HEAD.bottom.point ? 1 : 0) * bw);
    let squeeze = 1;
    if (point > 0) {
      const y2 = d.y * d.y;
      squeeze = Math.pow(Math.max(0, 1 - y2), (point * y2) / 2);
      out.x *= squeeze;
      out.z *= squeeze;
    }
    out.y += HEAD.top.pull * tw - HEAD.bottom.pull * bw;
    return Math.min(1, Math.max(0, 1 + balloon) * squeeze);
  }
  // a floor for y that rounds over instead of creasing: untouched above `floor + r`, eased down onto the floor
  // below (never quite touching it)
  const softFloor = (y, floor, r) => (y - floor >= r ? y : floor + r * Math.exp((y - floor) / r - 1));
  // the base cut, as a height: `cut` up from where the bottom pole lands
  const CUT = (() => {
    const down = new THREE.Vector3(0, -1, 0),
      pole = down.clone(),
      soft = B.shape.base.cut * B.shape.base.soft;
    deformBase(down, pole);
    const poleY = pole.y;
    return { y: poleY + B.shape.base.cut, soft, start: poleY + B.shape.base.cut + soft, tuck: B.shape.base.tuck };
  })();
  function bodyPoint(d, out = new THREE.Vector3()) {
    const thin = deformBase(d, out.copy(d)),
      lump = clayLumps(LUMPS, d.x, d.y, d.z) * thin + WOBBLE * Math.sin(2.1 * d.x + 0.7) * Math.sin(1.7 * d.y + 2.3) * Math.sin(2.6 * d.z + 1.1);
    out.addScaledVector(d, lump);
    if (out.y < CUT.start) {
      // the tuck: the ring pulled in through the round-over, nothing at its top and `tuck` at the cut, read
      // off the height before the floor, which still knows how far under the cut this point wanted to go
      const t = Math.min(1, (CUT.start - out.y) / (2 * CUT.soft)),
        k = 1 - CUT.tuck * t * t * (3 - 2 * t);
      out.x *= k;
      out.z *= k;
      out.y = softFloor(out.y, CUT.y, CUT.soft);
    }
    return out;
  }
  // where the body sits so its base is on the ground, with the body at rest: its lowest point is under its
  // bottom pole, where the floor leaves it
  const REST_Y = -bodyPoint(new THREE.Vector3(0, -1, 0)).y * BLOB_R * REST[1];
  const bodyGeo = (() => {
    const g = new THREE.SphereGeometry(BLOB_R, 64, 64); // fine enough to round the base's tuck and the lumps
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    const p = g.attributes.position,
      v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      bodyPoint(v.fromBufferAttribute(p, i).normalize(), v).multiplyScalar(BLOB_R);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    const welded = mergeVertices(g); // one skin across the sphere's seam, so it shades smooth
    welded.computeVertexNormals();
    return welded;
  })();
  const body = inked(new THREE.Mesh(bodyGeo, skin));
  body.position.y = REST_Y;
  body.scale.fromArray(REST);
  creature.add(body);
  // the glow: a soft halo just round the body, its own shape blown up by `size`, brightest against the body
  // and fading out to nothing at its edge. Drawn after the body so the body hides its middle, and added onto
  // what is behind it, so it only ever lightens. On the body, so it squishes and breathes with it
  if (B.glow.show) {
    const G = B.glow,
      halo = new THREE.Mesh(
        bodyGeo,
        new THREE.ShaderMaterial({
          uniforms: { color: { value: new THREE.Color(B.colors.glow) }, strength: { value: G.strength }, falloff: { value: G.falloff } },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            uniform vec3 color;
            uniform float strength, falloff;
            varying vec3 vNormal;
            void main() {
              // the halo's far side, seen from in front: square on behind the body's edge, edge-on at its own rim,
              // so this is 1 against the body and 0 where the halo ends
              float t = clamp(-vNormal.z / 0.45, 0.0, 1.0);
              float k = strength * pow(t, falloff);
              gl_FragColor = vec4(color * k, k);
            }`,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
    halo.scale.setScalar(G.size);
    halo.renderOrder = 1;
    body.add(halo);
  }
  // the nucleus: a solid ball in the middle of the head, seen through the jelly. On the body, so it squishes
  // and breathes with it
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(B.nucleus.r * BLOB_R, 40, 28), toonMat(B.colors.nucleus));
  nucleus.position.fromArray(B.nucleus.at).multiplyScalar(BLOB_R);
  nucleus.castShadow = true;
  body.add(nucleus);
  // two tiny feet on the nucleus, under the front of it, toes turned out a little: the nucleus stands on them
  // in the base, seen through the jelly. They are the nucleus's, so they squish and breathe with it; at rest
  // their soles are on the ground
  {
    const F = B.feet,
      nucleusY = B.nucleus.at[1] * BLOB_R,
      sole = -REST_Y / REST[1] - nucleusY; // the ground, in the nucleus's frame, with the body at rest
    [-1, 1].forEach((side) => {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(F.r, 24, 16), toonMat(B.colors.nucleus));
      foot.scale.set(1, F.flat, F.long);
      foot.position.set(side * F.apart, sole + F.r * F.flat, F.forward);
      foot.rotation.y = side * F.turn;
      foot.castShadow = true;
      nucleus.add(foot);
    });
  }
  // what grows from the top of the head, by kind: each a pair, one each side. setInstrument shows one kind
  const toppers = { antennae: [], stars: [], hats: [], mushrooms: [] };
  // caterpillar antennae: two stalks from the top of the head, leaning outward, with balls on the ends. Some
  // instruments swap the balls for puffy gold stars, or the whole antennae for two party hats like the
  // jack-in-the-boxes' (a cone with a pompom on top) or two little toadstools. They ride on the body so they squish and breathe with it
  {
    const stalkMat = toonMat(B.colors.antenna),
      tipMat = toonMat(B.colors.antennaTip),
      pompomMat = toonMat(B.colors.pompom),
      capMat = toonMat(B.colors.capRed),
      stemMat = toonMat(B.colors.capStem),
      gillMat = toonMat(B.colors.capGills),
      spotMat = toonMat(B.colors.capSpots),
      spotGeo = new THREE.SphereGeometry(0.12, 10, 6).scale(1, 0.35, 1),
      up = new THREE.Vector3(0, 1, 0),
      HAT_R = 0.42,
      HAT_H = 1.7,
      starMat = toonMat(B.colors.star);
    // a puffy five-pointed star, facing forward, for the star-tipped antennae
    const starShape = new THREE.Shape();
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI / 2 + (i / 10) * Math.PI * 2,
        r = i % 2 ? 0.14 : 0.33;
      i ? starShape.lineTo(r * Math.cos(a), r * Math.sin(a)) : starShape.moveTo(r * Math.cos(a), r * Math.sin(a));
    }
    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.06,
      bevelSegments: 3,
    }).center();
    [-1, 1].forEach((sx, i) => {
      const base = bodyPoint(new THREE.Vector3(sx * 0.3, 0.95, 0.1).normalize()).multiplyScalar(BLOB_R),
        dir = new THREE.Vector3(sx * 0.45, 1, 0.1).normalize(),
        len = 1.2;
      const stalk = inked(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.06, len, 10),
          stalkMat,
        ),
      );
      stalk.position.copy(base).addScaledVector(dir, len / 2);
      stalk.quaternion.setFromUnitVectors(up, dir);
      const tip = inked(
        new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), tipMat),
      );
      tip.position.copy(base).addScaledVector(dir, len + 0.12);
      const antenna = new THREE.Group().add(stalk, tip);
      toppers.antennae.push(antenna);
      // the star-tipped antenna: the same stalk with a star on the end, tipped outward with it
      const starred = new THREE.Group(),
        star = inked(new THREE.Mesh(starGeo, starMat));
      star.position.copy(base).addScaledVector(dir, len + 0.12); // the stalk runs just into its bottom notch
      star.rotation.z = -sx * 0.3;
      star.userData = { spin: Math.random() * Math.PI * 2, lean: star.rotation.z };
      starred.add(stalk.clone(), star);
      starred.userData.star = star;
      starred.visible = false;
      toppers.stars.push(starred);
      // the hat: its brim sunk a little into the head where the antenna grows from, pointing the way it leaned
      const hat = new THREE.Group(),
        cone = inked(new THREE.Mesh(new THREE.ConeGeometry(HAT_R, HAT_H, 20), toonMat(B.colors.hats[i]))),
        pompom = inked(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), pompomMat));
      cone.position.y = HAT_H / 2;
      pompom.position.y = HAT_H + 0.04;
      hat.add(cone, pompom);
      hat.position.copy(base).addScaledVector(dir, -0.12);
      hat.quaternion.setFromUnitVectors(up, dir);
      toppers.hats.push(hat);
      // the toadstool: a stem sunk a little into the head, and a red domed cap with white spots and gills
      const shroom = new THREE.Group(),
        stem = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0, 12).translate(0, 0.5, 0), stemMat)),
        cap = new THREE.Group();
      cap.position.y = 0.95;
      cap.add(
        inked(new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.15).scale(1, 0.72, 1), capMat)),
        inked(new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.2, 0.14, 20).translate(0, -0.05, 0), gillMat)),
      );
      for (let k = 0; k < 5; k++) {
        const th = (k / 5) * Math.PI * 2 + i,
          ph = k ? 0.75 : 0.05, // one on top, the rest round the sides
          n = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph) / 0.72, Math.sin(ph) * Math.sin(th)),
          spot = new THREE.Mesh(spotGeo, spotMat);
        spot.position.set(Math.sin(ph) * Math.cos(th) * 0.6, Math.cos(ph) * 0.72 * 0.6, Math.sin(ph) * Math.sin(th) * 0.6);
        spot.lookAt(spot.position.clone().add(n));
        spot.rotateX(Math.PI / 2); // flat against the cap
        cap.add(spot);
      }
      shroom.add(stem, cap);
      shroom.position.copy(base).addScaledVector(dir, -0.12);
      shroom.quaternion.setFromUnitVectors(up, dir);
      [hat, shroom].forEach((t) => {
        t.userData.rest = t.quaternion.clone();
        t.visible = false;
      });
      toppers.mushrooms.push(shroom);
      body.add(antenna, starred, hat, shroom);
    });
  }

  const eyes = [];
  // the eyes, by B.eyeStyle. The dollies' (3d-storybook src/parts/head.js, EYE_GEO): a small dome of dark paint
  // each. Or the statues' (src/albatross/heads.js, FACE_SCULPT.eyes, buildHead's eye): an almond, the hull round
  // a handful of points about the eye's middle, its corners sunk into the face and a pupil bump standing out of
  // it, the outer corner a touch higher; the left one mirrored. Either is set on the face facing straight out
  // from it, and blinks by squashing flat
  const E = B.eyes,
    SE = B.statueEyes,
    STATUE = B.eyeStyle === "statue",
    // the statue's eye, from its stock head (relative to the eye's middle): [across, up, out of the face]
    STATUE_EYE = [[-0.13, -0.01, -0.02], [0.13, 0.02, -0.05], [-0.07, 0.04, 0.012], [0.01, 0.055, 0.018], [0.08, 0.045, 0.01], [-0.07, -0.04, 0.01], [0.01, -0.05, 0.016], [0.08, -0.03, 0.008], [0, 0, 0.025], [0, 0, -0.06]],
    statueEyeGeo = (side) =>
      new ConvexGeometry(STATUE_EYE.map(([x, y, z]) => new THREE.Vector3(x * side * SE.width * SE.scale, y * SE.height * SE.scale, z * SE.bulge * SE.scale))),
    // how far the eye reaches from its middle (for the shines, and to keep the arms off), and how far it is sunk
    EYE_R = STATUE ? 0.13 * SE.width * SE.scale : E.r,
    EYE_H = STATUE ? 0.055 * SE.height * SE.scale : E.r,
    EYE_FRONT = STATUE ? 0.025 * SE.bulge * SE.scale : E.r * E.protrude,
    EYE_SINK = STATUE ? 0 : EYE_R * 0.08,
    eyeGeo = (() => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = (i / 8) * (Math.PI / 2);
        pts.push(new THREE.Vector2(Math.cos(t) * EYE_R, Math.sin(t) * EYE_R * E.protrude));
      }
      return new THREE.LatheGeometry(pts, 20).rotateX(Math.PI / 2); // the dome's top toward +z, out of the face
    })(),
    eyeMat = Object.assign(toonMat(B.colors.eyePaint).clone(), { side: THREE.DoubleSide }); // two-sided, as the dollies paint theirs
  // the shines: soft, not-quite-white dots laid on each dome, the same place on both as if lit by one light.
  // While it smiles they turn into little four-point sparkles, twinkling round. On the eye, so they blink with it
  const shineMat = new THREE.MeshBasicMaterial({ color: B.colors.eyeShine, transparent: true, opacity: E.shineOpacity }),
    starGeo = (r) => {
      const sh = new THREE.Shape();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 2,
          k = i % 2 ? r * E.sparkle.waist : r;
        i ? sh.lineTo(Math.cos(a) * k, Math.sin(a) * k) : sh.moveTo(Math.cos(a) * k, Math.sin(a) * k);
      }
      return new THREE.ShapeGeometry(sh);
    },
    dots = [],
    sparkles = [],
    shineAt = (geo, t, phi) => {
      if (STATUE) {
        // on the almond's front, round from its middle by `t` (pi/2 the middle), toward `phi`
        const dot = new THREE.Mesh(geo, shineMat),
          c = Math.cos(t);
        dot.position.set(c * Math.cos(phi) * EYE_R * 0.7, c * Math.sin(phi) * EYE_H * 0.7, EYE_FRONT * (1 - 0.6 * c) + 0.006);
        return dot;
      }
      const c = Math.cos(t),
        P = E.protrude,
        dot = new THREE.Mesh(geo, shineMat);
      dot.position.set(c * Math.cos(phi), c * Math.sin(phi), P * Math.sin(t)).multiplyScalar(EYE_R);
      const n = new THREE.Vector3(c * Math.cos(phi), c * Math.sin(phi), Math.sin(t) / P).normalize();
      dot.position.addScaledVector(n, 0.006);
      dot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      return dot;
    };
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(STATUE ? statueEyeGeo(side) : eyeGeo, eyeMat),
      shineR = STATUE ? EYE_H : EYE_R; // the shines are sized to the eye's height, so they fit an almond
    E.shines.forEach(([size, t, phi]) => {
      const dot = shineAt(new THREE.CircleGeometry(size * shineR, 16), t, phi),
        star = shineAt(starGeo(size * shineR * E.sparkle.size), t, phi);
      star.visible = false;
      dots.push(dot);
      sparkles.push(star);
      eye.add(dot, star);
    });
    // where the eye sits on the body, as a direction on the unit sphere before the body's squash/stretch
    eye.userData.dir = new THREE.Vector3(side * E.apart, E.up, 0.92).normalize();
    creature.add(eye);
    eyes.push(eye);
  });
  // rest each eye on the body's surface (which changes shape every frame), facing out along the surface normal,
  // sunk in a little so it reads as set into the skin rather than floating on it
  const tmpEye = new THREE.Vector3(),
    tmpNrm = new THREE.Vector3();
  function placeEyes() {
    eyes.forEach((e) => {
      const d = e.userData.dir,
        sc = body.scale;
      tmpNrm.set(d.x / sc.x, d.y / sc.y, d.z / sc.z).normalize();
      bodyPoint(d, tmpEye).multiply(sc)
        .multiplyScalar(BLOB_R)
        .add(body.position)
        .addScaledVector(tmpNrm, -EYE_SINK);
      e.position.copy(tmpEye);
      e.lookAt(creature.localToWorld(tmpEye.add(tmpNrm)));
    });
  }
  function placeMouth() {
    const d = MOUTH_DIR,
      sc = body.scale;
    tmpNrm.set(d.x / sc.x, d.y / sc.y, d.z / sc.z).normalize();
    bodyPoint(d, tmpEye).multiply(sc).multiplyScalar(BLOB_R).add(body.position).addScaledVector(tmpNrm, 0.012);
    mouth.position.copy(tmpEye);
    mouth.lookAt(creature.localToWorld(tmpEye.add(tmpNrm)));
  }
  creature.updateMatrixWorld(true);
  placeEyes();
  // the mouth: one shape per face, bent to the body's curve, riding on the body's surface below the nose
  // (placed each frame, like the eyes, so it squishes and breathes with the body)
  const MOUTH_DIR = new THREE.Vector3(0, -0.02, 0.96).normalize(), // under the nose, close below the eyes
    mouth = new THREE.Group();
  creature.add(mouth);
  // the mouths are the dollies' (3d-storybook src/renderGrid/buildOneDolly.js, makeMouthGeo; the bow's clamp
  // from src/parts/head.js): one painted bar, a stadium, flat along its top and bottom with a round cap at each
  // end, `width` across and `height` tall (world units), bent by its `bow` (corners up for a smile, down for a
  // frown), `taper` drawing its top edge in so the lip sits fuller below; then wrapped round the body like the
  // rest of the face. One per face, set in B.mouths, in the dollies' eye paint
  const mouthPaint = new THREE.MeshBasicMaterial({ color: B.colors.eyePaint, side: THREE.DoubleSide });
  function dollyMouth({ width, height, bow, taper = 1, shift = 0 }) {
    const NU = 24,
      NV = 6,
      aspect = height / Math.max(1e-6, width),
      rise = Math.max(-0.55, Math.min(0.55, (bow * width) / (2 * height))),
      bend = (x) => rise * (4 * x * x - 0.5),
      capR = 0.5,
      capX = capR * aspect,
      verts = [],
      index = [];
    for (let j = 0; j <= NV; j++) {
      const s = -0.5 + j / NV, // across the bar, -0.5 at its bottom edge
        round = capX * Math.sqrt(Math.max(0, 1 - (s / capR) * (s / capR))),
        halfLen = 0.5 * (1 + (taper - 1) * (s + 0.5)),
        half = Math.max(0, halfLen - capX) + round;
      for (let i = 0; i <= NU; i++) {
        const x = (-1 + (2 * i) / NU) * half,
          wx = x * width + shift,
          wy = (s + bend(x)) * height;
        verts.push(wx, wy, -(wx * wx + wy * wy) / (2 * BLOB_R)); // wrapped round the body
      }
    }
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        const a = j * (NU + 1) + i,
          b = a + 1,
          c = b + NU + 1,
          d = a + NU + 1;
        index.push(a, b, c, a, c, d);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(index);
    return new THREE.Mesh(g, mouthPaint);
  }
  // or the statues' (3d-storybook src/albatross/heads.js, FACE_SCULPT.mouth, buildHead): two sculpted lips,
  // each the hull round a handful of points, mirrored, measured off the face (their last number is how far each
  // stands off it), the upper lip growing up from the lip line and the lower down from it. Scaled from the
  // statue's head to this face by `scale`, wrapped round the body, and in the nose's matte, as a statue's lips
  // are the same stone as its face. One per face, set in B.statueMouths
  const STATUE_LIPS = {
    // from the stock head, relative to its face (its SCULPT_REL), the lip line at y -0.64
    upper: [[0.2, -0.63, 0.064], [0.1, -0.58, 0.055], [0, -0.555, 0.075], [0, -0.625, 0.087], [0.1, -0.628, 0.076], [0.13, -0.53, -0.02], [0, -0.5, -0.01]],
    lower: [[0.18, -0.64, 0.04], [0.1, -0.655, 0.079], [0, -0.655, 0.086], [0.08, -0.72, 0.1], [0, -0.73, 0.106], [0.12, -0.76, 0.066]],
    line: -0.64,
    pivots: { upper: -0.63, lower: -0.655 },
  };
  function statueMouth({ width = 1, upperLip = 1, lowerLip = 1, fullness = 1, shift = 0 }) {
    const k = B.statueMouth.scale,
      about = (v, pivot, f) => v + (v - pivot) * (f - 1),
      lip = (pts, pivot, f) =>
        pts
          .flatMap((p) => (p[0] === 0 ? [p] : [p, [-p[0], p[1], p[2]]]))
          .map(([x, y, dz]) => {
            const wx = x * width * B.statueMouth.width * k + shift,
              wy = (about(y, pivot, f) - STATUE_LIPS.line) * k + B.statueMouth.y;
            return new THREE.Vector3(wx, wy, dz * fullness * k - (wx * wx + wy * wy) / (2 * BLOB_R));
          }),
      paint = toonMat(new THREE.Color(B.colors.skin).offsetHSL(0, 0.02, -0.14).getHex()), // the nose's (toonMat keeps one per color)
      g = new THREE.Group();
    g.add(new THREE.Mesh(new ConvexGeometry(lip(STATUE_LIPS.upper, STATUE_LIPS.pivots.upper, upperLip)), paint));
    g.add(new THREE.Mesh(new ConvexGeometry(lip(STATUE_LIPS.lower, STATUE_LIPS.pivots.lower, lowerLip)), paint));
    g.children.forEach((m) => (m.castShadow = true));
    return g;
  }
  const mouths = {};
  for (const face in B.mouths)
    mouths[face] = B.mouthStyle === "statue" ? statueMouth(B.statueMouths[face]) : new THREE.Group().add(dollyMouth(B.mouths[face]));
  Object.values(mouths).forEach((m) => {
    m.visible = false;
    mouth.add(m);
  });
  mouths.none.visible = true;
  placeMouth();

  // sunglasses: a dark lens in a frame over each eye, following the eye (but not its blink), with a glint, arms
  // running back into the head and a bridge between them rebuilt each frame. Worn only where the instrument
  // asks for them (setInstrument)
  const glasses = new THREE.Group();
  glasses.visible = false;
  creature.add(glasses);
  const lensMat = toonMat(B.colors.lens),
    frameMat = toonMat(B.colors.frame),
    glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff }),
    LENS_Z = 0.48; // in front of the eye, which reaches 0.44 out
  const lensShape = new THREE.Shape();
  // wider than tall, flat-ish along the top, rounder at the bottom
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2,
      c = Math.cos(a),
      sn = Math.sin(a),
      px = 0.5 * Math.sign(c) * Math.abs(c) ** 0.55,
      py = sn > 0 ? 0.3 * sn ** 0.35 : 0.4 * sn;
    i ? lensShape.lineTo(px, py + 0.04) : lensShape.moveTo(px, py + 0.04);
  }
  const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 2 }),
    glintShape = new THREE.Shape([
      new THREE.Vector2(-0.3, 0.12),
      new THREE.Vector2(-0.18, 0.24),
      new THREE.Vector2(-0.1, 0.24),
      new THREE.Vector2(-0.22, 0.12),
    ]),
    glintGeo = new THREE.ShapeGeometry(glintShape);
  const glassSides = eyes.map((eye) => {
    const sx = Math.sign(eye.userData.dir.x), // which way is outward
      side = new THREE.Group(),
      lens = inked(new THREE.Mesh(lensGeo, lensMat));
    lens.position.z = LENS_Z;
    const glint = new THREE.Mesh(glintGeo, glintMat);
    glint.position.z = LENS_Z + 0.075;
    // the arm: from the lens's outer edge straight back into the head
    const armFrom = new THREE.Vector3(sx * 0.5, 0.12, LENS_Z + 0.02),
      armTo = new THREE.Vector3(sx * 0.62, 0.2, -0.6),
      arm = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), frameMat));
    arm.position.copy(armFrom).lerp(armTo, 0.5);
    arm.scale.y = armFrom.distanceTo(armTo);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armTo.clone().sub(armFrom).normalize());
    side.add(lens, glint, arm);
    side.userData.inner = new THREE.Vector3(-sx * 0.46, 0.14, LENS_Z + 0.03); // where the bridge meets the lens
    glasses.add(side);
    return side;
  });
  const bridge = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1, 8), frameMat));
  glasses.add(bridge);
  const bridgeA = new THREE.Vector3(),
    bridgeB = new THREE.Vector3(),
    yAxis = new THREE.Vector3(0, 1, 0);
  function placeGlasses() {
    glassSides.forEach((side, i) => {
      side.position.copy(eyes[i].position);
      side.quaternion.copy(eyes[i].quaternion);
    });
    const [l, r] = glassSides;
    bridgeA.copy(l.userData.inner).applyQuaternion(l.quaternion).add(l.position);
    bridgeB.copy(r.userData.inner).applyQuaternion(r.quaternion).add(r.position);
    bridge.position.copy(bridgeA).lerp(bridgeB, 0.5);
    bridge.scale.y = bridgeA.distanceTo(bridgeB) + 0.06;
    bridge.quaternion.setFromUnitVectors(yAxis, bridgeB.sub(bridgeA).normalize());
  }

  // headphones: over-ear cups high on each side of the head, clear of the arms, and a band arching over the
  // top between them. Riding on the body, so they squish and breathe with it. Worn only where the instrument
  // asks for them (setInstrument)
  const headphones = new THREE.Group(),
    CUP_R = 0.55,
    cupDirs = [-1, 1].map((sx) => new THREE.Vector3(sx * 0.78, 0.6, 0.05).normalize());
  headphones.visible = false;
  body.add(headphones);
  {
    const shellMat = toonMat(B.colors.phones),
      padMat = toonMat(B.colors.phonePad),
      ringMat = new THREE.MeshBasicMaterial({ color: B.colors.phoneLight }), // unlit, so it glows
      up = new THREE.Vector3(0, 1, 0);
    cupDirs.forEach((d) => {
      const cup = new THREE.Group();
      bodyPoint(d, cup.position).multiplyScalar(BLOB_R);
      cup.quaternion.setFromUnitVectors(up, d); // its axis straight out from the head
      const pad = inked(new THREE.Mesh(new THREE.TorusGeometry(CUP_R * 0.8, 0.16, 10, 28).rotateX(Math.PI / 2), padMat)),
        shell = inked(new THREE.Mesh(new THREE.CylinderGeometry(CUP_R * 0.9, CUP_R, 0.36, 28).translate(0, 0.3, 0), shellMat)),
        ring = new THREE.Mesh(new THREE.RingGeometry(CUP_R * 0.5, CUP_R * 0.62, 28).rotateX(-Math.PI / 2), ringMat);
      pad.position.y = 0.06;
      ring.position.y = 0.49;
      cup.add(pad, shell, ring);
      headphones.add(cup);
    });
    // the band: an arc over the crown from the top of one cup to the other, standing a little off the head
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.atan2(cupDirs[0].y, cupDirs[0].x) + (i / 24) * (Math.atan2(cupDirs[1].y, cupDirs[1].x) - Math.atan2(cupDirs[0].y, cupDirs[0].x));
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0.05).multiplyScalar(BLOB_R * 1.14));
    }
    headphones.add(inked(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.11, 10), shellMat)));
  }

  // a clown nose: a shiny red ball set into the body between the eyes and the mouth, placed each frame like
  // them. Worn only where the instrument asks for it (setInstrument)
  const NOSE_DIR = new THREE.Vector3(0, -0.08, 1).normalize(),
    NOSE_R = 0.23,
    nose = inked(new THREE.Mesh(new THREE.SphereGeometry(NOSE_R, 24, 16), toonMat(B.colors.nose))),
    shine = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  shine.position.set(-0.08, 0.1, NOSE_R * 0.85);
  shine.scale.set(1, 0.7, 0.4);
  nose.add(shine);
  nose.visible = false;
  creature.add(nose);
  // the dolly nose: the dollies' own (3d-storybook src/renderGrid/buildOneDolly.js, makeNoseGeo), a turned plug
  // whose outline is a superellipse, `bulbosity` how full it holds before it rounds off and `scrunch` how much
  // its tip is pinched in; `radius` across and `length` out from the face, in the skin's color made darker the
  // way a doll's is, and matte, not jelly. Set on the face like the eyes, every frame, sunk in by `sink`
  const DN = B.dollyNose,
    dollyNose = (() => {
      const k = 2 + (1 - DN.bulbosity) * 10,
        pts = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        pts.push(new THREE.Vector2(Math.max(0, (1 + (DN.scrunch - 1) * u) * Math.pow(1 - Math.pow(u, k), 1 / k)), u));
      }
      const g = new THREE.LatheGeometry(pts, 20).rotateX(Math.PI / 2); // its axis along +z, out of the face
      const m = new THREE.Mesh(g, toonMat(new THREE.Color(B.colors.skin).offsetHSL(0, 0.02, -0.14).getHex()));
      m.scale.set(DN.radius, DN.radius, DN.length);
      m.castShadow = true;
      return m;
    })(),
    DOLLY_NOSE_DIR = new THREE.Vector3(0, DN.up, 0.95).normalize();
  creature.add(dollyNose);
  function placeDollyNose() {
    const d = DOLLY_NOSE_DIR,
      sc = body.scale;
    tmpNrm.set(d.x / sc.x, d.y / sc.y, d.z / sc.z).normalize();
    bodyPoint(d, tmpEye).multiply(sc).multiplyScalar(BLOB_R).add(body.position).addScaledVector(tmpNrm, -DN.sink);
    dollyNose.position.copy(tmpEye);
    dollyNose.lookAt(creature.localToWorld(tmpEye.add(tmpNrm)));
  }
  placeDollyNose();
  // the dolly cheeks (buildOneDolly.js, placeCheeks): the eyes' dome again, `size` across and squashed out from
  // the face to `bulge` of that, matte in their own color, set further round the face than the eyes and down
  // by the nose (`dir`, mirrored, before the squash), sunk by the gap their flat rim would leave on the curve
  const CH = B.cheeks,
    cheekGeo = (() => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = (i / 8) * (Math.PI / 2);
        pts.push(new THREE.Vector2(Math.cos(t), Math.sin(t)));
      }
      return new THREE.LatheGeometry(pts, 24).rotateX(Math.PI / 2); // its top toward +z, out of the face
    })(),
    cheekMat = Object.assign(toonMat(B.colors.cheek).clone(), { side: THREE.DoubleSide }),
    cheeks = [-1, 1].map((side) => {
      const c = new THREE.Mesh(cheekGeo, cheekMat);
      c.scale.set(CH.size, CH.size, CH.size * CH.bulge);
      c.userData.dir = new THREE.Vector3(side * CH.dir[0], CH.dir[1], CH.dir[2]).normalize();
      creature.add(c);
      return c;
    });
  function placeCheeks() {
    const sc = body.scale,
      sag = (CH.size * CH.size) / (2 * BLOB_R);
    cheeks.forEach((c) => {
      const d = c.userData.dir;
      tmpNrm.set(d.x / sc.x, d.y / sc.y, d.z / sc.z).normalize();
      bodyPoint(d, tmpEye).multiply(sc).multiplyScalar(BLOB_R).add(body.position).addScaledVector(tmpNrm, -sag);
      c.position.copy(tmpEye);
      c.lookAt(creature.localToWorld(tmpEye.add(tmpNrm)));
    });
  }
  placeCheeks();
  function placeNose() {
    const d = NOSE_DIR,
      sc = body.scale;
    tmpNrm.set(d.x / sc.x, d.y / sc.y, d.z / sc.z).normalize();
    bodyPoint(d, tmpEye).multiply(sc).multiplyScalar(BLOB_R).add(body.position).addScaledVector(tmpNrm, NOSE_R * 0.45); // sunk a little over half in
    nose.position.copy(tmpEye);
    nose.lookAt(creature.localToWorld(tmpEye.add(tmpNrm)));
  }

  // blinking and faces
  const rand = ([a, b]) => a + Math.random() * (b - a);
  let nextBlink = rand(B.blink.every),
    blinkT = -1, // seconds into the current blink, or -1 between blinks
    face = "none",
    nextFace = rand(B.rest), // seconds until the next change of face, counted down while playing
    swapT = -1, // seconds into a change of mouth (a quick squash while one shape swaps for the next), or -1
    swapTo = "open";
  function setFace(name) {
    if (name === face && swapT < 0) return;
    face = name;
    swapTo = name;
    swapT = 0;
    // really happy: the shines in its eyes turn to sparkles
    const happy = name === "smile";
    dots.forEach((d) => (d.visible = !happy));
    sparkles.forEach((s) => (s.visible = happy));
  }
  function pickFace() {
    const opts = Object.keys(B.faces).filter((f) => f !== "open" && f !== "none" && f !== face),
      total = opts.reduce((a, f) => a + B.faces[f].weight, 0);
    let r = Math.random() * total;
    return opts.find((f) => (r -= B.faces[f].weight) < 0) || opts[0];
  }
  function animateFace(dt, playing) {
    // blink: shut fast, open a little slower; sometimes twice in a row
    const K = B.blink;
    let shut = 0;
    if (blinkT < 0) {
      nextBlink -= dt;
      if (nextBlink <= 0) blinkT = 0;
    }
    if (blinkT >= 0) {
      blinkT += dt;
      shut = blinkT < K.close ? blinkT / K.close : Math.max(0, 1 - (blinkT - K.close) / K.open);
      if (blinkT >= K.close + K.open) {
        blinkT = -1;
        nextBlink = Math.random() < K.double ? 0.12 : rand(K.every);
      }
    }
    // faces: start playing and the mouth opens; while playing, now and then pull a face for a moment and go
    // back to the open mouth; stop playing and the mouth goes away
    if (playing) {
      nextFace -= dt;
      if (face === "none") {
        setFace("open");
        nextFace = rand(B.rest);
      } else if (nextFace <= 0) {
        if (face === "open") {
          setFace(pickFace());
          nextFace = rand(B.hold);
        } else {
          setFace("open");
          nextFace = rand(B.rest);
        }
      }
    } else if (face !== "none") setFace("none");
    // the dollies' eyes only blink: squashed flat and open again, never quite to nothing
    eyes.forEach((e) => (e.scale.y = Math.max(0.06, 1 - shut)));
    sparkles.forEach((s, i) => s.visible && s.rotateZ(dt * E.sparkle.spin * (i % 2 ? -1 : 1))); // twinkling round
    // the mouth squashes shut and springs open again with the new shape
    let squish = 1;
    if (swapT >= 0) {
      swapT += dt;
      const k = Math.min(1, swapT / 0.14);
      if (k >= 0.5) for (const m in mouths) mouths[m].visible = m === swapTo;
      squish = 1 - 0.85 * Math.sin(k * Math.PI);
      if (k >= 1) swapT = -1;
    }
    mouth.scale.set(1, Math.max(0.05, squish), 1);
  }

  // noodle arms: a tube along a bowed 3-point curve from shoulder to hand, rebuilt each frame
  // the arm starts deep inside the body and exits through the skin, so there is no visible join:
  // the body's own surface hides the tube's open end and its outline picks up at the silhouette
  const ARM_R = B.arm.r,
    ARM_CLEAR = ARM_R * 2.4 + 0.14;
  const tmpMid = new THREE.Vector3(),
    tmpSh = new THREE.Vector3(),
    tmpRoot = new THREE.Vector3(),
    tmpOut = new THREE.Vector3();
  function armPoints(m, sep) {
    const root = creature
      .localToWorld(tmpRoot.copy(m.shoulderLocal).multiplyScalar(0.45))
      .clone();
    const sh = creature.localToWorld(tmpSh.copy(m.shoulderLocal)).clone();
    const hand = new THREE.Vector3(
      m.pose.x + m.nudge.x,
      m.pose.y,
      m.pose.z + m.nudge.z,
    );
    const mid = tmpMid.copy(sh).lerp(hand, 0.5);
    tmpOut.copy(sh).sub(root).setY(0).normalize();
    const W = B.arm.sway,
      wob = performance.now() * 0.001 * W.rate + m.phaseOff;
    mid.addScaledVector(tmpOut, 0.5 + Math.sin(wob) * W.out).y +=
      0.6 + m.bow + sep + Math.cos(wob * 0.8) * W.up;
    mid.y = Math.max(0.9, mid.y);
    return [root, sh, mid.clone(), hand];
  }
  const tmpTip = new THREE.Vector3(),
    tmpC = new THREE.Vector3();
  // a tube along a curve whose radius at each ring comes from radiusAt(u), u in 0..1 along the curve
  function shapedTube(curve, segs, radiusAt, radial = 10) {
    const g = new THREE.TubeGeometry(curve, segs, 1, radial, false);
    const pos = g.attributes.position;
    for (let i = 0; i <= segs; i++) {
      curve.getPointAt(i / segs, tmpC);
      const rad = radiusAt(i / segs);
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j;
        pos.setXYZ(
          k,
          tmpC.x + (pos.getX(k) - tmpC.x) * rad,
          tmpC.y + (pos.getY(k) - tmpC.y) * rad,
          tmpC.z + (pos.getZ(k) - tmpC.z) * rad,
        );
      }
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  // tentacle taper: fat at the body, slim at the tip. u is the position along the full arm path.
  const TAPER_BASE = 1.8,
    TAPER_TIP = 0.55;
  const taper = (u) => TAPER_BASE + (TAPER_TIP - TAPER_BASE) * Math.pow(u, 0.8);
  const taperedTube = (curve, r, segs, ext, extra = 0) =>
    shapedTube(curve, segs, (u) => r * taper(u * ext) + extra);
  // the grip: from the arm's end at the mallet origin, the tentacle tip swings onto the handle and coils
  // round it (mallet-local, the handle runs along +x), thinning to a point. Built once per mallet.
  const GRIP = { turns: 1.7, length: 0.62, tipR: 0.04, stickR: 0.078 };
  function tentacleGrip() {
    const startR = ARM_R * TAPER_TIP; // matches the arm tube where it arrives
    const tubeR = (u) => startR + (GRIP.tipR - startR) * Math.pow(u, 0.9);
    const pts = [new THREE.Vector3(0, 0, 0)];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        a = u * Math.PI * 2 * GRIP.turns,
        // the coil's center line sits one tube radius off the handle, pressed in a touch so there is no gap
        r = GRIP.stickR + tubeR(u) - 0.012;
      pts.push(
        new THREE.Vector3(
          0.05 + u * GRIP.length,
          r * Math.cos(a),
          r * Math.sin(a),
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    return shapedTube(curve, 72, tubeR, 8);
  }
  // keep the arms off the eyes (and the sunglasses, clown nose and headphones, when it wears them): any point along an arm closer to an
  // eye's center than the eye's reach plus the arm's own thickness there is pushed straight out to that distance.
  // Eye centers come from the frame's placeEyes(), in world space
  const eyeAt = [new THREE.Vector3(), new THREE.Vector3()],
    tmpAway = new THREE.Vector3();
  const noseAt = new THREE.Vector3(),
    dollyNoseAt = new THREE.Vector3(),
    cheekAt = [new THREE.Vector3(), new THREE.Vector3()],
    cupAt = [new THREE.Vector3(), new THREE.Vector3()];
  function findEyes() {
    eyes.forEach((e, i) => creature.localToWorld(eyeAt[i].copy(e.position)));
    creature.localToWorld(noseAt.copy(nose.position));
    // the dolly nose's middle, half its length out from the face
    dollyNose.getWorldPosition(dollyNoseAt).addScaledVector(dollyNose.getWorldDirection(tmpAway), DN.length / 2);
    cheeks.forEach((c, i) => c.getWorldPosition(cheekAt[i]));
    headphones.children.slice(0, 2).forEach((cup, i) => cup.getWorldPosition(cupAt[i]));
  }
  function clearEyes(p, armR) {
    const reach = (glasses.visible ? 0.85 : EYE_R) + armR + 0.1; // the lenses reach about 0.85 from the eye's center
    if (nose.visible) pushOff(p, noseAt, NOSE_R + armR + 0.1);
    if (dollyNose.visible) pushOff(p, dollyNoseAt, Math.max(DN.radius, DN.length / 2) + armR + 0.1);
    cheekAt.forEach((c) => pushOff(p, c, CH.size + armR + 0.1));
    if (headphones.visible) cupAt.forEach((c) => pushOff(p, c, CUP_R + 0.3 + armR + 0.1));
    eyeAt.forEach((c) => pushOff(p, c, reach));
    return p;
  }
  // moves p straight away from c until it is at least `reach` from it
  function pushOff(p, c, reach) {
    tmpAway.subVectors(p, c);
    const d = tmpAway.length();
    if (d >= reach) return;
    if (d < 1e-4) tmpAway.set(0, 1, 0);
    p.copy(c).addScaledVector(tmpAway.normalize(), reach);
  }
  function buildArm(m, pts) {
    const full = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const ext = Math.max(0.03, m.grow);
    // the visible arm is the first `ext` of the path: it grows out along the route and is sucked back the same
    // way. Each point is kept clear of the eyes, at the arm's thickness there
    const spaced = full.getSpacedPoints(30).map((p, i) => clearEyes(p, ARM_R * taper(i / 30)));
    const part = spaced.filter((_, i) => i / 30 < ext);
    part.push(clearEyes(full.getPointAt(ext, tmpTip), ARM_R * taper(ext)).clone());
    const curve =
      part.length > 1 ?
        new THREE.CatmullRomCurve3(part, false, "centripetal")
      : full;
    const segs = Math.max(2, Math.round(20 * ext));
    m.arm.geometry.dispose();
    m.arm.geometry = taperedTube(curve, ARM_R, segs, ext);
    if (m.grow < 1) m.obj.position.copy(tmpTip);
    m.obj.scale.setScalar(Math.max(0.001, Math.min(1, m.grow / 0.3)));
  }
  // arms that would pass through each other get nudged apart vertically: whichever is higher at the near
  // point goes over, the other ducks under. The gap is measured from where the arms would be with no nudge,
  // so the nudge never feeds back into its own measure (pushed apart, it would see room, let go, close
  // again and push: a jitter); and a pair keeps its over/under until it is well clear, so the two don't
  // swap places frame to frame when they are level. The nudge is smoothed so nothing pops.
  const overOf = new Map(); // "i:j" of a pair in contact: is i the one over
  function updateArms(dt) {
    const live = players.filter((m) => m.obj.visible);
    const samples = live.map((m) =>
      new THREE.CatmullRomCurve3(armPoints(m, 0), false, "centripetal")
        .getPoints(12)
        .slice(3),
    );
    const want = live.map(() => 0);
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        let best = Infinity,
          bi = null,
          bj = null;
        samples[i].forEach((pi) =>
          samples[j].forEach((pj) => {
            const d = pi.distanceTo(pj);
            if (d < best) {
              best = d;
              bi = pi;
              bj = pj;
            }
          }),
        );
        const clear = ARM_CLEAR,
          key = live[i].obj.name + ":" + live[j].obj.name;
        if (best < clear) {
          const push = (clear - best) * 0.7;
          if (!overOf.has(key)) overOf.set(key, bi.y >= bj.y);
          const iOver = overOf.get(key);
          want[i] += iOver ? push : -push;
          want[j] += iOver ? -push : push;
        } else if (best > clear * 1.25) overOf.delete(key);
      }
    findEyes();
    live.forEach((m, i) => {
      m.sep += (want[i] - m.sep) * Math.min(1, dt * 5);
      buildArm(m, armPoints(m, m.sep));
    });
  }
  // playing mallets, all tucked inside the blob until needed
  const RAISED = 0.32,
    HIT = -0.12;
  let usingMallets = true; // else the bare tentacle tips play; set per instrument by setInstrument()
  function poseOver(bar, tilt) {
    const { hit, angle } = bar.userData;
    if (!usingMallets) {
      // no mallet: the tentacle's own tip comes down onto the key, from the player's side of it
      const reach = 0.35,
        up = tilt === HIT ? 0.06 : 0.7;
      return {
        x: hit.x - Math.sin(angle) * reach,
        y: hit.y + barT / 2 + up,
        z: hit.z - Math.cos(angle) * reach,
        tilt,
        yaw: angle - Math.PI / 2,
      };
    }
    const hitY = hit.y + barT / 2 + HEAD_R;
    const reach = Math.cos(HIT) * STICK; // hand sits this far back along the bar's radius
    return {
      x: hit.x - Math.sin(angle) * reach,
      y: hitY - Math.sin(HIT) * STICK,
      z: hit.z - Math.cos(angle) * reach,
      tilt,
      yaw: angle - Math.PI / 2,
    };
  }
  function makePlayer({ color, name, homeBar, shoulder, side, bow = 0 }) {
    const obj = mallet(color);
    obj.name = name;
    scene.add(obj);
    const arm = new THREE.Mesh(new THREE.BufferGeometry(), skin);
    arm.castShadow = true;
    scene.add(arm);
    const m = {
      obj,
      arm,
      side,
      bow,
      sep: 0,
      nudge: new THREE.Vector3(),
      targetBar: null,
      homeBar, // where it rests when held out (holdArms)
      held: false, // held out over its home bar, never sucked back in (the storybook's slider)
      phaseOff: Math.random() * Math.PI * 2,
      shoulderLocal: new THREE.Vector3(shoulder[0], shoulder[1], shoulder[2]),
      pose: poseOver(homeBar, RAISED),
      from: {},
      to: {},
      t: 1,
      dur: 1,
      phase: "idle",
      grow: 0,
      lastUsed: -1e9,
    };
    obj.visible = arm.visible = false;
    apply(m);
    return m;
  }
  function apply(m) {
    m.obj.position.set(m.pose.x + m.nudge.x, m.pose.y, m.pose.z + m.nudge.z);
    m.obj.rotation.set(0, m.pose.yaw, m.pose.tilt); // head points outward along the bar
  }
  function tweenTo(m, target, dur, phase) {
    Object.assign(m.from, m.pose);
    Object.assign(m.to, target);
    if (m.to.yaw - m.from.yaw > Math.PI) m.to.yaw -= 2 * Math.PI;
    else if (m.from.yaw - m.to.yaw > Math.PI) m.to.yaw += 2 * Math.PI;
    m.t = 0;
    m.dur = dur;
    m.phase = phase;
  }
  // eight arms, a 2x2 grid on each flank of the body; all tucked away until a note is played
  const bowFor = (row, col) => (row ? 0.45 : 0) + (col ? 0 : 0.2);
  const flank = (side, row, col) => {
    const y = BLOB_R * (row ? 1.05 : 0.6); // upper / lower row
    const r = Math.sqrt(
      Math.max(0.2, BLOB_R * BLOB_R - Math.pow((y - REST_Y) / REST[1], 2)),
    );
    const z = col ? 0.75 : -0.35; // front / back column
    return [
      side * Math.sqrt(Math.max(0.1, r * r - (z * z) / 0.9)) * 0.92,
      y,
      z,
    ];
  };
  const players = [
    makePlayer({
      color: B.colors.mallets[0],
      name: "mallet-left",
      homeBar: bars[4],
      side: -1,
      shoulder: flank(-1, 1, 1),
      bow: bowFor(1, 1),
    }),
    makePlayer({
      color: B.colors.mallets[1],
      name: "mallet-right",
      homeBar: bars[20],
      side: 1,
      shoulder: flank(1, 1, 1),
      bow: bowFor(1, 1),
    }),
    makePlayer({
      color: B.colors.mallets[2],
      name: "mallet-extra-1",
      homeBar: bars[9],
      side: -1,
      shoulder: flank(-1, 1, 0),
      bow: bowFor(1, 0),
    }),
    makePlayer({
      color: B.colors.mallets[3],
      name: "mallet-extra-2",
      homeBar: bars[15],
      side: 1,
      shoulder: flank(1, 1, 0),
      bow: bowFor(1, 0),
    }),
    makePlayer({
      color: B.colors.mallets[4],
      name: "mallet-extra-3",
      homeBar: bars[7],
      side: -1,
      shoulder: flank(-1, 0, 1),
      bow: bowFor(0, 1),
    }),
    makePlayer({
      color: B.colors.mallets[5],
      name: "mallet-extra-4",
      homeBar: bars[17],
      side: 1,
      shoulder: flank(1, 0, 1),
      bow: bowFor(0, 1),
    }),
    makePlayer({
      color: B.colors.mallets[6],
      name: "mallet-extra-5",
      homeBar: bars[2],
      side: -1,
      shoulder: flank(-1, 0, 0),
      bow: bowFor(0, 0),
    }),
    makePlayer({
      color: B.colors.mallets[7],
      name: "mallet-extra-6",
      homeBar: bars[22],
      side: 1,
      shoulder: flank(1, 0, 0),
      bow: bowFor(0, 0),
    }),
  ];
  const EXTRA_LINGER = B.arm.linger;
  const busy = (m) => m.t < 1;
  // any hand can play any bar: pick the free hand whose shoulder is nearest the bar, preferring one
  // that's already out. If everything is busy, the nearest hand doubles up.
  const tmpShW = new THREE.Vector3();
  function malletFor(bar) {
    const hit = bar.userData.hit;
    const already = players.find((m) => m.targetBar === bar && m.obj.visible); // a mallet is on this bar: re-strike with it
    if (already) return already;
    let best = null,
      bestScore = Infinity;
    players.forEach((m) => {
      const d = creature
        .localToWorld(tmpShW.copy(m.shoulderLocal))
        .distanceTo(hit);
      const score = d + (m.grow < 1 ? 0.6 : 0) + (busy(m) ? 100 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    });
    return best;
  }
  // keep mallet shafts apart: closest points between two segments, then a smoothed sideways nudge
  const _p1 = new THREE.Vector3(),
    _p2 = new THREE.Vector3(),
    _q1 = new THREE.Vector3(),
    _q2 = new THREE.Vector3();
  const _d1 = new THREE.Vector3(),
    _d2 = new THREE.Vector3(),
    _r = new THREE.Vector3(),
    _c1 = new THREE.Vector3(),
    _c2 = new THREE.Vector3();
  const STICK_CLEAR = 0.2 + HEAD_R * 0.6;
  function segClosest(p1, q1, p2, q2, c1, c2) {
    _d1.subVectors(q1, p1);
    _d2.subVectors(q2, p2);
    _r.subVectors(p1, p2);
    const a = _d1.dot(_d1),
      e = _d2.dot(_d2),
      f = _d2.dot(_r),
      c = _d1.dot(_r),
      b = _d1.dot(_d2);
    const den = a * e - b * b;
    let sN =
      den > 1e-6 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0;
    let tN = (b * sN + f) / e;
    if (tN < 0) {
      tN = 0;
      sN = THREE.MathUtils.clamp(-c / a, 0, 1);
    } else if (tN > 1) {
      tN = 1;
      sN = THREE.MathUtils.clamp((b - c) / a, 0, 1);
    }
    c1.copy(p1).addScaledVector(_d1, sN);
    c2.copy(p2).addScaledVector(_d2, tN);
    return c1.distanceTo(c2);
  }
  function malletEnds(m, p, q, nudged = true) {
    const { x, y, z, yaw, tilt } = m.pose;
    p.set(x + (nudged ? m.nudge.x : 0), y, z + (nudged ? m.nudge.z : 0));
    q.set(
      p.x + Math.cos(tilt) * Math.cos(yaw) * STICK,
      p.y + Math.sin(tilt) * STICK,
      p.z - Math.cos(tilt) * Math.sin(yaw) * STICK,
    );
  }
  function separateMallets(dt) {
    const live = players.filter((m) => m.obj.visible && m.grow > 0.5);
    const want = live.map(() => new THREE.Vector3());
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        // measured un-nudged, as the arms are, so the push never chases itself
        malletEnds(live[i], _p1, _q1, false);
        malletEnds(live[j], _p2, _q2, false);
        const d = segClosest(_p1, _q1, _p2, _q2, _c1, _c2);
        if (d < STICK_CLEAR) {
          _r.subVectors(_c1, _c2).setY(0);
          if (_r.lengthSq() < 1e-6) _r.set(live[i].side, 0, 0);
          _r.normalize().multiplyScalar((STICK_CLEAR - d) * 0.5);
          want[i].add(_r);
          want[j].sub(_r);
        }
      }
    live.forEach((m, i) => m.nudge.lerp(want[i], Math.min(1, dt * 6)));
    players.forEach((m) => {
      if (!live.includes(m)) m.nudge.multiplyScalar(0.8);
    });
  }
  let squash = 0; // a squish of the body, counting down after each hit
  const recentHits = []; // { angle, time } of notes in the last few seconds
  let facing = 0;

  // swing an arm at `bar`: a free hand near it, or the one already on it, comes down for the note
  function play(bar) {
    const m = malletFor(bar);
    m.targetBar = bar;
    m.lastUsed = performance.now() / 1000;
    if (m.grow < 0.01) Object.assign(m.pose, poseOver(bar, RAISED));
    m.obj.visible = m.arm.visible = true;
    tweenTo(m, poseOver(bar, HIT), m.grow < 0.5 ? 0.2 : 0.09, "down");
    squash = m.grow < 0.5 ? 1.4 : 1;
    recentHits.push({
      angle: bar.userData.angle,
      time: performance.now() / 1000,
    });
  }

  // the arms hold mallets, or play bare (the piano); and the character sits at height y (up on the stool, or
  // the stage). Any arm already out goes back up over its bar at the new height
  function setInstrument(mallets, y, { sunglasses = false, clownNose = false, headphones: phones = false, antennae = "antennae" } = {}) {
    headphones.visible = phones;
    usingMallets = mallets;
    glasses.visible = sunglasses;
    nose.visible = clownNose;
    for (const kind in toppers) toppers[kind].forEach((t) => (t.visible = kind === antennae));
    creature.position.y = y;
    players.forEach((m) => {
      m.obj.userData.mallet.forEach((part) => (part.visible = mallets)); // or bare tentacles
      if (m.obj.visible && m.targetBar)
        tweenTo(m, poseOver(m.targetBar, RAISED), 0.35, "up");
    });
  }

  // n arms out and held there, each raised over its home bar, the rest free to come and go as notes are
  // played. The players alternate flanks, so the arms come out in pairs. For looking at the character (the
  // storybook's slider); the game never calls this
  function holdArms(n) {
    players.forEach((m, i) => {
      m.held = i < n;
      if (!m.held || m.obj.visible) return;
      Object.assign(m.pose, poseOver(m.homeBar, RAISED));
      m.targetBar = m.homeBar;
      m.obj.visible = m.arm.visible = true;
      tweenTo(m, poseOver(m.homeBar, RAISED), 0.3, "up");
    });
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t;
  // one frame: the mallet swings and the arms growing out and back, then the body
  function animate(now, dt) {
    // mallet tweens (independent, so any number can swing at once)
    players.forEach((m) => {
      {
        // grow out while in use (or held out), get sucked back in after lingering
        const wanted = m.held || now / 1000 - m.lastUsed < EXTRA_LINGER;
        m.grow =
          wanted ?
            Math.min(1, m.grow + dt / 0.2)
          : Math.max(0, m.grow - dt / 0.4);
        if (!wanted && m.grow <= 0) {
          m.obj.visible = m.arm.visible = false;
          m.targetBar = null;
        }
        if (m.t >= 1) apply(m);
      }
      if (m.t >= 1) return;
      m.t = Math.min(1, m.t + dt / m.dur);
      const k = m.phase === "down" ? easeIn(m.t) : easeOut(m.t);
      for (const key in m.pose)
        m.pose[key] = m.from[key] + (m.to[key] - m.from[key]) * k;
      apply(m);
      if (m.t === 1 && m.phase === "down")
        tweenTo(m, { ...m.pose, tilt: RAISED }, 0.22, "up");
    });

    // creature: breathing, a squish on every hit, eyes following the last note
    const breath = Math.sin(now * 0.0022) * 0.02;
    squash = Math.max(0, squash - dt * 5);
    const sq =
      Math.sin(Math.min(1, squash) * Math.PI) * 0.12 * (squash > 1 ? 1.5 : 1);
    body.scale.set(REST[0] + breath + sq, REST[1] - breath - sq, REST[2] + breath + sq);
    body.position.y = (REST_Y * body.scale.y) / REST[1];
    // face wherever the action has been lately (vector-average of recent note angles, weighted by recency)
    const tNow = now / 1000;
    while (recentHits.length && tNow - recentHits[0].time > 2.5)
      recentHits.shift();
    if (recentHits.length) {
      let sx = 0,
        sz = 0;
      recentHits.forEach((h) => {
        const w = 1 - (tNow - h.time) / 2.5;
        sx += Math.sin(h.angle) * w;
        sz += Math.cos(h.angle) * w;
      });
      facing = Math.atan2(sx, sz);
    } else facing = 0; // nothing played lately: drift back to face front
    let dTurn = facing - creature.rotation.y;
    dTurn = Math.atan2(Math.sin(dTurn), Math.cos(dTurn));
    creature.rotation.y +=
      dTurn * Math.min(1, dt * (recentHits.length ? 4 : 1.5));
    creature.updateMatrixWorld(true);
    placeEyes();
    placeMouth();
    if (glasses.visible) placeGlasses();
    if (nose.visible) placeNose();
    if (dollyNose.visible) placeDollyNose();
    placeCheeks();
    // the stars swing gently on their stalks, and jiggle on each hit
    toppers.stars.forEach((st, i) => {
      if (!st.visible) return;
      const star = st.userData.star,
        t = now * 0.001 + star.userData.spin;
      star.rotation.y = Math.sin(t * 1.3) * 0.5;
      star.rotation.z = star.userData.lean + Math.sin(t * 1.7 + i) * 0.12 + sq * (i ? -1.5 : 1.5);
    });
    // the hats and toadstools wobble on each hit, tipping outward and springing back
    [...toppers.hats, ...toppers.mushrooms].forEach((h, i) => {
      if (!h.visible) return;
      h.quaternion.copy(h.userData.rest);
      h.rotateZ(sq * (i % 2 ? -1.2 : 1.2));
    });
    animateFace(dt, recentHits.length > 0);
    separateMallets(dt);
    players.forEach((m) => {
      if (m.t >= 1 && m.obj.visible && m.grow >= 1) apply(m);
    });
    updateArms(dt);
  }

  return { creature, play, setInstrument, holdArms, animate };
}


export { buildBlob, BLOB };
