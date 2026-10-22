import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { hue } from "../../world/palette.js";
import { live } from "../../player/events.js";
import { startSpin } from "../../player/flight.js";
import { useGameStore } from "../../game/store.js";
import { RING, RINGS } from "./objects.js";

// The hoops out in space — see objects.js. A torus at each spot, its axis
// the radial line from the planet to begin with, and tumbling slowly
// about an axis laid across it from there. Each frame the doll is checked
// against every hoop still up: if it was on one side of the hoop's plane
// last frame and the other this frame, within the hoop's radius of its
// middle, it flew through. That bumps the multiplier, spins the doll on
// its way through, and starts the hoop fading; once gone it stays gone.
// Near one, free, the doll is drawn in and lined up — see RING.pull — and
// dives at it, on its belly, head first.
const _p = new THREE.Vector3();
const _q = new THREE.Vector3();
const _t = new THREE.Vector3();
const _z = new THREE.Vector3(0, 0, 1);

// Where a hoop sits and which way it faces, from lat/lon: the same
// bearing a station is placed by, at `shell` out. `axis` is the line it
// tumbles about, across the hoop, and `rate` how fast — both dealt from
// the hoop's index so the same hoop always turns the same way.
function place({ lat, lon, shell }, i) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  const dir = new THREE.Vector3(
    Math.cos(la) * Math.sin(lo),
    Math.sin(la),
    Math.cos(la) * Math.cos(lo),
  );
  const center = dir.clone().multiplyScalar(shell);
  // The torus is built round z; turn that onto `dir`.
  const quat = new THREE.Quaternion().setFromUnitVectors(_z, dir);
  // A tumble axis in the hoop's own frame: in its plane, at an angle
  // dealt from the index, so no two neighbors turn alike.
  const a = i * 2.399; // the golden angle, in radians
  const axis = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  const rate =
    RING.tumble * (1 + RING.vary * (((i * 7) % 5) / 4 - 0.5)) * Math.PI * 2;
  return {
    dir,
    center,
    quat,
    axis,
    rate,
    side: 0,
    fading: false,
    alpha: RING.alpha,
  };
}

export default function Rings() {
  const hoops = useMemo(() => RINGS.map(place), []);
  const meshes = useRef([]);
  const geometry = useMemo(
    () => new THREE.TorusGeometry(RING.radius, RING.tube, 16, 48),
    [],
  );
  const ringHit = useGameStore((s) => s.ringHit);

  useFrame((_, dt) => {
    const you = live.you;
    hoops.forEach((h, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      if (h.fading) {
        h.alpha = Math.max(0, h.alpha - (RING.alpha / RING.fade) * dt);
        mesh.material.opacity = h.alpha;
        // Swell a little as it goes, so it reads as a puff rather than a
        // dimmer.
        const s = 1 + (1 - h.alpha / RING.alpha) * 0.4;
        mesh.scale.setScalar(s);
        if (h.alpha <= 0) mesh.visible = false;
        return;
      }
      // The tumble, and where the hole faces now that it has turned.
      mesh.rotateOnAxis(h.axis, h.rate * dt);
      h.dir.copy(_z).applyQuaternion(mesh.quaternion);
      if (!you) return;
      // Which side of the hoop's plane the doll is on, and how far off its
      // axis.
      _p.copy(you.pos).sub(h.center);
      const d = _p.dot(h.dir);
      const side = d > 0 ? 1 : -1;
      _q.copy(_p).addScaledVector(h.dir, -d);
      const off = _q.length();
      // The pull: free and inside reach, the velocity swings onto the
      // line to a point on the hoop's AXIS `lead` ahead of the doll, the
      // way it is going along that axis — so it is drawn onto the axis,
      // through the middle, and out the far side on the same line, rather
      // than let go at the plane. Eased in over the reach, smoothly.
      const P = RING.pull;
      const dist = _p.length();
      if (you.body === null && dist < P.reach && dist > 1e-3) {
        const along = you.vel.dot(h.dir);
        const ahead = along >= 0 ? 1 : -1;
        _t.copy(h.center)
          .addScaledVector(h.dir, d + ahead * P.lead)
          .sub(you.pos);
        const away = _t.length();
        const speed = you.vel.length();
        if (away > 1e-3 && speed > 1e-3 && you.vel.dot(_t) > 0) {
          const near = 1 - dist / P.reach;
          const k = P.rate * near * near * (3 - 2 * near);
          _t.multiplyScalar(speed / away);
          you.vel.lerp(_t, 1 - Math.exp(-k * dt));
          // And the doll dives at it: onto its belly, crown at the hoop's
          // middle — see pose() and DIVE in the flight.
          you.diveTo.copy(_t).normalize();
          you.diveHold = true;
        }
      }
      const crossed =
        h.side !== 0 && side !== h.side && off < RING.radius * RING.catch;
      h.side = side;
      if (!crossed) return;
      h.fading = true;
      // The spin `r` does, as it goes through — minus the swap.
      startSpin(you, false);
      ringHit();
    });
  });

  return hoops.map((h, i) => (
    <mesh
      key={i}
      ref={(m) => (meshes.current[i] = m)}
      geometry={geometry}
      position={h.center}
      quaternion={h.quat}
    >
      <meshBasicMaterial
        color={hue(RING.color)}
        transparent
        opacity={RING.alpha}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  ));
}
