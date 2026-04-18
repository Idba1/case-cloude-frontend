import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UpdateCase from "./UpdateCase";

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

const CaseDetails = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`http://localhost:5000/case/${id}`);

        if (!response.ok) {
          throw new Error("Failed to load case details.");
        }

        const data = await response.json();
        setCaseData(data);
      } catch (fetchError) {
        setError(fetchError.message || "Could not load case details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [id]);

  useEffect(() => {
    const fetchClientHistory = async () => {
      if (!caseData?.client?.email && !caseData?.client?.name) {
        setClientHistory([]);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/cases");

        if (!response.ok) {
          throw new Error("Failed to load client history.");
        }

        const allCases = await response.json();
        const relatedCases = (Array.isArray(allCases) ? allCases : []).filter((item) => {
          if (item._id === caseData._id) return false;

          const sameEmail =
            caseData.client?.email &&
            item.client?.email &&
            item.client.email.toLowerCase() === caseData.client.email.toLowerCase();

          const sameName =
            caseData.client?.name &&
            item.client?.name &&
            item.client.name.toLowerCase() === caseData.client.name.toLowerCase();

          return sameEmail || sameName;
        });

        setClientHistory(relatedCases);
      } catch {
        setClientHistory([]);
      }
    };

    fetchClientHistory();
  }, [caseData]);

  if (loading) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Loading case details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          No case data available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/"
                className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200"
              >
                Back to cases
              </Link>
              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-300">
                {caseData.caseNumber || "No case number"}
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                {caseData.title || "Untitled case"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                {caseData.description || "No description has been added for this case yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  statusStyles[caseData.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {caseData.status || "unknown"}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  priorityStyles[caseData.priority] || "bg-slate-100 text-slate-700"
                }`}
              >
                {caseData.priority || "medium"} priority
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Case summary</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Category
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.category || "Not added"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Created at
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.dates?.createdAt
                      ? new Date(caseData.dates.createdAt).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Timeline</h2>
              <div className="mt-5 space-y-4">
                {caseData.timeline?.length ? (
                  caseData.timeline.map((item, index) => (
                    <div
                      key={`${item.date || "event"}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {item.date || "No date"}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {item.event || "No event details added."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No timeline events added yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Documents</h2>
              <div className="mt-5 space-y-4">
                {caseData.documents?.length ? (
                  caseData.documents.map((item, index) => (
                    <div
                      key={`${item.name || "document"}-${index}`}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name || `Document ${index + 1}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.fileUrl || "No file link added"}
                        </p>
                      </div>

                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline"
                        >
                          Open Link
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No documents attached yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <UpdateCase
              id={id}
              initialStatus={caseData.status}
              onUpdated={(nextStatus) =>
                setCaseData((current) => ({ ...current, status: nextStatus }))
              }
            />

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Client information</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Name</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.client?.name || "Not added"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.client?.email || "Not added"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.client?.phone || "Not added"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.client?.address || "Not added"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Client history</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Other matters connected to this client.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {clientHistory.length} related case{clientHistory.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {clientHistory.length ? (
                  clientHistory.map((item) => (
                    <Link
                      key={item._id}
                      to={`/case/${item._id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {item.caseNumber || "No case number"}
                          </p>
                          <h3 className="mt-2 font-semibold text-slate-900">
                            {item.title || "Untitled case"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.category || "No category"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[item.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status || "unknown"}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No other case history found for this client yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Assigned lawyer</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Name</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.lawyer?.name || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.lawyer?.email || "Not added"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CaseDetails;
