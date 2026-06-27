import { useEffect, useState } from "react";
import api from "../services/api";

function Estates() {
  const [estates, setEstates] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    fetchEstates();
  }, []);

  const fetchEstates = async () => {
    try {
      const response = await api.get("property/estates/");
      setEstates(response.data);
    } catch (error) {
      console.error("Error fetching estates:", error);
    }
  };
  
  const handleDelete = async (id) => {
  try {
    await api.delete(`property/estates/${id}/`);
    fetchEstates();
  } catch (error) {
    console.error("Error deleting estate:", error);
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
                    onClick={() => handleDelete(estate.id)}
                    style={{ marginLeft: "10px" }}
                >
                    Delete
                </button>
            </td>
        </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Estates;