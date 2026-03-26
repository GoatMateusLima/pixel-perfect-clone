import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, ArrowLeft, Loader2, Shield, Trophy, Star, Zap,
  Linkedin, Github, Facebook, Mail, Twitter, Instagram, Globe,
  MessageCircle, Code2, Brain, Cloud, Database, Cpu, Clock,
  Copy, CheckCheck, UserSearch,
} from "lucide-react";
import supabase from "../../utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FriendButton from "@/components/FriendButton";
import CursosEmAndamento from "@/components/CursosEmAndamento";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DISC_COLORS: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};
const DISC_LABELS: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};
const DISC_DESC: Record<string, string> = {
  D: "Direto, assertivo e orientado a resultados. Toma decisões com rapidez.",
  I: "Comunicativo, entusiasmado e influente. Inspira e conecta pessoas.",
  S: "Estável, paciente e confiável. Valoriza harmonia e consistência.",
  C: "Analítico, preciso e metódico. Decide com base em dados e qualidade.",
};

type SocialKey = "linkedin" | "github" | "twitter" | "instagram" | "facebook" | "email" | "website";
const SOCIAL_META: Record<SocialKey, { Icon: React.ElementType; label: string; color: string; prefix?: string }> = {
  linkedin:  { Icon: Linkedin,  label: "LinkedIn",  color: "#0A66C2", prefix: "https://" },
  github:    { Icon: Github,    label: "GitHub",    color: "#e6edf3", prefix: "https://" },
  twitter:   { Icon: Twitter,   label: "Twitter/X", color: "#1D9BF0", prefix: "https://" },
  instagram: { Icon: Instagram, label: "Instagram", color: "#E1306C", prefix: "https://" },
  facebook:  { Icon: Facebook,  label: "Facebook",  color: "#1877F2", prefix: "https://" },
  email:     { Icon: Mail,      label: "E-mail",    color: "hsl(155 60% 45%)", prefix: "mailto:" },
  website:   { Icon: Globe,     label: "Website",   color: "hsl(45 90% 55%)",  prefix: "https://" },
};

const ALL_MEDALS = [
  { id: 1, icon: Code2,    title: "Primeira Linha de Código", rarity: "Comum",    color: "hsl(155 60% 45%)", bg: "hsl(155 60% 45% / 0.12)", border: "hsl(155 60% 45% / 0.35)", glow: "hsl(155 60% 45% / 0.35)", date: "Jan 2025" },
  { id: 2, icon: Brain,    title: "Mente Analítica",          rarity: "Rara",     color: "hsl(210 70% 60%)", bg: "hsl(210 70% 60% / 0.12)", border: "hsl(210 70% 60% / 0.35)", glow: "hsl(210 70% 60% / 0.35)", date: "Mar 2025" },
  { id: 3, icon: Shield,   title: "Guardião Digital",         rarity: "Épica",    color: "hsl(0 70% 60%)",   bg: "hsl(0 70% 60% / 0.12)",   border: "hsl(0 70% 60% / 0.35)",   glow: "hsl(0 70% 60% / 0.35)",   date: "Mai 2025" },
  { id: 4, icon: Cloud,    title: "Arquiteto de Nuvens",      rarity: "Rara",     color: "hsl(45 90% 55%)",  bg: "hsl(45 90% 55% / 0.12)",  border: "hsl(45 90% 55% / 0.35)",  glow: "hsl(45 90% 55% / 0.35)",  date: "Jul 2025" },
  { id: 5, icon: Database, title: "Mestre dos Dados",         rarity: "Comum",    color: "hsl(270 60% 65%)", bg: "hsl(270 60% 65% / 0.12)", border: "hsl(270 60% 65% / 0.35)", glow: "hsl(270 60% 65% / 0.35)", date: "Ago 2025" },
  { id: 6, icon: Cpu,      title: "Pioneiro em IA",           rarity: "Lendária", color: "hsl(25 90% 55%)",  bg: "hsl(25 90% 55% / 0.12)",  border: "hsl(25 90% 55% / 0.35)",  glow: "hsl(25 90% 55% / 0.35)",  date: "Out 2025" },
];
const RARITY_COLOR: Record<string, string> = {
  Comum: "hsl(215 20% 60%)", Rara: "hsl(210 70% 60%)", Épica: "hsl(270 60% 65%)", Lendária: "hsl(45 90% 55%)",
};

interface PublicProfile {
  user_id: string; name?: string; username?: string; descricao?: string;
  perfil?: string; banner?: string; redes?: Partial<Record<SocialKey, string>>;
  bordas?: { id: string; img_url: string; nome: string; ativa: boolean }[];
  medalhas?: { id: number; ativa: boolean }[];
  nivel?: number; total_xp?: number; disc_profile?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const PublicProfilePage = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile,     setProfile]     = useState<PublicProfile | null>(null);
  const [loadingMain, setLoadingMain] = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    if (!identifier) return;
    async function load() {
      setLoadingMain(true); setNotFound(false);
      let query = supabase.from("profiles").select("*");
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      query = isUuid ? query.eq("user_id", identifier) : query.ilike("username", identifier);
      const { data, error } = await query.single();
      setLoadingMain(false);
      if (error || !data) { setNotFound(true); return; }
      const p = data as PublicProfile;
      setProfile(p);
      if (me && p.user_id === me.id) navigate("/perfil", { replace: true });
    }
    load();
  }, [identifier, me, navigate]);

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username ?? profile.user_id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loadingMain) return (
    <div className="min-h-screen gradient-hero scanline flex items-center justify-center">
      <Header />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-xs font-accent text-muted-foreground">Carregando perfil…</p>
      </motion.div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen gradient-hero scanline flex flex-col items-center justify-center">
      <Header />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-secondary/40 flex items-center justify-center mb-6"
          style={{ border: "1px solid hsl(155 60% 45% / 0.2)" }}>
          <UserSearch size={32} className="text-muted-foreground/30" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Perfil não encontrado</h1>
        <p className="text-sm text-muted-foreground font-body mb-8">Nenhum usuário com este identificador.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-accent font-semibold text-white hover:brightness-110 transition"
          style={{ background: "hsl(155 60% 38%)", boxShadow: "0 0 18px hsl(155 60% 45% / 0.35)" }}>
          <ArrowLeft size={14} /> Voltar ao início
        </Link>
      </motion.div>
    </div>
  );

  if (!profile) return null;

  // ─── Derivados ────────────────────────────────────────────────────────────

  const disc          = profile.disc_profile ?? "S";
  const ringColor     = DISC_COLORS[disc] ?? "hsl(155 60% 45%)";
  const bordaAtiva    = profile.bordas?.find(b => b.ativa) ?? null;
  const filledSocials = Object.entries(profile.redes ?? {}).filter(([, v]) => v) as [SocialKey, string][];
  const featuredMedals = (profile.medalhas ?? [])
    .filter(m => m.ativa).map(m => ALL_MEDALS.find(a => a.id === m.id)).filter(Boolean) as typeof ALL_MEDALS[number][];
  const currentLevel  = profile.nivel || 1;
  const currentXP     = Number(profile.total_xp || 0);
  const xpNext        = currentLevel * 1000;
  const xpPct         = Math.min((currentXP / xpNext) * 100, 100);
  const isOwnProfile  = me?.id === profile.user_id;

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20 space-y-4">

        {/* Voltar */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar
          </button>
        </motion.div>

        {/* ══ HERO CARD ══ */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="hologram-panel rounded-sm overflow-hidden">

          {/* Banner (com avatar ancorado na borda inferior) */}
          <div className="relative" style={{ height: 160 }}>
            {profile.banner
              ? <img src={profile.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              : (
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${ringColor}22 0%, hsl(220 28% 8%) 70%)` }}>
                  <div className="absolute inset-0"
                    style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 28px,${ringColor}12 28px,${ringColor}12 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,${ringColor}12 28px,${ringColor}12 29px)` }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: ringColor }} />
                  </div>
                  <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ background: ringColor }} />
                </div>
              )}
            {/* fade bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent, hsl(215 30% 10%))" }} />

            {/* Avatar absolute no rodapé do banner */}
            <div className="absolute" style={{ bottom: -44, left: 20, zIndex: 20, width: 88, height: 88 }}>
              {bordaAtiva && (
                <img src={bordaAtiva.img_url} alt={bordaAtiva.nome}
                  className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
              )}
              <div className="absolute rounded-full overflow-hidden bg-secondary flex items-center justify-center"
                style={{
                  width: 68, height: 68, top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)", zIndex: 2,
                  border: "3px solid hsl(var(--background))",
                  boxShadow: `0 0 0 2.5px ${ringColor}, 0 0 20px ${ringColor}55`,
                }}>
                {profile.perfil
                  ? <img src={profile.perfil} alt={profile.name} className="w-full h-full object-cover" />
                  : <User size={26} className="text-muted-foreground" />}
              </div>
            </div>
          </div>

          {/* Conteúdo abaixo do banner — paddingTop reserva espaço pro avatar */}
          <div className="px-5 pb-6" style={{ paddingTop: 52 }}>

            {/* Nome + ações */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <h1 className="font-display font-bold text-foreground leading-tight"
                  style={{ fontSize: "clamp(1.15rem, 4vw, 1.6rem)", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  {profile.name ?? "Usuário"}
                </h1>
                {profile.username && (
                  <p className="text-sm text-muted-foreground/60 font-body mt-0.5">@{profile.username}</p>
                )}
              </div>

              {!isOwnProfile && me && (
                <div className="flex items-center gap-2 flex-wrap">
                  <FriendButton targetUserId={profile.user_id} targetName={profile.name} />
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => window.dispatchEvent(new CustomEvent("open-chat", {
                      detail: { userId: profile.user_id, name: profile.name, avatar: profile.perfil }
                    }))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-accent font-semibold border transition-all"
                    style={{ borderColor: `${ringColor}50`, color: ringColor, background: `${ringColor}0D` }}>
                    <MessageCircle size={13} /> Mensagem
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={copyLink} title="Copiar link"
                    className="w-8 h-8 rounded-sm border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                    <AnimatePresence mode="wait">
                      {copied
                        ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCheck size={13} className="text-primary" /></motion.span>
                        : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy size={13} /></motion.span>}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}

              {isOwnProfile && (
                <Link to="/perfil" className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent font-semibold border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                  Editar perfil
                </Link>
              )}
            </div>

            {/* Pills DISC + Nível + XP */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="inline-flex items-center gap-1 text-[11px] font-accent font-bold px-3 py-1 rounded-full text-white"
                style={{ background: ringColor, boxShadow: `0 0 10px ${ringColor}50` }}>
                {DISC_LABELS[disc] ?? disc}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-accent text-yellow-400/90 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                <Star size={9} /> Nível {currentLevel}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-accent text-primary/80 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                <Zap size={9} /> {currentXP.toLocaleString("pt-BR")} XP
              </span>
            </div>

            {/* Barra XP */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-accent text-muted-foreground/45">Nível {currentLevel} → {currentLevel + 1}</span>
                <span className="text-[10px] font-accent text-muted-foreground/45">{xpPct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                  transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${ringColor}, ${ringColor}bb)`, boxShadow: `0 0 8px ${ringColor}70` }}
                />
              </div>
            </div>

            {/* Bio */}
            {profile.descricao && (
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-4"
                style={{ borderLeft: `2px solid ${ringColor}55`, paddingLeft: "0.875rem" }}>
                {profile.descricao}
              </p>
            )}

            {/* Redes sociais */}
            {filledSocials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filledSocials.map(([key, href]) => {
                  const { Icon, label, color, prefix } = SOCIAL_META[key];
                  const fullHref = href.startsWith("http") || href.startsWith("mailto") ? href : (prefix ?? "") + href;
                  return (
                    <motion.a key={key} href={fullHref} target="_blank" rel="noopener noreferrer"
                      whileHover={{ scale: 1.06, y: -1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-accent transition-all"
                      style={{ background: `${color}14`, border: `1px solid ${color}35`, color }}>
                      <Icon size={11} /> {label}
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ══ DISC CARD ══ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="hologram-panel rounded-sm p-5"
          style={{ borderLeft: `3px solid ${ringColor}` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center font-display font-black text-base text-white"
              style={{ background: `radial-gradient(circle at 35% 35%, ${ringColor}, ${ringColor}70)`, boxShadow: `0 0 16px ${ringColor}45` }}>
              {disc}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-accent font-bold text-foreground">{DISC_LABELS[disc] ?? disc}</p>
                <span className="text-[9px] font-accent uppercase tracking-widest text-muted-foreground/40 border border-border/30 px-1.5 py-0.5 rounded">Perfil DISC</span>
              </div>
              <p className="text-xs font-body text-muted-foreground">{DISC_DESC[disc] ?? ""}</p>
            </div>
          </div>
        </motion.div>

        {/* ══ CURSOS EM ANDAMENTO — usa o componente que já funciona ══ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <CursosEmAndamento userId={profile.user_id} />
        </motion.div>

        {/* ══ CONQUISTAS ══ */}
        {featuredMedals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="hologram-panel rounded-sm p-6">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2 mb-5">
              <Trophy size={16} className="text-yellow-400" /> Conquistas em Destaque
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {featuredMedals.map((medal, i) => {
                const Icon = medal.icon;
                return (
                  <motion.div key={medal.id}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    className="rounded-sm p-4 flex flex-col items-center text-center"
                    style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: medal.bg, border: `2px solid ${medal.border}`, boxShadow: `0 0 18px ${medal.glow}` }}>
                      <Icon size={20} style={{ color: medal.color }} />
                    </div>
                    <p className="text-[11px] font-accent font-semibold text-foreground leading-tight mb-2">{medal.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <span className="text-[8px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                        style={{ color: RARITY_COLOR[medal.rarity], background: `${RARITY_COLOR[medal.rarity]}15`, border: `1px solid ${RARITY_COLOR[medal.rarity]}30` }}>
                        {medal.rarity}
                      </span>
                      <span className="text-[8px] text-muted-foreground/40 font-body flex items-center gap-0.5">
                        <Clock size={7} /> {medal.date}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ══ LINK PÚBLICO ══ */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="hologram-panel rounded-sm p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[9px] font-accent text-muted-foreground/40 uppercase tracking-widest mb-1">Link do perfil</p>
              <p className="text-sm font-mono text-foreground">
                <span className="text-muted-foreground/40">{window.location.origin}/u/</span>
                <span style={{ color: ringColor }}>{profile.username ?? profile.user_id.slice(0, 8) + "…"}</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={copyLink}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent font-semibold border transition-all"
              style={copied
                ? { background: "hsl(155 60% 38% / 0.15)", color: "hsl(155 60% 55%)", borderColor: "hsl(155 60% 45% / 0.4)" }
                : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border) / 0.5)" }}>
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="c" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2"><CheckCheck size={12} /> Copiado!</motion.span>
                  : <motion.span key="e" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2"><Copy size={12} /> Copiar link</motion.span>}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PublicProfilePage;
