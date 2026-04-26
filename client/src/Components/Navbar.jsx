import { useContext } from "react";
import { AuthContext } from "../Provider/AuthProvider";
import { Link } from "react-router-dom";

const Navbar = () => {
    const { user, appUser, logOut } = useContext(AuthContext);
    const roleLabel = appUser?.role
        ? `${appUser.role.charAt(0).toUpperCase()}${appUser.role.slice(1)}`
        : 'User';
    const isAdmin = appUser?.role === "admin";

    return (
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="navbar mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex-1">
                    <Link to="/" className="flex items-center gap-3">
                        <img className="h-8 w-auto" src="/logo.png" alt="CaseCloud logo" />
                        <span className="text-xl font-black text-slate-900">CaseCloud</span>
                    </Link>
                </div>

                <div className="flex-none gap-2">
                    <ul className="menu menu-horizontal hidden items-center gap-1 px-1 text-sm font-medium text-slate-700 lg:flex">
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/about">About</Link>
                        </li>
                        <li>
                            <Link to="/features">Features</Link>
                        </li>
                        <li>
                            <Link to="/features">Features</Link>
                        </li>
                        <li>
                            <Link to="/contact">Contact</Link>
                        </li>
                        {user ? (
                            <li>
                                <Link to="/cases">Dashboard</Link>
                            </li>
                        ) : null}
                        {!user ? (
                            <>
                                <li>
                                    <Link to="/login">Login</Link>
                                </li>
                                <li>
                                    <Link to="/registration">Register</Link>
                                </li>
                            </>
                        ) : null}
                    </ul>

                    {user ? (
                        <Link
                            to={isAdmin ? "/admin/users" : "/cases"}
                            className="btn hidden border-0 bg-slate-900 text-white hover:bg-slate-800 md:inline-flex"
                        >
                            {isAdmin ? "Admin Panel" : "Open Dashboard"}
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="btn hidden border-0 bg-slate-900 text-white hover:bg-slate-800 md:inline-flex"
                        >
                            Get Started
                        </Link>
                    )}

                    {user ? (
                        <div className="dropdown dropdown-end z-50">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-ghost btn-circle avatar"
                            >
                                <div className="w-10 rounded-full bg-slate-100" title={user?.displayName || "User"}>
                                    {user?.photoURL ? (
                                        <img
                                            referrerPolicy="no-referrer"
                                            alt="User Profile Photo"
                                            src={user.photoURL}
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-sm font-bold text-slate-700">
                                            {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ul
                                tabIndex={0}
                                className="menu menu-sm dropdown-content mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
                            >
                                <li className="pointer-events-none px-3 py-2">
                                    <div className="flex flex-col items-start bg-transparent p-0">
                                        <span className="font-semibold text-slate-900">
                                            {user?.displayName || "CaseCloud User"}
                                        </span>
                                        <span className="text-xs text-slate-500">{user?.email}</span>
                                        <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                                            {roleLabel}
                                        </span>
                                    </div>
                                </li>
                                <li>
                                    <Link to="/cases">Case Dashboard</Link>
                                </li>
                                <li>
                                    <Link to="/schedule">Schedule</Link>
                                </li>
                                <li>
                                    <Link to="/documents">Documents</Link>
                                </li>
                                <li>
                                    <Link to="/notifications">Notifications</Link>
                                </li>
                                <li>
                                    <Link to="/profile">Profile</Link>
                                </li>
                                <li>
                                    <Link to="/security">Security Center</Link>
                                </li>
                                <li>
                                    <Link to="/help-desk">Help Desk</Link>
                                </li>
                                <li>
                                    <Link to="/faq">FAQ</Link>
                                </li>
                                {isAdmin ? (
                                    <li>
                                        <Link to="/admin/users">Admin Panel</Link>
                                    </li>
                                ) : null}
                                <li>
                                    <Link to="/add-case">Create New Case</Link>
                                </li>
                                <li className="mt-2">
                                    <button
                                        onClick={logOut}
                                        className="rounded-xl bg-slate-100 text-center text-slate-700 hover:bg-slate-200"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <div className="dropdown dropdown-end lg:hidden">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.8"
                                    stroke="currentColor"
                                    className="h-6 w-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                    />
                                </svg>
                            </div>
                            <ul
                                tabIndex={0}
                                className="menu menu-sm dropdown-content mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
                            >
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about">About</Link></li>
                                <li><Link to="/features">Features</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/faq">FAQ</Link></li>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/registration">Register</Link></li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
