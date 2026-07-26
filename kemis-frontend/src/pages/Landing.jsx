import { Link } from "react-router-dom";
import { FaBuilding, FaFileInvoiceDollar, FaTools, FaMapMarkerAlt } from "react-icons/fa";
import logo from "../assets/logo.png";

const NAVY = "#0f3a5f";
const ACCENT = "#e8821e";

function Landing() {
  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 30px",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <img src={logo} alt="Kabras Estate logo" style={{ height: "44px" }} />

          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: NAVY }}>
              KABRAS ESTATE
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>KEMIS</div>
          </div>
        </div>

        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          style={{
            background: ACCENT,
            color: "white",
            padding: "8px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
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
          padding: "50px 20px",
        }}
      >
        <img src={logo} alt="Kabras Estate logo" style={{ height: "130px", marginBottom: "20px" }} />

        <h1 style={{ fontSize: "34px", maxWidth: "620px", margin: "0 0 12px 0", color: NAVY }}>
          Kabras Estate Management Information System
        </h1>

        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: ACCENT,
            fontWeight: "bold",
            fontSize: "15px",
            marginBottom: "16px",
          }}
        >
          <FaMapMarkerAlt /> Nyayo Tea Zone, Lurambi, Kakamega County
        </p>

        <p style={{ maxWidth: "560px", color: "#475569", fontSize: "16px", marginBottom: "30px" }}>
          Kabras Estate is a residential estate with business premises. This
          system is a single place to manage its estates, units, tenants,
          leases, rent payments and maintenance requests.
        </p>

        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          style={{
            background: NAVY,
            color: "white",
            padding: "12px 34px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "bold",
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
            marginTop: "55px",
            maxWidth: "700px",
          }}
        >
          <div style={{ width: "150px" }}>
            <FaBuilding size={28} color={ACCENT} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Estates & units</p>
          </div>

          <div style={{ width: "150px" }}>
            <FaFileInvoiceDollar size={28} color={ACCENT} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Leases & payments</p>
          </div>

          <div style={{ width: "150px" }}>
            <FaTools size={28} color={ACCENT} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Maintenance requests</p>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
        &copy; {new Date().getFullYear()} Kabras Estate &middot; Nyayo Tea Zone, Lurambi, Kakamega County
      </footer>
    </div>
  );
}

export default Landing;