import { useEffect, useState } from "react";
import api from "../services/api";

function Estates() {
  const [estates, setEstates] = useState([]);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("property/estates/", formData);

      setFormData({
        name: "",
        location: "",
        description: "",
      });

      fetchEstates();
    } catch (error) {
      console.error("Error adding estate:", error);
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
          Add Estate
        </button>
      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {estates.map((estate) => (
            <tr key={estate.id}>
              <td>{estate.id}</td>
              <td>{estate.name}</td>
              <td>{estate.location}</td>
              <td>{estate.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Estates;