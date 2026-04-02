import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, ArrowRight, Star } from "lucide-react";
import dominanciaImg from "@/assets/disc/Dominancia.webp";
import influenciaImg from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";
import { MainLandmark } from "@/components/MainLandmark";

const DISC_INFO: Record<string, { label: string; desc: string; img: string; color: string }> = {
  D: {
    label: "Dominância",
    desc: "Você é orientado a resultados, direto e determinado. Ideal para liderança e empreendedorismo em tech.",
    img: dominanciaImg,
    color: "hsl(0 70% 55%)",
  },
  I: {
    label: "Influência",
    desc: "Você é comunicativo, entusiasta e persuasivo. Ideal para Product Management, Marketing e UX.",
    img: influenciaImg,
    color: "hsl(45 90% 55%)",
  },
  S: {
    label: "Estabilidade",
    desc: "Você é paciente, confiável e cooperativo. Ideal para DevOps, QA e trabalho em equipe consistente.",
    img: estabilidadeImg,
    color: "hsl(155 60% 45%)",
  },
  C: {
    label: "Conformidade",
    desc: "Você é analítico, detalhista e preciso. Ideal para Data Science, Cibersegurança e Backend.",
    img: conformidadeImg,
    color: "hsl(210 70% 55%)",
  },
};

const AREA_LABELS: Record<string, string> = {
  dev: "Desenvolvimento", ia: "IA", data: "Data Science", ux: "UX/UI",
  cyber: "Cibersegurança", marketing: "Marketing Digital", blockchain: "Blockchain",
  cloud: "Cloud", devops: "DevOps", product: "Product Management",
};

const ResultPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const assessment = user?.assessment;

  useEffect(() => {
    if (!user) navigate("/login");
    else if (!assessment?.completed) navigate("/avaliacao");
  }, [user, assessment, navigate]);

  if (!assessment?.completed) return null;

  const disc = DISC_INFO[assessment.discProfile!];
  const roi = assessment.valorHoraBruta && assessment.valorHoraLiquida
    ? ((assessment.valorHoraBruta - assessment.valorHoraLiquida) / assessment.valorHoraLiquida * 100).toFixed(0)
    : null;

  return (
    <MainLandmark className="min-h-screen gradient-hero scanline px-4 pt-24 pb-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* DISC Profile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="hologram-panel rounded-sm p-6 text-center"
        >
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Seu Resultado</h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-32 h-32 rounded-full overflow-hidden border-4 p-1"
              style={{ borderColor: disc.color, boxShadow: `0 0 20px ${disc.color}40` }}
            >
              <img src={disc.img} alt={disc.label} className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-accent">Perfil Dominante</p>
              <h2 className="font-display text-xl font-bold" style={{ color: disc.color }}>{disc.label}</h2>
              <p className="text-sm text-muted-foreground font-body mt-2 max-w-md">{disc.desc}</p>
            </div>

            {/* DISC scores bar */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-2">
              {(["D", "I", "S", "C"] as const).map((key) => (
                <div key={key} className="text-center">
                  <p className="text-xs font-accent font-semibold" style={{ color: DISC_INFO[key].color }}>
                    {key}
                  </p>
                  <div className="h-2 rounded-full bg-secondary mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(assessment.discScores![key] / 12) * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: DISC_INFO[key].color }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{assessment.discScores![key]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Financial Summary */}
        {assessment.valorHoraBruta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hologram-panel rounded-sm p-6"
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              Análise Financeira
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-accent">Valor/Hora Bruta</p>
                <p className="font-display font-bold text-primary">
                  {assessment.valorHoraBruta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-accent">Valor/Hora Real</p>
                <p className="font-display font-bold text-accent">
                  {assessment.valorHoraLiquida!.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
            {roi && (
              <p className="text-sm text-muted-foreground font-body mt-3">
                Você perde <span className="text-destructive font-semibold">{roi}%</span> do valor da sua hora com deslocamento.
                Investir em carreira remota pode recuperar esse valor.
              </p>
            )}
          </motion.div>
        )}

        {/* Areas */}
        {assessment.areasInteresse && assessment.areasInteresse.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="hologram-panel rounded-sm p-6"
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Star size={18} className="text-primary" />
              Suas Áreas de Interesse
            </h3>
            <div className="flex flex-wrap gap-2">
              {assessment.areasInteresse.map((area) => (
                <span key={area} className="px-3 py-1 rounded-sm border border-primary/30 bg-primary/10 text-primary text-xs font-accent font-semibold">
                  {AREA_LABELS[area] || area}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="hologram-panel rounded-sm p-6 text-center"
        >
          <CheckCircle size={32} className="mx-auto mb-3 text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground mb-2">Vale a Pena Investir?</h3>
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={20} className="text-accent fill-accent" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
            Com base no seu perfil {disc.label}, suas áreas de interesse e o custo de oportunidade atual,
            a transição de carreira tech tem alto potencial de retorno para você.
          </p>
        </motion.div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            to="/perfil"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-sm bg-accent text-accent-foreground font-accent font-bold box-glow-accent hover:brightness-110 transition"
          >
            Ver Meu Perfil <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </MainLandmark>
  );
};

export default ResultPage;
