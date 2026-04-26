import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import DeleteCaseButton from "./DeleteCaseButton";
import UpdateCase from "./UpdateCase";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";
import {
  calculateBillingSummary,
  createDefaultBilling,
  createInvoiceItem,
  createPaymentEntry,
  derivePaymentStatus,
  formatCurrency,
  normalizeBilling,
} from "../../lib/billing";
import {
  formatFileSize,
  getDocumentDownloadName,
} from "../../lib/documents";
import {
  appendCaseNotification,
  createCaseNotification,
} from "../../lib/notifications";
import { generateCaseInsightSummary } from "../../lib/summaries";

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

const appointmentStatusStyles = {
  scheduled: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const paymentStatusStyles = {
  not_started: "bg-slate-100 text-slate-700",
  unpaid: "bg-amber-100 text-amber-700",
  partial: "bg-sky-100 text-sky-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
};

const createInitialAppointment = () => ({
  title: "",
  date: "",
  time: "",
  location: "",
  type: "consultation",
  status: "scheduled",
  notes: "",
});

const createInitialBillingItem = () => ({
  description: "",
  quantity: 1,
  unitPrice: "",
});

const createInitialPaymentForm = () => ({
  amount: "",
  method: "cash",
  paidAt: "",
  reference: "",
  note: "",
});

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
  const [appointmentForm, setAppointmentForm] = useState(createInitialAppointment());
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [billingItemForm, setBillingItemForm] = useState(createInitialBillingItem());
  const [paymentForm, setPaymentForm] = useState(createInitialPaymentForm());
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isClient = appUser?.role === "client";
  const canReviewRequest = appUser?.role === "admin";

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

        const response = await fetch(apiUrl(`/case/${id}`));

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
        const response = await fetch(apiUrl("/cases"));

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

  const handleStatusUpdate = async (nextStatus) => {
    const historyEntry = {
      status: nextStatus,
      note: `Status changed from ${caseData.status || "unknown"} to ${nextStatus}`,
      changedAt: new Date().toISOString(),
    };

    const nextHistory = [historyEntry, ...statusHistory];
    const updatedCase = {
      ...caseData,
      status: nextStatus,
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "status",
          title: "Case status updated",
          message: historyEntry.note,
          audience: "all",
        })
      ),
      dates: {
        ...caseData.dates,
        updatedAt: historyEntry.changedAt,
      },
    };

    try {
      await persistCaseUpdate(updatedCase);
      setCaseData(updatedCase);
      setStatusHistory(nextHistory);
      writeStoredStatusHistory(caseData._id, nextHistory);
    } catch {
      toast.error("Status updated, but full activity sync failed.");
    }
  };

  const persistCaseUpdate = async (payload, successMessage) => {
    const response = await fetch(apiUrl(`/case/${id}`), {
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
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "note",
          title: "Case note added",
          message: `A new internal note was added to ${caseData.title || "this case"}.`,
          audience: "all",
        })
      ),
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
      "",
      "Billing Snapshot",
      "----------------",
      `Invoice Number: ${billing.invoiceNumber || "Not created"}`,
      `Payment Status: ${paymentStatus}`,
      `Invoice Total: ${formatCurrency(billingSummary.total, billing.currency)}`,
      `Amount Paid: ${formatCurrency(billingSummary.amountPaid, billing.currency)}`,
      `Outstanding: ${formatCurrency(billingSummary.outstanding, billing.currency)}`,
      "",
      "AI Case Summary",
      "---------------",
      caseData.aiSummary?.text || "No AI-style summary generated yet.",
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

  const handleDocumentAction = (file) => {
    try {
      if (file.storageType === "upload" && file.fileUrl) {
        const link = window.document.createElement("a");
        link.href = file.fileUrl;
        link.download = getDocumentDownloadName(file);
        link.click();
        toast.success("Document download started.");
        return;
      }

      if (file.fileUrl) {
        window.open(file.fileUrl, "_blank", "noopener,noreferrer");
        toast.success("External document opened in a new tab.");
        return;
      }

      toast.error("No file is attached to this document yet.");
    } catch {
      toast.error("Could not open or download the document.");
    }
  };

  const handleAppointmentFormChange = (field, value) => {
    setAppointmentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddAppointment = async () => {
    if (!appointmentForm.title.trim() || !appointmentForm.date || !appointmentForm.time) {
      toast.error("Appointment title, date, and time are required.");
      return;
    }

    const nextAppointments = [
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `appointment-${Date.now()}`,
        ...appointmentForm,
        createdAt: new Date().toISOString(),
      },
      ...(Array.isArray(caseData.appointments) ? caseData.appointments : []),
    ];

    const updatedCase = {
      ...caseData,
      appointments: nextAppointments,
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "appointment",
          title: "Appointment scheduled",
          message: `${appointmentForm.title.trim()} was scheduled for ${
            caseData.title || "this case"
          }.`,
          audience: "all",
        })
      ),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    setIsSavingAppointment(true);

    try {
      await persistCaseUpdate(updatedCase, "Appointment scheduled.");
      setCaseData(updatedCase);
      setAppointmentForm(createInitialAppointment());
    } catch (saveError) {
      toast.error(saveError.message || "Could not schedule the appointment.");
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleAppointmentStatusChange = async (appointmentId, nextStatus) => {
    const nextAppointments = (Array.isArray(caseData.appointments) ? caseData.appointments : []).map(
      (item) =>
        item.id === appointmentId
          ? {
              ...item,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : item
    );

    const updatedCase = {
      ...caseData,
      appointments: nextAppointments,
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "appointment",
          title: "Appointment status updated",
          message: `An appointment for ${caseData.title || "this case"} was marked as ${nextStatus}.`,
          audience: "all",
        })
      ),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(updatedCase, "Appointment updated.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not update the appointment.");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const nextAppointments = (Array.isArray(caseData.appointments) ? caseData.appointments : []).filter(
      (item) => item.id !== appointmentId
    );

    const updatedCase = {
      ...caseData,
      appointments: nextAppointments,
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "appointment",
          title: "Appointment removed",
          message: `An appointment was removed from ${caseData.title || "this case"}.`,
          audience: "all",
        })
      ),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(updatedCase, "Appointment removed.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not remove the appointment.");
    }
  };

  const handleDownloadAllFiles = () => {
    const uploadedDocuments = (caseData.documents || []).filter(
      (item) => item.storageType === "upload" && item.fileUrl
    );

    if (!uploadedDocuments.length) {
      toast.error("There are no uploaded files available for download.");
      return;
    }

    uploadedDocuments.forEach((item, index) => {
      window.setTimeout(() => {
        const link = window.document.createElement("a");
        link.href = item.fileUrl;
        link.download = getDocumentDownloadName(item);
        link.click();
      }, index * 200);
    });

    toast.success("All stored case files are being downloaded.");
  };

  const handleBillingFieldChange = (field, value) => {
    setCaseData((current) => ({
      ...current,
      billing: {
        ...normalizeBilling(current?.billing),
        [field]: value,
      },
    }));
  };

  const handleBillingItemFieldChange = (field, value) => {
    setBillingItemForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePaymentFieldChange = (field, value) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveInvoiceSettings = async () => {
    const nextBilling = {
      ...normalizeBilling(caseData.billing),
      invoiceStatus:
        normalizeBilling(caseData.billing).invoiceStatus || "issued",
    };
    const notification = createCaseNotification({
      type: "billing",
      title: "Invoice settings updated",
      message: `Billing details were updated for ${caseData.title || "this case"}.`,
      audience: "all",
    });
    const updatedCase = {
      ...caseData,
      billing: nextBilling,
      notifications: appendCaseNotification(caseData, notification),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    setIsSavingBilling(true);

    try {
      await persistCaseUpdate(updatedCase, "Invoice settings saved.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not save invoice settings.");
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handleAddInvoiceItem = async () => {
    if (!billingItemForm.description.trim()) {
      toast.error("Write an invoice item description first.");
      return;
    }

    const nextBilling = normalizeBilling(caseData.billing);
    nextBilling.items = [
      {
        ...createInvoiceItem(),
        description: billingItemForm.description.trim(),
        quantity: Number(billingItemForm.quantity) || 1,
        unitPrice: Number(billingItemForm.unitPrice) || 0,
      },
      ...nextBilling.items,
    ];

    if (!nextBilling.invoiceStatus || nextBilling.invoiceStatus === "draft") {
      nextBilling.invoiceStatus = "issued";
    }

    const notification = createCaseNotification({
      type: "billing",
      title: "Invoice item added",
      message: `${billingItemForm.description.trim()} was added to the invoice for ${
        caseData.title || "this case"
      }.`,
      audience: "all",
    });

    const updatedCase = {
      ...caseData,
      billing: nextBilling,
      notifications: appendCaseNotification(caseData, notification),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    setIsSavingBilling(true);

    try {
      await persistCaseUpdate(updatedCase, "Invoice item added.");
      setCaseData(updatedCase);
      setBillingItemForm(createInitialBillingItem());
    } catch (saveError) {
      toast.error(saveError.message || "Could not add the invoice item.");
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handleRemoveInvoiceItem = async (itemId) => {
    const nextBilling = normalizeBilling(caseData.billing);
    nextBilling.items = nextBilling.items.filter((item) => item.id !== itemId);

    const updatedCase = {
      ...caseData,
      billing: nextBilling,
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(updatedCase, "Invoice item removed.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not remove the invoice item.");
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paidAt) {
      toast.error("Payment amount and date are required.");
      return;
    }

    const nextBilling = normalizeBilling(caseData.billing);
    nextBilling.payments = [
      {
        ...createPaymentEntry(),
        amount: Number(paymentForm.amount) || 0,
        method: paymentForm.method,
        paidAt: paymentForm.paidAt,
        reference: paymentForm.reference.trim(),
        note: paymentForm.note.trim(),
      },
      ...nextBilling.payments,
    ];
    nextBilling.invoiceStatus = "issued";

    const notification = createCaseNotification({
      type: "payment",
      title: "Payment recorded",
      message: `A payment of ${paymentForm.amount} ${nextBilling.currency} was recorded for ${
        caseData.title || "this case"
      }.`,
      audience: "all",
    });

    const updatedCase = {
      ...caseData,
      billing: nextBilling,
      notifications: appendCaseNotification(caseData, notification),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    setIsSavingBilling(true);

    try {
      await persistCaseUpdate(updatedCase, "Payment recorded.");
      setCaseData(updatedCase);
      setPaymentForm(createInitialPaymentForm());
    } catch (saveError) {
      toast.error(saveError.message || "Could not record the payment.");
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handleGenerateInvoice = () => {
    const billing = normalizeBilling(caseData.billing);
    const billingSummary = calculateBillingSummary(billing);
    const paymentStatus = derivePaymentStatus(billing);
    const invoiceLines = [
      "CaseCloud Invoice",
      "=================",
      `Invoice Number: ${billing.invoiceNumber || "Draft invoice"}`,
      `Case: ${caseData.title || "Untitled case"}`,
      `Case Number: ${caseData.caseNumber || "Not available"}`,
      `Client: ${caseData.client?.name || "Not added"}`,
      `Issued At: ${billing.issuedAt || "Not set"}`,
      `Due Date: ${billing.dueDate || "Not set"}`,
      "",
      "Invoice Items",
      "-------------",
      ...(billing.items.length
        ? billing.items.map(
            (item, index) =>
              `${index + 1}. ${item.description || "No description"} | Qty ${
                item.quantity || 0
              } | ${formatCurrency(item.unitPrice, billing.currency)}`
          )
        : ["No invoice items have been added yet."]),
      "",
      `Subtotal: ${formatCurrency(billingSummary.subtotal, billing.currency)}`,
      `Tax: ${formatCurrency(billingSummary.taxAmount, billing.currency)}`,
      `Discount: ${formatCurrency(billingSummary.discount, billing.currency)}`,
      `Total: ${formatCurrency(billingSummary.total, billing.currency)}`,
      `Amount Paid: ${formatCurrency(billingSummary.amountPaid, billing.currency)}`,
      `Outstanding: ${formatCurrency(billingSummary.outstanding, billing.currency)}`,
      `Payment Status: ${paymentStatus}`,
    ];

    const invoiceBlob = new Blob([invoiceLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const invoiceUrl = URL.createObjectURL(invoiceBlob);
    const invoiceLink = document.createElement("a");
    const sanitizedTitle = (caseData.title || "invoice")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    invoiceLink.href = invoiceUrl;
    invoiceLink.download = `${sanitizedTitle || "invoice"}-invoice.txt`;
    invoiceLink.click();
    URL.revokeObjectURL(invoiceUrl);
    toast.success("Invoice exported.");
  };

  const handleGenerateAiSummary = async () => {
    setIsGeneratingSummary(true);

    const summaryText = generateCaseInsightSummary({
      caseData,
      statusHistory,
      clientHistory,
    });

    const notification = createCaseNotification({
      type: "summary",
      title: "AI-style summary generated",
      message: `A fresh case summary was prepared for ${caseData.title || "this case"}.`,
      audience: "all",
    });

    const updatedCase = {
      ...caseData,
      aiSummary: {
        text: summaryText,
        generatedAt: new Date().toISOString(),
      },
      notifications: appendCaseNotification(caseData, notification),
      dates: {
        ...caseData.dates,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await persistCaseUpdate(updatedCase, "AI-style case summary generated.");
      setCaseData(updatedCase);
    } catch (saveError) {
      toast.error(saveError.message || "Could not generate the summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopyAiSummary = async () => {
    try {
      await navigator.clipboard.writeText(caseData.aiSummary?.text || "");
      toast.success("Case summary copied.");
    } catch {
      toast.error("Could not copy the summary.");
    }
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
      notifications: appendCaseNotification(
        caseData,
        createCaseNotification({
          type: "request",
          title:
            nextRequestStatus === "approved"
              ? "Case request approved"
              : "Case request rejected",
          message:
            nextRequestStatus === "approved"
              ? `${caseData.title || "This case"} was approved and assigned.`
              : `${caseData.title || "This case"} was rejected after review.`,
          audience: "all",
        })
      ),
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

  const sortedAppointments = [...(caseData.appointments || [])].sort((firstItem, secondItem) => {
    const firstDate = new Date(`${firstItem.date || ""}T${firstItem.time || "00:00"}`).getTime();
    const secondDate = new Date(`${secondItem.date || ""}T${secondItem.time || "00:00"}`).getTime();

    return firstDate - secondDate;
  });
  const billing = normalizeBilling(caseData.billing || createDefaultBilling());
  const billingSummary = calculateBillingSummary(billing);
  const paymentStatus = derivePaymentStatus(billing);

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
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Case Summary</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Generate a polished, AI-style case brief using the data already stored in this matter.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn border-0 bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handleGenerateAiSummary}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? "Generating..." : "Generate AI Summary"}
                  </button>
                  {caseData.aiSummary?.text ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCopyAiSummary}
                    >
                      Copy Summary
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                {caseData.aiSummary?.text ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Generated{" "}
                      {caseData.aiSummary.generatedAt
                        ? new Date(caseData.aiSummary.generatedAt).toLocaleString()
                        : "just now"}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {caseData.aiSummary.text}
                    </p>
                  </>
                ) : (
                  <div className="text-sm leading-6 text-slate-500">
                    No AI-style summary has been generated yet. Use the button above to build a concise overview of the case, client, appointments, notes, and billing status.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Billing & Invoice</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Prepare invoice details, add billable items, and monitor payment progress in one place.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      paymentStatusStyles[paymentStatus] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {paymentStatus.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleGenerateInvoice}
                  >
                    Export Invoice
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subtotal</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatCurrency(billingSummary.subtotal, billing.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatCurrency(billingSummary.total, billing.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Paid</p>
                  <p className="mt-2 font-semibold text-emerald-700">
                    {formatCurrency(billingSummary.amountPaid, billing.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outstanding</p>
                  <p className="mt-2 font-semibold text-rose-700">
                    {formatCurrency(billingSummary.outstanding, billing.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Invoice Number</span>
                  <input
                    className="input input-bordered w-full"
                    value={billing.invoiceNumber}
                    onChange={(e) => handleBillingFieldChange("invoiceNumber", e.target.value)}
                    placeholder="INV-2026-001"
                  />
                </label>
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Currency</span>
                  <select
                    className="select select-bordered w-full"
                    value={billing.currency}
                    onChange={(e) => handleBillingFieldChange("currency", e.target.value)}
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Issued Date</span>
                  <input
                    className="input input-bordered w-full"
                    type="date"
                    value={billing.issuedAt}
                    onChange={(e) => handleBillingFieldChange("issuedAt", e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Due Date</span>
                  <input
                    className="input input-bordered w-full"
                    type="date"
                    value={billing.dueDate}
                    onChange={(e) => handleBillingFieldChange("dueDate", e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Tax Rate (%)</span>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="0"
                    value={billing.taxRate}
                    onChange={(e) => handleBillingFieldChange("taxRate", e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="mb-2 text-sm font-semibold text-slate-700">Discount</span>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="0"
                    value={billing.discount}
                    onChange={(e) => handleBillingFieldChange("discount", e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="btn bg-slate-900 text-white hover:bg-slate-800"
                  onClick={handleSaveInvoiceSettings}
                  disabled={isSavingBilling}
                >
                  {isSavingBilling ? "Saving..." : "Save Invoice Settings"}
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-900">Invoice Items</h3>
                  <div className="mt-4 grid gap-3">
                    <input
                      className="input input-bordered w-full"
                      value={billingItemForm.description}
                      onChange={(e) =>
                        handleBillingItemFieldChange("description", e.target.value)
                      }
                      placeholder="Court filing fee"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="input input-bordered w-full"
                        type="number"
                        min="1"
                        value={billingItemForm.quantity}
                        onChange={(e) =>
                          handleBillingItemFieldChange("quantity", e.target.value)
                        }
                        placeholder="Quantity"
                      />
                      <input
                        className="input input-bordered w-full"
                        type="number"
                        min="0"
                        value={billingItemForm.unitPrice}
                        onChange={(e) =>
                          handleBillingItemFieldChange("unitPrice", e.target.value)
                        }
                        placeholder="Unit Price"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn bg-cyan-600 text-white hover:bg-cyan-700"
                      onClick={handleAddInvoiceItem}
                      disabled={isSavingBilling}
                    >
                      Add Invoice Item
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {billing.items.length ? (
                      billing.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.description || "Untitled item"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Qty {item.quantity || 0} •{" "}
                                {formatCurrency(item.unitPrice, billing.currency)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveInvoiceItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
                        No invoice items added yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-900">Payment Tracking</h3>
                  <div className="mt-4 grid gap-3">
                    <input
                      className="input input-bordered w-full"
                      type="number"
                      min="0"
                      value={paymentForm.amount}
                      onChange={(e) => handlePaymentFieldChange("amount", e.target.value)}
                      placeholder="Payment amount"
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="select select-bordered w-full"
                        value={paymentForm.method}
                        onChange={(e) => handlePaymentFieldChange("method", e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="card">Card</option>
                      </select>
                      <input
                        className="input input-bordered w-full"
                        type="date"
                        value={paymentForm.paidAt}
                        onChange={(e) => handlePaymentFieldChange("paidAt", e.target.value)}
                      />
                    </div>
                    <input
                      className="input input-bordered w-full"
                      value={paymentForm.reference}
                      onChange={(e) => handlePaymentFieldChange("reference", e.target.value)}
                      placeholder="Reference / transaction ID"
                    />
                    <input
                      className="input input-bordered w-full"
                      value={paymentForm.note}
                      onChange={(e) => handlePaymentFieldChange("note", e.target.value)}
                      placeholder="Payment note"
                    />
                    <button
                      type="button"
                      className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={handleRecordPayment}
                      disabled={isSavingBilling}
                    >
                      Record Payment
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {billing.payments.length ? (
                      billing.payments.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(item.amount, billing.currency)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {[item.paidAt, item.method, item.reference]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                paymentStatusStyles[paymentStatus] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {paymentStatus.replace("_", " ")}
                            </span>
                          </div>
                          {item.note ? (
                            <p className="mt-3 text-sm text-slate-600">{item.note}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
                        No payments recorded yet.
                      </div>
                    )}
                  </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Documents</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Download stored files or open external document links.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm border-0 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={handleDownloadAllFiles}
                >
                  Download All Files
                </button>
              </div>
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
                        <div className="mt-1 space-y-1 text-sm text-slate-500">
                          <p>
                            {item.storageType === "upload"
                              ? item.fileName || "Stored case document"
                              : item.fileUrl || "No file link added"}
                          </p>
                          {item.storageType === "upload" ? (
                            <p>
                              {item.fileType || "Unknown type"} · {formatFileSize(item.fileSize)}
                            </p>
                          ) : null}
                          <p>
                            {item.storageType === "upload"
                              ? "Stored inside this case record"
                              : "External document link"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDocumentAction(item)}
                        disabled={!item.fileUrl}
                      >
                        {item.storageType === "upload" ? "Download File" : "Open Link"}
                      </button>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Appointments</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Schedule hearings, consultations, follow-ups, and internal meetings.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {sortedAppointments.length} appointment{sortedAppointments.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Title</span>
                    <input
                      className="input input-bordered w-full"
                      value={appointmentForm.title}
                      onChange={(e) => handleAppointmentFormChange("title", e.target.value)}
                      placeholder="Client consultation"
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Type</span>
                    <select
                      className="select select-bordered w-full"
                      value={appointmentForm.type}
                      onChange={(e) => handleAppointmentFormChange("type", e.target.value)}
                    >
                      <option value="consultation">Consultation</option>
                      <option value="hearing">Hearing</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Date</span>
                    <input
                      className="input input-bordered w-full"
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => handleAppointmentFormChange("date", e.target.value)}
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Time</span>
                    <input
                      className="input input-bordered w-full"
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => handleAppointmentFormChange("time", e.target.value)}
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Location</span>
                    <input
                      className="input input-bordered w-full"
                      value={appointmentForm.location}
                      onChange={(e) => handleAppointmentFormChange("location", e.target.value)}
                      placeholder="Courtroom 2 / Zoom / Office"
                    />
                  </label>
                  <label className="form-control">
                    <span className="mb-2 text-sm font-semibold text-slate-700">Notes</span>
                    <input
                      className="input input-bordered w-full"
                      value={appointmentForm.notes}
                      onChange={(e) => handleAppointmentFormChange("notes", e.target.value)}
                      placeholder="Bring signed affidavit"
                    />
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="btn bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handleAddAppointment}
                    disabled={isSavingAppointment}
                  >
                    {isSavingAppointment ? "Saving..." : "Schedule Appointment"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {sortedAppointments.length ? (
                  sortedAppointments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.title || "Untitled appointment"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {[item.date, item.time, item.location].filter(Boolean).join(" · ") ||
                              "No schedule details"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            {item.type || "appointment"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            appointmentStatusStyles[item.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status || "scheduled"}
                        </span>
                      </div>

                      {item.notes ? (
                        <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleAppointmentStatusChange(item.id, "scheduled")}
                        >
                          Mark Scheduled
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleAppointmentStatusChange(item.id, "completed")}
                        >
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => handleAppointmentStatusChange(item.id, "cancelled")}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteAppointment(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No appointments scheduled for this case yet.
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
