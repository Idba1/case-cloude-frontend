const contactCards = [
  {
    title: "General Inquiry",
    body: "Reach out if you want to understand the platform structure, workflow, or project intent.",
    value: "hello@casecloud.com",
  },
  {
    title: "Support Desk",
    body: "For role access questions, workflow confusion, or internal dashboard support, contact the support flow.",
    value: "support@casecloud.com",
  },
  {
    title: "Project Team",
    body: "This academic prototype can also be presented through a guided product demo and feature walkthrough.",
    value: "Mon-Sat, 10:00 AM - 7:00 PM",
  },
];

const Contact = () => {
  return (
    <div className="bg-slate-100 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-8 py-10 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-black">Let the experience feel simple and clear</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-200">
            Good public-facing communication builds trust before users ever enter the
            internal dashboard. This page gives the site a more realistic product presence.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {contactCards.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-2xl font-black text-slate-900">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
              <p className="mt-6 text-sm font-semibold text-cyan-700">{item.value}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Contact;
