import React, { useState } from 'react';
import EnhancedTransactionUploader from './components/EnhancedTransactionUploader';

const App = () => {
  const [results, setResults] = useState(null);
  return (
    <div className="max-w-4xl mx-auto p-4">
      <EnhancedTransactionUploader onFilesProcessed={setResults} />
    </div>
  );
};

export default App;
