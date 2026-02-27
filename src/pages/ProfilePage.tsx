import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  User, Award, BookOpen, TrendingUp, Clock, ArrowLeft, LogOut, Camera,
} from "lucide-react";
import dominanciaImg from "@/assets/disc/Dominancia.webp";
import influenciaImg from "@/assets/disc/Influencia.webp";
import estabilidadeImg from "@/assets/disc/Estabilidade.webp";
import conformidadeImg from "@/assets/disc/Conformidade.webp";

const DISC_IMGS: Record<string, string> = {
  D: dominanciaImg, I: influenciaImg, S: estabilidadeImg, C: conformidadeImg,
};
const DISC_LABELS: Record<string, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};
const DISC_COLORS: Record<string, string> = {
  D: "hsl(0 70% 55%)", I: "hsl(45 90% 55%)", S: "hsl(155 60% 45%)", C: "hsl(210 70% 55%)",
};

const MOCK_CERTIFICATES = [
  { title: "Fundamentos de IA", date: "2025-01", provider: "UpJobs Academy" },
  { title: "Python para Data Science", date: "2025-03", provider: "UpJobs Academy" },
];

const MOCK_COURSES = [
  { title: "Machine Learning Avançado", progress: 65 },
  { title: "Cloud Computing AWS", progress: 30 },
  { title: "Cibersegurança Ofensiva", progress: 10 },
];

const STORAGE_KEY = "upjobs_profile_photo";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoSrc, setPhotoSrc] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? null;
  });
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const a = user.assessment;
  const discProfile = a?.discProfile;
  const ringColor = discProfile ? DISC_COLORS[discProfile] : "hsl(155 60% 35%)";

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoSrc(result);
      localStorage.setItem(STORAGE_KEY, result);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected later
    e.target.value = "";
  };

  return (
    <div className="min-h-screen gradient-hero scanline px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-body">
            <ArrowLeft size={14} /> Início
          </Link>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive font-accent"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hologram-panel rounded-sm p-6 flex flex-col sm:flex-row items-center gap-6"
        >
          {/* Avatar area — outer ring + badge outside the photo circle */}
          <div className="relative flex-shrink-0">

            {/* Outer decorative ring (DISC color) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `2.5px solid ${ringColor}`,
                boxShadow: `0 0 18px ${ringColor}40, inset 0 0 6px ${ringColor}15`,
                borderRadius: "50%",
                // Slightly larger than the avatar so it sits outside
                top: "-5px",
                left: "-5px",
                right: "-5px",
                bottom: "-5px",
                width: "calc(100% + 10px)",
                height: "calc(100% + 10px)",
              }}
            />

            {/* Avatar circle — clickable for upload */}
            <button
              type="button"
              onClick={handlePhotoClick}
              onMouseEnter={() => setIsHoveringPhoto(true)}
              onMouseLeave={() => setIsHoveringPhoto(false)}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center focus:outline-none"
              title="Alterar foto de perfil"
              style={{ display: "block" }}
            >
              {/* User photo or DISC image or fallback icon */}
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : discProfile ? (
                <img
                  src={DISC_IMGS[discProfile]}
                  alt="DISC"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-muted-foreground" />
              )}

              {/* Camera overlay on hover */}
              <motion.div
                initial={false}
                animate={{ opacity: isHoveringPhoto ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full"
                style={{ background: "rgba(0,0,0,0.52)" }}
                aria-hidden="true"
              >
                <Camera size={18} className="text-white" />
                <span className="text-[9px] text-white font-accent leading-none">Alterar</span>
              </motion.div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* DISC badge — anchored OUTSIDE the ring, bottom-right */}
            {discProfile && (
              <span
                className="absolute text-[10px] font-accent font-bold px-2 py-0.5 rounded-full text-primary-foreground whitespace-nowrap"
                style={{
                  backgroundColor: DISC_COLORS[discProfile],
                  bottom: "-18px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                }}
              >
                {DISC_LABELS[discProfile]}
              </span>
              
            )}
            
          </div>

          {/* Name / email — extra top margin to clear the badge */}
          <div className={`text-center sm:text-left ${discProfile ? "mt-4 sm:mt-0" : ""}`}>
            <h1 className="font-display text-xl font-bold text-foreground">{user.name}</h1>
            <p className="text-sm text-muted-foreground font-body">{user.email}</p>
            {!a?.completed && (
              <Link to="/avaliacao" className="inline-block mt-2 text-xs text-accent hover:underline font-accent">
                Completar Avaliação →
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        {a?.completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { icon: Clock, label: "Horas Estudadas", value: "42h", color: "text-primary" },
              { icon: TrendingUp, label: "Valor/Hora", value: a.valorHoraLiquida ? `R$ ${a.valorHoraLiquida.toFixed(2)}` : "—", color: "text-accent" },
              { icon: Award, label: "Certificados", value: String(MOCK_CERTIFICATES.length), color: "text-primary" },
              { icon: BookOpen, label: "Cursos Ativos", value: String(MOCK_COURSES.length), color: "text-accent" },
            ].map((stat, i) => (
              <div key={i} className="hologram-panel rounded-sm p-4 text-center">
                <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
                <p className={`font-display font-bold text-lg ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-accent">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Courses in progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hologram-panel rounded-sm p-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-accent" />
            Cursos em Andamento
          </h2>
          <div className="space-y-4">
            {MOCK_COURSES.map((course, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-body text-foreground">{course.title}</p>
                  <span className="text-xs text-muted-foreground font-accent">{course.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, hsl(155 60% 35%), hsl(155 60% 50%))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Certificates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hologram-panel rounded-sm p-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary" />
            Certificados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_CERTIFICATES.map((cert, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="border border-primary/20 rounded-sm p-4 bg-card"
              >
                <p className="font-accent font-semibold text-sm text-foreground">{cert.title}</p>
                <p className="text-xs text-muted-foreground">{cert.provider} · {cert.date}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
