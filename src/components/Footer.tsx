import { Github, Linkedin, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/20 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="font-display text-xl font-bold text-primary text-glow tracking-widest">
            UPJOBS
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {["Início", "Roadmaps", "Sobre", "Contato", "Termos", "Privacidade"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-muted-foreground hover:text-primary font-body transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Social */}
          <div className="flex gap-4">
            {[Github, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-muted-foreground font-body">
          © 2026 UpJobs. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
