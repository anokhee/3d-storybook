// The masonry wall: fixed columns, each dolly hung by the chin of the one
// above it. Takes the dolls' metrics() and hands back where each stands, plus
// the wall's half-extents so a camera can be backed off to fit it.
import { GRID_LAYOUT } from "./gridState.js";

export function layoutWall(size, layout = GRID_LAYOUT) {
  const { cols: COLS, airGap: AIR_GAP, colGap: COL_GAP } = layout;
  const N = size.length;

  const slotHalf = size.map((m) => m.halfWidth); // half the slot's width
  const slotTop = size.map((m) => m.height); // how far the dolly reaches above the floor line
  const chin = size.map((m) => m.chin); // where the dolly's bottom sits relative to its origin

  const colOf = (i) => i % COLS;
  const inCol = (c) => slotHalf.filter((_, i) => colOf(i) === c);

  // each column has the width of its fattest dolly
  const colHalf = Array.from({ length: COLS }, (_, c) =>
    Math.max(0, ...inCol(c)),
  );
  const colX = [];
  for (let c = 0; c < COLS; c++)
    colX.push(
      c === 0 ? 0 : colX[c - 1] + colHalf[c - 1] + COL_GAP + colHalf[c],
    );

  // finds the middle of each dolly
  const midX = (colX[0] - colHalf[0] + colX[COLS - 1] + colHalf[COLS - 1]) / 2;

  // top row dollies are aligned to the bottom and bototm row dollies are aligned to the top
  const cursor = new Array(COLS).fill(null);
  const posY = [];
  for (let i = 0; i < N; i++) {
    const c = colOf(i);
    posY.push(cursor[c] === null ? -chin[i] : cursor[c] - slotTop[i] - chin[i]);
    cursor[c] = posY[i] + chin[i] - AIR_GAP;
  }

  // once the whole wall of dollies is built and positioned, this measures the grid's total height/width so the camera can be centered on it
  const tops = posY.map((y, i) => y + chin[i] + slotTop[i]);
  const bottoms = posY.map((y, i) => y + chin[i]);
  const midY = (Math.max(...tops) + Math.min(...bottoms)) / 2;

  const halfW =
    (colX[COLS - 1] + colHalf[COLS - 1] - (colX[0] - colHalf[0])) / 2;
  const halfH = (Math.max(...tops) - Math.min(...bottoms)) / 2;

  const positions = Array.from({ length: N }, (_, i) => [
    colX[colOf(i)] - midX,
    posY[i] - midY,
    0,
  ]);
  return { positions, halfW, halfH };
}

// standard camera-fit-to-bounding-box calculation: how far back a camera of
// this fov and aspect has to stand to see the whole wall
export function fitDistance(
  halfW,
  halfH,
  fovDeg,
  aspect,
  margin = GRID_LAYOUT.fitMargin,
) {
  const fovY = (fovDeg * Math.PI) / 180;
  return (
    Math.max(halfH / Math.tan(fovY / 2), halfW / Math.tan(fovY / 2) / aspect) *
    margin
  );
}
