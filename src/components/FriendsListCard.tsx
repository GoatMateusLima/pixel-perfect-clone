import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";
import supabase from "../../utils/supabase";

interface Friend {
  friend_id: string;
  name: string;
  avatar: string | null;
  username: string | null;
}

const FriendsListCard = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFriends = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_meus_amigos");
      if (!cancelled) {
        if (!error && data) {
          setFriends(data as Friend[]);
        }
        setLoading(false);
      }
    };
    loadFriends();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden shadow-2xl relative flex flex-col h-full"
      style={{
        background: "rgba(20, 25, 35, 0.4)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border/20"
        style={{ background: "rgba(255, 255, 255, 0.02)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "hsl(210 70% 60% / 0.15)", color: "hsl(210 70% 65%)" }}>
            <Users size={16} />
          </div>
          <span className="text-sm font-accent font-semibold text-foreground tracking-wide">Amigos</span>
        </div>
        {!loading && friends.length > 0 && (
          <span className="text-[10px] font-accent font-bold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(210 70% 60% / 0.15)", color: "hsl(210 70% 65%)" }}>
            {friends.length}
          </span>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(210 70% 60% / 0.2) transparent" }}>
        {loading ? (
          <div className="flex justify-center items-center py-12 gap-2 text-muted-foreground/60">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-body">Carregando...</span>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users size={32} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-[13px] font-body text-muted-foreground/60 leading-tight">
              Ainda não há ninguém aqui. Explore a comunidade!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {friends.map((friend) => (
              <Link key={friend.friend_id} to={friend.username ? `/u/${friend.username}` : `/user/${friend.friend_id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group">
                
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-secondary relative border border-white/10 group-hover:border-blue-400/30 transition-colors">
                  {friend.avatar
                    ? <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                    : <User size={18} className="text-muted-foreground/50" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-accent font-semibold text-foreground/90 truncate group-hover:text-blue-400 transition-colors">
                    {friend.name}
                  </p>
                  <p className="text-[10px] font-body text-muted-foreground/50 truncate">
                    {friend.username ? `@${friend.username}` : "Usuário"}
                  </p>
                </div>
                
              </Link>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default FriendsListCard;
