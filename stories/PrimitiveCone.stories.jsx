// Cone: a cylinder with its crown pinched to a point (CONE_FORM in
// src/nouns/primitive/objects.js), standing on its foot. Unlit, lit (its
// own colour from any angle, a halo round it) or glowing (lit from inside).
// A pendant light's shade is one (Lighting/Pendant Light, Cone Shade).
import Primitive from "../src/nouns/primitive/Primitive.jsx";
import { CONE_FORM } from "../src/nouns/primitive/objects.js";
import { LIGHT_TYPES } from "../src/adjectives/lit/objects.js";
import { solid } from "../src/world/palette.js";

export default {
  title: "Primitives/Cone",
  argTypes: {
    color: { control: "color" },
    radius: { control: { type: "range", min: 0.2, max: 2, step: 0.05 } },
    light: { control: "radio", options: LIGHT_TYPES },
    brightness: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
  args: { color: "#FFFFFF", radius: 0.6, light: "unlit", brightness: 1 },
  render: (a) => (
    <group position-y={a.radius}>
      <Primitive shape="cylinder" radius={a.radius} form={CONE_FORM} swatch={solid(a.color)} light={{ type: a.light, brightness: a.brightness }} casts={a.light !== "unlit"} />
    </group>
  ),
};

export const Default = {};
export const Lit = { args: { light: "lit", color: "#F2C94C" } };
