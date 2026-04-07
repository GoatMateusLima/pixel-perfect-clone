import { useEffect, useRef, useState } from "react";
import { useRanking, xpToLevel, xpForNextLevel } from "@/hooks/useRanking";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { fetchVagasByInterest } from "../../utils/ApiVagas";
import {
  User, ArrowUpRight, Pencil, Check, Plus, X, ImageIcon,
  Camera, Flame, Star, Zap, Trophy, Clock,
  Linkedin, Github, Facebook, Mail, Twitter, Instagram, Globe,
  Shield, Brain, Database, Cloud, Cpu, Layers, Code2,
  CheckCircle2, Loader2, Sparkles, TrendingUp, PlayCircle, ChevronRight,
} from "lucide-react";
import dominanciaImg from "@/assets/disc/Dominancia.webp";
import influenciaImg from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";
import ImageCropModal from "@/components/ImageCropModal";
import Header from "@/components/Header";
import { MainLandmark } from "@/components/MainLandmark";
import Progress from "@/components/progress";
import Vagas from "@/components/Vagas";
import CursosEmAndamento from "@/components/CursosEmAndamento";
import FriendsListCard from "@/components/FriendsListCard";
import supabase from "../../utils/supabase";

import { 
  ALL_MEDALS, 
  RARITY_COLOR, 
  awardCourseCompletion, 
  type MedalStatus, 
  type Certificate 
} from "@/utils/rewards";

export type Borda = { id: string; img_url: string; nome: string; ativa: boolean };
export type Profile = {
  user_id?: string; name?: string; descricao?: string; perfil?: string; banner?: string;
  redes?: Partial<Record<SocialKey, string>>; bordas?: Borda[]; medalhas?: MedalStatus[];
  certificados?: Certificate[];
  total_xp?: number; nivel?: number; pontuacao?: number;
};

interface CourseProgress {
  courseId: string;
  courseName: string;
  difficult: string;
  totalAulas: number;
  completedAulas: number;
  pct: number;
  thumb?: string;
}

interface OverallProgress {
  totalCursos: number;
  cursosConcluidos: number;
  cursosEmAndamento: number;
  progressoMedio: number;
  totalAulasAssistidas: number;
  courseProgressList: CourseProgress[];
}

// =============================================================================
// HELPERS
// =============================================================================

function getBordaAtiva(bordas: Borda[]): Borda | null { return bordas.find(b => b.ativa) ?? null; }
function setBordaAtiva(bordas: Borda[], id: string | null): Borda[] { return bordas.map(b => ({ ...b, ativa: b.id === id })); }
function toggleMedalAtiva(medalhas: MedalStatus[], id: number): MedalStatus[] {
  const ativas = medalhas.filter(m => m.ativa).length;
  return medalhas.map(m => {
    if (m.id !== id) return m;
    if (m.ativa) return { ...m, ativa: false };
    if (ativas >= 3) return m;
    return { ...m, ativa: true };
  });
}
function sanitizeUrl(href: string, prefix?: string): string {
  if (!href) return "#";
  const trimmed = href.trim();
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) return trimmed;
  return (prefix ?? "https://") + trimmed;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const DISC_IMGS: Record<string, string> = { D: dominanciaImg, I: influenciaImg, S: estabilidadeImg, C: conformidadeImg };
const DISC_LABELS: Record<string, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };
const DISC_COLORS: Record<string, string> = { D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)" };
const DISC_DESC: Record<string, string> = {
  D: "Você é direto, assertivo e orientado a resultados. Gosta de desafios e toma decisões rapidamente.",
  I: "Você é comunicativo, entusiasmado e influente. Inspira pessoas e prospera em ambientes colaborativos.",
  S: "Você é estável, paciente e confiável. Valoriza harmonia e é excelente em manter consistência.",
  C: "Você é analítico, preciso e metódico. Preza pela qualidade e toma decisões baseadas em dados.",
};
const DIFF_COLOR: Record<string, string> = { Iniciante: "hsl(155 60% 45%)", Intermediário: "hsl(45 85% 55%)", Avançado: "hsl(0 65% 58%)" };

type SocialKey = "linkedin" | "github" | "twitter" | "instagram" | "facebook" | "email" | "website";
const SOCIAL_META: Record<SocialKey, { label: string; Icon: React.ElementType; placeholder: string; prefix?: string }> = {
  linkedin: { label: "LinkedIn", Icon: Linkedin, placeholder: "https://linkedin.com/in/usuario", prefix: "https://" },
  github: { label: "GitHub", Icon: Github, placeholder: "https://github.com/usuario", prefix: "https://" },
  twitter: { label: "Twitter/X", Icon: Twitter, placeholder: "https://x.com/usuario", prefix: "https://" },
  instagram: { label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/usuario", prefix: "https://" },
  facebook: { label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/usuario", prefix: "https://" },
  email: { label: "E-mail", Icon: Mail, placeholder: "seu@email.com", prefix: "mailto:" },
  website: { label: "Website", Icon: Globe, placeholder: "https://seusite.com", prefix: "https://" },
};
const ALL_SOCIAL_KEYS = Object.keys(SOCIAL_META) as SocialKey[];

const JOBS_BY_DISC: Record<string, Array<{ title: string; company: string; salary: string; type: string }>> = {
  D: [{ title: "Tech Lead", company: "Nubank", salary: "R$18–25k", type: "Remoto" }, { title: "Product Owner", company: "iFood", salary: "R$14–20k", type: "Híbrido" }],
  I: [{ title: "Product Manager", company: "Hotmart", salary: "R$12–18k", type: "Remoto" }, { title: "UX Lead", company: "Conta Simples", salary: "R$10–15k", type: "Remoto" }],
  S: [{ title: "DevOps Engineer", company: "PicPay", salary: "R$12–18k", type: "Remoto" }, { title: "Backend Dev Sr", company: "Banco Inter", salary: "R$14–20k", type: "Híbrido" }],
  C: [{ title: "Data Scientist", company: "Itaú BBA", salary: "R$14–22k", type: "Híbrido" }, { title: "Cyber Analyst", company: "Tempest", salary: "R$12–18k", type: "Remoto" }],
};

// =============================================================================
// SCAN RING — efeito de riscos orbitando ao redor da foto
// =============================================================================
const AvatarScanRings = ({ color }: { color: string }) => {
  const dimColor = color.replace("hsl(", "hsla(").replace(")", " / 0.15)");
  const brightColor = color;

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 0 }}>
      {/* Background Glow - Central soft glow */}
      <div 
        className="absolute inset-[15%] rounded-full opacity-30 blur-2xl transition-all duration-700"
        style={{ background: brightColor }}
      />
      
      {/* Glassy Halo - The "organic" soft ring from the image */}
      <div 
        className="absolute inset-[-12%] rounded-[42%] border border-white/5 backdrop-blur-[1px] opacity-40 rotate-[15deg]"
        style={{ 
          background: `radial-gradient(circle at 30% 30%, ${brightColor}20 0%, transparent 70%)`,
          boxShadow: `inset 0 0 15px ${dimColor}, 0 0 20px ${dimColor}`
        }}
      />
      
      {/* Main Orbiting Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-5%] rounded-full opacity-60"
        style={{
          border: "1.5px solid transparent",
          borderTopColor: brightColor,
          borderRightColor: dimColor,
          filter: `drop-shadow(0 0 8px ${brightColor}80)`
        }}
      />

      {/* Dotted Orbiting Ring - Inner */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-10%] rounded-full opacity-20"
        style={{
          border: `1px dashed ${brightColor}`,
        }}
      />

      {/* Orbiting Particle */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-5%]"
      >
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ 
            background: brightColor,
            boxShadow: `0 0 12px 3px ${brightColor}`,
            border: "1.5px solid white"
          }}
        />
      </motion.div>
    </div>
  );
};

// =============================================================================
// UPLOAD HELPER
// =============================================================================
async function uploadCroppedImage(dataUrl: string, userId: string, slot: "photo" | "banner"): Promise<string> {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  const blob = new Blob([u8arr], { type: mime });
  const ext = mime.includes("png") ? "png" : mime.includes("jpeg") ? "jpg" : "webp";
  const path = `${userId}/${slot}.${ext}`;
  const { error } = await supabase.storage.from("Profile").upload(path, blob, { upsert: true, contentType: mime });
  if (error) throw error;
  const { data } = supabase.storage.from("Profile").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

// =============================================================================
// MODAL DE RESULTADO DA AVALIAÇÃO
// =============================================================================
const AssessmentResultModal = ({
  assessment, onClose,
}: {
  assessment: { discProfile?: string; discScores?: Record<string, number>; valorHoraBruta?: number; valorHoraLiquida?: number; salarioBruto?: number };
  onClose: () => void;
}) => {
  const disc = assessment.discProfile ?? "S";
  const color = DISC_COLORS[disc] ?? "hsl(155 60% 45%)";
  const label = DISC_LABELS[disc] ?? "Estabilidade";
  const desc = DISC_DESC[disc] ?? "";
  const img = DISC_IMGS[disc];
  const scoreEntries = Object.entries(assessment.discScores ?? {}).sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="hologram-panel rounded-sm w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="relative h-2" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-accent text-primary uppercase tracking-widest mb-1">Avaliação Concluída 🎉</p>
              <h2 className="font-display text-xl font-bold text-foreground">Seu Perfil Comportamental</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"><X size={14} /></button>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-sm mb-4" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
            {img && <img src={img} alt={label} className="w-16 h-16 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${color}60`, boxShadow: `0 0 16px ${color}40` }} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-accent font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{disc}</span>
                <span className="font-display text-base font-bold text-foreground">{label}</span>
              </div>
              <p className="text-xs font-body text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
          {scoreEntries.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[10px] font-accent text-muted-foreground uppercase tracking-widest mb-2">Distribuição DISC</p>
              {scoreEntries.map(([key, val]) => {
                const c = DISC_COLORS[key] ?? "hsl(155 60% 45%)";
                const pct = Math.round((val as number) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] font-accent font-bold w-4" style={{ color: c }}>{key}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }} className="h-full rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}80` }} />
                    </div>
                    <span className="text-[10px] font-accent text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
          {(assessment.valorHoraBruta || assessment.valorHoraLiquida) && (
            <div className="rounded-sm p-4 mb-4" style={{ background: "hsl(155 60% 45% / 0.08)", border: "1px solid hsl(155 60% 45% / 0.25)" }}>
              <p className="text-[10px] font-accent text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={10} className="text-primary" /> Cálculo do Valor da Hora</p>
              <div className="grid grid-cols-2 gap-3">
                {assessment.salarioBruto && <div><p className="text-[9px] font-accent text-muted-foreground mb-0.5">Salário Bruto</p><p className="font-display text-sm font-bold text-foreground">R$ {assessment.salarioBruto.toLocaleString("pt-BR")}</p></div>}
                {assessment.valorHoraBruta && <div><p className="text-[9px] font-accent text-muted-foreground mb-0.5">Valor/Hora Bruto</p><p className="font-display text-sm font-bold text-foreground">R$ {assessment.valorHoraBruta.toFixed(2).replace(".", ",")}</p></div>}
                {assessment.valorHoraLiquida && <div className="col-span-2"><p className="text-[9px] font-accent text-muted-foreground mb-0.5">Valor/Hora Líquido (real)</p><p className="font-display text-lg font-bold" style={{ color: "hsl(155 60% 45%)" }}>R$ {assessment.valorHoraLiquida.toFixed(2).replace(".", ",")}</p><p className="text-[9px] text-muted-foreground font-body mt-0.5">Considerando deslocamento, impostos e horas reais trabalhadas</p></div>}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-sm mb-5" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
            <CheckCircle2 size={16} style={{ color, flexShrink: 0 }} />
            <p className="text-xs font-accent text-foreground">Borda <span style={{ color }} className="font-bold">"{label}"</span> desbloqueada e aplicada ao seu perfil!</p>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-sm font-accent font-bold text-sm text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: color, boxShadow: `0 0 20px ${color}50` }}>
            Ver meu Perfil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
const ProfilePage = () => {
  const { user, logout, assessment, refreshPhoto } = useAuth();
  const navigate = useNavigate();

  const [vagasDinamicas, setVagasDinamicas] = useState<any[]>([]);
  const [loadingVagas, setLoadingVagas] = useState(false);
  const [loading, setLoading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescricao, setDraftDescricao] = useState("");
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);
  const [draftSocial, setDraftSocial] = useState<Partial<Record<SocialKey, string>>>({});
  const [draftMedalhas, setDraftMedalhas] = useState<MedalStatus[] | null>(null);
  const [draftBordas, setDraftBordas] = useState<Borda[] | null>(null);
  const [borderPickerOpen, setBorderPickerOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"photo" | "banner" | null>(null);
  const [socialModal, setSocialModal] = useState<SocialKey | null>(null);
  const [socialInput, setSocialInput] = useState("");
  const [medalPickerOpen, setMedalPickerOpen] = useState(false);
  const [hoverPhoto, setHoverPhoto] = useState(false);
  const [hoveredMedal, setHoveredMedal] = useState<number | null>(null);

  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    totalCursos: 0, cursosConcluidos: 0, cursosEmAndamento: 0,
    progressoMedio: 0, totalAulasAssistidas: 0, courseProgressList: [],
  });

  const [showResultModal, setShowResultModal] = useState(() => sessionStorage.getItem("show_assessment_result") === "1");
  const handleCloseResultModal = () => { setShowResultModal(false); sessionStorage.removeItem("show_assessment_result"); };

  // Carrega perfil + vagas (uma vez por usuário — depende de user.id, não do objeto user,
  // para não refazer tudo a cada TOKEN_REFRESHED / novo objeto Session do Supabase)
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          setProfile({
            user_id: uid,
            name: user?.email?.split("@")[0] ?? "Usuário",
            redes: {},
            bordas: [],
          });
        } else {
          setProfile(data as Profile);
        }

        const { data: cursoInteresse } = await supabase
          .from("watch").select("course_id, courses(name)")
          .eq("user_id", uid).limit(1).maybeSingle();

        if (cancelled) return;

        if (cursoInteresse) {
          const courseName = (cursoInteresse.courses as any)?.name;
          if (courseName) {
            setLoadingVagas(true);
            const jobs = await fetchVagasByInterest(courseName);
            if (!cancelled) setVagasDinamicas(jobs.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        if (!cancelled) {
          setLoadingVagas(false);
          setLoading(false);
          setLoadingProfile(false);
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [user?.id, user?.email]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    async function loadOverallProgress() {
      try {
        const { data: watchData } = await supabase
          .from("watch")
          .select("course_id, courses(id, name, difficult)")
          .eq("user_id", uid);

        if (!watchData || watchData.length === 0) return;

        const progressList: CourseProgress[] = [];
        let totalAssistidas = 0;

        const courseRows = watchData
          .map((w) => {
            const course = Array.isArray(w.courses) ? w.courses[0] : (w.courses as any);
            return course ? { w, course } : null;
          })
          .filter(Boolean) as { w: (typeof watchData)[0]; course: { id: string; name: string; difficult?: string } }[];

        const courseIds = [...new Set(courseRows.map(({ course }) => course.id))];

        if (courseIds.length === 0) {
          setOverallProgress({
            totalCursos: 0,
            cursosConcluidos: 0,
            cursosEmAndamento: 0,
            progressoMedio: 0,
            totalAulasAssistidas: 0,
            courseProgressList: [],
          });
          return;
        }

        const { data: allAulas } = await supabase
          .from("aulas")
          .select("id, course_id")
          .in("course_id", courseIds);

        const aulaIdsByCourse = new Map<string, number[]>();
        for (const row of allAulas ?? []) {
          const cid = String(row.course_id);
          if (!aulaIdsByCourse.has(cid)) aulaIdsByCourse.set(cid, []);
          aulaIdsByCourse.get(cid)!.push(Number(row.id));
        }

        const allAulaIds = (allAulas ?? []).map((a) => Number(a.id));

        const { data: progressRows } =
          allAulaIds.length > 0
            ? await supabase
                .from("lesson_progress")
                .select("aula_id")
                .eq("user_id", uid)
                .eq("completed", true)
                .in("aula_id", allAulaIds)
            : { data: [] as { aula_id: number }[] };

        const completedAulaSet = new Set((progressRows ?? []).map((p) => Number(p.aula_id)));

        for (const { course } of courseRows) {
          const aulaIds = aulaIdsByCourse.get(String(course.id)) ?? [];
          const total = aulaIds.length;
          const completed = aulaIds.filter((id) => completedAulaSet.has(id)).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          totalAssistidas += completed;

          progressList.push({
            courseId: course.id,
            courseName: course.name,
            difficult: course.difficult ?? "Iniciante",
            totalAulas: total,
            completedAulas: completed,
            pct,
          });
        }

        const totalCursos = progressList.length;
        const concluidos = progressList.filter(c => c.pct === 100).length;
        const emAndamento = progressList.filter(c => c.pct > 0 && c.pct < 100).length;
        const media = totalCursos > 0
          ? Math.round(progressList.reduce((acc, c) => acc + c.pct, 0) / totalCursos)
          : 0;

        setOverallProgress({
          totalCursos,
          cursosConcluidos: concluidos,
          cursosEmAndamento: emAndamento,
          progressoMedio: media,
          totalAulasAssistidas: totalAssistidas,
          courseProgressList: progressList,
        });
      } catch (err) {
        console.error("Erro ao carregar progresso geral:", err);
      }
    }
    loadOverallProgress();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) navigate("/login");
  }, [user?.id, navigate]);

  const { myRank, myXP } = useRanking(user?.id);

  if (!user) return null;

  const discProfile = assessment?.discProfile ?? "S";
  const ringColor = DISC_COLORS[discProfile] ?? "hsl(155 60% 45%)";

  const displayPhoto = isEditing ? (draftPhoto !== null ? (draftPhoto || null) : (profile.perfil ?? null)) : (profile.perfil ?? null);
  const displayBanner = isEditing ? (draftBanner !== null ? (draftBanner || null) : (profile.banner ?? null)) : (profile.banner ?? null);
  const displaySocial: Partial<Record<SocialKey, string>> = isEditing
    ? Object.fromEntries(ALL_SOCIAL_KEYS.map(k => [k, k in draftSocial ? draftSocial[k] : (profile.redes ?? {})[k]]))
    : (profile.redes ?? {});

  const bordas: Borda[] = (isEditing ? (draftBordas ?? profile.bordas) : profile.bordas) ?? [];
  const bordaAtiva: Borda | null = getBordaAtiva(bordas);
  const medalhas: MedalStatus[] = (isEditing ? (draftMedalhas ?? profile.medalhas) : profile.medalhas) ?? [];
  const ativasCount = medalhas.filter(m => m.ativa).length;
  const featuredMedals = medalhas.filter(m => m.ativa).map(m => ALL_MEDALS.find(a => a.id === m.id)).filter(Boolean) as typeof ALL_MEDALS[number][];
  const filledSocials = ALL_SOCIAL_KEYS.filter(k => displaySocial[k]);
  const emptySocials = ALL_SOCIAL_KEYS.filter(k => !displaySocial[k]);

  const currentXP = myXP;
  const currentLevel = xpToLevel(currentXP);
  const xpNextLevel = xpForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - ((currentLevel - 1) * 10);
  const xpProgress = Math.min((xpInCurrentLevel / 10) * 100, 100);
  const currentStreak = 12;
  const currentRank = myRank ?? "—";

  const handleStartEdit = () => {
    setDraftName(profile.name ?? user.email?.split("@")[0] ?? "Usuário");
    setDraftDescricao(profile.descricao ?? "");
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({}); setDraftBordas(null);
    setBorderPickerOpen(false); setDraftMedalhas(null); setSaveError(null); setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({}); setDraftBordas(null);
    setBorderPickerOpen(false); setDraftMedalhas(null); setIsEditing(false); setMedalPickerOpen(false); setSaveError(null);
  };
  const handleConfirmEdit = async () => {
    if (!user) return;
    setSaving(true); setSaveError(null);
    try {
      let perfil = profile.perfil ?? null;
      let banner = profile.banner ?? null;
      if (draftPhoto !== null) perfil = draftPhoto === "" ? null : await uploadCroppedImage(draftPhoto, user.id, "photo");
      if (draftBanner !== null) banner = draftBanner === "" ? null : await uploadCroppedImage(draftBanner, user.id, "banner");
      const redes: Partial<Record<SocialKey, string>> = {};
      ALL_SOCIAL_KEYS.forEach(k => { const val = k in draftSocial ? draftSocial[k] : (profile.redes ?? {})[k]; if (val?.trim()) redes[k] = val.trim(); });
      const payload: Profile = { user_id: user.id, name: draftName.trim() || profile.name || null, descricao: draftDescricao.trim() || profile.descricao || null, perfil, banner, redes, bordas, medalhas: draftMedalhas ?? profile.medalhas ?? [] };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setProfile(payload);
      refreshPhoto();
      setIsEditing(false); setMedalPickerOpen(false); setBorderPickerOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar perfil.";
      setSaveError(errorMessage);
    }
    finally { setSaving(false); }
  };

  const handleEscolherBorda = (id: string | null) => { const base = draftBordas ?? profile.bordas ?? []; setDraftBordas(setBordaAtiva(base, id)); };
  const readAndOpenCrop = (file: File, type: "photo" | "banner") => { const r = new FileReader(); r.onload = e => { setCropSrc(e.target?.result as string); setCropType(type); }; r.readAsDataURL(file); };
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "photo"); e.target.value = ""; };
  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "banner"); e.target.value = ""; };
  const handleCropConfirm = (dataUrl: string) => { if (cropType === "photo") setDraftPhoto(dataUrl); if (cropType === "banner") setDraftBanner(dataUrl); setCropSrc(null); setCropType(null); };
  const openSocialModal = (key: SocialKey) => { setSocialInput(displaySocial[key] ?? ""); setSocialModal(key); };
  const saveSocialModal = () => { if (!socialModal) return; setDraftSocial(prev => ({ ...prev, [socialModal]: socialInput.trim() })); setSocialModal(null); setSocialInput(""); };
  const removeSocialLink = (key: SocialKey) => setDraftSocial(prev => ({ ...prev, [key]: "" }));
  const handleToggleMedal = (id: number) => { const base = draftMedalhas ?? profile.medalhas ?? []; setDraftMedalhas(toggleMedalAtiva(base, id)); };

  if (loadingProfile) return (
    <MainLandmark className="min-h-screen gradient-hero scanline flex items-center justify-center">
      <Loader2 size={32} className="text-primary animate-spin" />
    </MainLandmark>
  );

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <MainLandmark>
      <AnimatePresence>
        {showResultModal && assessment?.completed && (
          <AssessmentResultModal assessment={assessment} onClose={handleCloseResultModal} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">

          {/* COLUNA ESQUERDA */}
          <aside className="hidden lg:flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-5 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(230 30% 10%) 0%, hsl(270 40% 8%) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-yellow-400/80" />
                  <span className="text-sm font-bold text-white/90">Nível {currentLevel}</span>
                </div>
                <span className="text-[10px] text-white/30 font-mono">{currentXP} / {xpNextLevel} XP</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }}
                  transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(45 90% 45%), hsl(45 90% 70%))", boxShadow: "0 0 12px hsl(45 90% 55% / 0.5)" }}
                />
              </div>
              <p className="text-[10px] text-white/25 font-body mb-5">
                {xpNextLevel - currentXP > 0 ? `${xpNextLevel - currentXP} XP para o nível ${currentLevel + 1}` : "Nível máximo!"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Flame,  label: "Streak",   value: `${currentStreak}d`, color: "hsl(25 90% 55%)",   glow: "hsl(25 90% 55% / 0.25)"  },
                  { icon: Trophy, label: "Ranking",  value: `#${currentRank}`,   color: "hsl(45 90% 55%)",   glow: "hsl(45 90% 55% / 0.25)"  },
                  { icon: Zap,    label: "Medalhas", value: `${profile.medalhas?.length || 0}`, color: "hsl(155 60% 45%)", glow: "hsl(155 60% 45% / 0.25)" },
                ].map(({ icon: Icon, label, value, color, glow }) => (
                  <div key={label} className="rounded-xl p-2.5 text-center flex flex-col items-center gap-1"
                    style={{ background: `${color}0d`, border: `1px solid ${color}20`, boxShadow: `0 0 20px ${glow}` }}>
                    <Icon size={13} style={{ color }} />
                    <p className="font-bold text-xs leading-none" style={{ color }}>{value}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <Vagas ringColor={ringColor} discProfile={assessment?.discProfile || "S"} recommendedJobs={vagasDinamicas} />

            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(135deg, hsl(230 30% 10%) 0%, hsl(270 40% 8%) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
              }}
            >
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                <Zap size={12} className="text-primary/70" /> Progresso Geral
              </h3>
              <Progress
                totalCursos={overallProgress.totalCursos}
                cursosConcluidos={overallProgress.cursosConcluidos}
                cursosEmAndamento={overallProgress.cursosEmAndamento}
                progressoMedio={overallProgress.progressoMedio}
                totalAulasAssistidas={overallProgress.totalAulasAssistidas}
                courseProgressList={overallProgress.courseProgressList}
              />
            </motion.div>

            <div className="flex-1 min-h-[300px]">
              <FriendsListCard />
            </div>
          </aside>

          {/* COLUNA CENTRAL */}
          <main className="space-y-6 min-w-0">

            {/* ─── HERO card do perfil ─── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, hsl(230 30% 9%) 0%, hsl(270 40% 7%) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Banner */}
              <div className="relative w-full" style={{ height: 200 }}>
                {displayBanner
                  ? <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
                  : <div
                      className="w-full h-full relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${ringColor}33 0%, ${ringColor}0a 50%, hsl(270 40% 5%) 100%)` }}
                    >
                      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 32px,rgba(255,255,255,1)1px),repeating-linear-gradient(90deg,transparent,transparent 32px,rgba(255,255,255,1)1px)" }} />
                      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(transparent, hsl(230 30% 9%))" }} />
                    </div>
                }
                {isEditing && (
                  <button type="button" onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all"
                    style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <ImageIcon size={12} /> Alterar banner
                  </button>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
              </div>

              <div className="px-7 pb-7">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5" style={{ marginTop: -36 }}>

                  {/* ── AVATAR com aura e scan rings ── */}
                  <div className="flex-shrink-0 relative shrink-0" style={{ width: 128, height: 128, zIndex: 10 }}>
                    
                    <AvatarScanRings color={ringColor} />

                    {/* Borda desbloqueável ou Borda DISC */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                      {bordaAtiva ? (
                        <img src={bordaAtiva.img_url} alt={bordaAtiva.nome} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        DISC_IMGS[discProfile] && (
                          <img src={DISC_IMGS[discProfile]} alt={DISC_LABELS[discProfile]} className="w-full h-full rounded-full object-cover" />
                        )
                      )}
                    </div>

                    {/* Foto de perfil centrada */}
                    <div
                      onClick={() => isEditing && photoInputRef.current?.click()}
                      onMouseEnter={() => isEditing && setHoverPhoto(true)}
                      onMouseLeave={() => setHoverPhoto(false)}
                      className="absolute rounded-full overflow-hidden backdrop-blur-sm flex items-center justify-center transition-all duration-300"
                      style={{
                        width: 90, height: 90,
                        top: "50%", left: "50%",
                        transform: "translate(-50%,-50%)",
                        zIndex: 2,
                        background: "hsl(230 30% 12%)",
                        border: `2.5px solid ${ringColor}50`,
                        boxShadow: `0 0 30px ${ringColor}25, inset 0 0 20px rgba(0,0,0,0.4)`,
                        cursor: isEditing ? "pointer" : "default",
                      }}
                    >
                      {displayPhoto ? <img src={displayPhoto} alt="Foto" className="w-full h-full object-cover" /> : <User size={28} className="text-muted-foreground" />}
                      <AnimatePresence>
                        {isEditing && hoverPhoto && (
                          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                            style={{ background: "rgba(0,0,0,0.6)" }}>
                            <Camera size={16} className="text-white" />
                            <span className="text-[8px] text-white font-accent">Alterar</span>
                            {displayPhoto && (
                              <button type="button" onClick={e => { e.stopPropagation(); setDraftPhoto(""); }}
                                className="text-[7px] text-red-300 font-accent mt-0.5 hover:text-red-100">
                                remover
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />

                    {/* Botão de trocar borda */}
                    {isEditing && (
                      <button type="button" onClick={() => setBorderPickerOpen(p => !p)}
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{
                          zIndex: 3,
                          background: borderPickerOpen ? ringColor : "hsl(var(--secondary))",
                          border: "2px solid hsl(var(--background))",
                          boxShadow: borderPickerOpen ? `0 0 8px ${ringColor}60` : "none",
                        }}>
                        <Sparkles size={12} style={{ color: borderPickerOpen ? "white" : "hsl(var(--muted-foreground))" }} />
                      </button>
                    )}
                  </div>
                  {/* ── fim AVATAR ── */}

                  {/* Nome + botões */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
                    <div className="flex-1 min-w-0 z-50">
                      {isEditing
                        ? <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Seu nome"
                          className="font-display text-2xl font-bold text-foreground bg-transparent border-b border-primary/40 focus:outline-none focus:border-primary w-full pb-0.5 mb-1" />
                        : <h1 className="font-display text-2xl font-bold text-white/95 truncate leading-tight">{profile.name ?? user.email?.split("@")[0] ?? "Usuário"}</h1>
                      }
                      <p className="text-sm text-white/30 font-body mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white/90"
                          style={{ background: `${ringColor}25`, border: `1px solid ${ringColor}40`, color: ringColor }}>
                          {DISC_LABELS[discProfile]}
                        </span>
                        <span className="text-[10px] text-white/40 font-medium">Nível {currentLevel}</span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Flame size={10} className="text-orange-400/80" /> {currentStreak} dias seguidos
                        </span>
                      </div>
                      {!assessment?.completed && (
                        <Link to="/avaliacao" className="block mt-1.5 text-xs text-primary/70 hover:text-primary transition-colors font-medium">Completar Avaliação →</Link>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        {!isEditing
                          ? <button onClick={handleStartEdit}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                            >
                              <Pencil size={12} /> Editar Perfil
                            </button>
                          : <>
                              <button onClick={handleConfirmEdit} disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60 transition-all"
                                style={{ background: "hsl(155 60% 35%)", border: "1px solid hsl(155 60% 45% / 0.5)", boxShadow: "0 0 20px hsl(155 60% 45% / 0.2)" }}>
                                {saving ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> : <><Check size={12} /> Confirmar</>}
                              </button>
                              <button onClick={handleCancelEdit} disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                                <X size={12} /> Cancelar
                              </button>
                            </>
                        }
                      </div>
                      {saveError && <p className="text-[10px] text-red-400/80 font-medium text-right max-w-[200px]">{saveError}</p>}
                    </div>
                  </div>
                </div>

                {/* Border picker */}
                <AnimatePresence>
                  {isEditing && borderPickerOpen && (
                    <motion.div initial={{ opacity: 1, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                      <div className="rounded-sm p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-accent text-muted-foreground flex items-center gap-1.5"><Sparkles size={10} /> Escolha sua borda</p>
                          <span className="text-[9px] font-accent text-muted-foreground">{bordas.length} desbloqueada{bordas.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => handleEscolherBorda(null)} className="flex flex-col items-center gap-1 group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                              style={{ background: "hsl(var(--secondary))", border: bordaAtiva === null ? `2px solid ${ringColor}` : "2px solid transparent", boxShadow: bordaAtiva === null ? `0 0 8px ${ringColor}50` : "none" }}>
                              <X size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                            <span className="text-[8px] font-accent text-muted-foreground">Nenhuma</span>
                          </button>
                          {bordas.map(borda => (
                            <button key={borda.id} type="button" onClick={() => handleEscolherBorda(borda.id)} className="flex flex-col items-center gap-1 group">
                              <div className="w-12 h-12 rounded-full overflow-hidden transition-all"
                                style={{ border: borda.ativa ? `2px solid ${ringColor}` : "2px solid transparent", boxShadow: borda.ativa ? `0 0 8px ${ringColor}50` : "none", outline: borda.ativa ? `1px solid ${ringColor}40` : "none", outlineOffset: "2px" }}>
                                <img src={borda.img_url} alt={borda.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                              </div>
                              <span className="text-[8px] font-accent text-muted-foreground group-hover:text-foreground transition-colors max-w-[52px] truncate text-center">{borda.nome}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Descrição */}
                <div className="mt-5">
                  {isEditing
                    ? <textarea value={draftDescricao} onChange={e => setDraftDescricao(e.target.value)} placeholder="Escreva uma bio curta sobre você…" rows={3}
                        className="w-full text-sm leading-relaxed resize-none focus:outline-none rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", caretColor: "hsl(155 60% 50%)" }} />
                    : profile.descricao
                      ? <p className="text-sm text-white/50 leading-relaxed">{profile.descricao}</p>
                      : null
                  }
                </div>

                {/* Redes sociais */}
                <div className="mt-5">
                  {filledSocials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filledSocials.map(key => {
                        const { Icon, label, prefix } = SOCIAL_META[key];
                        const href = displaySocial[key]!;
                        const fullHref = sanitizeUrl(href, prefix);
                        return isEditing
                          ? <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border text-white/40"
                              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                              <Icon size={12} /><span>{label}</span>
                              <button onClick={() => removeSocialLink(key)} className="ml-1 text-red-400/70 hover:text-red-300"><X size={9} /></button>
                            </div>
                          : <a key={key} href={fullHref} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all text-white/40 hover:text-white/80"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <Icon size={12} /><span>{label}</span>
                            </a>;
                      })}
                    </div>
                  )}
                  {isEditing && emptySocials.length > 0 && (
                    <div className="rounded-xl p-4 flex flex-wrap gap-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                      <span className="w-full text-[10px] text-white/25 uppercase tracking-widest font-medium mb-1">Adicionar redes</span>
                      {emptySocials.map(key => {
                        const { Icon, label } = SOCIAL_META[key]; return (
                          <button key={key} onClick={() => openSocialModal(key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all text-white/30 hover:text-white/70"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                            <Plus size={9} /><Icon size={11} /><span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!isEditing && filledSocials.length === 0 && (
                    <p className="text-xs text-white/20 italic">Nenhuma rede social adicionada.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── CURSOS EM ANDAMENTO ── */}
            <CursosEmAndamento userId={user.id} />

            {/* ── CONQUISTAS ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-7"
              style={{
                background: "linear-gradient(160deg, hsl(230 30% 9%) 0%, hsl(270 40% 7%) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.18em] font-medium mb-1">Suas conquistas</p>
                  <h2 className="text-lg font-bold text-white/90 flex items-center gap-2.5">
                    <Trophy size={18} style={{ color: "hsl(45 90% 55%)" }} /> Conquistas
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">{ALL_MEDALS.length} medalhas</span>
                  {isEditing && (
                    <button onClick={() => setMedalPickerOpen(p => !p)}
                      className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-xl transition-all"
                      style={medalPickerOpen
                        ? { background: `${ringColor}18`, color: ringColor, border: `1px solid ${ringColor}40` }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }
                      }>
                      <Pencil size={9} /> Editar
                    </button>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {isEditing && medalPickerOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                    <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest font-medium mb-3">Escolha até 3 para exibir ({ativasCount}/3)</p>
                      {medalhas.map(ms => {
                        const medal = ALL_MEDALS.find(a => a.id === ms.id); if (!medal) return null;
                        const Icon = medal.icon;
                        return (
                          <button key={medal.id} onClick={() => handleToggleMedal(medal.id)} disabled={!ms.ativa && ativasCount >= 3}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all disabled:opacity-30"
                            style={{ background: ms.ativa ? `${medal.color}10` : "transparent", border: `1px solid ${ms.ativa ? medal.color + "30" : "transparent"}` }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
                              <Icon size={13} style={{ color: medal.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white/80 truncate">{medal.title}</p>
                              <p className="text-[9px] text-white/30 truncate">{medal.desc}</p>
                            </div>
                            {ms.ativa && <CheckCircle2 size={14} style={{ color: medal.color, flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {featuredMedals.map((medal, i) => {
                  const Icon = medal.icon;
                  const isHov = hoveredMedal === medal.id;
                  return (
                    <motion.div key={medal.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                      onMouseEnter={() => setHoveredMedal(medal.id)} onMouseLeave={() => setHoveredMedal(null)}
                      className="relative rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-250 cursor-default"
                      style={{
                        background: isHov ? medal.bg : `${medal.color}06`,
                        border: `1px solid ${isHov ? medal.border : medal.color + "18"}`,
                        boxShadow: isHov ? `0 0 32px ${medal.glow}, 0 8px 24px rgba(0,0,0,0.3)` : "0 4px 12px rgba(0,0,0,0.2)",
                        transform: isHov ? "translateY(-2px)" : "none",
                      }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                        style={{ background: medal.bg, border: `2px solid ${medal.border}`, boxShadow: `0 0 20px ${medal.glow}` }}>
                        <Icon size={26} style={{ color: medal.color }} />
                      </div>
                      <p className="text-xs font-bold text-white/85 leading-snug mb-1">{medal.title}</p>
                      <p className="text-[9px] text-white/30 leading-snug mb-3">{medal.desc}</p>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ color: RARITY_COLOR[medal.rarity], background: `${RARITY_COLOR[medal.rarity]}12`, border: `1px solid ${RARITY_COLOR[medal.rarity]}25` }}>{medal.rarity}</span>
                        <span className="text-[8px] text-white/20 flex items-center gap-0.5"><Clock size={7} /> {medal.date}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── CERTIFICADOS ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-7"
              style={{
                background: "linear-gradient(160deg, hsl(230 30% 9%) 0%, hsl(155 40% 6%) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              }}
            >
              <div className="mb-6">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.18em] font-medium mb-1">Credenciais</p>
                <h2 className="text-lg font-bold text-white/90 flex items-center gap-2.5">
                  <Shield size={17} className="text-primary/70" /> Certificados
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.certificados && profile.certificados.length > 0 ? (
                  profile.certificados.map((cert) => (
                    <motion.div key={cert.id}
                      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 20px hsl(155 60% 45% / 0.1)" }}
                      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(155 60% 45% / 0.1)", border: "1px solid hsl(155 60% 45% / 0.25)" }}>
                        <Shield size={15} className="text-primary/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 leading-snug truncate">{cert.title}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{cert.provider} · {cert.date}</p>
                      </div>
                      <ArrowUpRight size={13} className="text-white/15 flex-shrink-0" />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                    <p className="text-xs text-white/20 italic">Você ainda não possui certificados. Complete um curso para conquistar o seu primeiro!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropSrc && cropType && (
          <ImageCropModal src={cropSrc} shape={cropType === "photo" ? "circle" : "rect"}
            outputWidth={cropType === "photo" ? 400 : 1200} outputHeight={cropType === "photo" ? 400 : 320}
            onConfirm={handleCropConfirm} onCancel={() => { setCropSrc(null); setCropType(null); }} />
        )}
      </AnimatePresence>

      {/* Social Modal */}
      <AnimatePresence>
        {socialModal && (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setSocialModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="hologram-panel rounded-sm p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              {(() => {
                const { Icon, label, placeholder } = SOCIAL_META[socialModal];
                return (
                  <>
                    <div className="flex items-center gap-2 mb-4"><Icon size={16} className="text-primary" /><h3 className="font-display font-bold text-foreground">Adicionar {label}</h3></div>
                    <input autoFocus type="text" value={socialInput} onChange={e => setSocialInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveSocialModal()} placeholder={placeholder}
                      className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    <div className="flex gap-2 mt-4 justify-end">
                      <button onClick={() => setSocialModal(null)} className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground">Cancelar</button>
                      <button onClick={saveSocialModal} className="px-3 py-1.5 text-xs font-accent font-semibold text-primary-foreground rounded-sm" style={{ background: "hsl(155 60% 40%)" }}>Salvar</button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </MainLandmark>
    </div>
  );
};

export default ProfilePage;