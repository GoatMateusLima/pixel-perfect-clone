/**
 * PostCard.tsx
 *
 * Componente de card de publicação.
 * Exporta também tipos e helpers usados por outros componentes.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import PostMedia from "./PostMedia";

import dominanciaImg   from "@/assets/disc/Dominancia.webp";
import influenciaImg   from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Publication = {
  id?:         string;
  created_at?: string;
  description?: string;
  date?:       string;
  midia?:      string;
  creator_id?: string;
  like_qnt?:   number;
  liked_by?:   string[];
};

export type Profile = {
  id:             string;
  name:           string;
  avatar_url?:    string;
  disc_ring_img?: string;
  role?:          string;
  disc?:          "D" | "I" | "S" | "C";
};

export interface Comment {
  id:          number | string;
  author:      string;
  initials:    string;
  avatar_url?: string;
  disc:        string;
  text:        string;
  time:        string;
}

export interface Post extends Publication {
  profile?:  Profile;
  liked:     boolean;
  saved:     boolean;
  comments:  Comment[];
  liked_by?: string[];
}

// ─── Constantes DISC ──────────────────────────────────────────────────────────

export const DISC_IMGS: Record<string, string> = {
  D: dominanciaImg, I: influenciaImg,
  S: estabilidadeImg, C: conformidadeImg,
};

export const DISC_COLOR: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)",
  S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};

export const DISC_LABEL: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
};

export const toInitials = (name?: string) =>
  (name ?? "??").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// ─── UserAvatar ───────────────────────────────────────────────────────────────

export const UserAvatar = ({
  avatarUrl, name, disc, size = "md", isMe = false, discRingImg,
}: {
  avatarUrl?:   string | null;
  name?:        string;
  disc?:        string;
  size?:        "sm" | "md" | "lg";
  isMe?:        boolean;
  discRingImg?: string;
}) => {
  const discColor = DISC_COLOR[disc ?? "S"] ?? DISC_COLOR.S;
  const initials  = toInitials(name);
  const cfg = {
    sm: { outer: 28, inner: 20, textSize: "text-[8px]",  wh: "w-7 h-7"  },
    md: { outer: 36, inner: 26, textSize: "text-[9px]",  wh: "w-9 h-9"  },
    lg: { outer: 48, inner: 34, textSize: "text-xs",     wh: "w-12 h-12" },
  }[size];

  const inner = avatarUrl
    ? <img src={avatarUrl} alt={name ?? "avatar"} className="w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
    : <span>{initials}</span>;

  if (isMe && discRingImg) {
    return (
      <div className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: cfg.outer, height: cfg.outer }}>
        <img src={discRingImg} alt="DISC"
          className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
        <div className={`absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold ${cfg.textSize} z-10`}
          style={{ width: cfg.inner, height: cfg.inner, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: avatarUrl ? undefined : "hsl(var(--secondary))",
            border: "2px solid hsl(var(--background))", color: discColor }}>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cfg.wh} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-display font-bold ${cfg.textSize}`}
      style={{ border: `2px solid ${discColor}60`, boxShadow: `0 0 10px ${discColor}25`,
        background: avatarUrl ? undefined : `linear-gradient(135deg, ${discColor}33, ${discColor}15)`,
        color: discColor }}>
      {inner}
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post?:          Post;
  publicationId?: string;
  onLike?:        (id: string) => void;
  onSave?:        (id: string) => void;
  onOpenModal?:   (post: Post) => void;
  myAvatarUrl?:   string | null;
  myName?:        string;
  myDisc?:        string;
  myDiscRingImg?: string;
}

const PostCard = ({
  post: postProp,
  publicationId,
  onLike,
  onSave,
  onOpenModal,
  myAvatarUrl,
  myName    = "",
  myDisc    = "S",
  myDiscRingImg,
}: PostCardProps) => {

  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [showMenu,    setShowMenu]    = useState(false);

  // Modo avulso: busca pelo publicationId
  useEffect(() => {
    if (!publicationId) return;
    setLoading(true);
    supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .eq("id", publicationId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setFetchError(error?.message ?? "Não encontrado"); setLoading(false); return; }
        const p = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles ?? null;
        const b = (p?.bordas ?? []).find((b: any) => b.ativa) ?? null;
        setFetchedPost({
          id: data.id, created_at: data.created_at, description: data.description,
          date: data.date, midia: data.midia, creator_id: data.creator_id,
          liked_by: data.liked_by ?? [], like_qnt: (data.liked_by ?? []).length,
          profile: p ? { id: p.user_id, name: p.name ?? "Usuário",
            avatar_url: p.perfil ?? undefined, disc_ring_img: b?.img_url ?? undefined,
            role: p.descricao ?? undefined } : undefined,
          liked: false, saved: false, comments: [],
        });
        setLoading(false);
      });
  }, [publicationId]);

  const post = postProp ?? fetchedPost;

  if (loading) return (
    <div className="hologram-panel rounded-sm p-6 flex items-center justify-center">
      <span className="text-xs text-muted-foreground font-body animate-pulse">Carregando…</span>
    </div>
  );

  if (fetchError || !post) return (
    <div className="hologram-panel rounded-sm p-6 flex items-center justify-center">
      <span className="text-xs text-muted-foreground font-body">{fetchError ?? "Publicação não disponível."}</span>
    </div>
  );

  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  const isMe            = post.creator_id === "me" || authorName === myName;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/comunidade?post=${post.id}`);
    setShowMenu(false);
  };

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }} transition={{ duration: 0.35 }}
      className="hologram-panel rounded-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="p-5 pb-0 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 cursor-pointer" onClick={() => post && onOpenModal?.(post)}>
          <UserAvatar
            avatarUrl={isMe ? myAvatarUrl : authorAvatarUrl}
            name={isMe ? myName : authorName}
            disc={isMe ? myDisc : authorDisc}
            size="lg" isMe={isMe}
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
            <p className="text-[10px] text-muted-foreground font-body opacity-60">{formatRelativeTime(post.date)}</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm">
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 z-20 hologram-panel rounded-sm py-1 min-w-[140px] text-xs font-body">
                <button className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">
                  Denunciar post
                </button>
                <button onClick={copyLink} className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">
                  Copiar link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Descrição ── */}
      <div className="px-5 py-4 cursor-pointer" onClick={() => post && onOpenModal?.(post)}>
        <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line line-clamp-4">
          {post.description}
        </p>
      </div>

      {/* ── Mídia (imagem, vídeo ou GIF) ── */}
      {post.midia && post.midia !== "EMPTY" && (
        <div className="px-5 pb-2">
          <PostMedia
            midia={post.midia}
            maxHeight={340}
            onClick={() => post && onOpenModal?.(post)}
          />
        </div>
      )}

      {/* ── Contadores ── */}
      <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground font-body border-t border-border/30 pt-3">
        <span>{post.like_qnt ?? 0} curtidas</span>
        <button onClick={() => post && onOpenModal?.(post)} className="hover:text-foreground transition">
          {post.comments.length} comentários · Ver todos
        </button>
      </div>

      {/* ── Ações ── */}
      <div className="px-5 py-2 flex items-center gap-1 border-t border-border/30">
        {[
          { label: "Curtir",      el: <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />,    active: post.liked,  color: "text-rose-400", fn: () => post.id && onLike?.(post.id) },
          { label: "Comentar",    el: <MessageCircle size={14} />,                                            active: false,       color: "",             fn: () => post && onOpenModal?.(post) },
          { label: "Salvar",      el: <Bookmark size={14} className={post.saved ? "fill-primary" : ""} />,  active: post.saved,  color: "text-primary", fn: () => post.id && onSave?.(post.id) },
          { label: "Copiar link", el: <Share2 size={14} />,                                                   active: false,       color: "",             fn: copyLink },
        ].map(({ label, el, active, color, fn }) => (
          <button key={label} onClick={fn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xs font-accent font-semibold transition hover:bg-secondary/40 ${active ? color : "text-muted-foreground hover:text-foreground"}`}>
            {el} {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default PostCard;