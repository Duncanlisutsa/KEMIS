import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import Estates from './pages/Estates';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
function App() {

    return (

        <BrowserRouter>

            <MainLayout>

                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/estates" element={<Estates />} />
                    <Route path="/units" element={<Units />} />
                    <Route path="/tenants" element={<Tenants />} />
                </Routes>

            </MainLayout>

        </BrowserRouter>

    );
}

export default App;