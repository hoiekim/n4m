const Max = require("max-api");

let bpm = 120;
let noteLength = 1 / 4;

let velocityAvg = 63;

let transport = false;

let base;
let triad = [];
let tensions = [];
let scale = [60, 62, 64, 65, 67, 69, 71];

const notesCahce = {};

let chord = [];

let stepLength = 16;

let stepOn = new Array(stepLength).fill(null);
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
  let baseIndex = 0;

  scale.find((e, i) => {
    const found = base % 12 === e % 12;
    if (found) baseIndex = i;
    return found;
  });

  return (note + baseIndex) % 7;
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

Max.addHandler("base", (value, velocity) => {
  if (velocity) {
    notesCahce[value] = velocity;
    base = value;
  } else delete notesCahce[value];

  if (transport) return;

  const newNotes = Object.keys(notesCahce).length;
  if (!newNotes) stopPlaying();
  else if (!playing) {
    playingBeat = 0;
    startPlaying();
  }
});

Max.addHandler("triadNumbers", (...numbers) => {
  triad = numbers;
  updateChord();
});

Max.addHandler("tensionNumbers", (...numbers) => {
  tensions = numbers;
  updateChord();
});

Max.addHandler("stepOn", (...value) => {
  if (value.length < 2) return;

  const newStepOn = new Array(stepLength).fill(null);
  newStepOn.forEach((e, i) => {
    newStepOn[i] = [];
  });

  let i = 0;
  while (i < value.length) {
    const location = value[i] - 1;
    const note = value[i + 1];
    if (newStepOn[location]) newStepOn[location].push(note);
    i += 2;
  }

  newStepOn.find((e, i) => {
    return e.find((f, j) => {
      if (stepOn[i] && !stepOn[i].find((g) => f === g)) {
        if (stepOff.raw) {
          Max.outlet("stepOff", "clear");
          Max.outlet("stepOff", "steps", ...stepOff.raw, i + 2, f);
        } else Max.outlet("stepOff", "steps", i + 2, f);
        return true;
      }
    });
  });

  stepOn.find((e, i) => {
    return e.find((f, j) => {
      if (newStepOn[i] && !newStepOn[i].find((g) => f === g)) {
        if (stepOff.raw) {
          let k = 0;
          while (k < stepOff.raw.length) {
            if (stepOff.raw[k] === i + 2 && stepOff.raw[k + 1] === f) {
              stepOff.raw.splice(k, 2);
              break;
            }
            k += 2;
          }
          Max.outlet("stepOff", "clear");
          if (stepOff.raw.length) {
            Max.outlet("stepOff", "steps", ...stepOff.raw);
          } else Max.outlet("stepOff", "clear");
        }
        return true;
      }
    });
  });

  stepOn = newStepOn;
  stepOn.raw = value;
});

Max.addHandler("stepOff", (...value) => {
  if (value.length < 2) return;

  stepOff.length = stepLength;
  stepOff.fill(null);
  stepOff.forEach((e, i) => {
    stepOff[i] = [];
  });

  let i = 0;
  while (i < value.length) {
    const location = value[i] - 1;
    const note = value[i + 1];
    if (stepOff[location]) stepOff[location].push(note);
    i += 2;
  }

  stepOff.raw = value;
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

Max.outlet("load", 1);
