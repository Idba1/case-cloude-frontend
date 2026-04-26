import {
  calculateBillingSummary,
  derivePaymentStatus,
  formatCurrency,
  normalizeBilling,
} from "./billing";

export const generateCaseInsightSummary = ({
  caseData,
  statusHistory,
  clientHistory,
}) => {
  const billing = normalizeBilling(caseData.billing);
  const billingSummary = calculateBillingSummary(billing);
  const paymentStatus = derivePaymentStatus(billing);
  const nextAppointment = [...(caseData.appointments || [])]
    .filter((item) => item.status !== "cancelled")
    .sort((firstItem, secondItem) => {
      const firstDate = new Date(
        `${firstItem.date || ""}T${firstItem.time || "00:00"}`
      ).getTime();
      const secondDate = new Date(
        `${secondItem.date || ""}T${secondItem.time || "00:00"}`
      ).getTime();

      return firstDate - secondDate;
    })[0];

  const latestStatus = statusHistory?.[0];

  return [
    `${caseData.title || "This case"} is currently marked as ${caseData.status || "pending"} in the ${caseData.category || "general"} category.`,
    caseData.description
      ? `Summary of matter: ${caseData.description}`
      : "The case summary has not been written in detail yet.",
    caseData.client?.name
      ? `Client on record: ${caseData.client.name}${caseData.client.email ? ` (${caseData.client.email})` : ""}.`
      : "No client identity has been confirmed yet.",
    caseData.lawyer?.name
      ? `Assigned lawyer: ${caseData.lawyer.name}${caseData.lawyer.email ? ` (${caseData.lawyer.email})` : ""}.`
      : "A lawyer has not been assigned yet.",
    latestStatus
      ? `Latest status activity: ${latestStatus.note || "Status updated"} on ${new Date(
          latestStatus.changedAt
        ).toLocaleString()}.`
      : "No status history has been recorded yet.",
    nextAppointment
      ? `Next appointment: ${nextAppointment.title || "Upcoming appointment"} on ${nextAppointment.date || "unscheduled date"} at ${nextAppointment.time || "unspecified time"}.`
      : "No upcoming appointment is scheduled right now.",
    billingSummary.total
      ? `Billing snapshot: invoice total ${formatCurrency(
          billingSummary.total,
          billing.currency
        )}, paid ${formatCurrency(
          billingSummary.amountPaid,
          billing.currency
        )}, outstanding ${formatCurrency(
          billingSummary.outstanding,
          billing.currency
        )}, payment status ${paymentStatus}.`
      : "No invoice has been prepared for this case yet.",
    caseData.notes?.length
      ? `Internal team notes recorded: ${caseData.notes.length}.`
      : "There are no internal case notes yet.",
    clientHistory?.length
      ? `This client has ${clientHistory.length} other related case${clientHistory.length === 1 ? "" : "s"} in the system.`
      : "There are no other related client matters on record.",
  ].join(" ");
};
