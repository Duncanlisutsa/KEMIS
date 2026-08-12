import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import Alert from "@mui/material/Alert";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });

    window.clearTimeout(showNotification._timer);
    showNotification._timer = window.setTimeout(() => {
      setNotification((prev) => ({ ...prev, open: false }));
    }, 3500);
  };

  const handleClose = () => {
    window.clearTimeout(showNotification._timer);
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Rendered through a portal straight to document.body, completely
  // outside the app's DOM tree (sidebar, dashboard, tables, etc). That
  // way no ancestor element, stacking context, or z-index anywhere in
  // the page can ever end up sitting on top of it — the previous
  // MuiSnackbar rendered inline as a plain positioned div in this MUI
  // version (no portal of its own), which is what let the dashboard
  // cover it.
  const toast =
    notification.open &&
    createPortal(
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 999999,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Alert
            severity={notification.severity}
            variant="filled"
            onClose={handleClose}
          >
            {notification.message}
          </Alert>
        </div>
      </div>,
      document.body
    );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {toast}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);