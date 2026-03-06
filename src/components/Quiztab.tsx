import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

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
    options: ["Docker", "Figma", "Git", "Postman"],
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
      "Interface Avançada de Programação",
      "Integração de Protocolo de Aplicação",
      "Interface de Programação de Aplicações",
      "Instrução de Processo Automatizado",
    ],
    correct: 2,
  },
  {
    id: 16,
    text: "Qual das seguintes linguagens é mais usada para estilização de páginas web?",
    options: ["Python", "CSS", "SQL", "Java"],
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
const PASS_THRESHOLD = 0.75;

const pickRandomQuestions = (): Question[] =>
  shuffleArray(ALL_QUESTIONS).slice(0, QUESTIONS_PER_QUIZ);

// ─── Component ────────────────────────────────────────────────────────────────

const QuizTab = () => {
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

  // ── Result screen ──────────────────────────────────────────────────────────
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
              style={{
                color: "hsl(155 60% 45%)",
                filter: "drop-shadow(0 0 16px hsl(155 60% 45% / 0.7))",
              }}
            />
          ) : (
            <motion.div
              animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ClipboardList
                size={56}
                className="mx-auto"
                style={{
                  color: "hsl(25 90% 55%)",
                  filter: "drop-shadow(0 0 16px hsl(25 90% 55% / 0.6))",
                }}
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
            Tentativa{" "}
            <span className="text-accent font-semibold">#{attempt}</span> — As
            questões foram embaralhadas para você.
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
              background: passed ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)",
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
            style={{
              left: "75%",
              transform: "translateY(-10px)",
              height: "20px",
            }}
          />
          <span
            className="absolute text-xs font-accent text-primary/70"
            style={{
              left: "75%",
              transform: "translateX(-50%) translateY(-22px)",
            }}
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
            As questões serão apresentadas em ordem aleatória na próxima
            tentativa.
          </p>
        )}
      </motion.div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent text-muted-foreground">
          Questão{" "}
          <span className="text-primary font-semibold">{current + 1}</span> /{" "}
          {queue.length}
          {attempt > 1 && (
            <span className="ml-2 text-accent">· Tentativa #{attempt}</span>
          )}
        </span>
        <span className="text-xs font-accent text-muted-foreground">
          Acertos:{" "}
          <span className="text-primary font-semibold">{score}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          animate={{ width: `${(current / queue.length) * 100}%` }}
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
          <h3 className="font-display text-base font-bold text-foreground leading-snug">
            {q.text}
          </h3>

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
                    <span
                      className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center text-xs font-accent font-bold
                        ${state === "selected" ? "border-primary text-primary" : ""}
                        ${state === "correct" ? "border-[hsl(155_60%_45%)] text-[hsl(155_60%_45%)]" : ""}
                        ${state === "wrong" ? "border-destructive text-destructive" : "border-border text-muted-foreground"}
                      `}
                    >
                      {["A", "B", "C", "D"][idx]}
                    </span>
                    {opt}
                    {state === "correct" && (
                      <CheckCircle2
                        size={14}
                        className="ml-auto text-[hsl(155_60%_45%)]"
                      />
                    )}
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
                style={{
                  boxShadow:
                    selected !== null
                      ? "0 0 12px hsl(155 60% 45% / 0.4)"
                      : "none",
                }}
              >
                Confirmar
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold box-glow-accent hover:brightness-110 transition"
              >
                {current + 1 >= queue.length ? "Ver Resultado" : "Próxima"}{" "}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizTab;