import { useEffect, useState } from "react";
import api from "../services/api";

function Reports() {
  const [revenue, setRevenue] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDownloading, setDetailDownloading] = useState(false);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const response = await api.get("reports/monthly-revenue/");
      setRevenue(response.data);
    } catch (error) {
      console.error("Error loading revenue report:", error);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);

    try {
      const response = await api.get("reports/monthly-revenue/pdf/", {
        responseType: "blob",
      });

      triggerDownload(response.data, "KEMIS_Monthly_Revenue.pdf");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  const triggerDownload = (blobData, filename) => {
    const url = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const openMonth = async (item) => {
    if (
      selectedMonth &&
      selectedMonth.year === item.year &&
      selectedMonth.month_number === item.month_number
    ) {
      // Clicking the same month again collapses the panel
      setSelectedMonth(null);
      setDetail(null);
      return;
    }

    setSelectedMonth(item);
    setDetail(null);
    setDetailLoading(true);

    try {
      const response = await api.get("reports/monthly-revenue/detail/", {
        params: { year: item.year, month: item.month_number },
      });
      setDetail(response.data);
    } catch (error) {
      console.error("Error loading month detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadMonthPdf = async () => {
    if (!selectedMonth) return;

    setDetailDownloading(true);

    try {
      const response = await api.get("reports/monthly-revenue/detail/pdf/", {
        params: { year: selectedMonth.year, month: selectedMonth.month_number },
        responseType: "blob",
      });

      triggerDownload(
        response.data,
        `KEMIS_Financial_Report_${selectedMonth.month.replace(" ", "_")}.pdf`
      );
    } catch (error) {
      console.error("Error downloading month PDF:", error);
      alert("Failed to download report.");
    } finally {
      setDetailDownloading(false);
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
        <h1>Reports</h1>

        <button
          onClick={downloadPdf}
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
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <h2>Monthly Revenue Report</h2>
      <p style={{ color: "#64748b", fontSize: "14px", marginTop: "-8px" }}>
        Click a month to see who paid.
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            minWidth: "220px",
          }}
        >
          <h3>Total Revenue Records</h3>
          <h1>{revenue.length}</h1>
        </div>

        <div
          style={{
            background: "#16a34a",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            minWidth: "220px",
          }}
        >
          <h3>Total Revenue (KES)</h3>
          <h1>
            {revenue
              .reduce((sum, item) => sum + Number(item.total), 0)
              .toLocaleString()}
          </h1>
        </div>
      </div>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#1e293b" }}>
            <th style={{ color: "white", padding: "12px", textAlign: "left" }}>
              Month
            </th>
            <th style={{ color: "white", padding: "12px", textAlign: "right" }}>
              Total Revenue (KES)
            </th>
          </tr>
        </thead>

        <tbody>
          {revenue.map((item, index) => {
            const isSelected =
              selectedMonth &&
              selectedMonth.year === item.year &&
              selectedMonth.month_number === item.month_number;

            return (
              <tr
                key={index}
                onClick={() => openMonth(item)}
                style={{
                  background: isSelected
                    ? "#dbeafe"
                    : index % 2 === 0
                    ? "#ffffff"
                    : "#f1f5f9",
                  cursor: "pointer",
                }}
              >
                <td style={{ padding: "12px", color: "#0f172a" }}>
                  {item.month}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "#0f172a",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {Number(item.total).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedMonth && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "20px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <h2 style={{ margin: 0 }}>{selectedMonth.month} — Details</h2>

            <button
              onClick={downloadMonthPdf}
              disabled={detailDownloading}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: detailDownloading ? "not-allowed" : "pointer",
                opacity: detailDownloading ? 0.7 : 1,
              }}
            >
              {detailDownloading ? "Generating..." : "Download This Month's PDF"}
            </button>
          </div>

          {detailLoading && <p>Loading details...</p>}

          {!detailLoading && detail && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                <SummaryCard
                  label="Total Revenue"
                  value={`KES ${Number(detail.summary.total_revenue).toLocaleString()}`}
                />
                <SummaryCard
                  label="Transactions (Paid)"
                  value={detail.summary.total_transactions}
                />
                <SummaryCard
                  label="Average Payment"
                  value={`KES ${Number(detail.summary.average_payment).toLocaleString()}`}
                />
              </div>

              {Object.keys(detail.summary.by_payment_method).length > 0 && (
                <p style={{ fontSize: "14px", color: "#475569" }}>
                  <strong>By Method:</strong>{" "}
                  {Object.entries(detail.summary.by_payment_method)
                    .map(([k, v]) => `${k}: KES ${Number(v).toLocaleString()}`)
                    .join(" | ")}
                </p>
              )}

              {Object.keys(detail.summary.status_counts).length > 0 && (
                <p style={{ fontSize: "14px", color: "#475569", marginBottom: "15px" }}>
                  <strong>Record Status Counts:</strong>{" "}
                  {Object.entries(detail.summary.status_counts)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" | ")}
                </p>
              )}

              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr style={{ background: "#334155" }}>
                    <th style={thStyle}>Tenant</th>
                    <th style={thStyle}>Estate</th>
                    <th style={thStyle}>Unit</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Reference</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {detail.payments.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ padding: "15px", textAlign: "center", color: "#64748b" }}>
                        No payment records for this month.
                      </td>
                    </tr>
                  )}

                  {detail.payments.map((p, index) => (
                    <tr
                      key={p.id}
                      style={{ background: index % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                    >
                      <td style={tdStyle}>{p.tenant_name}</td>
                      <td style={tdStyle}>{p.estate_name}</td>
                      <td style={tdStyle}>{p.unit_number}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                        {Number(p.amount).toLocaleString()}
                      </td>
                      <td style={tdStyle}>{p.payment_date}</td>
                      <td style={tdStyle}>{p.payment_method}</td>
                      <td style={tdStyle}>{p.payment_type}</td>
                      <td style={tdStyle}>{p.reference_number}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle = {
  color: "white",
  padding: "10px",
  textAlign: "left",
  fontSize: "13px",
};

const tdStyle = {
  padding: "10px",
  color: "#0f172a",
  fontSize: "13px",
};

function SummaryCard({ label, value }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px 18px",
        minWidth: "160px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    PAID: "#16a34a",
    PENDING: "#f59e0b",
    FAILED: "#dc2626",
    REFUNDED: "#64748b",
  };

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: "12px",
        color: "white",
        backgroundColor: colorMap[status] || "#64748b",
        fontSize: "11px",
        fontWeight: "bold",
      }}
    >
      {status}
    </span>
  );
}

export default Reports;