import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Início", href: "#hero" },
  { label: "Realidade", href: "#dores" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Soluções", href: "#solucoes" },
  { label: "FAQ", href: "#faq" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1" />
          <Link to="/">
            <motion.div
              className="font-display text-2xl font-bold text-primary tracking-widest"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              UPJOBS
            </motion.div>
          </Link>
          <div className="flex-1 flex justify-end gap-3 items-center">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground font-body">
                  <User size={14} className="inline mr-1" />
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex items-center gap-1 px-4 py-1.5 rounded-sm border border-border text-muted-foreground text-sm font-accent font-semibold hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold hover:bg-primary/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/cadastro"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-semibold hover:brightness-110 transition box-glow-accent"
                >
                  Cadastre-se
                </Link>
              </>
            )}
            <button
              className="sm:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <nav className="hidden sm:flex items-center justify-center gap-8 pb-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-accent font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="sm:hidden bg-background/95 border-t border-border px-4 pb-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-accent text-muted-foreground hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 mt-3">
            {user ? (
              <button onClick={logout} className="px-4 py-1.5 rounded-sm border border-border text-muted-foreground text-sm font-accent font-semibold">
                Sair
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-1.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold">
                  Login
                </Link>
                <Link to="/cadastro" className="px-4 py-1.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-semibold">
                  Cadastre-se
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
