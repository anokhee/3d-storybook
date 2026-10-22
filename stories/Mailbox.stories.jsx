// Mailbox: a roadside box with a rounded roof on a wooden post, door on the
// front and a flag on the side, or a round pillar box. Its code is in
// src/nouns/mailbox/ (Mailbox.jsx and its defaults in objects.js).
import Mailbox from "../src/nouns/mailbox/Mailbox.jsx";
import { MAILBOX, MAILBOX_KNOBS } from "../src/nouns/mailbox/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(MAILBOX, MAILBOX_KNOBS);

export default {
  title: "Fixtures/Mailbox",
  component: Mailbox,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Mailbox config={K.configOf(a)} />,
};

export const Default = {};

// The flag raised: there is post to go out.
export const FlagUp = { args: { flagUp: true } };

// The British kind: a red column with a slot, no post or flag.
export const PillarBox = { args: { style: "pillar", colorsBox: "#E5534B" } };
