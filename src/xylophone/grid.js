// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { glowTexture } from "./mushrooms.js";

// ---------- the cyber grid: the handheld's world ----------
// Loaded after palette.js and mushrooms.js (for glowTexture), before script.js. In place of the meadow: a dark
// green floor ruled with glowing green grid lines that fade out toward its edge, under a dome of square pixels
// glowing round its foot, with green pixel rain falling down it as the notes are played. Big enough
// that the camera never leaves it. The lines and the dome are drawn unlit and outside the haze, so they glow
// the same whatever the lights do. Every note played sends up a 3D neon bar in its color (see-through glowing
// faces, bright edges) out of the floor just past its button, which floats up and fades away, and a run of LEDs
// round the foot of the dome, like marquee lights. Which instrument shows it is each instrument's `floor`
// setting ("grid"). Colors live in palette.js (gridFloor, gridLine, gridDome)
const GRID = {
  radius: 45, // of the floor and the dome, world units (the camera stays within about 30 of the middle)
  cell: 1.6, // the floor's grid spacing
  line: 1.4, // floor line width, in screen pixels
  fade: [0.35, 0.95], // the floor's lines fade out between these fractions of the radius
  glow: 0.9, // how bright the floor's lines are
  // the dome is a panel of square pixels, with green rain falling down it in time with the playing: every note
  // sends a burst of drops down a band of columns on the far side of the dome, on the same side as the note (low
  // notes to the left). Each steps down pixel by pixel, a bright head trailing a tail that fades. The rest of
  // the pixels glow faintly
  dome: {
    cols: 220, // pixels round the dome
    rows: 55, // pixels from its foot to its top (these two keep them about square)
    pixel: 0.72, // how much of its cell each pixel fills (the rest is the dark gap between)
    unlit: 0.05, // how brightly the pixels no drop is on glow
    slots: 3, // drops that can be falling in one column at once
    burst: 8, // drops a note sends down
    spread: 11, // across this many columns either side of the note's place
    stagger: 0.12, // seconds over which a burst's drops start
    from: [0.3, 0.55], // how high up the dome a drop starts (0 foot, 1 top)
    speed: [0.35, 0.7], // how fast a drop falls: dome heights a second, slowest to fastest
    trail: 12, // pixels in a drop's tail
    bright: 1, // a drop's head
    hues: [0, 0.78], // each note's drops take a rainbow tint: this hue for the lowest note (red) to this for the highest (violet)
    tint: 0.85, // how strongly (the rest is the dome's green)
    top: [0.35, 0.85], // the rain fades out between these heights (0 foot, 1 top), where the pixels crowd together
    haze: 0.5, // the glow round the dome's foot
    fall: 6, // how quickly the glow fades going up
  },
  // the notes: 3D neon bars that rise out of the floor round the player, one just past each note's button
  notes: {
    out: 2.2, // how far past the button's hit point a bar comes up, world units
    size: [0.6, 1.8, 0.35], // width, height and depth of a bar
    emerge: 0.25, // seconds to rise out of the floor
    speed: 2.5, // then how fast it floats up, world units a second
    life: 3, // seconds from coming up to gone
    fill: 0.35, // how strongly its faces glow (its edges glow at full)
    flash: 0.25, // seconds of extra brightness as it comes up
    pool: 120, // bars kept ready: the oldest is reused when they run out
  },
  // marquee lights: rows of LEDs round the foot of the dome. Each note sends a short run of lit LEDs chasing
  // round one row (low notes low, high notes high), in its color with a fading tail. Kept dim, so it stays in
  // the background behind the bars
  marquee: {
    rows: [0.03, 0.07, 0.11, 0.15, 0.19], // heights up the dome, radians above its foot
    leds: 200, // round each row
    size: 3, // screen pixels
    idle: 0.06, // how brightly the unlit LEDs show, so the strips read even when nothing is running
    bright: 0.55, // a run's head
    tail: 12, // LEDs in a run's fading tail
    speed: 50, // LEDs a second
    run: 70, // LEDs a run travels before it fades
    fadeOut: 0.35, // seconds it takes to fade at the end
  },
  colors: {
    floor: COLOR_PALETTE.gridFloor,
    line: COLOR_PALETTE.gridLine,
    dome: COLOR_PALETTE.gridDome,
  },
};

// builds the grid world into `scene`, centered on (x, z), hidden. `toonMat` comes from script.js (the floor itself is
// lit, so it takes shadows). Returns the group, note(hit, angle, color, pitch): send a bar up just past a note's
// button and a run of lights round the dome (`hit` its hit point in world space, `angle` its direction from the
// player, radians round from +z, `pitch` 0 for the lowest note to 1 for the highest), and update(dt): move them
function buildGrid(scene, { toonMat }, x, z) {
  const G = GRID,
    grid = new THREE.Group();
  grid.name = "grid";
  grid.visible = false;
  grid.position.set(x, 0, z);
  scene.add(grid);

  // the floor: a plain dark disc that catches shadows
  const floorMat = toonMat(G.colors.floor);
  floorMat.fog = false;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(G.radius, 96).rotateX(-Math.PI / 2), floorMat);
  floor.receiveShadow = true;
  grid.add(floor);

  // the lines: a second disc just above, transparent but for the grid, which it draws in a shader so the lines
  // stay crisp at any distance (their width is measured in pixels) and fade out toward the rim
  const lineColor = new THREE.Color(G.colors.line);
  const lines = new THREE.Mesh(
    new THREE.CircleGeometry(G.radius, 96).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: lineColor },
        uCell: { value: G.cell },
        uWidth: { value: G.line },
        uFade: { value: new THREE.Vector2(G.fade[0] * G.radius, G.fade[1] * G.radius) },
        uGlow: { value: G.glow },
      },
      vertexShader: `
        varying vec2 vXZ;
        void main() {
          vXZ = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uCell, uWidth, uGlow;
        uniform vec2 uFade;
        varying vec2 vXZ;
        void main() {
          vec2 g = vXZ / uCell;
          vec2 d = abs(fract(g - 0.5) - 0.5) / fwidth(g); // distance to the nearest line, in pixels
          float line = 1.0 - clamp(min(d.x, d.y) - uWidth * 0.5 + 0.5, 0.0, 1.0);
          float fade = 1.0 - smoothstep(uFade.x, uFade.y, length(vXZ));
          gl_FragColor = vec4(uColor, line * fade * uGlow);
        }`,
      transparent: true,
      depthWrite: false,
      fog: false,
      extensions: { derivatives: true },
    }),
  );
  lines.position.y = 0.01;
  lines.renderOrder = 1;
  grid.add(lines);

  // the dome: the inside of a half sphere, drawn as a pixel panel with the rain falling down it, and a glow
  // round its foot
  const D = G.dome,
    time = { value: 0 },
    // the drops: a texel per column per slot holding when it started falling, how fast, from how high, and its hue
    dropData = new Float32Array(D.cols * D.slots * 4).fill(-1e4),
    drops = new THREE.DataTexture(dropData, D.cols, D.slots, THREE.RGBAFormat, THREE.FloatType);
  drops.magFilter = drops.minFilter = THREE.NearestFilter;
  drops.needsUpdate = true;
  const nextSlot = new Uint8Array(D.cols); // each column's slots are reused in turn
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(G.radius, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(G.colors.dome) },
        uTime: time,
        uCells: { value: new THREE.Vector2(D.cols, D.rows) },
        uPixel: { value: D.pixel },
        uUnlit: { value: D.unlit },
        uDrops: { value: drops },
        uTrail: { value: D.trail },
        uTint: { value: D.tint },
        uBright: { value: D.bright },
        uTop: { value: new THREE.Vector2(...D.top) },
        uHaze: { value: D.haze },
        uFall: { value: D.fall },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv; // x round the dome, y from the foot (0) up to the top (1) for this half sphere
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec2 uCells, uTop;
        uniform float uTime, uPixel, uUnlit, uTrail, uBright, uHaze, uFall, uTint;
        uniform sampler2D uDrops;
        varying vec2 vUv;
        vec3 hueRGB(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
        void main() {
          vec2 cell = floor(vUv * uCells), // which pixel
            f = fract(vUv * uCells); // where in it
          float inPixel = step(abs(f.x - 0.5), uPixel * 0.5) * step(abs(f.y - 0.5), uPixel * 0.5);
          // the drops falling in this column, each set off by a note: its head steps down whole pixels from where
          // it started, and its tail runs up behind it
          float lit = 0.0, head = 0.0, hue = 0.0;
          for (int k = 0; k < ${D.slots}; k++) {
            vec4 drop = texture2D(uDrops, vec2((cell.x + 0.5) / uCells.x, (float(k) + 0.5) / ${D.slots.toFixed(1)}));
            float age = uTime - drop.r;
            if (age < 0.0) continue; // not started yet
            float pos = drop.b - age * drop.g,
              headRow = floor(pos * uCells.y),
              d = cell.y - headRow; // pixels above the head
            if (d >= 0.0 && d < uTrail) {
              float b = pow(1.0 - d / uTrail, 1.5);
              if (b > lit) {
                lit = b;
                hue = drop.a; // the brightest drop on this pixel gives it its tint
              }
              if (d < 1.0) head = 1.0;
            }
          }
          float fade = smoothstep(uTop.y, uTop.x, vUv.y),
            glow = uHaze * pow(1.0 - vUv.y, uFall),
            a = inPixel * (uUnlit + lit * uBright) * fade + glow;
          // lit pixels take their drop's rainbow tint, and the heads flare toward white
          vec3 c = mix(uColor, mix(uColor, hueRGB(hue), uTint), step(0.001, lit) * inPixel);
          c = mix(c, vec3(1.0), head * 0.5 * inPixel);
          gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
        }`,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      extensions: { derivatives: true },
    }),
  );
  dome.renderOrder = -1;
  grid.add(dome);

  // the notes: a pool of bars, each a box of faintly glowing faces with its edges drawn bright, added onto
  // whatever is behind. The floor hides a bar while it is still coming up through it
  const N = G.notes,
    [bw, bh, bd] = N.size,
    boxGeo = new THREE.BoxGeometry(bw, bh, bd).translate(0, bh / 2, 0), // its foot at the origin
    edgeGeo = new THREE.EdgesGeometry(boxGeo),
    glow = (mat) =>
      new mat({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    bars = [];
  for (let i = 0; i < N.pool; i++) {
    const bar = new THREE.Group(),
      faces = new THREE.Mesh(boxGeo, glow(THREE.MeshBasicMaterial)),
      edges = new THREE.LineSegments(edgeGeo, glow(THREE.LineBasicMaterial));
    bar.add(faces, edges);
    bar.visible = false;
    bar.userData = { age: 0, color: new THREE.Color(), faces, edges };
    grid.add(bar);
    bars.push(bar);
  }
  let next = 0; // the pool's next bar to hand out

  // the marquee: one Points per row, each LED colored every frame from the runs passing along it
  const M = G.marquee,
    domeCol = new THREE.Color(G.colors.dome),
    rows = M.rows.map((el) => {
      const pos = new Float32Array(M.leds * 3),
        col = new Float32Array(M.leds * 3),
        rr = G.radius * 0.985;
      for (let i = 0; i < M.leds; i++) {
        const az = (i / M.leds) * Math.PI * 2;
        pos.set([rr * Math.cos(el) * Math.sin(az), rr * Math.sin(el), rr * Math.cos(el) * Math.cos(az)], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(
        g,
        new THREE.PointsMaterial({
          size: M.size,
          sizeAttenuation: false,
          map: glowTexture(),
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          fog: false,
        }),
      );
      pts.frustumCulled = false;
      grid.add(pts);
      return { col, attr: g.attributes.color };
    }),
    runs = []; // { row, start, dir, t, color }
  let runDir = 1; // runs alternate direction, so they weave rather than all streaming one way
  function light(pitch, angle, color) {
    runs.push({
      row: Math.round(pitch * (rows.length - 1)),
      start: Math.round((((angle / (Math.PI * 2)) % 1) + 1) * M.leds),
      dir: (runDir = -runDir),
      t: 0,
      color: new THREE.Color(color),
    });
  }
  function updateMarquee(dt) {
    rows.forEach((r) => {
      for (let i = 0; i < M.leds; i++) r.col.set([domeCol.r * M.idle, domeCol.g * M.idle, domeCol.b * M.idle], i * 3);
    });
    const runTime = M.run / M.speed;
    for (let k = runs.length - 1; k >= 0; k--) {
      const r = runs[k];
      r.t += dt;
      if (r.t > runTime + M.fadeOut) {
        runs.splice(k, 1);
        continue;
      }
      const head = Math.floor(Math.min(r.t, runTime) * M.speed), // steps LED to LED, like a real marquee
        fade = r.t > runTime ? 1 - (r.t - runTime) / M.fadeOut : 1,
        row = rows[r.row];
      for (let j = 0; j < M.tail && j <= head; j++) {
        const i = (((r.start + r.dir * (head - j)) % M.leds) + M.leds) % M.leds,
          b = M.bright * fade * (1 - j / M.tail) ** 2;
        row.col[i * 3] += r.color.r * b;
        row.col[i * 3 + 1] += r.color.g * b;
        row.col[i * 3 + 2] += r.color.b * b;
      }
    }
    rows.forEach((r) => (r.attr.needsUpdate = true));
  }

  // a burst of rain for a note, tinted by its pitch (red for the lowest, violet for the highest). Its place
  // round the dome is the note's direction mirrored to the far side (the side the camera faces), so low notes
  // still rain on the left. The sphere's u runs from its -x side, a quarter turn round from our angles
  function rain(angle, pitch) {
    const hue = D.hues[0] + pitch * (D.hues[1] - D.hues[0]);
    const mid = ((Math.PI - angle + Math.PI / 2) / (Math.PI * 2)) * D.cols;
    for (let n = 0; n < D.burst; n++) {
      const c = ((Math.round(mid + (Math.random() * 2 - 1) * D.spread) % D.cols) + D.cols) % D.cols,
        k = nextSlot[c];
      nextSlot[c] = (k + 1) % D.slots;
      const at = (k * D.cols + c) * 4;
      dropData[at] = time.value + Math.random() * D.stagger;
      dropData[at + 1] = D.speed[0] + Math.random() * (D.speed[1] - D.speed[0]);
      dropData[at + 2] = D.from[0] + Math.random() * (D.from[1] - D.from[0]);
      dropData[at + 3] = hue;
    }
    drops.needsUpdate = true;
  }

  function note(hit, angle, color, pitch = 0.5) {
    light(pitch, angle, color);
    rain(angle, pitch);
    const bar = bars[next];
    next = (next + 1) % bars.length;
    bar.position.set(hit.x + Math.sin(angle) * N.out - x, -bh, hit.z + Math.cos(angle) * N.out - z);
    bar.rotation.y = angle; // its broad side facing the player
    bar.userData.age = 0;
    bar.userData.color.set(color);
    bar.visible = true;
  }
  function update(dt) {
    time.value += dt;
    updateMarquee(dt);
    bars.forEach((bar) => {
      if (!bar.visible) return;
      const d = bar.userData;
      d.age += dt;
      if (d.age >= N.life) {
        bar.visible = false;
        return;
      }
      // up out of the floor, easing to a stop at floor level, then floating on up
      const e = Math.min(1, d.age / N.emerge);
      bar.position.y = -bh * (1 - e) ** 3 + Math.max(0, d.age - N.emerge) * N.speed;
      const fade = 1 - ((d.age / N.life) ** 2), // holds its glow, then goes quickly
        flash = 1 + Math.max(0, 1 - d.age / N.flash);
      d.edges.material.color.copy(d.color).multiplyScalar(fade * flash);
      d.faces.material.color.copy(d.color).multiplyScalar(fade * flash * N.fill);
    });
  }
  return { grid, note, update };
}


export { buildGrid, GRID };
