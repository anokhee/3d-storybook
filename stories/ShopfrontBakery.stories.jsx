// Shopfronts/Bakery: the bakery from the street (Exterior) and from inside
// (Interior: shelves of cakes behind the counter, a tray of them along it, a table to sit at with a bun).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/Bakery", component: Shopfront };

export const Exterior = exteriorOf("bakery");
export const Interior = interiorOf("bakery");
