import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogIn, Loader2 } from "lucide-react";
import supabase from "../../utils/supabase";

// ─── LoginPage ────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Mensagem vinda do cadastro (ex: "Confirme seu e-mail e faça login.")
  const locationMessage = (location.state as { message?: string })?.message ?? "";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.toLowerCase().includes("invalid login") ||
          signInError.message.toLowerCase().includes("invalid credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
        setError("Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.");
      } else {
        setError("Erro ao fazer login. Tente novamente.");
        console.error("Supabase signIn error:", signInError.message);
      }
      return;
    }

    // Login bem-sucedido — vai para o roadmap
    navigate("/roadmap");
  };

  return (
    <div className="min-h-screen flex items-center justify-center gap-16 gradient-hero scanline px-6 lg:px-20">

      {/* ── Bloco lateral de marketing ── */}
      <motion.div
        className="hidden lg:block w-full max-w-md text-center"
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-glow mb-4">
          Seja bem-vindo ao{" "}
          <span className="text-accent text-glow-accent">UpJobs</span>!
        </h3>
        <p className="text-muted-foreground font-body mb-8 max-w-xl mx-auto leading-relaxed">
          Pare de perder tempo em uma carreira sem futuro. Descubra seu caminho ideal em minutos — 100% gratuito.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground font-body">
          {["Análise DISC completa", "Cálculo Hora-Valor", "Roadmap gamificado", "Cursos gratuitos", "Certificação UpJobs"].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Card principal ── */}
      <motion.div
        className="w-full max-w-md hologram-panel rounded-sm p-8 flex-shrink-0"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-body mb-6 transition">
          <ArrowLeft size={14} /> Voltar
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-glow mb-2">UPJOBS</h1>
          <p className="text-muted-foreground font-body text-sm">Entre na sua conta</p>
        </div>

        {/* Mensagem vinda do cadastro */}
        {locationMessage && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-primary font-body bg-primary/10 border border-primary/20 px-3 py-2 rounded-sm mb-4 text-center">
            {locationMessage}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading} autoComplete="email"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="seu@email.com" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-accent font-semibold text-muted-foreground">Senha</label>
              {/* Placeholder para "Esqueci a senha" — implementar depois */}
              <button type="button"
                onClick={() => setError("Recuperação de senha em breve.")}
                className="text-[10px] text-muted-foreground hover:text-primary font-accent transition">
                Esqueceu a senha?
              </button>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              disabled={loading} autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="••••••••" />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive font-body bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-sm">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-accent font-bold text-primary-foreground box-glow-accent hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "hsl(155 60% 35%)" }}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Entrando…</>
              : <><LogIn size={16} /> Entrar</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-primary hover:underline">Cadastre-se grátis</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;