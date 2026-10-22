// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the
// export line below is the only change.

// ---------- clay: the dollies' thumbed-plasticine lumps ----------
// Loaded after palette.js, before blob.js and space.js. Everything in 3d-storybook was modeled in lumpy clay:
// its surfaces are pushed in and out by one bump field so a ball reads as a thumbed lump rather than a sphere.
// This is that field (their "bumpiness" texture: renderGrid/utils.js and presets/materials/textures.js),
// ported here for the blob's skin and the moon in space.js, so they are the same stock as the dolls.
//   clayLumps(b, nx, ny, nz)  how far the surface stands off the smooth shape in unit direction (nx, ny, nz),
//     as a share of its radius (either way), for a field `b` of
//       amplitude   how far the lumps stand out, as a share of the radius (the dolls' is 0.08 at full dial)
//       frequency   how many lumps across (the dolls' walks from 7.5 down to 4.5 as the dial goes up)
//       roughness   how much the finer lumps show against the broad ones (0 to 1)
//       octaves     how many layers of finer lumps on top of the broad ones
//       warp        how far the lumps wander off the field's lattice, so they do not read as machined
//       seed        which lumps
// value noise on a fixed lattice, in octaves, pushed through itself a little so the lumps wander rather than sit
// on the lattice
const clayLumps = (() => {
  const f = (n) => n - Math.floor(n),
    lerp = (a, b, t) => a + (b - a) * t;
  function hash(x, y, z) {
    let px = f(x * 0.3183099 + 0.71) * 17,
      py = f(y * 0.3183099 + 0.113) * 17,
      pz = f(z * 0.3183099 + 0.419) * 17;
    return f(px * py * pz * (px + py + pz));
  }
  function noise(x, y, z) {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z),
      fx = x - ix,
      fy = y - iy,
      fz = z - iz,
      ux = fx * fx * (3 - 2 * fx),
      uy = fy * fy * (3 - 2 * fy),
      uz = fz * fz * (3 - 2 * fz),
      c = (dx, dy, dz) => hash(ix + dx, iy + dy, iz + dz);
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), ux), lerp(c(0, 1, 0), c(1, 1, 0), ux), uy),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), ux), lerp(c(0, 1, 1), c(1, 1, 1), ux), uy),
      uz,
    );
  }
  function fbm(x, y, z, octaves, gain) {
    let sum = 0,
      amp = 1,
      norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(x, y, z);
      norm += amp;
      x *= 2.03;
      y *= 2.03;
      z *= 2.03;
      amp *= gain;
    }
    return (sum / (norm || 1)) * 2 - 1;
  }
  // how far the surface stands off the smooth ball at a direction, as a share of the radius
  return (b, nx, ny, nz) => {
    let x = nx * b.frequency + b.seed,
      y = ny * b.frequency + b.seed * 1.7,
      z = nz * b.frequency + b.seed * 2.3;
    const w = b.warp,
      wx = fbm(x + 5.2, y + 1.3, z + 9.1, 2, 0.5),
      wy = fbm(x + 3.7, y + 8.4, z + 2.8, 2, 0.5),
      wz = fbm(x + 6.1, y + 4.9, z + 7.5, 2, 0.5);
    return b.amplitude * fbm(x + wx * w, y + wy * w, z + wz * w, b.octaves, b.roughness);
  };
})();

export { clayLumps };
