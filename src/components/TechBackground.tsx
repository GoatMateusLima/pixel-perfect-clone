import { motion } from "framer-motion";

const TechBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
      {/* Grade Digital Estática com tom verde */}
      <div className="absolute inset-0 digital-grid opacity-[0.15]" />

      {/* Brilhos Radiais de Fundo (Aura Verde) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[120px]" />

      {/* Linha de Scanner Animada */}
      <div className="scanline-active opacity-20" />

      {/* Partículas flutuantes sutis (Dobro da densidade) */}
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            opacity: 0,
            scale: 0.5 
          }}
          animate={{ 
            y: ["0%", "100%"],
            opacity: [0, 0.3, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: Math.random() * 25 + 20, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10 
          }}
          className="absolute w-1 h-1 rounded-full bg-primary/30 blur-[1px]"
        />
      ))}

      {/* Vinheta Verde Premium */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-primary/[0.02] to-black/60" />
    </div>
  );
};

export default TechBackground;
