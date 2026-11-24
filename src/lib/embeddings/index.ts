import { openaiEmbeddings } from "./openai";
import { voyageEmbeddings } from "./voyage";

// kind: "document" buat teks yang disimpan, "query" buat pertanyaan user.
// Beberapa provider (contoh Voyage) ngebedain dua-duanya.
export type EmbeddingKind = "document" | "query";

export interface EmbeddingProvider {
  embed(texts: string[], kind: EmbeddingKind): Promise<number[][]>;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const name = process.env.EMBEDDING_PROVIDER ?? "openai";

  switch (name) {
    case "openai":
      return openaiEmbeddings;
    case "voyage":
      return voyageEmbeddings;
    default:
      throw new Error(`EMBEDDING_PROVIDER "${name}" tidak dikenal. Pilih: openai | voyage`);
  }
}

// embed banyak teks sekaligus, dipecah per batch biar ga kena limit API
export async function embedDocuments(texts: string[], batchSize = 64): Promise<number[][]> {
  const provider = getEmbeddingProvider();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    vectors.push(...(await provider.embed(batch, "document")));
  }

  return vectors;
}
