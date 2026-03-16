/**
 * CommunityPage.tsx
 *
 * Apenas layout e orquestração — toda lógica está nos componentes:
 *
 *   src/components/
 *     PostCard.tsx           → card de publicação + tipos compartilhados
 *     PostModal.tsx          → modal de post com comentários
 *     CreatePost.tsx         → formulário de nova publicação
 *     LeftSidebar.tsx        → sidebar esquerda (banner, stats, trending)
 *     RightSidebar.tsx       → sidebar de notícias tech
 *
 *   src/hooks/
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Zap } from "lucide-react";

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

// ─── Constantes ───────────────────────────────────────────────────────────────

const KEY_PHOTO = "upjobs_profile_photo_v2";

// ─── CommunityPage ────────────────────────────────────────────────────────────

const CommunityPage = () => {
  const { user } = useAuth();

  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [filter,      setFilter]      = useState<"recentes" | "populares">("recentes");
  const [openPost,    setOpenPost]    = useState<Post | null>(null);

  useEffect(() => { setMyAvatarUrl(localStorage.getItem(KEY_PHOTO)); }, [user]);

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

  const PAGE_SIZE = 10;

  // Converte row do banco → Post de UI
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

  // ── Carrega posts do Supabase ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      console.log("[CommunityPage] Buscando publicações...");

      const { data, error, status } = await supabase
        .from("publications")
        .select("*")
        .order("date", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      console.log("[CommunityPage] Resposta:", { status, rows: data?.length, error: error?.message });

      if (error) {
        console.error("[CommunityPage] Erro:", error.code, "-", error.message);
        setLoadingPosts(false);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("[CommunityPage] Nenhum post retornado. Verifique a RLS policy da tabela publications.");
        setLoadingPosts(false);
        return;
      }

      setPosts(data.map((row) => rowToPost(row, myCreatorId)));
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
      setLoadingPosts(false);
    };

    fetchPosts();
  }, [myCreatorId]);

  // ── Carregar mais ─────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error("Carregar mais:", error.message); setLoadingMore(false); return; }
    if (!data || data.length === 0) { setHasMore(false); setLoadingMore(false); return; }
    setPosts((prev) => [...prev, ...data.map((row) => rowToPost(row, myCreatorId))]);
    setPage((p) => p + 1);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  // ── Like persistente ──────────────────────────────────────────────────────────
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
      profile: { id: myCreatorId ?? "", name: myName, avatar_url: myAvatarUrl ?? undefined, role: myRole, disc: myDisc as "D"|"I"|"S"|"C" },
      liked: false, saved: false, comments: [],
    }, ...prev]);
  };

  // ── URL navigation (abre modal via ?post=uuid) ───────────────────────────────
  const openModal = (post: Post) => {
    setOpenPost(post);
    window.history.pushState({}, "", `/comunidade?post=${post.id}`);
  };

  const closeModal = () => {
    setOpenPost(null);
    window.history.pushState({}, "", "/comunidade");
  };

  // Ao carregar: abre modal se ?post=uuid estiver na URL
  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get("post");
    if (!postId) return;

    supabase
      .from("publications")
      .select("*")
      .eq("id", postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("Erro ao buscar post:", error.message); return; }
        if (data)  setOpenPost(rowToPost(data, myCreatorId));
      });
  }, []);

  // Ordenação client-side (sem re-fetch)
  const sortedPosts = filter === "populares"
    ? [...posts].sort((a, b) => (b.like_qnt ?? 0) - (a.like_qnt ?? 0))
    : [...posts].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

  return (
    <div className="min-h-screen gradient-hero scanline">
      <Header />

      <div className="px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">

          {/* ── Cabeçalho ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-glow">Comunidade</h1>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Compartilhe conquistas, dicas e insights com a rede UpJobs
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { icon: Users,      label: "2.4k membros", color: "hsl(155 60% 45%)" },
                { icon: TrendingUp, label: "↑ 18% hoje",   color: "hsl(25 90% 55%)"  },
                { icon: Zap,        label: "94 online",     color: "hsl(45 90% 55%)"  },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label}
                  className="flex items-center gap-1 text-[10px] font-accent font-semibold px-2 py-1 rounded-sm"
                  style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
                  <Icon size={10} /><span className="hidden sm:inline">{label}</span>
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
                  myAvatarUrl={myAvatarUrl} myName={myName}   myDisc={myDisc}
                  myRole={myRole}           myHourValue={myHourValue}
                  myCourseProgress={myCourseProgress}         myCourseTitle={myCourseTitle}
                  myUserId={myCreatorId}
                />
              </div>
            </aside>

            {/* Feed central */}
            <main className="space-y-4 min-w-0">

              {/* Filtro */}
              <div className="flex gap-2">
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

              {/* Formulário de nova publicação */}
              <CreatePost
                onPost={handlePost}
                myAvatarUrl={myAvatarUrl}  myName={myName}
                myDisc={myDisc}            myDiscRingImg={myDiscRingImg}
                myCreatorId={myCreatorId}
              />

              {/* Feed de posts */}
              {loadingPosts ? (
                // Skeleton de carregamento
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
                        myAvatarUrl={myAvatarUrl} myName={myName}
                        myDisc={myDisc}           myDiscRingImg={myDiscRingImg}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Paginação */}
              {hasMore && !loadingPosts && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-xs font-accent text-muted-foreground hover:text-foreground transition px-6 py-2 rounded-sm border border-border/40 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto">
                    {loadingMore
                      ? <><span className="w-3 h-3 rounded-full border-2 border-muted-foreground border-t-primary animate-spin" /> Carregando…</>
                      : "Carregar mais posts"
                    }
                  </button>
                </div>
              )}

              {!hasMore && posts.length > 0 && !loadingPosts && (
                <p className="text-center text-[11px] text-muted-foreground font-body py-4 opacity-60">
                  Você chegou ao fim 🎉
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
          myAvatarUrl={myAvatarUrl} myName={myName}
          myDisc={myDisc}           myDiscRingImg={myDiscRingImg}
          myUserId={myCreatorId}
        />
      )}
    </div>
  );
};

export default CommunityPage;