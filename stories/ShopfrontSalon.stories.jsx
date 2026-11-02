// Shopfronts/Salon: the salon from the street (Exterior) and from inside
// (Interior: mirrors and salon chairs down one wall, wash basins at the back, chairs under hood dryers hung from the ceiling).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/Salon", component: Shopfront };

export const Exterior = exteriorOf("salon");
export const Interior = interiorOf("salon");
