import React from 'react';

const TestJobsPage: React.FC = () => {
  console.log('🔥 TEST COMPONENT RENDERING!');

  return (
    <div style={{ backgroundColor: 'red', color: 'white', padding: '50px', fontSize: '24px' }}>
      <h1>🔥 TEST JOBS PAGE IS WORKING!</h1>
      <p>If you can see this, the routing is working.</p>
      <p>Current URL: {window.location.href}</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestJobsPage;
