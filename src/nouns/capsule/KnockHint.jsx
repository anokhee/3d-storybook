import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";

import { useGameStore } from "../../game/store.js";
import { onEvent } from "../../player/events.js";
import { MouseLeft } from "../../ui/Prompt.jsx";

// The prompt over the shut capsule: a left-click mouse, floating above
// it and glowing, until it is knocked on. A knock puts it out; left alone
// for `after` ms with the capsule still shut, it comes back and glows
// again. Gone for good once the doll has hatched. Every knob is `hint` on
// the capsule's config (see objects.js).
//
// A DOM node projected to the group's place (drei's Html), so it is
// drawn as the line art it is rather than as a texture; it takes no
// pointer events, so a click through it is a knock like any other.
const CSS = `
@keyframes knock-hint-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes knock-hint-glow {
  0%, 100% { opacity: 0.55; filter: drop-shadow(0 0 2px var(--hint)); }
  50% { opacity: 1; filter: drop-shadow(0 0 9px var(--hint)); }
}
.knock-hint {
  pointer-events: none;
  color: var(--hint);
  transition: opacity 0.6s ease;
  animation: knock-hint-float 2.2s ease-in-out infinite;
}
.knock-hint svg {
  display: block;
  animation: knock-hint-glow 1.6s ease-in-out infinite;
}
.knock-hint.out { opacity: 0; }
`;

export default function KnockHint({ config: H }) {
  const shut = useGameStore((s) => s.phase === "capsule");
  const [shown, setShown] = useState(true);

  // A knock puts it out, and starts the wait for it to come back.
  useEffect(() => {
    let timer = null;
    const off = onEvent((name) => {
      if (name !== "knock") return;
      setShown(false);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(true), H.after);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [H.after]);

  if (!shut) return null;
  return (
    <Html
      center
      position={[0, H.above, 0]}
      zIndexRange={[5, 0]}
      style={{ pointerEvents: "none" }}
    >
      <style>{CSS}</style>
      <div
        className={`knock-hint${shown ? "" : " out"}`}
        style={{ "--hint": H.color }}
      >
        <MouseLeft size={H.size} />
      </div>
    </Html>
  );
}
