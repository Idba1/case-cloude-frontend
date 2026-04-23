import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";
import {
  formatFileSize,
  getDocumentDownloadName,
} from "../../lib/documents";

const storageLabels = {
  upload: "Stored File",
  link: "External Link",
};

const DocumentsCenter = () => {
  const { appUser, loading: authLoading } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [storageFilter, setStorageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiUrl("/cases"));

        if (!response.ok) {
          throw new Error("Failed to load documents.");
        }

        const data = await response.json();
        setCases(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Could not load document center.");
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const role = appUser?.role || "client";
  const userEmail = appUser?.email?.toLowerCase() || "";
  const lawyerPendingApproval =
    role === "lawyer" && appUser?.approvalStatus !== "approved";

  const visibleCases = useMemo(() => {
    return cases.filter((item) => {
      if (role === "client") {
        return item.client?.email?.toLowerCase() === userEmail;
      }

      if (role === "lawyer") {
        return item.lawyer?.email?.toLowerCase() === userEmail;
      }

      return true;
    });
  }, [cases, role, userEmail]);

  const documents = useMemo(() => {
    return visibleCases
      .flatMap((caseItem) =>
        (caseItem.documents || []).map((document, index) => ({
          ...document,
          id: document.id || `${caseItem._id}-doc-${index}`,
          caseId: caseItem._id,
          caseTitle: caseItem.title || "Untitled case",
          caseNumber: caseItem.caseNumber || "No case number",
          clientName: caseItem.client?.name || "Unknown client",
          lawyerName: caseItem.lawyer?.name || "Not assigned",
        }))
      )
      .filter((document) => document.name || document.fileUrl);
  }, [visibleCases]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return documents
      .filter((document) => {
        const matchesStorage =
          storageFilter === "all" ? true : document.storageType === storageFilter;

        const searchableText = [
          document.name,
          document.fileName,
          document.caseTitle,
          document.caseNumber,
          document.clientName,
          document.lawyerName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch || searchableText.includes(normalizedSearch);

        return matchesStorage && matchesSearch;
      })
      .sort((firstDocument, secondDocument) => {
        if (sortBy === "name") {
          return (firstDocument.name || "").localeCompare(secondDocument.name || "");
        }

        if (sortBy === "case") {
          return (firstDocument.caseTitle || "").localeCompare(secondDocument.caseTitle || "");
        }

        const firstDate = new Date(firstDocument.uploadedAt || 0).getTime();
        const secondDate = new Date(secondDocument.uploadedAt || 0).getTime();
        return secondDate - firstDate;
      });
  }, [documents, searchText, storageFilter, sortBy]);

  const stats = {
    total: documents.length,
    uploads: documents.filter((document) => document.storageType === "upload").length,
    links: documents.filter((document) => document.storageType !== "upload").length,
  };

  const handleDocumentAction = (document) => {
    try {
      if (document.storageType === "upload" && document.fileUrl) {
        const link = window.document.createElement("a");
        link.href = document.fileUrl;
        link.download = getDocumentDownloadName(document);
        link.click();
        return;
      }

      if (document.fileUrl) {
        window.open(document.fileUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      // Keep UI simple in this center; the case details page already shows toast feedback.
    }
  };

  const handleExportIndex = () => {
    const lines = [
      "CaseCloud Document Index",
      "========================",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      ...(filteredDocuments.length
        ? filteredDocuments.map(
            (document, index) =>
              `${index + 1}. ${document.name || "Unnamed document"} - ${document.caseTitle} - ${storageLabels[document.storageType] || "External Link"}`
          )
        : ["No documents available for the selected filters."]),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = downloadUrl;
    link.download = "casecloud-document-index.txt";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handlePrintIndex = () => {
    window.print();
  };

  const handleDownloadAllStoredFiles = () => {
    const storedFiles = filteredDocuments.filter(
      (document) => document.storageType === "upload" && document.fileUrl
    );

    storedFiles.forEach((document, index) => {
      window.setTimeout(() => {
        const link = window.document.createElement("a");
        link.href = document.fileUrl;
        link.download = getDocumentDownloadName(document);
        link.click();
      }, index * 180);
    });
  };

  if (authLoading) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Loading documents...
        </div>
      </div>
    );
  }

  if (lawyerPendingApproval) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Lawyer approval pending</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your lawyer profile must be approved before you can access the document center.
          </p>
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
                Document Center
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Browse and access case files
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Search your visible case documents, jump to the linked matter, and download
                stored files from one shared workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn border-0 bg-white text-slate-900 hover:bg-slate-100"
                onClick={handleExportIndex}
              >
                Export Document Index
              </button>
              <button
                type="button"
                className="btn border border-white/30 bg-transparent text-white hover:bg-white hover:text-slate-900"
                onClick={handlePrintIndex}
              >
                Print Index
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Visible Documents</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{stats.total}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Stored Files</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{stats.uploads}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">External Links</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{stats.links}</h2>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Search documents</h2>
              <p className="text-sm text-slate-500">
                Filter by document name, case, client, lawyer, or storage type.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="input input-bordered w-full md:w-80"
                type="text"
                placeholder="Search documents..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <select
                className="select select-bordered w-full md:w-52"
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="upload">Stored Files</option>
                <option value="link">External Links</option>
              </select>

              <select
                className="select select-bordered w-full md:w-52"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest</option>
                <option value="name">Sort: Name</option>
                <option value="case">Sort: Case</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            {!loading && !error && filteredDocuments.length > 0 ? (
              <div className="mb-5 flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDownloadAllStoredFiles}
                >
                  Download All Stored Files
                </button>
              </div>
            ) : null}
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                Loading documents...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No documents found for the selected filters.
              </div>
            ) : null}

            {!loading && !error && filteredDocuments.length > 0 ? (
              <div className="space-y-4">
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-slate-900">
                            {document.name || "Unnamed document"}
                          </p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {storageLabels[document.storageType] || "External Link"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {document.storageType === "upload"
                            ? `${document.fileName || "Stored case file"} · ${formatFileSize(document.fileSize)}`
                            : document.fileUrl || "No link added"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {document.caseTitle} · {document.caseNumber}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Client: {document.clientName} · Lawyer: {document.lawyerName}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleDocumentAction(document)}
                        >
                          {document.storageType === "upload" ? "Download File" : "Open Link"}
                        </button>
                        <Link
                          to={`/case/${document.caseId}`}
                          className="btn bg-slate-900 text-white hover:bg-slate-800"
                        >
                          Open Case
                        </Link>
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

export default DocumentsCenter;
