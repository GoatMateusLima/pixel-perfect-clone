import axios from 'axios';

export const fetchVagasByInterest = async (term: string): Promise<any[]> => {
  if (!term || term.trim() === '') {
    return [];
  }

  const searchTerm = term.trim().split(' ')[0].toLowerCase();

  try {
    const url = `https://apibr.com/vagas/api/v2/jobs?search=${encodeURIComponent(searchTerm)}&limit=6`;

    const response = await axios.get(url);
    
    // A API BR retorna um ARRAY direto (não tem .data.data)
    const jobs = Array.isArray(response.data) ? response.data : [];

    return jobs.map((j: any) => ({
      title: j.title || "Vaga sem título",
      
      // Pega o nome da empresa (melhor forma possível nessa API)
      company: j.repository?.organization?.login ||
               j.repository?.name?.replace('-vagas', '') ||
               "Comunidade / Empresa não informada",

      salary: "A combinar",   // essa API quase nunca traz salário

      // Detecta Remoto / Híbrido
      type: j.keywords?.includes("Remoto") || 
            j.labels?.some((l: any) => l.name.toLowerCase() === "remoto") 
            ? "Remoto" 
            : j.labels?.some((l: any) => l.name.toLowerCase() === "híbrido") 
              ? "Híbrido" 
              : "Presencial / Não informado",

      url: j.url || "#",     // link direto para a vaga no GitHub
    }));

  } catch (error: any) {
    console.error("Erro ao buscar vagas na API BR:", error.response?.status || error.message);
    
    // Fallback (mostra algo enquanto testa)
    return [
      {
        title: `Desenvolvedor ${searchTerm.toUpperCase()} (vaga recente)`,
        company: "Nubank / iFood / Comunidade",
        salary: "A combinar",
        type: "Remoto",
        url: "https://github.com/frontendbr/vagas"
      },
      {
        title: `Pleno/Sênior ${searchTerm}`,
        company: "Startup Brasileira",
        salary: "A combinar",
        type: "Híbrido",
        url: "https://github.com/backend-br/vagas"
      }
    ];
  }
};