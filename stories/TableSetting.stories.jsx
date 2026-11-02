// Table Setting: one place laid at a table — a plate or a bowl, a fork and
// knife or a spoon, and a mug, teacup or glass beyond — laid for someone sat
// at the front looking in. One entry: pick each from its dropdown, and what's
// in it from the one that opens under it. Its
// code is src/nouns/tableSetting/TableSetting.jsx and its defaults
// src/nouns/tableSetting/objects.js. The café's tables are laid with these,
// one for each figure sat at them (Shopfronts/Shop Interior).
import TableSetting from "../src/nouns/tableSetting/TableSetting.jsx";
import { TABLE_SETTING, TABLE_SETTING_KNOBS } from "../src/nouns/tableSetting/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TABLE_SETTING, TABLE_SETTING_KNOBS, {}, {});

export default {
  title: "Food/Kitchen/Table Setting",
  component: TableSetting,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <group rotation-y={Math.PI}><TableSetting config={K.configOf(a)} /></group>,
};

export const Default = {};
