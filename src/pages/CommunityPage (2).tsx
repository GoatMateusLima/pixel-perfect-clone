/**
 * CommunityPage.tsx
 *
 * Apenas layout e orquestração — toda lógica está nos componentes:
 *
 * src/components/
 * PostCard.tsx           → card de publicação + tipos compartilhados
 * PostModal.tsx          → modal de post com comentários
 * CreatePost.tsx         → formulário de nova publicação
 * LeftSidebar.tsx        → sidebar esquerda (banner, stats, trending)
 * RightSidebar.tsx       → sidebar de notícias tech
 *
 * src/hooks/
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowUp, Bookmark, Heart, Search } from "lucide-react";

import Header          from "@/components/Header";
import { MainLandmark } from "@/components/MainLandmark";
import { useAuth }     from "@/contexts/AuthContext";
import PostCard        from "../components/PostCard";
import PostModal       from "../components/PostModal";
import CreatePost      from "../components/CreatePost";
import LeftSidebar     from "../components/LeftSidebar";
import RightSidebar    from "../components/RightSidebar";
import TechBackground  from "../components/TechBackground";

import { DISC_IMGS }  from "../components/PostCard";
import type { Post, Publication } from "../components/PostCard";
import supabase from "../../utils/supabase.ts";

// ─── Tipos de filtro ──────────────────────────────────────────────────────────

type FilterType = "recentes" | "populares" | "curtidos" | "salvos";

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const { user, profilePhoto, assessment } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tagFilter = searchParams.get("tag");

  const [filter,      setFilter]      = useState<FilterType>("recentes");
  const [openPost,    setOpenPost]    = useState<Post | null>(null);

  const [myName, setMyName] = useState("Você");
  const [myRole, setMyRole] = useState("Membro · UpJobs");
  const [myCourseTitle, setMyCourseTitle] = useState("Carregando trilha...");
  const [myCourseProgress, setMyCourseProgress] = useState(0);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const myDisc           = assessment?.discProfile ?? "S";
  const myCreatorId      = user?.id;
  const myHourValue      = assessment?.valorHoraLiquida
    ? `R$ ${assessment.valorHoraLiquida.toFixed(0)}/h` : "—";
  const myDiscRingImg    = DISC_IMGS[myDisc] || DISC_IMGS.S;

  // ── IDs de posts salvos (state = reatividade UI, ref = acesso síncrono sem dep em useCallback)
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const savedPostIdsRef = useRef<Set<string>>(new Set());

  const updateSavedIds = (newSet: Set<string>) => {
    savedPostIdsRef.current = newSet;
    setSavedPostIds(newSet);
  };

  // Busca perfil e progresso do curso
  useEffect(() => {
    if (!user?.id) return;

    async function loadProfileAndProgress() {
      // 1. Busca Dados do perfil (Nome, Role e Foto)
      const { data: prof } = await supabase
        .from("profiles")
        .select("name, descricao, perfil")
        .eq("user_id", user?.id)
        .maybeSingle();

      const finalName = prof?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
      setMyName(finalName);
      if (prof?.descricao) setMyRole(prof.descricao);
      if (prof?.perfil) setLocalAvatar(prof.perfil);

      // 2. Busca curso mais recente na tabela watch
      const { data: watchData } = await supabase
        .from("watch")
        .select("course_id, courses!course_id(id, name)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!watchData || !watchData.courses) {
        setMyCourseTitle("Nenhuma trilha iniciada");
        setMyCourseProgress(0);
        return;
      }

      const course = Array.isArray(watchData.courses) ? watchData.courses[0] : watchData.courses as any;
      setMyCourseTitle(course.name);

      // 3. Calcula progresso desse curso
      const { count: totalAulas } = await supabase
        .from("aulas")
        .select("id", { count: "exact", head: true })
        .eq("course_id", course.id);

      const { data: aulasData } = await supabase
        .from("aulas")
        .select("id")
        .eq("course_id", course.id);

      const aulaIds = (aulasData ?? []).map(a => Number(a.id));

      const { count: completedAulas } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .in("aula_id", aulaIds.length > 0 ? aulaIds : [-1])
        .eq("completed", true);

      const total = totalAulas ?? 0;
      const completed = completedAulas ?? 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      setMyCourseProgress(pct);
    }

    loadProfileAndProgress();
  }, [user?.id, user?.email, user?.user_metadata?.full_name, user?.user_metadata?.name]);

  // ── Carrega IDs salvos — aplica nos posts já carregados para não piscar ─────
  useEffect(() => {
    if (!myCreatorId) return;

    async function loadSavedIds() {
      const { data, error } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", myCreatorId);

      if (!error && data) {
        const newSet = new Set(data.map((r: any) => r.post_id as string));
        updateSavedIds(newSet);

        // Aplica `saved: true` nos posts já visíveis no feed (chegam antes do loadSavedIds)
        if (newSet.size > 0) {
          const patch = (list: Post[]) =>
            list.map((p) => newSet.has(p.id ?? "") ? { ...p, saved: true } : p);
          setPosts((prev) => patch(prev));
          setLikedPosts((prev) => patch(prev));
        }
      }
    }

    loadSavedIds();
  }, [myCreatorId]);

  // ── Estado dos posts ─────────────────────────────────────────────────────────
  const [posts,        setPosts]       = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [page,         setPage]         = useState(0);

  // ── Estados para posts curtidos/salvos ────────────────────────────────────
  const [likedPosts,       setLikedPosts]       = useState<Post[]>([]);
  const [savedPosts,       setSavedPosts]        = useState<Post[]>([]);
  const [loadingSubfeed,   setLoadingSubfeed]    = useState(false);

  // ── Estados para o estilo Twitter / Infinite Scroll ──────────────────────────
  const [newPostsCount, setNewPostsCount] = useState(0);

  const PAGE_SIZE = 10;

  // Converte row do banco → Post de UI
  // Usa savedPostIdsRef (ref síncrono) para não criar dependência que dispara re-fetch
  const rowToPost = useCallback((row: any, userId?: string): Post => {
    const profileRaw  = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles ?? row.profile ?? null;
    const bordaAtiva  = (profileRaw?.bordas ?? []).find((b: any) => b.ativa) ?? null;

    return {
      id:          row.id,
      created_at:  row.created_at,
      description: row.description,
      date:        row.date,
      midia:       row.midia,
      creator_id:  row.creator_id,
      liked_by:    row.liked_by ?? [],
      like_qnt:    (row.liked_by ?? []).length,
      profile: profileRaw ? {
        id:             profileRaw.user_id,
        name:           profileRaw.name       ?? "Usuário",
        avatar_url:     profileRaw.perfil     ?? undefined,
        disc_ring_img:  bordaAtiva?.img_url   ?? undefined,
        role:           profileRaw.descricao  ?? undefined,
        disc:           undefined,
      } : undefined,
      liked:    userId ? (row.liked_by ?? []).includes(userId) : false,
      saved:    savedPostIdsRef.current.has(row.id),  // ref é sempre atual sem deps
      comments: [],
      isCommentHit: row.isCommentHit,
    };
  }, []);

  // ── Carrega posts iniciais do Supabase ───────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);

    let pubQuery = supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .order("date", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (tagFilter) {
      pubQuery = pubQuery.ilike("description", `%${tagFilter}%`);
      
      const commQuery = supabase
        .from("comments")
        .select("*")
        .ilike("comment", `%${tagFilter}%`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
        
      const [pubRes, commRes] = await Promise.all([pubQuery, commQuery]);
      
      if (pubRes.error || commRes.error) {
        console.error("[CommunityPage] Erro ao buscar busca mista.", pubRes.error, commRes.error);
        setLoadingPosts(false);
        return;
      }
      
      const mixedRows: any[] = [];
      if (pubRes.data) mixedRows.push(...pubRes.data);
      if (commRes.data && commRes.data.length > 0) {
        const userIds = [...new Set(commRes.data.map((c: any) => c.user_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, name, perfil, descricao, bordas")
            .in("user_id", userIds);

          if (profilesData) {
            profilesMap = Object.fromEntries(profilesData.map((p: any) => [p.user_id, p]));
          }
        }

        mixedRows.push(
          ...commRes.data.map((c: any) => ({
            id: c.publication_id,
            created_at: c.created_at,
            description: `↳ Resposta:\n\n${c.comment}`,
            date: c.created_at,
            midia: c.midia,
            creator_id: c.user_id,
            liked_by: [],
            profiles: profilesMap[c.user_id] ?? null,
            isCommentHit: true
          }))
        );
      }
      
      mixedRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPosts(mixedRows.map(row => rowToPost(row, myCreatorId)));
      setPage(1);
      setHasMore(false); // Desabilitamos "ver mais" simples numa busca mista local
      setLoadingPosts(false);
      setNewPostsCount(0);
      return;
    }

    const { data, error } = await pubQuery;

    if (error) {
      console.error("[CommunityPage] Erro ao carregar posts:", error.message);
      setLoadingPosts(false);
      return;
    }

    if (!data || data.length === 0) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    setPosts(data.map((row) => rowToPost(row, myCreatorId)));
    setPage(1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingPosts(false);
    setNewPostsCount(0);
  }, [myCreatorId, rowToPost, tagFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Carrega posts curtidos pelo usuário ──────────────────────────────────
  const fetchLikedPosts = useCallback(async () => {
    if (!myCreatorId) return;
    setLoadingSubfeed(true);

    const { data, error } = await supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .contains("liked_by", [myCreatorId])
      .order("date", { ascending: false });

    if (error) {
      console.error("[CommunityPage] Erro ao carregar curtidos:", error.message);
      setLoadingSubfeed(false);
      return;
    }

    setLikedPosts((data ?? []).map((row) => rowToPost(row, myCreatorId)));
    setLoadingSubfeed(false);
  }, [myCreatorId, rowToPost]);

  // ── Carrega posts salvos pelo usuário ────────────────────────────────────
  const fetchSavedPosts = useCallback(async () => {
    if (!myCreatorId) return;
    setLoadingSubfeed(true);

    const { data: savedRows, error: savedError } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", myCreatorId)
      .order("created_at", { ascending: false });

    if (savedError || !savedRows || savedRows.length === 0) {
      setSavedPosts([]);
      setLoadingSubfeed(false);
      return;
    }

    const postIds = savedRows.map((r: any) => r.post_id);

    const { data, error } = await supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .in("id", postIds);

    if (error) {
      console.error("[CommunityPage] Erro ao carregar salvos:", error.message);
      setLoadingSubfeed(false);
      return;
    }

    // Mantém a ordem de quando foi salvo
    const ordered = postIds
      .map((id: string) => (data ?? []).find((r: any) => r.id === id))
      .filter(Boolean);

    setSavedPosts(ordered.map((row: any) => rowToPost(row, myCreatorId)));
    setLoadingSubfeed(false);
  }, [myCreatorId, rowToPost]);

  // Busca subfeed quando troca de aba
  useEffect(() => {
    if (filter === "curtidos") fetchLikedPosts();
    if (filter === "salvos")   fetchSavedPosts();
  }, [filter, fetchLikedPosts, fetchSavedPosts]);

  // ── Carregar mais (Infinite Scroll com proteção anti-duplicados) ─────────────
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    
    const from = page * PAGE_SIZE;
    let query = supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .order("date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
      
    if (tagFilter) {
      query = query.ilike("description", `%${tagFilter}%`);
    }

    const { data, error } = await query;
      
    if (error) { console.error("Carregar mais:", error.message); setLoadingMore(false); return; }
    if (!data || data.length === 0) { setHasMore(false); setLoadingMore(false); return; }
    
    setPosts((prev) => {
      const novosPosts = data.map((row) => rowToPost(row, myCreatorId));
      const postsUnicos = novosPosts.filter(
        (novoPost) => !prev.some((postExistente) => postExistente.id === novoPost.id)
      );
      return [...prev, ...postsUnicos];
    });

    setPage((p) => p + 1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, myCreatorId, posts.length, rowToPost, tagFilter]);

  // ── Observador do Infinite Scroll ────────────────────────────────────────────
  const observer = useRef<IntersectionObserver | null>(null);
  
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (loadingPosts || loadingMore) return; 
    
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && filter === "recentes") {
        handleLoadMore();
      }
    }, { 
      rootMargin: "400px" 
    });

    if (node) observer.current.observe(node);
  }, [loadingPosts, loadingMore, hasMore, filter, handleLoadMore]);

  // ── Radar de Novas Postagens (Supabase Realtime) ─────────────────────────────
  useEffect(() => {
    if (filter !== "recentes") return;

    const channel = supabase
      .channel('novas-publicacoes-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'publications',
        },
        (payload) => {
          if (payload.new.creator_id === myCreatorId) return;
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, myCreatorId]);

  const handleLoadNewPosts = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchPosts();
  };

  // ── Interações (Like, Save, Postar) ──────────────────────────────────────────
  const handleLike = async (id: string) => {
    if (!myCreatorId) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const alreadyLiked = post.liked;
    const prevPosts = posts;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const newLikedBy = alreadyLiked
        ? (p.liked_by ?? []).filter((uid) => uid !== myCreatorId)
        : [...(p.liked_by ?? []), myCreatorId];
      return { ...p, liked_by: newLikedBy, liked: !alreadyLiked, like_qnt: newLikedBy.length };
    }));
    const { error } = await supabase.rpc(
      alreadyLiked ? "unlike_publication" : "like_publication",
      { pub_id: id, uid: myCreatorId }
    );
    if (error) { console.error("Like:", error.message); setPosts(prevPosts); }

    // Atualiza aba curtidos se estava aberta
    if (filter === "curtidos") fetchLikedPosts();
  };

  const handleDeleteSuccess = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleOpenPost = async (post: any) => {
    if (post.isCommentHit) {
      // É um comentário mascarado; buscar o Post original para abrir o modal correto
      const { data, error } = await supabase
        .from("publications")
        .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
        .eq("id", post.id)
        .single();
      if (!error && data) {
        setOpenPost(rowToPost(data, myCreatorId));
      }
    } else {
      setOpenPost(post);
    }
  };

  // ── handleSave — persiste no banco ───────────────────────────────────────
  const handleSave = async (id: string) => {
    if (!myCreatorId) return;

    const isSaved = savedPostIdsRef.current.has(id);

    // Optimistic update — atualiza ref + state juntos
    const nextSet = new Set(savedPostIdsRef.current);
    if (isSaved) nextSet.delete(id);
    else nextSet.add(id);
    updateSavedIds(nextSet);

    // Atualiza estado `saved` nos posts do feed
    const updateSavedField = (list: Post[]) =>
      list.map((p) => p.id === id ? { ...p, saved: !isSaved } : p);

    setPosts(updateSavedField);
    setLikedPosts(updateSavedField);
    setSavedPosts((prev) =>
      isSaved ? prev.filter((p) => p.id !== id) : prev
    );

    // Persiste no banco
    if (isSaved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", myCreatorId)
        .eq("post_id", id);
      if (error) {
        console.error("Dessalvar:", error.message);
        // Reverte ref + state
        const revertSet = new Set(savedPostIdsRef.current);
        revertSet.add(id);
        updateSavedIds(revertSet);
        setPosts(updateSavedField);
      }
    } else {
      const { error } = await supabase
        .from("saved_posts")
        .insert({ user_id: myCreatorId, post_id: id });
      if (error) {
        console.error("Salvar:", error.message);
        // Reverte ref + state
        const revertSet = new Set(savedPostIdsRef.current);
        revertSet.delete(id);
        updateSavedIds(revertSet);
        setPosts(updateSavedField);
      } else {
        if (filter === "salvos") fetchSavedPosts();
      }
    }
  };

  const handlePost = (publi: Publication) => {
    if (!publi.description?.trim()) return;
    setPosts((prev) => [{
      id: publi.id!, created_at: publi.created_at ?? new Date().toISOString(),
      description: publi.description!, date: publi.date, midia: publi.midia,
      creator_id: publi.creator_id, liked_by: [], like_qnt: 0,
      profile: { id: myCreatorId ?? "", name: myName, avatar_url: profilePhoto ?? undefined, role: myRole, disc: myDisc as "D"|"I"|"S"|"C" },
      liked: false, saved: false, comments: [],
    }, ...prev]);
  };

  // ── Modal via URL ────────────────────────────────────────────────────────────
  const openModal = (post: Post) => {
    setOpenPost(post);
    window.history.pushState({}, "", `/comunidade?post=${post.id}`);
  };

  const closeModal = () => {
    setOpenPost(null);
    window.history.pushState({}, "", "/comunidade");
  };

  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get("post");
    if (!postId) return;

    supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .eq("id", postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("Erro ao buscar post:", error.message); return; }
        if (data)  setOpenPost(rowToPost(data, myCreatorId));
      });
  }, [myCreatorId, rowToPost]);

  const sortedPosts = filter === "populares"
    ? [...posts].sort((a, b) => (b.like_qnt ?? 0) - (a.like_qnt ?? 0))
    : [...posts].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  // ── Configuração das abas (pill — só feed público) ───────────────────────
  const feedTabs: { id: FilterType; label: string; emoji: string }[] = [
    { id: "recentes",  label: "Recentes",  emoji: "🕒" },
    { id: "populares", label: "Populares", emoji: "🔥" },
  ];

  const savedCount = savedPostIds.size;
  const likedCount = likedPosts.length;

  // ── Posts a exibir conforme aba ───────────────────────────────────────────
  const isSubfeed = filter === "curtidos" || filter === "salvos";
  const displayPosts = filter === "curtidos" ? likedPosts : filter === "salvos" ? savedPosts : sortedPosts;

  // ── Mensagem vazia por aba ────────────────────────────────────────────────
  const emptyMessages: Record<FilterType, string> = {
    recentes:  "Nenhuma publicação ainda. Seja o primeiro!",
    populares: "Nenhuma publicação ainda.",
    curtidos:  "Você ainda não curtiu nenhuma publicação.",
    salvos:    "Você ainda não salvou nenhuma publicação.",
  };

  return (
    <div className="min-h-screen relative overflow-clip">
      <TechBackground />
      <Header />

      <MainLandmark className="relative">
      <div className="px-3 sm:px-4 pt-20 sm:pt-24 pb-16">
        <div className="max-w-7xl mx-auto ">


          {/* ── Layout 3 colunas — estilo Twitter ── */}
          <div className="flex gap-6 justify-center">

            {/* Sidebar esquerda — fixa, aparece em lg+ */}
            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
                <LeftSidebar
                  myName={myName}            myDisc={myDisc}
                  myRole={myRole}            myHourValue={myHourValue}
                  myCourseProgress={myCourseProgress}
                  myCourseTitle={myCourseTitle}
                  myUserId={myCreatorId}
                  myAvatarUrl={localAvatar}
                  activeFilter={filter}
                  onFilter={setFilter}
                />
              </div>
            </aside>

            {/* Feed central — largura máxima fixa como Twitter (~600px) */}
            <div className="w-full max-w-[620px] flex-shrink-0 space-y-4 min-w-0 relative">

              {/* Aba Estilo Twitter (Clean & Bonita) */}
              <div className="sticky top-[86px] sm:top-[94px] z-40 glass-card backdrop-blur-xl border-b border-white/5 rounded-t-3xl shadow-lg mb-4 overflow-hidden">
                <div className="flex relative">
                  {[
                    { id: "recentes", label: "Para você" },
                    { id: "populares", label: "Populares" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as FilterType)}
                      className="flex-1 flex justify-center pt-5 pb-4 hover:bg-white/[0.04] transition-colors relative cursor-pointer group"
                    >
                      <span className={`text-[15px] font-display font-bold tracking-wide transition-colors ${filter === tab.id ? "text-white" : "text-white/40 group-hover:text-white/70"}`}>
                        {tab.label}
                      </span>
                      {filter === tab.id && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 h-1 w-16 shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                          style={{ background: "hsl(155 60% 45%)", borderRadius: "4px 4px 0 0" }}
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Se tiver tagFilter, mostra um banner para limpar o filtro */}
              {tagFilter && (
                <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-primary/30 mb-4 bg-primary/5">
                  <p className="text-sm text-primary font-bold">
                    Buscando: {tagFilter}
                  </p>
                  <button onClick={() => navigate("/comunidade")} className="text-xs text-muted-foreground hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                    Limpar Filtro
                  </button>
                </div>
              )}

              {/* Botão Flutuante de Novas Postagens */}
              <AnimatePresence>
                {newPostsCount > 0 && filter === "recentes" && (
                  <motion.div
                    initial={{ opacity: 1, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="sticky top-20 z-40 flex justify-center w-full pointer-events-none"
                  >
                    <button
                      onClick={handleLoadNewPosts}
                      className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg text-primary-foreground font-accent font-semibold text-xs hover:brightness-110 transition cursor-pointer"
                      style={{ background: "hsl(155 60% 40%)", boxShadow: "0 4px 20px hsl(155 60% 40% / 0.4)" }}
                    >
                      <ArrowUp size={14} />
                      {newPostsCount} {newPostsCount === 1 ? 'nova publicação' : 'novas publicações'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulário de nova publicação — oculto nas abas de salvos/curtidos */}
              {!isSubfeed && (
                <CreatePost
                  onPost={handlePost}
                  myCreatorId={myCreatorId}
                  myAvatarUrl={localAvatar}
                />
              )}

              {/* Banner de contexto para abas Curtidos / Salvos */}
              <AnimatePresence>
                {isSubfeed && (
                  <motion.div
                    key={`banner-${filter}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card rounded-2xl border-white/5 px-6 py-4 flex items-center gap-3"
                  >
                    {filter === "salvos" ? (
                      <>
                        <Bookmark size={18} className="text-primary flex-shrink-0" />
                        <p className="text-sm text-muted-foreground font-body">
                          Suas <span className="text-foreground font-semibold">publicações salvas</span> — só você vê isso.
                        </p>
                      </>
                    ) : (
                      <>
                        <Heart size={18} className="text-rose-400 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground font-body">
                          Publicações que você <span className="text-foreground font-semibold">curtiu</span>.
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <AnimatePresence initial={false}>
                  {(loadingPosts && !isSubfeed) || (loadingSubfeed && isSubfeed) ? (
                    <motion.div
                      key="skeletons"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 z-10 space-y-4 pointer-events-none"
                    >
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-card rounded-3xl border-white/5 shadow-2xl p-7 animate-pulse">
                          <div className="flex gap-4 mb-6">
                            <div className="w-[52px] h-[52px] rounded-2xl bg-white/5" />
                            <div className="flex-1 space-y-3 pt-1">
                              <div className="h-4 bg-white/10 rounded-lg w-1/3" />
                              <div className="h-3 bg-white/5 rounded-lg w-1/4" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-3.5 bg-white/5 rounded-lg w-full" />
                            <div className="h-3.5 bg-white/5 rounded-lg w-5/6" />
                            <div className="h-3.5 bg-white/5 rounded-lg w-3/4" />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : displayPosts.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card rounded-3xl border-white/5 p-10 text-center flex flex-col items-center gap-3"
                    >
                      {filter === "salvos" && (
                        <Bookmark size={32} className="text-muted-foreground/40" />
                      )}
                      {filter === "curtidos" && (
                        <Heart size={32} className="text-muted-foreground/40" />
                      )}
                      <p className="text-sm text-muted-foreground font-body">
                        {emptyMessages[filter]}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`feed-${filter}`}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {displayPosts.map((post, i) => (
                        <PostCard
                          key={`${post.id}-${i}`}
                          post={post}
                          onLike={handleLike}
                          onSave={handleSave}
                          onOpenModal={() => handleOpenPost(post)}
                          myName={myName}
                          myDisc={myDisc as any}
                          myDiscRingImg={myDiscRingImg}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* A bolinha invisível de carregamento contínuo */}
              {hasMore && filter === "recentes" && (
                <div ref={observerTarget} className="w-full flex justify-center py-8">
                  {loadingMore && (
                    <Loader2 className="animate-spin text-muted-foreground opacity-40" size={24} />
                  )}
                </div>
              )}

              {/* Mensagem de fim do feed */}
              {!hasMore && posts.length > 0 && filter === "recentes" && (
                <p className="text-center text-[11px] text-muted-foreground font-body py-8 opacity-40">
                  Você viu todas as publicações.
                </p>
              )}

              {/* Fim da aba curtidos/salvos */}
              {isSubfeed && displayPosts.length > 0 && !loadingSubfeed && (
                <p className="text-center text-[11px] text-muted-foreground font-body py-6 opacity-40">
                  {filter === "curtidos"
                    ? `${displayPosts.length} ${displayPosts.length === 1 ? "publicação curtida" : "publicações curtidas"}`
                    : `${displayPosts.length} ${displayPosts.length === 1 ? "publicação salva" : "publicações salvas"}`}
                </p>
              )}
            </div>

            {/* Sidebar direita — fixa, aparece em xl+ */}
            <aside className="hidden xl:block w-72 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Modal do post */}
      {openPost && (
        <PostModal
          post={openPost}
          onClose={closeModal}
          onLike={handleLike}   onSave={handleSave}
          myAvatarUrl={profilePhoto ?? null} myName={myName}
          myDisc={myDisc}           myDiscRingImg={myDiscRingImg}
          myUserId={myCreatorId}
        />
      )}
      </MainLandmark>
    </div>
  );
};

export default CommunityPage;