import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, User, LifeBuoy, Home, Globe, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "../../utils/supabase.ts";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { label: "Início",     href: "/roadmap",    icon: Home     },
  { label: "Perfil",     href: "/perfil",     icon: User     },
  { label: "Suporte",    href: "/suporte",    icon: LifeBuoy },
  { label: "Comunidade", href: "/comunidade", icon: Globe    },
];

const Header = () => {
  const { user, logout, profilePhoto } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  /** Mesma fonte que LeftSidebar/Community: `profiles.perfil` quando o contexto ainda não sincronizou */
  const [perfilFromDb, setPerfilFromDb] = useState<string | null>(null);

  const avatarUrl = profilePhoto || perfilFromDb;

  useEffect(() => {
    if (!user?.id) {
      setPerfilFromDb(null);
      return;
    }
    supabase
      .from("profiles")
      .select("perfil")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setPerfilFromDb(data?.perfil ?? null));
  }, [user?.id]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Sincroniza o contador de mensagens não lidas
  useEffect(() => {
    const syncUnread = (e: any) => setUnreadCount(e.detail?.count || 0);
    window.addEventListener('unread-sync', syncUnread);
    return () => window.removeEventListener('unread-sync', syncUnread);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao fazer logout:", error.message);
    logout();
    navigate("/");
  };

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // Configuração especial para a Bottom Nav no Mobile (com Mensagens no meio)
  const MOBILE_NAV = [
    { label: "Início",     href: "/roadmap",    icon: Home },
    { label: "Comunidade", href: "/comunidade", icon: Globe },
    { label: "Mensagens",  href: "#messenger",  icon: MessageCircle, isAction: true },
    { label: "Notificações", href: "#notifications", icon: NotificationBell, isCustom: true },
    { label: "Perfil",     href: "/perfil",     icon: User },
  ];

  return (
    <>
      {/* ── Header Topo (Desktop sempre, Mobile apenas Logo) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10, 10, 10, 0.95)" : "rgba(10, 10, 10, 0.7)",
          borderBottom: "1px solid rgba(16, 185, 129, 0.15)",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/30 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="font-display text-lg font-black text-primary">U</span>
            </div>
            <span className="font-display text-xl font-bold tracking-[0.2em] text-white group-hover:text-primary transition-colors">UPJOBS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-accent font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive(href) ? "text-primary border-primary/20 bg-primary/5" : "text-white/40 hover:text-white border-transparent"
                } border`}
                style={isActive(href) ? { boxShadow: "inset 0 0 10px rgba(16, 185, 129, 0.05)" } : {}}>
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>

          {/* Right: auth + avatar (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <NotificationBell />
                <Link to="/perfil"
                  className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] bg-primary/5"
                  title="Meu Perfil">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Foto de Perfil" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.avatar-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = "avatar-fallback w-full h-full bg-primary/20 flex items-center justify-center font-display font-black text-xs text-primary uppercase";
                          fallback.innerText = user?.user_metadata?.name?.slice(0, 2).toUpperCase() ?? "EU";
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center font-display font-black text-xs text-primary uppercase">
                      {user.user_metadata?.name?.slice(0, 2).toUpperCase() ?? user.email?.slice(0, 2).toUpperCase() ?? "EU"}
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout}
                  className="p-2 rounded-xl text-white/20 hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all duration-300"
                  title="Sair">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[11px] font-accent font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link to="/cadastro" className="px-5 py-2 rounded-xl bg-primary text-black text-[11px] font-accent font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  Começar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right (Título apenas, navegação foi para baixo) */}
          <div className="flex md:hidden items-center gap-3">
            <span className="text-[10px] font-accent font-black text-primary uppercase tracking-[0.2em]">UpJobs Hub</span>
          </div>
        </div>
      </header>

      {/* ── Bottom Nav (Apenas Mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
        <div className="max-w-md mx-auto h-20 glass-card border-primary/20 backdrop-blur-2xl flex items-center justify-around px-2 pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {MOBILE_NAV.map(({ label, href, icon: Icon, isAction, isCustom }) => {
            const active = !isAction && !isCustom && isActive(href);
            const isProfile = label === "Perfil";
            const isMessages = label === "Mensagens";

            const content = (
              <div className={`flex flex-col items-center justify-center transition-all duration-300 relative group ${
                active ? "text-primary" : "text-white/30"
              }`}>
                {active && (
                  <motion.div layoutId="nav-glow" className="absolute -top-2 w-12 h-1 rounded-full bg-primary shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  active ? "bg-primary/10" : "group-hover:bg-white/5"
                }`}>
                  {isProfile && user ? (
                    <div className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center ${active ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-white/10 opacity-60"}`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-black text-[10px] text-primary">
                           {user.user_metadata?.name?.slice(0, 2).toUpperCase() ?? "EU"}
                        </span>
                      )}
                    </div>
                  ) : isCustom ? (
                    <NotificationBell />
                  ) : (
                    <div className="relative">
                      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                      {isMessages && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isCustom && (
                  <span className={`text-[8px] font-accent font-black uppercase tracking-[0.2em] mt-1 transition-opacity ${active ? "opacity-100" : "opacity-40"}`}>
                    {label}
                  </span>
                )}
              </div>
            );

            if (isAction) {
              return (
                <button key={label} onClick={() => window.dispatchEvent(new CustomEvent('toggle-messenger'))} className="focus:outline-none">
                  {content}
                </button>
              );
            }

            if (isCustom) {
              return <div key={label}>{content}</div>;
            }

            return (
              <Link key={href} to={href}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;