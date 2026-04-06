import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { SkipForward, Loader2 } from "lucide-react";
import ProgressBar       from "@/components/assessment/ProgressBar";
import MarciusCalculator from "@/components/assessment/MarciusCalculator";
import AreaSelector      from "@/components/assessment/AreaSelector";
import DiscTest          from "@/components/assessment/DiscTest";
import { MainLandmark } from "@/components/MainLandmark";

const STEPS = ["Valor da Hora", "Áreas", "Perfil DISC"];

// ─── Modal de confirmação de pulo ─────────────────────────────────────────────

const SkipModal = ({
  stepLabel, onConfirm, onCancel, saving,
}: {
  stepLabel: string; onConfirm: () => void; onCancel: () => void; saving: boolean;
}) => (
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
        <button onClick={onCancel} disabled={saving}
          className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition disabled:opacity-50">
          Voltar
        </button>
        <button onClick={onConfirm} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-accent font-semibold text-primary-foreground rounded-sm transition hover:brightness-110 disabled:opacity-50"
          style={{ background: "hsl(25 90% 55%)" }}>
          {saving ? <><Loader2 size={12} className="animate-spin" /> Salvando...</> : "Sim, pular"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── AssessmentPage ───────────────────────────────────────────────────────────

const AssessmentPage = () => {
  const [step,      setStep]      = useState(0);
  const [skipModal, setSkipModal] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const { assessment, updateAssessment, saveAssessmentToDb } = useAuth();
  const navigate = useNavigate();

  const handleMarcius = (data: {
    salarioBruto: number; horasSemana: number; tempoDeslocamento: number;
    valorHoraBruta: number; valorHoraLiquida: number;
  }) => {
    updateAssessment(data);
    setStep(1);
  };

  const handleAreas = (areas: string[]) => {
    updateAssessment({ areasInteresse: areas });
    setStep(2);
  };

  const handleDisc = async (
    profile: "D" | "I" | "S" | "C",
    scores: { D: number; I: number; S: number; C: number }
  ) => {
    setSaving(true);
    try {
      const finalData = {
        ...assessment,
        discProfile: profile,
        discScores:  scores,
        completed:   true,
      };
      await saveAssessmentToDb(finalData);

      // Sinaliza para o ProfilePage abrir o modal de resultado
      sessionStorage.setItem("show_assessment_result", "1");
      navigate("/perfil");
    } catch (err) {
      console.error("[AssessmentPage] Erro ao salvar:", err);
      sessionStorage.setItem("show_assessment_result", "1");
      navigate("/perfil");
    } finally {
      setSaving(false);
    }
  };

  const confirmSkip = async () => {
    setSaving(true);
    try {
      const partialData = { ...assessment, completed: false };
      await saveAssessmentToDb(partialData);
    } catch (err) {
      console.error("[AssessmentPage] Erro ao salvar ao pular:", err);
    } finally {
      setSaving(false);
      setSkipModal(false);
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        navigate("/roadmap");
      }
    }
  };

  return (
    <MainLandmark className="min-h-screen gradient-hero scanline px-4 pt-24 pb-12">
      <ProgressBar currentStep={step} totalSteps={STEPS.length} labels={STEPS} />

      <div className="max-w-2xl mx-auto w-full flex justify-end mb-2 px-1">
        <button
          onClick={() => setSkipModal(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent font-semibold transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, hsl(25 90% 50% / 0.18) 0%, hsl(35 90% 55% / 0.10) 100%)",
            color:      "hsl(25 90% 65%)",
            border:     "1px solid hsl(25 90% 55% / 0.35)",
            boxShadow:  "0 0 12px hsl(25 90% 55% / 0.12)",
          }}>
          <SkipForward size={13} />
          Prefiro Fazer Depois
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && <MarciusCalculator key="marcius" onNext={handleMarcius} />}
        {step === 1 && <AreaSelector     key="areas"   onNext={handleAreas}   onBack={() => setStep(0)} />}
        {step === 2 && (
          <DiscTest key="disc" onComplete={handleDisc} onBack={() => setStep(1)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {skipModal && (
          <SkipModal
            stepLabel={STEPS[step]}
            onConfirm={confirmSkip}
            onCancel={() => setSkipModal(false)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </MainLandmark>
  );
};

export default AssessmentPage;