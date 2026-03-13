
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, X, TrendingUp, Users, Zap,
  Trophy, BookOpen, ExternalLink, Clock, ChevronRight, Flame,
} from "lucide-react";
import Header   from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "../../utils/supabase.ts";

import dominanciaImg   from "@/assets/disc/Dominancia.webp";
import influenciaImg   from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";

// Componentes extraídos
import PostCard, {
  Publication, Post,
  DISC_IMGS, DISC_COLOR, DISC_LABEL,
  UserAvatar, toInitials,
} from "../components/PostCard";
import PostModal from "../components/PostModal";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface NewsItem {
  id: number; title: string; category: string;
  categoryColor: string; time: string; url: string; image: string; hot?: boolean;
}

// ─── Dados mockados ───────────────────────────────────────────────────────────

const INITIAL_POSTS: Post[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    created_at: "2026-03-11T10:00:00.000+00:00",
    description: "Acabei de fechar minha primeira vaga remota como PM em uma startup de fintech 🚀\n\nDepois de 4 meses na trilha UpJobs, saí de R$28/h presencial para R$95/h remoto. A calculadora de Marcius me abriu os olhos: eu estava perdendo 38% da minha hora só com deslocamento.\n\nSe você ainda está na dúvida, o custo de oportunidade real é mais pesado do que parece. Não espere mais.",
    date: "2026-03-11T10:00:00.000+00:00", midia: undefined, creator_id: "user-uuid-larissa-0001", like_qnt: 142,
    profile: { id: "user-uuid-larissa-0001", name: "Larissa Mendes", avatar_url: "https://i.pravatar.cc/150?u=larissa", role: "Product Manager · UpJobs Academy", disc: "I" },
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
    date: "2026-03-11T07:00:00.000+00:00", midia: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80", creator_id: "user-uuid-marcos-0002", like_qnt: 87,
    profile: { id: "user-uuid-marcos-0002", name: "Marcos Vinicius", avatar_url: "https://i.pravatar.cc/150?u=marcos", role: "Dev Backend · Freelancer", disc: "C" },
    liked: false, saved: false,
    comments: [{ id: 1, author: "Ana Julia", initials: "AJ", avatar_url: "https://i.pravatar.cc/150?u=anajulia", disc: "I", text: "Esse ponto sobre o GitHub é real demais 🔥", time: "há 3h" }],
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    created_at: "2026-03-10T12:00:00.000+00:00",
    description: "Insight do dia: a maioria das pessoas subestima UX Writing.\n\nNão é só nomear botões. É arquitetura cognitiva. É reduzir a carga mental do usuário em cada micro-decisão.\n\nQuando você entende isso, sua taxa de conversão muda de patamar.",
    date: "2026-03-10T12:00:00.000+00:00", midia: undefined, creator_id: "user-uuid-fernanda-0003", like_qnt: 203,
    profile: { id: "user-uuid-fernanda-0003", name: "Fernanda Lima", avatar_url: "https://i.pravatar.cc/150?u=fernanda", role: "UX Designer · Remoto", disc: "S" },
    liked: true, saved: true, comments: [],
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    created_at: "2026-03-09T09:00:00.000+00:00",
    description: "O mercado de cibersegurança no Brasil vai precisar de +150.000 profissionais até 2026 segundo a ISC².\n\nVaga sobrando. Salário alto. Trabalho 100% remoto.\n\nE ainda tem gente perguntando se vale a pena investir em carreira tech? 😅",
    date: "2026-03-09T09:00:00.000+00:00", midia: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", creator_id: "user-uuid-diego-0004", like_qnt: 318,
    profile: { id: "user-uuid-diego-0004", name: "Diego Almeida", avatar_url: "https://i.pravatar.cc/150?u=diego", role: "Cybersecurity Analyst", disc: "D" },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Larissa Mendes",  initials: "LM", avatar_url: "https://i.pravatar.cc/150?u=larissa", disc: "I", text: "Mercado de cyber é absurdo mesmo!", time: "há 1d" },
      { id: 2, author: "Marcos Vinicius", initials: "MV", avatar_url: "https://i.pravatar.cc/150?u=marcos",  disc: "C", text: "Falta mão de obra qualificada — confirmado!", time: "há 22h" },
    ],
  },
];

const MOCK_NEWS: NewsItem[] = [
  { id: 1, title: "Samsung lança Galaxy S26 com IA embarcada e Exynos 2600",          category: "IA & Devices",           categoryColor: "hsl(45 90% 55%)",  time: "há 2h",  url: "https://video.canaltech.com.br/video/hands-on/samsung-anuncia-linha-galaxy-s26-com-recursos-de-ia-e-exynos-2600-22627/", image: "https://t.ctcdn.com.br/VkKue7mxnh7puDyb4TNPTVOiXecY=/640x360/smart/i1104977.jpeg", hot: true },
  { id: 2, title: "OpenAI anuncia GPT-5 com raciocínio avançado para empresas",        category: "Inteligência Artificial", categoryColor: "hsl(155 60% 45%)", time: "há 5h",  url: "https://canaltech.com.br/inteligencia-artificial/", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80", hot: true },
  { id: 3, title: "Cloud no Brasil cresce 34% e gera 80 mil vagas em 2025",            category: "Mercado Tech",            categoryColor: "hsl(210 70% 55%)", time: "há 8h",  url: "https://canaltech.com.br/mercado/",               image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80" },
  { id: 4, title: "Engenheiros de IA lideram ranking de salários remotos no Brasil",   category: "Carreira",                categoryColor: "hsl(25 90% 55%)",  time: "há 12h", url: "https://canaltech.com.br/carreira/",              image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" },
  { id: 5, title: "Meta investe US$ 65 bi em data centers para treinar modelos de IA", category: "Big Tech",                categoryColor: "hsl(270 60% 60%)", time: "há 1d",  url: "https://canaltech.com.br/empresa/meta/",          image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80" },
  { id: 6, title: "Brasil registra alta de 65% em ataques ransomware em 2025",         category: "Cibersegurança",          categoryColor: "hsl(0 70% 55%)",   time: "há 1d",  url: "https://canaltech.com.br/seguranca/",             image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80" },
];

const TRENDING = [
  { tag: "#RemoteWork",             posts: 1240 },
  { tag: "#InteligenciaArtificial", posts: 987  },
  { tag: "#FreelancerBR",           posts: 754  },
  { tag: "#DataScience",            posts: 612  },
  { tag: "#CarreiraTech",           posts: 501  },
];

const TOP_MEMBERS = [
  { name: "Larissa Mendes", avatar_url: "https://i.pravatar.cc/150?u=larissa", initials: "LM", disc: "I", posts: 48, badge: "🥇" },
  { name: "Diego Almeida",  avatar_url: "https://i.pravatar.cc/150?u=diego",   initials: "DA", disc: "D", posts: 37, badge: "🥈" },
  { name: "Fernanda Lima",  avatar_url: "https://i.pravatar.cc/150?u=fernanda",initials: "FL", disc: "S", posts: 29, badge: "🥉" },
];

const KEY_PHOTO = "upjobs_profile_photo_v2";

// ─── CreatePublication (preservada intacta) ───────────────────────────────────

export function CreatePublication() {
  const { user } = useAuth();
  const [publi, setPubli] = useState<Publication>({});

    // ─── USE EFFECT────────────────────────────────────────────────────────────────

  


  async function handleDescriptionChange() {
    const data = {
      description: publi.description,
      midia:       publi.midia ?? "EMPTY",
      date:        new Date().toISOString(),
      creator_id:  user?.id,
      like_qnt:    0,
    };
    const { error } = await supabase.from('publications').insert(data);
    if (error) { alert(error.message); return; }
  }

  return (
    <>
      <input type="text" placeholder="Escreva aqui o que você tem em mente..."
        value={publi.description ?? ""}
        onChange={(e) => setPubli({ ...publi, description: e.target.value })} />
      <input type="text" placeholder="Adicione uma imagem (opcional)"
        value={publi.midia ?? ""}
        onChange={(e) => setPubli({ ...publi, midia: e.target.value })} />
      <button onClick={handleDescriptionChange} disabled={!publi.description?.trim()}>
        Publicar
      </button>
    </>
  );
}


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
  const [publi,    setPubli]    = useState<Publication>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPubli((prev) => ({ ...prev, midia: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  async function handleDescriptionChange() {
    const data = {
      description: publi.description,
      midia:       publi.midia ?? "EMPTY",
      date:        new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T") + "-03:00",
      creator_id:  myCreatorId,
      like_qnt:    0,
    };
    const { data: inserted, error } = await supabase
      .from('publications').insert(data).select().single();
    if (error) { alert(error.message); return; }
    onPost({ ...data, id: inserted.id, created_at: inserted.created_at });
    setPubli({});
    setExpanded(false);
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

// ─── LeftSidebar ──────────────────────────────────────────────────────────────
//
// Banner:
//   Busca profiles.banner do Supabase para o usuário logado.
//   Mesma coluna usada pelo ProfilePage — ficam sempre sincronizados.
//   Fallback: gradiente DISC com grid sutil (igual ao ProfilePage sem banner).

const LeftSidebar = ({
  myAvatarUrl, myName, myDisc, myRole, myHourValue,
  myCourseProgress, myCourseTitle, myUserId,
}: {
  myAvatarUrl:      string | null;
  myName:           string;
  myDisc:           string;
  myRole:           string;
  myHourValue:      string;
  myCourseProgress: number;
  myCourseTitle:    string;
  myUserId?:        string;
}) => {
  const discImg   = DISC_IMGS[myDisc];
  const discColor = DISC_COLOR[myDisc] ?? DISC_COLOR.S;

  // Busca o banner da tabela profiles (coluna `banner`)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!myUserId) return;
    const fetchBanner = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("banner")
        .eq("id", myUserId)
        .maybeSingle();
      if (!error && data?.banner) setBannerUrl(data.banner);
      // null → fallback com gradiente DISC
    };
    fetchBanner();
  }, [myUserId]);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        className="hologram-panel rounded-sm overflow-hidden">

        {/* Banner: imagem real ou gradiente DISC */}
        <div className="h-16 w-full overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative"
              style={{ background: `linear-gradient(135deg, ${discColor}44 0%, ${discColor}11 60%, hsl(210 40% 10% / 0.2) 100%)` }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 24px,${discColor}1px),repeating-linear-gradient(90deg,transparent,transparent 24px,${discColor}1px)` }} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-7 mb-3">
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56 }}>
              {discImg
                ? <img src={discImg} alt="DISC" className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                : <div className="absolute inset-0 rounded-full" style={{ background: discColor, zIndex: 1 }} />
              }
              <div className="absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-xs z-10"
                style={{ width: 40, height: 40, top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  background: myAvatarUrl ? undefined : "hsl(var(--secondary))",
                  border: "2.5px solid hsl(var(--background))", color: discColor }}>
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
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-accent font-semibold"
              style={{ background: `${discColor}18`, color: discColor, border: `1px solid ${discColor}40` }}>
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

// Quantos posts buscar por página
const PAGE_SIZE = 10;

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts,          setPosts]         = useState<Post[]>([]);
  const [loadingPosts,   setLoadingPosts]   = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasMore,        setHasMore]        = useState(true);
  const [page,           setPage]           = useState(0);       // página atual (0-based)
  const [filter,         setFilter]         = useState<"recentes" | "populares">("recentes");
  const [myAvatarUrl,    setMyAvatarUrl]     = useState<string | null>(null);
  const [openPost,       setOpenPost]       = useState<Post | null>(null);

  useEffect(() => { setMyAvatarUrl(localStorage.getItem(KEY_PHOTO)); }, [user]);

  // ── Helper: converte row do banco → Post de UI ───────────────────────────────
  const rowToPost = (row: any): Post => ({
    id:          row.id,
    created_at:  row.created_at,
    description: row.description,
    date:        row.date,
    midia:       row.midia,
    creator_id:  row.creator_id,
    like_qnt:    row.like_qnt ?? 0,
    profile:     row.profile ?? undefined,  // preenchido quando o JOIN profiles existir
    liked:       false,
    saved:       false,
    comments:    [],
  });

  // ── Carrega a primeira página ao montar ──────────────────────────────────────
  // Quando a tabela profiles existir, troque select("*") por:
  //   select("*, profile:profiles(id, name, avatar_url, role, disc)")
  useEffect(() => {
    const fetchInitial = async () => {
      setLoadingPosts(true);

      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .order("date", { ascending: false })
        .range(0, PAGE_SIZE - 1);          // range(from, to) — ambos inclusivos

      if (error) {
        console.error("Erro ao carregar publicações:", error.message);
        setPosts(INITIAL_POSTS);           // fallback mock se o banco falhar
        setHasMore(false);
        setLoadingPosts(false);
        return;
      }

      if (!data || data.length === 0) {
        setPosts(INITIAL_POSTS);           // banco vazio → mostra mock
        setHasMore(false);
        setLoadingPosts(false);
        return;
      }

      setPosts(data.map(rowToPost));
      setPage(1);
      setHasMore(data.length === PAGE_SIZE); // se veio menos que PAGE_SIZE, não tem mais
      setLoadingPosts(false);
    };

    fetchInitial();
  }, []);

  // ── Carrega mais posts (botão "Carregar mais") ───────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const from = page * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("date", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erro ao carregar mais:", error.message);
      setLoadingMore(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    setPosts((prev) => [...prev, ...data.map(rowToPost)]);
    setPage((p) => p + 1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const openModal = (post: Post) => {
    setOpenPost(post);
    window.history.pushState({}, "", `/comunidade?post=${post.id}`);
  };
  const closeModal = () => {
    setOpenPost(null);
    window.history.pushState({}, "", "/comunidade");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("post");
    if (!postId) return;
    const loadPost = async () => {
      const { data, error } = await supabase
        .from("publications").select("*").eq("id", postId).maybeSingle();
      if (error) { console.error("Erro ao buscar post:", error.message); return; }
      if (!data)  { console.warn("Post não encontrado:", postId); return; }
      setOpenPost({ ...data, like_qnt: data.like_qnt ?? 0, profile: undefined, liked: false, saved: false, comments: [] });
    };
    loadPost();
  }, []);

  const myName           = user?.name ?? "Você";
  const myDisc           = user?.assessment?.discProfile ?? "S";
  const myCreatorId      = user?.id;
  const myHourValue      = user?.assessment?.valorHoraLiquida ? `R$ ${user.assessment.valorHoraLiquida.toFixed(0)}/h` : "—";
  const myRole           = "Membro · UpJobs";
  const myCourseProgress = 65;
  const myCourseTitle    = "Machine Learning Avançado";
  const myDiscRingImg    = DISC_IMGS[myDisc];

  const handlePost = (publi: Publication) => {
    if (!publi.description?.trim()) return;
    setPosts((prev) => [{
      id:          publi.id!,
      created_at:  publi.created_at ?? new Date().toISOString(),
      description: publi.description!,
      date:        publi.date,
      midia:       publi.midia,
      creator_id:  publi.creator_id,
      like_qnt:    0,
      profile: { id: myCreatorId ?? "", name: myName, avatar_url: myAvatarUrl ?? undefined, role: myRole, disc: myDisc as "D"|"I"|"S"|"C" },
      liked: false, saved: false, comments: [],
    }, ...prev]);
  };

  const handleLike = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id
      ? { ...p, liked: !p.liked, like_qnt: (p.like_qnt ?? 0) + (p.liked ? -1 : 1) } : p));

  const handleSave = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));

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
                <LeftSidebar
                  myAvatarUrl={myAvatarUrl} myName={myName} myDisc={myDisc}
                  myRole={myRole} myHourValue={myHourValue}
                  myCourseProgress={myCourseProgress} myCourseTitle={myCourseTitle}
                  myUserId={myCreatorId}
                />
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

              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="hologram-panel rounded-sm p-5 animate-pulse">
                      <div className="flex gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/60" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 bg-secondary/60 rounded w-1/3" />
                          <div className="h-2 bg-secondary/40 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-secondary/50 rounded w-full" />
                        <div className="h-3 bg-secondary/50 rounded w-5/6" />
                        <div className="h-3 bg-secondary/40 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedPosts.length === 0 ? (
                <div className="hologram-panel rounded-sm p-10 text-center">
                  <p className="text-sm text-muted-foreground font-body">Nenhuma publicação ainda. Seja o primeiro!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedPosts.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <PostCard
                        post={post}
                        onLike={handleLike}
                        onSave={handleSave}
                        onOpenModal={openModal}
                        myAvatarUrl={myAvatarUrl}
                        myName={myName}
                        myDisc={myDisc}
                        myDiscRingImg={myDiscRingImg}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Botão "Carregar mais" — paginação real */}
              {hasMore && !loadingPosts && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-xs font-accent text-muted-foreground hover:text-foreground transition px-6 py-2 rounded-sm border border-border/40 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto">
                    {loadingMore ? (
                      <><span className="w-3 h-3 rounded-full border-2 border-muted-foreground border-t-primary animate-spin inline-block" /> Carregando…</>
                    ) : (
                      "Carregar mais posts"
                    )}
                  </button>
                </div>
              )}
              {!hasMore && posts.length > 0 && !loadingPosts && (
                <p className="text-center text-[11px] text-muted-foreground font-body py-4 opacity-60">
                  Você chegou ao fim 🎉
                </p>
              )}
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-24"><RightSidebar /></div>
            </aside>
          </div>
        </div>
      </div>

      {openPost && (
        <PostModal
          post={openPost}
          onClose={closeModal}
          onLike={handleLike}
          onSave={handleSave}
          myAvatarUrl={myAvatarUrl}
          myName={myName}
          myDisc={myDisc}
          myDiscRingImg={myDiscRingImg}
          myUserId={myCreatorId}
        />
      )}
    </div>
  );
};

export default CommunityPage;