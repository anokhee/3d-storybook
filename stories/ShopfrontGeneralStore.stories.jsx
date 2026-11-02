// Shopfronts/General Store: the general store from the street (Exterior) and from inside
// (Interior: boxes and tins up both walls, a fridge by the front, a counter across the back).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/General Store", component: Shopfront };

export const Exterior = exteriorOf("general store");
export const Interior = interiorOf("general store");
// the plain shopfront's roofs and its garland
export const PitchedRoof = exteriorOf("general store", { roof: "pitched" }, "Pitched Roof");
export const DormerRoof = exteriorOf("general store", { roof: "dormer" }, "Dormer Roof");
export const WithGarland = exteriorOf("general store", { garland: true }, "With Garland");
// the flats upstairs with balconies: wrought iron round paving slabs, window
// boxes on the rails, and spirits out on most of them — some just stood
// there, some having a cigarette (the `balcony spirits` chance and seed)
export const Balconies = exteriorOf("general store", { stories: 3, balconies: true, balconySpirits: 0.8, balconySeed: 3 }, "Balconies");
