import { useAuth } from "../contexts/AuthContext";
import { invokeApiProxy } from "@/lib/apiProxy";

/**
 * Moderação via Edge Function `api-proxy` (Groq no servidor — sem chave no bundle).
 */


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

// ─── Moderação de TEXTO ───────────────────────────────────────────────────────

async function moderateText(text: string): Promise<ModerationResult> {
  if (!text.trim()) return { approved: true };

  try {
    const { data, error } = await invokeApiProxy<ModerationResult>("moderate_text", { text });
    if (error) {
      console.warn("[Moderation] moderate_text:", error);
      return { approved: true };
    }
    if (data && typeof data.approved === "boolean") return data;
    return { approved: true };
  } catch {
    return { approved: true };
  }
}

// ─── Moderação de IMAGEM / GIF ────────────────────────────────────────────────

async function moderateImage(
  base64: string,
  mimeType: string = "image/jpeg",
  extraText?: string
): Promise<ModerationResult> {
  try {
    const { data, error } = await invokeApiProxy<ModerationResult>("moderate_vision", {
      base64,
      mimeType,
      ...(extraText ? { extraText } : {}),
    });
    if (error) {
      console.warn("[Moderation] moderate_vision:", error);
      return { approved: true };
    }
    if (data && typeof data.approved === "boolean") return data;
    return { approved: true };
  } catch {
    return { approved: true };
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useModeration() {
  const { role } = useAuth();

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

    // 1. Check if user is an admin - skip moderation for admins
    if (role === "admin") {
      console.log("[Moderation] Admin bypass active.");
      return { approved: true };
    }

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
