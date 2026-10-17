// The vending machine. Same shape as Bench.stories.jsx (that one has the
// long comments). The one thing to notice: its parameter file nests the
// lit case under `window`, so that is where the panel colour and shelf
// count go in `render`. When a knob does nothing, this is the first thing
// to check: open the project's objects.js and match the nesting exactly.

import { solid } from "@world/palette.js";
import VendingMachine from "@dollies/refactored/nouns/vendingMachine/VendingMachine.jsx";
import { VENDING_MACHINE } from "@dollies/refactored/nouns/vendingMachine/objects.js";

export default {
  title: "Wooden Dollies/Machines/Vending Machine",
  component: VendingMachine,
  argTypes: {
    bodyColor: { control: "color", name: "body colour" },
    doorColor: { control: "color", name: "door colour" },
    panelColor: { control: "color", name: "lit panel colour" },
    width: { control: { type: "range", min: 2, max: 8, step: 0.1 } },
    height: { control: { type: "range", min: 3, max: 9, step: 0.1 } },
    shelves: { control: { type: "range", min: 1, max: 6, step: 1 } },
  },
  args: {
    bodyColor: VENDING_MACHINE.body.color.hex,
    doorColor: VENDING_MACHINE.door.color.hex,
    panelColor: VENDING_MACHINE.window.panel.color.hex,
    width: VENDING_MACHINE.body.width,
    height: VENDING_MACHINE.body.height,
    shelves: VENDING_MACHINE.window.shelves.count,
  },
  render: ({ bodyColor, doorColor, panelColor, width, height, shelves }) => (
    <VendingMachine
      config={{
        body: { color: solid(bodyColor), width, height },
        feet: { color: solid(bodyColor) },
        door: { color: solid(doorColor) },
        window: { panel: { color: solid(panelColor) }, shelves: { count: shelves } },
      }}
    />
  ),
};

export const Default = {};

export const Tall = { args: { height: 8, shelves: 5 } };

export const Mint = {
  args: { bodyColor: "#8FD5C2", doorColor: "#5BAE98", panelColor: "#FFF6EF" },
};
