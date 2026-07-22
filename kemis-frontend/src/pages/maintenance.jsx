import { useContext, useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import UnitDropdown from "../components/UnitDropdown";

function Maintenance() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
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

  const handleUnitChange = (unitId) => {
    setFormData((prev) => ({ ...prev, unit: unitId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = isTenant
        ? {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
          }
        : formData;

      if (editingId) {
        await api.put(`maintenance/${editingId}/`, payload);
        showNotification("Request updated successfully!", "success");
      } else {
        await api.post("maintenance/", payload);
        showNotification("Request added successfully!", "success");
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
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save request.";
      showNotification(message, "error");
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
      showNotification("Request deleted successfully!", "success");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      const message = error.response?.data?.detail || "Failed to delete request.";
      showNotification(message, "error");
    }
  };

  const toggleResolved = async (request, checked) => {
    try {
      if (checked) {
        const today = new Date().toISOString();

        await api.patch(`maintenance/${request.id}/`, {
          status: "COMPLETED",
          resolved_date: today,
        });

        showNotification("Marked as resolved.", "success");
      } else {
        await api.patch(`maintenance/${request.id}/`, {
          status: "IN_PROGRESS",
          resolved_date: null,
        });

        showNotification("Marked as not yet resolved.", "success");
      }

      fetchRequests();
    } catch (error) {
      console.error("Error updating resolved status:", error);
      showNotification("Failed to update status.", "error");
    }
  };

  const formatDateOnly = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

            <span style={{ marginLeft: "10px" }}>
              <UnitDropdown
                units={units}
                value={formData.unit}
                onChange={handleUnitChange}
              />
            </span>
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
          {editingId ? "Update Request" : "Add Request"}
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
            {!isTenant && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>

          {requests.length === 0 && (
            <tr>
              <td colSpan={isTenant ? 7 : 8} style={{ textAlign: "center", padding: "15px" }}>
                No maintenance requests found.
              </td>
            </tr>
          )}

          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.tenant_name}</td>
              <td>{request.unit_number}</td>
              <td>{request.title}</td>
              <td>{request.priority}</td>
              <td>{request.status}</td>
              <td>{formatDateOnly(request.reported_date)}</td>

              <td>
                {isTenant ? (
                  request.status === "COMPLETED" ? (
                    formatDateOnly(request.resolved_date)
                  ) : (
                    "-"
                  )
                ) : (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={request.status === "COMPLETED"}
                      onChange={(e) => toggleResolved(request, e.target.checked)}
                    />
                    {request.status === "COMPLETED"
                      ? formatDateOnly(request.resolved_date)
                      : "Not resolved"}
                  </label>
                )}
              </td>

              {!isTenant && (
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
              )}
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Maintenance;