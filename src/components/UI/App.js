import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmailVerification from './EmailVerification';
import MapComponent from './MapComponent';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Routes>
        <Route path="/" element={<EmailVerification />} />
        <Route path="/map" element={<MapComponent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App; 