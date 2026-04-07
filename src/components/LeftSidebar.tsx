/**
 * LeftSidebar.tsx
 *
 * Sidebar esquerda da CommunityPage.
 * Ranking Semanal agora é dinâmico — baseado em XP das aulas concluídas.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Loader2, Bookmark, Heart, LayoutList } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar, DISC_IMGS, DISC_COLOR, DISC_LABEL, toInitials } from "./PostCard";
import { useRanking, xpToLevel } from "@/hooks/useRanking";

// ─── Constantes estáticas ─────────────────────────────────────────────────────

const TRENDING = [
  { tag: "#RemoteWork",             posts: 1240 },
  { tag: "#InteligenciaArtificial", posts: 987  },
  { tag: "#FreelancerBR",           posts: 754  },
  { tag: "#DataScience",            posts: 612  },
  { tag: "#CarreiraTech",           posts: 501  },
];

const BADGES = ["🥇", "🥈", "🥉", "4º", "5º"];

// ─── Props ────────────────────────────────────────────────────────────────────

type FeedFilter = "recentes" | "populares" | "curtidos" | "salvos";

interface LeftSidebarProps {
  myName:           string;
  myDisc:           string;
  myRole:           string;
  myHourValue:      string;
  myCourseProgress: number;
  myCourseTitle:    string;
  myUserId?:        string;
  myAvatarUrl?:     string | null;
  activeFilter?:    FeedFilter;
  onFilter?:        (f: FeedFilter) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const LeftSidebar = ({
  myName, myDisc, myRole, myHourValue,
  myCourseProgress, myCourseTitle, myUserId,
  myAvatarUrl: localAvatarProp,
  activeFilter = "recentes",
  onFilter,
}: LeftSidebarProps) => {
  const { profilePhoto: globalAvatar } = useAuth(); // foto do contexto global
  const myAvatarUrl = localAvatarProp || globalAvatar;
  const discColor = DISC_COLOR[myDisc] ?? DISC_COLOR.S;

  // Ranking dinâmico com XP
  const { ranking, myXP, loading: rankingLoading } = useRanking(myUserId);
  const top5 = ranking.slice(0, 5);

  // Lógica de Nível (igual ao ProfilePage)
  const currentLevel = xpToLevel(myXP);
  const xpInCurrentLevel = myXP - ((currentLevel - 1) * 10);
  const xpProgress = Math.min((xpInCurrentLevel / 10) * 100, 100);

  // Banner buscado da tabela profiles — coluna `banner`, PK = user_id
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!myUserId) return;
    supabase
      .from("profiles")
      .select("banner")
      .eq("user_id", myUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.banner) setBannerUrl(data.banner);
      });
  }, [myUserId]);

  return (
    <div className="space-y-6">

      {/* ── Card do perfil ── */}
      <motion.div
        initial={{ opacity: 1, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card overflow-hidden border border-white/5 shadow-2xl rounded-3xl">

        {/* Banner: foto real ou gradiente DISC */}
        <div className="h-28 w-full overflow-hidden relative">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative"
              style={{ background: `linear-gradient(135deg, ${discColor}33 0%, ${discColor}11 100%)` }}>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-7 pb-7 relative">
          <div className="flex flex-col items-center -mt-12 mb-6">
            {/* Avatar com moldura geométrica minimalista em Verde Emerald */}
            <div className="relative flex-shrink-0 flex items-center justify-center mb-4 transition-transform duration-500 hover:scale-105" 
              style={{ width: 96, height: 96 }}>
              <div className="absolute inset-0 rounded-3xl rotate-12 border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.1)]" />
              <div
                className="relative rounded-2xl overflow-hidden flex items-center justify-center font-display font-black text-xl z-10 shadow-2xl bg-black/40"
                style={{ width: 72, height: 72, 
                  border: `1px solid rgba(16, 185, 129, 0.4)`, color: "hsl(142 72% 50%)" }}>
                {myAvatarUrl ? (
                  <img 
                    src={myAvatarUrl} 
                    alt={myName} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = "avatar-fallback w-full h-full bg-primary/20 flex items-center justify-center font-display font-black text-xl text-primary uppercase";
                        fallback.innerText = toInitials(myName);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center font-display font-black text-xl text-primary uppercase">
                    {toInitials(myName)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="font-display font-black text-xl text-white leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">{myName || "Você"}</p>
              <p className="text-[10px] text-primary/60 font-body mt-2 font-black uppercase tracking-[0.2em]">{myRole}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1 text-center sm:text-left">Perfil DISC</span>
                <span className="text-xs font-accent font-black text-primary tracking-widest uppercase">
                  {myDisc} · {DISC_LABEL[myDisc] ?? "—"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1 block">Level</span>
                <span className="text-xs font-accent text-white font-black tracking-widest uppercase">{currentLevel}</span>
              </div>
            </div>

            {/* Progresso de Nível */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Progresso de Nível</p>
                <span className="text-xs text-primary font-black drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{Math.round(xpProgress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5 p-[1px]">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  style={{ background: `linear-gradient(90deg, #059669, #10b981)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Minhas Publicações (Curtidas / Salvas) ── */}
      {onFilter && (
        <motion.div
          initial={{ opacity: 1, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card border border-white/5 rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="px-5 pt-5 pb-2">
            <h3 className="font-display text-[10px] font-black text-white/30 flex items-center gap-3 uppercase tracking-[0.2em] mb-4">
              <LayoutList size={14} className="text-primary/60" /> Minhas Publicações
            </h3>
          </div>

          {([
            {
              id: "curtidos" as FeedFilter,
              label: "Curtidas",
              icon: Heart,
              activeColor: "text-rose-400",
              activeBg: "bg-rose-400/10",
              activeBorder: "border-rose-400/20",
            },
            {
              id: "salvos" as FeedFilter,
              label: "Salvas",
              icon: Bookmark,
              activeColor: "text-primary",
              activeBg: "bg-primary/10",
              activeBorder: "border-primary/20",
            },
          ]).map(({ id, label, icon: Icon, activeColor, activeBg, activeBorder }) => {
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                onClick={() => onFilter(isActive ? "recentes" : id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all duration-200 group
                  ${isActive
                    ? `${activeBg} border-l-2 ${activeBorder}`
                    : "hover:bg-white/[0.03] border-l-2 border-transparent"}`}
              >
                <Icon
                  size={15}
                  className={`flex-shrink-0 transition-colors duration-200 ${isActive ? activeColor : "text-white/30 group-hover:text-white/60"}`}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span
                  className={`flex-1 text-left text-[13px] font-body font-semibold transition-colors duration-200 ${
                    isActive ? `${activeColor}` : "text-white/50 group-hover:text-white/80"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
          <div className="h-2" />
        </motion.div>
      )}

      {/* ── Ranking por XP (dinâmico) ── */}
      <motion.div
        initial={{ opacity: 1, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-7 border border-white/5 rounded-3xl shadow-xl">
        <h3 className="font-display text-[10px] font-black text-white/30 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
          <Trophy size={16} className="text-primary/60" /> Ranking por XP
        </h3>
        <div className="space-y-6">
          {rankingLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={18} className="animate-spin text-primary/40" />
            </div>
          ) : top5.length === 0 ? (
            <p className="text-[11px] text-white/30 font-body text-center py-4">Nenhum progresso registrado ainda.</p>
          ) : (
            top5.map((member, i) => (
              <div key={member.user_id} className="flex items-center gap-4 group cursor-pointer">
                <div className="relative">
                  <UserAvatar avatarUrl={member.avatar_url} name={member.name} disc={member.disc} size="sm" />
                  <span className="absolute -top-1 -right-1 text-sm filter grayscale group-hover:grayscale-0 transition-all duration-300">
                    {BADGES[i] ?? `${i + 1}º`}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-body font-bold text-white group-hover:text-primary transition-colors duration-300 truncate tracking-tight">{member.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest">{member.total_xp} XP</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Comunidade Hoje ── */}
      <motion.div
        initial={{ opacity: 1, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-7 border border-white/5 rounded-3xl shadow-xl">
        <h3 className="font-display text-[10px] font-black text-white/30 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
          <Zap size={16} className="text-primary/60" /> Atividade
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Membros", value: "2.4k" },
            { label: "Insights", value: "138"  },
            { label: "Online",  value: "94"   },
            { label: "Vagas",   value: "412"  },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl p-4 bg-white/[0.02] border border-white/[0.05] group/stat hover:bg-white/[0.04] transition-all duration-300">
              <p className="font-display text-lg font-black text-white group-hover/stat:text-primary transition-colors">{value}</p>
              <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.1em] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LeftSidebar;