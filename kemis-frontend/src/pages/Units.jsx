import { useEffect, useState } from "react";
import api from "../services/api";

function Units() {

    const [units, setUnits] = useState([]);

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const response = await api.get("property/units/");
            setUnits(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Units</h1>

            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Unit Number</th>
                        <th>Estate</th>
                        <th>Type</th>
                        <th>Rent</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {units.map((unit) => (
                        <tr key={unit.id}>
                            <td>{unit.unit_number}</td>
                            <td>{unit.estate_name}</td>
                            <td>{unit.unit_type}</td>
                            <td>KES {unit.rent_amount}</td>
                            <td>{unit.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

export default Units;