import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

/**
 * AuthProvider manages authentication state using HttpOnly JWT cookies.
 * Since tokens are HttpOnly, the frontend verifies the session by calling
 * the /api/auth/profile endpoint (the browser sends the cookie automatically).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    authService
      .getProfile()
      .then((res) => {
        if (mounted) {
          setUser(res.data.farmer || null);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const login = (farmer) => {
    setUser(farmer);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
