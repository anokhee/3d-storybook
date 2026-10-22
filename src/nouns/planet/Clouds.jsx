import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { clock } from "../../adjectives/glowing/material.js";
import { useGameStore } from "../../game/store.js";
import { air } from "./air.js";
import { PLANET } from "./objects.js";

// The clouds: a few dozen sheer sheets floating on the atmosphere's shell,
// drawn the way vector art draws a cloud — one clean shape with a
// gradient fill, and nothing grainy anywhere in it. One instanced draw:
// every cloud is a quad laid tangent to the shell at its own direction,
// subdivided and pressed back onto the shell so it wraps the curve, and
// swung slowly round the planet's axis in the vertex shader off the
// glowing things' clock, and turned there to lie along the viewer's own
// horizon, so a sheet is never seen on end. Nothing is touched from
// JavaScript after they are strewn.
//
// The shape is analytic: three ellipses strung along the sheet's middle
// and blended into one long soft lozenge, its outline anti-aliased over
// exactly one pixel, so the edge is as crisp as a cut of paper at any
// distance. The fill is a single linear gradient down the sheet: `color`
// and full `alpha` along the top edge, going down to `fade` and `sheer`
// of the alpha at the bottom, so every cloud thins away underneath and
// reads as a sheer sheet rather than a solid. Blended normally, so it is
// a translucent thing in front of the sky rather than a light added to
// it, and faded out as the camera comes up to it so flying through the
// shell is a soft pass.
//
// By night the sheets are faint and blue; by day white: the game's
// `daylight` crossfades their colors, alpha and sheer every frame (see
// PLANET.atmosphere.clouds.day).
const vert = /* glsl */ `
  attribute vec3 aDir;
  attribute float aRadius;
  attribute float aSeed;
  attribute float aSize;
  attribute float aRate;
  uniform float time;
  uniform float swirl;
  uniform float aspect;
  uniform float near;
  uniform float shell;
  uniform float scale;
  varying vec2 vUv;
  varying float vSeed;
  varying float vFade;

  void main() {
    vec3 d = aDir;
    // Round the axis, each at its own pace.
    float a = time * aRate * swirl * 6.2831853;
    d = vec3(d.x * cos(a) - d.z * sin(a), d.y, d.x * sin(a) + d.z * cos(a));
    // The sheet's "up". From inside the shell it is the viewer's own: up
    // from the planet's center through the camera, so every sheet lies
    // along the horizon wherever the doll stands and none stands on end
    // in the sky. From space it is the planet's axis, crossfaded over
    // the shell's edge on the way out.
    float R = aRadius * scale;
    float inside = 1.0 - smoothstep(shell * scale, shell * scale * 1.5, length(cameraPosition));
    vec3 up = normalize(mix(vec3(0.0, 1.0, 0.0), normalize(cameraPosition), inside));
    // Overhead, where the sheet's direction runs into its up, the frame
    // is eased over to a sideways reference so it never tumbles.
    vec3 side = normalize(cross(up, abs(up.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    float w = smoothstep(0.8, 0.97, abs(dot(d, up)));
    vec3 ref = normalize(mix(up, side, w));
    // The quad's frame on the shell: across, and toward that up.
    vec3 t = normalize(cross(ref, d));
    vec3 b = cross(d, t);
    // Laid flat in that frame, long across and aspect as tall, then
    // pressed back onto the shell at the cloud's own radius.
    vec3 laid = d * R + (t * position.x + b * position.y * aspect) * aSize * scale;
    vec3 world = normalize(laid) * R;
    vUv = position.xy;
    vSeed = aSeed;
    vFade = smoothstep(near * 0.4, near, distance(cameraPosition, world));
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;
const frag = /* glsl */ `
  uniform vec3 color;
  uniform vec3 fade;
  uniform float alpha;
  uniform float sheer;
  varying vec2 vUv;
  varying float vSeed;
  varying float vFade;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  // A soft union: the two shapes run together where they meet, so the
  // lozenge has no creases.
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }
  // Signed distance to an ellipse, near enough: the unit-circle distance
  // scaled back by the smaller radius.
  float ellipse(vec2 p, vec2 c, vec2 r) {
    return (length((p - c) / r) - 1.0) * min(r.x, r.y);
  }

  // The sheet: three ellipses along the middle, the outer two a little
  // lower and smaller than the one in the center, placed by the seed so
  // no two sheets are the same, and blended into one.
  float sheet(vec2 p) {
    float d = 1e3;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float x = (fi - 1.0) * 0.55 + (hash(vec2(vSeed * 9.1, fi)) - 0.5) * 0.2;
      float y = (fi == 1.0 ? 0.05 : -0.12) + (hash(vec2(fi, vSeed * 4.7)) - 0.5) * 0.16;
      float w = 0.42 + 0.14 * hash(vec2(vSeed * 6.3 + fi, 1.0));
      float h = (fi == 1.0 ? 0.55 : 0.4) + 0.1 * hash(vec2(vSeed * 2.9, fi + 5.0));
      d = smin(d, ellipse(p, vec2(x, y), vec2(w, h)), 0.25);
    }
    return d;
  }

  void main() {
    // The quad runs -1..1; the sheet is drawn smaller in it so its ends
    // never reach the quad's edge and get cut straight.
    vec2 p = vUv * 1.4;
    float d = sheet(p);
    // One pixel of anti-aliasing and no more: a cut edge, never a blur.
    float aa = fwidth(d);
    float shape = 1.0 - smoothstep(-aa, aa, d);
    if (shape < 0.005) discard;
    // The gradient down the sheet: solid color along the top, thinning
    // to the fade at the bottom.
    float g = smoothstep(-0.8, 0.7, p.y);
    vec3 col = mix(fade, color, g);
    float a = alpha * mix(sheer, 1.0, g);
    gl_FragColor = vec4(col, shape * a * vFade);
  }
`;

function strew(C, shell) {
  const n = C.count;
  const g = new THREE.InstancedBufferGeometry();
  // Subdivided so it can bend onto the shell: see the vertex shader.
  const quad = new THREE.PlaneGeometry(2, 2, 8, 4);
  g.setIndex(quad.getIndex());
  g.setAttribute("position", quad.getAttribute("position"));
  const dir = new Float32Array(n * 3);
  const radius = new Float32Array(n);
  const seed = new Float32Array(n);
  const size = new Float32Array(n);
  const rate = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Even over the sphere: a random height on the axis and a random turn.
    const z = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    dir[i * 3] = s * Math.cos(t);
    dir[i * 3 + 1] = z;
    dir[i * 3 + 2] = s * Math.sin(t);
    radius[i] = shell + (Math.random() * 2 - 1) * C.band;
    seed[i] = Math.random();
    size[i] = C.size[0] + (C.size[1] - C.size[0]) * Math.random();
    rate[i] = 0.4 + 0.6 * Math.random();
  }
  g.setAttribute("aDir", new THREE.InstancedBufferAttribute(dir, 3));
  g.setAttribute("aRadius", new THREE.InstancedBufferAttribute(radius, 1));
  g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));
  g.setAttribute("aSize", new THREE.InstancedBufferAttribute(size, 1));
  g.setAttribute("aRate", new THREE.InstancedBufferAttribute(rate, 1));
  g.instanceCount = n;
  return g;
}

// One end of the crossfade: the night's look, or the day's.
const look = ({ color, fade, alpha, sheer }) => ({
  color: hue(color),
  fade: hue(fade),
  alpha,
  sheer,
});

export default function Clouds() {
  const C = PLANET.atmosphere.clouds;
  const geometry = useMemo(() => strew(C, PLANET.shell), [C]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: hue(C.color) },
          fade: { value: hue(C.fade) },
          alpha: { value: C.alpha },
          sheer: { value: C.sheer },
          aspect: { value: C.aspect },
          swirl: { value: C.swirl },
          near: { value: C.near },
          shell: { value: PLANET.shell },
          scale: { value: 1 },
          time: clock,
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [C],
  );
  // Night's and day's, to crossfade between — and, like the atmosphere
  // they float on (see Atmosphere.jsx and air.js), drawn in to the bubble
  // in free flight, the whole strewing scaled about the center, and back
  // out to the shell as the doll comes home.
  const night = useMemo(() => look(C), [C]);
  const day = useMemo(() => look(C.day), [C]);
  useFrame(() => {
    const d = useGameStore.getState().daylight;
    const u = material.uniforms;
    u.color.value.copy(night.color).lerp(day.color, d);
    u.fade.value.copy(night.fade).lerp(day.fade, d);
    u.alpha.value = night.alpha + (day.alpha - night.alpha) * d;
    u.sheer.value = night.sheer + (day.sheer - night.sheer) * d;
    u.scale.value = air.scale;
  });
  // Never culled: the clouds are all over the shell and the camera is
  // usually inside it.
  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}
