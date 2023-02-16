const Max = require("max-api");
const {
  getBass,
  scale,
  setScale,
  addNoteToScale,
  getTriad,
  midiToNoteName,
  midiToAbsoluteNoteName
} = require("../lib/chords");

let bass;
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

// Send bass and triad outlet to max.
const outletBassTriad = (notes) => {
  const newBass = getBass(notes);
  if (bass !== newBass) {
    Max.outlet("bass", newBass, velocityAvg);
    Max.outlet("bassNumber", newBass);
    Max.outlet("bassName", midiToNoteName(newBass));
    Max.outlet("bass", bass, 0);

    triad.forEach((e) => Max.outlet("triad", e, 0));
    triad = getTriad(newBass);
    triad.forEach((e) => Max.outlet("triad", e, velocityAvg));
    Max.outlet("triadNumbers", ...triad);
    Max.outlet("triadNames", ...triad.map(midiToNoteName));

    bass = newBass;
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
    Max.outlet("safeNotesNumbers", ...newSafeNotes);
    Max.outlet("safeNotesNames", ...newSafeNotes.map(midiToNoteName));
  } else {
    Max.outlet("safeNotesNumbers", "unknown");
    Max.outlet("safeNotesNames", "unknown");
  }

  // Update cached safeNotes with the new one.
  safeNotes = newSafeNotes;

  // Update tension.
  const newTension = notes.filter((e) => {
    return !triad.find((f) => {
      return e % 12 === f % 12 && e < 72;
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
    Max.outlet("tensionNumbers", ...newTension);
    Max.outlet("tensionNames", ...newTension.map(midiToNoteName));
  } else {
    Max.outlet("tensionNumbers", "unknown");
    Max.outlet("tensionNames", "unknown");
  }

  // Update cached tension with the new one.
  if (sustain) tension = [...tension, ...newTension];
  else tension = newTension;
};

const outletVelocity = () => {
  let velocitySum = 0;
  let length = 0;

  for (const key in notesCache) {
    velocitySum += notesCache[key];
    length++;
  }

  velocityAvg = velocitySum / length;
  Max.outlet("velocity", velocityAvg);
};

// Note off all notes.
const noteOffAll = () => {
  velocityAvg = 0;
  Max.outlet("velocity", velocityAvg);
  Max.outlet("bass", bass, velocityAvg);
  bass = null;
  tension.forEach((e) => Max.outlet("tension", e, velocityAvg));
  safeNotes.forEach((e) => Max.outlet("safeNotes", e, velocityAvg));
  triad.forEach((e) => Max.outlet("triad", e, velocityAvg));
};

// Detect key input and analyze chords.
Max.addHandler("key", (note, velocity) => {
  if (!velocity) {
    // If input is note-off input:
    delete notesCache[note];
    outletVelocity();
    const notes = getPlayedNotes();
    if (!notes.length && !sustain) noteOffAll();
    else {
      outletTensions(notes);
      if (notes[0] < 47) outletBassTriad(notes);
    }
  } else {
    // If input is note-on input:
    notesCache[note] = velocity;
    outletVelocity();

    if (!scaleLock) {
      // Update scale if scaleLock is not active.
      addNoteToScale(note);
      outletScale();
    }

    const notes = getPlayedNotes();
    if (!sustain) outletBassTriad(notes);
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
    else {
      outletBassTriad(notes);
      outletTensions(notes);
    }
  }
});

Max.outlet("load", 1);
