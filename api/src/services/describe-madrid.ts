import { generateText } from "ai";

import { madridLlm, madridModelId } from "./llm.js";

export async function describeMadrid(): Promise<string> {
  const result = await generateText({
    model: madridLlm.chat(madridModelId),
    system: "You are a concise assistant for a Madrid local-history discovery app.",
    prompt: "Reply with exactly one short sentence describing Madrid.",
  });

  return result.text;
}
