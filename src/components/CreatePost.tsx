/**
 * CreatePost.tsx
 *
 * Formulário de nova publicação da comunidade.
 * Salva no Supabase e chama onPost com a linha inserida (ID real do banco).
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X } from "lucide-react";
import supabase from "../../utils/supabase.ts";
import { UserAvatar } from "./PostCard";
import type { Publication } from "./PostCard";

interface CreatePostProps {
  onPost:        (publi: Publication) => void;
  myAvatarUrl:   string | null;
  myName:        string;
  myDisc:        string;
  myDiscRingImg: string | undefined;
  myCreatorId?:  string;
}

const CreatePost = ({
  onPost, myAvatarUrl, myName, myDisc, myDiscRingImg, myCreatorId,
}: CreatePostProps) => {
  const [expanded, setExpanded] = useState(false);
  const [publi,    setPubli]    = useState<Publication>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPubli((prev) => ({ ...prev, midia: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCancel = () => { setPubli({}); setExpanded(false); };

  const handleSubmit = async () => {
    if (!publi.description?.trim()) return;

    const data = {
      description: publi.description,
      midia:       publi.midia ?? "EMPTY",
      date:        new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T") + "-03:00",
      creator_id:  myCreatorId,
      like_qnt:    0,
    };

    const { data: inserted, error } = await supabase
      .from("publications")
      .insert(data)
      .select()
      .single();

    if (error) { alert(error.message); return; }

    onPost({ ...data, id: inserted.id, created_at: inserted.created_at });
    setPubli({});
    setExpanded(false);
  };

  return (
    <motion.div layout className="hologram-panel rounded-sm p-5">
      <div className="flex gap-3 items-start">
        <UserAvatar
          avatarUrl={myAvatarUrl} name={myName} disc={myDisc}
          size="lg" isMe discRingImg={myDiscRingImg}
        />
        <div className="flex-1">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 rounded-sm bg-secondary/40 border border-border/40 text-sm font-body text-muted-foreground hover:border-primary/40 hover:bg-secondary/60 transition">
              No que você está pensando?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <textarea
                autoFocus
                value={publi.description ?? ""}
                onChange={(e) => setPubli((prev) => ({ ...prev, description: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleSubmit()}
                placeholder="Compartilhe um insight, conquista ou dúvida com a comunidade..."
                rows={4}
                className="w-full px-4 py-3 rounded-sm bg-secondary/30 border border-border/50 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition resize-none"
              />

              <AnimatePresence>
                {publi.midia && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-sm overflow-hidden border border-border/40">
                    <img src={publi.midia} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button
                      onClick={() => { setPubli((prev) => ({ ...prev, midia: undefined })); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background transition">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-accent text-muted-foreground hover:text-primary transition px-2 py-1.5 rounded-sm hover:bg-secondary/40">
                  <ImageIcon size={14} /> Adicionar imagem
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-accent text-muted-foreground border border-border rounded-sm hover:text-foreground transition">
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!publi.description?.trim()}
                    className="px-4 py-1.5 text-xs font-accent font-bold text-primary-foreground rounded-sm transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed box-glow-accent"
                    style={{ background: "hsl(25 90% 55%)" }}>
                    Publicar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CreatePost;
