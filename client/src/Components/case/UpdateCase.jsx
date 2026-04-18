import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

const UpdateCase = ({ id, initialStatus = "pending", onUpdated }) => {
  const [status, setStatus] = useState(initialStatus || "pending");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStatus(initialStatus || "pending");
  }, [initialStatus]);

  const handleUpdate = async () => {
    if (!status) {
      toast.error("Please select a status first.");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`http://localhost:5000/case-status/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update case status.");
      }

      toast.success("Case status updated.");

      if (onUpdated) {
        onUpdated(status);
      }
    } catch (error) {
      toast.error(error.message || "Could not update case status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="form-control w-full">
          <span className="mb-2 text-sm font-semibold text-slate-700">
            Update status
          </span>
          <select
            className="select select-bordered w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isUpdating}
          >
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <button
          type="button"
          className="btn bg-slate-900 text-white hover:bg-slate-800"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Save Status"}
        </button>
      </div>
    </div>
  );
};

UpdateCase.propTypes = {
  id: PropTypes.string.isRequired,
  initialStatus: PropTypes.string,
  onUpdated: PropTypes.func,
};

export default UpdateCase;
