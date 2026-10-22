// Deep-merge for the config consts. An override names only the fields it
// changes, at any depth, and everything else falls through to the default —
// so `{ post: { height: 8 } }` keeps the rest of `post` instead of wiping it.
//
// A shallow `{ ...defaults, ...overrides }` cannot do this: it replaces
// `post` wholesale, which is why every nested level used to need its own
// hand-written merge line at the call site. Miss one and the override
// silently drops the defaults it did not mention.

// Only PLAIN objects recurse. A THREE.Vector3 or any other class instance is
// a value, not a bag of fields, and merging into one would produce a broken
// half-object rather than a vector.
const isPlain = (v) =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  (v.constructor === Object || v.constructor === undefined);

// Arrays are replaced whole, never merged index-by-index: `festoon.type` is a
// LIST of ornaments, so merging `[{ shape: "tulip" }]` onto
// `[{ shape: "sphere", sides: 8 }]` element-wise would quietly leave the
// sphere's `sides` on the tulip rather than swapping the shape.
export function merge(defaults, overrides) {
  if (overrides === undefined || overrides === null) return defaults;
  if (!isPlain(defaults) || !isPlain(overrides)) return overrides;

  const out = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    out[key] = merge(defaults[key], value);
  }
  return out;
}
