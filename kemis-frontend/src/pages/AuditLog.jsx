import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNotification } from "../context/NotificationContext";

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Created" },
  { value: "UPDATE", label: "Updated" },
  { value: "DELETE", label: "Deleted" },
];

const ACTION_COLORS = {
  CREATE: "#16a34a",
  UPDATE: "#d97706",
  DELETE: "#dc2626",
};

function AuditLog() {
  const { showNotification } = useNotification();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modelFilter, setModelFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (filters = {}) => {
    setLoading(true);

    try {
      const params = {};

      if (filters.model !== undefined ? filters.model : modelFilter) {
        params.model = filters.model !== undefined ? filters.model : modelFilter;
      }

      if (filters.action !== undefined ? filters.action : actionFilter) {
        params.action = filters.action !== undefined ? filters.action : actionFilter;
      }

      const response = await api.get("audit/", { params });
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      showNotification("Failed to load audit logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setModelFilter("");
    setActionFilter("");
    fetchLogs({ model: "", action: "" });
  };

  const toggleExpanded = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const formatTimestamp = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <em style={{ color: "#94a3b8" }}>No field-level changes recorded.</em>;
    }

    return (
      <table cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={changeHeaderStyle}>Field</th>
            <th style={changeHeaderStyle}>Old Value</th>
            <th style={changeHeaderStyle}>New Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(changes).map(([field, diff]) => (
            <tr key={field}>
              <td style={changeCellStyle}>{field}</td>
              <td style={changeCellStyle}>{String(diff?.old ?? "-")}</td>
              <td style={changeCellStyle}>{String(diff?.new ?? "-")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading audit logs..." />;
  }

  return (
    <div>
      <h1>Audit Log</h1>
      <p style={{ color: "#64748b", marginTop: "-10px" }}>
        Read-only history of create, update, and delete actions across the system.
        Showing up to the 500 most recent entries.
      </p>

      <form onSubmit={handleFilterSubmit} style={{ margin: "20px 0", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Filter by model (e.g. Lease)"
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="submit">Apply Filters</button>

        {(modelFilter || actionFilter) && (
          <button type="button" onClick={clearFilters}>
            Clear
          </button>
        )}
      </form>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Model</th>
            <th>Object</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "15px" }}>
                No audit log entries found.
              </td>
            </tr>
          )}

          {logs.map((log) => (
            <>
              <tr key={log.id}>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td>{log.actor_name}</td>
                <td>
                  <span
                    style={{
                      color: "white",
                      backgroundColor: ACTION_COLORS[log.action] || "#64748b",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td>{log.model_name}</td>
                <td>
                  {log.object_repr} <small style={{ color: "#94a3b8" }}>#{log.object_id}</small>
                </td>
                <td>
                  <button onClick={() => toggleExpanded(log.id)}>
                    {expandedId === log.id ? "Hide" : "View"}
                  </button>
                </td>
              </tr>

              {expandedId === log.id && (
                <tr key={`${log.id}-details`}>
                  <td colSpan={6} style={{ backgroundColor: "#f8fafc" }}>
                    {renderChanges(log.changes)}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const changeHeaderStyle = {
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "13px",
  color: "#475569",
};

const changeCellStyle = {
  borderBottom: "1px solid #e2e8f0",
  fontSize: "13px",
};

export default AuditLog;