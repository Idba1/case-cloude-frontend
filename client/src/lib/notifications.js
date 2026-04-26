import {
  calculateBillingSummary,
  derivePaymentStatus,
  normalizeBilling,
} from "./billing";

export const createCaseNotification = ({
  type,
  title,
  message,
  audience = "all",
}) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `notification-${Date.now()}`,
  type,
  title,
  message,
  audience,
  createdAt: new Date().toISOString(),
});

export const appendCaseNotification = (caseData, notification) => [
  notification,
  ...(Array.isArray(caseData.notifications) ? caseData.notifications : []),
];

export const buildDerivedNotifications = (caseItem) => {
  const derived = [];
  const appointments = Array.isArray(caseItem.appointments) ? caseItem.appointments : [];
  const billing = normalizeBilling(caseItem.billing);
  const billingSummary = calculateBillingSummary(billing);
  const paymentStatus = derivePaymentStatus(billing);

  if (caseItem.requestStatus === "pending_review") {
    derived.push({
      id: `request-${caseItem._id}`,
      type: "request",
      title: "Case request awaiting review",
      message: `${caseItem.title || "Untitled case"} is waiting for admin approval.`,
      createdAt: caseItem.dates?.updatedAt || caseItem.dates?.createdAt || new Date().toISOString(),
      audience: "admin",
      derived: true,
    });
  }

  const nextAppointment = appointments
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

  if (nextAppointment) {
    const appointmentTime = new Date(
      `${nextAppointment.date || ""}T${nextAppointment.time || "00:00"}`
    ).getTime();
    const hoursUntil = (appointmentTime - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil >= 0 && hoursUntil <= 48) {
      derived.push({
        id: `appointment-${caseItem._id}-${nextAppointment.id}`,
        type: "appointment",
        title: "Upcoming appointment",
        message: `${caseItem.title || "Untitled case"} has ${nextAppointment.title || "an appointment"} within the next 48 hours.`,
        createdAt: nextAppointment.updatedAt || nextAppointment.createdAt || new Date().toISOString(),
        audience: "all",
        derived: true,
      });
    }
  }

  if (paymentStatus === "overdue") {
    derived.push({
      id: `payment-${caseItem._id}-overdue`,
      type: "payment",
      title: "Invoice overdue",
      message: `${caseItem.title || "Untitled case"} still has ${billingSummary.outstanding} outstanding after the due date.`,
      createdAt: billing.dueDate,
      audience: "admin",
      derived: true,
    });
  }

  return derived;
};
