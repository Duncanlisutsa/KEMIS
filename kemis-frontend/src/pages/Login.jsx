import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

function Login() {
  const navigate = useNavigate();
  const { loadUser } = useContext(AuthContext);
  const { showNotification } = useNotification();

  useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (token) {
    navigate("/dashboard");
  }
}, [navigate]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

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
        <h2>Login</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: "15px" }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;