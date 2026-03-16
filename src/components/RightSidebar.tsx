/**
 * RightSidebar.tsx
 *
 * Sidebar direita da CommunityPage — notícias tech do Canaltech.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ExternalLink, Clock, ChevronRight } from "lucide-react";

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

const RightSidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_NEWS : MOCK_NEWS.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
      className="hologram-panel rounded-sm overflow-hidden">

      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" />
          <h3 className="font-display text-sm font-bold text-foreground">Tech & Carreira</h3>
        </div>
        <a href="https://canaltech.com.br" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary font-body flex items-center gap-1 transition">
          Canaltech <ExternalLink size={9} />
        </a>
      </div>

      <div className="divide-y divide-border/20">
        <AnimatePresence>
          {visible.map((news, i) => (
            <motion.a
              key={news.id}
              href={news.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }}
              className="block px-4 py-3 group transition">
              <div className="flex gap-3">
                <div className="w-16 h-[52px] rounded-sm overflow-hidden flex-shrink-0 bg-secondary/40 relative">
                  <img src={news.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                  {news.hot && (
                    <span className="absolute top-0.5 left-0.5 text-[8px] font-accent font-bold px-1 rounded-sm leading-tight"
                      style={{ background: "hsl(25 90% 55%)", color: "#fff" }}>
                      HOT
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-accent font-semibold px-1.5 py-0.5 rounded-sm mb-1.5 inline-block"
                    style={{ background: `${news.categoryColor}18`, color: news.categoryColor, border: `1px solid ${news.categoryColor}30` }}>
                    {news.category}
                  </span>
                  <p className="text-[11px] font-body text-foreground leading-tight line-clamp-2 group-hover:text-primary transition">
                    {news.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={8} className="text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground font-body">{news.time}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1 border-t border-border/30">
        {expanded ? "Ver menos" : "Ver todas as notícias"}
        <ChevronRight size={11} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
    </motion.div>
  );
};

export default RightSidebar;
