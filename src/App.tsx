import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { SkipToMainLink } from "@/components/SkipToMainLink";
import ProtectedRoute from "./contexts/ProtectedRoute";
import AuthRoute from "./contexts/AuthRoute";
import AppBootstrapShell from "@/components/AppBootstrapShell";

const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const RoadmapSection = lazy(() => import("./pages/RoadmapSection"));
const CommunityPage = lazy(() => import("./pages/CommunityPage (2)"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const MessengerWidget = lazy(() => import("@/components/MessengerWidget"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const routeFallback = (
  <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground font-body">
    Carregando…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <AccessibilityProvider>
          <SkipToMainLink />
          <AuthProvider>
            <AppBootstrapShell>
              <Suspense fallback={routeFallback}>
                <MessengerWidget />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
                  <Route path="/cadastro" element={<AuthRoute><SignupPage /></AuthRoute>} />
                  <Route path="/avaliacao" element={<AssessmentPage />} />
                  <Route path="/resultado" element={<ResultPage />} />
                  <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                  <Route path="/roadmap" element={<ProtectedRoute><RoadmapSection /></ProtectedRoute>} />
                  <Route path="/comunidade" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
                  <Route path="/suporte" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredType="batata"><AdminPage /></ProtectedRoute>} />
                  <Route path="/courses/:courseId" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                  <Route path="/u/:identifier" element={<PublicProfilePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppBootstrapShell>
          </AuthProvider>
        </AccessibilityProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
