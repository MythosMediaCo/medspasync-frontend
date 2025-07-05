// utils/reconcileFiles.js
const levenshtein = require('fast-levenshtein');

function normalize(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
}

function getMatchKey(row) {
  return normalize(`${row.FirstName || ''} ${row.LastName || ''} ${row.Email || row.Phone || ''}`);
}

function fuzzyMatch(row, others) {
  const key = getMatchKey(row);
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const other of others) {
    const otherKey = getMatchKey(other);
    const distance = levenshtein.get(key, otherKey);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = other;
    }
  }

  return bestDistance <= 5 ? { match: bestMatch, distance: bestDistance } : null;
}

function reconcileFiles(file1, file2, file3) {
  const matches = [];
  const fuzzyMatches = [];
  const unmatched = [];

  for (const row of file1) {
    const key = getMatchKey(row);

    const exact2 = file2.find(r => getMatchKey(r) === key);
    const exact3 = file3.find(r => getMatchKey(r) === key);

    if (exact2 && exact3) {
      matches.push({ row, matchedWith: [exact2, exact3], type: 'exact' });
    } else {
      const fuzzy2 = fuzzyMatch(row, file2);
      const fuzzy3 = fuzzyMatch(row, file3);

      if (fuzzy2 && fuzzy3) {
        fuzzyMatches.push({ row, matchedWith: [fuzzy2.match, fuzzy3.match], type: 'fuzzy', distances: [fuzzy2.distance, fuzzy3.distance] });
      } else {
        unmatched.push(row);
      }
    }
  }

  return { matches, fuzzyMatches, unmatched };
}

module.exports = reconcileFiles;
