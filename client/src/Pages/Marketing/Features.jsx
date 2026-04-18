const featureGroups = [
  {
    title: "Case Workflow",
    items: ["Case request submission", "Approval and assignment", "Case updates", "Detailed case view"],
  },
  {
    title: "Client Management",
    items: ["Client information records", "Related case history", "Case notes", "Client-focused visibility"],
  },
  {
    title: "Tracking and Reports",
    items: ["Status timeline", "Sorting and filters", "Export case data", "Generate printable reports"],
  },
];

const Features = () => {
  return (
    <div className="bg-slate-100 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Features
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-900">What CaseCloud helps you do</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
            The platform is designed around a practical legal workflow where public-facing
            information stays separate from internal case operations.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {featureGroups.map((group) => (
            <article
              key={group.title}
              className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-2xl font-black text-slate-900">{group.title}</h2>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Features;
