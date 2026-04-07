/** 
 * Proxy de chamadas para APIs externas.
 * Agora realizando requisições DIRETAS do cliente com lógica de RETRY para o Groq.
 */
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
    // ─── AÇÕES LOCAIS (YOUTUBE / GIFS) ───
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

<<<<<<< HEAD
    if (action === "chat" || action === "admin_quiz_insert") {
=======
    // ─── AÇÕES DE IA (DIRETO NO GROQ PARA EVITAR CORS) ───
    if (action === "chat" || action === "admin_quiz_insert" || action === "quiz_tab" || action === "admin_bulk_quiz") {
>>>>>>> 0620fc15a0d3af69c721b95d900a37802beeaaef
      const key = import.meta.env.VITE_AI_KEY;
      const messages: ApiProxyChatMessage[] = (payload.messages as ApiProxyChatMessage[]) || [];
      
      if (action === "admin_quiz_insert") {
        messages.push({ role: "system", content: "Você é um gerador de quizzes. Responda APENAS com um array JSON puro: [{\"id\": 1, \"text\": \"...\", \"options\": [\"a\",\"b\",\"c\",\"d\"], \"correct\": 0}]" });
        messages.push({ role: "user", content: `Gere um quiz de 3 perguntas para a aula: "${payload.aulaNome}". Descrição: "${payload.aulaDesc}"` });
      }

<<<<<<< HEAD
=======
      if (action === "quiz_tab") {
        messages.push({ role: "system", content: "Você é um professor especialista em gerar quizzes educacionais. Responda APENAS com JSON: {\"questions\": [...]}. Sem markdown." });
        messages.push({ role: "user", content: String(payload.prompt || "") });
      }

      if (action === "admin_bulk_quiz") {
        const courseName = String(payload.courseName ?? "");
        const aulas = payload.aulas as { nome: string; descricao: string }[];
        messages.push({ 
          role: "system", 
          content: "Você é um gerador de quizzes em lote. Responda APENAS um objeto JSON onde a CHAVE é o nome exato da aula e o VALOR é um array de 3 questões. Sem markdown." 
        });
        messages.push({ 
          role: "user", 
          content: `Curso: "${courseName}". Aulas:\n${aulas.map(a => `- ${a.nome}`).join("\n")}` 
        });
      }

>>>>>>> 0620fc15a0d3af69c721b95d900a37802beeaaef
      // LÓGICA DE RETRY (3 tentativas)
      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key?.trim()}` },
          body: JSON.stringify({ 
            model: payload.model ?? (action === "admin_bulk_quiz" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant"),
            messages: messages,
            temperature: 0.2,
            stream: false 
          }),
        });

        if (r.status === 429) {
          console.warn(`[apiProxy] Groq 429 (Rate Limit). Tentativa ${attempt}/3...`);
          await delay(3000 * attempt);
          continue;
        }

        const res = await r.json();
        const text = res.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() || "";

        if (action === "admin_quiz_insert") {
          const questions = JSON.parse(text);
          const { error: insErr } = await supabase.from("quizzes").insert({ aula_id: payload.aulaId, questions });
          if (insErr) throw insErr;
          return { data: { ok: true } as any as T, error: null };
        }

<<<<<<< HEAD
        return { data: { reply: res.choices?.[0]?.message?.content || "", raw: res } as any as T, error: null };
=======
        if (action === "quiz_tab") {
          return { data: { questions: JSON.parse(text) } as any as T, error: null };
        }

        if (action === "admin_bulk_quiz") {
          return { data: { quizzes: JSON.parse(text) } as any as T, error: null };
        }

        return { data: { reply: text, raw: res } as any as T, error: null };
>>>>>>> 0620fc15a0d3af69c721b95d900a37802beeaaef
      }
      throw lastError || new Error("Falha após várias tentativas com o Groq.");
    }

    // ─── AÇÕES QUE AINDA USAM EDGE FUNCTION (MODERAÇÃO) ───
    if (action === "moderate_text" || action === "moderate_vision") {
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

/** Chat genérico Groq */
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
