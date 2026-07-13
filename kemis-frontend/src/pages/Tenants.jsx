import { useEffect, useState } from "react";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotification } from "../context/NotificationContext";

function Tenants() {
  const { showNotification } = useNotification();

  const [tenants, setTenants] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    national_id: "",
    phone_number: "",
    occupation: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get("tenants/");
      setTenants(response.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const editTenant = (tenant) => {
    setEditingId(tenant.id);

    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      national_id: tenant.national_id,
      phone_number: tenant.phone_number,
      occupation: tenant.occupation || "",
      emergency_contact_name: tenant.emergency_contact_name,
      emergency_contact_phone: tenant.emergency_contact_phone,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`tenants/${editingId}/`, {
          national_id: formData.national_id,
          phone_number: formData.phone_number,
          occupation: formData.occupation,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        });

        showNotification("Tenant updated successfully!", "success");
        setEditingId(null);

      } else {
        await api.post("tenants/", formData);
        showNotification("Tenant added successfully!", "success");
      }

      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        national_id: "",
        phone_number: "",
        occupation: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });

      fetchTenants();

    } catch (error) {
      console.error("Error saving tenant:", error);
      const message = error.response?.data?.detail || "Failed to save tenant.";
      showNotification(message, "error");
    }
  };

  const deleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      await api.delete(`tenants/${tenantToDelete}/`);
      showNotification("Tenant deleted successfully!", "success");
      fetchTenants();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      const message = error.response?.data?.detail || "Failed to delete tenant.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setTenantToDelete(null);
    }
  };

  return (
    <div>
      <h1>Tenants</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <br /><br />

        <input
          type="text"
          name="national_id"
          placeholder="National ID"
          value={formData.national_id}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          value={formData.occupation}
          onChange={handleChange}
          style={{ marginLeft: "10px" }}
        />

        <br /><br />

        <input
          type="text"
          name="emergency_contact_name"
          placeholder="Emergency Contact Name"
          value={formData.emergency_contact_name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="emergency_contact_phone"
          placeholder="Emergency Contact Phone"
          value={formData.emergency_contact_phone}
          onChange={handleChange}
          required
          style={{ marginLeft: "10px" }}
        />

        <button
          type="submit"
          style={{ marginLeft: "10px" }}
        >
          {editingId ? "Update Tenant" : "Add Tenant"}
        </button>

      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>National ID</th>
            <th>Phone</th>
            <th>Occupation</th>
            <th>Emergency Cont Name</th>
            <th>Emergency Cont Phone</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.full_name}</td>
              <td>{tenant.national_id}</td>
              <td>{tenant.phone_number}</td>
              <td>{tenant.occupation}</td>
              <td>{tenant.emergency_contact_name}</td>
              <td>{tenant.emergency_contact_phone}</td>

              <td>
                <button
                  onClick={() => editTenant(tenant)}
                  style={{
                    marginRight: "10px",
                    backgroundColor: "orange",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    setTenantToDelete(tenant.id);
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
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
        onConfirm={deleteTenant}
        onCancel={() => {
          setConfirmOpen(false);
          setTenantToDelete(null);
        }}
      />
    </div>
  );
}

export default Tenants;