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
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { useLocation } from "react-router-dom";
import Profile from "./pages/Profile";

function App() {
  const location = useLocation();
  const hideSidebar =
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

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
          <Route path="/" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.dashboard}><Dashboard /></RoleProtectedRoute>} />
          <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.dashboard}><Dashboard /></RoleProtectedRoute>} />
          <Route path="/estates" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.estates}><Estates /></RoleProtectedRoute>} />
          <Route path="/units" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.units}><Units /></RoleProtectedRoute>} />
          <Route path="/tenants" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.tenants}><Tenants /></RoleProtectedRoute>} />
          <Route path="/leases" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.leases}><Leases /></RoleProtectedRoute>} />
          <Route path="/payments" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.payments}><Payments /></RoleProtectedRoute>} />
          <Route path="/maintenance" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.maintenance}><Maintenance /></RoleProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.profile}><Profile /></RoleProtectedRoute>} />
          <Route path="/reports" element={<RoleProtectedRoute allowedRoles={PERMISSIONS.reports}><Reports /></RoleProtectedRoute>} />        </Routes>
      </div>
    </div>
  );
}
 
export default App;