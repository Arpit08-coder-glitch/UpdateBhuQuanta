import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize state from sessionStorage if available, otherwise default to false
  const [isEmailVerified, setIsEmailVerified] = useState(() => {
    const stored = sessionStorage.getItem('isEmailVerified');
    console.log('AuthContext: Raw sessionStorage value =', stored);
    const parsed = stored ? JSON.parse(stored) : false;
    console.log('AuthContext: Parsed sessionStorage value =', parsed);
    console.log('AuthContext: Initializing with stored value:', parsed);
    return parsed;
  });

  // Update sessionStorage whenever authentication state changes
  useEffect(() => {
    console.log('AuthContext: Updating sessionStorage with value:', isEmailVerified);
    sessionStorage.setItem('isEmailVerified', JSON.stringify(isEmailVerified));
    console.log('AuthContext: sessionStorage after update =', sessionStorage.getItem('isEmailVerified'));
  }, [isEmailVerified]);

  // Function to handle logout
  const logout = () => {
    console.log('AuthContext: Logging out user');
    setIsEmailVerified(false);
    sessionStorage.removeItem('isEmailVerified');
    console.log('AuthContext: sessionStorage after logout =', sessionStorage.getItem('isEmailVerified'));
  };

  return (
    <AuthContext.Provider value={{ isEmailVerified, setIsEmailVerified, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 