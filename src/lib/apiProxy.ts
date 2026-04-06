import supabase from "../../utils/supabase";

export type ApiProxyChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Chama a Edge Function `api-proxy` (Groq/YouTube/Klipy/admin) sem expor API keys no bundle.
 * Requer deploy: `supabase functions deploy api-proxy` + secrets (ver supabase/functions/README.md).
 */
export async function invokeApiProxy<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("api-proxy", {
      body: { action, ...payload },
    });
    if (error) return { data: null, error: error as unknown as Error };
    return { data: data as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/** Chat genérico Groq (Orion, tutor de cursos, recomendações, etc.) */
export async function groqChatCompletion(params: {
  model?: string;
  messages: ApiProxyChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<string | null> {
  // --- FALLBACK LOCAL PARA DESENVOLVIMENTO ---
  const localKey = import.meta.env.VITE_AI_KEY;
  if (import.meta.env.DEV && localKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localKey.trim()}` },
        body: JSON.stringify({ 
          model: params.model ?? "llama-3.1-8b-instant",
          messages: params.messages,
          temperature: params.temperature ?? 0.3,
          ...(params.max_tokens != null ? { max_tokens: params.max_tokens } : {}),
          stream: false 
        }),
      });
      const res = await r.json();
      return res.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.warn("[apiProxy] Falha no fallback local da Groq, tentando proxy...", e);
    }
  }

  const { data, error } = await invokeApiProxy<{ reply?: string }>("chat", {
    model: params.model ?? "llama-3.1-8b-instant",
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    ...(params.max_tokens != null ? { max_tokens: params.max_tokens } : {}),
  });
  if (error || !data?.reply) return null;
  return data.reply;
}
