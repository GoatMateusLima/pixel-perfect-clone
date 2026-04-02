import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import logoUrl from "@/assets/logo/logo.png";

const fadeContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.4, 0, 0.2, 1] as const,
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

const fadeItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

function InitialLoadingScreen() {
  return (
    <motion.div
      key="initial-loader"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Vinhetas suaves nas cores do logo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 35%, rgba(94, 234, 212, 0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(45, 122, 95, 0.12) 0%, transparent 50%)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6"
        variants={fadeContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeItem}>
          <img
            src={logoUrl}
            alt="UpJobs"
            className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] object-contain drop-shadow-[0_8px_32px_rgba(45,122,95,0.35)]"
            draggable={false}
          />
        </motion.div>

        <motion.div variants={fadeItem} className="flex flex-col items-center">
          <motion.p
            className="font-display text-2xl sm:text-3xl font-bold tracking-[0.28em] text-white text-center"
            animate={{
              opacity: [0.45, 1, 0.45],
              textShadow: [
                "0 0 12px rgba(94, 234, 212, 0.15)",
                "0 0 24px rgba(94, 234, 212, 0.35)",
                "0 0 12px rgba(94, 234, 212, 0.15)",
              ],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            UPJOBS
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeItem}
          className="flex flex-col items-center gap-3"
          aria-hidden
        >
          <motion.div
            className="rounded-full shadow-lg"
            style={{
              width: 14,
              height: 14,
              background: "linear-gradient(145deg, #2D7A5F 0%, #5EEAD4 100%)",
              boxShadow: "0 0 20px rgba(94, 234, 212, 0.45), 0 4px 12px rgba(45, 122, 95, 0.4)",
            }}
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.12, 1],
              rotate: [0, 360],
            }}
            transition={{
              y: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 1.25, repeat: Infinity, ease: "linear" },
            }}
          />
          <span className="sr-only">Carregando</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Bloqueia rotas até o bootstrap da auth terminar (sessão + perfil no Supabase).
 */
export default function AppBootstrapShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <InitialLoadingScreen key="loader" />
      ) : (
        <motion.div key="app-content" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
