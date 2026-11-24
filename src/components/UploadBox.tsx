"use client";

import { useRef, useState } from "react";
import { SAMPLE_DOC } from "@/lib/sample";

type Props = {
  onUploaded: () => void;
};

export default function UploadBox({ onUploaded }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(form: FormData) {
    setBusy(true);
    setStatus("Memproses dokumen…");
    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("");
      onUploaded();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Gagal mengunggah dokumen");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      await upload(form);
    }
  }

  async function uploadText(name: string, content: string) {
    const form = new FormData();
    form.append("name", name);
    form.append("text", content);
    await upload(form);
    setText("");
  }

  // efek spotlight yang ngikutin kursor
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <section className="intake">
      <h1>Tanya apa saja dari dokumenmu.</h1>
      <p className="lede">
        Unggah PDF atau teks. Setiap jawaban disertai rujukan ke kutipan aslinya, jadi kamu bisa
        memeriksanya sendiri.
      </p>

      <div
        className={`box ${dragging ? "drag" : ""}`}
        onPointerMove={handlePointerMove}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tempel teks di sini, atau seret / pilih file .pdf, .txt, .md"
          aria-label="Teks dokumen"
        />
        <div className="row">
          <div className="l">
            <button className="btn" disabled={busy} onClick={() => fileInput.current?.click()}>
              Pilih file
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => uploadText(SAMPLE_DOC.name, SAMPLE_DOC.text)}
            >
              Pakai dokumen contoh
            </button>
          </div>
          <button
            className="btn primary"
            disabled={busy || !text.trim()}
            onClick={() => uploadText("Teks tempelan", text)}
          >
            Tambah dokumen
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.txt,.md,text/plain"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="status" role="status">
        {status}
      </p>
    </section>
  );
}
