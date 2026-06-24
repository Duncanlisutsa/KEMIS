import { useEffect, useState } from "react";
import api from "../services/api";

function Tenants() {

    const [tenants, setTenants] = useState([]);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await api.get("tenants/");
            setTenants(response.data);
        } catch (error) {
            console.error("Error fetching tenants:", error);
        }
    };

    return (
        <div>
            <h1>Tenants</h1>

            <table border="1" cellPadding="10" width="100%">
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Phone Number</th>
                        <th>Email</th>
                    </tr>
                </thead>

                <tbody>
                    {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                            <td>{tenant.first_name}</td>
                            <td>{tenant.last_name}</td>
                            <td>{tenant.phone_number}</td>
                            <td>{tenant.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

export default Tenants;