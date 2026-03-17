/**
 * CreatePost.tsx
 *
 * Fluxo de mídia:
 *   Imagem/Vídeo → upload para bucket "ComunityPost/{userId}/{postId}/arquivo"
 *                  → salva URL pública na coluna `midia`
 *   GIF           → salva "gif:https://media.tenor.com/..." direto (sem upload)
 *
 * A coluna `midia` no banco sempre tem uma das formas:
 *   "EMPTY"              → sem mídia
 *   "gif:https://..."    → GIF do Tenor
 *   "https://...supabase..." → arquivo no bucket
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, MessageSquarePlus, Video, Loader2, Smile } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import type { Publication } from "./PostCard";
import PostMedia, { getMediaType } from "./PostMedia";
import GifPicker from "./GifPicker";

const BUCKET        = "ComunityPost";
const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp";
const ACCEPTED_VIDEO = "video/mp4,video/webm,video/ogg,video/quicktime";

interface CreatePostProps {
  onPost:       (publi: Publication) => void;
  myCreatorId?: string;
}

const CreatePost = ({ onPost, myCreatorId }: CreatePostProps) => {
  const [expanded,    setExpanded]    = useState(false);
  const [description, setDescription] = useState("");

  // mídia selecionada
  const [mediaFile,   setMediaFile]   = useState<File | null>(null);  // arquivo local
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null); // URL local temporária
  const [gifUrl,      setGifUrl]      = useState<string | null>(null); // "gif:https://..."

  const [showGif,   setShowGif]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const fileRef  = useRef<HTMLInputElement>(null);

  const hasMedia = !!(mediaFile || gifUrl);

  // ── Seleciona arquivo local ──────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMedia();
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  // ── Seleciona GIF do Tenor ───────────────────────────────────────────────────
  const handleGifSelect = (url: string) => {
    clearMedia();
    setGifUrl(url);
    setShowGif(false);
  };

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
    setGifUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCancel = () => {
    clearMedia();
    setDescription("");
    setError(null);
    setShowGif(false);
    setExpanded(false);
  };

  // ── Publicar ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!description.trim()) return;
    if (!myCreatorId) { setError("Você precisa estar logado para publicar."); return; }
    setUploading(true);
    setError(null);
    setUploadPct(10);

    try {
      // 1. Insere o post — midia começa como "EMPTY"
      const postData = {
        description: description.trim(),
        midia:       "EMPTY",
        date:        new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T") + "-03:00",
        creator_id:  myCreatorId,
        like_qnt:    0,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("publications")
        .insert(postData)
        .select("id, created_at")
        .single();

      if (insertError) throw new Error(insertError.message);

      const postId = inserted.id;
      let midiaFinal = "EMPTY";

      // 2a. GIF — só salva a URL, sem upload
      if (gifUrl) {
        midiaFinal = gifUrl; // já tem o prefixo "gif:"
        setUploadPct(80);
      }

      // 2b. Arquivo (imagem ou vídeo) — faz upload para o bucket
      if (mediaFile) {
        setUploadPct(30);
        const ext      = mediaFile.name.split(".").pop()?.toLowerCase() ?? "bin";
        const fileName = `${Date.now()}.${ext}`;
        const path     = `${myCreatorId}/${postId}/${fileName}`; // userId/postId/arquivo

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, mediaFile, {
            cacheControl: "3600",
            upsert:       false,
            contentType:  mediaFile.type,
          });

        if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);
        setUploadPct(75);

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        midiaFinal = urlData.publicUrl;
      }

      // 3. Atualiza `midia` no banco se tiver mídia
      if (midiaFinal !== "EMPTY") {
        setUploadPct(85);
        const { error: updateError } = await supabase
          .from("publications")
          .update({ midia: midiaFinal })
          .eq("id", postId);

        if (updateError) throw new Error(`Erro ao salvar mídia: ${updateError.message}`);
      }

      setUploadPct(100);

      // 4. Atualiza UI localmente com os dados reais
      onPost({
        ...postData,
        id:         postId,
        created_at: inserted.created_at,
        midia:      midiaFinal,
      });

      clearMedia();
      setDescription("");
      setExpanded(false);

    } catch (err: any) {
      setError(err.message ?? "Erro ao publicar. Tente novamente.");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  // Preview unificado — arquivo local ou GIF selecionado
  const previewMidia = gifUrl ?? (previewUrl ? (
    mediaFile?.type.startsWith("video/") ? `__local_video__${previewUrl}` : previewUrl
  ) : null);

  return (
    <motion.div layout className="hologram-panel rounded-sm p-5">
      <div className="flex gap-3 items-center">

        {/* Ícone */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "hsl(155 60% 45% / 0.12)", border: "1.5px solid hsl(155 60% 45% / 0.3)" }}>
          <MessageSquarePlus size={18} style={{ color: "hsl(155 60% 45%)" }} />
        </div>

        <div className="flex-1">
          {!expanded ? (
            <button onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 rounded-sm bg-secondary/40 border border-border/40 text-sm font-body text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 transition">
              No que você está pensando?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

              <textarea autoFocus value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleSubmit()}
                placeholder="Compartilhe um insight, conquista ou dúvida com a comunidade..."
                rows={4} disabled={uploading}
                className="w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/50 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition resize-none disabled:opacity-50"
              />

              {/* Preview da mídia selecionada */}
              <AnimatePresence>
                {hasMedia && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative">
                    {/* GIF preview */}
                    {gifUrl && (
                      <div className="rounded-sm overflow-hidden border border-border/40">
                        <img src={gifUrl.slice(4)} alt="GIF" className="w-full max-h-48 object-contain bg-black/20" />
                        <span className="absolute top-2 left-2 text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ background: "hsl(45 90% 55% / 0.9)", color: "#000" }}>GIF</span>
                      </div>
                    )}
                    {/* Arquivo local preview */}
                    {previewUrl && !gifUrl && (
                      <div className="rounded-sm overflow-hidden border border-border/40">
                        {mediaFile?.type.startsWith("video/") ? (
                          <video src={previewUrl} controls className="w-full max-h-48 object-contain bg-black/40" />
                        ) : (
                          <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                        )}
                        <span className="absolute top-2 left-2 text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ background: mediaFile?.type.startsWith("video/") ? "hsl(210 70% 55% / 0.9)" : "hsl(155 60% 45% / 0.9)", color: "#fff" }}>
                          {mediaFile?.type.startsWith("video/") ? "VÍDEO" : "IMAGEM"}
                        </span>
                      </div>
                    )}
                    {!uploading && (
                      <button onClick={clearMedia}
                        className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background transition">
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progresso de upload */}
              <AnimatePresence>
                {uploading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 size={11} className="animate-spin text-primary" />
                      <span className="text-[10px] font-accent text-muted-foreground">
                        {uploadPct < 30 ? "Criando post…" : uploadPct < 80 ? "Enviando mídia…" : "Finalizando…"}
                      </span>
                      <span className="text-[10px] font-accent text-primary ml-auto">{uploadPct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <motion.div animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(25 90% 55%))" }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs text-destructive font-body bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-sm">
                  {error}
                </motion.p>
              )}

              <div className="flex items-center justify-between">
                {/* Botões de mídia */}
                <div className="flex gap-1 relative">
                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_IMAGE; fileRef.current.click(); } }}
                    disabled={uploading || hasMedia}
                    title="Adicionar imagem"
                    className="flex items-center gap-1.5 text-xs font-accent text-muted-foreground hover:text-primary transition px-2 py-1.5 rounded-sm hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ImageIcon size={14} />
                    <span className="hidden sm:inline">Imagem</span>
                  </button>

                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_VIDEO; fileRef.current.click(); } }}
                    disabled={uploading || hasMedia}
                    title="Adicionar vídeo"
                    className="flex items-center gap-1.5 text-xs font-accent text-muted-foreground hover:text-primary transition px-2 py-1.5 rounded-sm hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Video size={14} />
                    <span className="hidden sm:inline">Vídeo</span>
                  </button>

                  <button
                    onClick={() => setShowGif((v) => !v)}
                    disabled={uploading || hasMedia}
                    title="Adicionar GIF"
                    className={`flex items-center gap-1.5 text-xs font-accent transition px-2 py-1.5 rounded-sm hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed ${showGif ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                    <Smile size={14} />
                    <span className="hidden sm:inline">GIF</span>
                  </button>

                  {/* GifPicker dropdown */}
                  <AnimatePresence>
                    {showGif && (
                      <div className="absolute bottom-10 left-0 z-50">
                        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={uploading}
                    className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition disabled:opacity-40">
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={!description.trim() || uploading}
                    className="px-4 py-1.5 text-xs font-accent font-bold text-primary-foreground rounded-sm transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed box-glow-accent"
                    style={{ background: "hsl(25 90% 55%)" }}>
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : "Publicar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CreatePost;