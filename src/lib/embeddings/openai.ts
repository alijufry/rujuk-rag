import OpenAI from "openai";
import { requireEnv } from "../env";
import type { EmbeddingProvider } from "./index";

export const openaiEmbeddings: EmbeddingProvider = {
  async embed(texts) {
    const client = new OpenAI({
      apiKey: requireEnv("EMBEDDING_API_KEY"),
      baseURL: process.env.EMBEDDING_BASE_URL || undefined,
    });

    const res = await client.embeddings.create({
      model: requireEnv("EMBEDDING_MODEL"),
      input: texts,
    });

    return res.data.map((item) => item.embedding);
  },
};
