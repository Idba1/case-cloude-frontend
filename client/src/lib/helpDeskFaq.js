export const helpDeskFaq = [
  {
    id: "case-status",
    question: "How do I track my case status?",
    keywords: ["track", "status", "progress", "case status"],
    answer:
      "Open the Case Dashboard, select your case, and review the Status Tracking section. Clients only see their own cases, while internal roles see the matters assigned to them.",
  },
  {
    id: "documents",
    question: "How can I upload or download case documents?",
    keywords: ["upload", "download", "document", "file"],
    answer:
      "Use the case form to attach stored files or external links. Later, open the case details page or the Documents Center to download stored files or open linked resources.",
  },
  {
    id: "appointments",
    question: "Where do I schedule appointments?",
    keywords: ["appointment", "schedule", "calendar", "meeting", "hearing"],
    answer:
      "Open a case and use the Appointments section to create hearings, consultations, deadlines, or meetings. You can then review everything from the Schedule page.",
  },
  {
    id: "billing",
    question: "How does billing and invoice tracking work?",
    keywords: ["billing", "invoice", "payment", "paid", "due"],
    answer:
      "Each case now has a billing panel where you can add invoice items, set due dates, record payments, and monitor paid, partial, unpaid, or overdue balances.",
  },
  {
    id: "lawyer-approval",
    question: "Why can a lawyer account not access the dashboard yet?",
    keywords: ["lawyer", "approval", "pending", "admin"],
    answer:
      "New lawyer accounts stay in pending approval status until an admin approves them from the Admin Panel. After approval, the internal dashboard becomes available.",
  },
  {
    id: "case-request",
    question: "What happens when a client creates a case request?",
    keywords: ["client", "request", "approve", "pending review"],
    answer:
      "Client-created requests stay in pending review. An admin reviews the request, assigns a lawyer, and then approves or rejects it from the case details page.",
  },
];

export const getHelpDeskReply = (input) => {
  const normalizedInput = input.trim().toLowerCase();

  if (!normalizedInput) {
    return "Ask me about case tracking, documents, appointments, billing, or approvals.";
  }

  const matchedItem = helpDeskFaq.find((item) =>
    item.keywords.some((keyword) => normalizedInput.includes(keyword))
  );

  return (
    matchedItem?.answer ||
    "I could not find an exact FAQ match for that. Try asking about case status, documents, appointments, billing, or admin approval."
  );
};
