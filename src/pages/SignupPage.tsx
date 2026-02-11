import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus } from "lucide-react";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) { setError("Preencha todos os campos."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    const ok = signup(name, email, password);
    if (ok) { navigate("/"); }
    else { setError("Este e-mail já está cadastrado."); }
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
          <p className="text-muted-foreground font-body text-sm">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition"
              placeholder="Seu nome"
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition"
              placeholder="Repita a senha"
            />
          </div>

          {error && <p className="text-xs text-destructive font-body">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm bg-accent text-accent-foreground font-accent font-bold box-glow-accent hover:brightness-110 transition"
          >
            <UserPlus size={16} />
            Criar Conta
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Faça login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
