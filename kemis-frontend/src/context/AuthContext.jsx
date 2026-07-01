import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("accounts/me/");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user", error);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}