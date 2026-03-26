import { useEffect, useRef, useState } from "react";
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
import Progress from "@/components/progress";
import Vagas from "@/components/Vagas";
import CursosEmAndamento from "@/components/CursosEmAndamento";
import supabase from "../../utils/supabase";

export type Borda = { id: string; img_url: string; nome: string; ativa: boolean };
export type MedalStatus = { id: number; ativa: boolean };
export type Profile = {
  user_id?: string; name?: string; descricao?: string; perfil?: string; banner?: string;
  redes?: Partial<Record<SocialKey, string>>; bordas?: Borda[]; medalhas?: MedalStatus[];
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
  linkedin:  { label: "LinkedIn",  Icon: Linkedin,  placeholder: "https://linkedin.com/in/usuario", prefix: "https://" },
  github:    { label: "GitHub",    Icon: Github,    placeholder: "https://github.com/usuario",      prefix: "https://" },
  twitter:   { label: "Twitter/X", Icon: Twitter,   placeholder: "https://x.com/usuario",           prefix: "https://" },
  instagram: { label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/usuario",   prefix: "https://" },
  facebook:  { label: "Facebook",  Icon: Facebook,  placeholder: "https://facebook.com/usuario",    prefix: "https://" },
  email:     { label: "E-mail",    Icon: Mail,      placeholder: "seu@email.com",                   prefix: "mailto:"  },
  website:   { label: "Website",   Icon: Globe,     placeholder: "https://seusite.com",             prefix: "https://" },
};
const ALL_SOCIAL_KEYS = Object.keys(SOCIAL_META) as SocialKey[];

const ALL_MEDALS = [
  { id: 1, icon: Code2,    title: "Primeira Linha de Código", desc: "Concluiu Fundamentos de Programação",             color: "hsl(155 60% 45%)", bg: "hsl(155 60% 45% / 0.12)", border: "hsl(155 60% 45% / 0.35)", glow: "hsl(155 60% 45% / 0.3)", date: "Jan 2025", rarity: "Comum"    },
  { id: 2, icon: Brain,    title: "Mente Analítica",          desc: "Concluiu Python para Data Science",               color: "hsl(210 70% 60%)", bg: "hsl(210 70% 60% / 0.12)", border: "hsl(210 70% 60% / 0.35)", glow: "hsl(210 70% 60% / 0.3)", date: "Mar 2025", rarity: "Rara"     },
  { id: 3, icon: Shield,   title: "Guardião Digital",         desc: "Concluiu Introdução a Cibersegurança",            color: "hsl(0 70% 60%)",   bg: "hsl(0 70% 60% / 0.12)",   border: "hsl(0 70% 60% / 0.35)",   glow: "hsl(0 70% 60% / 0.3)",   date: "Mai 2025", rarity: "Épica"    },
  { id: 4, icon: Cloud,    title: "Arquiteto de Nuvens",      desc: "Concluiu Cloud Computing Basics",                 color: "hsl(45 90% 55%)",  bg: "hsl(45 90% 55% / 0.12)",  border: "hsl(45 90% 55% / 0.35)",  glow: "hsl(45 90% 55% / 0.3)",  date: "Jul 2025", rarity: "Rara"     },
  { id: 5, icon: Database, title: "Mestre dos Dados",         desc: "Concluiu Fundamentos de SQL",                     color: "hsl(270 60% 65%)", bg: "hsl(270 60% 65% / 0.12)", border: "hsl(270 60% 65% / 0.35)", glow: "hsl(270 60% 65% / 0.3)", date: "Ago 2025", rarity: "Comum"    },
  { id: 6, icon: Cpu,      title: "Pioneiro em IA",           desc: "Concluiu Fundamentos de Inteligência Artificial", color: "hsl(25 90% 55%)",  bg: "hsl(25 90% 55% / 0.12)",  border: "hsl(25 90% 55% / 0.35)",  glow: "hsl(25 90% 55% / 0.3)",  date: "Out 2025", rarity: "Lendária" },
];
const RARITY_COLOR: Record<string, string> = { Comum: "hsl(215 20% 60%)", Rara: "hsl(210 70% 60%)", Épica: "hsl(270 60% 65%)", Lendária: "hsl(45 90% 55%)" };
const JOBS_BY_DISC: Record<string, Array<{ title: string; company: string; salary: string; type: string }>> = {
  D: [{ title: "Tech Lead", company: "Nubank", salary: "R$18–25k", type: "Remoto" }, { title: "Product Owner", company: "iFood", salary: "R$14–20k", type: "Híbrido" }],
  I: [{ title: "Product Manager", company: "Hotmart", salary: "R$12–18k", type: "Remoto" }, { title: "UX Lead", company: "Conta Simples", salary: "R$10–15k", type: "Remoto" }],
  S: [{ title: "DevOps Engineer", company: "PicPay", salary: "R$12–18k", type: "Remoto" }, { title: "Backend Dev Sr", company: "Banco Inter", salary: "R$14–20k", type: "Híbrido" }],
  C: [{ title: "Data Scientist", company: "Itaú BBA", salary: "R$14–22k", type: "Híbrido" }, { title: "Cyber Analyst", company: "Tempest", salary: "R$12–18k", type: "Remoto" }],
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
  const disc  = assessment.discProfile ?? "S";
  const color = DISC_COLORS[disc] ?? "hsl(155 60% 45%)";
  const label = DISC_LABELS[disc] ?? "Estabilidade";
  const desc  = DISC_DESC[disc]   ?? "";
  const img   = DISC_IMGS[disc];
  const scoreEntries = Object.entries(assessment.discScores ?? {}).sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
  const { user, logout, assessment } = useAuth();
  const navigate = useNavigate();

  const [vagasDinamicas, setVagasDinamicas] = useState<any[]>([]);
  const [loadingVagas,   setLoadingVagas]   = useState(false);
  const [loading,        setLoading]        = useState(true);

  const photoInputRef  = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [profile,        setProfile]        = useState<Profile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState<string | null>(null);

  const [isEditing,        setIsEditing]        = useState(false);
  const [draftName,        setDraftName]        = useState("");
  const [draftDescricao,   setDraftDescricao]   = useState("");
  const [draftPhoto,       setDraftPhoto]       = useState<string | null>(null);
  const [draftBanner,      setDraftBanner]      = useState<string | null>(null);
  const [draftSocial,      setDraftSocial]      = useState<Partial<Record<SocialKey, string>>>({});
  const [draftMedalhas,    setDraftMedalhas]    = useState<MedalStatus[] | null>(null);
  const [draftBordas,      setDraftBordas]      = useState<Borda[] | null>(null);
  const [borderPickerOpen, setBorderPickerOpen] = useState(false);
  const [cropSrc,          setCropSrc]          = useState<string | null>(null);
  const [cropType,         setCropType]         = useState<"photo" | "banner" | null>(null);
  const [socialModal,      setSocialModal]      = useState<SocialKey | null>(null);
  const [socialInput,      setSocialInput]      = useState("");
  const [medalPickerOpen,  setMedalPickerOpen]  = useState(false);
  const [hoverPhoto,       setHoverPhoto]       = useState(false);
  const [hoveredMedal,     setHoveredMedal]     = useState<number | null>(null);

  // Modal resultado avaliação — abre 1 vez após concluir
  const [showResultModal, setShowResultModal] = useState(() => sessionStorage.getItem("show_assessment_result") === "1");
  const handleCloseResultModal = () => { setShowResultModal(false); sessionStorage.removeItem("show_assessment_result"); };

  // Carrega dados
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoading(true);
      try {
        const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
        if (prof) setProfile(prof as Profile);

        const { data: cursoInteresse } = await supabase
          .from("watch").select("course_id, courses(name)")
          .eq("user_id", user.id).limit(1).maybeSingle();

        if (cursoInteresse) {
          const courseName = (cursoInteresse.courses as any)?.name;
          if (courseName) {
            setLoadingVagas(true);
            const jobs = await fetchVagasByInterest(courseName);
            setVagasDinamicas(jobs.slice(0, 3).map((j: any) => ({
              title: j.job_title, company: j.employer_name,
              salary: j.job_min_salary ? `R$ ${j.job_min_salary}` : "A combinar",
              type: j.job_is_remote ? "Remoto" : (j.job_city || "Brasil"), url: j.job_apply_link,
            })));
          }
        }
      } catch (err) { console.error("Erro ao carregar dados:", err); }
      finally { setLoadingVagas(false); setLoading(false); }
    }
    loadData();
  }, [user]);

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    async function syncProfile() {
      setLoadingProfile(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (error) setProfile({ user_id: user.id, name: user.name, redes: {}, bordas: [] });
      else setProfile(data as Profile);
      setLoadingProfile(false);
    }
    syncProfile();
  }, [user]);

  if (!user) return null;

  // Derivados
  const discProfile = assessment?.discProfile ?? "S";
  const ringColor   = DISC_COLORS[discProfile] ?? "hsl(155 60% 45%)";

  const displayPhoto  = isEditing ? (draftPhoto  !== null ? (draftPhoto  || null) : (profile.perfil ?? null)) : (profile.perfil ?? null);
  const displayBanner = isEditing ? (draftBanner !== null ? (draftBanner || null) : (profile.banner ?? null)) : (profile.banner ?? null);
  const displaySocial: Partial<Record<SocialKey, string>> = isEditing
    ? Object.fromEntries(ALL_SOCIAL_KEYS.map(k => [k, k in draftSocial ? draftSocial[k] : (profile.redes ?? {})[k]]))
    : (profile.redes ?? {});

  const bordas: Borda[]          = (isEditing ? (draftBordas   ?? profile.bordas)   : profile.bordas)   ?? [];
  const bordaAtiva: Borda | null  = getBordaAtiva(bordas);
  const medalhas: MedalStatus[]   = (isEditing ? (draftMedalhas ?? profile.medalhas) : profile.medalhas) ?? [];
  const ativasCount               = medalhas.filter(m => m.ativa).length;
  const featuredMedals            = medalhas.filter(m => m.ativa).map(m => ALL_MEDALS.find(a => a.id === m.id)).filter(Boolean) as typeof ALL_MEDALS[number][];
  const filledSocials             = ALL_SOCIAL_KEYS.filter(k => displaySocial[k]);
  const emptySocials              = ALL_SOCIAL_KEYS.filter(k => !displaySocial[k]);

  // XP e nível vêm do banco diretamente
  const currentLevel  = profile.nivel    || 1;
  const currentXP     = Number(profile.total_xp || 0);
  const xpNextLevel   = currentLevel * 1000;
  const xpProgress    = Math.min((currentXP / xpNextLevel) * 100, 100);
  const currentStreak = 12;
  const currentRank   = 48;

  // Handlers edição
  const handleStartEdit = () => {
    setDraftName(profile.name ?? user.name ?? ""); setDraftDescricao(profile.descricao ?? "");
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
      if (draftPhoto  !== null) perfil = draftPhoto  === "" ? null : await uploadCroppedImage(draftPhoto,  user.id, "photo");
      if (draftBanner !== null) banner = draftBanner === "" ? null : await uploadCroppedImage(draftBanner, user.id, "banner");
      const redes: Partial<Record<SocialKey, string>> = {};
      ALL_SOCIAL_KEYS.forEach(k => { const val = k in draftSocial ? draftSocial[k] : (profile.redes ?? {})[k]; if (val?.trim()) redes[k] = val.trim(); });
      const payload: Profile = { user_id: user.id, name: draftName.trim() || profile.name || null, descricao: draftDescricao.trim() || profile.descricao || null, perfil, banner, redes, bordas, medalhas: draftMedalhas ?? profile.medalhas ?? [] };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setProfile(payload);
      setIsEditing(false); setMedalPickerOpen(false); setBorderPickerOpen(false);
    } catch (err: any) { setSaveError(err?.message ?? "Erro ao salvar perfil."); }
    finally { setSaving(false); }
  };

  const handleEscolherBorda  = (id: string | null) => { const base = draftBordas ?? profile.bordas ?? []; setDraftBordas(setBordaAtiva(base, id)); };
  const readAndOpenCrop      = (file: File, type: "photo" | "banner") => { const r = new FileReader(); r.onload = e => { setCropSrc(e.target?.result as string); setCropType(type); }; r.readAsDataURL(file); };
  const handlePhotoFile      = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "photo");  e.target.value = ""; };
  const handleBannerFile     = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "banner"); e.target.value = ""; };
  const handleCropConfirm    = (dataUrl: string) => { if (cropType === "photo") setDraftPhoto(dataUrl); if (cropType === "banner") setDraftBanner(dataUrl); setCropSrc(null); setCropType(null); };
  const openSocialModal      = (key: SocialKey) => { setSocialInput(displaySocial[key] ?? ""); setSocialModal(key); };
  const saveSocialModal      = () => { if (!socialModal) return; setDraftSocial(prev => ({ ...prev, [socialModal]: socialInput.trim() })); setSocialModal(null); setSocialInput(""); };
  const removeSocialLink     = (key: SocialKey) => setDraftSocial(prev => ({ ...prev, [key]: "" }));
  const handleToggleMedal    = (id: number) => { const base = draftMedalhas ?? profile.medalhas ?? []; setDraftMedalhas(toggleMedalAtiva(base, id)); };

  if (loadingProfile) return <div className="min-h-screen gradient-hero scanline flex items-center justify-center"><Loader2 size={32} className="text-primary animate-spin" /></div>;

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <AnimatePresence>
        {showResultModal && assessment?.completed && (
          <AssessmentResultModal assessment={assessment} onClose={handleCloseResultModal} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

          {/* COLUNA ESQUERDA */}
          <aside className="hidden lg:flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="hologram-panel rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Star size={14} className="text-accent" /><span className="font-display text-sm font-bold text-foreground">Nível {currentLevel}</span></div>
                <span className="text-[10px] font-accent text-muted-foreground">{currentXP} / {xpNextLevel} XP</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(45 90% 45%), hsl(45 90% 65%))" }} />
              </div>
              <p className="text-[10px] text-muted-foreground font-body">
                {xpNextLevel - currentXP > 0 ? `${xpNextLevel - currentXP} XP para o nível ${currentLevel + 1}` : "Nível máximo!"}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { icon: Flame,  label: "Streak",  value: `${currentStreak}d`, color: "hsl(25 90% 55%)"  },
                  { icon: Trophy, label: "Ranking",  value: `#${currentRank}`,  color: "hsl(45 90% 55%)"  },
                  { icon: Zap,    label: "Medalhas", value: `${profile.medalhas?.length || 0}`, color: "hsl(155 60% 45%)" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-sm p-2 text-center" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <Icon size={12} style={{ color, margin: "0 auto 2px" }} />
                    <p className="font-display text-xs font-bold" style={{ color }}>{value}</p>
                    <p className="text-[8px] text-muted-foreground font-accent">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <Vagas ringColor={ringColor} discProfile={assessment?.discProfile || "S"} recommendedJobs={vagasDinamicas} />

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="hologram-panel rounded-sm p-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Zap size={14} className="text-primary" /> Progresso Geral</h3>
              <Progress />
            </motion.div>
          </aside>

          {/* COLUNA CENTRAL */}
          <main className="space-y-6 min-w-0">

            {/* Card perfil */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hologram-panel rounded-sm overflow-hidden">
              <div className="relative w-full" style={{ height: 130 }}>
                {displayBanner
                  ? <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${ringColor}44 0%, ${ringColor}11 60%, hsl(210 40% 10% / 0.2) 100%)` }}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 24px,hsl(155 60% 45%)1px),repeating-linear-gradient(90deg,transparent,transparent 24px,hsl(155 60% 45%)1px)" }} />
                    </div>}
                {isEditing && (
                  <button type="button" onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                    <ImageIcon size={12} /> Alterar banner
                  </button>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
              </div>

              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4" style={{ marginTop: -20 }}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative" style={{ width: 112, height: 112 }}>
                    {bordaAtiva
                      ? <img src={bordaAtiva.img_url} alt={bordaAtiva.nome} className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                      : DISC_IMGS[discProfile]
                        ? <img src={DISC_IMGS[discProfile]} alt={DISC_LABELS[discProfile]} className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                        : null}
                    <div onClick={() => isEditing && photoInputRef.current?.click()}
                      onMouseEnter={() => isEditing && setHoverPhoto(true)} onMouseLeave={() => setHoverPhoto(false)}
                      className="absolute rounded-full overflow-hidden bg-secondary flex items-center justify-center"
                      style={{ width: 80, height: 80, top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2, border: "3px solid hsl(var(--background))", cursor: isEditing ? "pointer" : "default" }}>
                      {displayPhoto ? <img src={displayPhoto} alt="Foto" className="w-full h-full object-cover" /> : <User size={28} className="text-muted-foreground" />}
                      <AnimatePresence>
                        {isEditing && hoverPhoto && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                            style={{ background: "rgba(0,0,0,0.6)" }}>
                            <Camera size={16} className="text-white" /><span className="text-[8px] text-white font-accent">Alterar</span>
                            {displayPhoto && <button type="button" onClick={e => { e.stopPropagation(); setDraftPhoto(""); }} className="text-[7px] text-red-300 font-accent mt-0.5 hover:text-red-100">remover</button>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
                    {isEditing && (
                      <button type="button" onClick={() => setBorderPickerOpen(p => !p)}
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ zIndex: 3, background: borderPickerOpen ? ringColor : "hsl(var(--secondary))", border: "2px solid hsl(var(--background))", boxShadow: borderPickerOpen ? `0 0 8px ${ringColor}60` : "none" }}>
                        <Sparkles size={12} style={{ color: borderPickerOpen ? "white" : "hsl(var(--muted-foreground))" }} />
                      </button>
                    )}
                  </div>

                  {/* Nome + botões */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
                    <div className="flex-1 min-w-0 z-50">
                      {isEditing
                        ? <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="Seu nome"
                            className="font-display text-xl font-bold text-foreground bg-transparent border-b border-primary/50 focus:outline-none focus:border-primary w-full pb-0.5 mb-1" />
                        : <h1 className="font-display text-xl font-bold text-foreground truncate">{profile.name ?? user.name}</h1>}
                      <p className="text-sm text-muted-foreground font-body">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full text-primary-foreground" style={{ backgroundColor: ringColor }}>{DISC_LABELS[discProfile]}</span>
                        <span className="text-[10px] font-accent text-accent">Nível {currentLevel}</span>
                        <span className="text-[10px] font-accent text-muted-foreground flex items-center gap-0.5"><Flame size={10} className="text-orange-400" /> {currentStreak} dias seguidos</span>
                      </div>
                      {!assessment?.completed && (
                        <Link to="/avaliacao" className="block mt-1 text-xs text-accent hover:underline font-accent">Completar Avaliação →</Link>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        {!isEditing
                          ? <button onClick={handleStartEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-foreground border border-border hover:border-primary hover:text-primary transition-colors"><Pencil size={12} /> Editar Perfil</button>
                          : <>
                              <button onClick={handleConfirmEdit} disabled={saving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-primary-foreground disabled:opacity-60"
                                style={{ background: "hsl(155 60% 40%)" }}>
                                {saving ? <><Loader2 size={12} className="animate-spin" /> Salvando…</> : <><Check size={12} /> Confirmar</>}
                              </button>
                              <button onClick={handleCancelEdit} disabled={saving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-muted-foreground border border-border hover:text-destructive hover:border-destructive transition-colors disabled:opacity-60">
                                <X size={12} /> Cancelar
                              </button>
                            </>}
                      </div>
                      {saveError && <p className="text-[10px] text-red-400 font-accent text-right max-w-[200px]">{saveError}</p>}
                    </div>
                  </div>
                </div>

                {/* Border picker */}
                <AnimatePresence>
                  {isEditing && borderPickerOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
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
                <div className="mt-4">
                  {isEditing
                    ? <textarea value={draftDescricao} onChange={e => setDraftDescricao(e.target.value)} placeholder="Escreva uma bio curta sobre você…" rows={3}
                        className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
                    : profile.descricao ? <p className="text-sm font-body text-muted-foreground leading-relaxed">{profile.descricao}</p> : null}
                </div>

                {/* Redes sociais */}
                <div className="mt-4">
                  {filledSocials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filledSocials.map(key => {
                        const { Icon, label, prefix } = SOCIAL_META[key];
                        const href = displaySocial[key]!;
                        const fullHref = href.startsWith("http") || href.startsWith("mailto") ? href : (prefix ?? "") + href;
                        return isEditing
                          ? <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-primary/30 text-muted-foreground"><Icon size={13} /><span>{label}</span><button onClick={() => removeSocialLink(key)} className="ml-1 text-red-400 hover:text-red-300"><X size={10} /></button></div>
                          : <a key={key} href={fullHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-transparent hover:border-primary/50 hover:text-primary text-muted-foreground transition-all"><Icon size={13} /><span>{label}</span></a>;
                      })}
                    </div>
                  )}
                  {isEditing && emptySocials.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-sm p-3 flex flex-wrap gap-2" style={{ border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
                      <span className="w-full text-[10px] text-muted-foreground font-accent mb-1">Adicionar redes sociais</span>
                      {emptySocials.map(key => { const { Icon, label } = SOCIAL_META[key]; return (
                        <button key={key} onClick={() => openSocialModal(key)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground transition-all">
                          <Plus size={10} /><Icon size={12} /><span>{label}</span>
                        </button>
                      ); })}
                    </motion.div>
                  )}
                  {!isEditing && filledSocials.length === 0 && <p className="text-xs text-muted-foreground font-accent italic">Nenhuma rede social adicionada.</p>}
                </div>
              </div>
            </motion.div>

            {/* ── CURSOS EM ANDAMENTO ── */}
            <CursosEmAndamento userId={user.id} />

            {/* ── MEDALHAS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="hologram-panel rounded-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Trophy size={18} className="text-accent" /> Conquistas</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-accent text-muted-foreground">{ALL_MEDALS.length} medalhas</span>
                  {isEditing && (
                    <button onClick={() => setMedalPickerOpen(p => !p)}
                      className="flex items-center gap-1.5 text-[10px] font-accent px-2 py-1 rounded-sm border transition-all"
                      style={medalPickerOpen ? { background: `${ringColor}20`, color: ringColor, border: `1px solid ${ringColor}50` } : { color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}>
                      <Pencil size={9} /> Editar medalhas
                    </button>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {isEditing && medalPickerOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
                    <div className="rounded-sm p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}>
                      <p className="text-[9px] font-accent text-muted-foreground mb-2">Escolha até 3 medalhas para exibir ({ativasCount}/3)</p>
                      {medalhas.map(ms => {
                        const medal = ALL_MEDALS.find(a => a.id === ms.id); if (!medal) return null;
                        const Icon = medal.icon;
                        return (
                          <button key={medal.id} onClick={() => handleToggleMedal(medal.id)} disabled={!ms.ativa && ativasCount >= 3}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all disabled:opacity-40"
                            style={{ background: ms.ativa ? `${medal.color}14` : "transparent", border: `1px solid ${ms.ativa ? medal.color + "40" : "transparent"}` }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
                              <Icon size={12} style={{ color: medal.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-accent font-semibold text-foreground truncate">{medal.title}</p>
                              <p className="text-[9px] text-muted-foreground font-body truncate">{medal.desc}</p>
                            </div>
                            {ms.ativa && <CheckCircle2 size={13} style={{ color: medal.color, flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featuredMedals.map((medal, i) => {
                  const Icon = medal.icon;
                  const isHovered = hoveredMedal === medal.id;
                  return (
                    <motion.div key={medal.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.07 }}
                      onMouseEnter={() => setHoveredMedal(medal.id)} onMouseLeave={() => setHoveredMedal(null)}
                      className="relative rounded-sm p-4 flex flex-col items-center text-center transition-all duration-200"
                      style={{ background: isHovered ? medal.bg : `${medal.color}08`, border: `1px solid ${isHovered ? medal.border : medal.color + "20"}`, boxShadow: isHovered ? `0 0 18px ${medal.glow}` : "none" }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: medal.bg, border: `2px solid ${medal.border}`, boxShadow: `0 0 12px ${medal.glow}` }}>
                        <Icon size={22} style={{ color: medal.color }} />
                      </div>
                      <p className="text-[11px] font-accent font-semibold text-foreground leading-tight mb-0.5">{medal.title}</p>
                      <p className="text-[9px] text-muted-foreground font-body leading-tight mb-2">{medal.desc}</p>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <span className="text-[8px] font-accent font-bold px-1.5 py-0.5 rounded-sm" style={{ color: RARITY_COLOR[medal.rarity], background: `${RARITY_COLOR[medal.rarity]}15`, border: `1px solid ${RARITY_COLOR[medal.rarity]}30` }}>{medal.rarity}</span>
                        <span className="text-[8px] text-muted-foreground font-body flex items-center gap-0.5"><Clock size={7} /> {medal.date}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* CERTIFICADOS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="hologram-panel rounded-sm p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Shield size={18} className="text-primary" /> Certificados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Fundamentos de IA",           date: "Jan 2025", provider: "UpJobs Academy" },
                  { title: "Python para Data Science",     date: "Mar 2025", provider: "UpJobs Academy" },
                  { title: "Introdução a Cibersegurança",  date: "Mai 2025", provider: "UpJobs Academy" },
                  { title: "Fundamentos de SQL",           date: "Ago 2025", provider: "UpJobs Academy" },
                ].map((cert, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}
                    className="flex items-start gap-3 p-4 rounded-sm border border-primary/15 hover:border-primary/35 transition-colors"
                    style={{ background: "hsl(155 60% 45% / 0.05)" }}>
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "hsl(155 60% 45% / 0.15)", border: "1px solid hsl(155 60% 45% / 0.3)" }}>
                      <Shield size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-accent font-semibold text-sm text-foreground leading-tight">{cert.title}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{cert.provider} · {cert.date}</p>
                    </div>
                    <ArrowUpRight size={12} className="text-muted-foreground/40 ml-auto flex-shrink-0 mt-0.5" />
                  </motion.div>
                ))}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
    </div>
  );
};

export default ProfilePage;