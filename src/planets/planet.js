// THE PLANETS, from the planets project: the generation and the Planet
// class, lifted whole out of its script.js (lines 456 to 1785) as a module.
// A Planet is stamped out of a species (SPECIES in worlds.js: earthlike,
// rocky, dwarf, tundra, ice, crystal, gas, star) and a seed: terrain
// sculpted by noise into color bands, water, haze, a corona for stars, a
// ring or belt, moons. `group` is its tray; call `update()` each frame for
// the spin and the moons' orbits. Three changes from the original: the
// tray is not added to a scene (the caller does that), `dispose()` lifts
// it out of wherever it was put, and the constructor takes a `palette`.
import * as THREE from "three";
import { SPECIES, BELT_SHAPE, RING_STYLES, MOON_SHAPE, ATMOSPHERE, PLANET_GEOMETRY, SHADING, ENV, WATER, SKY, STARS, SYSTEM, LIGHTS } from "./worlds.js";

// The earthlike's water mirrors the sky: the page hands in a cube map of
// its stars. None by default; the water then shows its tint alone.
let skyEnvMap = null;
export function setSkyEnvMap(map) { skyEnvMap = map; }

// ============================================================
// SHARED HELPERS — pure functions any planet can borrow.
// ============================================================

// Deterministic random — same seed, same sequence, every reload.
function seededRandom(seed) {
  // Scramble the seed before it ever reaches the generator.
  //
  // The LCG below is fine once it's running, but its first output
  // is a straight line through the seed — (a * seed + c) / 2³²,
  // no mixing yet — so neighboring seeds hand back near-identical
  // numbers. Seeds 8 and 22 differed by 0.005, close enough to
  // land in the same bucket for anything coarser than 200
  // outcomes: every planet rolled the same moon count.
  //
  // Burning off the first few outputs doesn't actually fix that.
  // Each step is affine, so eight steps compose into one more
  // affine step and the seed stays a straight line — just a
  // steeper one, which shuffles distant seeds while leaving
  // neighbors locked together (every even seed still agreed).
  // The shift-multiply-shift chain is the real repair: those
  // xor-shifts are non-linear, so a one-bit change in the seed
  // scatters across all 32 bits. Same seed still means the same
  // planet — this is a fixed scramble, not a fresh roll.
  let state = seed >>> 0;
  state ^= state >>> 16;
  state = Math.imul(state, 0x21f0aaad);
  state ^= state >>> 15;
  state = Math.imul(state, 0x735a2d97);
  state = (state ^ (state >>> 15)) >>> 0;

  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateNoise(seed, octaves) {
  function hash(x, y, z) {
    let n = (x * 15731 + y * 789221 + z * 1376312589 + seed * 2654435761) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 4294967295;
  }

  const fade = (t) => t * t * (3 - 2 * t); // smoothstep
  const lerp = (a, b, t) => a + (b - a) * t;

  function noise3(x, y, z) {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      zi = Math.floor(z);
    const u = fade(x - xi),
      v = fade(y - yi),
      w = fade(z - zi);
    return lerp(
      lerp(
        lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u),
        lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u),
        v,
      ),
      lerp(
        lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u),
        lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u),
        v,
      ),
      w,
    );
  }

  return function fbm(x, y, z) {
    let total = 0,
      amp = 1,
      freq = 1,
      max = 0;
    for (let o = 0; o < octaves; o++) {
      total += noise3(x * freq, y * freq, z * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / max; // normalized back to 0..1
  };
}

// `bands` arrive already resolved — each one carries a real
// THREE.Color rather than the role name written in worlds.js —
// so this stays a lookup instead of allocating a color object
// per triangle. See resolveBands().
//
// Hands back the INDEX rather than the band: the sculpt wants a
// color, the composition tally wants a slot to add to, and one
// walk down the list answers both.
function bandForHeight(height, bands) {
  for (let i = 0; i < bands.length; i++) {
    if (height > bands[i].above) return i;
  }
  // Unreachable while the last band sits at -Infinity, which
  // resolveBands doesn't enforce. Falling to the bottom band
  // beats handing the caller an undefined to crash on.
  return bands.length - 1;
}

function generateToonGradient() {
  const levels = new Uint8Array(SHADING.toonSteps);
  const gradient = new THREE.DataTexture(
    levels,
    levels.length,
    1,
    THREE.LuminanceFormat,
  );
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

// Built once, shared by every material in the whole system —
// the toon "look" is a property of the universe, not a planet.
const toonGradient = generateToonGradient();

// ============================================================
// SELF-LIT — the one species that lights itself.
//
// Every other body here is lit from outside: three.js measures
// the angle between a face and the sunlight, and that angle
// picks a step off the toon ramp. A star has no outside light —
// it IS the light — so that measurement has nothing to measure,
// which is exactly what the flat MeshBasicMaterial it used to
// wear looked like: a painted circle with no ball under it.
//
// What a star has instead is LIMB DARKENING. Look at the middle
// of the disc and you're staring straight down into the deep,
// hot photosphere. Look near the rim and the same line of sight
// enters the gas at a glancing angle and stops much higher up,
// where it's cooler, dimmer and redder. So the one angle that
// means anything on a star is the angle to the VIEWER:
//
//   mu = dot(the ball's outward direction, direction to camera)
//        1 in the middle of the disc, 0 at the rim
//
// Everything below is a function of that single number. Note
// what it implies: the bright middle is a property of where you
// are STANDING, not of where the star is facing. It doesn't
// turn with the surface. The granulation spins underneath a
// glow that stays pinned to the middle of the disc, which is
// the tell that you're looking at something lit from within
// rather than something with a day side.
//
// `glow` is the species' block of the same name; `palette`
// supplies the colors, by role, like everything else does.
// ============================================================

function selfLitMaterial(palette, glow) {
  return new THREE.ShaderMaterial({
    vertexColors: true, // declares `attribute vec3 color` for us
    uniforms: {
      rimColor: { value: new THREE.Color(palette[glow.rim]) },
      hotColor: { value: new THREE.Color(palette[glow.hot]) },
      curve: { value: glow.curve },
      cool: { value: glow.cool },
      heat: { value: glow.heat },
      steps: { value: glow.steps },
    },
    vertexShader: `
      varying vec3 vBand;
      varying float vMu;

      void main() {
        vBand = color;

        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

        // The BALL's outward direction, not the face normal.
        // Displacement here is purely radial, so normalizing the
        // vertex hands back the sphere direction it started on —
        // and that's the one we want: limb darkening is a
        // property of the star, not of the granulation bumps on
        // it. Face normals would scatter the ramp into confetti.
        vec3 outward = normalize(normalMatrix * normalize(position));

        // Camera sits at the origin in view space, so the way
        // back to it from this vertex is just -viewPosition.
        vMu = clamp(dot(outward, normalize(-viewPosition.xyz)), 0.0, 1.0);

        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 rimColor;
      uniform vec3 hotColor;
      uniform float curve;
      uniform float cool;
      uniform float heat;
      uniform float steps;

      varying vec3 vBand;
      varying float vMu;

      void main() {
        // Bend the falloff before anything is done with it. Real
        // limb darkening is nearly flat across most of the disc
        // and then dives at the very edge; an exponent under 1
        // is that shape in one character.
        float ramp = pow(vMu, curve);

        // Quantized, because everything else in this sky is. The
        // lit planets step through three levels across a
        // terminator; a star steps through a few rings from the
        // middle of the disc outward. Same idea, different thing
        // being measured. steps = 0 leaves it smooth.
        if (steps > 0.0) {
          ramp = min(floor(ramp * steps), steps - 1.0) / (steps - 1.0);
        }

        // One ramp, two directions off the color the band
        // painting already chose: toward the hot core color in
        // the middle of the disc, toward the cooler rim color
        // out at the edge. The painted band itself is what you
        // see in between, so the granulation stays legible the
        // whole way across instead of being washed out.
        vec3 hot = mix(vBand, hotColor, heat);
        vec3 cold = mix(vBand, rimColor, cool);

        gl_FragColor = vec4(mix(cold, hot, ramp), 1.0);
      }
    `,
  });
}

// The light that gets out PAST the surface. A back-side shell
// like the atmosphere's, but where an atmosphere is a fixed
// wash of color, a corona has a shape: brightest where it
// leaves the photosphere, thinning outward, and — the part a
// constant-opacity shell can't do — thinning by how far the
// LINE OF SIGHT passes from the star, not by where the shell's
// own surface happens to be.
//
// That distance has a name, the impact parameter: the closest
// the ray from the eye through this fragment ever comes to the
// star's center. |C x d| for a unit ray direction d, which is
// three multiplies and reads the same in any projection.
//
// `scale` is the planet tray's own, folded in because the
// arithmetic happens in view space, where the tray's scale has
// already been applied to everything it measures.
function coronaMaterial(palette, corona, innerRadius, scale) {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending, // can only ever ADD light
    side: THREE.BackSide, // the far hemisphere, so it reads as a rim
    depthWrite: false, // blend without claiming pixels
    uniforms: {
      color: { value: new THREE.Color(palette[corona.color]) },
      inner: { value: innerRadius * scale },
      outer: { value: corona.radius * scale },
      opacity: { value: corona.opacity },
      falloff: { value: corona.falloff },
    },
    vertexShader: `
      varying vec3 vViewPosition;
      varying vec3 vCenter;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewPosition.xyz;

        // Where the star itself is, in the same space. Constant
        // across every fragment; it rides in as a varying because
        // that's cheaper than keeping a uniform in sync.
        vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float inner;
      uniform float outer;
      uniform float opacity;
      uniform float falloff;

      varying vec3 vViewPosition;
      varying vec3 vCenter;

      void main() {
        // Camera is the origin in view space, so the ray through
        // this fragment is just its own position, normalized.
        vec3 ray = normalize(vViewPosition);

        // How near that ray passes the star's center.
        float distance = length(cross(vCenter, ray));

        // 0 where the glow leaves the surface, 1 where it runs
        // out. Rays closer in than the surface are hidden behind
        // the star anyway — the depth test has already dropped
        // them by the time this runs.
        float t = clamp((distance - inner) / (outer - inner), 0.0, 1.0);

        gl_FragColor = vec4(color, pow(1.0 - t, falloff) * opacity);
      }
    `,
  });
}

// The earthlike ocean's surface: a smooth shell floating just above
// the terrain mesh's own sea band (see the seaLevel clamp in
// sculptTerrain — every sea vertex already sits on the unit sphere,
// which is what makes a fixed-radius shell line up with the
// coastline at all). Written from scratch rather than layered onto
// a built-in material: the toon terrain shows through it, so it
// wants to be translucent, which none of three's stock materials
// do together with a fresnel mix.
//
// The fresnel term runs the opposite way from a mirror's: at
// grazing angles it still climbs toward `envMap`, same as any
// reflective surface, but head-on it settles on `minOpacity` of the
// sea's own palette color instead of vanishing — the read is
// "looking down into tinted water," not "looking through glass."
function waterMaterial(seaColor) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false, // the toon sea bed underneath must still show through
    uniforms: {
      tint: { value: new THREE.Color(seaColor) },
      envMap: { value: skyEnvMap }, // the sky's environment map, if a page sets one (setSkyEnvMap)
      fresnelPower: { value: WATER.fresnelPower },
      minOpacity: { value: WATER.minOpacity },
    },
    vertexShader: `
      varying vec3 vWaterNormal;
      varying vec3 vWaterWorldPos;

      void main() {
        vWaterNormal = normalize(mat3(modelMatrix) * normal);
        vWaterWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform samplerCube envMap;
      uniform float fresnelPower;
      uniform float minOpacity;

      varying vec3 vWaterNormal;
      varying vec3 vWaterWorldPos;

      void main() {
        vec3 normal = normalize(vWaterNormal);
        vec3 viewDir = normalize(cameraPosition - vWaterWorldPos);
        float fresnel = pow(
          1.0 - max(dot(viewDir, normal), 0.0),
          fresnelPower
        );
        vec3 reflection = textureCube(envMap, reflect(-viewDir, normal)).rgb;

        gl_FragColor = vec4(
          mix(tint, reflection, fresnel),
          mix(minOpacity, 1.0, fresnel)
        );
      }
    `,
  });
}

// Two-pass sculpt: displace by noise, then paint per triangle.
// `recipe` is the species' terrain (shape only); `bands` is that
// recipe's band list with this planet's palette already poured
// into it.
//
// Hands back how much of the world each band ended up covering,
// as fractions in the bands' own order — pass 2 is already
// deciding which band every triangle belongs to, so the tally
// costs one more addition per face and nothing has to walk the
// surface a second time to find out.
function sculptTerrain(geometry, recipe, bands, seed) {
  const noise = generateNoise(seed, recipe.octaves);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const heights = new Float32Array(position.count);
  // Latitude as a number: after normalize(), y IS the sine of the
  // latitude, -1 at the south pole to 1 at the north. Captured in
  // pass 1 because displacement is about to move the vertex.
  const latitudes = new Float32Array(position.count);

  // PASS 1 — displace
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    vertex.normalize();

    const height = noise(
      vertex.x * recipe.frequency,
      vertex.y * recipe.frequency,
      vertex.z * recipe.frequency,
    );
    heights[i] = height;
    latitudes[i] = vertex.y;

    // How far above the waterline this vertex sits.
    let lift = height - recipe.seaLevel;

    // Optional spike curve. Straight `lift` is linear, so ground
    // halfway up the range rises halfway — rolling hills. An
    // exponent bends that: normalize into 0..1 first, curve it,
    // then scale back, so the exponent changes the SHAPE without
    // also shrinking the range (0.5³ is 0.125, and skipping the
    // normalize would quietly flatten the whole planet). Full
    // height still maps to full height; everything under it gets
    // dragged toward the floor, which leaves peaks standing alone
    // as spires instead of as the tops of hills.
    //
    // Strictly opt-in: recipes without `sharpness` take the
    // original linear path, untouched.
    if (recipe.sharpness) {
      const span = 1 - recipe.seaLevel; // headroom above the waterline
      lift = Math.pow(lift / span, recipe.sharpness) * span;
    }

    // Cratered bodies displace BOTH ways. The sea-level path below
    // measures everything from a floor and can only ever push out,
    // so its lowest possible face is the bare sphere — fine for a
    // world where the flat parts are ocean, useless for one whose
    // whole character is holes. Centering the noise on 0.5 lets the
    // low half dig in as far as the high half stands out.
    // (`seaLevel` and `sharpness` don't apply here; a hole has no
    // waterline to be above.)
    const r =
      recipe.craters ?
        PLANET_GEOMETRY.radius * (1 + (height - 0.5) * recipe.amplitude)
        // Above sea level: push out. Below: clamp — the clamp IS
        // the ocean. (seaLevel: 0 → nothing clamps → no ocean.)
      : height > recipe.seaLevel ?
        PLANET_GEOMETRY.radius * (1 + lift * recipe.amplitude)
      : PLANET_GEOMETRY.radius;

    position.setXYZ(i, vertex.x * r, vertex.y * r, vertex.z * r);
  }

  // PASS 2 — color whole faces (3 consecutive vertices = 1
  // triangle after toNonIndexed; paint all corners the same)
  const colors = new Float32Array(position.count * 3);

  // Ground covered per band, in the bands' own order. Faces are
  // NOT interchangeable units here: an icosphere's triangles vary
  // by about half again in size between the middle of an original
  // face and the corners it was subdivided from, so counting them
  // would quietly over-report whatever landed near a corner.
  // Area is the honest measure, and it's three corners and a
  // cross product away.
  const coverage = new Float64Array(bands.length);
  const cornerA = new THREE.Vector3();
  const cornerB = new THREE.Vector3();
  const cornerC = new THREE.Vector3();

  for (let face = 0; face < position.count; face += 3) {
    const averageHeight =
      (heights[face] + heights[face + 1] + heights[face + 2]) / 3;

    // Which number the bands get compared against. Normally it's
    // the height — snow on top, sea at the bottom. Latitude
    // banding swaps in a value derived from WHERE the face sits.
    let key = averageHeight;
    if (recipe.banding === "latitude") {
      const y =
        (latitudes[face] + latitudes[face + 1] + latitudes[face + 2]) / 3;

      // Latitude alone would climb once from pole to pole and give
      // a single gradient. Feeding it through sin() makes it
      // OSCILLATE instead, so the same few band colors repeat as
      // stripes down the planet — bandCount sets how many times.
      // The noise then bends the stripe edges, which is the
      // difference between a beach ball and weather.
      key =
        (Math.sin(y * Math.PI * recipe.bandCount) + 1) / 2 +
        (averageHeight - 0.5) * recipe.swirl;
    }

    const band = bandForHeight(key, bands);
    const { color } = bands[band];
    for (let corner = 0; corner < 3; corner++) {
      colors[(face + corner) * 3 + 0] = color.r;
      colors[(face + corner) * 3 + 1] = color.g;
      colors[(face + corner) * 3 + 2] = color.b;
    }

    // Measured on the sphere the vertices started on, not on the
    // sculpted one. Displacement is purely radial, so normalizing
    // gives each corner's original direction back exactly, and
    // the triangle between those three directions is the patch of
    // world the face covers — which is what "20% snow" means.
    // Taking it off the displaced surface instead would count the
    // flanks of every spire and hand a jagged ice world twice the
    // ground of a smooth one.
    cornerA.fromBufferAttribute(position, face).normalize();
    cornerB
      .fromBufferAttribute(position, face + 1)
      .normalize()
      .sub(cornerA);
    cornerC
      .fromBufferAttribute(position, face + 2)
      .normalize()
      .sub(cornerA);
    // No halving: these are about to be divided by their own
    // total, and the 1/2 every triangle shares cancels out.
    coverage[band] += cornerB.cross(cornerC).length();
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const surface = coverage.reduce((total, area) => total + area, 0);
  return Array.from(coverage, (area) => area / surface);
}

// Moon sculpt — gentle two-way displacement (dents = craters).
// `surface` defaults to the moons' settings; the asteroid belt
// passes its own, since a rock wants far coarser, deeper lumps
// than a moon does.
function sculptMoonSurface(geometry, seed, surface = MOON_SHAPE.surface) {
  const noise = generateNoise(seed, surface.octaves);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i).normalize();
    const height = noise(
      vertex.x * surface.frequency,
      vertex.y * surface.frequency,
      vertex.z * surface.frequency,
    );
    const r = 1 + (height - 0.5) * surface.amplitude;
    position.setXYZ(i, vertex.x * r, vertex.y * r, vertex.z * r);
  }

  geometry.computeVertexNormals();
}

// ============================================================
// ROLLING A PLANET OUT OF A SPECIES
//
// A species describes a SET of planets; a seed picks one out of
// it. Everything the species left as a range gets decided here,
// once, before anything is built — so the rest of the code only
// ever sees settled numbers.
//
// The traits get their own dice stream (+4) alongside terrain
// (+0), moons (+1), torus rings (+2) and belts (+3). Separate
// streams mean retuning one part of a planet doesn't reshuffle
// the others: change the moon ranges and the palette a seed
// rolls stays exactly where it was.
// ============================================================

// Fold the species' name into its dice. Without this, every
// species with the same number of palettes maps seed → palette
// the same way: seed 12 would pick the third palette of the
// earthlikes AND the third of the gas giants. Fine while you're
// looking at one planet, obvious the moment a whole system is
// built off one seed and every world wears the same slot.
function nameOffset(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(hash ^ name.charCodeAt(i), 0x01000193); // FNV-ish
  }
  return hash >>> 0;
}

function rollTraits(spec, speciesName, seed) {
  const random = seededRandom(seed + 4 + nameOffset(speciesName));
  const between = (range) => range.min + random() * (range.max - range.min);
  const pick = (list) => list[Math.floor(random() * list.length)];

  const palette = pick(spec.palettes);
  // The species' weather, with anything the palette overrides
  // laid on top — a jungle earthlike and an arid one are the
  // same dials wearing different colors, and the colors are
  // the only thing that says which is the desert.
  const climate = { ...spec.climate, ...palette.climate };

  return {
    palette,
    // "none" is a legal entry in the pool, and repeats are the
    // weighting — see the `rings` note in worlds.js.
    ringStyle: pick(spec.rings),
    scale: between(spec.scale),
    tilt: between(spec.tilt),
    // `false` for a body that wears nothing; otherwise this
    // planet's own thickness, settled now.
    atmosphere: spec.atmosphere && {
      radius: between(spec.atmosphere.radius),
      opacity: between(spec.atmosphere.opacity),
    },
    // Rolled last on purpose: every draw above it keeps the
    // number it had before this existed, so adding weather to
    // the game didn't repaint a single planet.
    climate: {
      temperature: between(climate.temperature),
      rainfall: between(climate.rainfall),
    },
  };
}

// A terrain dial can be written two ways in worlds.js. A plain
// number is fixed for every planet of the species; { min, max }
// is rolled per planet. Add `whole: true` for a dial that has to
// land on a whole number.
//
// Anything that isn't a range passes through untouched, which is
// how `craters: true`, `banding: "latitude"` and the band list
// itself survive the walk.
function isRange(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.min === "number" &&
    typeof value.max === "number"
  );
}

function rollTerrain(recipe, random) {
  const rolled = {};
  for (const [key, value] of Object.entries(recipe)) {
    if (!isRange(value)) {
      rolled[key] = value;
    } else if (value.whole) {
      // Same fencepost as the moon count: floor() chops the
      // decimal and random() never reaches 1, so without the +1
      // `max` could never come up.
      rolled[key] =
        value.min + Math.floor(random() * (value.max - value.min + 1));
    } else {
      rolled[key] = value.min + random() * (value.max - value.min);
    }
  }
  return rolled;
}

// Pour a palette into a terrain's bands: role name in, color
// out. Done once per planet rather than once per triangle.
//
// This is also the guardrail on hand-written palettes. A band
// asking for a role the palette forgot would otherwise paint
// black faces with no explanation, so a missing color fails
// here, by name, the moment the planet is built.
function resolveBands(terrain, speciesName, palette) {
  return terrain.bands.map((band) => {
    const hex = palette[band.role];
    if (!hex) {
      throw new Error(
        `species "${speciesName}": palette "${palette.name}" has no colour ` +
          `for the role "${band.role}"`,
      );
    }
    // The role name rides along with the color it resolved to —
    // the sculpt only ever reads `color`, but the survey panel
    // lists the palette back out by name.
    return { above: band.above, role: band.role, color: new THREE.Color(hex) };
  });
}

// Run once at load, over every species — not per planet. Both of
// these are mistakes you make while designing a world, and both
// would otherwise stay hidden until exactly the wrong seed came
// up, months later.
function validateSpecies() {
  for (const [name, spec] of Object.entries(SPECIES)) {
    const terrain = spec.terrain;

    // A cratered body displaces inward as well as out:
    // r = 1 + (height - 0.5) * amplitude, and the noise reaches 0.
    // At amplitude 2 the floor passes through the center of the
    // planet and the geometry turns itself inside out.
    if (terrain.craters) {
      const deepest =
        isRange(terrain.amplitude) ? terrain.amplitude.max : terrain.amplitude;
      if (deepest >= 2) {
        throw new Error(
          `species "${name}": a cratered body turns inside out at ` +
            `amplitude 2, and this one can reach ${deepest}`,
        );
      }
    }

    // Every palette, not just whichever one today's seed rolled.
    for (const palette of spec.palettes) {
      resolveBands(terrain, name, palette);

      // Weather is the one part of a world with no visible
      // symptom: a missing range doesn't draw wrong, it throws
      // inside a dice roll on whichever seed first picks this
      // palette. Cheaper to find it here, by name.
      const climate = { ...spec.climate, ...palette.climate };
      for (const dial of ["temperature", "rainfall"]) {
        if (!isRange(climate[dial])) {
          throw new Error(
            `species "${name}": palette "${palette.name}" has no ` +
              `${dial} range, and the species declares none either`,
          );
        }
      }
    }
  }
}

// The colors for the small lit things a planet owns — its moons
// and its ring rocks — when its palette doesn't name a list of
// its own. Taken from the planet's own ground, so a body that
// grows rings later can never come out wearing another species'
// colors.
//
// Minus the darkest band: a ring rock is a lit object seen
// against a black sky, and the shade meant for the bottom of a
// crevasse reads as a hole punched in the belt rather than as a
// rock. Never fewer than two, or the swarm flattens into one
// mass where the rocks overlap.
function litColors(bands) {
  const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const bright = [...bands].sort(
    (a, b) => luminance(b.color) - luminance(a.color),
  );
  return bright.slice(0, Math.max(2, bright.length - 1)).map((b) => b.color);
}

// Everything a world IS before anything is built out of it: how
// big, what color, what shape its ground takes. Every one of
// these is a pure function of (species, seed), so asking twice
// costs a few throws of a seeded generator and can't disagree
// with itself — which is what lets the index name and color all
// eight worlds of a system while only one of them exists.
function rollWorld(species, seed) {
  const spec = SPECIES[species];
  if (!spec) throw new Error(`unknown species: ${species}`);

  // Every range the species declared, now a single number.
  const traits = rollTraits(spec, species, seed);

  // The ground gets its own dice stream (+5), separate from the
  // traits' (+4). Terrain ranges are the ones you'll be tuning
  // most, and sharing a stream would mean every nudge to an
  // amplitude reshuffled which palette each seed wears.
  const terrain = rollTerrain(
    spec.terrain,
    seededRandom(seed + 5 + nameOffset(species)),
  );

  return {
    spec,
    traits,
    terrain,
    bands: resolveBands(terrain, species, traits.palette),
  };
}

// The one color that stands for a world. The most SATURATED
// band, not the brightest or the darkest: nearly every palette
// tops out at a near-white highlight and bottoms out at a
// near-black floor, so ranking by brightness at either end hands
// back eight worlds that look the same. The saturated band is the
// one actually carrying the hue — the taiga's lake, the citrine's
// vein, the temperate's sea.
//
// Measured as chroma over the brightest channel — NOT with
// getHSL(). HSL saturation is relative to how much room is left
// at a given lightness, which makes a barely-tinted white like
// the citrine's #FFFBEC come back fully saturated, and every
// palette here tops out in exactly that kind of color.
function accentOf(bands) {
  let accent = bands[0].color;
  let strongest = -1;
  for (const { color } of bands) {
    const peak = Math.max(color.r, color.g, color.b);
    const chroma =
      peak === 0 ? 0 : (peak - Math.min(color.r, color.g, color.b)) / peak;
    if (chroma > strongest) {
      strongest = chroma;
      accent = color;
    }
  }
  return accent;
}

// ============================================================
// PLANET — the blueprint. `new Planet({...})` stamps out one
// complete, self-contained planet on its own tray (Group).
//
//   species: any name on the SPECIES menu ("earthlike", "gas")
//   seed:    which planet of that species you get
// ============================================================

class Planet {
  constructor({
    species = "earthlike",
    seed = 9, // this planet's fingerprint
    position = { x: 0, y: 0, z: 0 },
    // How finely the ground is subdivided. A dial rather than a
    // constant because the solar system draws eight of these at a
    // third of a unit wide, where full detail is invisible and
    // expensive — see SYSTEM.detail.
    detail = PLANET_GEOMETRY.detail,
    // A multiplier on the size the species rolled. Taken here
    // rather than applied to the finished tray from outside,
    // because the tray's scale is not the only place the number
    // is spent: the corona bakes its falloff in world units
    // (see coronaMaterial) and would go on glowing at full size
    // around a body shrunk after the fact.
    scale = 1,
    palette = null,
  } = {}) {
    // Order off the menu by name. The bouncer: a typo'd species
    // fails HERE with a sentence, not three functions later with
    // a mystery.
    const spec = SPECIES[species];
    if (!spec) throw new Error(`unknown species: ${species}`);

    this.species = species;
    this.spec = spec;
    this.seed = seed;
    this.detail = detail;

    const rolled = rollWorld(species, seed);
    // (added for the library) `palette` names one of the species' palettes
    // to wear instead of the one the seed rolled
    if (palette) {
      const wanted = spec.palettes.find((p) => p.name === palette);
      if (wanted) {
        rolled.traits.palette = wanted;
        rolled.bands = resolveBands(rolled.terrain, species, wanted);
      }
    }
    this.traits = rolled.traits;
    this.traits.scale *= scale;
    this.palette = this.traits.palette;
    this.terrain = rolled.terrain;
    this.bands = rolled.bands;

    // The tray. Children are positioned relative to it, so the
    // math inside never cares where the planet sits in space.
    this.group = new THREE.Group();
    this.group.position.set(position.x, position.y, position.z);

    // Size lives on the OUTER tray, so one number takes the ground,
    // the air, the ring, and the moon orbits with it. Scaling
    // anything further in would resize the planet while leaving its
    // ring and moons where they were.
    this.group.scale.setScalar(this.traits.scale);

    // The BODY — a second, tilted tray inside the first. Ground,
    // haze, and ring ride on it, so they all lean together and
    // the ring inherits the tilt for free. Moons stay on the
    // outer tray: they already roll their own orbital tilts.
    //
    // Why a separate tray instead of tilting the mesh itself?
    // The spin. An object's rotation.y and rotation.z aren't
    // independent dials — they combine, and a spinning object
    // that also holds a lean ends up swinging its lean around
    // as it turns, like a wobbling top. Splitting them fixes
    // it: the PARENT holds the lean (set once, never touched),
    // the CHILD spins around its own y — which, seen from
    // outside, is now a leaned axle. Same pivot trick as the
    // moons, pointed at a new problem.
    this.body = new THREE.Group();
    this.body.rotation.z = THREE.MathUtils.degToRad(-this.traits.tilt);
    this.group.add(this.body);

    // Everything that swings around this planet on a pivot —
    // moons and belt rocks alike. They animate identically, so
    // they share one list and one loop in update().
    this.orbiters = [];

    // Settled by buildMoons() and buildRing() when the species
    // keeps any. Stated here so a bare, solitary body still has
    // numbers to report rather than a pair of undefineds.
    this.numMoons = 0;
    this.ringPieces = 0;

    this.buildTerrain();
    this.buildWater();
    this.buildAtmosphere();
    this.buildCorona();
    if (this.traits.ringStyle !== "none") this.buildRing();
    if (this.spec.moons.max > 0) this.buildMoons();

    // (the page added the tray to its scene here; whoever builds a Planet adds `group` where it wants it)
  }

  buildTerrain() {
    const recipe = this.terrain;

    const geometry = new THREE.IcosahedronGeometry(
      PLANET_GEOMETRY.radius,
      this.detail,
    ).toNonIndexed(); // unshare vertices → crisp facets

    // What the ground turned out to be made of, band by band —
    // only knowable once the noise has been rolled out over the
    // sphere, so it comes back from the sculpt rather than from
    // the recipe.
    this.composition = sculptTerrain(geometry, recipe, this.bands, this.seed);

    // How far the ground actually ended up reaching, measured off
    // the sculpted vertices rather than predicted from the recipe.
    // Worth taking here: the same amplitude means something
    // different on a cratered body, a sharpened one and a plain
    // one, and re-deriving that arithmetic outside sculptTerrain
    // is how the two quietly drift apart. See boundingRadius.
    geometry.computeBoundingSphere();
    this.rimRadius = geometry.boundingSphere.radius;

    // Lit bodies get the shared toon gradient — a light shines on
    // them and three.js steps the result. Self-lit ones light
    // themselves: same painted bands underneath, but the ramp
    // across them is driven by the line of sight rather than by
    // a sun that isn't there. See the self-lit section above.
    // Both honour vertexColors, so the sculpt and the band
    // painting are identical regardless of which material draws
    // it.
    this.mesh = new THREE.Mesh(
      geometry,
      recipe.unlit ?
        selfLitMaterial(this.palette, this.spec.glow)
      : new THREE.MeshToonMaterial({
          vertexColors: true,
          gradientMap: toonGradient,
        }),
    );

    // Spin flattening. Scaled on the MESH rather than the body so
    // the ring and the haze stay circular around a squashed
    // planet, which is what a real oblate giant looks like.
    if (recipe.oblateness) this.mesh.scale.y = recipe.oblateness;

    this.body.add(this.mesh);
  }

  // Only earthlike, for now — the request that started this was
  // scoped to "the water on the earthlike planet," and tundra/ice
  // both use their `sea` band for frozen ground, which a shiny wet
  // shell would misrepresent. Nothing stops another species from
  // opting in later; see WATER's own comment for why the radius is
  // safe to reuse as-is.
  buildWater() {
    if (this.species !== "earthlike") return;

    this.water = new THREE.Mesh(
      new THREE.IcosahedronGeometry(WATER.radius, WATER.detail),
      waterMaterial(this.palette.sea),
    );
    this.body.add(this.water);
  }

  buildAtmosphere() {
    // `atmosphere: false` on the species opts out entirely — an
    // airless rock wants nothing around it.
    if (!this.traits.atmosphere) return;

    const recipe = this.terrain;
    const { radius, opacity } = this.traits.atmosphere;
    // Color comes from the palette like every other color does,
    // so an arid earthlike gets a dusty halo and a jungle one a
    // green cast, off the same species.
    const color = this.palette.air ?? ATMOSPHERE.color;
    const layers = ATMOSPHERE.layers;

    // A tray for the stack, so the whole atmosphere is still one
    // thing to squash and to throw away.
    this.haze = new THREE.Group();

    // Squash the air to match the ground. On an oblate planet a
    // spherical shell leaves a much wider gap at the poles than at
    // the equator — 1.7x on the gas giant — so the halo reads as a
    // tall egg around a flat planet. Sharing the oblateness keeps
    // the band even the whole way round.
    if (recipe.oblateness) this.haze.scale.y = recipe.oblateness;

    // Innermost shell starts partway out from the surface; the rest
    // step evenly from there to `radius`.
    const inner = 1 + (radius - 1) * ATMOSPHERE.innerRatio;

    for (let i = 0; i < layers; i++) {
      const t = layers === 1 ? 1 : i / (layers - 1);
      const shellRadius = inner + (radius - inner) * t;

      // Three deliberate choices on the material, each one fixing a
      // way this shell can turn into a gray smudge instead of air.
      //
      // BASIC, not toon: a lit material shades its unlit half dark,
      // and a dark half over a near-black sky is exactly the dirty
      // halo we don't want. Basic ignores lights and stays the one
      // color we asked for.
      //
      // ADDITIVE blending: a shell can only ever ADD light to what
      // it covers, never subtract. Normal blending mixes toward the
      // haze color, which over dark sky means mixing toward gray.
      // It's also what makes the nesting sum cleanly.
      //
      // BACK side: draw only the hemisphere BEHIND the planet, so
      // it reads as a rim glowing out past the silhouette rather
      // than a film laid over the terrain.
      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(shellRadius, ATMOSPHERE.detail),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: opacity / layers, // they add back up near the surface
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false, // blend without claiming pixels
        }),
      );

      this.haze.add(shell);
    }

    this.body.add(this.haze);
  }

  // A star's air, in the sense that it has any: the light that
  // escapes past the photosphere. Only a self-lit species keeps
  // one, and only if its `glow` block names the shape — everyone
  // else falls straight out and wears buildAtmosphere's shells
  // instead. The two never both run: the species that has a
  // corona declares `atmosphere: false`.
  buildCorona() {
    const corona = this.spec.glow?.corona;
    if (!corona) return;

    // Starts at the SILHOUETTE, not at radius 1. The granulation
    // pushes the surface out past the sphere it was cut from, and
    // a glow that began underneath that would leave a hard dark
    // seam around the edge of the disc.
    this.corona = new THREE.Mesh(
      new THREE.IcosahedronGeometry(corona.radius, ATMOSPHERE.detail),
      coronaMaterial(this.palette, corona, this.rimRadius, this.traits.scale),
    );

    this.body.add(this.corona);
  }

  buildRing() {
    const recipe = RING_STYLES[this.traits.ringStyle];
    if (!recipe)
      throw new Error(`unknown ring style: ${this.traits.ringStyle}`);

    // Whatever colors the palette named, or its own ground if it
    // named none. A ring is part of the planet's outfit, so it
    // comes from the same drawer either way.
    this.ringColors = this.palette.ring ?? litColors(this.bands);

    if (recipe.style === "belt") this.buildBelt(recipe);
    if (recipe.style === "torus") this.buildTorusRing(recipe);

    // How many pieces it came out as — rocks in a belt, bands in
    // a torus. Counted after the fact rather than taken from the
    // recipe, because neither builder can promise its count in
    // advance: the torus stops early when it runs out of room.
    this.ringPieces = this.ring.children.length;
  }

  buildBelt(recipe) {
    // Its own dice stream: terrain +0, moons +1, torus rings +2,
    // belt +3. Same seed, same swarm, every reload.
    const random = seededRandom(this.seed + 3);
    const between = (range) => range.min + random() * (range.max - range.min);

    // A tray to hang the swarm on, so it disposes and leans as one
    // thing even though every rock moves independently.
    this.ring = new THREE.Group();

    const count =
      recipe.count.min +
      Math.floor(random() * (recipe.count.max - recipe.count.min + 1));

    for (let i = 0; i < count; i++) {
      const distance = between(recipe.distance);
      const size = between(recipe.size);

      // Every rock is its own tiny moon: a pivot it swings around,
      // and a tumble of its own. Rolling the spin signed means
      // roughly half of them tumble backwards.
      const config = {
        speed: recipe.speedScale / Math.pow(distance, 1.5), // Kepler-ish
        spin: (random() * 2 - 1) * recipe.spinScale,
      };

      const pivot = new THREE.Object3D();
      pivot.rotation.z = THREE.MathUtils.degToRad(between(recipe.tilt));
      pivot.rotation.y = random() * Math.PI * 2; // scatter the start angles

      // Low detail on purpose. A rock this small wants a handful of
      // big flat facets, and it means 70 of them cost less than one
      // moon at the moons' subdivision level.
      const geometry = new THREE.IcosahedronGeometry(
        1,
        recipe.surface.detail,
      ).toNonIndexed();
      sculptMoonSurface(
        geometry,
        Math.floor(random() * 1e6), // each rock lumps differently
        recipe.surface,
      );

      const rock = new THREE.Mesh(
        geometry,
        new THREE.MeshToonMaterial({
          color: this.ringColors[Math.floor(random() * this.ringColors.length)],
          gradientMap: toonGradient,
        }),
      );

      // Irregular height AND width: three independent stretch rolls
      // rather than one uniform scale, so no two rocks share a
      // silhouette even before the sculpt gets to them.
      rock.scale.set(
        size * between(recipe.stretch),
        size * between(recipe.stretch),
        size * between(recipe.stretch),
      );

      // Random resting orientation, which also aims the stretch
      // somewhere different on every rock.
      rock.rotation.set(
        random() * Math.PI * 2,
        random() * Math.PI * 2,
        random() * Math.PI * 2,
      );

      rock.position.set(distance, between(recipe.height), 0);

      pivot.add(rock);
      this.ring.add(pivot);
      this.orbiters.push({ pivot, mesh: rock, config });
    }

    // Built flat, no rotation of its own — it sits on the
    // tilted body, so it inherits the planet's lean.
    this.body.add(this.ring);
  }

  buildTorusRing(recipe) {
    // A torus is a clock walk of clock walks: walk the big
    // circle, and at every stop sweep a TINY circle of
    // vertices around the path, then stitch neighbors together
    // with triangles. three.js does the double loop for us.
    //
    // One of those per band, nested. `this.ring` is a tray rather
    // than a single mesh so the whole stack stays one thing to
    // lay down, to lean, and to throw away.
    this.ring = new THREE.Group();

    // Gotcha: three.js builds the torus STANDING UP, a wheel
    // facing the camera (xy-plane). Lay the tray down 90° so the
    // bands wrap the equator like the dots do — once for the
    // stack, not once per band. The planet's tilt still stacks
    // on top via the body tray.
    this.ring.rotation.x = Math.PI / 2;

    // The rings get their own dice stream (+2), separate from the
    // terrain's (+0) and the moons' (+1), so retuning one doesn't
    // reshuffle the others. Same planet seed, same rings, always.
    const random = seededRandom(this.seed + 2);
    const between = (range) => range.min + random() * (range.max - range.min);

    // Roll the system's extent first, then walk outward through
    // it: band, gap, band, gap. `count` is a ceiling rather than a
    // promise — if the next band would spill past the outer edge
    // the system just stops there, and that early stop is a lot of
    // what makes one planet's rings read differently from another's.
    const count =
      recipe.count.min +
      Math.floor(random() * (recipe.count.max - recipe.count.min + 1));
    const systemOuter = between(recipe.outer);

    let cursor = between(recipe.inner);
    let previousColor = -1;

    for (let i = 0; i < count; i++) {
      if (i > 0) cursor += between(recipe.gap); // no gap before the first
      const width = between(recipe.width);
      if (cursor + width > systemOuter) break; // out of room; system ends

      const band = { inner: cursor, outer: cursor + width };
      cursor = band.outer;

      // Nudge a repeat off its neighbor. Two touching bands in
      // the same color read as one wide band with a slot cut into
      // it, which throws away the layering we came here for.
      let colorIndex = Math.floor(random() * this.ringColors.length);
      if (colorIndex === previousColor) {
        colorIndex = (colorIndex + 1) % this.ringColors.length;
      }
      previousColor = colorIndex;

      // TorusGeometry wants a centerline and a tube radius, but a
      // band is laid out by its edges. Midpoint and half-width
      // convert between the two.
      const geometry = new THREE.TorusGeometry(
        (band.inner + band.outer) / 2, // the big circle
        (band.outer - band.inner) / 2, // the tiny swept circle
        recipe.radialSegments, // roundness of the tube
        recipe.tubularSegments, // steps around the big walk
      );

      const opacity = between(recipe.opacity);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshToonMaterial({
          color: this.ringColors[colorIndex],
          gradientMap: toonGradient, // family style — lit like everything else
          // Still conditional: set opacity's range to 1..1 and the
          // bands drop back into the opaque pass. Transparency
          // moves a mesh into a separately sorted pass, worth
          // skipping for anything that doesn't need it.
          transparent: opacity < 1,
          opacity,
        }),
      );

      // Press the tube flat. A band's width can't do this on its
      // own — that's the tube's radius, so narrowing it thins the
      // band in every direction at once and you get a wire hoop,
      // not a CD. Flatness squashes ONE axis: the torus is built
      // in its local xy-plane, so local z is the one poking out
      // through the band's face. Squash z and the tube keeps its
      // radial width while losing its depth. Scale runs before
      // the tray's rotation, so this stays local z even though
      // the band ends up lying flat in the world.
      mesh.scale.z = recipe.flatness;

      this.ring.add(mesh);
    }

    this.body.add(this.ring);
  }

  buildMoons() {
    // Derived from the planet's own seed (+1 so the moons
    // don't mirror the terrain's dice rolls) — every planet
    // gets its own personal moon family.
    const random = seededRandom(this.seed + 1);
    const between = (range) => range.min + random() * (range.max - range.min);

    // How many moons is the SPECIES' business — an earthlike is
    // defined partly by never being alone, a dwarf by never
    // holding on to anything. Everything about the individual
    // moon below is shared across the system.
    const allowed = this.spec.moons;
    const colors = this.palette.moon ?? litColors(this.bands);

    // Whole numbers need different dice than `between`: floor()
    // chops the decimal, and the +1 is a fencepost — random() is
    // always < 1, so without it, max could never be rolled.
    this.numMoons =
      allowed.min + Math.floor(random() * (allowed.max - allowed.min + 1));

    for (let i = 0; i < this.numMoons; i++) {
      // Scaled at ROLL time, not on the mesh afterwards, so
      // everything derived from radius follows — notably the spin
      // rate below, which is meant to track how big a moon
      // actually looks. Multiplying the result rather than the
      // range keeps the dice sequence identical, so a seed's moons
      // stay in the same places and only change size.
      const radius = between(MOON_SHAPE.radius) * allowed.scale;
      const distance = between(MOON_SHAPE.distance);
      const retrograde = random() < MOON_SHAPE.retrogradeChance;
      const direction = retrograde ? -1 : 1;

      const config = {
        radius,
        distance,
        tilt: between(MOON_SHAPE.tilt),
        retrograde,
        // small whirl, big lumber
        spin: (direction * MOON_SHAPE.spinScale) / radius,
        startAngle: random() * 360,
        // Kepler-ish: farther = slower, 3/2 power
        speed: (direction * MOON_SHAPE.speedScale) / Math.pow(distance, 1.5),
        color: colors[Math.floor(random() * colors.length)],
      };

      // The pivot trick — but the pivot goes on the planet's
      // TRAY, not the scene. Move the planet, the whole orbit
      // comes along.
      const pivot = new THREE.Object3D();
      pivot.rotation.z = THREE.MathUtils.degToRad(config.tilt);
      pivot.rotation.y = THREE.MathUtils.degToRad(config.startAngle);

      const moonGeometry = new THREE.IcosahedronGeometry(
        1,
        MOON_SHAPE.surface.detail,
      ).toNonIndexed();
      sculptMoonSurface(moonGeometry, Math.floor(random() * 1e6));

      const moon = new THREE.Mesh(
        moonGeometry,
        new THREE.MeshToonMaterial({
          color: config.color,
          gradientMap: toonGradient,
        }),
      );
      moon.scale.setScalar(config.radius);
      moon.position.x = config.distance;

      pivot.add(moon);
      this.group.add(pivot);
      this.orbiters.push({ pivot, mesh: moon, config });
    }
  }

  // The silhouette, in world units: the tallest peak or the
  // outside of the air, whichever wins, taken up by the tray's
  // own scale. Rings and moons sit outside it on purpose — this
  // is the edge of the BODY, which is what the callout points at.
  get boundingRadius() {
    const air = this.traits.atmosphere ? this.traits.atmosphere.radius : 0;
    return Math.max(this.rimRadius, air) * this.traits.scale;
  }

  // Called once per frame — the planet animates ITSELF. The
  // solar system loop just calls update() on everyone.
  update() {
    this.mesh.rotation.y += 0.01;
    for (const { pivot, mesh, config } of this.orbiters) {
      pivot.rotation.y += config.speed; // the orbit
      mesh.rotation.y += config.spin; // its own day, or its tumble
    }
  }

  // Full teardown: off the scene, and every geometry/material
  // this planet owns gets freed from GPU memory. traverse()
  // visits the tray and every child on it, however nested.
  dispose() {
    this.group.removeFromParent();
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

// ============================================================

// The star field: STARS.count little icosahedra, self-lit, scattered in a
// shell between STARS.shell.inner and .outer (from the project's script.js).
function generateStars() {
  const starGeometry = new THREE.IcosahedronGeometry(1, STARS.detail);
  const starMaterial = new THREE.MeshBasicMaterial({
    color: STARS.color, // self-lit: ignores lights entirely
  });
  const stars = new THREE.InstancedMesh(
    starGeometry,
    starMaterial,
    STARS.count,
  );

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (let i = 0; i < STARS.count; i++) {
    position
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize()
      .multiplyScalar(
        STARS.shell.inner +
          Math.random() * (STARS.shell.outer - STARS.shell.inner),
      );

    const size =
      STARS.size.min + Math.random() * (STARS.size.max - STARS.size.min);
    scale.set(size, size, size);

    matrix.compose(position, rotation, scale);
    stars.setMatrixAt(i, matrix);
  }
  return stars;
}

export { generateStars, Planet, rollWorld, rollTraits, seededRandom, generateNoise, toonGradient, accentOf };
