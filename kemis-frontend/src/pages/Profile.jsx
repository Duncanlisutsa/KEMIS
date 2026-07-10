import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("accounts/me/");
      setUser(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch user");
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.post("accounts/change-password/", {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      setPasswordMessage(response.data.detail);

      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      if (error.response?.data) {
        const data = error.response.data;
        const firstError =
          data.old_password?.[0] ||
          data.new_password?.[0] ||
          data.detail ||
          "Failed to change password.";
        setPasswordMessage(firstError);
      } else {
        setPasswordMessage("Something went wrong. Please try again.");
      }
      console.error(error);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>User Profile</h1>

      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>

      <hr style={{ margin: "30px 0" }} />

      <h2>Change Password</h2>

      <form
        onSubmit={handlePasswordSubmit}
        style={{ maxWidth: "300px" }}
      >
        <input
          type="password"
          name="old_password"
          placeholder="Current Password"
          value={passwordData.old_password}
          onChange={handlePasswordChange}
          required
          style={{ width: "100%", marginBottom: "15px" }}
        />

        <input
          type="password"
          name="new_password"
          placeholder="New Password"
          value={passwordData.new_password}
          onChange={handlePasswordChange}
          required
          style={{ width: "100%", marginBottom: "15px" }}
        />

        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm New Password"
          value={passwordData.confirm_password}
          onChange={handlePasswordChange}
          required
          style={{ width: "100%", marginBottom: "15px" }}
        />

        <button
          type="submit"
          disabled={passwordLoading}
          style={{
            width: "100%",
            padding: "10px",
            cursor: passwordLoading ? "not-allowed" : "pointer",
            opacity: passwordLoading ? 0.7 : 1,
          }}
        >
          {passwordLoading ? "Changing..." : "Change Password"}
        </button>

        {passwordMessage && (
          <p style={{ marginTop: "15px", fontSize: "14px" }}>{passwordMessage}</p>
        )}
      </form>
    </div>
  );
}

export default Profile;