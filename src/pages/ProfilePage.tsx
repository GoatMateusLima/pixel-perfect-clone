import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, BookOpen, ArrowUpRight, Pencil, Check, Plus, X, ImageIcon,
  Camera, Flame, Star, Zap, Trophy, Target, Clock, MapPin,
  Linkedin, Github, Facebook, Mail, Twitter, Instagram, Globe,
  Shield, Code2, Brain, Database, Cloud, Lock, Cpu, Layers,
  ChevronRight, TrendingUp, CheckCircle2,
} from "lucide-react";
import dominanciaImg   from "@/assets/disc/Dominancia.webp";
import influenciaImg   from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";
import ImageCropModal  from "@/components/ImageCropModal";
import Header          from "@/components/Header";

// ─── DISC ────────────────────────────────────────────────────────────────────
const DISC_IMGS: Record<string, string> = {
  D: dominanciaImg, I: influenciaImg, S: estabilidadeImg, C: conformidadeImg,
};
const DISC_LABELS: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};
const DISC_COLORS: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};
const DISC_TRAITS: Record<string, string[]> = {
  D: ["Orientado a resultados", "Direto e decisivo", "Líder natural", "Alta energia"],
  I: ["Comunicativo", "Criativo", "Persuasivo", "Entusiasta"],
  S: ["Confiável", "Paciente", "Colaborativo", "Consistente"],
  C: ["Analítico", "Preciso", "Detalhista", "Metódico"],
};
const DISC_CAREERS: Record<string, string[]> = {
  D: ["Tech Lead", "CTO", "Product Owner", "Scrum Master"],
  I: ["Product Manager", "UX Designer", "Dev Advocate", "Marketing Tech"],
  S: ["DevOps Engineer", "QA Engineer", "Backend Dev", "Cloud Architect"],
  C: ["Data Scientist", "Security Analyst", "BI Developer", "ML Engineer"],
};

// ─── Social ───────────────────────────────────────────────────────────────────
type SocialKey = "linkedin" | "github" | "facebook" | "twitter" | "instagram" | "email" | "website";
const SOCIAL_META: Record<SocialKey, { label: string; Icon: React.ElementType; placeholder: string; prefix?: string }> = {
  linkedin:  { label: "LinkedIn",    Icon: Linkedin,  placeholder: "https://linkedin.com/in/usuario", prefix: "https://" },
  github:    { label: "GitHub",      Icon: Github,    placeholder: "https://github.com/usuario",      prefix: "https://" },
  facebook:  { label: "Facebook",    Icon: Facebook,  placeholder: "https://facebook.com/usuario",    prefix: "https://" },
  twitter:   { label: "Twitter/X",   Icon: Twitter,   placeholder: "https://x.com/usuario",           prefix: "https://" },
  instagram: { label: "Instagram",   Icon: Instagram, placeholder: "https://instagram.com/usuario",   prefix: "https://" },
  email:     { label: "E-mail",      Icon: Mail,      placeholder: "seu@email.com",                   prefix: "mailto:"  },
  website:   { label: "Website",     Icon: Globe,     placeholder: "https://seusite.com",             prefix: "https://" },
};
const ALL_SOCIAL_KEYS = Object.keys(SOCIAL_META) as SocialKey[];

// ─── Medalhas mockadas ────────────────────────────────────────────────────────
const ALL_MEDALS = [
  { id: 1, icon: Code2, title: "Primeira Linha de Código", desc: "Concluiu Fundamentos de Programação", color: "hsl(155 60% 45%)", bg: "hsl(155 60% 45% / 0.12)", border: "hsl(155 60% 45% / 0.35)", glow: "hsl(155 60% 45% / 0.3)", date: "Jan 2025", rarity: "Comum" },
  { id: 2, icon: Brain, title: "Mente Analítica", desc: "Concluiu Python para Data Science", color: "hsl(210 70% 60%)", bg: "hsl(210 70% 60% / 0.12)", border: "hsl(210 70% 60% / 0.35)", glow: "hsl(210 70% 60% / 0.3)", date: "Mar 2025", rarity: "Rara" },
  { id: 3, icon: Shield, title: "Guardião Digital", desc: "Concluiu Introdução a Cibersegurança", color: "hsl(0 70% 60%)", bg: "hsl(0 70% 60% / 0.12)", border: "hsl(0 70% 60% / 0.35)", glow: "hsl(0 70% 60% / 0.3)", date: "Mai 2025", rarity: "Épica" },
  { id: 4, icon: Cloud, title: "Arquiteto de Nuvens", desc: "Concluiu Cloud Computing Basics", color: "hsl(45 90% 55%)", bg: "hsl(45 90% 55% / 0.12)", border: "hsl(45 90% 55% / 0.35)", glow: "hsl(45 90% 55% / 0.3)", date: "Jul 2025", rarity: "Rara" },
  { id: 5, icon: Database, title: "Mestre dos Dados", desc: "Concluiu Fundamentos de SQL", color: "hsl(270 60% 65%)", bg: "hsl(270 60% 65% / 0.12)", border: "hsl(270 60% 65% / 0.35)", glow: "hsl(270 60% 65% / 0.3)", date: "Ago 2025", rarity: "Comum" },
  { id: 6, icon: Cpu, title: "Pioneiro em IA", desc: "Concluiu Fundamentos de Inteligência Artificial", color: "hsl(25 90% 55%)", bg: "hsl(25 90% 55% / 0.12)", border: "hsl(25 90% 55% / 0.35)", glow: "hsl(25 90% 55% / 0.3)", date: "Out 2025", rarity: "Lendária" },
];

const RARITY_COLOR: Record<string, string> = {
  Comum:    "hsl(215 20% 60%)",
  Rara:     "hsl(210 70% 60%)",
  Épica:    "hsl(270 60% 65%)",
  Lendária: "hsl(45 90% 55%)",
};

// ─── Cursos em andamento ──────────────────────────────────────────────────────
const MOCK_COURSES = [
  { title: "Machine Learning Avançado", progress: 65,  icon: Brain },
  { title: "Cloud Computing AWS",       progress: 30,  icon: Cloud },
  { title: "Cibersegurança Ofensiva",   progress: 10,  icon: Lock  },
];

// ─── Timeline de atividade ────────────────────────────────────────────────────
const ACTIVITY_TIMELINE = [
  { type: "medal",   text: "Conquistou a medalha Pioneiro em IA",        time: "há 2d",  color: "hsl(25 90% 55%)"  },
  { type: "course",  text: "Avançou 15% em Machine Learning Avançado",   time: "há 3d",  color: "hsl(155 60% 45%)" },
  { type: "post",    text: "Publicou um post na Comunidade",             time: "há 5d",  color: "hsl(210 70% 55%)" },
  { type: "medal",   text: "Conquistou a medalha Mestre dos Dados",      time: "há 1sem",color: "hsl(270 60% 65%)" },
  { type: "course",  text: "Concluiu Fundamentos de SQL",                time: "há 2sem",color: "hsl(155 60% 45%)" },
  { type: "login",   text: "Completou 7 dias seguidos de estudo 🔥",     time: "há 2sem",color: "hsl(45 90% 55%)"  },
];

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  medal:  Trophy,
  course: BookOpen,
  post:   Layers,
  login:  Flame,
};

// ─── Vagas recomendadas ───────────────────────────────────────────────────────
const JOBS_BY_DISC: Record<string, Array<{ title: string; company: string; salary: string; type: string }>> = {
  D: [
    { title: "Tech Lead",       company: "Nubank",       salary: "R$18–25k", type: "Remoto" },
    { title: "Product Owner",   company: "iFood",        salary: "R$14–20k", type: "Híbrido" },
    { title: "Engineering Mgr", company: "Mercado Livre",salary: "R$22–30k", type: "Remoto" },
  ],
  I: [
    { title: "Product Manager", company: "Hotmart",      salary: "R$12–18k", type: "Remoto" },
    { title: "UX Lead",         company: "Conta Simples",salary: "R$10–15k", type: "Remoto" },
    { title: "Dev Advocate",    company: "Stripe",       salary: "R$15–22k", type: "Remoto" },
  ],
  S: [
    { title: "DevOps Engineer", company: "PicPay",       salary: "R$12–18k", type: "Remoto" },
    { title: "Backend Dev Sr",  company: "Banco Inter",  salary: "R$14–20k", type: "Híbrido" },
    { title: "Cloud Architect", company: "Totvs",        salary: "R$16–24k", type: "Remoto" },
  ],
  C: [
    { title: "Data Scientist",  company: "Itaú BBA",     salary: "R$14–22k", type: "Híbrido" },
    { title: "Cyber Analyst",   company: "Tempest",      salary: "R$12–18k", type: "Remoto" },
    { title: "ML Engineer",     company: "Loft",         salary: "R$18–26k", type: "Remoto" },
  ],
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const KEY_PHOTO   = "upjobs_profile_photo_v2";
const KEY_BANNER  = "upjobs_profile_banner_v1";
const KEY_SOCIAL  = "upjobs_profile_social_v1";
const KEY_MEDALS  = "upjobs_profile_medals_v1";
if (typeof window !== "undefined") localStorage.removeItem("upjobs_profile_photo");

const DEFAULT_FEATURED_IDS = [1, 2, 3];

// ═════════════════════════════════════════════════════════════════════════════
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const photoInputRef  = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [photoSrc,    setPhotoSrc]    = useState<string | null>(() => localStorage.getItem(KEY_PHOTO));
  const [bannerSrc,   setBannerSrc]   = useState<string | null>(() => localStorage.getItem(KEY_BANNER));
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialKey, string>>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_SOCIAL) ?? "{}"); } catch { return {}; }
  });
  const [featuredMedalIds, setFeaturedMedalIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_MEDALS) ?? JSON.stringify(DEFAULT_FEATURED_IDS)); }
    catch { return DEFAULT_FEATURED_IDS; }
  });

  const [isEditing,       setIsEditing]      = useState(false);
  const [draftPhoto,      setDraftPhoto]     = useState<string | null>(null);
  const [draftBanner,     setDraftBanner]    = useState<string | null>(null);
  const [draftSocial,     setDraftSocial]    = useState<Partial<Record<SocialKey, string>>>({});
  const [draftMedalIds,   setDraftMedalIds]  = useState<number[]>([]);
  const [cropSrc,         setCropSrc]        = useState<string | null>(null);
  const [cropType,        setCropType]       = useState<"photo" | "banner" | null>(null);
  const [socialModal,     setSocialModal]    = useState<SocialKey | null>(null);
  const [socialInput,     setSocialInput]    = useState("");
  const [hoverPhoto,      setHoverPhoto]     = useState(false);
  const [hoveredMedal,    setHoveredMedal]   = useState<number | null>(null);
  const [medalPickerOpen, setMedalPickerOpen] = useState(false);

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
  if (!user) return null;

  const a           = user.assessment;
  const discProfile = a?.discProfile ?? "S";
  const ringColor   = DISC_COLORS[discProfile] ?? "hsl(155 60% 45%)";

  const displayPhoto  = isEditing ? (draftPhoto  !== null ? (draftPhoto  || null) : photoSrc)  : photoSrc;
  const displayBanner = isEditing ? (draftBanner !== null ? (draftBanner || null) : bannerSrc) : bannerSrc;
  const displaySocial: Partial<Record<SocialKey, string>> = isEditing
    ? Object.fromEntries(ALL_SOCIAL_KEYS.map(k => [k, k in draftSocial ? draftSocial[k] : socialLinks[k]]))
    : socialLinks;
  const activeMedalIds = isEditing ? draftMedalIds : featuredMedalIds;
  const featuredMedals = activeMedalIds.map(id => ALL_MEDALS.find(m => m.id === id)!).filter(Boolean);

  const handleStartEdit = () => {
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({});
    setDraftMedalIds([...featuredMedalIds]);
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({});
    setDraftMedalIds([]); setIsEditing(false); setMedalPickerOpen(false);
  };
  const handleConfirmEdit = () => {
    const fp = draftPhoto  !== null ? (draftPhoto  || null) : photoSrc;
    const fb = draftBanner !== null ? (draftBanner || null) : bannerSrc;
    const fs: Partial<Record<SocialKey, string>> = {};
    ALL_SOCIAL_KEYS.forEach(k => { const v = k in draftSocial ? draftSocial[k] : socialLinks[k]; if (v) fs[k] = v; });
    if (fp) localStorage.setItem(KEY_PHOTO, fp);   else localStorage.removeItem(KEY_PHOTO);
    if (fb) localStorage.setItem(KEY_BANNER, fb);  else localStorage.removeItem(KEY_BANNER);
    localStorage.setItem(KEY_SOCIAL, JSON.stringify(fs));
    localStorage.setItem(KEY_MEDALS, JSON.stringify(draftMedalIds));
    setPhotoSrc(fp); setBannerSrc(fb); setSocialLinks(fs);
    setFeaturedMedalIds(draftMedalIds);
    setIsEditing(false); setMedalPickerOpen(false);
  };

  const readAndOpenCrop  = (file: File, type: "photo" | "banner") => {
    const reader = new FileReader();
    reader.onload = (e) => { setCropSrc(e.target?.result as string); setCropType(type); };
    reader.readAsDataURL(file);
  };
  const handlePhotoFile  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "photo");  e.target.value = ""; };
  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "banner"); e.target.value = ""; };
  const handleCropConfirm = (dataUrl: string) => {
    if (cropType === "photo")  setDraftPhoto(dataUrl);
    if (cropType === "banner") setDraftBanner(dataUrl);
    setCropSrc(null); setCropType(null);
  };
  const openSocialModal = (key: SocialKey) => { setSocialInput(displaySocial[key] ?? ""); setSocialModal(key); };
  const saveSocialLink  = () => {
    if (!socialModal) return;
    setDraftSocial(p => ({ ...p, [socialModal]: socialInput.trim() }));
    setSocialModal(null); setSocialInput("");
  };
  const removeSocialLink = (key: SocialKey) => setDraftSocial(p => ({ ...p, [key]: "" }));

  const toggleDraftMedal = (id: number) => {
    setDraftMedalIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const filledSocials = ALL_SOCIAL_KEYS.filter(k => displaySocial[k]);
  const emptySocials  = ALL_SOCIAL_KEYS.filter(k => !displaySocial[k]);

  const recommendedJobs = JOBS_BY_DISC[discProfile] ?? JOBS_BY_DISC.S;
  const discTraits      = DISC_TRAITS[discProfile]  ?? DISC_TRAITS.S;

  // XP e nível mockados
  const XP_TOTAL = 2340;
  const XP_NEXT  = 3000;
  const LEVEL    = 7;
  const STREAK   = 12;
  const RANK     = 48;

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">

        {/* ── Grid 3 colunas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 items-start">

          {/* ═══════════════════════════════════════════
              COLUNA ESQUERDA
          ════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-4">

            {/* XP / Nível */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="hologram-panel rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-accent" />
                  <span className="font-display text-sm font-bold text-foreground">Nível {LEVEL}</span>
                </div>
                <span className="text-[10px] font-accent text-muted-foreground">{XP_TOTAL} / {XP_NEXT} XP</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(XP_TOTAL / XP_NEXT) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(45 90% 45%), hsl(45 90% 65%))" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body">{XP_NEXT - XP_TOTAL} XP para o nível {LEVEL + 1}</p>

              {/* Stats rápidos */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { icon: Flame,  label: "Streak",  value: `${STREAK}d`,          color: "hsl(25 90% 55%)"  },
                  { icon: Trophy, label: "Ranking",  value: `#${RANK}`,            color: "hsl(45 90% 55%)"  },
                  { icon: Zap,    label: "Medalhas", value: `${ALL_MEDALS.length}`, color: "hsl(155 60% 45%)" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-sm p-2 text-center" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <Icon size={12} style={{ color, margin: "0 auto 2px" }} />
                    <p className="font-display text-xs font-bold" style={{ color }}>{value}</p>
                    <p className="text-[8px] text-muted-foreground font-accent">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vagas recomendadas */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="hologram-panel rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">Vagas para você</h3>
                <span className="ml-auto text-[9px] font-accent px-1.5 py-0.5 rounded-sm"
                  style={{ background: `${ringColor}18`, color: ringColor, border: `1px solid ${ringColor}30` }}>
                  Perfil {discProfile}
                </span>
              </div>
              <div className="divide-y divide-border/20">
                {recommendedJobs.map((job, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }}
                    className="px-4 py-3 cursor-pointer transition group">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[12px] font-accent font-semibold text-foreground group-hover:text-primary transition leading-tight">{job.title}</p>
                      <ArrowUpRight size={11} className="text-muted-foreground/40 group-hover:text-primary transition flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">{job.company}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-accent font-semibold text-primary">{job.salary}</span>
                      <span className="text-[9px] font-accent text-muted-foreground flex items-center gap-0.5">
                        <MapPin size={8} /> {job.type}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border/30">
                <button className="w-full text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1">
                  Ver todas as vagas <ChevronRight size={11} />
                </button>
              </div>
            </motion.div>

          </aside>

          {/* ═══════════════════════════════════════════
              COLUNA CENTRAL
          ════════════════════════════════════════════ */}
          <main className="space-y-6 min-w-0">

            {/* ── PROFILE CARD ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="hologram-panel rounded-sm overflow-hidden">

              {/* Banner */}
              <div className="relative w-full" style={{ height: 130 }}>
                {displayBanner ? (
                  <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{
                    background: `linear-gradient(135deg, ${ringColor}44 0%, ${ringColor}11 60%, hsl(210 40% 10% / 0.2) 100%)`,
                  }}>
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 24px,hsl(155 60% 45%)1px),repeating-linear-gradient(90deg,transparent,transparent 24px,hsl(155 60% 45%)1px)" }} />
                  </div>
                )}
                {isEditing && (
                  <button type="button" onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                    <ImageIcon size={12} /> Alterar banner
                  </button>
                )}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
              </div>

              {/* Avatar + info */}
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4" style={{ marginTop: -40 }}>

                  {/* Avatar com DISC ring */}
                  <div className="flex-shrink-0 relative" style={{ width: 112, height: 112 }}>
                    {DISC_IMGS[discProfile] ? (
                      <img src={DISC_IMGS[discProfile]} alt={DISC_LABELS[discProfile]}
                        className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                    ) : (
                      <div className="absolute inset-0 rounded-full"
                        style={{ background: ringColor, zIndex: 1, boxShadow: `0 0 18px ${ringColor}60` }} />
                    )}
                    
                    {/* 👇 Aqui está a correção: trocamos o <button> por uma <div> */}
                    <div
                      onClick={() => isEditing && photoInputRef.current?.click()}
                      onMouseEnter={() => isEditing && setHoverPhoto(true)}
                      onMouseLeave={() => setHoverPhoto(false)}
                      className="absolute rounded-full overflow-hidden bg-secondary flex items-center justify-center focus:outline-none"
                      style={{ width: 80, height: 80, top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2, border: "3px solid hsl(var(--background))", cursor: isEditing ? "pointer" : "default" }}>
                      
                      {displayPhoto
                        ? <img src={displayPhoto} alt="Foto" className="w-full h-full object-cover" />
                        : <User size={28} className="text-muted-foreground" />
                      }
                      
                      <AnimatePresence>
                        {isEditing && hoverPhoto && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                            style={{ background: "rgba(0,0,0,0.55)" }}>
                            <Camera size={16} className="text-white" />
                            <span className="text-[8px] text-white font-accent">Alterar</span>
                            {displayPhoto && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setDraftPhoto(""); }}
                                className="text-[7px] text-red-300 font-accent mt-0.5 hover:text-red-100">remover</button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
                  </div>

                  {/* Nome + botões */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">{user.name}</h1>
                      <p className="text-sm text-muted-foreground font-body">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full text-primary-foreground"
                          style={{ backgroundColor: ringColor }}>
                          {DISC_LABELS[discProfile]}
                        </span>
                        <span className="text-[10px] font-accent text-accent">Nível {LEVEL}</span>
                        <span className="text-[10px] font-accent text-muted-foreground flex items-center gap-0.5">
                          <Flame size={10} className="text-orange-400" /> {STREAK} dias seguidos
                        </span>
                      </div>
                      {!a?.completed && (
                        <Link to="/avaliacao" className="block mt-1 text-xs text-accent hover:underline font-accent">Completar Avaliação →</Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <button onClick={handleStartEdit}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-foreground border border-border hover:border-primary hover:text-primary transition-colors">
                          <Pencil size={12} /> Editar Perfil
                        </button>
                      ) : (
                        <>
                          <button onClick={handleConfirmEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-primary-foreground"
                            style={{ background: "hsl(155 60% 40%)" }}>
                            <Check size={12} /> Confirmar
                          </button>
                          <button onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-muted-foreground border border-border hover:text-destructive hover:border-destructive transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social links */}
                <div className="mt-5">
                  {filledSocials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filledSocials.map((key) => {
                        const { Icon, label, prefix } = SOCIAL_META[key];
                        const href = displaySocial[key]!;
                        const fullHref = href.startsWith("http") || href.startsWith("mailto") ? href : (prefix ?? "") + href;
                        return isEditing ? (
                          <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-primary/30 text-muted-foreground">
                            <Icon size={13} /><span>{label}</span>
                            <button onClick={() => removeSocialLink(key)} className="ml-1 text-red-400 hover:text-red-300"><X size={10} /></button>
                          </div>
                        ) : (
                          <a key={key} href={fullHref} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-transparent hover:border-primary/50 hover:text-primary text-muted-foreground transition-all">
                            <Icon size={13} /><span>{label}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {isEditing && emptySocials.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-sm p-3 flex flex-wrap gap-2"
                      style={{ border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
                      <span className="w-full text-[10px] text-muted-foreground font-accent mb-1">Adicionar redes sociais</span>
                      {emptySocials.map((key) => {
                        const { Icon, label } = SOCIAL_META[key];
                        return (
                          <button key={key} onClick={() => openSocialModal(key)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-dashed border-border hover:border-primary hover:text-primary text-muted-foreground transition-all">
                            <Plus size={10} /><Icon size={12} /><span>{label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                  {!isEditing && filledSocials.length === 0 && (
                    <p className="text-xs text-muted-foreground font-accent italic">Nenhuma rede social adicionada.</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── MEDALHAS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="hologram-panel rounded-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Trophy size={18} className="text-accent" /> Conquistas
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-accent text-muted-foreground">
                    {ALL_MEDALS.length} medalhas
                  </span>
                  {/* botão "Editar medalhas" — só aparece no modo edição */}
                  {isEditing && (
                    <button
                      onClick={() => setMedalPickerOpen(p => !p)}
                      className="flex items-center gap-1.5 text-[10px] font-accent px-2 py-1 rounded-sm border transition-all"
                      style={medalPickerOpen
                        ? { background: `${ringColor}20`, color: ringColor, border: `1px solid ${ringColor}50` }
                        : { color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}>
                      <Pencil size={9} /> Editar medalhas
                    </button>
                  )}
                </div>
              </div>

              {/* ── Medal picker — expande ao clicar em "Editar medalhas" ── */}
              <AnimatePresence>
                {isEditing && medalPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="rounded-sm p-3 space-y-1.5"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}>
                      <p className="text-[9px] font-accent text-muted-foreground mb-2">
                        Escolha até 3 medalhas para exibir em destaque ({draftMedalIds.length}/3)
                      </p>
                      {ALL_MEDALS.map((medal) => {
                        const Icon = medal.icon;
                        const isSelected = draftMedalIds.includes(medal.id);
                        return (
                          <button key={medal.id}
                            onClick={() => toggleDraftMedal(medal.id)}
                            disabled={!isSelected && draftMedalIds.length >= 3}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all disabled:opacity-40"
                            style={{
                              background: isSelected ? `${medal.color}14` : "transparent",
                              border: `1px solid ${isSelected ? medal.color + "40" : "transparent"}`,
                            }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
                              <Icon size={12} style={{ color: medal.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-accent font-semibold text-foreground truncate">{medal.title}</p>
                              <p className="text-[9px] text-muted-foreground font-body truncate">{medal.desc}</p>
                            </div>
                            {isSelected && <CheckCircle2 size={13} style={{ color: medal.color, flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── 3 medalhas em destaque (mesmo visual original) ── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featuredMedals.map((medal, i) => {
                  const Icon = medal.icon;
                  const isHovered = hoveredMedal === medal.id;
                  return (
                    <motion.div
                      key={medal.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.07 }}
                      onMouseEnter={() => setHoveredMedal(medal.id)}
                      onMouseLeave={() => setHoveredMedal(null)}
                      className="relative rounded-sm p-4 flex flex-col items-center text-center cursor-default transition-all duration-200 group"
                      style={{
                        background: isHovered ? medal.bg : `${medal.color}08`,
                        border: `1px solid ${isHovered ? medal.border : medal.color + "20"}`,
                        boxShadow: isHovered ? `0 0 18px ${medal.glow}` : "none",
                      }}
                    >
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-sm pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 50% 0%, ${medal.color}15 0%, transparent 70%)` }}
                          />
                        )}
                      </AnimatePresence>

                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 relative"
                        style={{ background: medal.bg, border: `2px solid ${medal.border}`, boxShadow: `0 0 12px ${medal.glow}` }}>
                        <Icon size={22} style={{ color: medal.color }} />
                        <div className="absolute inset-0 rounded-full"
                          style={{ background: `radial-gradient(circle at 35% 30%, ${medal.color}25, transparent 60%)` }} />
                      </div>

                      <p className="text-[11px] font-accent font-semibold text-foreground leading-tight mb-0.5">{medal.title}</p>
                      <p className="text-[9px] text-muted-foreground font-body leading-tight mb-2">{medal.desc}</p>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <span className="text-[8px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                          style={{ color: RARITY_COLOR[medal.rarity], background: `${RARITY_COLOR[medal.rarity]}15`, border: `1px solid ${RARITY_COLOR[medal.rarity]}30` }}>
                          {medal.rarity}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-body flex items-center gap-0.5">
                          <Clock size={7} /> {medal.date}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}


              </div>
            </motion.div>

            {/* ── Certificados ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="hologram-panel rounded-sm p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield size={18} className="text-primary" /> Certificados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Fundamentos de IA",           date: "Jan 2025", provider: "UpJobs Academy" },
                  { title: "Python para Data Science",    date: "Mar 2025", provider: "UpJobs Academy" },
                  { title: "Introdução a Cibersegurança", date: "Mai 2025", provider: "UpJobs Academy" },
                  { title: "Fundamentos de SQL",          date: "Ago 2025", provider: "UpJobs Academy" },
                ].map((cert, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}
                    className="flex items-start gap-3 p-4 rounded-sm border border-primary/15 hover:border-primary/35 transition-colors"
                    style={{ background: "hsl(155 60% 45% / 0.05)" }}>
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(155 60% 45% / 0.15)", border: "1px solid hsl(155 60% 45% / 0.3)" }}>
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

          {/* ═══════════════════════════════════════════
              COLUNA DIREITA
          ════════════════════════════════════════════ */}
          <aside className="hidden lg:flex flex-col gap-4">

            {/* Timeline de atividade */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="hologram-panel rounded-sm p-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock size={14} className="text-primary" /> Atividade Recente
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border/40" />
                <div className="space-y-4 pl-5">
                  {ACTIVITY_TIMELINE.map((item, i) => {
                    const Icon = ACTIVITY_ICON[item.type] ?? Clock;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        className="relative">
                        <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: `${item.color}20`, border: `1.5px solid ${item.color}60` }}>
                          <Icon size={7} style={{ color: item.color }} />
                        </div>
                        <p className="text-[11px] font-body text-foreground leading-tight">{item.text}</p>
                        <p className="text-[9px] text-muted-foreground font-accent mt-0.5">{item.time}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Progresso geral */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="hologram-panel rounded-sm p-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap size={14} className="text-primary" /> Progresso Geral
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Trilhas concluídas", value: 4,  total: 12, color: "hsl(155 60% 45%)" },
                  { label: "Aulas assistidas",   value: 38, total: 80, color: "hsl(25 90% 55%)"  },
                  { label: "Exercícios feitos",  value: 62, total: 100,color: "hsl(210 70% 55%)" },
                  { label: "Dias de estudo",     value: 42, total: 90, color: "hsl(45 90% 55%)"  },
                ].map(({ label, value, total, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-accent text-muted-foreground">{label}</span>
                      <span className="text-[10px] font-accent font-semibold" style={{ color }}>{value}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(value / total) * 100}%` }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </aside>
        </div>
      </div>

      {/* ── Crop Modal ── */}
{/* ── Crop Modal ── */}
      <AnimatePresence>
        {cropSrc && cropType && (
          <ImageCropModal
            src={cropSrc}
            shape={cropType === "photo" ? "circle" : "rect"}
            outputWidth={cropType === "photo" ? 400 : 1200}
            outputHeight={cropType === "photo" ? 400 : 320}
            onConfirm={handleCropConfirm}
            onCancel={() => { setCropSrc(null); setCropType(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Social Modal ── */}
      <AnimatePresence>
        {socialModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setSocialModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="hologram-panel rounded-sm p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}>
              {(() => {
                const { Icon, label, placeholder } = SOCIAL_META[socialModal];
                return (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon size={16} className="text-primary" />
                      <h3 className="font-display font-bold text-foreground">Adicionar {label}</h3>
                    </div>
                    <input autoFocus type="text" value={socialInput}
                      onChange={(e) => setSocialInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveSocialLink()}
                      placeholder={placeholder}
                      className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    <div className="flex gap-2 mt-4 justify-end">
                      <button onClick={() => setSocialModal(null)}
                        className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground">
                        Cancelar
                      </button>
                      <button onClick={saveSocialLink}
                        className="px-3 py-1.5 text-xs font-accent font-semibold text-primary-foreground rounded-sm"
                        style={{ background: "hsl(155 60% 40%)" }}>
                        Salvar
                      </button>
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