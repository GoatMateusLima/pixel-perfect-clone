/**
 * useCommunityPosts.ts
 *
 * Hook customizado com toda a lógica de estado da comunidade:
 *   - Carregamento inicial com paginação
 *   - "Carregar mais"
 *   - Like persistente via RPC no Supabase
 *   - Save local
 *   - Novo post (otimístico)
 */

import { useState, useEffect, useCallback } from "react";
import supabase from "../../utils/supabase.ts";
import type { Publication, Post } from "../components/PostCard";

const PAGE_SIZE = 10;

// Posts mockados usados como fallback quando o banco está vazio ou falha
const INITIAL_POSTS: Post[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    created_at: "2026-03-11T10:00:00.000+00:00",
    description: "Acabei de fechar minha primeira vaga remota como PM em uma startup de fintech 🚀\n\nDepois de 4 meses na trilha UpJobs, saí de R$28/h presencial para R$95/h remoto. A calculadora de Marcius me abriu os olhos: eu estava perdendo 38% da minha hora só com deslocamento.\n\nSe você ainda está na dúvida, o custo de oportunidade real é mais pesado do que parece. Não espere mais.",
    date: "2026-03-11T10:00:00.000+00:00", midia: undefined, creator_id: "user-uuid-larissa-0001", like_qnt: 142, liked_by: [],
    profile: { id: "user-uuid-larissa-0001", name: "Larissa Mendes", avatar_url: "https://i.pravatar.cc/150?u=larissa", role: "Product Manager · UpJobs Academy", disc: "I" },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Rafael Costa",  initials: "RC", avatar_url: "https://i.pravatar.cc/150?u=rafael", disc: "D", text: "Incrível! Qual stack você aprendeu para a posição?", time: "há 1h" },
      { id: 2, author: "Camila Torres", initials: "CT", avatar_url: "https://i.pravatar.cc/150?u=camila", disc: "S", text: "Parabéns! Isso me dá esperança 💚", time: "há 45min" },
    ],
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    created_at: "2026-03-11T07:00:00.000+00:00",
    description: "Dica rápida para quem está aprendendo Python para Data Science:\n\n→ Não comece pelo pandas, comece pela lógica\n→ Kaggle competitions > tutoriais em loop\n→ Um projeto real vale 10 cursos completos\n\nMeu portfólio no GitHub foi o que realmente me contratou. Nenhum certificado chegou perto.",
    date: "2026-03-11T07:00:00.000+00:00", midia: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
    creator_id: "user-uuid-marcos-0002", like_qnt: 87, liked_by: [],
    profile: { id: "user-uuid-marcos-0002", name: "Marcos Vinicius", avatar_url: "https://i.pravatar.cc/150?u=marcos", role: "Dev Backend · Freelancer", disc: "C" },
    liked: false, saved: false,
    comments: [{ id: 1, author: "Ana Julia", initials: "AJ", avatar_url: "https://i.pravatar.cc/150?u=anajulia", disc: "I", text: "Esse ponto sobre o GitHub é real demais 🔥", time: "há 3h" }],
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    created_at: "2026-03-10T12:00:00.000+00:00",
    description: "Insight do dia: a maioria das pessoas subestima UX Writing.\n\nNão é só nomear botões. É arquitetura cognitiva. É reduzir a carga mental do usuário em cada micro-decisão.\n\nQuando você entende isso, sua taxa de conversão muda de patamar.",
    date: "2026-03-10T12:00:00.000+00:00", midia: undefined, creator_id: "user-uuid-fernanda-0003", like_qnt: 203, liked_by: [],
    profile: { id: "user-uuid-fernanda-0003", name: "Fernanda Lima", avatar_url: "https://i.pravatar.cc/150?u=fernanda", role: "UX Designer · Remoto", disc: "S" },
    liked: true, saved: true, comments: [],
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    created_at: "2026-03-09T09:00:00.000+00:00",
    description: "O mercado de cibersegurança no Brasil vai precisar de +150.000 profissionais até 2026 segundo a ISC².\n\nVaga sobrando. Salário alto. Trabalho 100% remoto.\n\nE ainda tem gente perguntando se vale a pena investir em carreira tech? 😅",
    date: "2026-03-09T09:00:00.000+00:00", midia: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    creator_id: "user-uuid-diego-0004", like_qnt: 318, liked_by: [],
    profile: { id: "user-uuid-diego-0004", name: "Diego Almeida", avatar_url: "https://i.pravatar.cc/150?u=diego", role: "Cybersecurity Analyst", disc: "D" },
    liked: false, saved: false,
    comments: [
      { id: 1, author: "Larissa Mendes",  initials: "LM", avatar_url: "https://i.pravatar.cc/150?u=larissa", disc: "I", text: "Mercado de cyber é absurdo mesmo!", time: "há 1d" },
      { id: 2, author: "Marcos Vinicius", initials: "MV", avatar_url: "https://i.pravatar.cc/150?u=marcos",  disc: "C", text: "Falta mão de obra qualificada — confirmado!", time: "há 22h" },
    ],
  },
];

// Converte uma row do Supabase em Post de UI
const rowToPost = (row: any, userId?: string): Post => ({
  id:          row.id,
  created_at:  row.created_at,
  description: row.description,
  date:        row.date,
  midia:       row.midia,
  creator_id:  row.creator_id,
  liked_by:    row.liked_by ?? [],
  like_qnt:    (row.liked_by ?? []).length,
  profile:     row.profile ?? undefined,
  liked:       userId ? (row.liked_by ?? []).includes(userId) : false,
  saved:       false,
  comments:    [],
});

interface UseCommunityPostsOptions {
  userId?: string;
  myName:  string;
  myDisc:  string;
  myRole:  string;
  myAvatarUrl: string | null;
  myCreatorId?: string;
}

export function useCommunityPosts({
  userId, myName, myDisc, myRole, myAvatarUrl, myCreatorId,
}: UseCommunityPostsOptions) {
  const [posts,        setPosts]       = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [page,         setPage]         = useState(0);

  // ── Carrega primeira página ──────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    
    const fetchInitial = async () => {
      setLoadingPosts(true);

      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .order("date", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (ignore) return;

      // Erro real (ex: RLS bloqueando, sem conexão) → log + mock como fallback
      if (error) {
        console.error("Erro ao carregar publicações:", error.message);
        console.warn("Verifique se a RLS da tabela publications tem policy de SELECT para usuários autenticados.");
        setPosts(INITIAL_POSTS);
        setHasMore(false);
        setLoadingPosts(false);
        return;
      }

      // Banco vazio → lista vazia (sem mock — não queremos enganar o usuário)
      if (!data || data.length === 0) {
        setPosts([]);
        setHasMore(false);
        setLoadingPosts(false);
        return;
      }

      setPosts(data.map((row) => rowToPost(row, userId)));
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
      setLoadingPosts(false);
    };

    fetchInitial();
    
    return () => { ignore = true; };
  }, [userId]);

  // ── Carregar mais ────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Erro ao carregar mais:", error.message);
      setLoadingMore(false);
      return;
    }
    if (!data || data.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      return;
    }

    setPosts((prev) => [...prev, ...data.map((row) => rowToPost(row, userId))]);
    setPage((p) => p + 1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, userId]);

  // ── Like persistente ─────────────────────────────────────────────────────────
  // Requer no Supabase (rode uma vez no SQL Editor):
  //
  //   ALTER TABLE publications ADD COLUMN IF NOT EXISTS liked_by uuid[] DEFAULT '{}';
  //
  //   CREATE OR REPLACE FUNCTION like_publication(pub_id uuid, uid uuid)
  //   RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  //     UPDATE publications SET liked_by = array_append(liked_by, uid)
  //     WHERE id = pub_id AND NOT (uid = ANY(liked_by));
  //   $$;
  //
  //   CREATE OR REPLACE FUNCTION unlike_publication(pub_id uuid, uid uuid)
  //   RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  //     UPDATE publications SET liked_by = array_remove(liked_by, uid)
  //     WHERE id = pub_id;
  //   $$;
  const handleLike = useCallback(async (id: string) => {
    if (!userId) return;

    const post = posts.find((p) => p.id === id);
    if (!post) return;

    const alreadyLiked = post.liked;
    const prevPosts    = posts; // snapshot para rollback

    // Optimistic update
    setPosts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const newLikedBy = alreadyLiked
        ? (p.liked_by ?? []).filter((uid) => uid !== userId)
        : [...(p.liked_by ?? []), userId];
      return { ...p, liked_by: newLikedBy, liked: !alreadyLiked, like_qnt: newLikedBy.length };
    }));

    const { error } = await supabase.rpc(
      alreadyLiked ? "unlike_publication" : "like_publication",
      { pub_id: id, uid: userId }
    );

    if (error) {
      console.error("Erro ao salvar like:", error.message);
      setPosts(prevPosts); // rollback
    }
  }, [posts, userId]);

  // ── Save local ───────────────────────────────────────────────────────────────
  const handleSave = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
  }, []);

  // ── Novo post (optimistic) ───────────────────────────────────────────────────
  const handlePost = useCallback((publi: Publication) => {
    if (!publi.description?.trim()) return;
    setPosts((prev) => [{
      id:          publi.id!,
      created_at:  publi.created_at ?? new Date().toISOString(),
      description: publi.description!,
      date:        publi.date,
      midia:       publi.midia,
      creator_id:  publi.creator_id,
      liked_by:    [],
      like_qnt:    0,
      profile: {
        id:         myCreatorId ?? "",
        name:       myName,
        avatar_url: myAvatarUrl ?? undefined,
        role:       myRole,
        disc:       myDisc as "D" | "I" | "S" | "C",
      },
      liked: false, saved: false, comments: [],
    }, ...prev]);
  }, [myCreatorId, myName, myAvatarUrl, myRole, myDisc]);

  return {
    posts, setPosts,
    loadingPosts, loadingMore, hasMore,
    handleLoadMore, handleLike, handleSave, handlePost,
    rowToPost,
  };
}