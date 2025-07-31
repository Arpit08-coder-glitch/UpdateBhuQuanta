import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmailVerification from './components/UI/EmailVerification/EmailVerification';
import MapComponent from './components/UI/MapComponent';
import { AuthProvider } from './components/UI/AuthContext';
import ProtectedRoute from './components/UI/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Routes>
          <Route path="/" element={<EmailVerification />} />
          <Route path="/map" element={
            <ProtectedRoute>
              <MapComponent />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
