import { useEffect, useState } from "react";
import api from "../services/api";

function Payments() {

  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
  }, []);

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

    // Lease selected
    if (name === "lease") {
      const lease = leases.find(
        (l) => l.id === Number(value)
      );

      setSelectedLease(lease || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      if (editingId) {
        await api.put(`payments/${editingId}/`, formData);
        alert("Payment updated successfully!");
      } else {
        await api.post("payments/", formData);
        alert("Payment added successfully!");
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

      if (error.response) {
        alert(JSON.stringify(error.response.data));
      }
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
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  return (
    <div>

      <h1>Payments</h1>

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

        <select
          name="payment_type"
          value={formData.payment_type}
          onChange={handleChange}
          style={{ marginLeft: "10px" }}
        >
          <option value="RENT">Rent</option>
          <option value="DEPOSIT">Deposit</option>
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
            <p>Lease Status: {selectedLease.status}</p>
          </div>
        )}

      </form>

      <table border="1" cellPadding="10" width="100%">

        <thead>
          <tr>
            <th>Tenant</th>
            <th>Unit</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Method</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.tenant_name}</td>
              <td>{payment.unit_number}</td>
              <td>KES {payment.amount}</td>
              <td>{payment.payment_date}</td>
              <td>{payment.payment_method}</td>
              <td>{payment.payment_type}</td>
              <td>{payment.reference_number}</td>
              <td>{payment.status}</td>

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
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Payments;