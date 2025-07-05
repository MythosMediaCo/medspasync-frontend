import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
import ResultsDashboard from './ResultsDashboard';
import apiService from '../services/api.js';

const EnhancedTransactionUploader = ({ onFilesProcessed }) => {
  const [files, setFiles] = useState({});
  const [processingStep, setProcessingStep] = useState('');
  const [results, setResults] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  const { getRootProps, getInputProps } = useDropzone({ onDrop: handleDrop });

  useEffect(() => {
    checkApiHealth();
  }, []);

  async function checkApiHealth() {
    try {
      const data = await apiService.checkHealth();
      setApiStatus(data.cors_enabled ? 'connected' : 'degraded');
    } catch (err) {
      setApiStatus('offline');
    }
  }

  function handleDrop(acceptedFiles) {
    const newFiles = {};
    acceptedFiles.forEach(f => newFiles[f.name] = f);
    setFiles(prev => ({ ...prev, ...newFiles }));
  }

  async function parseFile(file) {
    if (file.name.endsWith('.csv')) {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: res => resolve(res.data),
          error: reject
        });
      });
    } else if (file.name.endsWith('.xlsx')) {
      try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        const data = [];
        const headers = [];
        
        // Get headers from first row
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value;
        });
        
        // Get data from remaining rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              rowData[headers[colNumber - 1]] = cell.value;
            });
            data.push(rowData);
          }
        });
        
        return data;
      } catch (error) {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
      }
    } else {
      throw new Error('Unsupported file type');
    }
  }

  async function handleProcessReconciliation() {
    try {
      setProcessingStep('Parsing files...');
      const parsed = await Promise.all(Object.values(files).map(parseFile));
      const pairs = parsed.flat().map((row, i) => ({
        reward_transaction: row,
        pos_transaction: row
      }));
      setProcessingStep('Sending data to AI for reconciliation...');
      const recResults = await apiService.batchPredict(pairs);
      setResults(recResults);
      onFilesProcessed(recResults);
      setProcessingStep('Reconciliation complete!');
    } catch (err) {
      setProcessingStep(`Error during reconciliation: ${err.message}`);
      setResults(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div {...getRootProps({ className: 'border p-4' })}>
        <input data-testid="file-input" {...getInputProps()} />
        <p>Drag & drop files here</p>
        <p>API Status: {apiStatus}</p>
      </div>
      <div className="flex space-x-2">
        <button onClick={handleProcessReconciliation} className="px-4 py-2 bg-blue-500 text-white rounded">Process Reconciliation</button>
      </div>
      {results && <ResultsDashboard results={results} onManualReview={() => {}} onExport={() => {}} />}
      {processingStep && <div>{processingStep}</div>}
    </div>
  );
};

export default EnhancedTransactionUploader;
