import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/sidebar";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import { PERMISSIONS } from "./config/permissions";
import Dashboard from "./pages/Dashboard";
import Estates from "./pages/Estates";
import Units from "./pages/Units";
import Tenants from "./pages/Tenants";
import Leases from "./pages/leases";
import Payments from "./pages/payments";
import Maintenance from "./pages/maintenance";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLocation } from "react-router-dom";
import Profile from "./pages/Profile";

function App() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div style={{ display: "flex" }}>
      {!hideSidebar && <Sidebar />}

      <div
        style={{
          flex: 1,
          marginLeft: hideSidebar ? "0" : "250px",
          padding: "20px",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/estates" element={<ProtectedRoute><Estates /></ProtectedRoute>} />
          <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
          <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
          <Route path="/leases" element={<ProtectedRoute><Leases /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/reports" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.reports}><Reports /></RoleProtectedRoute>} />        </Routes>
      </div>
    </div>
  );
}
 
export default App;