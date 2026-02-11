import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Lock, MapPin } from "lucide-react";

const steps = [
  { label: "Análise DISC", done: true },
  { label: "Hora-Valor", done: true },
  { label: "Roadmap Personalizado", done: true },
  { label: "Cursos Selecionados", done: false },
  { label: "Certificação UpJobs", done: false },
  { label: "Recomendações Finais", done: false },
];

const RoadmapPath = () => {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <svg ref={ref} viewBox="0 0 300 600" fill="none" className="w-full h-auto">
        {/* Curved path */}
        <motion.path
          d="M 80 30 C 80 30, 220 80, 220 120 C 220 160, 80 200, 80 240 C 80 280, 220 320, 220 360 C 220 400, 80 440, 80 480 C 80 520, 220 560, 220 580"
          stroke="hsl(155 60% 35%)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        {/* Glow path */}
        <motion.path
          d="M 80 30 C 80 30, 220 80, 220 120 C 220 160, 80 200, 80 240 C 80 280, 220 320, 220 360 C 220 400, 80 440, 80 480 C 80 520, 220 560, 220 580"
          stroke="hsl(155 60% 45%)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.15"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Step nodes */}
      {steps.map((step, i) => {
        const isLeft = i % 2 === 0;
        const top = 15 + i * (560 / (steps.length - 1)) * (100 / 600);
        const leftPos = isLeft ? "10%" : "55%";

        return (
          <motion.div
            key={i}
            className="absolute flex items-center gap-2"
            style={{ top: `${top}%`, left: leftPos }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              step.done
                ? "bg-primary text-primary-foreground box-glow"
                : "border-2 border-primary/30 text-muted-foreground"
            }`}>
              {step.done ? <Check size={16} /> : <Lock size={14} />}
            </div>
            <span className={`text-xs font-accent font-semibold whitespace-nowrap ${
              step.done ? "text-foreground" : "text-muted-foreground"
            }`}>
              {step.label}
            </span>
          </motion.div>
        );
      })}

      {/* Walking character */}
      <motion.div
        className="absolute"
        style={{ left: "30%" }}
        initial={{ top: "0%", opacity: 0 }}
        animate={inView ? { top: "42%", opacity: 1 } : {}}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      >
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center box-glow-accent animate-float">
          <MapPin size={16} className="text-accent-foreground" />
        </div>
      </motion.div>
    </div>
  );
};

const RoadmapSection = () => {
  return (
    <section id="roadmap" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(hsl(155 60% 45% / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(155 60% 45% / 0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Roadmap visual */}
          <div className="flex justify-center">
            <RoadmapPath />
          </div>

          {/* Right - Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-glow mb-6">
              Seu Caminho Para o{" "}
              <span className="text-primary">Futuro</span>
            </h2>
            <p className="text-muted-foreground font-body mb-6 leading-relaxed">
              Chega de ficar perdido. A UpJobs cria um <strong className="text-foreground">roadmap personalizado</strong> para
              você, baseado no seu perfil DISC e no cálculo da sua hora-valor.
            </p>
            <div className="space-y-4">
              {[
                "Descubra sua área ideal com a Análise DISC",
                "Saiba se vale a pena com o Cálculo Hora-Valor",
                "Siga um roadmap gamificado passo a passo",
                "Acesse cursos gratuitos selecionados pela equipe",
                "Conquiste certificações ao completar cada etapa",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  <p className="text-sm text-foreground/80 font-body">{item}</p>
                </div>
              ))}
            </div>

            <a
              href="#cta"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-sm bg-accent text-accent-foreground font-accent font-bold box-glow-accent hover:brightness-110 transition"
            >
              Começar Meu Roadmap
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
