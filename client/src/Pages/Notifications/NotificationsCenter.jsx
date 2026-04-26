import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";
import { buildDerivedNotifications } from "../../lib/notifications";

const NOTIFICATION_READ_KEY = "casecloud-notification-read-state";

const typeStyles = {
  appointment: "bg-sky-100 text-sky-700",
  payment: "bg-rose-100 text-rose-700",
  billing: "bg-violet-100 text-violet-700",
  request: "bg-amber-100 text-amber-700",
  status: "bg-emerald-100 text-emerald-700",
  note: "bg-slate-100 text-slate-700",
  summary: "bg-cyan-100 text-cyan-700",
};

const NotificationsCenter = () => {
  const { appUser } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readState, setReadState] = useState(() => {
    try {
      const rawValue = localStorage.getItem(NOTIFICATION_READ_KEY);
      return rawValue ? JSON.parse(rawValue) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiUrl("/cases"));

        if (!response.ok) {
          throw new Error("Failed to load notifications.");
        }

        const data = await response.json();
        setCases(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Could not load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(readState));
  }, [readState]);

  const role = appUser?.role || "client";
  const userEmail = appUser?.email?.toLowerCase() || "";

  const visibleCases = useMemo(
    () =>
      cases.filter((item) => {
        if (role === "client") {
          return item.client?.email?.toLowerCase() === userEmail;
        }

        if (role === "lawyer") {
          return item.lawyer?.email?.toLowerCase() === userEmail;
        }

        return true;
      }),
    [cases, role, userEmail]
  );

  const notifications = useMemo(() => {
    const entries = [];

    visibleCases.forEach((caseItem) => {
      const storedNotifications = Array.isArray(caseItem.notifications)
        ? caseItem.notifications
        : [];

      [...storedNotifications, ...buildDerivedNotifications(caseItem)].forEach((item) => {
        const id = `${caseItem._id}-${item.id}`;
        const audience = item.audience || "all";
        const visibleToRole =
          audience === "all" ||
          audience === role ||
          (role === "admin" && audience !== "client");

        if (!visibleToRole) {
          return;
        }

        entries.push({
          ...item,
          id,
          caseId: caseItem._id,
          caseTitle: caseItem.title || "Untitled case",
          caseNumber: caseItem.caseNumber || "No case number",
          isRead: Boolean(readState[id]),
        });
      });
    });

    return entries
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem.createdAt || 0).getTime() -
          new Date(firstItem.createdAt || 0).getTime()
      );
  }, [readState, role, typeFilter, visibleCases]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markAsRead = (notificationId) => {
    setReadState((current) => ({
      ...current,
      [notificationId]: true,
    }));
  };

  const markAllAsRead = () => {
    const nextState = { ...readState };
    notifications.forEach((item) => {
      nextState[item.id] = true;
    });
    setReadState(nextState);
  };

  if (loading) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Loading notifications...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center text-rose-600">
          {error}
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
                Notifications Center
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Alerts, case updates, and payment reminders
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Review system-generated updates from your visible cases, including
                appointments, request reviews, payment alerts, and workflow activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="select select-bordered border-white/10 bg-white/10 text-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="appointment">Appointments</option>
                <option value="payment">Payments</option>
                <option value="billing">Billing</option>
                <option value="request">Requests</option>
                <option value="status">Status</option>
                <option value="note">Notes</option>
                <option value="summary">Summaries</option>
              </select>
              <button
                type="button"
                className="btn border-0 bg-white text-slate-900 hover:bg-slate-100"
                onClick={markAllAsRead}
              >
                Mark All Read
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Visible Notifications</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{notifications.length}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Unread Items</p>
            <h2 className="mt-2 text-3xl font-black text-amber-600">{unreadCount}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Cases Covered</p>
            <h2 className="mt-2 text-3xl font-black text-cyan-700">{visibleCases.length}</h2>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-4">
            {notifications.length ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    item.isRead
                      ? "border-slate-200 bg-slate-50"
                      : "border-cyan-200 bg-cyan-50/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            typeStyles[item.type] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.type || "update"}
                        </span>
                        {!item.isRead ? (
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {item.caseNumber} • {item.caseTitle} •{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/case/${item.caseId}`}
                        className="btn btn-sm border-0 bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Open Case
                      </Link>
                      {!item.isRead ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => markAsRead(item.id)}
                        >
                          Mark Read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-slate-500">
                No notifications match the current filter yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsCenter;
