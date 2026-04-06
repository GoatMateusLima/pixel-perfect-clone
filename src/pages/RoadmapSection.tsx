import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, ArrowLeft, MonitorPlay, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import Header from "@/components/Header";
import { MainLandmark } from "@/components/MainLandmark";
import supabase from "../../utils/supabase";
import { TemaCard } from "@/components/TemaCard"; 
import { CourseCard } from "@/components/CourseCard";
import { useAuth } from "@/contexts/AuthContext";
import { getRecommendedTemasIA } from "../../utils/APIrecomendacao";


// ─── Tipos ──────────────────────────────────────────────────────────────────
export type Course = { 
  id: string;
  courses_id: string;
  name: string;
  difficult: string;
}

export type Tema = {
  id: string;
  name: string;
  description: string;
  type: string;
  courses: Course[];
}

const gridBg = {
  backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.05) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

// ─── Componente da Lista de Cursos (View Interna) ──────────────────────
const TemaCoursesView = ({ tema, onBack }: { tema: Tema; onBack: () => void }) => {
  const cursos = tema.courses || []; 
  const totalCursos = cursos.length;

  return (
    <motion.div 
      initial={{ opacity: 1, x: 12 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -12 }} 
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-5xl mx-auto min-h-[70vh]"
    >
      <button onClick={onBack} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-accent text-sm font-bold transition-colors mb-8">
        <ArrowLeft size={16} /> Voltar para todas as áreas
      </button>

      <div className="mb-10">
        <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest mb-3 block">
          Trilha de {tema.type}
        </span>
        
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
          {tema.name}
        </h1>

        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10">
            <MonitorPlay size={14} className="text-primary" />
            <span className="text-xs font-accent font-bold text-primary tracking-wide">
              {totalCursos} {totalCursos === 1 ? 'Curso Disponível' : 'Cursos Disponíveis'}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground font-body text-base max-w-3xl leading-relaxed">
          {tema.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {cursos.length > 0 ? (
          cursos.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onClick={(c) => console.log("Abrindo curso:", c.name)} 
            />
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-border/30 rounded-lg">
            <p className="text-muted-foreground">Nenhum curso vinculado a esta trilha ainda.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Componente Principal ───────────────────────────────────────────────────
const RoadmapSection = () => {
  const { assessment, user } = useAuth();
  const [temasBrutos, setTemasBrutos] = useState<Tema[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("Todos");
  const [selectedTema, setSelectedTema] = useState<Tema | null>(null);
  
  const [aiRecommendedIds, setAiRecommendedIds] = useState<string[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const aiAttemptedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Estados para o formulário de sugestão
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    temaNome: "",
    cursoNome: "",
    playlistUrl: "",
    cursoDesc: "",
    temaDesc: "",
    dificuldade: "Iniciante",
    responsavelNome: "",
    responsavelEmail: ""
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('course_requests')
        .insert({
          tema_nome: formData.temaNome,
          curso_nome: formData.cursoNome,
          playlist_url: formData.playlistUrl,
          curso_descricao: formData.cursoDesc,
          tema_descricao: formData.temaDesc,
          dificuldade: formData.dificuldade,
          responsavel_nome: formData.responsavelNome,
          responsavel_email: formData.responsavelEmail,
          user_id: user?.id
        });

      if (error) throw error;

      alert("Sugestão enviada com sucesso! Nossa equipe entrará em contato.");
      setIsSubmitModalOpen(false);
      setFormData({
        temaNome: "",
        cursoNome: "",
        playlistUrl: "",
        cursoDesc: "",
        temaDesc: "",
        dificuldade: "Iniciante",
        responsavelNome: "",
        responsavelEmail: ""
      });
    } catch (err: any) {
      console.error("Erro ao enviar sugestão:", err.message);
      alert("Houve um erro ao enviar. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    async function fetchAiRecommendations() {
      let interests = assessment?.areasInteresse || [];
      let disc = assessment?.discProfile;

      if (!assessment?.completed && interests.length === 0) {
        // Se não tiver no contexto, tenta buscar do banco uma última vez
        const { data: prof } = await supabase.from("profiles").select("areas_interesse, disc_profile").eq("user_id", user?.id || "").maybeSingle();
        if (prof?.areas_interesse) {
             interests = prof.areas_interesse as string[];
        }
        if (prof?.disc_profile) {
             disc = prof.disc_profile as "D" | "I" | "S" | "C";
        }
        
        if (interests.length === 0 && !disc) {
             return; // Nem interesses nem DISC, nada a recomendar por agora
        }
      }
      
      if (temasBrutos.length === 0) return;

      setIsAILoading(true);
      try {
        // Enriquecemos o prompt enviando interesses E perfil DISC se disponível
        const profileContext = disc ? [ ...interests, `Perfil DISC: ${disc}` ] : interests;
        
        const ids = await getRecommendedTemasIA(profileContext, temasBrutos);
        if (ids.length > 0) {
          // Deduplicamos os IDs e garantimos que são strings para evitar repetições na UI
          const uniqueIds = Array.from(new Set(ids.map(id => String(id))));
          setAiRecommendedIds(uniqueIds);
        }
      } catch(e) {
        console.error("Erro AI Roadmap:", e);
      } finally {
        setIsAILoading(false);
      }
    }

    if (!aiAttemptedRef.current && !isAILoading && !loading && temasBrutos.length > 0) {
      aiAttemptedRef.current = true;
      fetchAiRecommendations();
    }
  }, [temasBrutos, assessment, isAILoading, loading]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([SyncTemas(), SyncCourse()]);
      setLoading(false);
    }
    loadData();
  }, []);

  async function SyncCourse() { 
    const { data, error } = await supabase.from('courses').select('*');
    if (!error) setAllCourses(data || []);
  }

  async function SyncTemas() { 
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setTemasBrutos(data || []);
  }

  const temasProntos = useMemo(() => {
    return temasBrutos.map((tema) => ({
      ...tema,
      courses: allCourses
        .filter((c) => String(c.courses_id) === String(tema.id))
        .filter((c, index, self) => self.findIndex(s => s.id === c.id) === index) // Garantia anti-duplicação
    }));
  }, [temasBrutos, allCourses]);

  const categories = useMemo(() => {
    const uniqueTypes = Array.from(new Set(temasProntos.map((t) => t.type).filter(Boolean)));
    return ["Todos", ...uniqueTypes];
  }, [temasProntos]);

  const filteredTemas = useMemo(() => {
    return temasProntos.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchType = activeType === "Todos" || t.type === activeType;
      return matchSearch && matchType;
    });
  }, [temasProntos, search, activeType]);

  const recommendedTemas = useMemo(() => {
    if (aiRecommendedIds.length > 0) {
      // Remove IDs duplicados que a IA possa ter retornado por engano
      const uniqueAIIds = Array.from(new Set(aiRecommendedIds));
      
      const validTemas = uniqueAIIds
        .map(id => temasProntos.find(t => String(t.id) === String(id)))
        .filter(Boolean) as Tema[];
      
      if (validTemas.length > 0) {
        const remaining = [...temasProntos]
          .sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0))
          .filter(t => !uniqueAIIds.includes(String(t.id)));
        return [...validTemas, ...remaining].slice(0, 5);
      }
    }
    // Fallback: temas com mais cursos
    return [...temasProntos]
      .sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0))
      .slice(0, 5);
  }, [temasProntos, aiRecommendedIds]);

  return (
    <section className="relative min-h-screen bg-background scanline overflow-x-hidden">
      <Header />
      <MainLandmark className="relative z-10 block min-h-0">
        <div className="absolute inset-0 pointer-events-none opacity-50" style={gridBg} />

      <AnimatePresence mode="wait">
        {!selectedTema ? (
          <motion.div 
            key="grid-view"
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto"
          >
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                O que você quer <span className="text-primary text-glow">aprender</span> hoje?
              </h1>
              <div className="relative max-w-2xl mx-auto group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Busque por área, tecnologia ou curso..."
                  className="block w-full pl-12 pr-4 py-4 rounded-full bg-secondary/40 border border-border/50 text-foreground outline-none backdrop-blur-sm focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {!loading && recommendedTemas.length > 0 && search === "" && activeType === "Todos" && (
              <div className="mb-12 relative group/section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">Recomendações</h2>
                  <span className="text-xs font-accent font-bold text-primary tracking-widest uppercase">
                    {isAILoading ? 'Consultando ORION...' : (aiRecommendedIds.length > 0 ? 'Sugestões do ORION' : 'Em Alta')}
                  </span>
                </div>
                
                <div className="relative">
                  {/* Scroll Buttons */}
                  <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-2 rounded-full bg-secondary/80 border border-border/50 text-foreground opacity-0 group-hover/section:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground backdrop-blur-sm hidden md:flex items-center justify-center"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-2 rounded-full bg-secondary/80 border border-border/50 text-foreground opacity-0 group-hover/section:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground backdrop-blur-sm hidden md:flex items-center justify-center"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div 
                    ref={scrollContainerRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x scroll-smooth" 
                    style={{ scrollbarWidth: "none" }}
                  >
                    {recommendedTemas.map((tema, i) => (
                      <div key={tema.id} className="snap-start shrink-0 w-[280px] md:w-[320px]">
                        <TemaCard 
                          tema={tema} 
                          index={i}
                          onClick={() => setSelectedTema(tema)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-10">
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveType(category)}
                    className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-accent font-semibold transition-all border ${
                      activeType === category
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-border/40 hover:bg-secondary/60"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                </div>
              ) : filteredTemas.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl bg-secondary/10">
                  <Compass className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Nenhum resultado encontrado</h3>
                  <button onClick={() => { setSearch(""); setActiveType("Todos"); }} className="mt-4 text-primary underline">Limpar busca</button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemas.map((tema, i) => (
                    <TemaCard 
                      key={tema.id} 
                      tema={tema} 
                      index={i}
                      onClick={() => setSelectedTema(tema)} 
                    />
                  ))}

                  {/* Card de Sugestão - Sempre ao final da grid filtrada */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="group relative h-full min-h-[320px] rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/10 hover:border-primary transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                        <Search className="text-primary w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-display font-bold text-foreground mb-4">Quer ver seu curso aqui?</h3>
                      <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-[240px] mb-8">
                        Colabore com a plataforma e ajude a expandir nossa base de conhecimento.
                      </p>
                      <button className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-accent font-bold text-xs shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                        Enviar Sugestão
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Popup / Modal de Sugestão */}
            {isSubmitModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative z-10 w-full max-w-2xl bg-secondary/90 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">Envie seu conteúdo</h2>
                    <p className="text-sm text-muted-foreground">Preencha os detalhes do tema e curso que deseja sugerir.</p>
                  </div>

                  <form onSubmit={handleSubmitRequest} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Nome do Tema</label>
                        <input
                          required
                          value={formData.temaNome}
                          onChange={e => setFormData({...formData, temaNome: e.target.value})}
                          placeholder="Ex: Desenvolvimento Web"
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Nome do Curso</label>
                        <input
                          required
                          value={formData.cursoNome}
                          onChange={e => setFormData({...formData, cursoNome: e.target.value})}
                          placeholder="Ex: React para Iniciantes"
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Link da Playlist do YouTube</label>
                      <input
                        required
                        type="url"
                        value={formData.playlistUrl}
                        onChange={e => setFormData({...formData, playlistUrl: e.target.value})}
                        placeholder="https://youtube.com/playlist?list=..."
                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Descrição do Curso</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.cursoDesc}
                          onChange={e => setFormData({...formData, cursoDesc: e.target.value})}
                          placeholder="O que os alunos aprenderão?"
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Descrição do Tema</label>
                        <textarea
                          required
                          rows={3}
                          value={formData.temaDesc}
                          onChange={e => setFormData({...formData, temaDesc: e.target.value})}
                          placeholder="Fale um pouco sobre a área..."
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Dificuldade</label>
                        <select
                          value={formData.dificuldade}
                          onChange={e => setFormData({...formData, dificuldade: e.target.value})}
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all appearance-none"
                        >
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Nome do Responsável</label>
                        <input
                          required
                          value={formData.responsavelNome}
                          onChange={e => setFormData({...formData, responsavelNome: e.target.value})}
                          placeholder="Seu nome completo"
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-accent font-bold text-primary tracking-widest uppercase">Email do Responsável</label>
                      <input
                        required
                        type="email"
                        value={formData.responsavelEmail}
                        onChange={e => setFormData({...formData, responsavelEmail: e.target.value})}
                        placeholder="seu@contato.com"
                        className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="px-6 py-3 rounded-xl hover:bg-white/5 text-sm font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : "Enviar Sugestão"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <TemaCoursesView 
            key="courses-view" 
            tema={selectedTema} 
            onBack={() => setSelectedTema(null)} 
          />
        )}
      </AnimatePresence>
      </MainLandmark>
    </section>
  );
};

export default RoadmapSection;