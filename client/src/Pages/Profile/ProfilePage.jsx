import { useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Provider/AuthProvider";
import { ROLE_BADGE_STYLES } from "../../constants/auth";

const quickLinksByRole = {
  admin: [
    { label: "Admin Panel", path: "/admin/users" },
    { label: "Case Dashboard", path: "/cases" },
    { label: "Notifications", path: "/notifications" },
  ],
  lawyer: [
    { label: "Case Dashboard", path: "/cases" },
    { label: "Schedule Board", path: "/schedule" },
    { label: "Documents Center", path: "/documents" },
  ],
  assistant: [
    { label: "Case Dashboard", path: "/cases" },
    { label: "Schedule Board", path: "/schedule" },
    { label: "Documents Center", path: "/documents" },
  ],
  support: [
    { label: "Help Desk", path: "/help-desk" },
    { label: "Notifications", path: "/notifications" },
    { label: "Case Dashboard", path: "/cases" },
  ],
  client: [
    { label: "My Cases", path: "/cases" },
    { label: "Schedule Board", path: "/schedule" },
    { label: "Help Desk", path: "/help-desk" },
  ],
};

const ProfilePage = () => {
  const { user, appUser, setAppUser, syncUserProfile } = useContext(AuthContext);
  const [formState, setFormState] = useState({
    name: appUser?.name || user?.displayName || "",
    photo: appUser?.photo || user?.photoURL || "",
    phone: appUser?.phone || "",
    address: appUser?.address || "",
    department: appUser?.department || "",
    bio: appUser?.bio || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const role = appUser?.role || "client";
  const quickLinks = useMemo(() => quickLinksByRole[role] || quickLinksByRole.client, [role]);

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!appUser?.email) {
      toast.error("You need to be signed in first.");
      return;
    }

    const nextProfile = {
      ...appUser,
      ...formState,
    };

    setIsSaving(true);

    try {
      await syncUserProfile(nextProfile);
      setAppUser(nextProfile);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-6 py-8 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Profile Workspace</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Manage your account details and role access
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Keep your personal information updated, review your current role, and jump directly into the tools most relevant to your workspace.
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                ROLE_BADGE_STYLES[role] || "bg-slate-100 text-slate-700"
              }`}
            >
              {role}
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-xl font-bold text-slate-900">Edit profile</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="mb-2 text-sm font-semibold text-slate-700">Full Name</span>
                <input
                  className="input input-bordered w-full"
                  value={formState.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="mb-2 text-sm font-semibold text-slate-700">Photo URL</span>
                <input
                  className="input input-bordered w-full"
                  value={formState.photo}
                  onChange={(e) => handleChange("photo", e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="mb-2 text-sm font-semibold text-slate-700">Phone</span>
                <input
                  className="input input-bordered w-full"
                  value={formState.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+8801..."
                />
              </label>
              <label className="form-control">
                <span className="mb-2 text-sm font-semibold text-slate-700">Department</span>
                <input
                  className="input input-bordered w-full"
                  value={formState.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="Litigation / Support / Client Services"
                />
              </label>
              <label className="form-control md:col-span-2">
                <span className="mb-2 text-sm font-semibold text-slate-700">Address</span>
                <input
                  className="input input-bordered w-full"
                  value={formState.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </label>
              <label className="form-control md:col-span-2">
                <span className="mb-2 text-sm font-semibold text-slate-700">Short Bio</span>
                <textarea
                  className="textarea textarea-bordered min-h-28 w-full"
                  value={formState.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Add a short introduction for this account..."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className="btn bg-slate-900 text-white hover:bg-slate-800"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Account overview</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-2 font-semibold text-slate-900">{appUser?.email || user?.email || "Not available"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval Status</p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">
                    {appUser?.approvalStatus || "approved"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Authentication</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {appUser?.role === "admin" ? "Protected static admin sign-in" : "Firebase-backed authentication"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">Quick access</h2>
                <Link to="/security" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Security Center
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
