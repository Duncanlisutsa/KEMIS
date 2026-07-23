import { useContext, useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

function Payments() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const isTenant = user?.role === "TENANT";

  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const [selectedLease, setSelectedLease] = useState(null);

  const [formData, setFormData] = useState({
    lease: "",
    amount: "",
    payment_date: "",
    payment_method: "MPESA",
    payment_type: "RENT",
    reference_number: "",
    status: "PAID",
  });

  useEffect(() => {
    fetchPayments();
    fetchLeases();
  }, [isTenant]);

  const fetchPayments = async () => {
    try {
      const response = await api.get("payments/");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchLeases = async () => {
    try {
      const response = await api.get("leases/");
      setLeases(response.data);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "lease") {
      const lease = leases.find((l) => l.id === Number(value));
      setSelectedLease(lease || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`payments/${editingId}/`, formData);
        showNotification("Payment updated successfully!", "success");
      } else {
        await api.post("payments/", formData);
        showNotification("Payment added successfully!", "success");
      }

      setFormData({
        lease: "",
        amount: "",
        payment_date: "",
        payment_method: "MPESA",
        payment_type: "RENT",
        reference_number: "",
        status: "PAID",
      });

      setEditingId(null);
      setSelectedLease(null);
      fetchPayments();

    } catch (error) {
      console.error("Error saving payment:", error);
      const message = error.response?.data?.detail || "Failed to save payment.";
      showNotification(message, "error");
    }
  };

  const editPayment = (payment) => {
    setFormData({
      lease: payment.lease,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      payment_type: payment.payment_type,
      reference_number: payment.reference_number,
      status: payment.status,
    });

    const lease = leases.find((l) => l.id === payment.lease);
    setSelectedLease(lease || null);

    setEditingId(payment.id);
  };

  const deletePayment = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`payments/${id}/`);
      showNotification("Payment deleted successfully!", "success");
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      const message = error.response?.data?.detail || "Failed to delete payment.";
      showNotification(message, "error");
    }
  };

  const downloadMyPaymentsPdf = async () => {
    setDownloading(true);

    try {
      const response = await api.get("reports/my-payments/pdf/", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "KEMIS_My_Payment_History.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading payment report:", error);
      showNotification("Failed to download report.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1>{isTenant ? "My Payments" : "Payments"}</h1>

        {isTenant && (
          <button
            onClick={downloadMyPaymentsPdf}
            disabled={downloading}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? "Generating..." : "Download My Payment Report"}
          </button>
        )}
      </div>

      {isTenant && leases.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", margin: "15px 0 25px 0" }}>
          {leases.map((lease) => {
            const balance = Number(lease.rent_balance);
            const isCredit = balance >= 0;

            return (
              <div
                key={lease.id}
                style={{
                  background: isCredit ? "#16a34a" : "#f97316",
                  color: "white",
                  padding: "16px 20px",
                  borderRadius: "10px",
                  minWidth: "240px",
                }}
              >
                <div style={{ fontSize: "13px" }}>
                  {lease.unit_number} &middot; {lease.duration_months} month lease
                </div>
                <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                  KES {Math.abs(balance).toLocaleString()}
                </div>
                <div style={{ fontSize: "13px" }}>
                  {isCredit ? "Credit (paid ahead)" : "Debit (balance owed)"}
                </div>
                <div style={{ fontSize: "12px", marginTop: "6px", opacity: 0.9 }}>
                  Due: KES {Number(lease.total_rent_due).toLocaleString()} &middot; Paid: KES{" "}
                  {Number(lease.total_rent_paid).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isTenant && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>

          <select
            name="lease"
            value={formData.lease}
            onChange={handleChange}
            required
          >
            <option value="">Select Lease</option>

            {leases.map((lease) => (
              <option key={lease.id} value={lease.id}>
                {lease.tenant_name} - {lease.unit_number}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            required
            style={{ marginLeft: "10px" }}
          />

          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            required
            style={{ marginLeft: "10px" }}
          />

          <br /><br />

          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
          >
            <option value="MPESA">M-Pesa</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
          </select>

          <input
            type="text"
            name="reference_number"
            placeholder="Reference Number"
            value={formData.reference_number}
            onChange={handleChange}
            required
            style={{ marginLeft: "10px" }}
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{ marginLeft: "10px" }}
          >
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <button
            type="submit"
            style={{ marginLeft: "10px" }}
          >
            {editingId ? "Update Payment" : "Add Payment"}
          </button>

          {selectedLease && (
            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginTop: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                background: "#f8fafc",
              }}
            >
              <strong>Lease Information</strong>

              <p>Tenant: {selectedLease.tenant_name}</p>
              <p>Unit: {selectedLease.unit_number}</p>
              <p>Monthly Rent: KES {selectedLease.monthly_rent}</p>
              <p>Lease Duration: {selectedLease.duration_months} month(s)</p>
              <p>Total Rent Due: KES {Number(selectedLease.total_rent_due).toLocaleString()}</p>
              <p>Total Rent Paid: KES {Number(selectedLease.total_rent_paid).toLocaleString()}</p>
              <p>
                Balance:{" "}
                <span
                  style={{
                    color: Number(selectedLease.rent_balance) >= 0 ? "#16a34a" : "#f97316",
                    fontWeight: "bold",
                  }}
                >
                  KES {Number(selectedLease.rent_balance).toLocaleString()}{" "}
                  ({Number(selectedLease.rent_balance) >= 0 ? "Credit" : "Debit"})
                </span>
              </p>
              <p>Lease Status: {selectedLease.status}</p>
            </div>
          )}

        </form>
      )}

      {!isTenant && leases.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3>Lease Balances</h3>

          <table border="1" cellPadding="10" width="100%">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Duration</th>
                <th>Rent Due</th>
                <th>Rent Paid</th>
                <th>Balance</th>
              </tr>
            </thead>

            <tbody>
              {leases.map((lease) => {
                const balance = Number(lease.rent_balance);
                const isCredit = balance >= 0;

                return (
                  <tr key={lease.id}>
                    <td>{lease.tenant_name}</td>
                    <td>{lease.unit_number}</td>
                    <td>{lease.duration_months} month(s)</td>
                    <td>KES {Number(lease.total_rent_due).toLocaleString()}</td>
                    <td>KES {Number(lease.total_rent_paid).toLocaleString()}</td>
                    <td
                      style={{
                        color: isCredit ? "#16a34a" : "#f97316",
                        fontWeight: "bold",
                      }}
                    >
                      KES {Math.abs(balance).toLocaleString()} ({isCredit ? "Credit" : "Debit"})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <table border="1" cellPadding="10" width="100%">

        <thead>
          <tr>
            {!isTenant && <th>Tenant</th>}
            <th>Unit</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Status</th>
            {!isTenant && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>

          {payments.length === 0 && (
            <tr>
              <td colSpan={isTenant ? 6 : 8} style={{ textAlign: "center", padding: "15px" }}>
                No payment records found.
              </td>
            </tr>
          )}

          {payments.map((payment) => (
            <tr key={payment.id}>
              {!isTenant && <td>{payment.tenant_name}</td>}
              <td>{payment.unit_number}</td>
              <td>KES {payment.amount}</td>
              <td>{payment.payment_date}</td>
              <td>{payment.payment_method}</td>
              <td>{payment.reference_number}</td>
              <td>{payment.status}</td>

              {!isTenant && (
                <td>
                  <button
                    onClick={() => editPayment(payment)}
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
                    onClick={() => deletePayment(payment.id)}
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

export default Payments;