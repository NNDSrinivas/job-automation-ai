import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebugComponent: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'black',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Auth Debug</h4>
      <div>Loading: {loading ? 'YES' : 'NO'}</div>
      <div>IsAuthenticated: {isAuthenticated ? 'YES' : 'NO'}</div>
      <div>User: {user ? `${user.email} (${user.id})` : 'NULL'}</div>
      <div>Token: {localStorage.getItem('authToken') ? 'EXISTS' : 'NONE'}</div>
      <div>Path: {window.location.pathname}</div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{ marginTop: '5px', fontSize: '10px' }}
      >
        Clear & Reload
      </button>
    </div>
  );
};

export default AuthDebugComponent;
