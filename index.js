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

let base;
let triad = [];
let safeNotes = [];
let tension = [];
let sustain = false;
let velocityAvg = 0;
let scaleLock = false;

const notesCache = {};

// Get all currently played notes from cache.
const getPlayedNotes = () => {
  const notes = [];
  for (const key in notesCache) {
    notes.push(Number(key));
  }
  notes.sort((a, b) => a - b);
  return notes;
};

// Send scale outlet to max.
const outletScale = () => {
  Max.outlet("scale", ...scale);
  Max.outlet("scaleNames", ...scale.map(midiToAbsoluteNoteName));
};

// Send base and triad outlet to max.
const outletBaseTriad = (notes) => {
  const newBase = getBase(notes);
  if (base !== newBase) {
    Max.outlet("base", base, 0);

    let velocitySum = 0;
    let length = 0;
    for (const key in notesCache) {
      velocitySum += notesCache[key];
      length++;
    }
    velocityAvg = velocitySum / length;
    Max.outlet("velocity", velocityAvg);

    base = newBase;
    Max.outlet("base", base, velocityAvg);
    Max.outlet("baseName", midiToNoteName(base));

    triad.forEach((e) => Max.outlet("triad", e, 0));
    triad = getTriad(newBase);
    triad.forEach((e) => Max.outlet("triad", e, velocityAvg));
    Max.outlet("triadNames", ...triad.map(midiToNoteName));
  }
};

// Send tension and safeNotes outlet to max.
const outletTensions = (notes) => {
  // Get new safeNotes.
  const newSafeNotes = triad.filter((e) => {
    return notes.reduce((acc, f) => {
      const interval = e - f;
      const intervalAbs = Math.abs(interval);
      return !(
        !acc ||
        (intervalAbs < 3 && intervalAbs) ||
        (9 < interval && interval < 15 && interval !== 12)
      );
    }, true);
  });

  // Note-off previously played safeNotes.
  safeNotes.forEach((e) => {
    if (!newSafeNotes.find((f) => e === f)) Max.outlet("safeNotes", e, 0);
  });

  // Play updated safeNotes.
  newSafeNotes.forEach((e) => {
    if (!safeNotes.find((f) => e === f))
      Max.outlet("safeNotes", e, velocityAvg);
  });

  // Display safeNotes with note names.
  if (newSafeNotes.length) {
    Max.outlet("safeNotesNames", ...newSafeNotes.map(midiToNoteName));
  } else {
    Max.outlet("safeNotesNames", "unknown");
  }

  // Update cached safeNotes with the new one.
  safeNotes = newSafeNotes;

  // Update tension.
  const newTension = notes.filter((e) => {
    return !triad.find((f) => {
      return e % 12 === f % 12;
    });
  });

  // Note-off previously played tension.
  if (!sustain) {
    tension.forEach((e) => {
      if (!newTension.find((f) => e === f)) Max.outlet("tension", e, 0);
    });
  }

  // Play updated tension.
  newTension.forEach((e) => {
    if (!tension.find((f) => e === f)) Max.outlet("tension", e, notesCache[e]);
  });

  // Display tension with note names.
  if (newTension.length) {
    Max.outlet("tensionNames", ...newTension.map(midiToNoteName));
  } else {
    Max.outlet("tensionNames", "unknown");
  }

  // Update cached tension with the new one.
  if (sustain) tension = [...tension, ...newTension];
  else tension = newTension;
};

// Note off all notes.
const noteOffAll = () => {
  velocityAvg = 0;
  Max.outlet("velocity", velocityAvg);
  Max.outlet("base", base, velocityAvg);
  base = null;
  tension.forEach((e) => Max.outlet("tension", e, velocityAvg));
  safeNotes.forEach((e) => Max.outlet("safeNotes", e, velocityAvg));
  triad.forEach((e) => Max.outlet("triad", e, velocityAvg));
};

// Detect key input and analyze chords.
Max.addHandler("key", (note, velocity) => {
  if (!velocity) {
    // If input is note-off input:
    delete notesCache[note];
    const notes = getPlayedNotes();
    if (!notes.length && !sustain) noteOffAll();
    else {
      outletTensions(notes);
      if (notes[0] < 48) outletBaseTriad(notes);
    }
  } else {
    // If input is note-on input:
    notesCache[note] = velocity;

    if (!scaleLock) {
      // Update scale if scaleLock is not active.
      addNoteToScale(note);
      outletScale();
    }

    const notes = getPlayedNotes();

    outletBaseTriad(notes);
    outletTensions(notes);
  }
});

// Detect input forcely changes scale.
Max.addHandler("scale", (note) => {
  setScale(note);
  outletScale();
});

// Detect scale lock input.
Max.addHandler("scaleLock", (value) => {
  scaleLock = !!value;
});

// Detect sustain pedal input.
Max.addHandler("sustain", (value) => {
  if (value) sustain = true;
  else {
    sustain = false;
    const notes = getPlayedNotes();
    if (!notes.length) noteOffAll();
    else outletTensions(notes);
  }
});
