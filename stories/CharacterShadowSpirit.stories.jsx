// Shadow Spirit: the anthropomorphic Human made a spirit — see-through, in
// one soft plum-black, a round white mask shrink-wrapped onto its face with
// two dark eye holes. Walking by default; the pose knob takes any of the
// Human's. The crowd on the flat street (~/Desktop/crowd) is made of these.
// Its look is SHADOW_SPIRIT in src/nouns/anthro/objects.js; it is drawn by
// src/nouns/anthro/ShadowSpirit.jsx.
import ShadowSpirit from "../src/nouns/anthro/ShadowSpirit.jsx";
import { SHADOW_SPIRIT, SHADOW_SPIRIT_KNOBS, ANTHRO_KNOBS } from "../src/nouns/anthro/objects.js";
import { knobStory } from "./helpers/knobs.js";

const KNOBS = [...ANTHRO_KNOBS.filter((k) => ["size", "pose", "animate"].includes(k.label)), ...SHADOW_SPIRIT_KNOBS];
const K = knobStory(SHADOW_SPIRIT, KNOBS, {}, {});

export default {
  title: "Characters/Anthropomorphic/Shadow Spirit",
  component: ShadowSpirit,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <ShadowSpirit config={K.configOf(a)} />,
};

export const Default = {};
// the café's chef (Shopfronts/Shop Interior): the hat and apron on
export const Chef = { args: { outfit: "chef" } };
// stood having a cigarette (the shopfronts' balconies have them: Shopfronts' `balconies`)
export const Smoking = { args: { pose: "smoke", animate: false } };
// walking along having a cigarette, the other hand free to swing (or to
// carry a bag: the street's smokers carry theirs in it)
export const WalkingSmoking = { name: "Walking, Smoking", args: { pose: "walk smoke", animate: true } };
// sat having a cigarette, the other hand in the lap (the street's benches and café chairs)
export const SittingSmoking = { name: "Sitting, Smoking", args: { pose: "sit smoke", animate: false } };
