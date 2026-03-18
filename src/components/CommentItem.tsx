
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownRight, Send, Trash2 } from "lucide-react";
import { UserAvatar, toInitials, DISC_COLOR } from "./PostCard";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DbComment {
  id:             string;
  user_id:        string;
  publication_id: string;
  comment:        string;
  like:           number;
  parent_id?:     string | null;
  created_at?:    string;
  // JOIN com profiles
  profiles?: {
    user_id:   string;
    name:      string;
    perfil?:   string;
    bordas?:   any[];
  } | null;
}

export interface CommentNode extends DbComment {
  replies: CommentNode[];  // replies aninhadas (1 nível)
  authorName:     string;
  authorAvatar?:  string;
  authorRingImg?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Transforma lista flat em árvore de 1 nível (comentário + replies) */
export function buildCommentTree(flat: DbComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();

  // 1. Cria todos os nós
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

  // 2. Liga replies aos pais
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
  depth?:       number;           // 0 = raiz, 1 = reply
  onReply:      (parentId: string, text: string) => Promise<void>;
  onDelete:     (commentId: string) => Promise<void>;
}

const CommentItem = ({
  comment, myUserId, myName, myAvatarUrl, myDisc, myDiscRingImg,
  depth = 0, onReply, onDelete,
}: CommentItemProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [showReplies,    setShowReplies]    = useState(true);

  const isMyComment = comment.user_id === myUserId;
  const discColor   = DISC_COLOR["S"]; // sem disc no comentário, usa neutro

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(comment.id, replyText.trim());
    setReplyText("");
    setShowReplyInput(false);
    setSubmitting(false);
  };

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
          {/* Balão */}
          <div className="bg-secondary/30 rounded-sm px-3 py-2 relative">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] font-accent font-semibold text-foreground">
                {comment.authorName}
              </p>
              {/* Deletar — só aparece para o próprio usuário */}
              {isMyComment && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  title="Deletar comentário">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            <p className="text-xs font-body text-muted-foreground leading-relaxed">
              {comment.comment}
            </p>
          </div>

          {/* Ações abaixo do balão */}
          <div className="flex items-center gap-3 mt-1 px-1">
            {/* Reply — só em comentários raiz (depth 0) */}
            {depth === 0 && (
              <button
                onClick={() => setShowReplyInput((v) => !v)}
                className="text-[10px] font-accent text-muted-foreground hover:text-primary transition flex items-center gap-1">
                <CornerDownRight size={10} />
                Responder
              </button>
            )}

            {/* Expandir/recolher replies */}
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

          {/* Input de reply */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden">
                <div className="flex gap-2 items-center ml-1">
                  <UserAvatar
                    avatarUrl={myAvatarUrl} name={myName} disc={myDisc}
                    size="sm" isMe discRingImg={myDiscRingImg}
                  />
                  <div className="flex-1 flex gap-1.5">
                    <input
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitReply()}
                      placeholder={`Responder ${comment.authorName}…`}
                      disabled={submitting}
                      className="flex-1 bg-secondary/30 border border-border/50 rounded-sm px-2.5 py-1.5 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
                    />
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyText.trim() || submitting}
                      className="px-2.5 py-1.5 rounded-sm text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
                      style={{ background: "hsl(155 60% 35%)" }}>
                      <Send size={11} />
                    </button>
                    <button
                      onClick={() => { setShowReplyInput(false); setReplyText(""); }}
                      className="text-[10px] font-accent text-muted-foreground hover:text-foreground transition px-1">
                      ✕
                    </button>
                  </div>
                </div>
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
            {/* Linha vertical de thread */}
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
