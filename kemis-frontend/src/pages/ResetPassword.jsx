import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("accounts/password-reset-confirm/", {
        uid,
        token,
        new_password: newPassword,
      });

      setMessage(response.data.detail);
      setSuccess(true);

      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      if (error.response?.data) {
        const data = error.response.data;
        const firstError =
          data.new_password?.[0] ||
          data.token?.[0] ||
          data.uid?.[0] ||
          data.detail ||
          "Reset link is invalid or has expired.";
        setMessage(firstError);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
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
      <form
        onSubmit={handleSubmit}
        style={{
          width: "300px",
          padding: "30px",
          boxShadow: "0 0 10px #ccc",
          borderRadius: "10px",
        }}
      >
        <h2>Reset Password</h2>

        {!success && (
          <>
            <input
              type="password"
              name="new_password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ width: "100%", marginBottom: "15px" }}
            />

            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", marginBottom: "15px" }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "90%",
                maxWidth: "320px",
                padding: "30px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        {message && (
          <p style={{ marginTop: "15px", fontSize: "14px" }}>{message}</p>
        )}

        {!success && (
          <p style={{ marginTop: "15px", fontSize: "14px" }}>
            <Link to="/login">Back to Login</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default ResetPassword;