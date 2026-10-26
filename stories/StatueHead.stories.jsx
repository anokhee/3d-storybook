// Head: the statue heads of the albatross field, stone with dark eyes. A
// POLYMORPHIC object: one skull carved by 34 knobs (HEAD_PARAMS in
// src/albatross/heads.js: skull, jaw, nose, mouth, eyes, ears, neck), every
// one a slider in the Controls panel, grouped as the game's head lab groups
// them. It is the stock head, as the knobs stand; flip "grid" and it is
// the field's whole cast, each variant its own draw of the knobs, laid out
// the way the lab's grid is (the sliders then do not apply). Tagged
// "polymorphic" (in public/library-meta.json), so the sidebar can
// filter to objects like it.
import { StatueHead, HeadGrid, headArgTypes, headArgs } from "./helpers/albatross.jsx";

export default {
  title: "Monuments/Head",
  component: StatueHead,
  argTypes: { grid: { control: "boolean", name: "the whole cast" }, ...headArgTypes },
  args: { grid: false, ...headArgs },
  // The grid wants the wide ground and the top view (see preview.jsx).
  parameters: { stage: (a) => (a.grid ? { ground: "wide", view: "top" } : {}) },
  render: ({ grid, ...knobs }) => (grid ? <HeadGrid /> : <StatueHead knobs={knobs} />),
};

export const Default = {};
