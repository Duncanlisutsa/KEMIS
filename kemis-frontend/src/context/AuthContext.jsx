import { createContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "./NotificationContext";

export const AuthContext = createContext();

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000; // don't hammer localStorage on mousemove
const LAST_ACTIVITY_KEY = "last_activity";
const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "wheel", "scroll", "touchstart"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const idleTimerRef = useRef(null);
  const lastWriteRef = useRef(0);
  const userRef = useRef(null); // lets event listeners see current user without re-binding

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearSession = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  const logout = useCallback(
    (options = {}) => {
      const { dueToInactivity = false } = options;

      clearSession();
      setUser(null);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      if (dueToInactivity) {
        showNotification(
          "You've been logged out due to inactivity. Please log in again.",
          "info"
        );
      }

      navigate("/login", { replace: true });
    },
    [navigate, showNotification]
  );

  const recordActivity = (force = false) => {
    const now = Date.now();
    if (force || now - lastWriteRef.current > ACTIVITY_WRITE_THROTTLE_MS) {
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      lastWriteRef.current = now;
    }
  };

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      if (userRef.current) {
        logout({ dueToInactivity: true });
      }
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  const handleActivity = useCallback(() => {
    if (!userRef.current) return;

    recordActivity();
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Catches idle time that happened while the tab was closed, asleep, or backgrounded
  // (setTimeout can't be trusted to fire reliably in those cases).
  const isSessionStale = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY), 10);
    return !!lastActivity && Date.now() - lastActivity > IDLE_TIMEOUT_MS;
  };

  const loadUser = async () => {
    if (isSessionStale()) {
      clearSession();
      setUser(null);
      setLoading(false);
      return null;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get("accounts/me/");
      setUser(response.data);
      recordActivity(true);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error("Failed to load user", error);

      clearSession();

      setUser(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire up (and tear down) the inactivity watcher whenever login state changes
  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    recordActivity(true);
    resetIdleTimer();

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (isSessionStale()) {
          logout({ dueToInactivity: true });
        } else {
          resetIdleTimer();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // If another tab logs out (manually or via idle timeout), mirror it here
    const handleStorage = (e) => {
      if (e.key === "access_token" && e.newValue === null) {
        setUser(null);
        navigate("/login", { replace: true });
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [user, handleActivity, resetIdleTimer, logout, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loadUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}