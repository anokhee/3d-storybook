// Star polygons: pointed shapes the garland hangs and the posts wear, all
// cut from one table of types. Built by the same hand as the flowers —
// petals with no middle, tapered to a point and widest at the base, so the
// points meet in the center and there is nothing to cover the join.

// What every star shares. `radius` is point tip to center, the default where
// an ornament spec gives none.
export const STAR = {
  radius: 0.5,
  pointWidth: 0.82, // base width, as a multiple of the radius
  pointTaper: 0.05, // tip width as a fraction of the base's — a point
  pointThickness: 0.06, // card thickness, as a multiple of the radius
  faceOut: true, // hung or capping, turned to look away from the middle
  hangsBy: "top", // the top point reaches a radius above the origin
  // How the star is turned about its middle, degrees round each axis (see
  // ROTATION). A type's own `rotation` overrides this, field by field.
  rotation: { x: 0, y: 0, z: 0 },
};

// One star per entry. The NAME carries the point count, which is why a star
// takes no `sides` in a spec: a pentagram with seven points is not a
// pentagram. A seven-pointed star is a `heptagram` entry here, one line,
// beside the rest. An entry may carry its own `rotation`, degrees round
// each axis over STAR's — `{ z: 180 }` hangs a pentagram point-down.
export const STAR_TYPES = {
  pentagram: { points: 5 },
  hexagram: { points: 6 },
  octagram: { points: 8 },
};
