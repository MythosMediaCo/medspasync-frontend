import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeTheme } from './theme.js';
import { ToastProvider } from './context/ToastContext'; // ✅ Toast context

// Initialize color mode or local theme preference
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
