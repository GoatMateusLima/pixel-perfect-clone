import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, Map, User, LifeBuoy, Home, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const KEY_PHOTO = "upjobs_profile_photo_v2";

const NAV_ITEMS = [
  { label: "Início",    href: "/roadmap",          icon: Home    },
  { label: "Perfil",    href: "/perfil",    icon: User    },
  { label: "Suporte",   href: "/suporte",   icon: LifeBuoy },
  { label: "Comunidade",     href: "/comunidade", icon: Globe },
];

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  /* Scroll shadow */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Sync profile photo from localStorage whenever user changes */
  useEffect(() => {
    setPhotoSrc(localStorage.getItem(KEY_PHOTO));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "hsl(200 30% 8% / 0.95)"
          : "hsl(200 30% 8% / 0.7)",
        borderBottom: scrolled
          ? "1px solid hsl(155 60% 35% / 0.25)"
          : "1px solid transparent",
        backdropFilter: "blur(12px)",
        boxShadow: scrolled ? "0 4px 24px hsl(0 0% 0% / 0.3)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="font-display text-xl font-bold text-glow tracking-widest">UPJOBS</span>
          <span
            className="hidden sm:inline text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
            style={{ background: "hsl(25 90% 55% / 0.15)", color: "hsl(25 90% 55%)", border: "1px solid hsl(25 90% 55% / 0.3)" }}
          >
            BETA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold transition-all ${
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={
                isActive(href)
                  ? {
                      background: "hsl(155 60% 35% / 0.12)",
                      border: "1px solid hsl(155 60% 35% / 0.3)",
                      textShadow: "0 0 8px hsl(155 60% 45% / 0.4)",
                    }
                  : { border: "1px solid transparent" }
              }
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: auth + avatar */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Avatar vinculado à foto do perfil */}
              <Link
                to="/perfil"
                className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition hover:brightness-110"
                style={{
                  border: "2px solid hsl(155 60% 45% / 0.6)",
                  boxShadow: "0 0 10px hsl(155 60% 45% / 0.25)",
                  background: "hsl(155 60% 45% / 0.15)",
                }}
                title="Meu Perfil"
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-[11px] text-primary">
                    {user.name?.slice(0, 2).toUpperCase() ?? "EU"}
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-muted-foreground border border-border hover:text-destructive hover:border-destructive/50 transition"
              >
                <LogOut size={13} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-muted-foreground border border-border hover:text-foreground hover:border-primary/40 transition"
              >
                <LogIn size={13} /> Entrar
              </Link>
              <Link
                to="/cadastro"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-accent font-bold text-primary-foreground transition hover:brightness-110 box-glow-accent"
                style={{ background: "hsl(25 90% 55%)" }}
              >
                Começar grátis
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/30"
            style={{ background: "hsl(200 30% 8% / 0.98)" }}
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-accent font-semibold transition ${
                    isActive(href)
                      ? "text-primary bg-primary/10 border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30 border border-transparent"
                  }`}
                >
                  <Icon size={15} /> {label}
                </Link>
              ))}

              <div className="pt-3 border-t border-border/30 flex flex-col gap-2">
                {user ? (
                  <>
                    {/* Mobile avatar info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ border: "2px solid hsl(155 60% 45% / 0.6)", background: "hsl(155 60% 45% / 0.15)" }}
                      >
                        {photoSrc ? (
                          <img src={photoSrc} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-bold text-xs text-primary">
                            {user.name?.slice(0, 2).toUpperCase() ?? "EU"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-accent font-semibold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-accent font-semibold text-muted-foreground hover:text-destructive transition"
                    >
                      <LogOut size={15} /> Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-accent font-semibold text-muted-foreground hover:text-foreground transition">
                      <LogIn size={15} /> Entrar
                    </Link>
                    <Link to="/cadastro" onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-sm font-accent font-bold text-primary-foreground transition hover:brightness-110"
                      style={{ background: "hsl(25 90% 55%)" }}>
                      Começar grátis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;