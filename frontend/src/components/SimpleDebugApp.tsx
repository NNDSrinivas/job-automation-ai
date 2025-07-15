import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SimpleDebugApp: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('🏠 SimpleDebugApp render:', {
    isAuthenticated,
    loading,
    user: user ? { id: user.id, email: user.email } : null,
    currentPath: window.location.pathname
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-white max-w-md">
        <h1 className="text-2xl font-bold mb-4">🔍 Debug Information</h1>
        <div className="space-y-2">
          <p><strong>Current Path:</strong> {window.location.pathname}</p>
          <p><strong>Loading:</strong> {loading ? 'YES' : 'NO'}</p>
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'YES' : 'NO'}</p>
          <p><strong>User:</strong> {user ? `${user.email} (ID: ${user.id})` : 'None'}</p>
          <p><strong>Token in localStorage:</strong> {localStorage.getItem('authToken') ? 'EXISTS' : 'NONE'}</p>
          <p><strong>Expected Route:</strong> {!isAuthenticated ? 'LandingPage' : 'Dashboard'}</p>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Clear Storage & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDebugApp;
