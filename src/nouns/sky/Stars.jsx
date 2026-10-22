import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { swatchList, varied } from "../../world/palette.js";
import { mulberry32, between } from "../../world/random.js";
import { scatter } from "../../world/layout.js";
import { merge } from "../../world/merge.js";
import { primitiveGeometry } from "../primitive/geometry.js";
import { haloTexture } from "../../adjectives/lit/halo.js";
import { GLOW } from "../../lighting.js";
import { SKY, STARS } from "./objects.js";

// One white halo, tinted per star the way the body is. Made once, on first
// use, since it needs a canvas.
let _halo = null;
const halo = () => (_halo ??= haloTexture({ hex: "#ffffff" }, 1));

// The starfield: every star as one instanced sphere, and — when `halo` — one
// instanced smear behind each, turned to face the middle of the world. The
// stars sit on a shell round the planet, so a halo facing the center faces
// the camera closely enough from anywhere the camera can be.
//
// `config` overrides STARS.
export default function Stars({ config }) {
  const S = useMemo(() => merge(STARS, config), [config]);
  const body = useRef();
  const glow = useRef();

  const geometry = useMemo(
    () => primitiveGeometry("sphere", S.radius, undefined, S.detail),
    [S.radius, S.detail],
  );
  const haloGeo = useMemo(() => {
    if (!S.halo) return null;
    const across = S.radius * GLOW.halo.reach * 2;
    return new THREE.PlaneGeometry(across, across);
  }, [S.halo, S.radius]);
  const swatches = useMemo(
    () => swatchList(S.colors, "STARS colors"),
    [S.colors],
  );

  useLayoutEffect(() => {
    const rand = mulberry32(S.seed);
    const one = new THREE.Object3D();
    const tint = new THREE.Color();
    const centre = new THREE.Vector3();
    let n = 0;
    for (const dir of scatter(S.density)) {
      const size = between(S.size, rand);
      const bright = between(S.brightness, rand);

      one.position.copy(dir).multiplyScalar(SKY.shell);
      one.lookAt(centre);
      one.scale.setScalar(size);
      one.updateMatrix();
      body.current.setMatrixAt(n, one.matrix);

      // The halo grows and fades with brightness, the way a Glow's does.
      if (glow.current) {
        one.scale.setScalar(size * bright);
        one.updateMatrix();
        glow.current.setMatrixAt(n, one.matrix);
      }

      const swatch = swatches[Math.floor(rand() * swatches.length)];
      varied(swatch, rand, tint).multiplyScalar(bright);
      body.current.setColorAt(n, tint);
      glow.current?.setColorAt(n, tint);
      n++;
    }
    const done = (m) => {
      if (!m) return;
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    done(body.current);
    done(glow.current);
  }, [S, swatches, geometry, haloGeo]);

  // The field wraps the whole sky, so its bounding sphere is useless as a
  // cull test.
  return (
    <group>
      {/* Basic: a star is its own color from any angle, shaded by nothing.
          White here so the instance color is the whole of it. */}
      <instancedMesh
        ref={body}
        args={[geometry, undefined, S.density]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#ffffff" fog={false} />
      </instancedMesh>
      {haloGeo && (
        <instancedMesh
          ref={glow}
          args={[haloGeo, undefined, S.density]}
          frustumCulled={false}
        >
          <meshBasicMaterial
            map={halo()}
            color="#ffffff"
            transparent
            opacity={GLOW.halo.alpha}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            fog={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
