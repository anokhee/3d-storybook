// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the fence: a wooden fence across the meadow behind the blob ----------
// Loaded after palette.js and materials.js, before script.js. A straight run of posts parallel to the bars'
// arc, with flat rails between them and, if you like, pickets in front of the rails. Toon shaded and inked
// like everything else; it casts and catches shadows. The blob faces the bars (toward the camera's home view),
// so "behind" is the far side, away from them. Its wood colors live in palette.js (fencePost, fenceRail).
const FENCE = {
  enabled: true,
  back: 8, // how far behind the blob the fence stands, world units. Past about 20 it starts to hang over the horizon cut
  width: 100, // how long the run is, centered behind the blob
  postSpacing: 2, // distance between post centers. The run is trimmed to a whole number of bays
  post: { w: 0.34, h: 1.9 }, // post width and height above the ground
  cap: 0.2, // height of the little pyramid on top of each post. 0 = flat top
  sink: 0.2, // how far the posts go into the ground
  rails: [0.55, 1.3], // height of each rail's center above the ground. Add or remove entries for more or fewer
  rail: { h: 0.22, t: 0.1 }, // how tall and how thick each rail is
  pickets: false, // upright pointed slats along the near (blob's) side of the rails. false = a plain ranch fence
  picket: { w: 0.2, h: 1.55, gap: 0.17, t: 0.06, point: 0.16 }, // slat width, height, gap between slats, thickness, and height of the point on top
  wobble: 0.025, // random lean of every post and picket, radians, so it looks hand-built. 0 = ruler straight
  keepOff: 0.7, // no meadow flowers this close to the fence line
  colors: { post: COLOR_PALETTE.fencePost, rail: COLOR_PALETTE.fenceRail },
};

// builds the fence into `scene`, FENCE.back behind the point (x, z) the blob stands on. `toonMat` makes a toon
// material from a color and `inked` gives a mesh its ink outline and shadows (both from script.js). Returns
// the fence group and nearFence(x, z): whether a spot on the ground is too close to the fence line for anything
// planted later
function buildFence(scene, { toonMat, inked }, x, z) {
  const F = FENCE;
  const fence = new THREE.Group();
  fence.name = "fence";
  fence.position.set(x, 0, z - F.back); // its own origin is the middle of the run, on the ground
  scene.add(fence);
  if (F.enabled) {
    const postMat = toonMat(F.colors.post),
      railMat = toonMat(F.colors.rail),
      bays = Math.max(1, Math.round(F.width / F.postSpacing)),
      halfW = (bays * F.postSpacing) / 2,
      wobble = () => (Math.random() - 0.5) * 2 * F.wobble;
    // posts, sunk a little so they never float, with a pyramid cap
    const postGeo = new THREE.BoxGeometry(
        F.post.w,
        F.post.h + F.sink,
        F.post.w,
      ).translate(0, (F.post.h - F.sink) / 2, 0),
      capGeo =
        F.cap > 0 ?
          new THREE.ConeGeometry(F.post.w * 0.72, F.cap, 4)
            .rotateY(Math.PI / 4)
            .translate(0, F.post.h + F.cap / 2, 0)
        : null;
    for (let i = 0; i <= bays; i++) {
      const post = new THREE.Group();
      post.add(inked(new THREE.Mesh(postGeo, postMat)));
      if (capGeo) post.add(inked(new THREE.Mesh(capGeo, postMat)));
      post.position.x = -halfW + i * F.postSpacing;
      post.rotation.set(wobble(), 0, wobble());
      fence.add(post);
    }
    // rails, one long piece per height along the whole run
    const railGeo = new THREE.BoxGeometry(halfW * 2, F.rail.h, F.rail.t);
    F.rails.forEach((y) => {
      const rail = inked(new THREE.Mesh(railGeo, railMat));
      rail.position.y = y;
      fence.add(rail);
    });
    // pickets: a rectangle with a pointed top, extruded into a slat, standing just in front of the rails
    if (F.pickets) {
      const P = F.picket,
        sh = new THREE.Shape();
      sh.moveTo(-P.w / 2, -F.sink);
      sh.lineTo(P.w / 2, -F.sink);
      sh.lineTo(P.w / 2, P.h - P.point);
      sh.lineTo(0, P.h);
      sh.lineTo(-P.w / 2, P.h - P.point);
      sh.closePath();
      const picketGeo = new THREE.ExtrudeGeometry(sh, {
        depth: P.t,
        bevelEnabled: false,
      }).translate(0, 0, F.rail.t / 2 + 0.01); // sits on the near face of the rails
      const pitch = P.w + P.gap,
        n = Math.floor((halfW * 2 - F.post.w) / pitch),
        x0 = -((n - 1) * pitch) / 2;
      for (let i = 0; i < n; i++) {
        const px = x0 + i * pitch;
        // skip any slat that would run into a post
        const nearPost = (px + halfW) % F.postSpacing;
        if (
          Math.min(nearPost, F.postSpacing - nearPost) <
          (F.post.w + P.w) / 2 + 0.02
        )
          continue;
        const picket = inked(new THREE.Mesh(picketGeo, railMat));
        picket.position.x = px;
        picket.rotation.z = wobble();
        fence.add(picket);
      }
    }
  }
  const nearFence = (px, pz) =>
    F.enabled &&
    Math.abs(pz - fence.position.z) < F.keepOff &&
    Math.abs(px - fence.position.x) < F.width / 2 + F.keepOff;
  return { fence, nearFence };
}


export { buildFence, FENCE };
