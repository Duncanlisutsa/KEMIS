import { useEffect, useState } from "react";
import api from "../services/api";

function Maintenance() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get("maintenance/");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
    }
  };

  return (
    <div>
      <h1>Maintenance Requests</h1>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Unit</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Reported Date</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.tenant}</td>
              <td>{request.unit}</td>
              <td>{request.title}</td>
              <td>{request.priority}</td>
              <td>{request.status}</td>
              <td>{request.reported_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Maintenance;