// utils/cleanCSV.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Normalizes header keys (removes spaces, lowers case, etc.)
 * @param {string} header
 * @returns {string}
 */
const normalizeHeader = (header) => {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/[^\w\-]/g, '');     // Remove special characters
};

/**
 * Cleans and parses a CSV file from disk
 * @param {string} filePath
 * @returns {Promise<Array<Object>>}
 */
const cleanCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const cleanData = [];

    fs.createReadStream(path.resolve(filePath))
      .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on('data', (row) => {
        // Remove rows where all values are empty
        const hasValues = Object.values(row).some((v) => v && v.toString().trim() !== '');
        if (hasValues) cleanData.push(row);
      })
      .on('end', () => {
        resolve(cleanData);
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
};

module.exports = cleanCSV;
