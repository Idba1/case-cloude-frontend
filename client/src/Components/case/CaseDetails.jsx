import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const CaseDetails = () => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/case/${id}`)
            .then((res) => res.json())
            .then((data) => setCaseData(data));
    }, [id]);

    if (!caseData) return <p>Loading...</p>;

    return (
        <div>
            <h2>{caseData.title}</h2>
            <p>{caseData.description}</p>
            <p>Status: {caseData.status}</p>
            <p>Client: {caseData.clientEmail}</p>
        </div>
    );
};

export default CaseDetails;