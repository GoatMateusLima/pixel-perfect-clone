import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 scanline" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left - Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hologram-panel rounded-sm p-8 animate-hologram-flicker"
          >
            <div className="inline-flex items-center gap-2 text-primary font-accent text-sm font-bold mb-4">
              <Sparkles size={16} />
              PLANO UPJOBS
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">100% Gratuito</h3>
            <p className="text-muted-foreground font-body text-sm mb-6">Tudo que você precisa para começar sua transição de carreira.</p>

            <ul className="space-y-3 mb-6">
              {[
                "Análise DISC completa",
                "Cálculo Hora-Valor (Método Marcius)",
                "Roadmap personalizado e gamificado",
                "Cursos gratuitos selecionados",
                "Certificação UpJobs",
                "Recomendações finais",
                "Acesso à comunidade",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-body text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right - CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-glow mb-4">
              Pronto para{" "}
              <span className="text-accent text-glow-accent">conhecer o futuro</span>?
            </h2>
            <p className="text-muted-foreground font-body mb-8 leading-relaxed">
              Pare de perder tempo em uma carreira sem futuro. Descubra seu caminho ideal em minutos.
            </p>

            <motion.a
              href="#"
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-sm bg-accent text-accent-foreground font-display font-bold text-lg box-glow-accent animate-pulse-glow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Conhecer o Futuro
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <p className="text-xs text-muted-foreground mt-4 font-body">
              Sem cartão de crédito • 100% gratuito • Comece agora
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
