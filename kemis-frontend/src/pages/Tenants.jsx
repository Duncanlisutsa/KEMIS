import { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
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
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState(EMPTY_FORM);

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

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Tenants</h1>

        {canManage && (
          <div className="payments-toolbar-actions">
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
              <td colSpan={canManage ? 6 : 5} style={{ textAlign: "center", padding: "15px" }}>
                {search ? "No tenants match your search." : "No tenants found."}
              </td>
            </tr>
          )}

          {paginatedTenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.full_name}</td>
              <td>{tenant.national_id}</td>
              <td>{tenant.phone_number}</td>
              <td>{tenant.emergency_contact_name}</td>
              <td>{tenant.emergency_contact_phone}</td>

              {canManage && (
                <td>
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