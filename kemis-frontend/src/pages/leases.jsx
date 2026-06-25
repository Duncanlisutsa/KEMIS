import { useEffect, useState } from "react";
import api from "../services/api";

function Leases() {
  const [leases, setLeases] = useState([]);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      const response = await api.get("leases/");
      setLeases(response.data);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  };

  return (
    <div>
      <h1>Leases</h1>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Unit</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Monthly Rent</th>
            <th>Security Deposit</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {leases.map((lease) => (
            <tr key={lease.id}>
              <td>{lease.tenant}</td>
              <td>{lease.unit}</td>
              <td>{lease.start_date}</td>
              <td>{lease.end_date}</td>
              <td>KES {lease.monthly_rent}</td>
              <td>KES {lease.security_deposit}</td>
              <td>{lease.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leases;