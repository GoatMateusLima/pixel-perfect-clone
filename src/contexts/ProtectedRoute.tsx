import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, role } = useAuth();

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

  if (adminOnly && role !== "admin") {
    console.warn("[Security] Unauthorized access attempt to admin route by user:", user.id);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}