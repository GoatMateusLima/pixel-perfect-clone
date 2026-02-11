import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Início", href: "#hero" },
  { label: "Realidade", href: "#dores" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Soluções", href: "#solucoes" },
  { label: "FAQ", href: "#faq" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top row: logo + buttons */}
        <div className="flex items-center justify-between h-16">
          <div className="flex-1" />
          <motion.div
            className="font-display text-2xl font-bold text-primary text-glow tracking-widest"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            UPJOBS
          </motion.div>
          <div className="flex-1 flex justify-end gap-3 items-center">
            <a
              href="#cta"
              className="hidden sm:inline-flex px-4 py-1.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold hover:bg-primary/10 transition-colors"
            >
              Login
            </a>
            <a
              href="#cta"
              className="hidden sm:inline-flex px-4 py-1.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-semibold hover:brightness-110 transition box-glow-accent"
            >
              Cadastre-se
            </a>
            <button
              className="sm:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Nav row */}
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

      {/* Mobile menu */}
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
            <a href="#cta" className="px-4 py-1.5 rounded-sm border border-primary/40 text-primary text-sm font-accent font-semibold">
              Login
            </a>
            <a href="#cta" className="px-4 py-1.5 rounded-sm bg-accent text-accent-foreground text-sm font-accent font-semibold">
              Cadastre-se
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
