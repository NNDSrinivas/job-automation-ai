import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated,
    loading,
    hasUser: !!user,
    currentPath: window.location.pathname
  });

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ ProtectedRoute: Authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
