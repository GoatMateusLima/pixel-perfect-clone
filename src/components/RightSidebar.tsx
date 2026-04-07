/**
 * RightSidebar.tsx
 *
 * Sidebar direita da CommunityPage — notícias tech do Canaltech.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ExternalLink, Clock, ChevronRight, Flame } from "lucide-react";

interface NewsItem {
  id:            number;
  title:         string;
  category:      string;
  categoryColor: string;
  time:          string;
  url:           string;
  image:         string;
  hot?:          boolean;
}

const MOCK_NEWS: NewsItem[] = [
  { id: 1, title: "Samsung lança Galaxy S26 com IA embarcada e Exynos 2600",          category: "IA & Devices",           categoryColor: "hsl(45 90% 55%)",  time: "há 2h",  url: "https://video.canaltech.com.br/video/hands-on/samsung-anuncia-linha-galaxy-s26-com-recursos-de-ia-e-exynos-2600-22627/", image: "https://t.ctcdn.com.br/VkKue7mxnh7puDyb4TNPTVOiXecY=/640x360/smart/i1104977.jpeg", hot: true },
  { id: 2, title: "OpenAI anuncia GPT-5 com raciocínio avançado para empresas",        category: "Inteligência Artificial", categoryColor: "hsl(155 60% 45%)", time: "há 5h",  url: "https://canaltech.com.br/inteligencia-artificial/", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80", hot: true },
  { id: 3, title: "Cloud no Brasil cresce 34% e gera 80 mil vagas em 2025",            category: "Mercado Tech",            categoryColor: "hsl(210 70% 55%)", time: "há 8h",  url: "https://canaltech.com.br/mercado/",               image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80" },
  { id: 4, title: "Engenheiros de IA lideram ranking de salários remotos no Brasil",   category: "Carreira",                categoryColor: "hsl(25 90% 55%)",  time: "há 12h", url: "https://canaltech.com.br/carreira/",              image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" },
  { id: 5, title: "Meta investe US$ 65 bi em data centers para treinar modelos de IA", category: "Big Tech",                categoryColor: "hsl(270 60% 60%)", time: "há 1d",  url: "https://canaltech.com.br/empresa/meta/",          image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80" },
  { id: 6, title: "Brasil registra alta de 65% em ataques ransomware em 2025",         category: "Cibersegurança",          categoryColor: "hsl(0 70% 55%)",   time: "há 1d",  url: "https://canaltech.com.br/seguranca/",             image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80" },
];

const TRENDING = [
  { tag: "#RemoteWork",             posts: 1240 },
  { tag: "#InteligenciaArtificial", posts: 987  },
  { tag: "#FreelancerBR",           posts: 754  },
  { tag: "#DataScience",            posts: 612  },
  { tag: "#CarreiraTech",           posts: 501  },
];

const RightSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_NEWS : MOCK_NEWS.slice(0, 4);

  return (
    <div className="space-y-6">

      {/* ── Tópicos em Alta ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-7 border border-white/5 rounded-3xl shadow-xl">
        <h3 className="font-display text-[10px] font-black text-white/30 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
          <Flame size={16} className="text-primary/60" /> Tópicos em Alta
        </h3>
        <div className="space-y-5">
          {TRENDING.map((t, i) => (
            <motion.button key={t.tag} whileHover={{ x: 4 }} className="w-full flex items-center justify-between text-left group">
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-white/10 font-black w-4">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[14px] font-body font-bold text-white/80 group-hover:text-primary transition-colors duration-300 tracking-tight">{t.tag}</span>
              </div>
              <span className="text-[10px] text-white/20 font-black font-accent bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">{t.posts}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Radar Tech ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden border border-white/5 shadow-2xl rounded-3xl">

      <div className="px-7 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <TrendingUp size={16} className="text-primary/60" />
          <h3 className="font-display text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Radar Tech</h3>
        </div>
        <a href="https://canaltech.com.br" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-white/10 hover:text-primary font-black flex items-center gap-1.5 transition-colors duration-300 uppercase tracking-tighter">
          Canaltech <ExternalLink size={10} />
        </a>
      </div>

      <div className="divide-y divide-white/5">
        <AnimatePresence>
          {visible.map((news, i) => (
            <motion.a
              key={news.id}
              href={news.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              className="block px-7 py-6 group transition-all duration-300">
              <div className="flex gap-5">
                <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 relative shadow-md border border-white/5">
                  <img src={news.image} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition duration-700 group-hover:scale-110" />
                  {news.hot && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-black px-2 py-0.5 rounded-md leading-tight shadow-2xl backdrop-blur-md"
                      style={{ background: "hsl(25 90% 55% / 0.9)", color: "#fff" }}>
                      HOT
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md inline-block uppercase tracking-widest"
                      style={{ background: `${news.categoryColor}08`, color: news.categoryColor, border: `1px solid ${news.categoryColor}15` }}>
                      {news.category}
                    </span>
                  </div>
                  <p className="text-[14px] font-body font-bold text-white/80 leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300 tracking-tight">
                    {news.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5 opacity-20 hover:opacity-40 transition-opacity">
                    <Clock size={10} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{news.time}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-7 py-4 text-[10px] font-black text-white/20 hover:text-primary transition-all duration-300 flex items-center justify-center gap-2 border-t border-white/5 hover:bg-white/[0.02] uppercase tracking-[0.2em]">
        {expanded ? "Ocultar Radar" : "Explorar Radar Completo"}
        <ChevronRight size={13} className={`transition-transform duration-500 ${expanded ? "rotate-90" : ""}`} />
      </button>
    </motion.div>

    </div>
  );
};

export default RightSidebar;
