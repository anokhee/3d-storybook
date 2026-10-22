import * as THREE from "three";

// Where things stand on the ball, as directions from its center. Distances
// stay with the objects themselves; only the bearings live here.

// A ring of standing points on the xz plane, `radius` out from the middle.
// Seen from above +x is right and +z is toward the camera, so 225 degrees is
// the back-left corner and stepping forward runs clockwise from there.
export function ring(radius, { count, arc, turn }) {
  const from = (turn * Math.PI) / 180;
  const step = ((arc / count) * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => {
    const a = from + i * step;
    return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });
}

// The edge of a rounded rectangle, as a path to walk: `halfW` and `halfD`
// the box's half-extents in x and z, `corner` how round it is as a
// fraction of the SHORT half-side (0 is a box, 1 is a stadium — and a
// circle when the box is square). Anticlockwise seen from above (the same
// way round as ring()) from the right edge's near end, as segments — a
// straight run, then the arc round the corner, and so on round — each
// with its `length` and a point `at` t along it, the zero-length ones
// (a box's arcs, a stadium's short sides) left out. `length` is the way
// round, `at(s)` the point `s` along it from the start (wrapping), and
// `hit(angle)` how far along the point that lies `angle` degrees round
// from +x is.
export function perimeterPath(halfW, halfD, corner) {
  const r = Math.max(0, Math.min(1, corner)) * Math.min(halfW, halfD);
  const w = halfW - r,
    d = halfD - r;
  const line = (x0, z0, x1, z1) => ({
    length: Math.hypot(x1 - x0, z1 - z0),
    at: (t) => new THREE.Vector3(x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t),
    straight: true,
  });
  const bend = (cx, cz, a0) => ({
    length: (Math.PI / 2) * r,
    at: (t) => {
      const a = a0 + (t * Math.PI) / 2;
      return new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r);
    },
    straight: false,
  });
  const segments = [
    line(halfW, -d, halfW, d),
    bend(w, d, 0),
    line(w, halfD, -w, halfD),
    bend(-w, d, Math.PI / 2),
    line(-halfW, d, -halfW, -d),
    bend(-w, -d, Math.PI),
    line(-w, -halfD, w, -halfD),
    bend(w, -d, Math.PI * 1.5),
  ].filter((seg) => seg.length > 1e-9);
  const length = segments.reduce((sum, seg) => sum + seg.length, 0);
  const wrap = (s) => ((s % length) + length) % length;
  const at = (s) => {
    let left = wrap(s);
    for (const seg of segments) {
      if (left <= seg.length + 1e-9) return seg.at(left / seg.length);
      left -= seg.length;
    }
    return segments[segments.length - 1].at(1);
  };
  // Sampled the way round and the nearest bearing taken: the edge is
  // convex, so the bearing only ever climbs, and a sample every so often
  // along it is as close as a post needs.
  const hit = (angle) => {
    const want = (angle * Math.PI) / 180;
    const n = Math.max(64, Math.ceil(length / 0.1));
    let best = 0,
      bestOff = Infinity;
    for (let i = 0; i < n; i++) {
      const s = (i / n) * length;
      const p = at(s);
      const a = Math.atan2(p.z, p.x) - want;
      const off = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
      if (off < bestOff) ((best = s), (bestOff = off));
    }
    return best;
  };
  return { segments, length, wrap, at, hit };
}

// Where `count` posts stand round the edge (see perimeterPath), spaced
// evenly by distance along it, as how far along each is. `turn` is where
// the first one starts as a fraction of the way round from +x, and `arc`
// how much of the way round the `count` cover, both in degrees so a
// circle reads as before.
function evenStops(path, { count, arc, turn }) {
  const { segments, length, wrap } = path;
  // The path starts at the right edge's near end, `d` short of +x, where
  // ring() starts, so `turn` still reads from +x.
  const d = segments[0].straight ? segments[0].length / 2 : 0;
  return Array.from({ length: count }, (_, i) =>
    wrap((turn / 360 + ((arc / 360) * i) / count) * length + d),
  );
}

// A ring of standing points around a rounded rectangle instead of a
// circle — evenStops, as points.
export function perimeter(halfW, halfD, corner, ring) {
  const path = perimeterPath(halfW, halfD, corner);
  return evenStops(path, ring).map(path.at);
}

// The posts of a fence round a rounded rectangle, with gaps left in it
// where things come and go: `stands` where each post stands, in order
// round, and `skip` which runs between neighbors — run i joins post i to
// post i + 1, the last to the first — are left open. `gates` are the
// openings, each `{ angle, width }`: `angle` where on the edge, in
// degrees round from +x, and `width` how wide, in world units along the
// edge; a post stands either side of each.
//
// Built the way a fence is: the posts that HAVE to be somewhere go in
// first — one at each vertex of the shape (the four corners of a box, the
// eight spots where a rounded box's straight edges meet its arcs), and
// the two gateposts of every gate — and then each stretch of edge between
// them is cut into as few equal bays as keeps every bay under `spacing`
// world units. A gatepost that would stand within half a bay short of a
// vertex, or a quarter past it, is stood ON the vertex instead — the gate
// a little wider or narrower for it — rather than leave a stub of fence
// or a corner post in the opening; a vertex still inside a gate is gone.
//
// A plain circle has no vertices, so it is cut into equal bays all the
// way round, from `turn`, and its gates cut out of that. So is any ring
// that sets `count` — that many posts, evenly, whatever the shape — the
// posts that fall in a gate taken away, and any within GATE_CLEAR of a
// gatepost, so none is jammed against it. A ring so sparse that its bays
// are wider than the gate gets no gateposts — two posts closer together
// than any others would read as a pinch, not a way in — the gate is the
// bay the path crosses, its posts either side left standing and nothing
// strung between them. An open arc (`arc` under 360) is spaced evenly
// too, and takes no gates.
const GATE_CLEAR = 1;
export function fencePosts(halfW, halfD, corner, ring, gates = []) {
  const path = perimeterPath(halfW, halfD, corner);
  const { segments, length, wrap } = path;
  const { count, spacing, arc, turn } = ring;
  const closed = arc >= 360;
  const bays = (len) => Math.max(1, Math.ceil(len / spacing));
  const straight = segments.some((seg) => seg.straight);
  // A run cut into equal bays: the posts strictly between its ends.
  const between = (from, len) => {
    const n = bays(len);
    return Array.from({ length: n - 1 }, (_, k) =>
      wrap(from + ((k + 1) * len) / n),
    );
  };

  let posts;
  if (!closed || count != null || !straight) {
    // Evenly, then the gates cut out.
    const n = count ?? bays(length);
    posts = evenStops(path, { count: n, arc, turn }).map((s) => ({ s }));
    if (closed)
      for (const { angle, width } of gates) {
        const mid = path.hit(angle);
        const from = wrap(mid - width / 2);
        // Distance along from the gap's start, wrapping, so a gap over the
        // path's start is one gap.
        const into = (s) => wrap(s - from);
        if (length / n > width) {
          // Sparse: the bay the gate crosses is the gate. The posts in
          // it go, and the last one before it opens the run.
          posts = posts.filter(({ s }) => into(s) > width);
          const before = posts.reduce(
            (best, p) => (wrap(from - p.s) < wrap(from - best.s) ? p : best),
            posts[0],
          );
          before.opens = true;
          continue;
        }
        posts = posts.filter(({ s }) => {
          const d = into(s);
          return d > width + GATE_CLEAR && d < length - GATE_CLEAR;
        });
        if (!straight && count == null) {
          // Round, by spacing: the rest of the ring re-cut between the
          // gateposts, so the bays stay even up to the gate.
          const rest = length - width;
          posts = between(wrap(mid + width / 2), rest).map((s) => ({ s }));
        }
        posts.push({ s: from, opens: true }, { s: wrap(mid + width / 2) });
      }
  } else {
    // The vertices: each segment's start.
    let vertices = [];
    let from = 0;
    for (const seg of segments) {
      vertices.push(from);
      from += seg.length;
    }
    // The gates, each snapped onto a vertex it all but reaches, and
    // the vertices inside any gate taken out.
    const openings = gates.map(({ angle, width }) => {
      const mid = path.hit(angle);
      let a = wrap(mid - width / 2),
        b = wrap(mid + width / 2);
      // Outward by up to half a bay, or inward by up to a quarter — a
      // gate is widened onto a vertex freely, narrowed onto one only a
      // little, and never left straddling one.
      const snap = (s, ahead) => {
        const out = (v) => wrap(ahead ? v - s : s - v);
        const back = (v) => wrap(ahead ? s - v : v - s);
        return (
          vertices.find((v) => out(v) < spacing / 2) ??
          vertices.find((v) => back(v) < spacing / 4) ??
          s
        );
      };
      a = snap(a, false);
      b = snap(b, true);
      return { a, b };
    });
    const inGate = (s) =>
      openings.some(({ a, b }) => {
        const d = wrap(s - a);
        return d > 1e-6 && d < wrap(b - a) - 1e-6;
      });
    vertices = vertices.filter((v) => !inGate(v));
    // The fixed posts, in order round, and the bays between each pair.
    const fixed = [
      ...vertices.map((s) => ({ s })),
      ...openings.flatMap(({ a, b }) => [{ s: a, opens: true }, { s: b }]),
    ]
      .sort((p, q) => p.s - q.s)
      // Two on one spot (a gatepost snapped onto a vertex) are one post,
      // and it opens if either did.
      .reduce((out, p) => {
        const last = out[out.length - 1];
        if (last && Math.abs(last.s - p.s) < 1e-6) last.opens ||= p.opens;
        else out.push({ ...p });
        return out;
      }, []);
    posts = fixed.flatMap((p, i) => {
      const next = fixed[(i + 1) % fixed.length];
      const len = fixed.length === 1 ? length : wrap(next.s - p.s) || length;
      if (p.opens) return [p];
      return [p, ...between(p.s, len).map((s) => ({ s }))];
    });
  }

  posts.sort((a, b) => a.s - b.s);
  // Starting from the post nearest `turn`, so the first is where it was
  // asked for, near enough.
  const want = (turn * Math.PI) / 180;
  const off = ({ s }) => {
    const p = path.at(s);
    const a = Math.atan2(p.z, p.x) - want;
    return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  };
  let first = 0;
  posts.forEach((p, i) => {
    if (off(p) < off(posts[first])) first = i;
  });
  posts = [...posts.slice(first), ...posts.slice(0, first)];
  const skip = new Set();
  posts.forEach(({ opens }, i) => opens && skip.add(i));
  return { stands: posts.map(({ s }) => path.at(s)), skip };
}

// How many runs join a ring of posts: a closed ring carries one per edge, an
// open arc leaves the gap it was opened for empty.
export function runsAround({ count, arc }) {
  return arc >= 360 ? count : count - 1;
}

// `count` directions spread as evenly over the ball as a simple rule manages
// — the Fibonacci sphere. Height marches from one pole to the other in equal
// steps while the golden angle turns each point past the last, and because
// that angle never divides the circle the points never line up into the seams
// and pole-crowding a lat/lon grid gives you.
//
// Too evenly, for a field: the eye picks the lattice out. `jitter` shakes
// each point off its spot, up to that share of the spacing between
// neighbors (1 is a full step, so points can land on each other's spots
// and the lattice is gone), by a roll from `rand` — so a scatter with a
// jitter needs a seeded generator to come back the same. As a pair
// `[min, max]`, every point is shaken at least `min` of the spacing:
// none left sat exactly on the lattice.
//
// Deterministic without one: point i is always in the same place, so
// scattering is repeatable and only the per-item rolls need a seeded
// generator.
export function scatter(count, jitter = 0, rand = Math.random) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  // Each point gets 4π / count of the sphere; the step to the next is about
  // the side of a square that big.
  const [least, most] = Array.isArray(jitter) ? jitter : [0, jitter];
  const spacing = Math.sqrt((4 * Math.PI) / count);
  const step = spacing * most;
  const t = new THREE.Vector3();
  const b = new THREE.Vector3();
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * i + 1) / count; // marches +1 down to -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * golden;
    const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    if (!(step > 0)) return dir;
    // Nudged along the surface: a random bearing and distance in the plane
    // tangent at the point, then put back on the ball.
    t.set(0, 1, 0).cross(dir);
    if (t.lengthSq() < 1e-6) t.set(1, 0, 0).cross(dir);
    t.normalize();
    b.crossVectors(dir, t);
    const bearing = rand() * Math.PI * 2;
    const reach = spacing * (least + (most - least) * Math.sqrt(rand()));
    return dir
      .addScaledVector(t, Math.cos(bearing) * reach)
      .addScaledVector(b, Math.sin(bearing) * reach)
      .normalize();
  });
}

// A place on the ball as a direction from its center. Latitude runs -90 at
// the south pole to 90 at the north; longitude 0 faces the camera and 90 is
// to its right.
export function latLonDir(lat, lon) {
  const a = (lat * Math.PI) / 180;
  const o = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(a) * Math.sin(o),
    Math.sin(a),
    Math.cos(a) * Math.cos(o),
  );
}

// The turn that lands a +y-up model's up on the ball's up at `dir`. Any
// vector not parallel to up will do for the first tangent; at the poles the
// obvious choice IS parallel, hence the swap.
export function standOn(dir) {
  const up = dir.clone().normalize();
  const seed =
    Math.abs(up.z) > 0.99 ?
      new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3(0, 0, 1);
  const fwd = seed.addScaledVector(up, -seed.dot(up)).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd);
  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up, fwd),
  );
}
