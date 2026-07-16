import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaHome } from "react-icons/fa";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import DotCircleSpinner from "../components/DotCircleSpinner";

const BRAND_COLOR = "#2563eb";

function Login() {
  const navigate = useNavigate();
  const { loadUser } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      navigate("/dashboard");
      return;
    }

    setCheckingSession(false);
  }, [navigate]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await api.post("token/", formData);

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      await loadUser();

      showNotification("Login successful!", "success");

      navigate("/dashboard");
    } catch (error) {
      if (error.response?.status === 401) {
        showNotification("Invalid username or password.", "error");
      } else if (!error.response) {
        showNotification(
          "Unable to connect to the server. Please check your internet connection.",
          "error"
        );
      } else {
        showNotification("Login failed. Please try again.", "error");
      }

      console.log(error);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <DotCircleSpinner label="Loading..." />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "320px",
          padding: "30px",
          boxShadow: "0 0 10px #ccc",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "20px",
              letterSpacing: "1px",
              margin: 0,
              color: BRAND_COLOR,
            }}
          >
            <FaHome /> KABRAS ESTATE
          </h1>

          <h2 style={{ margin: "6px 0 0 0" }}>Login</h2>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            <DotCircleSpinner label="Logging in..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{ width: "100%", marginBottom: "15px" }}
            />

            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: "15px",
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  paddingRight: "35px",
                  boxSizing: "border-box",
                }}
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Login
            </button>

            <p style={{ marginTop: "15px", fontSize: "14px", textAlign: "center" }}>
              <Link to="/forgot-password" style={{ color: BRAND_COLOR }}>
                Forgot password?
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;