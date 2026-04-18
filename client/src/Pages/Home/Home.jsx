import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Case Organization",
    description:
      "Manage legal matters with structured case records, client details, timelines, and notes in one dashboard.",
  },
  {
    title: "Secure Collaboration",
    description:
      "Lawyers, assistants, and clients can stay aligned through role-based access and organized case updates.",
  },
  {
    title: "Reports and Tracking",
    description:
      "Monitor case progress, review status updates, and export professional case information when needed.",
  },
];

const Home = () => {
  return (
    <div className="bg-slate-100">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#164e63)] px-4 py-20 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
              CaseCloud
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              A cleaner legal workspace for clients and law teams
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
              CaseCloud helps legal teams organize cases, track progress, maintain
              client records, and keep everything easier to access from one modern
              platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="btn border-0 bg-white text-slate-900 hover:bg-slate-100"
              >
                Login to Dashboard
              </Link>
              <Link
                to="/registration"
                className="btn border border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
                Built for clients and legal teams
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-black">Case</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Creation, updates, status tracking, reports
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-black">Client</p>
                  <p className="mt-2 text-sm text-slate-200">
                    History, details, notes, and case-related records
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-black">Docs</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Organized references, links, and export-ready summaries
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-black">Roles</p>
                  <p className="mt-2 text-sm text-slate-200">
                    A structure that supports lawyers, assistants, and clients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              Platform Highlights
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Everything feels easier when legal work is structured well
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <h3 className="text-2xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              For Clients
            </p>
            <h2 className="mt-3 text-3xl font-black">See clarity instead of confusion</h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              Clients should be able to understand case progress, review shared
              information, and stay informed without digging through scattered updates.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              For Legal Teams
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">
              Keep internal work inside the dashboard
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Case management tools, full case lists, editing options, reports, and
              sensitive legal details belong inside the dashboard experience, not on the
              public-facing homepage.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/cases"
                className="btn bg-slate-900 text-white hover:bg-slate-800"
              >
                Open Case Dashboard
              </Link>
              <Link to="/add-case" className="btn btn-outline">
                Create a Case
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
