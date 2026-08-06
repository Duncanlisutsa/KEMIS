import { useContext, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaReceipt,
  FaFileDownload,
  FaMoneyBillWave,
  FaClock,
  FaTimesCircle,
  FaUndoAlt,
  FaWallet,
  FaSearch,
  FaExclamationCircle,
} from "react-icons/fa";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const EMPTY_FORM = {
  lease: "",
  amount: "",
  payment_date: "",
  payment_method: "MPESA",
  payment_type: "RENT",
  reference_number: "",
  status: "PAID",
};

const currency = (value, decimals = 0) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const formatDate = (value) => {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ---------- Reusable pieces ----------

function StatCard({ icon, label, value, tone = "default" }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

const STATUS_META = {
  PAID: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: "neutral" };
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}

const METHOD_META = {
  MPESA: { label: "M-Pesa", tone: "success" },
  BANK: { label: "Bank", tone: "info" },
  CASH: { label: "Cash", tone: "neutral" },
};

function MethodBadge({ method }) {
  const meta = METHOD_META[method] || { label: method, tone: "neutral" };
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>;
}

function PaymentsSkeleton({ isTenant }) {
  return (
    <div>
      <div className="skeleton skeleton-title" />
      <div className="dashboard-grid" style={{ marginBottom: "30px" }}>
        {Array.from({ length: isTenant ? 3 : 4 }).map((_, i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
      <div className="skeleton" style={{ height: "300px" }} />
    </div>
  );
}

function PaymentFormModal({
  open,
  onClose,
  onSubmit,
  formData,
  onChange,
  leases,
  selectedLease,
  editingId,
  submitting,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingId ? "Update Payment" : "Record a Payment"}</DialogTitle>

      <DialogContent>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <TextField
            select
            label="Lease"
            name="lease"
            value={formData.lease}
            onChange={onChange}
            required
            fullWidth
            style={{ gridColumn: "1 / -1" }}
          >
            <MenuItem value="">Select lease</MenuItem>
            {leases.map((lease) => (
              <MenuItem key={lease.id} value={lease.id}>
                {lease.tenant_name} \u2014 {lease.unit_number}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Amount (KES)"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={onChange}
            required
            fullWidth
          />

          <TextField
            label="Payment Date"
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={onChange}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            label="Payment Method"
            name="payment_method"
            value={formData.payment_method}
            onChange={onChange}
            fullWidth
          >
            <MenuItem value="MPESA">M-Pesa</MenuItem>
            <MenuItem value="BANK">Bank</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
          </TextField>

          <TextField
            select
            label="Payment Type"
            name="payment_type"
            value={formData.payment_type}
            onChange={onChange}
            fullWidth
          >
            <MenuItem value="RENT">Rent</MenuItem>
            <MenuItem value="DEPOSIT">Deposit</MenuItem>
          </TextField>

          <TextField
            label="Reference Number"
            name="reference_number"
            value={formData.reference_number}
            onChange={onChange}
            required
            fullWidth
          />

          <TextField
            select
            label="Status"
            name="status"
            value={formData.status}
            onChange={onChange}
            fullWidth
          >
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
            <MenuItem value="REFUNDED">Refunded</MenuItem>
          </TextField>
        </div>

        {selectedLease && (
          <div
            style={{
              border: "1px solid #e2e8f0",
              padding: "14px 16px",
              marginTop: "18px",
              borderRadius: "8px",
              background: "#f8fafc",
            }}
          >
            <strong style={{ display: "block", marginBottom: "8px", color: "#0f172a" }}>
              Lease Information
            </strong>

            <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.7 }}>
              <div>Tenant: {selectedLease.tenant_name}</div>
              <div>Unit: {selectedLease.unit_number}</div>
              <div>Monthly Rent: {currency(selectedLease.monthly_rent, 2)}</div>
              <div>Lease Duration: {selectedLease.duration_months} month(s)</div>
              <div>Total Rent Due: {currency(selectedLease.total_rent_due)}</div>
              <div>Total Rent Paid: {currency(selectedLease.total_rent_paid)}</div>
              <div>
                Balance:{" "}
                <span
                  style={{
                    color: Number(selectedLease.rent_balance) >= 0 ? "#16a34a" : "#f97316",
                    fontWeight: "bold",
                  }}
                >
                  {currency(Math.abs(Number(selectedLease.rent_balance)))}{" "}
                  ({Number(selectedLease.rent_balance) >= 0 ? "Credit" : "Debit"})
                </span>
              </div>
              <div>Lease Status: {selectedLease.status}</div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions style={{ padding: "16px 24px" }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : editingId ? "Update Payment" : "Add Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Main component ----------

function Payments() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const isTenant = user?.role === "TENANT";

  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [receiptLoadingId, setReceiptLoadingId] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAll = async () => {
    setError(null);
    try {
      const [paymentsRes, leasesRes] = await Promise.all([
        api.get("payments/"),
        api.get("leases/"),
      ]);
      setPayments(paymentsRes.data);
      setLeases(leasesRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("We couldn't load payments right now. Please try again.");
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await api.get("payments/");
      setPayments(response.data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "lease") {
      const lease = leases.find((l) => l.id === Number(value));
      setSelectedLease(lease || null);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSelectedLease(null);
    setModalOpen(true);
  };

  const openEditModal = (payment) => {
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
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setSelectedLease(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      if (editingId) {
        await api.put(`payments/${editingId}/`, formData);
        showNotification("Payment updated successfully!", "success");
      } else {
        await api.post("payments/", formData);
        showNotification("Payment added successfully!", "success");
      }

      closeModal();
      fetchPayments();
    } catch (err) {
      console.error("Error saving payment:", err);
      const message = err.response?.data?.detail || "Failed to save payment.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`payments/${deleteTarget.id}/`);
      showNotification("Payment deleted successfully!", "success");
      setDeleteTarget(null);
      fetchPayments();
    } catch (err) {
      console.error("Error deleting payment:", err);
      const message = err.response?.data?.detail || "Failed to delete payment.";
      showNotification(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const downloadFile = async (url, filename, onDone) => {
    try {
      const response = await api.get(url, { responseType: "blob" });
      const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      showNotification("Failed to download file.", "error");
    } finally {
      onDone();
    }
  };

  const downloadMyPaymentsPdf = () => {
    setDownloading(true);
    downloadFile(
      "reports/my-payments/pdf/",
      "KEMIS_My_Payment_History.pdf",
      () => setDownloading(false)
    );
  };

  const downloadReceipt = (payment) => {
    setReceiptLoadingId(payment.id);
    downloadFile(
      `reports/payment-receipt/${payment.id}/pdf/`,
      `KEMIS_Receipt_${payment.reference_number}.pdf`,
      () => setReceiptLoadingId(null)
    );
  };

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;

    return payments.filter((payment) => {
      const haystack = [
        payment.tenant_name,
        payment.unit_number,
        payment.amount,
        payment.payment_date,
        payment.payment_method,
        payment.reference_number,
        payment.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [payments, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const staffStats = useMemo(() => {
    const collected = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pending = payments.filter((p) => p.status === "PENDING");
    const pendingAmount = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const failedOrRefunded = payments.filter(
      (p) => p.status === "FAILED" || p.status === "REFUNDED"
    ).length;

    return {
      collected,
      pendingAmount,
      pendingCount: pending.length,
      failedOrRefunded,
      total: payments.length,
    };
  }, [payments]);

  if (loading) {
    return (
      <div>
        <h1>{isTenant ? "My Payments" : "Payments"}</h1>
        <PaymentsSkeleton isTenant={isTenant} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>{isTenant ? "My Payments" : "Payments"}</h1>
        <div className="panel error-panel">
          <FaExclamationCircle />
          <span>{error}</span>
          <button className="retry-btn" onClick={fetchAll}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="payments-toolbar">
        <div className="dashboard-header">
          <h1>{isTenant ? "My Payments" : "Payments"}</h1>
          <p className="dashboard-subtitle">
            {isTenant
              ? "Track your rent payments and download receipts."
              : "Record, review, and manage tenant payments."}
          </p>
        </div>

        <div className="payments-toolbar-actions">
          {isTenant && (
            <button
              className="btn-outline"
              onClick={downloadMyPaymentsPdf}
              disabled={downloading}
            >
              <FaFileDownload />
              {downloading ? "Generating..." : "Download My Payment Report"}
            </button>
          )}

          {!isTenant && (
            <button className="btn-primary" onClick={openAddModal}>
              <FaPlus /> Add Payment
            </button>
          )}
        </div>
      </div>

      {isTenant && leases.length > 0 && (
        <div className="dashboard-grid" style={{ marginBottom: "30px" }}>
          {leases.map((lease) => {
            const balance = Number(lease.rent_balance);
            const isCredit = balance >= 0;

            return (
              <StatCard
                key={lease.id}
                icon={<FaWallet />}
                tone={isCredit ? "green" : "amber"}
                label={`${lease.unit_number} \u00b7 ${lease.duration_months}-month lease \u00b7 ${
                  isCredit ? "Credit (paid ahead)" : "Debit (balance owed)"
                }`}
                value={currency(Math.abs(balance))}
              />
            );
          })}
        </div>
      )}

      {!isTenant && (
        <div className="dashboard-grid" style={{ marginBottom: "30px" }}>
          <StatCard
            icon={<FaMoneyBillWave />}
            tone="green"
            label="Total Collected"
            value={currency(staffStats.collected)}
          />
          <StatCard
            icon={<FaClock />}
            tone="amber"
            label={`Pending (${staffStats.pendingCount})`}
            value={currency(staffStats.pendingAmount)}
          />
          <StatCard
            icon={<FaTimesCircle />}
            tone="red"
            label="Failed / Refunded"
            value={staffStats.failedOrRefunded}
          />
          <StatCard
            icon={<FaUndoAlt />}
            tone="blue"
            label="Total Payment Records"
            value={staffStats.total}
          />
        </div>
      )}

      {!isTenant && leases.length > 0 && (
        <>
          <h3 className="section-title">Lease Balances</h3>

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
                    <td>{currency(lease.total_rent_due)}</td>
                    <td>{currency(lease.total_rent_paid)}</td>
                    <td>
                      <span className={`badge badge-${isCredit ? "success" : "warning"}`}>
                        {currency(Math.abs(balance))} ({isCredit ? "Credit" : "Debit"})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h3 className="section-title">{isTenant ? "Payment History" : "All Payments"}</h3>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder={
            isTenant
              ? "Search by unit, date, or reference..."
              : "Search by tenant, unit, date, or reference..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredPayments.length === 0 && (
            <tr>
              <td colSpan={isTenant ? 7 : 8} style={{ textAlign: "center", padding: "15px" }}>
                {search ? "No payments match your search." : "No payment records found."}
              </td>
            </tr>
          )}

          {paginatedPayments.map((payment) => (
            <tr key={payment.id}>
              {!isTenant && <td>{payment.tenant_name}</td>}
              <td>{payment.unit_number}</td>
              <td>{currency(payment.amount, 2)}</td>
              <td>{formatDate(payment.payment_date)}</td>
              <td>
                <MethodBadge method={payment.payment_method} />
              </td>
              <td>{payment.reference_number}</td>
              <td>
                <StatusBadge status={payment.status} />
              </td>
              <td>
                {payment.status === "PAID" && (
                  <button
                    className="icon-btn receipt"
                    title="Download receipt"
                    onClick={() => downloadReceipt(payment)}
                    disabled={receiptLoadingId === payment.id}
                  >
                    <FaReceipt />
                  </button>
                )}

                {!isTenant && (
                  <>
                    <button
                      className="icon-btn edit"
                      title="Edit payment"
                      onClick={() => openEditModal(payment)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="icon-btn delete"
                      title="Delete payment"
                      onClick={() => setDeleteTarget(payment)}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPayments.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <PaymentFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        leases={leases}
        selectedLease={selectedLease}
        editingId={editingId}
        submitting={submitting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment"
        message={
          deleteTarget
            ? `Are you sure you want to delete the payment of ${currency(
                deleteTarget.amount,
                2
              )} (ref: ${deleteTarget.reference_number})? This cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirmed}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}

export default Payments;