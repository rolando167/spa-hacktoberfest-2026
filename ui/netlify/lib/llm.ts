// Capa de LLM. Toda la app pasa por callTool(): para cambiar de proveedor, cambia solo este archivo.
// Se fuerza el uso de una herramienta, así la respuesta llega como JSON con el esquema que pedimos.
import { env, HttpError } from './http';

export type Tool = { name: string; description: string; input_schema: Record<string, unknown> };

export async function callTool<T>(opts: {
  model: string;
  system: string;
  user: string;
  tool: Tool;
  maxTokens?: number;
}): Promise<T> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      tools: [opts.tool],
      tool_choice: { type: 'tool', name: opts.tool.name },
      messages: [{ role: 'user', content: opts.user }],
    }),
  });
  if (!res.ok) throw new HttpError(502, `LLM ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; input?: unknown }[] };
  const block = data.content.find((c) => c.type === 'tool_use');
  if (!block?.input) throw new HttpError(502, 'El LLM no devolvió la estructura esperada');
  return block.input as T;
}
