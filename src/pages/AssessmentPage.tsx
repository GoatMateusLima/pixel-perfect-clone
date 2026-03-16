import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { SkipForward } from "lucide-react";
import ProgressBar      from "@/components/assessment/ProgressBar";
import MarciusCalculator from "@/components/assessment/MarciusCalculator";
import AreaSelector      from "@/components/assessment/AreaSelector";
import DiscTest          from "@/components/assessment/DiscTest";

const STEPS = ["Valor da Hora", "Áreas", "Perfil DISC"];

// ─── Modal de confirmação de pulo ─────────────────────────────────────────────

const SkipModal = ({
  stepLabel, onConfirm, onCancel,
}: { stepLabel: string; onConfirm: () => void; onCancel: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    onClick={onCancel}>
    <motion.div
      initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
      className="hologram-panel rounded-sm p-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}>
      <h3 className="font-display font-bold text-foreground mb-2">Pular "{stepLabel}"?</h3>
      <p className="text-sm font-body text-muted-foreground mb-5 leading-relaxed">
        Você pode realizar o teste completo depois pelo seu Perfil. Alguns recursos personalizados podem não estar disponíveis.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition">
          Voltar
        </button>
        <button onClick={onConfirm}
          className="px-4 py-1.5 text-xs font-accent font-semibold text-primary-foreground rounded-sm transition hover:brightness-110"
          style={{ background: "hsl(25 90% 55%)" }}>
          Sim, pular
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── AssessmentPage ───────────────────────────────────────────────────────────

const AssessmentPage = () => {
  const [step,        setStep]        = useState(0);
  const [skipModal,   setSkipModal]   = useState(false);
  const { updateAssessment } = useAuth();
  const navigate = useNavigate();

  // ── Handlers dos steps ───────────────────────────────────────────────────────
  const handleMarcius = (data: {
    salarioBruto: number; horasSemana: number; tempoDeslocamento: number;
    valorHoraBruta: number; valorHoraLiquida: number;
  }) => { updateAssessment(data); setStep(1); };

  const handleAreas = (areas: string[]) => {
    updateAssessment({ areasInteresse: areas });
    setStep(2);
  };

  const handleDisc = (
    profile: "D" | "I" | "S" | "C",
    scores: { D: number; I: number; S: number; C: number }
  ) => {
    updateAssessment({ discProfile: profile, discScores: scores, completed: true });
    navigate("/resultado");
  };

  // ── Pular step ───────────────────────────────────────────────────────────────
  // Marca o assessment como iniciado mas não completo, avança ou finaliza
  const confirmSkip = () => {
    setSkipModal(false);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Pulou o DISC (último step) — vai para o roadmap sem completed = true
      updateAssessment({ completed: false });
      navigate("/roadmap");
    }
  };

  return (
    <div className="min-h-screen gradient-hero scanline px-4 pt-24 pb-12">
      <ProgressBar currentStep={step} totalSteps={STEPS.length} labels={STEPS} />

      {/* Botão "Pular etapa" — posicionado abaixo da ProgressBar, alinhado à direita */}
      <div className="max-w-2xl mx-auto w-full flex justify-end mb-2 px-1">
        <button
          onClick={() => setSkipModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent font-semibold transition-all hover:brightness-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, hsl(25 90% 50% / 0.18) 0%, hsl(35 90% 55% / 0.10) 100%)",
            color: "hsl(25 90% 65%)",
            border: "1px solid hsl(25 90% 55% / 0.35)",
            boxShadow: "0 0 12px hsl(25 90% 55% / 0.12)",
          }}>
          <SkipForward size={13} />
          Prefiro Fazer Depois
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && <MarciusCalculator key="marcius" onNext={handleMarcius} />}
        {step === 1 && <AreaSelector     key="areas"   onNext={handleAreas}   onBack={() => setStep(0)} />}
        {step === 2 && <DiscTest         key="disc"    onComplete={handleDisc} onBack={() => setStep(1)} />}
      </AnimatePresence>

      <AnimatePresence>
        {skipModal && (
          <SkipModal
            stepLabel={STEPS[step]}
            onConfirm={confirmSkip}
            onCancel={() => setSkipModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentPage;