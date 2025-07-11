// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface Props {
  children: JSX.Element;
}

const PrivateRoute = ({ children }: Props) => {
  const location = useLocation();
  const loggedIn = isAuthenticated();

  if (!loggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
