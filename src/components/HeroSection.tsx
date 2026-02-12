import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";


const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center gradient-hero scanline overflow-hidden pt-24">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-accent mb-6">
              <Zap size={14} />
              Transição de Carreira para TI
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-glow">
              Sua carreira está{" "}
              <span className="text-primary">desaparecendo?</span>
            </h1>

            <p className=" text-xl sm:text-[25px] text-muted-foreground max-w-2xl mx-auto mb-4 font-body leading-relaxed">
              O mercado está mudando mais rápido do que nunca. Profissões inteiras estão sendo substituídas por IA e automação.
              A pergunta não é <em>se</em> vai acontecer — é <em>quando</em>.
            </p>

            <p className="text-base text-muted-foreground/70 max-w-xl mx-auto mb-10 font-body">
              A UpJobs te guia com um roadmap personalizado, análise DISC, cálculo de hora-valor e cursos selecionados para você conquistar sua nova carreira em TI.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-accent text-accent-foreground font-accent font-bold text-lg box-glow-accent hover:brightness-110 transition-all"
            >
              Conhecer o Futuro
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#roadmap"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-sm border border-primary/40 text-primary font-accent font-semibold hover:bg-primary/10 transition-colors"
            >
              Ver Roadmaps
            </a>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { value: "47%", label: "das profissões vão mudar até 2030" },
            { value: "85M", label: "empregos serão deslocados por IA" },
            { value: "2x", label: "mais vagas em TI do que profissionais" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 hologram-panel rounded-sm animate-hologram-flicker" style={{ animationDelay: `${i * 1.3}s` }}>
              <div className="text-2xl sm:text-3xl font-display font-bold text-primary text-glow">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-body mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
