import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    total_estates: 0,
    total_units: 0,
    vacant_units: 0,
    occupied_units: 0,
    total_tenants: 0,
    active_leases: 0,
    total_revenue: 0,
  });

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