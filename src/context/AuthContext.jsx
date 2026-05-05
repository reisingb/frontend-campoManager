import React, { createContext, useContext, useState } from 'react';
import { USERS } from '../data/initialData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const login = (username, password) => {
    if (USERS[username] && USERS[username] === password) {
      setCurrentUser(username);
      setError('');
      return true;
    }
    setError('Usuario o contraseña incorrectos');
    return false;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
