import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MessageCircle, ChevronRight, ChevronDown, Search, Zap, Shield,
  BookOpen, CreditCard, User, Settings, AlertCircle, CheckCircle2,
  Send, ArrowUpRight, Headphones, Clock, Bot, X, Paperclip,
  LifeBuoy, Mail, ExternalLink,
} from "lucide-react";
import Header from "@/components/Header";
import { MainLandmark } from "@/components/MainLandmark";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    id: "account",
    icon: User,
    label: "Conta & Perfil",
    color: "hsl(155 60% 45%)",
    questions: [
      {
        q: "Como altero minha foto de perfil?",
        a: "Acesse seu perfil, clique em 'Editar Perfil' e passe o mouse sobre o avatar para ver a opção de alterar. Suportamos imagens JPG, PNG e WebP de até 5MB.",
      },
      {
        q: "Como altero meu e-mail ou senha?",
        a: "Vá em Configurações → Conta → Segurança. Você precisará confirmar sua senha atual antes de fazer qualquer alteração.",
      },
      {
        q: "Posso ter mais de uma conta?",
        a: "Não. Nossa política permite apenas uma conta por pessoa. Contas duplicadas podem ser suspensas sem aviso prévio.",
      },
    ],
  },
  {
    id: "courses",
    icon: BookOpen,
    label: "Trilhas & Cursos",
    color: "hsl(210 70% 60%)",
    questions: [
      {
        q: "Meu progresso não está sendo salvo, o que faço?",
        a: "Verifique sua conexão com a internet. Se o problema persistir, tente limpar o cache do navegador ou acesse de outro dispositivo. Se ainda assim não resolver, entre em contato conosco.",
      },
      {
        q: "Posso acessar os cursos offline?",
        a: "Atualmente não oferecemos modo offline. Você precisa estar conectado à internet para assistir as aulas e registrar o progresso.",
      },
      {
        q: "Como obtenho meu certificado?",
        a: "O certificado é gerado automaticamente ao concluir 100% do curso, incluindo todos os exercícios e avaliações. Acesse a aba 'Certificados' no seu perfil para baixá-lo.",
      },
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Planos & Pagamentos",
    color: "hsl(45 90% 55%)",
    questions: [
      {
        q: "Como cancelo minha assinatura?",
        a: "Acesse Configurações → Assinatura → Cancelar plano. O cancelamento entra em vigor no próximo ciclo de cobrança. Você mantém acesso até o fim do período pago.",
      },
      {
        q: "Aceitam quais formas de pagamento?",
        a: "Aceitamos cartões de crédito/débito (Visa, Mastercard, Elo, Amex), Pix e boleto bancário. Parcelamento disponível em até 12x no cartão.",
      },
      {
        q: "Peço reembolso, como funciona?",
        a: "Oferecemos reembolso integral em até 7 dias após a compra, sem questionamentos. Após esse período, o reembolso é analisado caso a caso.",
      },
    ],
  },
  {
    id: "technical",
    icon: Settings,
    label: "Problemas Técnicos",
    color: "hsl(270 60% 65%)",
    questions: [
      {
        q: "O site está lento ou com erros, o que faço?",
        a: "Tente recarregar a página (Ctrl+F5), limpar o cache ou usar outro navegador. Recomendamos Chrome, Firefox ou Edge atualizados. Se o problema persistir, reporte para nossa equipe.",
      },
      {
        q: "O vídeo não carrega ou trava muito.",
        a: "Verifique sua velocidade de internet (recomendamos ao menos 5 Mbps). Tente reduzir a qualidade do vídeo para 480p. Se o problema for específico de um curso, entre em contato informando qual aula.",
      },
      {
        q: "Não consigo fazer login, o que aconteceu?",
        a: "Use a opção 'Esqueci minha senha' na tela de login. Se você não receber o e-mail de recuperação em 5 minutos, verifique a pasta de spam ou entre em contato informando seu e-mail cadastrado.",
      },
    ],
  },
];

// ─── Quick links ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Redefinir senha",       icon: Shield,   href: "/reset-password" },
  { label: "Meus certificados",     icon: CheckCircle2, href: "/profile" },
  { label: "Gerenciar assinatura",  icon: CreditCard,   href: "/settings" },
  { label: "Status do sistema",     icon: Zap,      href: "/status" },
];

// ─── Contact options ──────────────────────────────────────────────────────────
const CONTACT_OPTIONS = [
  {
    icon: MessageCircle,
    title: "Chat ao vivo",
    desc: "Resposta em até 5 minutos",
    badge: "Online",
    badgeColor: "hsl(155 60% 45%)",
    action: "Iniciar chat",
  },
  {
    icon: Mail,
    title: "E-mail",
    desc: "Resposta em até 24 horas",
    badge: "24h",
    badgeColor: "hsl(210 70% 60%)",
    action: "Enviar e-mail",
  },
  {
    icon: Headphones,
    title: "Suporte prioritário",
    desc: "Exclusivo para plano Pro",
    badge: "Pro",
    badgeColor: "hsl(45 90% 55%)",
    action: "Agendar chamada",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
const SupportPage = () => {
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openQuestion,   setOpenQuestion]   = useState<string | null>(null);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [chatMessage,    setChatMessage]    = useState("");
  const [chatMessages,   setChatMessages]   = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Olá! 👋 Sou o assistente da UpJobs. Como posso te ajudar hoje?" },
  ]);
  const [hoveredPill,    setHoveredPill]    = useState<string | null>(null);
  const [ticketSent,     setTicketSent]     = useState(false);
  const [ticketForm,     setTicketForm]     = useState({ name: "", email: "", subject: "", message: "" });

  // Filter FAQ by search
  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (faq) =>
        !searchQuery ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) =>
    !activeCategory
      ? cat.questions.length > 0
      : cat.id === activeCategory && cat.questions.length > 0
  );

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    setChatMessages((prev) => [...prev, { from: "user", text: userMsg }]);
    setChatMessage("");
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Obrigado pela sua mensagem! Um agente humano irá responder em breve. Enquanto isso, confira nossa seção de perguntas frequentes — talvez sua dúvida já esteja respondida lá! 🚀",
        },
      ]);
    }, 1000);
  };

  const handleTicketSubmit = () => {
    if (!ticketForm.name || !ticketForm.email || !ticketForm.message) return;
    setTicketSent(true);
  };

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <MainLandmark>
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-accent font-semibold"
            style={{ background: "hsl(155 60% 45% / 0.12)", border: "1px solid hsl(155 60% 45% / 0.3)", color: "hsl(155 60% 55%)" }}>
            <LifeBuoy size={12} /> Central de Suporte
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
            Como podemos <span style={{ color: "hsl(155 60% 50%)" }}>ajudar?</span>
          </h1>
          <p className="text-muted-foreground font-body text-base max-w-md mx-auto mb-8">
            Encontre respostas rápidas ou fale diretamente com nossa equipe.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar em perguntas frequentes..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory(null); }}
              className="w-full bg-secondary/60 border border-border rounded-sm pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ backdropFilter: "blur(8px)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Quick links ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12"
        >
          {QUICK_LINKS.map(({ label, icon: Icon, href }, i) => (
            <motion.div key={label} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
              <Link to={href}
                className="hologram-panel rounded-sm p-4 flex items-center gap-3 group hover:border-primary/40 transition-all block"
                style={{ border: "1px solid hsl(var(--border))" }}>
                <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(155 60% 45% / 0.12)", border: "1px solid hsl(155 60% 45% / 0.25)" }}>
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-[12px] font-accent font-semibold text-foreground group-hover:text-primary transition leading-tight">{label}</span>
                <ArrowUpRight size={11} className="text-muted-foreground/40 group-hover:text-primary transition ml-auto flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* ── FAQ ── */}
          <div>
            {/* Category filter pills */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              <button
                onClick={() => { setActiveCategory(null); setHoveredPill(null); }}
                onMouseEnter={() => setHoveredPill("todos")}
                onMouseLeave={() => setHoveredPill(null)}
                className="text-[11px] font-accent font-semibold px-3 py-1.5 rounded-full transition-all"
                style={!activeCategory
                  ? { background: "hsl(155 60% 45% / 0.35)", color: "hsl(155 60% 65%)", border: "1px solid hsl(155 60% 45% / 0.8)" }
                  : hoveredPill === "todos"
                    ? { background: "hsl(155 60% 45% / 0.25)", color: "hsl(155 60% 65%)", border: "1px solid hsl(155 60% 45% / 0.5)" }
                    : { background: "hsl(155 60% 45% / 0.1)", color: "hsl(155 60% 55%)", border: "1px solid hsl(155 60% 45% / 0.25)" }}>
                Todos
              </button>
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                const isHovered = hoveredPill === cat.id;
                return (
                  <button key={cat.id}
                    onClick={() => { setActiveCategory(isActive ? null : cat.id); setHoveredPill(null); }}
                    onMouseEnter={() => setHoveredPill(cat.id)}
                    onMouseLeave={() => setHoveredPill(null)}
                    className="flex items-center gap-1.5 text-[11px] font-accent font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={isActive
                      ? { background: `${cat.color}35`, color: cat.color, border: `1px solid ${cat.color}80` }
                      : isHovered
                        ? { background: `${cat.color}28`, color: cat.color, border: `1px solid ${cat.color}60` }
                        : { background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                    <Icon size={11} />{cat.label}
                  </button>
                );
              })}
            </motion.div>

            {/* FAQ cards */}
            <div className="space-y-4">
              {filteredCategories.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hologram-panel rounded-sm p-10 text-center">
                  <AlertCircle size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-accent font-semibold text-muted-foreground">Nenhum resultado para "{searchQuery}"</p>
                  <p className="text-[12px] text-muted-foreground/60 font-body mt-1">Tente termos diferentes ou entre em contato com nosso suporte.</p>
                </motion.div>
              ) : (
                filteredCategories.map((cat, ci) => {
                  const CatIcon = cat.icon;
                  return (
                    <motion.div key={cat.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + ci * 0.08 }}
                      className="hologram-panel rounded-sm overflow-hidden">
                      {/* Category header */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30"
                        style={{ background: `${cat.color}08` }}>
                        <div className="w-8 h-8 rounded-sm flex items-center justify-center"
                          style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}35` }}>
                          <CatIcon size={15} style={{ color: cat.color }} />
                        </div>
                        <h3 className="font-display text-sm font-bold text-foreground">{cat.label}</h3>
                        <span className="ml-auto text-[10px] font-accent text-muted-foreground">
                          {cat.questions.length} {cat.questions.length === 1 ? "pergunta" : "perguntas"}
                        </span>
                      </div>

                      {/* Questions */}
                      <div className="divide-y divide-border/20">
                        {cat.questions.map((faq, qi) => {
                          const key = `${cat.id}-${qi}`;
                          const isOpen = openQuestion === key;
                          return (
                            <div key={key}>
                              <button
                                onClick={() => setOpenQuestion(isOpen ? null : key)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group hover:bg-white/[0.02] transition-colors"
                              >
                                <span className="text-[13px] font-accent font-semibold text-foreground group-hover:text-primary transition leading-snug">
                                  {faq.q}
                                </span>
                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                                  <ChevronDown size={15} className="text-muted-foreground" />
                                </motion.div>
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-5 pb-5">
                                      <div className="rounded-sm p-4 text-[13px] font-body text-muted-foreground leading-relaxed"
                                        style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}>
                                        {faq.a}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Sidebar direita ── */}
          <aside className="space-y-4">

            {/* Contact options */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="hologram-panel rounded-sm p-5">
              <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Headphones size={14} className="text-primary" /> Falar com a equipe
              </h3>
              <div className="space-y-3">
                {CONTACT_OPTIONS.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <motion.button key={i} whileHover={{ x: 2 }}
                      onClick={() => opt.title === "Chat ao vivo" && setChatOpen(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition-all group"
                      style={{ background: `${opt.badgeColor}08`, border: `1px solid ${opt.badgeColor}20` }}>
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                        style={{ background: `${opt.badgeColor}18`, border: `1px solid ${opt.badgeColor}35` }}>
                        <Icon size={14} style={{ color: opt.badgeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-accent font-semibold text-foreground">{opt.title}</p>
                          <span className="text-[8px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                            style={{ background: `${opt.badgeColor}20`, color: opt.badgeColor, border: `1px solid ${opt.badgeColor}40` }}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-body">{opt.desc}</p>
                      </div>
                      <ChevronRight size={12} className="text-muted-foreground/40 group-hover:text-foreground transition flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Status indicator */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              className="hologram-panel rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap size={14} className="text-primary" /> Status do Sistema
                </h3>
                <a href="/status" className="text-[10px] font-accent text-primary flex items-center gap-0.5 hover:brightness-125 transition">
                  Ver tudo <ExternalLink size={9} />
                </a>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: "Plataforma web",   status: "Operacional" },
                  { name: "Vídeo & Streaming",status: "Operacional" },
                  { name: "Autenticação",      status: "Operacional" },
                  { name: "API",               status: "Degradado"   },
                ].map(({ name, status }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-[11px] font-body text-muted-foreground">{name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: status === "Operacional" ? "hsl(155 60% 50%)" : "hsl(45 90% 55%)" }} />
                      <span className="text-[10px] font-accent font-semibold"
                        style={{ color: status === "Operacional" ? "hsl(155 60% 50%)" : "hsl(45 90% 55%)" }}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Open ticket form */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="hologram-panel rounded-sm p-5">
              <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-accent" /> Abrir chamado
              </h3>

              <AnimatePresence mode="wait">
                {ticketSent ? (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4">
                    <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "hsl(155 60% 50%)" }} />
                    <p className="font-accent font-semibold text-foreground text-sm mb-1">Chamado aberto!</p>
                    <p className="text-[11px] font-body text-muted-foreground">Responderemos em até 24h no seu e-mail.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" className="space-y-3">
                    {[
                      { key: "name",    placeholder: "Seu nome",    type: "text"  },
                      { key: "email",   placeholder: "Seu e-mail",  type: "email" },
                      { key: "subject", placeholder: "Assunto",     type: "text"  },
                    ].map(({ key, placeholder, type }) => (
                      <input key={key} type={type} placeholder={placeholder}
                        value={ticketForm[key as keyof typeof ticketForm]}
                        onChange={(e) => setTicketForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-[12px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                    ))}
                    <textarea
                      placeholder="Descreva seu problema em detalhes..."
                      rows={3}
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-[12px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />
                    <button onClick={handleTicketSubmit}
                      disabled={!ticketForm.name || !ticketForm.email || !ticketForm.message}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-[12px] font-accent font-semibold text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "hsl(155 60% 40%)" }}>
                      <Send size={12} /> Enviar chamado
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Average response time */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              className="hologram-panel rounded-sm p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(210 70% 60% / 0.15)", border: "1px solid hsl(210 70% 60% / 0.3)" }}>
                <Clock size={16} style={{ color: "hsl(210 70% 60%)" }} />
              </div>
              <div>
                <p className="text-[11px] font-body text-muted-foreground">Tempo médio de resposta</p>
                <p className="font-display text-lg font-bold" style={{ color: "hsl(210 70% 60%)" }}>~ 4 horas</p>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>

      {/* ── Chat Widget ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-80 flex flex-col rounded-sm overflow-hidden"
            style={{ height: 440, background: "hsl(215 30% 12%)", border: "1px solid hsl(155 60% 45% / 0.35)", boxShadow: "0 0 40px hsl(155 60% 45% / 0.15)" }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30"
              style={{ background: "hsl(155 60% 45% / 0.1)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(155 60% 45% / 0.2)", border: "1px solid hsl(155 60% 45% / 0.4)" }}>
                <Bot size={15} style={{ color: "hsl(155 60% 55%)" }} />
              </div>
              <div>
                <p className="text-[12px] font-accent font-semibold text-foreground">Assistente UpJobs</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-accent text-muted-foreground">Online agora</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground transition">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] px-3 py-2 rounded-sm text-[12px] font-body leading-relaxed"
                    style={msg.from === "user"
                      ? { background: "hsl(155 60% 40%)", color: "hsl(0 0% 5%)" }
                      : { background: "hsl(215 25% 18%)", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30 flex items-center gap-2">
              <button className="text-muted-foreground hover:text-foreground transition flex-shrink-0">
                <Paperclip size={14} />
              </button>
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 bg-transparent text-[12px] font-body text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={handleSendChat}
                disabled={!chatMessage.trim()}
                className="flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center transition disabled:opacity-40"
                style={{ background: "hsl(155 60% 40%)" }}>
                <Send size={12} style={{ color: "hsl(0 0% 5%)" }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat FAB (when closed) ── */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "hsl(155 60% 40%)",
              boxShadow: "0 0 24px hsl(155 60% 45% / 0.5)",
            }}>
            <MessageCircle size={22} style={{ color: "hsl(0 0% 5%)" }} />
          </motion.button>
        )}
      </AnimatePresence>
      </MainLandmark>
    </div>
  );
};

export default SupportPage;