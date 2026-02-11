import { motion } from "framer-motion";
import { Star, Quote, BarChart3, Users, BookOpen, Award } from "lucide-react";

const stats = [
  { icon: Users, value: "2.500+", label: "Carreiras transformadas" },
  { icon: BarChart3, value: "87%", label: "Aumento médio de renda" },
  { icon: BookOpen, value: "150+", label: "Cursos selecionados" },
  { icon: Award, value: "35+", label: "Roadmaps disponíveis" },
];

const testimonials = [
  {
    name: "Marina S.",
    role: "Ex-Recepcionista → Dev Front-end",
    text: "Estava perdida, sem saber por onde começar. O roadmap da UpJobs me guiou passo a passo. Em 8 meses consegui meu primeiro emprego como desenvolvedora.",
  },
  {
    name: "Carlos M.",
    role: "Ex-Bancário → Analista de Dados",
    text: "O cálculo hora-valor abriu meus olhos. Percebi que estava perdendo dinheiro ficando onde estava. Hoje ganho 2x mais e trabalho remoto.",
  },
  {
    name: "Juliana R.",
    role: "Ex-Professora → UX Designer",
    text: "A análise DISC me mostrou que UX era minha cara. Nunca teria descoberto sozinha. A comunidade UpJobs foi essencial na minha transição.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="solucoes" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                className="hologram-panel rounded-sm p-6 text-center animate-hologram-flicker"
                style={{ animationDelay: `${i * 1.5}s` }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Icon size={24} className="text-primary mx-auto mb-2" />
                <div className="text-2xl font-display font-bold text-primary text-glow">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-body mt-1">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <motion.h2
          className="text-3xl sm:text-4xl font-display font-bold text-glow text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Vidas Transformadas
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="hologram-panel rounded-sm p-6 relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Quote size={20} className="text-primary/30 mb-3" />
              <p className="text-sm text-foreground/80 font-body mb-4 leading-relaxed">{t.text}</p>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={12} className="text-accent fill-accent" />
                ))}
              </div>
              <p className="font-accent font-bold text-sm text-foreground">{t.name}</p>
              <p className="text-xs text-primary font-body">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
