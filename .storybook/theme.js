// THEME: the colours and fonts of the Storybook shell (sidebar, toolbar,
// Controls panel, docs pages). This is the file to edit for look and feel.
//
// Every key is a Storybook theme variable. The full list is at
// https://storybook.js.org/docs/configure/user-interface/theming
// Fonts are loaded in manager-head.html and preview-head.html; to use a
// different one, change the <link> in both and the two font keys below.

import { create } from "storybook/theming";

// Named once so the same ink and accent are reused below.
const ink = "#2B3A47";      // body text
const steel = "#5F7F98";    // accent: links, focus rings, active bits

export const storyTheme = create({
  base: "light",            // "light" or "dark": sets sensible defaults

  // Top-left title and where clicking it goes.
  brandTitle: "object library",
  brandUrl: "https://github.com/anokhee/3d-storybook",
  // brandImage: "logo.svg",   // uncomment to show a logo instead of text

  fontBase: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
  fontCode: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',

  colorPrimary: steel,
  colorSecondary: "#4F6E86", // the selected sidebar item and most highlights

  // The three big surfaces: sidebar, panels, and the frame round the preview.
  appBg: "#DFE6EB",
  appContentBg: "#EEF2F5",
  appPreviewBg: "#DDE4EA",   // matches SKY in stage.jsx
  appBorderColor: "#C3CED7",
  appBorderRadius: 4,

  textColor: ink,
  textInverseColor: "#EEF2F5",
  textMutedColor: "#66788A",

  // The toolbar above the preview and the tab bar above the Controls panel.
  barBg: "#E7EDF1",
  barTextColor: "#4A5C6C",
  barHoverColor: "#2F4A5F",
  barSelectedColor: "#2F4A5F",

  // Buttons, toggles and the inputs in the Controls panel.
  buttonBg: "#E7EDF1",
  buttonBorder: "#C3CED7",
  booleanBg: "#E7EDF1",
  booleanSelectedBg: "#C9D6E0",
  inputBg: "#F6F8FA",
  inputBorder: "#C3CED7",
  inputTextColor: ink,
  inputBorderRadius: 3,
});
