import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

const areas = [
  {
    id: "ia-negocios",
    title: "IA & Negócios",
    tag: "Alta demanda",
    desc: "Aplique IA para transformar processos e criar vantagem competitiva",
    courses: [
      { name: "AI Product Management", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Business Intelligence com IA", platform: "Alura", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Prompt Engineering for Business", platform: "DeepLearning.AI", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "AI Strategy & Leadership", platform: "MIT xPRO", level: "Avançado", duration: "4 meses", link: "#" },
      { name: "Automação com n8n e IA", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "#" },
    ],
  },
  {
    id: "saude-tech",
    title: "Saúde & Tech",
    tag: "Crescimento acelerado",
    desc: "Healthtech, telemedicina, diagnóstico por IA e biotecnologia",
    courses: [
      { name: "Digital Health Foundations", platform: "edX", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Gestão em Saúde Digital", platform: "FGV Online", level: "Intermediário", duration: "4 meses", link: "#" },
      { name: "Bioinformática Aplicada", platform: "Coursera", level: "Avançado", duration: "5 meses", link: "#" },
      { name: "UX para Saúde", platform: "Interaction Design", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Wearables & IoT na Saúde", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "#" },
    ],
  },
  {
    id: "sustentabilidade",
    title: "Sustentabilidade",
    tag: "Futuro obrigatório",
    desc: "ESG, economia circular, energia limpa e impacto ambiental",
    courses: [
      { name: "ESG na Prática", platform: "FGV Online", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Gestão de Carbono", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Energia Solar e Renovável", platform: "Senai", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Economia Circular", platform: "edX", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Green Finance", platform: "CFA Institute", level: "Avançado", duration: "6 meses", link: "#" },
    ],
  },
  {
    id: "dados-analitica",
    title: "Dados & Analítica",
    tag: "Alta demanda",
    desc: "Data science, analytics, visualização e decisão baseada em dados",
    courses: [
      { name: "Python para Análise de Dados", platform: "Alura", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "SQL do Zero ao Avançado", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Power BI Completo", platform: "Data Science Academy", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Machine Learning Aplicado", platform: "Fast.ai", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Engenharia de Dados", platform: "DataCamp", level: "Avançado", duration: "5 meses", link: "#" },
    ],
  },
  {
    id: "criatividade-ia",
    title: "Criatividade & IA",
    tag: "Emergente",
    desc: "Design generativo, conteúdo com IA, produção audiovisual e novas mídias",
    courses: [
      { name: "Midjourney & IA para Design", platform: "Udemy", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Vídeo com IA: Sora & RunwayML", platform: "Skillshare", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Copywriting com IA", platform: "Hotmart", level: "Iniciante", duration: "3 semanas", link: "#" },
      { name: "Produção Musical com IA", platform: "Berklee Online", level: "Intermediário", duration: "2 meses", link: "#" },
      { name: "Brand Design Generativo", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "#" },
    ],
  },
  {
    id: "ciberseguranca",
    title: "Cibersegurança",
    tag: "Déficit global",
    desc: "Proteção de dados, ethical hacking, compliance e segurança em nuvem",
    courses: [
      { name: "CompTIA Security+", platform: "CompTIA", level: "Iniciante", duration: "3 meses", link: "#" },
      { name: "Ethical Hacking Completo", platform: "Udemy", level: "Intermediário", duration: "4 meses", link: "#" },
      { name: "LGPD & Privacidade de Dados", platform: "FGV Online", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Cloud Security AWS", platform: "AWS Training", level: "Intermediário", duration: "2 meses", link: "#" },
      { name: "SOC Analyst", platform: "TryHackMe", level: "Avançado", duration: "5 meses", link: "#" },
    ],
  },
  {
    id: "educacao-futuro",
    title: "Educação do Futuro",
    tag: "Transformação",
    desc: "Edtech, aprendizagem adaptativa, design instrucional e treinamento",
    courses: [
      { name: "Design Instrucional", platform: "Articulate", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "EAD e Plataformas LMS", platform: "Alura", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Gamificação na Educação", platform: "Coursera", level: "Intermediário", duration: "2 meses", link: "#" },
      { name: "IA na Sala de Aula", platform: "Google for Education", level: "Iniciante", duration: "3 semanas", link: "#" },
      { name: "Corporate Learning & Dev", platform: "ATD", level: "Avançado", duration: "4 meses", link: "#" },
    ],
  },
  {
    id: "fintech",
    title: "Fintech & Web3",
    tag: "Alta demanda",
    desc: "Open finance, blockchain, pagamentos digitais e DeFi",
    courses: [
      { name: "Open Banking & PIX", platform: "Febraban", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Blockchain do Zero", platform: "Udemy", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "DeFi e Smart Contracts", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Análise de Criptoativos", platform: "CoinDesk Academy", level: "Intermediário", duration: "2 meses", link: "#" },
      { name: "Regulação Fintech (BACEN)", platform: "FGV Online", level: "Avançado", duration: "4 meses", link: "#" },
    ],
  },
  {
    id: "bem-estar",
    title: "Bem-estar & Performance",
    tag: "Emergente",
    desc: "Saúde mental corporativa, coaching, neurociência e longevidade",
    courses: [
      { name: "Coaching de Alta Performance", platform: "IBC", level: "Iniciante", duration: "3 meses", link: "#" },
      { name: "Neurociência Aplicada", platform: "Coursera", level: "Intermediário", duration: "3 meses", link: "#" },
      { name: "Mindfulness e Liderança", platform: "Search Inside Yourself", level: "Iniciante", duration: "1 mês", link: "#" },
      { name: "Saúde Mental no Trabalho", platform: "FGV Online", level: "Iniciante", duration: "2 meses", link: "#" },
      { name: "Longevidade & Biohacking", platform: "Huberman Lab Course", level: "Intermediário", duration: "2 meses", link: "#" },
    ],
  },
];

const levelClass: Record<string, string> = {
  Iniciante: "text-primary",
  Intermediário: "text-accent",
  Avançado: "text-destructive",
};

const gridBg = {
  backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.3) 1px, transparent 1px)`,
  backgroundSize: "60px 60px",
};

const RoadmapSection = () => {
  const [selectedArea, setSelectedArea] = useState<(typeof areas)[0] | null>(null);

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

      {/* Fullscreen overlay */}
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
            {/* Grid background no overlay */}
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

              {/* Cursos */}
              <div className="flex flex-col gap-4">
                {selectedArea.courses.map((course, i) => (
                  <motion.a
                    key={i}
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + 0.08 * i }}
                    className="hologram-panel rounded-sm px-6 py-5 flex items-center justify-between group animate-hologram-flicker hover:brightness-125 transition-all"
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
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default RoadmapSection;