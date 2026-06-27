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

      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ margin: "20px 0" }}>
            <Link to="/" style={linkStyle}>
              <FaHome /> Dashboard
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/estates" style={linkStyle}>
              <FaBuilding /> Estates
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/units" style={linkStyle}>
              <FaDoorOpen /> Units
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/tenants" style={linkStyle}>
              <FaUsers /> Tenants
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/leases" style={linkStyle}>
              <FaFileContract /> Leases
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/payments" style={linkStyle}>
              <FaMoneyBillWave /> Payments
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/maintenance" style={linkStyle}>
              <FaTools /> Maintenance
            </Link>
          </li>

          <li style={{ margin: "20px 0" }}>
            <Link to="/reports" style={linkStyle}>
              <FaChartBar /> Reports
            </Link>
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