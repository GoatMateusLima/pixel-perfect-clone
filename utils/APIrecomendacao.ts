export async function getRecommendedTemasIA(
  userInterests: string[],
  temas: { id: string; name: string; description: string; type: string }[]
): Promise<string[]> {
  const GROQ_API_KEY = ""; // Adicione sua chave da API aqui

  // Simplificamos os objetos para não passar dados excessivos (como listas de cursos)
  const temasSimplify = temas.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    type: t.type
  }));

  const prompt = `
O usuário possui as seguintes áreas de interesse: ${userInterests.join(', ')}.

Abaixo está a lista de temas/trilhas de cursos disponíveis (em formato JSON):
${JSON.stringify(temasSimplify)}

Sua tarefa é analisar os interesses do usuário e os temas disponíveis e escolher os melhores.
Retorne os 5 IDs (campo "id") dos temas mais recomendados para esse usuário, ordenados do mais relevante para o menos relevante.

REGRAS ESTABELECIDAS:
1. Sua resposta deve ser ESTRITAMENTE um array JSON contendo APENAS string de IDs.
2. Não escreva texto adicional, nada de markdown em volta, não cumprimente, sem explicações.
3. Exemplo absoluto do formato de saída EXATO esperado:
["id-1", "id-2", "id-3"]
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // reduzido para garantir resposta determinística sem fugir do JSON
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[APIrecomendacao] Falha na resposta da API:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Tratamento básico para remover blocos de código markdown que o Llama adora colocar
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (content.startsWith("```")) {
      content = content.replace(/```/g, "").trim();
    }

    // Tentativa de parse
    const match = content.match(/\[.*\]/s);
    if (match) {
      content = match[0];
    }

    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      console.log("[APIrecomendacao] IDs recomendados IA:", parsed);
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("[APIrecomendacao] Erro ao chamar Groq (parse ou request):", error);
    return [];
  }
}
