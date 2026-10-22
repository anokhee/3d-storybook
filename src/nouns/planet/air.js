import { BODIES } from "./bodies.js";
import { PLANET } from "./objects.js";

// How much of the atmosphere there is, shared by everything that floats
// on it — the haze (Atmosphere.jsx), the clouds (Clouds.jsx) and the
// sparkles (Sparkles.jsx). `inside` is how much the doll is on the planet,
// settled toward 1 while it is and 0 while it is not, so nothing flicks;
// `scale` is the shell's size as a fraction of itself: 1 with the doll
// home, and drawn in to the bubble's (see PLANET.atmosphere.bubble) in
// free flight. Atmosphere.jsx settles it once a frame; the rest read it.
export const air = { inside: 0, scale: 1 };

export function settleAir(you, dt) {
  const A = PLANET.atmosphere;
  const on = you?.body === BODIES.planet ? 1 : 0;
  air.inside += (on - air.inside) * Math.min(1, A.day.settle * dt);
  air.scale =
    (A.bubble + (PLANET.shell - A.bubble) * air.inside) / PLANET.shell;
  return air;
}
