// Shopfronts/Convenience Store: the convenience store from the street (Exterior) and from inside
// (Interior: coolers of drinks round the walls, an aisle of goods down the middle, the till by the door).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/Convenience Store", component: Shopfront };

export const Exterior = exteriorOf("convenience store");
export const Interior = interiorOf("convenience store");
