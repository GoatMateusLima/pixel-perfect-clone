import { motion } from "framer-motion";

export default function Progress() {

    return (
        <div className="space-y-3">
            {[
                { label: "Trilhas concluídas", value: 4, total: 12, color: "hsl(155 60% 45%)" },
                { label: "Aulas assistidas", value: 38, total: 80, color: "hsl(25 90% 55%)" },
                { label: "Exercícios feitos", value: 62, total: 100, color: "hsl(210 70% 55%)" },
                { label: "Dias de estudo", value: 42, total: 90, color: "hsl(45 90% 55%)" },
            ].map(({ label, value, total, color }) => (
                <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-accent text-muted-foreground">{label}</span>
                        <span className="text-[10px] font-accent font-semibold" style={{ color }}>{value}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / total) * 100}%` }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="h-full rounded-full" style={{ background: color }} />
                    </div>
                </div>
            ))}
        </div>
    )


};

