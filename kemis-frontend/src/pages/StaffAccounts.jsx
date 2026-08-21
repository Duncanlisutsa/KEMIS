import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import FormModal from "../components/FormModal";
import { useNotification } from "../context/NotificationContext";

const EMPTY_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "MANAGER",
  password: "",
};

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Manager" },
  { value: "LANDLORD", label: "Landlord" },
];

function StaffAccounts() {
  const { showNotification } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [originalAccount, setOriginalAccount] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get("accounts/staff-accounts/");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching staff accounts:", error);
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
    setOriginalAccount(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (account) => {
    setEditingId(account.id);
    setOriginalAccount(account);

    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: account.phone || "",
      role: account.role,
      password: "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setOriginalAccount(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      if (editingId) {
        await api.put(`accounts/staff-accounts/${editingId}/`, {
          username: formData.username || originalAccount?.username,
          first_name: formData.first_name || originalAccount?.first_name,
          last_name: formData.last_name || originalAccount?.last_name,
          email: formData.email || originalAccount?.email,
          phone: formData.phone,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        });

        showNotification("Account updated successfully!", "success");
      } else {
        await api.post("accounts/staff-accounts/", formData);
        showNotification("Account created successfully!", "success");
      }

      closeModal();
      fetchAccounts();
    } catch (error) {
      console.error("Error saving account:", error);
      const data = error.response?.data;
      const firstFieldError =
        data && typeof data === "object"
          ? Object.values(data).find((v) => Array.isArray(v) && v.length)?.[0]
          : null;
      const message = firstFieldError || data?.detail || "Failed to save account.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      await api.delete(`accounts/staff-accounts/${accountToDelete}/`);
      showNotification("Account deleted successfully!", "success");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      const message = error.response?.data?.detail || "Failed to delete account.";
      showNotification(message, "error");
    } finally {
      setConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  return (
    <div>
      <div className="payments-toolbar">
        <h1 style={{ margin: 0 }}>Manager & Landlord Accounts</h1>

        <div className="payments-toolbar-actions">
          <button className="btn-primary" onClick={openAddModal}>
            <FaPlus /> Add Account
          </button>
        </div>
      </div>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {accounts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "15px" }}>
                No manager or landlord accounts found.
              </td>
            </tr>
          )}

          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.first_name} {account.last_name}</td>
              <td>{account.username}</td>
              <td>{account.role === "MANAGER" ? "Manager" : "Landlord"}</td>
              <td>{account.email}</td>
              <td>{account.phone}</td>

              <td>
                <button
                  className="icon-btn edit"
                  title="Edit account"
                  onClick={() => openEditModal(account)}
                >
                  <FaEdit />
                </button>

                <button
                  className="icon-btn delete"
                  title="Delete account"
                  onClick={() => {
                    setAccountToDelete(account.id);
                    setConfirmOpen(true);
                  }}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Update Account" : "Add Manager / Landlord Account"}
        isEditing={!!editingId}
        submitting={submitting}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        fields={[
          {
            name: "role",
            label: "Role",
            type: "select",
            disabled: !!editingId,
            options: ROLE_OPTIONS,
            fullWidth: true,
          },
          {
            name: "username",
            label: "Username",
            required: !editingId,
            placeholder: editingId ? originalAccount?.username : undefined,
            helperText: editingId ? "Leave blank to keep the current username" : undefined,
          },
          {
            name: "first_name",
            label: "First Name",
            required: !editingId,
            placeholder: editingId ? originalAccount?.first_name : undefined,
          },
          {
            name: "last_name",
            label: "Last Name",
            required: !editingId,
            placeholder: editingId ? originalAccount?.last_name : undefined,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            required: !editingId,
            placeholder: editingId ? originalAccount?.email : undefined,
          },
          { name: "phone", label: "Phone Number" },
          {
            name: "password",
            label: editingId ? "New Password" : "Set Login Password",
            type: "password",
            required: !editingId,
            helperText: editingId
              ? "Leave blank to keep the current password"
              : "Minimum 6 characters",
          },
        ]}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        onConfirm={deleteAccount}
        onCancel={() => {
          setConfirmOpen(false);
          setAccountToDelete(null);
        }}
      />
    </div>
  );
}

export default StaffAccounts;