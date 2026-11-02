// SHOPFRONTS: what each Shopfronts/<kind> entry is made of — two stories,
// the shop from the street and the shop from inside:
//
//   Exterior   the Shopfront (src/nouns/shopfront/Shopfront.jsx) in the
//              kind's colourway (SHOPFRONT_KINDS in src/nouns/shopfront/
//              objects.js; "general store" the plain one, SHOPFRONT as it
//              is), with SHOPFRONT_KNOBS starting at that colourway's values;
//              what has no knob (its upstairs windows) rides along under them
//   Interior   the Shop Interior (src/nouns/shopInterior/ShopInterior.jsx):
//              the same shop as a dolls' house, its front as the street sees
//              it, furnished for its kind and size, the same every time by
//              its seed; its kind's knobs (shopInteriorKnobsOf: every
//              kind's, and its own — a café's style, a florist's…), its door on the side the
//              exterior's is
//
// `args` start some knobs off elsewhere (a pitched roof, a café's style).
// Each kind is a file of its own (stories/Shopfront<Kind>.stories.jsx), so it
// is a folder straight under Shopfronts with the two in it. This folder is
// not a story: main.js's stories pattern does not match it.
import Shopfront from "../../src/nouns/shopfront/Shopfront.jsx";
import { SHOPFRONT, SHOPFRONT_KINDS, shopfrontKnobsOf } from "../../src/nouns/shopfront/objects.js";
import ShopInterior from "../../src/nouns/shopInterior/ShopInterior.jsx";
import { SHOP_INTERIOR, shopInteriorKnobsOf } from "../../src/nouns/shopInterior/objects.js";
import { merge } from "../../src/world/merge.js";
import { knobStory } from "./knobs.js";

export function exteriorOf(kind, args = {}, name = "Exterior") {
  const own = SHOPFRONT_KINDS[kind] ?? {};
  const K = knobStory(merge(SHOPFRONT, own), shopfrontKnobsOf(kind), own); // (only its kind's choices: see shopfrontKnobsOf)
  return { name, argTypes: K.argTypes, args: { ...K.args, ...args }, render: (a) => <Shopfront config={K.configOf(a)} /> };
}

// The Exterior of a kind with styles (a café's, a florist's): a knob
// `styleKey` picking one of `names`, and `shopfrontOf(config, seed, style)`
// laying that style over the shopfront. Its awning, decoration and window
// box plant knobs start unset, so the style has its own (the modern
// florist's no awning, the rustic one's daisies); once picked, they win
// over the style's.
export function styledExteriorOf(kind, { styleKey, label, names, value, shopfrontOf }) {
  const plain = exteriorOf(kind);
  const K = knobStory(merge(SHOPFRONT, SHOPFRONT_KINDS[kind] ?? {}), shopfrontKnobsOf(kind), SHOPFRONT_KINDS[kind] ?? {});
  return {
    ...plain,
    argTypes: { [styleKey]: { control: "select", options: names, name: label }, ...plain.argTypes },
    args: { [styleKey]: value, ...plain.args, awning: undefined, decoration: undefined, boxPlant: undefined },
    render: (a) => {
      const { [styleKey]: style, ...rest } = a;
      const set = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      // (what was picked of them, bare: just those fields, nothing of the kind's own under them)
      const asked = {
        ...("awning" in set ? { awning: { on: !!set.awning } } : {}),
        ...("decoration" in set ? { shopWindow: { decoration: set.decoration } } : {}),
        ...("boxPlant" in set ? { windowBox: { flowers: { kind: set.boxPlant } } } : {}),
      };
      return <Shopfront config={merge(shopfrontOf(K.configOf(set), 0, style), asked)} />;
    },
  };
}

export function interiorOf(kind, args = {}) {
  // its door, awning, garland and decoration out front starting as the exterior's
  const S = merge(SHOPFRONT, SHOPFRONT_KINDS[kind] ?? {});
  // (its kind fixed, and only its kind's knobs: see shopInteriorKnobsOf)
  const K = knobStory(SHOP_INTERIOR, shopInteriorKnobsOf(kind), { kind }, {
    size: 2, doorSide: S.door.side, awning: S.awning.on, garland: S.garland.on, decoration: S.shopWindow.decoration,
  });
  return {
    name: "Interior",
    parameters: { stage: { view: "front" } }, // looking in at its front
    argTypes: K.argTypes,
    args: { ...K.args, ...args },
    // knobs left blank (the curtains' colour and pattern, until picked) are
    // left out, so a café's style colours them
    render: (a) => <ShopInterior config={K.configOf(Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined && v !== null && v !== "")))} />,
  };
}
