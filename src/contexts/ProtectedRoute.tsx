import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children, adminOnly = false, requiredType }: { 
  children: ReactNode; 
  adminOnly?: boolean;
  requiredType?: string;
}) {
  const { user, loading, role, type } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-accent text-primary animate-pulse min-w-[100px] text-center">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se for adminOnly e não for admin, bloqueia
  if (adminOnly && role !== "admin") {
    console.warn("[Security] Unauthorized access attempt to admin route by user:", user.id);
    return <Navigate to="/" replace />;
  }

  // Se exigir um type específico (ex: 'batata') e não bater, bloqueia
  if (requiredType && type !== requiredType) {
    console.warn(`[Security] User ${user.id} lacks required type '${requiredType}'. current: '${type}'`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}