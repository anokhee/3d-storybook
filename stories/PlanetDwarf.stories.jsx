// Dwarf: a small, gray, cratered world. One of the planets project's species
// (SPECIES.dwarf in src/planets/worlds.js). `seed` is the world's fingerprint:
// every range the species declares rolled to a number; `palette` is one of
// the species' own, or the one the seed rolls. See stories/helpers/planets.jsx.
import { World, palettesOf } from "./helpers/planets.jsx";

export default {
  title: "Planets/Dwarf",
  // In the project's dark space, under its stars, lit by its own rig (see
  // the helper), not the stage's sky and sun.
  parameters: { stage: { lights: "own", backdrop: "space" } },
  argTypes: {
    seed: { control: { type: "range", min: 1, max: 99, step: 1 } },
    palette: { control: "select", options: ["(rolled)", ...palettesOf("dwarf")] },
    size: { control: { type: "range", min: 1, max: 10, step: 0.5 } },
    spin: { control: "boolean" },
  },
  args: { seed: 9, palette: "(rolled)", size: 4, spin: true },
  render: (a) => <World species="dwarf" seed={a.seed} palette={a.palette === "(rolled)" ? null : a.palette} size={a.size} spin={a.spin} />,
};

export const Default = {};
