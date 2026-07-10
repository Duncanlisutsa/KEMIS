import { useEffect, useState } from "react";
import api from "../services/api";


function Leases() {
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    start_date: "",
    end_date: "",
    monthly_rent: "",
    security_deposit: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchLeases();
    fetchTenants();
    fetchUnits();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await api.get("leases/");
      setLeases(response.data);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("tenants/");
      setTenants(response.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get("property/units/");
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedForm = {
      ...formData,
      [name]: value,
    };

    // Tenant selected
    if (name === "tenant") {
      const tenant = tenants.find(
        (t) => t.id === Number(value)
      );

      setSelectedTenant(tenant || null);
    }

    // Unit selected
    if (name === "unit") {
      const unit = units.find(
        (u) => u.id === Number(value)
      );

      setSelectedUnit(unit || null);

      if (unit) {
        updatedForm.monthly_rent = unit.rent_amount;
        updatedForm.security_deposit = unit.rent_amount;
      }
    }

    setFormData(updatedForm);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {

    if (editingId) {
      await api.put(`leases/${editingId}/`, formData);
      alert("Lease updated successfully!");
    } else {
      await api.post("leases/", formData);
      alert("Lease added successfully!");
    }

    setFormData({
      tenant: "",
      unit: "",
      start_date: "",
      end_date: "",
      monthly_rent: "",
      security_deposit: "",
      status: "ACTIVE",
    });

    setEditingId(null);
    setSelectedTenant(null);
    setSelectedUnit(null);

    fetchLeases();

  } catch (error) {
    console.error("Error saving lease:", error);

    if (error.response) {
      alert(JSON.stringify(error.response.data));
    }
  }
 };

 const editLease = (lease) => {
  setFormData({
    tenant: lease.tenant,
    unit: lease.unit,
    start_date: lease.start_date,
    end_date: lease.end_date,
    monthly_rent: lease.monthly_rent,
    security_deposit: lease.security_deposit,
    status: lease.status,
  });

  const tenant = tenants.find((t) => t.id === lease.tenant);
  setSelectedTenant(tenant || null);

  const unit = units.find((u) => u.id === lease.unit);
  setSelectedUnit(unit || null);

  setEditingId(lease.id);
 };

  const deleteLease = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lease?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`leases/${id}/`);
      fetchLeases();
    } catch (error) {
      console.error("Error deleting lease:", error);
    }
  };

  return (
    <div>
      <h1>Leases</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

        <select
          name="tenant"
          value={formData.tenant}
          onChange={handleChange}
          required
        >
          <option value="">Select Tenant</option>

          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.full_name}
            </option>
          ))}
        </select>

        <select
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        >
          <option value="">Select Unit</option>

          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unit_number}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="number"
          name="monthly_rent"
          placeholder="Monthly Rent"
          value={formData.monthly_rent}
          readOnly
          style={{
            marginLeft: "10px",
            backgroundColor: "#f3f4f6",
          }}
        />

        <input
          type="number"
          name="security_deposit"
          placeholder="Security Deposit"
          value={formData.security_deposit}
          readOnly
          style={{
            marginLeft: "10px",
            backgroundColor: "#f3f4f6",
          }}
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="TERMINATED">Terminated</option>
        </select>

        <button type="submit" style={{ marginLeft: "10px" }}>
          {editingId ? "Update Lease" : "Add Lease"}
        </button>

        {selectedTenant && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginTop: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              background: "#f8fafc",
            }}
          >
            <strong>Tenant Information</strong>

            <p>Name: {selectedTenant.full_name}</p>
            <p>Phone: {selectedTenant.phone_number}</p>
            <p>ID Number: {selectedTenant.national_id}</p>
            <p>Email: {selectedTenant.user_email}</p>
          </div>
        )}

        {selectedUnit && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginTop: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              background: "#f8fafc",
            }}
          >
            <strong>Unit Information</strong>

            <p>Estate: {selectedUnit.estate_name}</p>
            <p>Unit Number: {selectedUnit.unit_number}</p>
            <p>Unit Type: {selectedUnit.unit_type}</p>
            <p>Rent: KES {selectedUnit.rent_amount}</p>
            <p>Status: {selectedUnit.status}</p>
          </div>
        )}

      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Unit</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Monthly Rent</th>
            <th>Deposit</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {leases.map((lease) => (
            <tr key={lease.id}>
              <td>{lease.tenant_name}</td>
              <td>{lease.unit_number}</td>
              <td>{lease.start_date}</td>
              <td>{lease.end_date}</td>
              <td>KES {lease.monthly_rent}</td>
              <td>KES {lease.security_deposit}</td>
              <td>{lease.status}</td>

              <td>
                <button
                  onClick={() => editLease(lease)}
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    marginRight: "5px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteLease(lease.id)}
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

export default Leases;