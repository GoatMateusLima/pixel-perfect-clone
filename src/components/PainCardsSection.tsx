import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Users, TrendingDown, Clock, AlertTriangle, Bot, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

const pains = [
  {
    icon: Bot,
    title: "Substituição por IA",
    subtitle: "Robôs fazem seu trabalho",
    back: "A automação já elimina funções inteiras. Se seu trabalho é repetitivo, a IA pode substituí-lo em meses, não anos.",
  },
  {
    icon: GraduationCap,
    title: "Sem Certificações",
    subtitle: "Currículo defasado",
    back: "Empresas buscam profissionais com certificações atuais. Um currículo sem elas é invisível para recrutadores.",
  },
  {
    icon: Users,
    title: "Mercado Saturado",
    subtitle: "Muitos profissionais, poucas vagas",
    back: "Áreas tradicionais têm mais candidatos do que vagas. A competição é brutal e os salários estão estagnados.",
  },
  {
    icon: TrendingDown,
    title: "Carreira Obsoleta",
    subtitle: "Sua profissão está sumindo",
    back: "Diversas profissões estão em declínio. Se você não se adaptar agora, pode ficar sem opções amanhã.",
  },
  {
    icon: Clock,
    title: "Tempo Perdido",
    subtitle: "Anos sem evolução",
    back: "Cada ano na mesma posição sem crescimento é tempo que você nunca vai recuperar. O custo de oportunidade é real.",
  },
  {
    icon: AlertTriangle,
    title: "Sem Direção",
    subtitle: "Não sabe por onde começar",
    back: "A quantidade de informação paralisa. Sem um guia claro, você fica rodando em círculos sem sair do lugar.",
  },
  {
    icon: HelpCircle,
    title: "Medo do Novo",
    subtitle: "Insegurança e dúvidas",
    back: "É natural ter medo de recomeçar. Mas permanecer parado é o maior risco que você pode correr hoje.",
  },
];

const FlipCard = ({ pain }: { pain: typeof pains[0] }) => {
  const [flipped, setFlipped] = useState(false);
  const Icon = pain.icon;

  return (
    <div
      className="w-[220px] h-[200px] flex-shrink-0 cursor-pointer select-none"
      style={{ perspective: "800px" }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div className="absolute inset-0 hologram-panel cyber-border rounded-sm p-5 flex flex-col items-center justify-center gap-3" style={{ backfaceVisibility: "hidden" }}>
          <Icon size={32} className="text-primary" />
          <h3 className="font-display text-sm font-bold text-foreground text-center">{pain.title}</h3>
          <p className="text-xs text-muted-foreground text-center font-body">{pain.subtitle}</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 hologram-panel rounded-sm p-5 flex items-center justify-center border border-accent/30"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <p className="text-xs text-foreground/90 text-center font-body leading-relaxed">{pain.back}</p>
        </div>
      </motion.div>
    </div>
  );
};

const PainCardsSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: true, align: "start" },
    [AutoScroll({ speed: 0.5, stopOnInteraction: false, stopOnMouseEnter: true, playOnInit: true, startDelay: 0 })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section id="dores" className="py-20 bg-secondary/30 overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-12">
        <motion.h2
          className="text-3xl sm:text-4xl font-display font-bold text-glow mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          A Realidade Que Ninguém Conta
        </motion.h2>
        <p className="text-muted-foreground font-body max-w-xl mx-auto">
          Estas são as dores silenciosas de quem insiste em uma carreira que o mercado já abandonou.
        </p>
      </div>

      <div className="relative px-4">
        <button
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary/40 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary/40 transition"
        >
          <ChevronRight size={20} />
        </button>

        <div ref={emblaRef} className="overflow-hidden px-8">
          <div className="flex gap-6">
            {pains.map((pain, i) => (
              <div key={i} className="flex-[0_0_auto]">
                <FlipCard pain={pain} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainCardsSection;
