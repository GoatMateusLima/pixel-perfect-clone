/**
 * PostCard.tsx
 *
 * Componente isolado de card de publicação.
 *
 * Uso básico (lista):
 *   <PostCard post={post} onLike={fn} onSave={fn} onOpenModal={fn}
 *     myAvatarUrl={...} myName={...} myDisc={...} myDiscRingImg={...} />
 *
 * Uso por ID (embed avulso, ex: widget externo):
 *   <PostCard publicationId="uuid-aqui" ... />
 *   → Busca a publicação no Supabase automaticamente pelo ID.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import supabase from "../../utils/supabase.ts";

import dominanciaImg   from "@/assets/disc/Dominancia.webp";
import influenciaImg   from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";

// ─── Tipos (espelham as tabelas do Supabase) ──────────────────────────────────

export type Publication = {
  id?:          string;
  created_at?:  string;
  description?: string;
  date?:        string;
  midia?:       string;   // URL ou base64; "EMPTY" = sem imagem
  creator_id?:  string;
  like_qnt?:    number;
  liked_by?:    string[]; // uuid[] — lista de user_ids que curtiram
};

export type Profile = {
  id:           string;
  name:         string;
  avatar_url?:  string;
  role?:        string;
  disc?:        "D" | "I" | "S" | "C";
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
  liked_by?: string[];    // espelhado de Publication para acesso direto no card
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
//
// Props:
//   - post          → objeto Post completo (uso em lista, já tem os dados)
//   - publicationId → UUID do Supabase (uso avulso; busca os dados internamente)
//
// Exatamente um dos dois deve ser fornecido.

interface PostCardProps {
  // Modo lista (passa o objeto direto)
  post?: Post;
  // Modo avulso (busca pelo ID no Supabase)
  publicationId?: string;

  // Handlers de interação — opcionais no modo avulso
  onLike?:      (id: string) => void;
  onSave?:      (id: string) => void;
  onOpenModal?: (post: Post) => void;

  // Dados do usuário logado — para avatar/anel DISC corretos
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
  myName   = "",
  myDisc   = "S",
  myDiscRingImg,
}: PostCardProps) => {

  // ── Quando recebe publicationId: busca a publicação no Supabase ──────────────
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!publicationId) return;
    const load = async () => {
      setLoading(true);
      setError(null);

      // Busca publicação + perfil do autor
      // Quando a tabela profiles existir: .select("*, profile:profiles(*)")
      const { data, error: err } = await supabase
        .from("publications")
        .select("*")
        .eq("id", publicationId)
        .maybeSingle();

      if (err)   { setError(err.message); setLoading(false); return; }
      if (!data) { setError("Publicação não encontrada."); setLoading(false); return; }

      setFetchedPost({
        id:          data.id,
        created_at:  data.created_at,
        description: data.description,
        date:        data.date,
        midia:       data.midia,
        creator_id:  data.creator_id,
        like_qnt:    data.like_qnt ?? 0,
        profile:     undefined,   // preencher quando o JOIN com profiles existir
        liked:       false,
        saved:       false,
        comments:    [],
      });
      setLoading(false);
    };
    load();
  }, [publicationId]);

  // Resolve qual post usar (prop direta ou buscado)
  const post = postProp ?? fetchedPost;

  // ── Loadings / erros ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="hologram-panel rounded-sm p-6 flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-body animate-pulse">Carregando publicação…</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="hologram-panel rounded-sm p-6 flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-body">{error ?? "Publicação não disponível."}</span>
      </div>
    );
  }

  // ── Derivados ────────────────────────────────────────────────────────────────
  const [showMenu, setShowMenu] = useState(false);

  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  const isMe            = post.creator_id === "me" || authorName === myName;

  const copyLink = () => {
    const url = `${window.location.origin}/comunidade?post=${post.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="hologram-panel rounded-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="p-5 pb-0 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 cursor-pointer"
          onClick={() => post && onOpenModal?.(post)}>
          <UserAvatar
            avatarUrl={isMe ? myAvatarUrl : authorAvatarUrl}
            name={isMe ? myName : authorName}
            disc={isMe ? myDisc : authorDisc}
            size="lg" isMe={isMe} discRingImg={isMe ? myDiscRingImg : undefined}
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

        {/* Menu ⋯ */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm">
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 z-20 hologram-panel rounded-sm py-1 min-w-[140px] text-xs font-body">
                <button className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">
                  Denunciar post
                </button>
                <button onClick={copyLink}
                  className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">
                  Copiar link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="px-5 py-4 cursor-pointer" onClick={() => post && onOpenModal?.(post)}>
        <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line line-clamp-4">
          {post.description}
        </p>
      </div>

      {/* ── Imagem (se houver) ── */}
      {post.midia && post.midia !== "EMPTY" && (
        <div className="px-5 pb-4 cursor-pointer" onClick={() => post && onOpenModal?.(post)}>
          <div className="rounded-sm overflow-hidden border border-border/40" style={{ maxHeight: 340 }}>
            <img src={post.midia} alt="Post" className="w-full object-cover" style={{ maxHeight: 340 }} />
          </div>
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
          {
            label:  "Curtir",
            el:     <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />,
            active: post.liked,
            color:  "text-rose-400",
            fn:     () => post.id && onLike?.(post.id),
          },
          {
            label:  "Comentar",
            el:     <MessageCircle size={14} />,
            active: false,
            color:  "",
            fn:     () => post && onOpenModal?.(post),
          },
          {
            label:  "Salvar",
            el:     <Bookmark size={14} className={post.saved ? "fill-primary" : ""} />,
            active: post.saved,
            color:  "text-primary",
            fn:     () => post.id && onSave?.(post.id),
          },
          {
            label:  "Copiar link",
            el:     <Share2 size={14} />,
            active: false,
            color:  "",
            fn:     copyLink,
          },
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