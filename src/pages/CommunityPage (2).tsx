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

import { DISC_IMGS }  from "../components/PostCard";
import type { Post, Publication } from "../components/PostCard";
import supabase from "../../utils/supabase.ts";

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const { user, profilePhoto } = useAuth();

  const [filter,      setFilter]      = useState<"recentes" | "populares">("recentes");
  const [openPost,    setOpenPost]    = useState<Post | null>(null);

  // Dados derivados do usuário logado
  const myName           = user?.name ?? "Você";
  const myDisc           = user?.assessment?.discProfile ?? "S";
  const myCreatorId      = user?.id;
  const myHourValue      = user?.assessment?.valorHoraLiquida
    ? `R$ ${user.assessment.valorHoraLiquida.toFixed(0)}/h` : "—";
  const myRole           = "Membro · UpJobs";
  const myCourseProgress = 65;
  const myCourseTitle    = "Machine Learning Avançado";
  const myDiscRingImg    = DISC_IMGS[myDisc];

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
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <div className="px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto ">

          {/* ── Cabeçalho Atualizado ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-glow">Comunidade</h1>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Compartilhe conquistas, dicas e insights com a rede UpJobs
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: Users,      label: "2.4k membros", color: "hsl(155 60% 45%)" },
                { icon: TrendingUp, label: "↑ 18% hoje",   color: "hsl(25 90% 55%)"  },
                { icon: Zap,        label: "94 online",    color: "hsl(45 90% 55%)"  },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label}
                  className="flex items-center gap-1.5 text-xs font-accent font-semibold px-3 py-1.5 rounded-sm shadow-sm"
                  style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
                  <Icon size={14} /><span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Layout 3 colunas ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6">

            {/* Sidebar esquerda */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <LeftSidebar
                  myName={myName}            myDisc={myDisc}
                  myRole={myRole}            myHourValue={myHourValue}
                  myCourseProgress={myCourseProgress}
                  myCourseTitle={myCourseTitle}
                  myUserId={myCreatorId}
                />
              </div>
            </aside>

            {/* Feed central */}
            <main className="space-y-4 min-w-0 relative">

              {/* Filtro */}
              <div className="flex gap-2 flex items-center justify-center">
                {(["recentes", "populares"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-sm text-xs font-accent font-semibold transition
                      ${f === filter
                        ? "text-primary-foreground"
                        : "text-muted-foreground border border-border hover:text-foreground"}`}
                    style={f === filter
                      ? { background: "hsl(155 60% 35%)", boxShadow: "0 0 12px hsl(155 60% 45% / 0.3)" }
                      : undefined}>
                    {f === "recentes" ? "🕒 Recentes" : "🔥 Populares"}
                  </button>
                ))}
              </div>

              {/* Botão Flutuante de Novas Postagens */}
              <AnimatePresence>
                {newPostsCount > 0 && filter === "recentes" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
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
              />

              {/* Feed de posts */}
              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="hologram-panel rounded-sm p-5 animate-pulse">
                      <div className="flex gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary/60" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 bg-secondary/60 rounded w-1/3" />
                          <div className="h-2 bg-secondary/40 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-secondary/50 rounded w-full" />
                        <div className="h-3 bg-secondary/50 rounded w-5/6" />
                        <div className="h-3 bg-secondary/40 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedPosts.length === 0 ? (
                <div className="hologram-panel rounded-sm p-10 text-center">
                  <p className="text-sm text-muted-foreground font-body">
                    Nenhuma publicação ainda. Seja o primeiro!
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}>
                      <PostCard
                        post={post}
                        onLike={handleLike}   onSave={handleSave}
                        onOpenModal={openModal}
                        profilePhoto={profilePhoto} myName={myName}
                        myDisc={myDisc}           myDiscRingImg={myDiscRingImg}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

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

            {/* Sidebar direita */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
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
          profilePhoto={profilePhoto} myName={myName}
          myDisc={myDisc}           myDiscRingImg={myDiscRingImg}
          myUserId={myCreatorId}
        />
      )}
    </div>
  );
};

export default CommunityPage;