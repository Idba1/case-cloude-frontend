import { useState } from "react";

const UpdateCase = ({ id }) => {
    const [status, setStatus] = useState("");

    const handleUpdate = () => {
        fetch(`http://localhost:5000/case-status/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        })
            .then((res) => res.json())
            .then(() => alert("Updated!"));
    };

    return (
        <div>
            <select onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="closed">Closed</option>
            </select>

            <button onClick={handleUpdate}>Update</button>
        </div>
    );
};

export default UpdateCase;