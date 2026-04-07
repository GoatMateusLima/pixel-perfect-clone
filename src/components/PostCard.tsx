/**
 * PostCard.tsx
 *
 * Componente de card de publicação.
 * Exporta também tipos e helpers usados por outros componentes.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Loader2 } from "lucide-react";
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
  comments?:   any[];
  isCommentHit?: boolean;
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
  userId?:     string;
  isCommentHit?: boolean;
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
    sm: { outer: 32, inner: 22, textSize: "text-[9px]",  wh: "w-8 h-8"  },
    md: { outer: 40, inner: 28, textSize: "text-[10px]", wh: "w-10 h-10" },
    lg: { outer: 52, inner: 38, textSize: "text-[11px]", wh: "w-[52px] h-[52px]" },
  }[size];

  const inner = avatarUrl
    ? <img src={avatarUrl} alt={name ?? "avatar"} className="w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
    : <span>{initials}</span>;

  if (isMe && discRingImg) {
    return (
      <div className="relative flex-shrink-0 flex items-center justify-center group/avatar"
        style={{ width: cfg.outer, height: cfg.outer }}>
        <img src={discRingImg} alt="DISC"
          className="absolute inset-0 w-full h-full rounded-full object-cover shadow-lg transition-transform duration-300 group-hover/avatar:scale-110" style={{ zIndex: 1 }} />
        <div className={`absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold ${cfg.textSize} z-10`}
          style={{ width: cfg.inner, height: cfg.inner, top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: avatarUrl ? undefined : "hsl(var(--secondary))",
            border: "1.5px solid hsl(var(--background))", color: discColor }}>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cfg.wh} rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center font-display font-black ${cfg.textSize} group/avatar transition-all duration-500`}
      style={{ 
        border: `1px solid rgba(16, 185, 129, 0.4)`, 
        boxShadow: `0 0 20px rgba(16, 185, 129, 0.1)`,
        background: avatarUrl ? "rgba(0,0,0,0.4)" : `linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))`,
        color: "hsl(142 72% 50%)" 
      }}>
      <div className="w-full h-full transition-transform duration-700 group-hover/avatar:scale-110 flex items-center justify-center">
        {inner}
      </div>
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
  myName    = "",
  myDiscRingImg,
}: PostCardProps) => {

  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [internalLoading, setLoading]     = useState(false);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [showMenu,    setShowMenu]    = useState(false);
  
  // NOVO: Estado para armazenar a quantidade de comentários
  const [commentCount, setCommentCount] = useState<number>(0);

  const navigate = useNavigate();

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

  // Busca count inicial e escuta novos comentários em realtime
  useEffect(() => {
    if (!post?.id) return;

    // 1. Busca count inicial
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("publication_id", post.id)
      .then(({ count, error }) => {
        if (!error && count !== null) setCommentCount(count);
      });

    // 2. Realtime — escuta INSERT e DELETE na tabela comments para este post
    const channelName = `comments-count-${post.id}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `publication_id=eq.${post.id}` },
        () => setCommentCount((prev) => prev + 1)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments", filter: `publication_id=eq.${post.id}` },
        () => setCommentCount((prev) => Math.max(0, prev - 1))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [post?.id]);

  // Se estiver carregando por conta do publicationId
  if (internalLoading) return (
    <div className="glass-card mb-6 rounded-3xl border-white/5 shadow-2xl p-7 flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground font-body animate-pulse">Buscando publicação…</span>
      </div>
    </div>
  );

  if (fetchError || !post) return (
    <div className="glass-card mb-6 rounded-3xl border-white/5 shadow-2xl p-7 flex items-center justify-center min-h-[120px]">
      <span className="text-xs text-muted-foreground font-body">{fetchError ?? "Publicação não disponível."}</span>
    </div>
  );

  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  
  const isMe = post.creator_id === "me" || authorName === myName;

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/comunidade?post=${post.id}`);
    setShowMenu(false);
  };

  return (
    <motion.div
      className="glass-card relative mb-6 last:mb-0 group/card rounded-3xl border-white/5 shadow-2xl overflow-hidden">

      {/* ── Header ── */}
      <div className="px-7 pt-7 pb-0 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 cursor-pointer group/avatar" onClick={() => post && onOpenModal?.(post)}>
          <UserAvatar
            avatarUrl={authorAvatarUrl}
            name={authorName}
            disc={authorDisc}
            size="lg" 
            isMe={isMe}
            discRingImg={isMe ? myDiscRingImg : post.profile?.disc_ring_img}
          />
          <div className="pt-0.5">
            <div className="flex items-center gap-2.5">
              <p className="font-display font-black text-lg text-white group-hover/avatar:text-primary transition-colors duration-300 tracking-tight">
                {authorName}
              </p>
              <div className="px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 border"
                style={{ background: `${DISC_COLOR[authorDisc]}08`, color: DISC_COLOR[authorDisc], borderColor: `${DISC_COLOR[authorDisc]}15` }}>
                <span className="text-[10px] font-accent font-black uppercase tracking-widest leading-none">{authorDisc}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-white/30">
               <p className="text-[12px] font-body font-bold uppercase tracking-tighter">{authorRole}</p>
               <span className="w-1 h-1 rounded-full bg-white/20" />
               <p className="text-[11px] font-body tracking-tight">{formatRelativeTime(post.date)}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm">
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 1, scale: 0.98, y: -2 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
      <div className="px-7 pt-5 pb-3 cursor-pointer" onClick={() => post && onOpenModal?.(post)}>
        <p className="text-[15px] font-body text-foreground/90 leading-[1.7] whitespace-pre-line line-clamp-6">
          {post.description?.split(/(#\w+)/g).map((part, i) => 
            part.startsWith('#') ? (
              <span key={i} className="text-primary font-bold underline cursor-pointer hover:text-green-400" onClick={(e) => { e.stopPropagation(); navigate(`?tag=${encodeURIComponent(part)}`); }}>
                {part}
              </span>
            ) : (
              part
            )
          )}
        </p>
      </div>

      {/* ── Mídia ── */}
      {post.midia && post.midia !== "EMPTY" && (
        <div className="mt-3 px-7 cursor-pointer"
          onClick={() => post && onOpenModal?.(post)}>
          <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-transform duration-700 group-hover/card:scale-[1.005]">
            <PostMedia midia={post.midia} maxHeight={520} />
          </div>
        </div>
      )}

      {/* ── Contadores ── */}
      <div className="px-7 py-2.5 flex items-center justify-between text-[12px] text-muted-foreground font-body">
        <span className="tabular-nums">{post.like_qnt ?? 0} curtidas</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            post && onOpenModal?.(post);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {commentCount} {commentCount === 1 ? "comentário" : "comentários"}
        </button>
      </div>

      {/* ── Ações (barra leve, legível) ── */}
      <div className="px-7 pb-6">
        <div className="flex items-center rounded-2xl border border-white/[0.08] bg-black/20 px-1 py-1 backdrop-blur-sm">
          {[
            {
              label: "Curtir",
              icon: (
                <Heart
                  size={18}
                  strokeWidth={1.75}
                  className={post.liked ? "fill-primary text-primary" : "text-current"}
                />
              ),
              active: post.liked,
              fn: () => post.id && onLike?.(post.id),
            },
            {
              label: "Comentar",
              icon: <MessageCircle size={18} strokeWidth={1.75} className="text-current" />,
              active: false,
              fn: () => post && onOpenModal?.(post),
            },
            {
              label: "Salvar",
              icon: (
                <Bookmark
                  size={18}
                  strokeWidth={1.75}
                  className={post.saved ? "fill-primary text-primary" : "text-current"}
                />
              ),
              active: post.saved,
              fn: () => post.id && onSave?.(post.id),
            },
            {
              label: "Copiar link",
              icon: <Share2 size={18} strokeWidth={1.75} className="text-current" />,
              active: false,
              fn: copyLink,
            },
          ].map(({ label, icon, active, fn }) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={(e) => {
                e.stopPropagation();
                fn();
              }}
              className={
                active
                  ? "flex flex-1 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-2 px-1 rounded-xl text-primary bg-primary/[0.12] transition-colors hover:bg-primary/[0.16]"
                  : "flex flex-1 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-2 px-1 rounded-xl text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
              }
            >
              {icon}
              <span className="text-[10px] sm:text-[11px] font-body font-medium leading-none sm:leading-tight">
                {label === "Copiar link" ? "Link" : label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;