import React from 'react';
import { Link } from 'react-router-dom';

function MainLayout({ children }) {
    return (
        <div style={{ display: 'flex' }}>

            <div
                style={{
                    width: '250px',
                    background: '#1e293b',
                    color: 'white',
                    minHeight: '100vh',
                    padding: '20px'
                }}
            >
                <h2>KEMIS</h2>

                <ul style={{ listStyle: 'none', padding: 0 }}>

                    <li><Link to="/" style={{ color: 'white' }}>Dashboard</Link></li>

                    <li><Link to="/estates" style={{ color: 'white' }}>Estates</Link></li>

                    <li><Link to="/units" style={{ color: 'white' }}>Units</Link></li>

                    <li><Link to="/tenants" style={{ color: 'white' }}>Tenants</Link></li>

                    <li><Link to="/leases" style={{ color: 'white' }}>Leases</Link></li>

                    <li><Link to="/payments" style={{ color: 'white' }}>Payments</Link></li>

                    <li><Link to="/maintenance" style={{ color: 'white' }}>Maintenance</Link></li>

                    <li><Link to="/reports" style={{ color: 'white' }}>Reports</Link></li>

                </ul>
            </div>

            <div style={{ flex: 1, padding: '20px' }}>
                {children}
            </div>

        </div>
    );
}

export default MainLayout;