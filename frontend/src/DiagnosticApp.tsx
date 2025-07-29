import React from 'react';

// Super simple diagnostic component
const DiagnosticApp: React.FC = () => {
  console.log('🩺 DiagnosticApp rendering...');
  
  React.useEffect(() => {
    console.log('🩺 DiagnosticApp mounted');
    
    // Check if DOM is working
    const rootElement = document.getElementById('root');
    console.log('🩺 Root element:', rootElement);
    console.log('🩺 Root element children:', rootElement?.children.length);
    
    return () => {
      console.log('🩺 DiagnosticApp unmounting');
    };
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1e40af',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 9999
    }}>
      <h1 style={{ marginBottom: '20px' }}>🩺 Diagnostic Screen</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <p>✅ React: Working</p>
        <p>✅ Vite: Connected</p>
        <p>✅ DOM: Mounted</p>
      </div>
    </div>
  );
};

export default DiagnosticApp;
