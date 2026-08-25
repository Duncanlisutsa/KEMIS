import { useContext, useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import Pagination from "../components/Pagination";
import { useNotification } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

const EMPTY_FORM = {
  estate: "",
  unit_number: "",
  unit_type: "",
  rent_amount: "",
  status: "VACANT",
  electricity_token_number: "",
};

const UNIT_TYPE_OPTIONS = [
  { value: "SINGLE", label: "Single Room" },
  { value: "BEDSITTER", label: "Bedsitter" },
  { value: "ONE_BEDROOM", label: "One Bedroom" },
  { value: "TWO_BEDROOM", label: "Two Bedroom" },
  { value: "BUSINESS", label: "Business Premise" },
];

const STATUS_OPTIONS = [
  { value: "VACANT", label: "Vacant" },
  { value: "RESERVED", label: "Reserved" },
  { value: "MAINTENANCE", label: "Under Maintenance" },
];

function Units() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [units, setUnits] = useState([]);
  const [estates, setEstates] = useState([]);
  const [estateFilter, setEstateFilter] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingId(unit.id);

    setFormData({
      estate: unit.estate,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type,
      rent_amount: unit.rent_amount,
      status: unit.status,
      electricity_token_number: unit.electricity_token_number || "",
    });

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

      closeModal();
      fetchUnits();
    } catch (error) {
      console.error("Error saving unit:", error);

      const message =
        error.response?.data?.unit_number?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        "Failed to save unit.";

      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUnit = async () => {
    try {
      await api.delete(`property/units/${unitToDelete.id}/`);

      fetchUnits();
      showNotification("Unit deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting unit:", error);
      const message = error.response?.data?.detail || "Failed to delete unit.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setUnitToDelete(null);
    }
  };

  // Always sorted by Estate first, then Unit Number, so units
  // from the same estate stay grouped together regardless of
  // creation order or which page you're on.
  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      const estateCompare = (a.estate_name || "").localeCompare(b.estate_name || "");
      if (estateCompare !== 0) return estateCompare;
      return (a.unit_number || "").localeCompare(b.unit_number || "", undefined, {
        numeric: true,
      });
    });
  }, [units]);

  const estateFilteredUnits = estateFilter
    ? sortedUnits.filter((u) => u.estate === Number(estateFilter))
    : sortedUnits;

  const query = search.trim().toLowerCase();
  const visibleUnits = query
    ? estateFilteredUnits.filter((u) => {
        const haystack = [u.estate_name, u.unit_number, u.unit_type, u.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : estateFilteredUnits;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, estateFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleUnits.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedUnits = visibleUnits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const estateOptions = useMemo(
    () => estates.map((estate) => ({ value: estate.id, label: estate.name })),
    [estates]
  );

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Units</h1>

        {canManage && (
          <div className="payments-toolbar-actions">
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Unit
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontWeight: "bold", fontSize: "14px" }}>
          Filter by Estate:
        </label>

        <select
          value={estateFilter}
          onChange={(e) => setEstateFilter(e.target.value)}
        >
          <option value="">All Estates ({units.length})</option>

          {estates.map((estate) => {
            const count = units.filter((u) => u.estate === estate.id).length;
            return (
              <option key={estate.id} value={estate.id}>
                {estate.name} ({count})
              </option>
            );
          })}
        </select>

        {estateFilter && (
          <button
            onClick={() => setEstateFilter("")}
            className="btn-outline"
            style={{ padding: "6px 12px" }}
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder="Search by unit number, type, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Estate</th>
            <th>Unit Number</th>
            <th>Type</th>
            <th>Rent</th>
            <th>Electricity Token</th>
            <th>Status</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {visibleUnits.length === 0 && (
            <tr>
              <td colSpan={canManage ? 7 : 6} style={{ textAlign: "center", padding: "15px" }}>
                {search ? "No units match your search." : "No units found."}
              </td>
            </tr>
          )}

          {paginatedUnits.map((unit, index) => {
            const isNewEstateGroup =
              !estateFilter &&
              (index === 0 || paginatedUnits[index - 1].estate_name !== unit.estate_name);

            return (
              <>
                {isNewEstateGroup && (
                  <tr key={`group-${unit.estate}`} style={{ background: "var(--table-header-bg)" }}>
                    <td
                      colSpan={canManage ? 7 : 6}
                      style={{
                        fontWeight: "bold",
                        color: "var(--text)",
                        padding: "8px 10px",
                      }}
                    >
                      {unit.estate_name}
                    </td>
                  </tr>
                )}

                <tr key={unit.id}>
                  <td>{unit.estate_name}</td>
                  <td>{unit.unit_number}</td>
                  <td>{unit.unit_type}</td>
                  <td>KES {unit.rent_amount}</td>
                  <td>{unit.electricity_token_number || "—"}</td>
                  <td>
                    <span
                      className={
                        unit.status === "OCCUPIED"
                          ? "badge-success"
                          : unit.status === "VACANT"
                          ? "badge-info"
                          : unit.status === "RESERVED"
                          ? "badge-warning"
                          : "badge-danger"
                      }
                      style={{
                        padding: "4px 10px",
                        borderRadius: "15px",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                    >
                      {unit.status}
                    </span>
                  </td>

                  {canManage && (
                    <td>
                      <button
                        className="icon-btn edit"
                        title="Edit unit"
                        onClick={() => openEditModal(unit)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete unit"
                        onClick={() => {
                          setUnitToDelete(unit);
                          setConfirmOpen(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              </>
            );
          })}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visibleUnits.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Update Unit" : "Add Unit"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        fields={[
          {
            name: "estate",
            label: "Estate",
            type: "select",
            required: true,
            placeholder: "Select Estate",
            options: estateOptions,
          },
          {
            name: "unit_type",
            label: "Unit Type",
            type: "select",
            required: true,
            placeholder: "Select Unit Type",
            options: UNIT_TYPE_OPTIONS,
          },
          { name: "unit_number", label: "Unit Number", required: true },
          { name: "rent_amount", label: "Rent Amount", type: "number", required: true },
          {
            name: "electricity_token_number",
            label: "Electricity Token Number",
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: STATUS_OPTIONS,
          },
        ]}
      />

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