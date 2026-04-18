import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DeleteCaseButton from "./DeleteCaseButton";
import { AuthContext } from "../../Provider/AuthProvider";

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  ongoing: "bg-sky-100 text-sky-700",
  closed: "bg-emerald-100 text-emerald-700",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-violet-100 text-violet-700",
  high: "bg-rose-100 text-rose-700",
};

const statusRank = {
  pending: 1,
  ongoing: 2,
  closed: 3,
};

const priorityRank = {
  high: 1,
  medium: 2,
  low: 3,
};

const requestStyles = {
  pending_review: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

const Cases = () => {
  const { appUser, loading: authLoading } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [lawyerView, setLawyerView] = useState("all");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/cases");

        if (!response.ok) {
          throw new Error("Failed to load cases.");
        }

        const data = await response.json();
        setCases(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Could not load cases.");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const normalizedSearch = searchText.trim().toLowerCase();
  const role = appUser?.role || "client";
  const userEmail = appUser?.email?.toLowerCase() || "";

  const visibleCases = cases.filter((item) => {
    if (role === "client") {
      return item.client?.email?.toLowerCase() === userEmail;
    }

    if (role === "lawyer" && lawyerView === "mine") {
      return item.lawyer?.email?.toLowerCase() === userEmail;
    }

    return true;
  });

  const clientOptions = Array.from(
    new Set(
      visibleCases
        .map((item) => item.client?.name?.trim())
        .filter(Boolean)
    )
  ).sort((firstClient, secondClient) => firstClient.localeCompare(secondClient));

  const filteredCases = visibleCases
    .filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesClient =
        clientFilter === "all" || item.client?.name?.trim() === clientFilter;
      const searchableText = [
        item.title,
        item.caseNumber,
        item.category,
        item.client?.name,
        item.lawyer?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesClient && matchesSearch;
    })
    .sort((firstCase, secondCase) => {
      if (sortBy === "status") {
        return (
          (statusRank[firstCase.status] || Number.MAX_SAFE_INTEGER) -
          (statusRank[secondCase.status] || Number.MAX_SAFE_INTEGER)
        );
      }

      if (sortBy === "priority") {
        return (
          (priorityRank[firstCase.priority] || Number.MAX_SAFE_INTEGER) -
          (priorityRank[secondCase.priority] || Number.MAX_SAFE_INTEGER)
        );
      }

      const firstDate = new Date(
        firstCase.dates?.updatedAt || firstCase.dates?.createdAt || 0
      ).getTime();
      const secondDate = new Date(
        secondCase.dates?.updatedAt || secondCase.dates?.createdAt || 0
      ).getTime();

      return secondDate - firstDate;
    });

  const stats = {
    total: visibleCases.length,
    pending: visibleCases.filter((item) => item.status === "pending").length,
    ongoing: visibleCases.filter((item) => item.status === "ongoing").length,
    closed: visibleCases.filter((item) => item.status === "closed").length,
  };

  const handleCaseDeleted = (deletedId) => {
    setCases((current) => current.filter((item) => item._id !== deletedId));
  };

  if (authLoading) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">
                Case Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                {role === "client"
                  ? "Your case dashboard"
                  : "Manage your matters from one place"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                {role === "client"
                  ? "Review only the cases assigned to you, follow status updates, and open the details you need."
                  : "Track every case, monitor status distribution, and jump straight into the matter that needs attention next."}
              </p>
            </div>

            {role !== "client" ? (
              <Link
                to="/add-case"
                className="btn border-0 bg-white text-slate-900 hover:bg-slate-100"
              >
                Add New Case
              </Link>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Cases</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{stats.total}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending</p>
            <h2 className="mt-2 text-3xl font-black text-amber-600">{stats.pending}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Ongoing</p>
            <h2 className="mt-2 text-3xl font-black text-sky-600">{stats.ongoing}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Closed</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-600">{stats.closed}</h2>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Browse cases</h2>
              <p className="text-sm text-slate-500">
                {role === "client"
                  ? "Search through your assigned cases by title, case number, category, or lawyer."
                  : "Search by title, case number, category, client, or lawyer."}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="input input-bordered w-full md:w-80"
                type="text"
                placeholder="Search cases..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <select
                className="select select-bordered w-full md:w-48"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="closed">Closed</option>
              </select>

              <select
                className="select select-bordered w-full md:w-56"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clientOptions.map((clientName) => (
                  <option key={clientName} value={clientName}>
                    {clientName}
                  </option>
                ))}
              </select>

              <select
                className="select select-bordered w-full md:w-52"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest</option>
                <option value="status">Sort: Status</option>
                <option value="priority">Sort: Priority</option>
              </select>

              {role === "lawyer" ? (
                <select
                  className="select select-bordered w-full md:w-52"
                  value={lawyerView}
                  onChange={(e) => setLawyerView(e.target.value)}
                >
                  <option value="all">All Cases</option>
                  <option value="mine">My Assigned Cases</option>
                </select>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                Loading cases...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && filteredCases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <h3 className="text-lg font-bold text-slate-900">No cases found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or change the selected status filter.
                </p>
              </div>
            ) : null}

            {!loading && !error && filteredCases.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredCases.map((item) => (
                  <article
                    key={item._id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                          {item.caseNumber || "No case number"}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                          {item.title || "Untitled case"}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            requestStyles[item.requestStatus] ||
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {(item.requestStatus || "approved").replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[item.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status || "unknown"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            priorityStyles[item.priority] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.priority || "medium"} priority
                        </span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">
                      {item.description || "No case summary available yet."}
                    </p>

                    <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Category
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {item.category || "Not added"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Client
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {item.client?.name || "Not added"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Lawyer
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {item.lawyer?.name || "Not assigned"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Timeline events
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {item.timeline?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Matter overview
                      </p>
                      <div className="flex gap-2">
                        {role !== "client" ? (
                          <>
                            <DeleteCaseButton
                              caseId={item._id}
                              caseTitle={item.title}
                              className="btn btn-sm btn-outline btn-error"
                              onDeleted={() => handleCaseDeleted(item._id)}
                            />
                            <Link
                              to={`/case/${item._id}/edit`}
                              className="btn btn-sm btn-outline"
                            >
                              Edit
                            </Link>
                          </>
                        ) : null}
                        <Link
                          to={`/case/${item._id}`}
                          className="btn btn-sm bg-slate-900 text-white hover:bg-slate-800"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Cases;
