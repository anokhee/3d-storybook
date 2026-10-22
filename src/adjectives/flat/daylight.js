// THE HOURS OF THE DAY, from the albatross project. One number, 0 = night,
// 1 = full day, blends everything that makes the hour: the sky, the
// skylight (sky and ground colors and strength), the sun's color and
// strength, and the rim light. On the way it passes through a violet
// twilight and an orange sunrise; each stop sits at its `at` along the
// slider and neighbors blend into each other.
//
// To change the look of an hour, edit its stop. To add one, insert it in
// order with its own `at`.
import * as THREE from "three";

export const HOURS = [
  {
    at: 0, // night: inky blue-black
    sky: 0x0e1118,
    hemiSky: 0x7a8394,
    hemiGround: 0x1c1f26,
    hemiPower: 0.75,
    sunColor: 0xf4ecd6,
    sunPower: 2.0,
    rimColor: 0x5d6778,
    rimPower: 0.6,
  },
  {
    at: 0.25, // twilight: the sky just lifting to violet
    sky: 0x2b2940,
    hemiSky: 0x77708e,
    hemiGround: 0x221f28,
    hemiPower: 0.8,
    sunColor: 0xd4d6de, // still the moon
    sunPower: 1.5,
    rimColor: 0x5e6284,
    rimPower: 0.6,
  },
  {
    at: 0.5, // sunrise / sunset: low orange sun, peach sky, cool rim
    sky: 0xe39a68,
    hemiSky: 0xeab08a,
    hemiGround: 0x44342c,
    hemiPower: 0.9,
    sunColor: 0xff9d52,
    sunPower: 2.1,
    rimColor: 0x7a74a4,
    rimPower: 0.6,
  },
  {
    at: 1, // day: bright, pale morning light, kept soft
    sky: 0xebe6d6,
    hemiSky: 0xf0ecdd,
    hemiGround: 0x6b6a63,
    hemiPower: 1.3,
    sunColor: 0xfff3da,
    sunPower: 1.7,
    rimColor: 0xcfc9b6,
    rimPower: 0.55,
  },
];

// The two stops t falls between, and how far along from the first.
export function hourSpan(t) {
  let i = 0;
  while (i < HOURS.length - 2 && t > HOURS[i + 1].at) i++;
  const a = HOURS[i],
    b = HOURS[i + 1];
  return [a, b, (t - a.at) / (b.at - a.at)];
}

const _a = new THREE.Color();
const _b = new THREE.Color();
// The hour's color for `key` (sky, hemiSky, hemiGround, sunColor,
// rimColor), written into `target`.
export function hourColor(target, key, t) {
  const [a, b, f] = hourSpan(t);
  return target.lerpColors(_a.set(a[key]), _b.set(b[key]), f);
}

// The hour's number for `key` (hemiPower, sunPower, rimPower).
export function hourValue(key, t) {
  const [a, b, f] = hourSpan(t);
  return THREE.MathUtils.lerp(a[key], b[key], f);
}

// Everything for the hour at once, as fresh values: handy for React.
export function hourOf(t) {
  const c = (key) => "#" + hourColor(new THREE.Color(), key, t).getHexString();
  return {
    sky: c("sky"),
    hemiSky: c("hemiSky"),
    hemiGround: c("hemiGround"),
    hemiPower: hourValue("hemiPower", t),
    sunColor: c("sunColor"),
    sunPower: hourValue("sunPower", t),
    rimColor: c("rimColor"),
    rimPower: hourValue("rimPower", t),
  };
}
