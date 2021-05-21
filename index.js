const maxApi = require("max-api");
const {
  getBase,
  scale,
  setScale,
  addNoteToScale,
  getTriad
} = require("./lib/chords");

const notesCache = {};

let base, sustain;

maxApi.addHandler("key", (note, velocity) => {
  if (!velocity) {
    delete notesCache[note];
    const notes = Object.keys(notesCache);
    if (!notes.length && !sustain) {
      maxApi.outlet("base", base, 0);
      base = null;
    }
  } else {
    notesCache[note] = velocity;
    addNoteToScale(note);
    maxApi.outlet("scale", ...scale);
    const notes = Object.keys(notesCache).map(Number);
    notes.sort((a, b) => a - b);

    maxApi.outlet("keys", ...notes);

    const newBase = getBase(notes);
    if (base !== newBase) {
      maxApi.outlet("base", base, 0);

      const values = Object.values(notesCache);
      const velocity = values.reduce((acc, e) => acc + e) / values.length;
      maxApi.outlet("base", newBase, velocity);

      const triad = getTriad(newBase);
      maxApi.outlet("triad", ...triad);

      const safeNotes = triad.filter((e) => {
        return notes.reduce((acc, f) => {
          const interval = Math.abs((e % 12) - (f % 12));
          return !(!acc || (interval < 3 && interval));
        }, true);
      });
      maxApi.outlet("safeNotes", ...safeNotes);

      const tensionNotes = notes.filter((e) => {
        return !triad.find((f) => {
          return e % 12 === f % 12;
        });
      });
      maxApi.outlet("tensionNotes", ...tensionNotes);

      base = newBase;
    }
  }
});

maxApi.addHandler("scale", (note) => {
  setScale(note);
  maxApi.outlet("scale", ...scale);
});

maxApi.addHandler("sustain", (value) => {
  if (value) sustain = true;
  else {
    if (!Object.keys(notesCache).length) {
      maxApi.outlet("base", base, 0);
    }
    sustain = false;
  }
});
