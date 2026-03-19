import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import QuizTab from "../components/Quiztab";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "../../utils/supabase.ts";
import PostModal from "../components/PostModal";
import {
  PlayCircle,
  ClipboardList,
  MessageCircleQuestion,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Send,
  Clock,
  BookOpen,
  Star,
  Heart,
  MessageCircle,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "aula" | "quiz" | "duvidas";

// Doubt é exatamente Post da Community — mesmas colunas de publications
interface Doubt {
  id: string;
  creator_id: string;
  description: string;
  date: string;
  midia?: string;
  liked_by: string[];
  like_qnt: number;
  liked: boolean;
  saved: boolean;
  comments: any[];
  profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    disc_ring_img?: string;
    role?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Cópia exata do rowToPost da CommunityPage
const rowToDoubt = (row: any, userId?: string): Doubt => {
  const profileRaw = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles ?? row.profile ?? null;
  const bordaAtiva = (profileRaw?.bordas ?? []).find((b: any) => b.ativa) ?? null;

  return {
    id:          row.id,
    creator_id:  row.creator_id,
    description: row.description,
    date:        row.date,
    midia:       row.midia,
    liked_by:    row.liked_by ?? [],
    like_qnt:    (row.liked_by ?? []).length,
    liked:       userId ? (row.liked_by ?? []).includes(userId) : false,
    saved:       false,
    comments:    [],
    profile: profileRaw ? {
      id:           profileRaw.user_id,
      name:         profileRaw.name      ?? "Usuário",
      avatar_url:   profileRaw.perfil    ?? undefined,
      disc_ring_img: bordaAtiva?.img_url ?? undefined,
      role:         profileRaw.descricao ?? undefined,
    } : undefined,
  };
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const LESSONS = [
  { id: 1, title: "Introdução ao Mercado Tech", duration: "12min", done: true },
  { id: 2, title: "Fundamentos de Programação", duration: "18min", done: true },
  { id: 3, title: "Lógica e Algoritmos", duration: "22min", done: false, active: true },
  { id: 4, title: "Git & Versionamento", duration: "15min", done: false, locked: true },
  { id: 5, title: "Deploy na Nuvem", duration: "20min", done: false, locked: true },
];

const LESSON_INFO: Record<number, { title: string; description: string; duration: string; module: string; num: number }> = {
  1: { title: "Introdução ao Mercado Tech", description: "Uma visão geral do ecossistema tech, oportunidades de carreira e como se posicionar no mercado atual.", duration: "12:00", module: "Módulo 1", num: 1 },
  2: { title: "Fundamentos de Programação", description: "Os pilares essenciais que todo dev precisa dominar: variáveis, tipos, operadores e estruturas básicas.", duration: "18:00", module: "Módulo 1", num: 2 },
  3: { title: "Lógica e Algoritmos", description: "Aprenda a estruturar o raciocínio lógico para resolver qualquer problema com código — do pseudocódigo à implementação real.", duration: "22:00", module: "Módulo 1", num: 3 },
};

const AulaTab = ({ activeLesson = 3 }: { activeLesson?: number }) => {
  const lesson = LESSON_INFO[activeLesson] ?? LESSON_INFO[3];
  const lessonData = LESSONS.find(l => l.id === activeLesson);
  const isLocked = lessonData?.locked;

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hologram-panel rounded-sm p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"
          style={{ boxShadow: "0 0 20px hsl(215 20% 20%)" }}>
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">Aula Bloqueada</h3>
        <p className="text-sm text-muted-foreground font-body">Complete as aulas anteriores para desbloquear este conteúdo.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <motion.div
        key={activeLesson}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hologram-panel rounded-sm overflow-hidden"
      >
        {/* Video area */}
        <div
          className="relative w-full bg-[hsl(200_30%_5%)]"
          style={{ aspectRatio: "16/9" }}
        >
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/60 z-10 pointer-events-none" />

          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/u7XSuhGroL0?rel=0&modestbranding=1"
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Lesson info */}
        <div className="p-5">
          <h2 className="font-display text-lg font-bold text-foreground mb-1">{lesson.title}</h2>
          <p className="text-sm text-foreground/75 font-body leading-relaxed">{lesson.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-accent">
            <span className="flex items-center gap-1"><BookOpen size={12} /> {lesson.module}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration}</span>
            <span className="flex items-center gap-1 text-accent">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className="fill-accent" />)}
              4.9
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mini lesson list for mobile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="hologram-panel rounded-sm p-4 lg:hidden"
      >
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={14} className="text-primary" /> Aulas do Módulo
        </h3>
        <div className="space-y-1">
          {LESSONS.map((l) => (
            <div key={l.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all
                ${l.id === activeLesson ? "border-primary/40 bg-primary/10" : "border-transparent"}
                ${l.locked ? "opacity-40" : ""}
              `}>
              {l.done ? <CheckCircle2 size={14} className="text-primary shrink-0" /> :
                l.locked ? <Lock size={14} className="text-muted-foreground shrink-0" /> :
                  <PlayCircle size={14} className="text-accent shrink-0" />}
              <span className={`text-xs font-body flex-1 truncate ${l.id === activeLesson ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{l.title}</span>
              <span className="text-xs font-accent text-muted-foreground">{l.duration}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── DuvidasTab ───────────────────────────────────────────────────────────────

const DuvidasTab = () => {
  const { user, profilePhoto } = useAuth();
  const myCreatorId = user?.id;
  const myName      = user?.name ?? "Você";
  const myDisc      = user?.assessment?.discProfile ?? "S";

  const [doubts,     setDoubts]     = useState<Doubt[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newDoubt,   setNewDoubt]   = useState("");
  const [filter,     setFilter]     = useState<"recentes" | "populares">("recentes");
  const [openDoubt,  setOpenDoubt]  = useState<Doubt | null>(null);

  // ── Carrega dúvidas — query idêntica à CommunityPage ────────────────────────
  const fetchDoubts = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .order("date", { ascending: false });

    if (error) {
      console.error("[DuvidasTab] Erro ao carregar dúvidas:", error.message);
      setLoading(false);
      return;
    }

    setDoubts((data ?? []).map((row) => rowToDoubt(row, myCreatorId)));
    setLoading(false);
  }, [myCreatorId]);

  useEffect(() => { fetchDoubts(); }, [fetchDoubts]);

  // ── Realtime — canal idêntico ao da CommunityPage ───────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("duvidas-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "publications" },
        async (payload) => {
          if (payload.new.creator_id === myCreatorId) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, name, perfil, descricao, bordas")
            .eq("user_id", payload.new.creator_id)
            .maybeSingle();

          setDoubts((prev) => [
            rowToDoubt({ ...payload.new, profiles: profile }, myCreatorId),
            ...prev,
          ]);
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "publications" },
        (payload) => {
          setDoubts((prev) =>
            prev.map((d) => {
              if (d.id !== payload.new.id) return d;
              const likedBy: string[] = payload.new.liked_by ?? [];
              return {
                ...d,
                liked_by: likedBy,
                like_qnt: likedBy.length,
                liked:    myCreatorId ? likedBy.includes(myCreatorId) : d.liked,
              };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myCreatorId]);

  // ── Publicar dúvida — insert idêntico ao CreatePost da Community ─────────────
  // Insere em publications com os mesmos campos existentes: description, date, liked_by
  const handleSubmitDoubt = async () => {
    const text = newDoubt.trim();
    if (!text || !myCreatorId || submitting) return;

    setSubmitting(true);

    // Optimistic update — igual ao handlePost da CommunityPage
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Doubt = {
      id: tempId,
      creator_id:  myCreatorId,
      description: text,
      date:        now,
      liked_by:    [],
      like_qnt:    0,
      liked:       false,
      saved:       false,
      comments:    [],
      profile: {
        id:         myCreatorId,
        name:       myName,
        avatar_url: profilePhoto ?? undefined,
        role:       "Membro · UpJobs",
      },
    };
    setDoubts((prev) => [optimistic, ...prev]);
    setNewDoubt("");

    const { data, error } = await supabase
      .from("publications")
      .insert({
        creator_id:  myCreatorId,
        description: text,
        date:        now,
        liked_by:    [],
        // midia não obrigatório — não passa
      })
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .single();

    if (error) {
      console.error("[DuvidasTab] Erro ao publicar dúvida:", error.message);
      setDoubts((prev) => prev.filter((d) => d.id !== tempId));
      setNewDoubt(text);
    } else {
      setDoubts((prev) =>
        prev.map((d) => (d.id === tempId ? rowToDoubt(data, myCreatorId) : d))
      );
    }

    setSubmitting(false);
  };

  // ── Like / Unlike — RPCs idênticas às da CommunityPage ──────────────────────
  const handleLike = async (id: string) => {
    if (!myCreatorId) return;
    const doubt = doubts.find((d) => d.id === id);
    if (!doubt) return;

    const alreadyLiked = doubt.liked;
    const prevDoubts   = doubts;

    setDoubts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const newLikedBy = alreadyLiked
          ? d.liked_by.filter((uid) => uid !== myCreatorId)
          : [...d.liked_by, myCreatorId];
        return { ...d, liked_by: newLikedBy, like_qnt: newLikedBy.length, liked: !alreadyLiked };
      })
    );

    const { error } = await supabase.rpc(
      alreadyLiked ? "unlike_publication" : "like_publication",
      { pub_id: id, uid: myCreatorId }
    );

    if (error) {
      console.error("Like dúvida:", error.message);
      setDoubts(prevDoubts);
    }
  };

  // ── Abre PostModal para ver/responder a dúvida — igual à CommunityPage ───────
  const openModal = (doubt: Doubt) => setOpenDoubt(doubt);
  const closeModal = () => setOpenDoubt(null);

  const sorted = filter === "populares"
    ? [...doubts].sort((a, b) => b.like_qnt - a.like_qnt)
    : [...doubts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getInitialLetter = (name?: string) =>
    name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Formulário de nova dúvida ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hologram-panel rounded-sm p-5"
      >
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <MessageCircleQuestion size={14} className="text-primary" />
          Enviar uma Dúvida
        </h3>
        <div className="flex gap-3">
          {/* Avatar do usuário logado */}
          <div className="shrink-0 w-9 h-9 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center font-display text-xs font-bold"
            style={{ background: "hsl(215 28% 18%)", color: "hsl(155 60% 60%)" }}>
            {profilePhoto
              ? <img src={profilePhoto} alt={myName} className="w-full h-full object-cover" />
              : getInitialLetter(myName)}
          </div>
          <div className="flex-1">
            <textarea
              value={newDoubt}
              onChange={(e) => setNewDoubt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmitDoubt(); }}
              rows={3}
              placeholder="Escreva sua dúvida sobre o conteúdo desta aula... (Ctrl+Enter para enviar)"
              className="w-full px-4 py-3 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmitDoubt}
                disabled={!newDoubt.trim() || submitting || !myCreatorId}
                className="flex items-center gap-2 px-5 py-2 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold disabled:opacity-40 hover:brightness-110 transition"
                style={{ boxShadow: newDoubt.trim() ? "0 0 12px hsl(25 90% 55% / 0.35)" : "none" }}
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Publicar Dúvida
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filtro ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-body mr-1">Ordenar:</span>
        {(["recentes", "populares"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-sm text-xs font-accent font-semibold transition
              ${f === filter
                ? "text-primary-foreground"
                : "text-muted-foreground border border-border hover:text-foreground"}`}
            style={f === filter
              ? { background: "hsl(155 60% 35%)", boxShadow: "0 0 10px hsl(155 60% 45% / 0.3)" }
              : undefined}
          >
            {f === "recentes" ? "🕒 Recentes" : "🔥 Populares"}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground/50 font-body">
          {doubts.length} {doubts.length === 1 ? "dúvida" : "dúvidas"}
        </span>
      </div>

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hologram-panel rounded-sm p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary/60 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-secondary/60 rounded w-1/4" />
                  <div className="h-3 bg-secondary/50 rounded w-full" />
                  <div className="h-3 bg-secondary/40 rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="hologram-panel rounded-sm p-10 text-center">
          <p className="text-sm text-muted-foreground font-body">
            Nenhuma dúvida ainda. Seja o primeiro!
          </p>
        </div>
      ) : (
        /* ── Cards de dúvida ── */
        <AnimatePresence mode="popLayout">
          {sorted.map((doubt, i) => (
            <motion.div
              key={doubt.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.04 }}
              className="hologram-panel rounded-sm p-4 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => openModal(doubt)}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="shrink-0 w-9 h-9 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center font-display text-xs font-bold"
                  style={{ background: "hsl(215 28% 18%)", color: "hsl(155 60% 60%)" }}>
                  {doubt.profile?.avatar_url
                    ? <img src={doubt.profile.avatar_url} alt={doubt.profile.name} className="w-full h-full object-cover" />
                    : getInitialLetter(doubt.profile?.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-accent font-semibold text-foreground">
                      {doubt.profile?.name ?? "Usuário"}
                    </span>
                    {doubt.profile?.role && (
                      <span className="text-[10px] text-muted-foreground font-body">
                        {doubt.profile.role}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50 font-body ml-auto">
                      {doubt.date
                        ? new Date(doubt.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                        : ""}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/85 font-body leading-relaxed line-clamp-3 mb-3">
                    {doubt.description}
                  </p>

                  {/* Action bar */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Like */}
                    <button
                      onClick={() => handleLike(doubt.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent transition-all hover:bg-white/5"
                      style={doubt.liked ? { color: "hsl(5 80% 60%)" } : { color: "hsl(215 15% 50%)" }}
                    >
                      <motion.span
                        animate={doubt.liked ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                        transition={{ duration: 0.35 }}
                        style={{ display: "flex" }}
                      >
                        <Heart
                          size={13}
                          style={doubt.liked ? { fill: "hsl(5 80% 60%)", color: "hsl(5 80% 60%)" } : {}}
                        />
                      </motion.span>
                      <span>{doubt.like_qnt}</span>
                    </button>

                    {/* Comentários — abre PostModal */}
                    <button
                      onClick={() => openModal(doubt)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent transition-all hover:bg-white/5"
                      style={{ color: "hsl(215 15% 50%)" }}
                    >
                      <MessageCircle size={13} />
                      <span>Responder</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* ── PostModal para comentários — igual à CommunityPage ── */}
      {openDoubt && (
        <PostModal
          post={openDoubt as any}
          onClose={closeModal}
          onLike={(id: string) => handleLike(id)}
          onSave={() => {}}
          profilePhoto={profilePhoto}
          myName={myName}
          myDisc={myDisc}
          myDiscRingImg={undefined}
          myUserId={myCreatorId}
        />
      )}
    </div>
  );
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "aula", label: "Aula", icon: <PlayCircle size={15} /> },
  { id: "quiz", label: "Quiz", icon: <ClipboardList size={15} /> },
  { id: "duvidas", label: "Dúvidas", icon: <MessageCircleQuestion size={15} /> },
];

// ─── Roadmap Data ─────────────────────────────────────────────────────────────

interface RoadmapNode {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  status: "done" | "active" | "locked";
  module: number;
}

const ROADMAP_NODES: RoadmapNode[] = [
  { id: 1, title: "Mercado Tech", subtitle: "Introdução", icon: "🌐", status: "done", module: 1 },
  { id: 2, title: "Fundamentos", subtitle: "Programação", icon: "💡", status: "done", module: 1 },
  { id: 3, title: "Lógica", subtitle: "Algoritmos", icon: "🧠", status: "active", module: 1 },
  { id: 4, title: "Git", subtitle: "Versionamento", icon: "🔀", status: "locked", module: 2 },
  { id: 5, title: "Deploy", subtitle: "Nuvem", icon: "☁️", status: "locked", module: 2 },
  { id: 6, title: "Front-end", subtitle: "HTML & CSS", icon: "🎨", status: "locked", module: 2 },
  { id: 7, title: "JavaScript", subtitle: "ES6+", icon: "⚡", status: "locked", module: 3 },
  { id: 8, title: "React", subtitle: "Componentes", icon: "⚛️", status: "locked", module: 3 },
  { id: 9, title: "Back-end", subtitle: "Node.js & APIs", icon: "🔧", status: "locked", module: 3 },
  { id: 10, title: "Banco de Dados", subtitle: "SQL & NoSQL", icon: "🗄️", status: "locked", module: 4 },
  { id: 11, title: "DevOps", subtitle: "CI/CD & Docker", icon: "🐳", status: "locked", module: 4 },
  { id: 12, title: "Certificado", subtitle: "Full Stack Dev", icon: "🏆", status: "locked", module: 5 },
];

// ─── Roadmap Component ────────────────────────────────────────────────────────

const RoadmapPanel = ({ activeNodeId, onSelectNode }: { activeNodeId: number; onSelectNode: (id: number) => void }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelW, setPanelW] = useState(220);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setPanelW(el.clientWidth); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isCertificate = (node: RoadmapNode) => node.id === 12;

  const HEADER_H_V = 110;
  const ROW_H = 100;
  const totalH = HEADER_H_V + ROADMAP_NODES.length * ROW_H + 60;
  const midX = panelW / 2;
  const ampX = Math.min(panelW * 0.28, 70);

  const vNodePos = ROADMAP_NODES.map((node, i) => {
    const isCert = isCertificate(node);
    const y = HEADER_H_V + i * ROW_H + ROW_H / 2;
    const x = isCert ? midX : midX + (i % 2 === 0 ? -ampX : ampX);
    return { x, y };
  });

  const vRoadPath = (() => {
    if (vNodePos.length === 0) return "";
    let d = `M ${vNodePos[0].x} ${vNodePos[0].y}`;
    for (let i = 1; i < vNodePos.length; i++) {
      const p0 = vNodePos[i - 1];
      const p1 = vNodePos[i];
      const dy = (p1.y - p0.y) * 0.5;
      d += ` C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
    }
    return d;
  })();

  const vSegments = ROADMAP_NODES.slice(1).map((node, i) => {
    const p0 = vNodePos[i];
    const p1 = vNodePos[i + 1];
    const dy = (p1.y - p0.y) * 0.5;
    const d = `M ${p0.x} ${p0.y} C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
    const prev = ROADMAP_NODES[i];
    const lit = prev.status === "done" || prev.status === "active";
    return { d, lit, key: node.id };
  });

  const V_PIN_COLORS: Record<string, string> = {
    done: "hsl(155 60% 42%)",
    active: "hsl(25 90% 55%)",
    locked: "hsl(215 20% 30%)",
    cert: "hsl(45 90% 55%)",
  };

  return (
    <div ref={containerRef} className="relative flex flex-col overflow-hidden" style={{ height: "calc(100vh - 108px)" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 30% at 50% 10%, hsl(155 60% 45% / 0.07) 0%, transparent 70%)" }} />

      <div className="shrink-0 sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/60 backdrop-blur-sm border-b border-border/30">
        <p className="text-xs font-accent font-semibold text-foreground/70 tracking-widest uppercase mb-0.5">Sua Jornada</p>
        <h2 className="font-display text-sm font-bold text-foreground leading-tight">
          Trilha <span className="text-primary" style={{ textShadow: "0 0 10px hsl(155 60% 45% / 0.6)" }}>Dev Full Stack</span>
        </h2>
        <div className="mt-2">
          <div className="flex justify-between text-xs font-accent text-muted-foreground mb-1">
            <span>Progresso</span><span className="text-primary font-bold">2 / 11</span>
          </div>
          <div className="h-0.5 rounded-full bg-secondary overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "18%" }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
              style={{ boxShadow: "0 0 6px hsl(155 60% 45% / 0.8)" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.3) transparent" }}>
        <div className="relative" style={{ height: totalH, width: "100%" }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height={totalH}>
            <defs>
              <filter id="vRoadGlow" x="-30%" y="-10%" width="160%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="vPinGlow" x="-50%" y="-30%" width="200%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {vSegments.map(({ d, lit, key }) => (
              <g key={key}>
                <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lit ? "hsl(155, 42%, 20%)" : "hsl(215, 18%, 13%)"} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lit ? "hsl(155, 60%, 38%)" : "hsl(215, 20%, 26%)"} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
              </g>
            ))}

            <path d={vRoadPath} fill="none" stroke="hsl(215, 15%, 48%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.4" />

            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <path key={`vdash-${key}`} d={d} fill="none" stroke="hsl(155, 60%, 48%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.55" />
            ))}

            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <circle key={`vdot-${key}`} r="3" fill="hsl(155, 70%, 62%)" filter="url(#vRoadGlow)" opacity="0.9">
                <animateMotion dur="3s" repeatCount="indefinite" path={d} />
              </circle>
            ))}

            {ROADMAP_NODES.map((node, index) => {
              const { x, y } = vNodePos[index];
              const isCert = isCertificate(node);
              const isDone = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked" && !isCert;
              const isSelected = activeNodeId === node.id;
              const isHovered = hoveredId === node.id;
              const pinColor = isCert ? V_PIN_COLORS.cert : isDone ? V_PIN_COLORS.done : isActive ? V_PIN_COLORS.active : V_PIN_COLORS.locked;
              const isOnRight = x > midX;
              const pinW = isCert ? 44 : 36;
              const pinH = isCert ? 54 : 46;
              const pinX = isOnRight ? x + 10 : x - 10;
              const pinTop = y - pinH - 2;

              return (
                <g key={node.id}
                  onClick={() => !isLocked && onSelectNode(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                >
                  {(isActive || isSelected) && !isCert && (
                    <circle cx={x} cy={y} r="13" fill="none" stroke={pinColor} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="12;22;12" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isCert && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="2" opacity="0.35">
                      <animate attributeName="r" values="18;32;18" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {(index === 0 || ROADMAP_NODES[index - 1].module !== node.module) && !isCert && (
                    <text x={isOnRight ? x - ampX - 4 : x + ampX + 4} y={y - pinH / 2} textAnchor={isOnRight ? "end" : "start"} fontSize="8" fontFamily="monospace" fill="hsl(155, 60%, 40%)" opacity="0.5" fontWeight="bold" letterSpacing="2">
                      M{node.module}
                    </text>
                  )}
                  <ellipse cx={pinX} cy={pinTop + pinH + 3} rx={pinW * 0.28} ry={3.5} fill="rgba(0,0,0,0.45)" />
                  <g filter={isHovered || isSelected ? "url(#vPinGlow)" : "none"}
                    style={{ transition: "transform 0.15s ease", transform: isHovered && !isLocked ? `translate(0px, -5px)` : "none" }}>
                    <path
                      d={`M ${pinX} ${pinTop + pinH} C ${pinX - 2} ${pinTop + pinH - 10}, ${pinX - pinW / 2} ${pinTop + pinH * 0.65}, ${pinX - pinW / 2} ${pinTop + pinH * 0.42} A ${pinW / 2} ${pinH * 0.45} 0 1 1 ${pinX + pinW / 2} ${pinTop + pinH * 0.42} C ${pinX + pinW / 2} ${pinTop + pinH * 0.65}, ${pinX + 2} ${pinTop + pinH - 10}, ${pinX} ${pinTop + pinH} Z`}
                      fill={isLocked ? "hsl(215, 18%, 18%)" : pinColor}
                      stroke={isSelected && !isCert ? "white" : isLocked ? "hsl(215, 20%, 28%)" : "rgba(255,255,255,0.18)"}
                      strokeWidth={isSelected ? "2" : "1"}
                      opacity={isLocked ? 0.6 : 1}
                    />
                    <ellipse cx={pinX - pinW * 0.1} cy={pinTop + pinH * 0.28} rx={pinW * 0.18} ry={pinH * 0.14} fill="rgba(255,255,255,0.22)" style={{ filter: isLocked ? "grayscale(1)" : "none" }} />
                    <text x={pinX} y={pinTop + pinH * 0.46} textAnchor="middle" dominantBaseline="middle" fontSize={isCert ? 17 : 14} style={{ filter: isLocked ? "grayscale(1) opacity(0.5)" : "none", userSelect: "none" }}>
                      {isLocked ? "🔒" : node.icon}
                    </text>
                    {isDone && (
                      <g>
                        <circle cx={pinX + pinW / 2 - 2} cy={pinTop + 4} r="7" fill="hsl(155, 60%, 38%)" stroke="hsl(155, 65%, 52%)" strokeWidth="1.5" />
                        <text x={pinX + pinW / 2 - 2} y={pinTop + 4} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">✓</text>
                      </g>
                    )}
                  </g>
                  <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={isLocked ? "hsl(215, 20%, 28%)" : pinColor} stroke="hsl(215, 25%, 9%)" strokeWidth="2" style={{ filter: !isLocked ? `drop-shadow(0 0 5px ${pinColor})` : "none" }} />
                  <line x1={x} y1={y} x2={pinX} y2={pinTop + pinH - 2} stroke={isLocked ? "hsl(215, 20%, 28%)" : pinColor} strokeWidth="1.5" opacity="0.5" strokeDasharray="3 2" />
                </g>
              );
            })}
          </svg>

          {ROADMAP_NODES.map((node, index) => {
            const { x, y } = vNodePos[index];
            const isCert = isCertificate(node);
            const isDone = node.status === "done";
            const isActive = node.status === "active";
            const isSelected = activeNodeId === node.id;
            const isOnRight = x > midX;
            const pinH = isCert ? 54 : 46;
            const labelX = isOnRight ? x - ampX - 12 : x + ampX + 12;
            const labelW = 80;

            return (
              <div key={`vlabel-${node.id}`} className="absolute pointer-events-none"
                style={{ left: isOnRight ? labelX - labelW : labelX, top: y - pinH / 2 - 4, width: labelW, textAlign: isOnRight ? "right" : "left" }}>
                <p className={`font-display text-xs font-bold leading-tight ${isCert ? "text-[hsl(45_90%_65%)]" : isDone || isActive || isSelected ? "text-foreground" : "text-muted-foreground/85"}`}
                  style={isCert ? { textShadow: "0 0 8px hsl(45 90% 55% / 0.5)" } : {}}>
                  {node.title}
                </p>
                <p className="text-xs font-body text-muted-foreground/85 mt-0.5 leading-tight">{node.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── AI Chat Types ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  ts: string;
}

const SUGGESTIONS = [
  "O que é uma closure em JavaScript?",
  "Como funciona o Git rebase?",
  "Explique REST vs GraphQL",
  "Qual a diferença entre == e === ?",
  "Como funciona async/await?",
  "O que é Docker e por que usar?",
];

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

const AI_KEY = import.meta.env.VITE_AI_KEY;

const AIChatPanel = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Olá! Sou seu tutor de programação. Pergunte qualquer coisa sobre o conteúdo da trilha — lógica, algoritmos, Git, deploy e muito mais. 🚀",
      ts: "agora",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const history = messages
        .filter((m) => m.id !== 0)
        .slice(-4)  
        .map((m) => ({ role: m.role, content: m.text }));

      const systemPrompt = "Responda td"
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AI_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: trimmed },
          ],
        }),
      });

      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        data.error?.message ||
        "Desculpe, não consegui responder agora.";

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: reply,
        ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: "Erro ao conectar com a IA. Tente novamente.", ts: "agora" },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === 0 ? 0.2 : 0 }}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
              style={
                msg.role === "assistant"
                  ? { background: "radial-gradient(circle at 35% 35%, hsl(155 60% 45%), hsl(155 60% 25%))", color: "hsl(155 60% 95%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.4)" }
                  : { background: "hsl(215 25% 22%)", color: "hsl(215 50% 70%)", border: "1px solid hsl(215 25% 32%)" }
              }
            >
              {msg.role === "assistant" ? "IA" : "EU"}
            </div>

            <div
              className="max-w-[80%] px-3 py-2 rounded-sm text-xs font-body leading-relaxed"
              style={
                msg.role === "assistant"
                  ? { background: "hsl(215 25% 12%)", border: "1px solid hsl(155 60% 45% / 0.2)", color: "hsl(215 15% 85%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.05)" }
                  : { background: "hsl(155 60% 20% / 0.4)", border: "1px solid hsl(155 60% 45% / 0.3)", color: "hsl(155 30% 90%)" }
              }
            >
              <pre className="whitespace-pre-wrap font-body text-xs leading-relaxed" style={{ fontFamily: "inherit" }}>
                {msg.text}
              </pre>
              <p className="text-xs text-muted-foreground/90 mt-1 text-right">{msg.ts}</p>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
              style={{ background: "radial-gradient(circle at 35% 35%, hsl(155 60% 45%), hsl(155 60% 25%))", color: "hsl(155 60% 95%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.4)" }}>
              IA
            </div>
            <div className="px-3 py-2.5 rounded-sm flex items-center gap-1.5"
              style={{ background: "hsl(215 25% 12%)", border: "1px solid hsl(155 60% 45% / 0.2)" }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="shrink-0 px-3 pb-2">
          <p className="text-xs font-accent text-foreground/65 uppercase tracking-widest mb-2">Sugestões</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs font-body px-2 py-1 rounded-sm border border-border/60 text-foreground/65 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border/40">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Digite sua dúvida... (Enter para enviar)"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-sm bg-input border border-border text-foreground font-body text-xs focus:outline-none focus:border-primary/60 transition resize-none disabled:opacity-50"
            style={{ minHeight: 36, maxHeight: 80 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-sm flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition"
            style={{ boxShadow: input.trim() ? "0 0 10px hsl(155 60% 45% / 0.4)" : "none" }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("aula");
  const [activeNodeId, setActiveNodeId] = useState(3);
  const [showChat, setShowChat] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(true);

  const columnHeight = "calc(100vh - 108px)";

  return (
    <div className="min-h-screen gradient-hero scanline flex flex-col" style={{ paddingTop: 64 }}>
      <Header />

      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border/50 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-body transition">
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-accent text-muted-foreground tracking-widest uppercase hidden sm:block">Módulo 1 · Fundamentos</span>
          <span className="text-muted-foreground/85 hidden sm:block">·</span>
          <h1 className="font-display text-sm font-bold text-foreground">
            Trilha <span className="text-primary" style={{ textShadow: "0 0 12px hsl(155 60% 45% / 0.5)" }}>Dev Full Stack</span>
          </h1>
        </div>
        <div className="flex items-center gap-3" />
      </div>

      <div className="relative flex flex-1 overflow-hidden divide-x divide-border/30">

        {/* COL 1 — Course content (always visible, left side) */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col bg-background/10 backdrop-blur-sm overflow-hidden"
          style={{ flex: 1, minWidth: 0 }}
        >
          <div
            className="overflow-y-auto px-4 py-4"
            style={{ height: columnHeight, scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent", display: "flex", flexDirection: "column", alignItems: showRoadmap ? "flex-start" : "center" }}
          >
            <div className="flex gap-1.5 mb-5 flex-wrap" style={{ width: "100%", maxWidth: showRoadmap ? "none" : 800 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-accent font-semibold transition-all
                    ${activeTab === tab.id
                      ? "bg-primary/15 text-primary border border-primary/50"
                      : "text-foreground/65 border border-border hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                    }`}
                  style={activeTab === tab.id ? { boxShadow: "0 0 10px hsl(155 60% 45% / 0.25)" } : {}}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="tab-ul"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary"
                      style={{ boxShadow: "0 0 5px hsl(155 60% 45%)" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ width: "100%", maxWidth: showRoadmap ? "none" : 800 }}
              >
                {activeTab === "aula" && <AulaTab activeLesson={activeNodeId} />}
                {activeTab === "quiz" && <QuizTab />}
                {activeTab === "duvidas" && <DuvidasTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* COL 2 — Roadmap (right side, togglable) */}
        <AnimatePresence initial={false}>
          {showRoadmap && (
            <motion.div
              key="roadmap-col"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex flex-col bg-background/15 backdrop-blur-sm overflow-hidden shrink-0"
              style={{ minWidth: 0 }}
            >
              <div style={{ height: columnHeight }}>
                <RoadmapPanel
                  activeNodeId={activeNodeId}
                  onSelectNode={(id) => { setActiveNodeId(id); setActiveTab("aula"); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Botão Roadmap — lateral direita */}
      <motion.button
        onClick={() => setShowRoadmap((v) => !v)}
        title={showRoadmap ? "Ocultar Roadmap" : "Mostrar Roadmap"}
        animate={{ right: showRoadmap ? "50%" : "0px" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="fixed z-50 cursor-pointer border-0 p-0"
        style={{ top: "50%", transform: "translateY(-50%)", width: 28, height: 72, background: "none", filter: showRoadmap ? "drop-shadow(-3px 0 10px hsl(155 60% 45% / 0.55))" : "drop-shadow(-3px 0 7px hsl(0 0% 0% / 0.55))" }}
      >
        <svg width="28" height="72" viewBox="0 0 28 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72 Z" fill={showRoadmap ? "hsl(215 28% 8%)" : "hsl(215 24% 10%)"} />
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72" stroke={showRoadmap ? "hsl(155 60% 45% / 0.7)" : "hsl(215 20% 28%)"} strokeWidth="1" fill="none" />
        </svg>
        <div className="relative z-10 flex items-center justify-center w-full h-full" style={{ paddingRight: 2 }}>
          <span style={{ fontSize: 13, color: showRoadmap ? "hsl(155 60% 65%)" : "hsl(155 50% 50%)", lineHeight: 1 }}>
            {showRoadmap ? "›" : "‹"}
          </span>
        </div>
      </motion.button>

      {/* Botão IA — canto inferior direito */}
      <motion.button
        onClick={() => setShowChat((v) => !v)}
        title={showChat ? "Fechar Tutor IA" : "Abrir Tutor IA"}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-50 cursor-pointer flex items-center justify-center rounded-full border-0"
        style={{
          bottom: 28,
          right: 28,
          width: 52,
          height: 52,
          background: showChat
            ? "radial-gradient(circle at 35% 35%, hsl(155 60% 38%), hsl(155 60% 22%))"
            : "radial-gradient(circle at 35% 35%, hsl(215 28% 18%), hsl(215 28% 10%))",
          border: showChat ? "1.5px solid hsl(155 60% 45% / 0.7)" : "1.5px solid hsl(215 20% 32%)",
          boxShadow: showChat
            ? "0 0 20px hsl(155 60% 45% / 0.55), 0 4px 16px rgba(0,0,0,0.5)"
            : "0 0 12px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <MessageCircleQuestion
          size={22}
          style={{ color: showChat ? "hsl(155 60% 80%)" : "hsl(155 50% 60%)" }}
        />
        {/* Pulse indicator when chat is closed */}
        {!showChat && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-primary"
            style={{ boxShadow: "0 0 6px hsl(155 60% 45%)", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
        )}
      </motion.button>

      {/* Chat Drawer — painel flutuante */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            key="chat-drawer"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-40 flex flex-col overflow-hidden"
            style={{
              bottom: 92,
              right: 28,
              width: 360,
              height: 480,
              background: "hsl(215 28% 9%)",
              border: "1px solid hsl(155 60% 45% / 0.3)",
              borderRadius: 8,
              boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 30px hsl(155 60% 45% / 0.12)",
            }}
          >
            {/* Header do chat */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/40"
              style={{ background: "hsl(215 28% 11%)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }} />
                <span className="text-xs font-accent font-semibold text-primary tracking-widest uppercase">Tutor IA Online</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-muted-foreground hover:text-foreground transition text-base leading-none"
                style={{ lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIChatPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CoursesPage;