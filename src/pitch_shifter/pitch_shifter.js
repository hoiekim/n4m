const Max = require("max-api");

let shift = 0;
let sustain = false;
const noteMap = {};
const shiftMap = {};

const shiftedNoteOn = (note, velocity) => {
  const shiftedNote = note + shift;
  if (!shiftMap[note]) shiftMap[note] = [];
  shiftMap[note].push(shiftedNote);
  Max.outlet("note", shiftedNote, velocity);
};

const shiftedNoteOff = (note) => {
  if (!shiftMap[note]) return;
  shiftMap[note].forEach((e) => Max.outlet("note", e, 0));
  delete shiftMap[note];
};

Max.addHandler("shift", (value) => {
  shift = value;
});

Max.addHandler("key", (note, velocity) => {
  if (velocity) {
    noteMap[note] = velocity;
    shiftedNoteOn(note, velocity);
  } else {
    delete noteMap[note];
    if (!sustain) shiftedNoteOff(note);
  }
});

Max.addHandler("sustain", (value) => {
  if (value) {
    sustain = true;
  } else {
    sustain = false;
    const shiftedNotes = Object.keys(shiftMap);
    shiftedNotes.forEach((n) => !noteMap[n] && shiftedNoteOff(n));
  }
});

Max.outlet("load", 1);
