import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, MapPin, ChevronRight } from "lucide-react";

interface Job {
    title: string;
    company: string;     // ← Mudado de company_name
    salary?: string;
    type?: string;
    url: string;         // ← Agora usamos 'url' (padrão da nova API)
}

interface VagasProps {
    ringColor: string;
    discProfile: string;
    recommendedJobs: Job[];
}

export default function Vagas({ ringColor, discProfile, recommendedJobs }: VagasProps) {

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="hologram-panel rounded-sm overflow-hidden"
        >
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">Vagas para você</h3>
                <span 
                    className="ml-auto text-[9px] font-accent px-1.5 py-0.5 rounded-sm"
                    style={{ 
                        background: `${ringColor}18`, 
                        color: ringColor, 
                        border: `1px solid ${ringColor}30` 
                    }}
                >
                    Perfil {discProfile}
                </span>
            </div>

            <div className="divide-y divide-border/20">
                {recommendedJobs.length > 0 ? (
                    recommendedJobs.map((job, i) => (
                        <motion.a
                            key={i}
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.07 }}
                            whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }}
                            className="px-4 py-4 cursor-pointer transition group block hover:bg-secondary/50"
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-[13px] font-accent font-semibold text-foreground group-hover:text-primary transition leading-tight">
                                    {job.title}
                                </p>
                                <ArrowUpRight 
                                    size={14} 
                                    className="text-muted-foreground/60 group-hover:text-primary transition flex-shrink-0 mt-0.5" 
                                />
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="font-medium">{job.company}</span>
                                
                                {job.type && (
                                    <span className="flex items-center gap-1">
                                        <MapPin size={11} />
                                        {job.type}
                                    </span>
                                )}
                                
                                {job.salary && job.salary !== "A combinar" && (
                                    <span className="font-mono text-emerald-400">{job.salary}</span>
                                )}
                            </div>
                        </motion.a>
                    ))
                ) : (
                    <div className="px-4 py-10 text-center">
                        <p className="text-[10px] text-muted-foreground font-accent">
                            Nenhuma vaga encontrada para seu perfil no momento.
                        </p>
                    </div>
                )}
            </div>

            <div className="px-4 py-3 border-t border-border/30">
                <button className="w-full text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1">
                    Ver todas as vagas <ChevronRight size={12} />
                </button>
            </div>
        </motion.div>
    );
}