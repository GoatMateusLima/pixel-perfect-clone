import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, ArrowLeft, MonitorPlay } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import supabase from "../../utils/supabase.ts";
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

      <div className="grid grid-cols-1 gap-4">
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
          setAiRecommendedIds(ids.map(id => String(id))); // Garante que são strings
        }
      } catch(e) {
        console.error("Erro AI Roadmap:", e);
      } finally {
        setIsAILoading(false);
      }
    }

    if (aiRecommendedIds.length === 0 && !isAILoading && !loading && temasBrutos.length > 0) {
      fetchAiRecommendations();
    }
  }, [temasBrutos, assessment, aiRecommendedIds, isAILoading, loading]);

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
      courses: allCourses.filter((c) => String(c.courses_id) === String(tema.id))
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
      // Usamos String() para comparar IDs de forma segura (número vs string)
      const validTemas = aiRecommendedIds
        .map(id => temasProntos.find(t => String(t.id) === String(id)))
        .filter(Boolean) as Tema[];
      
      if (validTemas.length > 0) {
        const remaining = [...temasProntos]
          .sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0))
          .filter(t => !aiRecommendedIds.includes(String(t.id)));
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
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">Recomendações</h2>
                  <span className="text-xs font-accent font-bold text-primary tracking-widest uppercase">
                    {isAILoading ? 'Analisando perfil (IA)...' : (aiRecommendedIds.length > 0 ? 'Para você (IA)' : 'Em Alta')}
                  </span>
                </div>
                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x" style={{ scrollbarWidth: "none" }}>
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
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <TemaCoursesView 
            key="courses-view" 
            tema={selectedTema} 
            onBack={() => setSelectedTema(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default RoadmapSection;