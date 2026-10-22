import { PALETTE } from "../../world/palette.js";

// The ground: the ball everything stands on. Colors come from PALETTE (src/world/palette.js).
export const PLANET = {
  radius: 28,
  detail: 24, // fine enough for the thumbprints below to resolve
  // The ground thumbed like clay — see ./ground.js. Hollows only, pressed
  // into the ball, so nothing that stands at `radius` ends up buried:
  // `texture` is one of the dolls' texture presets, `amount` its dial,
  // `seed` which hollows, `lumps` how many across the ball (a multiplier
  // on the preset's own count), and `depth` how deep the deepest is
  // pressed, in world units. Null leaves the ball smooth.
  clay: { texture: "bumpiness", amount: 0.6, seed: 7, lumps: 3.5, depth: 0.35 },
  // The gravity shell: world units from the center within which the planet
  // pulls. Past it the doll is in free flight — see ./bodies.js. 60 above
  // the ground: a hover never gets there, ten perfect trampoline jumps do
  // (see MAT.pump.give).
  // Anything that drifts back into the shell is pulled in.
  shell: 50,
  catch: "shell",
  color: PALETTE.planet.ground,
  // The atmosphere: a veil of haze exactly the shell's size, so where the
  // pull lets go is something you can see — a bubble from outside, a
  // horizon from within. `alpha` is how thick it is at its thickest, the
  // limb; `rim` how fast it thins toward the middle of the disc (higher is
  // a thinner band). In free flight it draws in to `bubble` (world units
  // from the center), a tight skin round the planet, and swells back out
  // to the shell as the doll crosses in — at the day's `settle` rate.
  atmosphere: {
    color: PALETTE.planet.atmosphere,
    alpha: 0.5,
    rim: 0.5,
    bubble: 32,
    // The day: with the game's `daylight` turned up (see game/store.js and
    // game/Daylight.jsx) and the doll on the planet, the shell is the SKY
    // — solid, from inside: `color` overhead and `horizon` down at the
    // rim, with the sun's `glow` toward where the sun hangs (see
    // ../sun/Sun.jsx) — `glowStrength` how much of it and `spread` how
    // wide, higher being tighter round the sun. As the
    // daylight goes down the sky dusks toward `space` and, under `dusk`,
    // thins out to nothing, so the stars come out and the night's haze is
    // what is left. `settle` is how fast it comes and goes, per second, as
    // the doll leaves or lands. From outside the haze only takes `tint`
    // of the day's color, so the day shows from space but the planet
    // does not turn into a blue ball — the sun's light on it does the
    // rest (see ../moon/Moonlight.jsx).
    day: {
      color: PALETTE.planet.daylight,
      horizon: PALETTE.planet.horizon,
      space: PALETTE.sky.night,
      glow: PALETTE.sun.glow,
      glowStrength: 0.35,
      spread: 6,
      dusk: 0.25,
      settle: 2,
      tint: 0.5,
    },
    // The clouds — see Clouds.jsx: `count` sheer sheets laid on the
    // shell, each `size` long (world units, drawn between the two) and
    // `aspect` as tall as it is long, spread `band` either side of the
    // shell, going round the planet's axis at up to `swirl` turns per
    // second. Each is a flat vector shape with a gradient fill: `color`
    // along its top edge going down to `fade` at the bottom, `alpha` how
    // solid the top is, `sheer` how much of that is left at the bottom.
    // `near` is how close the camera can come before one fades out of
    // its way. `day` is the same by day, which the game's `daylight`
    // crossfades to.
    clouds: {
      count: 20,
      size: [8, 22],
      aspect: 0.82,
      band: 3,
      swirl: 0.005,
      color: PALETTE.planet.cloud,
      fade: PALETTE.planet.cloudFade,
      alpha: 0.05,
      sheer: 0.05,
      near: 14,
      day: {
        color: PALETTE.planet.dayCloud,
        fade: PALETTE.planet.dayCloudFade,
        alpha: 0.75,
        sheer: 0.15,
      },
    },
    // The sparkles in the air — see Sparkles.jsx: `count` soft points of
    // light strewn over the shell, each `size` across (world units,
    // drawn between the two), drifting round the axis and twinkling at `twinkle` per second. `alpha` is how bright one is at
    // the limb; they fade toward the middle of the disc as the haze does.
    // In free flight (the jetpack) they draw in to `flight.shell` (world
    // units from the center — just above the haze's bubble) and are
    // blown up to `flight` times their size and brightness, big sparkles
    // floating on the atmosphere; home again they go back to the shell.
    sparkles: {
      count: 1000,
      size: [0.5, 1.6],
      band: 2,
      swirl: 0.006,
      twinkle: 1,
      alpha: 1,
      flight: { shell: 31, size: 1, alpha: 0.7 },
    },
  },
};
