import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("token/", formData);

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      alert("Login successful!");

      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      alert("Invalid username or password");
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
          style={{
            width: "100%",
            padding: "10px",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;