import PropTypes from "prop-types";
import toast from "react-hot-toast";

const DeleteCaseButton = ({
  caseId,
  caseTitle = "this case",
  className = "btn btn-outline btn-error",
  onDeleted,
}) => {
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${caseTitle}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/case/${caseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the case.");
      }

      toast.success("Case deleted successfully.");

      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      toast.error(error.message || "Could not delete the case.");
    }
  };

  return (
    <button type="button" className={className} onClick={handleDelete}>
      Delete
    </button>
  );
};

DeleteCaseButton.propTypes = {
  caseId: PropTypes.string.isRequired,
  caseTitle: PropTypes.string,
  className: PropTypes.string,
  onDeleted: PropTypes.func,
};

export default DeleteCaseButton;
