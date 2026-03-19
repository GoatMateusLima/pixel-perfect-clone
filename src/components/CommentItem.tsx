import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownRight, Send, Trash2, ImageIcon, Video, Smile, X } from "lucide-react";
import { UserAvatar, toInitials, DISC_COLOR } from "./PostCard";
import PostMedia from "./PostMedia";
import GifPicker from "./GifPicker";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DbComment {
  id:             string;
  user_id:        string;
  publication_id: string;
  comment:        string;
  midia?:         string | null; // NOVO: Coluna de mídia no banco
  like:           number;
  parent_id?:     string | null;
  created_at?:    string;
  profiles?: {
    user_id:   string;
    name:      string;
    perfil?:   string;
    bordas?:   any[];
  } | null;
}

export interface CommentNode extends DbComment {
  replies: CommentNode[];
  authorName:     string;
  authorAvatar?:  string;
  authorRingImg?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildCommentTree(flat: DbComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();

  flat.forEach((c) => {
    const profile    = c.profiles ?? null;
    const bordaAtiva = (profile?.bordas ?? []).find((b: any) => b.ativa) ?? null;
    map.set(c.id, {
      ...c,
      replies:        [],
      authorName:     profile?.name    ?? "Usuário",
      authorAvatar:   profile?.perfil  ?? undefined,
      authorRingImg:  bordaAtiva?.img_url ?? undefined,
    });
  });

  const roots: CommentNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment:      CommentNode;
  myUserId?:    string;
  myName:       string;
  myAvatarUrl:  string | null;
  myDisc:       string;
  myDiscRingImg?: string;
  depth?:       number;
  // NOVO: A função de reply agora aceita arquivo e gif
  onReply:      (parentId: string, text: string, mediaFile: File | null, gifUrl: string | null) => Promise<void>;
  onDelete:     (commentId: string) => Promise<void>;
}

const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp";
const ACCEPTED_VIDEO = "video/mp4,video/webm,video/ogg,video/quicktime";

const CommentItem = ({
  comment, myUserId, myName, myAvatarUrl, myDisc, myDiscRingImg,
  depth = 0, onReply, onDelete,
}: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [showReplies,    setShowReplies]    = useState(true);

  // ── Estados de Mídia para o Reply ──
  const [mediaFile,   setMediaFile]   = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [gifUrl,      setGifUrl]      = useState<string | null>(null);
  const [showGif,     setShowGif]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isMyComment = comment.user_id === myUserId;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMedia();
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

  const handleSubmitReply = async () => {
    if (!replyText.trim() && !mediaFile && !gifUrl) return;
    setSubmitting(true);
    await onReply(comment.id, replyText.trim(), mediaFile, gifUrl);
    setReplyText("");
    clearMedia();
    setShowReplyInput(false);
    setSubmitting(false);
  };

  const hasMediaInput = !!(mediaFile || gifUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth > 0 ? "ml-8 mt-2" : ""}>

      {/* ── Comentário ── */}
      <div className="flex gap-2.5 group">
        <UserAvatar
          avatarUrl={comment.authorAvatar}
          name={comment.authorName}
          disc="S"
          size="sm"
          discRingImg={comment.authorRingImg}
        />

        <div className="flex-1 min-w-0">
          {/* Balão do Comentário */}
          <div className="bg-secondary/30 rounded-sm px-3 py-2 relative">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] font-accent font-semibold text-foreground">
                {comment.authorName}
              </p>
              {isMyComment && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  title="Deletar comentário">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            
            {/* Texto do comentário */}
            {comment.comment && (
              <p className="text-xs font-body text-muted-foreground leading-relaxed">
                {comment.comment}
              </p>
            )}

            {/* Renderização da Mídia do Comentário */}
            {comment.midia && comment.midia !== "EMPTY" && (
              <div className="mt-2 rounded-sm overflow-hidden">
                <PostMedia midia={comment.midia} maxHeight={200} inModal />
              </div>
            )}
          </div>

          {/* Ações abaixo do balão */}
          <div className="flex items-center gap-3 mt-1 px-1">
            {depth === 0 && (
              <button
                onClick={() => setShowReplyInput((v) => !v)}
                className="text-[10px] font-accent text-muted-foreground hover:text-primary transition flex items-center gap-1">
                <CornerDownRight size={10} />
                Responder
              </button>
            )}

            {depth === 0 && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-[10px] font-accent text-muted-foreground hover:text-foreground transition">
                {showReplies
                  ? `Ocultar ${comment.replies.length} resposta${comment.replies.length > 1 ? "s" : ""}`
                  : `Ver ${comment.replies.length} resposta${comment.replies.length > 1 ? "s" : ""}`
                }
              </button>
            )}
          </div>

          {/* Input de Reply (com Mídia) */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden">
                <div className="flex gap-2 items-start ml-1">
                  <UserAvatar
                    avatarUrl={myAvatarUrl} name={myName} disc={myDisc}
                    size="sm" isMe discRingImg={myDiscRingImg}
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    
                    {/* Preview de Mídia do Reply */}
                    {hasMediaInput && (
                      <div className="relative w-max">
                        {gifUrl && <img src={gifUrl.slice(4)} alt="GIF" className="h-24 rounded-sm object-cover" />}
                        {previewUrl && !gifUrl && (
                          mediaFile?.type.startsWith("video/") ? (
                            <video src={previewUrl} className="h-24 rounded-sm object-cover" />
                          ) : (
                            <img src={previewUrl} className="h-24 rounded-sm object-cover" />
                          )
                        )}
                        <button onClick={clearMedia} className="absolute -top-2 -right-2 p-1 bg-background/90 rounded-full shadow-sm hover:text-destructive">
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-1.5 items-center">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitReply()}
                        placeholder={`Responder ${comment.authorName}…`}
                        disabled={submitting}
                        className="flex-1 bg-secondary/30 border border-border/50 rounded-sm px-2.5 py-1.5 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
                      />

                      {/* Botões de anexo */}
                      <button onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_IMAGE; fileRef.current.click(); } }} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1 disabled:opacity-40">
                        <ImageIcon size={14} />
                      </button>
                      <button onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_VIDEO; fileRef.current.click(); } }} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1 disabled:opacity-40">
                        <Video size={14} />
                      </button>
                      <button onClick={() => setShowGif(true)} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1 disabled:opacity-40">
                        <Smile size={14} />
                      </button>

                      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

                      <button
                        onClick={handleSubmitReply}
                        disabled={(!replyText.trim() && !hasMediaInput) || submitting}
                        className="px-2.5 py-1.5 rounded-sm text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
                        style={{ background: "hsl(155 60% 35%)" }}>
                        <Send size={11} />
                      </button>
                      
                      <button onClick={() => { setShowReplyInput(false); setReplyText(""); clearMedia(); }} className="text-[10px] font-accent text-muted-foreground hover:text-foreground transition px-1">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* GifPicker Modal */}
                <AnimatePresence>
                  {showGif && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowGif(false)}>
                      <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
                    </div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Replies aninhadas ── */}
      <AnimatePresence>
        {showReplies && comment.replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2 mt-2">
            <div className="relative ml-3.5">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border/40" />
              <div className="space-y-2 pl-5">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    myUserId={myUserId}
                    myName={myName}
                    myAvatarUrl={myAvatarUrl}
                    myDisc={myDisc}
                    myDiscRingImg={myDiscRingImg}
                    depth={1}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CommentItem;