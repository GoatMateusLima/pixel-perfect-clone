

## Implementacao do Fluxo Completo de Avaliacao UpJobs

### Visao Geral

Construir o fluxo pos-cadastro com formulario multi-step (4 telas), resultado de avaliacao e perfil do usuario, tudo com dados mocados e estetica sci-fi/holografica consistente com o projeto atual.

---

### Tela 1: Redirecionamento pos-cadastro

- Apos cadastro/login, redirecionar para `/avaliacao` (mesma aba)
- Atualizar `AuthContext` para armazenar dados adicionais do usuario (perfil DISC, areas de interesse, dados financeiros)

### Tela 2: Avaliacao Multi-Step (`/avaliacao`)

Formulario em tela cheia com 3 secoes sequenciais e barra de progresso holografica no topo.

**Secao 1 - Calculo Marcius (Valor da Hora)**
- Campos: Salario Bruto, Horas/Semana (dropdown 36h/40h/44h/custom), Tempo de Deslocamento
- Calculos em tempo real: valor hora bruta, valor hora liquida (incluindo deslocamento)
- Dashboard visual com os resultados (hora atual, projecao, custo de oportunidade)
- Dica contextual sobre inclusao do tempo de transporte

**Secao 2 - Selecao de Areas de Interesse**
- Grid de cards holograficos com 10+ profissoes do futuro (Dev, IA, Data Science, UX/UI, Ciberseguranca, Marketing Digital, Blockchain, Cloud, DevOps, Product Management)
- Selecao de ate 5 areas com contador visual "X/5 selecionadas"
- Cards selecionados ganham borda brilhante animada
- Recomendacao automatica baseada no valor da hora e demanda de mercado

**Secao 3 - Teste DISC**
- Questionario com ~12 perguntas (mocadas) aparecendo uma por vez
- Animacoes sci-fi nas transicoes entre perguntas
- Barra de progresso holografica
- Calculo do perfil dominante (D, I, S ou C)

### Tela 3: Resultado da Avaliacao (`/resultado`)

- Roadmap recomendado baseado nas respostas
- Indicador visual "Vale a pena?" (semaforo/score)
- Justificativa com base em custo/beneficio, tempo, ROI, perfil DISC
- Overlay do perfil DISC com as imagens enviadas (Dominancia.webp, Influencia.webp, Estabilidade.webp, Conformidade.webp) como moldura decorativa
- Animacao holografica ao revelar o perfil
- Botao "Criar Meu Perfil"

### Tela 4: Perfil do Usuario (`/perfil`)

- Header com foto (upload simulado), nome, bio, badge/moldura DISC
- Dashboard com:
  - Certificados conquistados (cards mocados)
  - Cursos em andamento (barras de progresso)
  - Roadmap ativo (visualizacao simplificada)
  - Estatisticas (horas estudadas, valor da hora, projecao ROI)
- Tudo com paineis holograficos e animacoes suaves

---

### Detalhes Tecnicos

**Novos arquivos:**
- `src/pages/AssessmentPage.tsx` - pagina multi-step com as 3 secoes
- `src/components/assessment/MarciusCalculator.tsx` - formulario e dashboard do calculo
- `src/components/assessment/AreaSelector.tsx` - grid de selecao de areas
- `src/components/assessment/DiscTest.tsx` - questionario DISC
- `src/components/assessment/ProgressBar.tsx` - barra de progresso holografica
- `src/pages/ResultPage.tsx` - resultado da avaliacao
- `src/pages/ProfilePage.tsx` - perfil do usuario

**Arquivos modificados:**
- `src/App.tsx` - novas rotas (`/avaliacao`, `/resultado`, `/perfil`)
- `src/contexts/AuthContext.tsx` - expandir interface User com campos de avaliacao e perfil DISC
- `src/pages/SignupPage.tsx` - redirecionar para `/avaliacao` apos cadastro
- `src/pages/LoginPage.tsx` - redirecionar para `/perfil` se ja completou avaliacao, senao para `/avaliacao`
- `src/components/Header.tsx` - link para perfil quando logado

**Assets:**
- Copiar as 4 imagens DISC (Dominancia.webp, Influencia.webp, Estabilidade.webp, Conformidade.webp) para `src/assets/disc/`

**Dados mocados:**
- Perguntas DISC hardcoded (~12 perguntas com 4 opcoes cada)
- Lista de profissoes com metadata (demanda, salario medio, tempo de formacao)
- Certificados e cursos de exemplo no perfil
- Toda persistencia via localStorage

**Bibliotecas utilizadas (ja instaladas):**
- `framer-motion` para animacoes e transicoes entre steps
- `recharts` para graficos no dashboard de resultado
- `lucide-react` para icones
- Radix UI components (Progress, Tooltip) para UI

