import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import { PERMISSIONS } from "../config/permissions";

import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import {
  FaHome,
  FaBuilding,
  FaDoorOpen,
  FaUsers,
  FaFileContract,
  FaMoneyBillWave,
  FaTools,
  FaChartBar,
  FaUserTie,
  FaClipboardList,
  FaSun,
  FaMoon,
} from "react-icons/fa";

function Sidebar({ isOpen, onNavigate }) {

  const { user, loading } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div
        className={`sidebar${isOpen ? " open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "250px",
          height: "100vh",
          background: "#1e293b",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
          zIndex: 1000,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/";
  };

  return (
    <div
      className={`sidebar${isOpen ? " open" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "250px",
        height: "100vh",
        background: "#1e293b",
        color: "white",
        padding: "20px",
        overflow: "hidden",
        boxSizing: "border-box",
        zIndex: 1000,

        display: "flex",
        flexDirection: "column",
      }}
    >
      <>
        <h2
          style={{
            marginTop: 0,
            marginBottom: "10px",
          }}
        >
          KEMIS
        </h2>

        <hr
          style={{
            borderColor: "#334155",
            marginBottom: "10px",
          }}
        />
      </>

      <p
        style={{
          fontSize: "14px",
          color: "#cbd5e1",
          marginBottom: "10px",
        }}
      >
        Welcome,
        <br />
        <strong>{user.username}</strong>
        <br />
        <small>{user.role}</small>
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <NotificationBell />

        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            border: "1px solid #334155",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0 }}>
          {PERMISSIONS.dashboard.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/" style={linkStyle} onClick={onNavigate}>
                <FaHome /> Dashboard
              </Link>
            </li>
          )}

          {PERMISSIONS.estates.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/estates" style={linkStyle} onClick={onNavigate}>
                <FaBuilding /> Estates
              </Link>
            </li>
          )}

          {PERMISSIONS.units.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/units" style={linkStyle} onClick={onNavigate}>
                <FaDoorOpen /> Units
              </Link>
            </li>
          )}

          {PERMISSIONS.tenants.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/tenants" style={linkStyle} onClick={onNavigate}>
                <FaUsers /> Tenants
              </Link>
            </li>
          )}

          {PERMISSIONS.leases.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/leases" style={linkStyle} onClick={onNavigate}>
                <FaFileContract /> Leases
              </Link>
            </li>
          )}

          {PERMISSIONS.payments.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/payments" style={linkStyle} onClick={onNavigate}>
                <FaMoneyBillWave /> Payments
              </Link>
            </li>
          )}

          {PERMISSIONS.maintenance.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/maintenance" style={linkStyle} onClick={onNavigate}>
                <FaTools /> Maintenance
              </Link>
            </li>
          )}

          {PERMISSIONS.reports.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/reports" style={linkStyle} onClick={onNavigate}>
                <FaChartBar /> Reports
              </Link>
            </li>
          )}

          {PERMISSIONS.staffAccounts.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/staff-accounts" style={linkStyle} onClick={onNavigate}>
                <FaUserTie /> Managers & Landlords
              </Link>
            </li>
          )}

          {PERMISSIONS.auditLog.includes(user.role) && (
            <li style={{ margin: "10px 0" }}>
              <Link to="/audit-log" style={linkStyle} onClick={onNavigate}>
                <FaClipboardList /> Audit Log
              </Link>
            </li>
          )}

          <li
            style={{
              marginTop: "auto",
              listStyle: "none",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "10px",
                width: "100%",
                cursor: "pointer",
                borderRadius: "5px",
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

export default Sidebar;