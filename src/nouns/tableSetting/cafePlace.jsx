import { solid } from "../../world/palette.js";
import { CAFE_TABLE } from "../cafeTable/objects.js";
import { rngOf, hashOf } from "../shopInterior/objects.js";
import { swatches } from "../shelving/crockery.js";
import TableSetting from "./TableSetting.jsx";

// A PLACE LAID AT A CAFÉ TABLE for whoever sits there: a Table Setting
// (Food/Kitchen/Table Setting) on the tabletop in front of their chair —
// inside a café (Shop Interior's diners) and at its tables out front alike.
// What's laid is dealt by the chair's `key`, the same each time.
const TABLE_TOP = (CAFE_TABLE.table.height + CAFE_TABLE.table.thickness) * CAFE_TABLE.scale;
const SETTING_AT = CAFE_TABLE.chairs.apart * CAFE_TABLE.scale - 0.17; // the plate's middle, in from the chair
const FOODS = ["#D9A066", "#E07A6B", "#6FA35A", "#F2C94C", "#8A5A3C"];
const settings = new Map(); // each chair's setting's config, made once
// `theme` the café's goods (its colours, and its looks for the china: the
// style's `bowls`): each place's plate, bowl and teacup in one of those
// looks, its mug in one of those colours, plain
export function settingOf(key, theme) {
  const id = `${key}|${theme ? JSON.stringify([theme.colors, theme.bowls]) : ""}`;
  if (!settings.has(id)) {
    const r = rngOf(hashOf(key));
    settings.set(id, {
      food: { on: r() < 0.75, color: { hex: FOODS[Math.floor(r() * FOODS.length)] } },
      mug: { full: r() < 0.6 ? 0.92 : 0 },
    });
    // dealt after the rest so the food and coffee stay as they were: a
    // bowl at one place in five, and a teacup or a glass beside some
    const s = settings.get(id);
    s.dish = r() < 0.2 ? "bowl" : "plate";
    const d = r();
    s.drink = d < 0.6 ? "mug" : d < 0.82 ? "teacup" : "glass";
    s.bowl = { contents: ["noodles", "curry", "apple and banana", "orange and apple"][Math.floor(r() * 4)] };
    s.utensils = s.dish === "bowl" && (s.bowl.contents === "noodles" || s.bowl.contents === "curry") ? "spoon" : "fork and knife";
    s.holds = { mug: s.mug.full ? "coffee" : "empty", teacup: r() < 0.7 ? "tea" : "green tea", glass: ["water", "juice", "lemonade", "cola"][Math.floor(r() * 4)] };
    // the café's own china (dealt last, so the rest stays as it was)
    const looks = theme?.bowls, cols = theme?.colors;
    if (looks?.length) {
      const look = looks[Math.floor(r() * looks.length)];
      if (look.design === "basic") {
        const c = solid(look.colors.bowl);
        s.plate = { color: c }; s.bowl = { ...s.bowl, design: "basic", colors: { bowl: c } }; s.teacup = { design: "basic", colors: { cup: c, saucer: c } };
      } else {
        const colors = swatches(look.colors);
        s.plate = { design: look.design, colors }; s.bowl = { ...s.bowl, design: look.design, colors }; s.teacup = { design: look.design, colors };
      }
    }
    if (cols?.length) s.mug = { ...s.mug, colors: { mug: solid(cols[Math.floor(r() * cols.length)]) } };
  }
  return settings.get(id);
}

// `who` (someone sat in the chair, in the chair's frame) and, if there is
// someone, the place laid in front of them; nobody, nothing.
export function placeAt(who, key, theme) {
  if (!who) return null;
  return (
    <>
      {who}
      <group position={[0, TABLE_TOP, SETTING_AT]} scale={CAFE_TABLE.scale}>
        <TableSetting config={settingOf(key, theme)} />
      </group>
    </>
  );
}
