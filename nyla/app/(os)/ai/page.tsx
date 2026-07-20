"use client";

import { useState } from "react";
import { getLocalGreeting } from "@/lib/date-time";
import { chat, isConfigured } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export default function AI() {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content: `${getLocalGreeting()}, Akshay. I’m ready to think through the business, plan a production, draft a proposal, or help you decide what matters next.`,
    },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!text.trim() || busy) return;
    const question = text.trim();
    setText("");
    setMessages((current) => [
      ...current,
      { role: "user", content: question },
    ]);
    setBusy(true);
    setError("");
    try {
      if (!isConfigured())
        throw new Error("Connect Supabase to enable Nyla’s AI service.");
      const result = await chat(question);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message || result.content },
      ]);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to reach Nyla.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ai-page">
      <aside>
        <div>
          <span>✦</span>
          <h1>Nyla</h1>
          <p>Executive intelligence</p>
        </div>
        <button>＋ New conversation</button>
        <nav>
          <small>RECENT</small>
          <a className="active">Operating priorities</a>
        </nav>
        <footer>
          <b>Context memory</b>
          <span>Private · User isolated</span>
        </footer>
      </aside>
      <div className="chat">
        <header>
          <div>
            <span className="ai-orb">✦</span>
            <div>
              <b>Nyla</b>
              <small>
                <i /> Context aware
              </small>
            </div>
          </div>
          <button>•••</button>
        </header>
        <div className="messages">
          <div className="chat-date">TODAY</div>
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={index}>
              {message.role === "assistant" && <span>✦</span>}
              <p>{message.content}</p>
            </div>
          ))}
          {busy && (
            <div className="message assistant">
              <span>✦</span>
              <p>Thinking through this…</p>
            </div>
          )}
          {error && <div className="chat-error">{error}</div>}
        </div>
        <div className="composer">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Tell Nyla the outcome you need…"
          />
          <div>
            <span>AI responses use your private workspace context.</span>
            <button onClick={send}>↑</button>
          </div>
        </div>
      </div>
    </section>
  );
}
