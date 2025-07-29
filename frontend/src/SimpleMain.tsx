import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('=== SIMPLE APP STARTING ===');

function SimpleApp() {
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '30px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          🚀 Job Automation AI
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
          Your React application is now working perfectly!
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>✅ React Working</h3>
            <p>Components are rendering correctly</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>✅ Styling Working</h3>
            <p>CSS and styling systems functional</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>✅ Development Ready</h3>
            <p>Ready to build your features</p>
          </div>
        </div>

        <button 
          style={{
            marginTop: '30px',
            padding: '15px 30px',
            fontSize: '1.1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => alert('🎉 Interactive elements working!')}
          onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#45a049'}
          onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#4CAF50'}
        >
          Test Interaction
        </button>
        
        <p style={{ marginTop: '20px', opacity: 0.8 }}>
          Time: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root found, rendering app...');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<SimpleApp />);
  console.log('App rendered successfully!');
} else {
  console.error('Root element not found');
}
