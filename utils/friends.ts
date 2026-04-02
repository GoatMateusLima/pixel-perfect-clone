import supabase from "./supabase";

export type AcceptedFriend = {
  friend_id: string;
  name: string;
  avatar: string | null;
  username: string | null;
};

/**
 * Lista amigos aceitos (tipo = Amigos) sem depender de RPC no banco.
 * user1/user2 + profiles.perfil como avatar — alinhado a FriendButton e tabela amizades.
 */
export async function fetchAcceptedFriends(meId: string): Promise<{
  data: AcceptedFriend[];
  error: Error | null;
}> {
  // Mesma estratégia do `NotificationBell`: usar joins via foreign keys
  // - Se eu sou `user2`, o amigo está em `user1` (join `profiles!amizades_user1_fkey`)
  // - Se eu sou `user1`, o amigo está em `user2` (join `profiles!amizades_user2_fkey`)
  const [{ data: asFriendFromUser1, error: e1 }, { data: asFriendFromUser2, error: e2 }] = await Promise.all([
    supabase
      .from("amizades")
      .select(`
        user1,
        user2,
        tipo,
        profiles!amizades_user1_fkey ( name, perfil, username )
      `)
      .eq("user2", meId),
    supabase
      .from("amizades")
      .select(`
        user1,
        user2,
        tipo,
        profiles!amizades_user2_fkey ( name, perfil, username )
      `)
      .eq("user1", meId),
  ]);

  if (e1 && e2) {
    console.warn("[fetchAcceptedFriends] amizades join:", e1.message, e2.message);
    return { data: [], error: e1 ?? e2 };
  }

  const rows1 = asFriendFromUser1 ?? [];
  const rows2 = asFriendFromUser2 ?? [];

  const out: AcceptedFriend[] = [];

  // Caso join "user1" falhe, fazemos fallback sem dependência do alias de FK.
  if (e1) {
    const { data: plain, error: ePlain1 } = await supabase
      .from("amizades")
      .select("user1, user2, tipo")
      .eq("user2", meId);

    if (!ePlain1 && plain?.length) {
      const accepted = (plain as any[]).filter((r) => String(r?.tipo ?? "").toLowerCase() === "amigos");
      const friendIds = [...new Set(accepted.map((r) => r.user1).filter(Boolean))] as string[];
      if (friendIds.length) {
        const { data: profs, error: eProf } = await supabase
          .from("profiles")
          .select("user_id, name, perfil")
          .in("user_id", friendIds);

        if (!eProf) {
          for (const p of profs ?? []) {
            out.push({
              friend_id: (p as any).user_id,
              name: (p as any).name ?? "Usuário",
              avatar: (p as any).perfil ?? null,
              username: null,
            });
          }
        }
      }
    }
  } else {
    for (const r of rows1 as any[]) {
      if (String(r?.tipo ?? "").toLowerCase() !== "amigos") continue;
      const otherId = r?.user1 as string;
      const prof = Array.isArray(r?.profiles) ? r.profiles[0] : r?.profiles;
      if (!otherId) continue;
      out.push({
        friend_id: otherId,
        name: prof?.name ?? "Usuário",
        avatar: prof?.perfil ?? null,
        username: prof?.username ?? null,
      });
    }
  }

  // Caso join "user2" falhe, fazemos fallback.
  if (e2) {
    const { data: plain, error: ePlain2 } = await supabase
      .from("amizades")
      .select("user1, user2, tipo")
      .eq("user1", meId);

    if (!ePlain2 && plain?.length) {
      const accepted = (plain as any[]).filter((r) => String(r?.tipo ?? "").toLowerCase() === "amigos");
      const friendIds = [...new Set(accepted.map((r) => r.user2).filter(Boolean))] as string[];
      if (friendIds.length) {
        const { data: profs, error: eProf } = await supabase
          .from("profiles")
          .select("user_id, name, perfil")
          .in("user_id", friendIds);

        if (!eProf) {
          for (const p of profs ?? []) {
            out.push({
              friend_id: (p as any).user_id,
              name: (p as any).name ?? "Usuário",
              avatar: (p as any).perfil ?? null,
              username: null,
            });
          }
        }
      }
    }
  } else {
    for (const r of rows2 as any[]) {
      if (String(r?.tipo ?? "").toLowerCase() !== "amigos") continue;
      const otherId = r?.user2 as string;
      const prof = Array.isArray(r?.profiles) ? r.profiles[0] : r?.profiles;
      if (!otherId) continue;
      out.push({
        friend_id: otherId,
        name: prof?.name ?? "Usuário",
        avatar: prof?.perfil ?? null,
        username: prof?.username ?? null,
      });
    }
  }

  // Remove duplicados caso o mesmo amigo venha nas duas queries
  const dedup = new Map<string, AcceptedFriend>();
  for (const f of out) dedup.set(f.friend_id, f);

  return { data: [...dedup.values()], error: null };
}
