import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import supabase from "../../utils/supabase";

export type AssessmentData = {
  salarioBruto?:      number;
  horasSemana?:       number;
  tempoDeslocamento?: number;
  valorHoraBruta?:    number;
  valorHoraLiquida?:  number;
  areasInteresse?:    string[];
  discProfile?:       "D" | "I" | "S" | "C";
  discScores?:        { D: number; I: number; S: number; C: number };
  completed?:         boolean;
};

type AuthContextType = {
  session:          Session | null;
  user:             User | null;
  loading:          boolean;
  assessment:       AssessmentData;
  profilePhoto:     string | null;
  updateAssessment: (partial: Partial<AssessmentData>) => void;
  refreshPhoto:     () => void;
  signOutUser:      () => Promise<void>;
  logout:           () => Promise<void>;
};

const ASSESSMENT_KEY = "upjobs_assessment";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null);
  const [user,         setUser]         = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [assessment, setAssessment] = useState<AssessmentData>(() => {
    try { return JSON.parse(localStorage.getItem(ASSESSMENT_KEY) ?? "{}"); }
    catch { return {}; }
  });

  // Busca foto em background — NÃO bloqueia o carregamento da sessão
  const fetchProfilePhoto = (userId: string) => {
    supabase
      .from("profiles")
      .select("perfil")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.perfil) setProfilePhoto(data.perfil);
      });
  };

  // refreshPhoto: chame no ProfilePage após salvar nova foto
  const refreshPhoto = () => {
    if (user?.id) fetchProfilePhoto(user.id);
  };

  useEffect(() => {
    // 1. Carrega sessão existente imediatamente
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        fetchProfilePhoto(data.session.user.id); // em background, não bloqueia
      }
      setLoading(false); // libera o app para renderizar
    });

    // 2. Escuta mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfilePhoto(session.user.id); // em background
      } else {
        setProfilePhoto(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function updateAssessment(partial: Partial<AssessmentData>) {
    setAssessment((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  async function signOutUser() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfilePhoto(null);
  }

  return (
    <AuthContext.Provider value={{
      session, user, loading,
      assessment, updateAssessment,
      profilePhoto, refreshPhoto,
      signOutUser,
      logout: signOutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}