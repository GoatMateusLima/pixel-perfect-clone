import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { invokeApiProxy } from "@/lib/apiProxy";

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

import supabase from "../../utils/supabase";

interface QuizTabProps {
  /** Tópico ou conteúdo da aula para gerar as questões */
  topic?: string;
  /** ID da aula no banco de dados para persistência */
  aulaId?: number | string;
  /** Questões fixas (se preferir não usar geração por IA) */
  questions?: QuizQuestion[];
  onPass?: () => void;
  onNext?: () => void;
  isLast?: boolean;
  loading?: boolean;
  alreadyPassed?: boolean;
}

const QUESTIONS_PER_QUIZ = 5;
const PASS_THRESHOLD = 0.8;

// ─── Geração de questões (Groq via Edge api-proxy) ──────────────────────────

async function generateQuestions(topic: string): Promise<QuizQuestion[]> {
  const prompt = `Você é um professor especialista. Gere ${QUESTIONS_PER_QUIZ} questões de múltipla escolha sobre o seguinte tópico:

"${topic}"

Regras:
- Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
- Apenas uma alternativa deve estar correta
- As questões devem ser variadas e cobrir diferentes aspectos do tópico
- Dificuldade média-alta
- Responda SOMENTE com JSON válido, sem nenhum texto extra, sem markdown, sem backticks

Formato obrigatório:
[
  {
    "id": 1,
    "text": "Pergunta aqui?",
    "options": ["Opção A", 
                "Opção B", 
                "Opção C", 
                "Opção D"
              ],
    "correct": 0
  }
]

O campo "correct" é o índice (0-3) da opção correta no array "options".`;

  // Aguarda 2 segundos para dar tempo de gerar o prompt e as questões com maior confiabilidade
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { data, error } = await invokeApiProxy<{ questions?: QuizQuestion[] }>("quiz_tab", { prompt });
  if (error) throw error;
  const parsed = data?.questions;
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Resposta inválida da API");
  return parsed;
}

// ─── Componente ──────────────────────────────────────────────────────────────

const QuizTab = ({ topic, aulaId, questions, onPass, onNext, isLast = false, loading: externalLoading = false, alreadyPassed = false }: QuizTabProps) => {
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [passed, setPassed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Gera ou carrega questões
  const loadQuestions = useCallback(async () => {
    resetState(); // Sempre reseta o estado ao carregar novas questões (ex: troca de aula)

    // Se vieram questões fixas por prop, usa elas
    if (questions && questions.length > 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQueue(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
      return;
    }

    // Tenta carregar do banco de dados antes de gerar via IA
    if (aulaId) {
      setGenerating(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("questions")
          .eq("aula_id", aulaId)
          .maybeSingle();

        if (data?.questions && Array.isArray(data.questions)) {
          const loadedQuestions = data.questions as QuizQuestion[];
          const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);
          setQueue(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
          setGenerating(false);
          return;
        }
        if (error) console.error("[Quiz] Erro ao carregar do banco:", error);
      } catch (err) {
        console.error("[Quiz] Falha na consulta ao banco:", err);
      }
      setGenerating(false);
    }

    if (!topic) return;

    // Gera via IA
    setGenerating(true);
    setGenError(null);
    try {
      const generated = await generateQuestions(topic);
      if (generated.length > 0) {
        const shuffled = [...generated].sort(() => Math.random() - 0.5);
        setQueue(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));

        // Salva as questões geradas no banco para uso futuro
        if (aulaId) {
          await supabase.from("quizzes")
            .upsert({ 
              aula_id: aulaId, 
              questions: generated 
            }, { onConflict: "aula_id" });
          console.log("[Quiz] Questões geradas e salvas no banco.");
        }
      }
    } catch (err) {
      setGenError("Não foi possível gerar as questões. O ORION pode estar sobrecarregado ou a função não foi implantada.");
      console.error("[QuizTab] Error generating questions:", err);
    } finally {
      setGenerating(false);
    }
  }, [topic, aulaId, questions]);

  // Carrega na montagem apenas se o usuario iniciar
  useEffect(() => {
    if (started && !alreadyPassed && queue.length === 0 && !genError) {
      loadQuestions();
    }
  }, [started, loadQuestions, alreadyPassed, queue.length, genError]);

  const resetState = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
  };

  const handleSelect = (idx: number) => { if (!confirmed) setSelected(idx); };

  const handleConfirm = () => {
    if (selected === null || !queue[current]) return;
    setConfirmed(true);
    if (selected === queue[current].correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= queue.length) setFinished(true);
    else { setCurrent(c => c + 1); setSelected(null); setConfirmed(false); }
  };

  // Retry: regenera as questões (novas perguntas a cada tentativa)
  const handleRetry = async () => {
    resetState();
    setAttempt(a => a + 1);
    setPassed(false);

    if (topic && !(questions && questions.length > 0)) {
      // Regera via IA
      setGenerating(true);
      setGenError(null);
      try {
        const generated = await generateQuestions(topic);
        setQueue(generated);
      } catch {
        setGenError("Não foi possível gerar as questões. Tente novamente.");
      } finally {
        setGenerating(false);
      }
    } else if (questions && questions.length > 0) {
      // Embaralha as questões fixas
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQueue(shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length)));
    }
  };

  const isLoading = externalLoading || generating;

  // ── Intro Screen (Not started yet) ──
  if (!started && !alreadyPassed) {
    return (
      <motion.div
        initial={{ opacity: 1, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-10 max-w-lg mx-auto flex flex-col items-center gap-4 text-center"
      >
        <ClipboardList size={48} className="text-primary mb-2" style={{ filter: "drop-shadow(0 0 12px hsl(155 60% 45% / 0.5))" }} />
        <h2 className="font-display text-xl font-bold text-foreground">Pronto para o Quiz?</h2>
        <p className="text-sm font-body text-muted-foreground mb-4">
          {!questions || questions.length === 0
            ? "As questões serão geradas pela IA sob medida para esta aula."
            : "Teste seus conhecimentos com as questões preparadas para esta aula."}
        </p>
        <button
          onClick={() => setStarted(true)}
          className="flex items-center gap-2 px-8 py-3 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition"
          style={{ boxShadow: "0 0 16px hsl(155 60% 45% / 0.4)" }}
        >
          Iniciar Quiz <ChevronRight size={14} />
        </button>
      </motion.div>
    );
  }

  // ── Se já passou ──
  if (alreadyPassed && !finished && queue.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-8 max-w-lg mx-auto text-center"
      >
        <CheckCircle2 size={56} className="mx-auto mb-5" style={{ color: "hsl(155 60% 45%)", filter: "drop-shadow(0 0 16px hsl(155 60% 45% / 0.7))" }} />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Quiz Concluído!</h2>
        <p className="text-muted-foreground font-body text-sm mb-6">
          Você já completou o quiz desta aula. Suas questões não são mais exibidas.
        </p>
        <div className="flex justify-center gap-3">
          {!isLast && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition"
              style={{ boxShadow: "0 0 14px hsl(155 60% 45% / 0.5)" }}
            >
              Próxima Aula <ChevronRight size={14} />
            </button>
          )}
          {isLast && (
            <span className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-bold">
              🏆 Curso Concluído!
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 1, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-12 max-w-lg mx-auto flex flex-col items-center gap-4"
      >
        <div className="relative">
          <Loader2 size={32} className="animate-spin text-primary" style={{ filter: "drop-shadow(0 0 8px hsl(155 60% 45% / 0.6))" }} />
          <Sparkles size={14} className="absolute -top-1 -right-1 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-accent text-muted-foreground uppercase tracking-widest">
          {generating ? "Consultando ORION..." : "Carregando quiz da aula..."}
        </p>
        {generating && (
          <p className="text-xs text-muted-foreground/60 font-body text-center max-w-xs">
            As questões são geradas especialmente para este tópico a cada tentativa.
          </p>
        )}
      </motion.div>
    );
  }

  // ── Erro ──
  if (genError) {
    return (
      <motion.div
        initial={{ opacity: 1, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-10 max-w-lg mx-auto flex flex-col items-center gap-4 text-center"
      >
        <ClipboardList size={40} className="text-destructive" style={{ filter: "drop-shadow(0 0 12px hsl(0 80% 55% / 0.5))" }} />
        <p className="text-sm font-body text-muted-foreground">{genError}</p>
        <button
          onClick={loadQuestions}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition"
        >
          Tentar Novamente <ChevronRight size={14} />
        </button>
      </motion.div>
    );
  }

  // ── Sem tópico e sem questões ──
  if (!topic && (!questions || questions.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 1, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-10 max-w-lg mx-auto flex flex-col items-center gap-3 text-center"
      >
        <ClipboardList size={40} className="text-muted-foreground/40" />
        <p className="text-sm font-body text-muted-foreground">
          Forneça um <code className="text-primary">topic</code> ou <code className="text-primary">questions</code> para iniciar o quiz.
        </p>
      </motion.div>
    );
  }

  // ── Resultado Final ──
  if (finished) {
    const pct = Math.round((score / queue.length) * 100);
    const didPass = score / queue.length >= PASS_THRESHOLD;

    if (didPass && !passed) {
      setPassed(true);
      onPass?.();
    }

    return (
      <motion.div
        initial={{ opacity: 1, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hologram-panel rounded-sm p-8 max-w-lg mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="mb-5"
        >
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
            Tentativa <span className="text-accent font-semibold">#{attempt}</span>
            {topic ? " — Novas questões geradas pelo ORION." : " — As questões foram embaralhadas."}
          </p>
        )}

        <div className="my-5 h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: didPass ? "hsl(155 60% 45%)" : "hsl(25 90% 55%)",
              boxShadow: didPass ? "0 0 10px hsl(155 60% 45% / 0.6)" : "0 0 10px hsl(25 90% 55% / 0.6)",
            }}
          />
        </div>

        <div className="relative h-0 mb-4">
          <div className="absolute top-0 bottom-0 w-px bg-primary/50" style={{ left: "80%", transform: "translateY(-10px)", height: "20px" }} />
          <span className="absolute text-xs font-accent text-primary/70" style={{ left: "80%", transform: "translateX(-50%) translateY(-22px)" }}>80%</span>
        </div>

        {topic && (
          <p className="text-xs text-muted-foreground/50 font-accent mb-4 flex items-center justify-center gap-1">
            <Sparkles size={10} /> Questões criadas pelo ORION com base no tópico da aula
          </p>
        )}

        <div className="flex justify-center gap-3 mt-2">
          {didPass ? (
            <>
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold hover:bg-primary/10 transition"
              >
                Refazer
              </button>
              {!isLast && (
                <button
                  onClick={onNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-accent font-bold hover:brightness-110 transition"
                  style={{ boxShadow: "0 0 14px hsl(155 60% 45% / 0.5)" }}
                >
                  Próxima Aula <ChevronRight size={14} />
                </button>
              )}
              {isLast && (
                <span className="flex items-center gap-2 px-6 py-2.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-bold">
                  🏆 Curso Concluído!
                </span>
              )}
            </>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold hover:brightness-110 transition"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              Tentar Novamente
            </button>
          )}
        </div>

        {!didPass && (
          <p className="text-xs text-muted-foreground font-body mt-4">
            {topic
              ? "Novas questões serão preparadas pelo ORION na próxima tentativa."
              : "As questões serão embaralhadas na próxima tentativa."}
          </p>
        )}
      </motion.div>
    );
  }

  const q = queue[current];
  if (!q) return null;

  // ── Quiz em andamento ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-accent text-muted-foreground">
          Questão <span className="text-primary font-semibold">{current + 1}</span> / {queue.length}
          {attempt > 1 && <span className="ml-2 text-accent">· Tentativa #{attempt}</span>}
        </span>
        <div className="flex items-center gap-3">
          {topic && (
            <span className="text-xs font-accent text-muted-foreground/50 flex items-center gap-1">
              <Sparkles size={10} /> ORION
            </span>
          )}
          <span className="text-xs font-accent text-muted-foreground">
            Acertos: <span className="text-primary font-semibold">{score}</span>
          </span>
        </div>
      </div>

      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          animate={{ width: `${(current / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full bg-primary"
          style={{ boxShadow: "0 0 8px hsl(155 60% 45% / 0.5)" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 1, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-bold hover:brightness-110 transition"
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

export default QuizTab;