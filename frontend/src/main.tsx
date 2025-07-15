import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');

console.log('=== MAIN.TSX LOADING ===');
console.log('Root element:', rootElement);

if (rootElement) {
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);

  console.log('Rendering Professional App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('React render completed!');
} else {
  console.error('❌ Root element not found!');
}


