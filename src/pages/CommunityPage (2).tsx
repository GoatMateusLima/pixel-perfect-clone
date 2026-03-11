import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, ImageIcon, X, Send,
  Bookmark, MoreHorizontal, TrendingUp, Users, Zap,
  Trophy, BookOpen, ExternalLink, Clock, ChevronRight, Flame,
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "../../utils/supabase.ts";

import dominanciaImg   from "@/assets/disc/Dominancia.webp";
import influenciaImg   from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";

// ─── Tipo: tabela publications (Supabase) ─────────────────────────────────────
export type Publication = {
  id?:          string;   // uuid PK
  created_at?:  string;   // timestamptz
  description?: string;   // text
  date?:        string;   // timestamptz
  midia?:       string;   // text — URL ou base64 da imagem do POST
  creator_id?:  string;   // uuid FK → profiles
  like_qnt?:    number;   // numeric
};

export function CreatePublication() {
  const { user, signOutUser } = useAuth(); // obtendo o usuário logado e a função de logout

  const [publi, setPubli] = useState<Publication>({});

  async function handleDescriptionChange() {
    const agora: string = new Date().toISOString(); // string ISO 8601 — Supabase converte para timestamptz automaticamente

    const data = {
      description: publi.description,
      midia:       publi.midia ?? "EMPTY",
      date:        agora,
      creator_id:  user?.id,
      like_qnt:    0,
    };

    console.log("data enviado ao Supabase:", data); // DEBUG
    const {error} = await supabase.from('publications').insert(data);

    if(error){ // corrigido: "error" minúsculo — Error maiúsculo é a classe global do JS e nunca é falsy
      alert(error.message);
      return;
    }

  }

  return (
    <>
      <input
        type="text"
        placeholder="Escreva aqui o que você tem em mente..."
        value={publi.description ?? ""} // ?? "" necessário no TypeScript para input controlado
        onChange={(e) => setPubli({ ...publi, description: e.target.value })} //setando o valor escrito
      />
      <input
        type="text"
        placeholder="Adicione uma imagem (opcional)"
        value={publi.midia ?? ""} // ?? "" necessário no TypeScript para input controlado
        onChange={(e) => setPubli({ ...publi, midia: e.target.value })}
      />
      {/* Botão conectado à sua função — só ativa se description tiver conteúdo */}
      <button
        onClick={handleDescriptionChange}
        disabled={!publi.description?.trim()}
      >
        Publicar
      </button>
    </>
  );
}

// ─── Tipo: tabela profiles (Supabase — ainda não criada) ──────────────────────
// Quando o Supabase retornar, virá via JOIN:
//   .from('publications').select('*, profile:profiles(*)')
export type Profile = {
  id:           string;   // uuid PK = auth.users.id
  name:         string;   // text
  avatar_url?:  string;   // text — URL do Supabase Storage (foto de perfil)
  role?:        string;   // text
  disc?:        "D" | "I" | "S" | "C";
};

const DISC_IMGS: Record<string, string> = {
  D: dominanciaImg, I: influenciaImg,
  S: estabilidadeImg, C: conformidadeImg,
};
const DISC_COLOR: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)",
  S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};
const DISC_LABEL: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};

const KEY_PHOTO = "upjobs_profile_photo_v2";

// ─── Tipos internos de UI ─────────────────────────────────────────────────────

interface Comment {
  id:          number;
  author:      string;
  initials:    string;
  avatar_url?: string;   // URL da foto — profiles.avatar_url
  disc:        string;
  text:        string;
  time:        string;
}

// Post = Publication + profile JOIN + estado de UI
interface Post extends Publication {
  profile?:  Profile;   // dados do autor via JOIN com profiles
  liked:     boolean;
  saved:     boolean;
  comments:  Comment[];
}

interface NewsItem {
  id: number; title: string; category: string;
  categoryColor: string; time: string; url: string; image: string; hot?: boolean;
}

// ─── DADOS MOCKADOS ───────────────────────────────────────────────────────────
// Simula: supabase.from('publications').select('*, profile:profiles(*)')
// profile.avatar_url é uma URL de imagem renderizada diretamente via <img>

const INITIAL_POSTS: Post[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    created_at: "2026-03-11T10:00:00.000+00:00",
    description: "Acabei de fechar minha primeira vaga remota como PM em uma startup de fintech 🚀\n\nDepois de 4 meses na trilha UpJobs, saí de R$28/h presencial para R$95/h remoto. A calculadora de Marcius me abriu os olhos: eu estava perdendo 38% da minha hora só com deslocamento.\n\nSe você ainda está na dúvida, o custo de oportunidade real é mais pesado do que parece. Não espere mais.",
    date: "2026-03-11T10:00:00.000+00:00",
    midia: undefined,
    creator_id: "user-uuid-larissa-0001",
    like_qnt: 142,
    profile: {
      id: "user-uuid-larissa-0001",
      name: "Larissa Mendes",
      avatar_url: "https://i.pravatar.cc/150?u=larissa",
      role: "Product Manager · UpJobs Academy",
      disc: "I",
    },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Rafael Costa",  initials: "RC", avatar_url: "https://i.pravatar.cc/150?u=rafael", disc: "D", text: "Incrível! Qual stack você aprendeu para a posição?", time: "há 1h" },
      { id: 2, author: "Camila Torres", initials: "CT", avatar_url: "https://i.pravatar.cc/150?u=camila", disc: "S", text: "Parabéns! Isso me dá esperança 💚", time: "há 45min" },
    ],
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    created_at: "2026-03-11T07:00:00.000+00:00",
    description: "Dica rápida para quem está aprendendo Python para Data Science:\n\n→ Não comece pelo pandas, comece pela lógica\n→ Kaggle competitions > tutoriais em loop\n→ Um projeto real vale 10 cursos completos\n\nMeu portfólio no GitHub foi o que realmente me contratou. Nenhum certificado chegou perto.",
    date: "2026-03-11T07:00:00.000+00:00",
    midia: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
    creator_id: "user-uuid-marcos-0002",
    like_qnt: 87,
    profile: {
      id: "user-uuid-marcos-0002",
      name: "Marcos Vinicius",
      avatar_url: "https://i.pravatar.cc/150?u=marcos",
      role: "Dev Backend · Freelancer",
      disc: "C",
    },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Ana Julia", initials: "AJ", avatar_url: "https://i.pravatar.cc/150?u=anajulia", disc: "I", text: "Esse ponto sobre o GitHub é real demais 🔥", time: "há 3h" },
    ],
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    created_at: "2026-03-10T12:00:00.000+00:00",
    description: "Insight do dia: a maioria das pessoas subestima UX Writing.\n\nNão é só nomear botões. É arquitetura cognitiva. É reduzir a carga mental do usuário em cada micro-decisão.\n\nQuando você entende isso, sua taxa de conversão muda de patamar.",
    date: "2026-03-10T12:00:00.000+00:00",
    midia: undefined,
    creator_id: "user-uuid-fernanda-0003",
    like_qnt: 203,
    profile: {
      id: "user-uuid-fernanda-0003",
      name: "Fernanda Lima",
      avatar_url: "https://i.pravatar.cc/150?u=fernanda",
      role: "UX Designer · Remoto",
      disc: "S",
    },
    liked: true, saved: true,
    comments: [],
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    created_at: "2026-03-09T09:00:00.000+00:00",
    description: "O mercado de cibersegurança no Brasil vai precisar de +150.000 profissionais até 2026 segundo a ISC².\n\nVaga sobrando. Salário alto. Trabalho 100% remoto.\n\nE ainda tem gente perguntando se vale a pena investir em carreira tech? 😅",
    date: "2026-03-09T09:00:00.000+00:00",
    midia: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    creator_id: "user-uuid-diego-0004",
    like_qnt: 318,
    profile: {
      id: "user-uuid-diego-0004",
      name: "Diego Almeida",
      avatar_url: "https://i.pravatar.cc/150?u=diego",
      role: "Cybersecurity Analyst",
      disc: "D",
    },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Larissa Mendes",  initials: "LM", avatar_url: "https://i.pravatar.cc/150?u=larissa", disc: "I", text: "Mercado de cyber é absurdo mesmo!", time: "há 1d" },
      { id: 2, author: "Marcos Vinicius", initials: "MV", avatar_url: "https://i.pravatar.cc/150?u=marcos",  disc: "C", text: "Falta mão de obra qualificada — confirmado!", time: "há 22h" },
    ],
  },
];

const MOCK_NEWS: NewsItem[] = [
  { id: 1, title: "Samsung lança Galaxy S26 com IA embarcada e Exynos 2600", category: "IA & Devices", categoryColor: "hsl(45 90% 55%)", time: "há 2h", url: "https://video.canaltech.com.br/video/hands-on/samsung-anuncia-linha-galaxy-s26-com-recursos-de-ia-e-exynos-2600-22627/", image: "https://t.ctcdn.com.br/VkKue7mxnh7puDyb4TNPTVOiXecY=/640x360/smart/i1104977.jpeg", hot: true },
  { id: 2, title: "OpenAI anuncia GPT-5 com raciocínio avançado para empresas", category: "Inteligência Artificial", categoryColor: "hsl(155 60% 45%)", time: "há 5h", url: "https://canaltech.com.br/inteligencia-artificial/", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80", hot: true },
  { id: 3, title: "Cloud no Brasil cresce 34% e gera 80 mil vagas em 2025", category: "Mercado Tech", categoryColor: "hsl(210 70% 55%)", time: "há 8h", url: "https://canaltech.com.br/mercado/", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80" },
  { id: 4, title: "Engenheiros de IA lideram ranking de salários remotos no Brasil", category: "Carreira", categoryColor: "hsl(25 90% 55%)", time: "há 12h", url: "https://canaltech.com.br/carreira/", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" },
  { id: 5, title: "Meta investe US$ 65 bi em data centers para treinar modelos de IA", category: "Big Tech", categoryColor: "hsl(270 60% 60%)", time: "há 1d", url: "https://canaltech.com.br/empresa/meta/", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80" },
  { id: 6, title: "Brasil registra alta de 65% em ataques ransomware em 2025", category: "Cibersegurança", categoryColor: "hsl(0 70% 55%)", time: "há 1d", url: "https://canaltech.com.br/seguranca/", image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80" },
];

const TRENDING = [
  { tag: "#RemoteWork", posts: 1240 }, { tag: "#InteligenciaArtificial", posts: 987 },
  { tag: "#FreelancerBR", posts: 754 }, { tag: "#DataScience", posts: 612 }, { tag: "#CarreiraTech", posts: 501 },
];

const TOP_MEMBERS = [
  { name: "Larissa Mendes", avatar_url: "https://i.pravatar.cc/150?u=larissa", initials: "LM", disc: "I", posts: 48, badge: "🥇" },
  { name: "Diego Almeida",  avatar_url: "https://i.pravatar.cc/150?u=diego",   initials: "DA", disc: "D", posts: 37, badge: "🥈" },
  { name: "Fernanda Lima",  avatar_url: "https://i.pravatar.cc/150?u=fernanda",initials: "FL", disc: "S", posts: 29, badge: "🥉" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `há ${mins}min`;
  if (hours < 24) return `há ${hours}h`;
  return `há ${days}d`;
};

const toInitials = (name?: string) =>
  (name ?? "??").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// ─── UserAvatar ───────────────────────────────────────────────────────────────
// Avatar universal para todos os usuários.
//
// Lógica de renderização:
//   1. Se avatarUrl existir → <img src={avatarUrl}> (URL do Supabase Storage / profiles.avatar_url)
//   2. Senão → iniciais geradas de profiles.name
//
// Para o usuário logado (isMe=true) aplica o anel DISC com imagem (layout do ProfilePage).
// Para outros usuários aplica anel DISC colorido simples.

const UserAvatar = ({
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
    sm: { outer: 28, inner: 20, textSize: "text-[8px]", wh: "w-7 h-7" },
    md: { outer: 36, inner: 26, textSize: "text-[9px]", wh: "w-9 h-9" },
    lg: { outer: 48, inner: 34, textSize: "text-xs",    wh: "w-12 h-12" },
  }[size];

  const inner = (
    avatarUrl
      ? <img
          src={avatarUrl}
          alt={name ?? "avatar"}
          className="w-full h-full object-cover"
          // Se a URL quebrar, mostra as iniciais via fallback
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      : <span>{initials}</span>
  );

  // Usuário logado — anel DISC com imagem (igual ao ProfilePage)
  if (isMe && discRingImg) {
    return (
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: cfg.outer, height: cfg.outer }}>
        <img src={discRingImg} alt="DISC" className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
        <div
          className={`absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold ${cfg.textSize} z-10`}
          style={{ width: cfg.inner, height: cfg.inner, top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: avatarUrl ? undefined : "hsl(var(--secondary))", border: "2px solid hsl(var(--background))", color: discColor }}
        >
          {inner}
        </div>
      </div>
    );
  }

  // Outros usuários — foto (URL) com anel DISC colorido
  return (
    <div
      className={`${cfg.wh} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-display font-bold ${cfg.textSize}`}
      style={{ border: `2px solid ${discColor}60`, boxShadow: `0 0 10px ${discColor}25`, background: avatarUrl ? undefined : `linear-gradient(135deg, ${discColor}33, ${discColor}15)`, color: discColor }}
    >
      {inner}
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

const PostCard = ({
  post, onLike, onSave, onComment,
  myAvatarUrl, myName, myDisc, myDiscRingImg,
}: {
  post:          Post;
  onLike:        (id: string) => void;
  onSave:        (id: string) => void;
  onComment:     (id: string, text: string) => void;
  myAvatarUrl:   string | null;
  myName:        string;
  myDisc:        string;
  myDiscRingImg: string | undefined;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState("");
  const [showMenu,     setShowMenu]     = useState(false);

  const submit = () => {
    if (!commentText.trim() || !post.id) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
  };

  // Dados do autor vindos do JOIN com profiles
  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;  // URL Supabase Storage
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  const isMe            = post.creator_id === "me" || authorName === myName;

  return (
    <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }} transition={{ duration: 0.35 }}
      className="hologram-panel rounded-sm overflow-hidden">

      {/* Header */}
      <div className="p-5 pb-0 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <UserAvatar
            avatarUrl={isMe ? myAvatarUrl : authorAvatarUrl}
            name={isMe ? myName : authorName}
            disc={isMe ? myDisc : authorDisc}
            size="lg"
            isMe={isMe}
            discRingImg={isMe ? myDiscRingImg : undefined}
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
            {/* date = timestamptz da tabela publications */}
            <p className="text-[10px] text-muted-foreground font-body opacity-60">{formatRelativeTime(post.date)}</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm">
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 z-20 hologram-panel rounded-sm py-1 min-w-[140px] text-xs font-body">
                <button className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">Denunciar post</button>
                <button className="w-full text-left px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition">Copiar link</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* description = coluna text da tabela publications */}
      <div className="px-5 py-4">
        <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line">{post.description}</p>
      </div>

      {/* midia = coluna text da tabela publications (URL ou base64) */}
      {post.midia && (
        <div className="px-5 pb-4">
          <div className="rounded-sm overflow-hidden border border-border/40" style={{ maxHeight: 340 }}>
            <img src={post.midia} alt="Post" className="w-full object-cover" style={{ maxHeight: 340 }} />
          </div>
        </div>
      )}

      {/* like_qnt = coluna numeric da tabela publications */}
      <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground font-body border-t border-border/30 pt-3">
        <span>{post.like_qnt ?? 0} curtidas</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-foreground transition">
          {post.comments.length} comentários
        </button>
      </div>

      <div className="px-5 py-2 flex items-center gap-1 border-t border-border/30">
        {[
          { label: "Curtir",       el: <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />,   active: post.liked,  color: "text-rose-400", fn: () => post.id && onLike(post.id) },
          { label: "Comentar",     el: <MessageCircle size={14} />,                                           active: false,       color: "",             fn: () => setShowComments(!showComments) },
          { label: "Salvar",       el: <Bookmark size={14} className={post.saved ? "fill-primary" : ""} />, active: post.saved,  color: "text-primary", fn: () => post.id && onSave(post.id) },
          { label: "Compartilhar", el: <Share2 size={14} />,                                                 active: false,       color: "",             fn: () => {} },
        ].map(({ label, el, active, color, fn }) => (
          <button key={label} onClick={fn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xs font-accent font-semibold transition hover:bg-secondary/40 ${active ? color : "text-muted-foreground hover:text-foreground"}`}>
            {el} {label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
            className="border-t border-border/30 overflow-hidden">
            <div className="px-5 py-4 space-y-3">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  {/* Foto do comentarista via avatar_url (profiles.avatar_url) */}
                  <UserAvatar avatarUrl={c.avatar_url} name={c.author} disc={c.disc} size="sm" />
                  <div className="bg-secondary/30 rounded-sm px-3 py-2 flex-1">
                    <p className="text-[11px] font-accent font-semibold text-foreground mb-0.5">{c.author}</p>
                    <p className="text-xs font-body text-muted-foreground">{c.text}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-2.5 pt-1">
                <UserAvatar avatarUrl={myAvatarUrl} name={myName} disc={myDisc} size="sm" isMe discRingImg={myDiscRingImg} />
                <div className="flex-1 flex gap-2">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-secondary/30 border border-border/50 rounded-sm px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition" />
                  <button onClick={submit} className="px-3 py-2 rounded-sm text-primary-foreground transition hover:brightness-110" style={{ background: "hsl(155 60% 35%)" }}>
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── CreatePost ───────────────────────────────────────────────────────────────

const CreatePost = ({
  onPost, myAvatarUrl, myName, myDisc, myDiscRingImg, myCreatorId,
}: {
  onPost:        (publi: Publication) => void;
  myAvatarUrl:   string | null;
  myName:        string;
  myDisc:        string;
  myDiscRingImg: string | undefined;
  myCreatorId?:  string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [publi, setPubli] = useState<Publication>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPubli((prev) => ({ ...prev, midia: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // submit atualiza a UI local após salvar no banco
  const submit = () => {
    if (!publi.description?.trim()) return;
    onPost({ description: publi.description.trim(), date: new Date().toISOString(), midia: publi.midia, creator_id: myCreatorId, like_qnt: 0 });
    setPubli({});
    setExpanded(false);
  };

  // Sua função — salva no Supabase e chama submit para atualizar a UI
  // submit é declarado acima, então pode ser chamado aqui sem erro de hoisting
  async function handleDescriptionChange() {
    const data = {
      description: publi.description,
      midia:       publi.midia ?? "EMPTY",
      date:        new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T") + "-03:00", // timestamptz com fuso de Brasília
      creator_id:  myCreatorId,
      like_qnt:    0,
    };

    const { error } = await supabase.from('publications').insert(data);

    if (error) {
      alert(error.message);
      return;
    }

    submit();
  }

  return (
    <motion.div layout className="hologram-panel rounded-sm p-5">
      <div className="flex gap-3 items-start">
        <UserAvatar avatarUrl={myAvatarUrl} name={myName} disc={myDisc} size="lg" isMe discRingImg={myDiscRingImg} />
        <div className="flex-1">
          {!expanded ? (
            <button onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 rounded-sm bg-secondary/40 border border-border/40 text-sm font-body text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 transition">
              No que você está pensando?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <textarea autoFocus value={publi.description ?? ""}
                onChange={(e) => setPubli((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Compartilhe um insight, conquista ou dúvida com a comunidade..."
                rows={4}
                className="w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/50 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition resize-none" />

              <AnimatePresence>
                {publi.midia && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-sm overflow-hidden border border-border/40">
                    <img src={publi.midia} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button onClick={() => { setPubli((prev) => ({ ...prev, midia: undefined })); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background transition">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-accent text-muted-foreground hover:text-primary transition px-2 py-1.5 rounded-sm hover:bg-secondary/40">
                  <ImageIcon size={14} /> Adicionar imagem
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                <div className="flex gap-2">
                  <button onClick={() => { setPubli({}); setExpanded(false); }}
                    className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition">
                    Cancelar
                  </button>
                  <button onClick={handleDescriptionChange} disabled={!publi.description?.trim()}
                    className="px-4 py-1.5 text-xs font-accent font-bold text-primary-foreground rounded-sm transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed box-glow-accent"
                    style={{ background: "hsl(25 90% 55%)" }}>
                    Publicar
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

// ─── LeftSidebar ─────────────────────────────────────────────────────────────

const LeftSidebar = ({
  myAvatarUrl, myName, myDisc, myRole, myHourValue, myCourseProgress, myCourseTitle,
}: {
  myAvatarUrl: string | null; myName: string; myDisc: string;
  myRole: string; myHourValue: string; myCourseProgress: number; myCourseTitle: string;
}) => {
  const discImg   = DISC_IMGS[myDisc];
  const discColor = DISC_COLOR[myDisc] ?? DISC_COLOR.S;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        className="hologram-panel rounded-sm overflow-hidden">
        <div className="h-16 w-full" style={{ background: `linear-gradient(135deg, ${discColor}44 0%, hsl(200 70% 50% / 0.2) 100%)` }} />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-7 mb-3">
            {/* Mini avatar com anel DISC — idêntico ao ProfilePage */}
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56 }}>
              {discImg
                ? <img src={discImg} alt="DISC" className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                : <div className="absolute inset-0 rounded-full" style={{ background: discColor, zIndex: 1 }} />
              }
              <div className="absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-xs z-10"
                style={{ width: 40, height: 40, top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: myAvatarUrl ? undefined : "hsl(var(--secondary))", border: "2.5px solid hsl(var(--background))", color: discColor }}>
                {myAvatarUrl
                  ? <img src={myAvatarUrl} alt={myName} className="w-full h-full object-cover" />
                  : <span>{toInitials(myName)}</span>
                }
              </div>
            </div>
            <div className="mb-0.5">
              <p className="font-accent font-semibold text-sm text-foreground leading-none">{myName || "Você"}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">{myRole}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-accent font-semibold" style={{ background: `${discColor}18`, color: discColor, border: `1px solid ${discColor}40` }}>
              {myDisc} · {DISC_LABEL[myDisc] ?? "—"}
            </span>
            <span className="text-[10px] font-accent text-accent font-semibold">{myHourValue}</span>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-muted-foreground font-accent flex items-center gap-1"><BookOpen size={10} /> Trilha atual</p>
              <span className="text-[10px] text-primary font-accent">{myCourseProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${myCourseProgress}%` }} transition={{ delay: 0.6, duration: 1 }}
                className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(155 60% 55%))" }} />
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1 truncate">{myCourseTitle}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Flame size={14} className="text-accent" /> Tópicos em Alta</h3>
        <div className="space-y-2.5">
          {TRENDING.map((t, i) => (
            <motion.button key={t.tag} whileHover={{ x: 3 }} className="w-full flex items-center justify-between text-left group">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-accent w-3">{i + 1}</span>
                <span className="text-xs font-accent font-semibold text-primary group-hover:brightness-125 transition">{t.tag}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-body">{t.posts.toLocaleString("pt-BR")}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Trophy size={14} className="text-accent" /> Membros em Destaque</h3>
        <div className="space-y-3">
          {TOP_MEMBERS.map((m) => (
            <div key={m.name} className="flex items-center gap-2.5">
              <span className="text-sm">{m.badge}</span>
              {/* Foto dos membros via avatar_url */}
              <UserAvatar avatarUrl={m.avatar_url} name={m.name} disc={m.disc} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-accent font-semibold text-foreground truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground font-body">{m.posts} posts este mês</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Zap size={14} className="text-primary" /> Comunidade Hoje</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Membros", value: "2.4k", color: "hsl(155 60% 45%)" },
            { label: "Posts",   value: "138",  color: "hsl(25 90% 55%)"  },
            { label: "Online",  value: "94",   color: "hsl(45 90% 55%)"  },
            { label: "Vagas",   value: "412",  color: "hsl(210 70% 55%)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-sm p-2 text-center" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
              <p className="font-display text-sm font-bold" style={{ color }}>{value}</p>
              <p className="text-[9px] text-muted-foreground font-accent uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── RightSidebar ─────────────────────────────────────────────────────────────

const RightSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_NEWS : MOCK_NEWS.slice(0, 4);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      className="hologram-panel rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2"><TrendingUp size={14} className="text-accent" /><h3 className="font-display text-sm font-bold text-foreground">Tech & Carreira</h3></div>
        <a href="https://canaltech.com.br" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary font-body flex items-center gap-1 transition">Canaltech <ExternalLink size={9} /></a>
      </div>
      <div className="divide-y divide-border/20">
        <AnimatePresence>
          {visible.map((news, i) => (
            <motion.a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }} className="block px-4 py-3 group transition">
              <div className="flex gap-3">
                <div className="w-16 h-[52px] rounded-sm overflow-hidden flex-shrink-0 bg-secondary/40 relative">
                  <img src={news.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                  {news.hot && <span className="absolute top-0.5 left-0.5 text-[8px] font-accent font-bold px-1 rounded-sm leading-tight" style={{ background: "hsl(25 90% 55%)", color: "#fff" }}>HOT</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-accent font-semibold px-1.5 py-0.5 rounded-sm mb-1.5 inline-block"
                    style={{ background: `${news.categoryColor}18`, color: news.categoryColor, border: `1px solid ${news.categoryColor}30` }}>{news.category}</span>
                  <p className="text-[11px] font-body text-foreground leading-tight line-clamp-2 group-hover:text-primary transition">{news.title}</p>
                  <div className="flex items-center gap-1 mt-1.5"><Clock size={8} className="text-muted-foreground" /><span className="text-[9px] text-muted-foreground font-body">{news.time}</span></div>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1 border-t border-border/30">
        {expanded ? "Ver menos" : "Ver todas as notícias"}<ChevronRight size={11} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
    </motion.div>
  );
};

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts]   = useState<Post[]>(INITIAL_POSTS);
  const [filter, setFilter] = useState<"recentes" | "populares">("recentes");
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  useEffect(() => { setMyAvatarUrl(localStorage.getItem(KEY_PHOTO)); }, [user]);

  const myName      = user?.name ?? "Você";
  const myDisc      = user?.assessment?.discProfile ?? "S";
  const myCreatorId = user?.id;
  const myHourValue = user?.assessment?.valorHoraLiquida ? `R$ ${user.assessment.valorHoraLiquida.toFixed(0)}/h` : "—";
  const myRole           = "Membro · UpJobs";
  const myCourseProgress = 65;
  const myCourseTitle    = "Machine Learning Avançado";
  const myDiscRingImg    = DISC_IMGS[myDisc];

  const handlePost = (publi: Publication) => {
    if (!publi.description?.trim()) return;
    setPosts((prev) => [{
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      description: publi.description!,
      date: publi.date,
      midia: publi.midia,
      creator_id: publi.creator_id,
      like_qnt: 0,
      // Perfil do usuário logado como profile (simula JOIN)
      profile: { id: myCreatorId ?? "", name: myName, avatar_url: myAvatarUrl ?? undefined, role: myRole, disc: myDisc as "D"|"I"|"S"|"C" },
      liked: false, saved: false, comments: [],
    }, ...prev]);
  };

  const handleLike = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, like_qnt: (p.like_qnt ?? 0) + (p.liked ? -1 : 1) } : p));

  const handleSave = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));

  const handleComment = (id: string, text: string) =>
    setPosts((prev) => prev.map((p) =>
      p.id === id
        ? { ...p, comments: [...p.comments, {
            id: Date.now(), author: myName, initials: toInitials(myName),
            avatar_url: myAvatarUrl ?? undefined, disc: myDisc, text, time: "agora",
          }] }
        : p
    ));

  const sortedPosts = filter === "populares"
    ? [...posts].sort((a, b) => (b.like_qnt ?? 0) - (a.like_qnt ?? 0))
    : [...posts].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />
      <div className="px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-glow">Comunidade</h1>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Compartilhe conquistas, dicas e insights com a rede UpJobs</p>
            </div>
            <div className="flex gap-3">
              {[
                { icon: Users,      label: "2.4k membros", color: "hsl(155 60% 45%)" },
                { icon: TrendingUp, label: "↑ 18% hoje",   color: "hsl(25 90% 55%)"  },
                { icon: Zap,        label: "94 online",     color: "hsl(45 90% 55%)"  },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1 text-[10px] font-accent font-semibold px-2 py-1 rounded-sm"
                  style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
                  <Icon size={10} /><span className="hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <LeftSidebar myAvatarUrl={myAvatarUrl} myName={myName} myDisc={myDisc}
                  myRole={myRole} myHourValue={myHourValue} myCourseProgress={myCourseProgress} myCourseTitle={myCourseTitle} />
              </div>
            </aside>

            <main className="space-y-4 min-w-0">
              <div className="flex gap-2">
                {(["recentes", "populares"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-sm text-xs font-accent font-semibold transition ${f === filter ? "text-primary-foreground" : "text-muted-foreground border border-border hover:text-foreground"}`}
                    style={f === filter ? { background: "hsl(155 60% 35%)", boxShadow: "0 0 12px hsl(155 60% 45% / 0.3)" } : undefined}>
                    {f === "recentes" ? "🕒 Recentes" : "🔥 Populares"}
                  </button>
                ))}
              </div>

              <CreatePost onPost={handlePost} myAvatarUrl={myAvatarUrl} myName={myName}
                myDisc={myDisc} myDiscRingImg={myDiscRingImg} myCreatorId={myCreatorId} />

              <AnimatePresence mode="popLayout">
                {sortedPosts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <PostCard post={post} onLike={handleLike} onSave={handleSave} onComment={handleComment}
                      myAvatarUrl={myAvatarUrl} myName={myName} myDisc={myDisc} myDiscRingImg={myDiscRingImg} />
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="text-center pt-2">
                <button className="text-xs font-accent text-muted-foreground hover:text-foreground transition px-6 py-2 rounded-sm border border-border/40 hover:border-border">
                  Carregar mais posts
                </button>
              </div>
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-24"><RightSidebar /></div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;