import { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import api from "../services/api";
import { useNotification } from "../context/NotificationContext";
import UnitDropdown from "../components/UnitDropdown";
import Pagination from "../components/Pagination";
import FormModal from "../components/FormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { AuthContext } from "../context/AuthContext";

const EMPTY_FORM = {
  tenant: "",
  unit: "",
  start_date: "",
  end_date: "",
  open_ended: false,
  monthly_rent: "",
  security_deposit: "",
  status: "ACTIVE",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "TERMINATED", label: "Terminated" },
];

// Mirrors the backend's Lease.duration_months property (dateutil's
// relativedelta, rounded up for any partial trailing month) so the
// admin sees the same figure in the modal that the API will return
// once the lease is saved. For open-ended leases (no end date), the
// backend measures elapsed time up to today - this does the same.
function estimateDurationMonths(startStr, endStr, openEnded) {
  if (!startStr) return null;

  const effectiveEndStr = openEnded ? new Date().toISOString().slice(0, 10) : endStr;
  if (!effectiveEndStr) return null;

  const start = new Date(startStr);
  const end = new Date(effectiveEndStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let totalMonths = years * 12 + months;
  if (days > 0) totalMonths += 1;

  return Math.max(totalMonths, 1);
}

function formatDuration(months) {
  if (!months) return null;
  const years = Math.floor(months / 12);
  const remainder = months % 12;

  const parts = [];
  if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (remainder) parts.push(`${remainder} month${remainder > 1 ? "s" : ""}`);

  return parts.join(", ") || "Less than a month";
}

function Leases() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaseToDelete, setLeaseToDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState(EMPTY_FORM);

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
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "tenant") {
      const tenant = tenants.find((t) => t.id === Number(value));
      setSelectedTenant(tenant || null);
    }
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    setSelectedUnit(unit || null);

    setFormData((prev) => ({
      ...prev,
      unit: unitId,
      monthly_rent: unit ? unit.rent_amount : prev.monthly_rent,
      security_deposit: unit ? unit.rent_amount : prev.security_deposit,
    }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSelectedTenant(null);
    setSelectedUnit(null);
    setModalOpen(true);
  };

  const openEditModal = (lease) => {
    setFormData({
      tenant: lease.tenant,
      unit: lease.unit,
      start_date: lease.start_date,
      end_date: lease.end_date || "",
      open_ended: !lease.end_date,
      monthly_rent: lease.monthly_rent,
      security_deposit: lease.security_deposit,
      status: lease.status,
    });

    const tenant = tenants.find((t) => t.id === lease.tenant);
    setSelectedTenant(tenant || null);

    const unit = units.find((u) => u.id === lease.unit);
    setSelectedUnit(unit || null);

    setEditingId(lease.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSelectedTenant(null);
    setSelectedUnit(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const { open_ended, ...rest } = formData;
      const payload = {
        ...rest,
        end_date: open_ended ? null : formData.end_date,
      };

      if (editingId) {
        await api.put(`leases/${editingId}/`, payload);
        showNotification("Lease updated successfully!", "success");
      } else {
        await api.post("leases/", payload);
        showNotification("Lease added successfully!", "success");
      }

      closeModal();
      fetchLeases();
    } catch (error) {
      console.error("Error saving lease:", error);

      const message =
        error.response?.data?.detail ||
        error.response?.data?.unit?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save lease.";

      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLease = async () => {
    if (!leaseToDelete) return;

    try {
      await api.delete(`leases/${leaseToDelete.id}/`);
      showNotification("Lease deleted successfully!", "success");
      fetchLeases();
    } catch (error) {
      console.error("Error deleting lease:", error);
      const message = error.response?.data?.detail || "Failed to delete lease.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setLeaseToDelete(null);
    }
  };

  const filteredLeases = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leases;

    return leases.filter((lease) => {
      const haystack = [
        lease.tenant_name,
        lease.unit_number,
        lease.start_date,
        lease.end_date,
        lease.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [leases, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredLeases.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedLeases = filteredLeases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.full_name }));

  const estimatedMonths = estimateDurationMonths(
    formData.start_date,
    formData.end_date,
    formData.open_ended
  );
  const durationLabel = formatDuration(estimatedMonths);

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Leases</h1>

        {canManage && (
          <div className="payments-toolbar-actions">
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Lease
            </button>
          </div>
        )}
      </div>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder="Search by tenant, unit, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
            {canManage && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {filteredLeases.length === 0 && (
            <tr>
              <td colSpan={canManage ? 8 : 7} style={{ textAlign: "center", padding: "15px" }}>
                {search ? "No leases match your search." : "No leases found."}
              </td>
            </tr>
          )}

          {paginatedLeases.map((lease) => (
            <tr key={lease.id}>
              <td>{lease.tenant_name}</td>
              <td>{lease.unit_number}</td>
              <td>{lease.start_date}</td>
              <td>{lease.end_date || "Open-ended"}</td>
              <td>KES {lease.monthly_rent}</td>
              <td>KES {lease.security_deposit}</td>
              <td>{lease.status}</td>

              {canManage && (
                <td>
                  <button
                    className="icon-btn edit"
                    title="Edit lease"
                    onClick={() => openEditModal(lease)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete lease"
                    onClick={() => {
                      setLeaseToDelete(lease);
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
        totalItems={filteredLeases.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Update Lease" : "Add Lease"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        infoPanel={
          (selectedTenant || selectedUnit || durationLabel || formData.open_ended) && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {selectedTenant && (
                  <div>
                    <strong style={{ display: "block", marginBottom: "6px" }}>
                      Tenant Information
                    </strong>
                    <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                      <div>Name: {selectedTenant.full_name}</div>
                      <div>Phone: {selectedTenant.phone_number}</div>
                      <div>ID Number: {selectedTenant.national_id}</div>
                      <div>Email: {selectedTenant.user_email}</div>
                    </div>
                  </div>
                )}

                {selectedUnit && (
                  <div>
                    <strong style={{ display: "block", marginBottom: "6px" }}>
                      Unit Information
                    </strong>
                    <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                      <div>Estate: {selectedUnit.estate_name}</div>
                      <div>Unit Number: {selectedUnit.unit_number}</div>
                      <div>Unit Type: {selectedUnit.unit_type}</div>
                      <div>Rent: KES {selectedUnit.rent_amount}</div>
                      <div>Status: {selectedUnit.status}</div>
                    </div>
                  </div>
                )}
              </div>

              {(durationLabel || formData.open_ended) && (
                <div
                  style={{
                    marginTop: (selectedTenant || selectedUnit) ? "14px" : 0,
                    paddingTop: (selectedTenant || selectedUnit) ? "14px" : 0,
                    borderTop: (selectedTenant || selectedUnit) ? "1px solid var(--border)" : "none",
                    fontSize: "14px",
                  }}
                >
                  <strong>Lease Period:</strong> {formData.start_date}
                  {" "}&rarr;{" "}
                  {formData.open_ended ? "Open-ended (no fixed end date)" : formData.end_date}
                  {durationLabel && (
                    <>
                      {" "}&mdash; approximately <strong>{durationLabel}</strong>
                      {estimatedMonths
                        ? ` (${estimatedMonths} month${estimatedMonths > 1 ? "s" : ""} of rent${
                            formData.open_ended ? " so far" : ""
                          })`
                        : ""}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        }
        fields={[
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
              <UnitDropdown units={units} value={formData.unit} onChange={handleUnitChange} />
            ),
          },
          { name: "section-lease-period", type: "section", label: "Lease Period", fullWidth: true },
          {
            name: "start_date",
            label: "Start Date",
            type: "date",
            required: true,
          },
          ...(formData.open_ended
            ? []
            : [
                {
                  name: "end_date",
                  label: "End Date",
                  type: "date",
                  required: true,
                  min: formData.start_date || undefined,
                  helperText: durationLabel ? `≈ ${durationLabel}` : undefined,
                },
              ]),
          {
            name: "open_ended",
            label: "No fixed end date — tenant stays and pays monthly until the lease is terminated",
            type: "checkbox",
            fullWidth: true,
          },
          {
            name: "monthly_rent",
            label: "Monthly Rent",
            type: "number",
            disabled: true,
            helperText: "Set automatically from the selected unit",
          },
          {
            name: "security_deposit",
            label: "Security Deposit",
            type: "number",
            disabled: true,
            helperText: "Set automatically from the selected unit",
          },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Lease"
        message={
          leaseToDelete
            ? `Are you sure you want to delete the lease for "${leaseToDelete.tenant_name}" — ${leaseToDelete.unit_number}? This action cannot be undone.`
            : ""
        }
        onConfirm={deleteLease}
        onCancel={() => {
          setConfirmOpen(false);
          setLeaseToDelete(null);
        }}
      />
    </div>
  );
}

export default Leases;