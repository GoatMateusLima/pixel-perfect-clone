import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Award, BookOpen, TrendingUp, Clock, ArrowLeft, LogOut,
  Camera, Pencil, Check, Plus, X, ImageIcon,
  Linkedin, Github, Facebook, Mail, Twitter, Instagram, Globe,
} from "lucide-react";
import dominanciaImg from "@/assets/disc/Dominancia.webp";
import influenciaImg from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";
import ImageCropModal from "@/components/ImageCropModal";

/* ─── DISC ─── */
const DISC_IMGS: Record<string, string> = {
  D: dominanciaImg, I: influenciaImg, S: estabilidadeImg, C: conformidadeImg,
};
const DISC_LABELS: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};
const DISC_COLORS: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};

/* ─── Social ─── */
type SocialKey = "linkedin" | "github" | "facebook" | "twitter" | "instagram" | "email" | "website";
const SOCIAL_META: Record<SocialKey, { label: string; Icon: React.ElementType; placeholder: string; prefix?: string }> = {
  linkedin:  { label: "LinkedIn",  Icon: Linkedin,  placeholder: "https://linkedin.com/in/usuario", prefix: "https://" },
  github:    { label: "GitHub",    Icon: Github,    placeholder: "https://github.com/usuario",      prefix: "https://" },
  facebook:  { label: "Facebook",  Icon: Facebook,  placeholder: "https://facebook.com/usuario",   prefix: "https://" },
  twitter:   { label: "Twitter/X", Icon: Twitter,   placeholder: "https://x.com/usuario",          prefix: "https://" },
  instagram: { label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/usuario",  prefix: "https://" },
  email:     { label: "E-mail",    Icon: Mail,      placeholder: "seu@email.com",                  prefix: "mailto:" },
  website:   { label: "Website",   Icon: Globe,     placeholder: "https://seusite.com",            prefix: "https://" },
};
const ALL_SOCIAL_KEYS = Object.keys(SOCIAL_META) as SocialKey[];

/* ─── Mock ─── */
const MOCK_CERTIFICATES = [
  { title: "Fundamentos de IA",        date: "2025-01", provider: "UpJobs Academy" },
  { title: "Python para Data Science", date: "2025-03", provider: "UpJobs Academy" },
];
const MOCK_COURSES = [
  { title: "Machine Learning Avançado", progress: 65 },
  { title: "Cloud Computing AWS",       progress: 30 },
  { title: "Cibersegurança Ofensiva",  progress: 10 },
];

/* ─── Storage ─── */
const KEY_PHOTO  = "upjobs_profile_photo_v2";
const KEY_BANNER = "upjobs_profile_banner_v1";
const KEY_SOCIAL = "upjobs_profile_social_v1";
if (typeof window !== "undefined") localStorage.removeItem("upjobs_profile_photo");

/* ─────────────────────────────────────────────────────── */
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const photoInputRef  = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  /* persisted */
  const [photoSrc,  setPhotoSrc]  = useState<string | null>(() => localStorage.getItem(KEY_PHOTO));
  const [bannerSrc, setBannerSrc] = useState<string | null>(() => localStorage.getItem(KEY_BANNER));
  const [socialLinks, setSocialLinks] = useState<Partial<Record<SocialKey, string>>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_SOCIAL) ?? "{}"); } catch { return {}; }
  });

  /* edit mode draft */
  const [isEditing,   setIsEditing]   = useState(false);
  const [draftPhoto,  setDraftPhoto]  = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);
  const [draftSocial, setDraftSocial] = useState<Partial<Record<SocialKey, string>>>({});

  /* crop modal */
  const [cropSrc,  setCropSrc]  = useState<string | null>(null);
  const [cropType, setCropType] = useState<"photo" | "banner" | null>(null);

  /* social modal */
  const [socialModal, setSocialModal] = useState<SocialKey | null>(null);
  const [socialInput, setSocialInput] = useState("");
  const [hoverPhoto,  setHoverPhoto]  = useState(false);

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
  if (!user) return null;

  const a = user.assessment;
  const discProfile = a?.discProfile;
  const ringColor = discProfile ? DISC_COLORS[discProfile] : "hsl(155 60% 35%)";

  /* displayed values */
  const displayPhoto  = isEditing ? (draftPhoto  !== null ? (draftPhoto  || null) : photoSrc)  : photoSrc;
  const displayBanner = isEditing ? (draftBanner !== null ? (draftBanner || null) : bannerSrc) : bannerSrc;
  const displaySocial: Partial<Record<SocialKey, string>> = isEditing
    ? Object.fromEntries(ALL_SOCIAL_KEYS.map(k => [k, k in draftSocial ? draftSocial[k] : socialLinks[k]]))
    : socialLinks;

  /* ── Edit handlers ── */
  const handleStartEdit = () => {
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({});
    setIsEditing(true);
  };
  const handleConfirmEdit = () => {
    const fp = draftPhoto  !== null ? (draftPhoto  || null) : photoSrc;
    const fb = draftBanner !== null ? (draftBanner || null) : bannerSrc;
    const fs: Partial<Record<SocialKey, string>> = {};
    ALL_SOCIAL_KEYS.forEach(k => { const v = k in draftSocial ? draftSocial[k] : socialLinks[k]; if (v) fs[k] = v; });

    if (fp) localStorage.setItem(KEY_PHOTO, fp); else localStorage.removeItem(KEY_PHOTO);
    if (fb) localStorage.setItem(KEY_BANNER, fb); else localStorage.removeItem(KEY_BANNER);
    localStorage.setItem(KEY_SOCIAL, JSON.stringify(fs));

    setPhotoSrc(fp); setBannerSrc(fb); setSocialLinks(fs);
    setIsEditing(false);
  };
  const handleCancelEdit = () => {
    setDraftPhoto(null); setDraftBanner(null); setDraftSocial({});
    setIsEditing(false);
  };

  /* ── File → Crop modal ── */
  const readAndOpenCrop = (file: File, type: "photo" | "banner") => {
    const reader = new FileReader();
    reader.onload = (e) => { setCropSrc(e.target?.result as string); setCropType(type); };
    reader.readAsDataURL(file);
  };
  const handlePhotoFile  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "photo");  e.target.value = "";
  };
  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) readAndOpenCrop(f, "banner"); e.target.value = "";
  };

  /* ── Crop confirm ── */
  const handleCropConfirm = (dataUrl: string) => {
    if (cropType === "photo")  setDraftPhoto(dataUrl);
    if (cropType === "banner") setDraftBanner(dataUrl);
    setCropSrc(null); setCropType(null);
  };
  const handleCropCancel = () => { setCropSrc(null); setCropType(null); };

  /* ── Social ── */
  const openSocialModal = (key: SocialKey) => { setSocialInput(displaySocial[key] ?? ""); setSocialModal(key); };
  const saveSocialLink  = () => {
    if (!socialModal) return;
    setDraftSocial(p => ({ ...p, [socialModal]: socialInput.trim() }));
    setSocialModal(null); setSocialInput("");
  };
  const removeSocialLink = (key: SocialKey) => setDraftSocial(p => ({ ...p, [key]: "" }));

  const filledSocials = ALL_SOCIAL_KEYS.filter(k => displaySocial[k]);
  const emptySocials  = ALL_SOCIAL_KEYS.filter(k => !displaySocial[k]);

  return (
    <div className="min-h-screen gradient-hero scanline pb-12">

      {/* Top nav */}
      <div className="px-4 pt-6 flex items-center justify-between max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-body">
          <ArrowLeft size={14} /> Início
        </Link>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-accent"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-6 mt-4">

        {/* ══ PROFILE CARD ══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hologram-panel rounded-sm overflow-hidden">

          {/* Banner */}
          <div className="relative w-full" style={{ height: "120px" }}>
            {displayBanner ? (
              <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: discProfile
                    ? `linear-gradient(135deg, ${ringColor}44 0%, ${ringColor}11 100%)`
                    : "linear-gradient(135deg, hsl(155 60% 15% / 0.4) 0%, hsl(210 40% 10% / 0.2) 100%)",
                }}
              />
            )}
            {isEditing && (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-white"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
              >
                <ImageIcon size={12} /> Alterar banner
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFile} />
          </div>

          {/* Avatar + info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4" style={{ marginTop: "-40px" }}>

              {/* Avatar */}
              <div className="flex-shrink-0 relative" style={{ width: "112px", height: "112px" }}>
                {/* DISC ring (moldura) */}
                {discProfile ? (
                  <img
                    src={DISC_IMGS[discProfile]} alt={DISC_LABELS[discProfile]}
                    className="absolute inset-0 w-full h-full rounded-full object-cover"
                    style={{ zIndex: 1 }}
                  />
                ) : (
                  <div className="absolute inset-0 rounded-full" style={{ background: ringColor, zIndex: 1, boxShadow: `0 0 18px ${ringColor}60` }} />
                )}

                {/* Photo */}
                <button
                  type="button"
                  onClick={() => isEditing && photoInputRef.current?.click()}
                  onMouseEnter={() => isEditing && setHoverPhoto(true)}
                  onMouseLeave={() => setHoverPhoto(false)}
                  disabled={!isEditing}
                  className="absolute rounded-full overflow-hidden bg-secondary flex items-center justify-center focus:outline-none"
                  style={{
                    width: "80px", height: "80px",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    border: "3px solid hsl(var(--background))",
                    cursor: isEditing ? "pointer" : "default",
                  }}
                >
                  {displayPhoto
                    ? <img src={displayPhoto} alt="Foto" className="w-full h-full object-cover" />
                    : <User size={28} className="text-muted-foreground" />
                  }
                  <AnimatePresence>
                    {isEditing && hoverPhoto && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                      >
                        <Camera size={16} className="text-white" />
                        <span className="text-[8px] text-white font-accent">Alterar</span>
                        {displayPhoto && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDraftPhoto(""); }}
                            className="text-[7px] text-red-300 font-accent mt-0.5 hover:text-red-100"
                          >remover</button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
              </div>

              {/* Name + buttons */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">{user.name}</h1>
                  <p className="text-sm text-muted-foreground font-body">{user.email}</p>
                  {discProfile && (
                    <span className="inline-block mt-1 text-[10px] font-accent font-bold px-2 py-0.5 rounded-full text-primary-foreground"
                      style={{ backgroundColor: DISC_COLORS[discProfile] }}>
                      {DISC_LABELS[discProfile]}
                    </span>
                  )}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-primary-foreground transition-colors"
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
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent border border-transparent hover:border-primary/50 hover:text-primary text-muted-foreground transition-all"
                        title={`Abrir ${label}`}>
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

        {/* Stats */}
        {a?.completed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Clock,      label: "Horas Estudadas", value: "42h",                                                             color: "text-primary" },
              { icon: TrendingUp, label: "Valor/Hora",       value: a.valorHoraLiquida ? `R$ ${a.valorHoraLiquida.toFixed(2)}` : "—", color: "text-accent"  },
              { icon: Award,      label: "Certificados",     value: String(MOCK_CERTIFICATES.length),                                  color: "text-primary" },
              { icon: BookOpen,   label: "Cursos Ativos",    value: String(MOCK_COURSES.length),                                       color: "text-accent"  },
            ].map((stat, i) => (
              <div key={i} className="hologram-panel rounded-sm p-4 text-center">
                <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
                <p className={`font-display font-bold text-lg ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-accent">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Courses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="hologram-panel rounded-sm p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-accent" /> Cursos em Andamento
          </h2>
          <div className="space-y-4">
            {MOCK_COURSES.map((course, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-body text-foreground">{course.title}</p>
                  <span className="text-xs text-muted-foreground font-accent">{course.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(155 60% 50%))" }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Certificates */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="hologram-panel rounded-sm p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary" /> Certificados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_CERTIFICATES.map((cert, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02 }} className="border border-primary/20 rounded-sm p-4 bg-card">
                <p className="font-accent font-semibold text-sm text-foreground">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.provider} · {cert.date}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══ Crop Modal ══ */}
      <AnimatePresence>
        {cropSrc && cropType && (
          <ImageCropModal
            src={cropSrc}
            shape={cropType === "photo" ? "circle" : "rect"}
            outputWidth={cropType  === "photo" ? 400  : 1200}
            outputHeight={cropType === "photo" ? 400  : 320}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>

      {/* ══ Social Modal ══ */}
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