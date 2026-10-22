import { useEffect, useMemo } from "react";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { tileMaterial } from "./Basin.jsx";
import { tubGeometry } from "./basin.js";
import Ladder from "./Ladder.jsx";

// An above-ground pool's tub, in the pool's frame — see TUB in objects.js
// and tubGeometry in basin.js for its shape. Tiled inside like a pool,
// in the pool's tile; panelled outside in its own color with a band
// round it; a rim round the top; a ladder up the outside and over. All
// of it stands ON the ground, so unlike the dug pool it needs no hole cut
// in the ground to be seen. Rebuilt only when the pool's shape changes
// (its `key`), like the sheet.
export default function Tub({ pool }) {
  const W = pool.W;
  const T = W.tub;
  const P = W.pool;
  const { liner, panel, rim } = useMemo(
    () => tubGeometry(pool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key, T],
  );
  useEffect(
    () => () => (liner.dispose(), panel.dispose(), rim.dispose()),
    [liner, panel, rim],
  );
  const tileMat = useMemo(
    () => tileMaterial(P.colors.tile, P.colors.grout, P.tile, P.grout),
    [P.colors.tile, P.colors.grout, P.tile, P.grout],
  );
  useEffect(() => () => tileMat.dispose(), [tileMat]);
  // The band: the panel's own wall again, in the band's color, cut to
  // the band's height — a second sheet a hair outside the first.
  const band = useMemo(() => {
    if (!(T.band.height > 0)) return null;
    const g = panel.clone();
    const pos = g.getAttribute("position");
    const tile = g.getAttribute("tile");
    const nrm = g.getAttribute("normal");
    const lo = T.band.lift,
      hi = T.band.lift + T.band.height;
    for (let i = 0; i < pos.count; i++) {
      // Each point's height up the wall is its tile's y; the sheet is
      // squeezed to the band and pushed out along its normal.
      const y = tile.getY(i);
      const to = y > T.height / 2 ? hi : lo;
      const k = (to - y) * 0.999;
      // Up the wall is the ground's up, near enough: the pool's y.
      pos.setXYZ(
        i,
        pos.getX(i) + nrm.getX(i) * 0.015,
        pos.getY(i) + k,
        pos.getZ(i) + nrm.getZ(i) * 0.015,
      );
    }
    pos.needsUpdate = true;
    return g;
  }, [panel, T]);
  useEffect(() => () => band?.dispose(), [band]);
  return (
    <group>
      <mesh geometry={liner} material={tileMat} />
      <mesh geometry={panel} material={unlitMat(T.colors.panel)} castShadow />
      {band && <mesh geometry={band} material={unlitMat(T.colors.band)} />}
      <mesh geometry={rim} material={unlitMat(T.colors.rim)} castShadow />
      {T.ladder && (
        <Ladder
          pool={pool}
          L={T.ladder}
          top={T.height + T.rim.thickness}
          bed={() => T.height + T.rim.thickness - T.bed}
          footDrop={T.height + T.rim.thickness}
        />
      )}
    </group>
  );
}
