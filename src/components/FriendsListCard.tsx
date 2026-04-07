import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../utils/supabase";

interface Friend {
  friend_id: string;
  name: string;
  avatar: string | null;
  username: string | null;
  banner: string | null;
}

// =============================================================================
// SCAN RING — efeito de riscos orbitando ao redor da foto
// =============================================================================
const ScanRing = ({ color = "hsl(155 60% 45%)" }: { color?: string }) => {
  const dimColor = color.replace("hsl(", "hsla(").replace(")", " / 0.15)");
  const brightColor = color;

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      {/* Glow de fundo - aura suave */}
      <div 
        className="absolute inset-[10%] rounded-full opacity-30 blur-lg transition-all duration-700"
        style={{ background: brightColor }}
      />
      
      {/* Anel de Vidro / Aura - o efeito "bolinha" orgânico da imagem */}
      <div 
        className="absolute inset-[-15%] rounded-[40%] border border-white/5 backdrop-blur-[1px] opacity-40 rotate-[-10deg]"
        style={{ 
          background: `radial-gradient(circle at 70% 70%, ${brightColor}20 0%, transparent 70%)`,
          boxShadow: `inset 0 0 10px ${dimColor}, 0 0 15px ${dimColor}`
        }}
      />
      
      {/* Risco orbitando principal */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-5%] rounded-full opacity-60"
        style={{
          border: "1.2px solid transparent",
          borderTopColor: brightColor,
          borderRightColor: dimColor,
          filter: `drop-shadow(0 0 5px ${brightColor})`
        }}
      />

      {/* Risco orbitando secundário (tracejado) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-10%] rounded-full opacity-20"
        style={{
          border: `1px dashed ${brightColor}`,
        }}
      />
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
const FriendsListCard = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFriends = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_meus_amigos");

      if (!cancelled && !error && data) {
        const friendsBase = data as Omit<Friend, "banner">[];

        // Busca banners dos profiles dos amigos para o efeito premium
        const ids = friendsBase.map((f) => f.friend_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, banner")
          .in("user_id", ids);

        const bannerMap: Record<string, string | null> = {};
        (profiles ?? []).forEach((p) => {
          bannerMap[p.user_id] = p.banner ?? null;
        });

        setFriends(
          friendsBase.map((f) => ({
            ...f,
            banner: bannerMap[f.friend_id] ?? null,
          }))
        );
      }

      if (!cancelled) setLoading(false);
    };

    loadFriends();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl overflow-hidden shadow-2xl relative flex flex-col h-full group/main"
      style={{
        background: "rgba(10, 15, 25, 0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.05]"
        style={{ background: "rgba(255, 255, 255, 0.02)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-primary/10 text-primary border border-primary/20"
          >
            <Users size={16} />
          </div>
          <span className="text-sm font-accent font-semibold text-foreground/90 tracking-wide">
            Amigos
          </span>
        </div>
        {!loading && friends.length > 0 && (
          <span
            className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            {friends.length}
          </span>
        )}
      </div>

      {/* Lista */}
      <div
        className="flex-1 overflow-y-auto p-2.5 space-y-2.5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 gap-3 text-muted-foreground/40">
            <Loader2 size={24} className="animate-spin text-primary/60" />
            <span className="text-[10px] font-accent uppercase tracking-widest">Sincronizando...</span>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto mb-4">
              <Users size={18} className="text-muted-foreground/20" />
            </div>
            <p className="text-xs font-body text-muted-foreground/50 leading-relaxed max-w-[140px] mx-auto">
              Nenhum amigo online no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {friends.map((friend, i) => (
              <motion.div
                key={friend.friend_id}
                initial={{ opacity: 1, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={friend.username ? `/u/${friend.username}` : `/user/${friend.friend_id}`}
                  className="block relative rounded-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] border border-white/[0.04] hover:border-primary/30"
                  style={{ background: "rgba(255, 255, 255, 0.02)" }}
                >
                  {/* Banner de fundo mini */}
                  <div className="relative w-full h-14 overflow-hidden opacity-40 group-hover:opacity-60 transition-opacity">
                    {friend.banner ? (
                      <img
                        src={friend.banner}
                        alt="banner"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: "linear-gradient(135deg, rgba(30, 40, 60, 0.4) 0%, rgba(10, 20, 30, 0.6) 100%)",
                        }}
                      >
                         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 12px,rgba(255,255,255,0.1) 1px),repeating-linear-gradient(90deg,transparent,transparent 12px,rgba(255,255,255,0.1) 1px)" }} />
                      </div>
                    )}
                  </div>

                  {/* Content Profile */}
                  <div className="flex items-center gap-3 px-3 pb-3 -mt-5 relative z-10">
                    {/* Avatar Container with Rings */}
                    <div className="relative shrink-0" style={{ width: 40, height: 40 }}>
                      <div
                        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-secondary/80 backdrop-blur-sm relative z-20 border-2 border-[#0a0f19]"
                      >
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-muted-foreground/40" />
                        )}
                      </div>
                      {/* ScanRing matching the DISK profile logic (default green for now) */}
                      <ScanRing color="hsl(155 60% 45%)" />
                    </div>

                    <div className="flex-1 min-w-0 pt-4">
                      <p className="text-[11px] font-accent font-bold text-foreground/90 truncate group-hover:text-primary transition-colors">
                        {friend.name}
                      </p>
                      <p className="text-[9px] font-body text-muted-foreground/50 truncate">
                        {friend.username ? `@${friend.username}` : "Perfil UpJobs"}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FriendsListCard;