import { useEffect, useState } from "react";
import api from "../services/api";

function Estates() {

    const [estates, setEstates] = useState([]);

    useEffect(() => {
        fetchEstates();
    }, []);

    const fetchEstates = async () => {
        try {
            const response = await api.get("estates/");
            setEstates(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <h1>Estates</h1>

            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Description</th>
                    </tr>
                </thead>

                <tbody>
                    {estates.map((estate) => (
                        <tr key={estate.id}>
                            <td>{estate.name}</td>
                            <td>{estate.location}</td>
                            <td>{estate.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}

export default Estates;