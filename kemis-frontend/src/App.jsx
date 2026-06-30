import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/sidebar";

import Dashboard from "./pages/Dashboard";
import Estates from "./pages/Estates";
import Units from "./pages/Units";
import Tenants from "./pages/Tenants";
import Leases from "./pages/leases";
import Payments from "./pages/payments";
import Maintenance from "./pages/maintenance";

function App() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estates" element={<Estates />} />
          <Route path="/units" element={<Units />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/leases" element={<Leases />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;