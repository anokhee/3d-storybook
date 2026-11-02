// Shopfronts/Café: the café from the street (Exterior) and from inside
// (Interior: a host stand by the front, tables in rows, a kitchen through
// a door at the back; its `café style` — upscale, casual, breakfast:
// CAFE_STYLES — a knob inside. On the street a café's shopfront wears its
// style's colours and windows too, a knob on the Exterior: cafeShopfrontOf
// in src/nouns/shopInterior/objects.js).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { styledExteriorOf, interiorOf } from "./helpers/shopfronts.jsx";
import { cafeShopfrontOf, CAFE_STYLE_NAMES } from "../src/nouns/shopInterior/objects.js";

export default { title: "Shopfronts/Café", component: Shopfront };

// the Exterior in a style's colours and windows, as the street shows it (its
// `café style` knob over the shopfront's own; see styledExteriorOf)
export const Exterior = styledExteriorOf("café", { styleKey: "cafeStyle", label: "café style", names: CAFE_STYLE_NAMES, value: "upscale", shopfrontOf: cafeShopfrontOf });
// (its awning and decoration knobs left unset until picked, so each style
// has its own — quirky's no awning and umbrella tables — till you choose)
export const Interior = interiorOf("café", { cafeStyle: "upscale", awning: undefined, decoration: undefined });
