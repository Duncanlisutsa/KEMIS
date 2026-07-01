import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);

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
    </div>
  );
}

export default Profile;