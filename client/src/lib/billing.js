export const createDefaultBilling = () => ({
  invoiceNumber: "",
  issuedAt: "",
  dueDate: "",
  currency: "BDT",
  taxRate: 0,
  discount: 0,
  invoiceStatus: "draft",
  items: [],
  payments: [],
});

export const createInvoiceItem = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `invoice-item-${Date.now()}`,
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export const createPaymentEntry = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `payment-${Date.now()}`,
  amount: "",
  method: "cash",
  paidAt: "",
  reference: "",
  note: "",
});

export const normalizeBilling = (billing) => {
  const base = billing && typeof billing === "object" ? billing : {};

  return {
    ...createDefaultBilling(),
    ...base,
    items: Array.isArray(base.items) ? base.items : [],
    payments: Array.isArray(base.payments) ? base.payments : [],
  };
};

export const calculateBillingSummary = (billing) => {
  const normalized = normalizeBilling(billing);
  const subtotal = normalized.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const taxAmount = subtotal * ((Number(normalized.taxRate) || 0) / 100);
  const discount = Number(normalized.discount) || 0;
  const total = Math.max(0, subtotal + taxAmount - discount);
  const amountPaid = normalized.payments.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const outstanding = Math.max(0, total - amountPaid);

  return {
    subtotal,
    taxAmount,
    discount,
    total,
    amountPaid,
    outstanding,
  };
};

export const derivePaymentStatus = (billing) => {
  const normalized = normalizeBilling(billing);
  const { total, amountPaid, outstanding } = calculateBillingSummary(normalized);

  if (!total) {
    return "not_started";
  }

  if (outstanding <= 0) {
    return "paid";
  }

  if (amountPaid > 0 && amountPaid < total) {
    return "partial";
  }

  if (
    normalized.dueDate &&
    new Date(normalized.dueDate).getTime() < Date.now()
  ) {
    return "overdue";
  }

  return "unpaid";
};

export const formatCurrency = (amount, currency = "BDT") =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
