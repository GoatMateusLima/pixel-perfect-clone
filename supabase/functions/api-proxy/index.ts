import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAnon.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");
  const groqKey = Deno.env.get("GROQ_API_KEY") ?? "";

  try {
    switch (action) {
      case "chat": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, 500);
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
        return json({ reply, raw: data });
      }

      case "moderate_text": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, 500);
        const text = String(body.text ?? "");
        if (!text.trim()) return json({ approved: true });
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
        return json(parsed);
      }

      case "moderate_vision": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, 500);
        const base64 = String(body.base64 ?? "");
        const mimeType = String(body.mimeType ?? "image/jpeg");
        const extraText = body.extraText ? String(body.extraText) : "";
        if (!base64) return json({ approved: true });
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
        return json(parsed);
      }

      case "quiz_tab": {
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, 500);
        const prompt = String(body.prompt ?? "");
        const data = await groqPost(groqKey, {
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          messages: [{ role: "system", content: prompt }],
        });
        const text =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        const clean = text.replace(/```json|```/gi, "").trim();
        const questions = JSON.parse(clean);
        return json({ questions });
      }

      case "admin_quiz_insert": {
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!serviceKey) return json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, 500);
        const { data: prof } = await supabaseAnon
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if ((prof as { role?: string } | null)?.role !== "admin") {
          return json({ error: "Forbidden" }, 403);
        }
        if (!groqKey) return json({ error: "GROQ_API_KEY not configured" }, 500);

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
        let text =
          (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? "";
        text = text.replace(/```json|```/g, "").trim();
        const questions = JSON.parse(text);

        const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
        const { error: insErr } = await admin.from("quizzes").insert({ aula_id: aulaId, questions });
        if (insErr) return json({ error: insErr.message }, 400);
        return json({ ok: true });
      }

      case "youtube_playlist": {
        const key = Deno.env.get("YOUTUBE_API_KEY");
        if (!key) return json({ error: "YOUTUBE_API_KEY not configured" }, 500);
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
        if (data.error) return json({ error: data.error.message }, 400);
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
        return json({ videos, nextPageToken: data.nextPageToken ?? null });
      }

      case "klipy_gifs": {
        const key = Deno.env.get("KLIPY_API_KEY");
        if (!key) return json({ error: "KLIPY_API_KEY not configured" }, 500);
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
        return json({ results: data.results ?? [], next: data.next ?? null });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
