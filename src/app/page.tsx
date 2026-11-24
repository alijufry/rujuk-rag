"use client";

import { useCallback, useEffect, useState } from "react";
import Background from "@/components/Background";
import Chat from "@/components/Chat";
import UploadBox from "@/components/UploadBox";
import type { DocumentItem } from "@/lib/types";

export default function Home() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocs(data.documents);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  async function removeDoc(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    loadDocs();
  }

  const showUpload = loaded && (docs.length === 0 || adding);

  return (
    <>
      <Background />
      <div className="wrap">
        <header>
          <span className="wm">Rujuk</span>
          {docs.length > 0 && (
            <button className="ghost" onClick={() => setAdding((value) => !value)}>
              {adding ? "Kembali ke chat" : "Tambah dokumen"}
            </button>
          )}
        </header>

        {error && <p className="status">{error}</p>}

        {showUpload && (
          <UploadBox
            onUploaded={() => {
              setAdding(false);
              loadDocs();
            }}
          />
        )}

        {/* Chat tetap di-mount (cuma disembunyiin) biar riwayat chat ga hilang pas nambah dokumen */}
        {docs.length > 0 && (
          <div hidden={showUpload}>
            <Chat docs={docs} onRemoveDoc={removeDoc} />
          </div>
        )}
      </div>
    </>
  );
}
