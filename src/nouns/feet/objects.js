// Feet: stubby clay legs a machine stands on, spaced evenly round under
// its base the way a trampoline's are. Whoever stands on them says how
// wide the base is and what color they come in; this is the leg.
//
//   count    how many — 0 for none, and the base sits on the ground
//   radius   at the foot, in world units
//   taper    top radius as a fraction of the foot's
//   height   from the ground to the top, in world units, before `sink`
//   sink     how far into the ground the foot is set
//   detail   sides on each leg
//   turn     degrees round from +x to the first foot; the rest step round
//            by 360 / count. 45 puts four at the corners
//   in       how far in from the base's edge they stand, as a share of its
//            footprint — 1 is right at the edge, on the box round the base
//   clay     thrown in lumpy clay like the rest — see CLAY — or null for
//            smooth
//   color    a swatch, or null for the base's own
export const FEET = {
  count: 4,
  radius: 0.28,
  taper: 0.75,
  height: 0.6,
  sink: 0.1,
  detail: 8,
  turn: 45,
  in: 0.8,
  clay: { amount: 0.4, seed: 9 },
  color: null,
};
