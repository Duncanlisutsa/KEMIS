import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/ConfirmDialog";

function Estates() {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [estateToDelete, setEstateToDelete] = useState(null);

  useEffect(() => {
    fetchEstates();
  }, []);

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
  
  const handleDelete = async () => {
    if (!estateToDelete) return;

    try {
      await api.delete(`property/estates/${estateToDelete}/`);

      fetchEstates();

    } catch (error) {
      console.error("Error deleting estate:", error);
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
    if (editingId) {
      await api.put(
        `property/estates/${editingId}/`,
        formData
      );
    } else {
      await api.post("property/estates/", formData);
    }

    setFormData({
      name: "",
      location: "",
      description: "",
    });

    setEditingId(null);
    fetchEstates();

  } catch (error) {
    console.error("Error saving estate:", error);
  }
};

  if (loading) {
  return <LoadingSpinner text="Loading estates..." />;
  }

  return (
    <div>
      <h1>Estates</h1>

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

        <button
          type="submit"
          style={{ marginLeft: "10px" }}
        >
          {editingId ? "Update Estate" : "Add Estate"}
        </button>
      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {estates.map((estate) => (
        <tr key={estate.id}>
            <td>{estate.id}</td>
            <td>{estate.name}</td>
            <td>{estate.location}</td>
            <td>{estate.description}</td>
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