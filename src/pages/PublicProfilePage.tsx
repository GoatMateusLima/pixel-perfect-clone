import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, ArrowLeft, Loader2, Shield, Trophy, Star, Zap,
  Linkedin, Github, Facebook, Mail, Twitter, Instagram, Globe,
  MessageCircle, Code2, Brain, Cloud, Database, Cpu, Clock,
  ExternalLink, UserSearch,
} from "lucide-react";
import supabase from "../../utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FriendButton from "@/components/FriendButton";

// ─── Constantes (mesmas do ProfilePage) ───────────────────────────────────────

const DISC_COLORS: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};
const DISC_LABELS: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};

type SocialKey = "linkedin" | "github" | "twitter" | "instagram" | "facebook" | "email" | "website";
const SOCIAL_META: Record<SocialKey, { Icon: React.ElementType; label: string; prefix?: string }> = {
  linkedin:  { Icon: Linkedin,  label: "LinkedIn",   prefix: "https://" },
  github:    { Icon: Github,    label: "GitHub",     prefix: "https://" },
  twitter:   { Icon: Twitter,   label: "Twitter/X",  prefix: "https://" },
  instagram: { Icon: Instagram, label: "Instagram",  prefix: "https://" },
  facebook:  { Icon: Facebook,  label: "Facebook",   prefix: "https://" },
  email:     { Icon: Mail,      label: "E-mail",     prefix: "mailto:"  },
  website:   { Icon: Globe,     label: "Website",    prefix: "https://" },
};

const ALL_MEDALS = [
  { id: 1, icon: Code2,    title: "Primeira Linha de Código", rarity: "Comum",    color: "hsl(155 60% 45%)", bg: "hsl(155 60% 45% / 0.12)", border: "hsl(155 60% 45% / 0.35)", glow: "hsl(155 60% 45% / 0.3)", date: "Jan 2025" },
  { id: 2, icon: Brain,    title: "Mente Analítica",          rarity: "Rara",     color: "hsl(210 70% 60%)", bg: "hsl(210 70% 60% / 0.12)", border: "hsl(210 70% 60% / 0.35)", glow: "hsl(210 70% 60% / 0.3)", date: "Mar 2025" },
  { id: 3, icon: Shield,   title: "Guardião Digital",         rarity: "Épica",    color: "hsl(0 70% 60%)",   bg: "hsl(0 70% 60% / 0.12)",   border: "hsl(0 70% 60% / 0.35)",   glow: "hsl(0 70% 60% / 0.3)",   date: "Mai 2025" },
  { id: 4, icon: Cloud,    title: "Arquiteto de Nuvens",      rarity: "Rara",     color: "hsl(45 90% 55%)",  bg: "hsl(45 90% 55% / 0.12)",  border: "hsl(45 90% 55% / 0.35)",  glow: "hsl(45 90% 55% / 0.3)",  date: "Jul 2025" },
  { id: 5, icon: Database, title: "Mestre dos Dados",         rarity: "Comum",    color: "hsl(270 60% 65%)", bg: "hsl(270 60% 65% / 0.12)", border: "hsl(270 60% 65% / 0.35)", glow: "hsl(270 60% 65% / 0.3)", date: "Ago 2025" },
  { id: 6, icon: Cpu,      title: "Pioneiro em IA",           rarity: "Lendária", color: "hsl(25 90% 55%)",  bg: "hsl(25 90% 55% / 0.12)",  border: "hsl(25 90% 55% / 0.35)",  glow: "hsl(25 90% 55% / 0.3)",  date: "Out 2025" },
];
const RARITY_COLOR: Record<string, string> = {
  Comum: "hsl(215 20% 60%)", Rara: "hsl(210 70% 60%)", Épica: "hsl(270 60% 65%)", Lendária: "hsl(45 90% 55%)",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PublicProfile {
  user_id:    string;
  name?:      string;
  username?:  string;
  descricao?: string;
  perfil?:    string;
  banner?:    string;
  redes?:     Partial<Record<SocialKey, string>>;
  bordas?:    { id: string; img_url: string; nome: string; ativa: boolean }[];
  medalhas?:  { id: number; ativa: boolean }[];
  nivel?:     number;
  total_xp?:  number;
  disc_profile?: string;
}

// ─── PublicProfilePage ────────────────────────────────────────────────────────

const PublicProfilePage = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string>("none");

  useEffect(() => {
    if (!identifier) return;
    async function load() {
      setLoading(true);
      setNotFound(false);

      // Tenta buscar por username primeiro, depois por user_id
      let query = supabase.from("profiles").select("*");

      // UUID = 36 chars com hífens; username é mais curto
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      if (isUuid) {
        query = query.eq("user_id", identifier);
      } else {
        query = query.ilike("username", identifier);
      }

      const { data, error } = await query.single();
      setLoading(false);

      if (error || !data) {
        setNotFound(true);
        return;
      }
      setProfile(data as PublicProfile);

      // Se for o próprio perfil, redireciona
      if (me && data.user_id === me.id) {
        navigate("/perfil", { replace: true });
      }
    }
    load();
  }, [identifier, me, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero scanline flex items-center justify-center">
        <Header />
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen gradient-hero scanline flex flex-col items-center justify-center gap-4">
        <Header />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center px-4">
          <UserSearch size={48} className="text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Perfil não encontrado</h1>
          <p className="text-muted-foreground font-body mb-6">
            Nenhum usuário com este nome ou ID.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-accent text-sm">
            <ArrowLeft size={14} /> Voltar ao início
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  const disc       = profile.disc_profile ?? "S";
  const ringColor  = DISC_COLORS[disc] ?? "hsl(155 60% 45%)";
  const bordaAtiva = profile.bordas?.find(b => b.ativa) ?? null;
  const filledSocials = Object.entries(profile.redes ?? {}).filter(([, v]) => v) as [SocialKey, string][];
  const featuredMedals = (profile.medalhas ?? [])
    .filter(m => m.ativa)
    .map(m => ALL_MEDALS.find(a => a.id === m.id))
    .filter(Boolean) as typeof ALL_MEDALS[number][];

  const currentLevel = profile.nivel    || 1;
  const currentXP    = Number(profile.total_xp || 0);
  const xpNext       = currentLevel * 1000;
  const xpPct        = Math.min((currentXP / xpNext) * 100, 100);

  const isOwnProfile = me?.id === profile.user_id;

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">

        {/* Voltar */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-body transition-colors">
            <ArrowLeft size={14} /> Voltar
          </button>
        </motion.div>

        {/* ── Card Perfil ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="hologram-panel rounded-sm overflow-hidden mb-6">

          {/* Banner */}
          <div className="relative w-full" style={{ height: 120 }}>
            {profile.banner
              ? <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
              : <div className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${ringColor}44 0%, ${ringColor}11 60%, transparent 100%)` }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 24px,hsl(155 60% 45%)1px),repeating-linear-gradient(90deg,transparent,transparent 24px,hsl(155 60% 45%)1px)" }} />
                </div>}
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4" style={{ marginTop: -24 }}>

              {/* Avatar */}
              <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                {bordaAtiva && (
                  <img src={bordaAtiva.img_url} alt={bordaAtiva.nome}
                    className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                )}
                <div className="absolute rounded-full overflow-hidden bg-secondary flex items-center justify-center"
                  style={{ width: 72, height: 72, top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 2, border: `3px solid hsl(var(--background))`, boxShadow: `0 0 0 2px ${ringColor}60` }}>
                  {profile.perfil
                    ? <img src={profile.perfil} alt={profile.name} className="w-full h-full object-cover" />
                    : <User size={24} className="text-muted-foreground" />}
                </div>
              </div>

              {/* Info + botões */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-xl font-bold text-foreground truncate">
                    {profile.name ?? "Usuário"}
                  </h1>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground font-body">@{profile.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full text-primary-foreground"
                      style={{ backgroundColor: ringColor }}>
                      {DISC_LABELS[disc] ?? disc}
                    </span>
                    <span className="text-[10px] font-accent text-accent flex items-center gap-0.5">
                      <Star size={9} /> Nível {currentLevel}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                {!isOwnProfile && me && (
                  <div className="flex items-center gap-2 shrink-0">
                    <FriendButton
                      targetUserId={profile.user_id}
                      targetName={profile.name}
                      onStatusChange={setFriendStatus}
                    />
                    {/* Botão de mensagem — abre o messenger */}
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Dispara evento global para o MessengerWidget abrir a conversa
                        window.dispatchEvent(new CustomEvent("open-chat", {
                          detail: {
                            userId:   profile.user_id,
                            name:     profile.name,
                            avatar:   profile.perfil,
                          },
                        }));
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
                        font-semibold border border-border/40 text-muted-foreground
                        hover:border-primary/50 hover:text-primary transition-all">
                      <MessageCircle size={14} /> Mensagem
                    </motion.button>

                    {/* Link para copiar */}
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/u/${profile.username ?? profile.user_id}`;
                        navigator.clipboard.writeText(url);
                      }}
                      title="Copiar link do perfil"
                      className="p-2 rounded-sm border border-border/30 text-muted-foreground
                        hover:border-primary/40 hover:text-primary transition-all">
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}

                {isOwnProfile && (
                  <Link to="/perfil"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
                      font-semibold border border-border/40 text-muted-foreground hover:text-primary
                      hover:border-primary/50 transition-all">
                    Editar meu perfil
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.descricao && (
              <p className="mt-4 text-sm font-body text-muted-foreground leading-relaxed">
                {profile.descricao}
              </p>
            )}

            {/* Redes sociais */}
            {filledSocials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {filledSocials.map(([key, href]) => {
                  const { Icon, label, prefix } = SOCIAL_META[key];
                  const fullHref = href.startsWith("http") || href.startsWith("mailto") ? href : (prefix ?? "") + href;
                  return (
                    <a key={key} href={fullHref} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-accent
                        border border-transparent hover:border-primary/50 hover:text-primary
                        text-muted-foreground transition-all">
                      <Icon size={13} /><span>{label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── XP / Progresso ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="hologram-panel rounded-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-accent" />
              <span className="font-display text-sm font-bold text-foreground">Nível {currentLevel}</span>
            </div>
            <span className="text-[10px] font-accent text-muted-foreground">
              {currentXP.toLocaleString("pt-BR")} / {xpNext.toLocaleString("pt-BR")} XP
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(45 90% 45%), hsl(45 90% 65%))" }}
            />
          </div>
        </motion.div>

        {/* ── Medalhas ── */}
        {featuredMedals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="hologram-panel rounded-sm p-6 mb-6">
            <h2 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-accent" /> Conquistas em destaque
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {featuredMedals.map((medal, i) => {
                const Icon = medal.icon;
                return (
                  <motion.div key={medal.id}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="rounded-sm p-4 flex flex-col items-center text-center"
                    style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                      style={{ background: medal.bg, border: `2px solid ${medal.border}`, boxShadow: `0 0 10px ${medal.glow}` }}>
                      <Icon size={18} style={{ color: medal.color }} />
                    </div>
                    <p className="text-[11px] font-accent font-semibold text-foreground leading-tight mb-0.5">{medal.title}</p>
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
        )}

        {/* ── URL pública ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="hologram-panel rounded-sm p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-accent text-muted-foreground mb-1">Link do perfil</p>
              <p className="text-sm font-body text-foreground font-mono">
                {window.location.origin}/u/<span className="text-primary">{profile.username ?? profile.user_id}</span>
              </p>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/u/${profile.username ?? profile.user_id}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-accent
                border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
              <ExternalLink size={12} /> Copiar link
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PublicProfilePage;

// ─── Nota: adicione a rota no seu App.tsx / Router ────────────────────────────
// import PublicProfilePage from "@/pages/PublicProfilePage";
// <Route path="/u/:identifier" element={<PublicProfilePage />} />
