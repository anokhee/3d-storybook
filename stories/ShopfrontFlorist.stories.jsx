// Shopfronts/Florist: the florist from the street (Exterior) and from inside
// (Interior: pot plants down both walls, a table of cut flowers, a wall
// planter over the counter); its `florist style` — basic, modern, rustic:
// FLORIST_STYLES — a knob on both: on the street its front in the style's
// colours, windows and window boxes (floristShopfrontOf in
// src/nouns/shopInterior/objects.js), inside its walls, floor, pots and plants.
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { styledExteriorOf, interiorOf } from "./helpers/shopfronts.jsx";
import { floristShopfrontOf, FLORIST_STYLE_NAMES } from "../src/nouns/shopInterior/objects.js";

export default { title: "Shopfronts/Florist", component: Shopfront };

// the Exterior in a style, as the street shows it (its `florist style`
// knob over the shopfront's own; see styledExteriorOf)
export const Exterior = styledExteriorOf("florist", { styleKey: "floristStyle", label: "florist style", names: FLORIST_STYLE_NAMES, value: "basic", shopfrontOf: floristShopfrontOf });
// (its awning and decoration knobs left unset until picked, so each style
// has its own — the modern one's no awning — till you choose)
export const Interior = interiorOf("florist", { floristStyle: "basic", awning: undefined, decoration: undefined });
