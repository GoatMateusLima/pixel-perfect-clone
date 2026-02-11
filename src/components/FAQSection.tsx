import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Shield, Clock, Target } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const proofs = [
  { icon: Shield, title: "Método Validado", desc: "Baseado em DISC + Cálculo Marcius, usado por milhares." },
  { icon: Clock, title: "Resultados Reais", desc: "Média de 6-12 meses para a primeira oportunidade em TI." },
  { icon: Target, title: "Personalizado", desc: "Cada roadmap é único para o seu perfil e objetivos." },
];

const faqs = [
  {
    q: "Preciso saber programar para começar?",
    a: "Não! Nosso sistema identifica a melhor área para você, que pode ser UX Design, Gestão de Produto, QA, entre outras que não exigem programação.",
  },
  {
    q: "O que é o Cálculo Marcius?",
    a: "É uma análise que calcula o valor real da sua hora de trabalho e projeta se a transição vale a pena financeiramente, considerando tempo de estudo, investimento e retorno.",
  },
  {
    q: "Como funciona a Análise DISC?",
    a: "Você realiza 3 testes DISC em sites confiáveis e nos informa os resultados. Nossa IA cruza os dados para identificar suas forças e a área de TI mais compatível.",
  },
  {
    q: "Os cursos são realmente gratuitos?",
    a: "Sim. Selecionamos os melhores conteúdos gratuitos do YouTube e plataformas abertas. Você não precisa gastar nada para seguir o roadmap.",
  },
  {
    q: "Quanto tempo leva a transição?",
    a: "Depende da dedicação e da área escolhida. Em média, nossos usuários conseguem a primeira oportunidade entre 6 e 12 meses.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Proofs */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {proofs.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={i}
                className="hologram-panel cyber-border rounded-sm p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Icon size={28} className="text-primary mx-auto mb-3" />
                <h3 className="font-display text-sm font-bold mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground font-body">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-glow text-center mb-8">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="hologram-panel rounded-sm border-none px-4">
                <AccordionTrigger className="font-accent font-semibold text-sm text-foreground hover:text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground font-body">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground font-body mb-4">Ainda tem dúvidas?</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-primary/40 text-primary font-accent font-semibold hover:bg-primary/10 transition"
          >
            <MessageCircle size={16} />
            Falar com Suporte
          </a>
        </motion.div>

        {/* Final persuasion */}
        <motion.div
          className="mt-20 text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-glow mb-4">
            Cada dia que passa é um dia a menos para o{" "}
            <span className="text-accent text-glow-accent">futuro</span>
          </h2>
          <p className="text-muted-foreground font-body mb-8">
            Você pode continuar onde está e esperar o mercado decidir por você. Ou pode tomar o controle agora.
          </p>
          <motion.a
            href="#"
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-sm bg-accent text-accent-foreground font-display font-bold text-lg box-glow-accent animate-pulse-glow"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Começar Agora — É Grátis
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
