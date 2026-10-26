import { merge } from "../../../world/merge.js";
import Cherry, { cherryHeightOf } from "../../cherry/Cherry.jsx";
import { CHERRY } from "../../cherry/objects.js";
import Strawberry, {
  strawberryHeightOf,
} from "../../strawberry/Strawberry.jsx";
import { STRAWBERRY } from "../../strawberry/objects.js";
import Peppermint, {
  peppermintHeightOf,
} from "../../peppermint/Peppermint.jsx";
import { PEPPERMINT } from "../../peppermint/objects.js";
import JackHead, { jackHeadHeightOf } from "../../jackHead/JackHead.jsx";
import { JACK_HEAD } from "../../jackHead/objects.js";
import Numeral, { numeralHeightOf } from "../../numeral/Numeral.jsx";
import { NUMERAL } from "../../numeral/objects.js";
import Tulip, { tulipHeightOf } from "../../tulip/Tulip.jsx";
import { TULIP } from "../../tulip/objects.js";

// What can crown a cupcake, by the name `topper.kind` takes: the noun that
// draws it, its settings, how tall it stands in its own units, and how far
// it sinks into the frosting by default. "none" is no entry.
export const TOPPERS = {
  cherry: {
    Component: Cherry,
    defaults: CHERRY,
    heightOf: cherryHeightOf,
    sink: 0.17,
  },
  strawberry: {
    Component: Strawberry,
    defaults: STRAWBERRY,
    heightOf: strawberryHeightOf,
    sink: 0.04,
  },
  peppermint: {
    Component: Peppermint,
    defaults: PEPPERMINT,
    heightOf: peppermintHeightOf,
    sink: 0.25,
  },
  number: {
    Component: Numeral,
    defaults: NUMERAL,
    heightOf: numeralHeightOf,
    sink: 0.05,
  },
  tulip: {
    Component: Tulip,
    defaults: TULIP,
    heightOf: tulipHeightOf,
    sink: 0.1,
  },
  "jack-in-the-box": {
    Component: JackHead,
    defaults: JACK_HEAD,
    heightOf: jackHeadHeightOf,
    sink: 0.1,
  },
};

export const TOPPER_KINDS = ["none", ...Object.keys(TOPPERS)];

// Where a cupcake's topper stands: its kind's entry, the height off the
// frosting's top its foot is let down to, and how tall it stands from
// there, all in the cupcake's own units — or null for none. `top` is the
// frosting's top.
export function topperOf(T, top) {
  const kind = TOPPERS[T.kind];
  if (!kind) return null;
  const config = { ...T.config, scale: T.size };
  const sink = (T.sink ?? kind.sink) * T.size;
  const height = kind.heightOf(merge(kind.defaults, T.config)) * T.size;
  return { ...kind, config, y: top - sink, top: top - sink + height };
}
