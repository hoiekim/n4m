const getBase = (notes) => {
  const lowKey = notes[0];
  let base;

  if (lowKey >= 48) {
    const bases = {};
    const secondLowKey = notes[1];
    if (secondLowKey) bases[secondLowKey] = 0;

    let i = 0;
    let j = 1;

    while (i < notes.length) {
      if (j === notes.length) {
        i += 1;
        j = i + 1;
        continue;
      }
      const note1 = notes[i];
      const note2 = notes[j];
      // initial score is negative of the note's pitch divided by 12
      if (!bases[note1]) bases[note1] = -(note1 / 12);
      if (!bases[note2]) bases[note2] = -(note2 / 12);
      const interval = note2 - note1;
      const octave = Math.floor(interval / 12) + 1;
      const remainder = interval % 12;
      // adds score calculated by interval
      if (remainder === 7) bases[note1] += 10 / octave;
      if (remainder === 5) bases[note2] += 6 / octave;
      if ([3, 4].includes(remainder)) bases[note1] += 2 / octave;
      if ([8, 9].includes(remainder)) bases[note2] += 1 / octave;

      j += 1;
    }

    let note;
    let score = 0;
    for (let key in bases) {
      const value = bases[key];
      key = Number(key);
      if (score < value || (score === value && note > key)) {
        score = value;
        note = key;
      }
    }

    base = note;
  }

  return ((base || lowKey) % 12) + 36;
};

const scale = [0, 2, 4, 5, 7, 9, 11];

const setScale = (tonic) => {
  scale[0] = tonic % 12;
  scale[1] = (tonic + 2) % 12;
  scale[2] = (tonic + 4) % 12;
  scale[3] = (tonic + 5) % 12;
  scale[4] = (tonic + 7) % 12;
  scale[5] = (tonic + 9) % 12;
  scale[6] = (tonic + 11) % 12;
  return scale;
};

const addNoteToScale = (note) => {
  note = note % 12;
  const tonic = scale[0];
  let interval = note - tonic;
  if (interval < 0) interval += 12;
  if (interval === 1 || interval === 6) {
    setScale(tonic + interval + 1);
  } else if (interval === 3 || interval === 10) {
    setScale(tonic + interval + 7);
  }
  return scale;
};

const getTriad = (base) => {
  base = base % 12;
  let d1 = 0;
  while (d1 < scale.length) {
    if (base === scale[d1]) break;
    d1++;
  }
  const d3 = (d1 + 2) % 7;
  const d5 = (d1 + 4) % 7;
  const triad = [scale[d1] + 60, scale[d3] + 60, scale[d5] + 60];
  return triad;
};

const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B"
];

const midiToNoteName = (midi) => {
  let octave = -1;
  while (midi >= 12) {
    midi -= 12;
    octave += 1;
  }
  return noteNames[midi] + octave;
};

const midiToAbsoluteNoteName = (midi) => {
  return noteNames[midi];
};

module.exports = {
  getBase,
  scale,
  setScale,
  addNoteToScale,
  getTriad,
  midiToNoteName,
  midiToAbsoluteNoteName
};
