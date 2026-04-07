import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

const rateLimiter = new Map<string, { count: number; reset: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimiter.get(userId);

  if (!entry || now > entry.reset) {
    rateLimiter.set(userId, { count: 1, reset: now + 60000 });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

const MODERATION_SYSTEM = `Você é o moderador da comunidade UpJobs, uma plataforma sobre carreiras do futuro, mercado de trabalho, vagas de emprego, cursos, transição de carreira e desenvolvimento profissional.

Sua tarefa é avaliar conteúdo enviado por usuários (texto e/ou imagem) e decidir se deve ser APROVADO ou REPROVADO.

APROVE se o conteúdo:
- For sobre carreiras, emprego, vagas, cursos, tecnologia, desenvolvimento profissional, conquistas, dicas de trabalho, networking
- For uma opinião, experiência ou dúvida relevante ao ambiente profissional
- For uma imagem, meme ou GIF divertido mas inofensivo (humor leve é permitido)
- Não violar nenhuma das regras abaixo

REPROVE se o conteúdo:
- Contiver linguagem ofensiva, palavrões graves, xingamentos direcionados a pessoas
- For spam, propaganda não relacionada, links suspeitos ou golpes
- Contiver discurso de ódio, preconceito, racismo, sexismo ou qualquer discriminação
- For completamente irrelevante e sem valor para uma comunidade profissional (ex: texto sem sentido, spam de caracteres)
- Contiver conteúdo adulto, violento ou ilegal
- For assédio ou ataque pessoal a outro usuário

IMPORTANTE:
- Humor leve e memes relacionados ao mundo do trabalho são PERMITIDOS
- Seja tolerante com conteúdo levemente off-topic mas inofensivo
- Só reprove se tiver certeza que viola as regras acima
- Responda APENAS com JSON válido, sem texto adicional

Formato de resposta obrigatório:
{"approved": true}
OU
{"approved": false, "reason": "Mensagem curta e amigável explicando o motivo em português"}`;

function json(data: unknown, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function groqPost(groqKey: string, body: Record<string, unknown>) {
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({ stream: false, ...body }),
  });
  return r.json();
}

function extractJsonArray(text: string) {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("No JSON array found in response");
    }
    const clean = text.substring(start, end + 1).trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[extractJsonArray] Error:", String(e), "Raw text:", text);
    throw e;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, corsHeaders, 401);

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAnon.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, corsHeaders, 401);

  const rlResult = checkRateLimit(user.id);
  if (!rlResult.allowed) {
    return json(
      { error: "Too Many Requests" },
      { ...corsHeaders, "Retry-After": String(rlResult.retryAfter) },
      429
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, corsHeaders, 400);
  }

  const action = String(body.action ?? "");
  const groqKey = Deno.env.get("GROQ_API_KEY") ?? "";

  try {
    switch (action) {
      case "chat": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);
        const model = (body.model as string) ?? "llama-3.1-8b-instant";
        const messages = body.messages as unknown[];
        const temperature = (body.temperature as number) ?? 0.3;
        const max_tokens = body.max_tokens as number | undefined;
        const data = await groqPost(groqKey, {
          model,
          messages,
          temperature,
          ...(max_tokens != null ? { max_tokens } : {}),
        });
        const reply =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        return json({ reply, raw: data }, corsHeaders);
      }

      case "moderate_text": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);
        const text = String(body.text ?? "");
        if (!text.trim()) return json({ approved: true }, corsHeaders);
        const data = await groqPost(groqKey, {
          model: "llama-3.1-8b-instant",
          temperature: 0,
          max_tokens: 120,
          messages: [
            { role: "system", content: MODERATION_SYSTEM },
            { role: "user", content: `Avalie este comentário:\n\n"${text}"` },
          ],
        });
        const raw =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ??
          "{}";
        let parsed: { approved?: boolean; reason?: string };
        try {
          parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          parsed = { approved: true };
        }
        return json(parsed, corsHeaders);
      }

      case "moderate_vision": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);
        const base64 = String(body.base64 ?? "");
        const mimeType = String(body.mimeType ?? "image/jpeg");
        const extraText = body.extraText ? String(body.extraText) : "";
        if (!base64) return json({ approved: true }, corsHeaders);
        const data = await groqPost(groqKey, {
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0,
          max_tokens: 120,
          messages: [
            { role: "system", content: MODERATION_SYSTEM },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
                {
                  type: "text",
                  text: extraText
                    ? `Avalie imagem e texto:\n\n"${extraText}"`
                    : "Avalie esta imagem.",
                },
              ],
            },
          ],
        });
        const raw =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ??
          "{}";
        let parsed: { approved?: boolean; reason?: string };
        try {
          parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          parsed = { approved: true };
        }
        return json(parsed, corsHeaders);
      }

      case "quiz_tab": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);
        const prompt = String(body.prompt ?? "");
        const data = await groqPost(groqKey, {
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          messages: [{ role: "system", content: prompt }],
        });
        const text =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        try {
          const clean = text.replace(/```json|```/gi, "").trim();
          const questions = JSON.parse(clean);
          return json({ questions }, corsHeaders);
        } catch (e) {
          return json({ error: "Failed to parse questions", details: String(e), raw: text }, corsHeaders, 500);
        }
      }

      case "admin_bulk_quiz": {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceKey) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, corsHeaders, 500);
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);

        const courseName = String(body.courseName ?? "");
        const aulas = body.aulas as { nome: string; descricao: string }[];
        
        const data = await groqPost(groqKey, {
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `Você é um gerador de quizzes para cursos. Sua tarefa é gerar 3 questões para CADA aula fornecida. 
              Retorne APENAS um objeto JSON onde a CHAVE é o nome da aula e o VALOR é o array de questões.
              Formato de cada questão: {"id": number, "text": "...", "options": ["a", "b", "c", "d"], "correct": number}
              Não inclua markdown, não dê explicações.`
            },
            {
              role: "user",
              content: `Curso: "${courseName}". Aulas:\n${aulas.map(a => `- ${a.nome}`).join("\n")}`
            },
          ],
        });

        const text = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        try {
          const cleanText = text.replace(/```json|```/g, "").trim();
          const quizzesMap = JSON.parse(cleanText);
          return json({ quizzes: quizzesMap }, corsHeaders);
        } catch (e) {
          return json({ error: "Failed to parse bulk quiz JSON", raw: text }, corsHeaders, 500);
        }
      }

      case "admin_quiz_insert": {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceKey) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, corsHeaders, 500);
        const { data: prof } = await supabaseAnon
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if ((prof as { role?: string } | null)?.role !== "admin") {
          return json({ error: "Forbidden" }, corsHeaders, 403);
        }
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, corsHeaders, 500);

        const aulaId = String(body.aulaId ?? "");
        const aulaNome = String(body.aulaNome ?? "");
        const aulaDesc = String(body.aulaDesc ?? "");
        const data = await groqPost(groqKey, {
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "Você é um gerador de quizzes. Responda APENAS com um array JSON puro, sem markdown, sem explicações.",
            },
            {
              role: "user",
              content:
                `Gere um quiz de 3 perguntas para a aula: "${aulaNome}". Descrição: "${aulaDesc}". Retorne no formato: [{"id": 1, "text": "...", "options": ["a", "b", "c", "d"], "correct": 0}]`,
            },
          ],
        });
        const text =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        try {
          const cleanText = text.replace(/```json|```/g, "").trim();
          const questions = JSON.parse(cleanText);
          const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
          const { error: insErr } = await admin.from("quizzes").insert({ aula_id: aulaId, questions });
          if (insErr) return json({ error: insErr.message }, corsHeaders, 400);
          return json({ ok: true }, corsHeaders);
        } catch (e) {
          return json({ error: "Failed to parse generated questions", details: String(e), raw: text }, corsHeaders, 500);
        }
      }

      case "youtube_playlist": {
        const key = Deno.env.get("YOUTUBE_API_KEY");
        if (!key) return json({ error: "YOUTUBE_API_KEY not configured" }, corsHeaders, 500);
        const playlistId = String(body.playlistId ?? "");
        const pageToken = body.pageToken ? String(body.pageToken) : "";
        const params = new URLSearchParams({
          part: "snippet",
          maxResults: "50",
          playlistId,
          key,
        });
        if (pageToken) params.set("pageToken", pageToken);
        const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
        const data = await r.json();
        if (data.error) return json({ error: data.error.message }, corsHeaders, 400);
        const videos: Array<{
          id: string;
          nome: string;
          url: string;
          thumb: string;
          descricao: string;
        }> = [];
        for (const item of data.items ?? []) {
          const videoId = item.snippet.resourceId.videoId;
          videos.push({
            id: videoId,
            nome: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumb: item.snippet.thumbnails?.medium?.url ?? "",
            descricao: item.snippet.description ?? "",
          });
        }
        return json({ videos, nextPageToken: data.nextPageToken ?? null }, corsHeaders);
      }

      case "klipy_gifs": {
        const key = Deno.env.get("KLIPY_API_KEY");
        if (!key) return json({ error: "KLIPY_API_KEY not configured" }, corsHeaders, 500);
        const q = String(body.q ?? "");
        const pos = body.pos ? String(body.pos) : "";
        const featured = Boolean(body.featured);
        const endpoint = featured ? "featured" : "search";
        const params = new URLSearchParams({
          key,
          q: q.trim() || "trending",
          limit: "20",
        });
        if (pos) params.set("pos", pos);
        const r = await fetch(`https://api.klipy.com/v2/${endpoint}?${params}`);
        const data = await r.json();
        return json({ results: data.results ?? [], next: data.next ?? null }, corsHeaders);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, corsHeaders, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, corsHeaders, 500);
  }
});
