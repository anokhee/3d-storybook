import { PRIMITIVES } from "../primitive/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { FLOWER, FLOWER_TYPES } from "../flower/objects.js";
import Flower from "../flower/Flower.jsx";
import { STAR, STAR_TYPES } from "../starPolygon/objects.js";
import StarPolygon from "../starPolygon/StarPolygon.jsx";
import { LIGHT_TYPES, lightOf } from "../../adjectives/lit/objects.js";
import { swatchOf } from "../../world/palette.js";

// An ornament is anything a garland hangs or a post is capped with: a
// primitive, a flower or a star polygon, named in a config as
// `{ shape, radius, sides?, detail?, form?, rotation?, light? }`. This is the
// one place a name is looked up, so a typo fails here, naming the field and
// the valid options, rather than as `undefined is not a component`
// somewhere downstream.

const SHAPES = [
  ...Object.keys(PRIMITIVES),
  ...Object.keys(FLOWER_TYPES),
  ...Object.keys(STAR_TYPES),
];

// Whether a name is any shape at all — for a station to tell a stale
// type in a saved level from a mistake (see placeableOf in
// ../station/Station.jsx).
export const isShape = (shape) => SHAPES.includes(shape);

// What kind of thing a name is, with the bits of its table the hanging
// needs: whether it has a face to turn outward, how much of its radius sits
// above its origin (so it hangs clear of its string), and its default radius
// where its table has one.
function kindOf(shape) {
  if (shape in PRIMITIVES)
    return { kind: "primitive", faceOut: false, hang: 1 };
  if (shape in FLOWER_TYPES)
    return {
      kind: "flower",
      faceOut: FLOWER.faceOut,
      hang: FLOWER_TYPES[shape].hangsBy === "top" ? 1 : 0,
      radius: FLOWER.radius,
    };
  if (shape in STAR_TYPES)
    return {
      kind: "star",
      faceOut: STAR.faceOut,
      hang: STAR.hangsBy === "top" ? 1 : 0,
      radius: STAR.radius,
    };
  return null;
}

// An authored spec, checked and filled in. `where` names the config it came
// from, for the error. `light` is filled in by its type (see LIGHT), so a
// spec that says nothing is unlit and one that says `{ type: "lit" }` is lit
// at full.
export function ornamentOf(spec, where = "ornament") {
  if (!spec || typeof spec !== "object")
    throw new Error(`${where}: expected an ornament spec, got ${spec}`);

  // `type` is ALREADY the list, so `type: [[A, B]]` nests a list where one
  // spec goes. Worth its own message: the generic one below would only say
  // "unknown shape undefined", which points nowhere near the extra brackets.
  if (Array.isArray(spec))
    throw new Error(
      `${where}: got a list where one ornament spec goes — a nested array. ` +
        `Write \`type: [A, B]\` to alternate two shapes, not \`type: [[A, B]]\`.`,
    );

  // A key nobody reads is a typo that would otherwise do nothing, quietly.
  const FIELDS = [
    "shape",
    "radius",
    "sides",
    "detail",
    "form",
    "rotation",
    "light",
  ];
  const stray = Object.keys(spec).filter((f) => !FIELDS.includes(f));
  if (stray.length)
    throw new Error(
      `${where}: unknown field${stray.length > 1 ? "s" : ""} ${stray.map((f) => `"${f}"`).join(", ")} — ` +
        `a spec takes ${FIELDS.map((f) => `\`${f}\``).join(", ")}`,
    );

  const k = kindOf(spec.shape);
  if (!k)
    throw new Error(
      `${where}: unknown shape ${JSON.stringify(spec.shape)} — expected one of ` +
        SHAPES.map((n) => `"${n}"`).join(", "),
    );

  const radius = spec.radius ?? k.radius;
  if (!(radius > 0))
    throw new Error(
      `${where}: radius must be a positive number, got ${JSON.stringify(spec.radius)}`,
    );

  // Only a primitive with facets takes `sides`: a cube has none, a flower's
  // petal count is its type, and a star's point count is its name. Ignoring
  // one quietly would leave a config that reads as if it did something.
  if (spec.sides !== undefined) {
    if (k.kind !== "primitive" || PRIMITIVES[spec.shape].sides === null)
      throw new Error(
        `${where}: ${spec.shape} has no \`sides\` to set` +
          (k.kind === "star" ?
            " — a star's point count is its name, so pick another star"
          : k.kind === "flower" ? " — a flower's petal count is its type"
          : ""),
      );
    if (!Number.isInteger(spec.sides) || spec.sides < 3)
      throw new Error(
        `${where}: sides must be a whole number of at least 3, got ${JSON.stringify(spec.sides)}`,
      );
  }

  // Only a primitive has facets to scale.
  if (spec.detail !== undefined) {
    if (k.kind !== "primitive")
      throw new Error(`${where}: only a primitive takes \`detail\``);
    if (!(spec.detail > 0))
      throw new Error(
        `${where}: detail must be a positive number, got ${JSON.stringify(spec.detail)}`,
      );
  }

  // Only a primitive is a solid to push about — see FORM.
  if (spec.form !== undefined) {
    if (k.kind !== "primitive")
      throw new Error(`${where}: only a primitive takes \`form\``);
    if (!spec.form || typeof spec.form !== "object")
      throw new Error(
        `${where}: form must be an object of FORM's fields, got ${JSON.stringify(spec.form)}`,
      );
  }

  // Anything turns — see ROTATION — but only by degrees round x, y and z.
  if (spec.rotation !== undefined) {
    if (!spec.rotation || typeof spec.rotation !== "object")
      throw new Error(
        `${where}: rotation must be { x, y, z } in degrees, got ${JSON.stringify(spec.rotation)}`,
      );
    for (const [axis, deg] of Object.entries(spec.rotation))
      if (!["x", "y", "z"].includes(axis) || typeof deg !== "number")
        throw new Error(
          `${where}: rotation takes degrees on x, y and z, got ${axis}: ${JSON.stringify(deg)}`,
        );
  }

  const light = lightOf(spec.light);
  if (!LIGHT_TYPES.includes(light.type))
    throw new Error(
      `${where}: light.type must be one of ${LIGHT_TYPES.map((t) => `"${t}"`).join(", ")}, got ${JSON.stringify(light.type)}`,
    );
  if (!(light.brightness >= 0 && light.brightness <= 1))
    throw new Error(
      `${where}: light.brightness must be 0..1, got ${JSON.stringify(light.brightness)}`,
    );
  if (light.type === "glowing" && !(light.alpha >= 0 && light.alpha <= 1))
    throw new Error(
      `${where}: light.alpha must be 0..1, got ${JSON.stringify(light.alpha)}`,
    );
  // Null is "its own color"; anything else has to be a color.
  if (light.color != null) swatchOf(light.color, `${where} light.color`);

  return {
    ...k,
    shape: spec.shape,
    radius,
    sides: spec.sides,
    detail: spec.detail,
    form: spec.form,
    rotation: spec.rotation,
    light,
  };
}

// How far under its anchor an ornament hangs, so a festoon dangles off its
// string rather than being threaded onto it.
export const dropOf = (o) => o.radius * o.hang;

// Turns an ornament that HAS a face to look away from the middle of whatever
// ring it sits on, from nothing but where it sits — so the one on the left
// and the one at the back are both seen flat-on, instead of every one of them
// pointing the same fixed way and only some of them landing right.
//
// One with no face never comes through here: a sphere reads the same from
// anywhere, and a cylinder would be tipped onto its side by it.
export function Facing({ x, z, faceOut, children }) {
  if (!faceOut) return children;

  return (
    // Read inside out. A petalled shape is built flat, petals in the xz
    // plane, so its face looks straight UP; the quarter-turn stands it
    // upright, leaving the face on +z. atan2(x, z) is then the bearing of
    // where it sits, measured from that same +z, which swings the face round
    // to point out.
    <group rotation-y={Math.atan2(x, z)}>
      <group rotation-x={Math.PI / 2}>{children}</group>
    </group>
  );
}

// One ornament, drawn: the switch from a resolved spec to the shape that
// draws it. `swatch` is what it is painted with; its `light` came with the
// spec. `casts` is whether it also gets a REAL point light, which only a lit
// ornament can do and which the garland rations.
export default function Ornament({ ornament: o, swatch, casts = false }) {
  const look = { swatch, light: o.light, casts };
  switch (o.kind) {
    case "primitive":
      return (
        <Primitive
          shape={o.shape}
          radius={o.radius}
          sides={o.sides}
          detail={o.detail}
          form={o.form}
          rotation={o.rotation}
          {...look}
        />
      );
    case "flower":
      return (
        <Flower
          type={o.shape}
          radius={o.radius}
          rotation={o.rotation}
          {...look}
        />
      );
    case "star":
      return (
        <StarPolygon
          type={o.shape}
          radius={o.radius}
          rotation={o.rotation}
          {...look}
        />
      );
  }
}
