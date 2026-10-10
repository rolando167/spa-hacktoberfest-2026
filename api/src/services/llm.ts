import { createOpenAI } from "@ai-sdk/openai";

const baseURL = "https://bubbly-vermilion.netbird.apps.buildinmadrid.dev/v1";

// This hackathon endpoint is OpenAI-compatible and does not require a real key.
// The provider still requires a non-empty value when it constructs the request.
export const madridLlm = createOpenAI({
  baseURL,
  apiKey: "not-needed",
});

export const madridModelId = "gemma-4-26b-a4b";
