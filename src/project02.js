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
const step = new Array(stepLength).fill(null);
step.forEach((e, i) => {
  step[i] = [];
});

let playing = false;
let playingBeat = 0;
let playingTimer;
const playingCache = {};

const getBaseIndex = () => {
  let baseIndex = 0;

  scale.find((e, i) => {
    const found = base % 12 === e % 12;
    if (found) baseIndex = i;
    return found;
  });

  return baseIndex;
};

const muteAll = () => {
  for (const key in playingCache) {
    Max.outlet("note", +key, 0);
    delete playingCache[key];
  }
};

const playOne = () => {
  muteAll();

  step[playingBeat].forEach((e) => {
    const currentNoteIndex = (e + getBaseIndex()) % 7;
    const playingNote = scale[currentNoteIndex];
    playingCache[playingNote] = velocityAvg;
    Max.outlet("note", playingNote, velocityAvg);
  });
};

const startPlaying = () => {
  playOne();

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
});

Max.addHandler("tempo", (value) => {
  playingBeat = value;
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
    if (!transport) playingBeat = 0;
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

Max.addHandler("steps", (...value) => {
  if (value.length < 2) return;

  step.length = stepLength;
  step.fill(null);
  step.forEach((e, i) => {
    step[i] = [];
  });

  let i = 0;
  while (i < value.length) {
    const location = value[i] - 1;
    const note = value[i + 1];
    if (step[location]) step[location].push(note);
    i += 2;
  }
});

Max.addHandler("directions", (...numbers) => {});

Max.addHandler("stepLength", (value) => {
  stepLength = value;
});

Max.addHandler("noteLength", (value) => {
  noteLength = 1 / value;
});

Max.outlet("load", 1);
