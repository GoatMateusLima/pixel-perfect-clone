import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../../utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const NotificationBell = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Busca inicial
    const fetchPending = async () => {
      const { count, error } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      
      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPending();

    // Escuta Realtime com LOGS
    const channel = supabase
      .channel("friend-requests")
      .on(
        "postgres_changes",
        {
          event: "*", 
          schema: "public",
          table: "friendships",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 [REALTIME] Evento de amizade recebido!", payload);
          fetchPending();
        }
      )
      .subscribe((status) => {
        console.log("🔌 [REALTIME] Status da conexão do Sininho:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Link to="/perfil" className="relative p-2 text-muted-foreground hover:text-foreground transition">
      <Bell size={20} />
      <AnimatePresence>
        {pendingCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white 
            flex items-center justify-center text-[9px] font-bold font-accent pointer-events-none"
            style={{ boxShadow: "0 0 8px rgba(244, 63, 94, 0.6)" }}
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export default NotificationBell;