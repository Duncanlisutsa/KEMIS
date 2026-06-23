import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import Estates from './pages/Estates';
import Units from './pages/Units';
function App() {

    return (

        <BrowserRouter>

            <MainLayout>

                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/estates" element={<Estates />} />
                    <Route path="/units" element={<Units />} />
                </Routes>

            </MainLayout>

        </BrowserRouter>

    );
}

export default App;