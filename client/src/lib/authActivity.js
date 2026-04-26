import { AUTH_ACTIVITY_KEY, TRUSTED_DEVICE_KEY } from "../constants/auth";

export const readAuthActivity = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_ACTIVITY_KEY);
    return rawValue ? JSON.parse(rawValue) : [];
  } catch {
    return [];
  }
};

export const writeAuthActivity = (activity) => {
  localStorage.setItem(AUTH_ACTIVITY_KEY, JSON.stringify(activity));
};

export const logAuthActivity = ({ type, email, role, method, detail }) => {
  const nextActivity = [
    {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `auth-${Date.now()}`,
      type,
      email,
      role,
      method,
      detail,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
    ...readAuthActivity(),
  ].slice(0, 25);

  writeAuthActivity(nextActivity);
};

export const readTrustedDevice = () => {
  try {
    return localStorage.getItem(TRUSTED_DEVICE_KEY) === "true";
  } catch {
    return false;
  }
};

export const writeTrustedDevice = (value) => {
  localStorage.setItem(TRUSTED_DEVICE_KEY, value ? "true" : "false");
};
