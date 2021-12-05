const Max = require("max-api");

let shift = 0;
const map = {};

Max.addHandler("shift", (value) => {
  shift = value;
});

Max.addHandler("key", (note, velocity) => {
  if (velocity) {
    const shiftedNote = note + shift;
    if (!map[note]) map[note] = [];
    map[note].push(shiftedNote);
    Max.outlet("note", shiftedNote, velocity);
  } else if (map[note]) {
    map[note].forEach((e) => Max.outlet("note", e, 0));
    delete map[note];
  }
});

Max.outlet("load", 1);
