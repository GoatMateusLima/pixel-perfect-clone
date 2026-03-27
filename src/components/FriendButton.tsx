import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, UserCheck, UserX, Clock, Loader2, ChevronDown, Ban,
} from "lucide-react";
import supabase from "../../utils/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FriendStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "blocked"
  | "loading";

interface Props {
  targetUserId: string;
  targetName?: string;
  /** Callback chamado quando o status muda */
  onStatusChange?: (status: FriendStatus) => void;
  /** Estilo compacto (apenas ícone) */
  compact?: boolean;
}

// ─── FriendButton ─────────────────────────────────────────────────────────────

const FriendButton = ({ targetUserId, targetName = "usuário", onStatusChange, compact = false }: Props) => {
  const [status,  setStatus]  = useState<FriendStatus>("loading");
  const [saving,  setSaving]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Carrega o status atual
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      const { data, error } = await supabase.rpc("get_friendship_status", {
        target_id: targetUserId,
      });
      if (cancelled) return;
      if (!error && data) setStatus(data as FriendStatus);
      else setStatus("none");
    }
    load();
    return () => { cancelled = true; };
  }, [targetUserId]);

  useEffect(() => {
    if (status !== "loading") onStatusChange?.(status);
  }, [status]);

  // ── Ações ──

  const sendRequest = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("amizades").insert({
      user1: user.id,
      user2:  targetUserId,
      tipo:       "Pendente",
    });
    setSaving(false);
    
    if (error) {
      console.error("ERRO AO INSERIR AMIZADE:", error);
      alert(`Erro Supabase: ${error.message} (Detalhes no console)`);
      return;
    }
    
    if (!error) {
      setStatus("pending_sent");
      const ch = supabase.channel("friend-requests-bell");
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.send({
            type: "broadcast",
            event: "new-request",
            payload: { receiver_id: targetUserId },
          }).then(() => {
            // Pequeno atraso para garantir o envio antes do canal fechar
            setTimeout(() => supabase.removeChannel(ch), 1500);
          });
        }
      });
    }
  };

  const cancelOrUnfriend = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("amizades").delete().or(
      `and(user1.eq.${user.id},user2.eq.${targetUserId}),and(user1.eq.${targetUserId},user2.eq.${user.id})`
    );
    setSaving(false);
    setStatus("none");
    setMenuOpen(false);
  };

  const accept = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("amizades").update({ tipo: "Amigos" }).match({
      user1: targetUserId,
      user2:  user.id,
    });
    setSaving(false);
    setStatus("accepted");
  };

  const reject = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from("amizades").delete().match({
      user1: targetUserId,
      user2:  user.id,
    });
    setSaving(false);
    setStatus("none");
  };

  // ── Render configs ──

  const spinnerEl = <Loader2 size={14} className="animate-spin" />;

  if (status === "loading" || saving) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border/40
        text-xs font-accent text-muted-foreground opacity-60 cursor-wait">
        {spinnerEl}
        {!compact && <span>Carregando...</span>}
      </div>
    );
  }

  // ── Adicionar amigo ──
  if (status === "none") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={sendRequest}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
          font-semibold text-primary-foreground transition-all hover:brightness-110"
        style={{ background: "hsl(155 60% 38%)", boxShadow: "0 0 14px hsl(155 60% 40% / 0.35)" }}>
        <UserPlus size={14} />
        {!compact && <span>Adicionar amigo</span>}
      </motion.button>
    );
  }

  // ── Solicitação enviada ──
  if (status === "pending_sent") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={cancelOrUnfriend}
        title="Cancelar solicitação"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
          font-semibold border transition-all hover:border-destructive/60 hover:text-destructive"
        style={{ borderColor: "hsl(45 90% 55% / 0.5)", color: "hsl(45 90% 60%)", background: "hsl(45 90% 55% / 0.08)" }}>
        <Clock size={14} />
        {!compact && <span>Solicitação enviada</span>}
      </motion.button>
    );
  }

  // ── Solicitação recebida ──
  if (status === "pending_received") {
    return (
      <div className="inline-flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={accept}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
            font-semibold text-primary-foreground transition-all hover:brightness-110"
          style={{ background: "hsl(155 60% 38%)", boxShadow: "0 0 12px hsl(155 60% 40% / 0.3)" }}>
          <UserCheck size={14} />
          {!compact && <span>Aceitar</span>}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={reject}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
            font-semibold border border-border/50 text-muted-foreground
            hover:border-destructive/50 hover:text-destructive transition-all">
          <UserX size={14} />
          {!compact && <span>Recusar</span>}
        </motion.button>
      </div>
    );
  }

  // ── Amigos ──
  if (status === "accepted") {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setMenuOpen(p => !p)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-accent
            font-semibold border transition-all"
          style={{ borderColor: "hsl(155 60% 45% / 0.45)", color: "hsl(155 60% 55%)", background: "hsl(155 60% 45% / 0.1)" }}>
          <UserCheck size={14} />
          {!compact && <span>Amigos</span>}
          {!compact && <ChevronDown size={11} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />}
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="absolute left-0 top-full mt-1 z-50 hologram-panel rounded-sm
                border border-border/40 overflow-hidden min-w-[160px]"
              onMouseLeave={() => setMenuOpen(false)}>
              <button
                onClick={cancelOrUnfriend}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-accent
                  text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-left">
                <Ban size={12} /> Desfazer amizade
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

export default FriendButton;
