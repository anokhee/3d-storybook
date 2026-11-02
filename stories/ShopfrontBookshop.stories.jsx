// Shopfronts/Bookshop: the bookshop from the street (Exterior) and from inside
// (Interior: books up both long walls, a rug, an armchair under a lamp).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/Bookshop", component: Shopfront };

export const Exterior = exteriorOf("bookshop");
export const Interior = interiorOf("bookshop");
