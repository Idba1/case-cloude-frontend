import { useMemo, useState } from "react";
import { getHelpDeskReply, helpDeskFaq } from "../../lib/helpDeskFaq";

const HelpDeskChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Welcome to the CaseCloud help desk. Ask me about cases, documents, schedules, billing, or approvals.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const suggestedQuestions = useMemo(
    () => helpDeskFaq.map((item) => item.question),
    []
  );

  const sendMessage = (messageText) => {
    const trimmedValue = messageText.trim();

    if (!trimmedValue) {
      return;
    }

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedValue,
    };
    const nextBotMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: getHelpDeskReply(trimmedValue),
    };

    setMessages((current) => [...current, nextUserMessage, nextBotMessage]);
    setInputValue("");
  };

  return (
    <div className="bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-700">Help Desk</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
            FAQ chatbot for faster support
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This assistant is fully local and FAQ-based. It feels conversational, but
            it uses built-in CaseCloud knowledge only, without any external API.
          </p>

          <div className="mt-6 space-y-3">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Live Chat</p>
              <h2 className="mt-2 text-2xl font-black">CaseCloud Support Bot</h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
              FAQ Online
            </span>
          </div>

          <div className="mt-6 h-[28rem] space-y-4 overflow-y-auto rounded-3xl bg-white/5 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-white text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              className="input input-bordered w-full bg-white text-slate-900"
              placeholder="Ask about billing, documents, schedule, approvals..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(inputValue);
                }
              }}
            />
            <button
              type="button"
              className="btn border-0 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => sendMessage(inputValue)}
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpDeskChatbot;
