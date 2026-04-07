import { groqChatCompletion } from "@/lib/apiProxy";

export async function getRecommendedTemasIA(
  userInterests: string[],
  temas: { id: string; name: string; description: string; type: string }[]
): Promise<string[]> {
  const temasSimplify = temas.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    type: t.type,
  }));

  const prompt = `
O usuário possui as seguintes áreas de interesse: ${userInterests.join(", ")}.

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
    const content =
      (await groqChatCompletion({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1024,
      })) ?? "";

    let trimmed = content.trim();
    if (!trimmed) return [];
    
    // Tenta extrair array caso venha sujo
    const match = trimmed.match(/\[.*\]/s);
    if (match) trimmed = match[0];

    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("[APIrecomendacao] Erro ao chamar proxy (parse ou request):", error);
    return [];
  }
}
