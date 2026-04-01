import { useState, useEffect, useRef } from "react";
import { Bell, UserCheck, UserX, Loader2, User, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FriendRequest {
  id:           string;
  requester_id: string;
  created_at:   string;
  profile?: {
    name?:    string;
    perfil?:  string;
    username?: string;
  };
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

const NotificationBell = () => {
  const { user } = useAuth();

  const [open,     setOpen]     = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [actioning, setActioning] = useState<string | null>(null); // id da row em ação

  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  // ── Fecha ao clicar fora ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Busca solicitações pendentes ──
  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("amizades")
      .select(`
        id,
        user1,
        created_at,
        profiles!amizades_user1_fkey (
          name,
          perfil,
          username
        )
      `)
      .eq("user2", user.id)
      .eq("tipo", "Pendente")
      .order("created_at", { ascending: false });

    setLoading(false);
    if (!error && data) {
      setRequests(
        data.map((row: any) => ({
          id:           row.id,
          requester_id: row.user1,
          created_at:   row.created_at,
          profile:      Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
        }))
      );
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRequests();

    // Realtime — atualiza badge e lista ao vivo
    const channelSuffix = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`friend-requests-bell-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "amizades",
          filter: `user2=eq.${user.id}`,
        },
        () => fetchRequests()
      )
      .on(
        "broadcast",
        { event: "new-request" },
        (payload) => {
          if (payload.payload.receiver_id === user.id) {
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ── Aceitar ──
  const accept = async (req: FriendRequest) => {
    setActioning(req.id);
    await supabase
      .from("amizades")
      .update({ tipo: "Amigos" })
      .match({ id: req.id });
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setActioning(null);
  };

  // ── Recusar ──
  const reject = async (req: FriendRequest) => {
    setActioning(req.id);
    await supabase
      .from("amizades")
      .delete()
      .match({ id: req.id });
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setActioning(null);
  };

  const count = requests.length;

  const fmtDate = (iso: string) => {
    const d    = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000)     return "agora";
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m atrás`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="relative">

      {/* ── Botão sininho ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(p => !p)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition rounded-sm
          hover:bg-white/5"
        aria-label="Notificações">
        <Bell size={20} />

        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white
                flex items-center justify-center text-[9px] font-bold font-accent pointer-events-none"
              style={{ boxShadow: "0 0 8px rgba(244, 63, 94, 0.6)" }}>
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit ={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute right-0 top-full mt-2 z-[999] w-80 rounded-sm overflow-hidden"
            style={{
              background:  "hsl(215 30% 10%)",
              border:      "1px solid hsl(155 60% 45% / 0.25)",
              boxShadow:   "0 12px 40px rgba(0,0,0,0.7), 0 0 20px hsl(155 60% 45% / 0.08)",
            }}>

            {/* Header do painel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/25"
              style={{ background: "hsl(215 30% 12%)" }}>
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-primary" />
                <span className="text-xs font-accent font-semibold text-foreground">
                  Solicitações de amizade
                </span>
              </div>
              {count > 0 && (
                <span className="text-[10px] font-accent font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "hsl(0 70% 55% / 0.2)", color: "hsl(0 70% 65%)", border: "1px solid hsl(0 70% 55% / 0.3)" }}>
                  {count} {count === 1 ? "pendente" : "pendentes"}
                </span>
              )}
            </div>

            {/* Conteúdo */}
            <div className="max-h-80 overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-body">Carregando...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Check size={24} className="text-muted-foreground/25" />
                  <p className="text-xs text-muted-foreground/50 font-body">
                    Nenhuma solicitação pendente.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {requests.map((req) => {
                    const isActioning = actioning === req.id;
                    const name    = req.profile?.name    ?? "Usuário";
                    const avatar  = req.profile?.perfil  ?? null;
                    const username = req.profile?.username;

                    return (
                      <motion.div
                        key={req.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1    }}
                        exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
                        className="mx-3 my-2 flex flex-col gap-3 p-3 rounded-md hover:bg-white/[0.04] transition-colors"
                        style={{ border: "1px solid hsl(155 60% 45% / 0.12)", background: "hsl(215 30% 12%)" }}>

                        <div className="flex items-center gap-3">
                          {/* Avatar estilo Preview */}
                          <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-secondary relative"
                            style={{ border: "2px solid hsl(155 60% 45% / 0.5)", boxShadow: "0 0 16px hsl(155 60% 45% / 0.15)" }}>
                            {avatar
                              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                              : <User size={18} className="text-muted-foreground" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-accent font-semibold text-foreground truncate">
                              {name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 font-body">
                              {username ? `@${username} · ` : ""}{fmtDate(req.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Ações Integradas (Botões Largos) */}
                        <div className="flex items-center gap-2 mt-1 shrink-0 h-8">
                          {isActioning ? (
                            <div className="w-full flex justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
                          ) : (
                            <>
                              {/* Aceitar */}
                              <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                                onClick={() => accept(req)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-sm text-xs font-accent font-bold transition-all h-full"
                                style={{
                                  background:  "hsl(155 60% 38%)",
                                  color:       "white",
                                  boxShadow:   "0 0 10px hsl(155 60% 40% / 0.25)",
                                }}>
                                <UserCheck size={14} /> Aceitar
                              </motion.button>

                              {/* Recusar */}
                              <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                                onClick={() => reject(req)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-sm text-xs font-accent font-semibold border border-border/50 text-muted-foreground h-full hover:border-rose-500/50 hover:text-rose-400 transition-all">
                                <UserX size={14} /> Recusar
                              </motion.button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;