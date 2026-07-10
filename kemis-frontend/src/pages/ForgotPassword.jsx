import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("accounts/password-reset/", { email });
      setMessage(response.data.detail);
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
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
        <h2>Forgot Password</h2>

        <p style={{ fontSize: "14px", color: "#555" }}>
          Enter your account email and we'll send you a reset link.
        </p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "15px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p style={{ marginTop: "15px", fontSize: "14px" }}>{message}</p>
        )}

        <p style={{ marginTop: "15px", fontSize: "14px" }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;