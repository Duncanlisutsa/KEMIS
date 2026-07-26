import { useEffect, useState } from "react";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotification } from "../context/NotificationContext";

function StaffAccounts() {
  const { showNotification } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [originalAccount, setOriginalAccount] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "MANAGER",
    password: "",
  });

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

  const resetForm = () => {
    setFormData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "MANAGER",
      password: "",
    });
    setEditingId(null);
    setOriginalAccount(null);
  };

  const editAccount = (account) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      resetForm();
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
      <h1>Manager & Landlord Accounts</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={!!editingId}
        >
          <option value="MANAGER">Manager</option>
          <option value="LANDLORD">Landlord</option>
        </select>

        <input
          type="text"
          name="username"
          placeholder={editingId ? originalAccount?.username : "Username"}
          value={formData.username}
          onChange={handleChange}
          required={!editingId}
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="first_name"
          placeholder={editingId ? originalAccount?.first_name : "First Name"}
          value={formData.first_name}
          onChange={handleChange}
          required={!editingId}
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="last_name"
          placeholder={editingId ? originalAccount?.last_name : "Last Name"}
          value={formData.last_name}
          onChange={handleChange}
          required={!editingId}
          style={{ marginLeft: "10px" }}
        />

        <br /><br />

        <input
          type="email"
          name="email"
          placeholder={editingId ? originalAccount?.email : "Email"}
          value={formData.email}
          onChange={handleChange}
          required={!editingId}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          style={{ marginLeft: "10px" }}
        />

        <input
          type="text"
          name="password"
          placeholder={editingId ? "New Password (leave blank to keep current)" : "Set Login Password"}
          value={formData.password}
          onChange={handleChange}
          required={!editingId}
          minLength={6}
          style={{ marginLeft: "10px" }}
        />

        <button type="submit" style={{ marginLeft: "10px" }}>
          {editingId ? "Update Account" : "Add Account"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        )}

      </form>

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
                  onClick={() => editAccount(account)}
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
                    setAccountToDelete(account.id);
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