// THE CLAY SWITCH.
//
// Every object was modeled in lumpy clay: its surfaces are pushed in and
// out by a bump field so a cube reads as a thumbed block rather than a
// box. For the library the objects are shown FLAT: clean primitives, crisp
// edges. Flip this to true to get the clay back everywhere at once.
//
// It is read in the four places the lumps are made: primitive/geometry.js
// (every solid), grass/clay.js (grass blades), moon/Moon.jsx (the moon's
// terrain) and planet/ground.js (the ground's surface).
export const CLAY_ON = false;
