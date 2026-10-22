import { PALETTE } from "../../world/palette.js";

import { PLANET } from "../planet/objects.js";

import { MOON } from "../moon/objects.js";

// The rings: hoops hung all over space, well out past the planet's air
// and the moon's, each facing straight out from the planet to begin with
// and tumbling slowly from there. Fly through one and it counts (see
// game/store.js, `multiplier`) and fades away; see Rings.jsx.
//
// `lat`/`lon` place them like a station, and `shell` is how far out from
// the planet's middle each hangs. They are in FREE FLIGHT, clear of both
// gravity shells by `clear` at least (see PLANET.shell and MOON.shell), so
// going for one never drops the doll back into a pull or through the
// change of gravity at a boundary — the check at the bottom says so.
// `radius` is the hoop's, `tube` how thick, in world units; `alpha` how
// solid it is before it is flown through and `fade` how many seconds it
// takes to go once it has been. `tumble` is how fast a hoop turns over,
// in turns per second: each turns about its own axis, laid across the
// hoop, and some go a little faster than others — `vary` is how much.
//
// A hoop PULLS: inside `reach` of its middle, a doll flying at it has its
// velocity bent onto a point on the hoop's axis `lead` ahead of it — so it
// is drawn onto the axis, through the middle, and straight out the other
// side — at up to `rate` e-folding a second right at the hoop, eased off
// to nothing at `reach`. Aim roughly and the hoop closes the gap; fly
// past and it lets go. And
// `catch` of the radius counts as through, so a brush with the tube is a
// hit, not a miss.
const radius = 6;
const clear = 30;
export const RING = {
  radius,
  clear,
  tube: 1,
  color: PALETTE.planet.ring,
  alpha: 0.85,
  fade: 0.8,
  tumble: 0.03,
  vary: 0.5,
  pull: { reach: 30, lead: 8, rate: 5 },
  catch: 1.2,
};

export const RINGS = [
  { lat: 90, lon: 0, shell: 110 }, // straight up, under the moon
  { lat: 60, lon: 45, shell: 130 },
  { lat: 65, lon: -120, shell: 150 },
  { lat: 40, lon: 160, shell: 120 },
  { lat: 35, lon: -60, shell: 140 },
  { lat: 10, lon: 100, shell: 160 },
  { lat: 0, lon: -150, shell: 130 },
  { lat: -20, lon: 30, shell: 150 },
  { lat: -45, lon: -100, shell: 120 },
  { lat: -60, lon: 170, shell: 140 },
  { lat: -80, lon: 0, shell: 160 },
  { lat: 20, lon: -20, shell: 170 },
];

// Every hoop out of both pulls, with the margin, or it is a mistake.
const moon = MOON.center;
for (const { lat, lon, shell } of RINGS) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const x = Math.cos(la) * Math.sin(lo) * shell;
  const y = Math.sin(la) * shell;
  const z = Math.cos(la) * Math.cos(lo) * shell;
  const toMoon = Math.hypot(x - moon[0], y - moon[1], z - moon[2]);
  if (
    shell - radius < PLANET.shell + clear ||
    toMoon - radius < MOON.shell + clear
  )
    throw new Error(
      `ring at ${lat}/${lon}/${shell} is too near a gravity shell`,
    );
}
