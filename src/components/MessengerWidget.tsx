/**
 * MessengerWidget.tsx
 *
 * Messenger flutuante estilo Facebook/Telegram.
 * Adicione <MessengerWidget /> no seu layout raiz (ex: App.tsx) para ele
 * aparecer em todas as páginas. Ele é controlado por um evento global:
 * window.dispatchEvent(new CustomEvent("open-chat", { detail: { userId, name, avatar } }))
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, ArrowLeft, Send, Search,
  User, Check, CheckCheck, Loader2,
} from "lucide-react";
import supabase from "../../utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conversation {
  other_user_id:   string;
  other_name:      string;
  other_avatar:    string | null;
  last_message:    string;
  last_message_at: string;
  unread_count:    number;
  i_sent_last:     boolean;
}

interface Message {
  id:         string;
  sender_id:  string;
  content:    string;
  created_at: string;
  read:       boolean;
}

interface Friend {
  friend_id:  string;
  name:       string;
  avatar:     string | null;
  username:   string | null;
  disc:       string | null;
  descricao:  string | null;
}

interface ActiveChat {
  userId: string;
  name:   string;
  avatar: string | null;
}

type View = "list" | "chat";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000)       return "agora";
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)   return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const Avatar = ({ src, name, size = 36 }: { src?: string | null; name?: string; size?: number }) => (
  <div className="relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-secondary"
    style={{ width: size, height: size, border: "2px solid hsl(155 60% 45% / 0.3)" }}>
    {src
      ? <img src={src} alt={name} className="w-full h-full object-cover" />
      : <User size={size * 0.4} className="text-muted-foreground" />}
  </div>
);

// ─── ConversationList ─────────────────────────────────────────────────────────

const ConversationList = ({
  onSelectChat, myId,
}: {
  onSelectChat: (chat: ActiveChat) => void;
  myId: string;
}) => {
  const [convs,   setConvs]   = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: convData }, { data: friendData }] = await Promise.all([
      supabase.rpc("get_conversations"),
      supabase.rpc("get_friends"),
    ]);
    setConvs(convData  ?? []);
    setFriends(friendData ?? []);
    setLoading(false);
  }, []);

  // Realtime para a lista de conversas
  useEffect(() => {
    load();

    const channel = supabase
      .channel(`conversation-list-${myId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${myId}` },
        () => {
          // Trigger: Alguém te mandou mensagem!
          load();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${myId}` },
        () => {
          // Trigger: Você enviou mensagem (útil se estiver com abas múltiplas abertas)
          load();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, myId]);

  // Amigos sem conversa ainda
  const convUserIds = new Set((convs ?? []).map(c => c.other_user_id));
  const friendsOnly = (friends ?? []).filter(f => !convUserIds.has(f.friend_id));

  const filtered = search.trim()
    ? [
        ...(convs ?? []).filter(c => c.other_name?.toLowerCase().includes(search.toLowerCase())),
        ...friendsOnly.filter(f => f.name?.toLowerCase().includes(search.toLowerCase())),
      ]
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pb-2 pt-1">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border/40 rounded-full
              pl-8 pr-3 py-1.5 text-xs font-body text-foreground
              placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}>
        {loading && convs.length === 0 ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-body">Carregando...</span>
          </div>
        ) : (
          <>
            {/* Conversas recentes */}
            {(filtered ? filtered.filter(i => "last_message" in i) : convs).map((conv) => {
              const c = conv as Conversation;
              const hasUnread = c.unread_count > 0;
              return (
                <motion.button
                  key={c.other_user_id}
                  whileHover={{ backgroundColor: "hsl(215 25% 15%)" }}
                  onClick={() => onSelectChat({ userId: c.other_user_id, name: c.other_name, avatar: c.other_avatar })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar src={c.other_avatar} name={c.other_name} size={40} />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center
                        text-[8px] font-accent font-bold text-white"
                        style={{ background: "hsl(155 60% 40%)", boxShadow: "0 0 6px hsl(155 60% 40% / 0.6)" }}>
                        {c.unread_count > 9 ? "9+" : c.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-accent font-semibold ${hasUnread ? "text-foreground" : "text-foreground/85"} truncate`}>
                        {c.other_name}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-body shrink-0 ml-1">
                        {fmtTime(c.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-[11px] font-body truncate ${hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground/60"}`}>
                      {c.i_sent_last ? "Você: " : ""}{c.last_message}
                    </p>
                  </div>
                </motion.button>
              );
            })}

            {/* Amigos sem mensagem */}
            {(filtered ? filtered.filter(i => "friend_id" in i) : friendsOnly).length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[9px] font-accent font-bold text-muted-foreground/50 uppercase tracking-widest">
                  Amigos
                </p>
                {(filtered ? filtered.filter(i => "friend_id" in i) : friendsOnly).map((friend) => {
                  const f = friend as Friend;
                  return (
                    <motion.button
                      key={f.friend_id}
                      whileHover={{ backgroundColor: "hsl(215 25% 15%)" }}
                      onClick={() => onSelectChat({ userId: f.friend_id, name: f.name, avatar: f.avatar })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                    >
                      <Avatar src={f.avatar} name={f.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-accent font-semibold text-foreground/85 truncate">{f.name}</p>
                        {f.username && (
                          <p className="text-[10px] text-muted-foreground/50 font-body">@{f.username}</p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </>
            )}

            {!loading && (convs.length === 0 && friendsOnly.length === 0) && (
              <div className="px-3 py-8 text-center">
                <MessageCircle size={28} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50 font-body">
                  Adicione amigos para começar a conversar.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── ChatWindow ───────────────────────────────────────────────────────────────

const ChatWindow = ({
  chat, myId, onBack,
}: {
  chat:   ActiveChat;
  myId:   string;
  onBack: () => void;
}) => {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [input,    setInput]      = useState("");
  const [sending,  setSending]    = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Carrega histórico
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, read")
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${chat.userId}),and(sender_id.eq.${chat.userId},receiver_id.eq.${myId})`)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!cancelled) {
        setMessages(data ?? []);
        setLoading(false);
        scrollToBottom();
        // Marca como lidas
        supabase.rpc("mark_messages_read", { other_user: chat.userId });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [chat.userId, myId, scrollToBottom]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-window-${myId}-${chat.userId}`)
      // Escuta mensagens recebidas
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${myId}` },
        (payload) => {
          const msg = payload.new as Message;
          // Confirma que a mensagem veio da pessoa que estou conversando
          if (msg.sender_id === chat.userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToBottom();
            // Marca como lida instantaneamente
            supabase.rpc("mark_messages_read", { other_user: chat.userId });
          }
        }
      )
      // Escuta mensagens enviadas por VOCÊ (útil se você usar 2 abas/celular ao mesmo tempo)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${myId}` },
        (payload) => {
          const msg = payload.new as Message;
          // Se eu mandei para essa pessoa específica
          if (msg.receiver_id === chat.userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chat.userId, myId, scrollToBottom]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    // Optimistic UI (Aparece instantaneamente)
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId, sender_id: myId, content: text,
      created_at: new Date().toISOString(), read: false,
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();

    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: myId, receiver_id: chat.userId, content: text })
      .select("id, sender_id, content, created_at, read")
      .single();

    setSending(false);
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
      return;
    }
    // Troca a mensagem "temp" pela mensagem real salva no banco
    setMessages(prev => prev.map(m => m.id === tempId ? (data as Message) : m));
  };

  // Agrupa mensagens por dia e por remetente consecutivo
  let lastSender = "";
  let lastDate   = "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2.5 border-b border-border/30"
        style={{ background: "hsl(215 28% 11%)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition p-1">
          <ArrowLeft size={15} />
        </button>
        <Avatar src={chat.avatar} name={chat.name} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-accent font-semibold text-foreground truncate">{chat.name}</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] font-accent text-muted-foreground">online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground/50 font-body">
              Diga oi para {chat.name}! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe    = msg.sender_id === myId;
            const dateStr = new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
            const showDate   = dateStr !== lastDate;
            const showAvatar = !isMe && msg.sender_id !== lastSender;
            lastSender = msg.sender_id;
            lastDate   = dateStr;
            const isLast  = i === messages.length - 1;
            const nextMsg = messages[i + 1];
            const isLastOfGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const isTemp  = msg.id.startsWith("temp-");

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border/20" />
                    <span className="text-[9px] font-accent text-muted-foreground/40">{dateStr}</span>
                    <div className="flex-1 h-px bg-border/20" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex items-end gap-1.5 ${isMe ? "justify-end" : "justify-start"}
                    ${isLastOfGroup ? "mb-2" : "mb-0.5"}`}>

                  {/* Avatar do outro lado */}
                  {!isMe && (
                    <div className="w-5 shrink-0">
                      {isLastOfGroup && <Avatar src={chat.avatar} name={chat.name} size={20} />}
                    </div>
                  )}

                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`px-3 py-2 text-xs font-body leading-relaxed break-words
                      ${isMe
                        ? "rounded-t-2xl rounded-bl-2xl rounded-br-sm text-white"
                        : "rounded-t-2xl rounded-br-2xl rounded-bl-sm text-foreground"}`}
                      style={isMe
                        ? { background: "hsl(155 60% 38%)", boxShadow: isTemp ? "none" : "0 1px 4px rgba(0,0,0,0.3)" }
                        : { background: "hsl(215 25% 18%)", border: "1px solid hsl(215 20% 26%)" }}>
                      {msg.content}
                    </div>

                    {isMe && isLast && (
                      <span className="flex items-center gap-0.5 mt-0.5 text-[9px] text-muted-foreground/40 font-accent">
                        {isTemp
                          ? <Loader2 size={9} className="animate-spin" />
                          : msg.read
                            ? <CheckCheck size={9} style={{ color: "hsl(155 60% 50%)" }} />
                            : <Check size={9} />}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border/30 flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Aa"
          rows={1}
          disabled={sending}
          className="flex-1 px-3 py-2 rounded-2xl bg-secondary/50 border border-border/40
            text-foreground font-body text-xs focus:outline-none focus:border-primary/40 transition-colors
            resize-none disabled:opacity-50"
          style={{ minHeight: 34, maxHeight: 80 }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: "hsl(155 60% 38%)", boxShadow: input.trim() ? "0 0 8px hsl(155 60% 40% / 0.4)" : "none" }}>
          <Send size={13} style={{ color: "white" }} />
        </button>
      </div>
    </div>
  );
};

// ─── MessengerWidget (componente raiz) ────────────────────────────────────────

const MessengerWidget = () => {
  const { user } = useAuth();
  const [isOpen,      setIsOpen]      = useState(false);
  const [view,        setView]        = useState<View>("list");
  const [activeChat,  setActiveChat]  = useState<ActiveChat | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Escuta evento global para abrir conversa a partir de outros componentes
  useEffect(() => {
    const handler = (e: Event) => {
      const { userId, name, avatar } = (e as CustomEvent).detail;
      setActiveChat({ userId, name, avatar: avatar ?? null });
      setView("chat");
      setIsOpen(true);
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  // Busca total de não lidas periodicamente
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.rpc("get_unread_total");
      setUnreadTotal(Number(data ?? 0));
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [user]);

  // Realtime para atualizar badge
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("messenger-unread-badge")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        if (!isOpen) setUnreadTotal(p => p + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, isOpen]);

  if (!user) return null;

  const openChat = (chat: ActiveChat) => {
    setActiveChat(chat);
    setView("chat");
    // Zera badge para este remetente (o mark_messages_read é chamado dentro de ChatWindow)
  };

  const backToList = () => {
    setView("list");
    setActiveChat(null);
  };

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setIsOpen(true); setView("list"); }}
            className="fixed bottom-6 left-6 z-50 w-13 h-13 rounded-full flex items-center justify-center border-0"
            style={{
              width: 52, height: 52,
              background: "radial-gradient(circle at 35% 35%, hsl(155 60% 38%), hsl(155 60% 22%))",
              border: "1.5px solid hsl(155 60% 45% / 0.6)",
              boxShadow: "0 0 20px hsl(155 60% 45% / 0.45), 0 4px 16px rgba(0,0,0,0.5)",
            }}>
            <MessageCircle size={22} style={{ color: "hsl(155 60% 90%)" }} />
            {unreadTotal > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center
                  justify-center text-[9px] font-accent font-bold text-white"
                style={{ background: "hsl(0 70% 55%)", boxShadow: "0 0 8px hsl(0 70% 55% / 0.6)" }}>
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Painel principal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="messenger-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit ={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-6 z-50 flex flex-col rounded-xl overflow-hidden"
            style={{
              width: 320, height: 480,
              background: "hsl(215 30% 10%)",
              border: "1px solid hsl(155 60% 45% / 0.25)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.75), 0 0 32px hsl(155 60% 45% / 0.1)",
            }}>

            {/* Header do painel */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/25"
              style={{ background: "hsl(215 30% 12%)" }}>
              <div className="flex items-center gap-2">
                {view === "chat" && activeChat ? (
                  <>
                    <button onClick={backToList} className="text-muted-foreground hover:text-foreground transition mr-1">
                      <ArrowLeft size={14} />
                    </button>
                    <Avatar src={activeChat.avatar} name={activeChat.name} size={26} />
                    <span className="text-xs font-accent font-semibold text-foreground truncate max-w-[140px]">
                      {activeChat.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"
                      style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }} />
                    <span className="text-xs font-accent font-semibold text-foreground tracking-wide">
                      Mensagens
                    </span>
                    {unreadTotal > 0 && (
                      <span className="text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "hsl(0 70% 55% / 0.2)", color: "hsl(0 70% 65%)", border: "1px solid hsl(0 70% 55% / 0.35)" }}>
                        {unreadTotal} não {unreadTotal === 1 ? "lida" : "lidas"}
                      </span>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition">
                <X size={15} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {view === "list" ? (
                  <motion.div key="list"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="h-full">
                    <ConversationList onSelectChat={openChat} myId={user.id} />
                  </motion.div>
                ) : (
                  <motion.div key="chat"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.18 }}
                    className="h-full">
                    {activeChat && (
                      <ChatWindow chat={activeChat} myId={user.id} onBack={backToList} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessengerWidget;

// ─── Como usar ────────────────────────────────────────────────────────────────
//
// 1. Importe e adicione em App.tsx (ou qualquer layout raiz):
//    import MessengerWidget from "@/components/MessengerWidget";
//    // dentro do JSX:
//    <MessengerWidget />
//
// 2. Para abrir uma conversa a partir de qualquer página:
//    window.dispatchEvent(new CustomEvent("open-chat", {
//      detail: { userId: "uuid-do-usuario", name: "Nome", avatar: "url-ou-null" }
//    }));
//
// 3. Habilite o Realtime no Supabase Dashboard:
//    Database > Replication > Adicione a tabela "messages"