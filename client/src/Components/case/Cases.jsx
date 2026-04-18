import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Cases = () => {
    const [cases, setCases] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/cases")
            .then((res) => res.json())
            .then((data) => setCases(data));
    }, []);

    return (
        <div>
            <h2>All Cases</h2>

            {cases.map((c) => (
                <div key={c._id} style={{ border: "1px solid gray", margin: "10px" }}>
                    <h3>{c.title}</h3>
                    <p>Status: {c.status}</p>

                    <Link to={`/case/${c._id}`}>View Details</Link>
                </div>
            ))}
        </div>
    );
};

export default Cases;