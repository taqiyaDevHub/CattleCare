import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('cc_user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'));
  const [user, setUser] = useState(readUser);

  const signIn = useCallback(({ token: newToken, user: newUser }) => {
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const updateUser = useCallback((newUser) => {
    localStorage.setItem('cc_user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, signIn, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
