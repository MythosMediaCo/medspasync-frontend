jest.mock('mongoose', () => ({}));
jest.mock('../models/ReconciliationLog', () => ({}));
const { matchDatasets } = require('../reconciliation/engine');

describe('reconciliation engine', () => {
  test('matches identical records', () => {
    const a = [{ name: 'A' }];
    const b = [{ name: 'A' }];
    const result = matchDatasets(a, b, ['name']);
    expect(result.matches.length).toBe(1);
  });
});
