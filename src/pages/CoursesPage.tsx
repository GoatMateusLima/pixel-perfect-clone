import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlayCircle,
  ClipboardList,
  MessageCircleQuestion,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Lock,
  Send,
  ThumbsUp,
  Clock,
  BookOpen,
  Star,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "aula" | "questionario" | "duvidas";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

interface Doubt {
  id: number;
  author: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  answered: boolean;
  reply?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const LESSONS = [
  { id: 1, title: "Introdução ao Mercado Tech", duration: "12min", done: true },
  { id: 2, title: "Fundamentos de Programação", duration: "18min", done: true },
  { id: 3, title: "Lógica e Algoritmos", duration: "22min", done: false, active: true },
  { id: 4, title: "Git & Versionamento", duration: "15min", done: false, locked: true },
  { id: 5, title: "Deploy na Nuvem", duration: "20min", done: false, locked: true },
];

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Qual das alternativas descreve melhor um algoritmo?",
    options: [
      "Um programa de computador pronto",
      "Uma sequência finita de instruções para resolver um problema",
      "Uma linguagem de programação específica",
      "Um banco de dados estruturado",
    ],
    correct: 1,
  },
  {
    id: 2,
    text: "O que é versionamento de código?",
    options: [
      "Nomear arquivos com datas",
      "Controlar e registrar alterações ao longo do tempo",
      "Compactar arquivos para economizar espaço",
      "Converter código entre linguagens",
    ],
    correct: 1,
  },
  {
    id: 3,
    text: "Em programação, o que significa 'debug'?",
    options: [
      "Escrever código novo do zero",
      "Executar o programa mais rápido",
      "Encontrar e corrigir erros no código",
      "Publicar o software na internet",
    ],
    correct: 2,
  },
  {
    id: 4,
    text: "O que é uma variável em programação?",
    options: [
      "Um tipo de loop que se repete infinitamente",
      "Um espaço na memória para armazenar e manipular dados",
      "Uma função que retorna sempre o mesmo valor",
      "Um arquivo de configuração do sistema",
    ],
    correct: 1,
  },
  {
    id: 5,
    text: "Qual das opções abaixo é uma estrutura de controle de fluxo?",
    options: [
      "Variável",
      "Função pura",
      "Condicional if/else",
      "Comentário de código",
    ],
    correct: 2,
  },
];

const DOUBTS: Doubt[] = [
  {
    id: 1,
    author: "Lucas M.",
    avatar: "L",
    time: "há 2 horas",
    text: "Como escolher entre aprender Python ou JavaScript primeiro?",
    likes: 14,
    answered: true,
    reply:
      "Para web, comece com JavaScript. Para dados e IA, Python é a escolha certa. Se ainda não sabe a área, JavaScript tem mais aplicações imediatas e vagas.",
  },
  {
    id: 2,
    author: "Ana P.",
    avatar: "A",
    time: "há 5 horas",
    text: "Preciso de faculdade para trabalhar como dev ou bootcamp já é suficiente?",
    likes: 21,
    answered: true,
    reply:
      "Bootcamp + portfólio sólido te coloca no mercado. A maioria das empresas hoje avalia skills práticas acima de diplomas — mas faculdade ajuda em cargos sênior.",
  },
  {
    id: 3,
    author: "Fábio R.",
    avatar: "F",
    time: "há 1 dia",
    text: "Qual a diferença entre front-end e back-end na prática do dia a dia?",
    likes: 8,
    answered: false,
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const AulaTab = () => {
  const [activeLesson, setActiveLesson] = useState(3);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="hologram-panel rounded-sm overflow-hidden"
        >
          {/* Fake video area */}
          <div
            className="relative w-full bg-[hsl(200_30%_5%)] flex items-center justify-center cursor-pointer group"
            style={{ aspectRatio: "16/9" }}
            onClick={() => setPlaying(!playing)}
          >
            {/* scanlines overlay */}
            <div className="absolute inset-0 scanline pointer-events-none opacity-40" />
            {/* corner decorators */}
            <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/60" />
            <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/60" />
            <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/60" />
            <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/60" />

            {/* gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(155_60%_35%/0.07)] via-transparent to-[hsl(200_70%_50%/0.05)]" />

            {/* play button */}
            <motion.div
              animate={playing ? { scale: 0.85, opacity: 0.5 } : { scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <PlayCircle
                size={64}
                className={`transition-colors ${
                  playing ? "text-primary/40" : "text-primary group-hover:text-primary/80"
                }`}
                style={{ filter: playing ? "none" : "drop-shadow(0 0 14px hsl(155 60% 45% / 0.7))" }}
              />
            </motion.div>

            {/* status badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="text-[10px] font-accent font-semibold text-muted-foreground px-2 py-0.5 rounded-sm bg-secondary/80 border border-border">
                AULA 3 DE {LESSONS.length}
              </span>
              {playing && (
                <span className="flex items-center gap-1 text-[10px] font-accent text-primary px-2 py-0.5 rounded-sm bg-primary/10 border border-primary/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  AO VIVO
                </span>
              )}
            </div>

            {/* duration */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-muted-foreground font-accent">
              <Clock size={10} />
              22:00
            </div>
          </div>

          {/* Lesson info */}
          <div className="p-5">
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Lógica e Algoritmos
            </h2>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Nesta aula você vai entender como estruturar o raciocínio lógico para resolver qualquer
              problema com código — desde pseudocódigo até implementação real.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-accent">
              <span className="flex items-center gap-1"><BookOpen size={12} /> Módulo 1</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 22 min</span>
              <span className="flex items-center gap-1 text-accent">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={10} className="fill-accent" />
                ))}
                4.9
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lesson list */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="hologram-panel rounded-sm p-4 space-y-1 h-fit"
      >
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={14} className="text-primary" />
          Conteúdo do Curso
        </h3>
        {LESSONS.map((lesson) => (
          <button
            key={lesson.id}
            disabled={!!lesson.locked}
            onClick={() => !lesson.locked && setActiveLesson(lesson.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all text-left group
              ${lesson.locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-primary/5"}
              ${activeLesson === lesson.id ? "bg-primary/10 border border-primary/30" : "border border-transparent"}
            `}
          >
            <div className="shrink-0">
              {lesson.done ? (
                <CheckCircle2 size={16} className="text-primary" />
              ) : lesson.locked ? (
                <Lock size={16} className="text-muted-foreground" />
              ) : activeLesson === lesson.id ? (
                <PlayCircle size={16} className="text-accent" style={{ filter: "drop-shadow(0 0 6px hsl(25 90% 55% / 0.6))" }} />
              ) : (
                <PlayCircle size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-body truncate ${activeLesson === lesson.id ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {lesson.title}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground font-accent shrink-0">{lesson.duration}</span>
          </button>
        ))}

        {/* progress */}
        <div className="pt-3 mt-2 border-t border-border">
          <div className="flex justify-between text-[10px] font-accent text-muted-foreground mb-1">
            <span>Progresso</span>
            <span className="text-primary">40%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "40%" }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="h-full rounded-full bg-primary"
              style={{ boxShadow: "0 0 8px hsl(155 60% 45% / 0.6)" }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const PASS_THRESHOLD = 0.75;

const QuestionarioTab = () => {
  const [queue, setQueue] = useState<Question[]>(QUESTIONS);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [attempt, setAttempt] = useState(1);

  const q = queue[current];

  const handleSelect = (idx: number) => {
    if (!confirmed) setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    if (selected === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= queue.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const handleRetry = () => {
    setQueue(shuffleArray(QUESTIONS));
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAttempt((a) => a + 1);
  };

  if (finished) {
    const pct = Math.round((score / queue.length) * 100);
    const passed = score / queue.length >= PASS_THRESHOLD;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hologram-panel rounded-sm p-8 max-w-lg mx-auto text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-5"
        >
          {passed ? (
            <CheckCircle2
              size={56}
              className="mx-auto"
              style={{ color: "hsl(155 60% 45%)", filter: "drop-shadow(0 0 16px hsl(155 60% 45% / 0.7))" }}
            />
          ) : (
            <motion.div
              animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ClipboardList
                size={56}
                className="mx-auto"
                style={{ color: "hsl(25 90% 55%)", filter: "drop-shadow(0 0 16px hsl(25 90% 55% / 0.6))" }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Title */}
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {passed ? "Parabéns! Você passou! 🎉" : "Quase lá! Tente novamente"}
        </h2>

        {/* Score */}
        <p className="text-muted-foreground font-body text-sm mb-2">
          Você acertou{" "}
          <span className="text-primary font-semibold">{score}</span> de{" "}
          <span className="font-semibold">{queue.length}</span> questões —{" "}
          <span
            className="font-bold text-base"
            style={{ color: passed ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)" }}
          >
            {pct}%
          </span>
        </p>

        {/* Threshold hint */}
        <p className="text-xs text-muted-foreground font-accent mb-1">
          Mínimo para aprovação:{" "}
          <span className={passed ? "text-primary" : "text-accent"}>75%</span>
        </p>

        {attempt > 1 && !passed && (
          <p className="text-xs text-muted-foreground font-body mb-1">
            Tentativa <span className="text-accent font-semibold">#{attempt}</span> — As questões foram embaralhadas para você.
          </p>
        )}

        {/* Score bar */}
        <div className="my-5 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: passed
                ? "hsl(155 60% 45%)"
                : "hsl(25 90% 55%)",
              boxShadow: passed
                ? "0 0 10px hsl(155 60% 45% / 0.6)"
                : "0 0 10px hsl(25 90% 55% / 0.6)",
            }}
          />
        </div>

        {/* Threshold marker */}
        <div className="relative h-0 mb-4">
          <div
            className="absolute top-0 bottom-0 w-px bg-primary/50"
            style={{ left: "75%", transform: "translateY(-10px)", height: "20px" }}
          />
          <span
            className="absolute text-[9px] font-accent text-primary/70"
            style={{ left: "75%", transform: "translateX(-50%) translateY(-22px)" }}
          >
            75%
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 mt-6">
          {passed ? (
            <>
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold hover:bg-primary/10 transition"
              >
                Refazer
              </button>
              <Link
                to="/perfil"
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition"
                style={{ boxShadow: "0 0 14px hsl(155 60% 45% / 0.5)" }}
              >
                Próxima Parte <ChevronRight size={14} />
              </Link>
            </>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold box-glow-accent hover:brightness-110 transition"
            >
              Tentar Novamente <ChevronRight size={14} />
            </button>
          )}
        </div>

        {!passed && (
          <p className="text-xs text-muted-foreground font-body mt-4">
            As questões serão apresentadas em ordem aleatória na próxima tentativa.
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent text-muted-foreground">
          Questão <span className="text-primary font-semibold">{current + 1}</span> / {queue.length}
          {attempt > 1 && (
            <span className="ml-2 text-accent">· Tentativa #{attempt}</span>
          )}
        </span>
        <span className="text-xs font-accent text-muted-foreground">
          Acertos: <span className="text-primary font-semibold">{score}</span>
        </span>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          animate={{ width: `${((current) / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full bg-primary"
          style={{ boxShadow: "0 0 8px hsl(155 60% 45% / 0.5)" }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="hologram-panel rounded-sm p-6 space-y-5"
        >
          <h3 className="font-display text-base font-bold text-foreground leading-snug">{q.text}</h3>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let state = "default";
              if (confirmed) {
                if (idx === q.correct) state = "correct";
                else if (idx === selected) state = "wrong";
              } else if (idx === selected) state = "selected";

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-4 py-3 rounded-sm border text-sm font-body transition-all
                    ${state === "default" ? "border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground" : ""}
                    ${state === "selected" ? "border-primary/60 bg-primary/10 text-foreground" : ""}
                    ${state === "correct" ? "border-[hsl(155_60%_45%)] bg-[hsl(155_60%_45%/0.12)] text-[hsl(155_60%_65%)]" : ""}
                    ${state === "wrong" ? "border-destructive/60 bg-destructive/10 text-destructive" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center text-[10px] font-accent font-bold
                      ${state === "selected" ? "border-primary text-primary" : ""}
                      ${state === "correct" ? "border-[hsl(155_60%_45%)] text-[hsl(155_60%_45%)]" : ""}
                      ${state === "wrong" ? "border-destructive text-destructive" : "border-border text-muted-foreground"}
                    `}>
                      {["A", "B", "C", "D"][idx]}
                    </span>
                    {opt}
                    {state === "correct" && <CheckCircle2 size={14} className="ml-auto text-[hsl(155_60%_45%)]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!confirmed ? (
              <button
                onClick={handleConfirm}
                disabled={selected === null}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold disabled:opacity-40 hover:brightness-110 transition"
                style={{ boxShadow: selected !== null ? "0 0 12px hsl(155 60% 45% / 0.4)" : "none" }}
              >
                Confirmar
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold box-glow-accent hover:brightness-110 transition"
              >
                {current + 1 >= queue.length ? "Ver Resultado" : "Próxima"} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const DuvidasTab = () => {
  const [doubts, setDoubts] = useState<Doubt[]>(DOUBTS);
  const [newDoubt, setNewDoubt] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const text = newDoubt.trim();
    if (!text) return;
    const d: Doubt = {
      id: Date.now(),
      author: "Você",
      avatar: "V",
      time: "agora",
      text,
      likes: 0,
      answered: false,
    };
    setDoubts((prev) => [d, ...prev]);
    setNewDoubt("");
  };

  const handleLike = (id: number) => {
    setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, likes: d.likes + 1 } : d)));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* New doubt */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hologram-panel rounded-sm p-5"
      >
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <MessageCircleQuestion size={14} className="text-primary" />
          Enviar uma Dúvida
        </h3>
        <textarea
          ref={textareaRef}
          value={newDoubt}
          onChange={(e) => setNewDoubt(e.target.value)}
          rows={3}
          placeholder="Escreva sua dúvida sobre o conteúdo desta aula..."
          className="w-full px-4 py-3 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmit}
            disabled={!newDoubt.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold disabled:opacity-40 box-glow-accent hover:brightness-110 transition"
          >
            <Send size={13} /> Enviar
          </button>
        </div>
      </motion.div>

      {/* List */}
      <div className="space-y-3">
        {doubts.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`hologram-panel rounded-sm p-4 transition-all ${expanded === d.id ? "border-primary/40" : ""}`}
          >
            <div className="flex items-start gap-3">
              {/* avatar */}
              <div className="shrink-0 w-8 h-8 rounded-sm bg-primary/20 border border-primary/30 flex items-center justify-center font-display text-xs font-bold text-primary">
                {d.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-accent font-semibold text-foreground">{d.author}</span>
                  <span className="text-[10px] text-muted-foreground font-body">{d.time}</span>
                  {d.answered && (
                    <span className="text-[10px] font-accent font-semibold text-primary px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20">
                      Respondida
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{d.text}</p>

                {/* reply */}
                <AnimatePresence>
                  {d.answered && expanded === d.id && d.reply && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pl-3 border-l-2 border-primary/30"
                    >
                      <p className="text-[11px] font-accent font-semibold text-primary mb-0.5">Resposta do Instrutor</p>
                      <p className="text-xs text-muted-foreground font-body leading-relaxed">{d.reply}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* actions */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleLike(d.id)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground font-accent hover:text-primary transition"
                  >
                    <ThumbsUp size={11} /> {d.likes}
                  </button>
                  {d.answered && (
                    <button
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground font-accent hover:text-primary transition"
                    >
                      <MessageCircleQuestion size={11} />
                      {expanded === d.id ? "Fechar" : "Ver resposta"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "aula", label: "Aula", icon: <PlayCircle size={15} /> },
  { id: "questionario", label: "Questionário", icon: <ClipboardList size={15} /> },
  { id: "duvidas", label: "Dúvidas", icon: <MessageCircleQuestion size={15} /> },
];

const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("aula");

  return (
    <div className="min-h-screen gradient-hero scanline px-4 pt-24 pb-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back */}
        <Link
          to="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-body transition"
        >
          <ArrowLeft size={14} /> Voltar ao Perfil
        </Link>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-xs font-accent font-semibold text-muted-foreground tracking-widest uppercase">
            Módulo 1 · Fundamentos
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Trilha{" "}
            <span className="text-primary" style={{ textShadow: "0 0 20px hsl(155 60% 45% / 0.5)" }}>
              Dev Full Stack
            </span>
          </h1>
        </motion.div>

        {/* Tab buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-accent font-semibold transition-all
                ${
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary border border-primary/50"
                    : "text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                }
              `}
              style={
                activeTab === tab.id
                  ? { boxShadow: "0 0 12px hsl(155 60% 45% / 0.3), inset 0 0 12px hsl(155 60% 45% / 0.05)" }
                  : {}
              }
            >
              {tab.icon}
              {tab.label}
              {/* active underline */}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary"
                  style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "aula" && <AulaTab />}
            {activeTab === "questionario" && <QuestionarioTab />}
            {activeTab === "duvidas" && <DuvidasTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoursesPage;