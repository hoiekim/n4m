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

let chord = [];

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

const getScaleIndex = (note) => {
  let bassIndex = 0;

  if (!playMode) {
    scale.find((e, i) => {
      const found = bass % 12 === e % 12;
      if (found) bassIndex = i;
      return found;
    });
  }

  return (note + bassIndex) % 7;
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
  bpm = value;
});

Max.addHandler("transport", (value) => {
  transport = !!value;
  stopPlaying();
});

Max.addHandler("tempo", (value) => {
  playingBeat = value;
  muteOne();
  if (Object.keys(notesCahce).length) playOne();
});

Max.addHandler("velocity", (value) => {
  velocityAvg = value;
});

Max.addHandler("scale", (...value) => {
  scale = value.map((e) => e + 60);
});

Max.addHandler("bass", (value, velocity) => {
  if (velocity) {
    notesCahce[value] = velocity;
    bass = value;
  } else delete notesCahce[value];

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
});

Max.addHandler("triadNumbers", (...numbers) => {
  triad = numbers;
  updateChord();
});

Max.addHandler("tensionNumbers", (...numbers) => {
  tensions = numbers;
  updateChord();
});

Max.addHandler("stepOnMouseOver", (...value) => {
  stepOnMouseOver = value;
});

Max.addHandler("stepOn", (...value) => {
  if (value.length < 2) return;

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
});

Max.addHandler("stepOff", (...value) => {
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
});

Max.addHandler("stepOctave", (...value) => {
  stepOctave = value.map((e) => e - 4);
});

Max.addHandler("stepLength", (value) => {
  stepLength = value;
});

Max.addHandler("noteLength", (value) => {
  noteLength = 1 / value;
});

Max.addHandler("playMode", (value) => {
  playMode = value;
});

Max.addHandler("legato", (value) => {
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
});

Max.addHandler("sustain", (value) => {
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
});

Max.outlet("load", 1);
