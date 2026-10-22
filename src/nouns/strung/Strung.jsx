import { runsAround } from "../../world/layout.js";
import Garland from "../garland/Garland.jsx";
import { StrungSigns } from "../sign/Sign.jsx";

// What can be strung between posts, by name: a garland, or signs. Anything
// with posts — an enclosure, a marquee — picks one here, so the two are
// swapped with a word.
export const STRUNG_TYPES = ["garland", "sign"];

// `tops` are the post tops in the parent's space, `ring` their `count` and
// `arc` (see runsAround), `type` one of STRUNG_TYPES or false for nothing,
// and `configs` whatever holds the `garland` and `sign` overrides.
// `center` is what a sign faces away from (the origin unless said).
// `skip`, given, is a Set of the runs — run i joins top i to top i + 1 —
// to leave empty: a gate in a fence.
export default function Strung({ tops, ring, skip, type, configs, centre }) {
  if (type === false) return null;
  if (type === "garland")
    return (
      <Garland tops={tops} ring={ring} skip={skip} config={configs.garland} />
    );
  if (type === "sign")
    return (
      <StrungSigns
        tops={tops}
        runs={runsAround(ring)}
        skip={skip}
        centre={centre}
        config={configs.sign}
      />
    );
  throw new Error(
    `strung must be one of ${STRUNG_TYPES.map((t) => `"${t}"`).join(", ")} or false, got ${JSON.stringify(type)}`,
  );
}
