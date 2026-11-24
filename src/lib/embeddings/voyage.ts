import { requireEnv } from "../env";
import type { EmbeddingProvider } from "./index";

// Cek dokumentasi Voyage buat nama model & dimensinya,
// terus samain angka vector(...) di supabase/schema.sql
export const voyageEmbeddings: EmbeddingProvider = {
  async embed(texts, kind) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${requireEnv("VOYAGE_API_KEY")}`,
      },
      body: JSON.stringify({
        input: texts,
        model: requireEnv("EMBEDDING_MODEL"),
        input_type: kind,
      }),
    });

    if (!res.ok) {
      throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    return json.data.map((item: { embedding: number[] }) => item.embedding);
  },
};
