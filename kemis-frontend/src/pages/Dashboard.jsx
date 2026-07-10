import { useContext, useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("reports/dashboard/");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    }
  };

  if (!stats) {
    return <h2>Loading...</h2>;
  }

  if (stats.role === "TENANT") {
    if (!stats.has_active_lease) {
      return (
        <div>
          <h1>Dashboard</h1>
          <p>You don't have an active lease at the moment.</p>
        </div>
      );
    }

    return (
      <div>
        <h1>Dashboard</h1>

        <div className="dashboard-grid">

          <div className="card">
            <h3>Estate</h3>
            <h2>{stats.estate_name}</h2>
          </div>

          <div className="card">
            <h3>Unit</h3>
            <h2>{stats.unit_number}</h2>
          </div>

          <div className="card">
            <h3>Monthly Rent</h3>
            <h2>KES {stats.monthly_rent}</h2>
          </div>

          <div className="card">
            <h3>Total Paid</h3>
            <h2>KES {stats.total_paid}</h2>
          </div>

          <div className="card">
            <h3>Lease Period</h3>
            <h2 style={{ fontSize: "16px" }}>
              {stats.lease_start} to {stats.lease_end}
            </h2>
          </div>

          <div className="card">
            <h3>Open Maintenance Requests</h3>
            <h2>{stats.open_maintenance_requests}</h2>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="dashboard-grid">

        <div className="card">
          <h3>Total Estates</h3>
          <h2>{stats.total_estates}</h2>
        </div>

        <div className="card">
          <h3>Total Units</h3>
          <h2>{stats.total_units}</h2>
        </div>

        <div className="card">
          <h3>Vacant Units</h3>
          <h2>{stats.vacant_units}</h2>
        </div>

        <div className="card">
          <h3>Occupied Units</h3>
          <h2>{stats.occupied_units}</h2>
        </div>

        <div className="card">
          <h3>Total Tenants</h3>
          <h2>{stats.total_tenants}</h2>
        </div>

        <div className="card">
          <h3>Active Leases</h3>
          <h2>{stats.active_leases}</h2>
        </div>

        <div className="card">
          <h3>Total Revenue</h3>
          <h2>KES {stats.total_revenue}</h2>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;