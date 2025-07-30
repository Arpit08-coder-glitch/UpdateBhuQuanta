import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isEmailVerified } = useAuth();
  console.log('ProtectedRoute: isEmailVerified =', isEmailVerified);
  
  if (!isEmailVerified) {
    console.log('ProtectedRoute: Redirecting to /');
    return <Navigate to="/" replace />;
  }
  console.log('ProtectedRoute: Rendering protected content');
  return children;
} 