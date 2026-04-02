# Relatório de auditoria — Segurança + Performance

**Projeto:** pixel-perfect-clone (Vite + React + Supabase)  
**Abordagem:** Zero trust no front-end; foco em impacto e correções práticas.  
**Escopo do código:** apenas o que está no repositório; políticas RLS/Storage do Supabase devem ser validadas no Dashboard do projeto.

---

## 1. Vulnerabilidades críticas

### 1.1 Chave Supabase embutida no cliente (`utils/supabase.ts`)

| Item | Detalhe |
|------|---------|
| **Risco** | URL e chave anon/public no código-fonte. Com o bundle ou o repo, qualquer um obtém o client. A segurança depende inteiramente de **RLS**; se alguma tabela/policy falhar, há leitura/escrita indevida. |
| **Exploração** | Extrair URL + key do bundle → usar `@supabase/supabase-js` contra o projeto e testar `select`/`insert`/`update` nas tabelas expostas. |
| **Impacto** | Vazamento de dados, alteração de registros, abuso de storage, custos. |
| **Correção** | Variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), **rotacionar** a chave após remover do histórico Git, auditoria completa de **RLS** em todas as tabelas usadas pelo app. |

### 1.2 Segredos de API no browser (`VITE_*`)

Chaves expostas no bundle (ex.: Groq, YouTube, Klipy, etc.) — referências em `useModeration.ts`, `AdminPage.tsx`, `GifPicker.tsx`, `utils/ApiPlaylist.ts`, `MessengerWidget.tsx`, `CoursesPage.tsx`, entre outros.

| Item | Detalhe |
| **Risco** | Qualquer visitante pode extrair chaves e abusar de quota/custo ou contornar fluxos pensados só no client. |
| **Exploração** | DevTools → buscar `api.groq.com`, `VITE_`, ou strings de Authorization no JS compilado. |
| **Impacto** | Gasto com APIs, abuso automatizado, moderação só no front sem enforcement real no banco. |
| **Correção** | **Supabase Edge Functions** (ou outro backend) com autenticação, validação de schema, rate limit por `user_id`; chaves só no servidor. |

### 1.3 Controle de admin apenas no front (`ProtectedRoute` + `role`)

| Item | Detalhe |
| **Risco** | Bloquear rota `/admin` no React **não** impede chamadas diretas ao PostgREST/Storage com JWT de usuário comum. |
| **Exploração** | Sessão válida de usuário não-admin → requests diretos às tabelas/RPC administrativas. |
| **Impacto** | Escalação de privilégio se RLS não negar operações sensíveis. |
| **Correção** | RLS baseada em `auth.uid()` e papel (`profiles.role` ou claims); operações admin via RPC `security definer` + checagem explícita ou **service role** só em backend. |

---

## 2. Vulnerabilidades moderadas

| ID | Tema | Descrição | Ação recomendada |
|----|------|-----------|------------------|
| M1 | Sessão JWT (localStorage) | Padrão comum do Supabase JS; XSS pode roubar token. | CSP rigorosa, sanitização de HTML, revisão de qualquer renderização de conteúdo de usuário. |
| M2 | Uploads (Storage) | Uploads partem do client; MIME/extensão vêm do browser. | Policies de Storage (path por `auth.uid()`), limite de tamanho/tipo; opcional validação em Edge Function (magic bytes). |
| M3 | Perfil público `/u/:identifier` | Leitura de `profiles` por id/username. | Colunas mínimas na view pública; RLS para não expor email/dados internos. |
| M4 | Dependências (`npm audit`) | Ex.: cadeia `esbuild`/`vite` com advisory ligado ao **dev server**. | Atualizar toolchain em janela controlada; não expor `vite` na rede em dev sem necessidade. |

---

## 3. Riscos potenciais

- **Realtime / canais** (`MessengerWidget`, notificações, amizades): confirmar **Realtime Authorization** no Supabase para não permitir inscrição em canais alheios.
- **XSS armazenado:** se posts/comentários renderizarem HTML sem sanitizar — revisar componentes de feed/comentário.
- **Integrações terceiras** (ex.: API de vagas): dependência de disponibilidade e privacidade do terceiro.

---

## 4. Melhorias de segurança (checklist)

- [x] Remover credenciais do código; usar `.env` (`.env` no `.gitignore` — já listado).
- [ ] Rotacionar chaves comprometidas publicamente no histórico Git.
- [ ] Revisar **RLS** em: `profiles`, `publications`, `amizades`, `watch`, `lesson_progress`, `aulas`, `courses`, `quizzes`, `chat_*`, etc. *(ver `docs/supabase_rls_templates.sql` como ponto de partida)*
- [ ] Storage: políticas por bucket (`Profile`, `ComunityPost`, `chats`, …).
- [x] Mover chamadas Groq/IA para Edge Functions + rate limit *(função `api-proxy`; secrets `GROQ_API_KEY`, etc.)*.
- [x] Headers no **hosting** de produção: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options` *(parcial: dev/preview via `vite.config.ts`; CSP/HSTS devem ser configurados no provedor de hospedagem em produção)*.
- [ ] Rate limiting na borda (Cloudflare, API Gateway) + por usuário nas funções sensíveis.

---

## 5. Problemas de performance observados

| Área | Problema |
|------|----------|
| Bundle inicial | `App.tsx` importa todas as páginas de forma síncrona — sem code-splitting por rota. |
| `ProfilePage` | Loop sobre cursos com múltiplas queries (`aulas`, `lesson_progress`) — padrão N+1, latência e custo. |
| `MessengerWidget` | Carregamento pesado no mount; poderia ser lazy junto com rotas. |
| Moderação IA | Chamadas Groq no client por post — latência e custo por requisição. |

---

## 6. Otimizações recomendadas

| Prioridade | Ação | Benefício esperado |
|------------|------|---------------------|
| Alta | `React.lazy` + `Suspense` por rota (`AdminPage`, `CoursesPage`, `ProfilePage`, …) | Menor JS inicial, TTI melhor |
| Alta | Agregar progresso do usuário (view materializada ou RPC no Postgres) | Menos round-trips ao Supabase |
| Média | TanStack Query com `staleTime` onde há refetch repetido | Menos requests |
| Média | Analisar bundle (`rollup-plugin-visualizer` ou similar) | Decisões de import (ex.: `recharts`) |
| Baixa | Revisar animações pesadas em listas longas | Menos trabalho na main thread |

**Implementado no repositório:** lazy routes + `Suspense`, `MessengerWidget` lazy, `QueryClient` com `staleTime` / `refetchOnWindowFocus: false`, `ProfilePage` com consultas agregadas (sem N+1 por curso), `npm run build:analyze` + `rollup-plugin-visualizer`, chamadas de IA/moderação/YouTube/Klipy via Edge `api-proxy`.

---

## 7. Ordem sugerida de execução

1. Tirar segredos do código e **rotacionar** chaves Supabase expostas.
2. Auditar e corrigir **RLS + Storage** (incluindo admin).
3. Migrar integrações com segredos (Groq, etc.) para **Edge Functions**.
4. Configurar **headers de segurança** no ambiente de produção.
5. Implementar **lazy loading** de rotas e reduzir N+1 em `ProfilePage`.
6. Manter `npm audit` / Dependabot e atualizar dependências críticas.

---

## Referências de arquivos (auditoria)

- `utils/supabase.ts` — cliente Supabase
- `src/App.tsx` — rotas públicas/privadas
- `src/contexts/ProtectedRoute.tsx` — gate só no front
- `src/hooks/useModeration.ts` — moderação via `api-proxy`
- `src/pages/AdminPage.tsx` — quiz admin via `api-proxy`
- `src/pages/ProfilePage.tsx` — uploads e carga de progresso
- `supabase/functions/api-proxy/index.ts` — proxy Groq / YouTube / Klipy
- `vite.config.ts` — headers dev/preview; script `build:analyze`

---

*Documento gerado para acompanhamento de hardening e melhorias contínuas.*
