import Header from "@/components/Header";
import { MainLandmark } from "@/components/MainLandmark";
import HeroSection from "@/components/HeroSection";
import PainCardsSection from "@/components/PainCardsSection";
import RoadmapSection from "@/components/RoadmapSection";

import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainLandmark>
        <HeroSection />
        <PainCardsSection />
        <RoadmapSection />
        <TestimonialsSection />
        <FAQSection />
        <Footer />
      </MainLandmark>
    </div>
  );
};

export default Index;
