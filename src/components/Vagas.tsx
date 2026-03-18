import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, MapPin, ChevronRight } from "lucide-react";

interface Job {
  title: string;
  company: string;
  salary: string;
  type: string;
}

interface VagasProps {
  ringColor: string;
  discProfile: string;
  recommendedJobs: Job[];
}

export default function Vagas({ ringColor, discProfile, recommendedJobs }: VagasProps) {

    return (

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="hologram-panel rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-foreground">Vagas para você</h3>
                <span className="ml-auto text-[9px] font-accent px-1.5 py-0.5 rounded-sm"
                    style={{ background: `${ringColor}18`, color: ringColor, border: `1px solid ${ringColor}30` }}>
                    Perfil {discProfile}
                </span>
            </div>
            <div className="divide-y divide-border/20">
                {recommendedJobs.map((job, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        whileHover={{ backgroundColor: "hsl(200 25% 14% / 0.8)" }}
                        className="px-4 py-3 cursor-pointer transition group">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-[12px] font-accent font-semibold text-foreground group-hover:text-primary transition leading-tight">{job.title}</p>
                            <ArrowUpRight size={11} className="text-muted-foreground/40 group-hover:text-primary transition flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-body">{job.company}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-accent font-semibold text-primary">{job.salary}</span>
                            <span className="text-[9px] font-accent text-muted-foreground flex items-center gap-0.5">
                                <MapPin size={8} /> {job.type}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border/30">
                <button className="w-full text-[11px] font-accent font-semibold text-muted-foreground hover:text-primary transition flex items-center justify-center gap-1">
                    Ver todas as vagas <ChevronRight size={11} />
                </button>
            </div>
        </motion.div>
    )


};