import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loadUser } = useContext(AuthContext);

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

  console.log("Sending:", formData);

  try {
    const response = await api.post("token/", formData);

    console.log("SUCCESS:", response.data);

    localStorage.setItem(
  "access_token",
  response.data.access
);

localStorage.setItem(
  "refresh_token",
  response.data.refresh
);

// Load the logged-in user's details
await loadUser();

alert("Login successful!");

navigate("/dashboard");
  } catch (error) {
    console.log("ERROR STATUS:", error.response?.status);
    console.log("ERROR DATA:", error.response?.data);
    console.log("REQUEST DATA:", formData);
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