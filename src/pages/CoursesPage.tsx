import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
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

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const LESSONS = [
  { id: 1, title: "Introdução ao Mercado Tech", duration: "12min", done: true },
  { id: 2, title: "Fundamentos de Programação", duration: "18min", done: true },
  { id: 3, title: "Lógica e Algoritmos", duration: "22min", done: false, active: true },
  { id: 4, title: "Git & Versionamento", duration: "15min", done: false, locked: true },
  { id: 5, title: "Deploy na Nuvem", duration: "20min", done: false, locked: true },
];

const ALL_QUESTIONS: Question[] = [
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
  {
    id: 6,
    text: "O que é front-end no desenvolvimento web?",
    options: [
      "A parte do sistema que gerencia o banco de dados",
      "A interface visual com a qual o usuário interage",
      "O servidor que processa as requisições",
      "O sistema de autenticação de usuários",
    ],
    correct: 1,
  },
  {
    id: 7,
    text: "O que significa a sigla HTML?",
    options: [
      "HyperText Markup Language",
      "High Text Machine Learning",
      "HyperText Management Logic",
      "Hosted Terminal Markup Layer",
    ],
    correct: 0,
  },
  {
    id: 8,
    text: "Para que serve o CSS em desenvolvimento web?",
    options: [
      "Criar lógica de negócios no servidor",
      "Conectar o front-end ao banco de dados",
      "Estilizar a aparência visual das páginas",
      "Gerenciar requisições HTTP",
    ],
    correct: 2,
  },
  {
    id: 9,
    text: "O que é uma função em programação?",
    options: [
      "Um tipo de dado que armazena números",
      "Um bloco de código reutilizável que realiza uma tarefa específica",
      "Uma estrutura de repetição infinita",
      "Um arquivo de configuração externo",
    ],
    correct: 1,
  },
  {
    id: 10,
    text: "O que é um loop (laço de repetição)?",
    options: [
      "Um erro que trava o programa",
      "Uma estrutura que executa um bloco de código várias vezes",
      "Um tipo especial de variável numérica",
      "Uma função que retorna valores booleanos",
    ],
    correct: 1,
  },
  {
    id: 11,
    text: "Qual é a principal função do back-end em uma aplicação web?",
    options: [
      "Criar animações e transições visuais",
      "Gerenciar a lógica, dados e regras de negócio no servidor",
      "Definir o layout responsivo das páginas",
      "Compilar o código JavaScript no navegador",
    ],
    correct: 1,
  },
  {
    id: 12,
    text: "O que é um banco de dados?",
    options: [
      "Um editor de código para desenvolvedores",
      "Um sistema para organizar e armazenar informações de forma estruturada",
      "Uma linguagem de programação orientada a objetos",
      "Um protocolo de comunicação entre servidores",
    ],
    correct: 1,
  },
  {
    id: 13,
    text: "Qual ferramenta é amplamente usada para versionamento de código?",
    options: [
      "Docker",
      "Figma",
      "Git",
      "Postman",
    ],
    correct: 2,
  },
  {
    id: 14,
    text: "O que é um repositório no contexto do Git?",
    options: [
      "Um servidor de banco de dados",
      "Um local onde o histórico e os arquivos do projeto são armazenados",
      "Um ambiente de execução virtual",
      "Uma branch protegida de produção",
    ],
    correct: 1,
  },
  {
    id: 15,
    text: "O que significa API?",
    options: [
      "Advanced Programming Interface",
      "Application Protocol Integration",
      "Application Programming Interface",
      "Automated Process Instruction",
    ],
    correct: 2,
  },
  {
    id: 16,
    text: "Qual das seguintes linguagens é mais usada para estilização de páginas web?",
    options: [
      "Python",
      "CSS",
      "SQL",
      "Java",
    ],
    correct: 1,
  },
  {
    id: 17,
    text: "O que é pseudocódigo?",
    options: [
      "Um código escrito em uma linguagem desconhecida",
      "Uma representação textual informal de um algoritmo, sem sintaxe rígida",
      "Um código que só funciona em ambiente de testes",
      "Um arquivo de configuração de servidor",
    ],
    correct: 1,
  },
  {
    id: 18,
    text: "O que é deploy em desenvolvimento de software?",
    options: [
      "Criar testes automatizados para o código",
      "Publicar e disponibilizar uma aplicação para uso em produção",
      "Refatorar o código para melhorar a performance",
      "Realizar uma revisão de código em equipe",
    ],
    correct: 1,
  },
  {
    id: 19,
    text: "O que é um operador lógico em programação?",
    options: [
      "Um símbolo matemático usado em cálculos financeiros",
      "Um símbolo que realiza operações entre valores booleanos, como AND, OR e NOT",
      "Uma função que converte tipos de dados",
      "Um tipo de variável que armazena texto",
    ],
    correct: 1,
  },
  {
    id: 20,
    text: "O que faz o comando 'git commit'?",
    options: [
      "Envia as alterações para o repositório remoto",
      "Cria uma nova branch no projeto",
      "Registra um ponto de salvamento das alterações no histórico local",
      "Mescla duas branches diferentes",
    ],
    correct: 2,
  },
  {
    id: 21,
    text: "O que é programação orientada a objetos (POO)?",
    options: [
      "Um paradigma que organiza o código em torno de objetos com atributos e métodos",
      "Uma técnica de otimização de banco de dados",
      "Um método de deploy contínuo em nuvem",
      "Uma forma de escrever código sem usar funções",
    ],
    correct: 0,
  },
  {
    id: 22,
    text: "Qual das opções abaixo descreve uma estrutura de dados do tipo array?",
    options: [
      "Uma coleção de pares chave-valor sem ordem definida",
      "Uma sequência ordenada de elementos acessados por índice",
      "Um único valor armazenado na memória",
      "Uma estrutura que conecta nós em forma de árvore",
    ],
    correct: 1,
  },
  {
    id: 23,
    text: "O que é responsividade em desenvolvimento web?",
    options: [
      "A velocidade de resposta do servidor às requisições",
      "A capacidade de um site se adaptar a diferentes tamanhos de tela",
      "O tempo de carregamento de imagens pesadas",
      "A compatibilidade do código com múltiplas linguagens",
    ],
    correct: 1,
  },
  {
    id: 24,
    text: "Qual é a diferença entre compilação e interpretação de código?",
    options: [
      "Compilação é mais lenta; interpretação gera binários otimizados",
      "Compilação transforma todo o código em binário antes da execução; interpretação executa linha a linha",
      "Ambas fazem exatamente a mesma coisa, só diferem no nome",
      "Interpretação exige mais memória RAM do que compilação",
    ],
    correct: 1,
  },
  {
    id: 25,
    text: "O que é um pull request (PR) no fluxo de trabalho com Git?",
    options: [
      "Um comando para baixar atualizações do repositório remoto",
      "Uma solicitação para que as alterações de uma branch sejam revisadas e mescladas",
      "Uma forma de reverter commits anteriores",
      "Um arquivo de configuração automático do projeto",
    ],
    correct: 1,
  },
];

const QUESTIONS_PER_QUIZ = 5;

const pickRandomQuestions = (): Question[] =>
  shuffleArray(ALL_QUESTIONS).slice(0, QUESTIONS_PER_QUIZ);

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

const LESSON_INFO: Record<number, { title: string; description: string; duration: string; module: string; num: number }> = {
  1: { title: "Introdução ao Mercado Tech", description: "Uma visão geral do ecossistema tech, oportunidades de carreira e como se posicionar no mercado atual.", duration: "12:00", module: "Módulo 1", num: 1 },
  2: { title: "Fundamentos de Programação", description: "Os pilares essenciais que todo dev precisa dominar: variáveis, tipos, operadores e estruturas básicas.", duration: "18:00", module: "Módulo 1", num: 2 },
  3: { title: "Lógica e Algoritmos", description: "Aprenda a estruturar o raciocínio lógico para resolver qualquer problema com código — do pseudocódigo à implementação real.", duration: "22:00", module: "Módulo 1", num: 3 },
};

const AulaTab = ({ activeLesson = 3 }: { activeLesson?: number }) => {
  const lesson = LESSON_INFO[activeLesson] ?? LESSON_INFO[3];
  const lessonData = LESSONS.find(l => l.id === activeLesson);
  const isLocked = lessonData?.locked;

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hologram-panel rounded-sm p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"
          style={{ boxShadow: "0 0 20px hsl(215 20% 20%)" }}>
          <Lock size={28} className="text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">Aula Bloqueada</h3>
        <p className="text-sm text-muted-foreground font-body">Complete as aulas anteriores para desbloquear este conteúdo.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <motion.div
        key={activeLesson}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hologram-panel rounded-sm overflow-hidden"
      >
        {/* Video area */}
        <div
          className="relative w-full bg-[hsl(200_30%_5%)]"
          style={{ aspectRatio: "16/9" }}
        >
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/60 z-10 pointer-events-none" />
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/60 z-10 pointer-events-none" />

          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/u7XSuhGroL0?rel=0&modestbranding=1"
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Lesson info */}
        <div className="p-5">
          <h2 className="font-display text-lg font-bold text-foreground mb-1">{lesson.title}</h2>
          <p className="text-sm text-foreground/75 font-body leading-relaxed">{lesson.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-accent">
            <span className="flex items-center gap-1"><BookOpen size={12} /> {lesson.module}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration}</span>
            <span className="flex items-center gap-1 text-accent">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className="fill-accent" />)}
              4.9
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mini lesson list for mobile (roadmap hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="hologram-panel rounded-sm p-4 lg:hidden"
      >
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen size={14} className="text-primary" /> Aulas do Módulo
        </h3>
        <div className="space-y-1">
          {LESSONS.map((l) => (
            <div key={l.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all
                ${l.id === activeLesson ? "border-primary/40 bg-primary/10" : "border-transparent"}
                ${l.locked ? "opacity-40" : ""}
              `}>
              {l.done ? <CheckCircle2 size={14} className="text-primary shrink-0" /> :
               l.locked ? <Lock size={14} className="text-muted-foreground shrink-0" /> :
               <PlayCircle size={14} className="text-accent shrink-0" />}
              <span className={`text-xs font-body flex-1 truncate ${l.id === activeLesson ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{l.title}</span>
              <span className="text-xs font-accent text-muted-foreground">{l.duration}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const PASS_THRESHOLD = 0.75;

const QuestionarioTab = () => {
  const [queue, setQueue] = useState<Question[]>(() => pickRandomQuestions());
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
    setQueue(pickRandomQuestions());
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
            className="absolute text-xs font-accent text-primary/70"
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
                    <span className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center text-xs font-accent font-bold
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
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
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
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set(prev).add(id));
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
                  <span className="text-xs text-foreground/60 font-body">{d.time}</span>
                  {d.answered && (
                    <span className="text-xs font-accent font-semibold text-primary px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20">
                      Respondida
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 font-body leading-relaxed">{d.text}</p>

                {/* reply */}
                <AnimatePresence>
                  {d.answered && expanded === d.id && d.reply && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pl-3 border-l-2 border-primary/30"
                    >
                      <p className="text-xs font-accent font-semibold text-primary mb-0.5">Resposta do Instrutor</p>
                      <p className="text-sm text-foreground/75 font-body leading-relaxed">{d.reply}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* actions */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleLike(d.id)}
                    disabled={likedIds.has(d.id)}
                    className="flex items-center gap-1 text-xs font-accent transition-all"
                    style={likedIds.has(d.id)
                      ? { color: "hsl(155 60% 50%)", cursor: "default" }
                      : { color: "hsl(215 15% 50%)" }}
                  >
                    <motion.span
                      animate={likedIds.has(d.id) ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex" }}
                    >
                      <ThumbsUp
                        size={11}
                        style={likedIds.has(d.id) ? { fill: "hsl(155 60% 50%)", color: "hsl(155 60% 50%)" } : {}}
                      />
                    </motion.span>
                    {d.likes}
                  </button>
                  {d.answered && (
                    <button
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground font-accent hover:text-primary transition"
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

// ─── Roadmap Data ─────────────────────────────────────────────────────────────

interface RoadmapNode {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  status: "done" | "active" | "locked";
  xOffset: number; // zigzag offset: -1 | 0 | 1
  module: number;
}

const ROADMAP_NODES: RoadmapNode[] = [
  { id: 1, title: "Mercado Tech",       subtitle: "Introdução",        icon: "🌐", status: "done",   xOffset: 0,  module: 1 },
  { id: 2, title: "Fundamentos",        subtitle: "Programação",       icon: "💡", status: "done",   xOffset: 1,  module: 1 },
  { id: 3, title: "Lógica",             subtitle: "Algoritmos",        icon: "🧠", status: "active", xOffset: -1, module: 1 },
  { id: 4, title: "Git",                subtitle: "Versionamento",     icon: "🔀", status: "locked", xOffset: 0,  module: 2 },
  { id: 5, title: "Deploy",             subtitle: "Nuvem",             icon: "☁️", status: "locked", xOffset: 1,  module: 2 },
  { id: 6, title: "Front-end",          subtitle: "HTML & CSS",        icon: "🎨", status: "locked", xOffset: -1, module: 2 },
  { id: 7, title: "JavaScript",         subtitle: "ES6+",              icon: "⚡", status: "locked", xOffset: 0,  module: 3 },
  { id: 8, title: "React",              subtitle: "Componentes",       icon: "⚛️", status: "locked", xOffset: 1,  module: 3 },
  { id: 9, title: "Back-end",           subtitle: "Node.js & APIs",    icon: "🔧", status: "locked", xOffset: -1, module: 3 },
  { id: 10, title: "Banco de Dados",    subtitle: "SQL & NoSQL",       icon: "🗄️", status: "locked", xOffset: 0,  module: 4 },
  { id: 11, title: "DevOps",            subtitle: "CI/CD & Docker",    icon: "🐳", status: "locked", xOffset: 1,  module: 4 },
  { id: 12, title: "Certificado",       subtitle: "Full Stack Dev",    icon: "🏆", status: "locked", xOffset: 0,  module: 5 },
];

// ─── Roadmap Component ────────────────────────────────────────────────────────
// ─── Avatar Image ─────────────────────────────────────────────────────────────
const AVATAR_IMG_SRC = "data:image/webp;base64,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";


// Zigzag pattern: each node alternates left → right → left ...
// "left" = 15% from left edge, "right" = 85% from left edge, "center" = 50% (cert)
const getNodeX = (index: number, isCert: boolean): number => {
  if (isCert) return 50;
  return index % 2 === 0 ? 20 : 80;
};

const NODE_ROW_HEIGHT = 88; // px per row
const NODE_R = 26;          // circle radius

const RoadmapPanel = ({ activeNodeId, onSelectNode, horizontal = false }: { activeNodeId: number; onSelectNode: (id: number) => void; horizontal?: boolean }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelW, setPanelW] = useState(220);
  const [panelH, setPanelH] = useState(600);
  const [avatarPos, setAvatarPos] = useState({ x: 0, y: 0 });
  const [avatarFlip, setAvatarFlip] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setPanelW(el.clientWidth); setPanelH(el.clientHeight); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute avatar position based on activeNodeId (vertical mode)
  React.useEffect(() => {
    if (horizontal) return;
    const HEADER_H_V_local = 110;
    const ROW_H_local = 100;
    const midX_local = panelW / 2;
    const ampX_local = Math.min(panelW * 0.28, 70);
    const activeIdx = ROADMAP_NODES.findIndex(n => n.id === activeNodeId);
    if (activeIdx < 0) return;
    const isCert = activeNodeId === 12;
    const newX = isCert ? midX_local : midX_local + (activeIdx % 2 === 0 ? -ampX_local : ampX_local);
    const newY = HEADER_H_V_local + activeIdx * ROW_H_local + ROW_H_local / 2;
    setAvatarFlip(prev => {
      if (avatarPos.x !== 0 && newX < avatarPos.x) return true;
      if (avatarPos.x !== 0 && newX > avatarPos.x) return false;
      return prev;
    });
    setAvatarPos({ x: newX, y: newY });
    if (!avatarReady) setTimeout(() => setAvatarReady(true), 200);
  }, [activeNodeId, panelW, horizontal]);

  const isCertificate = (node: RoadmapNode) => node.id === 12;

  // ── HORIZONTAL MODE — Road style ─────────────────────────────────────────
  if (horizontal) {
    const HEADER_H = 72;
    const canvasH = panelH - HEADER_H;

    // Road geometry — sinusoidal path through the canvas
    // Each node sits on the road. We define control points manually for a natural S-road.
    const N = ROADMAP_NODES.length;
    const stepX = Math.max(110, panelW / (N - 1 + 1.5));
    const totalW = Math.max(panelW, stepX * (N + 0.5));

    // Mid-Y of road canvas, amplitude of waves
    const midY = canvasH * 0.5;
    const amp  = Math.min(canvasH * 0.28, 90);

    // Each node's x,y position on the road
    const nodePos = ROADMAP_NODES.map((node, i) => {
      const isCert = isCertificate(node);
      const x = 60 + i * stepX;
      // Sine wave: node 0 at mid, alternates up/down, cert at center
      const y = isCert ? midY : midY + (i % 2 === 0 ? -amp : amp);
      return { x, y };
    });

    // Build a single continuous road path through all node positions
    const buildRoadPath = () => {
      if (nodePos.length === 0) return "";
      let d = `M ${nodePos[0].x} ${nodePos[0].y}`;
      for (let i = 1; i < nodePos.length; i++) {
        const p0 = nodePos[i - 1];
        const p1 = nodePos[i];
        const dx = (p1.x - p0.x) * 0.5;
        d += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return d;
    };

    // Per-segment path (for color: done/active vs locked)
    const segmentPaths = ROADMAP_NODES.slice(1).map((node, i) => {
      const p0 = nodePos[i];
      const p1 = nodePos[i + 1];
      const dx = (p1.x - p0.x) * 0.5;
      const d = `M ${p0.x} ${p0.y} C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
      const prev = ROADMAP_NODES[i];
      const lit = prev.status === "done" || prev.status === "active";
      return { d, lit, key: node.id };
    });

    const roadPath = buildRoadPath();

    // Pin colors per node
    const PIN_COLORS: Record<string, string> = {
      done:   "hsl(155 60% 45%)",
      active: "hsl(25 90% 55%)",
      locked: "hsl(215 20% 35%)",
    };
    const PIN_GLOW: Record<string, string> = {
      done:   "hsl(155 60% 45% / 0.6)",
      active: "hsl(25 90% 55% / 0.6)",
      locked: "transparent",
    };

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="shrink-0 px-6 pt-4 pb-2 border-b border-border/30 bg-background/60 backdrop-blur-sm flex items-center justify-between"
          style={{ height: HEADER_H }}
        >
          <div>
            <p className="text-xs font-accent font-semibold text-foreground/70 tracking-widest uppercase mb-0.5">Sua Jornada</p>
            <h2 className="font-display text-sm font-bold text-foreground leading-tight">
              Trilha <span className="text-primary" style={{ textShadow: "0 0 10px hsl(155 60% 45% / 0.6)" }}>Dev Full Stack</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-accent text-foreground/70">Progresso <span className="text-primary font-bold">2 / 11</span></span>
            <div className="w-28 h-0.5 rounded-full bg-secondary overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "18%" }} transition={{ delay: 0.5, duration: 1 }}
                className="h-full rounded-full bg-primary" style={{ boxShadow: "0 0 6px hsl(155 60% 45% / 0.8)" }} />
            </div>
          </div>
        </div>

        {/* Road canvas */}
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.3) transparent" }}
        >
          <div className="relative" style={{ width: totalW, height: canvasH }}>

            <svg
              className="absolute inset-0 pointer-events-none"
              width={totalW}
              height={canvasH}
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Road done gradient */}
                <linearGradient id="roadDone" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(155, 55%, 30%)" />
                  <stop offset="100%" stopColor="hsl(155, 55%, 25%)" />
                </linearGradient>
                {/* Road locked gradient */}
                <linearGradient id="roadLocked" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(215, 20%, 16%)" />
                  <stop offset="100%" stopColor="hsl(215, 20%, 13%)" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="pinGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* === ROAD LAYERS === */}
              {segmentPaths.map(({ d, lit, key }) => (
                <g key={key}>
                  {/* Road shadow */}
                  <path d={d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Road surface */}
                  <path d={d} fill="none"
                    stroke={lit ? "hsl(155, 45%, 22%)" : "hsl(215, 18%, 14%)"}
                    strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Road edge lines */}
                  <path d={d} fill="none"
                    stroke={lit ? "hsl(155, 60%, 35% / 0.5)" : "hsl(215, 20%, 28% / 0.4)"}
                    strokeWidth="22" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="0"
                    style={{ paintOrder: "stroke" }}
                  />
                  {/* Outer border of road */}
                  <path d={d} fill="none"
                    stroke={lit ? "hsl(155, 55%, 40%)" : "hsl(215, 20%, 28%)"}
                    strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"
                    style={{ mixBlendMode: "screen", opacity: 0.15 }}
                  />
                </g>
              ))}

              {/* === CENTER DASHED LINE === */}
              <path
                d={roadPath}
                fill="none"
                stroke="hsl(215, 15%, 50%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="10 8"
                opacity="0.45"
              />

              {/* Lit dashed line (green for completed segments) */}
              {segmentPaths.filter(s => s.lit).map(({ d, key }) => (
                <path key={`dash-${key}`}
                  d={d} fill="none"
                  stroke="hsl(155, 60%, 50%)"
                  strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8"
                  opacity="0.6"
                />
              ))}

              {/* === ANIMATED PARTICLE on active segment === */}
              {segmentPaths.filter(s => s.lit).map(({ d, key }) => (
                <circle key={`dot-${key}`} r="3" fill="hsl(155, 70%, 60%)" filter="url(#roadGlow)" opacity="0.9">
                  <animateMotion dur="3s" repeatCount="indefinite" path={d} />
                </circle>
              ))}

              {/* === MAP PIN MARKERS === */}
              {ROADMAP_NODES.map((node, index) => {
                const { x, y } = nodePos[index];
                const isCert   = isCertificate(node);
                const isDone   = node.status === "done";
                const isActive = node.status === "active";
                const isLocked = node.status === "locked" && !isCert;
                const isSelected = activeNodeId === node.id;
                const isHovered  = hoveredId === node.id;

                const statusKey = isCert ? "active" : isDone ? "done" : isActive ? "active" : "locked";
                const pinColor = isCert ? "hsl(45, 90%, 55%)" : PIN_COLORS[statusKey];
                const pinGlow  = isCert ? "hsl(45, 90%, 55% / 0.6)" : PIN_GLOW[statusKey];

                // Pin sits above the road, pointing down to the road
                const pinH = isCert ? 56 : 48;
                const pinW = isCert ? 46 : 38;
                const pinY = y - pinH - 4; // top of pin above road point

                return (
                  <g key={node.id}
                    onClick={() => !isLocked && onSelectNode(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                  >
                    {/* Pulse ring for active/selected */}
                    {(isActive || isSelected) && !isCert && (
                      <circle cx={x} cy={y} r="16" fill="none" stroke={pinColor} strokeWidth="2" opacity="0.5">
                        <animate attributeName="r" values="14;24;14" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Certificate special glow */}
                    {isCert && (
                      <circle cx={x} cy={y} r="22" fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="2" opacity="0.4">
                        <animate attributeName="r" values="20;34;20" dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Map pin shape (teardrop) */}
                    <g filter={isHovered || isSelected ? "url(#pinGlow)" : "none"}>
                      {/* Pin shadow */}
                      <ellipse cx={x} cy={pinY + pinH + 2} rx={pinW * 0.3} ry={4} fill="rgba(0,0,0,0.4)" />
                      {/* Pin body */}
                      <path
                        d={`
                          M ${x} ${pinY + pinH}
                          C ${x - 2} ${pinY + pinH - 10}, ${x - pinW/2} ${pinY + pinH * 0.65}, ${x - pinW/2} ${pinY + pinH * 0.42}
                          A ${pinW/2} ${pinH * 0.45} 0 1 1 ${x + pinW/2} ${pinY + pinH * 0.42}
                          C ${x + pinW/2} ${pinY + pinH * 0.65}, ${x + 2} ${pinY + pinH - 10}, ${x} ${pinY + pinH}
                          Z
                        `}
                        fill={isLocked ? "hsl(215, 18%, 20%)" : pinColor}
                        stroke={isLocked ? "hsl(215, 20%, 30%)" : isSelected ? "white" : "rgba(255,255,255,0.2)"}
                        strokeWidth={isSelected ? "2" : "1"}
                        style={{
                          filter: isLocked ? "saturate(0) brightness(0.6)" : "none",
                          opacity: isHovered ? 1 : 0.92,
                          transition: "all 0.15s ease",
                          transform: isHovered && !isLocked ? `translate(0px, -4px)` : "none",
                        }}
                      />
                      {/* Pin inner highlight */}
                      <ellipse
                        cx={x - pinW * 0.12}
                        cy={pinY + pinH * 0.28}
                        rx={pinW * 0.18}
                        ry={pinH * 0.14}
                        fill="rgba(255,255,255,0.25)"
                        style={{ filter: isLocked ? "grayscale(1)" : "none" }}
                      />
                      {/* Pin icon/emoji */}
                      <text
                        x={x}
                        y={pinY + pinH * 0.47}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isCert ? 18 : 15}
                        style={{ filter: isLocked ? "grayscale(1) opacity(0.5)" : "none", userSelect: "none" }}
                      >
                        {isLocked ? "🔒" : node.icon}
                      </text>
                      {/* Done check badge */}
                      {isDone && (
                        <g>
                          <circle cx={x + pinW/2 - 2} cy={pinY + 4} r="7" fill="hsl(155, 60%, 40%)" stroke="hsl(155, 60%, 55%)" strokeWidth="1.5" />
                          <text x={x + pinW/2 - 2} y={pinY + 4} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">✓</text>
                        </g>
                      )}
                    </g>

                    {/* Road dot at node base */}
                    <circle cx={x} cy={y} r={isSelected ? 6 : 4}
                      fill={isLocked ? "hsl(215, 20%, 30%)" : pinColor}
                      stroke="hsl(215, 25%, 10%)" strokeWidth="2"
                      style={{ filter: !isLocked ? `drop-shadow(0 0 4px ${pinGlow})` : "none" }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* === TEXT LABELS (HTML for better typography) === */}
            {ROADMAP_NODES.map((node, index) => {
              const { x, y } = nodePos[index];
              const isCert   = isCertificate(node);
              const isDone   = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked" && !isCert;
              const isSelected = activeNodeId === node.id;
              const isAbove = y < midY; // node is above center → label goes below road
              const pinH = isCert ? 56 : 48;
              const labelY = isAbove
                ? y + 18          // below the road when pin is above
                : y - pinH - 62;  // above the pin when pin is below

              return (
                <div key={`label-${node.id}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: x,
                    top: labelY,
                    transform: "translateX(-50%)",
                    width: 90,
                    textAlign: "center",
                  }}
                >
                  <p className={`font-display text-xs font-bold leading-tight ${
                    isCert ? "text-[hsl(45_90%_65%)]"
                    : isDone || isActive || isSelected ? "text-foreground"
                    : "text-muted-foreground/90"
                  }`}
                    style={isCert ? { textShadow: "0 0 8px hsl(45 90% 55% / 0.5)" } : {}}>
                    {node.title}
                  </p>
                  <p className="text-xs font-body text-muted-foreground/85 mt-0.5 leading-tight">{node.subtitle}</p>
                </div>
              );
            })}

          </div>
        </div>
      </div>
    );
  }

  // ── VERTICAL MODE (default) — Road style ─────────────────────────────────
  const HEADER_H_V = 110;
  const ROW_H      = 100;          // px between node centres
  const totalH     = HEADER_H_V + ROADMAP_NODES.length * ROW_H + 60;
  const midX       = panelW / 2;
  const ampX       = Math.min(panelW * 0.28, 70); // horizontal swing

  // Each node's x,y centre
  const vNodePos = ROADMAP_NODES.map((node, i) => {
    const isCert = isCertificate(node);
    const y = HEADER_H_V + i * ROW_H + ROW_H / 2;
    const x = isCert ? midX : midX + (i % 2 === 0 ? -ampX : ampX);
    return { x, y };
  });

  // Build one continuous road path
  const vRoadPath = (() => {
    if (vNodePos.length === 0) return "";
    let d = `M ${vNodePos[0].x} ${vNodePos[0].y}`;
    for (let i = 1; i < vNodePos.length; i++) {
      const p0 = vNodePos[i - 1];
      const p1 = vNodePos[i];
      const dy = (p1.y - p0.y) * 0.5;
      d += ` C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
    }
    return d;
  })();

  // Per-segment paths for colouring
  const vSegments = ROADMAP_NODES.slice(1).map((node, i) => {
    const p0 = vNodePos[i];
    const p1 = vNodePos[i + 1];
    const dy = (p1.y - p0.y) * 0.5;
    const d = `M ${p0.x} ${p0.y} C ${p0.x} ${p0.y + dy}, ${p1.x} ${p1.y - dy}, ${p1.x} ${p1.y}`;
    const prev = ROADMAP_NODES[i];
    const lit = prev.status === "done" || prev.status === "active";
    return { d, lit, key: node.id };
  });

  const V_PIN_COLORS: Record<string, string> = {
    done:   "hsl(155 60% 42%)",
    active: "hsl(25 90% 55%)",
    locked: "hsl(215 20% 30%)",
    cert:   "hsl(45 90% 55%)",
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 108px)" }}
    >
      {/* Atmospheric glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 30% at 50% 10%, hsl(155 60% 45% / 0.07) 0%, transparent 70%)" }} />

      {/* Sticky header */}
      <div className="shrink-0 sticky top-0 z-10 px-4 pt-4 pb-3 bg-background/60 backdrop-blur-sm border-b border-border/30">
        <p className="text-xs font-accent font-semibold text-foreground/70 tracking-widest uppercase mb-0.5">Sua Jornada</p>
        <h2 className="font-display text-sm font-bold text-foreground leading-tight">
          Trilha <span className="text-primary" style={{ textShadow: "0 0 10px hsl(155 60% 45% / 0.6)" }}>Dev Full Stack</span>
        </h2>
        <div className="mt-2">
          <div className="flex justify-between text-xs font-accent text-muted-foreground mb-1">
            <span>Progresso</span><span className="text-primary font-bold">2 / 11</span>
          </div>
          <div className="h-0.5 rounded-full bg-secondary overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "18%" }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
              style={{ boxShadow: "0 0 6px hsl(155 60% 45% / 0.8)" }} />
          </div>
        </div>
      </div>

      {/* Scrollable road canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.3) transparent" }}>
        <div className="relative" style={{ height: totalH, width: "100%" }}>

          <svg className="absolute inset-0 pointer-events-none" width="100%" height={totalH}>
            <defs>
              <filter id="vRoadGlow" x="-30%" y="-10%" width="160%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="vPinGlow" x="-50%" y="-30%" width="200%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* ── ROAD SEGMENTS ── */}
            {vSegments.map(({ d, lit, key }) => (
              <g key={key}>
                {/* shadow */}
                <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
                {/* asphalt */}
                <path d={d} fill="none"
                  stroke={lit ? "hsl(155, 42%, 20%)" : "hsl(215, 18%, 13%)"}
                  strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                {/* edge glow */}
                <path d={d} fill="none"
                  stroke={lit ? "hsl(155, 60%, 38%)" : "hsl(215, 20%, 26%)"}
                  strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"
                  opacity="0.12" />
              </g>
            ))}

            {/* ── CENTER DASHED LINE ── */}
            <path d={vRoadPath} fill="none"
              stroke="hsl(215, 15%, 48%)" strokeWidth="1.5"
              strokeLinecap="round" strokeDasharray="10 8" opacity="0.4" />

            {/* Lit dashed overlay */}
            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <path key={`vdash-${key}`} d={d} fill="none"
                stroke="hsl(155, 60%, 48%)" strokeWidth="1.5"
                strokeLinecap="round" strokeDasharray="10 8" opacity="0.55" />
            ))}

            {/* ── ANIMATED PARTICLE ── */}
            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <circle key={`vdot-${key}`} r="3" fill="hsl(155, 70%, 62%)" filter="url(#vRoadGlow)" opacity="0.9">
                <animateMotion dur="3s" repeatCount="indefinite" path={d} />
              </circle>
            ))}

            {/* ── MAP PINS ── */}
            {ROADMAP_NODES.map((node, index) => {
              const { x, y } = vNodePos[index];
              const isCert   = isCertificate(node);
              const isDone   = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked" && !isCert;
              const isSelected = activeNodeId === node.id;
              const isHovered  = hoveredId === node.id;

              const pinColor = isCert ? V_PIN_COLORS.cert
                : isDone ? V_PIN_COLORS.done
                : isActive ? V_PIN_COLORS.active
                : V_PIN_COLORS.locked;

              // Pin points LEFT if node is on right side of road, RIGHT if on left
              const isOnRight = x > midX;
              const pinW = isCert ? 44 : 36;
              const pinH = isCert ? 54 : 46;
              // Pin hangs to the side, pointing inward to the road
              const pinX = isOnRight ? x + 10 : x - 10;
              const pinTop = y - pinH - 2;

              return (
                <g key={node.id}
                  onClick={() => !isLocked && onSelectNode(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                >
                  {/* Active pulse */}
                  {(isActive || isSelected) && !isCert && (
                    <circle cx={x} cy={y} r="13" fill="none" stroke={pinColor} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="12;22;12" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Cert pulse */}
                  {isCert && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="2" opacity="0.35">
                      <animate attributeName="r" values="18;32;18" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Module badge on first of module */}
                  {(index === 0 || ROADMAP_NODES[index - 1].module !== node.module) && !isCert && (
                    <text
                      x={isOnRight ? x - ampX - 4 : x + ampX + 4}
                      y={y - pinH / 2}
                      textAnchor={isOnRight ? "end" : "start"}
                      fontSize="8" fontFamily="monospace"
                      fill="hsl(155, 60%, 40%)" opacity="0.5"
                      fontWeight="bold" letterSpacing="2"
                    >
                      M{node.module}
                    </text>
                  )}

                  {/* Pin shadow */}
                  <ellipse cx={pinX} cy={pinTop + pinH + 3} rx={pinW * 0.28} ry={3.5} fill="rgba(0,0,0,0.45)" />

                  {/* Pin body */}
                  <g filter={isHovered || isSelected ? "url(#vPinGlow)" : "none"}
                    style={{ transition: "transform 0.15s ease", transform: isHovered && !isLocked ? `translate(0px, -5px)` : "none" }}>
                    <path
                      d={`
                        M ${pinX} ${pinTop + pinH}
                        C ${pinX - 2} ${pinTop + pinH - 10}, ${pinX - pinW/2} ${pinTop + pinH * 0.65}, ${pinX - pinW/2} ${pinTop + pinH * 0.42}
                        A ${pinW/2} ${pinH * 0.45} 0 1 1 ${pinX + pinW/2} ${pinTop + pinH * 0.42}
                        C ${pinX + pinW/2} ${pinTop + pinH * 0.65}, ${pinX + 2} ${pinTop + pinH - 10}, ${pinX} ${pinTop + pinH}
                        Z
                      `}
                      fill={isLocked ? "hsl(215, 18%, 18%)" : pinColor}
                      stroke={isSelected && !isCert ? "white" : isLocked ? "hsl(215, 20%, 28%)" : "rgba(255,255,255,0.18)"}
                      strokeWidth={isSelected ? "2" : "1"}
                      opacity={isLocked ? 0.6 : 1}
                    />
                    {/* Inner highlight */}
                    <ellipse
                      cx={pinX - pinW * 0.1}
                      cy={pinTop + pinH * 0.28}
                      rx={pinW * 0.18} ry={pinH * 0.14}
                      fill="rgba(255,255,255,0.22)"
                      style={{ filter: isLocked ? "grayscale(1)" : "none" }}
                    />
                    {/* Icon */}
                    <text x={pinX} y={pinTop + pinH * 0.46}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={isCert ? 17 : 14}
                      style={{ filter: isLocked ? "grayscale(1) opacity(0.5)" : "none", userSelect: "none" }}>
                      {isLocked ? "🔒" : node.icon}
                    </text>
                    {/* Done check */}
                    {isDone && (
                      <g>
                        <circle cx={pinX + pinW/2 - 2} cy={pinTop + 4} r="7"
                          fill="hsl(155, 60%, 38%)" stroke="hsl(155, 65%, 52%)" strokeWidth="1.5" />
                        <text x={pinX + pinW/2 - 2} y={pinTop + 4}
                          textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">✓</text>
                      </g>
                    )}
                  </g>

                  {/* Road anchor dot */}
                  <circle cx={x} cy={y} r={isSelected ? 6 : 4}
                    fill={isLocked ? "hsl(215, 20%, 28%)" : pinColor}
                    stroke="hsl(215, 25%, 9%)" strokeWidth="2"
                    style={{ filter: !isLocked ? `drop-shadow(0 0 5px ${pinColor})` : "none" }} />

                  {/* Connector line from dot to pin base */}
                  <line
                    x1={x} y1={y}
                    x2={pinX} y2={pinTop + pinH - 2}
                    stroke={isLocked ? "hsl(215, 20%, 28%)" : pinColor}
                    strokeWidth="1.5" opacity="0.5"
                    strokeDasharray="3 2"
                  />
                </g>
              );
            })}
          </svg>

          {/* ── HTML LABELS (sit opposite the pin) ── */}
          {ROADMAP_NODES.map((node, index) => {
            const { x, y } = vNodePos[index];
            const isCert   = isCertificate(node);
            const isDone   = node.status === "done";
            const isActive = node.status === "active";
            const isLocked = node.status === "locked" && !isCert;
            const isSelected = activeNodeId === node.id;
            const isOnRight = x > midX;
            const pinH = isCert ? 54 : 46;
            // Label on the opposite side from the pin
            const labelX = isOnRight ? x - ampX - 12 : x + ampX + 12;
            const labelW = 80;

            return (
              <div key={`vlabel-${node.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: isOnRight ? labelX - labelW : labelX,
                  top: y - pinH / 2 - 4,
                  width: labelW,
                  textAlign: isOnRight ? "right" : "left",
                }}
              >
                <p className={`font-display text-xs font-bold leading-tight ${
                  isCert ? "text-[hsl(45_90%_65%)]"
                  : isDone || isActive || isSelected ? "text-foreground"
                  : "text-muted-foreground/85"
                }`}
                  style={isCert ? { textShadow: "0 0 8px hsl(45 90% 55% / 0.5)" } : {}}>
                  {node.title}
                </p>
                <p className="text-xs font-body text-muted-foreground/85 mt-0.5 leading-tight">
                  {node.subtitle}
                </p>
              </div>
            );
          })}

          {/* ── WALKING AVATAR ── */}
          {!horizontal && avatarReady && (
            <motion.div
              animate={{
                left: avatarPos.x - 28,
                top: avatarPos.y - 80,
              }}
              transition={{ type: "spring", stiffness: 80, damping: 18, mass: 1.2 }}
              style={{
                position: "absolute",
                width: 56,
                height: 80,
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              {/* Shadow under avatar */}
              <div style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 32,
                height: 8,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
              }} />
              {/* Glow ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  bottom: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, hsl(25 90% 55% / 0.35) 0%, transparent 70%)",
                  filter: "blur(4px)",
                }}
              />
              {/* Pixel avatar image */}
              <motion.img
                src={AVATAR_IMG_SRC}
                alt="avatar"
                animate={{
                  scaleX: avatarFlip ? -1 : 1,
                  y: [0, -3, 0],
                }}
                transition={{
                  y: { duration: 0.55, repeat: Infinity, ease: "easeInOut" },
                  scaleX: { duration: 0.25 },
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                  filter: "drop-shadow(0 0 8px hsl(25 90% 55% / 0.7))",
                }}
              />
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── AI Chat Types ────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  ts: string;
}

const SUGGESTIONS = [
  "O que é uma closure em JavaScript?",
  "Como funciona o Git rebase?",
  "Explique REST vs GraphQL",
  "Qual a diferença entre == e === ?",
  "Como funciona async/await?",
  "O que é Docker e por que usar?",
];

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

const AIChatPanel = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Olá! Sou seu tutor de programação. Pergunte qualquer coisa sobre o conteúdo da trilha — lógica, algoritmos, Git, deploy e muito mais. 🚀",
      ts: "agora",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const history = messages
        .filter((m) => m.id !== 0)
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:
            "Você é um tutor especialista em programação e desenvolvimento Full Stack. Responda em português brasileiro, de forma clara, didática e amigável. Use exemplos de código quando for útil. Seja conciso mas completo. Contexto: o aluno está estudando uma trilha Dev Full Stack com módulos sobre: Introdução ao Mercado Tech, Fundamentos de Programação, Lógica e Algoritmos, Git & Versionamento, Deploy na Nuvem, Front-end (HTML/CSS), JavaScript ES6+, React, Back-end (Node.js/APIs), Banco de Dados e DevOps.",
          messages: [...history, { role: "user", content: trimmed }],
        }),
      });

      const data = await res.json();
      const reply = data.content?.map((b: { type: string; text?: string }) => b.text || "").join("") || "Desculpe, não consegui responder agora.";

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: reply,
        ts: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: "Erro ao conectar com a IA. Tente novamente.", ts: "agora" },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }} />
          <p className="text-xs font-accent font-semibold text-primary tracking-widest uppercase">Tutor IA Online</p>
        </div>
        <h2 className="font-display text-sm font-bold text-foreground">Pergunte à IA</h2>
        <p className="text-sm text-foreground/70 font-body mt-0.5">Tire dúvidas sobre qualquer conteúdo da trilha</p>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === 0 ? 0.2 : 0 }}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
              style={
                msg.role === "assistant"
                  ? { background: "radial-gradient(circle at 35% 35%, hsl(155 60% 45%), hsl(155 60% 25%))", color: "hsl(155 60% 95%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.4)" }
                  : { background: "hsl(215 25% 22%)", color: "hsl(215 50% 70%)", border: "1px solid hsl(215 25% 32%)" }
              }
            >
              {msg.role === "assistant" ? "IA" : "EU"}
            </div>

            {/* Bubble */}
            <div
              className="max-w-[80%] px-3 py-2 rounded-sm text-xs font-body leading-relaxed"
              style={
                msg.role === "assistant"
                  ? {
                      background: "hsl(215 25% 12%)",
                      border: "1px solid hsl(155 60% 45% / 0.2)",
                      color: "hsl(215 15% 85%)",
                      boxShadow: "0 0 8px hsl(155 60% 45% / 0.05)",
                    }
                  : {
                      background: "hsl(155 60% 20% / 0.4)",
                      border: "1px solid hsl(155 60% 45% / 0.3)",
                      color: "hsl(155 30% 90%)",
                    }
              }
            >
              <pre className="whitespace-pre-wrap font-body text-xs leading-relaxed" style={{ fontFamily: "inherit" }}>
                {msg.text}
              </pre>
              <p className="text-xs text-muted-foreground/90 mt-1 text-right">{msg.ts}</p>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
              style={{ background: "radial-gradient(circle at 35% 35%, hsl(155 60% 45%), hsl(155 60% 25%))", color: "hsl(155 60% 95%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.4)" }}>
              IA
            </div>
            <div className="px-3 py-2.5 rounded-sm flex items-center gap-1.5"
              style={{ background: "hsl(215 25% 12%)", border: "1px solid hsl(155 60% 45% / 0.2)" }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="shrink-0 px-3 pb-2">
          <p className="text-xs font-accent text-foreground/65 uppercase tracking-widest mb-2">Sugestões</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs font-body px-2 py-1 rounded-sm border border-border/60 text-foreground/65 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border/40">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Digite sua dúvida... (Enter para enviar)"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-sm bg-input border border-border text-foreground font-body text-xs focus:outline-none focus:border-primary/60 transition resize-none disabled:opacity-50"
            style={{ minHeight: 36, maxHeight: 80 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 rounded-sm flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition"
            style={{ boxShadow: input.trim() ? "0 0 10px hsl(155 60% 45% / 0.4)" : "none" }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("aula");
  const [activeNodeId, setActiveNodeId] = useState(3);
  const [showChat, setShowChat] = useState(true);
  const [showCourses, setShowCourses] = useState(true);

  const chatColRef = useRef<HTMLDivElement>(null);
  const coursesColRef = useRef<HTMLDivElement>(null);
  const onlyRoadmap = !showChat && !showCourses;
  const columnHeight = "calc(100vh - 152px)";

  return (
    <div className="min-h-screen gradient-hero scanline flex flex-col" style={{ paddingTop: 64 }}>
      <Header />

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border/50 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/perfil"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-body transition"
          >
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-accent text-muted-foreground tracking-widest uppercase hidden sm:block">Módulo 1 · Fundamentos</span>
          <span className="text-muted-foreground/85 hidden sm:block">·</span>
          <h1 className="font-display text-sm font-bold text-foreground">
            Trilha <span className="text-primary" style={{ textShadow: "0 0 12px hsl(155 60% 45% / 0.5)" }}>Dev Full Stack</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden divide-x divide-border/30">

        {/* COL 1 — AI Chat */}
        <AnimatePresence initial={false}>
          {showChat && (
            <motion.div
              key="chat-col"
              ref={chatColRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: onlyRoadmap ? 0 : "33.333%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex flex-col bg-background/10 backdrop-blur-sm overflow-hidden shrink-0"
              style={{ minWidth: 0 }}
            >
              <div style={{ height: columnHeight, minWidth: 280 }}>
                <AIChatPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COL 2 — Roadmap (always visible, adapts orientation) */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col bg-background/15 backdrop-blur-sm overflow-hidden"
          style={{ flex: 1, minWidth: 0 }}
        >
          <div style={{ height: columnHeight }}>
            <RoadmapPanel
              activeNodeId={activeNodeId}
              onSelectNode={(id) => { setActiveNodeId(id); setActiveTab("aula"); }}
              horizontal={onlyRoadmap}
            />
          </div>
        </motion.div>

        {/* COL 3 — Course content */}
        <AnimatePresence initial={false}>
          {showCourses && (
            <motion.div
              key="courses-col"
              ref={coursesColRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "33.333%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex flex-col bg-background/10 backdrop-blur-sm overflow-hidden shrink-0"
              style={{ minWidth: 0 }}
            >
              <div
                className="overflow-y-auto px-4 py-4"
                style={{ height: columnHeight, minWidth: 280, scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}
              >
                {/* Tab bar */}
                <div className="flex gap-1.5 mb-5 flex-wrap">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-accent font-semibold transition-all
                        ${activeTab === tab.id
                          ? "bg-primary/15 text-primary border border-primary/50"
                          : "text-foreground/65 border border-border hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                        }`}
                      style={activeTab === tab.id ? { boxShadow: "0 0 10px hsl(155 60% 45% / 0.25)" } : {}}
                    >
                      {tab.icon}
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.span
                          layoutId="tab-ul"
                          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-primary"
                          style={{ boxShadow: "0 0 5px hsl(155 60% 45%)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === "aula" && <AulaTab activeLesson={activeNodeId <= 3 ? activeNodeId : 3} />}
                    {activeTab === "questionario" && <QuestionarioTab />}
                    {activeTab === "duvidas" && <DuvidasTab />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Floating column toggle buttons (teardrop shape) ── */}

      {/* Botão IA — gota com raiz plana na esquerda, ponta para direita */}
      <motion.button
        onClick={() => setShowChat((v) => !v)}
        title={showChat ? "Ocultar Tutor IA" : "Mostrar Tutor IA"}
        animate={{ left: showChat ? "33.333%" : "0px" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 cursor-pointer border-0 p-0"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          width: 28,
          height: 72,
          background: "none",
          filter: showChat
            ? "drop-shadow(3px 0 10px hsl(155 60% 45% / 0.55))"
            : "drop-shadow(3px 0 7px hsl(0 0% 0% / 0.55))",
        }}
      >
        <svg width="28" height="72" viewBox="0 0 28 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          {/* Raiz plana na esquerda, curva suave até a ponta na direita — forma de gota real */}
          <path d="M0 0 L10 0 C22 0 28 10 28 36 C28 62 22 72 10 72 L0 72 Z"
            fill={showChat ? "hsl(215 28% 8%)" : "hsl(215 24% 10%)"}
          />
          <path d="M0 0 L10 0 C22 0 28 10 28 36 C28 62 22 72 10 72 L0 72"
            stroke={showChat ? "hsl(155 60% 45% / 0.7)" : "hsl(215 20% 28%)"}
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <div className="relative z-10 flex items-center justify-center w-full h-full" style={{ paddingLeft: 2 }}>
          <span style={{ fontSize: 13, color: showChat ? "hsl(155 60% 65%)" : "hsl(155 50% 50%)", lineHeight: 1 }}>
            {showChat ? "‹" : "›"}
          </span>
        </div>
      </motion.button>

      {/* Botão Aulas — gota com raiz plana na direita, ponta para esquerda */}
      <motion.button
        onClick={() => setShowCourses((v) => !v)}
        title={showCourses ? "Ocultar Aulas" : "Mostrar Aulas"}
        animate={{ right: showCourses ? "33.333%" : "0px" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 cursor-pointer border-0 p-0"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          width: 28,
          height: 72,
          background: "none",
          filter: showCourses
            ? "drop-shadow(-3px 0 10px hsl(155 60% 45% / 0.55))"
            : "drop-shadow(-3px 0 7px hsl(0 0% 0% / 0.55))",
        }}
      >
        <svg width="28" height="72" viewBox="0 0 28 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          {/* Raiz plana na direita, curva suave até a ponta na esquerda */}
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72 Z"
            fill={showCourses ? "hsl(215 28% 8%)" : "hsl(215 24% 10%)"}
          />
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72"
            stroke={showCourses ? "hsl(155 60% 45% / 0.7)" : "hsl(215 20% 28%)"}
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <div className="relative z-10 flex items-center justify-center w-full h-full" style={{ paddingRight: 2 }}>
          <span style={{ fontSize: 13, color: showCourses ? "hsl(155 60% 65%)" : "hsl(155 50% 50%)", lineHeight: 1 }}>
            {showCourses ? "›" : "‹"}
          </span>
        </div>
      </motion.button>

    </div>
  );
};

export default CoursesPage;