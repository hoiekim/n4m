const Max = require("max-api");
const { midiToNoteName, fitNoteToChord } = require("../lib/chords");

let bass = 0;
let scale = [0, 2, 4, 5, 7, 9, 11];
let velocityAvg = 63;

const notesCache = {};

const translate = (note) => {
  if (!bass || !Array.isArray(scale)) return note;
  return fitNoteToChord(note, scale, bass);
};

const outputNotesAsNames = (route, notes) => {
  const inputNames = notes.map(midiToNoteName);
  if (inputNames.length) Max.outlet(route, ...inputNames);
  else Max.outlet(route, "unknown");
};

Max.addHandler("scale", (...value) => {
  try {
    scale = [...value];
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("bass", (value, velocity) => {
  try {
    if (velocity) bass = value;
  } catch (err) {
    console.error(err);
  }
});

Max.addHandler("velocity", (value) => {
  try {
    if (value) velocityAvg = value;
  } catch (err) {
    console.error(err);
  }
});

// Detect key input and analyze chords.
Max.addHandler("key", (note, velocity) => {
  setTimeout(() => {
    try {
      if (!velocity) {
        notesCache[note].forEach((e) => Max.outlet("key", e, 0));
        delete notesCache[note];
      } else {
        const adaptedNote = translate(note);
        const adjustedVelocity = (velocity + velocityAvg) / 2;
        Max.outlet("key", adaptedNote, adjustedVelocity);
        if (notesCache[note]) notesCache[note].push([adaptedNote, velocity]);
        else notesCache[note] = [adaptedNote, velocity];
      }

      const inputNotes = Object.keys(notesCache);
      outputNotesAsNames("inputNames", inputNotes);

      const outputNotes = inputNotes.map(translate);
      outputNotesAsNames("outputNames", outputNotes);
    } catch (err) {
      console.error(err);
    }
  }, 30);
});
