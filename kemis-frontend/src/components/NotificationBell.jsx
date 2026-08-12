import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaBell } from "react-icons/fa";
import api from "../services/api";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelPos, setPanelPos] = useState(null);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  const panelRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedButton = wrapperRef.current && wrapperRef.current.contains(e.target);
      const clickedPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!clickedButton && !clickedPanel) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("notifications/unread_count/");
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("notifications/");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const toggleOpen = () => {
    const next = !open;

    if (next && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, left: rect.left });
    }

    setOpen(next);

    if (next) {
      fetchNotifications();
    }
  };

  const markRead = async (id) => {
    try {
      await api.post(`notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("notifications/mark_all_read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications read:", error);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", marginBottom: "20px" }}>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        style={{
          background: "transparent",
          border: "1px solid #334155",
          color: "white",
          borderRadius: "6px",
          padding: "8px 10px",
          width: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaBell /> Notifications
        </span>

        {unreadCount > 0 && (
          <span
            style={{
              background: "#e8821e",
              color: "white",
              borderRadius: "999px",
              fontSize: "11px",
              padding: "2px 7px",
              fontWeight: "bold",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: "300px",
              maxHeight: "360px",
              overflowY: "auto",
              background: "white",
              color: "#1e293b",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              zIndex: 999999,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <strong style={{ fontSize: "14px" }}>Notifications</strong>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <p style={{ padding: "16px", fontSize: "13px", color: "#64748b", margin: 0 }}>
                No notifications yet.
              </p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  background: n.is_read ? "white" : "#eff6ff",
                  cursor: n.is_read ? "default" : "pointer",
                }}
              >
                <p style={{ margin: 0, fontSize: "13px", color: "#1e293b" }}>{n.message}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

export default NotificationBell;