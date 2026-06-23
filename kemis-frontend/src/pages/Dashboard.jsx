import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {

    const [stats, setStats] = useState({
        total_units: 0,
        occupied_units: 0,
        vacant_units: 0,
        total_tenants: 0,
        active_leases: 0,
        monthly_income: 0,
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get("reports/dashboard/");
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    return (
        <div>

            <h1>KEMIS Dashboard</h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "20px",
                    marginTop: "30px"
                }}
            >

                <div className="card">
                    <h3>Total Units</h3>
                    <h1>{stats.total_units}</h1>
                </div>

                <div className="card">
                    <h3>Occupied Units</h3>
                    <h1>{stats.occupied_units}</h1>
                </div>

                <div className="card">
                    <h3>Vacant Units</h3>
                    <h1>{stats.vacant_units}</h1>
                </div>

                <div className="card">
                    <h3>Total Tenants</h3>
                    <h1>{stats.total_tenants}</h1>
                </div>

                <div className="card">
                    <h3>Active Leases</h3>
                    <h1>{stats.active_leases}</h1>
                </div>

                <div className="card">
                    <h3>Monthly Income</h3>
                    <h1>KES {stats.monthly_income}</h1>
                </div>

            </div>

        </div>
    );
}

export default Dashboard;