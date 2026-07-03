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

function Sidebar() {

  const { user, loading } = useContext(AuthContext);

    if (loading) {
      return (
        <div
          style={{
            width: "250px",
            height: "100vh",
            background: "#1e293b",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "18px",
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
      style={{
        width: "250px",
        height: "100vh",
        background: "#1e293b",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>KEMIS</h2>

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

      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {PERMISSIONS.dashboard.includes(user.role) && (
          <li style={{ margin: "20px 0" }}>
            <Link to="/" style={linkStyle}>
              <FaHome /> Dashboard
            </Link>
          </li>
        )}

          {PERMISSIONS.estates.includes(user.role) && (
          <li style={{ margin: "20px 0" }}>
            <Link to="/estates" style={linkStyle}>
              <FaBuilding /> Estates
            </Link>
          </li>
        )}

          {PERMISSIONS.units.includes(user.role) && (
          <li style={{ margin: "20px 0" }}>
            <Link to="/units" style={linkStyle}>
              <FaDoorOpen /> Units
            </Link>
          </li>
        )}

          {PERMISSIONS.tenants.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/tenants" style={linkStyle}>
                <FaUsers /> Tenants
              </Link>
            </li>
          )}
          

          {PERMISSIONS.leases.includes(user.role) && (
          <li style={{ margin: "20px 0" }}>
            <Link to="/leases" style={linkStyle}>
              <FaFileContract /> Leases
            </Link>
          </li>
        )}

          {PERMISSIONS.payments.includes(user.role) && (
          <li style={{ margin: "20px 0" }}>
            <Link to="/payments" style={linkStyle}>
              <FaMoneyBillWave /> Payments
            </Link>
          </li>
        )}

          {PERMISSIONS.maintenance.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/maintenance" style={linkStyle}>
                <FaTools /> Maintenance
              </Link>
            </li>
          )}
          

          {PERMISSIONS.reports.includes(user.role) && (
            <li style={{ margin: "20px 0" }}>
              <Link to="/reports" style={linkStyle}>
                <FaChartBar /> Reports
              </Link>
            </li>
          )}
          <li style={{ margin: "20px 0" }}>
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

