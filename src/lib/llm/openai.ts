import OpenAI from "openai";
import { requireEnv } from "../env";
import type { LLMProvider } from "./index";

// Kepake juga buat Groq / OpenRouter / Ollama: tinggal isi OPENAI_BASE_URL
export const openaiLLM: LLMProvider = {
  async *stream({ system, messages }) {
    const client = new OpenAI({
      apiKey: requireEnv("OPENAI_API_KEY"),
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    const stream = await client.chat.completions.create({
      model: requireEnv("LLM_MODEL"),
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  },
};
