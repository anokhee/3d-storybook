import React from "react";
import { createRoot } from "react-dom/client";
import "../mapmaker/mapmaker.css";
import "./interiors.css";
import Scene from "./Scene.jsx";
import { TopBar, Catalog, Inspector, Hint } from "./Panel.jsx";
import { useEditor } from "./store.js";
import { ROOMS } from "./shops.js";
import { componentOf } from "../mapmaker/catalog.js";
import { PLACED } from "../src/world/placed.js";

// The catalog, for the objects pasted in from it (world/placed.js)
PLACED.set(componentOf);

// For poking at it from the browser console: window.__ie.useEditor.getState()
window.__ie = { ...(window.__ie ?? {}), useEditor, ROOMS };

function App() {
  return (
    <>
      <Scene />
      <TopBar />
      <Catalog />
      <Inspector />
      <Hint />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
