import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, ImageIcon, X, Send,
  Bookmark, MoreHorizontal, TrendingUp, Users, Zap,
  Trophy, BookOpen, ExternalLink, Clock, ChevronRight, Flame,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Comment {
  id: number;
  author: string;
  avatar: string;
  disc: string;
  text: string;
  time: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  role: string;
  disc: "D" | "I" | "S" | "C";
  time: string;
  content: string;
  image?: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: Comment[];
}

interface NewsItem {
  id: number;
  title: string;
  category: string;
  categoryColor: string;
  time: string;
  url: string;
  image: string;
  hot?: boolean;
}

// ─── DISC helpers ─────────────────────────────────────────────────────────────

const DISC_COLOR: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)",
  S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};
const DISC_LABEL: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};

// ─── DADOS MOCKADOS ───────────────────────────────────────────────────────────

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: "Larissa Mendes",
    avatar: "LM",
    role: "Product Manager · UpJobs Academy",
    disc: "I",
    time: "há 2h",
    content:
      "Acabei de fechar minha primeira vaga remota como PM em uma startup de fintech 🚀\n\nDepois de 4 meses na trilha UpJobs, saí de R$28/h presencial para R$95/h remoto. A calculadora de Marcius me abriu os olhos: eu estava perdendo 38% da minha hora só com deslocamento.\n\nSe você ainda está na dúvida, o custo de oportunidade real é mais pesado do que parece. Não espere mais.",
    likes: 142,
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Rafael Costa", avatar: "RC", disc: "D", text: "Incrível! Qual stack você aprendeu para a posição?", time: "há 1h" },
      { id: 2, author: "Camila Torres", avatar: "CT", disc: "S", text: "Parabéns! Isso me dá esperança 💚", time: "há 45min" },
    ],
  },
  {
    id: 2,
    author: "Marcos Vinicius",
    avatar: "MV",
    role: "Dev Backend · Freelancer",
    disc: "C",
    time: "há 5h",
    content:
      "Dica rápida para quem está aprendendo Python para Data Science:\n\n→ Não comece pelo pandas, comece pela lógica\n→ Kaggle competitions > tutoriais em loop\n→ Um projeto real vale 10 cursos completos\n\nMeu portfólio no GitHub foi o que realmente me contratou. Nenhum certificado chegou perto.",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
    likes: 87,
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Ana Julia", avatar: "AJ", disc: "I", text: "Esse ponto sobre o GitHub é real demais 🔥", time: "há 3h" },
    ],
  },
  {
    id: 3,
    author: "Fernanda Lima",
    avatar: "FL",
    role: "UX Designer · Remoto",
    disc: "S",
    time: "há 1d",
    content:
      "Insight do dia: a maioria das pessoas subestima UX Writing.\n\nNão é só nomear botões. É arquitetura cognitiva. É reduzir a carga mental do usuário em cada micro-decisão.\n\nQuando você entende isso, sua taxa de conversão muda de patamar.",
    likes: 203,
    liked: true,
    saved: true,
    comments: [],
  },
  {
    id: 4,
    author: "Diego Almeida",
    avatar: "DA",
    role: "Cybersecurity Analyst",
    disc: "D",
    time: "há 2d",
    content:
      "O mercado de cibersegurança no Brasil vai precisar de +150.000 profissionais até 2026 segundo a ISC².\n\nVaga sobrando. Salário alto. Trabalho 100% remoto.\n\nE ainda tem gente perguntando se vale a pena investir em carreira tech? 😅",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    likes: 318,
    liked: false,
    saved: false,
    comments: [
      { id: 1, author: "Larissa Mendes", avatar: "LM", disc: "I", text: "Mercado de cyber é absurdo mesmo!", time: "há 1d" },
      { id: 2, author: "Marcos Vinicius", avatar: "MV", disc: "C", text: "Falta mão de obra qualificada — confirmado!", time: "há 22h" },
    ],
  },
];

const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Samsung lança Galaxy S26 com IA embarcada e Exynos 2600",
    category: "IA & Devices",
    categoryColor: "hsl(45 90% 55%)",
    time: "há 2h",
    url: "https://video.canaltech.com.br/video/hands-on/samsung-anuncia-linha-galaxy-s26-com-recursos-de-ia-e-exynos-2600-22627/",
    image: "https://t.ctcdn.com.br/VkKue7mxnh7puDyb4TNPTVOiXeY=/640x360/smart/i1104977.jpeg",
    hot: true,
  },
  {
    id: 2,
    title: "OpenAI anuncia GPT-5 com raciocínio avançado para empresas",
    category: "Inteligência Artificial",
    categoryColor: "hsl(155 60% 45%)",
    time: "há 5h",
    url: "https://canaltech.com.br/inteligencia-artificial/",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80",
    hot: true,
  },
  {
    id: 3,
    title: "Cloud no Brasil cresce 34% e gera 80 mil vagas em 2025",
    category: "Mercado Tech",
    categoryColor: "hsl(210 70% 55%)",
    time: "há 8h",
    url: "https://canaltech.com.br/mercado/",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
  },
  {
    id: 4,
    title: "Engenheiros de IA lideram ranking de salários remotos no Brasil",
    category: "Carreira",
    categoryColor: "hsl(25 90% 55%)",
    time: "há 12h",
    url: "https://canaltech.com.br/carreira/",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
  },
  {
    id: 5,
    title: "Meta investe US$ 65 bi em data centers para treinar modelos de IA",
    category: "Big Tech",
    categoryColor: "hsl(270 60% 60%)",
    time: "há 1d",
    url: "https://canaltech.com.br/empresa/meta/",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
  },
  {
    id: 6,
    title: "Brasil registra alta de 65% em ataques ransomware em 2025",
    category: "Cibersegurança",
    categoryColor: "hsl(0 70% 55%)",
    time: "há 1d",
    url: "https://canaltech.com.br/seguranca/",
    image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80",
  },
];

const TRENDING = [
  { tag: "#RemoteWork", posts: 1240 },
  { tag: "#InteligenciaArtificial", posts: 987 },
  { tag: "#FreelancerBR", posts: 754 },
  { tag: "#DataScience", posts: 612 },
  { tag: "#CarreiraTech", posts: 501 },
];

const TOP_MEMBERS = [
  { name: "Larissa Mendes", avatar: "LM", disc: "I", posts: 48, badge: "🥇" },
  { name: "Diego Almeida",  avatar: "DA", disc: "D", posts: 37, badge: "🥈" },
  { name: "Fernanda Lima",  avatar: "FL", disc: "S", posts: 29, badge: "🥉" },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ initials, disc, size = "md" }: { initials: string; disc: string; size?: "sm" | "md" | "lg" }) => {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-display font-bold flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${DISC_COLOR[disc]}33, ${DISC_COLOR[disc]}15)`,
        border: `2px solid ${DISC_COLOR[disc]}60`,
        color: DISC_COLOR[disc],
        boxShadow: `0 0 10px ${DISC_COLOR[disc]}25`,
      }}
    >
      {initials}
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

const PostCard = ({ post, onLike, onSave, onComment }: {
  post: Post;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onComment: (id: number, text: string) => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const submit = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="hologram-panel rounded-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-0 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar initials={post.avatar} disc={post.disc} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-accent font-semibold text-sm text-foreground">{post.author}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-accent font-semibold"
                style={{ background: `${DISC_COLOR[post.disc]}18`, color: DISC_COLOR[post.disc], border: `1px solid ${DISC_COLOR[post.disc]}40` }}>
                {post.disc} · {DISC_LABEL[post.disc]}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5">{post.role}</p>
            <p className="text-[10px] text-muted-foreground font-body opacity-60">{post.time}</p>
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

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {post.image && (
        <div className="px-5 pb-4">
          <div className="rounded-sm overflow-hidden border border-border/40" style={{ maxHeight: 340 }}>
            <img src={post.image} alt="Post" className="w-full object-cover" style={{ maxHeight: 340 }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground font-body border-t border-border/30 pt-3">
        <span>{post.likes} curtidas</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-foreground transition">{post.comments.length} comentários</button>
      </div>

      {/* Action bar */}
      <div className="px-5 py-2 flex items-center gap-1 border-t border-border/30">
        {[
          { label: "Curtir",       el: <Heart size={14} className={post.liked ? "fill-rose-400" : ""} />,   active: post.liked,  color: "text-rose-400", fn: () => onLike(post.id) },
          { label: "Comentar",     el: <MessageCircle size={14} />,                                           active: false,       color: "",             fn: () => setShowComments(!showComments) },
          { label: "Salvar",       el: <Bookmark size={14} className={post.saved ? "fill-primary" : ""} />, active: post.saved,  color: "text-primary", fn: () => onSave(post.id) },
          { label: "Compartilhar", el: <Share2 size={14} />,                                                 active: false,       color: "",             fn: () => {} },
        ].map(({ label, el, active, color, fn }) => (
          <button key={label} onClick={fn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xs font-accent font-semibold transition hover:bg-secondary/40 ${active ? color : "text-muted-foreground hover:text-foreground"}`}>
            {el} {label}
          </button>
        ))}
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
            className="border-t border-border/30 overflow-hidden">
            <div className="px-5 py-4 space-y-3">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar initials={c.avatar} disc={c.disc} size="sm" />
                  <div className="bg-secondary/30 rounded-sm px-3 py-2 flex-1">
                    <p className="text-[11px] font-accent font-semibold text-foreground mb-0.5">{c.author}</p>
                    <p className="text-xs font-body text-muted-foreground">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2.5 pt-1">
                <Avatar initials="VC" disc="S" size="sm" />
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

const CreatePost = ({ onPost }: { onPost: (content: string, image?: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!content.trim()) return;
    onPost(content.trim(), imagePreview ?? undefined);
    setContent(""); setImagePreview(null); setExpanded(false);
  };

  return (
    <motion.div layout className="hologram-panel rounded-sm p-5">
      <div className="flex gap-3">
        <Avatar initials="VC" disc="S" size="lg" />
        <div className="flex-1">
          {!expanded ? (
            <button onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 rounded-sm bg-secondary/40 border border-border/40 text-sm font-body text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 transition">
              No que você está pensando?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Compartilhe um insight, conquista ou dúvida com a comunidade..."
                rows={4}
                className="w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/50 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition resize-none" />

              <AnimatePresence>
                {imagePreview && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-sm overflow-hidden border border-border/40">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
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
                  <button onClick={() => { setContent(""); setImagePreview(null); setExpanded(false); }}
                    className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition">
                    Cancelar
                  </button>
                  <button onClick={submit} disabled={!content.trim()}
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

// ─── Sidebar Esquerda ─────────────────────────────────────────────────────────

const LeftSidebar = () => (
  <div className="space-y-4">
    {/* Mini Perfil */}
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
      className="hologram-panel rounded-sm overflow-hidden">
      <div className="h-16 w-full" style={{ background: "linear-gradient(135deg, hsl(155 60% 35% / 0.4), hsl(200 70% 50% / 0.3), hsl(25 90% 55% / 0.2))" }} />
      <div className="px-4 pb-4">
        <div className="flex items-end gap-3 -mt-6 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-base flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${DISC_COLOR.S}33, ${DISC_COLOR.S}15)`, border: `2px solid ${DISC_COLOR.S}`, color: DISC_COLOR.S, boxShadow: `0 0 14px ${DISC_COLOR.S}35` }}>
            VC
          </div>
          <div className="mb-0.5">
            <p className="font-accent font-semibold text-sm text-foreground leading-none">Você</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">Membro · UpJobs</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-sm font-accent font-semibold"
            style={{ background: `${DISC_COLOR.S}18`, color: DISC_COLOR.S, border: `1px solid ${DISC_COLOR.S}40` }}>
            S · Estabilidade
          </span>
          <span className="text-[10px] font-accent text-accent font-semibold">R$ 85/h</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-muted-foreground font-accent flex items-center gap-1"><BookOpen size={10} /> Trilha atual</p>
            <span className="text-[10px] text-primary font-accent">65%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ delay: 0.6, duration: 1 }}
              className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(155 60% 55%))" }} />
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-1">Machine Learning Avançado</p>
        </div>
      </div>
    </motion.div>

    {/* Tópicos em Alta */}
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      className="hologram-panel rounded-sm p-4">
      <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Flame size={14} className="text-accent" /> Tópicos em Alta
      </h3>
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

    {/* Top Membros */}
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
      className="hologram-panel rounded-sm p-4">
      <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-accent" /> Membros em Destaque
      </h3>
      <div className="space-y-3">
        {TOP_MEMBERS.map((m) => (
          <div key={m.name} className="flex items-center gap-2.5">
            <span className="text-sm">{m.badge}</span>
            <Avatar initials={m.avatar} disc={m.disc} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-accent font-semibold text-foreground truncate">{m.name}</p>
              <p className="text-[10px] text-muted-foreground font-body">{m.posts} posts este mês</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Stats */}
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
      className="hologram-panel rounded-sm p-4">
      <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Zap size={14} className="text-primary" /> Comunidade Hoje
      </h3>
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

// ─── Sidebar Direita — Notícias ───────────────────────────────────────────────

const RightSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_NEWS : MOCK_NEWS.slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      className="hologram-panel rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" />
          <h3 className="font-display text-sm font-bold text-foreground">Tech & Carreira</h3>
        </div>
        <a href="https://canaltech.com.br" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary font-body flex items-center gap-1 transition">
          Canaltech <ExternalLink size={9} />
        </a>
      </div>

      {/* News list */}
      <div className="divide-y divide-border/20">
        <AnimatePresence>
          {visible.map((news, i) => (
            <motion.a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }}
              className="block px-4 py-3 group transition">
              <div className="flex gap-3">
                {/* Thumb */}
                <div className="w-16 h-[52px] rounded-sm overflow-hidden flex-shrink-0 bg-secondary/40 relative">
                  <img src={news.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                  {news.hot && (
                    <span className="absolute top-0.5 left-0.5 text-[8px] font-accent font-bold px-1 rounded-sm leading-tight"
                      style={{ background: "hsl(25 90% 55%)", color: "#fff" }}>HOT</span>
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-accent font-semibold px-1.5 py-0.5 rounded-sm mb-1.5 inline-block"
                    style={{ background: `${news.categoryColor}18`, color: news.categoryColor, border: `1px solid ${news.categoryColor}30` }}>
                    {news.category}
                  </span>
                  <p className="text-[11px] font-body text-foreground leading-tight line-clamp-2 group-hover:text-primary transition">{news.title}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={8} className="text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-body">{news.time}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {/* Ver mais */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1 border-t border-border/30">
        {expanded ? "Ver menos" : "Ver todas as notícias"}
        <ChevronRight size={11} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
    </motion.div>
  );
};

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [filter, setFilter] = useState<"recentes" | "populares">("recentes");

  const handlePost = (content: string, image?: string) => {
    setPosts((prev) => [{
      id: Date.now(), author: "Você", avatar: "VC", role: "Membro da Comunidade",
      disc: "S", time: "agora", content, image, likes: 0, liked: false, saved: false, comments: [],
    }, ...prev]);
  };

  const handleLike = (id: number) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));

  const handleSave = (id: number) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));

  const handleComment = (id: number, text: string) =>
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), author: "Você", avatar: "VC", disc: "S", text, time: "agora" }] } : p
    ));

  const sortedPosts = filter === "populares" ? [...posts].sort((a, b) => b.likes - a.likes) : posts;

  return (
    <div className="min-h-screen gradient-hero scanline px-4 pt-24 pb-16">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
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
                <Icon size={10} /> <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Layout 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6">

          {/* Esquerda */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <LeftSidebar />
            </div>
          </aside>

          {/* Feed central */}
          <main className="space-y-4 min-w-0">
            <div className="flex gap-2">
              {(["recentes", "populares"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-sm text-xs font-accent font-semibold transition ${filter === f ? "text-primary-foreground" : "text-muted-foreground border border-border hover:text-foreground"}`}
                  style={filter === f ? { background: "hsl(155 60% 35%)", boxShadow: "0 0 12px hsl(155 60% 45% / 0.3)" } : undefined}>
                  {f === "recentes" ? "🕒 Recentes" : "🔥 Populares"}
                </button>
              ))}
            </div>

            <CreatePost onPost={handlePost} />

            <AnimatePresence mode="popLayout">
              {sortedPosts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PostCard post={post} onLike={handleLike} onSave={handleSave} onComment={handleComment} />
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="text-center pt-2">
              <button className="text-xs font-accent text-muted-foreground hover:text-foreground transition px-6 py-2 rounded-sm border border-border/40 hover:border-border">
                Carregar mais posts
              </button>
            </div>
          </main>

          {/* Direita — Notícias */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <RightSidebar />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
