import { useEffect, useState } from "react";
import api from "../services/api";

function Reports() {

  const [revenue, setRevenue] = useState([]);

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

  return (
    <div>
      <h1>Reports</h1>

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
        border="1"
        cellPadding="10"
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Revenue (KES)</th>
          </tr>
        </thead>

        <tbody>
          {revenue.map((item, index) => (
            <tr key={index}>
              <td>{item.month}</td>
              <td>{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default Reports;