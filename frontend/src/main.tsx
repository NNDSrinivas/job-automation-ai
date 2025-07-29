import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('=== JOB AUTOMATION AI STARTING ===');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root found, rendering Job Automation AI app...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  console.log('Job Automation AI app rendered successfully!');
} else {
  console.error('Root element not found');
}
