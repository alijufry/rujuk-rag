import { chunkText } from "@/lib/chunk";
import { embedDocuments } from "@/lib/embeddings";
import { errorResponse } from "@/lib/http";
import { pdfToText } from "@/lib/pdf";
import { getSupabase } from "@/lib/supabase";
import type { DocumentItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // PDF besar butuh waktu buat di-embed

const INSERT_BATCH = 100;

// GET /api/documents -> daftar dokumen + jumlah chunk
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("documents")
      .select("id, name, created_at, chunks(count)")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const documents: DocumentItem[] = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      chunks: row.chunks?.[0]?.count ?? 0,
    }));

    return Response.json({ documents });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/documents (multipart): kirim "file", atau "name" + "text"
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    let name: string;
    let text: string;

    if (file instanceof File) {
      name = file.name;
      text = name.toLowerCase().endsWith(".pdf")
        ? await pdfToText(await file.arrayBuffer())
        : await file.text();
    } else {
      name = String(form.get("name") ?? "").trim() || "Teks tempelan";
      text = String(form.get("text") ?? "");
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return Response.json(
        { error: "Dokumen tidak berisi teks yang bisa dibaca (mungkin PDF hasil scan)." },
        { status: 422 }
      );
    }

    const vectors = await embedDocuments(chunks);
    const supabase = getSupabase();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ name })
      .select("id")
      .single();
    if (docError || !doc) throw new Error(docError?.message ?? "Gagal menyimpan dokumen");

    const rows = chunks.map((content, i) => ({
      document_id: doc.id,
      position: i,
      content,
      embedding: vectors[i],
    }));

    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const { error } = await supabase.from("chunks").insert(rows.slice(i, i + INSERT_BATCH));
      if (error) {
        // rollback manual: hapus dokumennya (chunk ikut kehapus karena on delete cascade)
        await supabase.from("documents").delete().eq("id", doc.id);
        throw new Error(error.message);
      }
    }

    return Response.json({ id: doc.id, name, chunks: chunks.length });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/documents?id=...
export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id wajib diisi" }, { status: 400 });

    const { error } = await getSupabase().from("documents").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
