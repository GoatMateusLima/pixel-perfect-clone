import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Plus, BookOpen, Layers, CheckCircle2, XCircle,
  ChevronDown, Loader2, LayoutDashboard,
  GraduationCap, Tag, AlignLeft, Zap,
} from "lucide-react";
import Header from "@/components/Header";
import supabaseAdmin from "../../utils/supabase.ts"; // ← cliente com service_role

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Tema = {
  id: string;
  name: string;
  description: string;
  type: string;
};

type Notification = {
  id: number;
  type: "success" | "error";
  message: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const TEMA_TYPES = [
  "Alta demanda", "Tecnologia", "Segurança", "Dados", "Cloud",
  "Desenvolvimento", "Negócios", "Criatividade", "Saúde",
  "Cibersegurança", "Sustentabilidade", "IA",
];

const DIFFICULTIES = ["Iniciante", "Intermediário", "Avançado"];

const difficultyColor: Record<string, string> = {
  Iniciante: "hsl(155 60% 45%)",
  Intermediário: "hsl(45 85% 55%)",
  Avançado: "hsl(0 65% 58%)",
};

const gridBg = {
  backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.04) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

// ─── Helpers de UI ────────────────────────────────────────────────────────────
const inputClass =
  "w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/40 text-foreground text-sm font-body placeholder:text-muted-foreground/40 outline-none focus:border-primary/60 focus:bg-secondary/50 transition-all";

const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-2 text-xs font-accent font-bold text-muted-foreground uppercase tracking-widest">
      <Icon size={12} className="text-primary" />
      {label}
    </label>
    {children}
  </div>
);

const SelectField = ({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} appearance-none cursor-pointer pr-10`}
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
    />
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastStack = ({
  notifications,
  onRemove,
}: {
  notifications: Notification[];
  onRemove: (id: number) => void;
}) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
    <AnimatePresence>
      {notifications.map((n) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: 40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.9 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-sm border text-sm font-accent font-semibold shadow-xl backdrop-blur-sm
            ${n.type === "success"
              ? "bg-background/90 border-primary/40 text-primary"
              : "bg-background/90 border-rose-500/40 text-rose-400"
            }`}
        >
          {n.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {n.message}
          <button
            onClick={() => onRemove(n.id)}
            className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
          >
            <XCircle size={13} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ─── Painel ───────────────────────────────────────────────────────────────────
const Panel = ({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="hologram-panel rounded-sm overflow-hidden"
  >
    <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}30)` }} />
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
        <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  </motion.div>
);

// ─── Admin Page ───────────────────────────────────────────────────────────────
const AdminPage = () => {
  // ── Notificações ──
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      4000
    );
  };

  // ── Formulário de Tema ──
  const [temaForm, setTemaForm] = useState({ name: "", description: "", type: "" });
  const [savingTema, setSavingTema] = useState(false);

  const handleSaveTema = async () => {
    if (!temaForm.name.trim() || !temaForm.type) {
      notify("error", "Preencha o nome e o tipo do tema.");
      return;
    }
    setSavingTema(true);
    const { error } = await supabaseAdmin.from("temas").insert({
      name: temaForm.name.trim(),
      description: temaForm.description.trim(),
      type: temaForm.type,
    });
    setSavingTema(false);

    if (error) {
      notify("error", "Erro ao salvar: " + error.message);
    } else {
      notify("success", `Tema "${temaForm.name}" criado!`);
      setTemaForm({ name: "", description: "", type: "" });
      loadTemas();
    }
  };

  // ── Temas carregados ──
  const [temas, setTemas] = useState<Tema[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(true);

  const loadTemas = async () => {
    setLoadingTemas(true);
    const { data, error } = await supabaseAdmin
      .from("temas")
      .select("id, name, description, type")
      .order("created_at", { ascending: true });

    if (error) {
      notify("error", "Erro ao carregar temas: " + error.message);
    } else {
      setTemas(data || []);
    }
    setLoadingTemas(false);
  };

  useEffect(() => { loadTemas(); }, []);

  // ── Formulário de Curso ──
  const [courseForm, setCourseForm] = useState({
    name: "",
    descricao: "",
    difficult: "",
    courses_id: "",   // UUID do tema vinculado
    playlistUrl: "",  // URL completa (só pra exibição no input)
    playlist_id: "",  // ID extraído após "?list=" (vai pro banco)
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Extrai o playlist_id da URL do YouTube automaticamente
  const extractPlaylistId = (raw: string): string => {
    try {
      const params = new URL(raw).searchParams;
      return params.get("list") ?? raw.trim();
    } catch {
      return raw.trim(); // Se não for URL, assume que já é o ID puro
    }
  };

  const handlePlaylistUrlChange = (raw: string) => {
    setCourseForm((p) => ({
      ...p,
      playlistUrl: raw,
      playlist_id: extractPlaylistId(raw),
    }));
  };

  const handleSaveCourse = async () => {
    if (!courseForm.name.trim() || !courseForm.difficult || !courseForm.courses_id) {
      notify("error", "Preencha nome, dificuldade e o tema do curso.");
      return;
    }
    setSavingCourse(true);
    const { error } = await supabaseAdmin.from("courses").insert({
      name: courseForm.name.trim(),
      descricao: courseForm.descricao.trim() || null,
      difficult: courseForm.difficult,
      courses_id: courseForm.courses_id,
      playlist_id: courseForm.playlist_id || null,
    });
    setSavingCourse(false);

    if (error) {
      notify("error", "Erro ao salvar: " + error.message);
    } else {
      const temaNome = temas.find((t) => t.id === courseForm.courses_id)?.name ?? "";
      notify("success", `Curso criado em "${temaNome}"!`);
      setCourseForm({ name: "", descricao: "", difficult: "", courses_id: "", playlistUrl: "", playlist_id: "" });
    }
  };

  const selectedTema = temas.find((t) => t.id === courseForm.courses_id);

  return (
    <section className="relative min-h-screen bg-background scanline overflow-x-hidden">
      <Header />
      <div className="absolute inset-0 pointer-events-none opacity-50" style={gridBg} />

      <div className="relative z-10 pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">

        {/* ── Cabeçalho ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20">
              <LayoutDashboard size={15} className="text-primary" />
            </div>
            <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest">
              Painel Administrativo
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Gerenciar Conteúdo
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-xl leading-relaxed">
            Adicione novos temas e cursos à plataforma. Os dados são salvos diretamente no banco de dados.
          </p>
        </motion.div>

        {/* ── Painéis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ══ CRIAR TEMA ══ */}
          <Panel title="Novo Tema" icon={Layers} accent="hsl(155 60% 45%)">
            <div className="flex flex-col gap-5">
              <Field label="Nome do Tema" icon={Tag}>
                <input
                  type="text"
                  value={temaForm.name}
                  onChange={(e) => setTemaForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ex: Inteligência Artificial"
                  className={inputClass}
                />
              </Field>

              <Field label="Tipo / Categoria" icon={BookOpen}>
                <SelectField
                  value={temaForm.type}
                  onChange={(v) => setTemaForm((p) => ({ ...p, type: v }))}
                  placeholder="Selecione o tipo..."
                >
                  {TEMA_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </SelectField>
              </Field>

              <Field label="Descrição" icon={AlignLeft}>
                <textarea
                  value={temaForm.description}
                  onChange={(e) => setTemaForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva sobre o que é esta trilha de conteúdo..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <AnimatePresence>
                {temaForm.type && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-sm border border-border/30 bg-secondary/10 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-accent font-bold text-muted-foreground uppercase tracking-widest">Preview:</span>
                      <span className="text-xs font-accent font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                        {temaForm.type}
                      </span>
                      {temaForm.name && (
                        <span className="text-xs font-display font-bold text-foreground truncate">
                          — {temaForm.name}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSaveTema}
                disabled={savingTema}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-sm bg-primary text-primary-foreground font-accent font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTema
                  ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                  : <><Plus size={15} /> Criar Tema</>}
              </button>
            </div>
          </Panel>

          {/* ══ CRIAR CURSO ══ */}
          <Panel title="Novo Curso" icon={GraduationCap} accent="hsl(210 70% 60%)">
            <div className="flex flex-col gap-5">
              <Field label="Nome do Curso" icon={Tag}>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ex: Python para Iniciantes"
                  className={inputClass}
                />
              </Field>

              <Field label="Descrição" icon={AlignLeft}>
                <textarea
                  value={courseForm.descricao}
                  onChange={(e) => setCourseForm((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descreva brevemente o conteúdo do curso..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="Dificuldade" icon={Zap}>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => {
                    const active = courseForm.difficult === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setCourseForm((p) => ({ ...p, difficult: d }))}
                        className="py-2.5 px-3 rounded-sm border text-xs font-accent font-bold uppercase tracking-wide transition-all"
                        style={active
                          ? { color: difficultyColor[d], background: `${difficultyColor[d]}15`, borderColor: `${difficultyColor[d]}50` }
                          : { color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary) / 0.2)", borderColor: "hsl(var(--border) / 0.3)" }
                        }
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Playlist do YouTube */}
              <Field label="URL da Playlist do YouTube" icon={BookOpen}>
                <input
                  type="text"
                  value={courseForm.playlistUrl}
                  onChange={(e) => handlePlaylistUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  className={inputClass}
                />
                {/* Preview do ID extraído */}
                <AnimatePresence>
                  {courseForm.playlist_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-sm border border-border/30 bg-secondary/10">
                        <span className="text-[10px] font-accent font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                          ID extraído:
                        </span>
                        <span className="text-[11px] font-mono text-primary truncate">
                          {courseForm.playlist_id}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Field>

              <Field label="Vincular ao Tema" icon={Layers}>
                {loadingTemas ? (
                  <div className="flex items-center gap-2 py-3 px-4 rounded-sm border border-border/30 bg-secondary/20">
                    <Loader2 size={13} className="animate-spin text-muted-foreground" />
                    <span className="text-xs font-accent text-muted-foreground">Carregando temas...</span>
                  </div>
                ) : temas.length === 0 ? (
                  <div className="py-3 px-4 rounded-sm border border-dashed border-border/30 text-xs font-accent text-muted-foreground text-center">
                    Nenhum tema cadastrado. Crie um tema primeiro.
                  </div>
                ) : (
                  <SelectField
                    value={courseForm.courses_id}
                    onChange={(v) => setCourseForm((p) => ({ ...p, courses_id: v }))}
                    placeholder="Selecione o tema..."
                  >
                    {temas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </SelectField>
                )}
              </Field>

              <AnimatePresence>
                {selectedTema && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-sm border border-border/30 bg-secondary/10">
                      <p className="text-[10px] font-accent font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Tema vinculado
                      </p>
                      <p className="text-sm font-display font-bold text-foreground">{selectedTema.name}</p>
                      {selectedTema.description && (
                        <p className="text-xs font-body text-muted-foreground line-clamp-1 mt-0.5">
                          {selectedTema.description}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] font-accent font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                        {selectedTema.type}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSaveCourse}
                disabled={savingCourse || temas.length === 0}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-sm font-accent font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "hsl(210 70% 60%)", color: "hsl(220 15% 8%)" }}
              >
                {savingCourse
                  ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                  : <><Plus size={15} /> Criar Curso</>}
              </button>
            </div>
          </Panel>
        </div>

        {/* ── Lista de temas cadastrados ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-accent font-bold text-muted-foreground uppercase tracking-widest">
              Temas cadastrados
            </span>
            <span className="text-xs font-accent text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {temas.length}
            </span>
          </div>

          {loadingTemas ? (
            <div className="flex items-center gap-2 py-6">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-xs font-accent text-muted-foreground">Carregando...</span>
            </div>
          ) : temas.length === 0 ? (
            <div className="py-8 border border-dashed border-border/30 rounded-sm text-center">
              <p className="text-xs font-body text-muted-foreground">Nenhum tema cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {temas.map((t) => (
                <div key={t.id} className="hologram-panel rounded-sm p-4 flex flex-col gap-1">
                  <p className="text-sm font-display font-bold text-foreground truncate">{t.name}</p>
                  <span className="text-[10px] font-accent text-primary">{t.type}</span>
                  {t.description && (
                    <p className="text-[11px] font-body text-muted-foreground line-clamp-2 mt-0.5">
                      {t.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <ToastStack
        notifications={notifications}
        onRemove={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
    </section>
  );
};

export default AdminPage;