/**
 * MessengerWidget.tsx
 * Arquitetura Híbrida: JSON no Bucket (Conteúdo) + Tabelas no Banco (Indexação)
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
  read:       boolean; // Manual tracking via json structure if needed
}

interface Friend {
  friend_id:  string;
  name:       string;
  avatar:     string | null;
  username:   string | null;
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

const ConversationList = ({ onSelectChat, myId }: { onSelectChat: (chat: ActiveChat) => void; myId: string; }) => {
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

  // Escuta Realtime na tabela de sessões para atualizar a lista instantaneamente
  useEffect(() => {
    load();
    const channel = supabase.channel('sessions-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, (payload) => {
        const row = payload.new as any;
        if (row && (row.user1_id === myId || row.user2_id === myId)) {
          load();
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, myId]);

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
      <div className="px-3 pb-2 pt-1">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text" placeholder="Buscar conversa..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/50 border border-border/40 rounded-full pl-8 pr-3 py-1.5 text-xs font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}>
        {loading && convs.length === 0 ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-body">Carregando...</span>
          </div>
        ) : (
          <>
            {(filtered ? filtered.filter(i => "last_message" in i) : convs).map((conv) => {
              const c = conv as Conversation;
              const hasUnread = c.unread_count > 0;
              return (
                <motion.button key={c.other_user_id} whileHover={{ backgroundColor: "hsl(215 25% 15%)" }} onClick={() => onSelectChat({ userId: c.other_user_id, name: c.other_name, avatar: c.other_avatar })} className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left">
                  <div className="relative">
                    <Avatar src={c.other_avatar} name={c.other_name} size={40} />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-accent font-bold text-white" style={{ background: "hsl(155 60% 40%)", boxShadow: "0 0 6px hsl(155 60% 40% / 0.6)" }}>
                        {c.unread_count > 9 ? "9+" : c.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-accent font-semibold ${hasUnread ? "text-foreground" : "text-foreground/85"} truncate`}>{c.other_name}</span>
                      <span className="text-[9px] text-muted-foreground/50 font-body shrink-0 ml-1">{fmtTime(c.last_message_at)}</span>
                    </div>
                    <p className={`text-[11px] font-body truncate ${hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground/60"}`}>
                      {c.i_sent_last ? "Você: " : ""}{c.last_message}
                    </p>
                  </div>
                </motion.button>
              );
            })}
            {(filtered ? filtered.filter(i => "friend_id" in i) : friendsOnly).length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[9px] font-accent font-bold text-muted-foreground/50 uppercase tracking-widest">Amigos</p>
                {(filtered ? filtered.filter(i => "friend_id" in i) : friendsOnly).map((friend) => {
                  const f = friend as Friend;
                  return (
                    <motion.button key={f.friend_id} whileHover={{ backgroundColor: "hsl(215 25% 15%)" }} onClick={() => onSelectChat({ userId: f.friend_id, name: f.name, avatar: f.avatar })} className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left">
                      <Avatar src={f.avatar} name={f.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-accent font-semibold text-foreground/85 truncate">{f.name}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </>
            )}
            {!loading && (convs.length === 0 && friendsOnly.length === 0) && (
              <div className="px-3 py-8 text-center">
                <MessageCircle size={28} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50 font-body">Adicione amigos para conversar.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── ChatWindow (JSON via Bucket) ─────────────────────────────────────────────

const ChatWindow = ({ chat, myId, onBack }: { chat: ActiveChat; myId: string; onBack: () => void; }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getChatFileName = useCallback(() => {
    const sortedIds = [myId, chat.userId].sort();
    return `${sortedIds[0]}_${sortedIds[1]}.json`;
  }, [myId, chat.userId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const loadMessagesFromBucket = useCallback(async () => {
    const fileName = getChatFileName();
    const { data, error } = await supabase.storage.from('chats').download(fileName);
    
    if (error) {
      if (error.message.includes("not found") || error.message.includes("Object not found")) setMessages([]);
      else console.error("Erro ao baixar:", error.message);
    } else if (data) {
      try {
        const parsed = JSON.parse(await data.text()) as Message[];
        // Marca todas as recebidas como lidas
        const hasNewlyRead = parsed.some(m => m.sender_id !== myId && !m.read);
        const markedRead = parsed.map(m => m.sender_id !== myId ? { ...m, read: true } : m);
        setMessages(markedRead);

        // Salva o JSON atualizado no bucket para o remetente ver a confirmação de leitura
        if (hasNewlyRead) {
          await supabase.storage.from('chats').upload(getChatFileName(), JSON.stringify(markedRead), {
            contentType: 'application/json', upsert: true,
          });
          // Avisa o remetente que as mensagens foram lidas
          supabase.channel(`chat-ping-${getChatFileName()}`).send({
            type: 'broadcast', event: 'messages-read', payload: { reader_id: myId },
          });
        }
      } catch (e) { console.error("Erro JSON:", e); }
    }
    
    // Zera contagem de não lidas no banco
    supabase.rpc('reset_chat_unread', { p_target_id: chat.userId });
    setLoading(false);
    scrollToBottom();
  }, [getChatFileName, myId, chat.userId, scrollToBottom]);

  useEffect(() => {
    setLoading(true);
    loadMessagesFromBucket();
  }, [loadMessagesFromBucket]);

  // Canal Broadcast para saber quando o JSON foi atualizado pelo outro
  useEffect(() => {
    const channelName = `chat-ping-${getChatFileName()}`;
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'new-message' }, (payload) => {
        if (payload.payload.sender_id !== myId) loadMessagesFromBucket();
      })
      .on('broadcast', { event: 'messages-read' }, (payload) => {
        // O receptor leu nossas mensagens → atualiza read: true no estado local
        if (payload.payload.reader_id !== myId) {
          setMessages(prev => prev.map(m => m.sender_id === myId ? { ...m, read: true } : m));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [getChatFileName, myId, loadMessagesFromBucket]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sender_id: myId, content: text, created_at: new Date().toISOString(), read: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    scrollToBottom();

    // 1. Salva o Arquivo no Bucket
    const { error } = await supabase.storage.from('chats').upload(getChatFileName(), JSON.stringify(updatedMessages), {
      contentType: 'application/json', upsert: true 
    });

    if (error) {
      console.error("Erro Upload:", error.message);
      setMessages(messages); setInput(text);
    } else {
      // 2. Avisa o Banco (atualiza a tabela de sessões para aparecer na lista do amigo)
      await supabase.rpc('update_chat_session', { p_target_id: chat.userId, p_last_message: text });
      // 3. Avisa o canal realtime do amigo para ele baixar o novo arquivo
      supabase.channel(`chat-ping-${getChatFileName()}`).send({ type: 'broadcast', event: 'new-message', payload: { sender_id: myId } });
    }
    setSending(false);
  };

  let lastSender = "", lastDate = "";
  // Índice da última mensagem enviada por mim (para exibir status de leitura)
  const lastMyMsgIndex = messages.reduce((acc, m, i) => m.sender_id === myId ? i : acc, -1);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2.5 border-b border-border/30" style={{ background: "hsl(215 28% 11%)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition p-1"><ArrowLeft size={15} /></button>
        <Avatar src={chat.avatar} name={chat.name} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-accent font-semibold text-foreground truncate">{chat.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(155 60% 45% / 0.2) transparent" }}>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-muted-foreground/40" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8"><p className="text-xs text-muted-foreground/50 font-body">Diga oi para {chat.name}! 👋</p></div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === myId;
            const dateStr = new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
            const showDate = dateStr !== lastDate;
            const showAvatar = !isMe && msg.sender_id !== lastSender;
            lastSender = msg.sender_id; lastDate = dateStr;
            const isLast = i === messages.length - 1;
            const nextMsg = messages[i + 1];
            const isLastOfGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border/20" />
                    <span className="text-[9px] font-accent text-muted-foreground/40">{dateStr}</span>
                    <div className="flex-1 h-px bg-border/20" />
                  </div>
                )}
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex items-end gap-1.5 w-full ${isMe ? "justify-end" : "justify-start"} ${isLastOfGroup ? "mb-2" : "mb-0.5"}`}>
                  {!isMe && <div className="w-5 shrink-0">{isLastOfGroup && <Avatar src={chat.avatar} name={chat.name} size={20} />}</div>}
                  <div className={`max-w-[75%] flex flex-col min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`px-3 py-2 text-xs font-body leading-relaxed whitespace-pre-wrap break-words ${isMe ? "rounded-t-2xl rounded-bl-2xl rounded-br-sm text-white" : "rounded-t-2xl rounded-br-2xl rounded-bl-sm text-foreground"}`}
                      style={{ wordBreak: 'break-word', ...(isMe ? { background: "hsl(155 60% 38%)", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" } : { background: "hsl(215 25% 18%)", border: "1px solid hsl(215 20% 26%)" }) }}>
                      {msg.content}
                    </div>
                    {isMe && i === lastMyMsgIndex && (
                      <span className="mt-0.5 flex items-center">
                        {msg.read
                          ? <CheckCheck size={11} style={{ color: "hsl(155 60% 60%)" }} />
                          : <Check size={11} className="text-muted-foreground/40" />
                        }
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

      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border/30 flex items-end gap-2">
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Aa" rows={1} disabled={sending} className="flex-1 px-3 py-2 rounded-2xl bg-secondary/50 border border-border/40 text-foreground font-body text-xs focus:outline-none focus:border-primary/40 transition-colors resize-none disabled:opacity-50" style={{ minHeight: 34, maxHeight: 80 }} />
        <button onClick={send} disabled={!input.trim() || sending} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40" style={{ background: "hsl(155 60% 38%)", boxShadow: input.trim() ? "0 0 8px hsl(155 60% 40% / 0.4)" : "none" }}>
          {sending ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} style={{ color: "white" }} />}
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

  useEffect(() => {
    const handler = (e: Event) => {
      const { userId, name, avatar } = (e as CustomEvent).detail;
      setActiveChat({ userId, name, avatar: avatar ?? null });
      setView("chat"); setIsOpen(true);
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  const loadBadge = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_unread_total");
    setUnreadTotal(Number(data ?? 0));
  }, [user]);

  useEffect(() => {
    loadBadge();
    const ch = supabase.channel("messenger-unread-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, (payload) => {
        const row = payload.new as any;
        if (row && (row.user1_id === user?.id || row.user2_id === user?.id)) loadBadge();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadBadge]);

  if (!user) return null;

  const openChat = (chat: ActiveChat) => {
    setActiveChat(chat);
    setView("chat");
    // Já podemos zerar a badge de não lidas imediatamente ao clicar
    supabase.rpc('reset_chat_unread', { p_target_id: chat.userId });
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => { setIsOpen(true); setView("list"); loadBadge(); }} className="fixed bottom-6 left-6 z-50 w-13 h-13 rounded-full flex items-center justify-center border-0" style={{ width: 52, height: 52, background: "radial-gradient(circle at 35% 35%, hsl(155 60% 38%), hsl(155 60% 22%))", border: "1.5px solid hsl(155 60% 45% / 0.6)", boxShadow: "0 0 20px hsl(155 60% 45% / 0.45), 0 4px 16px rgba(0,0,0,0.5)" }}>
            <MessageCircle size={22} style={{ color: "hsl(155 60% 90%)" }} />
            {unreadTotal > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-accent font-bold text-white" style={{ background: "hsl(0 70% 55%)", boxShadow: "0 0 8px hsl(0 70% 55% / 0.6)" }}>{unreadTotal > 9 ? "9+" : unreadTotal}</motion.span>}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div key="messenger-panel" initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} className="fixed bottom-6 left-6 z-50 flex flex-col rounded-xl overflow-hidden" style={{ width: 320, height: 480, background: "hsl(215 30% 10%)", border: "1px solid hsl(155 60% 45% / 0.25)", boxShadow: "0 12px 48px rgba(0,0,0,0.75), 0 0 32px hsl(155 60% 45% / 0.1)" }}>
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/25" style={{ background: "hsl(215 30% 12%)" }}>
              <div className="flex items-center gap-2">
                {view === "chat" && activeChat ? (
                  <><button onClick={() => { setView("list"); setActiveChat(null); loadBadge(); }} className="text-muted-foreground hover:text-foreground transition mr-1"><ArrowLeft size={14} /></button><Avatar src={activeChat.avatar} name={activeChat.name} size={26} /><span className="text-xs font-accent font-semibold text-foreground truncate max-w-[140px]">{activeChat.name}</span></>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ boxShadow: "0 0 6px hsl(155 60% 45%)" }} /><span className="text-xs font-accent font-semibold text-foreground tracking-wide">Mensagens</span>{unreadTotal > 0 && <span className="text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 70% 55% / 0.2)", color: "hsl(0 70% 65%)", border: "1px solid hsl(0 70% 55% / 0.35)" }}>{unreadTotal} não {unreadTotal === 1 ? "lida" : "lidas"}</span>}</>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition"><X size={15} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {view === "list" ? <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="h-full"><ConversationList onSelectChat={openChat} myId={user.id} /></motion.div>
                : <motion.div key="chat" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="h-full">{activeChat && <ChatWindow chat={activeChat} myId={user.id} onBack={() => { setView("list"); setActiveChat(null); loadBadge(); }} />}</motion.div>}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessengerWidget;