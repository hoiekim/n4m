const Max = require("max-api");

let bpm = 120;
let beatUnit = 1 / 4;

let velocityAvg = 63;

let transport = false;

let base;
let triad = [];
let tensions = [];
let scale = [60, 62, 64, 65, 67, 69, 71];

const notesCahce = {};

let chord = [];
const step = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];

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

const startPlaying = () => {
  for (const key in playingCache) {
    Max.outlet("note", +key, 0);
    delete playingCache[key];
  }

  step[playingBeat].forEach((e) => {
    const currentNoteIndex = (e + getBaseIndex()) % 7;
    const playingNote = scale[currentNoteIndex];
    playingCache[playingNote] = velocityAvg;
    Max.outlet("note", playingNote, velocityAvg);
  });

  playingTimer = setTimeout(() => {
    if (playingBeat < 15) playingBeat += 1;
    else playingBeat = 0;
    startPlaying();
  }, (60000 * beatUnit) / bpm);

  playing = true;
};

const stopPlaying = () => {
  clearTimeout(playingTimer);

  for (const key in playingCache) {
    Max.outlet("note", +key, 0);
    delete playingCache[key];
  }

  playing = false;
};

const setPlaying = (velocity) => {
  if (!transport) {
    const newNotes = Object.keys(notesCahce).length;
    if (!velocity && !newNotes) stopPlaying();
    else if (!playing) {
      playingBeat = 0;
      startPlaying();
    }
  } else if (!playing) {
    startPlaying();
  }
};

const updateChord = () => {
  const allNotes = {};
  triad.forEach((e) => {
    if (e !== "unknown") allNotes[e] = true;
  });
  tensions.forEach((e) => {
    if (e !== "unknown") allNotes[e] = true;
  });
  chord = Object.keys(allNotes).sort((a, b) => +a - +b);
};

Max.addHandler("bpm", (value) => {
  bpm = value;
});

Max.addHandler("transport", (value) => {
  transport = !!value;
  setPlaying(1);
});

Max.addHandler("tempo", (value) => {
  playingBeat = value;
});

Max.addHandler("velocity", (value) => {
  velocityAvg = value;
});

Max.addHandler("scale", (...value) => {
  scale = value.map((e) => e + 60);
});

Max.addHandler("base", (value, velocity) => {
  if (velocity) notesCahce[value] = velocity;
  else delete notesCahce[value];

  base = value;

  setPlaying(velocity);
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
  step.forEach((e, i) => {
    step[i] = [];
  });

  let i = 0;
  while (i < value.length) {
    const location = value[i] - 1;
    const note = value[i + 1];
    step[location].push(note);
    i += 2;
  }
});
