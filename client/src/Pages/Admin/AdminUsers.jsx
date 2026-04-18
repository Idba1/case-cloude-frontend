import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../../Provider/AuthProvider";

const AdminUsers = () => {
  const { appUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/users");

      if (!response.ok) {
        throw new Error("Failed to load users.");
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLawyerApproval = async (email, approvalStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/users/approval/${email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lawyer approval.");
      }

      toast.success(
        approvalStatus === "approved"
          ? "Lawyer approved successfully."
          : "Lawyer request rejected."
      );
      loadUsers();
    } catch (updateError) {
      toast.error(updateError.message || "Could not update approval.");
    }
  };

  if (appUser?.role !== "admin") {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
          Only the admin can access this page.
        </div>
      </div>
    );
  }

  const pendingLawyers = users.filter(
    (user) => user.role === "lawyer" && user.approvalStatus !== "approved"
  );

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Manage lawyer approvals</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Review pending lawyer registrations and decide who gets approved access to
            the full internal dashboard.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending lawyer requests</h2>
              <p className="text-sm text-slate-500">
                Lawyers must be approved by admin before accessing the dashboard.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {pendingLawyers.length} pending
            </span>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                Loading users...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && pendingLawyers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No pending lawyer approvals right now.
              </div>
            ) : null}

            {!loading && !error && pendingLawyers.length > 0 ? (
              <div className="space-y-4">
                {pendingLawyers.map((user) => (
                  <div
                    key={user.email}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {user.name || "Unnamed lawyer"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                          Status: {user.approvalStatus || "pending"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => handleLawyerApproval(user.email, "approved")}
                        >
                          Approve Lawyer
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-error"
                          onClick={() => handleLawyerApproval(user.email, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminUsers;
