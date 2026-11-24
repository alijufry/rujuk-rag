import type { ChatMessage } from "../types";
import { anthropicLLM } from "./anthropic";
import { openaiLLM } from "./openai";

// Semua provider LLM harus ngikutin bentuk ini.
// Mau nambah provider baru? Bikin file baru di folder ini, lalu daftarin di getLLM().
export interface LLMProvider {
  stream(args: { system: string; messages: ChatMessage[] }): AsyncGenerator<string>;
}

export function getLLM(): LLMProvider {
  const name = process.env.LLM_PROVIDER ?? "anthropic";

  switch (name) {
    case "anthropic":
      return anthropicLLM;
    case "openai":
      return openaiLLM;
    default:
      throw new Error(`LLM_PROVIDER "${name}" tidak dikenal. Pilih: anthropic | openai`);
  }
}
