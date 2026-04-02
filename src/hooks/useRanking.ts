/**
 * useRanking.ts
 *
 * Hook que calcula o ranking global de XP baseado em aulas concluídas.
 *
 * XP por dificuldade do curso:
 *   Iniciante    → 1 XP por aula
 *   Intermediário → 2.5 XP por aula
 *   Avançado     → 5 XP por aula
 */

import { useState, useEffect, useCallback } from "react";
import supabase from "../../utils/supabase";

// ─── Mapa de XP por dificuldade ──────────────────────────────────────────────

export const XP_MAP: Record<string, number> = {
  Iniciante: 1,
  "Intermediário": 2.5,
  "Avançado": 5,
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RankedUser {
  user_id: string;
  name: string;
  avatar_url?: string;
  disc_ring_img?: string;
  disc?: string;
  total_xp: number;
  rank: number;
}

interface UseRankingReturn {
  ranking: RankedUser[];
  myRank: number | null;
  myXP: number;
  loading: boolean;
  refresh: () => void;
}

interface ProfileData {
  user_id: string;
  name?: string;
  perfil?: string;
  disc_profile?: string;
  bordas?: { id: string; img_url: string; nome: string; ativa: boolean }[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRanking(currentUserId?: string): UseRankingReturn {
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myXP, setMyXP] = useState(0);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchRanking() {
      setLoading(true);

      try {
        // 1. Busca todas as aulas concluídas
        const { data: progressData, error: progressErr } = await supabase
          .from("lesson_progress")
          .select("user_id, aula_id")
          .eq("completed", true);

        if (progressErr || !progressData || progressData.length === 0) {
          if (!cancelled) {
            setRanking([]);
            setMyRank(null);
            setMyXP(0);
            setLoading(false);
          }
          return;
        }

        // 2. IDs únicos de aulas concluídas
        const aulaIds = [...new Set(progressData.map((p) => p.aula_id))];

        // 3. Busca info de cada aula → course_id
        const { data: aulasData, error: aulasErr } = await supabase
          .from("aulas")
          .select("id, course_id")
          .in("id", aulaIds);

        if (aulasErr || !aulasData) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Mapa: aula_id → course_id
        const aulaToCourse = new Map<number, string>();
        for (const a of aulasData) {
          aulaToCourse.set(Number(a.id), a.course_id);
        }

        // 4. IDs únicos de cursos
        const courseIds = [...new Set(aulasData.map((a) => a.course_id))];

        // 5. Busca dificuldade de cada curso
        const { data: coursesData, error: coursesErr } = await supabase
          .from("courses")
          .select("id, difficult")
          .in("id", courseIds);

        if (coursesErr || !coursesData) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Mapa: course_id → difficult
        const courseDifficult = new Map<string, string>();
        for (const c of coursesData) {
          courseDifficult.set(c.id, c.difficult ?? "Iniciante");
        }

        // 6. Calcula XP por usuário
        const userXPMap = new Map<string, number>();

        for (const progress of progressData) {
          const courseId = aulaToCourse.get(Number(progress.aula_id));
          if (!courseId) continue;

          const difficult = courseDifficult.get(courseId) ?? "Iniciante";
          const xp = XP_MAP[difficult] ?? 1;

          const currentXP = userXPMap.get(progress.user_id) ?? 0;
          userXPMap.set(progress.user_id, currentXP + xp);
        }

        // 7. Busca perfis dos usuários
        const userIds = [...userXPMap.keys()];

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, perfil, disc_profile, bordas")
          .in("user_id", userIds);

        const profileMap = new Map<string, ProfileData>();
        if (profilesData) {
          for (const p of profilesData as unknown as ProfileData[]) {
            profileMap.set(p.user_id, p);
          }
        }

        // 8. Monta lista rankeada
        const rankedList: RankedUser[] = userIds
          .map((userId) => {
            const profile = profileMap.get(userId);
            const bordaAtiva = (profile?.bordas ?? []).find(
              (b) => b.ativa
            );

            return {
              user_id: userId,
              name: profile?.name ?? "Usuário",
              avatar_url: profile?.perfil ?? undefined,
              disc_ring_img: bordaAtiva?.img_url ?? undefined,
              disc: profile?.disc_profile ?? undefined,
              total_xp: userXPMap.get(userId) ?? 0,
              rank: 0,
            };
          })
          .sort((a, b) => b.total_xp - a.total_xp);

        // Atribui posição no ranking
        rankedList.forEach((u, i) => {
          u.rank = i + 1;
        });

        if (!cancelled) {
          setRanking(rankedList);

          // Posição e XP do usuário atual
          if (currentUserId) {
            const me = rankedList.find((u) => u.user_id === currentUserId);
            setMyRank(me?.rank ?? null);
            setMyXP(me?.total_xp ?? 0);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error("[useRanking] Erro:", err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchRanking();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, trigger]);

  return { ranking, myRank, myXP, loading, refresh };
}

// ─── Helper: calcula nível a partir do XP ─────────────────────────────────────
export function xpToLevel(xp: number): number {
  return Math.floor(xp / 10) + 1;
}

// ─── Helper: XP necessário para o próximo nível ───────────────────────────────
export function xpForNextLevel(level: number): number {
  return level * 10;
}
