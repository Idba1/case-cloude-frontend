import { Link } from "react-router-dom";

const featureCards = [
  {
    eyebrow: "Case Management",
    title: "Organize every matter with clarity",
    description:
      "Track case requests, approvals, timelines, notes, documents, and status changes from one structured dashboard.",
  },
  {
    eyebrow: "Client Experience",
    title: "Help clients feel informed",
    description:
      "Clients can review assigned case updates, understand progress clearly, and avoid confusion around legal communication.",
  },
  {
    eyebrow: "Internal Workflow",
    title: "Support lawyers and assistants",
    description:
      "Internal teams can sort, filter, review, update, assign, export, and manage legal work without scattered spreadsheets.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Client submits a request",
    description:
      "A client creates a case request with the essential issue details and contact information.",
  },
  {
    step: "02",
    title: "Admin reviews and assigns",
    description:
      "Admin reviews pending requests, approves valid ones, and assigns the responsible lawyer.",
  },
  {
    step: "03",
    title: "Team manages the case",
    description:
      "Lawyers and assistants track updates, add notes, manage documents, and keep the workflow organized.",
  },
  {
    step: "04",
    title: "Client stays updated",
    description:
      "The assigned client can view the relevant case information and follow progress from their dashboard.",
  },
];

const testimonials = [
  {
    quote:
      "CaseCloud makes legal work feel far less fragmented. The structure is simple, and the workflow feels readable.",
    author: "Legal Operations Demo",
  },
  {
    quote:
      "The platform separates public information from internal case data in a much cleaner way than the earlier prototype.",
    author: "Client Experience Review",
  },
];

const Home = () => {
  return (
    <div className="bg-slate-100">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_22%),linear-gradient(135deg,#020617,#0f172a_42%,#164e63)] px-4 py-20 text-white md:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
              Legal Case Platform
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              A more professional legal workflow for teams and clients
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              CaseCloud helps legal teams manage requests, assign lawyers, track case
              progress, and keep clients informed through a clean, role-based system
              designed for modern workflow clarity.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/registration"
                className="btn border-0 bg-white text-slate-900 hover:bg-slate-100"
              >
                Get Started
              </Link>
              <Link
                to="/features"
                className="btn border border-white/15 bg-white/5 text-white hover:bg-white hover:text-slate-900"
              >
                Explore Features
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <p className="text-2xl font-black text-white">Role-based</p>
                <p className="mt-1">Separate client, lawyer, assistant, and admin access</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">Structured</p>
                <p className="mt-1">Cases, notes, history, reports, and approvals</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">Practical</p>
                <p className="mt-1">Designed around realistic legal request flow</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">
                Platform Snapshot
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Requests</p>
                  <p className="mt-2 text-3xl font-black">Pending</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Client-submitted requests stay in review until approved by admin.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Access</p>
                  <p className="mt-2 text-3xl font-black">Role-Based</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Each user sees the data and actions relevant to their responsibilities.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Tracking</p>
                  <p className="mt-2 text-3xl font-black">Status</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Follow approvals, case stages, notes, documents, and client history.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Reports</p>
                  <p className="mt-2 text-3xl font-black">Export</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Generate printable, downloadable summaries when work needs to be shared.
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
              Why CaseCloud
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Public-facing clarity, internal workflow discipline
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The public website should feel welcoming and informative, while sensitive
              case operations stay inside the dashboard where they belong.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                  {card.eyebrow}
                </p>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-4 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
              For Clients
            </p>
            <h2 className="mt-4 text-3xl font-black">See progress without confusion</h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              Clients should feel informed, not overwhelmed. CaseCloud gives them a
              cleaner view of assigned matters without exposing internal legal management
              tools that belong to the team.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
              For Legal Teams
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-900">
              Keep review, assignment, and tracking in one place
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Admin approval, lawyer assignment, case updates, internal notes, and
              reporting all stay inside a dashboard that helps the team work with more
              structure and less noise.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/cases"
                className="btn bg-slate-900 text-white hover:bg-slate-800"
              >
                Open Dashboard
              </Link>
              <Link to="/about" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
                A flow that makes legal operations easier to follow
              </h2>
            </div>
            <Link to="/faq" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
              View common questions
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-4xl font-black text-cyan-700">{item.step}</p>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
                Experience
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
                A more trustworthy front door for the product
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                A legal product should not feel chaotic. Better public pages create more
                confidence before users ever enter the internal dashboard.
              </p>
            </div>

            <div className="grid gap-4">
              {testimonials.map((item) => (
                <blockquote
                  key={item.author}
                  className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200"
                >
                  <p className="text-sm leading-7 text-slate-700">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.author}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
