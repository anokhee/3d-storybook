// Salon chair: the hairdresser's chair that pumps up and turns — a chrome
// foot and column, a padded seat, back and headrest, padded arms on
// chrome struts, a footrest out in front. Standing on the ground facing
// +z. Its code is src/nouns/salonChair/SalonChair.jsx and its defaults
// src/nouns/salonChair/objects.js; a salon (Shopfronts/Shop Interior) has
// a row of them before its mirrors.
import SalonChair from "../src/nouns/salonChair/SalonChair.jsx";
import { SALON_CHAIR, SALON_CHAIR_KNOBS } from "../src/nouns/salonChair/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SALON_CHAIR, SALON_CHAIR_KNOBS);

export default {
  title: "Furniture/Seating/Salon Chair",
  component: SalonChair,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <SalonChair config={K.configOf(a)} />,
};

export const Default = {};
// in a pink salon's upholstery
export const Pink = { args: { cushion: "#E8A0B4" } };
// under a hood dryer, hung from a pole down from the ceiling; and on its
// own floor stand
export const HoodDryer = { name: "Hood Dryer", args: { dryer: true } };
export const HoodDryerStand = { name: "Hood Dryer, on a Stand", args: { dryer: true, dryerMount: "stand" } };
