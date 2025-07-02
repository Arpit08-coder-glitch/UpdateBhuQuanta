import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { isEmailVerified } = useAuth();
  if (!isEmailVerified) {
    return <Navigate to="/" replace />;
  }
  return children;
} 