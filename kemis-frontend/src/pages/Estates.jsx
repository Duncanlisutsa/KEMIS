import { useContext, useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotification } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

function Estates() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const isAdmin = user?.role === "ADMIN";

  const [estates, setEstates] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    manager: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [estateToDelete, setEstateToDelete] = useState(null);

  useEffect(() => {
    fetchEstates();

    if (isAdmin) {
      fetchManagers();
    }
  }, [isAdmin]);

  const fetchEstates = async () => {
    setLoading(true);

    try {
      const response = await api.get("property/estates/");
      setEstates(response.data);
    } catch (error) {
      console.error("Error fetching estates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("accounts/managers/");
      setManagers(response.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const handleDelete = async () => {
    if (!estateToDelete) return;

    try {
      await api.delete(`property/estates/${estateToDelete}/`);
      showNotification("Estate deleted successfully!", "success");
      fetchEstates();
    } catch (error) {
      console.error("Error deleting estate:", error);
      const message = error.response?.data?.detail || "Failed to delete estate.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setEstateToDelete(null);
    }
  };

  const handleEdit = (estate) => {
    setFormData({
      name: estate.name,
      location: estate.location,
      description: estate.description,
      manager: estate.manager || "",
    });

    setEditingId(estate.id);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        manager: formData.manager || null,
      };

      if (editingId) {
        await api.put(`property/estates/${editingId}/`, payload);
        showNotification("Estate updated successfully!", "success");
      } else {
        await api.post("property/estates/", payload);
        showNotification("Estate added successfully!", "success");
      }

      setFormData({
        name: "",
        location: "",
        description: "",
        manager: "",
      });

      setEditingId(null);
      fetchEstates();

    } catch (error) {
      console.error("Error saving estate:", error);
      const message = error.response?.data?.detail || "Failed to save estate.";
      showNotification(message, "error");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading estates..." />;
  }

  return (
    <div>
      <h1>{isAdmin ? "Estates" : "My Estate"}</h1>

      {isAdmin && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
          <input
            type="text"
            name="name"
            placeholder="Estate Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ marginLeft: "10px" }}
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            style={{ marginLeft: "10px" }}
          />

          <select
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            style={{ marginLeft: "10px" }}
          >
            <option value="">No Manager Assigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            style={{ marginLeft: "10px" }}
          >
            {editingId ? "Update Estate" : "Add Estate"}
          </button>
        </form>
      )}

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Description</th>
            <th>Manager</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {estates.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: "center", padding: "15px" }}>
                {isAdmin ? "No estates found." : "You are not currently assigned to an estate."}
              </td>
            </tr>
          )}

          {estates.map((estate) => (
            <tr key={estate.id}>
              <td>{estate.id}</td>
              <td>{estate.name}</td>
              <td>{estate.location}</td>
              <td>{estate.description}</td>
              <td>{estate.manager_name || "Unassigned"}</td>

              {isAdmin && (
                <td>
                  <button onClick={() => handleEdit(estate)}>
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setEstateToDelete(estate.id);
                      setConfirmOpen(true);
                    }}
                    style={{ marginLeft: "10px" }}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Estate"
        message="Are you sure you want to delete this estate? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setEstateToDelete(null);
        }}
      />
    </div>
  );
}

export default Estates;