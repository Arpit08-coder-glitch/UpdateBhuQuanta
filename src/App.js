import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EmailVerification from './components/EmailVerification';
import MapComponent from './components/MapComponent';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EmailVerification />} />
      <Route path="/map" element={<MapComponent />} />
    </Routes>
  );
}

export default App;
