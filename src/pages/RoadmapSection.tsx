import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, ArrowLeft, MonitorPlay } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import supabase from "../../utils/supabase.ts";
import { TemaCard } from "@/components/TemaCard"; 
import { CourseCard } from "@/components/CourseCard";

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type Course = { 
  id: string;
  courses_id: string; // Verifique se no banco é courses_id ou tema_id
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
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
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
  const [temasBrutos, setTemasBrutos] = useState<Tema[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("Todos");
  const [selectedTema, setSelectedTema] = useState<Tema | null>(null);

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

  // Une Temas + Cursos em uma lista pronta para uso
  const temasProntos = useMemo(() => {
    return temasBrutos.map((tema) => ({
      ...tema,
      courses: allCourses.filter((c) => c.courses_id === tema.id)
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

  return (
    <section className="relative min-h-screen bg-background scanline overflow-x-hidden">
      <Header />
      <div className="absolute inset-0 pointer-events-none opacity-50" style={gridBg} />
      
      <AnimatePresence mode="wait">
        {!selectedTema ? (
          <motion.div 
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
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