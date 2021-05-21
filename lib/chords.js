const getBase = (notes) => {
  let lowKey = notes[0];
  let base;

  if (lowKey >= 48) {
    const bases = { [lowKey]: 0 };
    const secondLowKey = notes[1];
    if (secondLowKey) bases[secondLowKey] = 0;

    let i = 0;
    let j = 1;

    while (i < notes.length) {
      if (j === notes.length) {
        i += 1;
        j = i + 1;
        if (notes[i] && !bases[notes[i]]) bases[notes[i]] = 0;
      } else {
        const note1 = notes[i];
        const note2 = notes[j];
        const interval = note2 - note1;
        const octave = Math.floor(interval / 12) + 1;
        const intervalRemainder = interval % 12;
        if (intervalRemainder === 7) {
          bases[note1] += 4 / octave;
        } else if (intervalRemainder === 5) {
          bases[note2] += 3 / octave;
        } else if (intervalRemainder === 4 || intervalRemainder === 3) {
          bases[note1] += 1 / octave;
        } else if (intervalRemainder === 8 || intervalRemainder === 9) {
          bases[note2] += 1 / octave;
        }

        j += 1;
        if (notes[j] && !bases[notes[j]]) bases[notes[j]] = 0;
      }
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

const getDegree = (base) => {
  base = base % 12;
  let i = 0;
  while (i < scale.length) {
    if (base === scale[i]) break;
    i++;
  }
  return i;
};

const getTriad = (base) => {
  const d1 = getDegree(base);
  const d3 = (d1 + 2) % 7;
  const d5 = (d1 + 4) % 7;
  const triad = [scale[d1] + 48, scale[d3] + 48, scale[d5] + 48];
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
  getDegree,
  getTriad,
  midiToNoteName,
  midiToAbsoluteNoteName
};
