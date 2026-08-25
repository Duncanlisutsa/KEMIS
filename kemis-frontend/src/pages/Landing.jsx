import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaFileInvoiceDollar,
  FaTools,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaDoorOpen,
  FaHome,
  FaWarehouse,
  FaStore,
  FaBed,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import api from "../services/api";

import kemis1 from "../assets/kemis1.jpg";
import kemis2 from "../assets/kemis2.jpg";
import kemis3 from "../assets/kemis3.jpg";
import kemis4 from "../assets/kemis4.jpg";
import kemis5 from "../assets/kemis5.jpg";

const NAVY = "#0f3a5f";
const ACCENT = "#e8821e";

const BACKGROUND_IMAGES = [kemis1, kemis2, kemis3, kemis4, kemis5];
const SLIDE_INTERVAL_MS = 5000;

// Mirrors Unit.UNIT_TYPES in estates/models.py — keep these in sync if
// the backend choices ever change.
const ROOM_TYPES = [
  { icon: FaDoorOpen, label: "Single Room", desc: "A compact, self-contained room — an affordable option for individuals." },
  { icon: FaBed, label: "Bedsitter", desc: "One open living/sleeping space with its own kitchenette and bathroom." },
  { icon: FaHome, label: "One Bedroom", desc: "A separate bedroom plus living area — great for small families or couples." },
  { icon: FaBuilding, label: "Two Bedroom", desc: "Extra space with two bedrooms, suited to larger families." },
  { icon: FaStore, label: "Business Premise", desc: "Commercial space for shops, offices, and other business use." },
];

function BackgroundSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % BACKGROUND_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {BACKGROUND_IMAGES.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === index ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
          }}
        />
      ))}
      {/* Dark overlay so white text stays readable over any photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 58, 95, 0.55)",
        }}
      />
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [feedback, setFeedback] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setFeedback("");

    try {
      const response = await api.post("accounts/contact/", form);
      setStatus("sent");
      setFeedback(response.data.detail);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setStatus("error");
      const detail =
        error?.response?.data?.message?.[0] ||
        error?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      setFeedback(detail);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "480px", width: "100%" }}>
      <input
        type="text"
        name="name"
        placeholder="Your name"
        value={form.name}
        onChange={handleChange}
        required
        style={inputStyle}
      />
      <input
        type="email"
        name="email"
        placeholder="Your email"
        value={form.email}
        onChange={handleChange}
        required
        style={inputStyle}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone number (optional)"
        value={form.phone}
        onChange={handleChange}
        style={inputStyle}
      />
      <textarea
        name="message"
        placeholder="Your message"
        value={form.message}
        onChange={handleChange}
        required
        rows={4}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          background: ACCENT,
          color: "white",
          border: "none",
          padding: "12px 28px",
          borderRadius: "8px",
          fontWeight: "bold",
          fontSize: "15px",
          cursor: status === "sending" ? "not-allowed" : "pointer",
          opacity: status === "sending" ? 0.7 : 1,
        }}
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>

      {feedback && (
        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: status === "error" ? "#dc2626" : "#16a34a",
          }}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}

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
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

      {/* HERO with fading background slideshow */}
      <main
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 20px",
          color: "white",
          overflow: "hidden",
        }}
      >
        <BackgroundSlideshow />

        <div style={{ position: "relative", zIndex: 1 }}>
          <img src={logo} alt="Kabras Estate logo" style={{ height: "110px", marginBottom: "20px" }} />

          <h1 style={{ fontSize: "34px", maxWidth: "620px", margin: "0 0 12px 0" }}>
            Kabras Estate Management Information System
          </h1>

          <p
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "#fbbf24",
              fontWeight: "bold",
              fontSize: "15px",
              marginBottom: "16px",
            }}
          >
            <FaMapMarkerAlt /> Nyayo Tea Zone, Lurambi, Kakamega County
          </p>

          <p style={{ maxWidth: "560px", color: "#e2e8f0", fontSize: "16px", marginBottom: "30px" }}>
            Kabras Estate is a residential estate with business premises. This
            system is a single place to manage its estates, units, tenants,
            leases, rent payments and maintenance requests.
          </p>

          <Link
            to={isLoggedIn ? "/dashboard" : "/login"}
            style={{
              background: ACCENT,
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
        </div>
      </main>

      {/* WHAT KEMIS DOES */}
      <section style={{ padding: "50px 20px", background: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "24px",
            maxWidth: "700px",
            margin: "0 auto",
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

          <div style={{ width: "150px" }}>
            <FaWarehouse size={28} color={ACCENT} />
            <p style={{ fontSize: "14px", color: "#475569" }}>Business premises</p>
          </div>
        </div>
      </section>

      {/* ROOM TYPES */}
      <section style={{ padding: "50px 20px", background: "white" }}>
        <h2 style={{ textAlign: "center", color: NAVY, fontSize: "26px", marginBottom: "36px" }}>
          Types of Rooms Available
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "24px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {ROOM_TYPES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              style={{
                width: "220px",
                padding: "22px 18px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <Icon size={26} color={ACCENT} style={{ marginBottom: "10px" }} />
              <h3 style={{ fontSize: "16px", color: NAVY, margin: "0 0 8px 0" }}>{label}</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "28px" }}>
          For current vacancies and rates, reach out using the contact details below.
        </p>
      </section>

      {/* CONTACT */}
      <section style={{ padding: "50px 20px", background: "#f1f5f9" }}>
        <h2 style={{ textAlign: "center", color: NAVY, fontSize: "26px", marginBottom: "8px" }}>
          Get in Touch
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "14px", marginBottom: "36px" }}>
          Have a question about a unit or want to schedule a viewing? Reach out any of these ways.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "50px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div style={{ minWidth: "220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <FaPhoneAlt color={ACCENT} />
              <a href="tel:0790239586" style={{ color: NAVY, fontWeight: "bold", textDecoration: "none" }}>
                0790 239 586
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <FaEnvelope color={ACCENT} />
              <a
                href="mailto:kabras.estatekk@gmail.com"
                style={{ color: NAVY, fontWeight: "bold", textDecoration: "none" }}
              >
                kabras.estatekk@gmail.com
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FaMapMarkerAlt color={ACCENT} />
              <span style={{ color: "#475569" }}>Nyayo Tea Zone, Lurambi, Kakamega County</span>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
        &copy; {new Date().getFullYear()} Kabras Estate &middot; Nyayo Tea Zone, Lurambi, Kakamega County
      </footer>
    </div>
  );
}

export default Landing;