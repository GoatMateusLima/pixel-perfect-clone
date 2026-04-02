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
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Zap, Loader2, ArrowUp } from "lucide-react";

import Header          from "@/components/Header";
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

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const { user, profilePhoto, assessment } = useAuth();

  const [filter,      setFilter]      = useState<"recentes" | "populares">("recentes");
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
      if (prof?.perfil) setLocalAvatar(prof.perfil);

      // 2. Busca curso mais recente na tabela watch
      const { data: watchData } = await supabase
        .from("watch")
        .select("course_id, courses(id, name)")
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

      // 3. Calcula progresso desse curso (similar ao CursosEmAndamento.tsx)
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
  }, [user?.id]);

  // ── Estado dos posts ─────────────────────────────────────────────────────────
  const [posts,        setPosts]       = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [page,         setPage]         = useState(0);

  // ── Estados para o estilo Twitter / Infinite Scroll ──────────────────────────
  const [newPostsCount, setNewPostsCount] = useState(0);

  const PAGE_SIZE = 10;

  // Converte row do banco → Post de UI
  const rowToPost = (row: any, userId?: string): Post => {
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
      saved:    false,
      comments: [],
    };
  };

  // ── Carrega posts iniciais do Supabase ───────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);

    const { data, error } = await supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .order("date", { ascending: false })
      .range(0, PAGE_SIZE - 1);

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
    setNewPostsCount(0); // Reseta as novidades ao recarregar
  }, [myCreatorId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Carregar mais (Infinite Scroll com proteção anti-duplicados) ─────────────
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("publications")
      .select("*, profiles!creator_id(user_id, name, perfil, descricao, bordas)")
      .order("date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
      
    if (error) { console.error("Carregar mais:", error.message); setLoadingMore(false); return; }
    if (!data || data.length === 0) { setHasMore(false); setLoadingMore(false); return; }
    
    setPosts((prev) => {
      // Cria a lista nova e filtra os IDs que já existem na tela para não duplicar
      const novosPosts = data.map((row) => rowToPost(row, myCreatorId));
      const postsUnicos = novosPosts.filter(
        (novoPost) => !prev.some((postExistente) => postExistente.id === novoPost.id)
      );
      return [...prev, ...postsUnicos];
    });

    setPage((p) => p + 1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, myCreatorId, posts.length]);

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

    // Conecta no canal do banco de dados para escutar novos INSERTS
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
          // Ignora se o post for do próprio usuário logado
          if (payload.new.creator_id === myCreatorId) return;

          // Se for de outra pessoa, aumenta o contador na mesma hora!
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    // Desconecta o canal se o usuário sair da página para economizar memória
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
  };

  const handleSave = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));

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
  }, [myCreatorId]);

  const sortedPosts = filter === "populares"
    ? [...posts].sort((a, b) => (b.like_qnt ?? 0) - (a.like_qnt ?? 0))
    : [...posts].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="min-h-screen relative overflow-clip">
      <TechBackground />
      <Header />

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
                />
              </div>
            </aside>

            {/* Feed central — largura máxima fixa como Twitter (~600px) */}
            <main className="w-full max-w-[620px] flex-shrink-0 space-y-4 min-w-0 relative">

              {/* Filtro Estilo Pill Flutuante */}
              <div className="sticky top-20 z-40 py-4 flex justify-center pointer-events-none">
                <div className="glass-card p-1.5 flex gap-1 pointer-events-auto border-white/10 shadow-2xl backdrop-blur-2xl">
                  {(["recentes", "populares"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-6 py-2 rounded-full text-xs font-accent font-bold transition-all duration-300
                        ${f === filter
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                      {f === "recentes" ? "🕒 Recentes" : "🔥 Populares"}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Formulário de nova publicação */}
              <CreatePost
                onPost={handlePost}
                myCreatorId={myCreatorId}
                myAvatarUrl={localAvatar}
              />

              <div className="relative">
                <AnimatePresence initial={false}>
                  {loadingPosts ? (
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
                  ) : sortedPosts.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="glass-card rounded-3xl border-white/5 p-10 text-center"
                    >
                      <p className="text-sm text-muted-foreground font-body">
                        Nenhuma publicação ainda. Seja o primeiro!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="feed"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {sortedPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLike}
                          onSave={handleSave}
                          onOpenModal={openModal}
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
            </main>

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
    </div>
  );
};

export default CommunityPage;