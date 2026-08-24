import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  FaBuilding,
  FaDoorOpen,
  FaUserFriends,
  FaFileContract,
  FaMoneyBillWave,
  FaTools,
  FaHome,
  FaCalendarAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaBolt,
} from "react-icons/fa";

const currency = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;

const monthDayYear = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

function OccupancyRing({ occupied, vacant }) {
  const total = occupied + vacant;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="panel occupancy-panel">
      <h3 className="panel-title">Occupancy Rate</h3>
      <div className="occupancy-ring-wrap">
        <div
          className="occupancy-ring"
          style={{
            background: `conic-gradient(#2563eb ${pct * 3.6}deg, #e2e8f0 0deg)`,
          }}
        >
          <div className="occupancy-ring-center">
            <span className="occupancy-pct">{pct}%</span>
            <span className="occupancy-sub">Occupied</span>
          </div>
        </div>
        <div className="occupancy-legend">
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#2563eb" }} />
            Occupied — {occupied}
          </div>
          <div className="legend-row">
            <span className="legend-dot" style={{ background: "#e2e8f0" }} />
            Vacant — {vacant}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="panel revenue-panel">
        <h3 className="panel-title">Revenue Trend</h3>
        <p className="empty-note">No payment data yet.</p>
      </div>
    );
  }

  const recent = data.slice(-6);
  const max = Math.max(...recent.map((d) => d.total), 1);

  return (
    <div className="panel revenue-panel">
      <h3 className="panel-title">Revenue Trend (last {recent.length} months)</h3>
      <div className="bar-chart">
        {recent.map((item) => {
          const height = Math.max((item.total / max) * 100, 4);
          return (
            <div className="bar-col" key={`${item.year}-${item.month_number}`}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${height}%` }}
                  title={currency(item.total)}
                />
              </div>
              <span className="bar-value">{currency(item.total)}</span>
              <span className="bar-label">
                {item.month.split(" ")[0].slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopDebtors({ debtors }) {
  return (
    <div className="panel debtors-panel">
      <h3 className="panel-title">Top Tenants in Debt</h3>
      {(!debtors || debtors.length === 0) ? (
        <p className="empty-note">
          <FaCheckCircle style={{ marginRight: 6, color: "#16a34a" }} />
          No tenants currently owe rent.
        </p>
      ) : (
        <ul className="debtors-list">
          {debtors.map((d, i) => (
            <li className="debtor-row" key={`${d.tenant_name}-${i}`}>
              <span className="debtor-rank">{i + 1}</span>
              <div className="debtor-info">
                <span className="debtor-name">{d.tenant_name}</span>
                <span className="debtor-unit">
                  {d.estate_name} · Unit {d.unit_number}
                </span>
              </div>
              <span className="debtor-amount">{currency(d.amount_owed)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VacancyByEstate({ estates }) {
  return (
    <div className="panel vacancy-panel">
      <h3 className="panel-title">Vacant Units per Estate</h3>
      {(!estates || estates.length === 0) ? (
        <p className="empty-note">No estates to show yet.</p>
      ) : (
        <ul className="vacancy-list">
          {estates.map((e) => {
            const pct = e.total > 0 ? Math.round((e.vacant / e.total) * 100) : 0;
            return (
              <li className="vacancy-row" key={e.estate_id}>
                <div className="vacancy-row-top">
                  <span className="vacancy-estate-name">{e.estate_name}</span>
                  <span className="vacancy-count">
                    {e.vacant} / {e.total} vacant
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill vacancy-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuickLinks({ links }) {
  return (
    <div className="panel quicklinks-panel">
      <h3 className="panel-title">Quick Actions</h3>
      <div className="quicklinks">
        {links.map((link) => (
          <Link to={link.to} className="quicklink" key={link.to}>
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" />
      <div className="dashboard-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
    </div>
  );
}

// ---------- Main component ----------

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [error, setError] = useState(null);


  const fetchStats = async () => {
    setError(null);
    try {
      const response = await api.get("reports/dashboard/");
      setStats(response.data);

      if (response.data.role !== "TENANT") {
        try {
          const revResponse = await api.get("reports/monthly-revenue/");
          setRevenue(revResponse.data);
        } catch (revError) {
          console.error("Error fetching revenue trend:", revError);
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
      setError("We couldn't load your dashboard right now. Please try again.");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <div className="panel error-panel">
          <FaExclamationCircle />
          <span>{error}</span>
          <button className="retry-btn" onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <DashboardSkeleton />;
  }

  const displayName = user?.first_name || user?.username || "";

  // ---------- Tenant view ----------
  if (stats.role === "TENANT") {
    if (!stats.has_active_lease) {
      return (
        <div>
          <div className="dashboard-header">
            <h1>
              {greeting()}{displayName ? `, ${displayName}` : ""}
            </h1>
          </div>
          <div className="panel empty-lease-panel">
            <FaHome size={32} />
            <p>You don't have an active lease at the moment.</p>
          </div>
        </div>
      );
    }

    const isOpenEnded = !stats.lease_end;

    const start = new Date(stats.lease_start);
    const end = isOpenEnded ? null : new Date(stats.lease_end);
    const now = new Date();
    const totalDays = isOpenEnded ? null : Math.max((end - start) / 86400000, 1);
    const elapsedDays = isOpenEnded
      ? null
      : Math.min(Math.max((now - start) / 86400000, 0), totalDays);
    const leaseProgress = isOpenEnded ? null : Math.round((elapsedDays / totalDays) * 100);

    return (
      <div>
        <div className="dashboard-header">
          <h1>
            {greeting()}{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="dashboard-subtitle">
            {stats.estate_name} · Unit {stats.unit_number}
          </p>
        </div>

        <div className="dashboard-grid">
          <StatCard
            icon={<FaBuilding />}
            label="Estate"
            value={stats.estate_name}
            tone="blue"
          />
          <StatCard
            icon={<FaDoorOpen />}
            label="Unit"
            value={stats.unit_number}
            tone="indigo"
          />
          <StatCard
            icon={<FaBolt />}
            label="Electricity Token Number"
            value={stats.electricity_token_number || "Not set"}
            tone="amber"
          />
          <StatCard
            icon={<FaMoneyBillWave />}
            label="Monthly Rent"
            value={currency(stats.monthly_rent)}
            tone="green"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Total Paid"
            value={currency(stats.total_paid)}
            tone="teal"
          />
          <StatCard
            icon={<FaTools />}
            label="Open Maintenance Requests"
            value={stats.open_maintenance_requests}
            tone={stats.open_maintenance_requests > 0 ? "amber" : "green"}
          />
        </div>

        <div className="dashboard-panels">
          <div className="panel lease-panel">
            <h3 className="panel-title">Lease Period</h3>
            <div className="lease-dates">
              <span>{monthDayYear(stats.lease_start)}</span>
              <span>{isOpenEnded ? "Open-ended" : monthDayYear(stats.lease_end)}</span>
            </div>
            {isOpenEnded ? (
              <span className="progress-caption">
                No fixed end date — your lease continues month to month.
              </span>
            ) : (
              <>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${leaseProgress}%` }}
                  />
                </div>
                <span className="progress-caption">
                  {leaseProgress}% of lease term elapsed
                </span>
              </>
            )}
          </div>

          <QuickLinks
            links={[
              { to: "/payments", label: "View Payments", icon: <FaMoneyBillWave /> },
              { to: "/maintenance", label: "Maintenance Requests", icon: <FaTools /> },
              { to: "/profile", label: "My Profile", icon: <FaUserFriends /> },
            ]}
          />
        </div>
      </div>
    );
  }

  // ---------- Landlord / Admin / Manager view ----------
  return (
    <div>
      <div className="dashboard-header">
        <h1>
          {greeting()}{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="dashboard-subtitle">
          Here's what's happening across your properties today.
        </p>
      </div>

      <div className="dashboard-grid">
        <StatCard
          icon={<FaBuilding />}
          label="Total Estates"
          value={stats.total_estates}
          tone="blue"
        />
        <StatCard
          icon={<FaDoorOpen />}
          label="Total Units"
          value={stats.total_units}
          tone="indigo"
        />
        <StatCard
          icon={<FaCheckCircle />}
          label="Occupied Units"
          value={stats.occupied_units}
          tone="green"
        />
        <StatCard
          icon={<FaExclamationCircle />}
          label="Vacant Units"
          value={stats.vacant_units}
          tone={stats.vacant_units > 0 ? "amber" : "green"}
        />
        <StatCard
          icon={<FaUserFriends />}
          label="Total Tenants"
          value={stats.total_tenants}
          tone="teal"
        />
        <StatCard
          icon={<FaFileContract />}
          label="Active Leases"
          value={stats.active_leases}
          tone="purple"
        />
        <StatCard
          icon={<FaMoneyBillWave />}
          label="Total Revenue"
          value={currency(stats.total_revenue)}
          tone="green"
        />
      </div>

      <div className="dashboard-panels">
        <RevenueChart data={revenue} />
        <OccupancyRing
          occupied={stats.occupied_units}
          vacant={stats.vacant_units}
        />
      </div>

      <div className="dashboard-panels">
        <TopDebtors debtors={stats.top_debtors} />
        <VacancyByEstate estates={stats.vacant_units_by_estate} />
      </div>

      <div className="dashboard-panels">
        <QuickLinks
          links={[
            { to: "/estates", label: "Manage Estates", icon: <FaBuilding /> },
            { to: "/tenants", label: "Manage Tenants", icon: <FaUserFriends /> },
            { to: "/leases", label: "Manage Leases", icon: <FaFileContract /> },
            { to: "/reports", label: "Full Reports", icon: <FaCalendarAlt /> },
          ]}
        />
      </div>
    </div>
  );
}

export default Dashboard;