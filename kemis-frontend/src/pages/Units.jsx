import { useEffect, useState } from "react";
import api from "../services/api";

function Units() {
  const [units, setUnits] = useState([]);
  const [estates, setEstates] = useState([]);

  const [formData, setFormData] = useState({
    estate: "",
    unit_number: "",
    unit_type: "",
    rent_amount: "",
    status: "Vacant",
  });

  useEffect(() => {
    fetchUnits();
    fetchEstates();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await api.get("property/units/");
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

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
      await api.post("property/units/", formData);

      setFormData({
        estate: "",
        unit_number: "",
        unit_type: "",
        rent_amount: "",
        status: "Vacant",
      });

      fetchUnits();
    } catch (error) {
      console.error("Error adding unit:", error);
    }
  };

  const deleteUnit = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this unit?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete(`property/units/${id}/`);
    fetchUnits();
  } catch (error) {
    console.error("Error deleting unit:", error);
  }
 };

  return (
    <div>
      <h1>Units</h1>

      {/* Add Unit Form */}

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

        <select
          name="estate"
          value={formData.estate}
          onChange={handleChange}
          required
        >
          <option value="">Select Estate</option>

          {estates.map((estate) => (
            <option key={estate.id} value={estate.id}>
              {estate.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="unit_number"
          placeholder="Unit Number"
          value={formData.unit_number}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="unit_type"
          placeholder="Unit Type"
          value={formData.unit_type}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="number"
          name="rent_amount"
          placeholder="Rent Amount"
          value={formData.rent_amount}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="Vacant">Vacant</option>
          <option value="Occupied">Occupied</option>
        </select>

        <button
          type="submit"
          style={{ marginLeft: "10px" }}
        >
          Add Unit
        </button>
      </form>

      {/* Units Table */}

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Unit Number</th>
            <th>Estate</th>
            <th>Type</th>
            <th>Rent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
        {units.map((unit) => (
            <tr key={unit.id}>
            <td>{unit.unit_number}</td>
            <td>{unit.estate_name}</td>
            <td>{unit.unit_type}</td>
            <td>KES {unit.rent_amount}</td>
            <td>{unit.status}</td>

            <td>
                <button
                onClick={() => deleteUnit(unit.id)}
                style={{
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                }}
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

export default Units;