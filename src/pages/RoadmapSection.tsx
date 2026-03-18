  import { motion, AnimatePresence } from "framer-motion";
  import { ArrowLeft, ArrowRight, Clock, BarChart2, MonitorPlay } from "lucide-react";
  import { useEffect, useState } from "react";
  import Header from "@/components/Header";
  import supabase from "../../utils/supabase.ts";
import { Area } from "recharts";


 

  export type Course = { 
    name: string,
    platform: string,
    level: string,
    duration: string,
    link:string,
  }

   export type Tema = {
    id:string,
    name:string,
    description:string,
    type:string,
    courses:Course[]
  } 

// criar export de Courses e de area//

  const levelClass: Record<string, string> = {
    Iniciante: "text-primary",
    Intermediário: "text-accent",
    Avançado: "text-destructive",
  };

  const levelBg: Record<string, string> = {
    Iniciante: "border-primary/30 bg-primary/5",
    Intermediário: "border-accent/30 bg-accent/5",
    Avançado: "border-destructive/30 bg-destructive/5",
  };

  const gridBg = {
    backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.3) 1px, transparent 1px)`,
    backgroundSize: "60px 60px",
  };

  // ─── Course Detail Screen ───────────────────────────────────────────────────
  const CourseDetail = ({
    course,
    tema,
    onBack,
  }: {
    course: Course;
    tema: Tema;
    onBack: () => void;
  }) => (
    <motion.div
      key="course-detail"
      className="fixed inset-0 z-[60] gradient-hero scanline overflow-y-auto"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={gridBg} />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-24 max-w-3xl">
        {/* Breadcrumb / back */}
        <motion.button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-accent text-sm font-bold transition-colors mb-12"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft size={15} />
          <span className="text-muted-foreground/50">{tema.name}</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-primary truncate max-w-[200px]">{course.name}</span>
        </motion.button>

        {/* Hero */}
        <motion.div
          className="hologram-panel rounded-sm p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest mb-3 block">
            {tema.type}
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-glow mb-4">
            {course.name}
          </h1>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className={`inline-flex items-center gap-2 border rounded-sm px-3 py-1.5 ${levelBg[course.level] ?? "border-primary/30 bg-primary/5"}`}>
              <BarChart2 size={13} className={levelClass[course.level] ?? "text-primary"} />
              <span className={`text-xs font-accent font-bold uppercase tracking-wide ${levelClass[course.level] ?? "text-primary"}`}>
                {course.level}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 border border-muted/20 bg-muted/5 rounded-sm px-3 py-1.5">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-xs font-body text-muted-foreground">{course.duration}</span>
            </div>

            <div className="inline-flex items-center gap-2 border border-muted/20 bg-muted/5 rounded-sm px-3 py-1.5">
              <MonitorPlay size={13} className="text-muted-foreground" />
              <span className="text-xs font-body text-muted-foreground">{course.platform}</span>
            </div>
          </div>
        </motion.div>

        {/* Area context */}
        <motion.div
          className="hologram-panel rounded-sm p-6 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <p className="text-xs font-accent font-bold text-primary uppercase tracking-widest mb-2">
            Área
          </p>
          <p className="font-display font-bold text-base text-glow mb-1">{tema.name}</p>
          <p className="text-muted-foreground font-body text-sm leading-relaxed">{tema.description}</p>
        </motion.div>

        {/* CTA */}
        <motion.div
          onClick={() => { window.location.href = course.link; }}
          className="hologram-panel rounded-sm px-6 py-5 flex items-center justify-between group animate-hologram-flicker hover:brightness-125 transition-all w-full cursor-pointer"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="font-display font-bold text-base text-glow">
            Acessar curso em {course.platform}
          </span>
          <ArrowRight
            size={18}
            className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-4"
          />
        </motion.div>
      </div>
    </motion.div>
  );

  // ─── Main Component ──────────────────────────────────────────────────────────
const RoadmapSection = () => {
  const [selectedTema, setSelectedTema] = useState<Tema| null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [temas,setTema]=useState<Tema[]>([])

    useEffect(() => {
    // Certifique-se de que a variável 'user' está disponível neste escopo
  
      SyncTemas();
    
  }, []); 


  async function SyncTemas():Promise<void> { 
    const { data, error } = await supabase
      .from('temas')
      .select('*');
      
    if (error) { 
      alert(error.message); 
      return; 
    }

    setTema(data);
    // console.log(data);
    // order('created_at', { ascending: false })
  }

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };

  return (
    <section className="relative min-h-screen gradient-hero scanline overflow-hidden pt-24 pb-20">
      <Header />
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5" style={gridBg} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Título */}
        <motion.div
          className="max-w-3xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight mb-4 text-glow">
            Áreas do <span className="text-primary">futuro</span>
          </h1>
          <p className="text-muted-foreground font-body text-base sm:text-lg">
            Escolha uma área e veja os cursos para começar sua transição de carreira.
          </p>
        </motion.div>

        {/* Grid de cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {temas.map((tema, i) => (
            <motion.div
              key={tema.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              onClick={() => setSelectedTema(tema)}
              className="hologram-panel rounded-sm p-6 cursor-pointer group animate-hologram-flicker hover:brightness-125 transition-all"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest">
                  {tema.type}
                </span>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
              </div>
              <h2 className="font-display font-bold text-lg text-glow mb-2">{tema.name}</h2>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{tema.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Area overlay */}
      <AnimatePresence>
        {selectedTema && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 gradient-hero scanline overflow-y-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={gridBg} />

            <div className="relative z-10 container mx-auto px-4 pt-24 pb-24 max-w-5xl">
              {/* Voltar */}
              <motion.button
                onClick={() => setSelectedTema(null)}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-accent text-sm font-bold transition-colors mb-12"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <ArrowLeft size={15} /> Todas as áreas
              </motion.button>

              {/* Cabeçalho da área */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest">
                  {selectedTema.type}
                </span>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-glow mt-2 mb-3">
                  {selectedTema.name}
                </h1>
                <p className="text-muted-foreground font-body text-base max-w-xl">
                  {selectedTema.description}
                </p>
              </motion.div>

              {/* Cursos */}
              <div className="flex flex-col gap-4">
                {selectedTema.courses.map((course, i) => (
                  <motion.div
                    key={i}
                    onClick={() => handleCourseClick(course)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + 0.08 * i }}
                    className="hologram-panel rounded-sm px-6 py-5 flex items-center justify-between group animate-hologram-flicker hover:brightness-125 transition-all cursor-pointer"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-display font-bold text-base text-glow">
                        {course.name}
                      </span>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs font-body text-muted-foreground">{course.platform}</span>
                        <span className="text-muted-foreground opacity-30">·</span>
                        <span className={`text-xs font-accent font-bold uppercase tracking-wide ${levelClass[course.level] ?? "text-primary"}`}>
                          {course.level}
                        </span>
                        <span className="text-muted-foreground opacity-30">·</span>
                        <span className="text-xs font-body text-muted-foreground">{course.duration}</span>
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-4"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Course detail layer (inside area overlay) */}
            <AnimatePresence>
              {selectedCourse && (
                <CourseDetail
                  course={selectedCourse}
                  tema={selectedTema}
                  onBack={handleBackToCourses}
                />
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default RoadmapSection;