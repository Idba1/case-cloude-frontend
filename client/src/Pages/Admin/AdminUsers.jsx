import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";

const requestStyles = {
  pending_review: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const AdminUsers = () => {
  const { appUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [caseRequests, setCaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, casesResponse] = await Promise.all([
        fetch(apiUrl("/users")),
        fetch(apiUrl("/cases")),
      ]);

      if (!usersResponse.ok) {
        throw new Error("Failed to load users.");
      }

      if (!casesResponse.ok) {
        throw new Error("Failed to load case requests.");
      }

      const usersData = await usersResponse.json();
      const casesData = await casesResponse.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCaseRequests(Array.isArray(casesData) ? casesData : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLawyerApproval = async (email, approvalStatus) => {
    try {
      const response = await fetch(apiUrl(`/users/approval/${email}`), {
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
      loadAdminData();
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

  const pendingCaseRequests = caseRequests
    .filter((item) => item.requestStatus === "pending_review")
    .sort((firstItem, secondItem) => {
      const firstDate = new Date(
        firstItem.dates?.updatedAt || firstItem.dates?.createdAt || 0
      ).getTime();
      const secondDate = new Date(
        secondItem.dates?.updatedAt || secondItem.dates?.createdAt || 0
      ).getTime();

      return secondDate - firstDate;
    });

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Manage approvals and requests</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Review pending lawyer registrations and client-submitted case requests from
            one admin workspace.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Lawyer Approvals</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{pendingLawyers.length}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Case Requests</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{pendingCaseRequests.length}</h2>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending case requests</h2>
              <p className="text-sm text-slate-500">
                Client-submitted cases stay here until the admin reviews and assigns them.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {pendingCaseRequests.length} pending
            </span>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                Loading case requests...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && pendingCaseRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No pending case requests right now.
              </div>
            ) : null}

            {!loading && !error && pendingCaseRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingCaseRequests.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {item.title || "Untitled case request"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.caseNumber || "No case number"} · {item.category || "No category"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Requested by: {item.requestedBy?.name || item.client?.name || "Unknown"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Email: {item.requestedBy?.email || item.client?.email || "Not provided"}
                        </p>
                        <span
                          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            requestStyles[item.requestStatus] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {(item.requestStatus || "pending_review").replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          to={`/case/${item._id}`}
                          className="btn bg-slate-900 text-white hover:bg-slate-800"
                        >
                          Review Request
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
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
