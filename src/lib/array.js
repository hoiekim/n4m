const findIndex = (array, e) => {
  let i;

  array.find((f, j) => {
    if (f === e) {
      i = j;
      return true;
    }
  });

  if (i === undefined) {
    throw new Error(`findIndex function failed: ${e} is not in ${array}`);
  }

  return i;
};

module.exports = { findIndex };
