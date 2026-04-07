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
        // 1. Busca perfis ordenados por XP (muito mais eficiente)
        const { data: profilesData, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, name, perfil, disc_profile, bordas, total_xp")
          .order("total_xp", { ascending: false })
          .limit(50); // Limitamos aos top 50 para performance

        if (profErr || !profilesData) {
          if (!cancelled) setLoading(false);
          return;
        }

        // 2. Monta lista rankeada
        const rankedList: RankedUser[] = profilesData.map((p: any, i: number) => {
          const bordaAtiva = (p.bordas ?? []).find((b: any) => b.ativa);

          return {
            user_id: p.user_id,
            name: p.name ?? "Usuário",
            avatar_url: p.perfil ?? undefined,
            disc_ring_img: bordaAtiva?.img_url ?? undefined,
            disc: p.disc_profile ?? undefined,
            total_xp: Number(p.total_xp) || 0,
            rank: i + 1,
          };
        });

        if (!cancelled) {
          setRanking(rankedList);

          // Posição e XP do usuário atual (se não estiver no top 50, buscamos o dele separado)
          if (currentUserId) {
            const me = rankedList.find((u) => u.user_id === currentUserId);
            if (me) {
              setMyRank(me.rank);
              setMyXP(me.total_xp);
            } else {
              // Busca o XP dele se não estiver no TOP 50
              const { data: myData } = await supabase
                .from("profiles")
                .select("total_xp")
                .eq("user_id", currentUserId)
                .maybeSingle();
              
              if (myData) {
                setMyXP(Number(myData.total_xp) || 0);
                // O rank ficaria difícil de saber sem contar todos, mas deixamos null
                setMyRank(null);
              }
            }
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
