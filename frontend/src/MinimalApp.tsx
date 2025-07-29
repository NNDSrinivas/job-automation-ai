import React from 'react';

// Absolute minimal test - no external CSS dependencies
const MinimalApp: React.FC = () => {
  console.log('🟢 MinimalApp rendering...');
  
  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#ff0000',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      zIndex: '99999'
    }
  }, 'MINIMAL TEST - RED SCREEN');
};

export default MinimalApp;
