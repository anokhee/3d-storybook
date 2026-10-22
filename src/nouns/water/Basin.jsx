import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { hue } from "../../world/palette.js";
import { CEL, toon } from "../../adjectives/unlit/toon.js";
import { basinGeometry, basinMaskGeometry } from "./basin.js";
import { poolDepthAt } from "./pools.js";
import Ladder from "./Ladder.jsx";

// A swimming pool's tub, dug into the ground — see basin.js for its
// shape and POOL (objects.js) for what it is. The tub lies UNDER the
// ground, so the ground has to be cut away over it: the same trick the
// vending machine's case plays on its body, with the stencil buffer. A
// mask the shape of the water's opening is drawn first, invisibly, and
// sets the POOL_BIT of the stencil wherever it lies; the ground is
// painted everywhere BUT there (see HOLED, worn by the planet and the
// moon), and so writes no depth there either. The tub, drawn as anything
// is, then shows through the opening, its bed and walls sorting against
// each other and against whatever swims in it by depth as usual — and
// the ground round the opening still hides the walls' far side where the
// rim cuts them off, since its depth is there as ever. Only the top bit
// is touched, so a vending machine's own number in the low bits is left
// alone (the mask goes down before the machine's, which replaces the
// whole byte inside its window — where the case covers the ground
// anyway).
export const POOL_BIT = 0x80;

// What the ground wears to leave the pools' openings unpainted: spread
// over its material.
export const HOLED = {
  stencilWrite: true, // the switch that turns the test on at all
  stencilWriteMask: 0, // ...but the ground writes nothing itself
  stencilRef: POOL_BIT,
  stencilFuncMask: POOL_BIT,
  stencilFunc: THREE.NotEqualStencilFunc,
};

const maskMaterial = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
  stencilWrite: true,
  stencilWriteMask: POOL_BIT,
  stencilRef: POOL_BIT,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.ReplaceStencilOp,
});

// Tile: the world's toon in the tile's color, ruled into squares `size`
// across by lines of grout `width` wide, each tile a shade off its
// neighbors so the sheet reads as laid by hand. Ruled over the `tile`
// each point carries (see basin.js) rather than over space, so the walls
// are tiled up and along them the way the bed is across it. Cut hard, a
// pixel soft, the way the foam is.
export function tileMaterial(swatch, groutSwatch, size, width) {
  const m = toon(hue(swatch));
  m.onBeforeCompile = (shader) => {
    CEL.onBeforeCompile(shader);
    shader.uniforms.tileSize = { value: size };
    shader.uniforms.groutWidth = { value: width };
    shader.uniforms.groutColor = { value: hue(groutSwatch) };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `attribute vec2 tile;
         varying vec2 vTile;
         #include <common>`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vTile = tile;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `uniform float tileSize;
         uniform float groutWidth;
         uniform vec3 groutColor;
         varying vec2 vTile;
         #include <common>`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         {
           vec2 cell = floor( vTile / tileSize );
           float shade = fract( sin( dot( cell, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
           diffuseColor.rgb *= 0.94 + 0.1 * shade;
           vec2 g = abs( fract( vTile / tileSize + 0.5 ) - 0.5 ) * tileSize;
           float d = min( g.x, g.y );
           float w = fwidth( d );
           float grout = 1.0 - smoothstep( groutWidth * 0.5 - w, groutWidth * 0.5 + w, d );
           diffuseColor.rgb = mix( diffuseColor.rgb, groutColor, grout );
         }`,
      );
  };
  return m;
}

// One pool's tub, in the pool's frame. Rebuilt only when the pool's shape
// changes (its `key`), like the sheet.
export default function Basin({ pool }) {
  const P = pool.W.pool;
  const { tile, border, mask } = useMemo(
    () => ({ ...basinGeometry(pool), mask: basinMaskGeometry(pool) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key, P],
  );
  useEffect(
    () => () => (tile.dispose(), border.dispose(), mask.dispose()),
    [tile, border, mask],
  );
  const tileMat = useMemo(
    () => tileMaterial(P.colors.tile, P.colors.grout, P.tile, P.grout),
    [P.colors.tile, P.colors.grout, P.tile, P.grout],
  );
  const borderMat = useMemo(
    () => tileMaterial(P.colors.border, P.colors.borderGrout, P.tile, P.grout),
    [P.colors.border, P.colors.borderGrout, P.tile, P.grout],
  );
  useEffect(() => () => tileMat.dispose(), [tileMat]);
  useEffect(() => () => borderMat.dispose(), [borderMat]);
  return (
    <group>
      {/* Before everything, so the ground finds the mark already there —
        and before the vending machines' masks (-10), which replace the
        whole byte. */}
      <mesh geometry={mask} material={maskMaterial} renderOrder={-11} />
      <mesh geometry={tile} material={tileMat} />
      <mesh geometry={border} material={borderMat} />
      {P.ladder && (
        <Ladder
          pool={pool}
          L={P.ladder}
          top={P.lip}
          bed={(x, z) => P.lip + poolDepthAt(pool, x, z)}
        />
      )}
    </group>
  );
}
