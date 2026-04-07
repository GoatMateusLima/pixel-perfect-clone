import { invokeApiProxy as invokeRemoteProxy } from "@/lib/apiProxy";
import supabase from "../../utils/supabase";

export type ApiProxyChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | any[];
};

/** Função auxiliar para delay */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function invokeApiProxy<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    if (action === "youtube_playlist") {
      const key = import.meta.env.VITE_YOUTUBE_API_KEY;
      const params = new URLSearchParams({
        part: "snippet",
        maxResults: "50",
        playlistId: String(payload.playlistId ?? ""),
        key: key?.trim() || "",
      });
      if (payload.pageToken) params.set("pageToken", String(payload.pageToken));
      
      const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
      const data = await r.json();
      
      if (data.error) throw new Error(data.error.message);

      const videos = (data.items ?? []).map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        nome: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        thumb: item.snippet.thumbnails?.medium?.url ?? "",
        descricao: item.snippet.description ?? "",
      }));
      
      return { data: { videos, nextPageToken: data.nextPageToken ?? null } as any as T, error: null };
    }

    if (action === "klipy_gifs") {
      const key = import.meta.env.VITE_KLIPY_API_KEY;
      const endpoint = payload.featured ? "featured" : "search";
      const params = new URLSearchParams({
        key: key?.trim() || "",
        q: String(payload.q ?? "trending").trim() || "trending",
        limit: "20",
      });
      if (payload.pos) params.set("pos", String(payload.pos));
      
      const r = await fetch(`https://api.klipy.com/v2/${endpoint}?${params}`);
      const data = await r.json();
      return { data: { results: data.results ?? [], next: data.next ?? null } as any as T, error: null };
    }

    if (action === "chat" || action === "admin_quiz_insert") {
      const key = import.meta.env.VITE_AI_KEY;
      const messages: ApiProxyChatMessage[] = (payload.messages as ApiProxyChatMessage[]) || [];
      
      if (action === "admin_quiz_insert") {
        messages.push({ role: "system", content: "Você é um gerador de quizzes. Responda APENAS com um array JSON puro: [{\"id\": 1, \"text\": \"...\", \"options\": [\"a\",\"b\",\"c\",\"d\"], \"correct\": 0}]" });
        messages.push({ role: "user", content: `Gere um quiz de 3 perguntas para a aula: "${payload.aulaNome}". Descrição: "${payload.aulaDesc}"` });
      }

      // LÓGICA DE RETRY (3 tentativas)
      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key?.trim()}` },
          body: JSON.stringify({ 
            model: payload.model ?? "llama-3.1-8b-instant",
            messages: messages,
            temperature: payload.temperature ?? 0.3,
            stream: false 
          }),
        });

        if (r.status === 429) {
          console.warn(`[apiProxy] Groq 429 (Rate Limit). Tentativa ${attempt}/3. Esperando 3s...`);
          await delay(3000 * attempt); // Espera 3s, depois 6s...
          continue;
        }

        const res = await r.json();
        if (res.error) {
          lastError = new Error(res.error.message);
          if (r.status === 400) break; // Erro de sintaxe não adianta tentar de novo
          continue;
        }
        
          if (action === "admin_quiz_insert") {
            const text = res.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() || "[]";
            const questions = JSON.parse(text);
            const { error: insErr } = await supabase.from("quizzes").insert({ aula_id: payload.aulaId, questions });
            if (insErr) throw insErr;
            return { data: { ok: true } as any as T, error: null };
          }

        return { data: { reply: res.choices?.[0]?.message?.content || "", raw: res } as any as T, error: null };
      }
      
      throw lastError || new Error("Falha após várias tentativas com o Groq.");
    }

    if (action === "quiz_tab" || action === "moderate_text" || action === "moderate_vision" || action === "admin_bulk_quiz") {
      const { data, error } = await supabase.functions.invoke("api-proxy", {
        body: { action, ...payload },
      });
      if (error) throw error;
      return { data: data as T, error: null };
    }

    return { data: null, error: new Error(`Unknown action: ${action}`) };
  } catch (e) {
    console.error(`[apiProxy] Erro na ação '${action}':`, e);
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
  const { data, error } = await invokeApiProxy<{ reply?: string }>("chat", {
    model: params.model ?? "llama-3.1-8b-instant",
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    ...(params.max_tokens != null ? { max_tokens: params.max_tokens } : {}),
  });
  if (error || !data?.reply) return null;
  return data.reply;
}
