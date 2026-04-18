import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import DeleteCaseButton from "./DeleteCaseButton";
import UpdateCase from "./UpdateCase";
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

const STATUS_HISTORY_KEY = "case-status-history";
const requestStyles = {
  pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const CaseDetails = () => {
  const { appUser } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [assignment, setAssignment] = useState({ name: "", email: "" });
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isClient = appUser?.role === "client";
  const canReviewRequest = appUser?.role === "lawyer" || appUser?.role === "admin";

  const readStoredStatusHistory = (caseId) => {
    try {
      const rawHistory = localStorage.getItem(STATUS_HISTORY_KEY);
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : {};
      return Array.isArray(parsedHistory[caseId]) ? parsedHistory[caseId] : [];
    } catch {
      return [];
    }
  };

  const writeStoredStatusHistory = (caseId, history) => {
    try {
      const rawHistory = localStorage.getItem(STATUS_HISTORY_KEY);
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : {};
      parsedHistory[caseId] = history;
      localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(parsedHistory));
    } catch {
      // Ignore storage issues so the page still works without local persistence.
    }
  };

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
        setAssignment({
          name: data.lawyer?.name || "",
          email: data.lawyer?.email || "",
        });
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

  useEffect(() => {
    if (!caseData?._id) {
      setStatusHistory([]);
      return;
    }

    const storedHistory = readStoredStatusHistory(caseData._id);

    if (storedHistory.length) {
      setStatusHistory(storedHistory);
      return;
    }

    const initialHistory = [
      {
        status: caseData.status || "pending",
        note: "Initial case status recorded",
        changedAt: caseData.dates?.updatedAt || caseData.dates?.createdAt || new Date().toISOString(),
      },
    ];

    setStatusHistory(initialHistory);
    writeStoredStatusHistory(caseData._id, initialHistory);
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

  const handleStatusUpdate = (nextStatus) => {
    const historyEntry = {
      status: nextStatus,
      note: `Status changed from ${caseData.status || "unknown"} to ${nextStatus}`,
      changedAt: new Date().toISOString(),
    };

    const nextHistory = [historyEntry, ...statusHistory];

    setCaseData((current) => ({
      ...current,
      status: nextStatus,
      dates: {
        ...current.dates,
        updatedAt: historyEntry.changedAt,
      },
    }));
    setStatusHistory(nextHistory);
    writeStoredStatusHistory(caseData._id, nextHistory);
  };

  const persistCaseUpdate = async (payload, successMessage) => {
    const response = await fetch(`http://localhost:5000/case/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to save case changes.");
    }

    if (successMessage) {
      toast.success(successMessage);
    }
  };

  const handleAddNote = async () => {
    const trimmedNote = noteText.trim();

    if (!trimmedNote) {
      toast.error("Write a note before saving.");
      return;
    }

    const nextNotes = [
      {
        text: trimmedNote,
        createdAt: new Date().toISOString(),
      },
      ...(Array.isArray(caseData.notes) ? caseData.notes : []),
    ];

    const updatedCase = {
      ...caseData,
      notes: nextNotes,
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    setIsSavingNote(true);

    try {
      await persistCaseUpdate(updatedCase, "Case note added.");
      setCaseData(updatedCase);
      setNoteText("");
    } catch (saveError) {
      toast.error(saveError.message || "Could not save the case note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteIndex) => {
    const nextNotes = (Array.isArray(caseData.notes) ? caseData.notes : []).filter(
      (_, index) => index !== noteIndex
    );

    const updatedCase = {
      ...caseData,
      notes: nextNotes,
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(updatedCase, "Case note removed.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not remove the case note.");
    }
  };

  const handlePrintCase = () => {
    window.print();
  };

  const handleExportCase = () => {
    const exportPayload = {
      ...caseData,
      exportedAt: new Date().toISOString(),
      statusHistory,
      clientHistory,
    };

    const exportBlob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(exportBlob);
    const downloadLink = document.createElement("a");
    const sanitizedTitle = (caseData.title || "case-details")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    downloadLink.href = downloadUrl;
    downloadLink.download = `${sanitizedTitle || "case-details"}.json`;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleGenerateCaseReport = () => {
    const reportLines = [
      "CaseCloud Case Report",
      "=====================",
      `Title: ${caseData.title || "Untitled case"}`,
      `Case Number: ${caseData.caseNumber || "Not available"}`,
      `Category: ${caseData.category || "Not added"}`,
      `Status: ${caseData.status || "Unknown"}`,
      `Priority: ${caseData.priority || "Medium"}`,
      `Created At: ${
        caseData.dates?.createdAt
          ? new Date(caseData.dates.createdAt).toLocaleString()
          : "Not available"
      }`,
      `Last Updated: ${
        caseData.dates?.updatedAt
          ? new Date(caseData.dates.updatedAt).toLocaleString()
          : "Not available"
      }`,
      "",
      "Case Description",
      "----------------",
      caseData.description || "No description added.",
      "",
      "Client Information",
      "------------------",
      `Name: ${caseData.client?.name || "Not added"}`,
      `Email: ${caseData.client?.email || "Not added"}`,
      `Phone: ${caseData.client?.phone || "Not added"}`,
      `Address: ${caseData.client?.address || "Not added"}`,
      "",
      "Assigned Lawyer",
      "---------------",
      `Name: ${caseData.lawyer?.name || "Not assigned"}`,
      `Email: ${caseData.lawyer?.email || "Not added"}`,
      "",
      "Timeline",
      "--------",
      ...(caseData.timeline?.length
        ? caseData.timeline.map(
            (item, index) =>
              `${index + 1}. ${item.date || "No date"} - ${item.event || "No details"}`
          )
        : ["No timeline events added."]),
      "",
      "Case Notes",
      "----------",
      ...(caseData.notes?.length
        ? caseData.notes.map(
            (item, index) =>
              `${index + 1}. ${
                item.createdAt ? new Date(item.createdAt).toLocaleString() : "No date"
              } - ${item.text || "No note text"}`
          )
        : ["No case notes added."]),
      "",
      "Status History",
      "--------------",
      ...(statusHistory.length
        ? statusHistory.map(
            (item, index) =>
              `${index + 1}. ${item.status} - ${
                item.changedAt ? new Date(item.changedAt).toLocaleString() : "No date"
              } - ${item.note || "No activity note"}`
          )
        : ["No status history available."]),
    ];

    const reportBlob = new Blob([reportLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const reportUrl = URL.createObjectURL(reportBlob);
    const reportLink = document.createElement("a");
    const sanitizedTitle = (caseData.title || "case-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    reportLink.href = reportUrl;
    reportLink.download = `${sanitizedTitle || "case-report"}-report.txt`;
    reportLink.click();
    URL.revokeObjectURL(reportUrl);
    toast.success("Case report generated.");
  };

  const handleRequestDecision = async (nextRequestStatus) => {
    if (nextRequestStatus === "approved" && (!assignment.name.trim() || !assignment.email.trim())) {
      toast.error("Assign a lawyer name and email before approving.");
      return;
    }

    const updatedCase = {
      ...caseData,
      requestStatus: nextRequestStatus,
      lawyer:
        nextRequestStatus === "approved"
          ? { name: assignment.name.trim(), email: assignment.email.trim() }
          : caseData.lawyer,
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(
        updatedCase,
        nextRequestStatus === "approved"
          ? "Case request approved."
          : "Case request rejected."
      );
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not update the request status.");
    }
  };

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/cases"
                  className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200"
                >
                  Back to cases
                </Link>
                {!isClient ? (
                  <Link
                    to={`/case/${id}/edit`}
                    className="btn btn-sm border-0 bg-white text-slate-900 hover:bg-slate-100"
                  >
                    Edit Case
                  </Link>
                ) : null}
                {!isClient ? (
                  <DeleteCaseButton
                    caseId={id}
                    caseTitle={caseData?.title}
                    className="btn btn-sm border-0 bg-red-500 text-white hover:bg-red-600"
                    onDeleted={() => navigate("/cases")}
                  />
                ) : null}
                <button
                  type="button"
                  className="btn btn-sm border-0 bg-cyan-500 text-white hover:bg-cyan-600"
                  onClick={handleExportCase}
                >
                  Export Case
                </button>
                <button
                  type="button"
                  className="btn btn-sm border border-white/30 bg-transparent text-white hover:bg-white hover:text-slate-900"
                  onClick={handlePrintCase}
                >
                  Print Case
                </button>
                <button
                  type="button"
                  className="btn btn-sm border-0 bg-amber-400 text-slate-950 hover:bg-amber-300"
                  onClick={handleGenerateCaseReport}
                >
                  Generate Report
                </button>
              </div>
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
                  requestStyles[caseData.requestStatus] || "bg-slate-100 text-slate-700"
                }`}
              >
                {(caseData.requestStatus || "approved").replace("_", " ")}
              </span>
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

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Case notes</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep internal updates, meeting outcomes, and legal observations.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {caseData.notes?.length || 0} note{caseData.notes?.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">
                    Add a case note
                  </span>
                  <textarea
                    className="textarea textarea-bordered min-h-28 w-full"
                    placeholder="Write a new note about this case..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                </label>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="btn bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handleAddNote}
                    disabled={isSavingNote}
                  >
                    {isSavingNote ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {caseData.notes?.length ? (
                  caseData.notes.map((item, index) => (
                    <div
                      key={`${item.createdAt || "note"}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "No date"}
                        </p>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteNote(index)}
                        >
                          Delete Note
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {item.text || "No note text"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No case notes added yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {canReviewRequest && caseData.requestStatus === "pending_review" ? (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Review case request</h2>
                <p className="mt-2 text-sm text-slate-500">
                  This client-submitted case is pending review. Assign a lawyer and
                  approve it if the request is valid.
                </p>

                <div className="mt-5 grid gap-4">
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">
                      Assign Lawyer Name
                    </span>
                    <input
                      className="input input-bordered w-full"
                      value={assignment.name}
                      onChange={(e) =>
                        setAssignment((current) => ({ ...current, name: e.target.value }))
                      }
                      placeholder="Assigned lawyer name"
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">
                      Assign Lawyer Email
                    </span>
                    <input
                      className="input input-bordered w-full"
                      type="email"
                      value={assignment.email}
                      onChange={(e) =>
                        setAssignment((current) => ({ ...current, email: e.target.value }))
                      }
                      placeholder="lawyer@example.com"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => handleRequestDecision("approved")}
                  >
                    Approve and Assign
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-error"
                    onClick={() => handleRequestDecision("rejected")}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            ) : null}

            {!isClient ? (
              <UpdateCase
                id={id}
                initialStatus={caseData.status}
                onUpdated={handleStatusUpdate}
              />
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Status tracking</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Follow the case progress and review the latest status activity.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    statusStyles[caseData.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {caseData.status || "unknown"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["pending", "ongoing", "closed"].map((status) => {
                  const isCurrent = caseData.status === status;

                  return (
                    <div
                      key={status}
                      className={`rounded-2xl border px-4 py-4 text-center ${
                        isCurrent
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em]">
                        {isCurrent ? "Current" : "Stage"}
                      </p>
                      <p className="mt-2 text-sm font-semibold capitalize">{status}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                {statusHistory.map((item, index) => (
                  <div
                    key={`${item.changedAt}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusStyles[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {new Date(item.changedAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

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
                    {caseData.requestStatus === "pending_review"
                      ? "Will be assigned after approval"
                      : caseData.lawyer?.name || "Not assigned"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {caseData.requestStatus === "pending_review"
                      ? "Will be assigned after approval"
                      : caseData.lawyer?.email || "Not added"}
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
