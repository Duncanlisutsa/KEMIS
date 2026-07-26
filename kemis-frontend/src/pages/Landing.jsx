import { Link } from "react-router-dom";
import { FaHome, FaBuilding, FaFileInvoiceDollar, FaTools } from "react-icons/fa";

const BRAND_COLOR = "#2563eb";

function Landing() {
  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 30px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "1px",
            color: BRAND_COLOR,
          }}
        >
          <FaHome /> KABRAS ESTATE
        </div>

        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          style={{
            background: BRAND_COLOR,
            color: "white",
            padding: "8px 20px",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          {isLoggedIn ? "Go to Dashboard" : "Login"}
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <h1 style={{ fontSize: "34px", maxWidth: "600px", margin: "0 0 10px 0" }}>
          Kabras Estate Management Information System
        </h1>

        <p style={{ maxWidth: "520px", color: "#475569", fontSize: "16px", marginBottom: "30px" }}>
          A single place to manage estates, units, tenants, leases, rent payments
          and maintenance requests.
        </p>

        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          style={{
            background: BRAND_COLOR,
            color: "white",
            padding: "12px 30px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          {isLoggedIn ? "Go to Dashboard" : "Login to your account"}
        </Link>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "24px",
            marginTop: "50px",
            maxWidth: "700px",
          }}
        >
          <div style={{ width: "150px" }}>
            <FaBuilding size={28} color={BRAND_COLOR} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Estates & units</p>
          </div>

          <div style={{ width: "150px" }}>
            <FaFileInvoiceDollar size={28} color={BRAND_COLOR} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Leases & payments</p>
          </div>

          <div style={{ width: "150px" }}>
            <FaTools size={28} color={BRAND_COLOR} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Maintenance requests</p>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
        &copy; {new Date().getFullYear()} Kabras Estate Management Information System
      </footer>
    </div>
  );
}

export default Landing;