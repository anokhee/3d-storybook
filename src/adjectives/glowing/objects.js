// Glowing: a translucent thing lit from INSIDE — `light: { type: "glowing" }`
// in a config (see LIGHT). Where "lit" puts a halo round a solid, this makes
// the body itself a shell with the light in it — a paper lantern, a jelly,
// a bulb. These are the fields that type takes:
//
//   alpha      how solid the shell is, 0 clear .. 1 opaque; the rim always
//              reads denser than the middle, the way a glass edge does
//   frost      what the glass is like, 0 .. 1: at 0 it is clear — nothing
//              in the middle but the bulb seen sharp, a crisp bright rim,
//              a tight highlight; at 1 it is frosted, the light spread
//              through the whole skin as a soft pool
//   brightness how bright the light inside is, 1 full — the same word as
//              "lit" uses for the same thing
//   color      what color that light is — a swatch or "#rrggbb", or null
//              for the thing's own color
//   pulse      how much the light breathes, as a share of its brightness,
//              0 to hold it steady
//   rate       breaths per second
//   showBulb   whether the light itself is drawn, sat in the middle — off,
//              the glass glows with nothing visible inside it
//   bulb       that bulb's radius as a share of the thing's
export const GLOWING = {
  alpha: 0.35,
  frost: 0.3,
  brightness: 1,
  color: null,
  pulse: 0.15,
  rate: 0.5,
  showBulb: true,
  bulb: 0.3,
};
