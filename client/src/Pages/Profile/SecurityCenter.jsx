import { useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../../Provider/AuthProvider";
import { readAuthActivity, readTrustedDevice, writeAuthActivity, writeTrustedDevice } from "../../lib/authActivity";

const SecurityCenter = () => {
  const { appUser } = useContext(AuthContext);
  const [trustedDevice, setTrustedDevice] = useState(readTrustedDevice);
  const [activity, setActivity] = useState(readAuthActivity);

  const myActivity = useMemo(
    () => activity.filter((item) => item.email === appUser?.email),
    [activity, appUser?.email]
  );

  const toggleTrustedDevice = () => {
    const nextValue = !trustedDevice;
    setTrustedDevice(nextValue);
    writeTrustedDevice(nextValue);
    toast.success(nextValue ? "This device is now trusted." : "Trusted device setting removed.");
  };

  const clearActivity = () => {
    const otherUsersActivity = activity.filter((item) => item.email !== appUser?.email);
    setActivity(otherUsersActivity);
    writeAuthActivity(otherUsersActivity);
    toast.success("Local account activity history cleared for this user.");
  };

  const mockSignOutAllDevices = () => {
    toast.success("All other sessions were marked as signed out on this demo device.");
  };

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Security Center</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Session security, trusted devices, and auth activity
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
            Review local auth activity, simulate secure device preferences, and keep your account access organized.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Security settings</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Trusted device</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep this device marked for quick return sign-ins.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={trustedDevice}
                      onChange={toggleTrustedDevice}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">Auth provider</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {appUser?.role === "admin" ? "Protected static admin account" : "Firebase sign-in session"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn bg-slate-900 text-white hover:bg-slate-800"
                    onClick={mockSignOutAllDevices}
                  >
                    Sign Out Other Devices
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={clearActivity}
                  >
                    Clear Activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Auth activity timeline</h2>
                <p className="text-sm text-slate-500">
                  Recent local login, logout, and session restoration events for this account.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {myActivity.length} entries
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {myActivity.length ? (
                myActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        {item.type}
                      </span>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {item.method} • {item.role}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-slate-500">
                  No local auth activity recorded for this account yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SecurityCenter;
