import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { invokeApiProxy } from "@/lib/apiProxy"; 

interface KlipyGif {
  id:      string;
  title:   string;
  url:     string;  // URL do GIF para exibir
  preview: string;  // URL menor para grid
}

type KlipyMediaFmt = Record<string, { url?: string } | undefined>;
interface KlipyApiResult {
  id?: string;
  title?: string;
  media_formats?: KlipyMediaFmt;
  files?: KlipyMediaFmt;
  media?: unknown[];
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;  // retorna "gif:https://..."
  onClose:  () => void;
}

const GifPicker = ({ onSelect, onClose }: GifPickerProps) => {
  const [query,    setQuery]    = useState("");
  const [gifs,     setGifs]     = useState<KlipyGif[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [next,     setNext]     = useState<string | null>(null); // cursor de paginação
  const searchRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Foca no input ao abrir
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Carrega trending ao abrir (sem query)
  useEffect(() => { fetchGifs(""); }, []);

  const fetchGifs = async (q: string, pos?: string) => {
    setLoading(true);

    try {
      const { data, error } = await invokeApiProxy<{ results?: unknown[]; next?: string | null }>("klipy_gifs", {
        q: q.trim(),
        featured: !q.trim(),
        ...(pos ? { pos } : {}),
      });
      if (error) {
        console.warn("Klipy (api-proxy):", error);
        setGifs([]);
        setNext(null);
        return;
      }

      const mapped: KlipyGif[] = (data?.results ?? []).map((raw: KlipyApiResult) => {
        const media = (raw.media_formats || raw.files || (Array.isArray(raw.media) ? raw.media[0] : {}) || {}) as KlipyMediaFmt;
        return {
          id:      String(raw.id ?? ""),
          title:   String(raw.title ?? ""),
          url:     media?.gif?.url ?? media?.mediumgif?.url ?? "",
          preview: media?.tinygif?.url ?? media?.gif?.url ?? "",
        };
      }).filter((g: KlipyGif) => g.url);

      setGifs(pos ? (prev) => [...prev, ...mapped] : mapped);
      setNext(data?.next ?? null);
    } catch (err) {
      console.error("Klipy API erro:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce na busca
  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(value), 400);
  };

  const handleSelect = (gif: KlipyGif) => {
    onSelect(`gif:${gif.url}`); // prefixo "gif:" para distinguir no banco
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.99, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.15 }}
      className="hologram-panel rounded-sm overflow-hidden flex flex-col"
      style={{ width: 340, maxHeight: 420, zIndex: 50 }}
      onClick={(e) => e.stopPropagation()}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
        <Search size={13} className="text-muted-foreground flex-shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar GIFs…"
          className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {loading && <Loader2 size={13} className="animate-spin text-muted-foreground flex-shrink-0" />}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition flex-shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Grid de GIFs */}
      <div className="overflow-y-auto flex-1 p-2">
        {gifs.length === 0 && !loading ? (
          <p className="text-center text-xs text-muted-foreground font-body py-8">
            {query ? "Nenhum GIF encontrado." : "Carregando…"}
          </p>
        ) : (
          <>
            <div className="columns-2 gap-1.5 space-y-1.5">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className="w-full rounded-sm overflow-hidden hover:opacity-80 transition-opacity block">
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Carregar mais */}
            {next && !loading && (
              <button
                onClick={() => fetchGifs(query, next)}
                className="w-full mt-2 py-1.5 text-[10px] font-accent text-muted-foreground hover:text-primary transition">
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>

      {/* Crédito Klipy (obrigatório pela API) */}
      <div className="px-3 py-1.5 border-t border-border/20 flex items-center justify-end">
        <span className="text-[9px] text-muted-foreground font-body opacity-60">via Klipy</span>
      </div>
    </motion.div>
  );
};

export default GifPicker;