import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { useGameStore } from "../../game/store.js";
import { live } from "../../player/events.js";
import { SUN_DIR } from "../../lighting.js";
import { air, settleAir } from "./air.js";
import { PLANET } from "./objects.js";

// The planet's air: one translucent shell hung at the gravity shell's own
// radius, so the boundary the flight lets go at is a thing in the world
// rather than a number. It is drawn as haze rather than as a surface:
//
//   thickest at the limb, thinning toward the middle of the disc — how far
//   the eye's line through the shell is from grazing it, |n · v| — so from
//   outside it reads as a soft bubble, and from inside as a band round the
//   horizon with clear sky overhead; the same term serves both because it
//   is taken unsigned;
//
//   additive, so it can only ever add light to the dark sky behind it and
//   never muddies it toward gray; double-sided and never writing depth, so
//   the doll flies through it and the stars show through it;
//
//   drawn in to a tight bubble round the planet (`bubble`) while the doll
//   is in free flight, and swelling back out to the shell's size as the
//   doll crosses in and the planet takes it, so from space the planet is
//   a ball in a thin skin of air and from inside the air is the sky;
//
//   and, by day, backed by a second shell — the DAY shell — the sky
//   itself, solid, as the game's `daylight` is turned up, and only while
//   the doll is on the planet: blue overhead, paler at the horizon, the
//   sun glowing in it where the sun is, and the stars lost behind it; the
//   haze rides over it as a lighter band round the horizon, so the
//   atmosphere shows day and night alike. Turned down it dusks toward
//   space and, near night, thins out to nothing. Seen from outside the
//   shell it is never there — its back faces only — so from space the
//   planet stays a ball in the sky, lit by the sun where the day is on
//   (see ../moon/Moonlight.jsx), the haze taking a little of the day's
//   color besides.
const vert = /* glsl */ `
  varying vec3 vDir;
  varying vec3 vView;
  void main() {
    vDir = normalize(position);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const frag = /* glsl */ `
  uniform vec3 color;
  uniform float alpha;
  uniform float rim;
  varying vec3 vDir;
  varying vec3 vView;


  void main() {
    // Grazing is 0, square on is 1, whichever side of the shell we're on.
    float facing = abs(dot(normalize(vDir), normalize(vView)));
    float haze = pow(1.0 - facing, rim);
    float k = alpha * haze;
    gl_FragColor = vec4(color * k, k);
  }
`;

// The day shell: the sky, solid — its color overhead going over to the
// horizon's down at the rim, the sun's glow laid on toward the sun — and,
// as the daylight goes down, dusking toward space and thinning out under
// `dusk` to nothing. Only as much as the doll is on the planet.
const dayFrag = /* glsl */ `
  uniform vec3 skyColor;
  uniform vec3 horizonColor;
  uniform vec3 spaceColor;
  uniform vec3 glowColor;
  uniform vec3 sunDir;
  uniform float strength;
  uniform float spread;
  uniform float dusk;
  uniform float rim;
  uniform float daylight;
  uniform float inside;
  varying vec3 vDir;
  varying vec3 vView;
  void main() {
    vec3 dir = normalize(vDir);
    // Grazing is 0, square on is 1: the horizon's band.
    float facing = abs(dot(dir, normalize(vView)));
    float haze = pow(1.0 - facing, rim);
    vec3 sky = mix(skyColor, horizonColor, haze);
    // The sun's glow: a wide soft brightening toward it. The sun itself
    // is a ball hung out past the shell (see ../sun/Sun.jsx), not a spot
    // painted here.
    float toward = max(dot(dir, sunDir), 0.0);
    float glow = strength * pow(toward, spread);
    sky = mix(sky, glowColor, clamp(glow, 0.0, 1.0));
    // Dusk: the sky darkens toward space, and under dusk thins away.
    float day = smoothstep(0.0, 1.0, daylight);
    vec3 color = mix(spaceColor, sky, day);
    float k = smoothstep(0.0, dusk, daylight) * inside;
    if (k <= 0.001) discard;
    gl_FragColor = vec4(color, k);
  }
`;

export default function Atmosphere() {
  const A = PLANET.atmosphere;
  const D = A.day;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: hue(A.color) },
          alpha: { value: A.alpha },
          rim: { value: A.rim },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [A],
  );
  const dayMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          skyColor: { value: hue(D.color) },
          horizonColor: { value: hue(D.horizon) },
          spaceColor: { value: hue(D.space) },
          glowColor: { value: hue(D.glow) },
          sunDir: { value: SUN_DIR },
          strength: { value: D.glowStrength },
          spread: { value: D.spread },
          dusk: { value: D.dusk },
          rim: { value: A.rim },
          daylight: { value: 0 },
          inside: { value: 0 },
        },
        vertexShader: vert,
        fragmentShader: dayFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    [A, D],
  );

  // Each frame: the daylight off the store, and how much the doll is on
  // the planet (see air.js — settled here, for the clouds and sparkles
  // too), so the day comes and goes rather than flicking. The haze's
  // radius goes with it: in free flight it draws in to the bubble, and it
  // swells back out to the shell as the doll comes home. The haze's own
  // color takes `tint` of the day's, so the day shows from outside too.
  const haze = useRef();
  const night = useMemo(() => hue(A.color), [A]);
  const day = useMemo(() => hue(D.color), [D]);
  useFrame((_, dt) => {
    const daylight = useGameStore.getState().daylight;
    settleAir(live.you, dt);
    const u = dayMaterial.uniforms;
    u.daylight.value = daylight;
    u.inside.value = air.inside;
    material.uniforms.color.value.copy(night).lerp(day, daylight * D.tint);
    haze.current?.scale.setScalar(air.scale);
  });

  return (
    <>
      <mesh material={dayMaterial} renderOrder={1}>
        <sphereGeometry args={[PLANET.shell, 64, 48]} />
      </mesh>
      <mesh ref={haze} material={material} renderOrder={2}>
        <sphereGeometry args={[PLANET.shell, 64, 48]} />
      </mesh>
    </>
  );
}
