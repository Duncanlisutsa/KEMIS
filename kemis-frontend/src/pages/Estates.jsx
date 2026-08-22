import { useContext, useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import {
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  FormHelperText,
} from "@mui/material";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { useNotification } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

const MAX_MANAGERS = 3;

const EMPTY_FORM = {
  name: "",
  location: "",
  description: "",
  managers: [],
  owner: "",
};

function Estates() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const isAdmin = user?.role === "ADMIN";

  const [estates, setEstates] = useState([]);
  const [managers, setManagers] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [estateToDelete, setEstateToDelete] = useState(null);

  useEffect(() => {
    fetchEstates();

    if (isAdmin) {
      fetchManagers();
      fetchLandlords();
    }
  }, [isAdmin]);

  const fetchEstates = async () => {
    setLoading(true);

    try {
      const response = await api.get("property/estates/");
      setEstates(response.data);
    } catch (error) {
      console.error("Error fetching estates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await api.get("accounts/managers/");
      setManagers(response.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const fetchLandlords = async () => {
    try {
      const response = await api.get("accounts/landlords/");
      setLandlords(response.data);
    } catch (error) {
      console.error("Error fetching landlords:", error);
    }
  };

  const handleDelete = async () => {
    if (!estateToDelete) return;

    try {
      await api.delete(`property/estates/${estateToDelete}/`);
      showNotification("Estate deleted successfully!", "success");
      fetchEstates();
    } catch (error) {
      console.error("Error deleting estate:", error);
      const message = error.response?.data?.detail || "Failed to delete estate.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setEstateToDelete(null);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (estate) => {
    setFormData({
      name: estate.name,
      location: estate.location,
      description: estate.description,
      managers: estate.managers || [],
      owner: estate.owner || "",
    });

    setEditingId(estate.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleManagersChange = (e) => {
    const { value } = e.target;
    // MUI Select (multiple) can hand back a comma-separated string on
    // some browsers/autofill paths - normalize to an array either way.
    const nextValue = typeof value === "string" ? value.split(",") : value;

    if (nextValue.length > MAX_MANAGERS) {
      showNotification(`You can assign at most ${MAX_MANAGERS} managers to an estate.`, "error");
      return;
    }

    setFormData({
      ...formData,
      managers: nextValue,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        owner: formData.owner || null,
      };

      if (editingId) {
        await api.put(`property/estates/${editingId}/`, payload);
        showNotification("Estate updated successfully!", "success");
      } else {
        await api.post("property/estates/", payload);
        showNotification("Estate added successfully!", "success");
      }

      closeModal();
      fetchEstates();
    } catch (error) {
      console.error("Error saving estate:", error);
      const data = error.response?.data;
      const firstFieldError =
        data && typeof data === "object"
          ? Object.values(data).find((v) => Array.isArray(v) && v.length)?.[0]
          : null;
      const message = firstFieldError || data?.detail || "Failed to save estate.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading estates..." />;
  }

  const landlordOptions = landlords.map((l) => ({ value: l.id, label: l.full_name }));

  const managerNameById = (id) => managers.find((m) => m.id === id)?.full_name || id;

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>{isAdmin ? "Estates" : "My Estate"}</h1>

        {isAdmin && (
          <div className="payments-toolbar-actions">
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Estate
            </button>
          </div>
        )}
      </div>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Description</th>
            <th>Owner</th>
            <th>Managers</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {estates.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: "center", padding: "15px" }}>
                {isAdmin ? "No estates found." : "You are not currently assigned to an estate."}
              </td>
            </tr>
          )}

          {estates.map((estate, index) => (
            <tr key={estate.id}>
              <td>{String(index + 1).padStart(2, "0")}</td>
              <td>{estate.name}</td>
              <td>{estate.location}</td>
              <td>{estate.description}</td>
              <td>{estate.owner_name || "Unassigned"}</td>
              <td>
                {estate.manager_names && estate.manager_names.length > 0
                  ? estate.manager_names.join(", ")
                  : "Unassigned"}
              </td>

              {isAdmin && (
                <td>
                  <button
                    className="icon-btn edit"
                    title="Edit estate"
                    onClick={() => openEditModal(estate)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete"
                    title="Delete estate"
                    onClick={() => {
                      setEstateToDelete(estate.id);
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
        title={editingId ? "Update Estate" : "Add Estate"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        fields={[
          { name: "name", label: "Estate Name", required: true },
          { name: "location", label: "Location", required: true },
          { name: "description", label: "Description", fullWidth: true },
          {
            name: "managers",
            label: "Managers",
            type: "custom",
            fullWidth: true,
            render: () => (
              <div>
                <Select
                  name="managers"
                  multiple
                  fullWidth
                  displayEmpty
                  value={formData.managers}
                  onChange={handleManagersChange}
                  renderValue={(selected) =>
                    selected.length === 0 ? (
                      <span style={{ color: "var(--text-muted)" }}>No Managers Assigned</span>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {selected.map((id) => (
                          <Chip key={id} label={managerNameById(id)} size="small" />
                        ))}
                      </Box>
                    )
                  }
                >
                  {managers.map((m) => {
                    const disableFurtherSelection =
                      formData.managers.length >= MAX_MANAGERS &&
                      !formData.managers.includes(m.id);

                    return (
                      <MenuItem key={m.id} value={m.id} disabled={disableFurtherSelection}>
                        <Checkbox checked={formData.managers.includes(m.id)} />
                        <ListItemText primary={m.full_name} />
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  Select up to {MAX_MANAGERS} managers ({formData.managers.length}/{MAX_MANAGERS} selected)
                </FormHelperText>
              </div>
            ),
          },
          {
            name: "owner",
            label: "Owner",
            type: "select",
            placeholder: "No Owner Assigned",
            options: landlordOptions,
          },
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Estate"
        message="Are you sure you want to delete this estate? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setEstateToDelete(null);
        }}
      />
    </div>
  );
}

export default Estates;