const Max = require("max-api");
const { midiToAbsoluteNoteName } = require("../lib/chords");

let bpm = 120;
let noteLength = 1 / 4;

let velocityAvg = 63;

let transport = false;
let playMode = 0;

let bass;
let triad = [];
let tensions = [];
let scale = [60, 62, 64, 65, 67, 69, 71];

const notesCahce = {};

let stepLength = 64;
let stepOnMouseOver = [0, 0, 0];

const stepOn = new Array(stepLength).fill(null);
stepOn.forEach((e, i) => {
  stepOn[i] = [];
});

const stepOff = new Array(stepLength).fill(null);
stepOff.forEach((e, i) => {
  stepOff[i] = [];
});

let stepOctave = new Array(stepLength).fill(0);

let playing = false;
let playingBeat = 0;
let playingTimer;
const playingCache = {};

const getScaleIndex = (noteIndex) => {
  let bassIndex = 0;

  if (!playMode) {
    scale.find((e, i) => {
      const found = bass % 12 === e % 12;
      if (found) bassIndex = i;
      return found;
    });
  }

  return (noteIndex + bassIndex) % 7;
};

const muteAll = () => {
  for (const key in playingCache) {
    Max.outlet("note", +key, 0);
    delete playingCache[key];
  }
};

const muteOne = () => {
  for (const key in playingCache) {
    stepOff[playingBeat].find((e) => {
      if (e === playingCache[key]) {
        Max.outlet("note", +key, 0);
        delete playingCache[key];
        return true;
      }
    });
  }
};

const playOne = () => {
  stepOn[playingBeat].forEach((e) => {
    if (typeof e !== "number") return;
    const scaleIndex = getScaleIndex(e - 1);
    const octaveOffset = stepOctave[playingBeat] * 12;
    const playingNote = scale[scaleIndex] + octaveOffset;
    playingCache[playingNote] = e;
    Max.outlet("note", playingNote, velocityAvg);
  });
};

const startPlaying = () => {
  muteOne();
  playOne();
  Max.outlet("playingBeat", playingBeat);

  playingTimer = setTimeout(() => {
    if (!transport) {
      if (playingBeat < stepLength - 1) playingBeat += 1;
      else playingBeat = 0;
    }
    startPlaying();
  }, (240000 * noteLength) / bpm);

  playing = true;
};

const stopPlaying = () => {
  clearTimeout(playingTimer);
  muteAll();
  playing = false;
};

const updateChord = () => {
  const allNotes = {};
  triad.forEach((e) => {
    if (e !== "unknown") allNotes[(e % 12) + 60] = true;
  });
  tensions.forEach((e) => {
    if (e !== "unknown") allNotes[(e % 12) + 60] = true;
  });
  chord = Object.keys(allNotes).sort((a, b) => +a - +b);
};

Max.addHandler("bpm", (value) => {
  try {
    bpm = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("transport", (value) => {
  try {
    transport = !!value;
    stopPlaying();
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("tempo", (value) => {
  try {
    playingBeat = value;
    muteOne();
    if (Object.keys(notesCahce).length) playOne();
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("velocity", (value) => {
  try {
    velocityAvg = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("scale", (...value) => {
  try {
    scale = value.map((e) => e + 60);
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("bass", (value, velocity) => {
  try {
    if (velocity) {
      notesCahce[value] = velocity;
      bass = value;
    } else delete notesCahce[value];

    muteOne();
    playOne();

    if (transport) return;

    const newNotes = Object.keys(notesCahce).length;
    if (!newNotes) stopPlaying();
    else if (!playing) {
      playingBeat = 0;
      startPlaying();
    }

    const stepNotes = new Array(7).fill(null);
    stepNotes.forEach((e, i) => {
      const scaleIndex = getScaleIndex(i);
      stepNotes[i] = scale[scaleIndex];
    });

    const stepNoteNames = stepNotes.map((e) => midiToAbsoluteNoteName(e % 12));
    Max.outlet("stepNoteNames", ...stepNoteNames);
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("triadNumbers", (...numbers) => {
  try {
    triad = numbers;
    updateChord();
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("tensionNumbers", (...numbers) => {
  try {
    tensions = numbers;
    updateChord();
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("stepOnMouseOver", (...value) => {
  try {
    stepOnMouseOver = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("stepOn", (...value) => {
  try {
    stepOn.length = stepLength;
    stepOn.fill(null);
    stepOn.forEach((e, i) => {
      stepOn[i] = [];
    });

    let i = 0;
    while (i < value.length) {
      const location = value[i] - 1;
      const height = value[i + 1];
      if (stepOn[location]) stepOn[location].push(height);
      i += 2;
    }

    const [location, height, boolean] = stepOnMouseOver;

    let nextLocation = location + 1;
    if (nextLocation > stepLength) nextLocation = 1;

    if (boolean) {
      Max.outlet("stepOff", "steps", nextLocation, height);
    } else {
      const raw = stepOff.reduce((acc1, hArr, i) => {
        return acc1.concat(
          hArr.reduce((acc2, h) => {
            const l = i + 1;
            if (l === nextLocation && h === height) return acc2;
            else return acc2.concat([l, h]);
          }, [])
        );
      }, []);

      Max.outlet("stepOff", "clear");
      if (raw.length) Max.outlet("stepOff", "steps", ...raw);
    }
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("stepOff", (...value) => {
  try {
    stepOff.length = stepLength;
    stepOff.fill(null);
    stepOff.forEach((e, i) => {
      stepOff[i] = [];
    });

    let i = 0;
    while (value.length > 1 && i < value.length) {
      const location = value[i] - 1;
      const height = value[i + 1];
      if (stepOff[location]) stepOff[location].push(height);
      i += 2;
    }
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("stepOctave", (...value) => {
  try {
    stepOctave = value.map((e) => e - 4);
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("stepLength", (value) => {
  try {
    stepLength = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("noteLength", (value) => {
  try {
    noteLength = 1 / value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("playMode", (value) => {
  try {
    playMode = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("legato", (value) => {
  try {
    if (!value) return;

    const newStepOff = new Array(stepLength);
    newStepOff.fill(null);
    newStepOff.forEach((e, i) => {
      newStepOff[i] = [];
    });

    newStepOff[1] = stepOn.reduce((acc, e, i) => {
      if (i && e.length) {
        newStepOff[i + 1] = acc;
        acc = [];
      }
      return acc.concat(e);
    }, []);

    const raw = newStepOff.reduce((acc1, hArr, i) => {
      return acc1.concat(
        hArr.reduce((acc2, h) => {
          return acc2.concat([i, h]);
        }, [])
      );
    }, []);

    Max.outlet("stepOff", "clear");
    if (raw.length) Max.outlet("stepOff", "steps", ...raw);
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("sustain", (value) => {
  try {
    if (!value) return;

    const raw = stepOn.reduce((acc1, hArr, i) => {
      return acc1.concat(
        hArr.reduce((acc2, h) => {
          return acc2.concat([i + 1, h]);
        }, [])
      );
    }, []);

    Max.outlet("stepOff", "clear");
    if (raw.length) Max.outlet("stepOff", "steps", ...raw);
  } catch (err) {
    console.error(err);
  }
});

Max.outlet("load", 1);
