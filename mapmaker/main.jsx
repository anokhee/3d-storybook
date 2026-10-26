import React from "react";
import { createRoot } from "react-dom/client";
import Scene from "./Scene.jsx";
import { TopBar, Catalog, Inspector, Hint } from "./Panel.jsx";
import { useMap } from "./store.js";
import { ENTRIES } from "./catalog.js";

// For poking at it from the browser console: window.__mm.useMap.getState()
window.__mm = { useMap, ENTRIES };

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
