"use client";

import { useEffect, useState } from "react";
import type { ChatMessage, DocumentItem, Source, StreamEvent } from "@/lib/types";

type Turn = {
  id: number;
  question: string;
  answer: string;
  sources: Source[];
  status: "loading" | "done" | "error";
};

type Props = {
  docs: DocumentItem[];
  onRemoveDoc: (id: string) => void;
};

// ubah "[1]" di teks jawaban jadi tombol yang bisa diklik
function AnswerText({ text, sources, onRef }: { text: string; sources: Source[]; onRef: (n: number) => void }) {
  const parts = text.split(/(\[\d+\])/);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        const n = match ? Number(match[1]) : 0;
        if (n && sources.some((s) => s.n === n)) {
          return (
            <button key={i} className="ref" onClick={() => onRef(n)} aria-label={`Lihat kutipan ${n}`}>
              {n}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  const [open, setOpen] = useState<number[]>([]);

  function toggle(n: number) {
    setOpen((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }

  return (
    <div className="turn">
      <h2 className="q">{turn.question}</h2>

      <div className={`a ${turn.status === "error" ? "err" : ""}`}>
        {turn.status === "loading" && !turn.answer ? (
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <AnswerText text={turn.answer} sources={turn.sources} onRef={toggle} />
        )}
      </div>

      {turn.sources.length > 0 && (
        <div className="src">
          {turn.sources.map((s) => (
            <div key={s.n} className={open.includes(s.n) ? "open" : ""}>
              <button onClick={() => toggle(s.n)}>
                {s.n}  {s.documentName}
              </button>
              <p>{s.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Chat({ docs, onRemoveDoc }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // scroll ke bawah tiap ada teks baru
  useEffect(() => {
    if (turns.length > 0) window.scrollTo({ top: document.body.scrollHeight });
  }, [turns]);

  function patchTurn(id: number, patch: Partial<Turn>) {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function ask(question: string) {
    const id = Date.now();

    // riwayat: 3 tanya-jawab terakhir yang sudah selesai
    const history: ChatMessage[] = turns
      .filter((t) => t.status === "done")
      .slice(-3)
      .flatMap((t) => [
        { role: "user" as const, content: t.question },
        { role: "assistant" as const, content: t.answer },
      ]);

    setTurns((prev) => [...prev, { id, question, answer: "", sources: [], status: "loading" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Jawaban gagal dibuat");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // sisa baris yang belum lengkap

        for (const line of lines) {
          if (!line.trim()) continue;
          const event: StreamEvent = JSON.parse(line);

          if (event.type === "sources") patchTurn(id, { sources: event.sources });
          if (event.type === "text") {
            answer += event.text;
            patchTurn(id, { answer });
          }
          if (event.type === "error") throw new Error(event.message);
        }
      }

      patchTurn(id, { status: "done" });
    } catch (err) {
      patchTurn(id, {
        status: "error",
        answer: err instanceof Error ? err.message : "Jawaban gagal dibuat",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    ask(question);
  }

  return (
    <section>
      <div id="docs">
        {docs.map((doc) => (
          <span key={doc.id} className="chip">
            <b>{doc.name}</b> · {doc.chunks} bagian
            <button onClick={() => onRemoveDoc(doc.id)} aria-label={`Hapus ${doc.name}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      {turns.map((turn) => (
        <TurnView key={turn.id} turn={turn} />
      ))}

      <div className="composer">
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu tentang dokumenmu"
            aria-label="Pertanyaan"
          />
          <button className="btn primary" type="submit" disabled={busy}>
            Kirim
          </button>
        </form>
      </div>
    </section>
  );
}
