import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import supabase from "../../utils/supabase";
import { MainLandmark } from "@/components/MainLandmark";

// ─── Validações ───────────────────────────────────────────────────────────────

const validate = (name: string, email: string, password: string, confirm: string): string => {
  if (!name.trim() || !email.trim() || !password || !confirm)
    return "Preencha todos os campos.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "E-mail inválido.";
  if (password.length < 6)
    return "A senha deve ter pelo menos 6 caracteres.";
  if (password !== confirm)
    return "As senhas não coincidem.";
  return "";
};

// ─── SignupPage ───────────────────────────────────────────────────────────────

const SignupPage = () => {
  const navigate = useNavigate();

  const [name,     setName]    = useState("");
  const [email,    setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm] = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate(name, email, password, confirm);
    if (validationError) { setError(validationError); return; }

    setLoading(true);

    // 1. Cria a conta no Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password: password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("user already exists")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (signUpError.message.toLowerCase().includes("invalid email")) {
        setError("E-mail inválido.");
      } else if (signUpError.message.toLowerCase().includes("password")) {
        setError("Senha fraca. Use pelo menos 6 caracteres.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
        console.error("Supabase signUp error:", signUpError.message);
      }
      return;
    }

    // E-mail já cadastrado (identities vazio = confirmação pendente)
    if (data.user && data.user.identities?.length === 0) {
      setLoading(false);
      setError("Este e-mail já está cadastrado. Verifique sua caixa de entrada ou tente fazer login.");
      return;
    }

    // 2. Faz login automaticamente logo após o cadastro
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password,
    });

    setLoading(false);

    if (signInError) {
      // Cadastro funcionou mas o login automático falhou (ex: e-mail ainda não confirmado)
      // Nesse caso redireciona pro login com mensagem
      navigate("/login", { state: { message: "Conta criada! Confirme seu e-mail e faça login." } });
      return;
    }

    // 3. Tudo certo — vai direto para a avaliação
    navigate("/avaliacao");
  };

  return (
    <MainLandmark className="min-h-screen flex items-center justify-center gap-16 gradient-hero scanline px-6 lg:px-20">

      {/* ── Card principal ── */}
      <motion.div
        className="w-full max-w-md hologram-panel rounded-sm p-8 flex-shrink-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}>

        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-body mb-6 transition">
          <ArrowLeft size={14} /> Voltar
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-glow mb-2">UPJOBS</h1>
          <p className="text-muted-foreground font-body text-sm">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Nome completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              disabled={loading} autoComplete="name"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="Seu nome" />
          </div>

          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading} autoComplete="email"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="seu@email.com" />
          </div>

          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              disabled={loading} autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="Mínimo 6 caracteres" />
          </div>

          <div>
            <label className="text-xs font-accent font-semibold text-muted-foreground mb-1 block">Confirmar senha</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              disabled={loading} autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-sm bg-input border border-border text-foreground font-body text-sm focus:outline-none focus:border-primary/60 transition disabled:opacity-50"
              placeholder="Repita a senha" />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive font-body bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-sm">
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-accent font-bold text-primary-foreground box-glow-accent hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "hsl(25 90% 55%)" }}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Criando conta…</>
              : <><UserPlus size={16} /> Criar Conta</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground font-body mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Faça login</Link>
        </p>
      </motion.div>

      {/* ── Bloco lateral de marketing ── */}
      <motion.div
        className="hidden lg:block w-full max-w-md text-center"
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-glow mb-4">
          Pronto para{" "}
          <span className="text-accent text-glow-accent">conhecer o futuro</span>?
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
    </MainLandmark>
  );
};

export default SignupPage;