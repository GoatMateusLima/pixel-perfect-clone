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

      {/* Mini lesson list for mobile */}
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

        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {passed ? "Parabéns! Você passou! 🎉" : "Quase lá! Tente novamente"}
        </h2>

        <p className="text-muted-foreground font-body text-sm mb-2">
          Você acertou{" "}
          <span className="text-primary font-semibold">{score}</span> de{" "}
          <span className="font-semibold">{queue.length}</span> questões —{" "}
          <span className="font-bold text-base" style={{ color: passed ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)" }}>
            {pct}%
          </span>
        </p>

        <p className="text-xs text-muted-foreground font-accent mb-1">
          Mínimo para aprovação:{" "}
          <span className={passed ? "text-primary" : "text-accent"}>75%</span>
        </p>

        {attempt > 1 && !passed && (
          <p className="text-xs text-muted-foreground font-body mb-1">
            Tentativa <span className="text-accent font-semibold">#{attempt}</span> — As questões foram embaralhadas para você.
          </p>
        )}

        <div className="my-5 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: passed ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)",
              boxShadow: passed ? "0 0 10px hsl(155 60% 45% / 0.6)" : "0 0 10px hsl(25 90% 55% / 0.6)",
            }}
          />
        </div>

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

      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          animate={{ width: `${((current) / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full bg-primary"
          style={{ boxShadow: "0 0 8px hsl(155 60% 45% / 0.5)" }}
        />
      </div>

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
  xOffset: number;
  module: number;
}

const ROADMAP_NODES: RoadmapNode[] = [
  { id: 1, title: "Mercado Tech", subtitle: "Introdução", icon: "🌐", status: "done", xOffset: 0, module: 1 },
  { id: 2, title: "Fundamentos", subtitle: "Programação", icon: "💡", status: "done", xOffset: 1, module: 1 },
  { id: 3, title: "Lógica", subtitle: "Algoritmos", icon: "🧠", status: "active", xOffset: -1, module: 1 },
  { id: 4, title: "Git", subtitle: "Versionamento", icon: "🔀", status: "locked", xOffset: 0, module: 2 },
  { id: 5, title: "Deploy", subtitle: "Nuvem", icon: "☁️", status: "locked", xOffset: 1, module: 2 },
  { id: 6, title: "Front-end", subtitle: "HTML & CSS", icon: "🎨", status: "locked", xOffset: -1, module: 2 },
  { id: 7, title: "JavaScript", subtitle: "ES6+", icon: "⚡", status: "locked", xOffset: 0, module: 3 },
  { id: 8, title: "React", subtitle: "Componentes", icon: "⚛️", status: "locked", xOffset: 1, module: 3 },
  { id: 9, title: "Back-end", subtitle: "Node.js & APIs", icon: "🔧", status: "locked", xOffset: -1, module: 3 },
  { id: 10, title: "Banco de Dados", subtitle: "SQL & NoSQL", icon: "🗄️", status: "locked", xOffset: 0, module: 4 },
  { id: 11, title: "DevOps", subtitle: "CI/CD & Docker", icon: "🐳", status: "locked", xOffset: 1, module: 4 },
  { id: 12, title: "Certificado", subtitle: "Full Stack Dev", icon: "🏆", status: "locked", xOffset: 0, module: 5 },
];

// ─── Roadmap Component ────────────────────────────────────────────────────────

const RoadmapPanel = ({ activeNodeId, onSelectNode, horizontal = false }: { activeNodeId: number; onSelectNode: (id: number) => void; horizontal?: boolean }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelW, setPanelW] = useState(220);
  const [panelH, setPanelH] = useState(600);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setPanelW(el.clientWidth); setPanelH(el.clientHeight); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isCertificate = (node: RoadmapNode) => node.id === 12;

  if (horizontal) {
    const HEADER_H = 72;
    const canvasH = panelH - HEADER_H;
    const N = ROADMAP_NODES.length;
    const stepX = Math.max(110, panelW / (N - 1 + 1.5));
    const totalW = Math.max(panelW, stepX * (N + 0.5));
    const midY = canvasH * 0.5;
    const amp = Math.min(canvasH * 0.28, 90);

    const nodePos = ROADMAP_NODES.map((node, i) => {
      const isCert = isCertificate(node);
      const x = 60 + i * stepX;
      const y = isCert ? midY : midY + (i % 2 === 0 ? -amp : amp);
      return { x, y };
    });

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

    const PIN_COLORS: Record<string, string> = {
      done: "hsl(155 60% 45%)",
      active: "hsl(25 90% 55%)",
      locked: "hsl(215 20% 35%)",
    };
    const PIN_GLOW: Record<string, string> = {
      done: "hsl(155 60% 45% / 0.6)",
      active: "hsl(25 90% 55% / 0.6)",
      locked: "transparent",
    };

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden flex flex-col">
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

        <div
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.3) transparent" }}
        >
          <div className="relative" style={{ width: totalW, height: canvasH }}>
            <svg className="absolute inset-0 pointer-events-none" width={totalW} height={canvasH} style={{ overflow: "visible" }}>
              <defs>
                <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="pinGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {segmentPaths.map(({ d, lit, key }) => (
                <g key={key}>
                  <path d={d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={lit ? "hsl(155, 45%, 22%)" : "hsl(215, 18%, 14%)"} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={lit ? "hsl(155, 55%, 40%)" : "hsl(215, 20%, 28%)"} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: "screen", opacity: 0.15 }} />
                </g>
              ))}

              <path d={roadPath} fill="none" stroke="hsl(215, 15%, 50%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.45" />

              {segmentPaths.filter(s => s.lit).map(({ d, key }) => (
                <path key={`dash-${key}`} d={d} fill="none" stroke="hsl(155, 60%, 50%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.6" />
              ))}

              {segmentPaths.filter(s => s.lit).map(({ d, key }) => (
                <circle key={`dot-${key}`} r="3" fill="hsl(155, 70%, 60%)" filter="url(#roadGlow)" opacity="0.9">
                  <animateMotion dur="3s" repeatCount="indefinite" path={d} />
                </circle>
              ))}

              {ROADMAP_NODES.map((node, index) => {
                const { x, y } = nodePos[index];
                const isCert = isCertificate(node);
                const isDone = node.status === "done";
                const isActive = node.status === "active";
                const isLocked = node.status === "locked" && !isCert;
                const isSelected = activeNodeId === node.id;
                const isHovered = hoveredId === node.id;
                const statusKey = isCert ? "active" : isDone ? "done" : isActive ? "active" : "locked";
                const pinColor = isCert ? "hsl(45, 90%, 55%)" : PIN_COLORS[statusKey];
                const pinGlow = isCert ? "hsl(45, 90%, 55% / 0.6)" : PIN_GLOW[statusKey];
                const pinH = isCert ? 56 : 48;
                const pinW = isCert ? 46 : 38;
                const pinY = y - pinH - 4;

                return (
                  <g key={node.id}
                    onClick={() => !isLocked && onSelectNode(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                  >
                    {(isActive || isSelected) && !isCert && (
                      <circle cx={x} cy={y} r="16" fill="none" stroke={pinColor} strokeWidth="2" opacity="0.5">
                        <animate attributeName="r" values="14;24;14" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {isCert && (
                      <circle cx={x} cy={y} r="22" fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="2" opacity="0.4">
                        <animate attributeName="r" values="20;34;20" dur="2.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <g filter={isHovered || isSelected ? "url(#pinGlow)" : "none"}>
                      <ellipse cx={x} cy={pinY + pinH + 2} rx={pinW * 0.3} ry={4} fill="rgba(0,0,0,0.4)" />
                      <path
                        d={`M ${x} ${pinY + pinH} C ${x - 2} ${pinY + pinH - 10}, ${x - pinW / 2} ${pinY + pinH * 0.65}, ${x - pinW / 2} ${pinY + pinH * 0.42} A ${pinW / 2} ${pinH * 0.45} 0 1 1 ${x + pinW / 2} ${pinY + pinH * 0.42} C ${x + pinW / 2} ${pinY + pinH * 0.65}, ${x + 2} ${pinY + pinH - 10}, ${x} ${pinY + pinH} Z`}
                        fill={isLocked ? "hsl(215, 18%, 20%)" : pinColor}
                        stroke={isLocked ? "hsl(215, 20%, 30%)" : isSelected ? "white" : "rgba(255,255,255,0.2)"}
                        strokeWidth={isSelected ? "2" : "1"}
                        style={{ filter: isLocked ? "saturate(0) brightness(0.6)" : "none", opacity: isHovered ? 1 : 0.92, transition: "all 0.15s ease" }}
                      />
                      <ellipse cx={x - pinW * 0.12} cy={pinY + pinH * 0.28} rx={pinW * 0.18} ry={pinH * 0.14} fill="rgba(255,255,255,0.25)" />
                      <text x={x} y={pinY + pinH * 0.47} textAnchor="middle" dominantBaseline="middle" fontSize={isCert ? 18 : 15} style={{ filter: isLocked ? "grayscale(1) opacity(0.5)" : "none", userSelect: "none" }}>
                        {isLocked ? "🔒" : node.icon}
                      </text>
                      {isDone && (
                        <g>
                          <circle cx={x + pinW / 2 - 2} cy={pinY + 4} r="7" fill="hsl(155, 60%, 40%)" stroke="hsl(155, 60%, 55%)" strokeWidth="1.5" />
                          <text x={x + pinW / 2 - 2} y={pinY + 4} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">✓</text>
                        </g>
                      )}
                    </g>
                    <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={isLocked ? "hsl(215, 20%, 30%)" : pinColor} stroke="hsl(215, 25%, 10%)" strokeWidth="2" style={{ filter: !isLocked ? `drop-shadow(0 0 4px ${pinGlow})` : "none" }} />
                  </g>
                );
              })}
            </svg>

            {ROADMAP_NODES.map((node, index) => {
              const { x, y } = nodePos[index];
              const isCert = isCertificate(node);
              const isDone = node.status === "done";
              const isActive = node.status === "active";
              const isSelected = activeNodeId === node.id;
              const isAbove = y < midY;
              const pinH = isCert ? 56 : 48;
              const labelY = isAbove ? y + 18 : y - pinH - 62;

              return (
                <div key={`label-${node.id}`} className="absolute pointer-events-none"
                  style={{ left: x, top: labelY, transform: "translateX(-50%)", width: 90, textAlign: "center" }}>
                  <p className={`font-display text-xs font-bold leading-tight ${isCert ? "text-[hsl(45_90%_65%)]" : isDone || isActive || isSelected ? "text-foreground" : "text-muted-foreground/90"}`}
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

  // ── VERTICAL MODE ─────────────────────────────────────────────────────────
  const HEADER_H_V = 110;
  const ROW_H = 100;
  const totalH = HEADER_H_V + ROADMAP_NODES.length * ROW_H + 60;
  const midX = panelW / 2;
  const ampX = Math.min(panelW * 0.28, 70);

  const vNodePos = ROADMAP_NODES.map((node, i) => {
    const isCert = isCertificate(node);
    const y = HEADER_H_V + i * ROW_H + ROW_H / 2;
    const x = isCert ? midX : midX + (i % 2 === 0 ? -ampX : ampX);
    return { x, y };
  });

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
    done: "hsl(155 60% 42%)",
    active: "hsl(25 90% 55%)",
    locked: "hsl(215 20% 30%)",
    cert: "hsl(45 90% 55%)",
  };

  return (
    <div ref={containerRef} className="relative flex flex-col overflow-hidden" style={{ height: "calc(100vh - 108px)" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 30% at 50% 10%, hsl(155 60% 45% / 0.07) 0%, transparent 70%)" }} />

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

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.3) transparent" }}>
        <div className="relative" style={{ height: totalH, width: "100%" }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height={totalH}>
            <defs>
              <filter id="vRoadGlow" x="-30%" y="-10%" width="160%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="vPinGlow" x="-50%" y="-30%" width="200%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {vSegments.map(({ d, lit, key }) => (
              <g key={key}>
                <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lit ? "hsl(155, 42%, 20%)" : "hsl(215, 18%, 13%)"} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={lit ? "hsl(155, 60%, 38%)" : "hsl(215, 20%, 26%)"} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
              </g>
            ))}

            <path d={vRoadPath} fill="none" stroke="hsl(215, 15%, 48%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.4" />

            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <path key={`vdash-${key}`} d={d} fill="none" stroke="hsl(155, 60%, 48%)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="10 8" opacity="0.55" />
            ))}

            {vSegments.filter(s => s.lit).map(({ d, key }) => (
              <circle key={`vdot-${key}`} r="3" fill="hsl(155, 70%, 62%)" filter="url(#vRoadGlow)" opacity="0.9">
                <animateMotion dur="3s" repeatCount="indefinite" path={d} />
              </circle>
            ))}

            {ROADMAP_NODES.map((node, index) => {
              const { x, y } = vNodePos[index];
              const isCert = isCertificate(node);
              const isDone = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked" && !isCert;
              const isSelected = activeNodeId === node.id;
              const isHovered = hoveredId === node.id;
              const pinColor = isCert ? V_PIN_COLORS.cert : isDone ? V_PIN_COLORS.done : isActive ? V_PIN_COLORS.active : V_PIN_COLORS.locked;
              const isOnRight = x > midX;
              const pinW = isCert ? 44 : 36;
              const pinH = isCert ? 54 : 46;
              const pinX = isOnRight ? x + 10 : x - 10;
              const pinTop = y - pinH - 2;

              return (
                <g key={node.id}
                  onClick={() => !isLocked && onSelectNode(node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                >
                  {(isActive || isSelected) && !isCert && (
                    <circle cx={x} cy={y} r="13" fill="none" stroke={pinColor} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="12;22;12" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isCert && (
                    <circle cx={x} cy={y} r="20" fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth="2" opacity="0.35">
                      <animate attributeName="r" values="18;32;18" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {(index === 0 || ROADMAP_NODES[index - 1].module !== node.module) && !isCert && (
                    <text x={isOnRight ? x - ampX - 4 : x + ampX + 4} y={y - pinH / 2} textAnchor={isOnRight ? "end" : "start"} fontSize="8" fontFamily="monospace" fill="hsl(155, 60%, 40%)" opacity="0.5" fontWeight="bold" letterSpacing="2">
                      M{node.module}
                    </text>
                  )}
                  <ellipse cx={pinX} cy={pinTop + pinH + 3} rx={pinW * 0.28} ry={3.5} fill="rgba(0,0,0,0.45)" />
                  <g filter={isHovered || isSelected ? "url(#vPinGlow)" : "none"}
                    style={{ transition: "transform 0.15s ease", transform: isHovered && !isLocked ? `translate(0px, -5px)` : "none" }}>
                    <path
                      d={`M ${pinX} ${pinTop + pinH} C ${pinX - 2} ${pinTop + pinH - 10}, ${pinX - pinW / 2} ${pinTop + pinH * 0.65}, ${pinX - pinW / 2} ${pinTop + pinH * 0.42} A ${pinW / 2} ${pinH * 0.45} 0 1 1 ${pinX + pinW / 2} ${pinTop + pinH * 0.42} C ${pinX + pinW / 2} ${pinTop + pinH * 0.65}, ${pinX + 2} ${pinTop + pinH - 10}, ${pinX} ${pinTop + pinH} Z`}
                      fill={isLocked ? "hsl(215, 18%, 18%)" : pinColor}
                      stroke={isSelected && !isCert ? "white" : isLocked ? "hsl(215, 20%, 28%)" : "rgba(255,255,255,0.18)"}
                      strokeWidth={isSelected ? "2" : "1"}
                      opacity={isLocked ? 0.6 : 1}
                    />
                    <ellipse cx={pinX - pinW * 0.1} cy={pinTop + pinH * 0.28} rx={pinW * 0.18} ry={pinH * 0.14} fill="rgba(255,255,255,0.22)" style={{ filter: isLocked ? "grayscale(1)" : "none" }} />
                    <text x={pinX} y={pinTop + pinH * 0.46} textAnchor="middle" dominantBaseline="middle" fontSize={isCert ? 17 : 14} style={{ filter: isLocked ? "grayscale(1) opacity(0.5)" : "none", userSelect: "none" }}>
                      {isLocked ? "🔒" : node.icon}
                    </text>
                    {isDone && (
                      <g>
                        <circle cx={pinX + pinW / 2 - 2} cy={pinTop + 4} r="7" fill="hsl(155, 60%, 38%)" stroke="hsl(155, 65%, 52%)" strokeWidth="1.5" />
                        <text x={pinX + pinW / 2 - 2} y={pinTop + 4} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="white">✓</text>
                      </g>
                    )}
                  </g>
                  <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={isLocked ? "hsl(215, 20%, 28%)" : pinColor} stroke="hsl(215, 25%, 9%)" strokeWidth="2" style={{ filter: !isLocked ? `drop-shadow(0 0 5px ${pinColor})` : "none" }} />
                  <line x1={x} y1={y} x2={pinX} y2={pinTop + pinH - 2} stroke={isLocked ? "hsl(215, 20%, 28%)" : pinColor} strokeWidth="1.5" opacity="0.5" strokeDasharray="3 2" />
                </g>
              );
            })}
          </svg>

          {ROADMAP_NODES.map((node, index) => {
            const { x, y } = vNodePos[index];
            const isCert = isCertificate(node);
            const isDone = node.status === "done";
            const isActive = node.status === "active";
            const isSelected = activeNodeId === node.id;
            const isOnRight = x > midX;
            const pinH = isCert ? 54 : 46;
            const labelX = isOnRight ? x - ampX - 12 : x + ampX + 12;
            const labelW = 80;

            return (
              <div key={`vlabel-${node.id}`} className="absolute pointer-events-none"
                style={{ left: isOnRight ? labelX - labelW : labelX, top: y - pinH / 2 - 4, width: labelW, textAlign: isOnRight ? "right" : "left" }}>
                <p className={`font-display text-xs font-bold leading-tight ${isCert ? "text-[hsl(45_90%_65%)]" : isDone || isActive || isSelected ? "text-foreground" : "text-muted-foreground/85"}`}
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

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

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

      const systemPrompt =
        "Você é um tutor especialista em programação e desenvolvimento Full Stack. Responda em português brasileiro, de forma clara, didática e amigável. Use exemplos de código quando for útil. Seja conciso mas completo. Contexto: o aluno está estudando uma trilha Dev Full Stack com módulos sobre: Introdução ao Mercado Tech, Fundamentos de Programação, Lógica e Algoritmos, Git & Versionamento, Deploy na Nuvem, Front-end (HTML/CSS), JavaScript ES6+, React, Back-end (Node.js/APIs), Banco de Dados e DevOps.";

      const geminiHistory = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido! Estou pronto para ajudar." }] },
        ...history.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content as string }],
        })),
        { role: "user", parts: [{ text: trimmed }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: geminiHistory }),
        }
      );

      const data = await res.json();

      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.error?.message ||
        "Desculpe, não consegui responder agora.";

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
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }} />
          <p className="text-xs font-accent font-semibold text-primary tracking-widest uppercase">Tutor IA Online</p>
        </div>
        <h2 className="font-display text-sm font-bold text-foreground">Pergunte à IA</h2>
        <p className="text-sm text-foreground/70 font-body mt-0.5">Tire dúvidas sobre qualquer conteúdo da trilha</p>
      </div>

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

            <div
              className="max-w-[80%] px-3 py-2 rounded-sm text-xs font-body leading-relaxed"
              style={
                msg.role === "assistant"
                  ? { background: "hsl(215 25% 12%)", border: "1px solid hsl(155 60% 45% / 0.2)", color: "hsl(215 15% 85%)", boxShadow: "0 0 8px hsl(155 60% 45% / 0.05)" }
                  : { background: "hsl(155 60% 20% / 0.4)", border: "1px solid hsl(155 60% 45% / 0.3)", color: "hsl(155 30% 90%)" }
              }
            >
              <pre className="whitespace-pre-wrap font-body text-xs leading-relaxed" style={{ fontFamily: "inherit" }}>
                {msg.text}
              </pre>
              <p className="text-xs text-muted-foreground/90 mt-1 text-right">{msg.ts}</p>
            </div>
          </motion.div>
        ))}

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

      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border/50 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-body transition">
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
        <div className="flex items-center gap-3" />
      </div>

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

        {/* COL 2 — Roadmap */}
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

      {/* Botão IA */}
      <motion.button
        onClick={() => setShowChat((v) => !v)}
        title={showChat ? "Ocultar Tutor IA" : "Mostrar Tutor IA"}
        animate={{ left: showChat ? "33.333%" : "0px" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 cursor-pointer border-0 p-0"
        style={{ top: "50%", transform: "translateY(-50%)", width: 28, height: 72, background: "none", filter: showChat ? "drop-shadow(3px 0 10px hsl(155 60% 45% / 0.55))" : "drop-shadow(3px 0 7px hsl(0 0% 0% / 0.55))" }}
      >
        <svg width="28" height="72" viewBox="0 0 28 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          <path d="M0 0 L10 0 C22 0 28 10 28 36 C28 62 22 72 10 72 L0 72 Z" fill={showChat ? "hsl(215 28% 8%)" : "hsl(215 24% 10%)"} />
          <path d="M0 0 L10 0 C22 0 28 10 28 36 C28 62 22 72 10 72 L0 72" stroke={showChat ? "hsl(155 60% 45% / 0.7)" : "hsl(215 20% 28%)"} strokeWidth="1" fill="none" />
        </svg>
        <div className="relative z-10 flex items-center justify-center w-full h-full" style={{ paddingLeft: 2 }}>
          <span style={{ fontSize: 13, color: showChat ? "hsl(155 60% 65%)" : "hsl(155 50% 50%)", lineHeight: 1 }}>
            {showChat ? "‹" : "›"}
          </span>
        </div>
      </motion.button>

      {/* Botão Aulas */}
      <motion.button
        onClick={() => setShowCourses((v) => !v)}
        title={showCourses ? "Ocultar Aulas" : "Mostrar Aulas"}
        animate={{ right: showCourses ? "33.333%" : "0px" }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 cursor-pointer border-0 p-0"
        style={{ top: "50%", transform: "translateY(-50%)", width: 28, height: 72, background: "none", filter: showCourses ? "drop-shadow(-3px 0 10px hsl(155 60% 45% / 0.55))" : "drop-shadow(-3px 0 7px hsl(0 0% 0% / 0.55))" }}
      >
        <svg width="28" height="72" viewBox="0 0 28 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72 Z" fill={showCourses ? "hsl(215 28% 8%)" : "hsl(215 24% 10%)"} />
          <path d="M28 0 L18 0 C6 0 0 10 0 36 C0 62 6 72 18 72 L28 72" stroke={showCourses ? "hsl(155 60% 45% / 0.7)" : "hsl(215 20% 28%)"} strokeWidth="1" fill="none" />
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
