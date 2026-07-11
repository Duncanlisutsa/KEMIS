import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import { PERMISSIONS } from "../config/permissions";

import { Link } from "react-router-dom";
import {
  FaHome,
  FaBuilding,
  FaDoorOpen,
  FaUsers,
  FaFileContract,
  FaMoneyBillWave,
  FaTools,
  FaChartBar,
} from "react-icons/fa";

function Sidebar({ isOpen, onNavigate }) {

  const { user, loading } = useContext(AuthContext);

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

    window.location.href = "/login";
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
            marginBottom: "5px",
          }}
        >
          KEMIS
        </h2>

        <p
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            marginBottom: "20px",
          }}
        >
          Kabras Estate Management Information System
        </p>

        <hr
          style={{
            borderColor: "#334155",
            marginBottom: "20px",
          }}
        />
      </>

      <p
        style={{
          fontSize: "14px",
          color: "#cbd5e1",
          marginBottom: "20px",
        }}
      >
        Welcome,
        <br />
        <strong>{user.username}</strong>
        <br />
        <small>{user.role}</small>
      </p>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0 }}>
          {PERMISSIONS.dashboard.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/" style={linkStyle} onClick={onNavigate}>
                <FaHome /> Dashboard
              </Link>
            </li>
          )}

          {PERMISSIONS.estates.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/estates" style={linkStyle} onClick={onNavigate}>
                <FaBuilding /> Estates
              </Link>
            </li>
          )}

          {PERMISSIONS.units.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/units" style={linkStyle} onClick={onNavigate}>
                <FaDoorOpen /> Units
              </Link>
            </li>
          )}

          {PERMISSIONS.tenants.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/tenants" style={linkStyle} onClick={onNavigate}>
                <FaUsers /> Tenants
              </Link>
            </li>
          )}

          {PERMISSIONS.leases.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/leases" style={linkStyle} onClick={onNavigate}>
                <FaFileContract /> Leases
              </Link>
            </li>
          )}

          {PERMISSIONS.payments.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/payments" style={linkStyle} onClick={onNavigate}>
                <FaMoneyBillWave /> Payments
              </Link>
            </li>
          )}

          {PERMISSIONS.maintenance.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/maintenance" style={linkStyle} onClick={onNavigate}>
                <FaTools /> Maintenance
              </Link>
            </li>
          )}

          {PERMISSIONS.reports.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/reports" style={linkStyle} onClick={onNavigate}>
                <FaChartBar /> Reports
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