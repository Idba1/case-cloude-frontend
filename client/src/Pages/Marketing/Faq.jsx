const faqs = [
  {
    question: "Who can create cases directly?",
    answer:
      "Clients can submit case requests, while internal legal staff can create and manage approved case records more fully.",
  },
  {
    question: "Can clients see every case in the system?",
    answer:
      "No. Clients should only see the cases relevant to them. Internal teams can access broader case management views depending on their role.",
  },
  {
    question: "Why does lawyer approval matter?",
    answer:
      "Lawyer approval helps keep access controlled, so only reviewed and approved internal users enter the full legal workflow.",
  },
  {
    question: "Does the platform support reports?",
    answer:
      "Yes. CaseCloud supports case export, print actions, and generated report-style summaries for workflow visibility.",
  },
];

const Faq = () => {
  return (
    <div className="bg-slate-100 px-4 py-16 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
            FAQ
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-900">Common questions</h1>
          <p className="mt-4 text-sm leading-8 text-slate-600">
            A few quick answers about how the public site and internal legal dashboard work.
          </p>
        </section>

        <section className="space-y-4">
          {faqs.map((item) => (
            <article
              key={item.question}
              className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <h2 className="text-xl font-bold text-slate-900">{item.question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Faq;
