export const headDefaults = {
  omitTexture: [],
  omitHair: [],
  hair: {},
  chin: [0, 0],
  chinSoft: 1,
  chinTuck: 1,
  feather: 1,
  symmetry: false,
  symmetryOffset: [0, 0],
  balloonGapKnee: 0.15, // how puffed-out the top end is vs. the bottom end
  minBalloonGap: 0.0,
  top: { topPoint: false },
  bottom: { botPoint: false },
};

export const faceDefaults = {
  ears: {
    latitude: [0.25, 0.5],
    size: [1.4, 1.42],
    pointiness: [0.5, 0.5],
    extrusion: [0.5, 0.5],
    pointSets: [2, 2],
  },
  nose: {
    // 0 tucks the nose right under the eyes
    y: [0, 0.145],
    length: [0.1, 0.28],
    radius: [0.06, 0.12],
    scrunch: [0.25, 0.85],
    bulbosity: [0.3, 0.95],
  },
  eyes: { latitude: [0.1, 0.45], azimuth: [0.35, 0.6], size: [0.04, 0.07] },
  cheeks: {
    azimuth: [0.05, 0.25], // + swings further round the side than the eye
    latitude: [-0.05, 0.15], // + drops toward the mouth, - lifts above the nose
    size: [0.09, 0.17],
    bulge: [0.35, 0.8],
  },
  mouth: {
    // 0 tucks the nose right under the nose
    latitude: [0.15, 0.25],
    width: [0.1, 0.5],
    height: [0.05, 0.1],
    lift: 0.004,
    taper: [1, 1],
    gap: [0.1, 0.22],
    bow: [0.12, 0.5],
    smileBias: 0.65,
  },
};

export const heads = {
  acorn: {
    split: [0.15, 0.3],
    feather: [1, 1],
    balloonGapKnee: 0.15,
    top: { topBalloon: [0.1, 0.4], pullUp: [-0.25, -0.18], topPoint: false },
    bottom: { botBalloon: [-0.2, 0], pullDown: [0.3, 0.54], botPoint: true },
    hair: {
      leaves: {
        count: [1, 2],
        spread: [0.2, 0.4],
        length: [0.25, 0.88],
        radius: [0.015, 0.05],
        segments: [5, 7],
        beadSize: [0.8, 0.9],
        tip: "leaf",
        tipAspect: [2.1, 2.5], // long — a blade, not a paddle
        tipFlat: 0.23,
        stiffness: [0.1, 0.1],
        jitter: [0, 0],
        startAtCenter: true,
        damping: [0.1, 0.2],
        rigidity: 0.88,
      },
    },
    face: {
      ears: {
        latitude: [0.1, 0.7],
        size: [0.28, 0.35],
        pointiness: [0.25, 1],
        extrusion: [0.8, 1.2],
        pointSets: [3, 3],
      },
      eyes: {
        latitude: [-0.1, 0.1],
        azimuth: [0.2, 0.52],
        size: [0.086, 0.092],
      },
      nose: {
        y: [0.18, 0.04],
        length: [0.093, 0.26],
        radius: [0.076, 0.16],
      },
      mouth: {
        latitude: [0.18, 0.28],
        width: [0.23, 0.565],
        height: [0.047, 0.093],
      },
      cheeks: {
        azimuth: [0.35, 0.8], // starts with 0 directly under the eyes
        latitude: [0, 0.28], // starts with 0 parallel with the nose
        size: [0.125, 0.35],
      },
    },
  },
  carrot: {
    omitTexture: ["smooth"],
    omitHair: ["none"],
    hair: {
      leaves: {
        count: [6, 12],
        spread: [0.2, 0.4],
        length: [0.15, 0.16],
        radius: [0.015, 0.05],
        segments: [5, 7],
        beadSize: [0.65, 0.9],
        tip: "leaf",
        tipAspect: [8.1, 10.2], // long — a blade, not a paddle
        tipFlat: 0.5,
        stiffness: [1, 1],
        jitter: [0, 0],
        startAtCenter: false,
        damping: [1, 1],
      },
    },
    split: [0.12, 0.28],
    feather: [1, 1],
    balloonGapKnee: 0.15,
    chinTuck: 0.5,
    top: { topBalloon: [0.2, 0.3], pullUp: [0.42, 0.68], topPoint: false },
    bottom: {
      botBalloon: [-0.38, -0.15],
      pullDown: [0.15, 0.15],
      botPoint: true,
    },
    face: {
      ears: {
        latitude: [0.1, 0.8],
        size: [0.22, 0.44],
        pointiness: [0.15, 0.45],
        extrusion: [2.1, 3],
        pointSets: [3, 3],
      },
      eyes: {
        latitude: [0.08, 0.28],
        azimuth: [0.28, 0.44],
        size: [0.088, 0.1],
      },
      nose: {
        y: [-0.03, 0],
        length: [0.09, 0.38],
        radius: [0.1, 0.21],
      },
      mouth: {
        latitude: [0.1, 0.26],
        width: [0.2, 0.48],
        height: [0.05, 0.12],
      },
      cheeks: {
        azimuth: [0.35, 0.42],
        latitude: [0.1, 0.18],
        size: [0.22, 0.31],
      },
    },
  },
  tomato: {
    split: [0.22, 0.63],
    feather: [1.2, 1.6],
    balloonGapKnee: 0,
    symmetry: true,
    symmetryOffset: [-0.08, 0.08],
    top: { topBalloon: [0.1, 0.3], pullUp: [-0.12, -0.04], topPoint: false },
    bottom: {
      botBalloon: [0.02, 0.12],
      pullDown: [-0.1, -0.02],
      botPoint: false,
    },
    face: {
      ears: {
        latitude: [0.1, 0.8],
        size: [0.22, 0.44],
        pointiness: [0.15, 0.25],
        extrusion: [5, 5],
        pointSets: [3, 3],
      },
      eyes: {
        latitude: [0, 0.3],
        azimuth: [0.22, 0.55],
        size: [0.078, 0.1],
      },
      nose: { y: [0.14, 0.02], length: [0.107, 0.3], radius: [0.064, 0.128] },
      mouth: {
        latitude: [0.16, 0.22],
        width: [0.107, 0.482],
        height: [0.054, 0.107],
      },
      cheeks: {
        azimuth: [0.31, 0.45],
        latitude: [0.1, 0.28],
        size: [0.18, 0.42],
      },
    },
  },
  pear: {
    split: [0.22, 0.63],
    feather: [0.5, 0.5],
    balloonGapKnee: 0,
    top: { topBalloon: [-0.5, -0.5], pullUp: [1, 1], topPoint: false },
    bottom: {
      botBalloon: [0.5, 0.5],
      pullDown: [-0.1, -0.02],
      botPoint: false,
    },
    face: {
      ears: {
        latitude: [0.1, 0.8],
        size: [0.22, 0.44],
        pointiness: [0.15, 0.25],
        extrusion: [5, 5],
        pointSets: [3, 3],
      },
      eyes: {
        latitude: [0, 0.3],
        azimuth: [0.22, 0.55],
        size: [0.078, 0.1],
      },
      nose: { y: [0.14, 0.02], length: [0.107, 0.3], radius: [0.064, 0.128] },
      mouth: {
        latitude: [0.16, 0.22],
        width: [0.107, 0.482],
        height: [0.054, 0.107],
      },
      cheeks: {
        azimuth: [0.31, 0.45],
        latitude: [0.1, 0.28],
        size: [0.18, 0.42],
      },
    },
  },
  squash: {
    split: [-0.2, 0.2],
    feather: [1.1, 1.8],
    balloonGapKnee: 0,
    top: { topBalloon: [-0.35, 0], pullUp: [0.1, 0.8], topPoint: false },
    bottom: { botBalloon: [0, 0.35], pullDown: [0.05, 0.18], botPoint: false },
    face: {
      ears: { latitude: [0.1, 0.34], size: [0.18, 0.25] },
      eyes: { latitude: [0, 0.4], azimuth: [0.12, 0.35], size: [0.044, 0.06] },
      nose: {
        y: [0.12, 0.02],
        length: [0.086, 0.241],
        radius: [0.052, 0.103],
      },
      mouth: {
        latitude: [0.1, 0.35],
        width: [0.086, 0.387],
        height: [0.043, 0.086],
      },
      cheeks: { size: [0.077, 0.346] },
    },
  },
  zucchini: {
    split: [-0.1, 0.1],
    feather: [0.5, 1],
    balloonGapKnee: 0,
    top: { topBalloon: [-0.38, -0.26], pullUp: [-0.5, 1], topPoint: false },
    bottom: {
      botBalloon: [-0.38, -0.26],
      pullDown: [0.95, 1.65],
      botPoint: false,
    },
    face: {
      ears: { latitude: [0.05, 0.11], size: [0.1, 0.24] },
      eyes: {
        latitude: [0.05, 0.11],
        azimuth: [0.34, 0.56],
        size: [0.05, 0.075],
      },
      nose: {
        // This band used to be an absolute latitude that sat almost entirely
        // above the eye ceiling — the clamp fired on 98% of dolls and the
        // band read as dead. As a drop below the eye line that trap is gone:
        // every part of the band moves the nose.
        y: [0.12, 0],
        length: [0.07, 0.19],
        radius: [0.035, 0.065],
      },
      mouth: {
        latitude: [0.04, 0.4],
        width: [0.07, 0.44],
        height: [0.01, 0.03],
      },
      cheeks: { size: [0.1, 0.18] },
    },
  },
  // Built from a config you pasted, in the old puff/lift naming — top.puff
  // -0.5 is topBalloon, bottom.lift -0.18 is pullDown +0.18, since the
  // deformer works in plain +y and the bands read positive-is-outward.
  //
  // A fat round bottom drawn smoothly up to a narrow crown: widest at 36% of
  // the height, tapering to a quarter of that width at the top. Pear is the
  // near neighbor and stays distinct — pear necks IN and then flares to a
  // separate bulb on a tight feather, this is one continuous taper on a wide
  // one, and it is far shorter (h/w 1.05 against pear's 1.9).
  //
  // The face rides the shoulder, not the belly: eyes at 70% of the height
  // where the head is only 0.58 wide, mouth at 47% where it has opened out
  // to 0.78. That is why the sizes here read small against the widest point
  // — they are cut for the part of the head they actually sit on.
  eggplant: {
    split: [-0.28, -0.12],
    feather: [0.9, 1.2],
    balloonGapKnee: 0.15,
    top: { topBalloon: [-0.56, -0.44], pullUp: [-0.06, 0.08], topPoint: false },
    bottom: {
      botBalloon: [-0.08, 0.04],
      pullDown: [0.12, 0.26],
      botPoint: false,
    },
    face: {
      ears: { latitude: [0.02, 0.18], size: [0.14, 0.3] },
      eyes: {
        latitude: [-0.02, 0.12],
        azimuth: [0.33, 0.47],
        size: [0.048, 0.065],
      },
      nose: {
        y: [0.1, 0],
        length: [0.1, 0.22],
        radius: [0.07, 0.11],
      },
      mouth: {
        latitude: [0.2, 0.28],
        width: [0.1, 0.24],
        height: [0.06, 0.1],
      },
      cheeks: { size: [0.1, 0.18] },
    },
  },
  // The other config you pasted, same old puff/lift naming: top.puff -0.3 is
  // topBalloon, bottom.lift -0.29 is pullDown +0.29.
  //
  // A plump berry — both ends deflated by about the same, so it stays round,
  // with the bottom pulled down just enough to sit it on a narrower end.
  // Widest at 57% of the height, h/w 1.14.
  //
  // Reads as eggplant's inverse, which is the point of having both: same
  // family of smooth single-taper solids, but eggplant is widest at 36% with
  // its narrow end UP, and this is widest at 57% with its narrow end DOWN.
  // Tomato is the near neighbor on roundness and stays clear by being
  // shorter than it is wide, where this is taller.
  //
  // The face sits on the belly rather than a shoulder — every feature lands
  // within a few percent of the widest ring — so it carries slightly larger
  // features than eggplant does at the same head size.
  grape: {
    split: [-0.36, -0.22],
    feather: [0.85, 1.15],
    // Round by intent, like tomato and squash, so it opts out of the
    // minimum-taper floor rather than being forced to pinch.
    balloonGapKnee: 0,
    top: { topBalloon: [-0.36, -0.24], pullUp: [-0.12, 0.0], topPoint: false },
    bottom: {
      botBalloon: [-0.42, -0.28],
      pullDown: [0.22, 0.36],
      botPoint: false,
    },
    face: {
      ears: { latitude: [0.02, 0.18], size: [0.15, 0.32] },
      // This eye band used to be opened up just to keep the nose-under-eyes
      // clamp from eating the nose band on half of all dolls; with nose.y a
      // drop below the eye line the clamp is gone and the band owes it
      // nothing, but the wider spacing looked right and stays.
      eyes: {
        latitude: [0.01, 0.13],
        azimuth: [0.33, 0.47],
        size: [0.05, 0.07],
      },
      nose: {
        y: [0.14, 0.02],
        length: [0.1, 0.22],
        radius: [0.075, 0.1],
      },
      // Offset below the nose, like every preset: nose -0.10 at mid-band
      // less 0.22 puts the mouth at y0 -0.32, which is where the doll you
      // pasted wears it.
      mouth: {
        latitude: [0.18, 0.26],
        width: [0.11, 0.26],
        height: [0.06, 0.1],
      },
      cheeks: { size: [0.11, 0.2] },
    },
  },
};
