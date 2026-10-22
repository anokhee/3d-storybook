// Boat: the steel drums' sailboat, from the xylophone game: a hull
// tapering to its keel, a deck, a mast with a mainsail and a jib, and a
// pennant, bobbing and rocking as if afloat (buildBoat in
// src/xylophone/island.js, COAST.boat its shape). Its waterline is the
// ground here. See stories/helpers/xylophone.jsx.
import { Built } from "./helpers/xylophone.jsx";
import { buildBoat, rockBoat, COAST } from "../src/xylophone/island.js";

const one = (a) => (scene, tools) => {
  const B = { ...COAST.boat, length: a.length, beam: a.beam, mast: a.mast };
  const built = buildBoat(tools, B, COAST.colors);
  built.boat.scale.setScalar(a.scale);
  scene.add(built.boat);
  // the stage's clock runs in seconds, as rockBoat counts
  return { animate: (now) => { if (a.afloat) rockBoat(built, now, B); } };
};

export default {
  title: "Vehicles/Boat",
  argTypes: {
    scale: { control: { type: "range", min: 0.5, max: 4, step: 0.1 } },
    length: { control: { type: "range", min: 1.5, max: 5, step: 0.1 } },
    beam: { control: { type: "range", min: 0.5, max: 2, step: 0.05 } },
    mast: { control: { type: "range", min: 1.5, max: 5, step: 0.1 } },
    afloat: { control: "boolean", name: "bob and rock" },
  },
  args: { scale: COAST.boat.scale, length: COAST.boat.length, beam: COAST.boat.beam, mast: COAST.boat.mast, afloat: true },
  render: (a) => <Built build={one(a)} center={false} />,
};

export const Default = {};
