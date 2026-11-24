import { getEmbeddingProvider } from "@/lib/embeddings";
import { errorResponse } from "@/lib/http";
import { getLLM } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt";
import { getSupabase } from "@/lib/supabase";
import type { ChatMessage, Source, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOP_K = 4;
// Naikin kalau jawaban sering ngawur, turunin kalau terlalu sering "tidak ditemukan".
const MIN_SIMILARITY = 0.2;
const MAX_HISTORY = 6;

type MatchRow = {
  document_name: string;
  content: string;
  similarity: number;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const question: string = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ error: "Pertanyaan tidak boleh kosong" }, { status: 400 });
  }

  const history: ChatMessage[] = (Array.isArray(body?.history) ? body.history : [])
    .filter(
      (m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string"
    )
    .slice(-MAX_HISTORY);

  // 1. cari potongan dokumen yang relevan
  let sources: Source[];
  try {
    const [queryVector] = await getEmbeddingProvider().embed([question], "query");

    const { data, error } = await getSupabase().rpc("match_chunks", {
      query_embedding: queryVector,
      match_count: TOP_K,
    });
    if (error) throw new Error(error.message);

    sources = (data as MatchRow[])
      .filter((row) => row.similarity >= MIN_SIMILARITY)
      .map((row, i) => ({ n: i + 1, documentName: row.document_name, content: row.content }));
  } catch (err) {
    return errorResponse(err);
  }

  // 2. kirim jawaban LLM sebagai stream (satu JSON per baris)
  const system = buildSystemPrompt(sources);
  const messages: ChatMessage[] = [...history, { role: "user", content: question }];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        send({ type: "sources", sources });
        for await (const text of getLLM().stream({ system, messages })) {
          send({ type: "text", text });
        }
      } catch (err) {
        console.error(err);
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Jawaban gagal dibuat",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
