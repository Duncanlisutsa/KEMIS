import { useEffect, useState } from "react";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotification } from "../context/NotificationContext";


function Units() {
  const { showNotification } = useNotification();

  const [units, setUnits] = useState([]);
  const [estates, setEstates] = useState([]);

  const [formData, setFormData] = useState({
    estate: "",
    unit_number: "",
    unit_type: "",
    rent_amount: "",
    status: "VACANT",
  });

  const [editingId, setEditingId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);

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
      if (editingId) {
        await api.put(`property/units/${editingId}/`, {
          ...formData,
          rent_amount: Number(formData.rent_amount),
        });

        showNotification("Unit updated successfully!", "success");

      } else {
        await api.post("property/units/", {
          ...formData,
          rent_amount: Number(formData.rent_amount),
        });

        showNotification("Unit added successfully!", "success");
      }

      setFormData({
        estate: "",
        unit_number: "",
        unit_type: "",
        rent_amount: "",
        status: "VACANT",
      });

      fetchUnits();
      setEditingId(null);

    } catch (error) {
      console.error("Error saving unit:", error);

      const message =
        error.response?.data?.unit_number?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save unit.";

      showNotification(message, "error");
    }
  };

  const editUnit = (unit) => {
    if (unit.status === "OCCUPIED") {
      showNotification(
        "This unit has an active lease. End or terminate the lease before changing the unit status.",
        "error"
      );
      return;
    }
    setEditingId(unit.id);

    setFormData({
      estate: unit.estate,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      rent_amount: unit.rent_amount,
      status: unit.status,
    });
  };

  const deleteUnit = async () => {
    try {
      await api.delete(`property/units/${unitToDelete.id}/`);

      fetchUnits();

      setConfirmOpen(false);
      setUnitToDelete(null);

      showNotification("Unit deleted successfully!", "success");

    } catch (error) {
      console.error("Error deleting unit:", error);
      const message = error.response?.data?.detail || "Failed to delete unit.";
      showNotification(message, "error");
      setConfirmOpen(false);
      setUnitToDelete(null);
    }
  };

  return (
    <div>
      <h1>Units</h1>

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

        <select
          name="unit_type"
          value={formData.unit_type}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        >
          <option value="">Select Unit Type</option>
          <option value="SINGLE">Single Room</option>
          <option value="BEDSITTER">Bedsitter</option>
          <option value="ONE_BEDROOM">One Bedroom</option>
          <option value="TWO_BEDROOM">Two Bedroom</option>
          <option value="BUSINESS">Business Premise</option>
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
          <option value="VACANT">Vacant</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Under Maintenance</option>
        </select>

        <button
          type="submit"
          style={{ marginLeft: "10px" }}
        >
          {editingId ? "Update Unit" : "Add Unit"}
        </button>
      </form>

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
              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "15px",
                    color: "white",
                    backgroundColor:
                      unit.status === "OCCUPIED"
                        ? "#16a34a"
                        : unit.status === "VACANT"
                        ? "#2563eb"
                        : unit.status === "RESERVED"
                        ? "#f59e0b"
                        : "#dc2626",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {unit.status}
                </span>
              </td>

              <td>
                <button
                  onClick={() => editUnit(unit)}
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    marginRight: "5px",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setUnitToDelete(unit);
                    setConfirmOpen(true);
                  }}
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
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Unit"
        message={
          unitToDelete
            ? `Are you sure you want to delete Unit "${unitToDelete.unit_number}"? This action cannot be undone.`
            : ""
        }
        onConfirm={deleteUnit}
        onCancel={() => {
          setConfirmOpen(false);
          setUnitToDelete(null);
        }}
      />
    </div>
  );
}

export default Units;