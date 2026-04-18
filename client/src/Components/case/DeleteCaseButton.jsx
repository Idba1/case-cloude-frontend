import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

const DeleteCaseButton = ({
  caseId,
  caseTitle = "this case",
  className = "btn btn-outline btn-error",
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`http://localhost:5000/case/${caseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the case.");
      }

      toast.success("Case deleted successfully.");
      setIsConfirmOpen(false);

      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      toast.error(error.message || "Could not delete the case.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setIsConfirmOpen(true)}
      >
        Delete
      </button>

      {isConfirmOpen ? (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-md rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-100">
                Confirm Delete
              </p>
              <h3 className="mt-2 text-2xl font-black">Delete this case?</h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                You are about to permanently remove{" "}
                <span className="font-semibold text-slate-900">{caseTitle}</span>.
                This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn border-0 bg-red-500 text-white hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-backdrop bg-black/40"
            aria-label="Close delete confirmation"
            onClick={() => {
              if (!isDeleting) {
                setIsConfirmOpen(false);
              }
            }}
          />
        </dialog>
      ) : null}
    </>
  );
};

DeleteCaseButton.propTypes = {
  caseId: PropTypes.string.isRequired,
  caseTitle: PropTypes.string,
  className: PropTypes.string,
  onDeleted: PropTypes.func,
};

export default DeleteCaseButton;
