const values = [
  "Reduce confusion around case progress and communication",
  "Separate public-facing information from sensitive internal workflow",
  "Give clients, lawyers, assistants, and admin a clearer role-based experience",
  "Support a more organized academic prototype for legal system design",
];

const About = () => {
  return (
    <div className="bg-slate-100 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-8 py-10 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            About CaseCloud
          </p>
          <h1 className="mt-3 text-4xl font-black">Built to make legal workflow feel structured</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-200">
            CaseCloud is a legal case and document organizer designed to support clearer
            communication, better workflow separation, and a more realistic platform
            experience for different user roles.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-black text-slate-900">Why the platform exists</h2>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Legal work often becomes difficult to track when notes, approvals,
              communication, assignments, and client details live in disconnected places.
              CaseCloud brings these parts together with a more deliberate flow.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-black text-slate-900">What the platform values</h2>
            <div className="mt-5 space-y-3">
              {values.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-sm leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
