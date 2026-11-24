import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "../env";
import type { LLMProvider } from "./index";

export const anthropicLLM: LLMProvider = {
  async *stream({ system, messages }) {
    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

    const stream = client.messages.stream({
      model: requireEnv("LLM_MODEL"),
      max_tokens: 1024,
      system,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  },
};
