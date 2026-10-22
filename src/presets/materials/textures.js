import { nFbm, lerp } from "../../renderGrid/utils.js";

// What a clay surface is like underneath — smooth, or pinched and thumbed.
// One field (the lumps noise everything was built on) and one dial, `amount`,
// walking every curve below; a preset states what differs.
export const textureDefaults = {
  amount: [0.15, 0.5],
  // Icosphere subdivisions. The finest noise a mesh can hold rides on this —
  // see bumpMaxFreqFor() — so it is a property of the texture, not the mesh.
  detail: 14,
  amplitude: 0.055,
  scale: [7.5, 4.5],
  roughness: 0.1,
  octaves: 2,
  warp: 1.6,
  relief: 0.4,
};
export const textures = {
  smooth: { amount: 0 },
  // Thumbed plasticine: the swell of a surface pressed into shape by hand.
  bumpiness: { amplitude: 0.08, relief: 1 },
};

// ============================================================ vertex displacement
// The finest noise a mesh can hold, as a frequency. Vertices on a unit head
// sit about `spacing` apart, and a wave needs two of them to exist at all, so
// anything above this is sampled below Nyquist and comes back as sparkle
// rather than as texture. bumpAt() stops stacking octaves here, which is what
// lets `scale` and `octaves` be turned up freely: past this point the dials
// stop adding rather than start lying.
//
// A function of the mesh rather than a constant, because `detail` is a
// property of the TEXTURE preset. The answer is stored on the bump config at
// draw time; see bumpFrom().
function bumpMaxFreqFor(detail) {
  const verts = 10 * (detail + 1) ** 2 + 2;
  return Math.PI / Math.sqrt((4 * Math.PI) / verts);
}

// How far the skin stands off the smooth surface at one direction on the head.
// Lives here rather than in the mesh pass because EVERYTHING has to agree on
// where the surface is: place the features against the smooth sphere and
// displace only the skin, and a deep enough bump swallows the mouth. Read
// through the deformer instead and the eyes, nose, cheeks and lip all ride the
// lumps with the rest of the head.
//
// Sampled at the UNDEFORMED direction, so the bumps are a property of the skin
// and stay put when the silhouette bands move underneath them.
function bumpAt(b, nx, ny, nz) {
  if (!b || b.amplitude <= 0) return 0;
  const s = b.detail;
  let x = nx * s + b.seed,
    y = ny * s + b.seed * 1.7,
    z = nz * s + b.seed * 2.3;
  // A little of the field pushed through its own coordinates first. Without it
  // the lumps sit on the lattice and read as machined; with it they wander.
  if (b.warp > 0) {
    const w = b.warp;
    const wx = nFbm(x + 5.2, y + 1.3, z + 9.1, 2, 0.5);
    const wy = nFbm(x + 3.7, y + 8.4, z + 2.8, 2, 0.5);
    const wz = nFbm(x + 6.1, y + 4.9, z + 7.5, 2, 0.5);
    x += wx * w;
    y += wy * w;
    z += wz * w;
  }
  // Every octave doubles the frequency, so this is how many of them fit under
  // the mesh's own ceiling before they stop resolving. The layers it drops
  // were finer than the mesh, and were only ever going to shimmer. The ceiling
  // rides the config because the mesh does: see bumpFrom().
  const usable = Math.floor(Math.log(b.maxFreq / s) / Math.log(2.03)) + 1;
  const octaves = Math.max(1, Math.min(b.octaves, usable));
  return b.amplitude * nFbm(x, y, z, octaves, b.roughness);
}

// One preset plus one dial into the numbers the noise field wants. `tex` is a
// texture preset over textureDefaults; everything a preset states as a curve
// of `amount` is resolved here, so the field arrives at bumpAt() as plain
// numbers and the deformer never has to know a preset existed.
function bumpFrom(amount, seed, tex) {
  return {
    amount,
    // Depth does nearly all the visible work, so it carries the dial almost
    // alone. 0 here is what switches the field off in bumpAt().
    amplitude: tex.amplitude * amount,
    // The field's frequency, walked across its band by the same dial.
    detail: lerp(tex.scale[0], tex.scale[1], amount),
    roughness: tex.roughness,
    octaves: tex.octaves,
    warp: tex.warp,
    // Clearance for the features, scaled with the lumps they sit among so it
    // stays proportional as the dial moves. See featurePoint().
    relief: tex.relief * amount,
    // What this mesh can resolve. Stored rather than looked up, because by the
    // time bumpAt() runs there is no way back to the preset that chose it.
    maxFreq: bumpMaxFreqFor(tex.detail),
    seed,
  };
}

export { bumpAt, bumpFrom };
