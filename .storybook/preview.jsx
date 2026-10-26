// PREVIEW: settings that apply to every story, the toolbar switches, and
// the decorator that puts each story's object on the shared stage (see
// stage.jsx).
//
// What to edit here:
//   initialGlobals     the look and hour a fresh page opens with
//   storySort.order    the order of top-level groups in the sidebar
//   controls.matchers  which arg names automatically get a color picker
// The toolbar tools themselves (the lightbulb, the slider) are in tools.jsx.

import React, { useEffect, useLayoutEffect } from "react";

import { ensureStage, useStage } from "./stage.jsx";
import { storyTheme } from "./theme.js";

// A "decorator" wraps every story. This one renders NOTHING of its own: it
// makes sure the stage exists, puts the story's object on it along with
// the toolbar's choices, and takes the object off when the story goes away.
function OnStage({ story, storyId, lighting, daylight, view, ground, lights, backdrop, frame }) {
  useLayoutEffect(() => {
    ensureStage();
    useStage.setState({ node: story, storyId, lighting, daylight, view, ground, lights, backdrop, frame });
  });
  useEffect(() => () => useStage.setState({ node: null, storyId: null }), []);
  return null;
}

// A story with parameters.stage.off renders as ordinary DOM instead (the
// Catalog page); the stage just hides.
function OffStage() {
  useLayoutEffect(() => {
    useStage.setState({ node: null, storyId: null });
  }, []);
  return null;
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [
    (Story, ctx) => {
      // parameters.stage is an object, or a function of the story's args
      // (a toggle that turns one doll into a grid of them wants the wide
      // ground and the top view only when it is on).
      const stage = (typeof ctx.parameters.stage === "function" ? ctx.parameters.stage(ctx.args) : ctx.parameters.stage) ?? {};
      return stage.off ? (
        <>
          <OffStage />
          <Story />
        </>
      ) : (
        <OnStage
          story={<Story />}
          // The stage refits its camera when this changes: the story, or the
          // view or ground the args asked for.
          storyId={`${ctx.id}#${stage.view ?? ""}/${stage.ground ?? ""}/${stage.frame ?? ""}`}
          lighting={ctx.globals.lighting ?? "toon"}
          daylight={Number(ctx.globals.daylight ?? 1)}
          // A story may ask for a camera angle: parameters.stage.view is
          // "front" (seen square-on) or left out (the usual three-quarter).
          view={stage.view ?? "default"}
          // ...and for a ground: "planet" (the curved top of the planet, for
          // water features) or left out (the flat disc).
          ground={stage.ground ?? "flat"}
          // ...and "own" lights: the stage then lights nothing, the story does.
          lights={stage.lights ?? "look"}
          // ...and a backdrop: "space" (dark, starless of itself, no ground) or the sky.
          backdrop={stage.backdrop ?? "sky"}
          // ...and a frame: the size of a cube the camera fits to instead of
          // the object, so stories sharing one come out equally zoomed.
          frame={stage.frame ?? null}
        />
      );
    },
  ],

  // The globals the toolbar tools write (see tools.jsx) and what a fresh
  // page opens with: the toon look at full day.
  globalTypes: {
    lighting: { description: "How the objects are lit and shaded: toon or flat" },
    daylight: { description: "Time of day, 0 = night to 1 = day" },
  },
  initialGlobals: {
    lighting: "toon",
    daylight: 1,
  },

  parameters: {
    // No padding round the viewport; the stage fills it.
    layout: "fullscreen",
    // The docs pages (About.mdx) use the same theme as the shell.
    docs: { theme: storyTheme },
    // Storybook's own page tools make no sense on a 3D stage, so they are
    // off: backgrounds (and its grid), outline, viewport sizes, measure.
    backgrounds: { disable: true },
    outline: { disable: true },
    viewport: { disable: true },
    measure: { disable: true },
    // And the panels that are not Controls: Actions, Interactions.
    actions: { disable: true },
    interactions: { disable: true },
    controls: {
      // Two columns only: the knob's name and its control. (true adds
      // Description and Default columns.)
      expanded: false,
      // Any arg whose name ends in "color" or "background" gets a color
      // picker even if its story does not say `control: "color"`.
      matchers: { color: /(background|color)$/i },
    },
    options: {
      // Sidebar order. Groups not listed come after, alphabetically.
      // Add a new category here to place it.
      storySort: {
        order: [
          "About",
          "Catalog",
          "Furniture", ["Seating", "Surfaces", "Bedroom", "Bathroom", "Appliances", "Water Fixtures", "Lighting", "Floor Decor", "Wall Decor", "Pot Plants", "*"],
          "Props", ["Kitchen", "Luggage", "*"],
          "Machines",
          "Machine Parts",
          "Fixtures", ["Windows", "Doors", "Arches", "Fences", "*"],
          "Buildings",
          "Nature",
          "Ornaments",
          "Sky",
          "Planets",
          "Animals", ["Pets", "Birds", "*"],
          "Characters",
          "Toys",
          "Instruments",
          "Monuments",
          "Misc",
          "*",
        ],
      },
    },
  },
};

export default preview;
