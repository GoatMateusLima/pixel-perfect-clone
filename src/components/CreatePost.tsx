import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, MessageSquarePlus, Video, Loader2, Smile } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import PostMedia from "./PostMedia";
import GifPicker from "./GifPicker";
import { useModeration } from "../hooks/useModeration.ts";
import { useAuth } from "../contexts/AuthContext";

const BUCKET        = "ComunityPost";
const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp";
const ACCEPTED_VIDEO = "video/mp4,video/webm,video/ogg,video/quicktime";

interface CreatePostProps {
  onPost:       (rawRow: any) => void; // Agora recebe a linha completa do banco
  myCreatorId?: string;
  myAvatarUrl?: string | null;         // Para mostrar sua foto no input
}

const CreatePost = ({ onPost, myCreatorId, myAvatarUrl }: CreatePostProps) => {
  const [expanded,    setExpanded]    = useState(false);
  const [description, setDescription] = useState("");

  const [mediaFile,   setMediaFile]   = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [gifUrl,      setGifUrl]      = useState<string | null>(null);

  const [showGif,   setShowGif]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const fileRef    = useRef<HTMLInputElement>(null);
  const { moderate } = useModeration();
  const { user } = useAuth();
  
  // O creator_id REAL vem sempre do AuthContext, nunca de props para evitar IDOR no frontend
  const activeCreatorId = user?.id;

  const hasMedia = !!(mediaFile || gifUrl);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMedia();
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

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

  const handleSubmit = async () => {
    if (!description.trim()) return;
    if (!activeCreatorId) { setError("Você precisa estar logado para publicar."); return; }
    setUploading(true);
    setError(null);
    setUploadPct(10);

    try {
      // 0. Moderação via Groq antes de publicar
      const modResult = await moderate(description, mediaFile, gifUrl);
      if (!modResult.approved) {
        setError(modResult.reason ?? "Conteúdo não permitido na comunidade UpJobs.");
        setUploading(false);
        return;
      }

      // 1. Insere o post
      const postData = {
        description: description.trim(),
        midia:       "EMPTY",
        date:        new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T") + "-03:00",
        creator_id:  activeCreatorId,
        like_qnt:    0,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("publications")
        .insert(postData)
        .select("id")
        .single();

      if (insertError) throw new Error(insertError.message);

      const postId = inserted.id;
      let midiaFinal = "EMPTY";

      // 2a. GIF
      if (gifUrl) {
        midiaFinal = gifUrl;
        setUploadPct(80);
      }

      // 2b. Arquivo
      if (mediaFile) {
        setUploadPct(30);
        const ext      = mediaFile.name.split(".").pop()?.toLowerCase() ?? "bin";
        const fileName = `${Date.now()}.${ext}`;
        const path     = `${activeCreatorId}/${postId}/${fileName}`;

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

      // 3. Atualiza mídia no banco
      if (midiaFinal !== "EMPTY") {
        setUploadPct(85);
        const { error: updateError } = await supabase
          .from("publications")
          .update({ midia: midiaFinal })
          .eq("id", postId);

        if (updateError) throw new Error(`Erro ao salvar mídia: ${updateError.message}`);
      }

      setUploadPct(100);

      // 4. BUSCA O POST REAL COM A FOTO DE PERFIL INCLUÍDA
      const { data: finalRow, error: fetchError } = await supabase
        .from("publications")
        .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
        .eq("id", postId)
        .single();

      if (fetchError) throw new Error(`Erro ao atualizar feed: ${fetchError.message}`);

      // 5. Manda para a CommunityPage
      onPost(finalRow);

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

  const previewMidia = gifUrl ?? (previewUrl ? (
    mediaFile?.type.startsWith("video/") ? `__local_video__${previewUrl}` : previewUrl
  ) : null);

  return (
    <motion.div layout className="glass-card p-8 border-white/5 mb-8 shadow-2xl relative overflow-hidden rounded-3xl">
      <div className="flex gap-5 items-start">

        {/* Sua Foto de Perfil na hora de criar */}
        <div className="flex-shrink-0 pt-1">
          {myAvatarUrl ? (
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-transform duration-300 hover:scale-105">
              <img src={myAvatarUrl} alt="Você" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-inner">
              <MessageSquarePlus size={22} className="text-white/20" />
            </div>
          )}
        </div>

        <div className="flex-1">
          {!expanded ? (
            <button onClick={() => setExpanded(true)}
              className="w-full text-left px-7 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] text-[15px] font-body text-white/30 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
              Compartilhe algo com a comunidade...
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              <textarea autoFocus value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleSubmit()}
                placeholder="No que você está pensando? Compartilhe um insight, conquista ou dúvida..."
                rows={4} disabled={uploading}
                className="w-full px-6 py-5 rounded-2xl bg-white/[0.01] border border-white/[0.05] text-[16px] font-body text-white placeholder:text-white/10 focus:outline-none focus:border-primary/30 focus:bg-white/[0.03] transition-all resize-none disabled:opacity-50"
              />

              {/* Preview da mídia selecionada */}
              <AnimatePresence>
                {hasMedia && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative">
                    {gifUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={gifUrl.slice(4)} alt="GIF" className="w-full max-h-64 object-contain bg-black/20" />
                        <span className="absolute top-3 left-3 text-[10px] font-accent font-bold px-2 py-1 rounded-full"
                          style={{ background: "hsl(45 90% 55%)", color: "#000" }}>GIF</span>
                      </div>
                    )}
                    {previewUrl && !gifUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        {mediaFile?.type.startsWith("video/") ? (
                          <video src={previewUrl} controls className="w-full max-h-64 object-contain bg-black/40" />
                        ) : (
                          <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                        )}
                        <span className="absolute top-3 left-3 text-[10px] font-accent font-bold px-2 py-1 rounded-full"
                          style={{ background: mediaFile?.type.startsWith("video/") ? "hsl(210 70% 55%)" : "hsl(155 60% 45%)", color: "#fff" }}>
                          {mediaFile?.type.startsWith("video/") ? "VÍDEO" : "IMAGEM"}
                        </span>
                      </div>
                    )}
                    {!uploading && (
                      <button onClick={clearMedia}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors shadow-lg backdrop-blur-md">
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
                    className="flex items-center gap-2 text-xs font-accent font-bold text-muted-foreground hover:text-primary transition-all px-3 py-2 rounded-full hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed">
                    <ImageIcon size={16} />
                    <span className="hidden sm:inline">Imagem</span>
                  </button>

                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_VIDEO; fileRef.current.click(); } }}
                    disabled={uploading || hasMedia}
                    title="Adicionar vídeo"
                    className="flex items-center gap-2 text-xs font-accent font-bold text-muted-foreground hover:text-primary transition-all px-3 py-2 rounded-full hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed">
                    <Video size={16} />
                    <span className="hidden sm:inline">Vídeo</span>
                  </button>

                  <button
                    onClick={() => setShowGif(true)}
                    disabled={uploading || hasMedia}
                    title="Adicionar GIF"
                    className={`flex items-center gap-2 text-xs font-accent font-bold transition-all px-3 py-2 rounded-full hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed ${showGif ? "text-primary bg-white/[0.05]" : "text-muted-foreground hover:text-primary"}`}>
                    <Smile size={16} />
                    <span className="hidden sm:inline">GIF</span>
                  </button>

                  {/* GifPicker Modal */}
                  <AnimatePresence>
                    {showGif && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
                        onClick={() => setShowGif(false)}
                      >
                        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

                <div className="flex gap-5">
                  <button onClick={handleCancel} disabled={uploading}
                    className="px-6 py-3 text-[12px] font-accent font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-all disabled:opacity-40">
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={!description.trim() || uploading}
                    className="px-8 py-3 text-[13px] font-accent font-black uppercase tracking-[0.2em] text-black bg-primary rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : "Publicar"}
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