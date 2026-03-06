import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, BarChart2, MonitorPlay } from "lucide-react";
import { useState } from "react";

const areas = [
  {
    id: "ia-negocios",
    title: "IA & Negócios",
    tag: "Alta demanda",
    desc: "Aplique IA para transformar processos e criar vantagem competitiva",
    courses: [
      { name: "AI Product Management", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Business Intelligence com IA", platform: "Alura", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Prompt Engineering for Business", platform: "DeepLearning.AI", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "AI Strategy & Leadership", platform: "MIT xPRO", level: "Avançado", duration: "4 meses", link: "/courses" },
      { name: "Automação com n8n e IA", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "/courses" },
    ],
  },
  {
    id: "saude-tech",
    title: "Saúde & Tech",
    tag: "Crescimento acelerado",
    desc: "Healthtech, telemedicina, diagnóstico por IA e biotecnologia",
    courses: [
      { name: "Digital Health Foundations", platform: "edX", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Gestão em Saúde Digital", platform: "FGV Online", level: "Intermediário", duration: "4 meses", link: "/courses" },
      { name: "Bioinformática Aplicada", platform: "Coursera", level: "Avançado", duration: "5 meses", link: "/courses" },
      { name: "UX para Saúde", platform: "Interaction Design", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Wearables & IoT na Saúde", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "/courses" },
    ],
  },
  {
    id: "sustentabilidade",
    title: "Sustentabilidade",
    tag: "Futuro obrigatório",
    desc: "ESG, economia circular, energia limpa e impacto ambiental",
    courses: [
      { name: "ESG na Prática", platform: "FGV Online", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Gestão de Carbono", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Energia Solar e Renovável", platform: "Senai", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Economia Circular", platform: "edX", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Green Finance", platform: "CFA Institute", level: "Avançado", duration: "6 meses", link: "/courses" },
    ],
  },
  {
    id: "dados-analitica",
    title: "Dados & Analítica",
    tag: "Alta demanda",
    desc: "Data science, analytics, visualização e decisão baseada em dados",
    courses: [
      { name: "Python para Análise de Dados", platform: "Alura", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "SQL do Zero ao Avançado", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Power BI Completo", platform: "Data Science Academy", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Machine Learning Aplicado", platform: "Fast.ai", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Engenharia de Dados", platform: "DataCamp", level: "Avançado", duration: "5 meses", link: "/courses" },
    ],
  },
  {
    id: "criatividade-ia",
    title: "Criatividade & IA",
    tag: "Emergente",
    desc: "Design generativo, conteúdo com IA, produção audiovisual e novas mídias",
    courses: [
      { name: "Midjourney & IA para Design", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Vídeo com IA: Sora & RunwayML", platform: "Skillshare", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Copywriting com IA", platform: "Hotmart", level: "Iniciante", duration: "3 semanas", link: "/courses" },
      { name: "Produção Musical com IA", platform: "Berklee Online", level: "Intermediário", duration: "2 meses", link: "/courses" },
      { name: "Brand Design Generativo", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "/courses" },
    ],
  },
  {
    id: "ciberseguranca",
    title: "Cibersegurança",
    tag: "Déficit global",
    desc: "Proteção de dados, ethical hacking, compliance e segurança em nuvem",
    courses: [
      { name: "CompTIA Security+", platform: "CompTIA", level: "Iniciante", duration: "3 meses", link: "/courses" },
      { name: "Ethical Hacking Completo", platform: "Udemy", level: "Intermediário", duration: "4 meses", link: "/courses" },
      { name: "LGPD & Privacidade de Dados", platform: "FGV Online", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Cloud Security AWS", platform: "AWS Training", level: "Intermediário", duration: "2 meses", link: "/courses" },
      { name: "SOC Analyst", platform: "TryHackMe", level: "Avançado", duration: "5 meses", link: "/courses" },
    ],
  },
  {
    id: "educacao-futuro",
    title: "Educação do Futuro",
    tag: "Transformação",
    desc: "Edtech, aprendizagem adaptativa, design instrucional e treinamento",
    courses: [
      { name: "Design Instrucional", platform: "Articulate", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "EAD e Plataformas LMS", platform: "Alura", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Gamificação na Educação", platform: "Coursera", level: "Intermediário", duration: "2 meses", link: "/courses" },
      { name: "IA na Sala de Aula", platform: "Google for Education", level: "Iniciante", duration: "3 semanas", link: "/courses" },
      { name: "Corporate Learning & Dev", platform: "ATD", level: "Avançado", duration: "4 meses", link: "/courses" },
    ],
  },
  {
    id: "fintech",
    title: "Fintech & Web3",
    tag: "Alta demanda",
    desc: "Open finance, blockchain, pagamentos digitais e DeFi",
    courses: [
      { name: "Open Banking & PIX", platform: "Febraban", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Blockchain do Zero", platform: "Udemy", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "DeFi e Smart Contracts", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Análise de Criptoativos", platform: "CoinDesk Academy", level: "Intermediário", duration: "2 meses", link: "/courses" },
      { name: "Regulação Fintech (BACEN)", platform: "FGV Online", level: "Avançado", duration: "4 meses", link: "/courses" },
    ],
  },
  {
    id: "bem-estar",
    title: "Bem-estar & Performance",
    tag: "Emergente",
    desc: "Saúde mental corporativa, coaching, neurociência e longevidade",
    courses: [
      { name: "Coaching de Alta Performance", platform: "IBC", level: "Iniciante", duration: "3 meses", link: "/courses" },
      { name: "Neurociência Aplicada", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "/courses" },
      { name: "Mindfulness e Liderança", platform: "Search Inside Yourself", level: "Iniciante", duration: "1 mês", link: "/courses" },
      { name: "Saúde Mental no Trabalho", platform: "FGV Online", level: "Iniciante", duration: "2 meses", link: "/courses" },
      { name: "Longevidade & Biohacking", platform: "Huberman Lab Course", level: "Intermediário", duration: "2 meses", link: "/courses" },
    ],
  },
];

type Course = (typeof areas)[0]["courses"][0];
type Area = (typeof areas)[0];

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
  area,
  onBack,
}: {
  course: Course;
  area: Area;
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
        <span className="text-muted-foreground/50">{area.title}</span>
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
          {area.tag}
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
        <p className="font-display font-bold text-base text-glow mb-1">{area.title}</p>
        <p className="text-muted-foreground font-body text-sm leading-relaxed">{area.desc}</p>
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
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };

  return (
    <section className="relative min-h-screen gradient-hero scanline overflow-hidden pt-24 pb-20">
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
          {areas.map((area, i) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              onClick={() => setSelectedArea(area)}
              className="hologram-panel rounded-sm p-6 cursor-pointer group animate-hologram-flicker hover:brightness-125 transition-all"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-accent font-bold text-primary uppercase tracking-widest">
                  {area.tag}
                </span>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
              </div>
              <h2 className="font-display font-bold text-lg text-glow mb-2">{area.title}</h2>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{area.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Area overlay */}
      <AnimatePresence>
        {selectedArea && (
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
                onClick={() => setSelectedArea(null)}
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
                  {selectedArea.tag}
                </span>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-glow mt-2 mb-3">
                  {selectedArea.title}
                </h1>
                <p className="text-muted-foreground font-body text-base max-w-xl">
                  {selectedArea.desc}
                </p>
              </motion.div>

              {/* Cursos — agora sem <a>, usando onClick */}
              <div className="flex flex-col gap-4">
                {selectedArea.courses.map((course, i) => (
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
                  area={selectedArea}
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