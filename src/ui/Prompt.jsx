import {
  Mouse,
  MouseLeftClick,
  MouseRightClick,
  MouseScroll,
} from "@phosphor-icons/react";
// Only the keycaps are imported, by name: a namespace import with a
// computed lookup keeps every one of Tabler's icons in the bundle.
import {
  IconSquareLetterA,
  IconSquareLetterB,
  IconSquareLetterC,
  IconSquareLetterD,
  IconSquareLetterE,
  IconSquareLetterF,
  IconSquareLetterG,
  IconSquareLetterH,
  IconSquareLetterI,
  IconSquareLetterJ,
  IconSquareLetterK,
  IconSquareLetterL,
  IconSquareLetterM,
  IconSquareLetterN,
  IconSquareLetterO,
  IconSquareLetterP,
  IconSquareLetterQ,
  IconSquareLetterR,
  IconSquareLetterS,
  IconSquareLetterT,
  IconSquareLetterU,
  IconSquareLetterV,
  IconSquareLetterW,
  IconSquareLetterX,
  IconSquareLetterY,
  IconSquareLetterZ,
  IconSquareRoundedLetterA,
  IconSquareRoundedLetterB,
  IconSquareRoundedLetterC,
  IconSquareRoundedLetterD,
  IconSquareRoundedLetterE,
  IconSquareRoundedLetterF,
  IconSquareRoundedLetterG,
  IconSquareRoundedLetterH,
  IconSquareRoundedLetterI,
  IconSquareRoundedLetterJ,
  IconSquareRoundedLetterK,
  IconSquareRoundedLetterL,
  IconSquareRoundedLetterM,
  IconSquareRoundedLetterN,
  IconSquareRoundedLetterO,
  IconSquareRoundedLetterP,
  IconSquareRoundedLetterQ,
  IconSquareRoundedLetterR,
  IconSquareRoundedLetterS,
  IconSquareRoundedLetterT,
  IconSquareRoundedLetterU,
  IconSquareRoundedLetterV,
  IconSquareRoundedLetterW,
  IconSquareRoundedLetterX,
  IconSquareRoundedLetterY,
  IconSquareRoundedLetterZ,
} from "@tabler/icons-react";

// Input prompts, as line art: the mouse with a button lit, and a letter
// key in its cap. Two icon sets — Phosphor for the mouse (it is the one
// with the buttons), Tabler for the keys (it has A–Z in squares) — drawn
// to one weight here so they sit together as one hand. `size` is in px;
// every prop past it goes to the svg (className, style, color...).
//
//   <MouseLeft size={28} />   <Key letter="e" />   <Key letter="r" rounded />
const PROMPT = {
  size: 24,
  color: "currentColor",
  // Phosphor's stroke weights are named; "light" is the thin one that
  // still reads at 24px. Tabler's is a number in its 24-unit box.
  mouse: { weight: "light" },
  key: { stroke: 1.25 },
};

const mouse =
  (Icon) =>
  ({ size = PROMPT.size, color = PROMPT.color, ...rest }) => (
    <Icon size={size} color={color} weight={PROMPT.mouse.weight} {...rest} />
  );

export const MousePlain = mouse(Mouse);
export const MouseLeft = mouse(MouseLeftClick);
export const MouseRight = mouse(MouseRightClick);
export const MouseWheel = mouse(MouseScroll);

const CAPS = {
  plain: {
    A: IconSquareLetterA,
    B: IconSquareLetterB,
    C: IconSquareLetterC,
    D: IconSquareLetterD,
    E: IconSquareLetterE,
    F: IconSquareLetterF,
    G: IconSquareLetterG,
    H: IconSquareLetterH,
    I: IconSquareLetterI,
    J: IconSquareLetterJ,
    K: IconSquareLetterK,
    L: IconSquareLetterL,
    M: IconSquareLetterM,
    N: IconSquareLetterN,
    O: IconSquareLetterO,
    P: IconSquareLetterP,
    Q: IconSquareLetterQ,
    R: IconSquareLetterR,
    S: IconSquareLetterS,
    T: IconSquareLetterT,
    U: IconSquareLetterU,
    V: IconSquareLetterV,
    W: IconSquareLetterW,
    X: IconSquareLetterX,
    Y: IconSquareLetterY,
    Z: IconSquareLetterZ,
  },
  rounded: {
    A: IconSquareRoundedLetterA,
    B: IconSquareRoundedLetterB,
    C: IconSquareRoundedLetterC,
    D: IconSquareRoundedLetterD,
    E: IconSquareRoundedLetterE,
    F: IconSquareRoundedLetterF,
    G: IconSquareRoundedLetterG,
    H: IconSquareRoundedLetterH,
    I: IconSquareRoundedLetterI,
    J: IconSquareRoundedLetterJ,
    K: IconSquareRoundedLetterK,
    L: IconSquareRoundedLetterL,
    M: IconSquareRoundedLetterM,
    N: IconSquareRoundedLetterN,
    O: IconSquareRoundedLetterO,
    P: IconSquareRoundedLetterP,
    Q: IconSquareRoundedLetterQ,
    R: IconSquareRoundedLetterR,
    S: IconSquareRoundedLetterS,
    T: IconSquareRoundedLetterT,
    U: IconSquareRoundedLetterU,
    V: IconSquareRoundedLetterV,
    W: IconSquareRoundedLetterW,
    X: IconSquareRoundedLetterX,
    Y: IconSquareRoundedLetterY,
    Z: IconSquareRoundedLetterZ,
  },
};

// A letter in a keycap. `letter` is any of a–z, either case; `rounded`
// softens the cap's corners.
export function Key({
  letter,
  rounded = false,
  size = PROMPT.size,
  color = PROMPT.color,
  ...rest
}) {
  const L = letter.toUpperCase();
  const Icon = CAPS[rounded ? "rounded" : "plain"][L];
  if (!Icon) throw new Error(`Key: no cap for "${letter}"`);
  return (
    <Icon size={size} color={color} stroke={PROMPT.key.stroke} {...rest} />
  );
}
