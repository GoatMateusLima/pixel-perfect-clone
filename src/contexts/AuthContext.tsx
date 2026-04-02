import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  session:            Session | null;
  user:               User | null;
  loading:            boolean;
  assessment:         AssessmentData;
  profilePhoto:       string | null;
  role:               "user" | "admin" | null; // Added role support
  updateAssessment:   (partial: Partial<AssessmentData>) => void;
  saveAssessmentToDb: (data: AssessmentData) => Promise<void>;
  refreshPhoto:       () => void;
  signOutUser:        () => Promise<void>;
  logout:             () => Promise<void>;
};

const ASSESSMENT_KEY = "upjobs_assessment";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null);
  const [user,         setUser]         = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [role,         setRole]         = useState<"user" | "admin" | null>(null);

  const [assessment, setAssessment] = useState<AssessmentData>(() => {
    try { return JSON.parse(localStorage.getItem(ASSESSMENT_KEY) ?? "{}"); }
    catch { return {}; }
  });

  // ── Busca foto do perfil em background (mantida para refresh explícito) ────
  const fetchProfilePhoto = (currentUser: User) => {
    supabase
      .from("profiles")
      .select("perfil")
      .eq("user_id", currentUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        const photo = data?.perfil || 
                      currentUser.user_metadata?.avatar_url || 
                      currentUser.user_metadata?.picture || 
                      currentUser.user_metadata?.photoURL || 
                      currentUser.user_metadata?.photo || 
                      null;
        setProfilePhoto(photo);
      });
  };

  // ── Busca todos os dados iniciais do usuário numa única requisição ─────────
  const fetchUserData = useCallback((currentUser: User): Promise<void> => {
    return supabase
      .from("profiles")
      .select("perfil, calculo_marcius, disc_profile, disc_scores, areas_interesse, assessment_completed, role")
      .eq("user_id", currentUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        // Foto de perfil e Role com fallbacks inteligentes usando o objeto passado
        const finalPhoto = data?.perfil || 
                           currentUser.user_metadata?.avatar_url || 
                           currentUser.user_metadata?.picture || 
                           currentUser.user_metadata?.photoURL ||
                           currentUser.user_metadata?.photo ||
                           null;
        setProfilePhoto(finalPhoto);
        
        if (data?.role) setRole(data.role as "user" | "admin");

        if (error || !data) return;

        // Assessment
        const hasDbData = data.assessment_completed || data.disc_profile || data.calculo_marcius;
        if (hasDbData) {
          const fromDb: AssessmentData = {
            ...(data.calculo_marcius as AssessmentData ?? {}),
            ...(data.disc_profile   ? { discProfile:    data.disc_profile as "D" | "I" | "S" | "C" } : {}),
            ...(data.disc_scores    ? { discScores:     data.disc_scores  as { D: number; I: number; S: number; C: number } } : {}),
            ...(data.areas_interesse ? { areasInteresse: data.areas_interesse as string[] } : {}),
            completed: data.assessment_completed ?? false,
          };

          setAssessment((prev) => {
            const merged = { ...prev, ...fromDb };
            localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      });
  }, []);

  const refreshPhoto = () => {
    if (user) fetchProfilePhoto(user);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error("[AuthContext] getSession:", error.message);
          return;
        }
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          await fetchUserData(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (e) {
        console.error("[AuthContext] bootstrap:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setProfilePhoto(null);
        setRole(null);
        setAssessment({});
        localStorage.removeItem(ASSESSMENT_KEY);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // ── updateAssessment — apenas estado + localStorage (durante o fluxo) ────────
  function updateAssessment(partial: Partial<AssessmentData>) {
    setAssessment((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  // ── saveAssessmentToDb — persiste tudo no banco nas colunas corretas ──────────
  async function saveAssessmentToDb(data: AssessmentData) {
    if (!user?.id) return;

    // 1. Atualiza estado e localStorage
    setAssessment((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2. Monta payload com cada dado na coluna certa
    const payload: Record<string, any> = {
      user_id:              user.id,
      assessment_completed: data.completed ?? false,
    };

    // Dados do Cálculo Marcius vão em calculo_marcius
    if (
      data.salarioBruto !== undefined ||
      data.horasSemana !== undefined ||
      data.tempoDeslocamento !== undefined ||
      data.valorHoraBruta !== undefined ||
      data.valorHoraLiquida !== undefined
    ) {
      payload.calculo_marcius = {
        salarioBruto:      data.salarioBruto,
        horasSemana:       data.horasSemana,
        tempoDeslocamento: data.tempoDeslocamento,
        valorHoraBruta:    data.valorHoraBruta,
        valorHoraLiquida:  data.valorHoraLiquida,
      };
    }

    // DISC vai nas colunas dedicadas
    if (data.discProfile) payload.disc_profile = data.discProfile;
    if (data.discScores)  payload.disc_scores  = data.discScores;

    // Áreas de interesse
    if (data.areasInteresse) payload.areas_interesse = data.areasInteresse;

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("[AuthContext] Erro ao salvar assessment:", error.message);
      throw error;
    }

    // 3. Se completou, dá a borda DISC
    if (data.completed && data.discProfile) {
      await grantDiscBorder(user.id, data.discProfile);
    }
  }

  // ── Dá a borda DISC ao usuário ────────────────────────────────────────────────
  async function grantDiscBorder(userId: string, discProfile: string) {
    const DISC_BORDERS: Record<string, { id: string; img_url: string; nome: string }> = {
      D: { id: "disc-d", img_url: "/src/assets/disc/Dominancia.webp",   nome: "Dominância"   },
      I: { id: "disc-i", img_url: "/src/assets/disc/Influencia.webp",   nome: "Influência"   },
      S: { id: "disc-s", img_url: "/src/assets/disc/Estabilidade.webp", nome: "Estabilidade" },
      C: { id: "disc-c", img_url: "/src/assets/disc/Conformidade.webp", nome: "Conformidade" },
    };

    const novaBorda = DISC_BORDERS[discProfile];
    if (!novaBorda) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("bordas")
      .eq("user_id", userId)
      .maybeSingle();

    const bordasAtuais: any[] = prof?.bordas ?? [];
    const jaTemBorda = bordasAtuais.some((b: any) => b.id === novaBorda.id);
    if (jaTemBorda) return;

    // Adiciona nova borda e a deixa ativa, desativa as outras
    const novasBordas = [
      ...bordasAtuais.map((b: any) => ({ ...b, ativa: false })),
      { ...novaBorda, ativa: true },
    ];

    await supabase
      .from("profiles")
      .upsert({ user_id: userId, bordas: novasBordas }, { onConflict: "user_id" });
  }

  async function signOutUser() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfilePhoto(null);
    setAssessment({});
    localStorage.removeItem(ASSESSMENT_KEY);
  }

  return (
    <AuthContext.Provider value={{
      session, user, loading, role,
      assessment, updateAssessment, saveAssessmentToDb,
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