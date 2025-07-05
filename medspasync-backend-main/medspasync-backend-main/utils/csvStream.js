const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function* parseCSVStream(filePath, options = {}) {
  const stream = fs.createReadStream(path.resolve(filePath)).pipe(csv(options));
  for await (const row of stream) {
    yield row;
  }
}

async function collectCSV(filePath, options = {}) {
  const rows = [];
  for await (const row of parseCSVStream(filePath, options)) {
    rows.push(row);
  }
  return rows;
}

module.exports = { parseCSVStream, collectCSV };
