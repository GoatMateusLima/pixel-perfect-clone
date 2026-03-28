/**
 * useModeration.ts
 *
 * Hook de moderação via Groq API.
 * Analisa texto, imagens (base64) e GIFs antes de salvar no banco.
 *
 * Setup no .env:
 *   VITE_GROQ_API_KEY=sua_chave_aqui
 *
 * Modelos usados:
 *   - Texto:  llama-3.1-8b-instant  (rápido, barato)
 *   - Imagem: llama-4-scout-17b-16e-instruct (visão, analisa imagem/gif)
 */

const GROQ_KEY = import.meta.env.VITE_AI_KEY ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ModerationResult {
  approved: boolean;
  reason?:  string; // mensagem amigável para mostrar ao usuário se reprovado
}

// ─── Converte File para base64 ────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Busca frame do GIF como base64 ──────────────────────────────────────────
// Desenha o primeiro frame num canvas e exporta como JPEG

async function gifUrlToBase64(gifUrl: string): Promise<string | null> {
  try {
    const realUrl = gifUrl.startsWith("gif:") ? gifUrl.slice(4) : gifUrl;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload  = () => res();
      img.onerror = () => rej();
      img.src = realUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width  = Math.min(img.width,  512);
    canvas.height = Math.min(img.height, 512);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  } catch {
    return null;
  }
}

// ─── Prompt de moderação ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o moderador da comunidade UpJobs, uma plataforma sobre carreiras do futuro, mercado de trabalho, vagas de emprego, cursos, transição de carreira e desenvolvimento profissional.

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

// ─── Moderação de TEXTO ───────────────────────────────────────────────────────

async function moderateText(text: string): Promise<ModerationResult> {
  if (!text.trim()) return { approved: true };
  if (!GROQ_KEY)   return { approved: true }; // sem chave, aprova tudo

  try {
    const res = await fetch(GROQ_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        temperature: 0,
        max_tokens:  80,
        messages: [
          { role: "system",  content: SYSTEM_PROMPT },
          { role: "user",    content: `Avalie este comentário:\n\n"${text}"` },
        ],
      }),
    });

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? "{}";
    return JSON.parse(raw) as ModerationResult;
  } catch {
    return { approved: true }; // em caso de erro na API, não bloqueia o usuário
  }
}

// ─── Moderação de IMAGEM / GIF ────────────────────────────────────────────────

async function moderateImage(
  base64: string,
  mimeType: string = "image/jpeg",
  extraText?: string
): Promise<ModerationResult> {
  if (!GROQ_KEY) return { approved: true };

  try {
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          {
            type: "text",
            text: extraText
              ? `Avalie esta imagem/GIF junto com o texto:\n\n"${extraText}"`
              : "Avalie esta imagem/GIF.",
          },
        ],
      },
    ];

    const res = await fetch(GROQ_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model:       "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0,
        max_tokens:  80,
        messages,
      }),
    });

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? "{}";
    return JSON.parse(raw) as ModerationResult;
  } catch {
    return { approved: true };
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useModeration() {

  /**
   * moderate — analisa texto + mídia opcional antes de salvar
   *
   * @param text      - texto do comentário ou post
   * @param mediaFile - arquivo de imagem/vídeo (opcional)
   * @param gifUrl    - URL do GIF com prefixo "gif:" (opcional)
   */
  const moderate = async (
    text:       string,
    mediaFile?: File | null,
    gifUrl?:    string | null,
  ): Promise<ModerationResult> => {

    // Se não tem chave configurada, aprova sem chamar a API
    if (!GROQ_KEY) return { approved: true };

    const checks: Promise<ModerationResult>[] = [];

    // 1. Moderação do texto
    if (text.trim()) {
      checks.push(moderateText(text));
    }

    // 2. Moderação de imagem enviada como arquivo
    if (mediaFile && mediaFile.type.startsWith("image/")) {
      const b64 = await fileToBase64(mediaFile);
      checks.push(moderateImage(b64, mediaFile.type, text));
    }

    // 3. Moderação de GIF — captura o primeiro frame
    if (gifUrl) {
      const b64 = await gifUrlToBase64(gifUrl);
      if (b64) checks.push(moderateImage(b64, "image/jpeg", text));
    }

    // 4. Moderação de vídeo — não analisamos o vídeo em si (sem suporte de vídeo na API),
    //    mas moderamos o texto que acompanha
    if (mediaFile && mediaFile.type.startsWith("video/") && text.trim()) {
      // texto já foi verificado acima — sem ação adicional
    }

    // Roda todas as verificações em paralelo
    const results = await Promise.all(checks);

    // Se qualquer verificação reprovar, retorna a reprovação
    const reprovado = results.find((r) => !r.approved);
    return reprovado ?? { approved: true };
  };

  return { moderate };
}
