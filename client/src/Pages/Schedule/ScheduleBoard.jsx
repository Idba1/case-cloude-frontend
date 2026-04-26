import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { apiUrl } from "../../lib/api";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const appointmentStatusStyles = {
  scheduled: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const rangeOptions = {
  all: "All Upcoming",
  today: "Today",
  week: "This Week",
};

const monthLabel = (date) =>
  date.toLocaleString("en-US", { month: "long", year: "numeric" });


const dayKey = (date) => date.toISOString().split("T")[0];

const createCalendarDays = (cursorDate) => {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const leadingEmptyDays = firstDay.getDay();

  const cells = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};

const ScheduleBoard = () => {
  const { appUser, loading: authLoading } = useContext(AuthContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiUrl("/cases"));

        if (!response.ok) {
          throw new Error("Failed to load appointment schedule.");
        }

        const data = await response.json();
        setCases(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Could not load the schedule.");
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

  const appointmentEntries = useMemo(() => {
    return visibleCases
      .flatMap((caseItem) =>
        (caseItem.appointments || []).map((appointment) => ({
          ...appointment,
          caseId: caseItem._id,
          caseTitle: caseItem.title || "Untitled case",
          caseNumber: caseItem.caseNumber || "No case number",
          clientName: caseItem.client?.name || "Unknown client",
          lawyerName: caseItem.lawyer?.name || "Not assigned",
        }))
      )
      .filter((appointment) => appointment.date)
      .filter((appointment) =>
        typeFilter === "all" ? true : appointment.type === typeFilter
      )
      .filter((appointment) =>
        statusFilter === "all" ? true : appointment.status === statusFilter
      )
      .sort((firstItem, secondItem) => {
        const firstDate = new Date(
          `${firstItem.date || ""}T${firstItem.time || "00:00"}`
        ).getTime();
        const secondDate = new Date(
          `${secondItem.date || ""}T${secondItem.time || "00:00"}`
        ).getTime();

        return firstDate - secondDate;
      });
  }, [visibleCases, statusFilter, typeFilter]);

  const appointmentsByDay = useMemo(() => {
    return appointmentEntries.reduce((accumulator, appointment) => {
      const key = appointment.date;
      accumulator[key] = [...(accumulator[key] || []), appointment];
      return accumulator;
    }, {});
  }, [appointmentEntries]);

  const currentMonthDays = useMemo(
    () => createCalendarDays(currentMonth),
    [currentMonth]
  );

  const monthAppointments = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return appointmentEntries.filter((appointment) => {
      const appointmentDate = new Date(`${appointment.date}T${appointment.time || "00:00"}`);
      return (
        appointmentDate.getFullYear() === year &&
        appointmentDate.getMonth() === month
      );
    });
  }, [appointmentEntries, currentMonth]);

  const upcomingAppointments = appointmentEntries.filter((appointment) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time || "00:00"}`);
    return appointmentDate.getTime() >= Date.now();
  });

  const agendaAppointments = upcomingAppointments.filter((appointment) => {
    if (rangeFilter === "all") {
      return true;
    }

    const now = new Date();
    const appointmentDate = new Date(`${appointment.date}T${appointment.time || "00:00"}`);

    if (rangeFilter === "today") {
      return dayKey(appointmentDate) === dayKey(now);
    }

    if (rangeFilter === "week") {
      const oneWeekFromNow = new Date(now);
      oneWeekFromNow.setDate(now.getDate() + 7);
      return appointmentDate >= now && appointmentDate <= oneWeekFromNow;
    }

    return true;
  });

  const handleExportAgenda = () => {
    const lines = [
      "CaseCloud Schedule Agenda",
      "=========================",
      `Generated: ${new Date().toLocaleString()}`,
      `Range: ${rangeOptions[rangeFilter] || "All Upcoming"}`,
      `Status Filter: ${statusFilter}`,
      "",
      ...(agendaAppointments.length
        ? agendaAppointments.map(
            (appointment, index) =>
              `${index + 1}. ${appointment.date} ${appointment.time || ""} - ${appointment.title || "Untitled appointment"} - ${appointment.caseTitle} - ${appointment.location || "No location"} - ${appointment.status || "scheduled"}`
          )
        : ["No appointments available for the selected range."]),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = downloadUrl;
    link.download = `casecloud-schedule-${rangeFilter}.txt`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="bg-slate-100 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
          Loading schedule...
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
            Your lawyer profile must be approved before you can access the shared schedule.
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
                Schedule Management
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Appointment calendar
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                {role === "client"
                  ? "View your scheduled consultations, hearings, and follow-ups in one clean calendar."
                  : "Track hearings, meetings, and deadlines across your visible cases with a monthly calendar and upcoming agenda."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                {monthAppointments.length} this month
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                {upcomingAppointments.length} upcoming
              </span>
              <button
                type="button"
                className="btn btn-sm border-0 bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => setCurrentMonth(new Date())}
              >
                Go to Today
              </button>
              <button
                type="button"
                className="btn btn-sm border-0 bg-white text-slate-900 hover:bg-slate-100"
                onClick={handleExportAgenda}
              >
                Export Agenda
              </button>
              <button
                type="button"
                className="btn btn-sm border border-white/30 bg-transparent text-white hover:bg-white hover:text-slate-900"
                onClick={handlePrintSchedule}
              >
                Print Schedule
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Visible Cases</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{visibleCases.length}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Appointments This Month</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{monthAppointments.length}</h2>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Upcoming Appointments</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{upcomingAppointments.length}</h2>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    setCurrentMonth(
                      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                    )
                  }
                >
                  Previous
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                  {monthLabel(currentMonth)}
                </h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    setCurrentMonth(
                      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                    )
                  }
                >
                  Next
                </button>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  className="select select-bordered w-full md:w-52"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="consultation">Consultation</option>
                  <option value="hearing">Hearing</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                </select>

                <select
                  className="select select-bordered w-full md:w-52"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Appointments</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {weekdayLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-3">
              {currentMonthDays.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50"
                    />
                  );
                }

                const itemsForDay = appointmentsByDay[dayKey(date)] || [];
                const isToday = dayKey(date) === dayKey(new Date());

                return (
                  <div
                    key={dayKey(date)}
                    className={`min-h-32 rounded-2xl border p-3 ${
                      isToday
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">{date.getDate()}</p>
                      {itemsForDay.length ? (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {itemsForDay.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      {itemsForDay.slice(0, 3).map((appointment) => (
                        <Link
                          key={appointment.id}
                          to={`/case/${appointment.caseId}`}
                          className="block rounded-xl bg-white px-2 py-2 text-left text-xs shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                        >
                          <p className="font-semibold text-slate-900">
                            {appointment.time || "Time TBD"} · {appointment.title}
                          </p>
                          <p className="mt-1 text-slate-500">{appointment.caseTitle}</p>
                        </Link>
                      ))}
                      {itemsForDay.length > 3 ? (
                        <p className="text-xs font-semibold text-slate-500">
                          +{itemsForDay.length - 3} more
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && !error && monthAppointments.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
                No appointments found for this month.
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Upcoming agenda</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    The next scheduled items across your visible cases.
                  </p>
                </div>
                <select
                  className="select select-bordered w-full md:w-44"
                  value={rangeFilter}
                  onChange={(e) => setRangeFilter(e.target.value)}
                >
                  <option value="all">All Upcoming</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    Loading schedule...
                  </div>
                ) : null}

                {!loading && error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-red-600">
                    {error}
                  </div>
                ) : null}

                {!loading && !error && agendaAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
                    No upcoming appointments yet.
                  </div>
                ) : null}

                {!loading && !error && agendaAppointments.length > 0
                  ? agendaAppointments.slice(0, 8).map((appointment) => (
                      <Link
                        key={appointment.id}
                        to={`/case/${appointment.caseId}`}
                        className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {appointment.title || "Untitled appointment"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {[appointment.date, appointment.time, appointment.location]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {appointment.caseTitle} · {appointment.clientName}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              appointmentStatusStyles[appointment.status] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {appointment.status || "scheduled"}
                          </span>
                        </div>
                      </Link>
                    ))
                  : null}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Schedule tips</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Use the case details page to add or update appointments.</p>
                <p>Completed and cancelled items stay visible, so you keep a reliable schedule history.</p>
                <p>Filter by status to focus on active work or review what has already been completed.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScheduleBoard;
