// A BEETLE STORY: one kind of bug car (src/car/bugcar.js: a stag beetle,
// a horned beetle, a ladybug, a longhorn) as an entry of its own, with
// only the knobs that kind has — each a DIAL (a count or a length) or a
// colour — laid over the kind's config. `beetleStory(title, config,
// knobs, names)` is the story file's default export; `names` renames a
// knob for the kind ("head & horn" against "head & antennae").
import { useMemo } from "react";
import { BugCar } from "./bugcar.jsx";
import { DRIVERS } from "./driver.jsx";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");
const DIALS = {
  horn: { control: { type: "range", min: 0, max: 1.6, step: 0.1 }, name: "horn length" },
  antennaLen: { control: { type: "range", min: 0, max: 3, step: 0.1 }, name: "antenna length" },
  antennaBeads: { control: { type: "range", min: 0, max: 9, step: 1 }, name: "antenna beads" },
  spots: { control: { type: "range", min: 0, max: 8, step: 2 } },
  bands: { control: { type: "range", min: 0, max: 4, step: 1 } },
};
const COLORS = { shell: "shell", spot: "spots & seam", band: "bands", head: "head", trim: "seats & trim", wheel: "wheels" };

export function beetleStory(title, config, knobs, names = {}) {
  const argTypes = {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
  };
  const args = { speed: 6, driver: "none" };
  for (const k of knobs) {
    const color = k in COLORS;
    argTypes[k] = color ? { control: "color", name: names[k] ?? COLORS[k] } : { ...DIALS[k], name: names[k] ?? DIALS[k].name };
    args[k] = color ? hex(config[k]) : config[k];
  }
  function Story({ speed, driver, ...a }) {
    const picked = JSON.stringify(knobs.map((k) => a[k]));
    const c = useMemo(() => ({ ...config, ...Object.fromEntries(knobs.map((k) => [k, a[k]])) }), [picked]);
    return <BugCar speed={speed} driver={driver} config={c} />;
  }
  return { title, argTypes, args, render: (a) => <Story {...a} /> };
}
