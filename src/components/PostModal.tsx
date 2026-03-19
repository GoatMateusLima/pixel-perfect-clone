import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Bookmark, Share2, Send, Loader2, ImageIcon, Video, Smile } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import {
  Post,
  DISC_COLOR, DISC_LABEL,
  UserAvatar,
  formatRelativeTime,
} from "./PostCard";
import PostMedia       from "./PostMedia";
import CommentItem, { DbComment, CommentNode, buildCommentTree } from "./CommentItem";
import GifPicker       from "./GifPicker";

const BUCKET = "ComunityPost";
const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp";
const ACCEPTED_VIDEO = "video/mp4,video/webm,video/ogg,video/quicktime";

interface PostModalProps {
  post:           Post;
  onClose:        () => void;
  onLike:         (id: string) => void;
  onSave:         (id: string) => void;
  myAvatarUrl:    string | null;
  myName:         string;
  myDisc:         string;
  myDiscRingImg:  string | undefined;
  myUserId?:      string;
}

const PostModal = ({
  post, onClose, onLike, onSave,
  myAvatarUrl, myName, myDisc, myDiscRingImg, myUserId,
}: PostModalProps) => {

  const [commentTree, setCommentTree] = useState<CommentNode[]>([]);
  const [loading,     setLoading]     = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [isLiked, setIsLiked]     = useState(post.liked);
  const [isSaved, setIsSaved]     = useState(post.saved);
  const [likeCount, setLikeCount] = useState(post.like_qnt ?? 0);

  // ── Estados de Input para Comentário Principal ──
  const [commentText, setCommentText] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [mediaFile,   setMediaFile]   = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [gifUrl,      setGifUrl]      = useState<string | null>(null);
  const [showGif,     setShowGif]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasMediaInput = !!(mediaFile || gifUrl);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMedia();
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleGifSelect = (url: string) => {
    clearMedia();
    setGifUrl(url);
    setShowGif(false);
  };

  const clearMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
    setGifUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Carrega comentários ──
  useEffect(() => {
    if (!post.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("publication_id", post.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (error || !commentsData) { setLoading(false); return; }

      const userIds = [...new Set(commentsData.map((c: any) => c.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, name, perfil, bordas")
          .in("user_id", userIds);

        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map((p: any) => [p.user_id, p]));
        }
      }

      const enriched = commentsData.map((c: any) => ({
        ...c,
        profiles: profilesMap[c.user_id] ?? null,
      }));

      if (!cancelled) {
        setCommentTree(buildCommentTree(enriched as DbComment[]));
        setLoading(false);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [post.id]);

  const scrollToBottom = () => {
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ── NOVA LÓGICA: Helper para Upload Mídia (Roda ANTES do Insert) ──
  const uploadCommentMedia = async (file: File | null, gif: string | null) => {
    if (gif) return gif;
    if (file && myUserId) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      // Gera um nome único aleatório para não depender do ID do comentário
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `${myUserId}/comments/${fileName}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      
      if (error) {
        console.error("Erro no upload do arquivo para o Bucket:", error.message);
        return "EMPTY";
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    }
    return "EMPTY";
  };

  // ── Comentário Raiz (Caixa Principal) ──
  const submitComment = async () => {
    if ((!commentText.trim() && !hasMediaInput) || !post.id || !myUserId) return;
    setSubmitting(true);

    // 1. Fazemos o upload ANTES de inserir no banco
    const midiaUrl = await uploadCommentMedia(mediaFile, gifUrl);

    // 2. Inserimos o comentário já com a mídia embutida (Ignora a necessidade de ter permissão de UPDATE)
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id:        myUserId,
        publication_id: post.id,
        comment:        commentText.trim(),
        midia:          midiaUrl,
        like:           0,
        parent_id:      null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar comentário no banco:", error.message);
      setSubmitting(false);
      return;
    }

    if (data) {
      const enriched = { ...data, profiles: { user_id: myUserId, name: myName, perfil: myAvatarUrl, bordas: [] } };
      const [newNode] = buildCommentTree([enriched as DbComment]);
      
      setCommentTree((prev) => [...prev, newNode]);
      setCommentText("");
      clearMedia();
      scrollToBottom();
    }
    
    setSubmitting(false);
  };

  // ── Responder a um Comentário (Reply) ──
  const handleReply = async (parentId: string, text: string, file: File | null, gif: string | null) => {
    if (!post.id || !myUserId) return;

    // 1. Faz o upload ANTES de inserir
    const midiaUrl = await uploadCommentMedia(file, gif);

    // 2. Insere a resposta pronta
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id:        myUserId,
        publication_id: post.id,
        comment:        text,
        midia:          midiaUrl,
        like:           0,
        parent_id:      parentId,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar resposta no banco:", error.message);
      return;
    }

    if (data) {
      const replyNode: CommentNode = {
        ...(data as DbComment),
        replies:       [],
        authorName:    myName,
        authorAvatar:  myAvatarUrl ?? undefined,
        authorRingImg: myDiscRingImg ?? undefined,
        profiles:      { user_id: myUserId ?? "", name: myName, perfil: myAvatarUrl ?? undefined, bordas: [] },
      };
      
      setCommentTree((prev) => prev.map((c) =>
        c.id !== parentId ? c : { ...c, replies: [...c.replies, replyNode] }
      ));
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", myUserId ?? ""); 

    if (!error) {
      setCommentTree((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies.filter((r) => r.id !== commentId),
          }))
      );
    }
  };

  const handleLikeToggle = () => {
    if (!post.id) return;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike(post.id);
  };

  const handleSaveToggle = () => {
    if (!post.id) return;
    setIsSaved(!isSaved);
    onSave(post.id);
  };

  const totalComments = commentTree.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  const authorName      = post.profile?.name      ?? "Usuário";
  const authorAvatarUrl = post.profile?.avatar_url;
  const authorRole      = post.profile?.role      ?? "";
  const authorDisc      = post.profile?.disc      ?? "S";
  const isMe            = post.creator_id === myUserId || authorName === myName;

  const copyLink = () => navigator.clipboard.writeText(`${window.location.origin}/comunidade?post=${post.id}`);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onClose}>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="hologram-panel rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="p-5 pb-0 flex items-start justify-between gap-3 flex-shrink-0">
            <div className="flex items-start gap-3">
              <UserAvatar
                avatarUrl={isMe ? myAvatarUrl : authorAvatarUrl}
                name={isMe ? myName : authorName}
                disc={isMe ? myDisc : authorDisc}
                size="lg" isMe={isMe}
                discRingImg={isMe ? myDiscRingImg : post.profile?.disc_ring_img}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-accent font-semibold text-sm text-foreground">
                    {isMe ? myName : authorName}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-accent font-semibold"
                    style={{ background: `${DISC_COLOR[authorDisc]}18`, color: DISC_COLOR[authorDisc], border: `1px solid ${DISC_COLOR[authorDisc]}40` }}>
                    {authorDisc} · {DISC_LABEL[authorDisc]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5">{authorRole}</p>
                <p className="text-[10px] text-muted-foreground font-body opacity-60">
                  {formatRelativeTime(post.date)}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition p-1 rounded-sm flex-shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* ── Descrição e Mídia ── */}
          <div className="px-5 py-4 flex-shrink-0">
            <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line mb-3">
              {post.description}
            </p>
            {post.midia && post.midia !== "EMPTY" && (
              <PostMedia midia={post.midia} maxHeight={380} inModal />
            )}
          </div>

          <div className="px-5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground font-body border-t border-border/30 pt-3 flex-shrink-0">
            <span>{likeCount} curtidas</span>
            <span>{totalComments} comentário{totalComments !== 1 ? "s" : ""}</span>
          </div>

          <div className="px-5 py-2 flex items-center gap-1 border-t border-border/30 flex-shrink-0">
            {[
              { label: "Curtir",      el: <Heart size={14} className={isLiked ? "fill-rose-400" : ""} />,   active: isLiked,  color: "text-rose-400", fn: handleLikeToggle },
              { label: "Salvar",      el: <Bookmark size={14} className={isSaved ? "fill-primary" : ""} />, active: isSaved,  color: "text-primary",  fn: handleSaveToggle },
              { label: "Copiar link", el: <Share2 size={14} />,                                             active: false,    color: "",              fn: copyLink },
            ].map(({ label, el, active, color, fn }) => (
              <button key={label} onClick={fn}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-xs font-accent font-semibold transition hover:bg-secondary/40 ${active ? color : "text-muted-foreground hover:text-foreground"}`}>
                {el} {label}
              </button>
            ))}
          </div>

          {/* ── Lista de comentários ── */}
          <div className="border-t border-border/30 overflow-y-auto flex-1 px-5 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs font-body">Carregando comentários…</span>
              </div>
            ) : commentTree.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body text-center py-8">
                Seja o primeiro a comentar!
              </p>
            ) : (
              <div className="space-y-4">
                {commentTree.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    myUserId={myUserId}
                    myName={myName}
                    myAvatarUrl={myAvatarUrl}
                    myDisc={myDisc}
                    myDiscRingImg={myDiscRingImg}
                    onReply={handleReply}
                    onDelete={handleDelete}
                  />
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* ── Input Principal de Novo Comentário ── */}
          <div className="p-4 border-t border-border/30 flex-shrink-0 bg-background/50">
            {hasMediaInput && (
              <div className="mb-3 relative w-max ml-[46px]">
                {gifUrl && <img src={gifUrl.slice(4)} alt="GIF" className="h-24 rounded-sm object-cover" />}
                {previewUrl && !gifUrl && (
                  mediaFile?.type.startsWith("video/") ? (
                    <video src={previewUrl} className="h-24 rounded-sm object-cover" />
                  ) : (
                    <img src={previewUrl} className="h-24 rounded-sm object-cover" />
                  )
                )}
                <button onClick={clearMedia} className="absolute -top-2 -right-2 p-1 bg-background/90 rounded-full shadow-sm hover:text-destructive">
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex gap-2.5 items-center">
              <UserAvatar
                avatarUrl={myAvatarUrl} name={myName} disc={myDisc}
                size="sm" isMe discRingImg={myDiscRingImg}
              />
              <div className="flex-1 flex gap-2 items-center">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
                  placeholder="Escreva um comentário…"
                  disabled={submitting}
                  className="flex-1 bg-secondary/30 border border-border/50 rounded-sm px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition disabled:opacity-50"
                />

                <div className="flex gap-1 items-center bg-secondary/20 rounded-sm px-1 py-0.5 border border-border/30">
                  <button onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_IMAGE; fileRef.current.click(); } }} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1.5 disabled:opacity-40">
                    <ImageIcon size={14} />
                  </button>
                  <button onClick={() => { if (fileRef.current) { fileRef.current.accept = ACCEPTED_VIDEO; fileRef.current.click(); } }} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1.5 disabled:opacity-40">
                    <Video size={14} />
                  </button>
                  <button onClick={() => setShowGif(true)} disabled={submitting || hasMediaInput} className="text-muted-foreground hover:text-primary transition p-1.5 disabled:opacity-40">
                    <Smile size={14} />
                  </button>
                </div>

                <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

                <button
                  onClick={submitComment}
                  disabled={(!commentText.trim() && !hasMediaInput) || submitting}
                  className="px-3 py-2 rounded-sm text-primary-foreground transition hover:brightness-110 disabled:opacity-40 ml-1 flex items-center justify-center min-w-[36px]"
                  style={{ background: "hsl(155 60% 35%)" }}>
                  {submitting
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Send size={12} />
                  }
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showGif && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowGif(false)}>
                <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostModal;