/**
 * PostModal.tsx
 *
 * Modal de post isolado — carrega comentários do Supabase ao abrir.
 * Importado pelo CommunityPage (e pode ser reutilizado em qualquer outra página).
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Bookmark, Share2, Send } from "lucide-react";
import supabase from "../../utils/supabase.ts";

import {
  Post, Comment,
  DISC_COLOR, DISC_LABEL,
  UserAvatar,
  formatRelativeTime, toInitials,
} from "./PostCard";

// ─── Tipo pivot "comments" no Supabase ────────────────────────────────────────

export type DbComment = {
  id?:            string;
  user_id?:       string;
  publication_id: string;
  comment:        string;
  like?:          number;
};

// ─── PostModal ────────────────────────────────────────────────────────────────

interface PostModalProps {
  post:          Post;
  onClose:       () => void;
  onLike:        (id: string) => void;
  onSave:        (id: string) => void;
  myAvatarUrl:   string | null;
  myName:        string;
  myDisc:        string;
  myDiscRingImg: string | undefined;
  myUserId?:     string;
}

const PostModal = ({
  post, onClose, onLike, onSave,
  myAvatarUrl, myName, myDisc, myDiscRingImg, myUserId,
}: PostModalProps) => {
  const [commentText, setCommentText] = useState("");
  const [dbComments,  setDbComments]  = useState<Comment[]>([]);
  const [loading,     setLoading]     = useState(true);

  // Carrega comentários da tabela pivot no Supabase ao abrir o modal
  useEffect(() => {
    if (!post.id) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("publication_id", post.id);

      if (!error && data) {
        setDbComments(data.map((c: DbComment) => ({
          id:       c.id ?? Date.now(),
          author:   c.user_id ?? "Usuário",   // substituir por JOIN com profiles quando disponível
          initials: (c.user_id ?? "U").slice(0, 2).toUpperCase(),
          disc:     "S",
          text:     c.comment,
          time:     "—",
        })));
      }
      setLoading(false);
    };
    load();
  }, [post.id]);

  // Salva comentário na tabela pivot e atualiza UI
  const submitComment = async () => {
    if (!commentText.trim() || !post.id) return;
    const newDbComment: DbComment = {
      user_id:        myUserId,
      publication_id: post.id,
      comment:        commentText.trim(),
      like:           0,
    };
    const { error } = await supabase.from("comments").insert(newDbComment);
    if (error) { alert(error.message); return; }

    setDbComments((prev) => [...prev, {
      id:        Date.now(),
      author:    myName,
      initials:  toInitials(myName),
      avatar_url: myAvatarUrl ?? undefined,
      disc:      myDisc,
      text:      commentText.trim(),
      time:      "agora",
    }]);
    setCommentText("");
  };

  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  const isMe            = post.creator_id === myUserId || authorName === myName;

  const copyLink = () => {
    const url = `${window.location.origin}/comunidade?post=${post.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onClose}>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="hologram-panel rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}>

          {/* ── Header do modal ── */}
          <div className="p-5 pb-0 flex items-start justify-between gap-3 flex-shrink-0">
            <div className="flex items-start gap-3">
              <UserAvatar
                avatarUrl={isMe ? myAvatarUrl : authorAvatarUrl}
                name={isMe ? myName : authorName}
                disc={isMe ? myDisc : authorDisc}
                size="lg"
                isMe={isMe}
                discRingImg={isMe ? myDiscRingImg : post.profile?.disc_ring_img}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-accent font-semibold text-sm text-foreground">
                    {isMe ? myName : authorName}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-accent font-semibold"
                    style={{ background: `${DISC_COLOR[authorDisc]}18`, color: DISC_COLOR[authorDisc], border: `1px solid ${DISC_COLOR[authorDisc]}40` }}>
                    {authorDisc} · {DISC_LABEL[authorDisc]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5">{authorRole}</p>
                <p className="text-[10px] text-muted-foreground font-body opacity-60">
                  {formatRelativeTime(post.date)}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm flex-shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* ── Conteúdo do post ── */}
          <div className="px-5 py-4 flex-shrink-0">
            <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line">
              {post.description}
            </p>
          </div>

          {/* ── Imagem (se houver) ── */}
          {post.midia && post.midia !== "EMPTY" && (
            <div className="px-5 pb-4 flex-shrink-0">
              <div className="rounded-sm overflow-hidden border border-border/40" style={{ maxHeight: 280 }}>
                <img src={post.midia} alt="Post" className="w-full object-cover" style={{ maxHeight: 280 }} />
              </div>
            </div>
          )}

          {/* ── Contadores ── */}
          <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground font-body border-t border-border/30 pt-3 flex-shrink-0">
            <span>{post.like_qnt ?? 0} curtidas</span>
            <span>{dbComments.length} comentários</span>
          </div>

          {/* ── Ações ── */}
          <div className="px-5 py-2 flex items-center gap-1 border-t border-border/30 flex-shrink-0">
            {[
              { label: "Curtir",      el: <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />,    active: post.liked,  color: "text-rose-400", fn: () => post.id && onLike(post.id) },
              { label: "Salvar",      el: <Bookmark size={14} className={post.saved ? "fill-primary" : ""} />,  active: post.saved,  color: "text-primary",  fn: () => post.id && onSave(post.id) },
              { label: "Copiar link", el: <Share2 size={14} />,                                                  active: false,       color: "",              fn: copyLink },
            ].map(({ label, el, active, color, fn }) => (
              <button key={label} onClick={fn}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xs font-accent font-semibold transition hover:bg-secondary/40 ${active ? color : "text-muted-foreground hover:text-foreground"}`}>
                {el} {label}
              </button>
            ))}
          </div>

          {/* ── Comentários — carregados do Supabase ── */}
          <div className="border-t border-border/30 overflow-y-auto flex-1 px-5 py-4 space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground font-body text-center py-4">
                Carregando comentários…
              </p>
            ) : dbComments.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body text-center py-4">
                Seja o primeiro a comentar!
              </p>
            ) : (
              dbComments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <UserAvatar avatarUrl={c.avatar_url} name={c.author} disc={c.disc} size="sm" />
                  <div className="bg-secondary/30 rounded-sm px-3 py-2 flex-1">
                    <p className="text-[11px] font-accent font-semibold text-foreground mb-0.5">{c.author}</p>
                    <p className="text-xs font-body text-muted-foreground">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Input de novo comentário ── */}
          <div className="flex gap-2.5 p-4 border-t border-border/30 flex-shrink-0">
            <UserAvatar avatarUrl={myAvatarUrl} name={myName} disc={myDisc} size="sm" isMe discRingImg={myDiscRingImg} />
            <div className="flex-1 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
                placeholder="Escreva um comentário…"
                className="flex-1 bg-secondary/30 border border-border/50 rounded-sm px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition"
              />
              <button onClick={submitComment}
                className="px-3 py-2 rounded-sm text-primary-foreground transition hover:brightness-110"
                style={{ background: "hsl(155 60% 35%)" }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostModal;