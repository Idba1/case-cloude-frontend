export const AUTH_ACTIVITY_KEY = "casecloud-auth-activity";
export const TRUSTED_DEVICE_KEY = "casecloud-trusted-device";
export const ROLE_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "lawyer", label: "Lawyer" },
  { value: "assistant", label: "Assistant" },
  { value: "support", label: "Support" },
];

export const ROLE_BADGE_STYLES = {
  admin: "bg-slate-900 text-white",
  lawyer: "bg-cyan-100 text-cyan-700",
  client: "bg-emerald-100 text-emerald-700",
  assistant: "bg-violet-100 text-violet-700",
  support: "bg-amber-100 text-amber-700",
};
