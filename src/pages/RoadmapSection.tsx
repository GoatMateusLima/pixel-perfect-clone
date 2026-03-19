import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, ArrowLeft, Clock, BarChart2, MonitorPlay, ExternalLink } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import supabase from "../../utils/supabase.ts";
import { TemaCard } from "@/components/TemaCard"; 
//so para fazer commit

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type Course = { 
  id:string;
  course_id:string;
  name: string;
  difficult: string;
}

export type Tema = {
  id: string;
  name: string;
  description: string;
  type: string;
  courses: Course[]; // Sua função vai preencher este array
}

const gridBg = {
  backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.05) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

const difficultClass: Record<string, string> = {
  Iniciante: "text-primary",
  Intermediário: "text-accent",
  Avançado: "text-destructive",
};

const difficultBg: Record<string, string> = {
  Iniciante: "border-primary/30 bg-primary/5",
  Intermediário: "border-accent/30 bg-accent/5",
  Avançado: "border-destructive/30 bg-destructive/5",
};

// ─── Componente da Lista de Cursos da Área Selecionada ──────────────────────
const TemaCoursesView = ({ tema, onBack }: { tema: Tema; onBack: () => void }) => {
  // Verificação de segurança caso courses venha undefined do banco inicialmente
  const cursos = tema.courses || []; 

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-5xl mx-auto min-h-[70vh]"
    >
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-accent text-sm font-bold transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Voltar para todas as áreas
      </button>

      {/* Header da Área */}
      <div className="mb-10">
        <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest mb-3 block">
          Trilha de {tema.type}
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
          {tema.name}
        </h1>
        <p className="text-muted-foreground font-body text-base max-w-3xl leading-relaxed">
          {tema.description}
        </p>
      </div>

      {/* Lista de Cursos */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-foreground mb-6">
          Cursos disponíveis ({cursos.length})
        </h2>

        {cursos.length === 0 ? (
          <div className="p-10 border border-dashed border-border/50 rounded-lg bg-secondary/10 text-center">
             <p className="text-muted-foreground font-body">Nenhum curso cadastrado nesta área ainda.</p>
          </div>
        ) : (
          cursos.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold font-display text-foreground mb-3">
                  {course.name}
                </h3>
                
                {/* Badges do curso */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-flex items-center gap-1.5 border rounded-sm px-2.5 py-1 ${difficultBg[course.difficult] ?? "border-primary/30 bg-primary/5"}`}>
                    <BarChart2 size={12} className={difficultClass[course.difficult] ?? "text-primary"} />
                    <span className={`text-[11px] font-accent font-bold uppercase tracking-wide ${difficultClass[course.difficult] ?? "text-primary"}`}>
                      {course.difficult}
                    </span>
                  </div>

                  
                </div>
              </div>

            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const RoadmapSection = () => {
  const [temas, setTemas] = useState<Tema[]>([]);
   const [course, setCourse] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("Todos");
  const [selectedTema, setSelectedTema] = useState<Tema | null>(null);

  useEffect(() => {
    SyncTemas();
  }, []); 

  // Quando você fizer a função de puxar os cursos, ela deve popular o array 'courses' 
  // dentro de cada objeto 'Tema' retornado pelo banco.
async function SyncCourse(): Promise<void> { 
    setLoading(true);
    const { data, error } = await supabase
      .from('course')
      .select('course_id')
      
      
    if (error) { 
      console.error(error.message); 
      setLoading(false);
      return; 
    }

    setCourse(data || []);
    setLoading(false);
    }

  async function SyncTemas(): Promise<void> { 
    setLoading(true);
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .order('created_at', { ascending: true });
      
      
    if (error) { 
      console.error(error.message); 
      setLoading(false);
      return; 
    }

    setTemas(data || []);
    setLoading(false);
  }

  const categories = useMemo(() => {
    const uniqueTypes = Array.from(new Set(temas.map((t) => t.type).filter(Boolean)));
    return ["Todos", ...uniqueTypes];
  }, [temas]);

  const filteredTemas = useMemo(() => {
    return temas.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      const matchType = activeType === "Todos" || t.type === activeType;
      return matchSearch && matchType;
    });
  }, [temas, search, activeType]);

  return (
    <section className="relative min-h-screen bg-background scanline overflow-x-hidden">
      <Header />
      <div className="absolute inset-0 pointer-events-none opacity-50" style={gridBg} />
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {!selectedTema ? (
          <motion.div 
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto"
          >
            {/* Hero & Search */}
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
                  className="block w-full pl-12 pr-4 py-4 rounded-full bg-secondary/40 border border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-secondary/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-base sm:text-lg backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="mb-10">
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveType(category)}
                    className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-accent font-semibold transition-all duration-200 border ${
                      activeType === category
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        : "bg-secondary/30 text-muted-foreground border-border/40 hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-accent text-sm">Carregando áreas...</p>
                </div>
              ) : filteredTemas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border/50 rounded-2xl bg-secondary/10">
                  <Compass className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-muted-foreground max-w-md">
                    Não encontramos nenhuma área correspondente a "{search}". Tente usar outros termos ou limpe os filtros.
                  </p>
                  <button 
                    onClick={() => { setSearch(""); setActiveType("Todos"); }}
                    className="mt-6 px-6 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold transition-colors"
                  >
                    Limpar busca
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredTemas.map((tema, i) => (
                      <TemaCard 
                        key={tema.id} 
                        tema={tema} 
                        index={i}
                        onClick={() => setSelectedTema(tema)} 
                      />
                    ))}
                  </AnimatePresence>
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