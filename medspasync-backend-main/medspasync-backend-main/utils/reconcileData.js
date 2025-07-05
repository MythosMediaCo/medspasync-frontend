// utils/reconcileData.js
const stringSimilarity = require('string-similarity');

/**
 * Basic fuzzy reconciliation between three files
 * Assumes each file is an array of row objects
 */
function reconcileData(file1, file2, file3) {
  const matched = [];
  const unmatched1 = [...file1];
  const unmatched2 = [...file2];
  const unmatched3 = [...file3];

  file1.forEach(row1 => {
    const match2 = file2.find(row2 =>
      row1?.patient && row2?.patient &&
      stringSimilarity.compareTwoStrings(row1.patient, row2.patient) > 0.8
    );

    const match3 = file3.find(row3 =>
      row1?.patient && row3?.patient &&
      stringSimilarity.compareTwoStrings(row1.patient, row3.patient) > 0.8
    );

    if (match2 && match3) {
      matched.push({ row1, match2, match3 });

      // Remove matched from unmatched
      unmatched2.splice(unmatched2.indexOf(match2), 1);
      unmatched3.splice(unmatched3.indexOf(match3), 1);
      unmatched1.splice(unmatched1.indexOf(row1), 1);
    }
  });

  return {
    success: true,
    totalMatches: matched.length,
    matched,
    unmatched: {
      file1: unmatched1,
      file2: unmatched2,
      file3: unmatched3
    }
  };
}

module.exports = reconcileData;
