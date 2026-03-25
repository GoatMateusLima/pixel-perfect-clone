import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AssessmentPage from "./pages/AssessmentPage";
import ResultPage from "./pages/ResultPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import CoursesPage from "./pages/CoursesPage";
import RoadmapSection from "./pages/RoadmapSection";
import CommunityPage from "./pages/CommunityPage (2)";
import SupportPage from "./pages/SupportPage";
import ProtectedRoute from "./contexts/ProtectedRoute";
import AuthRoute from "./contexts/AuthRoute";
import AdminPage from "./pages/AdminPage";
import MessengerWidget from "@/components/MessengerWidget";
import PublicProfilePage from "./pages/PublicProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <AuthProvider>
          {/* ✅ O MessengerWidget DEVE ficar aqui dentro do AuthProvider, mas fora do <Routes> */}
          <MessengerWidget />
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/cadastro" element={<AuthRoute><SignupPage /></AuthRoute>} />
            <Route path="/avaliacao" element={<AssessmentPage />} />
            <Route path="/resultado" element={<ResultPage />} />
            <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/courses" element={<CoursesPage/>}/>
            <Route path="/roadmap" element={<ProtectedRoute><RoadmapSection /></ProtectedRoute>} />
            <Route path="/comunidade" element={<CommunityPage />} />
            <Route path="/suporte" element={<SupportPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/courses/:courseId" element={<CoursesPage />} />
            <Route path="/u/:identifier" element={<PublicProfilePage />} />
            
            {/* A rota de NotFound (*) deve ser sempre a última */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;