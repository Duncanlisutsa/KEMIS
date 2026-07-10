import { useEffect, useState } from "react";
import api from "../services/api";

function Reports() {
  const [revenue, setRevenue] = useState([]);
  const [downloading, setDownloading] = useState(false);

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

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "KEMIS_Monthly_Revenue.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download report.");
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
          {revenue.map((item, index) => (
            <tr
              key={index}
              style={{
                background: index % 2 === 0 ? "#ffffff" : "#f1f5f9",
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;