import { useContext, useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import UnitDropdown from "../components/UnitDropdown";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY_FORM = {
  tenant: "",
  unit: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "PENDING",
  resolved_date: "",
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

function Maintenance() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const isTenant = user?.role === "TENANT";
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [ownLease, setOwnLease] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchRequests();

    if (isTenant) {
      fetchOwnLease();
    } else if (canManage) {
      fetchTenants();
      fetchUnits();
    }
  }, [isTenant, canManage]);

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

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (request) => {
    setFormData({
      tenant: request.tenant,
      unit: request.unit,
      title: request.title,
      description: request.description,
      priority: request.priority,
      status: request.status,
      resolved_date: request.resolved_date ? request.resolved_date.slice(0, 10) : "",
    });

    setEditingId(request.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

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

      closeModal();
      fetchRequests();
    } catch (error) {
      console.error("Error saving request:", error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save request.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      await api.delete(`maintenance/${requestToDelete.id}/`);
      showNotification("Request deleted successfully!", "success");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      const message = error.response?.data?.detail || "Failed to delete request.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setRequestToDelete(null);
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

  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.full_name }));

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Maintenance Requests</h1>

        {(isTenant || canManage) && (
          <div className="payments-toolbar-actions">
            <button
              className="btn-primary"
              onClick={openAddModal}
              disabled={isTenant && !ownLease}
              title={isTenant && !ownLease ? "No active lease found." : undefined}
            >
              <FaPlus /> New Request
            </button>
          </div>
        )}
      </div>

      {isTenant && !ownLease && (
        <p style={{ color: "#b91c1c", marginTop: "-6px" }}>
          No active lease found. You can't file a request.
        </p>
      )}

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
            {canManage && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {requests.length === 0 && (
            <tr>
              <td colSpan={canManage ? 8 : 7} style={{ textAlign: "center", padding: "15px" }}>
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
                {canManage ? (
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
                ) : request.status === "COMPLETED" ? (
                  formatDateOnly(request.resolved_date)
                ) : (
                  "-"
                )}
              </td>

              {canManage && (
                <td>
                  <button
                    className="icon-btn edit"
                    title="Edit request"
                    onClick={() => openEditModal(request)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete"
                    title="Delete request"
                    onClick={() => {
                      setRequestToDelete(request);
                      setConfirmOpen(true);
                    }}
                  >
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Update Maintenance Request" : "New Maintenance Request"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        infoPanel={
          isTenant ? (
            <>
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
            </>
          ) : undefined
        }
        fields={[
          ...(!isTenant
            ? [
                {
                  name: "tenant",
                  label: "Tenant",
                  type: "select",
                  required: true,
                  placeholder: "Select Tenant",
                  options: tenantOptions,
                },
                {
                  name: "unit",
                  label: "Unit",
                  type: "custom",
                  render: () => (
                    <UnitDropdown
                      units={units}
                      value={formData.unit}
                      onChange={handleUnitChange}
                    />
                  ),
                },
              ]
            : []),
          { name: "title", label: "Issue Title", required: true, fullWidth: true },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            required: true,
            fullWidth: true,
          },
          { name: "priority", label: "Priority", type: "select", options: PRIORITY_OPTIONS },
          ...(!isTenant
            ? [
                { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
                { name: "resolved_date", label: "Resolved Date", type: "date" },
              ]
            : []),
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Request"
        message={
          requestToDelete
            ? `Are you sure you want to delete "${requestToDelete.title}"? This action cannot be undone.`
            : ""
        }
        onConfirm={deleteRequest}
        onCancel={() => {
          setConfirmOpen(false);
          setRequestToDelete(null);
        }}
      />
    </div>
  );
}

export default Maintenance;