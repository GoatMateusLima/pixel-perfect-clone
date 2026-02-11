import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, LogIn } from "lucide-react";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Preencha todos os campos."); return; }
    const ok = login(email, password);
    if (ok) { navigate("/"); }
    else { setError("E-mail ou senha incorretos."); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero scanline px-4">
      <motion.div
        className="w-full max-w-md hologram-panel rounded-sm p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-body mb-6">
          <ArrowLeft size={14} /> Voltar
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-glow mb-2">UPJOBS</h1>
          <p className="text-muted-foreground font-body text-sm">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-destructive font-body">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm bg-accent text-accent-foreground font-accent font-bold box-glow-accent hover:brightness-110 transition"
          >
            <LogIn size={16} />
            Entrar
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-primary hover:underline">Cadastre-se</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
