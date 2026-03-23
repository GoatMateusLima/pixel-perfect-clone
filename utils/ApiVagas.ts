import axios from 'axios';

// Adicionamos 'export const' para que o ProfilePage consiga enxergar
export const fetchVagasByInterest = async (term: string) => {
  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      // O termo será o nome do curso vindo da View do Supabase
      query: `${term} vagas Brasil`,
      page: '1',
      num_pages: '1',
      date_posted: 'all'
    },
    headers: {
      'x-rapidapi-key': 'e349460dafmsh467852cc8a6bac8p168b06jsn73fe1dd00105',
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios.request(options);
    // Retornamos os dados para quem chamou a função
    return response.data.data;
  } catch (error) {
    console.error("Erro na API JSearch:", error);
    return []; // Retorna array vazio em caso de erro para não quebrar o site
  }
};