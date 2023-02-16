const { findIndex } = require("./array");

const getBass = (notes) => {
  const lowKey = notes[0];
  let bass;

  if (lowKey >= 47) {
    const basses = {};

    let i = 0;
    let j = 1;

    while (1 < notes.length && i < notes.length) {
      if (j === notes.length) {
        i += 1;
        j = i + 1;
        continue;
      }

      const [note1, note2] = [+notes[i], +notes[j]].sort();
      // initial score is inversely proportional to pitch
      if (basses[note1] === undefined) basses[note1] = -(note1 / 4);
      if (basses[note2] === undefined) basses[note2] = -(note2 / 4);
      // adds score calculated by interval
      const interval = note2 - note1;
      const octave = Math.floor(interval / 12) + 1;
      const remainder = interval % 12;
      if (remainder === 7) basses[note1] += 10 / octave;
      if (remainder === 5) basses[note2] += 9 / octave;
      if ([3, 4].includes(remainder)) basses[note1] += 5 / octave;
      if ([8, 9].includes(remainder)) basses[note2] += 4 / octave;

      j += 1;
    }

    const bassesEntries = Object.entries(basses);
    const firstBass = bassesEntries.shift();

    const highestScoredBass = bassesEntries.reduce((acc, e) => {
      if (acc[1] < e[1]) return e;
      return acc;
    }, firstBass);

    bass = highestScoredBass && +highestScoredBass[0];
  }

  return ((bass === undefined ? lowKey : bass) % 12) + 36;
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

const getTriad = (bass) => {
  bass = bass % 12;
  let d1 = 0;
  while (d1 < scale.length) {
    if (bass === scale[d1]) break;
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

const midiToScaleIndexMap = {
  0: 0,
  1: 0,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 4,
  7: 4,
  8: 4,
  9: 5,
  10: 5,
  11: 6
};

const fitNoteToChord = (note, scale, bass) => {
  const octaves = Math.floor(note / 12);
  const absoluteNote = note % 12;
  const scaleIndex = midiToScaleIndexMap[absoluteNote];
  const bassIndex = findIndex(scale, bass % 12);
  const clonedScale = [...scale];
  const offsetScale = clonedScale
    .splice(bassIndex, scale.length)
    .concat(clonedScale);
  const tonic = offsetScale[0];
  const incrementalScale = offsetScale.map((e) => {
    let f = e;
    if (f < tonic) f += 12;
    if (6 < tonic) f -= 12;
    return f;
  });
  return incrementalScale[scaleIndex] + octaves * 12;
};

module.exports = {
  getBass,
  scale,
  setScale,
  addNoteToScale,
  getTriad,
  midiToNoteName,
  midiToAbsoluteNoteName,
  fitNoteToChord
};
