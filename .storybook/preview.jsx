// PREVIEW: settings that apply to every story, and the decorator that puts
// each story's object on the shared stage (see stage.jsx).
//
// What to edit here:
//   storySort.order   the order of top-level groups in the sidebar
//   controls.matchers which arg names automatically get a colour picker

import React, { useEffect, useLayoutEffect } from "react";

import { ensureStage, useStage } from "./stage.jsx";
import { storyTheme } from "./theme.js";

// A "decorator" wraps every story. This one renders NOTHING of its own: it
// makes sure the stage exists, puts the story's object on it, and takes the
// object off again when the story goes away.
function OnStage({ story, storyId }) {
  ensureStage();
  useLayoutEffect(() => {
    useStage.setState({ node: story, storyId });
  });
  useEffect(() => () => useStage.setState({ node: null, storyId: null }), []);
  return null;
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [(Story, ctx) => <OnStage story={<Story />} storyId={ctx.id} />],
  parameters: {
    // No padding round the viewport; the stage fills it.
    layout: "fullscreen",
    // The docs pages (About.mdx) use the same theme as the shell.
    docs: { theme: storyTheme },
    controls: {
      // Show every knob's description column, not just the widget.
      expanded: true,
      // Any arg whose name ends in "color" or "background" gets a colour
      // picker even if its story does not say `control: "color"`.
      matchers: { color: /(background|color)$/i },
    },
    options: {
      // Sidebar order. Groups not listed come after, alphabetically.
      // Add a new project's title here to place it.
      storySort: { order: ["About", "Wooden Dollies", "*"] },
    },
  },
};

export default preview;
