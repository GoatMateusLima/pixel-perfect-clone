import { Shield, Brain, Database, Cloud, Cpu, Code2 } from "lucide-react";
import supabase from "../../utils/supabase";

export type MedalStatus = { id: number; ativa: boolean };

export type Certificate = {
  id: string;
  title: string;
  date: string;
  provider: string;
  courseId: string;
};

export const ALL_MEDALS = [
  { id: 1, icon: Code2, title: "Primeira Linha de Código", desc: "Concluiu Fundamentos de Programação", color: "hsl(155 60% 45%)", bg: "hsl(155 60% 45% / 0.12)", border: "hsl(155 60% 45% / 0.35)", glow: "hsl(155 60% 45% / 0.3)", date: "Jan 2025", rarity: "Comum" },
  { id: 2, icon: Brain, title: "Mente Analítica", desc: "Concluiu Python para Data Science", color: "hsl(210 70% 60%)", bg: "hsl(210 70% 60% / 0.12)", border: "hsl(210 70% 60% / 0.35)", glow: "hsl(210 70% 60% / 0.3)", date: "Mar 2025", rarity: "Rara" },
  { id: 3, icon: Shield, title: "Guardião Digital", desc: "Concluiu Introdução a Cibersegurança", color: "hsl(0 70% 60%)", bg: "hsl(0 70% 60% / 0.12)", border: "hsl(0 70% 60% / 0.35)", glow: "hsl(0 70% 60% / 0.3)", date: "Mai 2025", rarity: "Épica" },
  { id: 4, icon: Cloud, title: "Arquiteto de Nuvens", desc: "Concluiu Cloud Computing Basics", color: "hsl(45 90% 55%)", bg: "hsl(45 90% 55% / 0.12)", border: "hsl(45 90% 55% / 0.35)", glow: "hsl(45 90% 55% / 0.3)", date: "Jul 2025", rarity: "Rara" },
  { id: 5, icon: Database, title: "Mestre dos Dados", desc: "Concluiu Fundamentos de SQL", color: "hsl(270 60% 65%)", bg: "hsl(270 60% 65% / 0.12)", border: "hsl(270 60% 65% / 0.35)", glow: "hsl(270 60% 65% / 0.3)", date: "Ago 2025", rarity: "Comum" },
  { id: 6, icon: Cpu, title: "Pioneiro em IA", desc: "Concluiu Fundamentos de Inteligência Artificial", color: "hsl(25 90% 55%)", bg: "hsl(25 90% 55% / 0.12)", border: "hsl(25 90% 55% / 0.35)", glow: "hsl(25 90% 55% / 0.3)", date: "Out 2025", rarity: "Lendária" },
];

export const RARITY_COLOR: Record<string, string> = { 
  Comum: "hsl(215 20% 60%)", 
  Rara: "hsl(210 70% 60%)", 
  Épica: "hsl(270 60% 65%)", 
  Lendária: "hsl(45 90% 55%)" 
};

/**
 * Atribui medalha e certificado ao concluir um curso.
 */
export async function awardCourseCompletion(userId: string, courseId: string, courseName: string) {
  try {
    // 1. Busca perfil atual
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("medalhas, certificados")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const currentMedals: MedalStatus[] = profile?.medalhas || [];
    const currentCertificates: Certificate[] = profile?.certificados || [];

    // 2. Verifica se já tem o certificado deste curso para evitar duplicidade
    if (currentCertificates.some(c => c.courseId === courseId)) {
        console.log(`[Rewards] Curso ${courseName} já certificado.`);
        return;
    }

    let updatedMedals = [...currentMedals];
    let awardedNewMedal = false;

    // 3. Mapeia medalha (baseado na descrição que contém o nome do curso)
    const matchingMedal = ALL_MEDALS.find(m => m.desc.toLowerCase().includes(courseName.toLowerCase()));
    
    if (matchingMedal && !currentMedals.some(m => m.id === matchingMedal.id)) {
      updatedMedals.push({ id: matchingMedal.id, ativa: currentMedals.length < 3 });
      awardedNewMedal = true;
      console.log(`[Rewards] Nova medalha desbloqueada: ${matchingMedal.title}`);
    }

    // 4. Cria novo certificado
    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      title: courseName,
      date: new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
      provider: "UpJobs Academy",
      courseId: courseId
    };

    const updatedCertificates = [...currentCertificates, newCertificate];

    // 5. Atualiza o perfil no Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        medalhas: updatedMedals,
        certificados: updatedCertificates
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    console.log(`[Rewards] Certificado concedido para: ${courseName}`);
    return { awardedNewMedal, certificate: newCertificate };

  } catch (err) {
    console.error("[Rewards] Erro ao atribuir premiação:", err);
    return null;
  }
}
