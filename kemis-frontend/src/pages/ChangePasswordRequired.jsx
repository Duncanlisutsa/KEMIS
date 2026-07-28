import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../assets/logo.png";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import DotCircleSpinner from "../components/DotCircleSpinner";

const BRAND_COLOR = "#2563eb";

function ChangePasswordRequired() {
  const navigate = useNavigate();
  const { user, loadUser, setUser } = useContext(AuthContext);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.new_password !== formData.confirm_password) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("accounts/change-password/", {
        old_password: formData.old_password,
        new_password: formData.new_password,
      });

      await loadUser();

      showNotification("Password set. Welcome to KEMIS!", "success");

      navigate("/dashboard");
    } catch (error) {
      const data = error.response?.data;

      const firstError =
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.detail ||
        "Failed to change password. Please try again.";

      setErrorMessage(firstError);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "360px",
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
          <img
            src={logo}
            alt="Kabras Estate logo"
            style={{ height: "60px", marginBottom: "8px" }}
          />

          <h1
            style={{
              fontSize: "20px",
              letterSpacing: "1px",
              margin: 0,
              color: BRAND_COLOR,
            }}
          >
            KABRAS ESTATE
          </h1>

          <h2 style={{ margin: "6px 0 0 0", textAlign: "center" }}>
            Set Your Password
          </h2>
        </div>

        <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px" }}>
          {user?.first_name ? `Welcome, ${user.first_name}. ` : "Welcome. "}
          This is your first time signing in, so please set a password only
          you know before continuing into KEMIS.
        </p>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            <DotCircleSpinner label="Saving..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type={showPassword ? "text" : "password"}
              name="old_password"
              placeholder="Temporary password (given by admin)"
              value={formData.old_password}
              onChange={handleChange}
              required
              style={{ width: "100%", marginBottom: "15px" }}
            />

            <input
              type={showPassword ? "text" : "password"}
              name="new_password"
              placeholder="New password"
              value={formData.new_password}
              onChange={handleChange}
              required
              minLength={8}
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
                name="confirm_password"
                placeholder="Confirm new password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength={8}
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
              Set Password &amp; Continue
            </button>

            {errorMessage && (
              <p
                style={{
                  marginTop: "15px",
                  fontSize: "14px",
                  color: "#b91c1c",
                }}
              >
                {errorMessage}
              </p>
            )}

            <p style={{ marginTop: "15px", fontSize: "13px", textAlign: "center" }}>
              Not you?{" "}
              <span
                onClick={handleLogout}
                style={{
                  color: BRAND_COLOR,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Log out
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordRequired;