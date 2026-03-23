import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

interface QuizTabProps {
  questions?: QuizQuestion[];
  onPass?: () => void;
  loading?: boolean;
}

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  { id: 1, text: "Qual das alternativas descreve melhor um algoritmo?", options: ["Um programa de computador pronto", "Uma sequência finita de instruções para resolver um problema", "Uma linguagem de programação específica", "Um banco de dados estruturado"], correct: 1 },
  { id: 2, text: "O que é versionamento de código?", options: ["Nomear arquivos com datas", "Controlar e registrar alterações ao longo do tempo", "Compactar arquivos para economizar espaço", "Converter código entre linguagens"], correct: 1 },
  { id: 3, text: "Em programação, o que significa 'debug'?", options: ["Escrever código novo do zero", "Executar o programa mais rápido", "Encontrar e corrigir erros no código", "Publicar o software na internet"], correct: 2 },
  { id: 4, text: "O que é uma variável em programação?", options: ["Um tipo de loop que se repete infinitamente", "Um espaço na memória para armazenar e manipular dados", "Uma função que retorna sempre o mesmo valor", "Um arquivo de configuração do sistema"], correct: 1 },
  { id: 5, text: "Qual das opções abaixo é uma estrutura de controle de fluxo?", options: ["Variável", "Função pura", "Condicional if/else", "Comentário de código"], correct: 2 },
  { id: 6, text: "O que é front-end no desenvolvimento web?", options: ["A parte do sistema que gerencia o banco de dados", "A interface visual com a qual o usuário interage", "O servidor que processa as requisições", "O sistema de autenticação de usuários"], correct: 1 },
  { id: 7, text: "O que significa a sigla HTML?", options: ["HyperText Markup Language", "High Text Machine Learning", "HyperText Management Logic", "Hosted Terminal Markup Layer"], correct: 0 },
  { id: 8, text: "Para que serve o CSS em desenvolvimento web?", options: ["Criar lógica de negócios no servidor", "Conectar o front-end ao banco de dados", "Estilizar a aparência visual das páginas", "Gerenciar requisições HTTP"], correct: 2 },
  { id: 9, text: "O que é uma função em programação?", options: ["Um tipo de dado que armazena números", "Um bloco de código reutilizável que realiza uma tarefa específica", "Uma estrutura de repetição infinita", "Um arquivo de configuração externo"], correct: 1 },
  { id: 10, text: "O que é um loop (laço de repetição)?", options: ["Um erro que trava o programa", "Uma estrutura que executa um bloco de código várias vezes", "Um tipo especial de variável numérica", "Uma função que retorna valores booleanos"], correct: 1 },
];

const QUESTIONS_PER_QUIZ = 5;
const PASS_THRESHOLD = 0.8;

const QuizTab = ({ questions, onPass, loading = false }: QuizTabProps) => {
  const source = questions && questions.length > 0 ? questions : FALLBACK_QUESTIONS;
  const pickRandom = () => shuffleArray(source).slice(0, Math.min(QUESTIONS_PER_QUIZ, source.length));

  const [queue, setQueue] = useState<QuizQuestion[]>(() => pickRandom());
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setQueue(shuffleArray(questions).slice(0, Math.min(QUESTIONS_PER_QUIZ, questions.length)));
      setCurrent(0); setSelected(null); setConfirmed(false);
      setScore(0); setFinished(false); setAttempt(1); setPassed(false);
    }
  }, [questions]);

  const q = queue[current];

  const handleSelect = (idx: number) => { if (!confirmed) setSelected(idx); };

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    if (selected === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= queue.length) setFinished(true);
    else { setCurrent(c => c + 1); setSelected(null); setConfirmed(false); }
  };

  const handleRetry = () => {
    setQueue(shuffleArray(source).slice(0, Math.min(QUESTIONS_PER_QUIZ, source.length)));
    setCurrent(0); setSelected(null); setConfirmed(false);
    setScore(0); setFinished(false); setAttempt(a => a + 1);
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hologram-panel rounded-sm p-12 max-w-lg mx-auto flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary" style={{ filter: "drop-shadow(0 0 8px hsl(155 60% 45% / 0.6))" }} />
        <p className="text-sm font-accent text-muted-foreground">Carregando quiz da aula...</p>
      </motion.div>
    );
  }

  if (finished) {
    const pct = Math.round((score / queue.length) * 100);
    const didPass = score / queue.length >= PASS_THRESHOLD;

    if (didPass && !passed) {
      setPassed(true);
      onPass?.();
    }

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="hologram-panel rounded-sm p-8 max-w-lg mx-auto text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mb-5">
          {didPass ? (
            <CheckCircle2 size={56} className="mx-auto" style={{ color: "hsl(155 60% 45%)", filter: "drop-shadow(0 0 16px hsl(155 60% 45% / 0.7))" }} />
          ) : (
            <motion.div animate={{ rotate: [0, -8, 8, -6, 6, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
              <ClipboardList size={56} className="mx-auto" style={{ color: "hsl(25 90% 55%)", filter: "drop-shadow(0 0 16px hsl(25 90% 55% / 0.6))" }} />
            </motion.div>
          )}
        </motion.div>

        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {didPass ? "Parabéns! Você passou! 🎉" : "Quase lá! Tente novamente"}
        </h2>

        <p className="text-muted-foreground font-body text-sm mb-2">
          Você acertou <span className="text-primary font-semibold">{score}</span> de{" "}
          <span className="font-semibold">{queue.length}</span> questões —{" "}
          <span className="font-bold text-base" style={{ color: didPass ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)" }}>{pct}%</span>
        </p>

        <p className="text-xs text-muted-foreground font-accent mb-1">
          Mínimo para aprovação: <span className={didPass ? "text-primary" : "text-accent"}>80%</span>
        </p>

        {attempt > 1 && !didPass && (
          <p className="text-xs text-muted-foreground font-body mb-1">
            Tentativa <span className="text-accent font-semibold">#{attempt}</span> — As questões foram embaralhadas.
          </p>
        )}

        <div className="my-5 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className="h-full rounded-full"
            style={{ background: didPass ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)", boxShadow: didPass ? "0 0 10px hsl(155 60% 45% / 0.6)" : "0 0 10px hsl(25 90% 55% / 0.6)" }} />
        </div>

        <div className="relative h-0 mb-4">
          <div className="absolute top-0 bottom-0 w-px bg-primary/50" style={{ left: "80%", transform: "translateY(-10px)", height: "20px" }} />
          <span className="absolute text-xs font-accent text-primary/70" style={{ left: "80%", transform: "translateX(-50%) translateY(-22px)" }}>80%</span>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          {didPass ? (
            <>
              <button onClick={handleRetry} className="px-5 py-2.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold hover:bg-primary/10 transition">
                Refazer
              </button>
              <button onClick={onPass} className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition" style={{ boxShadow: "0 0 14px hsl(155 60% 45% / 0.5)" }}>
                Próxima Aula <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <button onClick={handleRetry} className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold hover:brightness-110 transition">
              Tentar Novamente <ChevronRight size={14} />
            </button>
          )}
        </div>

        {!didPass && (
          <p className="text-xs text-muted-foreground font-body mt-4">As questões serão embaralhadas na próxima tentativa.</p>
        )}
      </motion.div>
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent text-muted-foreground">
          Questão <span className="text-primary font-semibold">{current + 1}</span> / {queue.length}
          {attempt > 1 && <span className="ml-2 text-accent">· Tentativa #{attempt}</span>}
        </span>
        <span className="text-xs font-accent text-muted-foreground">
          Acertos: <span className="text-primary font-semibold">{score}</span>
        </span>
      </div>

      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div animate={{ width: `${(current / queue.length) * 100}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full bg-primary" style={{ boxShadow: "0 0 8px hsl(155 60% 45% / 0.5)" }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="hologram-panel rounded-sm p-6 space-y-5">
          <h3 className="font-display text-base font-bold text-foreground leading-snug">{q.text}</h3>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let state = "default";
              if (confirmed) {
                if (idx === q.correct) state = "correct";
                else if (idx === selected) state = "wrong";
              } else if (idx === selected) state = "selected";

              return (
                <button key={idx} onClick={() => handleSelect(idx)}
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
              <button onClick={handleConfirm} disabled={selected === null}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold disabled:opacity-40 hover:brightness-110 transition"
                style={{ boxShadow: selected !== null ? "0 0 12px hsl(155 60% 45% / 0.4)" : "none" }}>
                Confirmar
              </button>
            ) : (
              <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold hover:brightness-110 transition">
                {current + 1 >= queue.length ? "Ver Resultado" : "Próxima"} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizTab;