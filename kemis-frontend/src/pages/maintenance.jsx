import { useContext, useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Maintenance() {
  const { user } = useContext(AuthContext);
  const isTenant = user?.role === "TENANT";

  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [ownLease, setOwnLease] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    resolved_date: "",
  });

  useEffect(() => {
    fetchRequests();

    if (isTenant) {
      fetchOwnLease();
    } else {
      fetchTenants();
      fetchUnits();
    }
  }, [isTenant]);

  const fetchRequests = async () => {
    try {
      const response = await api.get("maintenance/");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
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

  const fetchOwnLease = async () => {
    try {
      const response = await api.get("leases/");
      const active = response.data.find((l) => l.status === "ACTIVE");
      setOwnLease(active || null);
    } catch (error) {
      console.error("Error fetching your lease:", error);
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
      // Tenants never send tenant/unit/status — backend fills these in
      const payload = isTenant
        ? {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
          }
        : formData;

      if (editingId) {
        await api.put(`maintenance/${editingId}/`, payload);
        alert("Request updated successfully!");
      } else {
        await api.post("maintenance/", payload);
        alert("Request added successfully!");
      }

      setFormData({
        tenant: "",
        unit: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        resolved_date: "",
      });

      setEditingId(null);
      fetchRequests();

    } catch (error) {
      console.error("Error saving request:", error);

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      }
    }
  };

  const editRequest = (request) => {
    setFormData({
      tenant: request.tenant,
      unit: request.unit,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      resolved_date: request.resolved_date
        ? request.resolved_date.slice(0, 10)
        : "",
    });

    setEditingId(request.id);
  };

  const deleteRequest = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this request?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`maintenance/${id}/`);
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  return (
    <div>

      <h1>Maintenance Requests</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

        {isTenant ? (
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              background: "#f8fafc",
              maxWidth: "300px",
            }}
          >
            <strong>Filing for:</strong>
            {ownLease ? (
              <p style={{ margin: "5px 0 0 0" }}>
                {ownLease.unit_number} &mdash; {ownLease.tenant_name}
              </p>
            ) : (
              <p style={{ margin: "5px 0 0 0", color: "#b91c1c" }}>
                No active lease found. You can't file a request.
              </p>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}

        <input
          type="text"
          name="title"
          placeholder="Issue Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ marginLeft: isTenant ? "0" : "10px", marginTop: isTenant ? "10px" : "0" }}
        />

        <br /><br />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="3"
          cols="50"
        />

        <br /><br />

        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {!isTenant && (
          <>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <input
              type="date"
              name="resolved_date"
              value={formData.resolved_date}
              onChange={handleChange}
              style={{ marginLeft: "10px" }}
            />
          </>
        )}

        <button
          type="submit"
          disabled={isTenant && !ownLease}
          style={{ marginLeft: "10px" }}
        >
          {editingId
            ? "Update Request"
            : "Add Request"}
        </button>

      </form>

      <table border="1" cellPadding="10" width="100%">

        <thead>
          <tr>
            <th>Tenant</th>
            <th>Unit</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Reported</th>
            <th>Resolved</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.tenant_name}</td>
              <td>{request.unit_number}</td>
              <td>{request.title}</td>
              <td>{request.priority}</td>
              <td>{request.status}</td>
              <td>{request.reported_date}</td>
              <td>{request.resolved_date || "-"}</td>

              <td>

                <button
                  onClick={() => editRequest(request)}
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
                  onClick={() => deleteRequest(request.id)}
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

export default Maintenance;