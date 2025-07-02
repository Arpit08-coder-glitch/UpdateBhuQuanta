import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  return (
    <AuthContext.Provider value={{ isEmailVerified, setIsEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 