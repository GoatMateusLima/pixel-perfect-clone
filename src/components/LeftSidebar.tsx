/**
 * LeftSidebar.tsx
 *
 * Sidebar esquerda da CommunityPage.
 * Busca o banner do usuário da tabela profiles (coluna `banner`) —
 * mesmo dado exibido no ProfilePage, ficam sempre sincronizados.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Zap, BookOpen } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import { UserAvatar, DISC_IMGS, DISC_COLOR, DISC_LABEL, toInitials } from "./PostCard";

// ─── Constantes estáticas ─────────────────────────────────────────────────────

const TRENDING = [
  { tag: "#RemoteWork",             posts: 1240 },
  { tag: "#InteligenciaArtificial", posts: 987  },
  { tag: "#FreelancerBR",           posts: 754  },
  { tag: "#DataScience",            posts: 612  },
  { tag: "#CarreiraTech",           posts: 501  },
];

const TOP_MEMBERS = [
  { name: "Larissa Mendes", avatar_url: "https://i.pravatar.cc/150?u=larissa", disc: "I", posts: 48, badge: "🥇" },
  { name: "Diego Almeida",  avatar_url: "https://i.pravatar.cc/150?u=diego",   disc: "D", posts: 37, badge: "🥈" },
  { name: "Fernanda Lima",  avatar_url: "https://i.pravatar.cc/150?u=fernanda",disc: "S", posts: 29, badge: "🥉" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  myAvatarUrl:      string | null;
  myName:           string;
  myDisc:           string;
  myRole:           string;
  myHourValue:      string;
  myCourseProgress: number;
  myCourseTitle:    string;
  myUserId?:        string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const LeftSidebar = ({
  myAvatarUrl, myName, myDisc, myRole, myHourValue,
  myCourseProgress, myCourseTitle, myUserId,
}: LeftSidebarProps) => {
  const discImg   = DISC_IMGS[myDisc];
  const discColor = DISC_COLOR[myDisc] ?? DISC_COLOR.S;

  // Banner buscado da tabela profiles — mesma coluna do ProfilePage
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!myUserId) return;
    supabase
      .from("profiles")
      .select("banner")
      .eq("id", myUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.banner) setBannerUrl(data.banner);
      });
  }, [myUserId]);

  return (
    <div className="space-y-4">

      {/* ── Card do perfil ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        className="hologram-panel rounded-sm overflow-hidden">

        {/* Banner: foto real ou gradiente DISC */}
        <div className="h-16 w-full overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative"
              style={{ background: `linear-gradient(135deg, ${discColor}44 0%, ${discColor}11 60%, hsl(210 40% 10% / 0.2) 100%)` }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 24px,${discColor}1px),repeating-linear-gradient(90deg,transparent,transparent 24px,${discColor}1px)` }} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-7 mb-3">
            {/* Avatar com anel DISC */}
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 56, height: 56 }}>
              {discImg
                ? <img src={discImg} alt="DISC" className="absolute inset-0 w-full h-full rounded-full object-cover" style={{ zIndex: 1 }} />
                : <div className="absolute inset-0 rounded-full" style={{ background: discColor, zIndex: 1 }} />
              }
              <div
                className="absolute rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-xs z-10"
                style={{ width: 40, height: 40, top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  background: myAvatarUrl ? undefined : "hsl(var(--secondary))",
                  border: "2.5px solid hsl(var(--background))", color: discColor }}>
                {myAvatarUrl
                  ? <img src={myAvatarUrl} alt={myName} className="w-full h-full object-cover" />
                  : <span>{toInitials(myName)}</span>
                }
              </div>
            </div>
            <div className="mb-0.5">
              <p className="font-accent font-semibold text-sm text-foreground leading-none">{myName || "Você"}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">{myRole}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-accent font-semibold"
              style={{ background: `${discColor}18`, color: discColor, border: `1px solid ${discColor}40` }}>
              {myDisc} · {DISC_LABEL[myDisc] ?? "—"}
            </span>
            <span className="text-[10px] font-accent text-accent font-semibold">{myHourValue}</span>
          </div>

          {/* Progresso da trilha */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-muted-foreground font-accent flex items-center gap-1">
                <BookOpen size={10} /> Trilha atual
              </p>
              <span className="text-[10px] text-primary font-accent">{myCourseProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${myCourseProgress}%` }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(155 60% 55%))" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1 truncate">{myCourseTitle}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Tópicos em Alta ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Flame size={14} className="text-accent" /> Tópicos em Alta
        </h3>
        <div className="space-y-2.5">
          {TRENDING.map((t, i) => (
            <motion.button key={t.tag} whileHover={{ x: 3 }} className="w-full flex items-center justify-between text-left group">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-accent w-3">{i + 1}</span>
                <span className="text-xs font-accent font-semibold text-primary group-hover:brightness-125 transition">{t.tag}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-body">{t.posts.toLocaleString("pt-BR")}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Membros em Destaque ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Trophy size={14} className="text-accent" /> Membros em Destaque
        </h3>
        <div className="space-y-3">
          {TOP_MEMBERS.map((m) => (
            <div key={m.name} className="flex items-center gap-2.5">
              <span className="text-sm">{m.badge}</span>
              <UserAvatar avatarUrl={m.avatar_url} name={m.name} disc={m.disc} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-accent font-semibold text-foreground truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground font-body">{m.posts} posts este mês</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Comunidade Hoje ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
        className="hologram-panel rounded-sm p-4">
        <h3 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Zap size={14} className="text-primary" /> Comunidade Hoje
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Membros", value: "2.4k", color: "hsl(155 60% 45%)" },
            { label: "Posts",   value: "138",  color: "hsl(25 90% 55%)"  },
            { label: "Online",  value: "94",   color: "hsl(45 90% 55%)"  },
            { label: "Vagas",   value: "412",  color: "hsl(210 70% 55%)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-sm p-2 text-center"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
              <p className="font-display text-sm font-bold" style={{ color }}>{value}</p>
              <p className="text-[9px] text-muted-foreground font-accent uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LeftSidebar;
