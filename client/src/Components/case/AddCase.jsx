import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";
import {
  buildUploadedDocument,
  createLinkDocument,
  formatFileSize,
} from "../../lib/documents";

const initialDocument = createLinkDocument();
const initialTimeline = { date: "", event: "" };

const createInitialFormData = () => ({
  title: "",
  caseNumber: "",
  category: "",
  description: "",
  status: "pending",
  priority: "medium",
  client: { name: "", email: "", phone: "", address: "" },
  lawyer: { name: "", email: "" },
});

const steps = [
  { id: 1, title: "Case", subtitle: "Core case details" },
  { id: 2, title: "People", subtitle: "Client and lawyer info" },
  { id: 3, title: "Extras", subtitle: "Documents and timeline" },
];

const AddCase = () => {
  const { appUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData);
  const [documents, setDocuments] = useState([{ ...initialDocument }]);
  const [timeline, setTimeline] = useState([{ ...initialTimeline }]);
  const [errors, setErrors] = useState({});
  const isClient = appUser?.role === "client";
  const lawyerPendingApproval =
    appUser?.role === "lawyer" && appUser?.approvalStatus !== "approved";

  if (lawyerPendingApproval) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Lawyer approval pending</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your lawyer profile is still waiting for admin approval. You will be able to
            create and manage cases after the approval is completed.
          </p>
        </div>
      </div>
    );
  }

  const validateStep = (currentStep = step) => {
    const nextErrors = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) nextErrors.title = "Case title is required.";
      if (!formData.caseNumber.trim()) nextErrors.caseNumber = "Case number is required.";
      if (!formData.category.trim()) nextErrors.category = "Category is required.";
      if (!formData.description.trim()) nextErrors.description = "Description is required.";
    }

    if (currentStep === 2) {
      if (!formData.client.name.trim()) nextErrors.clientName = "Client name is required.";
      if (!formData.client.email.trim()) nextErrors.clientEmail = "Client email is required.";
      if (!isClient && !formData.lawyer.name.trim()) nextErrors.lawyerName = "Lawyer name is required.";
      if (!isClient && !formData.lawyer.email.trim()) nextErrors.lawyerEmail = "Lawyer email is required.";
    }

    if (currentStep === 3) {
      const hasTimelineEvent = timeline.some(
        (item) => item.date.trim() || item.event.trim()
      );

      if (!hasTimelineEvent) {
        nextErrors.timeline = "Add at least one timeline event before creating the case.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setErrors((current) => ({
      ...current,
      [`${section}${field.charAt(0).toUpperCase()}${field.slice(1)}`]: "",
    }));
  };

  const updateArrayItem = (setter, state, index, field, value) => {
    const copy = state.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    );
    setter(copy);
    setErrors((current) => ({ ...current, timeline: "" }));
  };

  const addItem = (setter, item) => setter((current) => [...current, { ...item }]);

  const removeItem = (setter, index) =>
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const goToNextStep = () => {
    if (!validateStep(step)) {
      toast.error("Please complete the required fields first.");
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      toast.error("Please review the extras section before submitting.");
      return;
    }

    const filteredDocuments = documents.filter(
      (doc) => doc.name.trim() || doc.fileUrl.trim()
    );
    const filteredTimeline = timeline.filter(
      (item) => item.date.trim() || item.event.trim()
    );

    const payload = {
      ...formData,
      dates: { createdAt: new Date().toISOString() },
      documents: filteredDocuments,
      timeline: filteredTimeline,
      billing: {},
      notes: [],
      appointments: [],
      notifications: [],
      requestStatus: isClient ? "pending_review" : "approved",
      requestedBy: {
        name: appUser?.name || appUser?.displayName || formData.client.name,
        email: appUser?.email || formData.client.email,
        role: appUser?.role || "client",
      },
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/case"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create the case.");
      }

      toast.success(
        isClient
          ? "Case request submitted. It is now pending review."
          : "Case created successfully."
      );
      setFormData(createInitialFormData());
      setDocuments([{ ...initialDocument }]);
      setTimeline([{ ...initialTimeline }]);
      setErrors({});
      setStep(1);
      navigate("/cases");
    } catch (error) {
      toast.error(error.message || "Something went wrong while creating the case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (index, file) => {
    if (!file) {
      return;
    }

    try {
      const nextDocument = await buildUploadedDocument(file, documents[index]?.name || "");

      setDocuments((current) =>
        current.map((item, itemIndex) => (itemIndex === index ? nextDocument : item))
      );

      toast.success("Document uploaded and attached to the case.");
    } catch (error) {
      toast.error(error.message || "Could not process the selected file.");
    }
  };

  const handleDocumentUrlChange = (index, value) => {
    setDocuments((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              fileUrl: value,
              storageType: value.trim() ? "link" : item.storageType,
              fileName: value.trim() ? "" : item.fileName,
              fileType: value.trim() ? "" : item.fileType,
              fileSize: value.trim() ? 0 : item.fileSize,
              uploadedAt: value.trim() ? "" : item.uploadedAt,
            }
          : item
      )
    );
  };

  const renderInput = ({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    error,
    textarea = false,
  }) => (
    <label className="form-control w-full">
      <span className="mb-2 text-sm font-semibold text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          className={`textarea textarea-bordered min-h-28 w-full ${
            error ? "textarea-error" : ""
          }`}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      ) : (
        <input
          className={`input input-bordered w-full ${error ? "input-error" : ""}`}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
      {error ? <span className="mt-2 text-sm text-red-500">{error}</span> : null}
    </label>
  );

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-8 text-white shadow-xl md:px-8">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-cyan-200">
            Case Workspace
          </p>
          <h1 className="text-3xl font-black md:text-4xl">Create a new legal case</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            {isClient
              ? "Submit your case request with the essential details. A lawyer or admin will review, assign, and approve it before full processing."
              : "Capture the essential case details first, then attach people, documents, and timeline notes so the matter is ready to track from day one."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Progress</h2>
            <p className="mt-1 text-sm text-slate-500">
              Step {step} of {steps.length}
            </p>

            <div className="mt-6 space-y-4">
              {steps.map((item) => {
                const isActive = item.id === step;
                const isComplete = item.id < step;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStep(item.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        isComplete
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isComplete ? "OK" : item.id}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {step === 1 ? (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Case information</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add the high-level information so this case can be identified fast.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {renderInput({
                      label: "Case Title",
                      name: "title",
                      value: formData.title,
                      placeholder: "Smith vs. Horizon Builders",
                      onChange: handleChange,
                      error: errors.title,
                    })}

                    {renderInput({
                      label: "Case Number",
                      name: "caseNumber",
                      value: formData.caseNumber,
                      placeholder: "CC-2026-0418",
                      onChange: handleChange,
                      error: errors.caseNumber,
                    })}

                    {renderInput({
                      label: "Category",
                      name: "category",
                      value: formData.category,
                      placeholder: "Civil Litigation",
                      onChange: handleChange,
                      error: errors.category,
                    })}

                    <label className="form-control w-full">
                      <span className="mb-2 text-sm font-semibold text-slate-700">Status</span>
                      <select
                        className="select select-bordered w-full"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="pending">Pending</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>

                    <label className="form-control w-full">
                      <span className="mb-2 text-sm font-semibold text-slate-700">Priority</span>
                      <select
                        className="select select-bordered w-full"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>

                  {renderInput({
                    label: "Description",
                    name: "description",
                    value: formData.description,
                    placeholder: "Summarize the dispute, current posture, and key legal concerns.",
                    onChange: handleChange,
                    error: errors.description,
                    textarea: true,
                  })}
                </section>
              ) : null}

              {step === 2 ? (
                <section className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Client and lawyer</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {isClient
                        ? "Add your contact details. Lawyer assignment will be completed after review."
                        : "Keep the key contacts together so follow-up is easier later."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-bold text-slate-900">Client details</h3>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      {renderInput({
                        label: "Client Name",
                        name: "clientName",
                        value: formData.client.name,
                        placeholder: "Client full name",
                        onChange: (e) =>
                          handleNestedChange("client", "name", e.target.value),
                        error: errors.clientName,
                      })}

                      {renderInput({
                        label: "Client Email",
                        name: "clientEmail",
                        type: "email",
                        value: formData.client.email,
                        placeholder: "client@example.com",
                        onChange: (e) =>
                          handleNestedChange("client", "email", e.target.value),
                        error: errors.clientEmail,
                      })}

                      {renderInput({
                        label: "Client Phone",
                        name: "clientPhone",
                        value: formData.client.phone,
                        placeholder: "+8801XXXXXXXXX",
                        onChange: (e) =>
                          handleNestedChange("client", "phone", e.target.value),
                      })}

                      {renderInput({
                        label: "Client Address",
                        name: "clientAddress",
                        value: formData.client.address,
                        placeholder: "Dhaka, Bangladesh",
                        onChange: (e) =>
                          handleNestedChange("client", "address", e.target.value),
                      })}
                    </div>
                  </div>

                  {isClient ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Approval workflow</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Your request will stay in pending review until a lawyer or admin
                        assigns the responsible lawyer and approves the case.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Assigned lawyer</h3>
                      <div className="mt-4 grid gap-5 md:grid-cols-2">
                        {renderInput({
                          label: "Lawyer Name",
                          name: "lawyerName",
                          value: formData.lawyer.name,
                          placeholder: "Assigned lawyer name",
                          onChange: (e) =>
                            handleNestedChange("lawyer", "name", e.target.value),
                          error: errors.lawyerName,
                        })}

                        {renderInput({
                          label: "Lawyer Email",
                          name: "lawyerEmail",
                          type: "email",
                          value: formData.lawyer.email,
                          placeholder: "lawyer@example.com",
                          onChange: (e) =>
                            handleNestedChange("lawyer", "email", e.target.value),
                          error: errors.lawyerEmail,
                        })}
                      </div>
                    </div>
                  )}
                </section>
              ) : null}

              {step === 3 ? (
                <section className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Documents and timeline</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional documents are fine, but add at least one meaningful timeline event.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Documents</h3>
                        <p className="text-sm text-slate-500">
                          Upload files directly or attach external document links.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => addItem(setDocuments, initialDocument)}
                      >
                        Add Document
                      </button>
                    </div>

                    <div className="space-y-4">
                      {documents.map((doc, index) => (
                        <div
                          key={`document-${index}`}
                          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr]"
                        >
                          {renderInput({
                            label: `Document ${index + 1} Name`,
                            name: `document-name-${index}`,
                            value: doc.name,
                            placeholder: "Complaint draft",
                            onChange: (e) =>
                              updateArrayItem(
                                setDocuments,
                                documents,
                                index,
                                "name",
                                e.target.value
                              ),
                          })}

                          {renderInput({
                            label: "File URL",
                            name: `document-url-${index}`,
                            value: doc.fileUrl,
                            placeholder: "https://example.com/file.pdf",
                            onChange: (e) => handleDocumentUrlChange(index, e.target.value),
                          })}

                          <label className="form-control w-full">
                            <span className="mb-2 text-sm font-semibold text-slate-700">
                              Upload file
                            </span>
                            <input
                              className="file-input file-input-bordered w-full"
                              type="file"
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                              onChange={(e) => {
                                handleDocumentUpload(index, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:col-span-2">
                            <div className="text-sm text-slate-600">
                              {doc.storageType === "upload" ? (
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-900">
                                    Stored file: {doc.fileName || "Uploaded document"}
                                  </p>
                                  <p>
                                    {doc.fileType || "Unknown type"} · {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                              ) : (
                                <p>
                                  {doc.fileUrl
                                    ? "External link attached for this document."
                                    : "No uploaded file or link attached yet."}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={documents.length === 1}
                              onClick={() => removeItem(setDocuments, index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Timeline</h3>
                        <p className="text-sm text-slate-500">
                          Track the important case milestones in order.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => addItem(setTimeline, initialTimeline)}
                      >
                        Add Event
                      </button>
                    </div>

                    {errors.timeline ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {errors.timeline}
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {timeline.map((item, index) => (
                        <div
                          key={`timeline-${index}`}
                          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[220px_1fr_auto]"
                        >
                          {renderInput({
                            label: `Event ${index + 1} Date`,
                            name: `timeline-date-${index}`,
                            type: "date",
                            value: item.date,
                            onChange: (e) =>
                              updateArrayItem(
                                setTimeline,
                                timeline,
                                index,
                                "date",
                                e.target.value
                              ),
                          })}

                          {renderInput({
                            label: "Event details",
                            name: `timeline-event-${index}`,
                            value: item.event,
                            placeholder: "Initial hearing scheduled",
                            onChange: (e) =>
                              updateArrayItem(
                                setTimeline,
                                timeline,
                                index,
                                "event",
                                e.target.value
                              ),
                          })}

                          <div className="flex items-end">
                            <button
                              type="button"
                              className="btn btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={timeline.length === 1}
                              onClick={() => removeItem(setTimeline, index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStep((current) => Math.max(current - 1, 1))}
                  disabled={step === 1 || isSubmitting}
                >
                  Back
                </button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {step < 3 ? (
                    <button
                      type="button"
                      className="btn bg-slate-900 text-white hover:bg-slate-800"
                      onClick={goToNextStep}
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn bg-slate-900 text-white hover:bg-slate-800"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? isClient
                          ? "Submitting..."
                          : "Creating..."
                        : isClient
                        ? "Submit Case Request"
                        : "Create Case"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCase;
