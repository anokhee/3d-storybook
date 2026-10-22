// Dealing: from a state (which presets are ticked) and a page number to the
// configs of the dolls on that page. Deterministic — the same state and page
// always deal the same dolls — and pure, so anything that wants "a random
// doll" can ask for a page of one.
import { mulberry32 } from "./utils.js";
import { GRID_LAYOUT } from "./gridState.js";
import {
  randomConfig,
  compatibleTextures,
  compatibleHairs as compatibleAntennae,
  compatibleLimbs,
} from "./buildOneDolly.js";

const hash = (n) => (n * 2654435761) % 2147483647;

export function dealConfigs(state, page, N = GRID_LAYOUT.count) {
  // deals each axis's ticked presets across the number of dolly grid slots so that you can see at least one of each on every reroll
  const dealR = mulberry32(hash(page + 1));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(dealR() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const deal = (set) => {
    const out = [];
    while (out.length < N) out.push(...shuffle([...set]));
    return out.slice(0, N);
  };

  // sensible constraints for the selected dolly (defined in presets/model/...)
  const DEALS = {
    heads: null,
    bodies: null,
    limbs: (d, i) => compatibleLimbs(d.bodies[i], state.limbs),
    antennae: (d, i) => compatibleAntennae(d.heads[i], state.antennae),
    textures: (d, i) => compatibleTextures(d.heads[i], state.textures),
    colors: null,
  };

  // loops DEALS over every dolly to fix any broken ones
  const dealt = {};
  for (const [name, accepts] of Object.entries(DEALS)) {
    dealt[name] = deal(state[name]).map((key, i) => {
      if (!accepts) return key;
      const ok = accepts(dealt, i);
      return ok.includes(key) ? key : ok[Math.floor(dealR() * ok.length)];
    });
  }

  // reloading after changing presets brings back the same eight dolls, with only the changed variable modified
  const ordinals = Array.from({ length: N }, (_, i) => page * N + i);
  const seeds = ordinals.map(hash);

  // pressure-testing tool: doll 0 sits at every minimum, doll 7 at every maximum
  const sweeps = Array.from({ length: N }, (_, i) =>
    state.sweep && N > 1 ? i / (N - 1) : null,
  );

  // loops over the seed for each slot i and pairs it with that same slot's dealt parts
  return seeds.map((seed, i) =>
    randomConfig(
      seed,
      dealt.heads[i],
      dealt.bodies[i],
      dealt.limbs[i],
      dealt.antennae[i],
      dealt.textures[i],
      dealt.colors[i],
      {
        axis: state.tab,
        sweepT: sweeps[i],
        flatten: state.flatten,
        mouth: state.mouth,
      },
    ),
  );
}
