import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, BookOpen, Layers, CheckCircle2, XCircle, ChevronDown, Loader2,
  LayoutDashboard, GraduationCap, Tag, AlignLeft, Zap, Pencil, Trash2,
  Check, X, ChevronRight, Link,
} from "lucide-react";
import Header from "@/components/Header";
import supabase from "../../utils/supabase";
import {getPlaylistVideos} from "../../utils/ApiPlaylist";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tema = { id: string; name: string; description: string; type: string };
type Course = { id: string; name: string; difficult: string; courses_id: string };
type Notification = { id: number; type: "success" | "error"; message: string };
type CourseForm = {
  name: string; descricao: string; difficult: string;
  courses_id: string; playlistUrl: string; playlist_id: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const TEMA_TYPES = [
  "Alta demanda", "Tecnologia", "Segurança", "Dados", "Cloud",
  "Desenvolvimento", "Negócios", "Criatividade", "Saúde",
  "Cibersegurança", "Sustentabilidade", "IA",
];
const DIFFICULTIES = ["Iniciante", "Intermediário", "Avançado"];
const DIFF_COLOR: Record<string, string> = {
  Iniciante: "hsl(155 60% 45%)", Intermediário: "hsl(45 85% 55%)", Avançado: "hsl(0 65% 58%)",
};
const gridBg = {
  backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.04) 1px, transparent 1px),linear-gradient(90deg, hsl(155 60% 45% / 0.04) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

// ─── Quiz generation via Groq ─────────────────────────────────────────────────

async function generateQuizForAula(aulaId: string, aulaNome: string, aulaDesc: string) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_AI_KEY_QUIZ}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você é um gerador de quizzes. Responda APENAS com um array JSON puro, sem markdown, sem explicações."
          },
          {
            role: "user",
            content: `Gere um quiz de 3 perguntas para a aula: "${aulaNome}". Descrição: "${aulaDesc}". Retorne no formato: [{"id": 1, "text": "...", "options": ["a", "b", "c", "d"], "correct": 0}]`
          }
        ],
        temperature: 0.2, // Temperatura baixa para evitar que a IA invente formatos
        stream: false     // OBRIGATÓRIO ser false para o parse funcionar
      }),
    });

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "";

    // Limpeza de segurança caso a IA envie markdown ```json ... ```
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleanJson);

    console.log(questions)
    // Salva no banco
    const { error } = await supabase.from("quizzes").insert({
      aula_id: aulaId,
      questions: questions
    });

    if (error) throw error;

  } catch (err) {
    console.error(`[Quiz Error] Aula ${aulaId}:`, err);
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const inputClass = "w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/40 text-foreground text-sm font-body placeholder:text-muted-foreground/40 outline-none focus:border-primary/60 focus:bg-secondary/50 transition-all";
const inlineInputClass = "w-full px-3 py-1.5 rounded-sm bg-secondary/40 border border-border/50 text-foreground text-sm font-body outline-none focus:border-primary/60 transition-all";

const Field = ({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-2 text-xs font-accent font-bold text-muted-foreground uppercase tracking-widest">
      <Icon size={12} className="text-primary" />{label}
    </label>
    {children}
  </div>
);

const SelectField = ({ value, onChange, placeholder, children }: {
  value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode;
}) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
  </div>
);

const InlineSelect = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inlineInputClass} appearance-none cursor-pointer pr-8`}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastStack = ({ notifications, onRemove }: { notifications: Notification[]; onRemove: (id: number) => void }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
    <AnimatePresence>
      {notifications.map(n => (
        <motion.div key={n.id} initial={{ opacity: 0, x: 40, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40, scale: 0.9 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-sm border text-sm font-accent font-semibold shadow-xl backdrop-blur-sm
            ${n.type === "success" ? "bg-background/90 border-primary/40 text-primary" : "bg-background/90 border-rose-500/40 text-rose-400"}`}>
          {n.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {n.message}
          <button onClick={() => onRemove(n.id)} className="ml-1 opacity-40 hover:opacity-100 transition-opacity"><XCircle size={13} /></button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ─── Panel ────────────────────────────────────────────────────────────────────
const Panel = ({ title, icon: Icon, accent, children }: { title: string; icon: React.ElementType; accent: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="hologram-panel rounded-sm overflow-hidden">
    <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}30)` }} />
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  </motion.div>
);

// ─── TemaRow ──────────────────────────────────────────────────────────────────
const TemaRow = ({ tema, onSave, onDelete }: { tema: Tema; onSave: (t: Tema) => Promise<void>; onDelete: (id: string) => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tema);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); };
  const handleDelete = async () => { setDeleting(true); await onDelete(tema.id); };
  const handleCancel = () => { setDraft(tema); setEditing(false); setConfirmDelete(false); };

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border border-primary/30 bg-primary/5 rounded-sm p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Nome" className={inlineInputClass} />
            <InlineSelect value={draft.type} onChange={v => setDraft(p => ({ ...p, type: v }))} options={TEMA_TYPES} />
            <input value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Descrição" className={inlineInputClass} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-bold text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"><X size={12} /> Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-bold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Salvar
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group flex items-center justify-between gap-3 px-4 py-3 rounded-sm border border-border/20 bg-secondary/10 hover:bg-secondary/20 hover:border-border/40 transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary whitespace-nowrap">{tema.type}</span>
            <span className="text-sm font-display font-bold text-foreground truncate">{tema.name}</span>
            {tema.description && <span className="hidden sm:block text-xs font-body text-muted-foreground truncate">{tema.description}</span>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {confirmDelete ? (
              <>
                <span className="text-xs font-accent text-rose-400 mr-2">Confirmar?</span>
                <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50">{deleting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Sim</button>
                <button onClick={() => setConfirmDelete(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-foreground transition-all"><X size={11} /> Não</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"><Pencil size={11} /> Editar</button>
                <button onClick={() => setConfirmDelete(true)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-all"><Trash2 size={11} /></button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── CourseRow ────────────────────────────────────────────────────────────────
const CourseRow = ({ course, temas, onSave, onDelete }: { course: Course; temas: Tema[]; onSave: (c: Course) => Promise<void>; onDelete: (id: string) => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(course);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const temaName = temas.find(t => t.id === course.courses_id)?.name ?? "—";
  const diffColor = DIFF_COLOR[course.difficult] ?? "hsl(155 60% 45%)";

  const handleSave = async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); };
  const handleDelete = async () => { setDeleting(true); await onDelete(course.id); };
  const handleCancel = () => { setDraft(course); setEditing(false); setConfirmDelete(false); };

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border border-blue-500/30 bg-blue-500/5 rounded-sm p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Nome do curso" className={inlineInputClass} />
            <InlineSelect value={draft.difficult} onChange={v => setDraft(p => ({ ...p, difficult: v }))} options={DIFFICULTIES} />
            <div className="relative">
              <select value={draft.courses_id} onChange={e => setDraft(p => ({ ...p, courses_id: e.target.value }))} className={`${inlineInputClass} appearance-none cursor-pointer pr-8`}>
                {temas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-bold text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all"><X size={12} /> Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-bold transition-all disabled:opacity-50" style={{ background: "hsl(210 70% 60%)", color: "hsl(220 15% 8%)" }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Salvar
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group flex items-center justify-between gap-3 px-4 py-3 rounded-sm border border-border/20 bg-secondary/10 hover:bg-secondary/20 hover:border-border/40 transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-sm border whitespace-nowrap" style={{ color: diffColor, background: `${diffColor}15`, borderColor: `${diffColor}30` }}>{course.difficult}</span>
            <span className="text-sm font-display font-bold text-foreground truncate">{course.name}</span>
            <span className="hidden sm:flex items-center gap-1 text-xs font-body text-muted-foreground shrink-0"><ChevronRight size={11} className="text-primary/50" />{temaName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {confirmDelete ? (
              <>
                <span className="text-xs font-accent text-rose-400 mr-2">Confirmar?</span>
                <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50">{deleting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Sim</button>
                <button onClick={() => setConfirmDelete(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-foreground transition-all"><X size={11} /> Não</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 transition-all"><Pencil size={11} /> Editar</button>
                <button onClick={() => setConfirmDelete(true)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-accent font-bold border border-border/30 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-all"><Trash2 size={11} /></button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── AdminPage ────────────────────────────────────────────────────────────────
const AdminPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notify = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setNotifications(p => [...p, { id, type, message }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  };

  const [temas, setTemas] = useState<Tema[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeTab, setActiveTab] = useState<"temas" | "courses">("temas");

  const loadTemas = useCallback(async () => {
    const { data } = await supabase.from("temas").select("id,name,description,type").order("created_at", { ascending: true });
    setTemas(data || []); setLoadingTemas(false);
  }, []);

  const loadCourses = useCallback(async () => {
    const { data } = await supabase.from("courses").select("id,name,difficult,courses_id").order("name", { ascending: true });
    setCourses(data || []); setLoadingCourses(false);
  }, []);

  useEffect(() => { loadTemas(); loadCourses(); }, []);

  // ── Form tema ──
  const [temaForm, setTemaForm] = useState({ name: "", description: "", type: "" });
  const [savingTema, setSavingTema] = useState(false);

  const handleSaveTema = async () => {
    if (!temaForm.name.trim() || !temaForm.type) { notify("error", "Preencha nome e tipo."); return; }
    setSavingTema(true);
    const { error } = await supabase.from("temas").insert({ name: temaForm.name.trim(), description: temaForm.description.trim(), type: temaForm.type });
    setSavingTema(false);
    if (error) { notify("error", error.message); } else {
      notify("success", `Tema "${temaForm.name}" criado!`);
      setTemaForm({ name: "", description: "", type: "" }); loadTemas();
    }
  };

  // ── Form: criar curso ──
  const [courseForm, setCourseForm] = useState({ name: "", difficult: "", courses_id: "", descricao: "", playlist_id: "" });
  const [savingCourse, setSavingCourse] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Extrai o playlist_id da URL do YouTube automaticamente
  const extractPlaylistId = (raw: string): string => {
    try { return new URL(raw).searchParams.get("list") ?? raw.trim(); }
    catch { return raw.trim(); }
  };

  const handlePlaylistUrlChange = (raw: string) => {
    setCourseForm(p => ({ ...p, playlistUrl: raw, playlist_id: extractPlaylistId(raw) }));
  };

 const handleSaveCourse = async () => {
  if (!courseForm.name.trim() || !courseForm.difficult || !courseForm.courses_id) {
    notify("error", "Preencha nome, dificuldade e o tema do curso.");
    return;
  }
  setSavingCourse(true);

  // 1. Salva o curso
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      name: courseForm.name.trim(),
      descricao: courseForm.descricao.trim() || null,
      difficult: courseForm.difficult,
      courses_id: courseForm.courses_id,
      playlist_id: courseForm.playlist_id || null,
    })
    .select("id")
    .single();

  if (error || !course) {
    notify("error", "Erro ao salvar curso: " + error?.message);
    setSavingCourse(false);
    return;
  }

  // 2. Se tiver playlist, busca os vídeos e salva as aulas
  if (courseForm.playlist_id) {
    try {
      const videos = await getPlaylistVideos(courseForm.playlist_id);

      const aulas = videos.map((video, index) => ({
        course_id: course.id,
        nome: video.nome,
        url_video: video.url,
        descricao: video.descricao,
        thumb: video.thumb,
        position: index,
      }));

      const { error: aulasError } = await supabase
        .from("aulas")
        .insert(aulas);

      if (aulasError) {
        notify("error", "Curso criado, mas erro ao salvar aulas: " + aulasError.message);
        setSavingCourse(false);
        return;
      }

      notify("success", `Curso criado com ${videos.length} aulas!`);
    } catch (err: any) {
      notify("error", "Erro ao buscar playlist: " + err.message);
      setSavingCourse(false);
      return;
    }
    setSavingCourse(true); setSaveStatus("Salvando curso...");

  setCourseForm({ name: "", descricao: "", difficult: "", courses_id: "", playlist_id: "" });
  setSavingCourse(false);
};

    if (error || !course) { notify("error", "Erro ao salvar curso: " + error?.message); setSavingCourse(false); setSaveStatus(""); return; }

    if (!courseForm.playlist_id) {
      notify("success", `Curso "${courseForm.name}" criado!`);
      setCourseForm(EMPTY); setSavingCourse(false); setSaveStatus(""); loadCourses(); return;
    }

    setSaveStatus("Buscando vídeos da playlist...");
    let videos;
    try { videos = await getPlaylistVideos(courseForm.playlist_id); }
    catch (err: any) { notify("error", "Erro ao buscar playlist: " + err.message); setSavingCourse(false); setSaveStatus(""); return; }

    setSaveStatus(`Salvando ${videos.length} aulas...`);
    const { data: savedAulas, error: aulasError } = await supabase.from("aulas")
      .insert(videos.map((v, i) => ({ course_id: course.id, nome: v.nome, url_video: v.url, descricao: v.descricao, thumb: v.thumb, position: i })))
      .select("id, nome, descricao");

    if (aulasError || !savedAulas) { notify("error", "Curso criado, mas erro ao salvar aulas: " + aulasError?.message); setSavingCourse(false); setSaveStatus(""); return; }

    setSaveStatus(`Gerando quizzes com IA para ${savedAulas.length} aulas...`);
    await Promise.allSettled(savedAulas.map(a => generateQuizForAula(String(a.id), a.nome ?? "", a.descricao ?? "")));

    notify("success", `Curso criado com ${videos.length} aulas e quizzes gerados! 🎉`);
    setCourseForm(EMPTY); setSavingCourse(false); setSaveStatus(""); loadCourses();
  };

  const handleUpdateTema = async (t: Tema) => {
    const { error } = await supabase.from("temas").update({ name: t.name, description: t.description, type: t.type }).eq("id", t.id);
    if (error) { notify("error", error.message); } else { notify("success", "Tema atualizado!"); loadTemas(); }
  };
  const handleDeleteTema = async (id: string) => {
    const { error } = await supabase.from("temas").delete().eq("id", id);
    if (error) { notify("error", error.message); } else { notify("success", "Tema removido."); loadTemas(); }
  };
  const handleUpdateCourse = async (c: Course) => {
    const { error } = await supabase.from("courses").update({ name: c.name, difficult: c.difficult, courses_id: c.courses_id }).eq("id", c.id);
    if (error) { notify("error", error.message); } else { notify("success", "Curso atualizado!"); loadCourses(); }
  };
  const handleDeleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { notify("error", error.message); } else { notify("success", "Curso removido."); loadCourses(); }
  };

  const selectedTema = temas.find(t => t.id === courseForm.courses_id);

  return (
    <section className="relative min-h-screen bg-background scanline overflow-x-hidden">
      <Header />
      <div className="absolute inset-0 pointer-events-none opacity-50" style={gridBg} />

      <div className="relative z-10 pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20">
              <LayoutDashboard size={15} className="text-primary" />
            </div>
            <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest">Painel Administrativo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">Gerenciar Conteúdo</h1>
          <p className="text-muted-foreground font-body text-sm max-w-xl leading-relaxed">Crie, edite e remova temas e cursos da plataforma.</p>
        </motion.div>

        {/* Painéis de criação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Criar Tema */}
          <Panel title="Novo Tema" icon={Layers} accent="hsl(155 60% 45%)">
            <div className="flex flex-col gap-5">
              <Field label="Nome do Tema" icon={Tag}>
                <input type="text" value={temaForm.name} onChange={e => setTemaForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Inteligência Artificial" className={inputClass} />
              </Field>
              <Field label="Tipo / Categoria" icon={BookOpen}>
                <SelectField value={temaForm.type} onChange={v => setTemaForm(p => ({ ...p, type: v }))} placeholder="Selecione o tipo...">
                  {TEMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </SelectField>
              </Field>
              <Field label="Descrição" icon={AlignLeft}>
                <textarea value={temaForm.description} onChange={e => setTemaForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva sobre o que é esta trilha..." rows={3} className={`${inputClass} resize-none`} />
              </Field>
              <AnimatePresence>
                {temaForm.type && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-3 rounded-sm border border-border/30 bg-secondary/10 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-accent font-bold text-muted-foreground uppercase tracking-widest">Preview:</span>
                      <span className="text-xs font-accent font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">{temaForm.type}</span>
                      {temaForm.name && <span className="text-xs font-display font-bold text-foreground truncate">— {temaForm.name}</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={handleSaveTema} disabled={savingTema}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-sm bg-primary text-primary-foreground font-accent font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {savingTema ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><Plus size={15} /> Criar Tema</>}
              </button>
            </div>
          </Panel>

          {/* Criar Curso */}
          <Panel title="Novo Curso" icon={GraduationCap} accent="hsl(210 70% 60%)">
            <div className="flex flex-col gap-5">
              <Field label="Nome do Curso" icon={Tag}>
                <input type="text" value={courseForm.name} onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))} placeholder="ex: Python para Iniciantes" className={inputClass} />
              </Field>
              <Field label="Descrição" icon={AlignLeft}>
                <textarea value={courseForm.descricao} onChange={e => setCourseForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do curso..." rows={2} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="URL da Playlist YouTube" icon={Link}>
                <input type="text" value={courseForm.playlistUrl} onChange={e => handlePlaylistUrlChange(e.target.value)} placeholder="https://youtube.com/playlist?list=PL... ou ID direto" className={inputClass} />
                {courseForm.playlist_id && courseForm.playlist_id !== courseForm.playlistUrl && (
                  <p className="text-xs font-accent text-primary/70 mt-1">ID extraído: <span className="font-mono text-primary">{courseForm.playlist_id}</span></p>
                )}
              </Field>
              <Field label="Desvrição do Curso" icon={Tag}>
                <input type="text" value={courseForm.descricao} onChange={e => setCourseForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="ex: Python para Iniciantes" className={inputClass} />
              </Field>
              <Field label="URL do Curso" icon={Tag}>
                <input type="text" value={courseForm.playlist_id} onChange={e => setCourseForm(p => ({ ...p, playlist_id: e.target.value }))}
                  placeholder="ex: Python para Iniciantes" className={inputClass} />
              </Field>
              <Field label="Dificuldade" icon={Zap}>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => {
                    const active = courseForm.difficult === d;
                    return (
                      <button key={d} onClick={() => setCourseForm(p => ({ ...p, difficult: d }))}
                        className="py-2.5 px-3 rounded-sm border text-xs font-accent font-bold uppercase tracking-wide transition-all"
                        style={active ? { color: DIFF_COLOR[d], background: `${DIFF_COLOR[d]}15`, borderColor: `${DIFF_COLOR[d]}50` } : { color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary) / 0.2)", borderColor: "hsl(var(--border) / 0.3)" }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Vincular ao Tema" icon={Layers}>
                {loadingTemas ? (
                  <div className="flex items-center gap-2 py-3 px-4 rounded-sm border border-border/30 bg-secondary/20">
                    <Loader2 size={13} className="animate-spin text-muted-foreground" />
                    <span className="text-xs font-accent text-muted-foreground">Carregando temas...</span>
                  </div>
                ) : temas.length === 0 ? (
                  <div className="py-3 px-4 rounded-sm border border-dashed border-border/30 text-xs font-accent text-muted-foreground text-center">Nenhum tema cadastrado. Crie um tema primeiro.</div>
                ) : (
                  <SelectField value={courseForm.courses_id} onChange={v => setCourseForm(p => ({ ...p, courses_id: v }))} placeholder="Selecione o tema...">
                    {temas.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                  </SelectField>
                )}
              </Field>
              <AnimatePresence>
                {selectedTema && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-3 rounded-sm border border-border/30 bg-secondary/10">
                      <p className="text-[10px] font-accent font-bold text-muted-foreground uppercase tracking-widest mb-1">Tema vinculado</p>
                      <p className="text-sm font-display font-bold text-foreground">{selectedTema.name}</p>
                      {selectedTema.description && <p className="text-xs font-body text-muted-foreground line-clamp-1 mt-0.5">{selectedTema.description}</p>}
                      <span className="inline-block mt-1.5 text-[10px] font-accent font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">{selectedTema.type}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={handleSaveCourse} disabled={savingCourse || temas.length === 0}
                className="mt-2 w-full flex flex-col items-center justify-center gap-1 py-3 px-6 rounded-sm font-accent font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "hsl(210 70% 60%)", color: "hsl(220 15% 8%)" }}>
                {savingCourse ? (
                  <>
                    <div className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Processando...</div>
                    {saveStatus && <span className="text-[10px] font-normal normal-case opacity-80">{saveStatus}</span>}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus size={15} /> Criar Curso {courseForm.playlist_id ? "+ Aulas + Quizzes ✨" : ""}
                  </div>
                )}
              </button>
            </div>
          </Panel>
        </div>

        {/* Gerenciamento */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Gerenciar existentes</h2>

          <div className="flex gap-1 p-1 rounded-sm bg-secondary/20 border border-border/30 w-fit mb-6">
            {(["temas", "courses"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-accent font-bold transition-all ${activeTab === tab ? "bg-background border border-border/40 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "temas" ? <Layers size={14} /> : <GraduationCap size={14} />}
                {tab === "temas" ? "Temas" : "Cursos"}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? "bg-primary/10 text-primary" : "bg-secondary/40 text-muted-foreground"}`}>
                  {tab === "temas" ? temas.length : courses.length}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "temas" && (
              <motion.div key="temas-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingTemas ? (
                  <div className="flex items-center gap-2 py-10 justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /><span className="text-sm font-accent text-muted-foreground">Carregando...</span></div>
                ) : temas.length === 0 ? (
                  <div className="py-12 border border-dashed border-border/30 rounded-sm text-center"><p className="text-sm font-body text-muted-foreground">Nenhum tema cadastrado ainda.</p></div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {temas.map(tema => <TemaRow key={tema.id} tema={tema} onSave={handleUpdateTema} onDelete={handleDeleteTema} />)}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "courses" && (
              <motion.div key="courses-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingCourses ? (
                  <div className="flex items-center gap-2 py-10 justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /><span className="text-sm font-accent text-muted-foreground">Carregando...</span></div>
                ) : courses.length === 0 ? (
                  <div className="py-12 border border-dashed border-border/30 rounded-sm text-center"><p className="text-sm font-body text-muted-foreground">Nenhum curso cadastrado ainda.</p></div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {courses.map(course => <CourseRow key={course.id} course={course} temas={temas} onSave={handleUpdateCourse} onDelete={handleDeleteCourse} />)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ToastStack notifications={notifications} onRemove={id => setNotifications(p => p.filter(n => n.id !== id))} />
    </section>
  );
};

export default AdminPage;