import { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBell } from "react-icons/fa";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import Pagination from "../components/Pagination";
import { useNotification } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

const EMPTY_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  national_id: "",
  phone_number: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

const NOTIFICATION_TYPE_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "RENT_OVERDUE", label: "Rent Overdue" },
  { value: "LEASE_EXPIRING", label: "Lease Expiring Soon" },
  { value: "MAINTENANCE_UPDATE", label: "Maintenance Update" },
];

const EMPTY_NOTIFY_FORM = {
  notification_type: "GENERAL",
  message: "",
};

function Tenants() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [tenants, setTenants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [originalTenant, setOriginalTenant] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTargets, setNotifyTargets] = useState([]);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyForm, setNotifyForm] = useState(EMPTY_NOTIFY_FORM);

  const [selectedIds, setSelectedIds] = useState([]);

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

  const openAddModal = () => {
    setEditingId(null);
    setOriginalTenant(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (tenant) => {
    setEditingId(tenant.id);
    setOriginalTenant(tenant);

    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      national_id: tenant.national_id,
      phone_number: tenant.phone_number,
      emergency_contact_name: tenant.emergency_contact_name,
      emergency_contact_phone: tenant.emergency_contact_phone,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setOriginalTenant(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      if (editingId) {
        await api.put(`tenants/${editingId}/`, {
          username: formData.username || originalTenant?.username,
          first_name: formData.first_name || originalTenant?.first_name,
          last_name: formData.last_name || originalTenant?.last_name,
          email: formData.email || originalTenant?.email,
          national_id: formData.national_id,
          phone_number: formData.phone_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        });

        showNotification("Tenant updated successfully!", "success");
      } else {
        await api.post("tenants/", formData);
        showNotification("Tenant added successfully!", "success");
      }

      closeModal();
      fetchTenants();
    } catch (error) {
      console.error("Error saving tenant:", error);
      const data = error.response?.data;
      const firstFieldError =
        data && typeof data === "object"
          ? Object.values(data).find((v) => Array.isArray(v) && v.length)?.[0]
          : null;
      const message = firstFieldError || data?.detail || "Failed to save tenant.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // `tenantsToNotify` is always an array — a single row's "bell" click
  // passes a 1-item array, the toolbar "Notify Selected" passes many.
  const openNotifyModal = (tenantsToNotify) => {
    if (!tenantsToNotify || tenantsToNotify.length === 0) return;
    setNotifyTargets(tenantsToNotify);
    setNotifyForm(EMPTY_NOTIFY_FORM);
    setNotifyModalOpen(true);
  };

  const closeNotifyModal = () => {
    if (notifySubmitting) return;
    setNotifyModalOpen(false);
    setNotifyTargets([]);
    setNotifyForm(EMPTY_NOTIFY_FORM);
  };

  const handleNotifyChange = (e) => {
    setNotifyForm({
      ...notifyForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotifySubmit = async () => {
    if (notifyTargets.length === 0) return;
    setNotifySubmitting(true);

    try {
      const response = await api.post("notifications/send-to-tenant/", {
        tenant_ids: notifyTargets.map((t) => t.id),
        notification_type: notifyForm.notification_type,
        message: notifyForm.message,
      });

      const sentCount = response.data?.sent ?? notifyTargets.length;
      showNotification(
        sentCount === 1
          ? `Notification sent to ${notifyTargets[0].full_name}.`
          : `Notification sent to ${sentCount} tenants.`,
        "success"
      );

      // Clear the checkboxes for whichever tenants we just notified.
      const notifiedIds = new Set(notifyTargets.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !notifiedIds.has(id)));

      closeNotifyModal();
    } catch (error) {
      console.error("Error sending notification:", error);
      const data = error.response?.data;
      const firstFieldError =
        data && typeof data === "object"
          ? Object.values(data).find((v) => Array.isArray(v) && v.length)?.[0]
          : null;
      const message = firstFieldError || data?.detail || "Failed to send notification.";
      showNotification(message, "error");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const toggleSelectTenant = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;

    return tenants.filter((tenant) => {
      const haystack = [
        tenant.full_name,
        tenant.national_id,
        tenant.phone_number,
        tenant.emergency_contact_name,
        tenant.emergency_contact_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [tenants, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const tenantToDeleteObj = useMemo(
    () => tenants.find((t) => t.id === tenantToDelete),
    [tenants, tenantToDelete]
  );

  // "Select all" is scoped to the current page, matching what the
  // user can actually see and check off in one glance.
  const pageIds = paginatedTenants.map((t) => t.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  };

  const selectedTenants = useMemo(
    () => tenants.filter((t) => selectedIds.includes(t.id)),
    [tenants, selectedIds]
  );

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Tenants</h1>

        {canManage && (
          <div className="payments-toolbar-actions">
            {selectedIds.length > 0 && (
              <button
                className="btn-outline"
                onClick={() => openNotifyModal(selectedTenants)}
              >
                <FaBell /> Notify Selected ({selectedIds.length})
              </button>
            )}
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Tenant
            </button>
          </div>
        )}
      </div>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder="Search by name, national ID, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            {canManage && (
              <th style={{ width: "36px" }}>
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllOnPage}
                  title="Select all on this page"
                />
              </th>
            )}
            <th>Full Name</th>
            <th>National ID</th>
            <th>Phone</th>
            <th>Emergency Contact Name</th>
            <th>Emergency Contact Phone</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {filteredTenants.length === 0 && (
            <tr>
              <td colSpan={canManage ? 7 : 5} style={{ textAlign: "center", padding: "15px" }}>
                {search ? "No tenants match your search." : "No tenants found."}
              </td>
            </tr>
          )}

          {paginatedTenants.map((tenant) => (
            <tr key={tenant.id}>
              {canManage && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tenant.id)}
                    onChange={() => toggleSelectTenant(tenant.id)}
                  />
                </td>
              )}
              <td>{tenant.full_name}</td>
              <td>{tenant.national_id}</td>
              <td>{tenant.phone_number}</td>
              <td>{tenant.emergency_contact_name}</td>
              <td>{tenant.emergency_contact_phone}</td>

              {canManage && (
                <td>
                  <button
                    className="icon-btn"
                    title="Send notification"
                    onClick={() => openNotifyModal([tenant])}
                  >
                    <FaBell />
                  </button>

                  <button
                    className="icon-btn edit"
                    title="Edit tenant"
                    onClick={() => openEditModal(tenant)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete"
                    title="Delete tenant"
                    onClick={() => {
                      setTenantToDelete(tenant.id);
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTenants.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Update Tenant" : "Add Tenant"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        fields={[
          {
            name: "username",
            label: "Username",
            required: !editingId,
            placeholder: editingId ? originalTenant?.username : undefined,
            helperText: editingId ? "Leave blank to keep the current username" : undefined,
          },
          {
            name: "first_name",
            label: "First Name",
            required: !editingId,
            placeholder: editingId ? originalTenant?.first_name : undefined,
          },
          {
            name: "last_name",
            label: "Last Name",
            required: !editingId,
            placeholder: editingId ? originalTenant?.last_name : undefined,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            required: !editingId,
            placeholder: editingId ? originalTenant?.email : undefined,
          },
          ...(!editingId
            ? [
                {
                  name: "password",
                  label: "Set Login Password",
                  type: "password",
                  required: true,
                  helperText: "Minimum 6 characters",
                },
              ]
            : []),
          { name: "national_id", label: "National ID", required: true },
          { name: "phone_number", label: "Phone Number", required: true },
          {
            name: "emergency_contact_name",
            label: "Emergency Contact Name",
            required: true,
          },
          {
            name: "emergency_contact_phone",
            label: "Emergency Contact Phone",
            required: true,
          },
        ]}
      />

      <FormModal
        open={notifyModalOpen}
        onClose={closeNotifyModal}
        title={
          notifyTargets.length === 1
            ? `Notify ${notifyTargets[0].full_name}`
            : `Notify ${notifyTargets.length} Tenants`
        }
        submitLabel="Send"
        submitting={notifySubmitting}
        formData={notifyForm}
        onChange={handleNotifyChange}
        onSubmit={handleNotifySubmit}
        maxWidth="xs"
        fields={[
          {
            name: "notification_type",
            label: "Notification Type",
            type: "select",
            options: NOTIFICATION_TYPE_OPTIONS,
            fullWidth: true,
          },
          {
            name: "message",
            label: "Message",
            type: "textarea",
            required: true,
            fullWidth: true,
            helperText: "This will appear in each tenant's notification bell.",
          },
        ]}
        infoPanel={
          notifyTargets.length > 1 ? (
            <div>
              <strong style={{ display: "block", marginBottom: "8px" }}>
                Recipients ({notifyTargets.length})
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {notifyTargets.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: "var(--border)",
                      fontSize: "13px",
                    }}
                  >
                    {t.full_name}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Tenant"
        message={
          tenantToDeleteObj
            ? `Are you sure you want to delete "${tenantToDeleteObj.full_name}"? This action cannot be undone.`
            : "Are you sure you want to delete this tenant? This action cannot be undone."
        }
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