import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EnhancedTransactionUploader from './EnhancedTransactionUploader';
import Papa from 'papaparse';
import apiService from '../services/api.js';

vi.mock('react-dropzone', () => {
  return {
    useDropzone: (opts) => ({
      getRootProps: () => ({ onDrop: opts.onDrop }),
      getInputProps: () => ({ onChange: (e) => opts.onDrop(Array.from(e.target.files)) })
    })
  };
});

vi.mock('../services/api.js');
vi.mock('exceljs', () => ({
  Workbook: vi.fn().mockImplementation(() => ({
    xlsx: {
      load: vi.fn().mockResolvedValue(undefined)
    },
    getWorksheet: vi.fn().mockReturnValue({
      getRow: vi.fn().mockReturnValue({
        eachCell: vi.fn().mockImplementation((callback) => {
          callback({ value: 'header1' }, 1);
          callback({ value: 'header2' }, 2);
        })
      }),
      eachRow: vi.fn().mockImplementation((callback) => {
        callback({
          rowNumber: 2,
          eachCell: vi.fn().mockImplementation((callback) => {
            callback({ value: 'value1' }, 1);
            callback({ value: 'value2' }, 2);
          })
        }, 2);
      })
    })
  }))
}));

beforeEach(() => {
  vi.restoreAllMocks();
  apiService.checkHealth.mockResolvedValue({ cors_enabled: true });
  apiService.batchPredict.mockResolvedValue({ results: [], summary: {} });
  
  // Mock Papa.parse for CSV files
  vi.spyOn(Papa, 'parse').mockImplementation((file, opts) => {
    opts.complete({ data: [{ a: 1 }], errors: [] });
  });
});

afterEach(() => {
  cleanup();
});

describe('EnhancedTransactionUploader', () => {
  it('displays API status after successful health check', async () => {
    render(<EnhancedTransactionUploader onFilesProcessed={() => {}} />);
    await waitFor(() => expect(apiService.checkHealth).toHaveBeenCalled());
    expect(screen.getByText(/connected/i)).toBeTruthy();
  });

  it.skip('processes dropped CSV file and calls batchPredict', async () => {});

  it.skip('processes dropped XLSX file using ExcelJS', async () => {});
});
