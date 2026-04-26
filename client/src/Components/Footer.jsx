import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] md:px-6">
        <div>
          <div className="flex items-center gap-3">
            <img className="h-8 w-auto" src="/logo.png" alt="CaseCloud logo" />
            <span className="text-xl font-black text-slate-900">CaseCloud</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            A legal case and document organizer designed to separate public-facing
            clarity from secure internal legal workflow.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            Explore
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Link to="/" className="block hover:text-cyan-700">Home</Link>
            <Link to="/about" className="block hover:text-cyan-700">About</Link>
            <Link to="/features" className="block hover:text-cyan-700">Features</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            Resources
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Link to="/faq" className="block hover:text-cyan-700">FAQ</Link>
            <Link to="/contact" className="block hover:text-cyan-700">Contact</Link>
            <Link to="/login" className="block hover:text-cyan-700">Login</Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            Internal Access
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Link to="/cases" className="block hover:text-cyan-700">Case Dashboard</Link>
            <Link to="/add-case" className="block hover:text-cyan-700">Create Case</Link>
            <Link to="/admin/users" className="block hover:text-cyan-700">Admin Panel</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p>Copyright 2026 CaseCloud. All rights reserved.</p>
          <p>Designed for a cleaner legal workflow experience.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
