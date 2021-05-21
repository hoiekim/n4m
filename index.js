const Max = require("max-api");
const {
  getBase,
  scale,
  setScale,
  addNoteToScale,
  getTriad,
  midiToNoteName,
  midiToAbsoluteNoteName
} = require("./lib/chords");

const notesCache = {};

const getPlayedNotes = () => {
  const notes = [];
  for (const key in notesCache) {
    notes.push(Number(key));
  }
  return notes;
};

let base;
let triad = [];
let sustain;

const getTensions = (notes) => {
  const safeNotes = triad.filter((e) => {
    return notes.reduce((acc, f) => {
      const interval = Math.abs(e - f);
      return !(!acc || (interval < 3 && interval));
    }, true);
  });
  Max.outlet("safeNotes", ...safeNotes);
  Max.outlet("safeNotesNames", ...safeNotes.map(midiToNoteName));

  const tensionNotes = notes.filter((e) => {
    return !triad.find((f) => {
      return e % 12 === f % 12;
    });
  });
  if (tensionNotes.length) {
    Max.outlet("tensionNotes", ...tensionNotes);
    Max.outlet("tensionNotesNames", ...tensionNotes.map(midiToNoteName));
  } else {
    Max.outlet("tensionNotes", "unknown");
    Max.outlet("tensionNotesNames", "unknown");
  }
};

Max.addHandler("key", (note, velocity) => {
  if (!velocity) {
    delete notesCache[note];
    const notes = getPlayedNotes();

    if (!notes.length && !sustain) {
      Max.outlet("base", base, 0);
      Max.outlet("baseName", "unknown");
      base = null;
    }

    getTensions(notes);
  } else {
    notesCache[note] = velocity;
    addNoteToScale(note);
    Max.outlet("scale", ...scale);
    Max.outlet("scaleNames", ...scale.map(midiToAbsoluteNoteName));
    const notes = getPlayedNotes();
    notes.sort((a, b) => a - b);

    Max.outlet("keys", ...notes);
    Max.outlet("keys", ...notes.map(midiToNoteName));

    const newBase = getBase(notes);
    if (base !== newBase) {
      Max.outlet("base", base, 0);

      let velocity = 0;
      let length = 0;
      for (const key in notesCache) {
        velocity += notesCache[key];
        length++;
      }
      velocity = velocity / length;
      Max.outlet("base", newBase, velocity);
      Max.outlet("baseName", midiToNoteName(newBase));

      const newTriad = getTriad(newBase);
      Max.outlet("triad", ...newTriad);
      Max.outlet("triadNames", ...newTriad.map(midiToNoteName));

      base = newBase;
      triad = newTriad;
    }

    getTensions(notes);
  }
});

Max.addHandler("scale", (note) => {
  setScale(note);
  Max.outlet("scale", ...scale);
  Max.outlet("scaleNames", ...scale.map(midiToAbsoluteNoteName));
});

Max.addHandler("sustain", (value) => {
  if (value) sustain = true;
  else {
    if (!Object.keys(notesCache).length) {
      Max.outlet("base", base, 0);
      Max.outlet("baseName", "unknown");
    }
    sustain = false;
  }
});
