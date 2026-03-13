import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import supabase from "../../utils/supabase";

export type AssessmentData = {
  salarioBruto?: number;
  horasSemana?: number;
  tempoDeslocamento?: number;
  valorHoraBruta?: number;
  valorHoraLiquida?: number;
  areasInteresse?: string[];
  discProfile?: "D" | "I" | "S" | "C";
  discScores?: { D: number; I: number; S: number; C: number };
  completed?: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  assessment: AssessmentData;
  updateAssessment: (partial: Partial<AssessmentData>) => void;
  signOutUser: () => Promise<void>;
};

const ASSESSMENT_KEY = "upjobs_assessment";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentData>(() => {
    try {
      return JSON.parse(localStorage.getItem(ASSESSMENT_KEY) ?? "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
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
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, assessment, updateAssessment, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}